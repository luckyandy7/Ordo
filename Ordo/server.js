const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const http = require("http");
const socketIo = require("socket.io");
const multer = require("multer");
const Grid = require("gridfs-stream");
const axios = require("axios");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const session = require("express-session");

const app = express();
const server = http.createServer(app);
const prot = 5001;
const authRouter = require("./routes/auth");
const collaborationRouter = require("./routes/collaboration");
let db;

//서버에서는 dotenv를 통해 불러옴
require("dotenv").config();

const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// MongoDB 연결 설정
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/ordo";

// MongoDB 연결 옵션
const mongooseOptions = {
  serverSelectionTimeoutMS: 10000, // 10초로 단축
  socketTimeoutMS: 30000,
  maxPoolSize: 5, // 연결 풀 크기 줄임
  retryWrites: true,
  w: "majority",
  connectTimeoutMS: 10000,
  heartbeatFrequencyMS: 10000,
  maxIdleTimeMS: 30000,
  bufferCommands: true, // 기본값으로 복원
};

console.log(
  "[서버 로그] MongoDB URI:",
  MONGODB_URI.replace(/\/\/.*:.*@/, "//***:***@")
); // 비밀번호 숨김

// 기본 미들웨어
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 정적 파일 제공 설정
app.use(express.static(path.join(__dirname)));
app.use("/public", express.static(path.join(__dirname, "Main/public")));
app.use("/Login", express.static(path.join(__dirname, "Login")));
app.use("/Main", express.static(path.join(__dirname, "Main")));
app.use("/Chat", express.static(path.join(__dirname, "Chat")));
app.use("/font", express.static(path.join(__dirname, "font")));
app.use("/css", express.static(path.join(__dirname, "css")));
app.use("/js", express.static(path.join(__dirname, "js")));
app.use("/images", express.static(path.join(__dirname, "images")));
app.use("/board", express.static(path.join(__dirname, "Board")));
app.use(
  "/Collaboration",
  express.static(path.join(__dirname, "Collaboration"))
);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/auth", authRouter);
app.use("/api/collaboration", collaborationRouter);

// 사용자 정보 API
app.get("/api/user", (req, res) => {
  try {
    // 세션이 설정되어 있지 않은 경우 테스트 사용자 정보 반환
    if (!req.session || !req.session.userId) {
      console.log("세션 정보가 없어 테스트 사용자 정보를 반환합니다.");
      const testUserInfo = {
        id: "test_user_id",
        name: "테스트 사용자",
        email: "test@example.com",
      };
      return res.json(testUserInfo);
    }

    const userInfo = {
      id: req.session.userId,
      name: req.session.username || req.session.name || "사용자",
      email: req.session.email || "",
    };

    res.json(userInfo);
  } catch (error) {
    console.error("사용자 정보 조회 오류:", error);
    res.status(500).json({ error: "서버 오류가 발생했습니다." });
  }
});

// Horae 백엔드 설정
const HORAE_API_URL = process.env.HORAE_API_URL || "http://localhost:3000";

// MongoDB 연결 함수
async function connectToMongoDB(retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`[서버 로그] MongoDB 연결 시도 중... (${i + 1}/${retries})`);
      await mongoose.connect(MONGODB_URI, mongooseOptions);
      console.log("[서버 로그] MongoDB Atlas 연결 성공");
      console.log("[서버 로그] 연결된 데이터베이스:", mongoose.connection.name);
      return true;
    } catch (error) {
      console.error(
        `[서버 로그] MongoDB 연결 실패 (${i + 1}/${retries}):`,
        error.message
      );

      if (i === retries - 1) {
        console.error("[서버 로그] 모든 재시도 실패. 전체 에러:", error);
        return false;
      }

      // 재시도 전 대기
      console.log(`[서버 로그] ${2000 * (i + 1)}ms 후 재시도...`);
      await new Promise((resolve) => setTimeout(resolve, 2000 * (i + 1)));
    }
  }
  return false;
}

// MongoDB 연결 이벤트 리스너
mongoose.connection.on("connected", () => {
  console.log("[서버 로그] Mongoose가 MongoDB에 연결되었습니다");
});

mongoose.connection.on("error", (err) => {
  console.error("[서버 로그] Mongoose 연결 에러:", err.message);
  // 심각한 에러가 아닌 경우 자동 재연결 시도
  if (err.name !== "MongoNetworkError") {
    console.log("[서버 로그] 자동 재연결 시도 중...");
  }
});

mongoose.connection.on("disconnected", () => {
  console.log("[서버 로그] Mongoose가 MongoDB에서 연결 해제되었습니다");
  console.log("[서버 로그] 자동 재연결 대기 중...");
});

mongoose.connection.on("reconnected", () => {
  console.log("[서버 로그] MongoDB 재연결 성공");
});

// User 모델 import
const User = require("./models/User");

// Post와 Comment 모델 import 추가
const Post = require("./models/Post");
const Comment = require("./models/Comment");

// Event와 Todo 모델 import 추가
const Event = require("./models/Event");
const Todo = require("./models/Todo");

// 채팅방 스키마 정의
const chatRoomSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ["direct", "group"], default: "group" },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  createdAt: { type: Date, default: Date.now },
  lastMessage: {
    content: String,
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    timestamp: { type: Date, default: Date.now },
  },
});

// 채팅 메시지 스키마 정의
const messageSchema = new mongoose.Schema({
  chatRoom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ChatRoom",
    required: true,
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: function () {
      return this.type !== "system";
    },
  },
  content: { type: String, required: true },
  type: {
    type: String,
    enum: ["text", "image", "file", "system"],
    default: "text",
  },
  // 파일 관련 필드 추가
  file: {
    fileId: { type: mongoose.Schema.Types.ObjectId }, // GridFS 파일 ID
    filename: { type: String }, // 원본 파일명
    originalName: { type: String }, // 사용자가 업로드한 원본 파일명
    mimetype: { type: String }, // 파일 MIME 타입
    size: { type: Number }, // 파일 크기 (bytes)
  },
  timestamp: { type: Date, default: Date.now },
  readBy: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      readAt: { type: Date, default: Date.now },
    },
  ],
});

// 채팅방 초대 스키마 정의
const invitationSchema = new mongoose.Schema({
  chatRoom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ChatRoom",
    required: true,
  },
  inviter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  invitee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "accepted", "declined"],
    default: "pending",
  },
  message: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
  respondedAt: { type: Date },
});

const ChatRoom = mongoose.model("ChatRoom", chatRoomSchema);
const Message = mongoose.model("Message", messageSchema);
const Invitation = mongoose.model("Invitation", invitationSchema);

// GridFS 설정
let gfs, gridfsBucket;

mongoose.connection.once("open", () => {
  // GridFS 스트림 초기화
  gridfsBucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
    bucketName: "uploads",
  });

  gfs = Grid(mongoose.connection.db, mongoose.mongo);
  gfs.collection("uploads");

  console.log("[서버 로그] GridFS 초기화 완료");
});

// Multer 설정 - 메모리 저장소 사용
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB 제한
  },
  fileFilter: (req, file, cb) => {
    // 허용할 파일 타입 설정
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/plain",
      "application/zip",
      "application/x-zip-compressed",
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("지원하지 않는 파일 형식입니다."), false);
    }
  },
});

// JWT 인증 미들웨어
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  console.log("[인증] 요청 URL:", req.url);
  console.log("[인증] Authorization 헤더:", authHeader ? "있음" : "없음");
  console.log("[인증] 토큰:", token ? "있음" : "없음");

  if (!token) {
    console.log("[인증] 토큰 없음 - 401 응답");
    return res.status(401).json({
      status: "error",
      message: "액세스 토큰이 필요합니다.",
    });
  }

  jwt.verify(
    token,
    process.env.JWT_SECRET || "your_jwt_secret_key",
    (err, user) => {
      if (err) {
        console.log("[인증] JWT 검증 실패:", err.message);
        return res.status(403).json({
          status: "error",
          message: "유효하지 않은 토큰입니다.",
        });
      }
      console.log("[인증] JWT 검증 성공, 사용자 ID:", user.userId);
      req.user = user;
      req.userId = user.userId; // 프로필 API를 위해 추가
      next();
    }
  );
};

// Socket.IO 연결 관리
const connectedUsers = new Map(); // userId -> socketId 매핑

io.on("connection", (socket) => {
  console.log("[Socket.IO] 사용자 연결:", socket.id);

  // 사용자 인증 및 등록
  socket.on("authenticate", (token) => {
    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || "your_jwt_secret_key"
      );
      socket.userId = decoded.userId;
      connectedUsers.set(decoded.userId, socket.id);
      console.log("[Socket.IO] 사용자 인증 성공:", decoded.userId);

      // 사용자의 채팅방들에 조인
      socket.emit("authenticated", { success: true });
    } catch (error) {
      console.error("[Socket.IO] 인증 실패:", error);
      socket.emit("authentication_error", { message: "인증에 실패했습니다." });
    }
  });

  // 채팅방 참가
  socket.on("join_room", (roomId) => {
    socket.join(roomId);
    console.log("[Socket.IO] 채팅방 참가:", socket.userId, "->", roomId);
  });

  // 메시지 전송
  socket.on("send_message", async (data) => {
    try {
      const { chatRoomId, content, type = "text", file } = data;

      if (!socket.userId) {
        socket.emit("error", { message: "인증이 필요합니다." });
        return;
      }

      // 메시지 객체 생성
      const messageData = {
        chatRoom: chatRoomId,
        sender: socket.userId,
        content,
        type,
      };

      // 파일 메시지인 경우 파일 정보 추가
      if (type === "file" && file) {
        messageData.file = {
          fileId: file.fileId,
          filename: file.filename,
          originalName: file.originalName,
          mimetype: file.mimetype,
          size: file.size,
        };
      }

      // 메시지 저장
      const message = new Message(messageData);
      await message.save();

      // 메시지를 채팅방의 모든 참가자에게 전송
      const populatedMessage = await Message.findById(message._id)
        .populate("sender", "name email avatar")
        .exec();

      const messageToSend = {
        _id: populatedMessage._id,
        content: populatedMessage.content,
        type: populatedMessage.type,
        timestamp: populatedMessage.timestamp,
        sender: {
          _id: populatedMessage.sender._id,
          name: populatedMessage.sender.name,
          avatar: populatedMessage.sender.avatar,
        },
      };

      // 파일 정보가 있으면 추가
      if (populatedMessage.file && populatedMessage.file.fileId) {
        messageToSend.file = populatedMessage.file;
      }

      io.to(chatRoomId).emit("new_message", messageToSend);

      // 채팅방의 마지막 메시지 업데이트
      const lastMessageContent =
        type === "file" ? `📎 ${file?.originalName || "파일"}` : content;
      await ChatRoom.findByIdAndUpdate(chatRoomId, {
        lastMessage: {
          content: lastMessageContent,
          sender: socket.userId,
          timestamp: new Date(),
        },
      });

      console.log(
        "[Socket.IO] 메시지 전송 완료:",
        type === "file" ? `파일: ${file?.originalName}` : content
      );
    } catch (error) {
      console.error("[Socket.IO] 메시지 전송 실패:", error);
      socket.emit("error", { message: "메시지 전송에 실패했습니다." });
    }
  });

  // 타이핑 상태
  socket.on("typing_start", (data) => {
    socket.to(data.chatRoomId).emit("user_typing", {
      userId: socket.userId,
      isTyping: true,
    });
  });

  socket.on("typing_stop", (data) => {
    socket.to(data.chatRoomId).emit("user_typing", {
      userId: socket.userId,
      isTyping: false,
    });
  });

  // 연결 해제
  socket.on("disconnect", () => {
    if (socket.userId) {
      connectedUsers.delete(socket.userId);
      console.log("[Socket.IO] 사용자 연결 해제:", socket.userId);
    }
  });
});

// 라우터 가져오기
const eventRoutes = require("./routes/eventRoutes");

// API 라우트
const apiRoutes = express.Router();

apiRoutes.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    console.log("[서버 로그] 회원가입 요청:", { name, email });

    // 이메일 중복 확인
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        status: "error",
        message: "이미 사용 중인 이메일입니다.",
      });
    }

    // 새 사용자 생성
    const user = new User({ name, email, password });
    await user.save();

    // JWT 토큰 생성
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || "your_jwt_secret_key",
      { expiresIn: "1d" }
    );

    // JSON 응답 전송
    res.status(201).json({
      status: "success",
      message: "회원가입이 완료되었습니다.",
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
        },
      },
    });

    console.log("[서버 로그] 새 사용자 등록 성공:", email);
  } catch (error) {
    console.error("[서버 로그] 회원가입 에러:", error);
    res.status(500).json({
      status: "error",
      message: "서버 오류가 발생했습니다.",
    });
  }
});

apiRoutes.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        status: "error",
        message: "이메일 또는 비밀번호가 잘못되었습니다.",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        status: "error",
        message: "이메일 또는 비밀번호가 잘못되었습니다.",
      });
    }

    const token = jwt.sign({ userId: user._id }, "ordo-secret-key-2025", {
      expiresIn: "1d",
    });

    console.log("[로그인 API] 토큰 생성 성공:", {
      userId: user._id,
      secret: "ordo-secret-key-2025",
      tokenLength: token.length,
      tokenPreview: token.substring(0, 50) + "...",
    });

    res.json({
      status: "success",
      message: "로그인이 완료되었습니다.",
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
        },
      },
    });
  } catch (error) {
    console.error("[서버 로그] 로그인 에러:", error);
    res.status(500).json({
      status: "error",
      message: "서버 오류가 발생했습니다.",
    });
  }
});

// 프로필 조회 API
apiRoutes.get("/profile", authenticateToken, async (req, res) => {
  try {
    console.log("[프로필 API] 프로필 조회 요청 - 사용자 ID:", req.userId);

    const user = await User.findById(req.userId).select(
      "-password -passwordResetToken -passwordResetExpires"
    );

    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "사용자를 찾을 수 없습니다.",
      });
    }

    console.log("[프로필 API] 프로필 조회 성공:", user.email);
    res.json({
      status: "success",
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone || "",
          birth: user.birth || "",
          avatar: user.avatar || null,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      },
    });
  } catch (error) {
    console.error("[프로필 API] 프로필 조회 오류:", error);
    res.status(500).json({
      status: "error",
      message: "프로필 조회 중 오류가 발생했습니다.",
    });
  }
});

// 프로필 업데이트 API
apiRoutes.put("/profile", authenticateToken, async (req, res) => {
  try {
    const { name, phone, birth, currentPassword, newPassword } = req.body;
    console.log("[프로필 API] 프로필 업데이트 요청 - 사용자 ID:", req.userId);

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "사용자를 찾을 수 없습니다.",
      });
    }

    // 비밀번호 변경 시 현재 비밀번호 확인
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({
          status: "error",
          message: "현재 비밀번호를 입력해주세요.",
        });
      }

      const isCurrentPasswordValid = await bcrypt.compare(
        currentPassword,
        user.password
      );
      if (!isCurrentPasswordValid) {
        return res.status(400).json({
          status: "error",
          message: "현재 비밀번호가 올바르지 않습니다.",
        });
      }

      // 새 비밀번호 암호화
      const saltRounds = 10;
      user.password = await bcrypt.hash(newPassword, saltRounds);
    }

    // 기본 정보 업데이트
    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (birth !== undefined) user.birth = birth;
    user.updatedAt = new Date();

    await user.save();

    console.log("[프로필 API] 프로필 업데이트 성공:", user.email);
    res.json({
      status: "success",
      message: "프로필이 성공적으로 업데이트되었습니다.",
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          birth: user.birth,
          avatar: user.avatar,
          updatedAt: user.updatedAt,
        },
      },
    });
  } catch (error) {
    console.error("[프로필 API] 프로필 업데이트 오류:", error);
    res.status(500).json({
      status: "error",
      message: "프로필 업데이트 중 오류가 발생했습니다.",
    });
  }
});

// 계정 삭제 API
apiRoutes.delete("/profile", authenticateToken, async (req, res) => {
  try {
    const { password } = req.body;
    console.log("[프로필 API] 계정 삭제 요청 - 사용자 ID:", req.userId);

    if (!password) {
      return res.status(400).json({
        status: "error",
        message: "현재 비밀번호를 입력해주세요.",
      });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "사용자를 찾을 수 없습니다.",
      });
    }

    // 비밀번호 확인
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({
        status: "error",
        message: "비밀번호가 올바르지 않습니다.",
      });
    }

    // 사용자와 관련된 모든 데이터 삭제
    console.log("[프로필 API] 사용자 관련 데이터 삭제 시작:", user.email);

    // 사용자의 이벤트 삭제
    await Event.deleteMany({ userId: req.userId });

    // 사용자의 할일 삭제
    await Todo.deleteMany({ userId: req.userId });

    // 사용자의 게시글 삭제
    await Post.deleteMany({ author: user.name });

    // 사용자의 댓글 삭제
    await Comment.deleteMany({ author: user.name });

    // 사용자 계정 삭제
    await User.findByIdAndDelete(req.userId);

    console.log("[프로필 API] 계정 삭제 완료:", user.email);
    res.json({
      status: "success",
      message: "계정이 성공적으로 삭제되었습니다.",
    });
  } catch (error) {
    console.error("[프로필 API] 계정 삭제 오류:", error);
    res.status(500).json({
      status: "error",
      message: "계정 삭제 중 오류가 발생했습니다.",
    });
  }
});

// 비밀번호 찾기 API
apiRoutes.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body; // 다시 이메일만으로 변경
    console.log("[서버 로그] 비밀번호 재설정 요청:", email);

    // 필수 필드 확인
    if (!email) {
      return res.status(400).json({
        status: "error",
        message: "이메일 주소를 입력해주세요.",
      });
    }

    // 이메일로 사용자 찾기
    const user = await User.findOne({ email: email });

    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "해당 이메일로 등록된 사용자를 찾을 수 없습니다.",
      });
    }

    // 비밀번호 재설정 토큰 생성 (1시간 유효)
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1시간 후 만료

    console.log(
      "[서버 로그] 재설정 토큰 생성:",
      resetToken.substring(0, 8) + "..."
    );

    // 사용자에게 토큰과 만료시간 저장
    await User.findByIdAndUpdate(user._id, {
      passwordResetToken: resetToken,
      passwordResetExpires: resetTokenExpiry,
      updatedAt: new Date(),
    });

    // 비밀번호 재설정 링크 생성
    const resetUrl = `http://localhost:5001/reset-password?token=${resetToken}`;

    // 이메일 발송 설정
    const mailOptions = {
      from: `"Ordo Support" <${
        process.env.EMAIL_USER || "ordoscheduler@gmail.com"
      }>`,
      to: email,
      subject: "[Ordo] 비밀번호 재설정 요청",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <link href="https://fonts.googleapis.com/css2?family=Cutive:wght@400&family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }

            body {
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              line-height: 1.6;
              color: #2c3e50;
              margin: 0;
              padding: 20px;
              background: linear-gradient(135deg, #f6f0eb 0%, #faf4f2 50%, #f0e6e1 100%);
              min-height: 100vh;
            }

            .email-container {
              max-width: 650px;
              margin: 0 auto;
              background: rgba(255, 255, 255, 0.95);
              backdrop-filter: blur(20px);
              border-radius: 24px;
              overflow: hidden;
              box-shadow:
                0 20px 60px rgba(201, 99, 66, 0.15),
                0 8px 32px rgba(0, 0, 0, 0.1),
                inset 0 1px 0 rgba(255, 255, 255, 0.9);
              border: 1px solid rgba(255, 255, 255, 0.8);
            }

            .header {
              background: linear-gradient(135deg, #c96342 0%, #a54a2e 50%, #8b3922 100%);
              color: white;
              padding: 50px 40px;
              text-align: center;
              position: relative;
              overflow: hidden;
            }

            .header::before {
              content: '';
              position: absolute;
              top: -50%;
              left: -50%;
              width: 200%;
              height: 200%;
              background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.1), transparent);
              animation: shine 3s ease-in-out infinite;
            }

            @keyframes shine {
              0% { transform: translateX(-100%) translateY(-100%) rotate(45deg); }
              50% { transform: translateX(50%) translateY(50%) rotate(45deg); }
              100% { transform: translateX(200%) translateY(200%) rotate(45deg); }
            }

            .brand-section {
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 16px;
              margin-bottom: 20px;
              position: relative;
              z-index: 2;
            }

            .logo {
              width: 60px;
              height: 60px;
              background: rgba(255, 255, 255, 0.2);
              border-radius: 16px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 32px;
              backdrop-filter: blur(10px);
              border: 1px solid rgba(255, 255, 255, 0.3);
            }

            .brand-title {
              font-family: 'Cutive', serif;
              font-size: 42px;
              font-weight: 400;
              letter-spacing: -0.02em;
              text-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
            }

            .header-subtitle {
              font-size: 18px;
              opacity: 0.9;
              font-weight: 300;
              margin-top: 8px;
              position: relative;
              z-index: 2;
            }

            .content {
              padding: 50px 40px;
              background: white;
            }

            .greeting {
              font-size: 24px;
              color: #c96342;
              font-weight: 600;
              margin-bottom: 16px;
              font-family: 'Cutive', serif;
            }

            .message {
              font-size: 16px;
              color: #555;
              margin-bottom: 30px;
              line-height: 1.7;
            }

            .cta-section {
              text-align: center;
              margin: 40px 0;
              padding: 30px;
              background: linear-gradient(135deg, #f8f4f1 0%, #faf6f3 100%);
              border-radius: 16px;
              border: 1px solid rgba(201, 99, 66, 0.1);
            }

            .button {
              display: inline-block;
              background: linear-gradient(135deg, #c96342 0%, #a54a2e 100%);
              color: white;
              padding: 18px 36px;
              text-decoration: none;
              border-radius: 12px;
              font-weight: 600;
              font-size: 16px;
              transition: all 0.3s ease;
              box-shadow:
                0 8px 25px rgba(201, 99, 66, 0.3),
                0 3px 10px rgba(0, 0, 0, 0.1);
              border: none;
              font-family: 'Inter', sans-serif;
            }

            .button:hover {
              transform: translateY(-2px);
              box-shadow:
                0 12px 35px rgba(201, 99, 66, 0.4),
                0 5px 15px rgba(0, 0, 0, 0.15);
            }

            .warning-box {
              background: linear-gradient(135deg, #fff8e1 0%, #fffbf0 100%);
              border: 1px solid #f9c74f;
              padding: 25px;
              border-radius: 12px;
              margin: 30px 0;
              border-left: 4px solid #f9c74f;
            }

            .warning-title {
              color: #d68910;
              font-weight: 600;
              margin-bottom: 12px;
              display: flex;
              align-items: center;
              gap: 8px;
            }

            .warning-list {
              margin: 15px 0;
              padding-left: 20px;
            }

            .warning-list li {
              margin-bottom: 8px;
              color: #8b6914;
            }

            .url-section {
              margin: 30px 0;
            }

            .url-label {
              font-weight: 500;
              color: #666;
              margin-bottom: 12px;
            }

            .url-box {
              background: #f8f9fa;
              padding: 20px;
              border-radius: 8px;
              word-break: break-all;
              font-size: 13px;
              color: #666;
              font-family: 'Monaco', 'Consolas', monospace;
              border: 1px solid #e9ecef;
            }

            .divider {
              height: 1px;
              background: linear-gradient(90deg, transparent, #e9ecef, transparent);
              margin: 40px 0;
            }

            .footer {
              text-align: center;
              padding: 40px 30px;
              background: linear-gradient(135deg, #f8f9fa 0%, #f1f3f4 100%);
              border-top: 1px solid rgba(201, 99, 66, 0.1);
            }

            .footer-brand {
              font-family: 'Cutive', serif;
              font-size: 18px;
              color: #c96342;
              font-weight: 600;
              margin-bottom: 8px;
            }

            .footer-tagline {
              color: #666;
              font-size: 14px;
              margin-bottom: 12px;
              font-style: italic;
            }

            .footer-note {
              color: #999;
              font-size: 12px;
            }

            /* 모바일 반응형 */
            @media (max-width: 600px) {
              body {
                padding: 10px;
              }

              .email-container {
                border-radius: 16px;
              }

              .header {
                padding: 30px 20px;
              }

              .brand-title {
                font-size: 32px;
              }

              .content {
                padding: 30px 20px;
              }

              .button {
                padding: 16px 28px;
                font-size: 15px;
              }

              .footer {
                padding: 30px 20px;
              }
            }
          </style>
        </head>
        <body>
          <div class="email-container">
            <div class="header">
              <div class="brand-section">
                <div class="logo">🗂️</div>
                <div class="brand-title">Ordo</div>
              </div>
              <div class="header-subtitle">체계적인 일상을 위한 스케줄러</div>
            </div>

            <div class="content">
              <div class="greeting">안녕하세요, ${user.name}님! 👋</div>

              <div class="message">
                <strong>Ordo</strong> 계정의 비밀번호 재설정을 요청하셨습니다.<br>
                보안을 위해 아래 버튼을 클릭하여 새로운 비밀번호를 설정해주세요.
              </div>

              <div class="cta-section">
                <a href="${resetUrl}" class="button">🔐 비밀번호 재설정하기</a>
              </div>

              <div class="warning-box">
                <div class="warning-title">
                  ⚠️ 보안 안내사항
                </div>
                <ul class="warning-list">
                  <li>이 링크는 <strong>1시간 동안만</strong> 유효합니다</li>
                  <li>보안을 위해 <strong>한 번만</strong> 사용할 수 있습니다</li>
                  <li>본인이 요청하지 않으셨다면 이 이메일을 무시해주세요</li>
                  <li>링크를 다른 사람과 공유하지 마세요</li>
                </ul>
              </div>

              <div class="divider"></div>

              <div class="url-section">
                <div class="url-label">버튼이 작동하지 않는다면 아래 URL을 복사하여 브라우저에 직접 입력해주세요:</div>
                <div class="url-box">${resetUrl}</div>
              </div>
            </div>

            <div class="footer">
              <div class="footer-brand">© 2025 Ordo</div>
              <div class="footer-tagline">"시간을 정돈하고, 삶을 조직하다"</div>
              <div class="footer-note">
                이 이메일은 자동으로 발송되었습니다. 답장하지 마세요.
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    try {
      // 이메일 발송 시도
      await transporter.sendMail(mailOptions);
      console.log("[서버 로그] 비밀번호 재설정 이메일 발송 성공:", email);

      res.json({
        status: "success",
        message:
          "비밀번호 재설정 링크가 이메일로 발송되었습니다. 메일함을 확인해주세요.",
      });
    } catch (emailError) {
      console.error("[서버 로그] 이메일 발송 실패:", emailError.message);

      // 개발 환경에서는 콘솔에 링크 출력 및 화면에도 표시
      console.log("[개발 모드] 비밀번호 재설정 링크:", resetUrl);

      res.json({
        status: "success",
        message:
          "이메일 발송에 실패했지만 개발 모드에서 재설정 링크를 제공합니다.",
        resetUrl: resetUrl,
        isLocalOnly: true,
      });
    }
  } catch (error) {
    console.error("[서버 로그] 비밀번호 재설정 요청 에러:", error);
    res.status(500).json({
      status: "error",
      message: "비밀번호 재설정 요청 중 오류가 발생했습니다.",
    });
  }
});

// 초대 응답 (수락/거절) - 수정된 버전
apiRoutes.put(
  "/chat/invitations/:invitationId",
  authenticateToken,
  async (req, res) => {
    try {
      const { invitationId } = req.params;
      const { action } = req.body; // 'accept' or 'decline'

      if (!["accept", "decline"].includes(action)) {
        return res.status(400).json({
          status: "error",
          message: "올바른 응답을 선택해주세요.",
        });
      }

      const invitation = await Invitation.findOne({
        _id: invitationId,
        invitee: req.user.userId,
        status: "pending",
      }).populate("chatRoom");

      if (!invitation) {
        return res.status(404).json({
          status: "error",
          message: "초대를 찾을 수 없습니다.",
        });
      }

      // 초대 상태 업데이트
      invitation.status = action === "accept" ? "accepted" : "declined";
      invitation.respondedAt = new Date();
      await invitation.save();

      if (action === "accept") {
        // 사용자 정보 조회
        const user = await User.findById(req.user.userId);

        // 채팅방에 사용자 추가
        await ChatRoom.findByIdAndUpdate(invitation.chatRoom._id, {
          $addToSet: { participants: req.user.userId },
        });

        // 시스템 메시지 생성 (사용자가 들어왔다는 알림)
        const systemMessage = new Message({
          chatRoom: invitation.chatRoom._id,
          content: `${user.name}님이 채팅방에 참여했습니다.`,
          type: "system",
          timestamp: new Date(),
        });
        await systemMessage.save();

        // Socket.IO로 실시간 알림 전송
        io.to(invitation.chatRoom._id.toString()).emit("user_joined", {
          message: {
            _id: systemMessage._id,
            content: systemMessage.content,
            type: systemMessage.type,
            timestamp: systemMessage.timestamp,
          },
          userId: req.user.userId,
          userName: user.name,
        });

        res.json({
          status: "success",
          message: `"${invitation.chatRoom.name}" 채팅방에 참여했습니다.`,
          data: { chatRoom: invitation.chatRoom },
        });

        console.log(
          `[서버 로그] 초대 수락 및 입장 알림: ${user.name} -> ${invitation.chatRoom.name}`
        );
      } else {
        res.json({
          status: "success",
          message: "초대를 거절했습니다.",
        });

        console.log(
          `[서버 로그] 초대 거절: ${req.user.userId} -> ${invitation.chatRoom.name}`
        );
      }
    } catch (error) {
      console.error("[서버 로그] 초대 응답 에러:", error);
      res.status(500).json({
        status: "error",
        message: "초대 응답에 실패했습니다.",
      });
    }
  }
);

// 채팅방 나가기
apiRoutes.delete(
  "/chat/rooms/:roomId/leave",
  authenticateToken,
  async (req, res) => {
    try {
      const { roomId } = req.params;

      const chatRoom = await ChatRoom.findOne({
        _id: roomId,
        participants: req.user.userId,
      });

      if (!chatRoom) {
        return res.status(404).json({
          status: "error",
          message: "참여 중인 채팅방이 아닙니다.",
        });
      }

      // 사용자 정보 조회
      const user = await User.findById(req.user.userId);

      // 채팅방에서 사용자 제거
      await ChatRoom.findByIdAndUpdate(roomId, {
        $pull: { participants: req.user.userId },
      });

      // 시스템 메시지 생성 (사용자가 나갔다는 알림)
      const systemMessage = new Message({
        chatRoom: roomId,
        content: `${user.name}님이 채팅방을 나갔습니다.`,
        type: "system",
        timestamp: new Date(),
        // system 타입 메시지는 sender가 필요없음
      });
      await systemMessage.save();

      // Socket.IO로 실시간 알림 전송
      io.to(roomId).emit("user_left", {
        message: {
          _id: systemMessage._id,
          content: systemMessage.content,
          type: systemMessage.type,
          timestamp: systemMessage.timestamp,
        },
        userId: req.user.userId,
        userName: user.name,
      });

      // 참가자가 없으면 채팅방 삭제
      const updatedRoom = await ChatRoom.findById(roomId);
      if (updatedRoom.participants.length === 0) {
        await ChatRoom.findByIdAndDelete(roomId);
        await Message.deleteMany({ chatRoom: roomId });
        await Invitation.deleteMany({ chatRoom: roomId });

        console.log(`[서버 로그] 빈 채팅방 삭제: ${chatRoom.name}`);
      }

      res.json({
        status: "success",
        message: `"${chatRoom.name}" 채팅방에서 나갔습니다.`,
      });

      console.log(
        `[서버 로그] 채팅방 나가기: ${req.user.userId} -> ${chatRoom.name}`
      );
    } catch (error) {
      console.error("[서버 로그] 채팅방 나가기 에러:", error);
      res.status(500).json({
        status: "error",
        message: "채팅방 나가기에 실패했습니다.",
      });
    }
  }
);

// ===== 채팅 관련 API =====

// 채팅방 목록 조회
apiRoutes.get("/chat/rooms", authenticateToken, async (req, res) => {
  try {
    console.log("[채팅 API] 채팅방 목록 조회 요청:", req.user.userId);

    const chatRooms = await ChatRoom.find({
      participants: req.user.userId,
    })
      .populate("participants", "name email")
      .populate("createdBy", "name email")
      .populate("lastMessage.sender", "name")
      .sort({ "lastMessage.timestamp": -1 });

    console.log("[채팅 API] 조회된 채팅방 수:", chatRooms.length);

    res.json({
      status: "success",
      data: {
        chatRooms: chatRooms.map((room) => ({
          _id: room._id,
          name: room.name,
          type: room.type,
          participants: room.participants,
          createdBy: room.createdBy,
          createdAt: room.createdAt,
          lastMessage: room.lastMessage,
          unreadCount: 0, // TODO: 읽지 않은 메시지 수 계산
        })),
      },
    });
  } catch (error) {
    console.error("[채팅 API] 채팅방 목록 조회 실패:", error);
    res.status(500).json({
      status: "error",
      message: "채팅방 목록을 불러오는데 실패했습니다.",
    });
  }
});

// 채팅방 생성
apiRoutes.post("/chat/rooms", authenticateToken, async (req, res) => {
  try {
    const { name, participants = [] } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({
        status: "error",
        message: "채팅방 이름을 입력해주세요.",
      });
    }

    // 참여자 목록에 생성자 추가
    const allParticipants = [...new Set([req.user.userId, ...participants])];

    const chatRoom = new ChatRoom({
      name: name.trim(),
      type: allParticipants.length > 2 ? "group" : "direct",
      participants: allParticipants,
      createdBy: req.user.userId,
    });

    await chatRoom.save();
    await chatRoom.populate("participants", "name email");
    await chatRoom.populate("createdBy", "name email");

    console.log("[채팅 API] 채팅방 생성 성공:", chatRoom.name);

    res.json({
      status: "success",
      message: "채팅방이 생성되었습니다.",
      data: { chatRoom },
    });

    // Socket.IO로 참여자들에게 알림
    allParticipants.forEach((participantId) => {
      io.to(participantId.toString()).emit("new_chatroom_created", {
        chatRoom,
        message: {
          content: `새로운 채팅방 "${chatRoom.name}"이 생성되었습니다.`,
          type: "system",
        },
      });
    });
  } catch (error) {
    console.error("[채팅 API] 채팅방 생성 실패:", error);
    res.status(500).json({
      status: "error",
      message: "채팅방 생성에 실패했습니다.",
    });
  }
});

// 특정 채팅방의 메시지 조회
apiRoutes.get(
  "/chat/rooms/:roomId/messages",
  authenticateToken,
  async (req, res) => {
    try {
      const { roomId } = req.params;
      const { page = 1, limit = 50 } = req.query;

      // 채팅방 접근 권한 확인
      const chatRoom = await ChatRoom.findOne({
        _id: roomId,
        participants: req.user.userId,
      }).populate("participants", "name email");

      if (!chatRoom) {
        return res.status(404).json({
          status: "error",
          message: "참여 중인 채팅방이 아닙니다.",
        });
      }

      // 메시지 조회
      const messages = await Message.find({ chatRoom: roomId })
        .populate("sender", "name email")
        .sort({ timestamp: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      // 시간순으로 정렬 (최신이 마지막)
      messages.reverse();

      console.log(
        "[채팅 API] 메시지 조회:",
        chatRoom.name,
        messages.length,
        "개"
      );

      res.json({
        status: "success",
        data: {
          chatRoom,
          messages,
          pagination: {
            currentPage: parseInt(page),
            totalMessages: await Message.countDocuments({ chatRoom: roomId }),
          },
        },
      });
    } catch (error) {
      console.error("[채팅 API] 메시지 조회 실패:", error);
      res.status(500).json({
        status: "error",
        message: "메시지를 불러오는데 실패했습니다.",
      });
    }
  }
);

// 채팅방 초대 전송
apiRoutes.post("/chat/invitations", authenticateToken, async (req, res) => {
  try {
    const { chatRoomId, inviteeIds, message = "" } = req.body;

    if (!chatRoomId || !inviteeIds || inviteeIds.length === 0) {
      return res.status(400).json({
        status: "error",
        message: "채팅방과 초대할 사용자를 선택해주세요.",
      });
    }

    // 채팅방 권한 확인
    const chatRoom = await ChatRoom.findOne({
      _id: chatRoomId,
      participants: req.user.userId,
    });

    if (!chatRoom) {
      return res.status(404).json({
        status: "error",
        message: "참여 중인 채팅방이 아닙니다.",
      });
    }

    // 초대 생성
    const invitations = [];
    for (const inviteeId of inviteeIds) {
      // 이미 참여 중인지 확인
      if (chatRoom.participants.includes(inviteeId)) {
        continue;
      }

      // 이미 초대된 상태인지 확인
      const existingInvitation = await Invitation.findOne({
        chatRoom: chatRoomId,
        invitee: inviteeId,
        status: "pending",
      });

      if (existingInvitation) {
        continue;
      }

      const invitation = new Invitation({
        chatRoom: chatRoomId,
        inviter: req.user.userId,
        invitee: inviteeId,
        message: message.trim(),
      });

      await invitation.save();
      invitations.push(invitation);
    }

    if (invitations.length === 0) {
      return res.status(400).json({
        status: "error",
        message: "초대할 수 있는 사용자가 없습니다.",
      });
    }

    console.log("[채팅 API] 초대 전송 완료:", invitations.length, "명");

    res.json({
      status: "success",
      message: `${invitations.length}명에게 초대를 전송했습니다.`,
      data: { invitations },
    });

    // Socket.IO로 초대받은 사용자들에게 실시간 알림
    invitations.forEach((invitation) => {
      io.to(invitation.invitee.toString()).emit("new_invitation", {
        invitation,
        chatRoom,
      });
    });
  } catch (error) {
    console.error("[채팅 API] 초대 전송 실패:", error);
    res.status(500).json({
      status: "error",
      message: "초대 전송에 실패했습니다.",
    });
  }
});

// 받은 초대 목록 조회
apiRoutes.get(
  "/chat/invitations/received",
  authenticateToken,
  async (req, res) => {
    try {
      const invitations = await Invitation.find({
        invitee: req.user.userId,
        status: "pending",
      })
        .populate("chatRoom", "name type")
        .populate("inviter", "name email")
        .sort({ createdAt: -1 });

      console.log("[채팅 API] 받은 초대 조회:", invitations.length, "개");

      res.json({
        status: "success",
        data: { invitations },
      });
    } catch (error) {
      console.error("[채팅 API] 초대 목록 조회 실패:", error);
      res.status(500).json({
        status: "error",
        message: "초대 목록을 불러오는데 실패했습니다.",
      });
    }
  }
);

// 사용자 검색 (초대용)
apiRoutes.get("/chat/users/search", authenticateToken, async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        status: "error",
        message: "검색어는 2글자 이상 입력해주세요.",
      });
    }

    const searchQuery = q.trim();
    const users = await User.find({
      $and: [
        { _id: { $ne: req.user.userId } }, // 본인 제외
        {
          $or: [
            { name: { $regex: searchQuery, $options: "i" } },
            { email: { $regex: searchQuery, $options: "i" } },
          ],
        },
      ],
    })
      .select("name email")
      .limit(10);

    console.log("[채팅 API] 사용자 검색:", searchQuery, users.length, "명");

    res.json({
      status: "success",
      data: { users },
    });
  } catch (error) {
    console.error("[채팅 API] 사용자 검색 실패:", error);
    res.status(500).json({
      status: "error",
      message: "사용자 검색에 실패했습니다.",
    });
  }
});

// 파일 업로드 API
apiRoutes.post(
  "/chat/upload",
  authenticateToken,
  upload.single("file"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          status: "error",
          message: "파일이 선택되지 않았습니다.",
        });
      }

      if (!gridfsBucket) {
        return res.status(500).json({
          status: "error",
          message: "파일 저장소가 초기화되지 않았습니다.",
        });
      }

      // 파일명 생성 (중복 방지를 위해 타임스탬프 추가)
      const filename = `${Date.now()}_${req.file.originalname}`;

      // GridFS에 파일 업로드
      const uploadStream = gridfsBucket.openUploadStream(filename, {
        metadata: {
          originalName: req.file.originalname,
          mimetype: req.file.mimetype,
          uploadedBy: req.user.userId,
          uploadedAt: new Date(),
        },
      });

      // 파일 데이터를 스트림에 쓰기
      uploadStream.end(req.file.buffer);

      uploadStream.on("finish", () => {
        console.log(
          `[서버 로그] 파일 업로드 완료: ${req.file.originalname} (${req.file.size} bytes)`
        );

        res.json({
          status: "success",
          message: "파일이 성공적으로 업로드되었습니다.",
          data: {
            fileId: uploadStream.id,
            filename: filename,
            originalName: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size,
          },
        });
      });

      uploadStream.on("error", (error) => {
        console.error("[서버 로그] 파일 업로드 에러:", error);
        res.status(500).json({
          status: "error",
          message: "파일 업로드에 실패했습니다.",
        });
      });
    } catch (error) {
      console.error("[서버 로그] 파일 업로드 에러:", error);
      res.status(500).json({
        status: "error",
        message: "파일 업로드에 실패했습니다.",
      });
    }
  }
);

// 파일 다운로드 API
apiRoutes.get("/chat/files/:fileId", authenticateToken, async (req, res) => {
  try {
    const { fileId } = req.params;

    if (!gridfsBucket) {
      return res.status(500).json({
        status: "error",
        message: "파일 저장소가 초기화되지 않았습니다.",
      });
    }

    // 파일 정보 조회
    const files = await gridfsBucket
      .find({ _id: new mongoose.Types.ObjectId(fileId) })
      .toArray();

    if (!files || files.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "파일을 찾을 수 없습니다.",
      });
    }

    const file = files[0];

    // 파일 스트림 생성
    const downloadStream = gridfsBucket.openDownloadStream(
      new mongoose.Types.ObjectId(fileId)
    );

    // 응답 헤더 설정
    res.set({
      "Content-Type": file.metadata.mimetype,
      "Content-Disposition": `attachment; filename="${encodeURIComponent(
        file.metadata.originalName
      )}"`,
      "Content-Length": file.length,
    });

    // 파일 스트림을 응답으로 파이프
    downloadStream.pipe(res);

    downloadStream.on("error", (error) => {
      console.error("[서버 로그] 파일 다운로드 에러:", error);
      if (!res.headersSent) {
        res.status(500).json({
          status: "error",
          message: "파일 다운로드에 실패했습니다.",
        });
      }
    });

    console.log(`[서버 로그] 파일 다운로드: ${file.metadata.originalName}`);
  } catch (error) {
    console.error("[서버 로그] 파일 다운로드 에러:", error);
    if (!res.headersSent) {
      res.status(500).json({
        status: "error",
        message: "파일 다운로드에 실패했습니다.",
      });
    }
  }
});

// Horae AI 연동 엔드포인트들
app.post(
  "/api/horae/schedule-optimize",
  authenticateToken,
  async (req, res) => {
    try {
      const { events, date } = req.body;

      // Ordo 이벤트 형식을 Horae 형식으로 변환
      const schedule = events.map((event) => ({
        start_time: new Date(event.startDate).toLocaleTimeString("ko-KR", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }),
        end_time: new Date(event.endDate).toLocaleTimeString("ko-KR", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }),
        title: event.title,
        date: new Date(event.startDate).toISOString().split("T")[0], // YYYY-MM-DD 형식으로 date 필드 추가
      }));

      console.log(`[Horae 연동] ${date} 일정 최적화 요청:`, schedule);

      // 로컬에서 일정 분석
      const localAnalysis = analyzeSchedule(events);

      try {
        // Horae 백엔드에 요청 (타임아웃 20초로 최적화)
        const response = await axios.post(
          `${HORAE_API_URL}/api/ordo/schedule/${date}`,
          {
            schedule,
          },
          {
            timeout: 20000, // 20초로 최적화
          }
        );

        res.json({
          success: true,
          feedback: response.data.message,
          source: "horae-ai",
        });
      } catch (horaeError) {
        // Horae API 실패 시 로컬 분석으로 fallback
        console.log(
          "[Horae 연동] API 실패, 로컬 최적화 제안 사용:",
          horaeError.message
        );

        const localOptimization = generateLocalOptimization(
          events,
          localAnalysis
        );

        res.json({
          success: true,
          feedback: localOptimization,
          source: "local-fallback",
        });
      }
    } catch (error) {
      console.error("[Horae 연동] 일정 최적화 오류:", error.message);

      if (error.code === "ECONNREFUSED") {
        res.status(503).json({
          success: false,
          error:
            "Horae AI 서비스에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.",
        });
      } else {
        res.status(500).json({
          success: false,
          error: "일정 최적화 중 오류가 발생했습니다.",
          details: error.message,
        });
      }
    }
  }
);

// Daily 한마디 생성 엔드포인트
app.post("/api/horae/daily", async (req, res) => {
  try {
    console.log(
      "[Horae 연동] 전체 req.body:",
      JSON.stringify(req.body, null, 2)
    );

    const { date, schedule, events } = req.body;

    console.log("[Horae 연동] 개별 필드 확인:");
    console.log("  - date:", date);
    console.log("  - schedule:", schedule);
    console.log("  - events:", events);
    console.log("  - events type:", typeof events);
    console.log("  - events length:", events ? events.length : "N/A");

    // 프론트엔드에서 events로 보내는 경우 schedule로 매핑
    const actualSchedule = schedule || events || [];
    console.log("[Horae 연동] actualSchedule:", actualSchedule);
    console.log("[Horae 연동] actualSchedule type:", typeof actualSchedule);
    console.log(`[Horae 연동] ${date} Daily 한마디 요청:`, actualSchedule);

    // 로컬에서 일정 분석
    const localAnalysis = analyzeSchedule(actualSchedule);

    try {
      // Horae API 호출 시도 (타임아웃 20초로 최적화)
      const horaeResponse = await axios.post(
        `${HORAE_API_URL}/api/ordo/daily`, // 올바른 경로로 수정
        { date, schedule: actualSchedule },
        { timeout: 20000 } // 20초로 최적화
      );

      // Horae API 응답 반환
      const response = {
        message: horaeResponse.data.message,
        success: true,
        isAI: true,
      };

      res.json(response);
    } catch (horaeError) {
      // Horae API 실패 시 로컬 분석만 반환
      console.log("[Horae 연동] API 실패, 로컬 분석 사용:", horaeError.message);

      const fallbackResponse = {
        message: generateLocalMessage(localAnalysis),
        success: true,
        isLocalOnly: true,
      };

      res.json(fallbackResponse);
    }
  } catch (error) {
    console.error("[Horae 연동] Daily 한마디 오류:", error.message);
    res.status(500).json({
      success: false,
      error: "Daily 한마디 생성 중 오류가 발생했습니다.",
      details: error.message,
    });
  }
});

// 로컬 일정 분석 함수
function analyzeSchedule(schedule) {
  const analysis = {
    totalEvents: schedule.length,
    patterns: {
      morning: 0, // 6-12시
      afternoon: 0, // 12-18시
      evening: 0, // 18-24시
      night: 0, // 0-6시
    },
    averageDuration: 0,
    hasOvernight: false,
  };

  let totalDuration = 0;

  schedule.forEach((event) => {
    const startHour = new Date(event.startDate).getHours();
    const duration =
      (new Date(event.endDate) - new Date(event.startDate)) / (1000 * 60);

    // 시간대별 분류
    if (startHour >= 6 && startHour < 12) analysis.patterns.morning++;
    else if (startHour >= 12 && startHour < 18) analysis.patterns.afternoon++;
    else if (startHour >= 18 && startHour < 24) analysis.patterns.evening++;
    else analysis.patterns.night++;

    // 하루를 넘어가는 일정 체크
    if (event.pattern && event.pattern.isOvernight) {
      analysis.hasOvernight = true;
    }

    totalDuration += duration;
  });

  analysis.averageDuration = totalDuration / schedule.length || 0;

  return analysis;
}

// 로컬 메시지 생성 함수 (Horae 컨셉)
function generateLocalMessage(analysis) {
  // 일정 수에 따른 메시지
  if (analysis.totalEvents === 0) {
    const emptyMessages = [
      "오늘은 고요한 하루네요. ✨ 새로운 가능성으로 가득한 여백의 시간입니다. 소중한 일정을 추가해보시는 건 어떨까요? 오늘도 좋은 하루 되세요 😊",
      "여유로운 하루가 주어졌네요. 🌸 이런 날에는 자신을 위한 시간을 갖는 것도 좋을 것 같아요. 오늘도 좋은 하루 되세요 😊",
      "평온한 하루의 시작이에요. 🌅 마음의 소리에 귀 기울이며 천천히 보내보세요. 오늘도 좋은 하루 되세요 😊",
    ];
    return emptyMessages[Math.floor(Math.random() * emptyMessages.length)];
  }

  // 시간대별 패턴 분석
  const busyTime = Object.entries(analysis.patterns).sort(
    ([, a], [, b]) => b - a
  )[0][0];

  const timeMessages = {
    morning: "아침의 청명한 기운이 하루를 밝게 열어주네요. 🌅",
    afternoon: "오후의 활기찬 에너지가 느껴집니다. 💫",
    evening: "저녁 시간의 따뜻한 빛이 하루를 마무리해주네요. 🌆",
    night: "밤의 고요한 시간도 소중한 의미가 있어요. 🌙",
  };

  let message = timeMessages[busyTime];

  // 평균 일정 시간 분석
  if (analysis.averageDuration > 120) {
    message +=
      " 긴 일정들이 많으니 중간중간 작은 휴식의 시간을 갖으시길 바라요.";
  } else {
    message += " 적절한 리듬으로 하루가 흘러갈 것 같아요.";
  }

  message += " 오늘도 좋은 하루 되세요 😊";

  return message;
}

// 로컬 일정 최적화 제안 생성 함수 (Horae 컨셉)
function generateLocalOptimization(events, analysis) {
  if (events.length === 0) {
    return "새로운 하루의 시작이에요. ✨ 의미있는 일정들로 채워보시는 건 어떨까요? 오늘도 좋은 하루 되세요 😊";
  }

  const suggestions = [];

  // 시간 충돌 검사
  for (let i = 0; i < events.length - 1; i++) {
    const current = events[i];
    const next = events[i + 1];

    if (!current.endDate || !next.startDate) continue;

    const currentEnd = new Date(current.endDate);
    const nextStart = new Date(next.startDate);

    if (currentEnd > nextStart) {
      suggestions.push(
        `일정 시간이 겹치는 부분이 있어요. 조화로운 흐름을 위해 시간을 조정해보시면 어떨까요?`
      );
      break; // 하나만 표시
    }
  }

  // 하루 패턴 분석
  if (events.length > 4) {
    suggestions.push(
      "풍성한 하루가 예정되어 있네요. 일정 사이사이에 짧은 휴식의 여유를 두시면 더욱 좋을 것 같아요."
    );
  } else if (events.length <= 2) {
    suggestions.push("여유로운 하루네요. 자신만의 특별한 시간을 만들어보세요.");
  }

  // 기본 메시지
  if (suggestions.length === 0) {
    const defaultMessages = [
      "균형잡힌 하루 계획이네요. 계획하신 대로 차근차근 나아가시길 바라요. 오늘도 좋은 하루 되세요 😊",
      "잘 정리된 일정이에요. 각 순간을 소중히 여기며 보내세요. 오늘도 좋은 하루 되세요 😊",
      "조화로운 하루가 될 것 같아요. 마음의 평안과 함께 하시길 바라요. 오늘도 좋은 하루 되세요 😊",
    ];
    return defaultMessages[Math.floor(Math.random() * defaultMessages.length)];
  }

  return suggestions.join(" ") + " 오늘도 좋은 하루 되세요 😊";
}

// 이벤트 라우트 등록 (더 구체적인 경로를 먼저)
app.use("/api/events", eventRoutes);

// API 라우트 등록 (일반적인 경로를 나중에)
app.use("/api", apiRoutes);

// HTML 페이지 라우트
const pageRoutes = express.Router();

pageRoutes.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "Main", "Mainpage.html"));
});

pageRoutes.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "Login", "login.html"));
});

pageRoutes.get("/email-login", (req, res) => {
  res.sendFile(path.join(__dirname, "Login", "email-login.html"));
});

pageRoutes.get("/signup", (req, res) => {
  res.sendFile(path.join(__dirname, "Login", "signup.html"));
});

pageRoutes.get("/forgot-password", (req, res) => {
  res.sendFile(path.join(__dirname, "Login", "forgot-password.html"));
});

pageRoutes.get("/reset-password", (req, res) => {
  res.sendFile(path.join(__dirname, "Login", "reset-password.html"));
});

pageRoutes.get("/main", (req, res) => {
  res.sendFile(path.join(__dirname, "Main", "index.html"));
});

pageRoutes.get("/chat", (req, res) => {
  res.sendFile(path.join(__dirname, "Chat", "chat.html"));
});

// 페이지 라우트 등록
app.use("/", pageRoutes);

//카카오로그인 후 메인페이지로 이동
app.use(express.static(path.join(__dirname, "board")));
app.use(express.static(path.join(__dirname, "public")));

// 404 처리
app.use((req, res) => {
  res.status(404).json({
    status: "error",
    message: "요청하신 페이지를 찾을 수 없습니다.",
  });
});

// 서버 시작 함수
async function startServer() {
  const PORT = process.env.PORT || 5001;

  // MongoDB 연결 대기
  const isConnected = await connectToMongoDB();
  if (!isConnected) {
    console.error("[서버 로그] MongoDB 연결 실패로 서버를 시작할 수 없습니다.");
    process.exit(1);
  }

  // 서버 시작
  server.listen(PORT, () => {
    console.log(`[서버 로그] 서버 시작: http://localhost:${PORT}`);
    console.log(`[서버 로그] Socket.IO 서버 활성화됨`);
    console.log(`[서버 로그] MongoDB 연결 완료 - 모든 기능 사용 가능`);
  });
}

// 서버 시작
startServer().catch((error) => {
  console.error("[서버 로그] 서버 시작 실패:", error);
  process.exit(1);
});

// 이메일 전송을 위한 nodemailer 설정
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER || "your-email@gmail.com",
    pass: process.env.EMAIL_PASS || "your-app-specific-password",
  },
});

// 비밀번호 재설정 API
apiRoutes.post("/reset-password", async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    console.log("[서버 로그] 비밀번호 재설정 실행:", token);

    if (!token || !newPassword) {
      return res.status(400).json({
        status: "error",
        message: "토큰과 새 비밀번호가 필요합니다.",
      });
    }

    // 토큰으로 사용자 찾기 및 만료시간 확인
    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: new Date() }, // 현재 시간보다 만료시간이 큰 경우
    });

    if (!user) {
      return res.status(400).json({
        status: "error",
        message: "유효하지 않거나 만료된 재설정 토큰입니다.",
      });
    }

    // 새 비밀번호 유효성 검사
    if (newPassword.length < 8) {
      return res.status(400).json({
        status: "error",
        message: "비밀번호는 8자 이상이어야 합니다.",
      });
    }

    // 비밀번호 업데이트 및 토큰 제거
    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.updatedAt = new Date();

    await user.save();

    console.log("[서버 로그] 비밀번호 재설정 완료:", user.email);

    res.json({
      status: "success",
      message: "비밀번호가 성공적으로 변경되었습니다.",
    });
  } catch (error) {
    console.error("[서버 로그] 비밀번호 재설정 에러:", error);
    res.status(500).json({
      status: "error",
      message: "비밀번호 재설정 중 오류가 발생했습니다.",
    });
  }
});

// === 커뮤니티 기능 API ===

// 모든 게시글 조회 (페이지네이션 및 검색 포함)
apiRoutes.get("/posts", async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "" } = req.query;
    const skip = (page - 1) * limit;

    // 검색 조건 구성
    let query = {};
    if (search.trim()) {
      query = {
        $or: [
          { title: { $regex: search, $options: "i" } },
          { content: { $regex: search, $options: "i" } },
        ],
      };
    }

    // 게시글 조회
    const posts = await Post.find(query)
      .populate("author", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // 전체 개수 조회
    const totalPosts = await Post.countDocuments(query);
    const totalPages = Math.ceil(totalPosts / limit);

    // 통계 정보 조회
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayPosts = await Post.countDocuments({
      createdAt: { $gte: today },
    });

    const totalUsers = await User.countDocuments();

    console.log(
      `[커뮤니티 API] 게시글 목록 조회: ${posts.length}개 (총 ${totalPosts}개)`
    );

    res.json({
      status: "success",
      data: {
        posts,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalPosts,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
        stats: {
          totalPosts,
          todayPosts,
          totalUsers,
        },
      },
    });
  } catch (error) {
    console.error("[커뮤니티 API] 게시글 목록 조회 오류:", error);
    res.status(500).json({
      status: "error",
      message: "게시글 목록을 불러올 수 없습니다.",
    });
  }
});

// 카테고리별 통계 조회
apiRoutes.get("/posts/stats/categories", async (req, res) => {
  try {
    const stats = await Post.aggregate([
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
        },
      },
    ]);

    // 카테고리별 카운트 객체로 변환
    const categoryStats = {
      all: await Post.countDocuments(),
      productivity: 0,
      routine: 0,
      tips: 0,
      qna: 0,
    };

    stats.forEach((stat) => {
      if (stat._id && categoryStats.hasOwnProperty(stat._id)) {
        categoryStats[stat._id] = stat.count;
      }
    });

    console.log(`[커뮤니티 API] 카테고리 통계 조회:`, categoryStats);
    res.json(categoryStats);
  } catch (error) {
    console.error("[커뮤니티 API] 카테고리 통계 조회 오류:", error);
    res.status(500).json({
      status: "error",
      message: "카테고리 통계를 불러올 수 없습니다.",
    });
  }
});

// 인기글 조회 (좋아요 순)
apiRoutes.get("/posts/popular", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;

    const popularPosts = await Post.find()
      .sort({ likesCount: -1, views: -1, createdAt: -1 })
      .limit(limit)
      .select("title likesCount views author createdAt");

    console.log(`[커뮤니티 API] 인기글 조회: ${popularPosts.length}개`);
    res.json(popularPosts);
  } catch (error) {
    console.error("[커뮤니티 API] 인기글 조회 오류:", error);
    res.status(500).json({
      status: "error",
      message: "인기글을 불러올 수 없습니다.",
    });
  }
});

// 특정 게시글 조회
apiRoutes.get("/posts/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        status: "error",
        message: "게시글을 찾을 수 없습니다.",
      });
    }

    console.log(`[커뮤니티 API] 게시글 조회: ${post.title}`);
    res.json({
      status: "success",
      post: post,
    });
  } catch (error) {
    console.error("[커뮤니티 API] 게시글 조회 오류:", error);
    res.status(500).json({
      status: "error",
      message: "게시글을 불러올 수 없습니다.",
    });
  }
});

// 게시글 작성
apiRoutes.post("/posts", upload.array("images", 5), async (req, res) => {
  try {
    const { title, content, author, category, tags, images } = req.body;

    if (!title || !content || !author) {
      return res.status(400).json({
        status: "error",
        message: "제목, 내용, 작성자는 필수입니다.",
      });
    }

    const newPost = new Post({
      title,
      content,
      author,
      category: category || "tips",
      tags: tags || [],
      images: images || [],
    });

    await newPost.save();

    console.log(
      `[커뮤니티 API] 새 게시글 작성: ${title} by ${author} (카테고리: ${
        category || "tips"
      }, 이미지: ${images ? images.length : 0}개)`
    );
    res.status(201).json({
      status: "success",
      message: "게시글이 성공적으로 작성되었습니다.",
      data: newPost,
    });
  } catch (error) {
    console.error("[커뮤니티 API] 게시글 작성 오류:", error);
    res.status(500).json({
      status: "error",
      message: "게시글 작성 중 오류가 발생했습니다.",
    });
  }
});

// 게시글 조회수 증가
apiRoutes.post("/posts/:id/view", async (req, res) => {
  try {
    const post = await Post.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    );

    if (!post) {
      return res.status(404).json({
        status: "error",
        message: "게시글을 찾을 수 없습니다.",
      });
    }

    res.json({ views: post.views });
  } catch (error) {
    console.error("[커뮤니티 API] 조회수 업데이트 오류:", error);
    res.status(500).json({
      status: "error",
      message: "조회수 업데이트에 실패했습니다.",
    });
  }
});

// 게시글 좋아요
apiRoutes.post("/posts/:id/like", async (req, res) => {
  try {
    const { userId, userName } = req.body;

    if (!userId || !userName) {
      return res.status(400).json({
        status: "error",
        message: "사용자 정보가 필요합니다.",
      });
    }

    // 게시글 존재 확인
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        status: "error",
        message: "게시글을 찾을 수 없습니다.",
      });
    }

    // 현재 좋아요 상태 확인
    const existingLike = post.likes.find((like) => like.userId === userId);
    let updatedPost;
    let isLiked;
    let message;

    if (existingLike) {
      // 좋아요 취소 - atomic operation 사용
      updatedPost = await Post.findByIdAndUpdate(
        req.params.id,
        {
          $pull: { likes: { userId: userId } },
          $inc: { likesCount: -1 },
        },
        { new: true, runValidators: true }
      );
      isLiked = false;
      message = "좋아요를 취소했습니다.";
      console.log(`[커뮤니티 API] 좋아요 취소: ${post.title} by ${userName}`);
    } else {
      // 좋아요 추가 - atomic operation 사용
      updatedPost = await Post.findByIdAndUpdate(
        req.params.id,
        {
          $addToSet: {
            likes: {
              userId: userId,
              userName: userName,
              createdAt: new Date(),
            },
          },
          $inc: { likesCount: 1 },
        },
        { new: true, runValidators: true }
      );
      isLiked = true;
      message = "좋아요를 눌렀습니다.";
      console.log(`[커뮤니티 API] 좋아요 추가: ${post.title} by ${userName}`);
    }

    if (!updatedPost) {
      return res.status(404).json({
        status: "error",
        message: "게시글을 찾을 수 없습니다.",
      });
    }

    // 성공 응답
    res.json({
      status: "success",
      message: message,
      isLiked: isLiked,
      likesCount: updatedPost.likesCount,
      likes: updatedPost.likes,
    });
  } catch (error) {
    console.error("[커뮤니티 API] 좋아요 처리 오류:", error);
    console.error("[커뮤니티 API] 스택 트레이스:", error.stack);
    res.status(500).json({
      status: "error",
      message: "좋아요 처리에 실패했습니다.",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// 게시글 좋아요 상태 확인
apiRoutes.get("/posts/:id/like-status", async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.json({ isLiked: false, likesCount: 0, likes: [] });
    }

    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        status: "error",
        message: "게시글을 찾을 수 없습니다.",
      });
    }

    const isLiked = post.likes.some((like) => like.userId === userId);

    res.json({
      isLiked,
      likesCount: post.likesCount,
      likes: post.likes || [],
    });
  } catch (error) {
    console.error("[커뮤니티 API] 좋아요 상태 확인 오류:", error);
    res.status(500).json({
      status: "error",
      message: "좋아요 상태 확인에 실패했습니다.",
    });
  }
});

// 게시글 댓글 조회
apiRoutes.get("/posts/:id/comments", async (req, res) => {
  try {
    const comments = await Comment.find({ postId: req.params.id }).sort({
      createdAt: 1,
    });

    console.log(`[커뮤니티 API] 댓글 조회: ${comments.length}개`);
    res.json(comments);
  } catch (error) {
    console.error("[커뮤니티 API] 댓글 조회 오류:", error);
    res.status(500).json({
      status: "error",
      message: "댓글을 불러올 수 없습니다.",
    });
  }
});

// 댓글 작성
apiRoutes.post("/posts/:id/comments", async (req, res) => {
  try {
    const { author, text } = req.body;

    if (!author || !text) {
      return res.status(400).json({
        status: "error",
        message: "작성자와 댓글 내용은 필수입니다.",
      });
    }

    const newComment = new Comment({
      postId: req.params.id,
      author,
      text,
    });

    await newComment.save();

    // 게시글의 댓글 수 증가
    await Post.findByIdAndUpdate(req.params.id, { $inc: { comments: 1 } });

    console.log(
      `[커뮤니티 API] 새 댓글 작성: ${text.substring(0, 30)}... by ${author}`
    );
    res.status(201).json({
      status: "success",
      message: "댓글이 성공적으로 작성되었습니다.",
      data: newComment,
    });
  } catch (error) {
    console.error("[커뮤니티 API] 댓글 작성 오류:", error);
    res.status(500).json({
      status: "error",
      message: "댓글 작성 중 오류가 발생했습니다.",
    });
  }
});

// 커뮤니티 이미지 업로드 API
apiRoutes.post(
  "/posts/upload-image",
  upload.single("image"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          status: "error",
          message: "이미지가 선택되지 않았습니다.",
        });
      }

      // 이미지 파일 타입 검증
      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
      ];
      if (!allowedTypes.includes(req.file.mimetype)) {
        return res.status(400).json({
          status: "error",
          message:
            "지원하지 않는 이미지 형식입니다. (jpg, png, gif, webp만 가능)",
        });
      }

      // 파일 크기 제한 (5MB)
      if (req.file.size > 5 * 1024 * 1024) {
        return res.status(400).json({
          status: "error",
          message: "이미지 크기는 5MB 이하만 가능합니다.",
        });
      }

      if (!gridfsBucket) {
        return res.status(500).json({
          status: "error",
          message: "파일 저장소가 초기화되지 않았습니다.",
        });
      }

      // 파일명 생성 (중복 방지)
      const filename = `post_image_${Date.now()}_${req.file.originalname}`;

      // GridFS에 이미지 업로드
      const uploadStream = gridfsBucket.openUploadStream(filename, {
        metadata: {
          originalName: req.file.originalname,
          mimetype: req.file.mimetype,
          uploadedAt: new Date(),
          type: "post_image",
        },
      });

      uploadStream.end(req.file.buffer);

      uploadStream.on("finish", () => {
        console.log(
          `[커뮤니티 API] 이미지 업로드 완료: ${req.file.originalname} (${req.file.size} bytes)`
        );

        res.json({
          status: "success",
          message: "이미지가 성공적으로 업로드되었습니다.",
          data: {
            fileId: uploadStream.id,
            filename: filename,
            originalName: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size,
            url: `/api/posts/images/${uploadStream.id}`,
          },
        });
      });

      uploadStream.on("error", (error) => {
        console.error("[커뮤니티 API] 이미지 업로드 에러:", error);
        res.status(500).json({
          status: "error",
          message: "이미지 업로드에 실패했습니다.",
        });
      });
    } catch (error) {
      console.error("[커뮤니티 API] 이미지 업로드 에러:", error);
      res.status(500).json({
        status: "error",
        message: "이미지 업로드에 실패했습니다.",
      });
    }
  }
);

// 커뮤니티 이미지 서빙 API
apiRoutes.get("/posts/images/:fileId", async (req, res) => {
  try {
    const { fileId } = req.params;

    if (!gridfsBucket) {
      return res.status(500).json({
        status: "error",
        message: "파일 저장소가 초기화되지 않았습니다.",
      });
    }

    // 파일 정보 조회
    const files = await gridfsBucket
      .find({ _id: new mongoose.Types.ObjectId(fileId) })
      .toArray();

    if (!files || files.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "이미지를 찾을 수 없습니다.",
      });
    }

    const file = files[0];

    // 이미지 파일인지 확인
    if (!file.metadata.mimetype.startsWith("image/")) {
      return res.status(400).json({
        status: "error",
        message: "이미지 파일이 아닙니다.",
      });
    }

    // 파일 스트림 생성
    const downloadStream = gridfsBucket.openDownloadStream(
      new mongoose.Types.ObjectId(fileId)
    );

    // 응답 헤더 설정
    res.set({
      "Content-Type": file.metadata.mimetype,
      "Content-Length": file.length,
      "Cache-Control": "public, max-age=31536000", // 1년 캐시
    });

    // 파일 스트림을 응답으로 파이프
    downloadStream.pipe(res);

    downloadStream.on("error", (error) => {
      console.error("[커뮤니티 API] 이미지 서빙 에러:", error);
      if (!res.headersSent) {
        res.status(500).json({
          status: "error",
          message: "이미지를 불러올 수 없습니다.",
        });
      }
    });

    console.log(`[커뮤니티 API] 이미지 서빙: ${file.metadata.originalName}`);
  } catch (error) {
    console.error("[커뮤니티 API] 이미지 서빙 에러:", error);
    if (!res.headersSent) {
      res.status(500).json({
        status: "error",
        message: "이미지를 불러올 수 없습니다.",
      });
    }
  }
});

// === 날씨 API ===
// 실시간 날씨 정보 API
apiRoutes.get("/weather", async (req, res) => {
  try {
    const { lat, lon } = req.query;

    // 기본 좌표 (서울) - 위치 정보가 없는 경우
    const latitude = lat || 37.5665;
    const longitude = lon || 126.978;

    // OpenWeatherMap API 키 (환경변수에서 가져오거나 기본값 사용)
    const API_KEY = process.env.OPENWEATHER_API_KEY || "demo_key";

    // 실제 API를 사용할 수 없는 경우 임시 데이터 반환
    if (API_KEY === "demo_key") {
      console.log("[날씨 API] 데모 모드 - 임시 날씨 데이터 반환");

      // 시간대별로 다른 온도 반환 (좀 더 현실적으로)
      const now = new Date();
      const hour = now.getHours();
      let temperature, description, icon;

      if (hour >= 6 && hour < 9) {
        temperature = Math.floor(Math.random() * 5) + 15; // 15-19도
        description = "상쾌한 아침";
        icon = "01d";
      } else if (hour >= 9 && hour < 12) {
        temperature = Math.floor(Math.random() * 7) + 18; // 18-24도
        description = "맑음";
        icon = "01d";
      } else if (hour >= 12 && hour < 15) {
        temperature = Math.floor(Math.random() * 8) + 22; // 22-29도
        description = "화창함";
        icon = "01d";
      } else if (hour >= 15 && hour < 18) {
        temperature = Math.floor(Math.random() * 6) + 20; // 20-25도
        description = "따뜻함";
        icon = "02d";
      } else if (hour >= 18 && hour < 21) {
        temperature = Math.floor(Math.random() * 5) + 16; // 16-20도
        description = "선선함";
        icon = "03d";
      } else {
        temperature = Math.floor(Math.random() * 8) + 10; // 10-17도
        description = "쌀쌀함";
        icon = "01n";
      }

      res.json({
        status: "success",
        data: {
          temperature: temperature,
          description: description,
          icon: icon,
          humidity: Math.floor(Math.random() * 30) + 40, // 40-70%
          windSpeed: Math.floor(Math.random() * 10) + 1, // 1-10 m/s
          location: "서울특별시",
          isDemo: true,
        },
      });
      return;
    }

    try {
      // OpenWeatherMap API 호출
      const weatherResponse = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${API_KEY}&units=metric&lang=kr`
      );

      const weatherData = weatherResponse.data;

      res.json({
        status: "success",
        data: {
          temperature: Math.round(weatherData.main.temp),
          description: weatherData.weather[0].description,
          icon: weatherData.weather[0].icon,
          humidity: weatherData.main.humidity,
          windSpeed: weatherData.wind.speed,
          location: weatherData.name,
          isDemo: false,
        },
      });

      console.log(
        `[날씨 API] 실시간 날씨 조회 성공: ${weatherData.name}, ${Math.round(
          weatherData.main.temp
        )}°C`
      );
    } catch (apiError) {
      console.error(
        "[날씨 API] OpenWeatherMap API 호출 실패:",
        apiError.message
      );

      // API 호출 실패 시 기본값 반환
      const fallbackTemp = Math.floor(Math.random() * 10) + 18; // 18-27도
      res.json({
        status: "success",
        data: {
          temperature: fallbackTemp,
          description: "맑음",
          icon: "01d",
          humidity: 50,
          windSpeed: 2,
          location: "서울특별시",
          isDemo: true,
          error: "실시간 날씨 정보를 가져올 수 없어 예상 날씨를 표시합니다.",
        },
      });
    }
  } catch (error) {
    console.error("[날씨 API] 날씨 조회 오류:", error);
    res.status(500).json({
      status: "error",
      message: "날씨 정보를 가져올 수 없습니다.",
    });
  }
});

// 🆕 Horae 일정 추천 API
app.post("/api/horae/recommend/:date", authenticateToken, async (req, res) => {
  try {
    const { date } = req.params;
    const { events } = req.body;

    console.log(`[Horae 추천] ${date} 날짜의 일정 추천 요청 받음`);
    console.log(`[Horae 추천] 분석할 일정 수: ${events?.length || 0}`);

    if (!events || events.length === 0) {
      return res.json({
        success: true,
        type: "recommend",
        data: {
          message: "아직 일정이 없네요. ✨ 새로운 계획을 세워보세요!",
          recommendations: [],
          summary: "호라이가 더 나은 일정 계획을 도와드릴게요 🌟",
        },
      });
    }

    // 이벤트를 Horae 형식으로 변환
    const scheduleData = events.map((event) => ({
      start_time: new Date(event.startDate).toLocaleTimeString("ko-KR", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }),
      end_time: new Date(event.endDate).toLocaleTimeString("ko-KR", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }),
      title: event.title,
      date: new Date(event.startDate).toISOString().split("T")[0], // YYYY-MM-DD 형식으로 date 필드 추가
    }));

    console.log("[Horae 추천] Horae 백엔드로 전송할 데이터:", {
      events: scheduleData,
    });

    // Horae 백엔드에 추천 요청
    try {
      const horaeResponse = await axios.post(
        `${HORAE_API_URL}/api/ordo/recommend/${date}`,
        {
          events: scheduleData,
        },
        {
          timeout: 30000,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      console.log("[Horae 추천] Horae 백엔드 응답:", horaeResponse.data);
      res.json(horaeResponse.data);
    } catch (horaeError) {
      console.error("[Horae 추천] Horae 백엔드 연결 실패:", horaeError.message);

      // 백업 추천 생성
      const backupRecommendations = {
        message:
          "호라이가 일정을 분석하고 있어요. ✨ 더 나은 시간 배치를 제안해드릴게요!",
        recommendations: scheduleData.map((item, index) => {
          // 간단한 로컬 최적화 로직
          const currentHour = parseInt(item.start_time.split(":")[0]);
          let suggestedHour = currentHour;

          // 점심시간(12-13시) 피하기
          if (currentHour === 12) suggestedHour = 14;
          // 아침 일찍(7시 이전) 조정
          if (currentHour < 7) suggestedHour = 9;
          // 저녁 늦게(21시 이후) 조정
          if (currentHour > 21) suggestedHour = 19;

          const duration = parseInt(item.end_time.split(":")[0]) - currentHour;
          const suggestedEndHour = suggestedHour + duration;

          return {
            original: {
              title: item.title,
              time: `${item.start_time}-${item.end_time}`,
              reason: "현재 시간대 분석 중",
            },
            suggested: {
              title: item.title,
              start_time: `${suggestedHour.toString().padStart(2, "0")}:${
                item.start_time.split(":")[1]
              }`,
              end_time: `${suggestedEndHour.toString().padStart(2, "0")}:${
                item.end_time.split(":")[1]
              }`,
              reason:
                suggestedHour !== currentHour
                  ? "더 효율적인 시간대로 이동"
                  : "현재 시간이 적절합니다",
            },
          };
        }),
        summary:
          "호라이가 더 효율적인 일정을 준비하고 있어요 🌟 오늘도 좋은 하루 되세요 😊",
      };

      res.json({
        success: true,
        type: "recommend",
        data: backupRecommendations,
        fallback: true,
      });
    }
  } catch (error) {
    console.error("[Horae 추천] 일정 추천 오류:", error);
    res.status(500).json({
      success: false,
      error: "일정 추천 중 오류가 발생했습니다",
      type: "recommend",
      fallback: {
        message: "일정 분석에 시간이 걸리고 있어요. 잠시만 기다려주세요 ✨",
        recommendations: [],
        summary:
          "호라이가 더 나은 계획을 세우고 있어요 🌟 오늘도 좋은 하루 되세요 😊",
      },
    });
  }
});

// 🆕 디버깅용 라우트 리스트 확인 API
apiRoutes.get("/debug/routes", (req, res) => {
  const routes = [];

  // app의 라우트들
  app._router.stack.forEach(function (middleware) {
    if (middleware.route) {
      routes.push({
        type: "app",
        path: middleware.route.path,
        methods: Object.keys(middleware.route.methods),
      });
    }
  });

  // apiRoutes의 라우트들도 포함
  const apiRoutesStack = [];
  if (apiRoutes.stack) {
    apiRoutes.stack.forEach(function (layer) {
      if (layer.route) {
        apiRoutesStack.push({
          type: "apiRoutes",
          path: "/api" + layer.route.path, // /api prefix 추가
          methods: Object.keys(layer.route.methods),
        });
      }
    });
  }

  res.json({
    message: "등록된 라우트 목록",
    appRoutes: routes,
    apiRoutes: apiRoutesStack,
    timestamp: new Date().toISOString(),
  });
});

// 🆕 Horae 일정 추천 옵션들 API (임시로 인증 우회)
apiRoutes.post("/horae/suggestions/:date", async (req, res) => {
  try {
    const { date } = req.params;

    console.log(`[Horae 추천 옵션] ${date} 날짜의 일정 추천 옵션 요청 받음`);
    console.log(`[Horae 추천 옵션] 임시 테스트 모드 - 인증 우회`);
    console.log(`[Horae 추천 옵션] Raw body:`, req.body);
    console.log(`[Horae 추천 옵션] Body type:`, typeof req.body);
    console.log(
      `[Horae 추천 옵션] Body stringified:`,
      JSON.stringify(req.body)
    );

    const { events } = req.body;
    console.log(`[Horae 추천 옵션] 분석할 일정 수: ${events?.length || 0}`);

    if (!events || events.length === 0) {
      return res.json({
        success: false,
        error: "추천할 일정이 없습니다. 먼저 일정을 추가해주세요.",
        type: "suggestions",
      });
    }

    // 이벤트를 Horae 형식으로 변환
    const scheduleData = events.map((event) => ({
      start_time: new Date(event.startDate).toLocaleTimeString("ko-KR", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }),
      end_time: new Date(event.endDate).toLocaleTimeString("ko-KR", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }),
      title: event.title,
      date: new Date(event.startDate).toISOString().split("T")[0],
    }));

    console.log("[Horae 추천 옵션] Horae 백엔드로 전송할 데이터:", {
      events: scheduleData,
    });

    try {
      // Horae 백엔드에 추천 옵션 요청
      const horaeResponse = await axios.post(
        `${HORAE_API_URL}/api/ordo/suggestions/${date}`,
        {
          events: scheduleData,
        },
        {
          timeout: 30000,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      console.log("[Horae 추천 옵션] Horae 백엔드 응답:", horaeResponse.data);
      res.json(horaeResponse.data);
    } catch (horaeError) {
      console.error(
        "[Horae 추천 옵션] Horae 백엔드 연결 실패:",
        horaeError.message
      );

      // 백업 응답 생성
      const backupResponse = {
        success: true,
        type: "suggestions",
        options: [
          {
            id: 1,
            title: "효율적인 시간 배치",
            description: "중요한 일정들을 생산성이 높은 시간대로 이동",
            impact: "생산성 +20%",
          },
          {
            id: 2,
            title: "휴식 시간 확보",
            description: "연속된 일정 사이에 충분한 휴식 시간 추가",
            impact: "스트레스 -15%",
          },
          {
            id: 3,
            title: "시간 충돌 해결",
            description: "겹치는 일정들을 조화롭게 재배치",
            impact: "일정 관리 +25%",
          },
        ],
        message:
          "호라이가 더 나은 일정 계획을 준비하고 있어요 ✨ 잠시만 기다려주세요!",
        fallback: true,
      };

      res.json(backupResponse);
    }
  } catch (error) {
    console.error("[Horae 추천 옵션] 일정 추천 옵션 오류:", error);
    res.status(500).json({
      success: false,
      error: "일정 추천 옵션 생성 중 오류가 발생했습니다",
      type: "suggestions",
    });
  }
});

// 🆕 추천 일정 적용 API
apiRoutes.post(
  "/horae/apply-recommendations",
  authenticateToken,
  async (req, res) => {
    try {
      const { date, recommendations } = req.body;
      const userId = req.user.id;

      console.log(`[추천 적용] ${date} 날짜의 추천 일정 적용 요청`);
      console.log(`[추천 적용] 사용자 ID: ${userId}`);
      console.log(
        `[추천 적용] 적용할 추천 수: ${recommendations?.length || 0}`
      );

      if (!date || !recommendations || recommendations.length === 0) {
        return res.status(400).json({
          success: false,
          error: "필수 정보가 누락되었습니다",
        });
      }

      // 새 추천 일정들을 데이터베이스에 저장
      const createdEvents = [];

      for (const rec of recommendations) {
        const suggested = rec.suggested;

        // 시간 변환 (HH:MM -> Date)
        const [startHour, startMin] = suggested.start_time.split(":");
        const [endHour, endMin] = suggested.end_time.split(":");

        const startDate = new Date(date);
        startDate.setHours(parseInt(startHour), parseInt(startMin), 0, 0);

        const endDate = new Date(date);
        endDate.setHours(parseInt(endHour), parseInt(endMin), 0, 0);

        // 다음날로 넘어가는 경우 처리
        if (endDate <= startDate) {
          endDate.setDate(endDate.getDate() + 1);
        }

        const eventData = {
          userId: new mongoose.Types.ObjectId(userId),
          title: `✨ ${suggested.title}`,
          startDate: startDate,
          endDate: endDate,
          color: "#E8F4FD", // 추천 일정은 파란색으로
          description: `호라이 추천: ${suggested.reason}`,
          isRecommended: true, // 추천 일정 플래그
        };

        const newEvent = new Event(eventData);
        const savedEvent = await newEvent.save();
        createdEvents.push(savedEvent);

        console.log(
          `✅ 추천 일정 생성: ${suggested.title} (${suggested.start_time}-${suggested.end_time})`
        );
      }

      res.json({
        success: true,
        message: `🎉 ${recommendations.length}개의 추천 일정이 성공적으로 적용되었습니다!`,
        applied_count: createdEvents.length,
        events: createdEvents.map((event) => ({
          id: event._id,
          title: event.title,
          startDate: event.startDate,
          endDate: event.endDate,
          color: event.color,
          description: event.description,
        })),
      });
    } catch (error) {
      console.error("[추천 적용] 추천 일정 적용 오류:", error);
      res.status(500).json({
        success: false,
        error: "추천 일정 적용 중 오류가 발생했습니다",
        details: error.message,
      });
    }
  }
);

// 게시글 수정
apiRoutes.put("/posts/:id", upload.array("images", 5), async (req, res) => {
  try {
    const { title, content, category, tags } = req.body;
    const { authorCheck } = req.query; // 작성자 확인용

    if (!title || !content) {
      return res.status(400).json({
        status: "error",
        message: "제목과 내용은 필수입니다.",
      });
    }

    // 게시글 존재 확인
    const existingPost = await Post.findById(req.params.id);
    if (!existingPost) {
      return res.status(404).json({
        status: "error",
        message: "게시글을 찾을 수 없습니다.",
      });
    }

    // 작성자 확인 (선택적)
    console.log("[디버그] 작성자 확인:", {
      authorCheck,
      postAuthor: existingPost.author,
      postAuthorType: typeof existingPost.author,
    });

    if (authorCheck && existingPost.author !== authorCheck) {
      return res.status(403).json({
        status: "error",
        message: "게시글을 수정할 권한이 없습니다.",
        debug: {
          expected: authorCheck,
          actual: existingPost.author,
        },
      });
    }

    // 게시글 업데이트
    const updatedPost = await Post.findByIdAndUpdate(
      req.params.id,
      {
        title,
        content,
        category: category || existingPost.category,
        tags: tags || existingPost.tags,
        updatedAt: new Date(),
      },
      { new: true, runValidators: true }
    );

    if (!updatedPost) {
      return res.status(404).json({
        status: "error",
        message: "게시글 수정에 실패했습니다.",
      });
    }

    console.log(
      `[커뮤니티 API] 게시글 수정 완료: ${updatedPost.title} by ${updatedPost.author}`
    );
    res.json({
      status: "success",
      message: "게시글이 성공적으로 수정되었습니다.",
      data: updatedPost,
    });
  } catch (error) {
    console.error("[커뮤니티 API] 게시글 수정 오류:", error);
    res.status(500).json({
      status: "error",
      message: "게시글 수정 중 오류가 발생했습니다.",
    });
  }
});

// 게시글 삭제
apiRoutes.delete("/posts/:id", async (req, res) => {
  try {
    const { authorCheck } = req.query; // 작성자 확인용

    // 게시글 존재 확인
    const existingPost = await Post.findById(req.params.id);
    if (!existingPost) {
      return res.status(404).json({
        status: "error",
        message: "게시글을 찾을 수 없습니다.",
      });
    }

    // 작성자 확인 (선택적)
    console.log("[디버그] 삭제 작성자 확인:", {
      authorCheck,
      postAuthor: existingPost.author,
      postAuthorType: typeof existingPost.author,
    });

    if (authorCheck && existingPost.author !== authorCheck) {
      return res.status(403).json({
        status: "error",
        message: "게시글을 삭제할 권한이 없습니다.",
        debug: {
          expected: authorCheck,
          actual: existingPost.author,
        },
      });
    }

    // 관련 댓글들도 함께 삭제
    await Comment.deleteMany({ postId: req.params.id });

    // 게시글 삭제
    const deletedPost = await Post.findByIdAndDelete(req.params.id);

    if (!deletedPost) {
      return res.status(404).json({
        status: "error",
        message: "게시글 삭제에 실패했습니다.",
      });
    }

    console.log(
      `[커뮤니티 API] 게시글 삭제 완료: ${deletedPost.title} by ${deletedPost.author}`
    );
    res.json({
      status: "success",
      message: "게시글이 성공적으로 삭제되었습니다.",
      data: { deletedId: req.params.id },
    });
  } catch (error) {
    console.error("[커뮤니티 API] 게시글 삭제 오류:", error);
    res.status(500).json({
      status: "error",
      message: "게시글 삭제 중 오류가 발생했습니다.",
    });
  }
});

// 댓글 수정
apiRoutes.put("/posts/:postId/comments/:commentId", async (req, res) => {
  try {
    const { text } = req.body;
    const { authorCheck } = req.query;

    if (!text || !text.trim()) {
      return res.status(400).json({
        status: "error",
        message: "댓글 내용은 필수입니다.",
      });
    }

    // 댓글 존재 확인
    const existingComment = await Comment.findById(req.params.commentId);
    if (!existingComment) {
      return res.status(404).json({
        status: "error",
        message: "댓글을 찾을 수 없습니다.",
      });
    }

    // 작성자 확인 (선택적)
    if (authorCheck && existingComment.author !== authorCheck) {
      return res.status(403).json({
        status: "error",
        message: "댓글을 수정할 권한이 없습니다.",
      });
    }

    // 댓글 업데이트
    const updatedComment = await Comment.findByIdAndUpdate(
      req.params.commentId,
      {
        text: text.trim(),
        updatedAt: new Date(),
      },
      { new: true, runValidators: true }
    );

    if (!updatedComment) {
      return res.status(404).json({
        status: "error",
        message: "댓글 수정에 실패했습니다.",
      });
    }

    console.log(
      `[커뮤니티 API] 댓글 수정 완료: ${text.substring(0, 30)}... by ${
        updatedComment.author
      }`
    );
    res.json({
      status: "success",
      message: "댓글이 성공적으로 수정되었습니다.",
      data: updatedComment,
    });
  } catch (error) {
    console.error("[커뮤니티 API] 댓글 수정 오류:", error);
    res.status(500).json({
      status: "error",
      message: "댓글 수정 중 오류가 발생했습니다.",
    });
  }
});

// 댓글 삭제
apiRoutes.delete("/posts/:postId/comments/:commentId", async (req, res) => {
  try {
    const { authorCheck } = req.query;

    // 댓글 존재 확인
    const existingComment = await Comment.findById(req.params.commentId);
    if (!existingComment) {
      return res.status(404).json({
        status: "error",
        message: "댓글을 찾을 수 없습니다.",
      });
    }

    // 작성자 확인 (선택적)
    if (authorCheck && existingComment.author !== authorCheck) {
      return res.status(403).json({
        status: "error",
        message: "댓글을 삭제할 권한이 없습니다.",
      });
    }

    // 댓글 삭제
    const deletedComment = await Comment.findByIdAndDelete(
      req.params.commentId
    );

    if (!deletedComment) {
      return res.status(404).json({
        status: "error",
        message: "댓글 삭제에 실패했습니다.",
      });
    }

    // 게시글의 댓글 수 감소
    await Post.findByIdAndUpdate(req.params.postId, { $inc: { comments: -1 } });

    console.log(
      `[커뮤니티 API] 댓글 삭제 완료: ${deletedComment.text.substring(
        0,
        30
      )}... by ${deletedComment.author}`
    );
    res.json({
      status: "success",
      message: "댓글이 성공적으로 삭제되었습니다.",
      data: { deletedId: req.params.commentId },
    });
  } catch (error) {
    console.error("[커뮤니티 API] 댓글 삭제 오류:", error);
    res.status(500).json({
      status: "error",
      message: "댓글 삭제 중 오류가 발생했습니다.",
    });
  }
});

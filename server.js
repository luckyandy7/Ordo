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

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// MongoDB Atlas 연결 설정
const MONGODB_URI =
  process.env.MONGODB_URI ||
  "mongodb+srv://suhwan522:OnAlF6A3hyWuanpc@cluster0.qvdmkxf.mongodb.net/ordo?retryWrites=true&w=majority";

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

// User 스키마 정의
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String, default: "" },
  birth: { type: String, default: "" },
  avatar: { type: String, default: "" },
  settings: {
    emailNotification: { type: Boolean, default: true },
    pushNotification: { type: Boolean, default: true },
    weeklyReport: { type: Boolean, default: false },
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// 비밀번호 해싱
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

const User = mongoose.model("User", userSchema);

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

  if (!token) {
    return res.status(401).json({
      status: "error",
      message: "액세스 토큰이 필요합니다.",
    });
  }

  jwt.verify(
    token,
    process.env.JWT_SECRET || "your-secret-key",
    (err, user) => {
      if (err) {
        return res.status(403).json({
          status: "error",
          message: "유효하지 않은 토큰입니다.",
        });
      }
      req.user = user;
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
        process.env.JWT_SECRET || "your-secret-key"
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
      process.env.JWT_SECRET || "your-secret-key",
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

    const token = jwt.sign({ userId: user._id }, "your-secret-key", {
      expiresIn: "1d",
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

// 데이터베이스 상태 확인 API (테스트용)
apiRoutes.get("/db-status", async (req, res) => {
  try {
    console.log("[서버 로그] DB 상태 확인 요청");

    // MongoDB 연결 상태 확인
    const dbState = mongoose.connection.readyState;
    const stateNames = {
      0: "disconnected",
      1: "connected",
      2: "connecting",
      3: "disconnecting",
    };

    // 사용자 수 확인
    const userCount = await User.countDocuments();
    console.log("[서버 로그] 총 사용자 수:", userCount);

    // 최근 사용자 몇 명 조회 (비밀번호 제외)
    const recentUsers = await User.find({})
      .select("-password")
      .limit(5)
      .sort({ createdAt: -1 });
    console.log(
      "[서버 로그] 최근 사용자들:",
      recentUsers.map((u) => ({ name: u.name, email: u.email }))
    );

    res.json({
      status: "success",
      data: {
        mongooseState: stateNames[dbState],
        dbName: mongoose.connection.name,
        userCount,
        recentUsers: recentUsers.map((u) => ({
          id: u._id,
          name: u.name,
          email: u.email,
          createdAt: u.createdAt,
        })),
      },
    });
  } catch (error) {
    console.error("[서버 로그] DB 상태 확인 에러:", error);
    res.status(500).json({
      status: "error",
      message: "데이터베이스 상태 확인 실패",
      error: error.message,
    });
  }
});

// 프로필 조회 API
apiRoutes.get("/profile", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-password");
    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "사용자를 찾을 수 없습니다.",
      });
    }

    res.json({
      status: "success",
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          birth: user.birth,
          avatar: user.avatar,
          settings: user.settings,
        },
      },
    });
  } catch (error) {
    console.error("[서버 로그] 프로필 조회 에러:", error);
    res.status(500).json({
      status: "error",
      message: "서버 오류가 발생했습니다.",
    });
  }
});

// 프로필 업데이트 API
apiRoutes.put("/profile", authenticateToken, async (req, res) => {
  try {
    const { name, email, phone, birth, avatar, settings } = req.body;

    // 이메일 중복 확인 (현재 사용자 제외)
    if (email) {
      const existingUser = await User.findOne({
        email,
        _id: { $ne: req.user.userId },
      });
      if (existingUser) {
        return res.status(400).json({
          status: "error",
          message: "이미 사용 중인 이메일입니다.",
        });
      }
    }

    // 업데이트할 데이터 준비
    const updateData = {
      updatedAt: new Date(),
    };

    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (birth !== undefined) updateData.birth = birth;
    if (avatar !== undefined) updateData.avatar = avatar;
    if (settings !== undefined) updateData.settings = settings;

    // 사용자 정보 업데이트
    const updatedUser = await User.findByIdAndUpdate(
      req.user.userId,
      updateData,
      { new: true, runValidators: true }
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({
        status: "error",
        message: "사용자를 찾을 수 없습니다.",
      });
    }

    res.json({
      status: "success",
      message: "프로필이 성공적으로 업데이트되었습니다.",
      data: {
        user: {
          id: updatedUser._id,
          name: updatedUser.name,
          email: updatedUser.email,
          phone: updatedUser.phone,
          birth: updatedUser.birth,
          avatar: updatedUser.avatar,
          settings: updatedUser.settings,
        },
      },
    });

    console.log("[서버 로그] 프로필 업데이트 성공:", updatedUser.email);
  } catch (error) {
    console.error("[서버 로그] 프로필 업데이트 에러:", error);
    res.status(500).json({
      status: "error",
      message: "서버 오류가 발생했습니다.",
    });
  }
});

// 비밀번호 변경 API
apiRoutes.put("/profile/password", authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        status: "error",
        message: "현재 비밀번호와 새 비밀번호를 모두 입력해주세요.",
      });
    }

    // 현재 사용자 조회
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "사용자를 찾을 수 없습니다.",
      });
    }

    // 현재 비밀번호 확인
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({
        status: "error",
        message: "현재 비밀번호가 올바르지 않습니다.",
      });
    }

    // 새 비밀번호 해싱 및 저장
    user.password = newPassword;
    user.updatedAt = new Date();
    await user.save();

    res.json({
      status: "success",
      message: "비밀번호가 성공적으로 변경되었습니다.",
    });

    console.log("[서버 로그] 비밀번호 변경 성공:", user.email);
  } catch (error) {
    console.error("[서버 로그] 비밀번호 변경 에러:", error);
    res.status(500).json({
      status: "error",
      message: "서버 오류가 발생했습니다.",
    });
  }
});

// 계정 삭제 API
apiRoutes.delete("/profile", authenticateToken, async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        status: "error",
        message: "비밀번호를 입력해주세요.",
      });
    }

    // 현재 사용자 조회
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "사용자를 찾을 수 없습니다.",
      });
    }

    // 비밀번호 확인
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({
        status: "error",
        message: "비밀번호가 올바르지 않습니다.",
      });
    }

    // 계정 삭제
    await User.findByIdAndDelete(req.user.userId);

    res.json({
      status: "success",
      message: "계정이 성공적으로 삭제되었습니다.",
    });

    console.log("[서버 로그] 계정 삭제 성공:", user.email);
  } catch (error) {
    console.error("[서버 로그] 계정 삭제 에러:", error);
    res.status(500).json({
      status: "error",
      message: "서버 오류가 발생했습니다.",
    });
  }
});

// 채팅 API 엔드포인트들
// 채팅방 목록 조회
apiRoutes.get("/chat/rooms", authenticateToken, async (req, res) => {
  try {
    const chatRooms = await ChatRoom.find({
      participants: req.user.userId,
    })
      .populate("participants", "name email avatar")
      .populate("lastMessage.sender", "name")
      .sort({ "lastMessage.timestamp": -1 });

    res.json({
      status: "success",
      data: { chatRooms },
    });
  } catch (error) {
    console.error("[서버 로그] 채팅방 목록 조회 에러:", error);
    res.status(500).json({
      status: "error",
      message: "채팅방 목록을 불러오는데 실패했습니다.",
    });
  }
});

// 새 채팅방 생성
apiRoutes.post("/chat/rooms", authenticateToken, async (req, res) => {
  try {
    const { name, participants = [] } = req.body;

    if (!name) {
      return res.status(400).json({
        status: "error",
        message: "채팅방 이름을 입력해주세요.",
      });
    }

    // 참가자 목록에 생성자 추가
    const allParticipants = [...new Set([req.user.userId, ...participants])];

    const chatRoom = new ChatRoom({
      name,
      participants: allParticipants,
      createdBy: req.user.userId,
    });

    await chatRoom.save();

    const populatedRoom = await ChatRoom.findById(chatRoom._id)
      .populate("participants", "name email avatar")
      .populate("createdBy", "name");

    res.status(201).json({
      status: "success",
      message: "채팅방이 생성되었습니다.",
      data: { chatRoom: populatedRoom },
    });

    console.log("[서버 로그] 새 채팅방 생성:", name);
  } catch (error) {
    console.error("[서버 로그] 채팅방 생성 에러:", error);
    res.status(500).json({
      status: "error",
      message: "채팅방 생성에 실패했습니다.",
    });
  }
});

// 채팅방 메시지 조회
apiRoutes.get(
  "/chat/rooms/:roomId/messages",
  authenticateToken,
  async (req, res) => {
    try {
      const { roomId } = req.params;
      const { page = 1, limit = 50 } = req.query;

      console.log(
        `[서버 로그] 채팅방 메시지 조회 요청: ${roomId} (사용자: ${req.user.userId})`
      );

      // 사용자가 해당 채팅방의 참가자인지 확인
      const chatRoom = await ChatRoom.findOne({
        _id: roomId,
        participants: req.user.userId,
      }).populate("participants", "name email avatar");

      console.log(
        `[서버 로그] 채팅방 조회 결과:`,
        chatRoom
          ? {
              id: chatRoom._id,
              name: chatRoom.name,
              participantCount: chatRoom.participants.length,
              participants: chatRoom.participants.map((p) => ({
                name: p.name,
                email: p.email,
              })),
            }
          : "채팅방을 찾을 수 없음"
      );

      if (!chatRoom) {
        console.log(`[서버 로그] 채팅방 접근 권한 없음: ${roomId}`);
        return res.status(403).json({
          status: "error",
          message: "해당 채팅방에 접근할 권한이 없습니다.",
        });
      }

      const messages = await Message.find({ chatRoom: roomId })
        .populate("sender", "name email avatar")
        .sort({ timestamp: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      console.log(`[서버 로그] 메시지 조회 완료: ${messages.length}개 메시지`);
      console.log(
        `[서버 로그] 채팅방 정보 반환: ${chatRoom.name}, 참여자 ${chatRoom.participants.length}명`
      );

      res.json({
        status: "success",
        data: {
          messages: messages.reverse(), // 시간순으로 정렬
          chatRoom,
        },
      });
    } catch (error) {
      console.error("[서버 로그] 메시지 조회 에러:", error);
      res.status(500).json({
        status: "error",
        message: "메시지를 불러오는데 실패했습니다.",
      });
    }
  }
);

// 사용자 검색 (채팅방 참가자 추가용)
apiRoutes.get("/chat/users/search", authenticateToken, async (req, res) => {
  try {
    const { q } = req.query;
    console.log(
      `[서버 로그] 사용자 검색 요청: "${q}" (요청자: ${req.user.userId})`
    );

    if (!q || q.length < 2) {
      console.log("[서버 로그] 검색어가 너무 짧음:", q);
      return res.status(400).json({
        status: "error",
        message: "검색어는 2글자 이상 입력해주세요.",
      });
    }

    const searchQuery = {
      $and: [
        { _id: { $ne: req.user.userId } }, // 자신 제외
        {
          $or: [
            { name: { $regex: q, $options: "i" } },
            { email: { $regex: q, $options: "i" } },
          ],
        },
      ],
    };

    console.log(
      "[서버 로그] MongoDB 검색 쿼리:",
      JSON.stringify(searchQuery, null, 2)
    );

    const users = await User.find(searchQuery)
      .select("name email avatar")
      .limit(10);

    console.log(`[서버 로그] 검색 결과: ${users.length}명 찾음`);
    console.log(
      "[서버 로그] 검색된 사용자들:",
      users.map((u) => ({ name: u.name, email: u.email }))
    );

    res.json({
      status: "success",
      data: { users },
    });
  } catch (error) {
    console.error("[서버 로그] 사용자 검색 에러:", error);
    res.status(500).json({
      status: "error",
      message: "사용자 검색에 실패했습니다.",
    });
  }
});

// 채팅방 초대 전송
apiRoutes.post("/chat/invitations", authenticateToken, async (req, res) => {
  try {
    const { chatRoomId, inviteeIds, message = "" } = req.body;

    if (
      !chatRoomId ||
      !inviteeIds ||
      !Array.isArray(inviteeIds) ||
      inviteeIds.length === 0
    ) {
      return res.status(400).json({
        status: "error",
        message: "채팅방 ID와 초대할 사용자를 선택해주세요.",
      });
    }

    // 채팅방 존재 확인 및 권한 체크
    console.log(`[서버 로그] 초대 권한 검증 시작:`, {
      chatRoomId,
      userId: req.user.userId,
      userIdType: typeof req.user.userId,
    });

    const chatRoom = await ChatRoom.findOne({
      _id: chatRoomId,
      participants: req.user.userId,
    });

    console.log(
      `[서버 로그] 채팅방 조회 결과:`,
      chatRoom
        ? {
            id: chatRoom._id,
            name: chatRoom.name,
            participants: chatRoom.participants,
            participantsLength: chatRoom.participants.length,
          }
        : "채팅방을 찾을 수 없음"
    );

    if (!chatRoom) {
      // 추가 디버깅: 채팅방이 존재하는지 확인
      const roomExists = await ChatRoom.findById(chatRoomId);
      console.log(
        `[서버 로그] 채팅방 존재 여부:`,
        roomExists
          ? {
              id: roomExists._id,
              name: roomExists.name,
              participants: roomExists.participants,
              createdBy: roomExists.createdBy,
            }
          : "채팅방이 존재하지 않음"
      );

      return res.status(403).json({
        status: "error",
        message: "해당 채팅방에 초대 권한이 없습니다.",
      });
    }

    // 이미 참가 중인 사용자 제외
    const existingParticipants = chatRoom.participants.map((p) => p.toString());
    const newInvitees = inviteeIds.filter(
      (id) => !existingParticipants.includes(id)
    );

    if (newInvitees.length === 0) {
      return res.status(400).json({
        status: "error",
        message: "선택한 사용자들은 이미 채팅방에 참여 중입니다.",
      });
    }

    // 기존 대기 중인 초대 확인
    const existingInvitations = await Invitation.find({
      chatRoom: chatRoomId,
      invitee: { $in: newInvitees },
      status: "pending",
    });

    const alreadyInvited = existingInvitations.map((inv) =>
      inv.invitee.toString()
    );
    const finalInvitees = newInvitees.filter(
      (id) => !alreadyInvited.includes(id)
    );

    if (finalInvitees.length === 0) {
      return res.status(400).json({
        status: "error",
        message: "선택한 사용자들에게 이미 초대를 보냈습니다.",
      });
    }

    // 초대 생성
    const invitations = finalInvitees.map((inviteeId) => ({
      chatRoom: chatRoomId,
      inviter: req.user.userId,
      invitee: inviteeId,
      message,
    }));

    await Invitation.insertMany(invitations);

    // 초대받은 사용자들 정보 조회
    const invitedUsers = await User.find({
      _id: { $in: finalInvitees },
    }).select("name email");

    res.status(201).json({
      status: "success",
      message: `${invitedUsers.length}명에게 초대를 보냈습니다.`,
      data: {
        invitedUsers,
        chatRoom: chatRoom.name,
      },
    });

    console.log(
      `[서버 로그] 채팅방 초대 전송: ${chatRoom.name} -> ${invitedUsers.length}명`
    );
  } catch (error) {
    console.error("[서버 로그] 초대 전송 에러:", error);
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
        .populate("chatRoom", "name")
        .populate("inviter", "name email avatar")
        .sort({ createdAt: -1 });

      res.json({
        status: "success",
        data: { invitations },
      });
    } catch (error) {
      console.error("[서버 로그] 초대 목록 조회 에러:", error);
      res.status(500).json({
        status: "error",
        message: "초대 목록을 불러오는데 실패했습니다.",
      });
    }
  }
);

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

pageRoutes.get("/main", (req, res) => {
  res.sendFile(path.join(__dirname, "Main", "index.html"));
});

pageRoutes.get("/chat", (req, res) => {
  res.sendFile(path.join(__dirname, "Chat", "chat.html"));
});

// 페이지 라우트 등록
app.use("/", pageRoutes);

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

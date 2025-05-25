const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();

// MongoDB Atlas 연결 설정
const MONGODB_URI =
  "mongodb+srv://suhwan522:OnAlF6A3hyWuanpc@cluster0.qvdmkxf.mongodb.net/ordo?retryWrites=true&w=majority";

// MongoDB 연결 옵션
const mongooseOptions = {
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
};

// 기본 미들웨어
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 정적 파일 제공 설정
app.use(express.static(path.join(__dirname)));
app.use("/public", express.static(path.join(__dirname, "Main/public")));
app.use("/Login", express.static(path.join(__dirname, "Login")));
app.use("/Main", express.static(path.join(__dirname, "Main")));
app.use("/font", express.static(path.join(__dirname, "font")));
app.use("/css", express.static(path.join(__dirname, "css")));
app.use("/js", express.static(path.join(__dirname, "js")));
app.use("/images", express.static(path.join(__dirname, "images")));

// MongoDB 연결
mongoose
  .connect(MONGODB_URI, mongooseOptions)
  .then(() => {
    console.log("[서버 로그] MongoDB Atlas 연결 성공");
  })
  .catch((error) => {
    console.error("[서버 로그] MongoDB Atlas 연결 실패:", error);
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

// 이벤트 라우트 등록
app.use("/api/events", eventRoutes);

// API 라우트 등록
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

// 페이지 라우트 등록
app.use("/", pageRoutes);

// 404 처리
app.use((req, res) => {
  res.status(404).json({
    status: "error",
    message: "요청하신 페이지를 찾을 수 없습니다.",
  });
});

// 서버 시작
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`[서버 로그] 서버 시작: http://localhost:${PORT}`);
});

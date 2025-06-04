const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  // 카카오 로그인 관련 필드 추가
  kakaoId: {
    type: String,
    unique: true,
    sparse: true, // null 값 허용하면서 unique 제약 조건 유지
  },
  isKakaoUser: {
    type: Boolean,
    default: false,
  },
  // 구글 로그인 관련 필드 추가
  googleId: {
    type: String,
    unique: true,
    sparse: true, // null 값 허용하면서 unique 제약 조건 유지
  },
  isGoogleUser: {
    type: Boolean,
    default: false,
  },
  // 프로필 이미지 URL (카카오/구글에서 받아올 수 있음)
  profileImage: {
    type: String,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  lastLoginAt: {
    type: Date,
    default: Date.now,
  },
});

// 비밀번호 해싱 미들웨어
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    // 카카오/구글 사용자의 경우 비밀번호 해싱 스킵
    if (
      (this.isKakaoUser && this.password === "kakao-login") ||
      (this.isGoogleUser && this.password === "google-login")
    ) {
      return next();
    }

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// 비밀번호 검증 메서드
userSchema.methods.comparePassword = async function (candidatePassword) {
  // 카카오/구글 사용자는 비밀번호 검증 불가
  if (this.isKakaoUser || this.isGoogleUser) {
    return false;
  }
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("User", userSchema);

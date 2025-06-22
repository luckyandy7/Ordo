// ==================== User 모델 정의 ====================
// 사용자 정보를 저장하는 MongoDB 스키마 및 관련 메서드 정의

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// 사용자 스키마 정의
const userSchema = new mongoose.Schema({
  // ==================== 기본 로그인 정보 ====================
  
  // 이메일 주소 (필수, 고유값, 자동 소문자 변환)
  email: {
    type: String,
    required: true,        // 필수 입력 필드
    unique: true,          // 중복 불허
    trim: true,            // 앞뒤 공백 제거
    lowercase: true,       // 자동으로 소문자 변환
  },
  
  // 비밀번호 (필수, 해싱하여 저장)
  password: {
    type: String,
    required: true,
  },
  
  // 사용자 이름/닉네임 (필수)
  name: {
    type: String,
    required: true,
  },
  
  // ==================== 소셜 로그인 관련 필드 ====================
  
  // 카카오 로그인 고유 ID
  kakaoId: {
    type: String,
    unique: true,          // 고유값
    sparse: true,          // null 값 허용하면서 unique 제약 조건 유지
  },
  
  // 카카오 사용자 여부 플래그
  isKakaoUser: {
    type: Boolean,
    default: false,        // 기본값은 일반 사용자
  },
  
  // 구글 로그인 고유 ID
  googleId: {
    type: String,
    unique: true,          // 고유값
    sparse: true,          // null 값 허용하면서 unique 제약 조건 유지
  },
  
  // 구글 사용자 여부 플래그
  isGoogleUser: {
    type: Boolean,
    default: false,        // 기본값은 일반 사용자
  },
  
  // ==================== 추가 사용자 정보 ====================
  
  // 프로필 이미지 URL (카카오/구글에서 받아올 수 있음)
  profileImage: {
    type: String,
    default: null,         // 기본값은 이미지 없음
  },
  
  // ==================== 비밀번호 재설정 관련 ====================
  
  // 비밀번호 재설정 토큰
  passwordResetToken: {
    type: String,
    default: null,
  },
  
  // 비밀번호 재설정 토큰 만료 시간
  passwordResetExpires: {
    type: Date,
    default: null,
  },
  
  // ==================== 타임스탬프 ====================
  
  // 계정 생성 시간
  createdAt: {
    type: Date,
    default: Date.now,
  },
  
  // 마지막 로그인 시간
  lastLoginAt: {
    type: Date,
    default: Date.now,
  },
});

// ==================== 미들웨어: 비밀번호 해싱 ====================
// 사용자 저장 전에 비밀번호를 해싱하는 미들웨어
userSchema.pre("save", async function (next) {
  // 비밀번호가 수정되지 않았으면 해싱 스킵
  if (!this.isModified("password")) return next();

  try {
    // 소셜 로그인 사용자의 경우 비밀번호 해싱 스킵
    // (카카오/구글 사용자는 임시 비밀번호 사용)
    if (
      (this.isKakaoUser && this.password === "kakao-login") ||
      (this.isGoogleUser && this.password === "google-login")
    ) {
      return next();
    }

    // bcrypt를 사용하여 비밀번호 해싱
    const salt = await bcrypt.genSalt(10);              // 솔트 생성 (복잡도 10)
    this.password = await bcrypt.hash(this.password, salt);  // 비밀번호 해싱
    next();
  } catch (error) {
    next(error);
  }
});

// ==================== 인스턴스 메서드: 비밀번호 검증 ====================
// 입력받은 비밀번호와 저장된 해시 비밀번호를 비교하는 메서드
userSchema.methods.comparePassword = async function (candidatePassword) {
  // 소셜 로그인 사용자는 비밀번호 검증 불가
  if (this.isKakaoUser || this.isGoogleUser) {
    return false;
  }
  
  // bcrypt를 사용하여 비밀번호 비교
  return bcrypt.compare(candidatePassword, this.password);
};

// User 모델 생성 및 내보내기
module.exports = mongoose.model("User", userSchema);

// ==================== SharedFile 모델 정의 ====================
// 워크스페이스에서 공유되는 파일을 저장하는 MongoDB 스키마

const mongoose = require("mongoose");

// 공유 파일 스키마 정의
const sharedFileSchema = new mongoose.Schema({
  // ==================== 파일 기본 정보 ====================
  
  // 원본 파일명 (사용자가 업로드한 파일명) - 필수
  originalName: { type: String, required: true },
  
  // 서버에 저장된 파일명 (중복 방지를 위해 변경된 이름) - 필수
  fileName: { type: String, required: true },
  
  // 파일 고유 ID
  fileId: String,
  
  // 파일 접근 URL
  url: String,
  
  // 파일 MIME 타입 (예: image/jpeg, application/pdf)
  mimeType: String,
  
  // 파일 크기 (바이트 단위)
  size: Number,
  
  // ==================== 워크스페이스 연결 ====================
  
  // 파일이 속한 워크스페이스 (Workspace 모델 참조) - 필수
  workspace: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workspace',
    required: true         // 필수 - 반드시 워크스페이스에 속해야 함
  },
  
  // ==================== 업로더 정보 ====================
  
  // 파일을 업로드한 사용자 (User 모델 참조) - 필수
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true         // 필수 - 반드시 업로더가 있어야 함
  },
  
  // 업로더 이름 (캐시용)
  uploaderName: String,
  
  // ==================== 파일 설명 및 분류 ====================
  
  // 파일 설명
  description: String,
  
  // 파일 분류 태그들 (검색 및 필터링용)
  tags: [String],
  
  // ==================== 파일 통계 ====================
  
  // 다운로드 횟수
  downloadCount: { 
    type: Number, 
    default: 0             // 기본값: 0회
  },
  
  // ==================== 공개 설정 ====================
  
  // 공개 파일 여부
  isPublic: { 
    type: Boolean, 
    default: false         // 기본값: 비공개
  },
  
  // ==================== 권한 관리 ====================
  
  // 파일별 사용자 권한 설정
  permissions: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },  // User 모델 참조
    permission: {
      type: String,
      enum: ['read', 'write', 'delete'],  // 읽기, 쓰기, 삭제
      default: 'read'      // 기본값: 읽기 권한만
    }
  }],
  
  // ==================== 메타데이터 ====================
  
  // 파일 업로드 시간
  createdAt: { type: Date, default: Date.now },
  
  // 파일 정보 최종 수정 시간
  updatedAt: { type: Date, default: Date.now }
});

// ==================== 가상 필드 (Virtual Fields) ====================
// 실제 DB에 저장되지 않고 동적으로 계산되는 필드

// 파일 크기를 읽기 쉬운 형태로 변환 (예: 1024 → "1 KB")
sharedFileSchema.virtual('readableSize').get(function() {
  if (!this.size) return '0 B';

  const sizes = ['B', 'KB', 'MB', 'GB'];           // 크기 단위 배열
  const i = Math.floor(Math.log(this.size) / Math.log(1024));  // 단위 계산
  return Math.round(this.size / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
});

// ==================== 미들웨어: 수정 시간 자동 업데이트 ====================
// 파일 정보가 저장될 때마다 수정 시간을 현재 시간으로 자동 업데이트
sharedFileSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// SharedFile 모델 생성 및 내보내기
module.exports = mongoose.model('SharedFile', sharedFileSchema);

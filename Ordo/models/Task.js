// ==================== Task 모델 정의 ====================
// 팀 워크스페이스에서 사용하는 작업/업무를 저장하는 MongoDB 스키마

const mongoose = require("mongoose");

// 작업 스키마 정의
const taskSchema = new mongoose.Schema({
  // ==================== 작업 기본 정보 ====================
  
  // 작업 제목 (필수)
  title: { type: String, required: true },
  
  // 작업 상세 설명 (선택사항)
  description: String,
  
  // ==================== 워크스페이스 연결 ====================
  
  // 소속 워크스페이스 (Workspace 모델 참조)
  workspace: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workspace',      // Workspace 컬렉션 참조
    required: true         // 필수 - 반드시 워크스페이스에 소속되어야 함
  },
  
  // ==================== 작업 담당자 정보 ====================
  
  // 작업 담당자 정보
  assignee: {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },  // User 모델 참조
    name: String,          // 담당자 이름 (캐시용)
    email: String          // 담당자 이메일 (캐시용)
  },
  
  // ==================== 작업 상태 관리 ====================
  
  // 작업 진행 상태
  status: {
    type: String,
    enum: ['todo', 'in-progress', 'completed'],  // 할 일, 진행 중, 완료
    default: 'todo'        // 기본값: 할 일
  },
  
  // 작업 우선순위
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],             // 낮음, 보통, 높음
    default: 'medium'      // 기본값: 보통
  },
  
  // ==================== 일정 관리 ====================
  
  // 작업 마감일
  dueDate: Date,
  
  // ==================== 분류 및 태그 ====================
  
  // 작업 분류 태그들 (검색 및 필터링용)
  tags: [String],
  
  // ==================== 첨부파일 관리 ====================
  
  // 작업에 첨부된 파일들
  attachments: [{
    fileId: String,        // 파일 고유 ID
    originalName: String,  // 원본 파일명
    url: String,          // 파일 접근 URL
    uploadedAt: { type: Date, default: Date.now }  // 업로드 시간
  }],
  
  // ==================== 댓글 시스템 ====================
  
  // 작업에 달린 댓글들
  comments: [{
    author: {
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },  // 작성자 User 참조
      name: String         // 작성자 이름 (캐시용)
    },
    content: String,       // 댓글 내용
    createdAt: { type: Date, default: Date.now }  // 댓글 작성 시간
  }],
  
  // ==================== 작업 생성자 및 메타데이터 ====================
  
  // 작업 생성자 (User 모델 참조)
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true         // 필수 - 반드시 생성자가 있어야 함
  },
  
  // 작업 생성 시간
  createdAt: { type: Date, default: Date.now },
  
  // 작업 최종 수정 시간
  updatedAt: { type: Date, default: Date.now }
});

// ==================== 미들웨어: 수정 시간 자동 업데이트 ====================
// 작업이 저장될 때마다 수정 시간을 현재 시간으로 자동 업데이트
taskSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Task 모델 생성 및 내보내기
module.exports = mongoose.model('Task', taskSchema);

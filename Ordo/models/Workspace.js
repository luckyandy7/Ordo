// ==================== Workspace 모델 정의 ====================
// 팀 협업 공간을 저장하는 MongoDB 스키마

const mongoose = require("mongoose");

// 워크스페이스 스키마 정의
const workspaceSchema = new mongoose.Schema({
  // ==================== 워크스페이스 기본 정보 ====================
  
  // 워크스페이스 이름 (필수)
  name: { type: String, required: true },
  
  // 워크스페이스 설명
  description: String,
  
  // 워크스페이스 유형
  type: {
    type: String,
    enum: ['project', 'team', 'study', 'personal'],  // 프로젝트, 팀, 스터디, 개인
    default: 'project'     // 기본값: 프로젝트
  },
  
  // 워크스페이스 아바타/아이콘
  avatar: { 
    type: String, 
    default: '🚀'          // 기본값: 로켓 이모지
  },
  
  // ==================== 소유자 정보 ====================
  
  // 워크스페이스 소유자 (User 모델 참조)
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true         // 필수 - 반드시 소유자가 있어야 함
  },
  
  // ==================== 멤버 관리 ====================
  
  // 워크스페이스 참여 멤버들
  members: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },  // User 모델 참조
    email: String,         // 멤버 이메일 (캐시용)
    name: String,          // 멤버 이름 (캐시용)
    
    // 멤버 권한 레벨
    role: {
      type: String,
      enum: ['admin', 'member', 'viewer'],  // 관리자, 멤버, 뷰어
      default: 'member'    // 기본값: 일반 멤버
    },
    
    // 멤버 현재 상태
    status: {
      type: String,
      enum: ['online', 'away', 'offline'],  // 온라인, 자리비움, 오프라인
      default: 'offline'   // 기본값: 오프라인
    },
    
    // 워크스페이스 참여 시간
    joinedAt: { type: Date, default: Date.now },
    
    // 마지막 활동 시간
    lastActive: { type: Date, default: Date.now }
  }],
  
  // ==================== 워크스페이스 설정 ====================
  
  // 각종 워크스페이스 설정값들
  settings: {
    isPublic: { 
      type: Boolean, 
      default: false       // 기본값: 비공개 워크스페이스
    },
    allowInvites: { 
      type: Boolean, 
      default: true        // 기본값: 초대 허용
    },
    notifications: { 
      type: Boolean, 
      default: true        // 기본값: 알림 활성화
    }
  },
  
  // ==================== 메타데이터 ====================
  
  // 워크스페이스 생성 시간
  createdAt: { type: Date, default: Date.now },
  
  // 워크스페이스 최종 수정 시간
  updatedAt: { type: Date, default: Date.now }
});

// ==================== 가상 필드 (Virtual Fields) ====================
// 실제 DB에 저장되지 않고 동적으로 계산되는 필드들

// 전체 멤버 수 계산
workspaceSchema.virtual('memberCount').get(function() {
  return this.members ? this.members.length : 0;
});

// 현재 온라인 멤버 수 계산
workspaceSchema.virtual('onlineCount').get(function() {
  return this.members ? this.members.filter(m => m.status === 'online').length : 0;
});

// ==================== 미들웨어: 수정 시간 자동 업데이트 ====================
// 워크스페이스가 저장될 때마다 수정 시간을 현재 시간으로 자동 업데이트
workspaceSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Workspace 모델 생성 및 내보내기
module.exports = mongoose.model('Workspace', workspaceSchema);

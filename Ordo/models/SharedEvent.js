// ==================== SharedEvent 모델 정의 ====================
// 워크스페이스에서 공유되는 팀 이벤트를 저장하는 MongoDB 스키마

const mongoose = require("mongoose");

// 공유 이벤트 스키마 정의
const sharedEventSchema = new mongoose.Schema({
  // ==================== 이벤트 기본 정보 ====================
  
  // 이벤트 제목 (필수)
  title: { type: String, required: true },
  
  // 이벤트 상세 설명
  description: String,
  
  // ==================== 워크스페이스 연결 ====================
  
  // 이벤트가 속한 워크스페이스 (Workspace 모델 참조) - 필수
  workspace: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workspace',
    required: true         // 필수 - 반드시 워크스페이스에 속해야 함
  },
  
  // ==================== 이벤트 일정 ====================
  
  // 이벤트 시작 날짜 및 시간 (필수)
  startDate: { type: Date, required: true },
  
  // 이벤트 종료 날짜 및 시간 (필수)
  endDate: { type: Date, required: true },
  
  // 종일 이벤트 여부
  allDay: { 
    type: Boolean, 
    default: false         // 기본값: 시간 지정 이벤트
  },
  
  // ==================== 장소 정보 ====================
  
  // 이벤트 장소/위치
  location: String,
  
  // ==================== 참가자 관리 ====================
  
  // 이벤트 참가자들
  participants: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },  // User 모델 참조
    name: String,          // 참가자 이름 (캐시용)
    email: String,         // 참가자 이메일 (캐시용)
    
    // 참가 확인 상태
    status: {
      type: String,
      enum: ['confirmed', 'pending', 'declined'],  // 확인됨, 대기중, 거절
      default: 'pending'   // 기본값: 응답 대기중
    }
  }],
  
  // ==================== 이벤트 분류 및 우선순위 ====================
  
  // 이벤트 카테고리
  category: { 
    type: String, 
    default: 'meeting'     // 기본값: 미팅
  },
  
  // 이벤트 우선순위
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],  // 낮음, 보통, 높음
    default: 'medium'      // 기본값: 보통
  },
  
  // ==================== 알림 설정 ====================
  
  // 이벤트 알림 설정들
  reminders: [{
    type: { 
      type: String, 
      enum: ['email', 'notification']  // 이메일, 앱 알림
    },
    minutes: Number        // 이벤트 시작 전 몇 분 전에 알림
  }],
  
  // ==================== 반복 이벤트 설정 ====================
  
  // 반복 이벤트 여부
  isRecurring: { 
    type: Boolean, 
    default: false         // 기본값: 일회성 이벤트
  },
  
  // 반복 설정 (반복 이벤트일 경우)
  recurrence: {
    frequency: { 
      type: String, 
      enum: ['daily', 'weekly', 'monthly']  // 매일, 매주, 매월
    },
    interval: Number,      // 반복 간격 (예: 2주마다 = interval: 2)
    endDate: Date         // 반복 종료 날짜
  },
  
  // ==================== 생성자 및 메타데이터 ====================
  
  // 이벤트 생성자 (User 모델 참조) - 필수
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true         // 필수 - 반드시 생성자가 있어야 함
  },
  
  // 이벤트 생성 시간
  createdAt: { type: Date, default: Date.now },
  
  // 이벤트 최종 수정 시간
  updatedAt: { type: Date, default: Date.now }
});

// ==================== 미들웨어: 수정 시간 자동 업데이트 ====================
// 이벤트가 저장될 때마다 수정 시간을 현재 시간으로 자동 업데이트
sharedEventSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// SharedEvent 모델 생성 및 내보내기
module.exports = mongoose.model('SharedEvent', sharedEventSchema);

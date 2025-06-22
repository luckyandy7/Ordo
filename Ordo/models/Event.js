// ==================== Event 모델 정의 ====================
// 사용자의 개인 일정/이벤트를 저장하는 MongoDB 스키마

const mongoose = require("mongoose");

// 이벤트 스키마 정의
const eventSchema = new mongoose.Schema({
  // ==================== 사용자 연결 ====================
  
  // 이벤트 소유자 (User 모델 참조)
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",           // User 컬렉션 참조
    required: true,        // 필수 - 반드시 소유자가 있어야 함
  },
  
  // ==================== 이벤트 기본 정보 ====================
  
  // 이벤트 제목/명칭
  title: {
    type: String,
    required: true,        // 필수 입력 필드
  },
  
  // 이벤트 시작 날짜 및 시간
  startDate: {
    type: Date,
    required: true,        // 필수 - 시작 시간은 반드시 필요
  },
  
  // 이벤트 종료 날짜 및 시간
  endDate: {
    type: Date,
    required: true,        // 필수 - 종료 시간은 반드시 필요
  },
  
  // ==================== 이벤트 시각적 속성 ====================
  
  // 이벤트 표시 색상 (캘린더에서 구분용)
  color: {
    type: String,
    default: "#FFE5E5",    // 기본값: 연한 분홍색
  },
  
  // ==================== 그룹화 및 분류 ====================
  
  // 그룹 ID (관련된 이벤트들을 묶어서 관리)
  groupId: {
    type: String,
    default: null,         // 기본값: 그룹 없음 (단독 이벤트)
    index: true,           // 검색 성능 향상을 위한 인덱스
  },
  
  // ==================== 메타데이터 ====================
  
  // 이벤트 생성 시간 (자동 기록)
  createdAt: {
    type: Date,
    default: Date.now,     // 현재 시간을 기본값으로 설정
  },
});

// Event 모델 생성 및 내보내기
module.exports = mongoose.model("Event", eventSchema);

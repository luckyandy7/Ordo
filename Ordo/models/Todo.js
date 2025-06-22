// ==================== Todo 모델 정의 ====================
// 간단한 할 일 목록을 저장하는 MongoDB 스키마

const mongoose = require('mongoose');

// 할 일 스키마 정의 (간단한 구조)
const todoSchema = new mongoose.Schema({
  // ==================== 할 일 기본 정보 ====================
  
  // 할 일 제목/내용 (필수)
  title: { 
    type: String, 
    required: true         // 필수 입력 필드
  },
  
  // ==================== 완료 상태 관리 ====================
  
  // 완료 여부 플래그
  completed: { 
    type: Boolean, 
    default: false         // 기본값: 미완료 상태
  },
  
  // ==================== 메타데이터 ====================
  
  // 할 일 생성 시간 (자동 기록)
  createdAt: { 
    type: Date, 
    default: Date.now      // 현재 시간을 기본값으로 설정
  }
});

// Todo 모델 생성 및 내보내기
module.exports = mongoose.model('Todo', todoSchema);

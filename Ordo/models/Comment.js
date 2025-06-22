// ==================== Comment 모델 정의 ====================
// 게시글에 달리는 댓글을 저장하는 MongoDB 스키마

const mongoose = require("mongoose");

// 댓글 스키마 정의 (간단한 구조)
const commentSchema = new mongoose.Schema({
  // ==================== 게시글 연결 ====================
  
  // 댓글이 달린 게시글 ID (Post 모델 참조)
  postId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Post"            // Post 컬렉션 참조
  },
  
  // ==================== 댓글 기본 정보 ====================
  
  // 댓글 작성자 이름
  author: String,
  
  // 댓글 내용
  text: String,
  
  // ==================== 메타데이터 ====================
  
  // 댓글 작성 시간 (자동 기록)
  createdAt: { 
    type: Date, 
    default: Date.now      // 현재 시간을 기본값으로 설정
  },
});

// Comment 모델 생성 및 내보내기
module.exports = mongoose.model("Comment", commentSchema);

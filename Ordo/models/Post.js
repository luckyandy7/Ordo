// ==================== Post 모델 정의 ====================
// 커뮤니티 게시글을 저장하는 MongoDB 스키마

const mongoose = require("mongoose");

// 게시글 스키마 정의
const postSchema = new mongoose.Schema({
  // ==================== 게시글 기본 정보 ====================
  
  // 게시글 제목 (필수)
  title: { type: String, required: true },
  
  // 게시글 본문 내용 (필수)
  content: { type: String, required: true },
  
  // 게시글 작성자 이름 (필수)
  author: { type: String, required: true },
  
  // ==================== 분류 및 태그 ====================
  
  // 게시글 카테고리
  category: { 
    type: String, 
    default: "tips"        // 기본값: 팁 카테고리
  },
  
  // 게시글 태그들 (검색 및 필터링용)
  tags: [String],
  
  // ==================== 이미지 첨부 관리 ====================
  
  // 게시글에 첨부된 이미지들
  images: [
    {
      fileId: String,      // 파일 고유 ID
      originalName: String, // 원본 파일명
      url: String,         // 이미지 접근 URL
      uploadedAt: { 
        type: Date, 
        default: Date.now  // 업로드 시간
      },
    },
  ],
  
  // ==================== 게시글 통계 ====================
  
  // 조회수
  views: { 
    type: Number, 
    default: 0             // 기본값: 0회
  },
  
  // 좋아요 목록 (사용자 정보 포함)
  likes: [
    {
      userId: String,      // 좋아요를 누른 사용자 ID
      userName: String,    // 좋아요를 누른 사용자 이름
      createdAt: { 
        type: Date, 
        default: Date.now  // 좋아요 누른 시간
      },
    },
  ],
  
  // 좋아요 총 개수 (자동 계산됨)
  likesCount: { 
    type: Number, 
    default: 0             // 기본값: 0개
  },
  
  // 댓글 개수 (별도 Comment 모델로 관리)
  comments: { 
    type: Number, 
    default: 0             // 기본값: 0개
  },
  
  // ==================== 메타데이터 ====================
  
  // 게시글 생성 시간
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  
  // 게시글 최종 수정 시간
  updatedAt: { 
    type: Date, 
    default: Date.now 
  },
});

// ==================== 미들웨어: 자동 계산 및 업데이트 ====================
// 게시글 저장 전에 실행되는 미들웨어
postSchema.pre("save", function (next) {
  // 좋아요 수 자동 계산 (likes 배열의 길이)
  this.likesCount = this.likes ? this.likes.length : 0;
  
  // 수정 시간 자동 업데이트
  this.updatedAt = new Date();
  
  next();
});

// Post 모델 생성 및 내보내기
module.exports = mongoose.model("Post", postSchema);

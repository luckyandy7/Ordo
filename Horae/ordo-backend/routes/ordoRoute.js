/**
 * ============================================
 * 🛣️ HORAE AI 라우트 정의 파일
 * ============================================
 * 
 * 📋 목적: Express.js 기반 RESTful API 엔드포인트 정의
 * 🎯 기능:
 *   - AI 일정 최적화 API 라우팅
 *   - 사용자 요청을 적절한 컨트롤러로 연결
 *   - API 문서화 및 헬스 체크 제공
 * 
 * 🔧 주요 라우트:
 *   - POST /schedule/:date - 특정 날짜 일정 최적화
 *   - POST /feedback - 일정 피드백 생성
 *   - POST /daily - 일일 조언 생성
 *   - POST /recommend/:date - 일정 추천
 *   - POST /suggestions/:date - 다중 최적화 옵션
 *   - GET /health - 서버 상태 확인
 * 
 * 작성일: 2024년
 * 작성자: HORAE 개발팀
 * 버전: 1.0
 */

// 📦 Express 라우터 및 컨트롤러 모듈 import
const express = require("express");
const router = express.Router();
const { 
  getOptimizedSchedule,      // 일정 최적화 컨트롤러
  generateScheduleFeedback,  // 피드백 생성 컨트롤러
  generateDailyWisdom,       // 일일 조언 컨트롤러
  generateRecommendations,   // 추천 생성 컨트롤러
  getScheduleSuggestions     // 다중 옵션 컨트롤러
} = require("../controllers/ordoController");

// 📅 스케줄 최적화 API (POST 방식 - 일정 데이터를 body로 전송)
// 예: POST /api/ordo/schedule/2024-06-10
router.post("/schedule/:date", getOptimizedSchedule);

// 💭 스케줄 피드백 생성 API
// 예: POST /api/ordo/feedback
router.post("/feedback", generateScheduleFeedback);

// 🌅 Daily 한마디 생성 API (일일 격려 메시지)
// 예: POST /api/ordo/daily
router.post("/daily", generateDailyWisdom);

// 🎯 스케줄 추천 생성 API (새로운 일정 제안)
// 예: POST /api/ordo/recommend/2024-06-10
router.post("/recommend/:date", generateRecommendations);

// 🔮 스케줄 추천 옵션들 생성 API (다중 최적화 선택지)
// 예: POST /api/ordo/suggestions/2024-06-10
router.post("/suggestions/:date", getScheduleSuggestions);

// 💚 헬스 체크 API (서버 상태 및 사용 가능한 엔드포인트 정보)
router.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "✨ Horae AI 백엔드가 정상 작동 중입니다! 🌟",
    timestamp: new Date().toISOString(),
    version: "1.0",
    server: "HORAE AI Backend",
    
    // 📖 사용 가능한 API 엔드포인트 목록
    endpoints: {
      "POST /api/ordo/schedule/:date": "특정 날짜 스케줄 최적화 - 일정 배열을 body로 전송",
      "POST /api/ordo/feedback": "스케줄 피드백 생성 - 일반적인 조언 제공",
      "POST /api/ordo/daily": "Daily 한마디 생성 - 하루를 위한 격려 메시지",
      "POST /api/ordo/recommend/:date": "스케줄 추천 생성 - 새로운 일정 제안",
      "POST /api/ordo/suggestions/:date": "스케줄 추천 옵션들 생성 - 다중 최적화 선택지",
      "GET /api/ordo/health": "서버 상태 확인 - 현재 API 문서"
    },
    
    // 🤖 AI 시스템 상태
    ai_status: "OpenAI GPT-4 연결 준비 완료",
    features: [
      "일정 최적화",
      "시간 충돌 방지", 
      "우선순위 분석",
      "휴식 시간 제안",
      "생산성 조언"
    ]
  });
});

// 📤 라우터 모듈 내보내기
module.exports = router;

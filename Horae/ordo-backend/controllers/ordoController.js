/**
 * ============================================
 * 🎯 HORAE AI 컨트롤러 - 일정 최적화 엔진
 * ============================================
 * 
 * 📋 목적: 클라이언트 요청을 처리하고 AI 엔진과 연결하는 중간 계층
 * 🎯 기능:
 *   - REST API 엔드포인트 로직 처리
 *   - 입력 데이터 검증 및 전처리
 *   - AI 엔진 호출 및 결과 포매팅
 *   - 에러 핸들링 및 사용자 친화적 응답
 * 
 * 🔧 주요 엔드포인트:
 *   - GET /optimize/:date - 특정 날짜 일정 최적화
 *   - POST /daily-advice - 일일 조언 생성
 *   - GET /suggestions - 일정 개선 제안
 * 
 * 작성일: 2024년
 * 작성자: HORAE 개발팀
 * 버전: 1.0
 */

// 🤖 HORAE AI 최적화 엔진 모듈 import
const optimizeSchedule = require("../ai/optimizeSchedule");

/**
 * ============================================
 * 📅 특정 날짜 최적화된 스케줄 반환 API
 * ============================================
 * 사용자의 일정을 분석하여 AI 기반 최적화 조언 제공
 * 
 * @route POST /api/optimize/:date
 * @param {Object} req - Express 요청 객체
 * @param {Object} res - Express 응답 객체
 * @returns {Object} 최적화된 일정과 AI 조언
 */
const getOptimizedSchedule = async (req, res) => {
  try {
    // 📥 요청 데이터 추출
    const { date } = req.params;     // URL 파라미터에서 날짜 추출
    const { schedule } = req.body;   // 요청 본문에서 일정 배열 추출

    console.log(`🎯 일정 최적화 요청 시작: ${date}`);
    console.log(`📊 받은 일정 수: ${schedule ? schedule.length : 0}`);

    // 🔍 기본 입력 검증 (데이터 타입 확인)
    if (!schedule || !Array.isArray(schedule)) {
      console.log("❌ 잘못된 스케줄 형식 감지");
      return res.status(400).json({ 
        success: false,
        error: "올바른 스케줄 형식이 아닙니다. 배열 형태로 보내주세요.",
        code: "INVALID_FORMAT"
      });
    }

    // 📊 빈 스케줄 처리 (사용자 경험 개선)
    if (schedule.length === 0) {
      console.log("📭 빈 스케줄 요청 처리");
      return res.status(400).json({ 
        success: false,
        error: "오늘 일정이 없어서 최적화할 내용이 없습니다. 먼저 일정을 추가해주세요.",
        code: "EMPTY_SCHEDULE",
        suggestion: "새로운 일정을 추가한 후 다시 시도해보세요."
      });
    }

    // 🧹 스케줄 데이터 정제 (유효한 항목만 필터링)
    const validSchedule = schedule.filter(item => 
      item && (item.title || item.start_time || item.end_time)
    );

    // ✅ 유효성 검증 (정제 후 빈 데이터 확인)
    if (validSchedule.length === 0) {
      console.log("❌ 유효한 스케줄 항목 없음");
      return res.status(400).json({ 
        success: false,
        error: "유효한 스케줄 항목이 없습니다. 제목이나 시간 정보를 확인해주세요.",
        code: "NO_VALID_ITEMS"
      });
    }

    console.log(`📅 ${date} 날짜의 스케줄 최적화 요청 처리 중...`);
    console.log(`📝 유효한 스케줄 항목 수: ${validSchedule.length}`);

    // 🤖 HORAE AI 엔진 호출 (최적화 모드)
    const optimizedFeedback = await optimizeSchedule(validSchedule, "optimize");

    // 📤 성공 응답 반환 (구조화된 JSON 형태)
    res.json({
      success: true,
      date,
      message: optimizedFeedback,
      originalScheduleCount: validSchedule.length,
      processedAt: new Date().toISOString(),
      aiEngine: "HORAE v1.0"
    });

  } catch (error) {
    // 🚨 에러 처리 및 사용자 친화적 응답
    console.error("❌ 스케줄 최적화 중 오류:", error.message);
    console.error("🔍 상세 오류:", error.stack);
    
    res.status(500).json({
      success: false,
      error: error.message || "스케줄 최적화 중 오류가 발생했습니다.",
      code: "OPTIMIZATION_ERROR",
      // 개발 환경에서만 상세 오류 정보 제공 (보안 고려)
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * ============================================
 * 💭 스케줄 피드백 생성 API
 * ============================================
 * 사용자 일정에 대한 일반적인 조언과 피드백 제공
 * 
 * @route POST /api/feedback
 * @param {Object} req - Express 요청 객체
 * @param {Object} res - Express 응답 객체
 * @returns {Object} AI가 생성한 일정 피드백
 */
const generateScheduleFeedback = async (req, res) => {
  try {
    const { schedule } = req.body;

    console.log("🤖 스케줄 피드백 생성 요청 받음");

    // 📊 입력 데이터 검증
    if (!schedule || !Array.isArray(schedule)) {
      console.log("❌ 잘못된 스케줄 데이터 형식");
      return res.status(400).json({ 
        success: false,
        error: "올바른 스케줄 형식이 아닙니다. 배열 형태로 보내주세요.",
        code: "INVALID_FORMAT"
      });
    }

    console.log(`📝 피드백 대상 일정: ${schedule.length}개`);

    // 🤖 AI 엔진을 통한 피드백 생성
    const feedback = await optimizeSchedule(schedule, "optimize");

    // 📤 성공 응답
    res.json({
      success: true,
      message: feedback,
      scheduleCount: schedule.length,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    // 🚨 피드백 생성 실패 처리
    console.error("❌ 피드백 생성 중 오류:", error.message);
    res.status(500).json({
      success: false,
      error: error.message || "피드백 생성 중 오류가 발생했습니다.",
      code: "FEEDBACK_ERROR",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * ============================================
 * 🌅 일일 명언/조언 생성 API
 * ============================================
 * 사용자의 하루 일정을 바탕으로 맞춤형 격려 메시지 제공
 * 
 * @route POST /api/daily-wisdom
 * @param {Object} req - Express 요청 객체
 * @param {Object} res - Express 응답 객체
 * @returns {Object} 하루를 위한 AI 조언과 격려
 */
const generateDailyWisdom = async (req, res) => {
  try {
    const { date, schedule } = req.body;

    console.log(`💭 ${date || '오늘'} Daily 한마디 생성 요청`);
    console.log(`📊 분석 대상 일정: ${schedule ? schedule.length : 0}개`);

    // 📝 스케줄이 없어도 Daily 한마디는 생성 가능 (격려 메시지 중심)
    const dailySchedule = Array.isArray(schedule) ? schedule : [];

    // 🤖 HORAE AI 엔진을 통한 일일 조언 생성 (daily 모드)
    const dailyWisdom = await optimizeSchedule(dailySchedule, "daily");

    // 📤 성공 응답 (날짜 정보와 함께)
    res.json({
      success: true,
      message: dailyWisdom,
      date: date || new Date().toISOString().split('T')[0],  // 기본값: 오늘 날짜
      scheduleCount: dailySchedule.length,
      generatedAt: new Date().toISOString(),
      type: "daily_wisdom"
    });

  } catch (error) {
    // 🚨 Daily 조언 생성 실패 처리
    console.error("❌ Daily 한마디 생성 중 오류:", error.message);
    res.status(500).json({
      success: false,
      error: error.message || "Daily 한마디 생성 중 오류가 발생했습니다.",
      code: "DAILY_WISDOM_ERROR",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * ============================================
 * 🔮 스케줄 추천 옵션들 생성 API
 * ============================================
 * 사용자 일정에 대한 다양한 최적화 선택지 제공
 * 사용자가 여러 옵션 중 선택할 수 있도록 지원
 * 
 * @route POST /api/suggestions/:date
 * @param {Object} req - Express 요청 객체
 * @param {Object} res - Express 응답 객체
 * @returns {Object} 다양한 최적화 옵션들
 */
const getScheduleSuggestions = async (req, res) => {
  try {
    const { date } = req.params;
    const { events } = req.body;

    console.log(`✨ ${date} 날짜의 일정 추천 옵션 요청 받음`);
    console.log(`📝 분석할 일정 수: ${events ? events.length : 0}개`);

    // 🔍 입력 데이터 검증
    if (!events || !Array.isArray(events)) {
      console.log("❌ 잘못된 events 형식");
      return res.status(400).json({ 
        success: false,
        error: "올바른 일정 형식이 아닙니다. events 배열을 보내주세요.",
        code: "INVALID_EVENTS_FORMAT"
      });
    }

    if (events.length === 0) {
      console.log("📭 빈 events 배열");
      return res.status(400).json({ 
        success: false,
        error: "추천할 일정이 없습니다. 먼저 일정을 추가해주세요.",
        code: "EMPTY_EVENTS"
      });
    }

    // 🤖 AI 엔진을 통한 다중 추천 옵션 생성 (suggestions 모드)
    const suggestions = await optimizeSchedule(events, "suggestions");

    // 📤 성공 응답 (추천 옵션들과 메타데이터)
    res.json({
      success: true,
      date,
      ...suggestions, // type, options, message 포함
      originalCount: events.length,
      processedAt: new Date().toISOString(),
      version: "HORAE v1.0"
    });

  } catch (error) {
    // 🚨 추천 옵션 생성 실패 처리
    console.error("❌ 일정 추천 옵션 생성 중 오류:", error.message);
    res.status(500).json({
      success: false,
      error: error.message || "일정 추천 옵션 생성 중 오류가 발생했습니다.",
      code: "SUGGESTIONS_ERROR",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * ============================================
 * 🎯 스케줄 추천 생성 API
 * ============================================
 * 기존 일정을 분석하여 새로운 일정 추천 제공
 * 일정 개선 및 효율성 향상을 위한 제안
 * 
 * @route POST /api/recommend/:date
 * @param {Object} req - Express 요청 객체
 * @param {Object} res - Express 응답 객체
 * @returns {Object} AI가 생성한 일정 추천사항
 */
const generateRecommendations = async (req, res) => {
  try {
    const { date } = req.params;
    const { events } = req.body;

    console.log(`🎯 ${date} 날짜의 일정 추천 요청 받음`);
    console.log(`📝 분석할 일정 수: ${events ? events.length : 0}개`);

    // 🔍 입력 데이터 검증
    if (!events || !Array.isArray(events)) {
      console.log("❌ 잘못된 events 형식");
      return res.status(400).json({ 
        success: false,
        error: "올바른 일정 형식이 아닙니다. events 배열을 보내주세요.",
        code: "INVALID_EVENTS_FORMAT"
      });
    }

    if (events.length === 0) {
      console.log("📭 빈 events 배열");
      return res.status(400).json({ 
        success: false,
        error: "추천할 일정이 없습니다. 먼저 일정을 추가해주세요.",
        code: "EMPTY_EVENTS"
      });
    }

    // 🤖 AI 엔진을 통한 일정 추천 생성 (recommend 모드)
    const recommendations = await optimizeSchedule(events, "recommend");

    // 📤 성공 응답
    res.json({
      success: true,
      date,
      recommendations: recommendations,
      originalCount: events.length,
      generatedAt: new Date().toISOString(),
      type: "schedule_recommendations"
    });

  } catch (error) {
    // 🚨 추천 생성 실패 처리
    console.error("❌ 일정 추천 생성 중 오류:", error.message);
    res.status(500).json({
      success: false,
      error: error.message || "일정 추천 생성 중 오류가 발생했습니다.",
      code: "RECOMMENDATIONS_ERROR",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * ============================================
 * 📤 컨트롤러 함수들 내보내기
 * ============================================
 * Express 라우터에서 사용할 수 있도록 모든 컨트롤러 함수 export
 */
module.exports = {
  getOptimizedSchedule,      // 일정 최적화
  generateScheduleFeedback,  // 피드백 생성
  generateDailyWisdom,       // 일일 조언
  generateRecommendations,   // 일정 추천
  getScheduleSuggestions     // 추천 옵션들
}; 
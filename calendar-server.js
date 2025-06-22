const express = require("express");
const cors = require("cors");
const { optimizeSchedule } = require("./optimizeSchedule");

const app = express();
const PORT = 3001;

// 미들웨어 설정
app.use(cors());
app.use(express.json());

console.log("📅 캘린더 API 서버 초기화 중...");

// 일정 최적화 엔드포인트
app.post("/api/ordo/schedule/:date", async (req, res) => {
  try {
    const { date } = req.params;
    const { events } = req.body;

    console.log(`📅 ${date} 날짜의 스케줄 최적화 요청 받음`);
    console.log(`📝 스케줄 항목 수: ${events?.length || 0}`);

    if (!events || events.length === 0) {
      return res.json({
        success: true,
        message:
          "오늘은 여유로운 하루네요. ✨ 새로운 시작을 위한 완벽한 날입니다! 오늘도 좋은 하루 되세요 😊",
        type: "optimize",
      });
    }

    const result = await optimizeSchedule(events, "optimize");
    res.json(result);
  } catch (error) {
    console.error("스케줄 최적화 오류:", error);
    res.status(500).json({
      success: false,
      error: "스케줄 최적화 중 오류가 발생했습니다",
      fallback:
        "체계적으로 계획하셨네요. 중요한 일정부터 처리하시고, 적절한 휴식도 잊지 마세요. 오늘도 좋은 하루 되세요 😊",
    });
  }
});

// 🆕 일정 추천 엔드포인트
app.post("/api/ordo/recommend/:date", async (req, res) => {
  try {
    const { date } = req.params;
    const { events } = req.body;

    console.log(`🎯 ${date} 날짜의 일정 추천 요청 받음`);
    console.log(`📝 분석할 일정 수: ${events?.length || 0}`);

    if (!events || events.length === 0) {
      return res.json({
        success: true,
        type: "recommend",
        data: {
          message: "아직 일정이 없네요. ✨ 새로운 계획을 세워보세요!",
          recommendations: [],
          summary: "호라이가 더 나은 일정 계획을 도와드릴게요 🌟",
        },
      });
    }

    const result = await optimizeSchedule(events, "recommend");
    res.json(result);
  } catch (error) {
    console.error("일정 추천 오류:", error);
    res.status(500).json({
      success: false,
      error: "일정 추천 중 오류가 발생했습니다",
      type: "recommend",
      fallback: {
        message: "일정 분석에 시간이 걸리고 있어요. 잠시만 기다려주세요 ✨",
        recommendations: events.map((item) => ({
          original: {
            title: item.title,
            time: `${item.start_time}-${item.end_time}`,
            reason: "분석 준비 중",
          },
          suggested: {
            title: item.title,
            start_time: item.start_time,
            end_time: item.end_time,
            reason: "최적화 중입니다",
          },
        })),
        summary:
          "호라이가 더 나은 계획을 세우고 있어요 🌟 오늘도 좋은 하루 되세요 😊",
      },
    });
  }
});

// Daily 한마디 엔드포인트
app.post("/api/ordo/daily", async (req, res) => {
  try {
    const { events, date } = req.body;

    console.log(`💭 ${date} Daily 한마디 생성 요청`);
    console.log(`📊 일정 수: ${events?.length || 0}개`);

    const result = await optimizeSchedule(events || [], "daily");
    res.json(result);
  } catch (error) {
    console.error("Daily 한마디 오류:", error);
    res.status(500).json({
      success: false,
      error: "Daily 한마디 생성 중 오류가 발생했습니다",
      fallback:
        "오늘도 의미 있는 하루가 되길 바라요. ✨ 호라이가 언제나 함께 할게요. 오늘도 좋은 하루 되세요 😊",
    });
  }
});

// 헬스 체크 엔드포인트
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    message: "📅 캘린더 API 서버가 정상 작동 중입니다!",
    timestamp: new Date().toISOString(),
    port: PORT,
  });
});

// 루트 엔드포인트
app.get("/", (req, res) => {
  res.json({
    message: "📅 Ordo 캘린더 API 서버",
    version: "1.0.0",
    endpoints: [
      "POST /api/ordo/schedule/:date - 일정 최적화",
      "POST /api/ordo/recommend/:date - 일정 추천",
      "POST /api/ordo/daily - Daily 한마디",
      "GET /health - 헬스 체크",
    ],
  });
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`📅 캘린더 API 서버가 포트 ${PORT}에서 실행 중`);
  console.log(`🌐 서버 주소: http://localhost:${PORT}`);
  console.log(`💚 헬스 체크: http://localhost:${PORT}/health`);
});

module.exports = app;

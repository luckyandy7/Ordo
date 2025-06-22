// ============================================
// 🌟 HORAE AI 백엔드 서버
// ============================================
// 시간 관리 AI "호라이(HORAE)"의 백엔드 서비스
// OpenAI GPT-4를 활용한 일정 최적화 및 지능형 스케줄링 시스템

const express = require("express");         // 웹 서버 프레임워크
const cors = require("cors");               // Cross-Origin Resource Sharing 설정
const path = require("path");               // 파일 경로 유틸리티
const { OpenAI } = require("openai");       // OpenAI API 클라이언트
const app = express();

// ============================================
// 🔧 환경 설정 및 초기화
// ============================================
// gpt.env 파일에서 OpenAI API 키 등 환경 변수 로드
require("dotenv").config({ path: './gpt.env' });

// 🤖 OpenAI 클라이언트 초기화 (GPT-4 모델 사용)
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY    // API 키는 환경 변수에서 안전하게 로드
});

// ============================================
// 🌐 미들웨어 설정
// ============================================
// CORS 설정 - 프론트엔드와의 통신 허용
app.use(cors({
  origin: process.env.FRONTEND_URL || "*",  // 허용할 도메인 (환경변수 또는 모든 도메인)
  credentials: true                         // 쿠키 및 인증 정보 포함 허용
}));

// JSON 및 URL 인코딩 데이터 파싱 (최대 10MB)
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// 📊 요청 로깅 미들웨어 - 모든 API 호출을 콘솔에 기록
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// ============================================
// 🧪 AI 모델 사전 테스트 함수
// ============================================
// 서버 시작 시 OpenAI API 연결 상태를 확인하는 테스트 함수
async function testOpenAI() {
  try {
        console.log("🤖 OpenAI API 연결 테스트 시작...");
    
        // GPT-4 모델로 간단한 테스트 메시지 전송
        const completion = await openai.chat.completions.create({
            model: "gpt-4o",                    // GPT-4 최신 모델 사용
            messages: [
                {
                    role: "system",             // 시스템 프롬프트 - AI의 역할 정의
                    content: "당신은 시간의 여신 호라이입니다."
                },
                {
                    role: "user",               // 사용자 메시지
                    content: "안녕하세요"
                }
            ],
            max_tokens: 50                      // 응답 토큰 수 제한 (테스트용)
    });
    
        // 응답이 정상적으로 도착했는지 확인
        if (completion.choices[0].message) {
            console.log("✅ OpenAI API 연결 테스트 성공!");
    }
  } catch (error) {
        console.log("⚠️ OpenAI API 연결 테스트 실패:", error.message);
  }
}

// ============================================
// 📡 라우트 설정
// ============================================
// HORAE AI 관련 모든 API 엔드포인트를 /api/ordo 경로로 연결
const ordoRoutes = require("./routes/ordoRoute");
app.use("/api/ordo", ordoRoutes);

// ============================================
// 🏠 루트 엔드포인트 - 서비스 정보 제공
// ============================================
// 메인 페이지 접속 시 HORAE AI 서비스 정보를 JSON으로 응답
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "🌟 Horae AI 백엔드에 오신 것을 환영합니다!",
    version: "1.0.0",                                    // 서비스 버전
    description: "시간의 여신 호라이가 당신의 일정을 최적화합니다",
    documentation: "/api/ordo/health",                   // 헬스체크 엔드포인트
    features: [                                          // 제공하는 주요 기능들
      "🎯 일정 최적화 분석",
      "💭 Daily 한마디",
            "⚡ GPT-4o 모델 사용",
      "🇰🇷 한국어 지원"
    ]
  });
});

// ============================================
// 🚫 404 에러 핸들링 - 존재하지 않는 경로 처리
// ============================================
// 정의되지 않은 모든 경로에 대해 404 에러와 함께 사용 가능한 엔드포인트 안내
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    error: "요청하신 엔드포인트를 찾을 수 없습니다.",
    availableEndpoints: [                                // 사용 가능한 API 목록
      "GET /",                                          // 서비스 정보
      "GET /api/ordo/health",                           // 헬스체크
      "POST /api/ordo/schedule/:date",                  // 일정 최적화
      "POST /api/ordo/feedback",                        // 피드백 수집
      "POST /api/ordo/daily"                            // 일일 조언
    ]
  });
});

// ============================================
// ⚠️ 전역 에러 핸들링 미들웨어
// ============================================
// 예상치 못한 서버 오류를 안전하게 처리하고 사용자에게 적절한 응답 제공
app.use((err, req, res, next) => {
  console.error("❌ 서버 오류:", err.stack);
  res.status(500).json({
    success: false,
    error: "서버 내부 오류가 발생했습니다.",
    // 개발 환경에서만 상세 에러 메시지 노출 (보안상 이유)
    details: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// ============================================
// 🚀 서버 시작
// ============================================
const PORT = process.env.PORT || 3000;  // 포트는 환경변수 또는 기본값 3000
const server = app.listen(PORT, () => {
  console.log(`🚀 Horae AI 백엔드 서버가 포트 ${PORT}에서 실행 중`);
  console.log(`📍 서버 주소: http://localhost:${PORT}`);
  console.log(`💡 헬스 체크: http://localhost:${PORT}/api/ordo/health`);
  
    // 🧪 서버 시작 2초 후 OpenAI API 연결 테스트 실행
  setTimeout(() => {
        testOpenAI();
    }, 2000);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM 신호를 받았습니다. 서버를 우아하게 종료합니다...');
  server.close(() => {
    console.log('Horae AI 서버가 종료되었습니다.');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT 신호를 받았습니다. 서버를 우아하게 종료합니다...');
  server.close(() => {
    console.log('Horae AI 서버가 종료되었습니다.');
    process.exit(0);
  });
});

module.exports = app;
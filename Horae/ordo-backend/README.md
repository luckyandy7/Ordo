# 🤖 HORAE AI 백엔드 서비스

> **시간의 여신 호라이가 선사하는 지능형 일정 최적화 솔루션**

OpenAI GPT-4 기반 AI 엔진으로 사용자의 일정을 분석하고 개인 맞춤형 최적화 조언을 제공하는 백엔드 서비스입니다.

---

## 📋 프로젝트 개요

**HORAE AI**는 그리스 신화의 시간과 계절의 여신들인 호라이(Horae)의 지혜를 현대적으로 재해석한 AI 서비스입니다. 

- 🎯 **목표**: 개인의 생산성 향상과 워라밸 개선
- 🤖 **기술**: OpenAI GPT-4 Turbo 모델 활용
- 🌏 **언어**: 한국어 중심의 자연스러운 소통
- 💝 **철학**: 효율성과 인간다움의 조화

---

## ✨ 핵심 기능

### 🎯 AI 기반 일정 분석
- **시간 충돌 감지**: 겹치는 일정 자동 탐지 및 해결책 제안
- **우선순위 분석**: 일정 제목 키워드 분석을 통한 중요도 판별
- **효율성 평가**: 이동 시간, 휴식 시간 고려한 종합 분석

### 🔮 다양한 최적화 모드
- **optimize**: 기존 일정 개선 조언
- **daily**: 하루 시작을 위한 격려 메시지
- **suggestions**: 다중 최적화 옵션 제공
- **recommend**: 새로운 일정 추천

### 🛡️ 강력한 안정성
- **Fallback 메커니즘**: AI 연결 실패 시 로컬 추천 제공
- **입력 검증**: 철저한 데이터 유효성 검사
- **에러 핸들링**: 사용자 친화적 오류 메시지

---

## 🚀 설치 및 실행

### 📋 사전 요구사항

```bash
Node.js >= 16.0.0
npm >= 8.0.0
OpenAI API 키
```

### ⚙️ 환경 설정

```bash
# 의존성 설치
npm install

# 환경변수 설정
cp env.example .env
# .env 파일을 수정하여 환경변수 설정

# 개발 서버 실행
npm run dev

# 또는 프로덕션 실행
npm start
```

### Ollama 설정

```bash
# QwQ 모델 설치 (처음 한 번만)
ollama pull qwq:latest

# Ollama 서버 실행
ollama serve
```

## 📡 API 엔드포인트

### 기본 정보
- **Base URL**: `http://localhost:3000`
- **Content-Type**: `application/json`

### 엔드포인트 목록

#### 🏥 헬스 체크
```http
GET /api/ordo/health
```

#### 📅 일정 최적화
```http
POST /api/ordo/schedule/:date
Content-Type: application/json

{
  "schedule": [
    {
      "start_time": "09:00",
      "end_time": "10:30",
      "title": "팀 회의"
    },
    {
      "start_time": "11:00",
      "end_time": "13:00",
      "title": "코딩 작업"
    }
  ],
  "mode": "default"  // optional: "default" | "sample"
}
```

#### 💭 스케줄 피드백
```http
POST /api/ordo/feedback
Content-Type: application/json

{
  "schedule": [...],
  "mode": "sample"
}
```

## 🔧 환경변수

| 변수명 | 기본값 | 설명 |
|--------|--------|------|
| `PORT` | 3000 | 서버 포트 |
| `NODE_ENV` | development | 실행 환경 |
| `FRONTEND_URL` | * | CORS 허용 URL |
| `OLLAMA_HOST` | http://localhost:11434 | Ollama 서버 주소 |
| `OLLAMA_MODEL` | qwq:latest | 사용할 AI 모델 |

## 📁 프로젝트 구조

```
ordo-backend/
├── ai/                     # AI 모듈
│   ├── optimizeSchedule.js # 메인 최적화 로직
│   ├── optimizeSchedule.py # Python 머신러닝 모델
│   └── test_feedback.js    # 테스트 파일
├── controllers/            # 컨트롤러
│   └── ordoController.js   # 메인 컨트롤러
├── routes/                 # 라우팅
│   └── ordoRoute.js        # API 라우트
├── data/                   # 데이터
│   └── schedule_train.csv  # 훈련 데이터
├── server.js               # 메인 서버
├── package.json            # 의존성 관리
└── README.md               # 프로젝트 문서
```

## 🧪 테스트

```bash
# 기본 테스트 실행
node ai/test_feedback.js

# API 테스트 (서버 실행 후)
curl -X POST http://localhost:3000/api/ordo/feedback \
  -H "Content-Type: application/json" \
  -d '{"schedule":[{"start_time":"09:00","end_time":"10:00","title":"회의"}]}'
```

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 라이선스

이 프로젝트는 ISC 라이선스를 따릅니다.

## 🌟 특별 감사

- **Horae (호라이)**: 시간과 질서의 여신, 우리의 영감
- **Alibaba QwQ**: 뛰어난 추론 능력을 제공하는 AI 모델
- **Ollama**: 로컬 AI 모델 실행 환경

---

*"시간은 강물과 같아서, 흘러가지만 질서 속에서 아름다움을 만들어냅니다." - Horae* 
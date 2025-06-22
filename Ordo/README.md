# 🌟 Ordo - 체계적인 일상 관리 플랫폼

> "시간을 정돈하고, 삶을 조직하다"

## ✨ 주요 기능

### 📅 **캘린더 & 일정 관리**

- 직관적인 주간 뷰 캘린더
- 실시간 일정 동기화
- 카테고리별 색상 분류
- 일정 완료 체크 기능

### 🤖 **Horae AI 연동** (NEW!)

- **Horae의 추천 일정**: AI가 오늘의 일정을 분석하여 최적화 제안
- **Daily 한마디**: 호라이의 지혜로운 조언과 격려 메시지
- 실시간 AI 피드백 및 일정 개선 제안

### 👥 **커뮤니티 & 소통**

- 게시판 시스템 (글쓰기, 댓글, 좋아요)
- 실시간 채팅 (Socket.IO 기반)
- 파일 공유 기능 (GridFS)

### 🔐 **인증 & 보안**

- 이메일 로그인
- 카카오/구글 OAuth 2.0
- JWT 토큰 기반 인증

## 🚀 설치 및 실행

### 1. 기본 설정

```bash
# 의존성 설치
npm install

# 환경 변수 설정 (.env 파일 생성)
MONGODB_URI=mongodb://localhost:27017/ordo
JWT_SECRET=your_jwt_secret_key
HORAE_API_URL=http://localhost:3000
PORT=5001
```

### 2. Horae AI 연동 설정 (선택사항)

Horae AI 기능을 사용하려면:

```bash
# Horae 백엔드 디렉토리로 이동
cd ../Horae/ordo-backend

# Horae 의존성 설치
npm install

# Ollama QwQ 모델 설치
ollama pull qwq:latest

# Ollama 서버 실행 (별도 터미널)
ollama serve

# Horae 백엔드 실행
npm start
```

### 3. Ordo 서버 실행

```bash
# Ordo 디렉토리에서
npm start
```

서버가 http://localhost:5001 에서 실행됩니다.

## 🎯 사용법

### 기본 기능

1. **회원가입/로그인**: 이메일 또는 소셜 로그인
2. **일정 추가**: 캘린더에서 시간대 클릭
3. **일정 관리**: 완료 체크, 수정, 삭제
4. **커뮤니티**: 게시판에서 글 작성 및 소통

### 🌟 Horae AI 기능

1. **Horae의 추천 일정**:

   - 플로팅 메뉴의 Horae 버튼 클릭
   - 오늘의 일정이 있어야 사용 가능
   - AI가 일정을 분석하여 최적화 제안

2. **Daily 한마디**:
   - 플로팅 메뉴의 Daily 한마디 버튼 클릭
   - 오늘의 일정 기반으로 맞춤형 조언 제공
   - 일정이 없어도 사용 가능

### 📊 대시보드 위젯

- **오늘의 일정**: 오늘 일정 수와 다음 일정 표시
- **날씨 정보**: 현재 날씨 (기본값)
- **주간 통계**: 완료율과 총 일정 수

### 💬 실시간 채팅

1. 플로팅 메뉴 → Real-time Chat
2. 채팅방 생성 또는 참여
3. 실시간 메시지 및 파일 공유

## 🛠️ 기술 스택

- **Frontend**: Vanilla JavaScript, CSS3 (글래스모피즘)
- **Backend**: Node.js, Express.js
- **Database**: MongoDB Atlas
- **Real-time**: Socket.IO
- **AI**: Horae (Ollama QwQ 모델)
- **Authentication**: JWT + OAuth 2.0
- **File Storage**: GridFS

## 🎨 디자인 시스템

- **브랜딩**: 구리색 (Copper) 테마
- **다크모드**: 자동/수동 전환 지원
- **반응형**: 모바일 친화적 디자인
- **애니메이션**: 부드러운 전환 효과

## 📁 프로젝트 구조

```
Ordo/
├── Main/                   # 메인 애플리케이션
│   ├── index.html         # 캘린더 메인 페이지
│   ├── main.js           # 메인 로직
│   ├── styles.css        # 스타일시트
│   └── js/
│       └── messages.js   # 응원 메시지 시스템
├── Login/                 # 인증 관련
├── Chat/                  # 실시간 채팅
├── board/                 # 커뮤니티 게시판
├── models/                # 데이터 모델
├── routes/                # API 라우트
├── controllers/           # 컨트롤러
└── server.js             # 메인 서버
```

## 🔗 연동 프로젝트

- **Horae**: AI 기반 일정 최적화 백엔드
  - 위치: `../Horae/ordo-backend`
  - 기능: 일정 분석, 최적화 제안, Daily 조언

## 🚨 문제 해결

### Horae 연동 오류

1. **"Horae AI 서비스에 연결할 수 없습니다"**

   - Horae 백엔드가 실행 중인지 확인
   - `http://localhost:3000`에서 서비스 상태 확인

2. **"오늘 일정이 없어서 최적화할 내용이 없습니다"**

   - 캘린더에 오늘 일정을 먼저 추가
   - 최소 1개 이상의 일정 필요

3. **모델 로딩 오류**
   - `ollama pull qwq:latest` 재실행
   - `ollama serve` 실행 상태 확인

### 기본 기능 오류

1. **MongoDB 연결 실패**

   - 네트워크 연결 확인
   - MongoDB Atlas 접근 권한 확인

2. **JWT 토큰 오류**
   - 로그아웃 후 재로그인
   - 브라우저 캐시 삭제

## 📈 향후 계획

- [ ] 모바일 앱 개발
- [ ] 더 많은 AI 기능 추가
- [ ] 팀 협업 기능 강화
- [ ] 외부 캘린더 연동
- [ ] 알림 기능 개선

## 🤝 기여하기

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

---

⚡ **Horae와 함께하는 스마트한 일정 관리를 경험해보세요!**

## 환경 변수 설정

프로젝트를 실행하기 전에 다음 환경 변수를 설정해야 합니다. `.env` 파일을 생성하고 아래 변수들을 설정하세요:

```env
# MongoDB 연결
MONGODB_URI=mongodb://localhost:27017/ordo

# JWT 설정
JWT_SECRET=your_jwt_secret_key

# 서버 포트
PORT=5001
CALENDAR_PORT=3001
HORAE_PORT=3000

# Google OAuth 설정
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:5001/auth/google/callback

# Kakao OAuth 설정
KAKAO_CLIENT_ID=your_kakao_client_id
KAKAO_REDIRECT_URI=http://localhost:5001/auth/kakao/callback

# OpenAI API 설정 (Horae)
OPENAI_API_KEY=your_openai_api_key

# 기타 설정
NODE_ENV=development
```

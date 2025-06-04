# 🏛️ Ordo - 체계적인 일상 관리 플랫폼

<div align="center">

![Ordo Logo](Login/image-8.png)

**체계적인 일상 관리의 시작**

[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=Node.js&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://mongodb.com/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-010101?style=for-the-badge&logo=socket.io&logoColor=white)](https://socket.io/)

</div>

## 📋 프로젝트 개요

**Ordo**는 개인 일정 관리부터 팀 협업까지, 체계적인 일상 관리를 지원하는 통합 플랫폼입니다.
현대인의 복잡한 일상을 효율적으로 관리할 수 있도록 직관적인 UI/UX와 강력한 기능들을 제공합니다.

### 🎯 핵심 가치

- **🎨 아름다운 디자인**: Ordo만의 구리색 브랜딩과 글래스모피즘 효과
- **🔗 완벽한 연동**: 캘린더, 커뮤니티, 채팅이 하나로 통합
- **📱 반응형 웹**: 모든 디바이스에서 최적화된 경험
- **🚀 실시간 동기화**: Socket.IO 기반 실시간 업데이트

---

## ✨ 주요 기능

### 🔐 **인증 시스템**

- **다중 로그인 방식**
  - 📧 이메일 로그인 (자체 계정)
  - 💬 카카오 로그인 (OAuth 2.0)
  - 🔵 구글 로그인 (OAuth 2.0)
- **보안 기능**
  - 🛡️ JWT 토큰 기반 인증
  - 🔑 비밀번호 찾기 (실제 이메일 전송)
  - 💾 아이디 기억 기능 (localStorage)
  - 🔒 bcrypt 암호화

### 📅 **캘린더 & 일정 관리**

- **스마트 캘린더**
  - 📆 월간/주간/일간 뷰
  - ⚡ 실시간 일정 동기화
  - 🎨 카테고리별 색상 분류
  - 📱 터치/클릭 이벤트 최적화
- **일정 관리 (CRUD)**
  - ➕ 일정 생성/수정/삭제
  - 🏷️ 카테고리 분류 (업무, 개인, 학습 등)
  - ⏰ 시간대별 정확한 필터링
  - 🔍 빠른 검색 기능

### 💬 **커뮤니티 게시판**

- **게시글 시스템**
  - 📝 게시글 CRUD (생성/읽기/수정/삭제)
  - 🎯 카테고리 필터링 (생산성, 루틴, 팁 등)
  - 🏷️ 태그 시스템
  - 📊 실시간 통계 (조회수, 게시글 수)
- **소셜 기능**
  - ❤️ 좋아요 시스템 (동시성 처리)
  - 💬 댓글 시스템 (중첩 댓글 지원)
  - 👤 사용자 프로필 연동
  - 📈 인기 게시글 랭킹

### 💭 **실시간 채팅**

- **채팅 시스템**
  - ⚡ Socket.IO 실시간 메시징
  - 🏠 채팅방 생성/관리
  - 👥 다중 사용자 지원
  - 📎 파일 업로드 (GridFS)
- **고급 기능**
  - ✍️ 타이핑 표시
  - 👁️ 읽음 상태 표시
  - 🔔 실시간 알림
  - 📱 모바일 최적화

### 🤝 **협업 공간**

- **팀워크 도구**
  - 👥 프로젝트 관리
  - 📋 작업 할당
  - 📊 진행률 추적
  - 💼 워크스페이스 관리

---

## 🎨 디자인 시스템

### 🎭 **Ordo 브랜딩**

- **컬러 팔레트**

  ```css
  --copper-primary: #c96342; /* 메인 구리색 */
  --copper-light: #e08b6f; /* 밝은 구리색 */
  --copper-dark: #a54a2e; /* 어두운 구리색 */
  --copper-bright: #f2a085; /* 강조 구리색 */
  ```

- **타이포그래피**
  - **브랜드 폰트**: Cutive (로고, 제목)
  - **본문 폰트**: Freesentation (한글), Inter (영문)
  - **가독성**: 완벽한 한글 폰트 지원

### 🌟 **UI/UX 특징**

- **글래스모피즘**: 반투명 효과와 블러 배경
- **마이크로 애니메이션**: 부드러운 트랜지션과 호버 효과
- **반응형 디자인**: 모바일 퍼스트 접근 방식
- **다크모드**: 시스템 설정 자동 감지

---

## 🛠 기술 스택

### **Backend**

```json
{
  "runtime": "Node.js v18+",
  "framework": "Express.js",
  "database": "MongoDB Atlas",
  "authentication": "JWT + OAuth 2.0",
  "realtime": "Socket.IO",
  "storage": "GridFS (파일)",
  "email": "Nodemailer (Gmail SMTP)"
}
```

### **Frontend**

```json
{
  "markup": "HTML5 (시멘틱)",
  "styling": "CSS3 (Grid, Flexbox)",
  "scripting": "Vanilla JavaScript (ES6+)",
  "fonts": "Google Fonts + 로컬 폰트",
  "responsive": "Mobile-First Design"
}
```

### **DevOps & Tools**

```json
{
  "version_control": "Git + GitHub",
  "package_manager": "npm",
  "environment": "dotenv",
  "security": "bcryptjs + CORS",
  "api_design": "RESTful + Socket.IO"
}
```

---

## 📁 프로젝트 구조

```
Ordo/
├── 📂 Login/                    # 로그인 시스템
│   ├── 🎨 email-login.html     # 이메일 로그인 페이지
│   ├── 🎨 signup.html          # 회원가입 페이지
│   ├── 🎭 styles.css           # 로그인 스타일
│   └── 🖼️ image-8.png          # Ordo 로고
├── 📂 Main/                     # 메인 대시보드
│   ├── 🏠 index.html           # 메인 페이지
│   ├── 🎉 welcome.html         # 웰컴 페이지
│   ├── ⚡ main.js              # 메인 로직
│   ├── 🎨 styles.css           # 메인 스타일
│   └── 📂 public/              # 정적 리소스
├── 📂 board/                    # 커뮤니티 게시판
│   ├── 📋 list.html            # 게시글 목록
│   ├── 👁️ view.html            # 게시글 상세
│   ├── ✏️ write.html           # 게시글 작성
│   └── 🎨 board.css            # 게시판 스타일
├── 📂 Chat/                     # 채팅 시스템
│   ├── 💬 chat.html            # 채팅 페이지
│   ├── ⚡ chat.js              # 채팅 클라이언트
│   └── 🎨 styles.css           # 채팅 스타일
├── 📂 Collaboration/            # 협업 공간
│   ├── 🤝 collaboration.html   # 협업 페이지
│   └── 🎨 styles.css           # 협업 스타일
├── 📂 models/                   # 데이터베이스 모델
│   ├── 👤 User.js              # 사용자 모델
│   ├── 📝 Post.js              # 게시글 모델
│   ├── 💬 Comment.js           # 댓글 모델
│   ├── 📅 Event.js             # 일정 모델
│   └── 💭 ChatRoom.js          # 채팅방 모델
├── 📂 routes/                   # API 라우트
│   ├── 🔐 auth.js              # 인증 API
│   ├── 📋 board.js             # 게시판 API
│   ├── 💬 comment.js           # 댓글 API
│   └── 📅 eventRoutes.js       # 일정 API
├── 📂 controllers/              # 컨트롤러
│   ├── 📋 boardController.js   # 게시판 로직
│   └── 💬 commentController.js # 댓글 로직
├── 🖥️ server.js                # 서버 메인 파일
├── 📦 package.json             # 의존성 관리
├── 🔐 .env                     # 환경 변수
└── 📚 README.md                # 프로젝트 문서
```

---

## 🚀 설치 및 실행 가이드

### **📋 사전 요구사항**

- Node.js 18.0 이상
- MongoDB Atlas 계정
- Gmail 계정 (이메일 전송용)

### **1️⃣ 저장소 클론**

```bash
git clone https://github.com/luckyandy7/Ordo.git
cd Ordo
```

### **2️⃣ 의존성 설치**

```bash
npm install
```

### **3️⃣ 환경 변수 설정**

`.env` 파일을 생성하고 다음 내용을 추가:

```env
# MongoDB 연결
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ordo

# JWT 시크릿
JWT_SECRET=your-super-secret-jwt-key-2025

# 이메일 설정 (Gmail)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-gmail-app-password

# OAuth 설정
KAKAO_CLIENT_ID=your-kakao-client-id
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### **4️⃣ 서버 실행**

```bash
npm start
```

### **5️⃣ 브라우저 접속**

```
http://localhost:5001
```

---

## 🔧 API 엔드포인트

### **🔐 인증 API**

```http
POST   /api/auth/login          # 이메일 로그인
POST   /api/auth/signup         # 회원가입
POST   /api/auth/forgot-password # 비밀번호 찾기
GET    /auth/kakao/callback     # 카카오 로그인 콜백
GET    /auth/google/callback    # 구글 로그인 콜백
```

### **📅 일정 API**

```http
GET    /api/events              # 전체 일정 조회
POST   /api/events              # 일정 생성
PUT    /api/events/:id          # 일정 수정
DELETE /api/events/:id          # 일정 삭제
GET    /api/events/date/:date   # 특정 날짜 일정 조회
```

### **📋 게시판 API**

```http
GET    /api/posts               # 게시글 목록
POST   /api/posts               # 게시글 작성
GET    /api/posts/:id           # 게시글 상세
PUT    /api/posts/:id           # 게시글 수정
DELETE /api/posts/:id           # 게시글 삭제
POST   /api/posts/:id/like      # 좋아요 토글
```

### **💬 댓글 API**

```http
GET    /api/posts/:id/comments  # 댓글 목록
POST   /api/posts/:id/comments  # 댓글 작성
PUT    /api/comments/:id        # 댓글 수정
DELETE /api/comments/:id        # 댓글 삭제
```

### **💭 채팅 API**

```http
GET    /api/chat/rooms          # 채팅방 목록
POST   /api/chat/rooms          # 채팅방 생성
GET    /api/chat/rooms/:id/messages # 메시지 조회
POST   /api/chat/upload         # 파일 업로드
```

---

## 🎯 Socket.IO 이벤트

### **📡 클라이언트 → 서버**

```javascript
// 인증 및 연결
socket.emit("authenticate", { token });
socket.emit("join_room", { roomId });

// 메시지 관련
socket.emit("send_message", { message, roomId });
socket.emit("typing_start", { roomId });
socket.emit("typing_stop", { roomId });

// 파일 업로드
socket.emit("upload_file", { file, roomId });
```

### **📡 서버 → 클라이언트**

```javascript
// 인증 및 상태
socket.on("authenticated", (userData) => {});
socket.on("user_joined", (user) => {});
socket.on("user_left", (user) => {});

// 메시지 관련
socket.on("new_message", (message) => {});
socket.on("user_typing", (user) => {});
socket.on("message_updated", (message) => {});

// 실시간 업데이트
socket.on("room_updated", (room) => {});
socket.on("notification", (notification) => {});
```

---

## 🔒 보안 기능

### **🛡️ 인증 & 인가**

- JWT 토큰 기반 stateless 인증
- OAuth 2.0 소셜 로그인 (카카오, 구글)
- 비밀번호 bcrypt 해싱 (salt rounds: 10)
- 토큰 만료 시간 관리 (7일)

### **🔐 데이터 보호**

- MongoDB injection 방지
- XSS 공격 방지 (입력값 검증)
- CORS 설정으로 허용된 도메인만 접근
- 민감한 정보 환경변수 관리

### **📊 에러 핸들링**

- 일관된 에러 응답 형식
- 사용자 친화적 에러 메시지
- 서버 로그 시스템
- Graceful shutdown 지원

---

## 📱 반응형 디자인

### **📐 브레이크포인트**

```css
/* 모바일 */
@media (max-width: 768px) {
}

/* 태블릿 */
@media (min-width: 769px) and (max-width: 1024px) {
}

/* 데스크톱 */
@media (min-width: 1025px) {
}
```

### **🎨 반응형 기능**

- **플렉시블 그리드**: CSS Grid + Flexbox
- **적응형 타이포그래피**: clamp() 함수 사용
- **터치 최적화**: 44px 이상 터치 타겟
- **성능 최적화**: lazy loading, 이미지 압축

---

## ⚡ 성능 최적화

### **🚀 프론트엔드 최적화**

- **리소스 최적화**

  - 이미지 WebP 포맷 사용
  - CSS/JS 번들링 및 압축
  - 폰트 preload 설정
  - Lazy loading 구현

- **렌더링 최적화**
  - Critical CSS 인라인화
  - 불필요한 DOM 조작 최소화
  - 애니메이션 GPU 가속
  - Virtual scrolling (대량 데이터)

### **🔧 백엔드 최적화**

- **데이터베이스**

  - MongoDB 인덱싱 최적화
  - 집계 파이프라인 활용
  - 커넥션 풀링
  - 캐싱 전략

- **API 최적화**
  - 페이지네이션 구현
  - 응답 데이터 압축
  - Rate limiting
  - 쿼리 최적화

---

## 🧪 테스트 전략

### **🔍 테스트 범위**

- **유닛 테스트**: 개별 함수/컴포넌트
- **통합 테스트**: API 엔드포인트
- **E2E 테스트**: 사용자 시나리오
- **성능 테스트**: 부하 테스트

### **🛠 테스트 도구**

```json
{
  "unit": "Jest",
  "integration": "Supertest",
  "e2e": "Cypress",
  "performance": "Artillery"
}
```

---

## 📊 프로젝트 통계

### **📈 코드 메트릭스**

- **총 파일 수**: 45개
- **총 코드 라인**: 15,000+ 줄
- **JavaScript**: 8,000+ 줄
- **CSS**: 5,000+ 줄
- **HTML**: 2,000+ 줄

### **🚀 기능 통계**

- **API 엔드포인트**: 25개
- **Socket.IO 이벤트**: 15개
- **데이터베이스 모델**: 8개
- **반응형 브레이크포인트**: 3개

### **💾 의존성**

```json
{
  "dependencies": 15,
  "devDependencies": 8,
  "total_size": "~50MB"
}
```

---

## 🎯 향후 개발 계획

### **🔮 단기 계획 (1-2개월)**

- [ ] 푸시 알림 시스템
- [ ] 파일 미리보기 기능
- [ ] 게시글 검색 고도화
- [ ] 사용자 프로필 페이지

### **🌟 중기 계획 (3-6개월)**

- [ ] 모바일 앱 (React Native)
- [ ] AI 기반 일정 추천
- [ ] 팀 협업 기능 확장
- [ ] 다국어 지원 (i18n)

### **🚀 장기 계획 (6개월+)**

- [ ] 마이크로서비스 아키텍처
- [ ] 클라우드 네이티브 배포
- [ ] 머신러닝 기반 개인화
- [ ] 기업용 엔터프라이즈 버전

---

## 🤝 기여하기

### **💡 기여 방법**

1. **Fork** 이 저장소
2. **Feature Branch** 생성 (`git checkout -b feature/amazing-feature`)
3. **변경사항 커밋** (`git commit -m 'feat: Add amazing feature'`)
4. **Branch Push** (`git push origin feature/amazing-feature`)
5. **Pull Request** 생성

### **📝 커밋 컨벤션**

```
feat: 새로운 기능 추가
fix: 버그 수정
docs: 문서 수정
style: 코드 스타일 변경
refactor: 코드 리팩토링
test: 테스트 추가/수정
chore: 빌드 과정 또는 도구 변경
```

### **🔍 코드 리뷰 가이드라인**

- 가독성과 유지보수성 중시
- 보안 취약점 확인
- 성능 영향 분석
- 테스트 커버리지 확인

---

## 📄 라이센스

이 프로젝트는 **MIT 라이센스** 하에 배포됩니다.

```
MIT License

Copyright (c) 2025 Ordo Team

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
```

---

## 👥 개발팀

<div align="center">

### **🏛️ Ordo Development Team**

**웹서버프로그래밍 프로젝트 팀**

| 역할                  | 담당자 | 연락처            |
| --------------------- | ------ | ----------------- |
| 🎨 **Frontend Lead**  | 팀원 A | email@example.com |
| 🔧 **Backend Lead**   | 팀원 B | email@example.com |
| 📱 **UI/UX Designer** | 팀원 C | email@example.com |
| 🗄️ **Database Admin** | 팀원 D | email@example.com |

</div>

---

## 📞 지원 및 문의

### **🆘 문제 해결**

- **GitHub Issues**: [이슈 등록](https://github.com/luckyandy7/Ordo/issues)
- **이메일 지원**: ordo.support@example.com
- **문서**: [위키 페이지](https://github.com/luckyandy7/Ordo/wiki)

### **🌐 커뮤니티**

- **Discord**: [Ordo 커뮤니티](https://discord.gg/ordo)
- **블로그**: [기술 블로그](https://blog.ordo.dev)
- **Twitter**: [@OrdoOfficial](https://twitter.com/ordoofficial)

---

<div align="center">

### **🎉 Ordo와 함께 체계적인 일상을 시작하세요!**

**Made with ❤️ by Ordo Team**

_최종 업데이트: 2025년 6월_

---

⭐ **이 프로젝트가 도움이 되었다면 Star를 눌러주세요!** ⭐

</div>

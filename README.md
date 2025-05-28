# Ordo - 실시간 채팅 시스템 🚀

## 📋 프로젝트 개요

Ordo는 **Node.js**와 **Socket.IO**를 기반으로 한 **전문적인 실시간 채팅 시스템**입니다. 현대적인 웹 기술을 활용하여 안정적이고 확장 가능한 채팅 솔루션을 제공합니다.

### 🎯 주요 특징

- 🔄 **실시간 양방향 통신**: Socket.IO 기반 WebSocket/Polling 지원
- 🏗️ **확장 가능한 아키텍처**: Redis Adapter로 다중 서버 확장 지원
- 🔐 **안전한 인증 시스템**: JWT 토큰 기반 보안
- 📱 **반응형 디자인**: 모바일/태블릿/데스크톱 완벽 지원
- 🌙 **다크모드**: 라이트/다크 테마 자동 전환
- 📁 **파일 공유**: GridFS 기반 대용량 파일 처리
- ⚡ **고성능**: MongoDB Atlas + Redis로 최적화된 성능

## ✨ 주요 기능

### 🔐 사용자 인증 및 관리

- **회원가입/로그인**: 이메일 기반 계정 시스템
- **JWT 토큰 인증**: 안전한 세션 관리
- **자동 로그인 유지**: LocalStorage 기반 토큰 저장
- **사용자 프로필**: 아바타 및 개인정보 관리

### 💬 실시간 채팅

- **즉시 메시지 전송**: 지연 없는 실시간 통신
- **입장/퇴장 알림**: 사용자 활동 자동 추적
- **타이핑 상태 표시**: 상대방 입력 중 실시간 표시
- **메시지 히스토리**: 무제한 대화 기록 저장
- **시스템 메시지**: 채팅방 이벤트 자동 알림

### 🏠 채팅방 관리

- **채팅방 생성**: 사용자 정의 채팅방 생성
- **멤버 초대**: 이메일/사용자명으로 초대
- **채팅방 나가기**: 안전한 채팅방 퇴장
- **참여자 목록**: 실시간 온라인 상태 표시

### 📎 파일 공유 시스템

- **파일 업로드**: 드래그앤드롭 지원 (최대 10MB)
- **다양한 파일 타입**: 이미지, 문서, 압축파일 등
- **파일 다운로드**: 원본 파일명 유지
- **파일 미리보기**: 이미지 파일 즉시 미리보기
- **GridFS 저장**: MongoDB GridFS로 안전한 파일 관리

### 🎨 사용자 인터페이스

- **모던 UI/UX**: 직관적이고 아름다운 인터페이스
- **다크모드**: 눈의 피로를 줄이는 다크 테마
- **반응형 디자인**: 모든 디바이스에서 완벽한 경험
- **스마트 스크롤**: 새 메시지 자동 스크롤 및 알림
- **고정 채팅 영역**: 스크롤 가능한 고정 크기 채팅창

## 🛠 기술 스택

### Frontend

- **HTML5** - 시맨틱 마크업
- **CSS3** - 모던 스타일링 (Flexbox, Grid, Animations)
- **Vanilla JavaScript** - 순수 자바스크립트 (프레임워크 없음)
- **Socket.IO Client** - 실시간 통신 클라이언트

### Backend

- **Node.js v23.11.0** - 서버 런타임
- **Express.js** - 웹 프레임워크
- **Socket.IO** - 실시간 양방향 통신
- **Redis Adapter** - 다중 서버 확장성

### Database & Storage

- **MongoDB Atlas** - 클라우드 데이터베이스
- **Mongoose** - MongoDB ODM
- **GridFS** - 대용량 파일 저장

### Authentication & Security

- **JWT (JSON Web Tokens)** - 토큰 기반 인증
- **bcryptjs** - 비밀번호 암호화
- **CORS** - 교차 출처 리소스 공유 설정

## 📁 프로젝트 구조

```
Ordo/
├── 📂 Chat/                    # 채팅 시스템
│   ├── chat.html              # 메인 채팅 페이지
│   ├── chat.js                # 채팅 클라이언트 로직 (1,828줄)
│   ├── styles.css             # 채팅 UI 스타일
│   └── debug-test.html        # Socket.IO 디버깅 도구
├── 📂 Login/                   # 인증 시스템
│   ├── email-login.html       # 로그인 페이지
│   ├── signup.html            # 회원가입 페이지
│   ├── signup.js              # 회원가입 로직
│   └── styles.css             # 로그인 UI 스타일
├── 📂 Main/                    # 메인 대시보드
│   ├── index.html             # 메인 페이지
│   ├── main.js                # 메인 페이지 로직
│   └── styles.css             # 메인 UI 스타일
├── 📂 models/                  # 데이터 모델
│   ├── User.js                # 사용자 스키마
│   ├── Message.js             # 메시지 스키마
│   ├── ChatRoom.js            # 채팅방 스키마
│   ├── Invitation.js          # 초대 스키마
│   ├── Event.js               # 이벤트 스키마
│   └── Todo.js                # 할일 스키마
├── 📂 routes/                  # API 라우트
│   ├── auth.js                # 인증 API
│   ├── eventRoutes.js         # 이벤트 API
│   └── todoRoutes.js          # 할일 API
├── 📄 server.js               # 메인 서버 파일 (1,659줄)
├── 📄 package.json            # 의존성 관리
└── 📄 README.md               # 프로젝트 문서
```

## 🚀 설치 및 실행

### 1. 시스템 요구사항

- **Node.js**: v18.0.0 이상 (권장: v23.11.0)
- **npm**: v8.0.0 이상
- **MongoDB**: Atlas 클라우드 또는 로컬 설치
- **Redis**: 선택사항 (다중 서버 환경)

### 2. 프로젝트 클론

```bash
git clone https://github.com/your-username/Ordo.git
cd Ordo
```

### 3. 의존성 설치

```bash
npm install
```

### 4. 환경 변수 설정

`.env` 파일을 생성하고 다음 내용을 추가하세요:

```env
# 데이터베이스
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ordo?retryWrites=true&w=majority

# JWT 시크릿
JWT_SECRET=your-super-secret-jwt-key-here

# 서버 설정
PORT=5001
NODE_ENV=development

# Redis (선택사항)
REDIS_URL=redis://localhost:6379

# 파일 업로드 설정
MAX_FILE_SIZE=10485760  # 10MB
```

### 5. MongoDB Atlas 설정

1. [MongoDB Atlas](https://cloud.mongodb.com/) 계정 생성
2. 새 클러스터 생성
3. 데이터베이스 사용자 추가
4. IP 주소 화이트리스트 설정
5. 연결 문자열을 `.env`에 추가

### 6. 서버 실행

```bash
# 개발 모드
npm run dev

# 또는 직접 실행
node server.js
```

### 7. 접속 확인

브라우저에서 `http://localhost:5001` 접속

## 📖 사용법

### 1. 회원가입 및 로그인

1. **회원가입**: `/Login/signup.html`에서 계정 생성
2. **로그인**: `/Login/email-login.html`에서 로그인
3. **자동 리다이렉트**: 로그인 성공 시 메인 페이지로 이동

### 2. 채팅방 생성

1. **새 채팅 버튼** 클릭
2. **채팅방 이름** 입력
3. **생성 완료** 후 자동 입장

### 3. 사용자 초대

1. **초대 버튼** (👥) 클릭
2. **사용자 검색**: 이름 또는 이메일로 검색
3. **사용자 선택**: 클릭하여 선택/해제
4. **초대 메시지** 입력 (선택사항)
5. **초대 전송** 클릭

### 4. 파일 공유

1. **파일 버튼** (📎) 클릭 또는 드래그앤드롭
2. **파일 선택**: 최대 10MB 파일
3. **자동 업로드**: 선택 즉시 업로드 시작
4. **다운로드**: 채팅방에서 파일 클릭

### 5. 테마 변경

- **테마 토글 버튼** (🌙/☀️) 클릭으로 다크/라이트 모드 전환

## 🔧 API 명세

### 인증 API

#### POST `/api/signup`

사용자 회원가입

```json
{
  "name": "홍길동",
  "email": "hong@example.com",
  "password": "securePassword123"
}
```

#### POST `/api/login`

사용자 로그인

```json
{
  "email": "hong@example.com",
  "password": "securePassword123"
}
```

### 채팅 API

#### GET `/api/chat/rooms`

사용자 참여 채팅방 목록 조회

- **헤더**: `Authorization: Bearer <JWT_TOKEN>`

#### POST `/api/chat/rooms`

새 채팅방 생성

```json
{
  "name": "프로젝트 팀방",
  "participants": []
}
```

#### GET `/api/chat/rooms/:roomId/messages`

채팅방 메시지 히스토리 조회

- **파라미터**: `roomId` - 채팅방 ID
- **응답**: 최근 50개 메시지

#### DELETE `/api/chat/rooms/:roomId/leave`

채팅방 나가기

- **파라미터**: `roomId` - 채팅방 ID

### 초대 API

#### POST `/api/chat/invitations`

사용자 초대

```json
{
  "chatRoomId": "채팅방ID",
  "inviteeIds": ["사용자ID1", "사용자ID2"],
  "message": "프로젝트 논의를 위한 초대입니다."
}
```

#### GET `/api/chat/invitations/received`

받은 초대 목록 조회

#### PUT `/api/chat/invitations/:invitationId`

초대 응답 (수락/거절)

```json
{
  "action": "accept" // 또는 "decline"
}
```

### 파일 API

#### POST `/api/chat/upload`

파일 업로드

- **Content-Type**: `multipart/form-data`
- **Body**: `file` - 업로드할 파일

#### GET `/api/chat/files/:fileId`

파일 다운로드

- **파라미터**: `fileId` - GridFS 파일 ID

## 🔌 Socket.IO 이벤트

### 클라이언트 → 서버

#### `authenticate`

사용자 인증

```javascript
socket.emit("authenticate", jwt_token);
```

#### `join_room`

채팅방 참가

```javascript
socket.emit("join_room", roomId);
```

#### `send_message`

메시지 전송

```javascript
socket.emit("send_message", {
  chatRoomId: "roomId",
  content: "안녕하세요!",
  type: "text", // 또는 'file'
});
```

#### `typing_start` / `typing_stop`

타이핑 상태 전송

```javascript
socket.emit("typing_start", { chatRoomId: "roomId" });
socket.emit("typing_stop", { chatRoomId: "roomId" });
```

### 서버 → 클라이언트

#### `authenticated`

인증 성공

```javascript
socket.on("authenticated", (data) => {
  console.log("인증 성공:", data.user);
});
```

#### `new_message`

새 메시지 수신

```javascript
socket.on("new_message", (message) => {
  console.log("새 메시지:", message);
});
```

#### `user_joined` / `user_left`

사용자 입장/퇴장 알림

```javascript
socket.on("user_joined", (data) => {
  console.log(data.message); // "홍길동님이 입장하셨습니다."
});
```

#### `user_typing`

타이핑 상태 수신

```javascript
socket.on("user_typing", (data) => {
  if (data.isTyping) {
    showTypingIndicator(data.userId);
  } else {
    hideTypingIndicator(data.userId);
  }
});
```

## 🏗️ 아키텍처

### 시스템 구조

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   웹 브라우저    │    │   웹 브라우저    │    │   웹 브라우저    │
│   (Client A)    │    │   (Client B)    │    │   (Client C)    │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          │              Socket.IO / HTTP               │
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
                    ┌─────────────▼─────────────┐
                    │      Node.js Server      │
                    │    (Express + Socket.IO)  │
                    └─────────────┬─────────────┘
                                 │
                    ┌─────────────▼─────────────┐
                    │     Redis Adapter        │
                    │   (확장성 및 세션 관리)    │
                    └─────────────┬─────────────┘
                                 │
               ┌─────────────────────────────────────┐
               │                                     │
    ┌──────────▼─────────┐              ┌──────────▼─────────┐
    │   MongoDB Atlas    │              │      GridFS       │
    │  (메시지, 사용자)   │              │   (파일 저장)      │
    └────────────────────┘              └────────────────────┘
```

### 데이터 플로우

1. **클라이언트 연결**: WebSocket/Polling으로 실시간 연결
2. **인증**: JWT 토큰으로 사용자 인증
3. **채팅방 참가**: Redis로 룸 관리 및 멤버십 추적
4. **메시지 전송**: MongoDB 저장 + 실시간 브로드캐스트
5. **파일 처리**: GridFS 업로드 + 메타데이터 관리

## 🎨 UI/UX 가이드

### 색상 팔레트

```css
/* 라이트 테마 */
--primary-color: #2563eb; /* 메인 블루 */
--success-color: #059669; /* 성공 그린 */
--warning-color: #d97706; /* 경고 오렌지 */
--error-color: #dc2626; /* 에러 레드 */
--background: #ffffff; /* 배경 화이트 */
--surface: #f8fafc; /* 서페이스 라이트 그레이 */

/* 다크 테마 */
--primary-color: #3b82f6; /* 라이트 블루 */
--background: #1e293b; /* 다크 배경 */
--surface: #334155; /* 다크 서페이스 */
--text-primary: #e2e8f0; /* 라이트 텍스트 */
```

### 반응형 브레이크포인트

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

## 🔐 보안 가이드

### 인증 보안

- **JWT 토큰**: 24시간 유효기간
- **비밀번호 암호화**: bcryptjs 해싱
- **CORS 설정**: 특정 도메인만 허용

### 파일 업로드 보안

- **파일 크기 제한**: 10MB 최대
- **파일 타입 검증**: MIME 타입 확인
- **바이러스 스캔**: 업로드 파일 검사 (추후 구현)

### 데이터베이스 보안

- **MongoDB Atlas**: TLS/SSL 암호화
- **접근 제어**: IP 화이트리스트
- **백업**: 자동 백업 설정

## 🐛 문제해결 가이드

### 일반적인 문제

#### 1. Socket.IO 연결 실패

```bash
# 포트 충돌 확인
lsof -ti:5001

# 프로세스 종료
kill -9 <PID>

# 서버 재시작
node server.js
```

#### 2. MongoDB 연결 실패

- `.env` 파일의 `MONGODB_URI` 확인
- MongoDB Atlas IP 화이트리스트 확인
- 네트워크 연결 상태 확인

#### 3. 실시간 메시지 수신 안됨

- 브라우저 개발자 도구에서 Socket.IO 연결 상태 확인
- 방화벽 설정 확인
- 디버그 페이지 사용: `/Chat/debug-test.html`

#### 4. 파일 업로드 실패

- 파일 크기가 10MB 이하인지 확인
- GridFS 설정 확인
- 디스크 공간 확인

### 디버깅 도구

#### Socket.IO 디버깅

```javascript
// 브라우저 콘솔에서 실행
localStorage.debug = "socket.io-client:socket";
location.reload();
```

#### 서버 로그 레벨

```javascript
// server.js에서 로그 레벨 조정
console.log("[DEBUG]", "디버그 메시지");
console.warn("[WARN]", "경고 메시지");
console.error("[ERROR]", "에러 메시지");
```

## 📈 성능 최적화

### 클라이언트 최적화

- **이벤트 리스너 정리**: 메모리 누수 방지
- **DOM 조작 최소화**: DocumentFragment 사용
- **이미지 지연 로딩**: Intersection Observer

### 서버 최적화

- **Redis Adapter**: 다중 서버 확장
- **MongoDB 인덱싱**: 쿼리 성능 향상
- **Gzip 압축**: 네트워크 대역폭 절약

### 데이터베이스 최적화

```javascript
// MongoDB 인덱스 설정 예시
db.messages.createIndex({ chatRoom: 1, timestamp: -1 });
db.users.createIndex({ email: 1 }, { unique: true });
db.chatrooms.createIndex({ participants: 1 });
```

## 🧪 테스트

### 단위 테스트

```bash
npm test
```

### 통합 테스트

```bash
npm run test:integration
```

### 실시간 채팅 테스트

1. 여러 브라우저 탭에서 동일 채팅방 접속
2. 메시지 전송/수신 확인
3. 파일 업로드/다운로드 테스트
4. 네트워크 연결 해제/복구 테스트

## 🚀 배포 가이드

### Heroku 배포

```bash
# Heroku CLI 설치 후
heroku create ordo-chat-app
heroku config:set MONGODB_URI=<your_mongodb_uri>
heroku config:set JWT_SECRET=<your_jwt_secret>
git push heroku main
```

### Vercel 배포

```bash
npm install -g vercel
vercel --prod
```

### Docker 배포

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5001
CMD ["node", "server.js"]
```

## 🔮 향후 계획

### v3.0.0 예정 기능

- [ ] **음성/영상 통화**: WebRTC 기반 통화 기능
- [ ] **메시지 암호화**: End-to-End 암호화
- [ ] **봇 시스템**: 자동화된 채팅 봇
- [ ] **메시지 검색**: 전문 검색 기능
- [ ] **알림 시스템**: 푸시 알림 지원

### 성능 개선 계획

- [ ] **CDN 연동**: 정적 파일 배포
- [ ] **캐싱 시스템**: Redis 캐싱 확장
- [ ] **로드 밸런싱**: Nginx 로드 밸런서
- [ ] **모니터링**: 실시간 성능 모니터링

## 👥 기여하기

### 개발 참여

1. **Fork** 프로젝트
2. **Feature 브랜치** 생성: `git checkout -b feature/amazing-feature`
3. **커밋**: `git commit -m 'Add amazing feature'`
4. **푸시**: `git push origin feature/amazing-feature`
5. **Pull Request** 생성

### 코딩 컨벤션

- **JavaScript**: ES6+ 문법 사용
- **들여쓰기**: 2 스페이스
- **명명법**: camelCase (변수), PascalCase (클래스)
- **주석**: JSDoc 형식

## 📄 라이선스

이 프로젝트는 **MIT 라이선스** 하에 배포됩니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

## 📞 지원 및 문의

- **이슈 리포트**: [GitHub Issues](https://github.com/your-username/Ordo/issues)
- **기능 요청**: [GitHub Discussions](https://github.com/your-username/Ordo/discussions)
- **이메일**: support@ordo-chat.com

## 🙏 감사의 말

- **Socket.IO 팀**: 실시간 통신 라이브러리
- **MongoDB**: 확장 가능한 데이터베이스
- **Node.js 커뮤니티**: 훌륭한 생태계
- **모든 기여자들**: 프로젝트 발전에 기여

---

**Ordo**로 더 나은 소통을 경험하세요! 🚀💬

_Made with ❤️ by Ordo Team_

---

## 📊 프로젝트 통계

- **총 코드 라인**: 3,487줄
- **JavaScript**: 1,828줄 (chat.js)
- **서버 코드**: 1,659줄 (server.js)
- **개발 기간**: 6개월
- **최신 업데이트**: 2025년 1월

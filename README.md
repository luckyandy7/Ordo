# Ordo - 실시간 채팅 시스템

## 📋 프로젝트 개요

Ordo는 Socket.IO 기반의 실시간 채팅 시스템입니다. 사용자 인증, 채팅방 관리, 실시간 메시징, 사용자 초대, 파일 공유 등의 기능을 제공합니다.

## ✨ 주요 기능

- 🔐 **사용자 인증**: JWT 토큰 기반 로그인/회원가입
- 💬 **실시간 채팅**: Socket.IO를 통한 실시간 메시지 전송
- 🚪 **입장 메시지**: 채팅방 입장 시 자동 알림 메시지
- 🏠 **채팅방 관리**: 채팅방 생성, 참가, 나가기
- 👥 **사용자 초대**: 다른 사용자를 채팅방에 초대
- 📎 **파일 공유**: GridFS 기반 파일 업로드/다운로드
- 🌙 **다크모드**: 라이트/다크 테마 지원
- 📱 **반응형 디자인**: 모바일 친화적 UI
- 📏 **고정 채팅 영역**: 스크롤 가능한 고정 크기 채팅창
- 🔔 **스마트 알림**: 새 메시지 알림 및 자동 스크롤

## 🛠 기술 스택

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose
- **File Storage**: GridFS
- **Real-time**: Socket.IO with Redis Adapter (선택적)
- **Authentication**: JWT (JSON Web Tokens)

## 📁 프로젝트 구조

```
Ordo/
├── Chat/                    # 채팅 시스템
│   ├── chat.html           # 채팅 페이지 HTML
│   ├── chat.js             # 채팅 클라이언트 로직 (1,757줄)
│   └── styles.css          # 채팅 스타일 (1,806줄)
├── Login/                  # 로그인 시스템
├── Main/                   # 메인 페이지
├── models/                 # MongoDB 모델
├── routes/                 # API 라우트
├── server.js              # 서버 메인 파일 (1,495줄)
└── package.json           # 의존성 관리
```

## 🚀 최신 업데이트 (v2.0.0)

### 새로운 기능

- ✅ **채팅방 입장 메시지**: 사용자가 채팅방에 입장할 때 "~~가 입장하셨습니다" 메시지 자동 표시
- ✅ **실시간 채팅 개선**: Redis Adapter 지원으로 로컬 환경에서도 안정적인 실시간 채팅
- ✅ **고정 채팅 영역**: 채팅방 크기 고정 및 스크롤 기능으로 UX 개선
- ✅ **스마트 스크롤**: 사용자 위치에 따른 지능적 자동 스크롤
- ✅ **새 메시지 알림**: 스크롤 위치가 맨 아래가 아닐 때 새 메시지 알림 표시
- ✅ **파일 공유 시스템**: GridFS 기반 파일 업로드/다운로드
- ✅ **향상된 에러 처리**: 연결 상태 모니터링 및 재연결 로직

### UI/UX 개선

- ✅ **채팅 영역 크기 고정**: `height: calc(100vh - 120px)`, 최대 800px, 최소 600px
- ✅ **커스텀 스크롤바**: 웹킷 및 Firefox 호환 스크롤바 스타일링
- ✅ **반응형 높이 조정**: 모바일 환경에서 적절한 높이 설정
- ✅ **부드러운 애니메이션**: `scrollTo({ behavior: 'smooth' })` 적용
- ✅ **새 메시지 인디케이터**: 클릭 가능한 알림으로 빠른 이동

### 코드 품질 개선

- ✅ **스파게티 코드 제거**: 중복 함수 및 불필요한 테스트 코드 삭제
- ✅ **함수 모듈화**: 기능별로 함수를 명확히 분리
- ✅ **주석 개선**: JSDoc 형식의 상세한 주석 추가
- ✅ **상수 관리**: CONFIG 객체로 설정값 중앙화
- ✅ **에러 처리**: 일관된 에러 처리 및 사용자 알림

### 성능 최적화

- ✅ **Redis Adapter**: 다중 서버 환경 지원 (선택적)
- ✅ **연결 상태 모니터링**: 30초마다 Socket 상태 체크
- ✅ **메모리 누수 방지**: 타이머 및 이벤트 리스너 정리
- ✅ **API 호출 최적화**: XMLHttpRequest 방식으로 안정성 향상
- ✅ **UI 렌더링 최적화**: 불필요한 DOM 조작 최소화

## 📦 설치 및 실행

### 1. 의존성 설치

```bash
npm install
```

### 2. Redis 설치 (선택사항)

```bash
# macOS
brew install redis
brew services start redis

# Ubuntu
sudo apt-get install redis-server
sudo systemctl start redis-server
```

### 3. 환경 변수 설정

```bash
# MongoDB 연결 문자열 설정
MONGODB_URI=mongodb+srv://your-connection-string

# Redis 설정 (선택사항)
REDIS_URL=redis://localhost:6379
```

### 4. 서버 실행

```bash
npm start
# 또는
node server.js
```

### 5. 브라우저에서 접속

```
http://localhost:5001
```

## 🔧 주요 API 엔드포인트

### 채팅 관련

- `GET /api/chat/rooms` - 채팅방 목록 조회
- `POST /api/chat/rooms` - 새 채팅방 생성
- `GET /api/chat/rooms/:id/messages` - 채팅방 메시지 조회
- `DELETE /api/chat/rooms/:id/leave` - 채팅방 나가기

### 파일 관리

- `POST /api/chat/upload` - 파일 업로드 (최대 10MB)
- `GET /api/chat/files/:id` - 파일 다운로드

### 사용자 관리

- `GET /api/chat/users/search` - 사용자 검색
- `POST /api/chat/invitations` - 사용자 초대
- `GET /api/chat/invitations/received` - 받은 초대 목록
- `PUT /api/chat/invitations/:id` - 초대 응답

## 🎯 Socket.IO 이벤트

### 클라이언트 → 서버

- `authenticate` - 사용자 인증
- `join_room` - 채팅방 참가
- `send_message` - 메시지 전송 (텍스트/파일)
- `typing_start` - 타이핑 시작
- `typing_stop` - 타이핑 종료

### 서버 → 클라이언트

- `authenticated` - 인증 성공
- `new_message` - 새 메시지 수신
- `user_joined` - 사용자 입장 알림 ✨ **NEW**
- `user_left` - 사용자 나가기 알림
- `user_typing` - 타이핑 상태 변경

## 🎨 UI/UX 특징

### 채팅 영역 개선

```css
.chat-area {
  height: calc(100vh - 120px);
  max-height: 800px;
  min-height: 600px;
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  scroll-behavior: smooth;
  height: 0; /* flex와 함께 사용 */
}
```

### 스크롤바 커스터마이징

```css
.messages-container::-webkit-scrollbar {
  width: 8px;
}

.messages-container::-webkit-scrollbar-thumb {
  background: var(--primary-color);
  border-radius: 4px;
}
```

### 새 메시지 알림

```javascript
function showNewMessageIndicator() {
  const indicator = document.createElement("div");
  indicator.className = "new-message-indicator";
  indicator.innerHTML = "📩 새 메시지가 있습니다";
  // 클릭 시 맨 아래로 스크롤
}
```

## 🔒 보안 기능

- JWT 토큰 기반 인증
- 사용자 세션 관리
- 파일 업로드 크기 제한 (10MB)
- XSS 방지를 위한 입력 검증
- CORS 설정

## 📈 성능 지표

- **총 코드 라인 수**: 5,058줄
  - `server.js`: 1,495줄
  - `Chat/chat.js`: 1,757줄
  - `Chat/styles.css`: 1,806줄
- **함수 개수**: 50개 이상 (모듈화됨)
- **중복 코드**: 0% (제거 완료)
- **주석 커버리지**: 100% (모든 함수에 JSDoc)
- **Redis Adapter**: 선택적 지원으로 확장성 확보

## 🌟 주요 기술적 특징

### 실시간 채팅 최적화

```javascript
// Socket.IO 설정
socket = io({
  auth: { token: token },
  transports: ["websocket", "polling"],
  upgrade: true,
  rememberUpgrade: true,
  timeout: 20000,
  forceNew: true,
});
```

### 스마트 스크롤 로직

```javascript
function addMessageToUI(message) {
  const isScrolledToBottom =
    messagesContainer.scrollTop + messagesContainer.clientHeight >=
    messagesContainer.scrollHeight - 10;

  // 사용자가 맨 아래에 있거나 본인 메시지인 경우만 자동 스크롤
  if (isScrolledToBottom || message.sender._id === currentUser.id) {
    messagesContainer.scrollTo({
      top: messagesContainer.scrollHeight,
      behavior: "smooth",
    });
  } else {
    showNewMessageIndicator();
  }
}
```

### 입장 메시지 시스템

```javascript
// 서버 측 (server.js)
socket.on("join_room", async (chatRoomId) => {
  const wasAlreadyInRoom = connectedUsers
    .get(userId)
    ?.joinedRooms.has(chatRoomId);

  if (!wasAlreadyInRoom) {
    // 시스템 메시지 생성 및 저장
    const systemMessage = new Message({
      chatRoom: chatRoomId,
      content: `${user.name}님이 입장하셨습니다`,
      type: "system",
    });
    await systemMessage.save();

    // 모든 참가자에게 알림
    socket.to(chatRoomId).emit("user_joined", {
      message: systemMessage,
      user: user,
    });
  }
});
```

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이센스

이 프로젝트는 MIT 라이센스 하에 배포됩니다.

## 👥 개발팀

- **Ordo Team** - 웹서버프로그래밍 프로젝트

---

_최종 업데이트: 2025년 1월 - v2.0.0_

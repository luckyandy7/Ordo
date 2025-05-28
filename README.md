# Ordo - 통합 협업 및 생산성 플랫폼 🚀

## 📋 프로젝트 개요

Ordo는 **Node.js**와 **Socket.IO**를 기반으로 한 **전문적인 통합 협업 플랫폼**입니다. 개인 생산성 관리부터 팀 협업까지, 현대적인 웹 기술을 활용하여 원스톱 솔루션을 제공합니다.

### 🎯 주요 특징

- 📅 **스마트 캘린더**: 개인/팀 일정 관리 및 시각적 대시보드
- ✅ **할일 관리**: 작업 추적 및 완료율 통계
- 💬 **실시간 채팅**: Socket.IO 기반 즉시 메시징 시스템
- 🤝 **협업 워크스페이스**: 팀 프로젝트 관리 및 파일 공유
- 📊 **생산성 분석**: 주간/일간 통계 및 진행률 추적
- 🔐 **안전한 인증**: JWT 토큰 기반 보안 시스템
- 📱 **반응형 디자인**: 모든 디바이스에서 완벽한 경험
- 🌙 **다크모드**: 라이트/다크 테마 자동 전환

## ✨ 핵심 기능

### 📅 스마트 캘린더 시스템

- **개인 일정 관리**: 드래그앤드롭으로 쉬운 일정 생성
- **주간 뷰**: 시각적 타임라인으로 한눈에 보는 스케줄
- **일정 그룹화**: 연관된 일정들의 자동 그룹 관리
- **완료 추적**: 일정별 완료 상태 및 진행률 표시
- **실시간 업데이트**: 변경사항 즉시 반영
- **색상 코딩**: 일정 종류별 시각적 구분

### ✅ 할일 관리 (Todo)

- **작업 생성/삭제**: 간편한 할일 목록 관리
- **완료율 통계**: 일간/주간 생산성 분석
- **우선순위 설정**: 중요도별 작업 분류
- **진행 상태 추적**: 실시간 완료 현황 모니터링

### 💬 실시간 채팅 시스템

- **즉시 메시지 전송**: Socket.IO 기반 지연 없는 통신
- **채팅방 관리**: 다중 채팅방 생성 및 참여
- **파일 공유**: GridFS 기반 대용량 파일 전송 (최대 10MB)
- **사용자 초대**: 이메일/이름으로 멤버 초대
- **타이핑 상태**: 상대방 입력 중 실시간 표시
- **입장/퇴장 알림**: 자동 시스템 메시지

### 🤝 협업 워크스페이스

- **팀 워크스페이스**: 프로젝트별 협업 공간 구성
- **공유 캘린더**: 팀 일정 통합 관리
- **작업 보드**: 칸반 스타일 팀 작업 관리
- **멤버 관리**: 역할별 권한 설정
- **파일 공유**: 팀 문서 중앙화 관리

### 📊 생산성 대시보드

- **실시간 통계**: 일간/주간 완료율 시각화
- **활동 피드**: 최근 작업 활동 타임라인
- **성과 분석**: 생산성 트렌드 분석
- **목표 추적**: 개인/팀 목표 달성률

### 👤 사용자 관리

- **개인 프로필**: 아바타 및 개인정보 관리
- **설정 동기화**: 테마/환경설정 저장
- **인증 시스템**: JWT 기반 안전한 로그인

## 🛠 기술 스택

### Frontend

- **HTML5** - 시맨틱 마크업 및 웹 표준
- **CSS3** - 모던 스타일링 (Flexbox, Grid, 애니메이션)
- **Vanilla JavaScript** - 순수 자바스크립트 (2,089줄)
- **Socket.IO Client** - 실시간 통신 클라이언트

### Backend

- **Node.js v23.11.0** - 서버 런타임 환경
- **Express.js** - RESTful API 웹 프레임워크
- **Socket.IO** - 실시간 양방향 통신
- **Redis Adapter** - 다중 서버 확장성 지원

### Database & Storage

- **MongoDB Atlas** - 클라우드 NoSQL 데이터베이스
- **Mongoose** - MongoDB ODM 및 스키마 관리
- **GridFS** - 대용량 파일 저장 시스템

### Authentication & Security

- **JWT (JSON Web Tokens)** - 무상태 토큰 인증
- **bcryptjs** - 안전한 비밀번호 해싱
- **CORS** - 교차 출처 리소스 공유 보안

## 📁 프로젝트 구조

```
Ordo/
├── 📂 Main/                     # 메인 대시보드
│   ├── index.html              # 메인 대시보드 페이지
│   ├── Mainpage.html           # 상세 메인 페이지 (1,285줄)
│   ├── main.js                 # 메인 로직 (2,089줄)
│   ├── styles.css              # 메인 스타일 (3,040줄)
│   ├── profile.html            # 프로필 관리 페이지
│   ├── profile.js              # 프로필 로직 (542줄)
│   └── profile.css             # 프로필 스타일 (883줄)
├── 📂 Chat/                     # 실시간 채팅 시스템
│   ├── chat.html              # 채팅 메인 페이지
│   ├── chat.js                # 채팅 클라이언트 로직 (1,852줄)
│   ├── styles.css             # 채팅 UI 스타일
│   └── debug-test.html        # Socket.IO 디버깅 도구
├── 📂 Collaboration/            # 팀 협업 워크스페이스
│   ├── collaboration.html     # 협업 메인 페이지 (417줄)
│   └── styles.css             # 협업 UI 스타일 (1,297줄)
├── 📂 Login/                    # 인증 시스템
│   ├── email-login.html       # 로그인 페이지
│   ├── signup.html            # 회원가입 페이지
│   ├── signup.js              # 회원가입 로직
│   └── styles.css             # 인증 UI 스타일
├── 📂 models/                   # 데이터 모델
│   ├── User.js                # 사용자 스키마
│   ├── Message.js             # 채팅 메시지 스키마
│   ├── Event.js               # 캘린더 이벤트 스키마
│   └── Todo.js                # 할일 스키마
├── 📂 routes/                   # API 라우트
│   ├── auth.js                # 사용자 인증 API
│   ├── eventRoutes.js         # 캘린더 이벤트 API (147줄)
│   └── todoRoutes.js          # 할일 관리 API (25줄)
├── 📄 server.js                # 메인 서버 파일 (1,679줄)
├── 📄 package.json             # 의존성 관리
└── 📄 README.md                # 프로젝트 문서
```

## 💻 상세 코드 구조 및 핵심 기능

### 🎯 메인 대시보드 시스템 (Main/main.js - 2,089줄)

#### 📅 **스마트 캘린더 핵심 함수들**

**1. initializeCalendar() - 캘린더 초기화**

```javascript
function initializeCalendar() {
  console.log("📅 캘린더 초기화 시작");
  currentDate = new Date();
  renderCalendar();
  setInterval(updateCurrentTimeLine, 60000); // 1분마다 현재 시간 라인 업데이트
}
```

**2. renderCalendar() - 주간 캘린더 렌더링**

```javascript
async function renderCalendar() {
  const calendarBody = document.getElementById("calendarBody");
  const calendarHeader = document.getElementById("calendarHeader");

  // 주간 날짜 헤더 생성
  const weekStart = new Date(currentDate);
  weekStart.setDate(currentDate.getDate() - currentDate.getDay());

  // 시간대별 이벤트 블록 생성 (0-23시)
  for (let hour = 0; hour < 24; hour++) {
    // 각 시간대에 이벤트 배치
    await loadAndRenderEvents(hour);
  }
}
```

**3. loadEvents() - 서버에서 이벤트 데이터 로드**

```javascript
async function loadEvents(startDate, endDate) {
  try {
    const response = await fetchAPI(
      `/api/events?start=${startDate}&end=${endDate}`
    );
    const events = response.events || [];

    // 이벤트를 시간순으로 정렬
    return events.sort((a, b) => new Date(a.date) - new Date(b.date));
  } catch (error) {
    console.error("이벤트 로드 실패:", error);
    return [];
  }
}
```

**4. addEvent() - 새 일정 추가**

```javascript
async function addEvent(date, startTime, endTime, title, color) {
  const eventData = {
    title,
    date: new Date(date),
    startTime,
    endTime,
    color,
    completed: false,
    groupId: generateGroupId(), // 연관 일정 그룹화
  };

  try {
    const response = await fetchAPI("/api/events", {
      method: "POST",
      body: JSON.stringify(eventData),
    });

    if (response.success) {
      await renderCalendar();
      showNotification("일정이 성공적으로 추가되었습니다!", "success");
    }
  } catch (error) {
    console.error("일정 추가 실패:", error);
    showNotification("일정 추가에 실패했습니다.", "error");
  }
}
```

#### 📊 **생산성 통계 시스템**

**1. updateWeekStats() - 주간 통계 업데이트**

```javascript
async function updateWeekStats() {
  try {
    const weekStart = new Date(currentDate);
    weekStart.setDate(currentDate.getDate() - currentDate.getDay());

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    const events = await loadEvents(
      weekStart.toISOString(),
      weekEnd.toISOString()
    );

    const totalEvents = events.length;
    const completedEvents = events.filter((e) => e.completed).length;
    const completionRate =
      totalEvents > 0 ? (completedEvents / totalEvents) * 100 : 0;

    // UI 업데이트
    document.getElementById("weekTotal").textContent = totalEvents;
    document.getElementById("weekCompleted").textContent = completedEvents;
    updateCompletionRate(totalEvents, completedEvents);
  } catch (error) {
    console.error("주간 통계 업데이트 실패:", error);
  }
}
```

**2. updateTodayStats() - 오늘 통계 업데이트**

```javascript
async function updateTodayStats() {
  const today = new Date();
  const todayStart = new Date(today.setHours(0, 0, 0, 0));
  const todayEnd = new Date(today.setHours(23, 59, 59, 999));

  const todayEvents = await loadEvents(
    todayStart.toISOString(),
    todayEnd.toISOString()
  );

  const stats = {
    total: todayEvents.length,
    completed: todayEvents.filter((e) => e.completed).length,
    pending: todayEvents.filter((e) => !e.completed).length,
    progress:
      todayEvents.length > 0
        ? (todayEvents.filter((e) => e.completed).length / todayEvents.length) *
          100
        : 0,
  };

  updateTodayCompletionStatus(stats.total, stats.completed);
}
```

#### 🎨 **테마 및 UI 관리**

**1. initializeTheme() - 테마 시스템 초기화**

```javascript
function initializeTheme() {
  const savedTheme = localStorage.getItem("theme");
  const systemPrefersDark = window.matchMedia(
    "(prefers-color-scheme: dark)"
  ).matches;

  const theme = savedTheme || (systemPrefersDark ? "dark" : "light");

  document.documentElement.setAttribute("data-theme", theme);
  updateThemeIcon(theme, document.querySelector(".theme-toggle"));

  // 자동 테마 전환 (시간대별)
  autoThemeByTime();
}
```

**2. setupQuickActions() - 퀵 액션 설정**

```javascript
function setupQuickActions() {
  const quickActions = {
    ".quick-event": () => showAddEventModal(),
    ".quick-chat": () => (window.location.href = "/Chat/chat.html"),
    ".quick-collaboration": () =>
      (window.location.href = "/Collaboration/collaboration.html"),
    ".quick-profile": () => (window.location.href = "/Main/profile.html"),
  };

  Object.entries(quickActions).forEach(([selector, handler]) => {
    const element = document.querySelector(selector);
    if (element) {
      element.addEventListener("click", handler);
    }
  });
}
```

### 🏗️ **서버 사이드 아키텍처 (server.js - 1,679줄)**

#### 🔧 **Express 서버 설정**

**1. 서버 초기화 및 미들웨어**

```javascript
const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const mongoose = require("mongoose");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
  transports: ["websocket", "polling"],
  allowEIO3: true,
  pingTimeout: 60000,
  pingInterval: 25000,
});

// 미들웨어 설정
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(cors());
app.use(express.static(path.join(__dirname)));
```

**2. MongoDB 연결 및 GridFS 설정**

```javascript
async function connectToMongoDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      retryWrites: true,
      w: "majority",
    });

    // GridFS 초기화 (파일 저장용)
    const conn = mongoose.connection;
    gfs = new mongoose.mongo.GridFSBucket(conn.db, {
      bucketName: "uploads",
    });

    console.log("✅ MongoDB Atlas 연결 성공");
    return true;
  } catch (error) {
    console.error("❌ MongoDB 연결 실패:", error);
    return false;
  }
}
```

#### 📅 **이벤트 API 엔드포인트**

**1. 이벤트 생성 API**

```javascript
app.post("/api/events", authenticateToken, async (req, res) => {
  try {
    const { title, date, startTime, endTime, color } = req.body;

    const event = new Event({
      title,
      date: new Date(date),
      startTime,
      endTime,
      color: color || "#3b82f6",
      userId: req.user.userId,
      completed: false,
      createdAt: new Date(),
    });

    await event.save();

    res.status(201).json({
      success: true,
      event: {
        id: event._id,
        title: event.title,
        date: event.date,
        startTime: event.startTime,
        endTime: event.endTime,
        color: event.color,
        completed: event.completed,
      },
    });
  } catch (error) {
    console.error("이벤트 생성 오류:", error);
    res.status(500).json({ error: "이벤트 생성에 실패했습니다." });
  }
});
```

**2. 이벤트 조회 API**

```javascript
app.get("/api/events", authenticateToken, async (req, res) => {
  try {
    const { start, end, date } = req.query;
    let query = { userId: req.user.userId };

    if (date) {
      // 특정 날짜 조회
      const targetDate = new Date(date);
      const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

      query.date = { $gte: startOfDay, $lte: endOfDay };
    } else if (start && end) {
      // 기간 조회
      query.date = {
        $gte: new Date(start),
        $lte: new Date(end),
      };
    }

    const events = await Event.find(query).sort({ date: 1, startTime: 1 });

    res.json({
      success: true,
      events: events.map((event) => ({
        id: event._id,
        title: event.title,
        date: event.date,
        startTime: event.startTime,
        endTime: event.endTime,
        color: event.color,
        completed: event.completed,
      })),
    });
  } catch (error) {
    console.error("이벤트 조회 오류:", error);
    res.status(500).json({ error: "이벤트 조회에 실패했습니다." });
  }
});
```

### 📊 **데이터 모델 상세 구조**

#### 📅 **Event 모델 (models/Event.js)**

```javascript
const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
  },
  date: {
    type: Date,
    required: true,
    index: true, // 성능 최적화
  },
  startTime: {
    type: String,
    required: true,
    validate: {
      validator: function (v) {
        return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
      },
      message: "시간 형식이 올바르지 않습니다 (HH:MM)",
    },
  },
  endTime: {
    type: String,
    required: true,
    validate: {
      validator: function (v) {
        return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
      },
      message: "시간 형식이 올바르지 않습니다 (HH:MM)",
    },
  },
  color: {
    type: String,
    default: "#3b82f6",
    validate: {
      validator: function (v) {
        return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(v);
      },
      message: "올바른 색상 코드가 아닙니다",
    },
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  completed: {
    type: Boolean,
    default: false,
    index: true,
  },
  groupId: {
    type: String,
    default: null, // 연관 일정 그룹화용
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// 복합 인덱스 설정 (성능 최적화)
eventSchema.index({ userId: 1, date: 1 });
eventSchema.index({ userId: 1, completed: 1 });
eventSchema.index({ userId: 1, groupId: 1 });
```

#### ✅ **Todo 모델 (models/Todo.js)**

```javascript
const todoSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200,
  },
  completed: {
    type: Boolean,
    default: false,
    index: true,
  },
  priority: {
    type: String,
    enum: ["low", "medium", "high", "urgent"],
    default: "medium",
  },
  dueDate: {
    type: Date,
    default: null,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  category: {
    type: String,
    default: "일반",
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  completedAt: {
    type: Date,
    default: null,
  },
});

// 성능 최적화 인덱스
todoSchema.index({ userId: 1, completed: 1 });
todoSchema.index({ userId: 1, dueDate: 1 });
```

### 🔄 **핵심 워크플로우 상세**

#### 📅 **일정 관리 워크플로우**

1. **일정 생성 플로우**

   ```
   사용자 클릭 → showAddEventModal() → 폼 제출 → addEvent() →
   서버 저장 → UI 업데이트 → 활동 로그 → 통계 업데이트
   ```

2. **일정 완료 처리**

   ```javascript
   function toggleEventCompletion(eventId, eventTitle, isCompleted) {
     // 1. UI 즉시 업데이트 (사용자 경험 향상)
     updateEventVisualState(eventId, isCompleted);

     // 2. 서버에 상태 전송
     fetch(`/api/events/${eventId}/complete`, {
       method: "PATCH",
       body: JSON.stringify({ completed: isCompleted }),
     });

     // 3. 통계 업데이트
     updateTodayStats();
     updateWeekStats();

     // 4. 활동 로그 추가
     addActivity(
       isCompleted ? "event_completed" : "event_uncompleted",
       `일정이 ${isCompleted ? "완료" : "미완료"}되었습니다`,
       eventTitle
     );
   }
   ```

#### 💬 **실시간 채팅 워크플로우**

1. **메시지 전송 플로우**

   ```
   입력 → 검증 → Socket.IO 전송 → 서버 저장 →
   브로드캐스트 → 모든 클라이언트 수신 → UI 업데이트
   ```

2. **파일 업로드 플로우**

   ```javascript
   // 클라이언트: 파일 선택
   fileInput.addEventListener("change", async (e) => {
     const file = e.target.files[0];
     if (!file) return;

     // 파일 크기 검증
     if (file.size > 10 * 1024 * 1024) {
       showNotification("파일 크기는 10MB 이하여야 합니다.", "error");
       return;
     }

     // FormData 생성 및 업로드
     const formData = new FormData();
     formData.append("file", file);

     try {
       const response = await fetch("/api/chat/upload", {
         method: "POST",
         headers: { Authorization: `Bearer ${token}` },
         body: formData,
       });

       const fileData = await response.json();

       // 파일 메시지 전송
       socket.emit("send_message", {
         chatRoomId: currentChatRoom,
         content: `[파일] ${file.name}`,
         type: "file",
         fileId: fileData.fileId,
         fileName: file.name,
         fileSize: file.size,
       });
     } catch (error) {
       showNotification("파일 업로드에 실패했습니다.", "error");
     }
   });
   ```

### 🎨 **UI/UX 상세 구현**

#### 🌙 **다크모드 시스템**

**CSS 변수 기반 테마 시스템**

```css
:root {
  /* 라이트 테마 색상 팔레트 */
  --primary-50: #eff6ff;
  --primary-100: #dbeafe;
  --primary-500: #3b82f6;
  --primary-600: #2563eb;
  --primary-700: #1d4ed8;

  --gray-50: #f9fafb;
  --gray-100: #f3f4f6;
  --gray-500: #6b7280;
  --gray-700: #374151;
  --gray-900: #111827;

  /* 시맨틱 색상 */
  --background: var(--gray-50);
  --surface: #ffffff;
  --text-primary: var(--gray-900);
  --text-secondary: var(--gray-700);
  --border: var(--gray-200);
}

[data-theme="dark"] {
  /* 다크 테마 색상 재정의 */
  --background: #0f172a;
  --surface: #1e293b;
  --text-primary: #f1f5f9;
  --text-secondary: #cbd5e1;
  --border: #334155;
}

/* 테마 전환 애니메이션 */
* {
  transition: background-color 0.3s ease, color 0.3s ease,
    border-color 0.3s ease;
}
```

#### 📱 **반응형 그리드 시스템**

**모바일 우선 반응형 디자인**

```css
/* 기본 (모바일) */
.dashboard-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
  padding: 1rem;
}

/* 태블릿 */
@media (min-width: 768px) {
  .dashboard-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 1.5rem;
    padding: 1.5rem;
  }
}

/* 데스크톱 */
@media (min-width: 1024px) {
  .dashboard-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 2rem;
    padding: 2rem;
  }
}

/* 대형 화면 */
@media (min-width: 1280px) {
  .dashboard-grid {
    grid-template-columns: repeat(4, 1fr);
    max-width: 1440px;
    margin: 0 auto;
  }
}
```

### ⚡ **성능 최적화 상세**

#### 🔄 **이벤트 리스너 최적화**

**디바운스를 이용한 검색 최적화**

```javascript
let searchTimeout = null;

function optimizedSearch(query) {
  // 이전 검색 취소
  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }

  // 300ms 디바운스
  searchTimeout = setTimeout(async () => {
    try {
      const results = await searchAPI(query);
      updateSearchResults(results);
    } catch (error) {
      console.error("검색 실패:", error);
    }
  }, 300);
}

// 이벤트 위임을 이용한 효율적인 리스너 관리
document.addEventListener("click", (e) => {
  // 이벤트 타겟에 따른 분기 처리
  if (e.target.matches(".event-item")) {
    handleEventClick(e);
  } else if (e.target.matches(".todo-item")) {
    handleTodoClick(e);
  } else if (e.target.matches(".chat-message")) {
    handleMessageClick(e);
  }
});
```

#### 💾 **메모리 관리**

**Socket.IO 연결 정리**

```javascript
function cleanupSocketConnection() {
  if (socket) {
    console.log("🧹 Socket.IO 연결 정리 중...");

    // 모든 이벤트 리스너 제거
    socket.removeAllListeners();

    // 연결 해제
    socket.disconnect();

    // 참조 제거
    socket = null;

    console.log("✅ Socket.IO 연결 정리 완료");
  }
}

// 페이지 언로드 시 정리
window.addEventListener("beforeunload", () => {
  cleanupSocketConnection();

  // 타이머 정리
  if (currentTimeInterval) {
    clearInterval(currentTimeInterval);
  }

  // 기타 리소스 정리
  cleanupResources();
});
```

#### 🗄️ **데이터베이스 최적화**

**MongoDB 인덱스 전략**

```javascript
// 자주 사용되는 쿼리 패턴에 맞춘 인덱스 설정

// 1. 사용자별 이벤트 조회 (가장 빈번)
db.events.createIndex({ userId: 1, date: 1 });

// 2. 완료 상태별 필터링
db.events.createIndex({ userId: 1, completed: 1 });

// 3. 날짜 범위 검색
db.events.createIndex({ date: 1 });

// 4. 채팅 메시지 조회 (채팅방별, 시간순)
db.messages.createIndex({ chatRoom: 1, timestamp: -1 });

// 5. 사용자 검색 (이메일, 이름)
db.users.createIndex({ email: 1 });
db.users.createIndex({ name: "text" }); // 텍스트 검색
```

**연결 풀 최적화**

```javascript
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  maxPoolSize: 10, // 최대 연결 수
  serverSelectionTimeoutMS: 5000, // 서버 선택 타임아웃
  socketTimeoutMS: 45000, // 소켓 타임아웃
  bufferMaxEntries: 0, // 버퍼링 비활성화
  retryWrites: true,
  w: "majority",
});
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

## 🎨 **프론트엔드 아키텍처**

### 📱 **반응형 디자인 (CSS Breakpoints)**

```css
/* 모바일 우선 설계 */
.container {
  padding: 1rem;
  max-width: 100%;
}

/* 태블릿 (768px 이상) */
@media (min-width: 768px) {
  .container {
    padding: 2rem;
    max-width: 750px;
    margin: 0 auto;
  }

  .calendar-grid {
    grid-template-columns: repeat(7, 1fr);
  }
}

/* 데스크톱 (1024px 이상) */
@media (min-width: 1024px) {
  .container {
    max-width: 1200px;
  }

  .dashboard-layout {
    display: grid;
    grid-template-columns: 300px 1fr 350px;
    gap: 2rem;
  }
}

/* 대형 화면 (1440px 이상) */
@media (min-width: 1440px) {
  .container {
    max-width: 1400px;
  }
}
```

### 🌙 **다크모드 구현**

```css
:root {
  /* 라이트 테마 */
  --bg-primary: #ffffff;
  --bg-secondary: #f8f9fa;
  --text-primary: #212529;
  --text-secondary: #6c757d;
  --border-color: #dee2e6;
  --accent-color: #007bff;
}

[data-theme="dark"] {
  /* 다크 테마 */
  --bg-primary: #1a1a1a;
  --bg-secondary: #2d2d2d;
  --text-primary: #ffffff;
  --text-secondary: #b3b3b3;
  --border-color: #404040;
  --accent-color: #4dabf7;
}

body {
  background-color: var(--bg-primary);
  color: var(--text-primary);
  transition: background-color 0.3s ease, color 0.3s ease;
}
```

### ⚡ **성능 최적화 기법**

#### 1. **가상 스크롤링 (Virtual Scrolling)**

```javascript
class VirtualScroll {
  constructor(container, itemHeight, totalItems) {
    this.container = container;
    this.itemHeight = itemHeight;
    this.totalItems = totalItems;
    this.visibleStart = 0;
    this.visibleEnd = 0;

    this.init();
  }

  init() {
    const containerHeight = this.container.clientHeight;
    this.visibleCount = Math.ceil(containerHeight / this.itemHeight) + 2;

    this.container.addEventListener("scroll", this.onScroll.bind(this));
    this.render();
  }

  onScroll() {
    const scrollTop = this.container.scrollTop;
    this.visibleStart = Math.floor(scrollTop / this.itemHeight);
    this.visibleEnd = Math.min(
      this.visibleStart + this.visibleCount,
      this.totalItems
    );

    this.render();
  }

  render() {
    // 현재 보이는 영역만 렌더링
    const fragment = document.createDocumentFragment();

    for (let i = this.visibleStart; i < this.visibleEnd; i++) {
      const item = this.createItem(i);
      fragment.appendChild(item);
    }

    this.container.innerHTML = "";
    this.container.appendChild(fragment);
  }
}
```

#### 2. **이미지 지연 로딩 (Lazy Loading)**

```javascript
const imageObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      const img = entry.target;
      img.src = img.dataset.src;
      img.classList.remove("lazy");
      imageObserver.unobserve(img);
    }
  });
});

document.querySelectorAll("img[data-src]").forEach((img) => {
  imageObserver.observe(img);
});
```

#### 3. **디바운싱으로 API 호출 최적화**

```javascript
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// 검색 입력 디바운싱
const searchInput = document.getElementById("searchInput");
const debouncedSearch = debounce(async (query) => {
  if (query.length > 2) {
    const results = await searchAPI(query);
    displaySearchResults(results);
  }
}, 300);

searchInput.addEventListener("input", (e) => {
  debouncedSearch(e.target.value);
});
```

## 🔒 **보안 구현**

### 🛡️ **XSS 방지**

```javascript
function sanitizeHTML(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function displayMessage(message) {
  const messageElement = document.createElement("div");
  messageElement.innerHTML = sanitizeHTML(message.content);
  chatContainer.appendChild(messageElement);
}
```

### 🔐 **CSRF 토큰 구현**

```javascript
// CSRF 토큰 생성
const generateCSRFToken = () => {
  return crypto.randomBytes(32).toString("hex");
};

// 요청시 CSRF 토큰 검증
const csrfProtection = (req, res, next) => {
  const token = req.headers["x-csrf-token"];
  const sessionToken = req.session.csrfToken;

  if (!token || token !== sessionToken) {
    return res.status(403).json({ error: "CSRF 토큰이 유효하지 않습니다" });
  }

  next();
};
```

### 🔑 **Rate Limiting**

```javascript
const rateLimit = require("express-rate-limit");

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15분
  max: 100, // 최대 100개 요청
  message: {
    error: "너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api/", apiLimiter);
```

## 📊 **모니터링 및 로깅**

### 📈 **성능 모니터링**

```javascript
class MetricsDashboard {
  constructor() {
    this.metrics = {
      activeUsers: 0,
      messagesPerSecond: 0,
      apiResponseTime: 0,
      memoryUsage: 0,
      cpuUsage: 0,
    };

    this.startMonitoring();
  }

  startMonitoring() {
    setInterval(() => {
      this.collectMetrics();
      this.updateDashboard();
    }, 5000); // 5초마다 업데이트
  }

  collectMetrics() {
    // 시스템 메트릭 수집
    const memUsage = process.memoryUsage();
    this.metrics.memoryUsage = Math.round(memUsage.heapUsed / 1024 / 1024); // MB

    // Socket.IO 연결 수
    this.metrics.activeUsers = io.engine.clientsCount;

    // CPU 사용률 (간단한 근사치)
    const startUsage = process.cpuUsage();
    setTimeout(() => {
      const endUsage = process.cpuUsage(startUsage);
      const totalUsage = endUsage.user + endUsage.system;
      this.metrics.cpuUsage = Math.round(totalUsage / 1000); // 퍼센트
    }, 100);
  }

  updateDashboard() {
    // 관리자 대시보드로 메트릭 전송
    io.to("admin").emit("metrics_update", this.metrics);

    console.log(
      `📊 [메트릭] 활성 사용자: ${this.metrics.activeUsers}, 메모리: ${this.metrics.memoryUsage}MB`
    );
  }
}
```

## 🔮 **향후 개발 계획**

### 🚀 **v3.0.0 로드맵**

#### 🎥 **화상 회의 시스템**

- WebRTC 기반 P2P 영상/음성 통화
- 화면 공유 및 화이트보드 기능
- 회의 녹화 및 자동 요약

#### 🔐 **End-to-End 암호화**

- 메시지 및 파일의 클라이언트 측 암호화
- 개인키/공개키 기반 보안 시스템
- 제로 트러스트 아키텍처

#### 🤖 **AI 통합 기능**

- 스마트 일정 추천 시스템
- 자동 회의 요약 및 액션 아이템 추출
- 개인 생산성 분석 및 개선 제안

#### 📱 **모바일 앱**

- React Native 기반 크로스 플랫폼 앱
- 푸시 알림 및 오프라인 동기화
- 생체인증 및 보안 기능

#### 🌐 **다국어 지원**

- i18n 기반 국제화
- 실시간 번역 기능
- 지역별 시간대 자동 조정

### 📅 **개발 일정**

| 기능            | 시작일     | 완료 예정일 | 담당자   | 상태    |
| --------------- | ---------- | ----------- | -------- | ------- |
| WebRTC 화상회의 | 2024-02-01 | 2024-04-30  | 개발팀   | 계획 중 |
| E2E 암호화      | 2024-03-01 | 2024-06-30  | 보안팀   | 설계 중 |
| AI 추천 시스템  | 2024-05-01 | 2024-08-31  | AI팀     | 연구 중 |
| 모바일 앱       | 2024-06-01 | 2024-10-31  | 모바일팀 | 준비 중 |

---

</rewritten_file>

/**
 * Ordo 실시간 채팅 시스템
 *
 * 주요 기능:
 * - Socket.IO 기반 실시간 채팅
 * - 채팅방 생성/참가/나가기
 * - 사용자 초대 시스템
 * - 다크모드 지원
 *
 * @author Ordo Team
 * @version 2.0.0
 */

// ===== 전역 변수 =====
let socket = null; // Socket.IO 연결 객체
let currentChatRoom = null; // 현재 선택된 채팅방 ID
let currentUser = null; // 현재 로그인한 사용자 정보
let selectedUsers = new Map(); // 초대할 사용자들 (userId -> userInfo)
let searchTimeout = null; // 사용자 검색 디바운스용 타이머

// ===== 상수 정의 =====
const CONFIG = {
  SEARCH_DELAY: 300, // 검색 입력 지연 시간 (ms)
  MESSAGE_MAX_LENGTH: 1000, // 메시지 최대 길이
  NOTIFICATION_DURATION: 3000, // 알림 표시 시간 (ms)
  TYPING_TIMEOUT: 1000, // 타이핑 상태 유지 시간 (ms)
};

// ===== 애플리케이션 초기화 =====
document.addEventListener("DOMContentLoaded", () => {
  console.log("Ordo 채팅 시스템 초기화 중...");

  // 로그인 상태 확인
  if (!validateAuth()) {
    redirectToLogin();
    return;
  }

  // 사용자 정보 설정
  currentUser = JSON.parse(localStorage.getItem("user"));

  // 시스템 초기화
  initializeSocket(localStorage.getItem("token"));
  initializeTheme();
  setupEventListeners();
  initializeChat();

  console.log("Ordo 채팅 시스템 초기화 완료");
});

/**
 * 인증 상태 검증
 * @returns {boolean} 인증 유효 여부
 */
function validateAuth() {
  const token = localStorage.getItem("token");
  const user = localStorage.getItem("user");
  return !!(token && user);
}

/**
 * 로그인 페이지로 리다이렉트
 */
function redirectToLogin() {
  console.warn("로그인이 필요합니다.");
  showNotification(
    "로그인이 필요합니다. 로그인 페이지로 이동합니다.",
    "warning",
    {
      onConfirm: () => {
        window.location.href = "/Login/email-login.html";
      },
    }
  );
}

// ===== 테마 관리 =====

/**
 * 테마 시스템 초기화
 * 저장된 테마 설정을 불러오고 토글 버튼 이벤트를 설정
 */
function initializeTheme() {
  const savedTheme = localStorage.getItem("theme") || "light";
  const themeToggle = document.getElementById("themeToggle");
  const themeIcon = document.querySelector(".theme-icon");

  // 초기 테마 적용
  applyTheme(savedTheme);
  if (themeIcon) {
    updateThemeIcon(savedTheme, themeIcon);
  }

  // 테마 토글 이벤트 설정
  if (themeToggle) {
    themeToggle.addEventListener("click", toggleTheme);
  }
}

/**
 * 테마 전환 처리
 */
function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute("data-theme");
  const newTheme = currentTheme === "dark" ? "light" : "dark";

  // 부드러운 전환 효과
  document.body.classList.add("theme-transition");

  applyTheme(newTheme);
  updateThemeIcon(newTheme, document.querySelector(".theme-icon"));

  // 전환 애니메이션 후 클래스 제거
  setTimeout(() => {
    document.body.classList.remove("theme-transition");
  }, 500);
}

/**
 * 테마 적용
 * @param {string} theme - 적용할 테마 ("light" | "dark")
 */
function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("theme", theme);
}

/**
 * 테마 아이콘 업데이트
 * @param {string} theme - 현재 테마
 * @param {HTMLElement} iconElement - 아이콘 요소
 */
function updateThemeIcon(theme, iconElement) {
  if (!iconElement) return;

  if (theme === "dark") {
    iconElement.textContent = "☀️";
    iconElement.style.transform = "rotate(180deg)";
  } else {
    iconElement.textContent = "🌙";
    iconElement.style.transform = "rotate(0deg)";
  }
}

// 이벤트 리스너 설정
function setupEventListeners() {
  // 뒤로가기 버튼
  const backBtn = document.querySelector(".back-button");
  if (backBtn) {
    backBtn.addEventListener("click", () => {
      window.location.href = "/Main/index.html";
    });
  }

  // 메시지 입력 및 전송
  const messageInput = document.getElementById("messageInput");
  const sendBtn = document.querySelector(".send-btn");

  if (messageInput && sendBtn) {
    // Enter 키로 메시지 전송
    messageInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });

    // 전송 버튼 클릭
    sendBtn.addEventListener("click", sendMessage);

    // 입력 중 표시
    let typingTimer;
    messageInput.addEventListener("input", () => {
      if (currentChatRoom && socket) {
        socket.emit("typing_start", { chatRoomId: currentChatRoom });
      }
      clearTimeout(typingTimer);
      typingTimer = setTimeout(() => {
        if (currentChatRoom && socket) {
          socket.emit("typing_stop", { chatRoomId: currentChatRoom });
        }
      }, CONFIG.TYPING_TIMEOUT);
    });
  }

  // 채팅방 전환
  const chatItems = document.querySelectorAll(".chat-item");
  chatItems.forEach((item) => {
    item.addEventListener("click", () => {
      switchChat(item.dataset.chat);
    });
  });

  // 새 채팅 버튼
  const newChatBtn = document.getElementById("newChatBtn");
  const newChatModal = document.querySelector(".new-chat-modal");
  const newChatForm = document.querySelector(".new-chat-modal form");

  if (newChatBtn && newChatModal) {
    newChatBtn.addEventListener("click", () => {
      newChatModal.classList.add("show");
    });
  }

  if (newChatForm) {
    newChatForm.addEventListener("submit", (e) => {
      e.preventDefault();
      createNewChat();
    });
  }

  // 사용자 초대 버튼
  const inviteBtn = document.querySelector(".invite-btn");
  const inviteModal = document.querySelector(".invite-modal");
  const userSearchInput = document.querySelector(".user-search-input");
  const inviteSendBtn = document.querySelector(".invite-send-btn");

  if (inviteBtn && inviteModal) {
    inviteBtn.addEventListener("click", () => {
      if (!currentChatRoom) {
        showNotification("채팅방을 먼저 선택해주세요.", "warning");
        return;
      }
      inviteModal.classList.add("show");
      selectedUsers.clear();
      updateSelectedUsersList();

      // 검색 결과 초기화
      document.querySelector(".search-results").innerHTML = "";
      document.querySelector(".user-search-input").value = "";
    });
  }

  if (userSearchInput) {
    userSearchInput.addEventListener("input", (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        searchUsers(e.target.value);
      }, CONFIG.SEARCH_DELAY);
    });
  }

  if (inviteSendBtn) {
    inviteSendBtn.addEventListener("click", sendInvitations);
  }

  // 채팅방 나가기 버튼
  const leaveBtn = document.querySelector(".leave-btn");
  if (leaveBtn) {
    leaveBtn.addEventListener("click", () => {
      if (!currentChatRoom) {
        showNotification("채팅방을 먼저 선택해주세요.", "warning");
        return;
      }

      showConfirm(
        "정말로 이 채팅방에서 나가시겠습니까?",
        () => leaveChatRoom(currentChatRoom),
        null
      );
    });
  }

  // 초대 알림 버튼
  const invitationBtn = document.querySelector(".invitation-btn");
  const invitationsModal = document.querySelector(".invitations-modal");

  if (invitationBtn && invitationsModal) {
    invitationBtn.addEventListener("click", () => {
      invitationsModal.classList.add("show");
      loadInvitations();
    });
  }

  // 모달 닫기 이벤트들
  document.querySelectorAll(".cancel-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const modal = e.target.closest(".modal");
      if (modal) {
        modal.classList.remove("show");
      }
    });
  });

  // 모달 외부 클릭 시 닫기
  document.querySelectorAll(".modal").forEach((modal) => {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.classList.remove("show");
      }
    });
  });

  // 파일 첨부 버튼 이벤트
  const attachBtn = document.getElementById("attachBtn");
  const fileInput = document.getElementById("fileInput");

  if (attachBtn && fileInput) {
    attachBtn.addEventListener("click", () => {
      fileInput.click();
    });

    fileInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) {
        uploadFile(file);
      }
    });
  }

  // 액션 버튼들 (사용자 초대, 채팅방 나가기, 파일 첨부 버튼 제외)
  const actionBtns = document.querySelectorAll(
    ".action-btn:not(.invite-btn):not(.leave-btn):not(.file-btn)"
  );
  actionBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const title = btn.getAttribute("title");
      if (
        title !== "사용자 초대" &&
        title !== "채팅방 나가기" &&
        title !== "파일 공유"
      ) {
        showNotification(`${title} 기능은 준비 중입니다! 🚀`);
      }
    });
  });

  // 헤더의 파일 공유 버튼 이벤트
  const fileBtns = document.querySelectorAll(".file-btn");
  fileBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      if (!currentChatRoom) {
        showNotification("채팅방을 먼저 선택해주세요.", "warning");
        return;
      }
      fileInput.click();
    });
  });
}

// Socket.IO 초기화
function initializeSocket(token) {
  console.log("Socket.IO 연결 시도...");
  console.log("현재 URL:", window.location.href);
  console.log("서버 주소:", window.location.origin);

  // Socket.IO 라이브러리가 로드되었는지 확인
  if (typeof io === "undefined") {
    console.error("Socket.IO 라이브러리가 로드되지 않았습니다.");
    showNotification(
      "실시간 채팅 연결에 실패했습니다. 페이지를 새로고침해주세요.",
      "error"
    );
    return;
  }

  socket = io({
    auth: {
      token: token,
    },
    // 로컬 환경을 위한 추가 설정
    transports: ["websocket", "polling"],
    upgrade: true,
    rememberUpgrade: true,
    timeout: 20000,
    forceNew: true,
  });

  // 연결 시도
  socket.on("connect", () => {
    console.log("✅ Socket.IO 연결 성공:", socket.id);
    console.log("연결된 서버:", socket.io.uri);
    console.log("전송 방식:", socket.io.engine.transport.name);
    socket.emit("authenticate", token);
  });

  // 연결 실패
  socket.on("connect_error", (error) => {
    console.error("❌ Socket.IO 연결 실패:", error);
    console.log("연결 시도 중인 서버:", socket.io.uri);
    showNotification(
      "실시간 채팅 연결에 실패했습니다. 서버 상태를 확인해주세요.",
      "error"
    );
  });

  // 재연결 시도
  socket.on("reconnect_attempt", (attemptNumber) => {
    console.log(`🔄 재연결 시도 중... (${attemptNumber}번째)`);
  });

  // 재연결 성공
  socket.on("reconnect", (attemptNumber) => {
    console.log(`✅ 재연결 성공! (${attemptNumber}번째 시도 후)`);
    showNotification("실시간 채팅 연결이 복구되었습니다.", "success");
  });

  // 재연결 실패
  socket.on("reconnect_failed", () => {
    console.error("❌ 재연결 실패");
    showNotification(
      "실시간 채팅 연결을 복구할 수 없습니다. 페이지를 새로고침해주세요.",
      "error"
    );
  });

  // 인증 성공
  socket.on("authenticated", (data) => {
    console.log("✅ Socket.IO 인증 성공:", data);
    loadChatRooms();
  });

  // 인증 실패
  socket.on("authentication_error", (error) => {
    console.error("❌ Socket.IO 인증 실패:", error);
    showNotification("인증에 실패했습니다. 다시 로그인해주세요.", "error");
    setTimeout(() => {
      window.location.href = "/Login/email-login.html";
    }, 2000);
  });

  // 새 메시지 수신
  socket.on("new_message", (message) => {
    console.log("📨 새 메시지 수신:", message);
    addMessageToUI(message);
  });

  // 사용자 나가기 이벤트 수신
  socket.on("user_left", (data) => {
    console.log("👋 사용자 나가기:", data);
    try {
      addSystemMessageToUI(data);
    } catch (error) {
      console.error("시스템 메시지 표시 에러:", error);
    }
  });

  // 사용자 입장 이벤트 수신
  socket.on("user_joined", (data) => {
    console.log("👋 사용자 입장:", data);
    try {
      addSystemMessageToUI(data);
    } catch (error) {
      console.error("입장 메시지 표시 에러:", error);
    }
  });

  // 타이핑 상태 수신
  socket.on("user_typing", (data) => {
    handleTypingStatus(data);
  });

  // 에러 처리
  socket.on("error", (error) => {
    console.error("❌ Socket.IO 에러:", error);
    showNotification(error.message || "연결 오류가 발생했습니다.", "error");
  });

  // 연결 해제
  socket.on("disconnect", (reason) => {
    console.log("🔌 Socket.IO 연결 해제:", reason);
    if (reason === "io server disconnect") {
      // 서버에서 연결을 끊은 경우
      showNotification("서버에서 연결을 종료했습니다.", "warning");
    } else if (reason === "io client disconnect") {
      // 클라이언트에서 연결을 끊은 경우
      console.log("클라이언트에서 연결을 종료했습니다.");
    } else {
      // 기타 이유
      showNotification("서버와의 연결이 끊어졌습니다.", "warning");
    }
  });

  // 연결 상태 모니터링
  setInterval(() => {
    if (socket) {
      console.log("🔍 Socket 상태 체크:", {
        connected: socket.connected,
        id: socket.id,
        transport: socket.io.engine?.transport?.name,
      });
    }
  }, 30000); // 30초마다 체크
}

// 채팅방 목록 로드
async function loadChatRooms() {
  try {
    console.log("채팅방 목록 로드 시작");
    const token = localStorage.getItem("token");
    console.log("토큰 확인:", token ? "있음" : "없음");

    const response = await fetch("/api/chat/rooms", {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    console.log("채팅방 목록 API 응답 상태:", response.status);

    if (!response.ok) {
      throw new Error("채팅방 목록을 불러올 수 없습니다.");
    }

    const data = await response.json();
    console.log("채팅방 목록 데이터:", data);
    console.log("채팅방 개수:", data.data.chatRooms.length);

    renderChatRooms(data.data.chatRooms);

    // 첫 번째 채팅방이 있으면 자동 선택
    if (data.data.chatRooms.length > 0) {
      console.log("첫 번째 채팅방 자동 선택:", data.data.chatRooms[0]._id);
      selectChatRoom(data.data.chatRooms[0]._id);
    } else {
      console.log("선택할 채팅방이 없음");
    }
  } catch (error) {
    console.error("채팅방 목록 로드 실패:", error);
    showNotification("채팅방 목록을 불러오는데 실패했습니다.", "error");
  }
}

// 채팅방 목록 렌더링
function renderChatRooms(chatRooms) {
  const chatList = document.querySelector(".chat-list");
  console.log("채팅방 목록 렌더링:", chatRooms.length, "개");

  if (chatRooms.length === 0) {
    chatList.innerHTML = `
      <div class="empty-chat-list">
        <p>아직 참여한 채팅방이 없습니다.</p>
        <p>새 채팅방을 만들어보세요!</p>
      </div>
    `;
    return;
  }

  chatList.innerHTML = chatRooms
    .map(
      (room) => `
    <div class="chat-item" data-room-id="${room._id}">
      <div class="chat-avatar">${room.name.charAt(0).toUpperCase()}</div>
      <div class="chat-info">
        <div class="chat-name">${room.name}</div>
        <div class="chat-preview">${
          room.lastMessage?.content || "메시지가 없습니다"
        }</div>
      </div>
      ${
        room.unreadCount
          ? `<div class="chat-badge">${room.unreadCount}</div>`
          : ""
      }
    </div>
  `
    )
    .join("");

  console.log("채팅방 HTML 렌더링 완료");

  // 채팅방 클릭 이벤트 추가
  const chatItems = chatList.querySelectorAll(".chat-item");
  console.log("채팅방 아이템 개수:", chatItems.length);

  chatItems.forEach((item, index) => {
    const roomId = item.dataset.roomId;
    console.log(`채팅방 ${index + 1} 이벤트 연결:`, roomId);

    item.addEventListener("click", () => {
      console.log("채팅방 클릭됨:", roomId);
      selectChatRoom(roomId);
    });
  });

  console.log("모든 채팅방 클릭 이벤트 연결 완료");
}

/**
 * 채팅방 선택
 * @param {string} roomId - 채팅방 ID
 */
function selectChatRoom(roomId) {
  console.log("채팅방 선택:", roomId);

  if (!roomId) {
    console.error("채팅방 ID가 없습니다!");
    return;
  }

  currentChatRoom = roomId;

  // UI 업데이트
  document.querySelectorAll(".chat-item").forEach((item) => {
    item.classList.remove("active");
  });

  const selectedItem = document.querySelector(`[data-room-id="${roomId}"]`);
  if (selectedItem) {
    selectedItem.classList.add("active");
  }

  // Socket.IO 채팅방 참가
  if (socket && socket.connected) {
    socket.emit("join_room", roomId);
  }

  // 채팅방 정보와 메시지 로드
  loadChatMessages(roomId);
}

/**
 * 채팅방 메시지 로드
 * @param {string} roomId - 채팅방 ID
 */
function loadChatMessages(roomId) {
  console.log("채팅방 메시지 로드 시작:", roomId);

  if (!roomId) {
    console.error("채팅방 ID가 없습니다!");
    return;
  }

  const token = localStorage.getItem("token");
  if (!token) {
    console.error("인증 토큰이 없습니다!");
    showNotification("로그인이 필요합니다.", "error");
    return;
  }

  const url = `/api/chat/rooms/${roomId}/messages`;

  // XMLHttpRequest를 사용한 API 호출
  const xhr = new XMLHttpRequest();

  xhr.onreadystatechange = function () {
    if (xhr.readyState === 4) {
      if (xhr.status === 200) {
        try {
          const data = JSON.parse(xhr.responseText);
          console.log("채팅방 데이터 로드 성공:", data.data?.chatRoom?.name);

          // 채팅방 헤더 업데이트
          if (data.data?.chatRoom) {
            updateChatHeader(data.data.chatRoom);
          }

          // 메시지 렌더링
          if (data.data?.messages) {
            renderMessages(data.data.messages);
          }
        } catch (parseError) {
          console.error("응답 데이터 파싱 실패:", parseError);
          showNotification("응답 데이터 파싱 실패", "error");
        }
      } else {
        console.error("서버 에러:", xhr.status, xhr.statusText);
        showNotification(`서버 에러: ${xhr.status}`, "error");
      }
    }
  };

  xhr.onerror = function () {
    console.error("네트워크 연결 실패");
    showNotification("네트워크 연결 실패", "error");
  };

  try {
    xhr.open("GET", url, true);
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.send();
  } catch (error) {
    console.error("요청 전송 실패:", error);
    showNotification("요청 전송 실패", "error");
  }
}

// 메시지 렌더링
function renderMessages(messages) {
  const messagesContainer = document.querySelector(".messages-container");

  if (messages.length === 0) {
    messagesContainer.innerHTML = `
      <div class="empty-messages">
        <p>아직 메시지가 없습니다.</p>
        <p>첫 번째 메시지를 보내보세요! 👋</p>
      </div>
    `;
    return;
  }

  messagesContainer.innerHTML = `
    <div class="message-group">
      <div class="message-date">오늘</div>
      ${messages.map((message) => createMessageHTML(message)).join("")}
    </div>
  `;

  // 부드러운 스크롤로 맨 아래로 이동
  setTimeout(() => {
    messagesContainer.scrollTo({
      top: messagesContainer.scrollHeight,
      behavior: "smooth",
    });
  }, 100);
}

// 메시지 HTML 생성
function createMessageHTML(message) {
  const time = new Date(message.timestamp).toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  // 시스템 메시지 처리
  if (message.type === "system") {
    return `
      <div class="system-message">
        <span>🚪 ${message.content}</span>
      </div>
    `;
  }

  // 일반 메시지 처리
  const isOwn = message.sender && message.sender._id === currentUser.id;

  // 메시지 내용 생성
  let messageContent = "";

  if (message.type === "file" && message.file) {
    // 파일 메시지 처리
    const fileIcon = getFileIcon(message.file.mimetype);
    const fileSize = formatFileSize(message.file.size);
    const isImage = message.file.mimetype.startsWith("image/");

    messageContent = `
      <div class="file-message" onclick="downloadFile('${
        message.file.fileId
      }', '${message.file.originalName}')">
        <div class="file-info">
          <div class="file-icon">${fileIcon}</div>
          <div class="file-details">
            <div class="file-name">${message.file.originalName}</div>
            <div class="file-size">${fileSize}</div>
          </div>
          <div class="file-download">⬇️</div>
        </div>
        ${isImage ? `<div class="file-preview">이미지 파일</div>` : ""}
      </div>
    `;
  } else {
    // 텍스트 메시지 처리
    messageContent = `<div class="message-text">${message.content}</div>`;
  }

  if (isOwn) {
    return `
      <div class="message own">
        <div class="message-content">
          <div class="message-header">
            <span class="message-time">${time}</span>
          </div>
          ${messageContent}
        </div>
      </div>
    `;
  } else {
    return `
      <div class="message other">
        <div class="message-avatar">${
          message.sender ? message.sender.name.charAt(0).toUpperCase() : "?"
        }</div>
        <div class="message-content">
          <div class="message-header">
            <span class="sender-name">${
              message.sender ? message.sender.name : "알 수 없음"
            }</span>
            <span class="message-time">${time}</span>
          </div>
          ${messageContent}
        </div>
      </div>
    `;
  }
}

// UI에 새 메시지 추가
function addMessageToUI(message) {
  const messagesContainer = document.querySelector(".messages-container");
  const messageGroup = messagesContainer.querySelector(".message-group");

  // 스크롤 위치 확인 (사용자가 맨 아래에 있는지 체크)
  const isScrolledToBottom =
    messagesContainer.scrollTop + messagesContainer.clientHeight >=
    messagesContainer.scrollHeight - 10; // 10px 여유분

  if (messageGroup) {
    messageGroup.insertAdjacentHTML("beforeend", createMessageHTML(message));
  } else {
    // 첫 번째 메시지인 경우
    messagesContainer.innerHTML = `
      <div class="message-group">
        <div class="message-date">오늘</div>
        ${createMessageHTML(message)}
      </div>
    `;
  }

  // 사용자가 맨 아래에 있었거나 본인이 보낸 메시지인 경우에만 자동 스크롤
  if (
    isScrolledToBottom ||
    (message.sender && message.sender._id === currentUser.id)
  ) {
    // 부드러운 스크롤로 맨 아래로 이동
    setTimeout(() => {
      messagesContainer.scrollTo({
        top: messagesContainer.scrollHeight,
        behavior: "smooth",
      });
    }, 100);
  } else {
    // 새 메시지 알림 표시 (선택사항)
    showNewMessageIndicator();
  }
}

// 시스템 메시지 UI 추가
function addSystemMessageToUI(data) {
  const messagesContainer = document.querySelector(".messages-container");
  const messageGroup = messagesContainer.querySelector(".message-group");

  // 스크롤 위치 확인
  const isScrolledToBottom =
    messagesContainer.scrollTop + messagesContainer.clientHeight >=
    messagesContainer.scrollHeight - 10;

  // data가 객체인지 문자열인지 확인
  const content =
    typeof data === "string"
      ? data
      : data.message
      ? data.message.content
      : data.content;

  const systemMessageHTML = `
    <div class="system-message">
      <span>🚪 ${content}</span>
    </div>
  `;

  if (messageGroup) {
    messageGroup.insertAdjacentHTML("beforeend", systemMessageHTML);
  } else {
    messagesContainer.innerHTML = `
      <div class="message-group">
        <div class="message-date">오늘</div>
        ${systemMessageHTML}
      </div>
    `;
  }

  // 시스템 메시지는 항상 자동 스크롤
  if (isScrolledToBottom) {
    setTimeout(() => {
      messagesContainer.scrollTo({
        top: messagesContainer.scrollHeight,
        behavior: "smooth",
      });
    }, 100);
  }
}

// 새 메시지 알림 표시 (선택사항)
function showNewMessageIndicator() {
  // 기존 알림이 있으면 제거
  const existingIndicator = document.querySelector(".new-message-indicator");
  if (existingIndicator) {
    existingIndicator.remove();
  }

  // 새 메시지 알림 생성
  const indicator = document.createElement("div");
  indicator.className = "new-message-indicator";
  indicator.innerHTML = "📩 새 메시지가 있습니다";
  indicator.onclick = () => {
    const messagesContainer = document.querySelector(".messages-container");
    messagesContainer.scrollTo({
      top: messagesContainer.scrollHeight,
      behavior: "smooth",
    });
    indicator.remove();
  };

  // 메시지 컨테이너에 추가
  const messagesContainer = document.querySelector(".messages-container");
  messagesContainer.appendChild(indicator);

  // 5초 후 자동 제거
  setTimeout(() => {
    if (indicator.parentNode) {
      indicator.remove();
    }
  }, 5000);
}

// 채팅 헤더 업데이트
function updateChatHeader(chatRoom) {
  const chatTitle = document.querySelector(".chat-details h3");
  const memberCount = document.querySelector(".member-count");
  const chatAvatar = document.querySelector(".chat-avatar-large");

  console.log("채팅 헤더 업데이트:", chatRoom);

  if (chatTitle) {
    chatTitle.textContent = chatRoom.name;
    console.log("채팅방 이름 업데이트:", chatRoom.name);
  } else {
    console.warn("채팅방 제목 요소를 찾을 수 없습니다.");
  }

  if (memberCount) {
    memberCount.textContent = `${chatRoom.participants.length}명 참여 중`;
    console.log("참여자 수 업데이트:", chatRoom.participants.length);
  } else {
    console.warn("참여자 수 요소를 찾을 수 없습니다.");
  }

  // 채팅방 아바타도 업데이트
  if (chatAvatar) {
    chatAvatar.textContent = chatRoom.name.charAt(0).toUpperCase();
  }
}

// 채팅 초기화
function initializeChat() {
  // 입력 필드에 포커스
  const messageInput = document.getElementById("messageInput");
  if (messageInput) {
    messageInput.focus();
  }

  // 초대 알림 확인
  loadInvitationCount();

  // 초기 환영 메시지 (한 번만)
  if (!localStorage.getItem("chatWelcomeShown")) {
    setTimeout(() => {
      showNotification("실시간 채팅에 오신 것을 환영합니다! 💬");
      localStorage.setItem("chatWelcomeShown", "true");
    }, 1000);
  }
}

// 메시지 전송
function sendMessage() {
  const messageInput = document.getElementById("messageInput");
  const messageText = messageInput.value.trim();

  if (!messageText || !currentChatRoom) {
    console.warn("메시지 전송 조건이 충족되지 않음:", {
      messageText: !!messageText,
      currentChatRoom: !!currentChatRoom,
    });
    return;
  }

  if (socket) {
    // Socket.IO로 메시지 전송
    socket.emit("send_message", {
      chatRoomId: currentChatRoom,
      content: messageText,
      type: "text",
    });
    console.log("메시지 전송:", messageText);
  } else {
    console.error("Socket.IO 연결이 없습니다.");
    showNotification("서버와의 연결이 끊어졌습니다.", "error");
  }

  // 입력 필드 초기화
  messageInput.value = "";
}

// ===== 타이핑 상태 관리 =====

/**
 * 타이핑 상태 처리
 * @param {Object} data - 타이핑 상태 데이터
 */
function handleTypingStatus(data) {
  const typingIndicator = document.querySelector(".typing-indicator");
  if (!typingIndicator) return;

  if (data.isTyping) {
    typingIndicator.style.display = "block";
    typingIndicator.innerHTML = "<span>누군가 입력 중입니다...</span>";
  } else {
    typingIndicator.style.display = "none";
  }
}

// 새 채팅방 생성
async function createNewChat() {
  const chatNameInput = document.querySelector('.modal input[type="text"]');
  const chatName = chatNameInput.value.trim();

  if (!chatName) {
    showNotification("채팅방 이름을 입력해주세요!", "warning");
    return;
  }

  try {
    const token = localStorage.getItem("token");

    const response = await fetch("/api/chat/rooms", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: chatName,
        participants: [], // 기본적으로 생성자만 참여
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "채팅방 생성에 실패했습니다.");
    }

    const data = await response.json();

    // 모달 닫기
    document.querySelector(".new-chat-modal").classList.remove("show");

    // 폼 초기화
    document.querySelector(".new-chat-modal form").reset();

    // 채팅방 목록 새로고침
    loadChatRooms();

    showNotification(`"${chatName}" 채팅방이 생성되었습니다! 🎉`, "success");

    // 새로 생성된 채팅방으로 이동
    setTimeout(() => {
      selectChatRoom(data.data.chatRoom._id);
    }, 500);
  } catch (error) {
    console.error("채팅방 생성 실패:", error);
    showNotification(error.message || "채팅방 생성에 실패했습니다.", "error");
  }
}

// ===== 유틸리티 함수들 =====

/**
 * Ordo 테마 커스텀 알림 표시
 * @param {string} message - 표시할 메시지
 * @param {string} type - 알림 타입 ("info" | "warning" | "error" | "success")
 * @param {Object} options - 추가 옵션
 */
function showNotification(message, type = "info", options = {}) {
  const {
    title = getNotificationTitle(type),
    showConfirm = false,
    confirmText = "확인",
    cancelText = "취소",
    onConfirm = null,
    onCancel = null,
    autoClose = !showConfirm,
  } = options;

  // 기존 알림 제거
  const existingNotification = document.querySelector(".ordo-notification");
  const existingOverlay = document.querySelector(".ordo-notification-overlay");
  if (existingNotification) existingNotification.remove();
  if (existingOverlay) existingOverlay.remove();

  // 오버레이 생성
  const overlay = document.createElement("div");
  overlay.className = "ordo-notification-overlay";

  // 알림 컨테이너 생성
  const notification = document.createElement("div");
  notification.className = "ordo-notification";

  // 알림 내용 구성
  notification.innerHTML = `
    <div class="ordo-notification-header">
      <div class="ordo-notification-icon ${type}">
        ${getNotificationIcon(type)}
      </div>
      <h3 class="ordo-notification-title">${title}</h3>
    </div>
    <div class="ordo-notification-message">${message}</div>
    <div class="ordo-notification-actions">
      ${
        showConfirm
          ? `
        <button class="ordo-notification-btn secondary cancel-btn">${cancelText}</button>
        <button class="ordo-notification-btn primary confirm-btn">${confirmText}</button>
      `
          : `
        <button class="ordo-notification-btn primary confirm-btn">확인</button>
      `
      }
    </div>
  `;

  // DOM에 추가
  document.body.appendChild(overlay);
  document.body.appendChild(notification);

  // 애니메이션 시작
  setTimeout(() => {
    overlay.classList.add("show");
    notification.classList.add("show");
  }, 10);

  // 이벤트 리스너 추가
  const confirmBtn = notification.querySelector(".confirm-btn");
  const cancelBtn = notification.querySelector(".cancel-btn");

  const closeNotification = () => {
    overlay.classList.remove("show");
    notification.classList.remove("show");
    setTimeout(() => {
      if (overlay.parentNode) overlay.remove();
      if (notification.parentNode) notification.remove();
    }, 400);
  };

  confirmBtn.addEventListener("click", () => {
    if (onConfirm) onConfirm();
    closeNotification();
  });

  if (cancelBtn) {
    cancelBtn.addEventListener("click", () => {
      if (onCancel) onCancel();
      closeNotification();
    });
  }

  // 오버레이 클릭 시 닫기
  overlay.addEventListener("click", () => {
    if (cancelBtn && onCancel) onCancel();
    closeNotification();
  });

  // 자동 닫기 (확인 버튼이 없는 경우)
  if (autoClose && !showConfirm) {
    setTimeout(() => {
      closeNotification();
    }, CONFIG.NOTIFICATION_DURATION);
  }

  // ESC 키로 닫기
  const handleEscape = (e) => {
    if (e.key === "Escape") {
      if (cancelBtn && onCancel) onCancel();
      closeNotification();
      document.removeEventListener("keydown", handleEscape);
    }
  };
  document.addEventListener("keydown", handleEscape);
}

/**
 * 알림 타입별 제목 반환
 * @param {string} type - 알림 타입
 * @returns {string} 제목
 */
function getNotificationTitle(type) {
  const titles = {
    info: "알림",
    success: "성공",
    warning: "주의",
    error: "오류",
  };
  return titles[type] || "알림";
}

/**
 * 알림 타입별 아이콘 반환
 * @param {string} type - 알림 타입
 * @returns {string} 아이콘
 */
function getNotificationIcon(type) {
  const icons = {
    info: "ℹ️",
    success: "✅",
    warning: "⚠️",
    error: "❌",
  };
  return icons[type] || "ℹ️";
}

/**
 * 확인 대화상자 표시
 * @param {string} message - 메시지
 * @param {Function} onConfirm - 확인 콜백
 * @param {Function} onCancel - 취소 콜백
 */
function showConfirm(message, onConfirm, onCancel) {
  showNotification(message, "warning", {
    title: "확인",
    showConfirm: true,
    onConfirm,
    onCancel,
  });
}

/**
 * 키보드 단축키 설정
 */
function setupKeyboardShortcuts() {
  document.addEventListener("keydown", (e) => {
    // Ctrl/Cmd + Enter로 새 채팅방 생성
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      const newChatBtn = document.getElementById("newChatBtn");
      if (newChatBtn) newChatBtn.click();
    }

    // ESC로 모달 닫기
    if (e.key === "Escape") {
      const modal = document.querySelector(".modal.show");
      if (modal) {
        modal.classList.remove("show");
      }
    }
  });
}

// 키보드 단축키 초기화
setupKeyboardShortcuts();

// ===== 페이지 언로드 시 정리 =====
window.addEventListener("beforeunload", () => {
  // 타이머 정리
  if (window.typingTimer) clearTimeout(window.typingTimer);
  if (searchTimeout) clearTimeout(searchTimeout);

  // Socket 연결 정리
  if (socket) {
    socket.disconnect();
  }
});

// ===== 사용자 초대 시스템 =====

/**
 * 사용자 검색
 * @param {string} query - 검색어
 */
async function searchUsers(query) {
  if (!query || query.length < 2) {
    document.querySelector(".search-results").innerHTML = "";
    return;
  }

  try {
    const token = localStorage.getItem("token");
    const response = await fetch(
      `/api/chat/users/search?q=${encodeURIComponent(query)}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`사용자 검색에 실패했습니다. (${response.status})`);
    }

    const data = await response.json();
    renderSearchResults(data.data?.users || []);
  } catch (error) {
    console.error("사용자 검색 실패:", error);
    showNotification(error.message || "사용자 검색에 실패했습니다.", "error");
  }
}

/**
 * 검색 결과 렌더링
 * @param {Array} users - 검색된 사용자 목록
 */
function renderSearchResults(users) {
  const searchResults = document.querySelector(".search-results");

  if (users.length === 0) {
    searchResults.innerHTML =
      '<div class="no-results">검색 결과가 없습니다.</div>';
    return;
  }

  searchResults.innerHTML = users
    .map(
      (user) => `
      <div class="user-search-item" data-user-id="${
        user._id
      }" data-user-name="${user.name}">
        <div class="user-avatar">${user.name.charAt(0).toUpperCase()}</div>
        <div class="user-info">
          <h4>${user.name}</h4>
          <p>${user.email}</p>
        </div>
      </div>
    `
    )
    .join("");

  // 사용자 선택 이벤트 추가
  searchResults.querySelectorAll(".user-search-item").forEach((item) => {
    item.addEventListener("click", () => {
      const userId = item.dataset.userId;
      const userName = item.dataset.userName;

      if (selectedUsers.has(userId)) {
        selectedUsers.delete(userId);
        item.classList.remove("selected");
      } else {
        selectedUsers.set(userId, { id: userId, name: userName });
        item.classList.add("selected");
      }

      updateSelectedUsersList();
    });
  });
}

/**
 * 선택된 사용자 목록 업데이트
 */
function updateSelectedUsersList() {
  const selectedUsersList = document.querySelector(".selected-users-list");

  if (selectedUsers.size === 0) {
    selectedUsersList.innerHTML = "<p>선택된 사용자가 없습니다.</p>";
    return;
  }

  selectedUsersList.innerHTML = Array.from(selectedUsers.values())
    .map(
      (user) => `
      <div class="selected-user-tag">
        <span>${user.name}</span>
        <button class="remove-btn" data-user-id="${user.id}">×</button>
      </div>
    `
    )
    .join("");

  // 제거 버튼 이벤트 추가
  selectedUsersList.querySelectorAll(".remove-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const userId = btn.dataset.userId;
      selectedUsers.delete(userId);
      updateSelectedUsersList();

      // 검색 결과에서도 선택 해제
      const searchItem = document.querySelector(`[data-user-id="${userId}"]`);
      if (searchItem) {
        searchItem.classList.remove("selected");
      }
    });
  });
}

/**
 * 초대 전송
 */
async function sendInvitations() {
  if (selectedUsers.size === 0) {
    showNotification("초대할 사용자를 선택해주세요.", "warning");
    return;
  }

  try {
    const token = localStorage.getItem("token");
    const message = document.querySelector(".invite-message").value.trim();
    const inviteeIds = Array.from(selectedUsers.keys());

    const response = await fetch("/api/chat/invitations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chatRoomId: currentChatRoom,
        inviteeIds,
        message,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "초대 전송에 실패했습니다.");
    }

    const data = await response.json();

    // 모달 닫기 및 폼 초기화
    document.querySelector(".invite-modal").classList.remove("show");
    selectedUsers.clear();
    document.querySelector(".user-search-input").value = "";
    document.querySelector(".invite-message").value = "";
    document.querySelector(".search-results").innerHTML = "";
    updateSelectedUsersList();

    showNotification(data.message, "success");
  } catch (error) {
    console.error("초대 전송 실패:", error);
    showNotification(error.message || "초대 전송에 실패했습니다.", "error");
  }
}

// ===== 초대 관리 =====

/**
 * 초대 개수 로드
 */
async function loadInvitationCount() {
  try {
    const token = localStorage.getItem("token");
    const response = await fetch("/api/chat/invitations/received", {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) return;

    const data = await response.json();
    const count = data.data.invitations.length;

    const countElement = document.querySelector(".invitation-count");
    if (countElement) {
      countElement.textContent = count;
      countElement.style.display = count > 0 ? "flex" : "none";
    }
  } catch (error) {
    console.error("초대 개수 로드 실패:", error);
  }
}

/**
 * 초대 목록 로드
 */
async function loadInvitations() {
  try {
    const token = localStorage.getItem("token");
    const response = await fetch("/api/chat/invitations/received", {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("초대 목록을 불러올 수 없습니다.");
    }

    const data = await response.json();
    renderInvitations(data.data.invitations);
  } catch (error) {
    console.error("초대 목록 로드 실패:", error);
    showNotification("초대 목록을 불러오는데 실패했습니다.", "error");
  }
}

/**
 * 초대 목록 렌더링
 * @param {Array} invitations - 초대 목록
 */
function renderInvitations(invitations) {
  const invitationsList = document.querySelector(".invitations-list");

  if (invitations.length === 0) {
    invitationsList.innerHTML = `
      <div class="empty-invitations">
        <p>받은 초대가 없습니다.</p>
      </div>
    `;
    return;
  }

  invitationsList.innerHTML = invitations
    .map(
      (invitation) => `
      <div class="invitation-item">
        <div class="invitation-info">
          <h4>${invitation.chatRoom.name}</h4>
          <p>${invitation.inviter.name}님이 초대했습니다</p>
          ${
            invitation.message
              ? `<p class="invite-message">"${invitation.message}"</p>`
              : ""
          }
        </div>
        <div class="invitation-actions">
          <button class="accept-btn" data-invitation-id="${
            invitation._id
          }">수락</button>
          <button class="decline-btn" data-invitation-id="${
            invitation._id
          }">거절</button>
        </div>
      </div>
    `
    )
    .join("");

  // 초대 응답 이벤트 추가
  invitationsList
    .querySelectorAll(".accept-btn, .decline-btn")
    .forEach((btn) => {
      btn.addEventListener("click", () => {
        const invitationId = btn.dataset.invitationId;
        const action = btn.classList.contains("accept-btn")
          ? "accept"
          : "decline";
        respondToInvitation(invitationId, action);
      });
    });
}

/**
 * 초대 응답
 * @param {string} invitationId - 초대 ID
 * @param {string} action - 응답 액션 ("accept" | "decline")
 */
async function respondToInvitation(invitationId, action) {
  try {
    const token = localStorage.getItem("token");
    const response = await fetch(`/api/chat/invitations/${invitationId}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ action }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "초대 응답에 실패했습니다.");
    }

    const data = await response.json();
    showNotification(data.message, "success");

    // 초대 목록 새로고침
    loadInvitations();
    loadInvitationCount();

    // 수락한 경우 채팅방 목록 새로고침
    if (action === "accept") {
      loadChatRooms();
    }
  } catch (error) {
    console.error("초대 응답 실패:", error);
    showNotification(error.message || "초대 응답에 실패했습니다.", "error");
  }
}

// ===== 파일 업로드 시스템 =====

/**
 * 파일 업로드
 * @param {File} file - 업로드할 파일
 */
async function uploadFile(file) {
  if (!currentChatRoom) {
    showNotification("채팅방을 먼저 선택해주세요.", "warning");
    return;
  }

  // 파일 크기 체크 (10MB)
  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    showNotification("파일 크기는 10MB를 초과할 수 없습니다.", "error");
    return;
  }

  try {
    showNotification("파일을 업로드하는 중입니다...", "info");

    const formData = new FormData();
    formData.append("file", file);

    const token = localStorage.getItem("token");
    const response = await fetch("/api/chat/upload", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "파일 업로드에 실패했습니다.");
    }

    const data = await response.json();
    console.log("파일 업로드 성공:", data.data);

    // 파일 메시지 전송
    if (socket && socket.connected) {
      socket.emit("send_message", {
        chatRoomId: currentChatRoom,
        content: `📎 ${file.name}`,
        type: "file",
        file: data.data,
      });
    }

    showNotification("파일이 성공적으로 업로드되었습니다!", "success");

    // 파일 입력 초기화
    const fileInput = document.getElementById("fileInput");
    if (fileInput) {
      fileInput.value = "";
    }
  } catch (error) {
    console.error("파일 업로드 실패:", error);
    showNotification(error.message || "파일 업로드에 실패했습니다.", "error");
  }
}

/**
 * 파일 다운로드
 * @param {string} fileId - 파일 ID
 * @param {string} originalName - 원본 파일명
 */
async function downloadFile(fileId, originalName) {
  try {
    const token = localStorage.getItem("token");
    const response = await fetch(`/api/chat/files/${fileId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("파일 다운로드에 실패했습니다.");
    }

    // Blob으로 변환
    const blob = await response.blob();

    // 다운로드 링크 생성
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = originalName;
    document.body.appendChild(a);
    a.click();

    // 정리
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    console.log("파일 다운로드 완료:", originalName);
  } catch (error) {
    console.error("파일 다운로드 실패:", error);
    showNotification("파일 다운로드에 실패했습니다.", "error");
  }
}

/**
 * 파일 크기를 읽기 쉬운 형태로 변환
 * @param {number} bytes - 바이트 크기
 * @returns {string} 변환된 크기 문자열
 */
function formatFileSize(bytes) {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

/**
 * 파일 타입에 따른 아이콘 반환
 * @param {string} mimetype - MIME 타입
 * @returns {string} 파일 아이콘
 */
function getFileIcon(mimetype) {
  if (mimetype.startsWith("image/")) return "🖼️";
  if (mimetype.includes("pdf")) return "📄";
  if (mimetype.includes("word")) return "📝";
  if (mimetype.includes("excel") || mimetype.includes("sheet")) return "📊";
  if (mimetype.includes("zip") || mimetype.includes("compressed")) return "🗜️";
  if (mimetype.includes("text")) return "📃";
  return "📎";
}

// ===== 채팅방 관리 =====

/**
 * 채팅방 나가기
 * @param {string} roomId - 채팅방 ID
 */
async function leaveChatRoom(roomId) {
  try {
    const token = localStorage.getItem("token");
    const response = await fetch(`/api/chat/rooms/${roomId}/leave`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("채팅방 나가기에 실패했습니다.");
    }

    const data = await response.json();
    showNotification(data.message, "success");

    // 채팅방 목록 새로고침
    loadChatRooms();

    // 현재 채팅방 초기화
    currentChatRoom = null;

    // UI 초기화
    document.querySelector(".messages-container").innerHTML = `
      <div class="empty-messages">
        <p>채팅방을 선택해주세요.</p>
        <p>대화를 시작해보세요! 💬</p>
      </div>
    `;

    document.querySelector(".chat-details h3").textContent =
      "채팅방을 선택해주세요";
    document.querySelector(".member-count").textContent =
      "참여자 정보 로딩 중...";
  } catch (error) {
    console.error("채팅방 나가기 실패:", error);
    showNotification("채팅방 나가기에 실패했습니다.", "error");
  }
}

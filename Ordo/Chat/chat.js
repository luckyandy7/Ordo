/**
 * Ordo 실시간 채팅 시스템
 *
 * 주요 기능:
 * - Socket.IO 기반 실시간 채팅
 * - 채팅방 생성/참가/나가기
 * - 사용자 초대 시스템
 * - 다크모드 지원
 * - 파일 공유 기능
 * - 타이핑 상태 표시
 * - 실시간 알림
 *
 * @author Ordo Team
 * @version 2.0.0
 */

// ===== 전역 변수 =====
let socket = null; // Socket.IO 연결 객체 - 실시간 통신을 위한 웹소켓 연결
let currentChatRoom = null; // 현재 선택된 채팅방 ID - 활성 채팅방 추적
let currentUser = null; // 현재 로그인한 사용자 정보 - 로컬스토리지에서 불러온 사용자 데이터
let selectedUsers = new Map(); // 초대할 사용자들 (userId -> userInfo) - 초대 모달에서 선택된 사용자 목록
let searchTimeout = null; // 사용자 검색 디바운스용 타이머 - 과도한 API 호출 방지

// ===== 상수 정의 =====
const CONFIG = {
  SEARCH_DELAY: 300, // 검색 입력 지연 시간 (ms) - 사용자가 입력을 멈춘 후 검색 실행
  MESSAGE_MAX_LENGTH: 1000, // 메시지 최대 길이 - HTML input maxlength와 동일
  NOTIFICATION_DURATION: 3000, // 알림 표시 시간 (ms) - 자동으로 사라지는 알림의 지속 시간
  TYPING_TIMEOUT: 1000, // 타이핑 상태 유지 시간 (ms) - 입력 중단 후 타이핑 상태 해제
};

// ===== 애플리케이션 초기화 =====
/**
 * DOM 로드 완료 시 애플리케이션 초기화
 * - 인증 상태 확인
 * - 사용자 정보 설정
 * - 시스템 컴포넌트 초기화
 */
document.addEventListener("DOMContentLoaded", () => {
  console.log("Ordo 채팅 시스템 초기화 중...");

  // 로그인 상태 확인 - 토큰과 사용자 정보 검증
  if (!validateAuth()) {
    redirectToLogin();
    return;
  }

  // 사용자 정보 설정 - 로컬스토리지에서 사용자 데이터 파싱
  currentUser = JSON.parse(localStorage.getItem("user"));

  // 시스템 초기화 - 각 컴포넌트를 순차적으로 초기화
  initializeSocket(localStorage.getItem("token")); // 실시간 통신 연결
  initializeTheme(); // 테마 설정 로드 및 적용
  setupEventListeners(); // 이벤트 리스너 등록
  initializeChat(); // 채팅 인터페이스 초기화

  console.log("Ordo 채팅 시스템 초기화 완료");
});

/**
 * 인증 상태 검증
 * 로컬스토리지에서 토큰과 사용자 정보 존재 여부 확인
 * @returns {boolean} 인증 유효 여부
 */
function validateAuth() {
  const token = localStorage.getItem("token");
  const user = localStorage.getItem("user");
  return !!(token && user);
}

/**
 * 로그인 페이지로 리다이렉트
 * 인증 실패 시 사용자에게 알림 후 로그인 페이지로 이동
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
 * - 로컬스토리지에서 테마 설정 로드 (기본값: light)
 * - 테마 아이콘 초기화
 * - 토글 버튼 이벤트 리스너 등록
 */
function initializeTheme() {
  const savedTheme = localStorage.getItem("theme") || "light";
  const themeToggle = document.getElementById("themeToggle");
  const themeIcon = document.querySelector(".theme-icon");

  // 초기 테마 적용 - CSS 변수 및 data-theme 속성 설정
  applyTheme(savedTheme);
  if (themeIcon) {
    updateThemeIcon(savedTheme, themeIcon);
  }

  // 테마 토글 이벤트 설정 - 클릭 시 라이트/다크 모드 전환
  if (themeToggle) {
    themeToggle.addEventListener("click", toggleTheme);
  }
}

/**
 * 테마 전환 처리
 * 현재 테마를 확인하고 반대 테마로 전환
 * 부드러운 전환 애니메이션과 함께 테마 변경
 */
function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute("data-theme");
  const newTheme = currentTheme === "dark" ? "light" : "dark";

  // 부드러운 전환 효과 - CSS transition 활성화
  document.body.classList.add("theme-transition");

  applyTheme(newTheme);
  updateThemeIcon(newTheme, document.querySelector(".theme-icon"));

  // 전환 애니메이션 후 클래스 제거 - 성능 최적화
  setTimeout(() => {
    document.body.classList.remove("theme-transition");
  }, 500);
}

/**
 * 테마 적용
 * HTML data-theme 속성 설정 및 로컬스토리지에 저장
 * @param {string} theme - 적용할 테마 ("light" | "dark")
 */
function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("theme", theme);
}

/**
 * 테마 아이콘 업데이트
 * 현재 테마에 따라 아이콘과 애니메이션 적용
 * @param {string} theme - 현재 테마
 * @param {HTMLElement} iconElement - 아이콘 요소
 */
function updateThemeIcon(theme, iconElement) {
  if (!iconElement) return;

  if (theme === "dark") {
    iconElement.textContent = "☀️"; // 다크모드에서는 태양 아이콘
    iconElement.style.transform = "rotate(180deg)"; // 회전 애니메이션
  } else {
    iconElement.textContent = "🌙"; // 라이트모드에서는 달 아이콘
    iconElement.style.transform = "rotate(0deg)";
  }
}

// ===== 이벤트 리스너 설정 =====

/**
 * 모든 이벤트 리스너 등록
 * - 네비게이션 버튼
 * - 메시지 입력 및 전송
 * - 채팅방 관련 버튼
 * - 모달 창 제어
 * - 파일 업로드
 */
function setupEventListeners() {
  // ===== 네비게이션 이벤트 =====
  
  // 뒤로가기 버튼 - 메인 페이지로 이동
  const backBtn = document.querySelector(".back-button");
  if (backBtn) {
    backBtn.addEventListener("click", () => {
      window.location.href = "/Main/index.html";
    });
  }

  // ===== 메시지 입력 및 전송 이벤트 =====
  
  const messageInput = document.getElementById("messageInput");
  const sendBtn = document.querySelector(".send-btn");

  if (messageInput && sendBtn) {
    // Enter 키로 메시지 전송 - Shift+Enter는 줄바꿈
    messageInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });

    // 전송 버튼 클릭 이벤트
    sendBtn.addEventListener("click", sendMessage);

    // 타이핑 상태 표시 - 실시간으로 다른 사용자에게 입력 중임을 알림
    let typingTimer;
    messageInput.addEventListener("input", () => {
      if (currentChatRoom && socket) {
        socket.emit("typing_start", { chatRoomId: currentChatRoom });
      }
      clearTimeout(typingTimer);
      // 일정 시간 후 타이핑 상태 해제
      typingTimer = setTimeout(() => {
        if (currentChatRoom && socket) {
          socket.emit("typing_stop", { chatRoomId: currentChatRoom });
        }
      }, CONFIG.TYPING_TIMEOUT);
    });
  }

  // ===== 채팅방 관련 이벤트 =====
  
  // 채팅방 목록 아이템 클릭 - 동적으로 생성되는 요소들
  const chatItems = document.querySelectorAll(".chat-item");
  chatItems.forEach((item) => {
    item.addEventListener("click", () => {
      switchChat(item.dataset.chat);
    });
  });

  // ===== 새 채팅방 생성 모달 이벤트 =====
  
  const newChatBtn = document.getElementById("newChatBtn");
  const newChatModal = document.querySelector(".new-chat-modal");
  const newChatForm = document.querySelector(".new-chat-modal form");

  // 새 채팅 버튼 클릭 - 모달 창 표시
  if (newChatBtn && newChatModal) {
    newChatBtn.addEventListener("click", () => {
      newChatModal.classList.add("show");
    });
  }

  // 새 채팅방 생성 폼 제출
  if (newChatForm) {
    newChatForm.addEventListener("submit", (e) => {
      e.preventDefault();
      createNewChat();
    });
  }

  // ===== 사용자 초대 모달 이벤트 =====
  
  const inviteBtn = document.querySelector(".invite-btn");
  const inviteModal = document.querySelector(".invite-modal");
  const userSearchInput = document.querySelector(".user-search-input");
  const inviteSendBtn = document.querySelector(".invite-send-btn");

  // 사용자 초대 버튼 클릭 - 채팅방 선택 여부 확인 후 모달 표시
  if (inviteBtn && inviteModal) {
    inviteBtn.addEventListener("click", () => {
      if (!currentChatRoom) {
        showNotification("채팅방을 먼저 선택해주세요.", "warning");
        return;
      }
      inviteModal.classList.add("show");
      selectedUsers.clear(); // 이전 선택 초기화
      updateSelectedUsersList();

      // 검색 결과 및 입력 필드 초기화
      document.querySelector(".search-results").innerHTML = "";
      document.querySelector(".user-search-input").value = "";
    });
  }

  // 사용자 검색 입력 - 디바운스를 적용한 실시간 검색
  if (userSearchInput) {
    userSearchInput.addEventListener("input", (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        searchUsers(e.target.value);
      }, CONFIG.SEARCH_DELAY);
    });
  }

  // 초대 전송 버튼 클릭
  if (inviteSendBtn) {
    inviteSendBtn.addEventListener("click", sendInvitations);
  }

  // ===== 채팅방 나가기 이벤트 =====
  
  const leaveBtn = document.querySelector(".leave-btn");
  if (leaveBtn) {
    leaveBtn.addEventListener("click", () => {
      if (!currentChatRoom) {
        showNotification("채팅방을 먼저 선택해주세요.", "warning");
        return;
      }

      // 확인 다이얼로그 표시 후 나가기 실행
      showConfirm(
        "정말로 이 채팅방에서 나가시겠습니까?",
        () => leaveChatRoom(currentChatRoom),
        null
      );
    });
  }

  // ===== 초대 알림 모달 이벤트 =====
  
  const invitationBtn = document.querySelector(".invitation-btn");
  const invitationsModal = document.querySelector(".invitations-modal");

  // 초대 알림 버튼 클릭 - 받은 초대 목록 표시
  if (invitationBtn && invitationsModal) {
    invitationBtn.addEventListener("click", () => {
      invitationsModal.classList.add("show");
      loadInvitations(); // 최신 초대 목록 로드
    });
  }

  // ===== 모달 공통 이벤트 =====
  
  // 취소 버튼 클릭 - 모든 모달의 취소 버튼에 적용
  document.querySelectorAll(".cancel-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const modal = e.target.closest(".modal");
      if (modal) {
        modal.classList.remove("show");
      }
    });
  });

  // 모달 외부 클릭 시 닫기 - 모달 배경 클릭으로 닫기
  document.querySelectorAll(".modal").forEach((modal) => {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.classList.remove("show");
      }
    });
  });

  // ===== 파일 업로드 이벤트 =====
  
  const attachBtn = document.getElementById("attachBtn");
  const fileInput = document.getElementById("fileInput");

  // 파일 첨부 버튼 클릭 - 숨겨진 파일 입력 필드 활성화
  if (attachBtn && fileInput) {
    attachBtn.addEventListener("click", () => {
      fileInput.click();
    });

    // 파일 선택 시 업로드 실행
    fileInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) {
        uploadFile(file);
      }
    });
  }

  // ===== 기타 액션 버튼 이벤트 =====
  
  // 준비 중인 기능들 - 이모지, 기타 액션 버튼들
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

  // 헤더의 파일 공유 버튼 - 채팅방 선택 확인 후 파일 선택 창 열기
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

// ===== Socket.IO 통신 관리 =====

/**
 * Socket.IO 연결 초기화 및 이벤트 핸들러 설정
 * @param {string} token - 인증 토큰
 */
function initializeSocket(token) {
  console.log("Socket.IO 연결 시도...");

  // Socket.IO 라이브러리 로드 확인 - CDN 로드 실패 대응
  if (typeof io === "undefined") {
    console.error("Socket.IO 라이브러리가 로드되지 않았습니다.");
    showNotification(
      "실시간 채팅 연결에 실패했습니다. 페이지를 새로고침해주세요.",
      "error"
    );
    return;
  }

  // Socket.IO 연결 생성 - 인증 토큰과 함께 연결 시도
  socket = io({
    auth: {
      token: token,
    },
  });

  // ===== Socket.IO 이벤트 핸들러 =====
  
  // 연결 성공 - 서버와의 웹소켓 연결 수립
  socket.on("connect", () => {
    console.log("Socket.IO 연결 성공:", socket.id);
    socket.emit("authenticate", token); // 추가 인증 단계
  });

  // 인증 성공 - JWT 토큰 검증 완료
  socket.on("authenticated", (data) => {
    console.log("Socket.IO 인증 성공:", data);
    loadChatRooms(); // 채팅방 목록 로드
  });

  // 인증 실패 - 토큰 만료 또는 유효하지 않음
  socket.on("authentication_error", (error) => {
    console.error("Socket.IO 인증 실패:", error);
    showNotification("인증에 실패했습니다. 다시 로그인해주세요.", "error");
    setTimeout(() => {
      window.location.href = "/Login/email-login.html";
    }, 2000);
  });

  // 새 메시지 수신 - 실시간 메시지 전달
  socket.on("new_message", (message) => {
    console.log("새 메시지 수신:", message);
    addMessageToUI(message); // UI에 메시지 추가
  });

  // 사용자 입장 알림 처리 - 새로운 사용자가 채팅방에 참여
  socket.on("user_joined", (data) => {
    // 채팅 화면에 시스템 메시지 표시
    displaySystemMessage(data.message);
    console.log(`${data.userName}님이 채팅방에 참여했습니다.`);
  });

  // 새 채팅방 생성 알림 처리 - 다른 사용자가 채팅방 생성 시
  socket.on("new_chatroom_created", (data) => {
    // 채팅방 목록 업데이트
    updateChatRoomList(data.chatRoom);
    displaySystemMessage(data.message);
  });

  // 사용자 나가기 이벤트 수신 - 다른 사용자가 채팅방을 떠날 때
  socket.on("user_left", (data) => {
    console.log("사용자 나가기:", data);
    try {
      addSystemMessageToUI(data); // 시스템 메시지로 나가기 알림 표시
    } catch (error) {
      console.error("시스템 메시지 표시 에러:", error);
    }
  });

  // 타이핑 상태 수신 - 다른 사용자가 입력 중일 때
  socket.on("user_typing", (data) => {
    handleTypingStatus(data); // 타이핑 인디케이터 표시/숨김
  });

  // 에러 처리 - 서버에서 발생한 에러 처리
  socket.on("error", (error) => {
    console.error("Socket.IO 에러:", error);
    showNotification(error.message || "연결 오류가 발생했습니다.", "error");
  });

  // 연결 해제 - 서버와의 연결이 끊어진 경우
  socket.on("disconnect", () => {
    console.log("Socket.IO 연결 해제");
    showNotification("서버와의 연결이 끊어졌습니다.", "warning");
  });
}

// ===== 채팅방 관리 =====

/**
 * 채팅방 목록 로드
 * 서버에서 사용자가 참여한 채팅방 목록을 가져와 UI에 표시
 * 첫 번째 채팅방을 자동으로 선택
 */
async function loadChatRooms() {
  try {
    console.log("채팅방 목록 로드 시작");
    const token = localStorage.getItem("token"); // JWT 토큰 가져오기
    console.log("토큰 확인:", token ? "있음" : "없음");

    // 서버에 채팅방 목록 요청
    const response = await fetch("/api/chat/rooms", {
      headers: {
        Authorization: `Bearer ${token}`, // 인증 헤더 추가
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

    renderChatRooms(data.data.chatRooms); // UI에 채팅방 목록 렌더링

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

/**
 * 채팅방 목록 렌더링
 * 채팅방 데이터를 받아서 사이드바에 HTML로 생성하고 이벤트 리스너 등록
 * @param {Array} chatRooms - 채팅방 배열
 */
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

  // 스크롤을 맨 아래로
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
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

  // 스크롤을 맨 아래로
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// 시스템 메시지 UI 추가
function addSystemMessageToUI(data) {
  const messagesContainer = document.querySelector(".messages-container");
  const messageGroup = messagesContainer.querySelector(".message-group");

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

  // 스크롤을 맨 아래로
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
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
 * Ordo 테마 커스텀 알림 시스템
 * 모달 형태의 아름다운 알림창을 표시하여 사용자에게 메시지 전달
 * - 타입별 아이콘과 색상 지원
 * - 자동 닫기 또는 사용자 확인 모드
 * - ESC 키 및 오버레이 클릭으로 닫기 지원
 * @param {string} message - 표시할 메시지
 * @param {string} type - 알림 타입 ("info" | "warning" | "error" | "success")
 * @param {Object} options - 추가 옵션 (title, showConfirm, onConfirm, onCancel 등)
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
/**
 * 페이지 언로드 시 리소스 정리
 * 메모리 누수 방지를 위해 타이머와 소켓 연결 정리
 */
window.addEventListener("beforeunload", () => {
  // 타이머 정리 - 타이핑 타이머와 검색 디바운스 타이머
  if (window.typingTimer) clearTimeout(window.typingTimer);
  if (searchTimeout) clearTimeout(searchTimeout);

  // Socket 연결 정리 - 서버와의 WebSocket 연결 해제
  if (socket) {
    socket.disconnect();
  }
});

// ===== 사용자 초대 시스템 =====

/**
 * 사용자 검색 기능
 * 서버에서 이메일 또는 이름으로 사용자를 검색
 * 최소 2글자 이상 입력 시 검색 실행
 * @param {string} query - 검색어 (이메일 또는 이름)
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

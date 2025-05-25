// 페이지 로드 시 초기화
document.addEventListener("DOMContentLoaded", () => {
  console.log("=== 채팅 페이지 초기화 시작 ===");

  // 테마 초기화
  initializeTheme();

  // 이벤트 리스너 설정
  setupEventListeners();

  // 채팅 기능 초기화
  initializeChat();

  console.log("=== 채팅 페이지 초기화 완료 ===");
});

// 테마 관리
function initializeTheme() {
  const savedTheme = localStorage.getItem("theme") || "light";
  const themeToggle = document.getElementById("themeToggle");
  const themeIcon = document.querySelector(".theme-icon");

  // 초기 테마 설정
  document.documentElement.setAttribute("data-theme", savedTheme);
  updateThemeIcon(savedTheme, themeIcon);

  // 테마 토글 이벤트
  themeToggle.addEventListener("click", () => {
    const currentTheme = document.documentElement.getAttribute("data-theme");
    const newTheme = currentTheme === "dark" ? "light" : "dark";

    // 부드러운 전환을 위한 클래스 추가
    document.body.classList.add("theme-transition");

    // 테마 변경
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
    updateThemeIcon(newTheme, themeIcon);

    // 전환 애니메이션 후 클래스 제거
    setTimeout(() => {
      document.body.classList.remove("theme-transition");
    }, 500);
  });
}

// 테마 아이콘 업데이트
function updateThemeIcon(theme, iconElement) {
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
  const backBtn = document.getElementById("backBtn");
  if (backBtn) {
    backBtn.addEventListener("click", () => {
      window.location.href = "/Main/index.html";
    });
  }

  // 메시지 입력 및 전송
  const messageInput = document.getElementById("messageInput");
  const sendBtn = document.getElementById("sendBtn");

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
      showTypingIndicator();
      clearTimeout(typingTimer);
      typingTimer = setTimeout(hideTypingIndicator, 1000);
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
  const newChatModal = document.getElementById("newChatModal");
  const newChatForm = document.getElementById("newChatForm");
  const cancelBtn = document.querySelector(".cancel-btn");

  if (newChatBtn && newChatModal) {
    newChatBtn.addEventListener("click", () => {
      newChatModal.classList.add("show");
    });
  }

  if (cancelBtn && newChatModal) {
    cancelBtn.addEventListener("click", () => {
      newChatModal.classList.remove("show");
    });
  }

  if (newChatForm) {
    newChatForm.addEventListener("submit", (e) => {
      e.preventDefault();
      createNewChat();
    });
  }

  // 모달 외부 클릭 시 닫기
  if (newChatModal) {
    newChatModal.addEventListener("click", (e) => {
      if (e.target === newChatModal) {
        newChatModal.classList.remove("show");
      }
    });
  }

  // 액션 버튼들
  const actionBtns = document.querySelectorAll(".action-btn");
  actionBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const title = btn.getAttribute("title");
      showNotification(`${title} 기능은 준비 중입니다! 🚀`);
    });
  });
}

// 채팅 초기화
function initializeChat() {
  // 메시지 컨테이너를 맨 아래로 스크롤
  const messagesContainer = document.getElementById("messagesContainer");
  if (messagesContainer) {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  // 입력 필드에 포커스
  const messageInput = document.getElementById("messageInput");
  if (messageInput) {
    messageInput.focus();
  }

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

  if (!messageText) return;

  // 메시지 추가
  addMessage(messageText, "own");

  // 입력 필드 초기화
  messageInput.value = "";

  // 자동 응답 시뮬레이션 (개발용)
  setTimeout(() => {
    simulateResponse(messageText);
  }, 1000 + Math.random() * 2000);
}

// 메시지 추가
function addMessage(text, type = "other", sender = "나", time = null) {
  const messagesContainer = document.getElementById("messagesContainer");
  const messageGroup = messagesContainer.querySelector(".message-group");

  if (!time) {
    const now = new Date();
    time = `${now.getHours().toString().padStart(2, "0")}:${now
      .getMinutes()
      .toString()
      .padStart(2, "0")}`;
  }

  const messageElement = document.createElement("div");
  messageElement.className = `message ${type}`;

  if (type === "own") {
    messageElement.innerHTML = `
      <div class="message-content">
        <div class="message-header">
          <span class="message-time">${time}</span>
        </div>
        <div class="message-text">${text}</div>
      </div>
    `;
  } else {
    const avatar = getAvatarForSender(sender);
    messageElement.innerHTML = `
      <div class="message-avatar">${avatar}</div>
      <div class="message-content">
        <div class="message-header">
          <span class="sender-name">${sender}</span>
          <span class="message-time">${time}</span>
        </div>
        <div class="message-text">${text}</div>
      </div>
    `;
  }

  messageGroup.appendChild(messageElement);

  // 스크롤을 맨 아래로
  messagesContainer.scrollTop = messagesContainer.scrollHeight;

  // 애니메이션 효과
  messageElement.style.opacity = "0";
  messageElement.style.transform = "translateY(20px)";

  setTimeout(() => {
    messageElement.style.transition = "all 0.3s ease";
    messageElement.style.opacity = "1";
    messageElement.style.transform = "translateY(0)";
  }, 50);
}

// 발신자별 아바타 반환
function getAvatarForSender(sender) {
  const avatars = {
    김철수: "👤",
    이영희: "👩",
    "Horae AI": "🤖",
    박민수: "👨",
    정수진: "👩‍💼",
  };
  return avatars[sender] || "👤";
}

// 자동 응답 시뮬레이션
function simulateResponse(userMessage) {
  const responses = [
    { sender: "김철수", text: "좋은 의견이네요! 👍" },
    { sender: "이영희", text: "저도 동감합니다 😊" },
    { sender: "Horae AI", text: "도움이 필요하시면 언제든 말씀해주세요! 🤖" },
    { sender: "박민수", text: "흥미로운 주제네요!" },
    { sender: "정수진", text: "더 자세히 설명해주실 수 있나요?" },
  ];

  // 사용자 메시지에 따른 특별 응답
  if (userMessage.includes("안녕") || userMessage.includes("hello")) {
    addMessage("안녕하세요! 반갑습니다! 👋", "other", "김철수");
    return;
  }

  if (userMessage.includes("일정") || userMessage.includes("캘린더")) {
    addMessage(
      "일정 관련 질문이시군요! 메인 페이지의 캘린더를 확인해보세요 📅",
      "other",
      "Horae AI"
    );
    return;
  }

  if (userMessage.includes("고마워") || userMessage.includes("감사")) {
    addMessage("천만에요! 언제든 도와드릴게요 😊", "other", "이영희");
    return;
  }

  // 랜덤 응답
  const randomResponse =
    responses[Math.floor(Math.random() * responses.length)];
  addMessage(randomResponse.text, "other", randomResponse.sender);
}

// 채팅방 전환
function switchChat(chatId) {
  // 활성 채팅 아이템 변경
  document.querySelectorAll(".chat-item").forEach((item) => {
    item.classList.remove("active");
  });

  const selectedItem = document.querySelector(`[data-chat="${chatId}"]`);
  if (selectedItem) {
    selectedItem.classList.add("active");
  }

  // 채팅 헤더 업데이트
  const chatDetails = {
    general: { name: "일반 채팅", avatar: "👥", members: "3명 참여 중" },
    team: { name: "팀 프로젝트", avatar: "🚀", members: "5명 참여 중" },
    study: { name: "스터디 그룹", avatar: "📚", members: "8명 참여 중" },
  };

  const chat = chatDetails[chatId];
  if (chat) {
    document.querySelector(".chat-avatar-large").textContent = chat.avatar;
    document.querySelector(".chat-details h3").textContent = chat.name;
    document.querySelector(".member-count").textContent = chat.members;
  }

  // 메시지 로드 시뮬레이션
  loadChatMessages(chatId);

  // 읽지 않은 메시지 배지 제거
  const badge = selectedItem.querySelector(".chat-badge");
  if (badge) {
    badge.style.opacity = "0";
    setTimeout(() => {
      badge.remove();
    }, 300);
  }
}

// 채팅 메시지 로드
function loadChatMessages(chatId) {
  const messagesContainer = document.getElementById("messagesContainer");

  // 기존 메시지 제거
  messagesContainer.innerHTML = "";

  // 새 메시지 그룹 생성
  const messageGroup = document.createElement("div");
  messageGroup.className = "message-group";
  messageGroup.innerHTML = '<div class="message-date">오늘</div>';
  messagesContainer.appendChild(messageGroup);

  // 채팅방별 샘플 메시지
  const sampleMessages = {
    general: [
      {
        sender: "김철수",
        text: "안녕하세요! 일반 채팅방입니다 👋",
        type: "other",
      },
      { sender: "이영희", text: "모두 환영합니다! 😊", type: "other" },
    ],
    team: [
      {
        sender: "박민수",
        text: "프로젝트 진행 상황 공유드립니다 📊",
        type: "other",
      },
      { sender: "정수진", text: "다음 회의는 언제 하나요?", type: "other" },
    ],
    study: [
      { sender: "김학생", text: "오늘 과제 어려웠어요 😅", type: "other" },
      { sender: "이학생", text: "같이 풀어봐요!", type: "other" },
    ],
  };

  const messages = sampleMessages[chatId] || [];
  messages.forEach((msg, index) => {
    setTimeout(() => {
      addMessage(msg.text, msg.type, msg.sender);
    }, index * 500);
  });
}

// 새 채팅방 생성
function createNewChat() {
  const chatName = document.getElementById("chatName").value.trim();
  const chatType = document.getElementById("chatType").value;
  const chatDescription = document
    .getElementById("chatDescription")
    .value.trim();

  if (!chatName) {
    showNotification("채팅방 이름을 입력해주세요!", "warning");
    return;
  }

  // 새 채팅방 추가 (시뮬레이션)
  const chatList = document.querySelector(".chat-list");
  const newChatItem = document.createElement("div");
  newChatItem.className = "chat-item";
  newChatItem.dataset.chat = chatName.toLowerCase().replace(/\s+/g, "_");

  const typeEmojis = {
    public: "🌐",
    private: "🔒",
    direct: "👤",
  };

  newChatItem.innerHTML = `
    <div class="chat-avatar">${typeEmojis[chatType]}</div>
    <div class="chat-info">
      <div class="chat-name">${chatName}</div>
      <div class="chat-preview">${
        chatDescription || "새로 생성된 채팅방입니다"
      }</div>
    </div>
  `;

  // 클릭 이벤트 추가
  newChatItem.addEventListener("click", () => {
    switchChat(newChatItem.dataset.chat);
  });

  chatList.appendChild(newChatItem);

  // 모달 닫기
  document.getElementById("newChatModal").classList.remove("show");

  // 폼 초기화
  document.getElementById("newChatForm").reset();

  // 성공 메시지
  showNotification(`"${chatName}" 채팅방이 생성되었습니다! 🎉`);

  // 새 채팅방으로 전환
  setTimeout(() => {
    switchChat(newChatItem.dataset.chat);
  }, 500);
}

// 입력 중 표시
function showTypingIndicator() {
  const typingIndicator = document.getElementById("typingIndicator");
  if (typingIndicator) {
    typingIndicator.classList.add("show");
  }
}

function hideTypingIndicator() {
  const typingIndicator = document.getElementById("typingIndicator");
  if (typingIndicator) {
    typingIndicator.classList.remove("show");
  }
}

// 알림 표시
function showNotification(message, type = "info") {
  const notification = document.createElement("div");
  notification.className = "notification";
  notification.style.cssText = `
    position: fixed;
    top: 100px;
    right: 24px;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(20px);
    border: 1px solid var(--primary-color);
    border-radius: 16px;
    padding: 16px 20px;
    color: var(--gray-color);
    font-size: 14px;
    font-weight: 500;
    box-shadow: 0 10px 30px rgba(201, 99, 66, 0.2);
    z-index: 1001;
    transform: translateX(400px);
    opacity: 0;
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    max-width: 350px;
  `;

  // 타입별 색상
  if (type === "warning") {
    notification.style.borderColor = "#ff9800";
    notification.style.color = "#ff9800";
  } else if (type === "error") {
    notification.style.borderColor = "#f44336";
    notification.style.color = "#f44336";
  }

  notification.textContent = message;
  document.body.appendChild(notification);

  // 애니메이션
  setTimeout(() => {
    notification.style.transform = "translateX(0)";
    notification.style.opacity = "1";
  }, 100);

  // 자동 제거
  setTimeout(() => {
    notification.style.transform = "translateX(400px)";
    notification.style.opacity = "0";
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 400);
  }, 3000);
}

// 키보드 단축키
document.addEventListener("keydown", (e) => {
  // Ctrl/Cmd + Enter로 새 채팅방 생성
  if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
    e.preventDefault();
    document.getElementById("newChatBtn").click();
  }

  // ESC로 모달 닫기
  if (e.key === "Escape") {
    const modal = document.querySelector(".modal.show");
    if (modal) {
      modal.classList.remove("show");
    }
  }
});

// 페이지 언로드 시 정리
window.addEventListener("beforeunload", () => {
  // 타이머 정리
  clearTimeout(window.typingTimer);
});

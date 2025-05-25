// 실시간 채팅 기능
class RealtimeChat {
  constructor() {
    this.socket = null;
    this.currentUser = null;
    this.currentChatRoom = 'general';
    this.typingTimer = null;
    this.isTyping = false;
    
    this.init();
  }

  // 초기화
  init() {
    console.log('=== 실시간 채팅 초기화 시작 ===');
    
    // 사용자 정보 가져오기
    this.getCurrentUser();
    
    // Socket.IO 연결
    this.connectSocket();
    
    // 이벤트 리스너 설정
    this.setupEventListeners();
    
    console.log('=== 실시간 채팅 초기화 완료 ===');
  }

  // 현재 사용자 정보 가져오기
  getCurrentUser() {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('로그인이 필요합니다.');
      window.location.href = '/login';
      return;
    }

    // JWT 토큰에서 사용자 정보 추출 (간단한 방법)
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      this.currentUser = {
        id: payload.userId,
        name: localStorage.getItem('userName') || '사용자',
        token: token
      };
      console.log('현재 사용자:', this.currentUser);
    } catch (error) {
      console.error('토큰 파싱 오류:', error);
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
  }

  // Socket.IO 연결
  connectSocket() {
    // Socket.IO 연결 옵션 설정
    this.socket = io({
      transports: ['websocket', 'polling'],
      upgrade: true,
      rememberUpgrade: true,
      timeout: 20000,
      forceNew: true
    });
    
    this.socket.on('connect', () => {
      console.log('Socket.IO 연결 성공:', this.socket.id);
      console.log('Transport:', this.socket.io.engine.transport.name);
      this.joinChatRoom();
    });

    this.socket.on('disconnect', () => {
      console.log('Socket.IO 연결 해제');
      this.showNotification('서버와의 연결이 끊어졌습니다.', 'error');
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket.IO 연결 오류:', error);
      this.showNotification('서버 연결에 실패했습니다.', 'error');
    });

    // 메시지 관련 이벤트
    this.socket.on('recent_messages', (messages) => {
      this.loadRecentMessages(messages);
    });

    this.socket.on('new_message', (message) => {
      console.log('새 메시지 수신:', message);
      this.displayMessage(message);
    });

    // 사용자 상태 관련 이벤트
    this.socket.on('user_joined', (data) => {
      this.showSystemMessage(data.message);
    });

    this.socket.on('user_left', (data) => {
      this.showSystemMessage(data.message);
    });

    this.socket.on('online_users', (users) => {
      this.updateOnlineUsers(users);
    });

    // 타이핑 상태 관련 이벤트
    this.socket.on('user_typing', (data) => {
      this.handleTypingStatus(data);
    });

    // 오류 처리
    this.socket.on('error', (error) => {
      console.error('Socket 오류:', error);
      this.showNotification(error.message, 'error');
    });
  }

  // 채팅방 참가
  joinChatRoom() {
    if (!this.currentUser) {
      console.error('사용자 정보가 없습니다.');
      return;
    }

    console.log('채팅방 참가 시도:', {
      userId: this.currentUser.id,
      userName: this.currentUser.name,
      chatRoom: this.currentChatRoom
    });

    this.socket.emit('join', {
      userId: this.currentUser.id,
      userName: this.currentUser.name,
      chatRoom: this.currentChatRoom
    });
  }

  // 이벤트 리스너 설정
  setupEventListeners() {
    const messageInput = document.getElementById('messageInput');
    const sendBtn = document.getElementById('sendBtn');

    if (messageInput && sendBtn) {
      // Enter 키로 메시지 전송
      messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.sendMessage();
        }
      });

      // 전송 버튼 클릭
      sendBtn.addEventListener('click', () => {
        this.sendMessage();
      });

      // 타이핑 상태 처리
      messageInput.addEventListener('input', () => {
        this.handleTyping();
      });

      messageInput.addEventListener('blur', () => {
        this.stopTyping();
      });
    }

    // 뒤로가기 버튼
    const backBtn = document.querySelector('.back-button');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        window.location.href = '/Main/index.html';
      });
    }

    // 테마 토글
    const themeToggle = document.querySelector('.theme-toggle');
    if (themeToggle) {
      themeToggle.addEventListener('click', () => {
        this.toggleTheme();
      });
    }
  }

  // 메시지 전송
  sendMessage() {
    const messageInput = document.getElementById('messageInput');
    const content = messageInput.value.trim();

    if (!content) return;

    console.log('메시지 전송 시도:', content);

    // Socket을 통해 메시지 전송
    this.socket.emit('send_message', {
      content: content,
      messageType: 'text'
    });

    // 입력 필드 초기화
    messageInput.value = '';
    
    // 타이핑 상태 중지
    this.stopTyping();
  }

  // 최근 메시지 로드
  loadRecentMessages(messages) {
    const messagesContainer = document.getElementById('messagesContainer');
    if (!messagesContainer) return;

    // 기존 메시지 제거 (샘플 메시지들)
    messagesContainer.innerHTML = '';

    // 메시지 그룹 생성
    const messageGroup = document.createElement('div');
    messageGroup.className = 'message-group';

    // 날짜 표시
    const messageDate = document.createElement('div');
    messageDate.className = 'message-date';
    messageDate.textContent = '오늘';
    messageGroup.appendChild(messageDate);

    // 메시지들 표시
    messages.forEach(message => {
      this.displayMessage(message, messageGroup);
    });

    messagesContainer.appendChild(messageGroup);
    this.scrollToBottom();
  }

  // 메시지 표시
  displayMessage(message, container = null) {
    const messagesContainer = container || document.getElementById('messagesContainer');
    if (!messagesContainer) return;

    let messageGroup = container;
    if (!messageGroup) {
      messageGroup = messagesContainer.querySelector('.message-group');
      if (!messageGroup) {
        messageGroup = document.createElement('div');
        messageGroup.className = 'message-group';
        messagesContainer.appendChild(messageGroup);
      }
    }

    const messageElement = document.createElement('div');
    const isOwnMessage = message.sender._id === this.currentUser.id;
    messageElement.className = `message ${isOwnMessage ? 'own' : 'other'}`;

    const timestamp = new Date(message.timestamp);
    const timeString = `${timestamp.getHours().toString().padStart(2, '0')}:${timestamp.getMinutes().toString().padStart(2, '0')}`;

    if (isOwnMessage) {
      messageElement.innerHTML = `
        <div class="message-content">
          <div class="message-header">
            <span class="message-time">${timeString}</span>
          </div>
          <div class="message-text">${this.escapeHtml(message.content)}</div>
        </div>
      `;
    } else {
      const avatar = this.getAvatarForUser(message.senderName);
      messageElement.innerHTML = `
        <div class="message-avatar">${avatar}</div>
        <div class="message-content">
          <div class="message-header">
            <span class="sender-name">${this.escapeHtml(message.senderName)}</span>
            <span class="message-time">${timeString}</span>
          </div>
          <div class="message-text">${this.escapeHtml(message.content)}</div>
        </div>
      `;
    }

    messageGroup.appendChild(messageElement);
    this.scrollToBottom();
  }

  // 시스템 메시지 표시
  showSystemMessage(text) {
    const messagesContainer = document.getElementById('messagesContainer');
    if (!messagesContainer) return;

    let messageGroup = messagesContainer.querySelector('.message-group');
    if (!messageGroup) {
      messageGroup = document.createElement('div');
      messageGroup.className = 'message-group';
      messagesContainer.appendChild(messageGroup);
    }

    const systemMessage = document.createElement('div');
    systemMessage.className = 'system-message';
    systemMessage.innerHTML = `<span>${this.escapeHtml(text)}</span>`;

    messageGroup.appendChild(systemMessage);
    this.scrollToBottom();
  }

  // 타이핑 상태 처리
  handleTyping() {
    if (!this.isTyping) {
      this.isTyping = true;
      this.socket.emit('typing_start');
    }

    // 타이핑 타이머 재설정
    clearTimeout(this.typingTimer);
    this.typingTimer = setTimeout(() => {
      this.stopTyping();
    }, 1000);
  }

  // 타이핑 중지
  stopTyping() {
    if (this.isTyping) {
      this.isTyping = false;
      this.socket.emit('typing_stop');
      clearTimeout(this.typingTimer);
    }
  }

  // 타이핑 상태 표시
  handleTypingStatus(data) {
    const typingIndicator = document.getElementById('typingIndicator');
    const typingText = document.getElementById('typingText');
    
    if (!typingIndicator || !typingText) return;

    if (data.isTyping) {
      typingText.textContent = `${data.userName}님이 입력 중입니다...`;
      typingIndicator.style.display = 'block';
    } else {
      typingIndicator.style.display = 'none';
    }
  }

  // 온라인 사용자 업데이트
  updateOnlineUsers(users) {
    const memberCount = document.querySelector('.member-count');
    if (memberCount) {
      memberCount.textContent = `${users.length}명 참여 중`;
    }
    console.log('온라인 사용자:', users);
  }

  // 스크롤을 맨 아래로
  scrollToBottom() {
    const messagesContainer = document.getElementById('messagesContainer');
    if (messagesContainer) {
      setTimeout(() => {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }, 100);
    }
  }

  // 테마 토글
  toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    
    const themeIcon = document.querySelector('.theme-icon');
    if (themeIcon) {
      themeIcon.textContent = newTheme === 'dark' ? '☀️' : '🌙';
    }
  }

  // 알림 표시
  showNotification(message, type = 'info') {
    // 간단한 알림 구현
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 20px;
      border-radius: 8px;
      color: white;
      font-weight: 500;
      z-index: 10000;
      animation: slideIn 0.3s ease;
      background-color: ${type === 'error' ? '#e74c3c' : '#3498db'};
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.remove();
    }, 3000);
  }

  // HTML 이스케이프
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // 사용자 아바타 가져오기
  getAvatarForUser(userName) {
    const avatars = ['👤', '👩', '👨', '🧑', '👱', '👩‍💼', '👨‍💼', '🧑‍💻'];
    const index = userName.charCodeAt(0) % avatars.length;
    return avatars[index];
  }
}

// 페이지 로드 시 실시간 채팅 초기화
document.addEventListener('DOMContentLoaded', () => {
  // 테마 초기화
  const savedTheme = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  
  const themeIcon = document.querySelector('.theme-icon');
  if (themeIcon) {
    themeIcon.textContent = savedTheme === 'dark' ? '☀️' : '🌙';
  }

  // 실시간 채팅 시작
  new RealtimeChat();
});

// CSS 애니메이션 추가
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  .system-message {
    text-align: center;
    margin: 10px 0;
    padding: 8px 16px;
    background: rgba(52, 152, 219, 0.1);
    border-radius: 20px;
    font-size: 0.9em;
    color: #3498db;
  }
  
  .typing-indicator {
    padding: 8px 16px;
    font-size: 0.9em;
    color: #7f8c8d;
    font-style: italic;
  }
`;
document.head.appendChild(style); 
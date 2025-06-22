// 유틸리티 함수들
const Utils = {
  // 로딩 상태 관리
  showLoading: function(show, message = '로딩 중...') {
    // 로딩 구현
    console.log(show ? `로딩 시작: ${message}` : '로딩 완료');
  },

  // 알림 표시
  showAlert: function(title, message, callback) {
    alert(`${title}: ${message}`);
    if (callback) callback();
  },

  // 로컬 스토리지 헬퍼
  storage: {
    set: function(key, value) {
      localStorage.setItem(key, JSON.stringify(value));
    },
    get: function(key) {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    },
    remove: function(key) {
      localStorage.removeItem(key);
    }
  },

  // API 호출 헬퍼
  api: {
    call: async function(url, options = {}) {
      try {
        const response = await fetch(url, {
          headers: {
            'Content-Type': 'application/json',
            ...options.headers
          },
          ...options
        });
        return await response.json();
      } catch (error) {
        console.error('API 호출 에러:', error);
        throw error;
      }
    }
  }
};

// 전역에서 사용할 수 있도록 window 객체에 추가
if (typeof window !== 'undefined') {
  window.Utils = Utils;
} 
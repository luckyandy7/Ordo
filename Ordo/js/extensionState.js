// 확장 프로그램 상태 관리 (더미 파일)
const ExtensionState = {
  isActive: false,
  
  init: function() {
    console.log('ExtensionState 초기화됨');
  },
  
  setState: function(state) {
    this.isActive = state;
  },
  
  getState: function() {
    return this.isActive;
  }
};

// 전역에서 사용할 수 있도록 window 객체에 추가
if (typeof window !== 'undefined') {
  window.ExtensionState = ExtensionState;
} 
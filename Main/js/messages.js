// 응원 메시지 목록
const encouragingMessages = [
  "오늘도 함께 힘내봐요",
  "당신의 하루를 응원해요",
  "작은 진전도 큰 성과예요",
  "오늘 하루도 잘 해내실 거예요",
  "한 걸음씩 천천히 나아가요",
  "당신의 노력이 빛날 거예요",
  "함께라서 더 행복한 하루",
  "오늘도 멋진 하루 보내세요",
  "작은 목표부터 하나씩 이뤄봐요",
  "당신의 계획을 믿어요",
];

// 랜덤한 응원 메시지를 반환하는 함수
function getRandomMessage() {
  const randomIndex = Math.floor(Math.random() * encouragingMessages.length);
  return encouragingMessages[randomIndex];
}

// 메시지 업데이트 함수
function updateEncouragingMessage() {
  const subtitleElement = document.querySelector(".subtitle");
  if (subtitleElement) {
    subtitleElement.textContent = getRandomMessage();
  }
}

// 커스텀 확인 모달 함수
function showConfirmModal(title, message, onConfirm, icon = "🗑️") {
  const modal = document.getElementById("confirmModal");
  const titleEl = document.getElementById("confirmTitle");
  const messageEl = document.getElementById("confirmMessage");
  const iconEl = document.querySelector(".confirm-icon");
  const cancelBtn = document.getElementById("confirmCancel");
  const okBtn = document.getElementById("confirmOk");

  titleEl.textContent = title;
  messageEl.textContent = message;
  iconEl.textContent = icon;

  modal.classList.add("show");

  // 이벤트 리스너 제거 (중복 방지)
  const newCancelBtn = cancelBtn.cloneNode(true);
  const newOkBtn = okBtn.cloneNode(true);
  cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
  okBtn.parentNode.replaceChild(newOkBtn, okBtn);

  // 취소 버튼
  newCancelBtn.addEventListener("click", () => {
    modal.classList.remove("show");
  });

  // 확인 버튼
  newOkBtn.addEventListener("click", () => {
    modal.classList.remove("show");
    if (onConfirm) onConfirm();
  });

  // 모달 외부 클릭 시 닫기
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.classList.remove("show");
    }
  });
}

// 전체 삭제 버튼 이벤트는 main.js에서 처리됩니다

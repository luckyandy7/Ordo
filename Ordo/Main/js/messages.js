// 응원 메시지 목록
const encouragingMessages = {
  morning: [
    "좋은 아침이에요! 오늘도 화이팅! ☀️",
    "새로운 하루가 시작되었어요. 멋진 하루 보내세요! 🌅",
    "상쾌한 아침입니다. 오늘의 목표를 달성해보세요! 💪",
    "아침의 햇살처럼 밝은 하루 되세요! ✨",
    "일찍 일어나는 새가 먹이를 잡는다고 하죠. 오늘도 성취의 하루! 🐦",
    "Horae가 당신의 하루를 응원합니다! 🌟",
  ],
  afternoon: [
    "점심시간이네요! 맛있는 식사 하세요 🍽️",
    "오후에도 힘내세요! 거의 다 왔어요! 💼",
    "오후의 따뜻한 햇살처럼 포근한 시간 되세요 🌞",
    "하루의 중반부, 잠시 쉬어가도 좋아요 ☕",
    "오후의 에너지로 남은 일정들을 완주하세요! 🚀",
    "Horae가 오후의 활력을 선사합니다! ⚡",
  ],
  evening: [
    "하루 수고하셨어요! 🌆",
    "저녁 시간입니다. 오늘 하루도 멋지게 마무리하세요! 🌙",
    "고생하신 하루, 따뜻한 저녁 되세요 🏠",
    "별이 뜨는 시간, 평안한 저녁 보내세요 ⭐",
    "하루의 마무리, 내일을 위한 준비도 잊지 마세요! 📝",
    "Horae가 평온한 저녁을 기원합니다! 🌠",
  ],
  late: [
    "밤늦은 시간이네요. 충분한 휴식 취하세요 🌙",
    "오늘도 정말 수고 많으셨어요. 좋은 꿈 꾸세요! 😴",
    "늦은 시간까지 열심히 하시는군요. 건강 챙기세요! 💤",
    "달빛이 아름다운 밤입니다. 평안한 밤 되세요 🌝",
    "내일을 위해 충분한 수면을 취하세요! 💤",
    "Horae가 좋은 꿈을 선물합니다! 🌙",
  ],
};

// 계절별 메시지 추가
const seasonalMessages = {
  spring: [
    "봄의 새로운 시작처럼, 오늘도 새로운 도전을! 🌸",
    "꽃이 피는 계절, 당신의 꿈도 활짝 피어나길! 🌷",
    "Horae와 함께하는 화사한 봄날! 🌺",
  ],
  summer: [
    "뜨거운 여름만큼 열정적인 하루 되세요! ☀️",
    "시원한 에어컨처럼 상쾌한 기분으로! 🏖️",
    "Horae가 시원한 바람을 불어드려요! 🌊",
  ],
  autumn: [
    "가을의 단풍처럼 알록달록한 하루! 🍂",
    "수확의 계절, 오늘도 좋은 결실을! 🍎",
    "Horae가 풍성한 가을을 선사합니다! 🍁",
  ],
  winter: [
    "추운 겨울이지만 따뜻한 마음으로! ❄️",
    "눈꽃처럼 아름다운 하루 되세요! ⛄",
    "Horae가 따뜻한 온기를 전해드려요! 🔥",
  ]
};

// 랜덤한 응원 메시지를 반환하는 함수
function getRandomMessage() {
  const randomIndex = Math.floor(Math.random() * encouragingMessages.length);
  return encouragingMessages[randomIndex];
}

// 메시지 업데이트 함수
function updateEncouragingMessage() {
  const subtitleElement = document.querySelector('.subtitle');
  if (!subtitleElement) return;

  const hour = new Date().getHours();
  const month = new Date().getMonth() + 1;
  
  let timeOfDay;
  if (hour >= 6 && hour < 12) {
    timeOfDay = 'morning';
  } else if (hour >= 12 && hour < 18) {
    timeOfDay = 'afternoon';
  } else if (hour >= 18 && hour < 22) {
    timeOfDay = 'evening';
  } else {
    timeOfDay = 'late';
  }

  // 계절 결정
  let season;
  if (month >= 3 && month <= 5) {
    season = 'spring';
  } else if (month >= 6 && month <= 8) {
    season = 'summer';
  } else if (month >= 9 && month <= 11) {
    season = 'autumn';
  } else {
    season = 'winter';
  }

  // 30% 확률로 계절 메시지, 70% 확률로 시간대 메시지
  const useSeasonalMessage = Math.random() < 0.3;
  
  let messages;
  if (useSeasonalMessage) {
    messages = seasonalMessages[season];
  } else {
    messages = encouragingMessages[timeOfDay];
  }

  const randomIndex = Math.floor(Math.random() * messages.length);
  const message = messages[randomIndex];
  
  subtitleElement.textContent = message;
  
  // 메시지 변경 애니메이션
  subtitleElement.style.opacity = '0';
  setTimeout(() => {
    subtitleElement.style.opacity = '1';
  }, 200);
}

// 5분마다 메시지 업데이트
setInterval(updateEncouragingMessage, 5 * 60 * 1000);

// 사용자 활동 메시지
const activityMessages = {
  eventAdd: [
    "새로운 일정이 추가되었어요! 📅",
    "일정 관리의 달인이시네요! ✨",
    "체계적인 계획, 멋져요! 👏",
    "Horae가 일정 추가를 축하해요! 🎉",
  ],
  eventComplete: [
    "일정 완료! 정말 대단해요! ✅",
    "또 하나의 성취를 이루셨네요! 🏆",
    "꾸준함이 빛을 발하고 있어요! ⭐",
    "Horae가 당신의 성취를 응원합니다! 🌟",
  ],
  eventDelete: [
    "일정이 정리되었어요! 🗑️",
    "깔끔한 정리, 좋아요! 📋",
    "변경된 계획도 괜찮아요! 💪",
  ],
  horae: [
    "Horae의 지혜가 당신과 함께합니다! 🔮",
    "시간의 여신이 도움을 주었어요! 🌟",
    "AI의 힘으로 더 나은 하루를! 🚀",
    "Horae와 함께하는 스마트한 일정 관리! 💡",
  ]
};

// 활동별 랜덤 메시지 가져오기
function getActivityMessage(type) {
  const messages = activityMessages[type] || activityMessages.eventAdd;
  const randomIndex = Math.floor(Math.random() * messages.length);
  return messages[randomIndex];
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

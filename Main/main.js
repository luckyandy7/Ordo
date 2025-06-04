// 페이지 로드 시 사용자 정보 표시
document.addEventListener("DOMContentLoaded", () => {
  console.log("=== 메인 페이지 초기화 시작 ===");

  try {
    // 로그인 체크
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");

    if (!token || !user) {
      console.warn("로그인 정보가 없습니다. 로그인 페이지로 이동합니다.");
      // 로그인 페이지로 리다이렉트
      window.location.href = "/Login/email-login.html";
      return;
    }

    console.log("로그인 상태 확인됨:", JSON.parse(user));

    // 기본 UI 초기화 (오류가 발생해도 계속 진행)
    try {
      // 사용자 정보 표시
      updateUserDisplay();
    } catch (error) {
      console.error("사용자 정보 표시 오류:", error);
    }

    try {
      // 스토리지 변경 감지 (다른 탭에서 변경된 경우)
      window.addEventListener("storage", (e) => {
        if (e.key === "user" || e.key === "userData") {
          updateUserDisplay();
        }
      });
    } catch (error) {
      console.error("스토리지 이벤트 리스너 오류:", error);
    }

    try {
      // 테마 초기화
      initializeTheme();
    } catch (error) {
      console.error("테마 초기화 오류:", error);
    }

    try {
      // 퀵 액션 카드 이벤트 리스너
      setupQuickActions();
    } catch (error) {
      console.error("퀵 액션 설정 오류:", error);
    }

    try {
      // 스크롤 애니메이션 초기화
      initializeScrollAnimations();
    } catch (error) {
      console.error("스크롤 애니메이션 초기화 오류:", error);
    }

    // 버튼 이벤트 리스너들 (오류가 발생해도 계속 진행)
    try {
      // 개인정보 수정 버튼 이벤트 리스너
      const profileBtn = document.getElementById("profileBtn");
      if (profileBtn) {
        profileBtn.addEventListener("click", () => {
          showConfirmModal(
            "개인정보 수정",
            "개인정보 수정 페이지로 이동하시겠습니까?\n현재 페이지에서 작업 중인 내용이 있다면 저장해주세요.",
            function () {
              window.location.href = "/Main/profile.html";
            },
            "⚙️"
          );
        });
      }
    } catch (error) {
      console.error("프로필 버튼 이벤트 리스너 오류:", error);
    }

    try {
      // 로그아웃 버튼 이벤트 리스너
      const logoutBtn = document.getElementById("logoutBtn");
      if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
          showConfirmModal(
            "로그아웃",
            "정말로 로그아웃하시겠습니까?\n현재 작업 중인 내용이 저장되지 않을 수 있습니다.",
            function () {
              localStorage.removeItem("token");
              localStorage.removeItem("user");
              localStorage.removeItem("userData");
              window.location.href = "/Login/email-login.html";
            },
            "👋"
          );
        });
      }
    } catch (error) {
      console.error("로그아웃 버튼 이벤트 리스너 오류:", error);
    }

    // 캘린더 초기화 (비동기로 처리)
    try {
      initializeCalendar();
    } catch (error) {
      console.error("캘린더 초기화 오류:", error);
    }

    // 주간 이동 버튼 이벤트 리스너
    try {
      const prevWeekBtn = document.getElementById("prevWeek");
      const nextWeekBtn = document.getElementById("nextWeek");

      if (prevWeekBtn) {
        prevWeekBtn.addEventListener("click", () => {
          currentDate.setDate(currentDate.getDate() - 7);
          renderCalendar();
        });
      }

      if (nextWeekBtn) {
        nextWeekBtn.addEventListener("click", () => {
          currentDate.setDate(currentDate.getDate() + 7);
          renderCalendar();
        });
      }
    } catch (error) {
      console.error("주간 이동 버튼 이벤트 리스너 오류:", error);
    }

    // 모달 관련 이벤트 리스너
    try {
      const modal = document.getElementById("eventModal");
      const eventForm = document.getElementById("eventForm");
      const cancelBtn = document.querySelector(".cancel-btn");

      if (cancelBtn && modal) {
        cancelBtn.addEventListener("click", () => {
          modal.classList.remove("show");
        });
      }

      if (eventForm) {
        eventForm.addEventListener("submit", async (e) => {
          e.preventDefault();
          const title = document.getElementById("eventTitle").value;
          const startTime = document.getElementById("eventStartTime").value;
          const endTime = document.getElementById("eventEndTime").value;
          const color = document.getElementById("eventColor").value;

          try {
            await addEvent(selectedDate, startTime, endTime, title, color);
            modal.classList.remove("show");
            renderCalendar();
          } catch (error) {
            console.error("일정 추가 실패:", error);
            alert("일정 추가에 실패했습니다.");
          }
        });
      }
    } catch (error) {
      console.error("모달 이벤트 리스너 오류:", error);
    }

    // 플로팅 버튼 관련 코드
    try {
      const floatingBtn = document.getElementById("floatingBtn");
      const floatingMenu = document.getElementById("floatingMenu");
      const horaeBtn = document.getElementById("horaeBtn");
      const dailyBtn = document.getElementById("dailyBtn");

      if (floatingBtn && floatingMenu) {
        let isMenuOpen = false;

        // 플로팅 버튼 클릭 이벤트
        floatingBtn.addEventListener("click", (e) => {
          e.stopPropagation();

          if (isMenuOpen) {
            closeFloatingMenu();
          } else {
            openFloatingMenu();
          }
        });

        // 메뉴 열기 함수
        function openFloatingMenu() {
          isMenuOpen = true;
          floatingBtn.classList.add("active");
          floatingMenu.classList.remove("hide");
          floatingMenu.classList.add("show");

          // 버튼 회전 애니메이션 후 원래대로
          setTimeout(() => {
            floatingBtn.classList.remove("active");
          }, 400);
        }

        // 메뉴 닫기 함수
        function closeFloatingMenu() {
          if (!isMenuOpen) return;

          isMenuOpen = false;
          floatingMenu.classList.add("hide");
          floatingMenu.classList.remove("show");

          // 애니메이션 완료 후 hide 클래스 제거
          setTimeout(() => {
            floatingMenu.classList.remove("hide");
          }, 300);
        }

        // 메뉴 외부 클릭 시 닫기
        document.addEventListener("click", (e) => {
          if (
            isMenuOpen &&
            !floatingBtn.contains(e.target) &&
            !floatingMenu.contains(e.target)
          ) {
            closeFloatingMenu();
          }
        });

        // ESC 키로 메뉴 닫기
        document.addEventListener("keydown", (e) => {
          if (e.key === "Escape" && isMenuOpen) {
            closeFloatingMenu();
          }
        });
      }

      // 메뉴 아이템 클릭 이벤트
      if (horaeBtn) {
        horaeBtn.addEventListener("click", (e) => {
          e.preventDefault();
          closeFloatingMenu();
          setTimeout(() => {
            alert("Horae의 추천 일정 기능은 준비 중입니다.");
          }, 200);
        });
      }

      if (dailyBtn) {
        dailyBtn.addEventListener("click", (e) => {
          e.preventDefault();
          closeFloatingMenu();
          setTimeout(() => {
            alert("Daily 한마디 기능은 준비 중입니다.");
          }, 200);
        });
      }

      // 새로운 메뉴 아이템들
      const collaborationBtn = document.getElementById("collaborationBtn");
      const chatBtn = document.getElementById("chatBtn");

      if (collaborationBtn) {
        collaborationBtn.addEventListener("click", (e) => {
          e.preventDefault();
          closeFloatingMenu();
          setTimeout(() => {
            showCollaborationModal();
          }, 200);
        });
      }

      if (chatBtn) {
        chatBtn.addEventListener("click", (e) => {
          e.preventDefault();
          closeFloatingMenu();
          setTimeout(() => {
            showChatModal();
          }, 200);
        });
      }
    } catch (error) {
      console.error("플로팅 버튼 이벤트 리스너 오류:", error);
    }

    // 대시보드 초기화 (지연 실행)
    setTimeout(() => {
      try {
        initializeDashboard();
      } catch (error) {
        console.error("대시보드 초기화 오류:", error);
      }
    }, 100);

    // 정기 업데이트 설정
    try {
      // 현재 시각 선 1분마다 업데이트
      setInterval(updateCurrentTimeLine, 60000);

      // 상대 시간과 다음 일정 1분마다 업데이트
      setInterval(() => {
        try {
          updateRecentActivity();
          updateTodayStats(); // 다음 일정 실시간 업데이트 추가
        } catch (error) {
          console.error("정기 업데이트 오류:", error);
        }
      }, 60000);
    } catch (error) {
      console.error("정기 업데이트 설정 오류:", error);
    }

    console.log("=== 메인 페이지 초기화 완료 ===");
  } catch (error) {
    console.error("=== 메인 페이지 초기화 전체 오류 ===", error);
    // 최소한의 기능이라도 작동하도록 기본 설정
    try {
      const userName = document.getElementById("userName");
      if (userName) {
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        userName.textContent = user.name || "사용자";
      }
    } catch (fallbackError) {
      console.error("기본 설정 오류:", fallbackError);
    }
  }
});

// API 호출 함수
async function fetchAPI(endpoint, options = {}) {
  const token = localStorage.getItem("token");

  if (!token) {
    console.error("토큰이 없습니다. 로그인이 필요합니다.");
    throw new Error("토큰이 없습니다. 로그인이 필요합니다.");
  }

  const defaultOptions = {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  };

  const url = `/api/events${endpoint}`;
  console.log("API 호출:", url, options);

  try {
    const response = await fetch(url, {
      ...defaultOptions,
      ...options,
      headers: {
        ...defaultOptions.headers,
        ...(options.headers || {}),
      },
    });

    console.log("API 응답 상태:", response.status, response.statusText);

    if (!response.ok) {
      let errorText = "";
      try {
        errorText = await response.text();
        console.error("API 오류 응답:", errorText);
      } catch (textError) {
        console.error("응답 텍스트 읽기 실패:", textError);
      }

      if (response.status === 401) {
        console.warn("토큰이 만료되었습니다. 로그인 페이지로 이동합니다.");
        // 토큰 만료 시 자동 로그아웃
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("userData");
        setTimeout(() => {
          window.location.href = "/Login/email-login.html";
        }, 1000);
        throw new Error("토큰이 만료되었습니다. 다시 로그인해주세요.");
      } else if (response.status === 404) {
        throw new Error("요청한 리소스를 찾을 수 없습니다.");
      } else if (response.status === 500) {
        throw new Error("서버 내부 오류가 발생했습니다.");
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    }

    const data = await response.json();
    console.log("API 응답 데이터:", data);
    return data;
  } catch (error) {
    console.error("fetchAPI 오류:", error);

    // 네트워크 오류인 경우
    if (error.name === "TypeError" && error.message.includes("fetch")) {
      throw new Error(
        "서버에 연결할 수 없습니다. 네트워크 연결을 확인해주세요."
      );
    }

    throw error;
  }
}

let currentDate = new Date();
let selectedDate = null;

// 캘린더 초기화 함수
function initializeCalendar() {
  renderCalendar();
}

// 현재 시각 선 업데이트 함수
function updateCurrentTimeLine() {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  const minutesSinceStart = (currentHour * 60 + currentMinute) * (60 / 60); // 60px 높이에 맞게 조정
  const existingLine = document.querySelector(".current-time-line");

  if (existingLine) {
    existingLine.style.top = `${minutesSinceStart}px`;
  } else {
    const eventGrid = document.querySelector(".event-grid");
    if (eventGrid) {
      const timeLine = document.createElement("div");
      timeLine.className = "current-time-line";
      timeLine.style.top = `${minutesSinceStart}px`;

      const timeMarker = document.createElement("div");
      timeMarker.className = "current-time-marker";

      timeLine.appendChild(timeMarker);
      eventGrid.appendChild(timeLine);
    }
  }
}

// 시간 포맷 함수
function formatTime(hour) {
  if (hour === 0) return "오전 12:00";
  if (hour === 12) return "오후 12:00";
  if (hour < 12) return `오전 ${hour}:00`;
  return `오후 ${hour - 12}:00`;
}

// 주차 계산 함수
function getWeekNumber(date) {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

// 요일 포맷 함수
function formatDayOfWeek(date) {
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  return days[date.getDay()];
}

// 캘린더 렌더링 함수
async function renderCalendar() {
  // 현재 주의 시작일과 종료일 계산
  const weekStart = new Date(currentDate);
  weekStart.setDate(currentDate.getDate() - currentDate.getDay());
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  // 주간 표시 업데이트
  const weekNumber = getWeekNumber(weekStart);
  document.querySelector(
    ".current-week"
  ).textContent = `${weekStart.getFullYear()}년 ${
    weekStart.getMonth() + 1
  }월 (${weekNumber}주차)`;

  // 요일 셀 생성
  const weekdayCells = document.querySelector(".weekday-cells");

  if (weekdayCells) {
    weekdayCells.innerHTML = "";

    for (let i = 0; i < 7; i++) {
      const columnDate = new Date(weekStart);
      columnDate.setDate(weekStart.getDate() + i);

      const weekdayCell = document.createElement("div");
      weekdayCell.className = "weekday";

      const dayName = document.createElement("span");
      dayName.className = "day-name";
      dayName.textContent = formatDayOfWeek(columnDate);

      const dateNumber = document.createElement("span");
      dateNumber.className = "date-number";
      dateNumber.textContent = columnDate.getDate();

      // 오늘 날짜인 경우 강조 표시
      const today = new Date();
      if (columnDate.toDateString() === today.toDateString()) {
        weekdayCell.classList.add("today");
      }

      weekdayCell.appendChild(dayName);
      weekdayCell.appendChild(dateNumber);
      weekdayCells.appendChild(weekdayCell);
    }
  }

  // 시간 컬럼 생성
  const timeColumn = document.querySelector(".time-column");
  timeColumn.innerHTML = "";
  for (let hour = 0; hour < 24; hour++) {
    const timeSlot = document.createElement("div");
    timeSlot.className = "time-slot";
    timeSlot.textContent = formatTime(hour);
    timeColumn.appendChild(timeSlot);
  }

  // 이벤트 그리드 생성
  const eventGrid = document.querySelector(".event-grid");
  eventGrid.innerHTML = "";

  // 날짜 컬럼 생성
  for (let i = 0; i < 7; i++) {
    const columnDate = new Date(weekStart);
    columnDate.setDate(weekStart.getDate() + i);

    const column = document.createElement("div");
    column.className = "event-column";
    column.dataset.date = columnDate.toISOString().split("T")[0];

    // 오늘 날짜인 경우 강조 표시
    const today = new Date();
    if (columnDate.toDateString() === today.toDateString()) {
      column.classList.add("today-column");
    }

    // 클릭 이벤트 추가 (클로저 문제 해결)
    column.addEventListener(
      "click",
      ((currentDate) => {
        return (e) => {
          if (e.target === column) {
            const rect = column.getBoundingClientRect();
            const y = e.clientY - rect.top;
            const hour = Math.floor(y / 60);
            const minutes = Math.round((y % 60) / (60 / 60));

            selectedDate = new Date(currentDate); // 새로운 Date 객체 생성
            console.log("=== 클릭 이벤트 디버깅 ===");
            console.log("클릭된 컬럼 인덱스:", i);
            console.log("주 시작일:", weekStart.toISOString().split("T")[0]);
            console.log(
              "계산된 컬럼 날짜:",
              currentDate.toISOString().split("T")[0]
            );
            console.log(
              "설정된 selectedDate:",
              selectedDate.toISOString().split("T")[0]
            );
            console.log("컬럼 data-date:", column.dataset.date);
            console.log("========================");
            showAddEventModal(hour, minutes);
          }
        };
      })(new Date(columnDate))
    ); // 현재 날짜를 즉시 실행 함수로 캡처

    eventGrid.appendChild(column);
  }

  // 그리드 라인 생성
  for (let hour = 0; hour < 24; hour++) {
    const gridLine = document.createElement("div");
    gridLine.className = "grid-line";
    gridLine.style.top = `${hour * 60}px`;
    eventGrid.appendChild(gridLine);
  }

  // 이벤트 로드 및 표시
  await loadEvents(weekStart, weekEnd);

  // 현재 시각 선 업데이트
  updateCurrentTimeLine();
}

// 이벤트 로드 함수 (완료 상태 포함, 자정 넘어가는 일정 분할 처리)
async function loadEvents(startDate, endDate) {
  try {
    console.log("일정 로드 시작 - 날짜 범위:", { startDate, endDate });

    // 전체 일정을 조회하고 클라이언트에서 필터링
    let allEvents = [];

    try {
      // 먼저 전체 일정 조회 시도
      console.log("전체 일정 조회 시도...");
      allEvents = await fetchAPI("");
      console.log("전체 일정 조회 성공:", allEvents.length, "개");
    } catch (error) {
      console.error("전체 일정 조회 실패, 오늘 날짜로 대체 조회:", error);

      // 전체 조회 실패 시 오늘 날짜 기준으로 조회
      try {
        const today = new Date();
        allEvents = await fetchAPI(`/date/${today.toISOString()}`);
        console.log("오늘 일정 조회 결과:", allEvents.length, "개");
      } catch (todayError) {
        console.error("오늘 일정 조회도 실패:", todayError);
        allEvents = [];
      }
    }

    console.log("전체 로드된 일정 수:", allEvents.length);
    console.log("전체 일정 목록:", allEvents);

    // 중복 제거 (같은 ID의 일정이 여러 번 조회될 수 있음)
    const uniqueEvents = allEvents.filter(
      (event, index, self) =>
        index === self.findIndex((e) => e._id === event._id)
    );

    console.log("중복 제거 후 일정 수:", uniqueEvents.length);

    // 날짜 범위 재확인 (더 정확한 필터링)
    const events = uniqueEvents.filter((event) => {
      const eventDate = new Date(event.date);
      const eventDateOnly = new Date(
        eventDate.getFullYear(),
        eventDate.getMonth(),
        eventDate.getDate()
      );
      const startDateOnly = new Date(
        startDate.getFullYear(),
        startDate.getMonth(),
        startDate.getDate()
      );
      const endDateOnly = new Date(
        endDate.getFullYear(),
        endDate.getMonth(),
        endDate.getDate()
      );

      return eventDateOnly >= startDateOnly && eventDateOnly <= endDateOnly;
    });

    console.log("최종 주간 범위 일정 수:", events.length);
    console.log("최종 주간 범위 일정들:", events);

    events.forEach((event) => {
      const eventDate = new Date(event.date);
      const startHour = eventDate.getHours();
      const startMinutes = eventDate.getMinutes();
      const duration = event.duration || 60;
      const isCompleted = completedEvents.includes(event._id);

      // 자정을 넘어가는 일정인지 확인
      const endTime = new Date(eventDate.getTime() + duration * 60000);
      const eventEndDate = new Date(
        endTime.getFullYear(),
        endTime.getMonth(),
        endTime.getDate()
      );
      const eventStartDate = new Date(
        eventDate.getFullYear(),
        eventDate.getMonth(),
        eventDate.getDate()
      );

      if (eventEndDate.getTime() > eventStartDate.getTime()) {
        // 자정을 넘어가는 일정 - 분할 처리
        console.log("자정 넘어가는 일정 감지:", event.title);

        // 첫 번째 부분: 시작일의 시작 시간부터 자정까지 (분 단위로 정확히 계산)
        const minutesToMidnight = 24 * 60 - (startHour * 60 + startMinutes);
        if (minutesToMidnight > 0) {
          createEventBlock(
            eventDate,
            startHour,
            startMinutes,
            minutesToMidnight,
            event,
            isCompleted,
            true
          );
        }

        // 두 번째 부분: 다음날 자정부터 종료 시간까지
        const nextDay = new Date(eventDate);
        nextDay.setDate(nextDay.getDate() + 1);
        nextDay.setHours(0, 0, 0, 0);

        const remainingMinutes = duration - minutesToMidnight;
        if (remainingMinutes > 0) {
          createEventBlock(
            nextDay,
            0,
            0,
            remainingMinutes,
            event,
            isCompleted,
            true
          );
        }
      } else {
        // 일반적인 일정 (자정을 넘지 않음)
        createEventBlock(
          eventDate,
          startHour,
          startMinutes,
          duration,
          event,
          isCompleted,
          false
        );
      }
    });
  } catch (error) {
    console.error("이벤트 로드 실패:", error);
  }
}

// 이벤트 블록 생성 헬퍼 함수
function createEventBlock(
  eventDate,
  startHour,
  startMinutes,
  duration,
  event,
  isCompleted,
  isSplit = false
) {
  const dateStr = eventDate.toISOString().split("T")[0];
  console.log("이벤트 블록 생성:", dateStr, event.title);

  const column = document.querySelector(
    `.event-column[data-date^='${dateStr}']`
  );

  if (column) {
    const timeBlock = document.createElement("div");
    timeBlock.className = `time-block fade-in ${
      isCompleted ? "completed" : ""
    }`;
    timeBlock.style.top = `${(startHour * 60 + startMinutes) * (60 / 60)}px`;
    timeBlock.style.height = `${duration * (60 / 60)}px`;
    timeBlock.style.backgroundColor = event.color || "#FFE5E5";

    // 그룹 ID가 있으면 데이터 속성으로 저장
    if (event.groupId) {
      timeBlock.dataset.groupId = event.groupId;
    }

    // 일정 내용 컨테이너
    const eventContent = document.createElement("div");
    eventContent.className = "event-content";
    // 분할된 일정인 경우 표시 구분 (선택사항)
    eventContent.textContent = isSplit ? event.title + " ⏰" : event.title;

    // 완료 체크박스
    const completeCheckbox = document.createElement("input");
    completeCheckbox.type = "checkbox";
    completeCheckbox.className = "complete-checkbox";
    completeCheckbox.checked = isCompleted;
    completeCheckbox.title = isCompleted ? "완료됨" : "미완료";

    completeCheckbox.addEventListener("change", (e) => {
      e.stopPropagation();
      const isNowCompleted = e.target.checked;

      // 그룹 ID가 있으면 연결된 모든 일정의 완료 상태 변경
      if (event.groupId) {
        toggleGroupEventCompletion(event.groupId, event.title, isNowCompleted);
      } else {
        toggleEventCompletion(event._id, event.title, isNowCompleted);
      }

      // UI 즉시 업데이트
      if (isNowCompleted) {
        timeBlock.classList.add("completed");
        e.target.title = "완료됨";
      } else {
        timeBlock.classList.remove("completed");
        e.target.title = "미완료";
      }
    });

    // 삭제 버튼
    const deleteBtn = document.createElement("button");
    deleteBtn.className = "delete-event-btn";
    deleteBtn.textContent = "×";
    deleteBtn.onclick = async (e) => {
      e.stopPropagation();

      const confirmMessage = event.groupId
        ? `"${event.title.replace(
            / \([12]일차\)/,
            ""
          )}" 일정 전체를 삭제하시겠습니까?\n(연결된 모든 블록이 삭제됩니다)`
        : `"${event.title}" 일정을 삭제하시겠습니까?`;

      showConfirmModal("일정 삭제", confirmMessage, async function () {
        try {
          if (event.groupId) {
            // 그룹으로 연결된 모든 일정 삭제
            await deleteGroupEvents(event.groupId, event.title);
          } else {
            // 단일 일정 삭제
            timeBlock.classList.add("removing");
            await fetchAPI(`/${event._id}`, { method: "DELETE" });

            // 완료 목록에서도 제거
            completedEvents = completedEvents.filter((id) => id !== event._id);
            localStorage.setItem(
              "completedEvents",
              JSON.stringify(completedEvents)
            );

            addActivity(
              "delete",
              `"${event.title}" 일정이 삭제되었습니다`,
              event.title
            );

            timeBlock.addEventListener(
              "animationend",
              () => {
                timeBlock.remove();
                setTimeout(() => {
                  updateTodayStats();
                  updateWeekStatsSimple();
                }, 100);
              },
              { once: true }
            );
          }
        } catch (error) {
          console.error("일정 삭제 실패:", error);
          showActivityNotification({
            icon: "❌",
            message: "일정 삭제에 실패했습니다.",
          });
          timeBlock.classList.remove("removing");
        }
      });
    };

    timeBlock.appendChild(completeCheckbox);
    timeBlock.appendChild(eventContent);
    timeBlock.appendChild(deleteBtn);
    column.appendChild(timeBlock);
  }
}

// 일정 추가 모달 표시 함수
function showAddEventModal(hour = 0, minutes = 0) {
  const modal = document.getElementById("eventModal");
  const startTimeInput = document.getElementById("eventStartTime");
  const endTimeInput = document.getElementById("eventEndTime");

  // 시작 시간 설정
  startTimeInput.value = `${hour.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}`;

  // 종료 시간은 시작 시간 + 1시간으로 설정
  const endHour = (hour + 1) % 24;
  endTimeInput.value = `${endHour.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}`;

  modal.classList.add("show");
  document.getElementById("eventTitle").focus();
}

// 활동 로그 관리
let activityLog = JSON.parse(localStorage.getItem("activityLog")) || [];

// 활동 추가 함수
function addActivity(type, message, eventTitle = "") {
  const activity = {
    id: Date.now(),
    type: type, // 'add', 'edit', 'delete'
    message: message,
    eventTitle: eventTitle,
    timestamp: new Date(),
    icon: getActivityIcon(type),
  };

  // 최신 활동을 맨 앞에 추가
  activityLog.unshift(activity);

  // 최대 10개까지만 저장
  if (activityLog.length > 10) {
    activityLog = activityLog.slice(0, 10);
  }

  // 로컬 스토리지에 저장
  localStorage.setItem("activityLog", JSON.stringify(activityLog));

  // UI 업데이트
  updateRecentActivity();

  // 새 활동 알림 애니메이션
  showActivityNotification(activity);
}

// 활동 타입별 아이콘 반환
function getActivityIcon(type) {
  const icons = {
    add: "✅",
    edit: "📝",
    delete: "🗑️",
    view: "👀",
    complete: "🎉",
  };
  return icons[type] || "📋";
}

// 시간 포맷 함수 (상대 시간)
function getRelativeTime(timestamp) {
  const now = new Date();
  const diff = now - new Date(timestamp);
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "방금 전";
  if (minutes < 60) return `${minutes}분 전`;
  if (hours < 24) return `${hours}시간 전`;
  if (days < 7) return `${days}일 전`;
  return new Date(timestamp).toLocaleDateString();
}

// 개별 활동 삭제 함수
function removeActivity(activityId) {
  activityLog = activityLog.filter((activity) => activity.id !== activityId);
  localStorage.setItem("activityLog", JSON.stringify(activityLog));
  updateRecentActivity();
}

// 모든 활동 삭제 함수
function clearAllActivities() {
  if (activityLog.length === 0) {
    showActivityNotification({
      icon: "📋",
      message: "삭제할 활동이 없습니다",
    });
    return;
  }

  showConfirmModal(
    "전체 삭제",
    `모든 활동 기록(${activityLog.length}개)을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`,
    function () {
      activityLog = [];
      localStorage.setItem("activityLog", JSON.stringify(activityLog));
      updateRecentActivity();

      showActivityNotification({
        icon: "🗑️",
        message: "모든 활동이 삭제되었습니다",
      });
    }
  );
}

// 최근 활동 업데이트 (개별 삭제 버튼 포함)
function updateRecentActivity() {
  const activityList = document.getElementById("activityList");

  if (activityLog.length === 0) {
    activityList.innerHTML = `
      <div class="activity-item empty-activity">
        <div class="activity-icon">📋</div>
        <div class="activity-content">
          <span class="activity-text">아직 활동이 없습니다</span>
          <span class="activity-time">일정을 추가해보세요!</span>
        </div>
      </div>
    `;
    return;
  }

  activityList.innerHTML = activityLog
    .map(
      (activity, index) => `
    <div class="activity-item" style="animation: slideInRight 0.5s ease-out ${
      index * 0.1
    }s backwards;">
      <div class="activity-icon">${activity.icon}</div>
      <div class="activity-content">
        <span class="activity-text">${activity.message}</span>
        <span class="activity-time">${getRelativeTime(
          activity.timestamp
        )}</span>
      </div>
      <button class="activity-delete-btn" onclick="removeActivityWithAnimation(${
        activity.id
      })" title="이 활동 삭제">
        ×
      </button>
    </div>
  `
    )
    .join("");
}

// 애니메이션과 함께 활동 삭제
function removeActivityWithAnimation(activityId) {
  const activityElement = event.target.closest(".activity-item");

  if (activityElement) {
    showConfirmModal("활동 삭제", "이 활동을 삭제하시겠습니까?", function () {
      activityElement.classList.add("removing");

      // 애니메이션 완료 후 실제 삭제
      setTimeout(() => {
        removeActivity(activityId);
      }, 300);
    });
  }
}

// 활동 알림 표시
function showActivityNotification(activity) {
  const notification = document.createElement("div");
  notification.className = "activity-notification";
  notification.innerHTML = `
    <div class="notification-icon">${activity.icon}</div>
    <div class="notification-text">${activity.message}</div>
  `;

  document.body.appendChild(notification);

  // 애니메이션 후 제거
  setTimeout(() => {
    notification.classList.add("show");
  }, 100);

  setTimeout(() => {
    notification.classList.remove("show");
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 300);
  }, 3000);
}

// 일정 추가 함수 수정 (자정 넘어가는 일정 분할 처리)
async function addEvent(date, startTime, endTime, title, color) {
  try {
    console.log("=== addEvent 함수 디버깅 ===");
    console.log("전달받은 date 객체:", date);
    console.log("date 타입:", typeof date);
    console.log("date.toISOString():", date ? date.toISOString() : "null");
    console.log("startTime:", startTime, "endTime:", endTime);
    console.log("============================");

    const [startHour, startMinute] = startTime.split(":").map(Number);
    const [endHour, endMinute] = endTime.split(":").map(Number);

    const eventDate = new Date(date);
    eventDate.setHours(startHour, startMinute, 0);

    console.log("최종 eventDate:", eventDate.toISOString());
    console.log("저장될 날짜:", eventDate.toISOString().split("T")[0]);

    // 자정을 넘어가는 일정인지 확인
    console.log("=== 자정 넘어가는 일정 판단 ===");
    console.log("startHour:", startHour, "startMinute:", startMinute);
    console.log("endHour:", endHour, "endMinute:", endMinute);
    console.log("endHour < startHour:", endHour < startHour);
    console.log(
      "endHour === startHour && endMinute <= startMinute:",
      endHour === startHour && endMinute <= startMinute
    );

    if (
      endHour < startHour ||
      (endHour === startHour && endMinute <= startMinute)
    ) {
      console.log("🌙 자정 넘어가는 일정으로 판단됨!");
      // 자정을 넘어가는 경우 두 개의 일정으로 분할
      // 그룹 ID 생성 (연결된 일정들을 식별하기 위함)
      const groupId = Date.now().toString();
      console.log("생성된 groupId:", groupId);

      // 첫 번째 일정: 시작 시간부터 자정까지 (정확한 분 계산)
      const minutesToMidnight = 24 * 60 - (startHour * 60 + startMinute);

      const firstEventResponse = await fetchAPI("/", {
        method: "POST",
        body: JSON.stringify({
          title: title + " (1일차)",
          date: eventDate.toISOString(),
          duration: minutesToMidnight,
          color,
          groupId: groupId, // 그룹 ID 추가
        }),
      });

      console.log("첫 번째 일정 생성 응답:", firstEventResponse);

      // 두 번째 일정: 자정부터 종료 시간까지 (다음 날)
      const nextDay = new Date(eventDate);
      nextDay.setDate(nextDay.getDate() + 1);
      nextDay.setHours(0, 0, 0);

      // 다음날 종료 시간까지의 분 계산
      const remainingMinutes = endHour * 60 + endMinute;

      const secondEventResponse = await fetchAPI("/", {
        method: "POST",
        body: JSON.stringify({
          title: title + " (2일차)",
          date: nextDay.toISOString(),
          duration: remainingMinutes,
          color,
          groupId: groupId, // 같은 그룹 ID
        }),
      });

      console.log("두 번째 일정 생성 응답:", secondEventResponse);

      // 활동 로그 추가
      addActivity("add", `"${title}" 일정이 2일에 걸쳐 추가되었습니다`, title);

      // UI 업데이트 - 첫 번째 일정
      updateUIForNewEvent(
        eventDate,
        startHour,
        startMinute,
        minutesToMidnight,
        title + " (1일차)",
        color,
        firstEventResponse._id,
        groupId
      );

      // UI 업데이트 - 두 번째 일정
      updateUIForNewEvent(
        nextDay,
        0,
        0,
        remainingMinutes,
        title + " (2일차)",
        color,
        secondEventResponse._id,
        groupId
      );
    } else {
      console.log("☀️ 일반 일정으로 판단됨 (자정을 넘지 않음)");
      // 일반적인 일정 (자정을 넘지 않음)
      let duration = endHour * 60 + endMinute - (startHour * 60 + startMinute);
      console.log("계산된 duration:", duration, "분");

      // duration이 0 이하인 경우 기본값 60분으로 설정
      if (duration <= 0) duration = 60;

      const response = await fetchAPI("/", {
        method: "POST",
        body: JSON.stringify({
          title,
          date: eventDate.toISOString(),
          duration,
          color,
        }),
      });

      // 활동 로그 추가
      addActivity("add", `"${title}" 일정이 추가되었습니다`, title);

      // UI 업데이트
      updateUIForNewEvent(
        eventDate,
        startHour,
        startMinute,
        duration,
        title,
        color,
        response._id
      );
    }

    // 대시보드 통계 업데이트
    setTimeout(() => {
      updateTodayStats();
      updateWeekStatsSimple();
    }, 100);
  } catch (error) {
    console.error("일정 추가 실패:", error);
    throw error;
  }
}

// UI 업데이트를 위한 헬퍼 함수
function updateUIForNewEvent(
  eventDate,
  startHour,
  startMinutes,
  duration,
  title,
  color,
  eventId,
  groupId = null
) {
  const dateStr = eventDate.toISOString().split("T")[0];
  const column = document.querySelector(
    `.event-column[data-date^='${dateStr}']`
  );

  if (column) {
    const timeBlock = document.createElement("div");
    timeBlock.className = "time-block fade-in";
    timeBlock.style.top = `${(startHour * 60 + startMinutes) * (60 / 60)}px`;
    timeBlock.style.height = `${duration * (60 / 60)}px`;
    timeBlock.style.backgroundColor = color || "#FFE5E5";

    // 그룹 ID가 있으면 데이터 속성으로 저장
    if (groupId) {
      timeBlock.dataset.groupId = groupId;
    }

    // 일정 내용 컨테이너
    const eventContent = document.createElement("div");
    eventContent.className = "event-content";
    eventContent.textContent = title;

    // 완료 체크박스
    const completeCheckbox = document.createElement("input");
    completeCheckbox.type = "checkbox";
    completeCheckbox.className = "complete-checkbox";
    completeCheckbox.checked = false;
    completeCheckbox.title = "미완료";

    completeCheckbox.addEventListener("change", (e) => {
      e.stopPropagation();
      const isCompleted = e.target.checked;

      // 그룹 ID가 있으면 연결된 모든 일정의 완료 상태 변경
      if (groupId) {
        toggleGroupEventCompletion(groupId, title, isCompleted);
      } else {
        toggleEventCompletion(eventId, title, isCompleted);
      }

      // UI 즉시 업데이트
      if (isCompleted) {
        timeBlock.classList.add("completed");
        e.target.title = "완료됨";
      } else {
        timeBlock.classList.remove("completed");
        e.target.title = "미완료";
      }
    });

    // 삭제 버튼 추가
    const deleteBtn = document.createElement("button");
    deleteBtn.className = "delete-event-btn";
    deleteBtn.textContent = "×";
    deleteBtn.onclick = async (e) => {
      e.stopPropagation();

      const confirmMessage = groupId
        ? `"${title.replace(
            / \([12]일차\)/,
            ""
          )}" 일정 전체를 삭제하시겠습니까?\n(연결된 모든 블록이 삭제됩니다)`
        : `"${title}" 일정을 삭제하시겠습니까?`;

      showConfirmModal("일정 삭제", confirmMessage, async function () {
        try {
          if (groupId) {
            // 그룹으로 연결된 모든 일정 삭제
            await deleteGroupEvents(groupId, title);
          } else {
            // 단일 일정 삭제
            timeBlock.classList.add("removing");
            await fetchAPI(`/${eventId}`, { method: "DELETE" });

            // 완료 목록에서도 제거
            completedEvents = completedEvents.filter((id) => id !== eventId);
            localStorage.setItem(
              "completedEvents",
              JSON.stringify(completedEvents)
            );

            addActivity("delete", `"${title}" 일정이 삭제되었습니다`, title);

            timeBlock.addEventListener(
              "animationend",
              () => {
                timeBlock.remove();
                setTimeout(() => {
                  updateTodayStats();
                  updateWeekStatsSimple();
                }, 100);
              },
              { once: true }
            );
          }
        } catch (error) {
          console.error("일정 삭제 실패:", error);
          showActivityNotification({
            icon: "❌",
            message: "일정 삭제에 실패했습니다.",
          });
          timeBlock.classList.remove("removing");
        }
      });
    };

    timeBlock.appendChild(completeCheckbox);
    timeBlock.appendChild(eventContent);
    timeBlock.appendChild(deleteBtn);
    column.appendChild(timeBlock);
  }
}

// 그룹으로 연결된 일정들의 완료 상태 토글
async function toggleGroupEventCompletion(groupId, eventTitle, isCompleted) {
  try {
    // 같은 그룹의 모든 블록 찾기
    const groupBlocks = document.querySelectorAll(
      `[data-group-id="${groupId}"]`
    );

    // UI 즉시 업데이트
    groupBlocks.forEach((block) => {
      const checkbox = block.querySelector(".complete-checkbox");
      if (checkbox) {
        checkbox.checked = isCompleted;
        if (isCompleted) {
          block.classList.add("completed");
          checkbox.title = "완료됨";
        } else {
          block.classList.remove("completed");
          checkbox.title = "미완료";
        }
      }
    });

    // 서버에서 그룹 일정들의 ID 조회
    try {
      const allEvents = await fetchAPI("");
      const groupEvents = allEvents.filter(
        (event) => event.groupId === groupId
      );

      console.log("그룹 완료 상태 변경:", groupId, "완료:", isCompleted);
      console.log("해당 그룹 일정들:", groupEvents);

      // 완료 목록 업데이트
      groupEvents.forEach((event) => {
        if (isCompleted) {
          if (!completedEvents.includes(event._id)) {
            completedEvents.push(event._id);
          }
        } else {
          completedEvents = completedEvents.filter((id) => id !== event._id);
        }
      });

      localStorage.setItem("completedEvents", JSON.stringify(completedEvents));
    } catch (error) {
      console.error("그룹 일정 조회 실패:", error);
      // 서버 조회 실패 시에도 UI는 유지
    }

    // 활동 로그 추가
    const cleanTitle = eventTitle.replace(/ \([12]일차\)/, "");
    if (isCompleted) {
      addActivity(
        "complete",
        `"${cleanTitle}" 일정을 완료했습니다`,
        cleanTitle
      );
    } else {
      addActivity(
        "edit",
        `"${cleanTitle}" 일정을 미완료로 변경했습니다`,
        cleanTitle
      );
    }

    // 통계 업데이트
    setTimeout(() => {
      updateWeekStatsSimple();
      updateTodayStats();
    }, 100);
  } catch (error) {
    console.error("그룹 완료 상태 변경 실패:", error);
  }
}

// 그룹으로 연결된 모든 일정 삭제
async function deleteGroupEvents(groupId, title) {
  try {
    // 같은 그룹의 모든 블록 찾기
    const groupBlocks = document.querySelectorAll(
      `[data-group-id="${groupId}"]`
    );
    const cleanTitle = title.replace(/ \([12]일차\)/, "");

    // 모든 블록에 삭제 애니메이션 적용
    groupBlocks.forEach((block) => {
      block.classList.add("removing");
    });

    // 서버에서 groupId로 연결된 모든 일정 조회 및 삭제
    try {
      console.log("그룹 일정 삭제 시작, groupId:", groupId);

      // 전체 일정을 조회해서 같은 groupId를 가진 일정들 찾기
      const allEvents = await fetchAPI("");
      const eventsToDelete = allEvents.filter(
        (event) => event.groupId === groupId
      );

      console.log("삭제할 그룹 일정들:", eventsToDelete);

      // 각 일정을 개별적으로 삭제
      for (const event of eventsToDelete) {
        await fetchAPI(`/${event._id}`, { method: "DELETE" });
        console.log("일정 삭제 완료:", event.title);

        // 완료 목록에서도 제거
        completedEvents = completedEvents.filter((id) => id !== event._id);
      }
    } catch (error) {
      console.error("서버에서 그룹 일정 삭제 실패:", error);

      // 서버 삭제 실패 시 클라이언트에서 개별 삭제 시도
      const deletePromises = Array.from(groupBlocks).map(async (block) => {
        const eventContent = block.querySelector(".event-content").textContent;

        try {
          const allEvents = await fetchAPI("");
          const eventsToDelete = allEvents.filter(
            (event) => event.title === eventContent
          );

          for (const event of eventsToDelete) {
            await fetchAPI(`/${event._id}`, { method: "DELETE" });
            completedEvents = completedEvents.filter((id) => id !== event._id);
          }
        } catch (individualError) {
          console.error("개별 일정 삭제 실패:", individualError);
        }
      });

      await Promise.all(deletePromises);
    }

    // 완료 목록 저장
    localStorage.setItem("completedEvents", JSON.stringify(completedEvents));

    addActivity("delete", `"${cleanTitle}" 일정이 삭제되었습니다`, cleanTitle);

    // 모든 블록 제거
    groupBlocks.forEach((block) => {
      block.addEventListener(
        "animationend",
        () => {
          block.remove();
        },
        { once: true }
      );
    });

    // 통계 업데이트
    setTimeout(() => {
      updateTodayStats();
      updateWeekStatsSimple();
    }, 100);
  } catch (error) {
    console.error("그룹 일정 삭제 실패:", error);
    throw error;
  }
}

// 대시보드 초기화 함수 수정 (전체 삭제 버튼 이벤트 추가)
function initializeDashboard() {
  console.log("=== 대시보드 초기화 시작 ===");

  updateTodayStats();

  // 간단한 주간 통계를 먼저 시도
  setTimeout(() => {
    updateWeekStatsSimple();
  }, 500);

  updateRecentActivity(); // 실제 활동 로그 로드

  // 초기 환영 활동 추가 (한 번만)
  if (activityLog.length === 0) {
    addActivity("add", "Ordo에 오신 것을 환영합니다! 🎉");
  }

  // 전체 삭제 버튼 이벤트 리스너 추가 (한 번만)
  const clearAllBtn = document.getElementById("clearAllActivity");
  if (clearAllBtn) {
    clearAllBtn.addEventListener("click", clearAllActivities);
  }

  console.log("=== 대시보드 초기화 완료 ===");
}

// 완료된 일정 관리
let completedEvents = JSON.parse(localStorage.getItem("completedEvents")) || [];

// 일정 완료 토글 함수
function toggleEventCompletion(eventId, eventTitle, isCompleted) {
  if (isCompleted) {
    // 완료 목록에 추가
    if (!completedEvents.includes(eventId)) {
      completedEvents.push(eventId);
      addActivity(
        "complete",
        `"${eventTitle}" 일정을 완료했습니다`,
        eventTitle
      );
    }
  } else {
    // 완료 목록에서 제거
    completedEvents = completedEvents.filter((id) => id !== eventId);
    addActivity(
      "edit",
      `"${eventTitle}" 일정을 미완료로 변경했습니다`,
      eventTitle
    );
  }

  localStorage.setItem("completedEvents", JSON.stringify(completedEvents));

  console.log("일정 완료 상태 변경:", eventTitle, "완료:", isCompleted);
  console.log("현재 완료된 일정 목록:", completedEvents);

  // 즉시 통계와 다음 일정 업데이트
  setTimeout(() => {
    updateWeekStatsSimple();
    updateTodayStats();
  }, 100);
}

// 이번 주 통계 업데이트 (단순화된 버전)
async function updateWeekStats() {
  try {
    console.log("=== 주간 통계 업데이트 시작 ===");

    const today = new Date();
    console.log("오늘 날짜:", today.toISOString());

    // 이번 주 일요일부터 토요일까지
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    weekStart.setHours(0, 0, 0, 0);

    console.log("이번 주 시작:", weekStart.toISOString());

    // 오늘까지만 조회 (미래 날짜 제외)
    const endDate = new Date(
      Math.min(today.getTime(), weekStart.getTime() + 6 * 24 * 60 * 60 * 1000)
    );
    endDate.setHours(23, 59, 59, 999);

    console.log("조회 종료일:", endDate.toISOString());

    // 모든 일정을 한 번에 가져오기 (오늘 기준)
    const allEvents = await fetchAPI(`/date/${today.toISOString()}`);
    console.log("API에서 받은 모든 일정:", allEvents);

    // 이번 주에 해당하는 일정만 필터링
    const weekEvents = allEvents.filter((event) => {
      const eventDate = new Date(event.date);
      const eventDateOnly = new Date(
        eventDate.getFullYear(),
        eventDate.getMonth(),
        eventDate.getDate()
      );
      const weekStartOnly = new Date(
        weekStart.getFullYear(),
        weekStart.getMonth(),
        weekStart.getDate()
      );
      const endDateOnly = new Date(
        endDate.getFullYear(),
        endDate.getMonth(),
        endDate.getDate()
      );

      return eventDateOnly >= weekStartOnly && eventDateOnly <= endDateOnly;
    });

    console.log("이번 주 일정 필터링 결과:", weekEvents);

    // 완료된 일정 개수 계산
    const completedCount = weekEvents.filter((event) =>
      completedEvents.includes(event._id)
    ).length;

    console.log(
      "전체 일정:",
      weekEvents.length,
      "완료된 일정:",
      completedCount
    );

    // UI 업데이트
    const weekEventsElement = document.getElementById("weekEventsCount");
    const completedEventsElement = document.getElementById("completedEvents");

    if (weekEventsElement) {
      weekEventsElement.textContent = weekEvents.length;
    }
    if (completedEventsElement) {
      completedEventsElement.textContent = completedCount;
    }

    // 완료율 계산 및 표시
    updateCompletionRate(weekEvents.length, completedCount);

    console.log("=== 주간 통계 업데이트 완료 ===");
  } catch (error) {
    console.error("=== 주간 통계 업데이트 실패 ===");
    console.error("오류 상세:", error);
    console.error("오류 스택:", error.stack);

    // 오류 시 기본값 표시
    const weekEventsElement = document.getElementById("weekEventsCount");
    const completedEventsElement = document.getElementById("completedEvents");

    if (weekEventsElement) weekEventsElement.textContent = "?";
    if (completedEventsElement) completedEventsElement.textContent = "?";

    updateCompletionRate(0, 0);
  }
}

// 대안: 간단한 주간 통계 (API 호출 최소화)
async function updateWeekStatsSimple() {
  try {
    console.log("=== 간단한 주간 통계 시작 ===");

    // 로컬 스토리지에서 완료된 일정 목록 가져오기
    const completed = JSON.parse(localStorage.getItem("completedEvents")) || [];
    console.log("로컬 완료 목록:", completed);

    // 현재 페이지에 표시된 일정들 카운트
    const visibleEvents = document.querySelectorAll(".time-block");
    const visibleCompleted = document.querySelectorAll(".time-block.completed");

    console.log("화면에 보이는 일정:", visibleEvents.length);
    console.log("화면에 보이는 완료된 일정:", visibleCompleted.length);

    // UI 업데이트
    document.getElementById("weekEventsCount").textContent =
      visibleEvents.length;
    document.getElementById("completedEvents").textContent =
      visibleCompleted.length;

    // 완료율 업데이트
    updateCompletionRate(visibleEvents.length, visibleCompleted.length);

    console.log("=== 간단한 주간 통계 완료 ===");
  } catch (error) {
    console.error("간단한 주간 통계 실패:", error);
    document.getElementById("weekEventsCount").textContent = "0";
    document.getElementById("completedEvents").textContent = "0";
    updateCompletionRate(0, 0);
  }
}

// 완료율 표시 개선
function updateCompletionRate(totalEvents, completedEvents) {
  const completionRate =
    totalEvents > 0 ? Math.round((completedEvents / totalEvents) * 100) : 0;

  console.log(
    "완료율 계산:",
    completedEvents,
    "/",
    totalEvents,
    "=",
    completionRate + "%"
  );

  // 완료율 표시 요소가 없다면 생성
  let rateElement = document.querySelector(".completion-rate");
  if (!rateElement) {
    const productivityWidget = document.querySelector(
      ".productivity-widget .widget-content"
    );
    rateElement = document.createElement("div");
    rateElement.className = "completion-rate";
    productivityWidget.appendChild(rateElement);
  }

  // CSS 변수로 완료율 설정
  rateElement.innerHTML = `
    <div class="rate-circle" data-rate="${completionRate}" style="--rate: ${completionRate}">
      <span class="rate-number">${completionRate}%</span>
      <span class="rate-label">완료율</span>
    </div>
  `;

  // 완료율에 따른 색상 변경
  const rateCircle = rateElement.querySelector(".rate-circle");
  if (completionRate === 100) {
    rateCircle.style.background = `conic-gradient(#4caf50 0deg, #4caf50 360deg)`;
    rateElement.querySelector(".rate-number").style.color = "#4caf50";
  } else if (completionRate >= 80) {
    rateCircle.style.background = `conic-gradient(#2196f3 0deg, #2196f3 ${
      completionRate * 3.6
    }deg, var(--border-color) ${
      completionRate * 3.6
    }deg, var(--border-color) 360deg)`;
    rateElement.querySelector(".rate-number").style.color = "#2196f3";
  } else if (completionRate >= 50) {
    rateCircle.style.background = `conic-gradient(#ff9800 0deg, #ff9800 ${
      completionRate * 3.6
    }deg, var(--border-color) ${
      completionRate * 3.6
    }deg, var(--border-color) 360deg)`;
    rateElement.querySelector(".rate-number").style.color = "#ff9800";
  } else {
    rateCircle.style.background = `conic-gradient(var(--primary-color) 0deg, var(--primary-color) ${
      completionRate * 3.6
    }deg, var(--border-color) ${
      completionRate * 3.6
    }deg, var(--border-color) 360deg)`;
    rateElement.querySelector(".rate-number").style.color =
      "var(--primary-color)";
  }
}

// 오늘 일정 통계 업데이트 (완료 상태 포함) - 실시간 다음 일정 반영
async function updateTodayStats() {
  try {
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];

    console.log("오늘 일정 로드 시도:", todayStr);

    const events = await fetchAPI(`/date/${today.toISOString()}`);

    console.log("로드된 오늘 일정:", events);

    // 더 정확한 날짜 필터링
    const todayEvents = events.filter((event) => {
      const eventDate = new Date(event.date);
      const eventDateStr = eventDate.toISOString().split("T")[0];
      console.log("이벤트 날짜 비교:", eventDateStr, "vs", todayStr);
      return eventDateStr === todayStr;
    });

    console.log("필터링된 오늘 일정:", todayEvents);

    document.getElementById("todayEventsCount").textContent =
      todayEvents.length;

    // 오늘 완료된 일정 개수
    const todayCompletedCount = todayEvents.filter((event) =>
      completedEvents.includes(event._id)
    ).length;

    // 다음 일정 찾기 (미완료 일정 중에서, 현재 시간 이후)
    const now = new Date();
    const upcomingEvents = todayEvents
      .filter((event) => {
        const eventTime = new Date(event.date);
        const eventEndTime = new Date(
          eventTime.getTime() + (event.duration || 60) * 60000
        );
        // 일정이 아직 끝나지 않았고 완료되지 않은 경우만 포함
        return eventEndTime > now && !completedEvents.includes(event._id);
      })
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    console.log("다음 일정 후보:", upcomingEvents);

    const nextEventElement = document.getElementById("nextEvent");
    const nextTimeElement = nextEventElement.querySelector(".next-time");

    if (upcomingEvents.length > 0) {
      const nextEvent = upcomingEvents[0];
      const eventTime = new Date(nextEvent.date);
      const timeString = `${eventTime
        .getHours()
        .toString()
        .padStart(2, "0")}:${eventTime
        .getMinutes()
        .toString()
        .padStart(2, "0")}`;

      nextTimeElement.textContent = `${timeString} - ${nextEvent.title}`;
      nextTimeElement.style.color = "var(--primary-color)";
      console.log("다음 일정 설정:", nextEvent.title);
    } else {
      // 완료되지 않은 일정이 없는 경우
      const remainingEvents = todayEvents.filter(
        (event) => !completedEvents.includes(event._id)
      );

      if (remainingEvents.length === 0 && todayEvents.length > 0) {
        nextTimeElement.textContent = "모든 일정 완료! 🎉";
        nextTimeElement.style.color = "#4caf50";
        console.log("모든 일정 완료");
      } else if (todayEvents.length === 0) {
        nextTimeElement.textContent = "오늘 일정이 없습니다";
        nextTimeElement.style.color = "var(--light-gray)";
        console.log("오늘 일정 없음");
      } else {
        // 오늘 일정은 있지만 모두 지나간 경우
        nextTimeElement.textContent = "남은 일정이 없습니다";
        nextTimeElement.style.color = "var(--light-gray)";
        console.log("남은 일정 없음");
      }
    }

    // 오늘 완료 상태 표시 업데이트
    updateTodayCompletionStatus(todayEvents.length, todayCompletedCount);
  } catch (error) {
    console.error("오늘 일정 로드 실패 상세:", error);
    console.error("오류 스택:", error.stack);

    const nextTimeElement = document.querySelector("#nextEvent .next-time");
    if (nextTimeElement) {
      // 토큰이 만료된 경우
      if (
        error.message.includes("401") ||
        error.message.includes("Unauthorized")
      ) {
        nextTimeElement.textContent = "로그인이 필요합니다";
        nextTimeElement.style.color = "#ff6363";

        // 토큰 만료 시 로그인 페이지로 리다이렉트
        setTimeout(() => {
          alert("로그인이 만료되었습니다. 다시 로그인해주세요.");
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          window.location.href = "/email-login";
        }, 2000);
      } else {
        nextTimeElement.textContent = "일정 로드 중...";
        nextTimeElement.style.color = "var(--light-gray)";

        // 3초 후 재시도
        setTimeout(() => {
          console.log("일정 로드 재시도...");
          updateTodayStats();
        }, 3000);
      }
    }
  }
}

// 오늘 완료 상태 표시
function updateTodayCompletionStatus(totalEvents, completedEvents) {
  const summaryItem = document.querySelector(".today-summary .summary-item");

  // 완료 상태 표시 요소가 없다면 생성
  let statusElement = summaryItem.querySelector(".completion-status");
  if (!statusElement) {
    statusElement = document.createElement("div");
    statusElement.className = "completion-status";
    summaryItem.appendChild(statusElement);
  }

  if (totalEvents > 0) {
    statusElement.innerHTML = `<span class="completed-count">${completedEvents}/${totalEvents} 완료</span>`;
  } else {
    statusElement.innerHTML = "";
  }
}

// 퀵 액션 설정
function setupQuickActions() {
  // 새 일정 추가
  document.getElementById("quickAddEvent").addEventListener("click", () => {
    showAddEventModal();
  });

  // 오늘 일정 보기
  document.getElementById("viewToday").addEventListener("click", () => {
    // 캘린더 섹션으로 스크롤
    document.querySelector(".calendar-section").scrollIntoView({
      behavior: "smooth",
    });
  });

  // 주간 요약
  document.getElementById("weekSummary").addEventListener("click", () => {
    showWeekSummaryModal();
  });

  // 설정
  document.getElementById("settings").addEventListener("click", () => {
    alert("설정 기능은 준비 중입니다.");
  });
}

// 주간 요약 모달 표시
function showWeekSummaryModal() {
  alert("주간 요약 기능은 준비 중입니다.");
}

// 시간대별 인사말 업데이트 (현재는 messages.js에서 랜덤 메시지 사용)
// function updateGreetingByTime() {
//   const now = new Date();
//   const hour = now.getHours();
//   const subtitleElement = document.querySelector(".subtitle");

//   let greeting = "";
//   if (hour >= 5 && hour < 12) {
//     greeting = "좋은 아침이에요! 오늘도 화이팅! ☀️";
//   } else if (hour >= 12 && hour < 18) {
//     greeting = "오후도 힘내세요! 💪";
//   } else if (hour >= 18 && hour < 22) {
//     greeting = "저녁 시간도 알차게 보내세요! 🌅";
//   } else {
//     greeting = "하루 수고하셨어요! 좋은 밤 되세요! 🌙";
//   }

//   if (subtitleElement) {
//     subtitleElement.textContent = greeting;
//   }
// }

// 페이지 로드 시 인사말 업데이트는 messages.js에서 처리됩니다

// 테마 초기화 및 관리
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

// 스크롤 기반 애니메이션 초기화
function initializeScrollAnimations() {
  const observerOptions = {
    threshold: 0.1,
    rootMargin: "0px 0px -50px 0px",
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("animate");
      }
    });
  }, observerOptions);

  // 스크롤 애니메이션 대상 요소들
  const animateElements = document.querySelectorAll(".scroll-animate");
  animateElements.forEach((el) => observer.observe(el));
}

// 사용자 정보 표시 업데이트 함수
async function updateUserDisplay() {
  try {
    // 먼저 로컬 스토리지에서 정보 표시
    const user = JSON.parse(localStorage.getItem("user"));
    const userData = JSON.parse(localStorage.getItem("userData"));

    // 사용자 이름 업데이트 (userData에서 최신 정보 우선 사용)
    const displayName =
      (userData && userData.name) || (user && user.name) || "사용자";
    const userNameElement = document.getElementById("userName");
    if (userNameElement) {
      userNameElement.textContent = displayName;
    }

    console.log("사용자 정보 업데이트:", displayName);

    // 백그라운드에서 서버에서 최신 정보 가져오기 (선택적)
    try {
      // 프로필 API 호출을 위한 별도 함수 사용
      const token = localStorage.getItem("token");
      if (token) {
        const response = await fetch("/api/profile", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data && data.data && data.data.user) {
            const serverUser = data.data.user;

            // 서버 정보가 로컬과 다른 경우 업데이트
            if (serverUser.name !== displayName) {
              localStorage.setItem("user", JSON.stringify(serverUser));
              if (userNameElement) {
                userNameElement.textContent = serverUser.name;
              }
              console.log("서버에서 최신 사용자 정보 동기화:", serverUser.name);
            }
          }
        }
      }
    } catch (serverError) {
      // 서버 연결 실패는 무시 (로컬 정보로 계속 진행)
      console.log("서버 동기화 실패 (로컬 정보 사용):", serverError.message);
    }
  } catch (error) {
    console.error("사용자 정보 로드 실패:", error);
    const userNameElement = document.getElementById("userName");
    if (userNameElement) {
      userNameElement.textContent = "사용자";
    }
  }
}

// 시간대별 테마 자동 변경 (선택사항)
function autoThemeByTime() {
  const hour = new Date().getHours();
  const currentTheme = document.documentElement.getAttribute("data-theme");

  // 저녁 7시부터 아침 7시까지 자동 다크모드
  if ((hour >= 19 || hour < 7) && currentTheme === "light") {
    document.getElementById("themeToggle").click();
  } else if (hour >= 7 && hour < 19 && currentTheme === "dark") {
    document.getElementById("themeToggle").click();
  }
}

// 페이지 로드 시 시간대별 테마 적용 (선택사항)
// document.addEventListener('DOMContentLoaded', autoThemeByTime);

// 공동작업 모달 표시
function showCollaborationModal() {
  showConfirmModal(
    "👥 공동작업",
    "팀원들과 함께 일정을 관리하고 협업할 수 있는 페이지로 이동하시겠습니까?\n\n• 팀 캘린더 공유\n• 작업 관리\n• 파일 공유\n• 멤버 관리\n\n모든 기능이 준비되어 있습니다! 🚀",
    function () {
      window.location.href = "/Collaboration/collaboration.html";
    },
    "👥",
    "이동하기",
    "취소"
  );
}

// 실시간 채팅 모달 표시
function showChatModal() {
  showConfirmModal(
    "💬 실시간 채팅",
    "팀원들과 실시간으로 소통할 수 있는 채팅 페이지로 이동하시겠습니까?\n\n• 1:1 및 그룹 채팅\n• 파일 공유\n• 이모지 반응\n• 새 채팅방 생성\n\n모든 기능이 준비되어 있습니다! 💬",
    function () {
      window.location.href = "/Chat/chat.html";
    },
    "💬",
    "이동하기",
    "취소"
  );
}

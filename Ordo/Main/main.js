// ============================================
// 📅 캘린더 시스템 - 전역 변수들
// ============================================

// 현재 표시 중인 날짜 (캘린더의 기준 날짜)
let currentDate = new Date();

// 사용자가 선택한 날짜 (일정 추가/조회 시 사용)
let selectedDate = null;

// 캘린더 뷰 모드 (week: 주간보기, month: 월간보기)
let currentView = "week";

// ============================================
// 🌤️ 날씨 위젯 업데이트 함수
// ============================================
// 실시간 날씨 정보를 가져와서 위젯에 표시하는 함수
// 사용자의 위치 정보(GPS)를 이용하거나 기본 위치(서울) 사용
async function updateWeatherWidget() {
  try {
    console.log("[날씨] 실시간 날씨 정보 업데이트 시작");

    // 날씨 위젯의 DOM 요소들 찾기
    const temperatureElement = document.querySelector(".temperature");
    const weatherDescElement = document.querySelector(".weather-desc");
    const weatherTipElement = document.querySelector(".weather-tip");
    const weatherIconElement = document.querySelector(
      ".weather-widget .widget-icon"
    );

    // 위젯 요소가 없으면 종료
    if (!temperatureElement || !weatherDescElement) {
      console.warn("[날씨] 날씨 위젯 요소를 찾을 수 없습니다.");
      return;
    }

    // 사용자에게 로딩 상태 표시
    temperatureElement.textContent = "...";
    weatherDescElement.textContent = "날씨 정보 로딩 중";

    // 사용자의 현재 위치 정보 가져오기 시도
    let latitude = null;
    let longitude = null;

    // 브라우저에서 위치 정보 지원하는지 확인
    if (navigator.geolocation) {
      try {
        // GPS 위치 정보 요청 (5초 타임아웃)
        const position = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            timeout: 5000, // 5초 제한
            enableHighAccuracy: false, // 정확도보다 속도 우선
          });
        });

        latitude = position.coords.latitude;
        longitude = position.coords.longitude;
        console.log(`[날씨] 위치 정보 획득: ${latitude}, ${longitude}`);
      } catch (locationError) {
        // 위치 정보 실패 시 기본 위치(서울) 사용
        console.log(
          "[날씨] 위치 정보 획득 실패, 기본 위치(서울) 사용:",
          locationError.message
        );
      }
    }

    // 서버 API로 날씨 정보 요청
    const params = new URLSearchParams();
    if (latitude && longitude) {
      params.append("lat", latitude);
      params.append("lon", longitude);
    }

    const response = await fetch(`/api/weather?${params}`);
    const result = await response.json();

    if (result.status === "success") {
      const weather = result.data;

      // 온도와 날씨 설명 UI 업데이트
      temperatureElement.textContent = `${weather.temperature}°C`;
      weatherDescElement.textContent = weather.description;

      // 날씨 상태에 따른 이모지 아이콘 매핑
      const weatherEmojis = {
        "01d": "☀️",
        "01n": "🌙", // 맑음 (낮/밤)
        "02d": "⛅",
        "02n": "☁️", // 약간 흐림
        "03d": "☁️",
        "03n": "☁️", // 흐림
        "04d": "☁️",
        "04n": "☁️", // 매우 흐림
        "09d": "🌧️",
        "09n": "🌧️", // 소나기
        "10d": "🌦️",
        "10n": "🌧️", // 비
        "11d": "⛈️",
        "11n": "⛈️", // 뇌우
        "13d": "🌨️",
        "13n": "🌨️", // 눈
        "50d": "🌫️",
        "50n": "🌫️", // 안개
      };

      // 날씨 아이콘 업데이트
      if (weatherIconElement) {
        weatherIconElement.textContent = weatherEmojis[weather.icon] || "🌤️";
      }

      // 날씨에 따른 팁 메시지 생성 및 표시
      if (weatherTipElement) {
        const tips = generateWeatherTip(weather);
        weatherTipElement.textContent = tips;
      }

      console.log(
        `[날씨] 날씨 정보 업데이트 완료: ${weather.temperature}°C, ${weather.description}`
      );

      // 데모 모드인지 확인 (개발/테스트 환경)
      if (weather.isDemo) {
        console.log("[날씨] 데모 모드로 실행 중");
      }
    } else {
      throw new Error(result.message || "날씨 정보를 가져올 수 없습니다.");
    }
  } catch (error) {
    console.error("[날씨] 날씨 정보 업데이트 실패:", error);

    // 오류 발생 시 기본값으로 설정하여 UI 복구
    const temperatureElement = document.querySelector(".temperature");
    const weatherDescElement = document.querySelector(".weather-desc");
    const weatherTipElement = document.querySelector(".weather-tip");

    if (temperatureElement) temperatureElement.textContent = "N/A";
    if (weatherDescElement) weatherDescElement.textContent = "정보 없음";
    if (weatherTipElement)
      weatherTipElement.textContent = "날씨 정보를 불러올 수 없습니다.";
  }
}

// 날씨 팁 생성 함수
function generateWeatherTip(weather) {
  const temp = weather.temperature;
  const desc = weather.description.toLowerCase();

  // 온도별 팁
  if (temp >= 28) {
    return "더운 날씨입니다. 시원한 실내에서 일정을 관리하세요! ❄️";
  } else if (temp >= 23) {
    return "따뜻한 날씨네요. 야외 일정을 계획하기 좋은 날입니다! 🌞";
  } else if (temp >= 18) {
    return "선선한 날씨입니다. 일정 관리하기 좋은 날씨예요! 🍃";
  } else if (temp >= 10) {
    return "쌀쌀한 날씨입니다. 따뜻하게 입고 외출하세요! 🧥";
  } else {
    return "추운 날씨입니다. 실내 일정 위주로 계획해보세요! 🏠";
  }
}

// 페이지 로드 시 사용자 정보 표시
document.addEventListener("DOMContentLoaded", () => {
  console.log("=== 메인 페이지 초기화 시작 ===");

  try {
    // ============================================
    // 🔐 사용자 인증 상태 확인
    // ============================================
    // localStorage에서 토큰과 사용자 정보 가져오기
    const token = localStorage.getItem("token"); // JWT 인증 토큰
    const user = localStorage.getItem("user"); // 사용자 기본 정보

    // 토큰이나 사용자 정보가 없으면 로그인 페이지로 리다이렉트
    if (!token || !user) {
      console.warn("로그인 정보가 없습니다. 로그인 페이지로 이동합니다.");
      window.location.href = "/Login/email-login.html";
      return;
    }

    console.log("로그인 상태 확인됨:", JSON.parse(user));

    // ============================================
    // 🖥️ 기본 UI 초기화 (오류 발생 시에도 계속 진행)
    // ============================================

    try {
      // 사용자 정보를 UI에 표시 (이름, 프로필 이미지 등)
      updateUserDisplay();
    } catch (error) {
      console.error("사용자 정보 표시 오류:", error);
    }

    try {
      // 실시간 날씨 정보 업데이트 시작
      updateWeatherWidget();

      // 10분마다 날씨 정보 자동 갱신 (600초 = 10분)
      setInterval(updateWeatherWidget, 10 * 60 * 1000);
    } catch (error) {
      console.error("날씨 정보 업데이트 오류:", error);
    }

    try {
      // 다른 탭에서 사용자 정보가 변경된 경우 감지
      // 예: 다른 탭에서 프로필 수정, 로그아웃 등
      window.addEventListener("storage", (e) => {
        if (e.key === "user" || e.key === "userData") {
          updateUserDisplay(); // UI 즉시 업데이트
        }
      });
    } catch (error) {
      console.error("스토리지 이벤트 리스너 오류:", error);
    }

    try {
      // 사용자가 선택한 테마(다크/라이트 모드) 적용
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

    // 📅 캘린더 초기화 (비동기로 처리)
    // 주간 캘린더 뷰를 렌더링하고 일정 데이터를 로드
    try {
      initializeCalendar();
    } catch (error) {
      console.error("캘린더 초기화 오류:", error);
    }

    // ⬅️➡️ 주간 이동 버튼 이벤트 리스너
    // 사용자가 이전/다음 주로 네비게이션할 수 있게 하는 기능
    try {
      const prevWeekBtn = document.getElementById("prevWeek"); // 이전 주 버튼
      const nextWeekBtn = document.getElementById("nextWeek"); // 다음 주 버튼

      if (prevWeekBtn) {
        prevWeekBtn.addEventListener("click", () => {
          // 현재 날짜에서 7일 빼서 이전 주로 이동
          currentDate.setDate(currentDate.getDate() - 7);
          renderCalendar(); // 캘린더 다시 렌더링
        });
      }

      if (nextWeekBtn) {
        nextWeekBtn.addEventListener("click", () => {
          // 현재 날짜에 7일 더해서 다음 주로 이동
          currentDate.setDate(currentDate.getDate() + 7);
          renderCalendar(); // 캘린더 다시 렌더링
        });
      }
    } catch (error) {
      console.error("주간 이동 버튼 이벤트 리스너 오류:", error);
    }

    // 📝 모달 관련 이벤트 리스너
    // 일정 추가/편집 모달창의 사용자 상호작용 처리
    try {
      const modal = document.getElementById("eventModal"); // 일정 추가 모달
      const eventForm = document.getElementById("eventForm"); // 일정 폼
      const cancelBtn = document.querySelector(".cancel-btn"); // 취소 버튼

      // 모달 취소 버튼 클릭 시 모달 닫기
      if (cancelBtn && modal) {
        cancelBtn.addEventListener("click", () => {
          modal.classList.remove("show"); // 'show' 클래스 제거로 모달 숨김
        });
      }

      // 일정 폼 제출 이벤트 처리
      if (eventForm) {
        eventForm.addEventListener("submit", async (e) => {
          console.log("📝 폼 제출 이벤트 발생!");
          e.preventDefault(); // 기본 폼 제출 동작 방지

          // 사용자가 입력한 일정 정보 수집
          const title = document.getElementById("eventTitle").value; // 일정 제목
          const startTime = document.getElementById("eventStartTime").value; // 시작 시간
          const endTime = document.getElementById("eventEndTime").value; // 종료 시간
          const color = document.getElementById("eventColor").value; // 색상

          // 시간 유효성 검사
          const [startHour, startMinute] = startTime.split(":").map(Number);
          const [endHour, endMinute] = endTime.split(":").map(Number);

          // 오후 11시 이후 시간 체크
          if (startHour >= 23 || endHour >= 23) {
            showAlert("오후 11시 이후에는 일정을 추가할 수 없습니다.", "error");
            return;
          }

          // 종료 시간이 시작 시간보다 빠른 경우 체크
          if (
            endHour < startHour ||
            (endHour === startHour && endMinute <= startMinute)
          ) {
            showAlert("종료 시간은 시작 시간보다 늦어야 합니다.", "error");
            return;
          }

          try {
            // selectedDate 유효성 검사
            if (!selectedDate) {
              console.error("선택된 날짜가 없습니다. 오늘 날짜로 대체합니다.");
              selectedDate = new Date();
              selectedDate.setHours(0, 0, 0, 0); // 시간 초기화
            }

            console.log("=== 폼 제출 디버깅 ===");
            console.log("폼 제출 - selectedDate:", selectedDate.toDateString());
            console.log(
              "폼 제출 - selectedDate ISO:",
              selectedDate.toISOString().split("T")[0]
            );
            console.log("폼 제출 - 시간:", startTime, "~", endTime);
            console.log("=====================");

            // 서버에 새 일정 추가 요청
            await addEvent(selectedDate, startTime, endTime, title, color);
            modal.classList.remove("show"); // 성공 시 모달 닫기
            renderCalendar(); // 캘린더 새로고침으로 새 일정 표시
          } catch (error) {
            console.error("일정 추가 중 오류 발생:", error);
            showAlert("일정 추가에 실패했습니다", "error"); // 사용자에게 오류 알림
          }
        });
      }
    } catch (error) {
      console.error("모달 이벤트 리스너 오류:", error);
    }

    // 🌟 플로팅 버튼 관련 코드
    // 화면 우하단의 원형 플로팅 버튼과 메뉴 시스템
    try {
      const floatingBtn = document.getElementById("floatingBtn"); // 메인 플로팅 버튼
      const floatingMenu = document.getElementById("floatingMenu"); // 플로팅 메뉴 컨테이너
      const horaeBtn = document.getElementById("horaeBtn"); // HORAE 최적화 버튼
      const dailyBtn = document.getElementById("dailyBtn"); // 일일 계획 버튼

      if (floatingBtn && floatingMenu) {
        let isMenuOpen = false; // 메뉴 열림/닫힘 상태 추적

        // 🖱️ 플로팅 버튼 클릭 이벤트 - 메뉴 토글
        floatingBtn.addEventListener("click", (e) => {
          e.stopPropagation(); // 이벤트 버블링 방지

          if (isMenuOpen) {
            closeFloatingMenu(); // 열려있으면 닫기
          } else {
            openFloatingMenu(); // 닫혀있으면 열기
          }
        });

        // 📂 메뉴 열기 함수 - 애니메이션과 함께 메뉴 표시
        function openFloatingMenu() {
          isMenuOpen = true;
          floatingBtn.classList.add("active"); // 버튼 활성 상태 표시
          floatingMenu.classList.remove("hide"); // 숨김 클래스 제거
          floatingMenu.classList.add("show"); // 표시 클래스 추가

          // 🔄 버튼 회전 애니메이션 후 원래대로 복원
          setTimeout(() => {
            floatingBtn.classList.remove("active");
          }, 400); // 400ms 후 active 클래스 제거
        }

        // 📁 메뉴 닫기 함수 - 애니메이션과 함께 메뉴 숨김
        function closeFloatingMenu() {
          if (!isMenuOpen) return; // 이미 닫혀있으면 무시

          isMenuOpen = false;
          floatingMenu.classList.add("hide"); // 숨김 애니메이션 시작
          floatingMenu.classList.remove("show"); // 표시 클래스 제거

          // 🎭 애니메이션 완료 후 hide 클래스 제거 (깔끔한 상태 관리)
          setTimeout(() => {
            floatingMenu.classList.remove("hide");
          }, 300); // 300ms 애니메이션 지속시간
        }

        // 🖱️ 메뉴 외부 클릭 시 자동 닫기 - UX 개선
        document.addEventListener("click", (e) => {
          if (
            isMenuOpen &&
            !floatingBtn.contains(e.target) && // 플로팅 버튼이 아니고
            !floatingMenu.contains(e.target) // 메뉴 영역도 아닐 때
          ) {
            closeFloatingMenu(); // 메뉴 닫기
          }
        });

        // ⌨️ ESC 키로 메뉴 닫기 - 키보드 접근성
        document.addEventListener("keydown", (e) => {
          if (e.key === "Escape" && isMenuOpen) {
            closeFloatingMenu();
          }
        });
      }

      // 🎯 메뉴 아이템 클릭 이벤트 - 각 기능별 모달 호출
      if (horaeBtn) {
        horaeBtn.addEventListener("click", (e) => {
          e.preventDefault(); // 기본 동작 방지
          closeFloatingMenu(); // 메뉴 먼저 닫기
          setTimeout(() => {
            showHoraeOptimizeModal(); // 200ms 후 HORAE 최적화 모달 표시
          }, 200);
        });
      }

      if (dailyBtn) {
        dailyBtn.addEventListener("click", (e) => {
          e.preventDefault(); // 기본 동작 방지
          closeFloatingMenu(); // 메뉴 먼저 닫기
          setTimeout(() => {
            showHoraeDailyModal(); // 200ms 후 일일 계획 모달 표시
          }, 200);
        });
      }

      // 🤝 새로운 메뉴 아이템들 - 협업 및 채팅 기능
      const collaborationBtn = document.getElementById("collaborationBtn"); // 협업 버튼
      const chatBtn = document.getElementById("chatBtn"); // 채팅 버튼

      if (collaborationBtn) {
        collaborationBtn.addEventListener("click", (e) => {
          e.preventDefault();
          closeFloatingMenu();
          setTimeout(() => {
            showCollaborationModal(); // 협업 모달 표시
          }, 200);
        });
      }

      if (chatBtn) {
        chatBtn.addEventListener("click", (e) => {
          e.preventDefault();
          closeFloatingMenu();
          setTimeout(() => {
            showChatModal(); // 채팅 모달 표시
          }, 200);
        });
      }
    } catch (error) {
      console.error("플로팅 버튼 이벤트 리스너 오류:", error);
    }

    // 📊 대시보드 초기화 (지연 실행)
    // 100ms 지연으로 DOM이 완전히 로드된 후 대시보드 구성 요소들 초기화
    setTimeout(() => {
      try {
        initializeDashboard(); // 통계, 차트, 위젯 등 대시보드 요소들 설정
      } catch (error) {
        console.error("대시보드 초기화 오류:", error);
      }
    }, 100);

    // ⏰ 정기 업데이트 설정 - 실시간 UI 업데이트
    try {
      // 현재 시각 선 1분마다 업데이트 (캘린더에서 현재 시간 표시)
      setInterval(updateCurrentTimeLine, 60000); // 60초 = 60,000ms

      // 📈 상대 시간과 다음 일정 1분마다 업데이트
      setInterval(() => {
        try {
          updateRecentActivity(); // 최근 활동 상대 시간 업데이트 ("3분 전" 등)
          updateTodayStats(); // 다음 일정 실시간 업데이트 추가
        } catch (error) {
          console.error("정기 업데이트 오류:", error);
        }
      }, 60000); // 60초마다 실행
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

// ============================================
// 🌐 API 통신 핵심 함수
// ============================================
// 서버와의 모든 API 통신을 담당하는 중앙 집중식 함수
// JWT 토큰 인증, 오류 처리, 자동 로그아웃 등을 통합 관리
async function fetchAPI(endpoint, options = {}) {
  // localStorage에서 JWT 토큰 가져오기
  const token = localStorage.getItem("token");

  // 토큰이 없으면 로그인 필요 오류 발생
  if (!token) {
    console.error("토큰이 없습니다. 로그인이 필요합니다.");
    throw new Error("토큰이 없습니다. 로그인이 필요합니다.");
  }

  // 기본 요청 옵션 설정 (JSON 형식 + JWT 토큰 인증)
  const defaultOptions = {
    headers: {
      "Content-Type": "application/json", // JSON 데이터 전송
      Authorization: `Bearer ${token}`, // JWT 토큰 인증 헤더
    },
  };

  // 최종 API URL 생성 (/api/events + 엔드포인트)
  const url = `/api/events${endpoint}`;
  console.log("API 호출:", url, options);

  try {
    // fetch 요청 실행 (기본 옵션 + 사용자 옵션 병합)
    const response = await fetch(url, {
      ...defaultOptions,
      ...options,
      headers: {
        ...defaultOptions.headers,
        ...(options.headers || {}), // 사용자 정의 헤더가 있으면 병합
      },
    });

    console.log("API 응답 상태:", response.status, response.statusText);

    // HTTP 응답 상태 코드 확인 및 오류 처리
    if (!response.ok) {
      let errorText = "";
      try {
        // 서버에서 보낸 오류 메시지 읽기 시도
        errorText = await response.text();
        console.error("API 오류 응답:", errorText);
      } catch (textError) {
        console.error("응답 텍스트 읽기 실패:", textError);
      }

      // HTTP 상태 코드별 처리
      if (response.status === 401) {
        // 401 Unauthorized: 토큰 만료 또는 인증 실패
        console.warn("토큰이 만료되었습니다. 로그인 페이지로 이동합니다.");

        // 저장된 인증 정보 모두 삭제
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("userData");

        // 1초 후 로그인 페이지로 리다이렉트
        setTimeout(() => {
          window.location.href = "/Login/email-login.html";
        }, 1000);
        throw new Error("토큰이 만료되었습니다. 다시 로그인해주세요.");
      } else if (response.status === 403) {
        // 403 Forbidden: JWT 서명이 유효하지 않음 (시크릿 키 변경으로 인한 문제)
        console.warn(
          "인증 토큰이 유효하지 않습니다. 다시 로그인이 필요합니다."
        );

        // 저장된 인증 정보 모두 삭제
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("userData");

        alert("보안상 다시 로그인이 필요합니다.");

        // 로그인 페이지로 리다이렉트
        setTimeout(() => {
          window.location.href = "/Login/email-login.html";
        }, 1000);
        throw new Error("다시 로그인해주세요.");
      } else if (response.status === 404) {
        // 404 Not Found: 요청한 리소스 없음
        throw new Error("요청한 리소스를 찾을 수 없습니다.");
      } else if (response.status === 500) {
        // 500 Internal Server Error: 서버 내부 오류
        throw new Error("서버 내부 오류가 발생했습니다.");
      } else {
        // 기타 HTTP 오류
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    }

    // 성공적인 응답을 JSON으로 변환
    const data = await response.json();
    console.log("API 응답 데이터:", data);
    return data;
  } catch (error) {
    console.error("fetchAPI 오류:", error);

    // 네트워크 연결 오류 특별 처리
    if (error.name === "TypeError" && error.message.includes("fetch")) {
      throw new Error(
        "서버에 연결할 수 없습니다. 네트워크 연결을 확인해주세요."
      );
    }

    throw error;
  }
}

// ============================================
// 📅 캘린더 렌더링 헬퍼 함수들
// ============================================

// 📅 캘린더 초기화 함수 - 메인 캘린더 뷰 설정
function initializeCalendar() {
  renderCalendar(); // 캘린더 렌더링 함수 호출
}

// 🕐 현재 시각 선 업데이트 함수 - 실시간으로 현재 시간을 시각적으로 표시
function updateCurrentTimeLine() {
  const now = new Date();
  const currentHour = now.getHours(); // 현재 시간 (0-23)
  const currentMinute = now.getMinutes(); // 현재 분 (0-59)

  // 🧮 현재 시간을 픽셀 위치로 계산
  // 분을 시작점부터의 총 분수로 변환 후 높이 비율 적용
  const minutesSinceStart = (currentHour * 60 + currentMinute) * (60 / 60); // 60px 높이에 맞게 조정

  // 기존 시간선이 있는지 확인
  const existingLine = document.querySelector(".current-time-line");

  if (existingLine) {
    // 🔄 기존 선의 위치만 업데이트 (성능 최적화)
    existingLine.style.top = `${minutesSinceStart}px`;
  } else {
    // ➕ 시간선이 없으면 새로 생성
    const eventGrid = document.querySelector(".event-grid");
    if (eventGrid) {
      // 시간선 컨테이너 생성
      const timeLine = document.createElement("div");
      timeLine.className = "current-time-line";
      timeLine.style.top = `${minutesSinceStart}px`;

      // 시간 마커 (원형 점) 생성
      const timeMarker = document.createElement("div");
      timeMarker.className = "current-time-marker";

      timeLine.appendChild(timeMarker);
      eventGrid.appendChild(timeLine);
    }
  }
}

// 🕐 시간 포맷 함수 - 24시간 → 12시간(AM/PM) 한국어 형식으로 변환
function formatTime(hour) {
  if (hour === 0) return "오전 12:00"; // 자정
  if (hour === 12) return "오후 12:00"; // 정오
  if (hour < 12) return `오전 ${hour}:00`; // 오전
  return `오후 ${hour - 12}:00`; // 오후
}

// 📊 주차 계산 함수 - 연도 기준 몇 번째 주인지 계산
function getWeekNumber(date) {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1); // 1월 1일
  const pastDaysOfYear = (date - firstDayOfYear) / 86400000; // 경과 일수
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7); // 주차 계산
}

// 📅 요일 포맷 함수 - 영어 요일을 한국어로 변환
function formatDayOfWeek(date) {
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  return days[date.getDay()]; // 0(일요일) ~ 6(토요일)
}

// ============================================
// 🎨 캘린더 렌더링 메인 함수
// ============================================
// 주간 캘린더 뷰를 완전히 구성하는 함수
// 요일 헤더, 시간 축, 일정 블록들을 모두 생성하여 사용자에게 표시
async function renderCalendar() {
  // 📅 현재 주의 시작일과 종료일 계산
  const weekStart = new Date(currentDate);
  weekStart.setDate(currentDate.getDate() - currentDate.getDay()); // 일요일로 설정
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6); // 토요일로 설정

  // 📊 주간 표시 업데이트 (상단 헤더 정보)
  const weekNumber = getWeekNumber(weekStart); // 연중 몇 번째 주인지 계산
  document.querySelector(
    ".current-week"
  ).textContent = `${weekStart.getFullYear()}년 ${
    weekStart.getMonth() + 1
  }월 (${weekNumber}주차)`;

  // ============================================
  // 📅 요일 셀 생성 (캘린더 상단 헤더)
  // ============================================
  const weekdayCells = document.querySelector(".weekday-cells");

  if (weekdayCells) {
    weekdayCells.innerHTML = ""; // 기존 요일 셀 모두 제거

    // 일요일부터 토요일까지 7개 요일 셀 생성
    for (let i = 0; i < 7; i++) {
      const columnDate = new Date(weekStart);
      columnDate.setDate(weekStart.getDate() + i); // 각 요일의 날짜 계산

      // 요일 셀 컨테이너 생성
      const weekdayCell = document.createElement("div");
      weekdayCell.className = "weekday";

      // 📝 요일 이름 표시 (월, 화, 수 등)
      const dayName = document.createElement("span");
      dayName.className = "day-name";
      dayName.textContent = formatDayOfWeek(columnDate);

      // 📅 날짜 숫자 표시 (1, 2, 3 등)
      const dateNumber = document.createElement("span");
      dateNumber.className = "date-number";
      dateNumber.textContent = columnDate.getDate();

      // 🌟 오늘 날짜인 경우 특별 강조 표시
      const today = new Date();
      if (columnDate.toDateString() === today.toDateString()) {
        weekdayCell.classList.add("today"); // CSS로 스타일링
      }

      weekdayCell.appendChild(dayName);
      weekdayCell.appendChild(dateNumber);
      weekdayCells.appendChild(weekdayCell);
    }
  }

  // ============================================
  // 🕐 시간 컬럼 생성 (좌측 시간 축)
  // ============================================
  const timeColumn = document.querySelector(".time-column");
  timeColumn.innerHTML = ""; // 기존 시간 슬롯 모두 제거

  // 0시부터 22시까지 시간 슬롯 생성 (23시 이후 제한)
  for (let hour = 0; hour < 23; hour++) {
    const timeSlot = document.createElement("div");
    timeSlot.className = "time-slot";
    timeSlot.textContent = formatTime(hour); // "오전 9:00" 형식으로 표시
    timeColumn.appendChild(timeSlot);
  }

  // ============================================
  // 📋 이벤트 그리드 생성 (일정 표시 영역)
  // ============================================
  const eventGrid = document.querySelector(".event-grid");

  // 🧹 기존 이벤트 블록들 완전 제거
  console.log("🧹 기존 이벤트 블록 정리 시작");

  // 모든 time-block 요소 개별 제거
  const existingBlocks = eventGrid.querySelectorAll(".time-block");
  console.log(`제거할 기존 블록 수: ${existingBlocks.length}`);
  existingBlocks.forEach((block) => block.remove());

  // 모든 event-column 요소 제거
  const existingColumns = eventGrid.querySelectorAll(".event-column");
  console.log(`제거할 기존 컬럼 수: ${existingColumns.length}`);
  existingColumns.forEach((column) => column.remove());

  // 모든 grid-line 요소 제거
  const existingLines = eventGrid.querySelectorAll(".grid-line");
  console.log(`제거할 기존 라인 수: ${existingLines.length}`);
  existingLines.forEach((line) => line.remove());

  // innerHTML로 한번 더 정리
  eventGrid.innerHTML = "";

  console.log("🧹 DOM 정리 완료, 새 그리드 생성 시작");

  // 날짜 컬럼 생성
  for (let i = 0; i < 7; i++) {
    const columnDate = new Date(
      weekStart.getFullYear(),
      weekStart.getMonth(),
      weekStart.getDate() + i,
      0,
      0,
      0,
      0 // 시간을 00:00:00.000으로 설정
    );

    const column = document.createElement("div");
    column.className = "event-column";
    // 시간대 문제 방지: 로컬 날짜 형식으로 설정
    const localDateStr =
      columnDate.getFullYear() +
      "-" +
      String(columnDate.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(columnDate.getDate()).padStart(2, "0");
    column.dataset.date = localDateStr;

    // 오늘 날짜인 경우 강조 표시
    const today = new Date();
    if (columnDate.toDateString() === today.toDateString()) {
      column.classList.add("today-column");
    }

    // 클릭 이벤트 추가 (완전히 수정된 정확한 시간 계산)
    column.addEventListener("click", (e) => {
      if (e.target === column) {
        const rect = column.getBoundingClientRect();
        const y = e.clientY - rect.top;

        // 정확한 시간 계산: 각 시간당 60px 높이, 각 분당 1px
        const hour = Math.floor(y / 60);
        const minutePixels = y % 60;
        const minutes = Math.round(minutePixels);

        // 시간 유효성 검사
        if (hour < 0 || hour >= 23) {
          if (hour >= 23) {
            showAlert(
              "오후 11시 이후에는 일정을 추가할 수 없습니다.",
              "warning"
            );
          }
          return;
        }

        // 분 값 범위 제한 (0-59)
        const finalMinutes = Math.max(0, Math.min(59, minutes));

        // ✅ 완전히 개선된 날짜 처리 - 시간대 문제 완전 해결
        // 클릭한 컬럼의 날짜를 그대로 사용 (시간대 변환 없이)
        const clickedDate = new Date(
          columnDate.getFullYear(),
          columnDate.getMonth(),
          columnDate.getDate(),
          0,
          0,
          0,
          0 // 시간을 00:00:00.000으로 설정
        );

        selectedDate = clickedDate;

        console.log("=== 완전히 수정된 캘린더 클릭 이벤트 ===");
        console.log("클릭된 컬럼 인덱스:", i);
        console.log("클릭 위치 Y:", y + "px");
        console.log(
          "계산된 시간:",
          hour + ":" + finalMinutes.toString().padStart(2, "0")
        );
        console.log("원본 컬럼 날짜:", columnDate.toString());
        console.log("클릭된 날짜 (KST):", clickedDate.toString());
        console.log("선택된 날짜 ISO:", clickedDate.toISOString());
        console.log("컬럼 data-date:", column.dataset.date);
        console.log(
          "로컬 날짜 문자열:",
          clickedDate.getFullYear() +
            "-" +
            (clickedDate.getMonth() + 1).toString().padStart(2, "0") +
            "-" +
            clickedDate.getDate().toString().padStart(2, "0")
        );
        console.log("===============================================");

        showAddEventModal(hour, finalMinutes);
      }
    });

    eventGrid.appendChild(column);
  }

  // 그리드 라인 생성 (22시까지만)
  for (let hour = 0; hour < 23; hour++) {
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

    // ✅ 날짜 범위 필터링 (시간대 문제 해결)
    const events = uniqueEvents.filter((event) => {
      const eventStartDate = new Date(event.startDate);

      // 일정 날짜를 한국 시간 기준으로 추출
      const eventYear = eventStartDate.getFullYear();
      const eventMonth = eventStartDate.getMonth();
      const eventDate = eventStartDate.getDate();
      const eventDateOnly = new Date(eventYear, eventMonth, eventDate);

      // 주간 범위도 한국 시간 기준으로 추출
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

      console.log(`이벤트 "${event.title}" 날짜 필터링:`, {
        eventDateOnly: eventDateOnly.toString(),
        startDateOnly: startDateOnly.toString(),
        endDateOnly: endDateOnly.toString(),
        isInRange:
          eventDateOnly >= startDateOnly && eventDateOnly <= endDateOnly,
      });

      return eventDateOnly >= startDateOnly && eventDateOnly <= endDateOnly;
    });

    console.log("최종 주간 범위 일정 수:", events.length);
    console.log("최종 주간 범위 일정들:", events);

    // UI에 이벤트 블록들 생성
    events.forEach((event) => {
      // ✅ 서버에서 받은 시간을 그대로 사용 (시간대 변환 없음)
      const eventStartDate = new Date(event.startDate);
      const eventEndDate = new Date(event.endDate);

      const startHour = eventStartDate.getHours();
      const startMinutes = eventStartDate.getMinutes();
      const duration = (eventEndDate - eventStartDate) / 60000; // 분 단위
      const completedEvents =
        JSON.parse(localStorage.getItem("completedEvents")) || [];
      const isCompleted = completedEvents.includes(event._id);

      console.log(`이벤트 처리: ${event.title}`);
      console.log(`  - 서버 시간: ${eventStartDate.toString()}`);
      console.log(
        `  - 표시 시간: ${startHour}:${startMinutes}, 지속시간: ${duration}분`
      );

      // 자정을 넘어가는 일정인지 확인 (endDate가 다음날인 경우)
      const eventStartDateOnly = new Date(
        eventStartDate.getFullYear(),
        eventStartDate.getMonth(),
        eventStartDate.getDate()
      );
      const eventEndDateOnly = new Date(
        eventEndDate.getFullYear(),
        eventEndDate.getMonth(),
        eventEndDate.getDate()
      );

      if (eventEndDateOnly.getTime() > eventStartDateOnly.getTime()) {
        // 자정을 넘어가는 일정 - 분할 처리
        console.log("자정 넘어가는 일정 감지:", event.title);

        // 첫 번째 부분: 시작일의 시작 시간부터 자정까지
        const midnightEnd = new Date(eventStartDate);
        midnightEnd.setHours(23, 59, 59, 999);
        const firstPartDuration = (midnightEnd - eventStartDate) / 60000;

        if (firstPartDuration > 0) {
          createEventBlock(
            eventStartDate,
            startHour,
            startMinutes,
            firstPartDuration,
            event,
            isCompleted,
            true
          );
        }

        // 두 번째 부분: 다음날 자정부터 종료 시간까지
        const nextDayStart = new Date(eventStartDate);
        nextDayStart.setDate(nextDayStart.getDate() + 1);
        nextDayStart.setHours(0, 0, 0, 0);

        const secondPartDuration = (eventEndDate - nextDayStart) / 60000;
        if (secondPartDuration > 0) {
          createEventBlock(
            nextDayStart,
            0,
            0,
            secondPartDuration,
            event,
            isCompleted,
            true
          );
        }
      } else {
        // 일반적인 일정 (자정을 넘지 않음)
        createEventBlock(
          eventStartDate,
          startHour,
          startMinutes,
          duration,
          event,
          isCompleted,
          false
        );
      }
    });

    // 이벤트 배열 반환 (Horae AI 연동용으로 사용)
    return events;
  } catch (error) {
    console.error("이벤트 로드 실패:", error);
  }
}

// ============================================
// 📅 이벤트 블록 생성 헬퍼 함수
// ============================================
// 캘린더 UI에 표시될 일정 블록(시각적 요소)을 생성하는 함수
// 매개변수:
// - eventDate: 일정 날짜
// - startHour: 시작 시간 (시)
// - startMinutes: 시작 시간 (분)
// - duration: 지속 시간 (분)
// - event: 일정 데이터 객체
// - isCompleted: 완료 여부
// - isSplit: 분할된 일정인지 여부
function createEventBlock(
  eventDate,
  startHour,
  startMinutes,
  duration,
  event,
  isCompleted,
  isSplit = false
) {
  // ✅ 시간대 변환 없이 날짜 문자열 생성
  const year = eventDate.getFullYear();
  const month = (eventDate.getMonth() + 1).toString().padStart(2, "0");
  const day = eventDate.getDate().toString().padStart(2, "0");
  const dateStr = `${year}-${month}-${day}`;

  console.log("이벤트 블록 생성:", dateStr, event.title);
  console.log("이벤트 날짜 객체:", eventDate.toString());

  // 해당 날짜의 캘린더 컬럼 찾기
  const column = document.querySelector(
    `.event-column[data-date='${dateStr}']`
  );

  console.log("🔍 컬럼 찾기 시도:", {
    찾는날짜: dateStr,
    찾은컬럼: column ? "찾음" : "없음",
    전체컬럼수: document.querySelectorAll(".event-column").length,
  });

  if (column) {
    // ============================================
    // 🎨 시간 블록 DOM 요소 생성
    // ============================================
    const timeBlock = document.createElement("div");
    timeBlock.className = `time-block fade-in ${
      isCompleted ? "completed" : ""
    }`;

    // 세로 위치 계산: 정확한 픽셀 단위 계산 (각 시간당 60px, 각 분당 1px)
    const topPosition = startHour * 60 + startMinutes;
    timeBlock.style.top = `${topPosition}px`;

    // 높이 계산: 지속시간(분) * 1px per minute
    timeBlock.style.height = `${duration}px`;

    console.log(`📍 일정 블록 위치 설정: "${event.title}"`, {
      날짜: dateStr,
      시작시간: `${startHour}:${startMinutes.toString().padStart(2, "0")}`,
      위치: `${topPosition}px`,
      높이: `${duration}px`,
      지속시간: `${duration}분`,
    });

    // 배경색 설정 (사용자 지정 색상 또는 기본 색상)
    timeBlock.style.backgroundColor = event.color || "#FFE5E5";

    // 그룹 ID가 있으면 데이터 속성으로 저장 (연속 일정 관리용)
    if (event.groupId) {
      timeBlock.dataset.groupId = event.groupId;
    }

    // ============================================
    // 📝 일정 내용 표시 영역
    // ============================================
    const eventContent = document.createElement("div");
    eventContent.className = "event-content";

    // 분할된 일정인 경우 시계 이모지로 표시 구분
    eventContent.textContent = isSplit ? event.title + " ⏰" : event.title;

    // ============================================
    // ✅ 완료 체크박스 생성
    // ============================================
    const completeCheckbox = document.createElement("input");
    completeCheckbox.type = "checkbox";
    completeCheckbox.className = "complete-checkbox";
    completeCheckbox.checked = isCompleted;
    completeCheckbox.title = isCompleted ? "완료됨" : "미완료";

    // 체크박스 상태 변경 이벤트 처리
    completeCheckbox.addEventListener("change", (e) => {
      e.stopPropagation(); // 이벤트 버블링 방지
      const isNowCompleted = e.target.checked;

      // 그룹 ID가 있으면 연결된 모든 일정의 완료 상태 동시 변경
      if (event.groupId) {
        toggleGroupEventCompletion(event.groupId, event.title, isNowCompleted);
      } else {
        // 단일 일정 완료 상태 변경
        toggleEventCompletion(event._id, event.title, isNowCompleted);
      }

      // UI 즉시 업데이트 (서버 응답 대기 없이)
      if (isNowCompleted) {
        timeBlock.classList.add("completed");
        e.target.title = "완료됨";
      } else {
        timeBlock.classList.remove("completed");
        e.target.title = "미완료";
      }
    });

    // ============================================
    // 🗑️ 삭제 버튼 생성
    // ============================================
    const deleteBtn = document.createElement("button");
    deleteBtn.className = "delete-event-btn";
    deleteBtn.textContent = "×";

    // 삭제 버튼 클릭 이벤트 처리
    deleteBtn.onclick = async (e) => {
      e.stopPropagation(); // 이벤트 버블링 방지

      // 그룹 일정과 단일 일정에 따라 다른 확인 메시지 표시
      const confirmMessage = event.groupId
        ? `"${event.title.replace(
            / \([12]일차\)/,
            ""
          )}" 일정 전체를 삭제하시겠습니까?\n(연결된 모든 블록이 삭제됩니다)`
        : `"${event.title}" 일정을 삭제하시겠습니까?`;

      // 사용자 확인 후 삭제 실행
      showConfirmModal("일정 삭제", confirmMessage, async function () {
        try {
          if (event.groupId) {
            // 그룹으로 연결된 모든 일정 삭제
            await deleteGroupEvents(event.groupId, event.title);
          } else {
            // 단일 일정 삭제
            timeBlock.classList.add("removing"); // 삭제 애니메이션
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

// ============================================
// 📝 일정 추가 모달 표시 함수
// ============================================
// 사용자가 캘린더를 클릭했을 때 일정 추가 모달을 표시하는 함수
// 클릭한 시간을 기본값으로 설정하여 UX 향상
function showAddEventModal(hour = 0, minutes = 0) {
  const modal = document.getElementById("eventModal"); // 모달 창
  const startTimeInput = document.getElementById("eventStartTime"); // 시간 시간 입력
  const endTimeInput = document.getElementById("eventEndTime"); // 종료 시간 입력

  // 시간 유효성 검사
  if (hour < 0 || hour >= 24) {
    console.warn("잘못된 시간:", hour);
    hour = 0;
  }
  if (minutes < 0 || minutes >= 60) {
    console.warn("잘못된 분:", minutes);
    minutes = 0;
  }

  // 🕐 시작 시간 설정 (클릭한 시간으로 자동 설정)
  startTimeInput.value = `${hour.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}`;

  // 🕑 종료 시간 계산 (시간 제한 고려)
  let endHour = hour + 1;
  let endMinutes = minutes;

  // 23시 이후로 넘어가는 경우 제한
  if (endHour >= 23) {
    endHour = 22; // 오후 10시로 제한
    endMinutes = 59; // 22:59까지만 가능
    showAlert(
      "일정 종료시간이 오후 11시를 넘을 수 없어 자동으로 조정되었습니다.",
      "info"
    );
  }

  endTimeInput.value = `${endHour.toString().padStart(2, "0")}:${endMinutes
    .toString()
    .padStart(2, "0")}`;

  modal.classList.add("show"); // 모달 표시
  document.getElementById("eventTitle").focus(); // 제목 입력란에 포커스
}

// ============================================
// 📊 활동 로그 관리 시스템
// ============================================
// 사용자의 모든 일정 관련 활동을 기록하고 표시하는 시스템
// localStorage에 저장되어 브라우저 재시작 후에도 유지

// 💾 활동 로그 배열 (localStorage에서 로드, 없으면 빈 배열)
let activityLog = JSON.parse(localStorage.getItem("activityLog")) || [];

// ➕ 활동 추가 함수 - 새로운 사용자 활동을 기록
function addActivity(type, message, eventTitle = "") {
  const activity = {
    id: Date.now(), // 고유 ID (타임스탬프 사용)
    type: type, // 활동 유형: 'add', 'edit', 'delete', 'complete' 등
    message: message, // 사용자에게 표시될 메시지
    eventTitle: eventTitle, // 관련된 일정 제목
    timestamp: new Date(), // 활동 발생 시간
    icon: getActivityIcon(type), // 활동 유형별 이모지 아이콘
  };

  // 📋 최신 활동을 맨 앞에 추가 (최신순 정렬)
  activityLog.unshift(activity);

  // 🔢 최대 10개까지만 저장 (메모리 절약 및 성능 최적화)
  if (activityLog.length > 10) {
    activityLog = activityLog.slice(0, 10);
  }

  // 💾 로컬 스토리지에 저장 (브라우저 재시작 후에도 유지)
  localStorage.setItem("activityLog", JSON.stringify(activityLog));

  // 🔄 UI 즉시 업데이트
  updateRecentActivity();

  // 🎊 새 활동 알림 애니메이션 표시
  showActivityNotification(activity);
}

// 🎨 활동 타입별 아이콘 반환 함수
function getActivityIcon(type) {
  const icons = {
    add: "✅", // 일정 추가
    edit: "📝", // 일정 수정
    delete: "🗑️", // 일정 삭제
    view: "👀", // 일정 조회
    complete: "🎉", // 일정 완료
    horae: "🌟", // Horae AI 기능 사용
  };
  return icons[type] || "📋"; // 기본 아이콘
}

// ⏰ 시간 포맷 함수 (상대 시간으로 표시)
// "3분 전", "2시간 전" 등 사용자 친화적 시간 표시
function getRelativeTime(timestamp) {
  const now = new Date();
  const diff = now - new Date(timestamp); // 시간 차이 (밀리초)
  const minutes = Math.floor(diff / 60000); // 분 단위
  const hours = Math.floor(diff / 3600000); // 시간 단위
  const days = Math.floor(diff / 86400000); // 일 단위

  if (minutes < 1) return "방금 전"; // 1분 미만
  if (minutes < 60) return `${minutes}분 전`; // 1시간 미만
  if (hours < 24) return `${hours}시간 전`; // 1일 미만
  if (days < 7) return `${days}일 전`; // 1주일 미만
  return new Date(timestamp).toLocaleDateString(); // 1주일 이상은 날짜로 표시
}

// 🗑️ 개별 활동 삭제 함수
function removeActivity(activityId) {
  // 해당 ID의 활동을 배열에서 제거
  activityLog = activityLog.filter((activity) => activity.id !== activityId);
  localStorage.setItem("activityLog", JSON.stringify(activityLog));
  updateRecentActivity(); // UI 업데이트
}

// 🧹 모든 활동 삭제 함수 - 사용자 확인 후 전체 기록 삭제
function clearAllActivities() {
  if (activityLog.length === 0) {
    showActivityNotification({
      icon: "📋",
      message: "삭제할 활동이 없습니다",
    });
    return;
  }

  // 🚨 사용자 확인 모달 표시
  showConfirmModal(
    "전체 삭제",
    `모든 활동 기록(${activityLog.length}개)을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`,
    function () {
      activityLog = []; // 배열 비우기
      localStorage.setItem("activityLog", JSON.stringify(activityLog));
      updateRecentActivity();

      showActivityNotification({
        icon: "🗑️",
        message: "모든 활동이 삭제되었습니다",
      });
    }
  );
}

// 🔄 최근 활동 업데이트 함수 (개별 삭제 버튼 포함)
// 활동 로그를 화면에 표시하고 사용자 상호작용 요소 추가
function updateRecentActivity() {
  const activityList = document.getElementById("activityList");

  // 📭 활동이 없는 경우 안내 메시지 표시
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

  // 📝 활동 목록을 HTML로 변환하여 표시
  activityList.innerHTML = activityLog
    .map(
      (activity, index) => `
    <div class="activity-item" style="animation: slideInRight 0.5s ease-out ${
      index * 0.1 // 순차적 애니메이션 지연
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

// 🎭 애니메이션과 함께 활동 삭제
function removeActivityWithAnimation(activityId) {
  const activityElement = event.target.closest(".activity-item");

  if (activityElement) {
    // 🚨 삭제 확인 모달 표시
    showConfirmModal("활동 삭제", "이 활동을 삭제하시겠습니까?", function () {
      activityElement.classList.add("removing"); // 삭제 애니메이션 시작

      // ⏱️ 300ms 애니메이션 완료 후 실제 삭제
      setTimeout(() => {
        removeActivity(activityId);
      }, 300);
    });
  }
}

// 🎊 활동 알림 표시 함수 - 새로운 활동 발생 시 시각적 피드백
function showActivityNotification(activity) {
  // 📬 알림 DOM 요소 생성
  const notification = document.createElement("div");
  notification.className = "activity-notification";
  notification.innerHTML = `
    <div class="notification-icon">${activity.icon}</div>
    <div class="notification-text">${activity.message}</div>
  `;

  document.body.appendChild(notification);

  // 🎬 애니메이션 시퀀스 실행
  setTimeout(() => {
    notification.classList.add("show"); // 100ms 후 나타나기 시작
  }, 100);

  setTimeout(() => {
    notification.classList.remove("show"); // 3초 후 사라지기 시작
    setTimeout(() => {
      document.body.removeChild(notification); // 300ms 후 완전 제거
    }, 300);
  }, 3000);
}

// ============================================
// ➕ 일정 추가 함수 (자정 넘어가는 일정 분할 처리)
// ============================================
// 사용자가 입력한 일정 정보를 서버에 저장하고 UI를 업데이트하는 핵심 함수
async function addEvent(date, startTime, endTime, title, color) {
  console.log("🔥 addEvent 함수 호출됨!", {
    date,
    startTime,
    endTime,
    title,
    color,
  });
  try {
    // 🕐 시간 문자열을 숫자로 변환 ("14:30" → [14, 30])
    const [startHour, startMinute] = startTime.split(":").map(Number);
    const [endHour, endMinute] = endTime.split(":").map(Number);

    // 📅 날짜 객체 생성 (시간대 문제 완전 해결)
    let baseDate;
    if (date instanceof Date) {
      // 정확한 로컬 날짜 사용 (시간대 변환 없이)
      baseDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    } else {
      // 문자열인 경우 파싱
      const parsedDate = new Date(date);
      baseDate = new Date(
        parsedDate.getFullYear(),
        parsedDate.getMonth(),
        parsedDate.getDate()
      );
    }

    console.log("=== addEvent 완전 수정된 날짜 처리 ===");
    console.log("입력 받은 date:", date);
    console.log("생성된 baseDate:", baseDate.toString());
    console.log(
      "baseDate (로컬 날짜만):",
      baseDate.getFullYear(),
      baseDate.getMonth() + 1,
      baseDate.getDate()
    );
    console.log("시작 시간:", startTime, "종료 시간:", endTime);

    // ✅ 시간대 변환 없이 직접 한국 시간 사용 (클릭한 시간 그대로)
    const startDate = new Date(
      baseDate.getFullYear(),
      baseDate.getMonth(),
      baseDate.getDate(),
      startHour,
      startMinute,
      0,
      0
    );
    const endDate = new Date(
      baseDate.getFullYear(),
      baseDate.getMonth(),
      baseDate.getDate(),
      endHour,
      endMinute,
      0,
      0
    );

    console.log("로컬 시간 기준 시작:", startDate.toString());
    console.log("로컬 시간 기준 종료:", endDate.toString());
    console.log(
      "정확한 날짜/시간:",
      startDate.getFullYear(),
      startDate.getMonth() + 1,
      startDate.getDate(),
      startDate.getHours(),
      startDate.getMinutes()
    );

    // 🌙 자정을 넘어가는 일정 처리
    if (endDate <= startDate) {
      endDate.setDate(endDate.getDate() + 1); // 다음 날로 설정
    }

    console.log("최종 시작 시간:", startDate.toString());
    console.log("최종 종료 시간:", endDate.toString());

    // 🧠 로컬에서 일정 패턴 분석 (로컬 시간 기준으로 분석)
    const eventPattern = analyzeEventPattern(startDate, endDate);

    // 📤 서버로 전송할 이벤트 데이터 구성 (한국 시간을 ISO 형식으로 직접 전송)
    const eventData = {
      title, // 일정 제목
      startDate: startDate.toISOString(), // 한국 시간을 그대로 ISO 형식으로 변환
      endDate: endDate.toISOString(), // 한국 시간을 그대로 ISO 형식으로 변환
      color, // 일정 색상
      pattern: eventPattern, // 패턴 분석 결과
    };

    // 🔍 서버 전송 데이터 로깅 (디버깅용)
    console.log("[addEvent] 서버로 전송할 데이터:", eventData);
    console.log("[addEvent] 보정된 ISO 시작 시간:", eventData.startDate);
    console.log("[addEvent] 보정된 ISO 종료 시간:", eventData.endDate);

    // 💾 MongoDB에 일정 저장 (POST 요청)
    const response = await fetchAPI("/", {
      method: "POST",
      body: JSON.stringify(eventData),
    });

    console.log("일정 생성 API 응답:", response);

    // 📊 활동 로그에 추가 (사용자 히스토리)
    addActivity("add", `"${title}" 일정이 추가되었습니다 🌟`, title);

    // ✅ 성공 알림 표시
    showAlert(`"${title}" 일정이 추가되었습니다!`, "success");

    // 🔄 UI 업데이트 (기존 일정 유지하면서 새 일정만 추가)
    console.log("일정 추가 완료, 새 일정 블록만 캘린더에 추가 중...");

    // 모달 먼저 닫기
    closeAddEventModal();

    // 100ms 지연 후 새 일정만 DOM에 추가 (기존 일정들은 유지)
    setTimeout(() => {
      addNewEventToCalendar(response, startDate, endDate);
      console.log("새 일정 블록 추가 완료");
    }, 100);

    // 📈 통계 업데이트 (100ms 지연으로 안정성 확보)
    setTimeout(() => {
      updateTodayStats(); // 오늘 통계 업데이트
      updateWeekStatsSimple(); // 주간 통계 업데이트
    }, 100);

    return response;
  } catch (error) {
    console.error("일정 추가 중 오류 발생:", error);
    showAlert("일정 추가에 실패했습니다", "error");
    throw error;
  }
}

// 🆕 새 일정을 기존 캘린더에 직접 추가하는 함수 (전체 렌더링 방지)
function addNewEventToCalendar(eventData, startDate, endDate) {
  console.log("🎯 addNewEventToCalendar 호출됨:", eventData);

  try {
    // 한국 시간 기준으로 날짜 계산
    const eventStartDate = new Date(startDate);
    const eventEndDate = new Date(endDate);

    console.log("일정 시작:", eventStartDate.toString());
    console.log("일정 종료:", eventEndDate.toString());

    // 현재 주의 시작일 계산
    const weekStart = new Date(currentDate);
    weekStart.setDate(currentDate.getDate() - currentDate.getDay());

    // 일정이 현재 주에 표시되는지 확인
    const dayIndex = Math.floor(
      (eventStartDate - weekStart) / (1000 * 60 * 60 * 24)
    );

    console.log("주 시작일:", weekStart.toString());
    console.log("계산된 요일 인덱스:", dayIndex);

    if (dayIndex < 0 || dayIndex > 6) {
      console.log("일정이 현재 주 범위를 벗어남, 전체 캘린더 렌더링 필요");
      renderCalendar(); // 현재 주 범위를 벗어나면 전체 렌더링
      return;
    }

    // 해당 요일의 이벤트 컬럼 찾기
    const eventColumns = document.querySelectorAll(".event-column");
    const targetColumn = eventColumns[dayIndex];

    if (!targetColumn) {
      console.error("타겟 컬럼을 찾을 수 없음");
      return;
    }

    console.log("타겟 컬럼 찾음:", targetColumn.dataset.date);

    // 시간 계산
    const startHour = eventStartDate.getHours();
    const startMinutes = eventStartDate.getMinutes();
    const duration = (eventEndDate - eventStartDate) / (1000 * 60); // 분 단위

    console.log("시작 시간:", startHour + ":" + startMinutes);
    console.log("지속 시간:", duration + "분");

    // 완료 상태 확인
    const isCompleted = completedEvents.includes(eventData._id);

    // 이벤트 블록 생성
    const eventBlock = createEventBlock(
      eventStartDate,
      startHour,
      startMinutes,
      duration,
      eventData,
      isCompleted,
      false
    );

    if (eventBlock) {
      // 초기 애니메이션 상태 설정
      eventBlock.style.opacity = "0";
      eventBlock.style.transform = "translateY(-10px)";
      eventBlock.style.transition = "all 0.3s ease-out";

      // 타겟 컬럼에 새 일정 블록 추가
      targetColumn.appendChild(eventBlock);

      console.log("✅ 새 일정 블록이 캘린더에 추가됨");

      // 부드러운 나타나기 애니메이션
      setTimeout(() => {
        eventBlock.style.opacity = "1";
        eventBlock.style.transform = "translateY(0)";
      }, 50);
    } else {
      console.error("이벤트 블록 생성 실패");
    }
  } catch (error) {
    console.error("새 일정 추가 중 오류:", error);
    console.log("오류 발생으로 전체 캘린더 렌더링");
    renderCalendar(); // 오류 시 전체 렌더링으로 fallback
  }
}

// 📊 일정 패턴 분석 함수 - AI 학습을 위한 데이터 수집
function analyzeEventPattern(startDate, endDate) {
  const pattern = {
    dayOfWeek: startDate.getDay(), // 요일 (0=일요일)
    timeOfDay: startDate.getHours(), // 시작 시간
    duration: (endDate - startDate) / (1000 * 60), // 지속 시간 (분)
    isOvernight: startDate.getDate() !== endDate.getDate(), // 자정 넘김 여부
  };

  return pattern;
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

    // API 오류 시 기본값으로 UI 복구
    const weekEventsElement = document.getElementById("weekEventsCount");
    const completedEventsElement = document.getElementById("completedEvents");

    if (weekEventsElement) weekEventsElement.textContent = "?";
    if (completedEventsElement) completedEventsElement.textContent = "?";

    // 완료율도 0으로 초기화
    updateCompletionRate(0, 0);
  }
}

// ============================================
// 📊 간단한 주간 통계 (API 호출 최소화 버전)
// ============================================
// 서버 API 호출 없이 현재 화면에 표시된 일정을 기반으로 통계 계산
// 네트워크 오류나 서버 문제 시 백업 통계 제공용
async function updateWeekStatsSimple() {
  try {
    console.log("=== 간단한 주간 통계 시작 ===");

    // localStorage에서 완료된 일정 목록 가져오기 (로컬 데이터 활용)
    const completed = JSON.parse(localStorage.getItem("completedEvents")) || [];
    console.log("로컬 완료 목록:", completed);

    // 현재 DOM에 렌더링된 일정 블록들 카운트
    const visibleEvents = document.querySelectorAll(".time-block"); // 전체 일정
    const visibleCompleted = document.querySelectorAll(".time-block.completed"); // 완료된 일정

    console.log("화면에 보이는 일정:", visibleEvents.length);
    console.log("화면에 보이는 완료된 일정:", visibleCompleted.length);

    // 통계 위젯 UI 업데이트
    document.getElementById("weekEventsCount").textContent =
      visibleEvents.length;
    document.getElementById("completedEvents").textContent =
      visibleCompleted.length;

    // 완료율 계산 및 표시 업데이트
    updateCompletionRate(visibleEvents.length, visibleCompleted.length);

    console.log("=== 간단한 주간 통계 완료 ===");
  } catch (error) {
    console.error("간단한 주간 통계 실패:", error);

    // 오류 시 모든 통계를 0으로 설정
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
      const eventStartDate = new Date(event.startDate);
      const eventDateStr = eventStartDate.toISOString().split("T")[0];
      console.log("이벤트 날짜 비교:", eventDateStr, "vs", todayStr);
      return eventDateStr === todayStr;
    });

    console.log("필터링된 오늘 일정:", todayEvents);

    document.getElementById("todayEventsCount").textContent =
      todayEvents.length;

    // 오늘 완료된 일정 개수
    const completedEvents =
      JSON.parse(localStorage.getItem("completedEvents")) || [];
    const todayCompletedCount = todayEvents.filter((event) =>
      completedEvents.includes(event._id)
    ).length;

    // 다음 일정 찾기 (미완료 일정 중에서, 현재 시간 이후)
    const now = new Date();
    const upcomingEvents = todayEvents
      .filter((event) => {
        const eventStartTime = new Date(event.startDate);
        const eventEndTime = new Date(event.endDate);
        // 일정이 아직 끝나지 않았고 완료되지 않은 경우만 포함
        return eventEndTime > now && !completedEvents.includes(event._id);
      })
      .sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

    console.log("다음 일정 후보:", upcomingEvents);

    const nextEventElement = document.getElementById("nextEvent");
    const nextTimeElement = nextEventElement.querySelector(".next-time");

    if (upcomingEvents.length > 0) {
      const nextEvent = upcomingEvents[0];
      const eventTime = new Date(nextEvent.startDate);
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

// ===== Horae AI 연동 함수들 =====

/**
 * Horae 일정 최적화 모달 표시
 */
async function showHoraeOptimizeModal() {
  const modal = document.getElementById("horaeOptimizeModal");
  const loadingState = document.getElementById("horaeOptimizeLoading");
  const resultState = document.getElementById("horaeOptimizeResult");
  const errorState = document.getElementById("horaeOptimizeError");
  const feedbackElement = document.getElementById("horaeOptimizeFeedback");
  const errorMessageElement = document.getElementById(
    "horaeOptimizeErrorMessage"
  );
  const retryBtn = document.getElementById("horaeOptimizeRetry");

  // 모달 초기화
  loadingState.style.display = "block";
  resultState.style.display = "none";
  errorState.style.display = "none";
  retryBtn.style.display = "none";

  modal.classList.add("show");

  try {
    // 오늘 날짜 계산
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];

    console.log("[Horae 추천] 오늘 날짜:", todayStr);

    // 전체 일정을 조회한 후 클라이언트에서 필터링
    const allEvents = await fetchAPI("");
    console.log("[Horae 추천] 전체 일정 조회 결과:", allEvents);

    // 오늘 날짜에 해당하는 일정만 필터링
    const todayEvents = allEvents.filter((event) => {
      if (!event.startDate) return false;

      const eventStartDate = new Date(event.startDate);
      const eventDateStr = eventStartDate.toISOString().split("T")[0];

      console.log("[Horae 추천] 일정 날짜 비교:", eventDateStr, "vs", todayStr);
      return eventDateStr === todayStr;
    });

    console.log("[Horae 추천] 오늘 일정 필터링 결과:", todayEvents);

    if (!todayEvents || todayEvents.length === 0) {
      throw new Error(
        "오늘 일정이 없어서 추천할 내용이 없습니다. 먼저 일정을 추가해주세요!"
      );
    }

    // 이벤트를 Horae 형식으로 변환
    const scheduleData = todayEvents.map((event) => ({
      title: event.title,
      startDate: event.startDate,
      endDate: event.endDate,
    }));

    console.log("[Horae 추천] 서버로 전송할 데이터:", {
      events: scheduleData,
      date: todayStr,
    });

    // Horae 추천 옵션 API 호출 (ORDO 서버를 통해서)
    const response = await fetch(`/api/horae/suggestions/${todayStr}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({
        events: scheduleData,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error || "일정 추천 옵션 생성 중 오류가 발생했습니다."
      );
    }

    console.log("[Horae 추천] 서버 응답:", data);

    // 성공 시 추천 옵션들 표시
    loadingState.style.display = "none";
    resultState.style.display = "block";

    // Horae 백엔드 응답 구조에 맞게 수정
    const suggestions = data.suggestions || data.options || [];
    const message = data.message || "호라이가 추천하는 일정 옵션입니다";

    console.log("[Horae 추천] 추출된 suggestions:", suggestions);
    console.log("[Horae 추천] 추출된 message:", message);

    // 추천 옵션들을 UI로 표시
    displayScheduleSuggestions(suggestions, message, scheduleData);

    // 활동 로그에 기록
    addActivity("horae", "", "일정 추천 옵션 생성");
  } catch (error) {
    console.error("Horae 일정 추천 오류:", error);

    // 오류 시 에러 상태 표시
    loadingState.style.display = "none";
    errorState.style.display = "block";
    retryBtn.style.display = "inline-block";
    errorMessageElement.textContent = error.message;
  }
}

/**
 * 일정 추천 옵션들을 UI에 표시
 */
function displayScheduleSuggestions(options, message, originalSchedule) {
  const feedbackElement = document.getElementById("horaeOptimizeFeedback");

  console.log("[Horae 추천] displayScheduleSuggestions 호출됨");
  console.log("[Horae 추천] options:", options);
  console.log("[Horae 추천] options 타입:", typeof options);
  console.log("[Horae 추천] options 길이:", options ? options.length : "N/A");
  console.log("[Horae 추천] message:", message);

  if (!options || options.length === 0) {
    console.log('[Horae 추천] 옵션이 없어서 "추천할 옵션이 없습니다" 표시');
    feedbackElement.innerHTML = `
      <div class="suggestions-container">
        <p class="suggestions-message">추천할 옵션이 없습니다.</p>
      </div>
    `;
    return;
  }

  feedbackElement.innerHTML = `
    <div class="suggestions-container">
      <p class="suggestions-message">${message}</p>
      <div class="suggestions-grid">
        ${options
          .map(
            (option) => `
          <div class="suggestion-card" data-suggestion-id="${option.id}">
            <div class="suggestion-header">
              <h4 class="suggestion-title">${option.title}</h4>
              <p class="suggestion-description">${option.description}</p>
            </div>
            <div class="suggestion-benefits">
              <h5>📈 예상 효과:</h5>
              <ul>
                ${option.benefits
                  .map((benefit) => `<li>${benefit}</li>`)
                  .join("")}
              </ul>
            </div>
            <div class="suggestion-schedule">
              <h5>📅 추천 일정:</h5>
              <div class="schedule-items">
                ${option.schedule
                  .map((item) => {
                    console.log(
                      "[Horae 추천] 스케줄 아이템 파싱:",
                      item,
                      typeof item
                    );

                    // OpenAI가 반환하는 문자열 형태 일정을 파싱
                    if (typeof item === "string") {
                      // 다양한 시간 형식 매칭 (더 유연한 정규식)
                      const timeMatch = item.match(
                        /(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})\s+(.+)/
                      );
                      console.log("[Horae 추천] 시간 매칭 결과:", timeMatch);

                      if (timeMatch) {
                        const [, startTime, endTime, title] = timeMatch;
                        return `
                        <div class="schedule-item">
                          <span class="time">${startTime} - ${endTime}</span>
                          <span class="title">${title}</span>
                        </div>
                      `;
                      } else {
                        // 시간만 있는 경우나 다른 형식 시도
                        const timeOnlyMatch = item.match(
                          /(\d{1,2}:\d{2})\s+(.+)/
                        );
                        if (timeOnlyMatch) {
                          const [, time, title] = timeOnlyMatch;
                          return `
                          <div class="schedule-item">
                            <span class="time">${time}</span>
                            <span class="title">${title}</span>
                          </div>
                        `;
                        } else {
                          // 시간 패턴이 없는 경우 전체를 제목으로 사용
                          console.warn(
                            "[Horae 추천] 시간 파싱 실패, 원본 문자열:",
                            item
                          );
                          return `
                          <div class="schedule-item">
                            <span class="time">시간미정</span>
                            <span class="title">${item}</span>
                          </div>
                        `;
                        }
                      }
                    } else if (item && typeof item === "object") {
                      // 객체 형태인 경우
                      console.log("[Horae 추천] 객체 형태 스케줄:", item);
                      const startTime =
                        item.start_time ||
                        item.startTime ||
                        extractTimeFromSchedule(item);
                      const endTime =
                        item.end_time ||
                        item.endTime ||
                        extractTimeFromSchedule(item, "end");
                      const title = item.title || item.name || "제목 없음";

                      return `
                      <div class="schedule-item ${
                        item.isBreak ? "break-item" : ""
                      }">
                        <span class="time">${startTime} - ${endTime}</span>
                        <span class="title">${title}</span>
                      </div>
                    `;
                    } else {
                      console.error(
                        "[Horae 추천] 알 수 없는 스케줄 형식:",
                        item
                      );
                      return `
                      <div class="schedule-item">
                        <span class="time">시간미정</span>
                        <span class="title">알 수 없는 형식</span>
                      </div>
                    `;
                    }
                  })
                  .join("")}
              </div>
            </div>
            <button class="suggestion-apply-btn" onclick="applySuggestion('${
              option.id
            }', '${encodeURIComponent(JSON.stringify(option.schedule))}')">
              ✨ 이 추천 적용하기
            </button>
          </div>
        `
          )
          .join("")}
      </div>
    </div>
  `;
}

/**
 * 일정에서 시간 추출 헬퍼 함수
 */
function extractTimeFromSchedule(scheduleItem, type = "start") {
  const dateField = type === "start" ? "startDate" : "endDate";
  if (scheduleItem[dateField]) {
    try {
      const date = new Date(scheduleItem[dateField]);
      return date.toLocaleTimeString("ko-KR", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    } catch {
      return "시간미정";
    }
  }
  return (
    scheduleItem[type === "start" ? "start_time" : "end_time"] || "시간미정"
  );
}

/**
 * 선택된 추천을 적용
 */
async function applySuggestion(suggestionId, encodedScheduleJson) {
  try {
    const schedule = JSON.parse(decodeURIComponent(encodedScheduleJson));

    // 사용자 확인
    const confirmed = confirm(
      `이 추천을 적용하시겠습니까?\n\n"${getSuggestionTitle(
        suggestionId
      )}"가 적용되면 기존 일정이 수정됩니다.`
    );

    if (!confirmed) return;

    // 로딩 표시
    showAlert("추천을 적용하는 중입니다...", "info");

    console.log("[Horae 추천] 추천 적용 시작, schedule:", schedule);

    // 오늘 날짜 계산
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];

    // 현재 오늘 일정 가져오기
    const allEvents = await fetchAPI("");
    const todayEvents = allEvents.filter((event) => {
      if (!event.startDate) return false;
      const eventStartDate = new Date(event.startDate);
      const eventDateStr = eventStartDate.toISOString().split("T")[0];
      return eventDateStr === todayStr;
    });

    console.log("[Horae 추천] 수정할 기존 일정:", todayEvents);

    // 추천된 일정을 기존 일정과 매칭하여 업데이트
    for (let i = 0; i < schedule.length && i < todayEvents.length; i++) {
      const recommendedItem = schedule[i];
      const existingEvent = todayEvents[i];

      console.log("[Horae 추천] 일정 매칭:", recommendedItem, existingEvent);

      // 추천된 시간 추출
      let newStartTime, newEndTime;

      if (typeof recommendedItem === "string") {
        // 문자열 형태에서 시간 추출
        const timeMatch = recommendedItem.match(
          /(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/
        );
        if (timeMatch) {
          newStartTime = timeMatch[1];
          newEndTime = timeMatch[2];
        }
      } else if (recommendedItem && typeof recommendedItem === "object") {
        // 객체 형태에서 시간 추출
        newStartTime = recommendedItem.start_time || recommendedItem.startTime;
        newEndTime = recommendedItem.end_time || recommendedItem.endTime;
      }

      // 시간이 추출되었으면 일정 업데이트
      if (newStartTime && newEndTime && existingEvent) {
        try {
          // 새로운 시작/종료 시간으로 Date 객체 생성
          const [startHour, startMinute] = newStartTime.split(":").map(Number);
          const [endHour, endMinute] = newEndTime.split(":").map(Number);

          const newStartDate = new Date(existingEvent.startDate);
          newStartDate.setHours(startHour, startMinute, 0, 0);

          const newEndDate = new Date(existingEvent.endDate);
          newEndDate.setHours(endHour, endMinute, 0, 0);

          console.log("[Horae 추천] 일정 업데이트:", {
            id: existingEvent._id,
            title: existingEvent.title,
            newStartDate: newStartDate.toISOString(),
            newEndDate: newEndDate.toISOString(),
          });

          // 서버에 일정 업데이트 요청
          const updateResponse = await fetchAPI(`/${existingEvent._id}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              title: existingEvent.title,
              startDate: newStartDate.toISOString(),
              endDate: newEndDate.toISOString(),
              description: existingEvent.description,
              color: existingEvent.color,
            }),
          });

          console.log("[Horae 추천] 일정 업데이트 응답:", updateResponse);
        } catch (updateError) {
          console.error("[Horae 추천] 일정 업데이트 오류:", updateError);
        }
      }
    }

    // 성공 메시지 표시
    setTimeout(() => {
      showAlert(
        `✨ "${getSuggestionTitle(suggestionId)}" 추천이 적용되었습니다!`,
        "success"
      );

      // 모달 닫기
      document.getElementById("horaeOptimizeModal").classList.remove("show");

      // 캘린더 새로고침
      renderCalendar();

      // 활동 로그 추가
      addActivity(
        "horae",
        "",
        `일정 추천 적용: ${getSuggestionTitle(suggestionId)}`
      );
    }, 1000);
  } catch (error) {
    console.error("추천 적용 오류:", error);
    showAlert("추천 적용 중 오류가 발생했습니다.", "error");
  }
}

/**
 * 추천 ID로 제목 가져오기
 */
function getSuggestionTitle(suggestionId) {
  const titles = {
    "time-ordered": "시간 순서 최적화",
    "with-breaks": "휴식 시간 추가",
    "priority-based": "중요도 우선 정렬",
  };
  return titles[suggestionId] || "추천 옵션";
}

/**
 * Horae Daily 한마디 모달 표시
 */
async function showHoraeDailyModal() {
  const modal = document.getElementById("horaeDailyModal");
  const loadingState = document.getElementById("horaeDailyLoading");
  const resultState = document.getElementById("horaeDailyResult");
  const errorState = document.getElementById("horaeDailyError");
  const feedbackElement = document.getElementById("horaeDailyFeedback");
  const errorMessageElement = document.getElementById("horaeDailyErrorMessage");
  const retryBtn = document.getElementById("horaeDailyRetry");

  // 모달 초기화
  loadingState.style.display = "block";
  resultState.style.display = "none";
  errorState.style.display = "none";
  retryBtn.style.display = "none";

  modal.classList.add("show");

  try {
    // 오늘 날짜 계산
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];

    console.log("[Horae Daily] 오늘 날짜:", todayStr);

    // 전체 일정을 조회한 후 클라이언트에서 필터링
    const allEvents = await fetchAPI("");
    console.log("[Horae Daily] 전체 일정 조회 결과:", allEvents);

    // 오늘 날짜에 해당하는 일정만 필터링 (일정이 없어도 Daily 한마디는 가능)
    const todayEvents = allEvents.filter((event) => {
      if (!event.startDate) return false;

      const eventStartDate = new Date(event.startDate);
      const eventDateStr = eventStartDate.toISOString().split("T")[0];

      console.log(
        "[Horae Daily] 일정 날짜 비교:",
        eventDateStr,
        "vs",
        todayStr
      );
      return eventDateStr === todayStr;
    });

    console.log("[Horae Daily] 오늘 일정 필터링 결과:", todayEvents);

    // 이벤트를 Horae 형식으로 변환 (빈 배열이어도 괜찮음)
    const scheduleData = todayEvents.map((event) => ({
      title: event.title,
      startDate: event.startDate,
      endDate: event.endDate,
    }));

    console.log("[Horae Daily] 서버로 전송할 데이터:", {
      events: scheduleData,
      date: todayStr,
    });

    // Horae API 호출
    const response = await fetch("/api/horae/daily", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({
        events: scheduleData,
        date: todayStr,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error || "Daily 한마디 생성 중 오류가 발생했습니다."
      );
    }

    // 성공 시 결과 표시
    loadingState.style.display = "none";
    resultState.style.display = "block";

    // 서버 응답 구조에 맞게 메시지 추출
    const message =
      data.message ||
      data.data?.feedback ||
      data.data?.wisdom ||
      "오늘도 화이팅!";
    feedbackElement.textContent = message;

    // 활동 로그에 기록
    addActivity("horae", "", "Daily 한마디");
  } catch (error) {
    console.error("Horae Daily 한마디 오류:", error);

    // 오류 시 에러 상태 표시
    loadingState.style.display = "none";
    errorState.style.display = "block";
    retryBtn.style.display = "inline-block";
    errorMessageElement.textContent = error.message;
  }
}

// Horae 모달 이벤트 리스너 설정
document.addEventListener("DOMContentLoaded", () => {
  // Horae 최적화 모달 이벤트들
  const horaeOptimizeModal = document.getElementById("horaeOptimizeModal");
  const horaeOptimizeClose = document.getElementById("horaeOptimizeClose");
  const horaeOptimizeRetry = document.getElementById("horaeOptimizeRetry");

  if (horaeOptimizeClose) {
    horaeOptimizeClose.addEventListener("click", () => {
      horaeOptimizeModal.classList.remove("show");
    });
  }

  if (horaeOptimizeRetry) {
    horaeOptimizeRetry.addEventListener("click", () => {
      showHoraeOptimizeModal();
    });
  }

  // Horae Daily 모달 이벤트들
  const horaeDailyModal = document.getElementById("horaeDailyModal");
  const horaeDailyClose = document.getElementById("horaeDailyClose");
  const horaeDailyRetry = document.getElementById("horaeDailyRetry");

  if (horaeDailyClose) {
    horaeDailyClose.addEventListener("click", () => {
      horaeDailyModal.classList.remove("show");
    });
  }

  if (horaeDailyRetry) {
    horaeDailyRetry.addEventListener("click", () => {
      showHoraeDailyModal();
    });
  }

  // 모달 외부 클릭시 닫기
  [horaeOptimizeModal, horaeDailyModal].forEach((modal) => {
    if (modal) {
      modal.addEventListener("click", (e) => {
        if (e.target === modal) {
          modal.classList.remove("show");
        }
      });
    }
  });
});

// 알림 표시 함수
function showAlert(message, type = "info") {
  // 기존 알림이 있으면 제거
  const existingAlert = document.querySelector(".custom-alert");
  if (existingAlert) {
    existingAlert.remove();
  }

  const alert = document.createElement("div");
  alert.className = `custom-alert alert-${type}`;
  alert.innerHTML = `
    <div class="alert-content">
      <span class="alert-icon">${
        type === "error" ? "❌" : type === "success" ? "✅" : "ℹ️"
      }</span>
      <span class="alert-message">${message}</span>
    </div>
  `;

  document.body.appendChild(alert);

  // 3초 후 자동 제거
  setTimeout(() => {
    if (alert && alert.parentNode) {
      alert.remove();
    }
  }, 3000);
}

// 일정 추가 모달 닫기 함수
function closeAddEventModal() {
  const modal = document.getElementById("eventModal");
  if (modal) {
    modal.classList.remove("show");

    // 폼 초기화
    const form = document.getElementById("eventForm");
    if (form) {
      form.reset();
    }
  }
}

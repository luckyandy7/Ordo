// 테마 관리
let currentTheme = localStorage.getItem("theme") || "light";

// 프로필 API 호출 함수
async function fetchProfileAPI(endpoint, options = {}) {
  const token = localStorage.getItem("token");

  if (!token) {
    throw new Error("토큰이 없습니다. 로그인이 필요합니다.");
  }

  const defaultOptions = {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  };

  const url = `/api${endpoint}`;
  console.log("프로필 API 호출:", url, options);

  try {
    const response = await fetch(url, {
      ...defaultOptions,
      ...options,
    });

    console.log("프로필 API 응답 상태:", response.status, response.statusText);

    if (!response.ok) {
      const errorData = await response.json();
      console.error("프로필 API 오류 응답:", errorData);

      if (response.status === 401) {
        // 토큰 만료 시 로그인 페이지로 리다이렉트
        alert("로그인이 만료되었습니다. 다시 로그인해주세요.");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/email-login";
        return;
      }

      throw new Error(
        errorData.message || `HTTP ${response.status}: ${response.statusText}`
      );
    }

    const data = await response.json();
    console.log("프로필 API 응답 데이터:", data);
    return data;
  } catch (error) {
    console.error("fetchProfileAPI 오류:", error);
    throw error;
  }
}

// 페이지 로드 시 테마 적용
document.addEventListener("DOMContentLoaded", () => {
  applyTheme(currentTheme);
  loadUserData();
  initializeEventListeners();
});

// 테마 적용 함수
function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  const themeIcon = document.querySelector(".theme-icon");
  if (themeIcon) {
    themeIcon.textContent = theme === "dark" ? "☀️" : "🌙";
  }
  localStorage.setItem("theme", theme);
}

// 이벤트 리스너 초기화
function initializeEventListeners() {
  // 테마 토글
  const themeToggle = document.getElementById("themeToggle");
  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      currentTheme = currentTheme === "light" ? "dark" : "light";
      applyTheme(currentTheme);
    });
  }

  // 뒤로가기 버튼
  const backBtn = document.getElementById("backBtn");
  if (backBtn) {
    backBtn.addEventListener("click", () => {
      // 변경사항이 있는 경우 확인
      if (formChanged) {
        showConfirmModal(
          "페이지 나가기",
          "변경사항이 저장되지 않았습니다.\n정말로 페이지를 떠나시겠습니까?",
          function () {
            window.location.href = "/Main/index.html";
          },
          "🚪"
        );
      } else {
        window.location.href = "/Main/index.html";
      }
    });
  }

  // 아바타 변경 버튼
  const avatarChangeBtn = document.querySelector(".avatar-change-btn");
  if (avatarChangeBtn) {
    avatarChangeBtn.addEventListener("click", () => {
      // 파일 선택 다이얼로그 열기
      const fileInput = document.createElement("input");
      fileInput.type = "file";
      fileInput.accept = "image/*";
      fileInput.onchange = handleAvatarChange;
      fileInput.click();
    });
  }

  // 폼 제출
  const profileForm = document.getElementById("profileForm");
  if (profileForm) {
    profileForm.addEventListener("submit", handleFormSubmit);
  }

  // 취소 버튼
  const cancelBtn = document.querySelector(".cancel-btn");
  if (cancelBtn) {
    cancelBtn.addEventListener("click", () => {
      showConfirmModal(
        "변경사항 취소",
        "입력한 변경사항을 모두 취소하시겠습니까?\n저장되지 않은 내용은 사라집니다.",
        function () {
          loadUserData(); // 원래 데이터로 복원
        },
        "↩️"
      );
    });
  }

  // 계정 삭제 버튼
  const deleteAccountBtn = document.getElementById("deleteAccountBtn");
  if (deleteAccountBtn) {
    deleteAccountBtn.addEventListener("click", showDeleteModal);
  }

  // 삭제 확인 입력 필드
  const deleteConfirmInput = document.getElementById("deleteConfirmInput");
  if (deleteConfirmInput) {
    deleteConfirmInput.addEventListener("input", (e) => {
      const deleteConfirmBtn = document.getElementById("deleteConfirm");
      if (deleteConfirmBtn) {
        deleteConfirmBtn.disabled = e.target.value !== "삭제";
      }
    });
  }

  // 모달 버튼들
  setupModalEventListeners();

  // 비밀번호 확인 검증
  const newPassword = document.getElementById("newPassword");
  const confirmPassword = document.getElementById("confirmPassword");

  if (newPassword && confirmPassword) {
    confirmPassword.addEventListener("input", validatePasswordMatch);
    newPassword.addEventListener("input", validatePasswordMatch);
  }
}

// 사용자 데이터 로드 (서버에서 최신 정보 가져오기)
async function loadUserData() {
  try {
    // 서버에서 최신 프로필 정보 가져오기
    const response = await fetchProfileAPI("/profile");
    const userData = response.data.user;

    // 폼 필드에 데이터 채우기
    document.getElementById("userName").value = userData.name || "";
    document.getElementById("userEmail").value = userData.email || "";
    document.getElementById("userPhone").value = userData.phone || "";
    document.getElementById("userBirth").value = userData.birth || "";

    // 아바타 이미지 설정
    if (userData.avatar) {
      const avatarImage = document.querySelector(".avatar-image");
      if (avatarImage) {
        avatarImage.src = userData.avatar;
      }
    }

    console.log("서버에서 프로필 데이터 로드 성공:", userData);
  } catch (error) {
    console.error("서버에서 프로필 로드 실패:", error);

    // 서버 연결 실패 시 로컬 스토리지 데이터 사용
    const user = JSON.parse(localStorage.getItem("user")) || {};
    const localUserData = JSON.parse(localStorage.getItem("userData")) || {};

    // 기본값 설정
    const defaultData = {
      name: user.name || "사용자",
      email: user.email || "user@example.com",
      phone: user.phone || localUserData.phone || "",
      birth: user.birth || localUserData.birth || "",
    };

    // 폼 필드에 데이터 채우기
    document.getElementById("userName").value = defaultData.name;
    document.getElementById("userEmail").value = defaultData.email;
    document.getElementById("userPhone").value = defaultData.phone;
    document.getElementById("userBirth").value = defaultData.birth;
  }
}

// 아바타 변경 처리
function handleAvatarChange(event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const avatarImage = document.querySelector(".avatar-image");
      if (avatarImage) {
        avatarImage.src = e.target.result;
        // 로컬 스토리지에 저장
        localStorage.setItem("userAvatar", e.target.result);
      }
    };
    reader.readAsDataURL(file);
  }
}

// 폼 제출 처리 (서버 API 연동)
async function handleFormSubmit(event) {
  event.preventDefault();

  // 폼 데이터 수집
  const formData = new FormData(event.target);
  const userData = {
    name: formData.get("userName"),
    email: formData.get("userEmail"),
    phone: formData.get("userPhone"),
    birth: formData.get("userBirth"),
  };

  // 비밀번호 변경 검증
  const currentPassword = formData.get("currentPassword");
  const newPassword = formData.get("newPassword");
  const confirmPassword = formData.get("confirmPassword");

  if (newPassword && newPassword !== confirmPassword) {
    alert("새 비밀번호와 비밀번호 확인이 일치하지 않습니다.");
    return;
  }

  try {
    // 아바타 이미지가 변경된 경우 포함
    const savedAvatar = localStorage.getItem("userAvatar");
    if (savedAvatar) {
      userData.avatar = savedAvatar;
    }

    // 비밀번호 변경이 있는 경우 추가
    if (currentPassword && newPassword) {
      userData.currentPassword = currentPassword;
      userData.newPassword = newPassword;
    }

    // 프로필 정보 업데이트
    console.log("서버로 전송할 데이터:", userData);
    const response = await fetchProfileAPI("/profile", {
      method: "PUT",
      body: JSON.stringify(userData),
    });

    console.log("프로필 업데이트 성공:", response);

    // 로컬 스토리지도 업데이트 (캐시 목적)
    const updatedUser = response.data.user;
    localStorage.setItem("user", JSON.stringify(updatedUser));
    localStorage.setItem(
      "userData",
      JSON.stringify({
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        birth: updatedUser.birth,
      })
    );

    // 성공 모달 표시
    showSuccessModal();

    // 비밀번호 필드 초기화
    document.getElementById("currentPassword").value = "";
    document.getElementById("newPassword").value = "";
    document.getElementById("confirmPassword").value = "";

    // 변경사항 플래그 리셋
    formChanged = false;

    // 아바타 임시 저장소 정리
    localStorage.removeItem("userAvatar");
  } catch (error) {
    console.error("프로필 업데이트 실패:", error);
    alert(`저장 중 오류가 발생했습니다: ${error.message}`);
  }
}

// 비밀번호 일치 검증
function validatePasswordMatch() {
  const newPassword = document.getElementById("newPassword");
  const confirmPassword = document.getElementById("confirmPassword");

  if (newPassword.value && confirmPassword.value) {
    if (newPassword.value !== confirmPassword.value) {
      confirmPassword.setCustomValidity("비밀번호가 일치하지 않습니다.");
    } else {
      confirmPassword.setCustomValidity("");
    }
  }
}

// 성공 모달 표시
function showSuccessModal() {
  const modal = document.getElementById("successModal");
  if (modal) {
    modal.classList.add("show");
  }
}

// 삭제 모달 표시
function showDeleteModal() {
  const modal = document.getElementById("deleteModal");
  if (modal) {
    modal.classList.add("show");
    // 입력 필드 초기화
    document.getElementById("deleteConfirmInput").value = "";
    document.getElementById("deleteConfirm").disabled = true;
  }
}

// 모달 이벤트 리스너 설정
function setupModalEventListeners() {
  // 성공 모달 확인 버튼
  const successOk = document.getElementById("successOk");
  if (successOk) {
    successOk.addEventListener("click", () => {
      const modal = document.getElementById("successModal");
      if (modal) {
        modal.classList.remove("show");

        // 저장 후 메인 페이지로 이동할지 묻기
        setTimeout(() => {
          showConfirmModal(
            "저장 완료",
            "개인정보가 성공적으로 저장되었습니다! 🎉\n메인 페이지로 이동하시겠습니까?",
            function () {
              window.location.href = "/Main/index.html";
            },
            "✅"
          );
        }, 300);
      }
    });
  }

  // 삭제 모달 취소 버튼
  const deleteCancel = document.getElementById("deleteCancel");
  if (deleteCancel) {
    deleteCancel.addEventListener("click", () => {
      const modal = document.getElementById("deleteModal");
      if (modal) {
        modal.classList.remove("show");
      }
    });
  }

  // 삭제 확인 버튼
  const deleteConfirm = document.getElementById("deleteConfirm");
  if (deleteConfirm) {
    deleteConfirm.addEventListener("click", async () => {
      showConfirmModal(
        "계정 삭제 확인",
        "정말로 계정을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없으며, 모든 데이터가 영구적으로 삭제됩니다.",
        async function () {
          try {
            // 현재 비밀번호 입력 받기
            const password = prompt(
              "계정 삭제를 위해 현재 비밀번호를 입력해주세요:"
            );
            if (!password) {
              alert("비밀번호를 입력해야 계정을 삭제할 수 있습니다.");
              return;
            }

            // 서버에 계정 삭제 요청
            await fetchProfileAPI("/profile", {
              method: "DELETE",
              body: JSON.stringify({ password }),
            });

            // 로컬 데이터 삭제
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            localStorage.removeItem("userData");
            localStorage.removeItem("userAvatar");
            localStorage.removeItem("theme");
            localStorage.removeItem("completedEvents");
            localStorage.removeItem("activityLog");

            alert("계정이 성공적으로 삭제되었습니다.");
            // 로그인 페이지로 리다이렉트
            window.location.href = "/email-login";
          } catch (error) {
            console.error("계정 삭제 실패:", error);
            alert(`계정 삭제 실패: ${error.message}`);
          }
        },
        "⚠️"
      );
    });
  }

  // 모달 배경 클릭 시 닫기
  const modals = document.querySelectorAll(".modal");
  modals.forEach((modal) => {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.classList.remove("show");
      }
    });
  });
}

// 입력 필드 실시간 검증
function setupFieldValidation() {
  // 이메일 검증
  const emailField = document.getElementById("userEmail");
  if (emailField) {
    emailField.addEventListener("blur", () => {
      const email = emailField.value;
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (email && !emailRegex.test(email)) {
        emailField.setCustomValidity("올바른 이메일 형식을 입력해주세요.");
      } else {
        emailField.setCustomValidity("");
      }
    });
  }

  // 전화번호 검증
  const phoneField = document.getElementById("userPhone");
  if (phoneField) {
    phoneField.addEventListener("input", (e) => {
      // 숫자와 하이픈만 허용
      e.target.value = e.target.value.replace(/[^0-9-]/g, "");
    });
  }
}

// 페이지 로드 시 추가 초기화
document.addEventListener("DOMContentLoaded", () => {
  setupFieldValidation();

  // 저장된 아바타 이미지 로드
  const savedAvatar = localStorage.getItem("userAvatar");
  if (savedAvatar) {
    const avatarImage = document.querySelector(".avatar-image");
    if (avatarImage) {
      avatarImage.src = savedAvatar;
    }
  }
});

// 키보드 단축키
document.addEventListener("keydown", (e) => {
  // Ctrl+S로 저장
  if (e.ctrlKey && e.key === "s") {
    e.preventDefault();
    const form = document.getElementById("profileForm");
    if (form) {
      form.dispatchEvent(new Event("submit"));
    }
  }

  // ESC로 모달 닫기
  if (e.key === "Escape") {
    const openModal = document.querySelector(".modal.show");
    if (openModal) {
      openModal.classList.remove("show");
    }
  }
});

// 폼 변경사항 추적
let formChanged = false;

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("profileForm");
  if (form) {
    // 폼 필드 변경 감지
    form.addEventListener("input", () => {
      formChanged = true;
    });

    form.addEventListener("change", () => {
      formChanged = true;
    });
  }
});

// 페이지 떠날 때 경고
window.addEventListener("beforeunload", (e) => {
  if (formChanged) {
    e.preventDefault();
    e.returnValue =
      "변경사항이 저장되지 않았습니다. 정말로 페이지를 떠나시겠습니까?";
  }
});

// 폼 제출 시 변경사항 플래그 리셋
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("profileForm");
  if (form) {
    form.addEventListener("submit", () => {
      formChanged = false;
    });
  }
});

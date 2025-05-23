// 페이지 로드 시 사용자 정보 표시
document.addEventListener("DOMContentLoaded", () => {
  // 로그인 체크
  const token = localStorage.getItem("token");
  if (!token) {
    alert("로그인이 필요합니다.");
    window.location.href = "/login";
    return;
  }

  // 사용자 정보 표시
  try {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user) {
      document.getElementById("userName").textContent = user.name;
    }
  } catch (error) {
    console.error("사용자 정보 로드 실패:", error);
  }

  // 로그아웃 버튼 이벤트 리스너
  document.getElementById("logoutBtn").addEventListener("click", () => {
    // 로컬 스토리지 클리어
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    // 로그인 페이지로 이동
    window.location.href = "/email-login";
  });
});

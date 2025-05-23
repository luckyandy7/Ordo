document.getElementById("signupForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("name").value;
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirmPassword").value;

  // 입력값 검증
  if (!name || !email || !password || !confirmPassword) {
    alert("모든 필드를 입력해주세요.");
    return;
  }

  // 이메일 형식 검증
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    alert("올바른 이메일 형식이 아닙니다.");
    return;
  }

  // 비밀번호 확인
  if (password !== confirmPassword) {
    alert("비밀번호가 일치하지 않습니다.");
    return;
  }

  // 비밀번호 길이 검증
  if (password.length < 6) {
    alert("비밀번호는 최소 6자 이상이어야 합니다.");
    return;
  }

  try {
    console.log("회원가입 요청 시작");

    // API 요청
    const response = await fetch("/api/signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        email,
        password,
      }),
    });

    // Content-Type 확인
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      throw new Error("서버 응답이 JSON 형식이 아닙니다.");
    }

    // 응답 처리
    const data = await response.json();
    console.log("서버 응답:", data);

    if (!response.ok) {
      throw new Error(data.message || "회원가입에 실패했습니다.");
    }

    // 성공 처리
    if (data.token) {
      localStorage.setItem("token", data.token);
    }

    alert("회원가입이 완료되었습니다! 로그인 페이지로 이동합니다.");
    window.location.href = "/email-login";
  } catch (error) {
    console.error("회원가입 에러:", error);
    alert(error.message || "회원가입 중 오류가 발생했습니다.");
  }
});

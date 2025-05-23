document
  .getElementById("loginFormElement")
  .addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!email || !password) {
      alert("이메일과 비밀번호를 모두 입력하세요.");
      return;
    }

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "로그인에 실패했습니다.");
      }

      // 토큰 저장
      localStorage.setItem("token", data.data.token);

      // 사용자 정보 저장
      localStorage.setItem("user", JSON.stringify(data.data.user));

      console.log("로그인 성공!", data);
      alert("로그인이 완료되었습니다!");

      // 메인 페이지로 이동 (index.html로 직접 이동)
      window.location.replace("/Main/index.html");
    } catch (error) {
      console.error("로그인 에러:", error);
      alert(error.message || "로그인 중 오류가 발생했습니다.");
    }
  });

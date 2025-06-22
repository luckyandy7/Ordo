/**
 * 회원가입 처리 JavaScript 파일
 * 사용자 등록 및 입력값 검증을 담당
 */

// 회원가입 폼의 submit 이벤트 리스너 등록
document.getElementById("signupForm").addEventListener("submit", async (e) => {
  // 폼의 기본 제출 동작 방지 (페이지 새로고침 방지)
  e.preventDefault();

  // 입력 필드에서 값 가져오기
  const name = document.getElementById("name").value;
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirmPassword").value;

  // 1. 필수 필드 입력 검증
  if (!name || !email || !password || !confirmPassword) {
    alert("모든 필드를 입력해주세요.");
    return;
  }

  // 2. 이메일 형식 검증 (정규표현식 사용)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    alert("올바른 이메일 형식이 아닙니다.");
    return;
  }

  // 3. 비밀번호 일치 확인
  if (password !== confirmPassword) {
    alert("비밀번호가 일치하지 않습니다.");
    return;
  }

  // 4. 비밀번호 최소 길이 검증
  if (password.length < 6) {
    alert("비밀번호는 최소 6자 이상이어야 합니다.");
    return;
  }

  try {
    console.log("회원가입 요청 시작");

    // 서버에 회원가입 요청 전송
    const response = await fetch("/api/signup", {
      method: "POST",  // POST 메서드 사용
      headers: {
        "Content-Type": "application/json",  // JSON 형식으로 데이터 전송
      },
      body: JSON.stringify({
        name,     // 사용자 이름
        email,    // 이메일 주소
        password, // 비밀번호
      }),
    });

    // 응답 Content-Type 확인 (JSON 형식인지 검증)
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      throw new Error("서버 응답이 JSON 형식이 아닙니다.");
    }

    // 서버 응답을 JSON으로 파싱
    const data = await response.json();
    console.log("서버 응답:", data);

    // 응답 상태 확인 (실패 시 에러 발생)
    if (!response.ok) {
      throw new Error(data.message || "회원가입에 실패했습니다.");
    }

    // 회원가입 성공 처리
    // 토큰이 있으면 로컬 스토리지에 저장 (자동 로그인)
    if (data.token) {
      localStorage.setItem("token", data.token);
    }

    // 성공 메시지 표시 및 로그인 페이지로 리디렉션
    alert("회원가입이 완료되었습니다! 로그인 페이지로 이동합니다.");
    window.location.href = "/email-login";
    
  } catch (error) {
    // 에러 처리
    console.error("회원가입 에러:", error);
    alert(error.message || "회원가입 중 오류가 발생했습니다.");
  }
});

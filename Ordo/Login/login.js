/**
 * 로그인 처리 JavaScript 파일
 * 사용자 인증 및 토큰 관리를 담당
 */

// 로그인 폼의 submit 이벤트 리스너 등록
document
  .getElementById("loginFormElement")
  .addEventListener("submit", async (e) => {
    // 폼의 기본 제출 동작 방지 (페이지 새로고침 방지)
    e.preventDefault();

    // 입력 필드에서 값 가져오기 (앞뒤 공백 제거)
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    // 입력값 유효성 검사
    if (!email || !password) {
      alert("이메일과 비밀번호를 모두 입력하세요.");
      return;
    }

    try {
      // 서버에 로그인 요청 전송
      const response = await fetch("/api/login", {
        method: "POST",  // POST 메서드 사용
        headers: {
          "Content-Type": "application/json",  // JSON 형식으로 데이터 전송
        },
        body: JSON.stringify({ email, password }),  // 이메일과 비밀번호를 JSON으로 변환
      });

      // 서버 응답을 JSON으로 파싱
      const data = await response.json();

      // 응답 상태 확인 (실패 시 에러 발생)
      if (!response.ok) {
        throw new Error(data.message || "로그인에 실패했습니다.");
      }

      // 로그인 성공 처리
      // JWT 토큰을 로컬 스토리지에 저장
      localStorage.setItem("token", data.data.token);

      // 사용자 정보를 로컬 스토리지에 저장
      localStorage.setItem("user", JSON.stringify(data.data.user));

      // 콘솔에 성공 로그 출력
      console.log("로그인 성공!", data);
      alert("로그인이 완료되었습니다!");

      // 메인 페이지로 리디렉션 (히스토리 교체로 뒤로가기 방지)
      window.location.replace("/Main/index.html");
      
    } catch (error) {
      // 에러 처리
      console.error("로그인 에러:", error);
      alert(error.message || "로그인 중 오류가 발생했습니다.");
    }
  });

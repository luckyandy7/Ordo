const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const axios = require("axios");
require("dotenv").config(); // .env에서 환경변수 불러오기

// 환경 변수 기본값 설정
const KAKAO_CLIENT_ID =
  process.env.KAKAO_CLIENT_ID || "e0856775ac58c0fd2d1a8cfe8806a1a9";
const KAKAO_REDIRECT_URI =
  process.env.KAKAO_REDIRECT_URI || "http://localhost:5001/auth/kakao/callback";
// 구글 클라이언트 정보 (Google Cloud Console에서 발급받은 값)
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI =
  process.env.GOOGLE_REDIRECT_URI ||
  "http://localhost:5001/auth/google/callback";
const JWT_SECRET = process.env.JWT_SECRET;

//카카오 로그인 라우터
router.get("/kakao/callback", async (req, res) => {
  const { code } = req.query;

  try {
    // 1. 토큰 요청
    const tokenRes = await axios.post(
      "https://kauth.kakao.com/oauth/token",
      new URLSearchParams({
        grant_type: "authorization_code",
        client_id: KAKAO_CLIENT_ID,
        redirect_uri: KAKAO_REDIRECT_URI,
        code,
      }),
      { headers: { "Content-type": "application/x-www-form-urlencoded" } }
    );

    const accessToken = tokenRes.data.access_token;

    // 2. 사용자 정보 요청
    const userRes = await axios.get("https://kapi.kakao.com/v2/user/me", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const kakaoUser = userRes.data;
    const { id: kakaoId, properties, kakao_account } = kakaoUser;

    // 카카오 사용자 정보 디버깅
    console.log("🔍 카카오 API 전체 응답:", JSON.stringify(kakaoUser, null, 2));
    console.log("🔍 properties:", properties);
    console.log("🔍 kakao_account:", kakao_account);

    // 카카오 사용자 정보 추출 (비즈니스 모델 아님 - 제한적 정보만 사용)
    const nickname = properties?.nickname || kakaoId.toString();
    const email = `kakao_${kakaoId}@ordo.local`; // 더미 이메일 (실제 이메일 권한 없음)
    const profileImage =
      properties?.profile_image || properties?.thumbnail_image || null;

    console.log(
      "🔍 추출된 정보 - 닉네임:",
      nickname,
      "이메일:",
      email,
      "프로필이미지:",
      profileImage
    );

    // 3. 데이터베이스에서 사용자 찾기 또는 생성
    let user = await User.findOne({
      $or: [{ email: email }, { kakaoId: kakaoId }],
    });

    if (!user) {
      // 새 사용자 생성
      user = new User({
        email: email,
        name: nickname,
        kakaoId: kakaoId,
        password: "kakao-login", // 카카오 로그인 사용자는 비밀번호 불필요
        isKakaoUser: true,
        profileImage: profileImage,
      });
      await user.save();
      console.log("새 카카오 사용자 생성:", user);
    } else {
      // 기존 사용자 정보 업데이트
      if (!user.kakaoId) {
        user.kakaoId = kakaoId;
        user.isKakaoUser = true;
        user.profileImage = profileImage;
        await user.save();
      }
      console.log("기존 사용자 카카오 로그인:", user);
    }

    // 4. JWT 토큰 생성
    const token = jwt.sign({ userId: user._id, kakaoId: kakaoId }, JWT_SECRET, {
      expiresIn: "7d",
    });

    // 5. 토큰과 사용자 정보를 포함한 HTML 페이지로 리다이렉트
    const redirectHTML = `
    <!DOCTYPE html>
    <html lang="ko">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Ordo - 카카오 로그인 성공</title>
        <link href="https://fonts.googleapis.com/css2?family=Cutive:wght@400&family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
        <style>
            @font-face {
                font-family: "Freesentation";
                src: url("/font/Freesentation.ttf") format("truetype");
            }

            :root {
                --copper-primary: #c96342;
                --copper-light: #e08b6f;
                --copper-dark: #a54a2e;
                --copper-bright: #f2a085;
                --copper-shadow: rgba(201, 99, 66, 0.15);
                --kakao-yellow: #FEE500;
                --kakao-brown: #3C1E1E;
            }

            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }

            body {
                font-family: 'Inter', 'Freesentation', -apple-system, BlinkMacSystemFont, sans-serif;
                background: linear-gradient(135deg, #f6f0eb 0%, #faf4f2 50%, #f0e6e1 100%);
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                overflow: hidden;
                position: relative;
            }

            /* 배경 장식 */
            .background-decoration {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                overflow: hidden;
                z-index: 0;
            }

            .decoration-element {
                position: absolute;
                border-radius: 50%;
                background: linear-gradient(135deg, var(--copper-primary), var(--copper-light));
                opacity: 0.1;
                animation: float 6s ease-in-out infinite;
            }

            .decoration-element:nth-child(1) {
                width: 200px;
                height: 200px;
                top: -100px;
                left: -100px;
                animation-delay: 0s;
            }

            .decoration-element:nth-child(2) {
                width: 150px;
                height: 150px;
                top: 60%;
                right: -75px;
                animation-delay: 2s;
            }

            .decoration-element:nth-child(3) {
                width: 100px;
                height: 100px;
                bottom: -50px;
                left: 20%;
                animation-delay: 4s;
            }

            .decoration-element:nth-child(4) {
                width: 300px;
                height: 300px;
                top: 20%;
                right: -150px;
                background: linear-gradient(135deg, var(--kakao-yellow), #FFD700);
                opacity: 0.05;
                animation-delay: 1s;
            }

            @keyframes float {
                0%, 100% { transform: translateY(0px) rotate(0deg); }
                50% { transform: translateY(-20px) rotate(10deg); }
            }

            /* 메인 컨테이너 */
            .success-container {
                background: rgba(255, 255, 255, 0.95);
                backdrop-filter: blur(20px);
                border-radius: 24px;
                padding: 3rem 2.5rem;
                text-align: center;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1), 0 8px 32px rgba(201, 99, 66, 0.1);
                max-width: 480px;
                width: 90%;
                position: relative;
                z-index: 1;
                border: 1px solid rgba(255, 255, 255, 0.8);
                animation: slideUp 0.8s ease-out;
            }

            @keyframes slideUp {
                from {
                    opacity: 0;
                    transform: translateY(40px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }

            /* 브랜드 헤더 */
            .brand-header {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 16px;
                margin-bottom: 2rem;
                animation: fadeIn 1s ease-out 0.3s both;
            }

            .brand-logo {
                width: 48px;
                height: 48px;
                border-radius: 12px;
                transition: transform 0.3s ease;
            }

            .brand-logo:hover {
                transform: rotate(15deg) scale(1.1);
            }

            .brand-title {
                font-family: 'Cutive', serif;
                font-size: 2rem;
                color: var(--copper-primary);
                font-weight: 400;
                letter-spacing: -0.02em;
            }

            /* 성공 아이콘 */
            .success-icon {
                width: 100px;
                height: 100px;
                background: linear-gradient(135deg, var(--kakao-yellow), #FFD700);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 0 auto 2rem;
                font-size: 3rem;
                animation: bounceIn 1s ease-out 0.5s both;
                position: relative;
                overflow: hidden;
            }

            .success-icon::before {
                content: '';
                position: absolute;
                top: -50%;
                left: -50%;
                width: 200%;
                height: 200%;
                background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.3), transparent);
                animation: shine 2s ease-in-out infinite;
            }

            @keyframes bounceIn {
                0% { transform: scale(0); opacity: 0; }
                60% { transform: scale(1.2); opacity: 1; }
                100% { transform: scale(1); }
            }

            @keyframes shine {
                0% { transform: translateX(-100%) translateY(-100%) rotate(45deg); }
                50% { transform: translateX(100%) translateY(100%) rotate(45deg); }
                100% { transform: translateX(-100%) translateY(-100%) rotate(45deg); }
            }

            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(20px); }
                to { opacity: 1; transform: translateY(0); }
            }

            /* 제목과 메시지 */
            .success-title {
                font-family: 'Cutive', serif;
                font-size: 2rem;
                color: var(--copper-primary);
                margin-bottom: 0.75rem;
                animation: fadeIn 1s ease-out 0.7s both;
            }

            .success-message {
                color: #666;
                font-size: 1.1rem;
                line-height: 1.6;
                margin-bottom: 2rem;
                font-family: 'Freesentation', sans-serif;
                animation: fadeIn 1s ease-out 0.9s both;
            }

            /* 카카오 정보 카드 */
            .kakao-info {
                background: linear-gradient(135deg, var(--kakao-yellow), #FFD700);
                color: var(--kakao-brown);
                padding: 1.25rem;
                border-radius: 16px;
                margin-bottom: 2rem;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 12px;
                font-weight: 600;
                font-size: 1rem;
                animation: fadeIn 1s ease-out 1.1s both;
                position: relative;
                overflow: hidden;
            }

            .kakao-info::before {
                content: '';
                position: absolute;
                top: 0;
                left: -100%;
                width: 100%;
                height: 100%;
                background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
                transition: left 0.5s ease;
            }

            .kakao-info:hover::before {
                left: 100%;
            }

            /* 로딩 프로그레스 */
            .loading-progress {
                margin-bottom: 1.5rem;
                animation: fadeIn 1s ease-out 1.3s both;
            }

            .progress-bar {
                width: 100%;
                height: 8px;
                background: rgba(201, 99, 66, 0.1);
                border-radius: 4px;
                overflow: hidden;
                position: relative;
            }

            .progress-fill {
                height: 100%;
                background: linear-gradient(90deg, var(--copper-primary), var(--kakao-yellow), var(--copper-light));
                border-radius: 4px;
                animation: fillProgress 2s ease-out forwards;
                position: relative;
            }

            .progress-fill::after {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.5), transparent);
                animation: progressShine 1.5s ease-in-out infinite;
            }

            @keyframes fillProgress {
                from { width: 0%; }
                to { width: 100%; }
            }

            @keyframes progressShine {
                0% { transform: translateX(-100%); }
                100% { transform: translateX(100%); }
            }

            /* 리다이렉트 텍스트 */
            .redirect-text {
                color: #888;
                font-size: 0.95rem;
                font-family: 'Freesentation', sans-serif;
                animation: fadeIn 1s ease-out 1.5s both;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
            }

            .redirect-text::before {
                content: '⏱️';
                animation: pulse 1.5s ease-in-out infinite;
            }

            @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.5; }
            }

            /* 모바일 최적화 */
            @media (max-width: 480px) {
                .success-container {
                    padding: 2rem 1.5rem;
                    margin: 1rem;
                }

                .brand-title {
                    font-size: 1.5rem;
                }

                .success-title {
                    font-size: 1.5rem;
                }

                .success-message {
                    font-size: 1rem;
                }

                .success-icon {
                    width: 80px;
                    height: 80px;
                    font-size: 2.5rem;
                }
            }
        </style>
    </head>
    <body>
        <div class="background-decoration">
            <div class="decoration-element"></div>
            <div class="decoration-element"></div>
            <div class="decoration-element"></div>
            <div class="decoration-element"></div>
        </div>

        <div class="success-container">
            <div class="brand-header">
                <img src="/Login/image-8.png" alt="Ordo Logo" class="brand-logo" />
                <h1 class="brand-title">Ordo</h1>
            </div>

            <div class="success-icon">
                🎉
            </div>

            <h2 class="success-title">카카오 로그인 성공!</h2>
            <p class="success-message">
                환영합니다!<br>
                <strong>체계적인 일상 관리</strong>를 시작해보세요.
            </p>

            <div class="kakao-info">
                <span style="font-size: 1.2rem;">💬</span>
                <span>카카오 계정으로 연결되었습니다</span>
            </div>

            <div class="loading-progress">
                <div class="progress-bar">
                    <div class="progress-fill"></div>
                </div>
            </div>

            <p class="redirect-text">메인 페이지로 이동 중입니다...</p>
        </div>

        <script>
            // 로컬 스토리지에 토큰과 사용자 정보 저장
            localStorage.setItem('token', '${token}');
            localStorage.setItem('user', JSON.stringify({
                id: '${user._id}',
                email: '${user.email}',
                name: '${user.name}',
                kakaoId: '${kakaoId}',
                isKakaoUser: true,
                profileImage: '${profileImage}'
            }));

            // 2초 후 메인 페이지로 이동
            setTimeout(() => {
                window.location.href = '/Main/index.html';
            }, 2000);
        </script>
    </body>
    </html>`;

    res.send(redirectHTML);
  } catch (err) {
    console.error("🔴 카카오 로그인 오류:", err.response?.data || err.message);

    // 오류 발생 시 로그인 페이지로 리다이렉트
    const errorHTML = `
    <!DOCTYPE html>
    <html lang="ko">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Ordo - 로그인 오류</title>
        <link href="https://fonts.googleapis.com/css2?family=Cutive:wght@400&family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
        <style>
            @font-face {
                font-family: "Freesentation";
                src: url("/font/Freesentation.ttf") format("truetype");
            }

            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }

            body {
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
                background: linear-gradient(135deg, #C96342 0%, #8B4513 50%, #654321 100%);
                color: white;
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                overflow: hidden;
                position: relative;
            }

            .error-container {
                background: rgba(255, 255, 255, 0.95);
                backdrop-filter: blur(20px);
                border-radius: 24px;
                padding: 3rem 2.5rem;
                text-align: center;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
                max-width: 420px;
                width: 90%;
                position: relative;
                z-index: 1;
                border: 1px solid rgba(255, 255, 255, 0.2);
            }

            .brand-header {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 12px;
                margin-bottom: 1.5rem;
            }

            .brand-logo {
                width: 40px;
                height: 40px;
                border-radius: 8px;
            }

            .brand-title {
                font-family: 'Cutive', serif;
                font-size: 1.8rem;
                color: #C96342;
                font-weight: 400;
            }

            .error-icon {
                width: 80px;
                height: 80px;
                background: linear-gradient(135deg, #ff6b6b, #ee5a24);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 0 auto 1.5rem;
                font-size: 2.5rem;
            }

            .error-title {
                font-family: 'Cutive', serif;
                font-size: 1.5rem;
                color: #C96342;
                margin-bottom: 0.5rem;
            }

            .error-message {
                color: #666;
                font-size: 1rem;
                line-height: 1.5;
                margin-bottom: 2rem;
                font-family: 'Freesentation', sans-serif;
            }

            .redirect-info {
                background: rgba(201, 99, 66, 0.1);
                color: #C96342;
                padding: 1rem;
                border-radius: 12px;
                margin-bottom: 1rem;
                font-family: 'Freesentation', sans-serif;
            }
        </style>
    </head>
    <body>
        <div class="error-container">
            <div class="brand-header">
                <img src="/Login/image-8.png" alt="Ordo Logo" class="brand-logo" />
                <h1 class="brand-title">Ordo</h1>
            </div>

            <div class="error-icon">
                ⚠️
            </div>

            <h2 class="error-title">로그인 오류</h2>
            <p class="error-message">
                카카오 로그인 중 문제가 발생했습니다.<br>
                다시 시도해주세요.
            </p>

            <div class="redirect-info">
                잠시 후 로그인 페이지로 이동합니다...
            </div>
        </div>

        <script>
            setTimeout(() => {
                window.location.href = '/Login/email-login.html';
            }, 3000);
        </script>
    </body>
    </html>`;

    res.send(errorHTML);
  }
});

// 구글 로그인 시작 라우트
router.get("/google", (req, res) => {
  const state = Math.random().toString(36).substring(2, 15);
  const scope = "openid email profile";

  const googleAuthUrl =
    `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${GOOGLE_CLIENT_ID}&` +
    `redirect_uri=${encodeURIComponent(GOOGLE_REDIRECT_URI)}&` +
    `response_type=code&` +
    `scope=${encodeURIComponent(scope)}&` +
    `state=${state}`;

  console.log("🔵 구글 인증 URL:", googleAuthUrl);
  res.redirect(googleAuthUrl);
});

// 구글 로그인 콜백 라우트
router.get("/google/callback", async (req, res) => {
  const { code, state } = req.query;

  try {
    console.log("🔵 구글 콜백 시작, code:", code);
    console.log("🔧 [디버그] 사용 중인 구글 클라이언트 ID:", GOOGLE_CLIENT_ID);
    console.log(
      "🔧 [디버그] 사용 중인 구글 클라이언트 시크릿:",
      GOOGLE_CLIENT_SECRET ? "설정됨" : "설정되지 않음"
    );

    // 1. 토큰 요청
    const tokenRes = await axios.post(
      "https://oauth2.googleapis.com/token",
      {
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        code: code,
        grant_type: "authorization_code",
        redirect_uri: GOOGLE_REDIRECT_URI,
      },
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    const accessToken = tokenRes.data.access_token;
    console.log("🔵 구글 액세스 토큰 획득 성공");

    // 2. 사용자 정보 요청
    const userRes = await axios.get(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const googleUser = userRes.data;
    console.log("🔵 구글 사용자 정보:", JSON.stringify(googleUser, null, 2));

    const { id: googleId, email, name, picture } = googleUser;

    // 3. 데이터베이스에서 사용자 찾기 또는 생성
    let user = await User.findOne({
      $or: [{ email: email }, { googleId: googleId }],
    });

    if (!user) {
      // 새 사용자 생성
      user = new User({
        email: email,
        name: name,
        googleId: googleId,
        password: "google-login", // 구글 로그인 사용자는 비밀번호 불필요
        isGoogleUser: true,
        profileImage: picture,
      });
      await user.save();
      console.log("새 구글 사용자 생성:", user);
    } else {
      // 기존 사용자 정보 업데이트
      if (!user.googleId) {
        user.googleId = googleId;
        user.isGoogleUser = true;
        if (picture) user.profileImage = picture;
        await user.save();
      }
      console.log("기존 사용자 구글 로그인:", user);
    }

    // 4. JWT 토큰 생성
    const token = jwt.sign(
      { userId: user._id, googleId: googleId },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    // 5. 토큰과 사용자 정보를 포함한 HTML 페이지로 리다이렉트
    const redirectHTML = `
    <!DOCTYPE html>
    <html lang="ko">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Ordo - 구글 로그인 성공</title>
        <link href="https://fonts.googleapis.com/css2?family=Cutive:wght@400&family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
        <style>
            @font-face {
                font-family: "Freesentation";
                src: url("/font/Freesentation.ttf") format("truetype");
            }

            :root {
                --copper-primary: #c96342;
                --copper-light: #e08b6f;
                --copper-dark: #a54a2e;
                --copper-bright: #f2a085;
                --copper-shadow: rgba(201, 99, 66, 0.15);
                --google-blue: #4285F4;
                --google-green: #34A853;
                --google-red: #EA4335;
                --google-yellow: #FBBC05;
            }

            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }

            body {
                font-family: 'Inter', 'Freesentation', -apple-system, BlinkMacSystemFont, sans-serif;
                background: linear-gradient(135deg, #f6f0eb 0%, #faf4f2 50%, #f0e6e1 100%);
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                overflow: hidden;
                position: relative;
            }

            /* 배경 장식 */
            .background-decoration {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                overflow: hidden;
                z-index: 0;
            }

            .decoration-element {
                position: absolute;
                border-radius: 50%;
                opacity: 0.1;
                animation: float 6s ease-in-out infinite;
            }

            .decoration-element:nth-child(1) {
                width: 200px;
                height: 200px;
                top: -100px;
                left: -100px;
                background: linear-gradient(135deg, var(--google-blue), var(--google-green));
                animation-delay: 0s;
            }

            .decoration-element:nth-child(2) {
                width: 150px;
                height: 150px;
                top: 60%;
                right: -75px;
                background: linear-gradient(135deg, var(--google-red), var(--google-yellow));
                animation-delay: 2s;
            }

            .decoration-element:nth-child(3) {
                width: 100px;
                height: 100px;
                bottom: -50px;
                left: 20%;
                background: linear-gradient(135deg, var(--copper-primary), var(--copper-light));
                animation-delay: 4s;
            }

            .decoration-element:nth-child(4) {
                width: 300px;
                height: 300px;
                top: 20%;
                right: -150px;
                background: linear-gradient(135deg, var(--google-blue), var(--google-green));
                opacity: 0.05;
                animation-delay: 1s;
            }

            @keyframes float {
                0%, 100% { transform: translateY(0px) rotate(0deg); }
                50% { transform: translateY(-20px) rotate(10deg); }
            }

            /* 메인 컨테이너 */
            .success-container {
                background: rgba(255, 255, 255, 0.95);
                backdrop-filter: blur(20px);
                border-radius: 24px;
                padding: 3rem 2.5rem;
                text-align: center;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1), 0 8px 32px rgba(201, 99, 66, 0.1);
                max-width: 480px;
                width: 90%;
                position: relative;
                z-index: 1;
                border: 1px solid rgba(255, 255, 255, 0.8);
                animation: slideUp 0.8s ease-out;
            }

            @keyframes slideUp {
                from {
                    opacity: 0;
                    transform: translateY(40px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }

            /* 브랜드 헤더 */
            .brand-header {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 16px;
                margin-bottom: 2rem;
                animation: fadeIn 1s ease-out 0.3s both;
            }

            .brand-logo {
                width: 48px;
                height: 48px;
                border-radius: 12px;
                transition: transform 0.3s ease;
            }

            .brand-logo:hover {
                transform: rotate(15deg) scale(1.1);
            }

            .brand-title {
                font-family: 'Cutive', serif;
                font-size: 2rem;
                color: var(--copper-primary);
                font-weight: 400;
                letter-spacing: -0.02em;
            }

            /* 성공 아이콘 */
            .success-icon {
                width: 100px;
                height: 100px;
                background: linear-gradient(135deg, var(--google-blue), var(--google-green));
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 0 auto 2rem;
                font-size: 3rem;
                animation: bounceIn 1s ease-out 0.5s both;
                position: relative;
                overflow: hidden;
            }

            .success-icon::before {
                content: '';
                position: absolute;
                top: -50%;
                left: -50%;
                width: 200%;
                height: 200%;
                background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.3), transparent);
                animation: shine 2s ease-in-out infinite;
            }

            @keyframes bounceIn {
                0% { transform: scale(0); opacity: 0; }
                60% { transform: scale(1.2); opacity: 1; }
                100% { transform: scale(1); }
            }

            @keyframes shine {
                0% { transform: translateX(-100%) translateY(-100%) rotate(45deg); }
                50% { transform: translateX(100%) translateY(100%) rotate(45deg); }
                100% { transform: translateX(-100%) translateY(-100%) rotate(45deg); }
            }

            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(20px); }
                to { opacity: 1; transform: translateY(0); }
            }

            /* 제목과 메시지 */
            .success-title {
                font-family: 'Cutive', serif;
                font-size: 2rem;
                color: var(--copper-primary);
                margin-bottom: 0.75rem;
                animation: fadeIn 1s ease-out 0.7s both;
            }

            .success-message {
                color: #666;
                font-size: 1.1rem;
                line-height: 1.6;
                margin-bottom: 2rem;
                font-family: 'Freesentation', sans-serif;
                animation: fadeIn 1s ease-out 0.9s both;
            }

            /* 사용자 정보 카드 */
            .user-info {
                background: linear-gradient(135deg, var(--google-blue), var(--google-green));
                color: white;
                padding: 1.25rem;
                border-radius: 16px;
                margin-bottom: 2rem;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 12px;
                font-weight: 600;
                font-size: 1rem;
                animation: fadeIn 1s ease-out 1.1s both;
                position: relative;
                overflow: hidden;
            }

            .user-info::before {
                content: '';
                position: absolute;
                top: 0;
                left: -100%;
                width: 100%;
                height: 100%;
                background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
                transition: left 0.5s ease;
            }

            .user-info:hover::before {
                left: 100%;
            }

            .user-avatar {
                width: 36px;
                height: 36px;
                border-radius: 50%;
                object-fit: cover;
                border: 2px solid rgba(255, 255, 255, 0.5);
                animation: avatarPulse 2s ease-in-out infinite;
            }

            @keyframes avatarPulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.05); }
            }

            /* 로딩 프로그레스 */
            .loading-progress {
                margin-bottom: 1.5rem;
                animation: fadeIn 1s ease-out 1.3s both;
            }

            .progress-bar {
                width: 100%;
                height: 8px;
                background: rgba(201, 99, 66, 0.1);
                border-radius: 4px;
                overflow: hidden;
                position: relative;
            }

            .progress-fill {
                height: 100%;
                background: linear-gradient(90deg, var(--copper-primary), var(--google-blue), var(--google-green), var(--copper-light));
                border-radius: 4px;
                animation: fillProgress 2s ease-out forwards;
                position: relative;
            }

            .progress-fill::after {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.5), transparent);
                animation: progressShine 1.5s ease-in-out infinite;
            }

            @keyframes fillProgress {
                from { width: 0%; }
                to { width: 100%; }
            }

            @keyframes progressShine {
                0% { transform: translateX(-100%); }
                100% { transform: translateX(100%); }
            }

            /* 리다이렉트 텍스트 */
            .redirect-text {
                color: #888;
                font-size: 0.95rem;
                font-family: 'Freesentation', sans-serif;
                animation: fadeIn 1s ease-out 1.5s both;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
            }

            .redirect-text::before {
                content: '⏱️';
                animation: pulse 1.5s ease-in-out infinite;
            }

            @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.5; }
            }

            /* 모바일 최적화 */
            @media (max-width: 480px) {
                .success-container {
                    padding: 2rem 1.5rem;
                    margin: 1rem;
                }

                .brand-title {
                    font-size: 1.5rem;
                }

                .success-title {
                    font-size: 1.5rem;
                }

                .success-message {
                    font-size: 1rem;
                }

                .success-icon {
                    width: 80px;
                    height: 80px;
                    font-size: 2.5rem;
                }

                .user-info {
                    flex-direction: column;
                    gap: 8px;
                }

                .user-avatar {
                    width: 32px;
                    height: 32px;
                }
            }
        </style>
    </head>
    <body>
        <div class="background-decoration">
            <div class="decoration-element"></div>
            <div class="decoration-element"></div>
            <div class="decoration-element"></div>
            <div class="decoration-element"></div>
        </div>

        <div class="success-container">
            <div class="brand-header">
                <img src="/Login/image-8.png" alt="Ordo Logo" class="brand-logo" />
                <h1 class="brand-title">Ordo</h1>
            </div>

            <div class="success-icon">
                🎉
            </div>

            <h2 class="success-title">구글 로그인 성공!</h2>
            <p class="success-message">
                환영합니다, <strong>${name}</strong>님!<br>
                <strong>체계적인 일상 관리</strong>를 시작해보세요.
            </p>

            <div class="user-info">
                ${
                  picture
                    ? `<img src="${picture}" alt="프로필" class="user-avatar" />`
                    : '<span style="font-size: 1.2rem;">🔗</span>'
                }
                <span>구글 계정으로 연결되었습니다</span>
            </div>

            <div class="loading-progress">
                <div class="progress-bar">
                    <div class="progress-fill"></div>
                </div>
            </div>

            <p class="redirect-text">메인 페이지로 이동 중입니다...</p>
        </div>

        <script>
            // 로컬 스토리지에 토큰과 사용자 정보 저장
            localStorage.setItem('token', '${token}');
            localStorage.setItem('user', JSON.stringify({
                id: '${user._id}',
                email: '${user.email}',
                name: '${user.name}',
                googleId: '${googleId}',
                isGoogleUser: true,
                profileImage: '${picture || ""}'
            }));

            // 2초 후 메인 페이지로 이동
            setTimeout(() => {
                window.location.href = '/Main/index.html';
            }, 2000);
        </script>
    </body>
    </html>`;

    res.send(redirectHTML);
  } catch (err) {
    console.error("🔴 구글 로그인 오류:", err.response?.data || err.message);

    // 오류 발생 시 로그인 페이지로 리다이렉트
    const errorHTML = `
    <!DOCTYPE html>
    <html lang="ko">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Ordo - 로그인 오류</title>
        <link href="https://fonts.googleapis.com/css2?family=Cutive:wght@400&family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
        <style>
            @font-face {
                font-family: "Freesentation";
                src: url("/font/Freesentation.ttf") format("truetype");
            }

            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }

            body {
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
                background: linear-gradient(135deg, #C96342 0%, #8B4513 50%, #654321 100%);
                color: white;
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                overflow: hidden;
                position: relative;
            }

            .error-container {
                background: rgba(255, 255, 255, 0.95);
                backdrop-filter: blur(20px);
                border-radius: 24px;
                padding: 3rem 2.5rem;
                text-align: center;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
                max-width: 420px;
                width: 90%;
                position: relative;
                z-index: 1;
                border: 1px solid rgba(255, 255, 255, 0.2);
            }

            .brand-header {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 12px;
                margin-bottom: 1.5rem;
            }

            .brand-logo {
                width: 40px;
                height: 40px;
                border-radius: 8px;
            }

            .brand-title {
                font-family: 'Cutive', serif;
                font-size: 1.8rem;
                color: #C96342;
                font-weight: 400;
            }

            .error-icon {
                width: 80px;
                height: 80px;
                background: linear-gradient(135deg, #ff6b6b, #ee5a24);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 0 auto 1.5rem;
                font-size: 2.5rem;
            }

            .error-title {
                font-family: 'Cutive', serif;
                font-size: 1.5rem;
                color: #C96342;
                margin-bottom: 0.5rem;
            }

            .error-message {
                color: #666;
                font-size: 1rem;
                line-height: 1.5;
                margin-bottom: 2rem;
                font-family: 'Freesentation', sans-serif;
            }

            .redirect-info {
                background: rgba(201, 99, 66, 0.1);
                color: #C96342;
                padding: 1rem;
                border-radius: 12px;
                margin-bottom: 1rem;
                font-family: 'Freesentation', sans-serif;
            }
        </style>
    </head>
    <body>
        <div class="error-container">
            <div class="brand-header">
                <img src="/Login/image-8.png" alt="Ordo Logo" class="brand-logo" />
                <h1 class="brand-title">Ordo</h1>
            </div>

            <div class="error-icon">
                ⚠️
            </div>

            <h2 class="error-title">로그인 오류</h2>
            <p class="error-message">
                구글 로그인 중 문제가 발생했습니다.<br>
                다시 시도해주세요.
            </p>

            <div class="redirect-info">
                잠시 후 로그인 페이지로 이동합니다...
            </div>
        </div>

        <script>
            setTimeout(() => {
                window.location.href = '/Login/email-login.html';
            }, 3000);
        </script>
    </body>
    </html>`;

    res.send(errorHTML);
  }
});

// 로그인 라우트
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // 사용자 찾기
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        status: "error",
        message: "이메일 또는 비밀번호가 잘못되었습니다.",
      });
    }

    // 비밀번호 확인
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        status: "error",
        message: "이메일 또는 비밀번호가 잘못되었습니다.",
      });
    }

    // 로그인 시간 업데이트
    user.lastLoginAt = new Date();
    await user.save();

    // JWT 토큰 생성
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, {
      expiresIn: "7d",
    });

    // 클라이언트가 기대하는 형식으로 응답
    res.json({
      status: "success",
      message: "로그인 성공",
      data: {
        token,
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          isKakaoUser: user.isKakaoUser || false,
          profileImage: user.profileImage,
        },
      },
    });
  } catch (error) {
    console.error("로그인 에러:", error);
    res.status(500).json({
      status: "error",
      message: "서버 오류가 발생했습니다.",
    });
  }
});

// 회원가입 라우트
router.post("/signup", async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // 이메일 중복 확인
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        status: "error",
        message: "이미 사용 중인 이메일입니다.",
      });
    }

    // 새 사용자 생성
    const user = new User({
      email,
      password,
      name,
    });

    await user.save();

    // JWT 토큰 생성
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, {
      expiresIn: "7d",
    });

    res.status(201).json({
      status: "success",
      message: "회원가입 성공",
      data: {
        token,
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          isKakaoUser: false,
        },
      },
    });
  } catch (error) {
    console.error("회원가입 에러:", error);
    res.status(500).json({
      status: "error",
      message: "서버 오류가 발생했습니다.",
    });
  }
});

exports.isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) return next();
  res.redirect("/login");
};

module.exports = router;

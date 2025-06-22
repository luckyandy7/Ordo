const express = require("express");
const router = express.Router();
const Event = require("../models/Event");
const jwt = require("jsonwebtoken");

// JWT 인증 미들웨어
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  console.log("[이벤트 라우트] 인증 요청 URL:", req.originalUrl);
  console.log(
    "[이벤트 라우트] Authorization 헤더:",
    authHeader ? "있음" : "없음"
  );
  console.log("[이벤트 라우트] 토큰:", token ? "있음" : "없음");

  if (!token) {
    return res.status(401).json({ message: "인증이 필요합니다." });
  }

  // 확실하게 새로운 시크릿 키 사용
  const SECRET_KEY = process.env.JWT_SECRET;

  console.log("[이벤트 라우트] 토큰 검증 시작:", {
    tokenLength: token.length,
    tokenPreview: token.substring(0, 50) + "...",
    secret: SECRET_KEY,
    timestamp: new Date().toISOString(),
  });

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) {
      console.log("[이벤트 라우트] JWT 검증 실패:", {
        error: err.message,
        name: err.name,
        tokenUsed: token.substring(0, 50) + "...",
        secret: SECRET_KEY,
        timestamp: new Date().toISOString(),
      });
      return res.status(403).json({ message: "유효하지 않은 토큰입니다." });
    }
    console.log("[이벤트 라우트] JWT 검증 성공, 사용자 정보:", user);
    req.user = user;
    req.userId = user.userId; // 서버 메인과 동일하게 설정
    next();
  });
};

// 일정 생성
router.post("/", authenticateToken, async (req, res) => {
  try {
    const { title, startDate, endDate, color, groupId, pattern } = req.body;
    console.log("[이벤트 API] 일정 생성 요청:", {
      userId: req.user.userId,
      title,
      startDate,
      endDate,
      color,
      groupId,
      pattern,
    });

    const event = new Event({
      userId: req.user.userId,
      title,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      color,
      groupId,
      pattern,
    });
    await event.save();

    console.log("[이벤트 API] 일정 생성 성공:", event);
    res.status(201).json(event);
  } catch (error) {
    console.error("[이벤트 API] 일정 생성 오류:", error);
    res.status(500).json({ message: "일정 생성 중 오류가 발생했습니다." });
  }
});

// 모든 일정 조회 (디버깅용)
router.get("/", authenticateToken, async (req, res) => {
  try {
    console.log(
      "[이벤트 API] 전체 일정 조회 요청, 사용자 ID:",
      req.user.userId
    );

    const events = await Event.find({ userId: req.user.userId }).sort(
      "startDate"
    );

    console.log("[이벤트 API] 조회된 일정 수:", events.length);
    console.log(
      "[이벤트 API] 조회된 일정들:",
      events.map((e) => ({
        id: e._id,
        title: e.title,
        startDate: e.startDate,
        endDate: e.endDate,
      }))
    );

    res.json(events);
  } catch (error) {
    console.error("[이벤트 API] 전체 일정 조회 오류:", error);
    res.status(500).json({ message: "일정 조회 중 오류가 발생했습니다." });
  }
});

// 특정 날짜의 일정 조회 (시간대 문제 완전 해결)
router.get("/date/:date", authenticateToken, async (req, res) => {
  try {
    console.log(
      "[이벤트 API] 특정 날짜 일정 조회 요청:",
      req.params.date,
      "사용자 ID:",
      req.user.userId
    );

    // ✅ 한국 시간대 기준으로 날짜 범위 설정 (UTC+9 고려)
    const inputDate = new Date(req.params.date);

    // 해당 날짜의 한국 시간 0시부터 23시 59분까지
    const koreaStartDate = new Date(
      inputDate.getFullYear(),
      inputDate.getMonth(),
      inputDate.getDate(),
      0,
      0,
      0,
      0
    );
    const koreaEndDate = new Date(
      inputDate.getFullYear(),
      inputDate.getMonth(),
      inputDate.getDate(),
      23,
      59,
      59,
      999
    );

    console.log("[이벤트 API] 조회 날짜 범위 (한국시간):", {
      koreaStartDate: koreaStartDate.toString(),
      koreaEndDate: koreaEndDate.toString(),
      koreaStartISO: koreaStartDate.toISOString(),
      koreaEndISO: koreaEndDate.toISOString(),
    });

    // MongoDB에서 해당 범위의 일정 조회 (ISO 형식으로 저장된 데이터와 비교)
    const events = await Event.find({
      userId: req.user.userId,
      startDate: {
        $gte: koreaStartDate,
        $lte: koreaEndDate,
      },
    }).sort("startDate");

    console.log("[이벤트 API] 해당 날짜 일정 수:", events.length);
    console.log(
      "[이벤트 API] 해당 날짜 일정들:",
      events.map((e) => ({
        id: e._id,
        title: e.title,
        startDate: e.startDate,
        endDate: e.endDate,
      }))
    );

    res.json(events);
  } catch (error) {
    console.error("[이벤트 API] 특정 날짜 일정 조회 오류:", error);
    res.status(500).json({ message: "일정 조회 중 오류가 발생했습니다." });
  }
});

// 일정 수정
router.put("/:id", authenticateToken, async (req, res) => {
  try {
    const { title, startDate, endDate, color, description } = req.body;
    console.log("[이벤트 API] 일정 수정 요청:", {
      id: req.params.id,
      userId: req.user.userId,
      title,
      startDate,
      endDate,
      color,
      description,
    });

    const event = await Event.findOneAndUpdate(
      {
        _id: req.params.id,
        userId: req.user.userId,
      },
      {
        title,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        color,
        description,
      },
      { new: true }
    );

    if (!event) {
      return res.status(404).json({ message: "일정을 찾을 수 없습니다." });
    }

    console.log("[이벤트 API] 일정 수정 성공:", event);
    res.json(event);
  } catch (error) {
    console.error("[이벤트 API] 일정 수정 오류:", error);
    res.status(500).json({ message: "일정 수정 중 오류가 발생했습니다." });
  }
});

// 일정 삭제
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const event = await Event.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.userId,
    });

    if (!event) {
      return res.status(404).json({ message: "일정을 찾을 수 없습니다." });
    }

    res.json({ message: "일정이 삭제되었습니다." });
  } catch (error) {
    console.error("일정 삭제 오류:", error);
    res.status(500).json({ message: "일정 삭제 중 오류가 발생했습니다." });
  }
});

module.exports = router;

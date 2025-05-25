const express = require("express");
const router = express.Router();
const Event = require("../models/Event");
const jwt = require("jsonwebtoken");

// JWT 인증 미들웨어
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "인증이 필요합니다." });
  }

  jwt.verify(
    token,
    process.env.JWT_SECRET || "your-secret-key",
    (err, user) => {
      if (err) {
        return res.status(403).json({ message: "유효하지 않은 토큰입니다." });
      }
      req.user = user;
      next();
    }
  );
};

// 일정 생성
router.post("/", authenticateToken, async (req, res) => {
  try {
    const { title, date, duration, color } = req.body;
    console.log("[이벤트 API] 일정 생성 요청:", {
      userId: req.user.userId,
      title,
      date,
      duration,
      color,
    });

    const event = new Event({
      userId: req.user.userId,
      title,
      date,
      duration,
      color,
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

    const events = await Event.find({ userId: req.user.userId }).sort("date");

    console.log("[이벤트 API] 조회된 일정 수:", events.length);
    console.log(
      "[이벤트 API] 조회된 일정들:",
      events.map((e) => ({
        id: e._id,
        title: e.title,
        date: e.date,
      }))
    );

    res.json(events);
  } catch (error) {
    console.error("[이벤트 API] 전체 일정 조회 오류:", error);
    res.status(500).json({ message: "일정 조회 중 오류가 발생했습니다." });
  }
});

// 특정 날짜의 일정 조회
router.get("/date/:date", authenticateToken, async (req, res) => {
  try {
    console.log(
      "[이벤트 API] 특정 날짜 일정 조회 요청:",
      req.params.date,
      "사용자 ID:",
      req.user.userId
    );

    const date = new Date(req.params.date);
    const startDate = new Date(date.setHours(0, 0, 0, 0));
    const endDate = new Date(date.setHours(23, 59, 59, 999));

    console.log("[이벤트 API] 조회 날짜 범위:", { startDate, endDate });

    const events = await Event.find({
      userId: req.user.userId,
      date: {
        $gte: startDate,
        $lte: endDate,
      },
    }).sort("date");

    console.log("[이벤트 API] 해당 날짜 일정 수:", events.length);
    console.log(
      "[이벤트 API] 해당 날짜 일정들:",
      events.map((e) => ({
        id: e._id,
        title: e.title,
        date: e.date,
      }))
    );

    res.json(events);
  } catch (error) {
    console.error("[이벤트 API] 특정 날짜 일정 조회 오류:", error);
    res.status(500).json({ message: "일정 조회 중 오류가 발생했습니다." });
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

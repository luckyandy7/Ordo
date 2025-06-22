// 일정 최적화 엔드포인트
app.post("/api/ordo/schedule/:date", async (req, res) => {
  try {
    const { date } = req.params;
    const { events } = req.body;

    console.log(`📅 ${date} 날짜의 스케줄 최적화 요청 받음`);
    console.log(`📝 스케줄 항목 수: ${events?.length || 0}`);

    if (!events || events.length === 0) {
      return res.json({
        success: true,
        message:
          "오늘은 여유로운 하루네요. ✨ 새로운 시작을 위한 완벽한 날입니다! 오늘도 좋은 하루 되세요 😊",
        type: "optimize",
      });
    }

    const result = await optimizeSchedule(events, "optimize");
    res.json(result);
  } catch (error) {
    console.error("스케줄 최적화 오류:", error);
    res.status(500).json({
      success: false,
      error: "스케줄 최적화 중 오류가 발생했습니다",
      fallback:
        "체계적으로 계획하셨네요. 중요한 일정부터 처리하시고, 적절한 휴식도 잊지 마세요. 오늘도 좋은 하루 되세요 😊",
    });
  }
});

// 🆕 일정 추천 엔드포인트
app.post("/api/ordo/recommend/:date", async (req, res) => {
  try {
    const { date } = req.params;
    const { events } = req.body;

    console.log(`🎯 ${date} 날짜의 일정 추천 요청 받음`);
    console.log(`📝 분석할 일정 수: ${events?.length || 0}`);

    if (!events || events.length === 0) {
      return res.json({
        success: true,
        type: "recommend",
        data: {
          message: "아직 일정이 없네요. ✨ 새로운 계획을 세워보세요!",
          recommendations: [],
          summary: "호라이가 더 나은 일정 계획을 도와드릴게요 🌟",
        },
      });
    }

    const result = await optimizeSchedule(events, "recommend");
    res.json(result);
  } catch (error) {
    console.error("일정 추천 오류:", error);
    res.status(500).json({
      success: false,
      error: "일정 추천 중 오류가 발생했습니다",
      type: "recommend",
      fallback: {
        message: "일정 분석에 시간이 걸리고 있어요. 잠시만 기다려주세요 ✨",
        recommendations: events.map((item) => ({
          original: {
            title: item.title,
            time: `${item.start_time}-${item.end_time}`,
            reason: "분석 준비 중",
          },
          suggested: {
            title: item.title,
            start_time: item.start_time,
            end_time: item.end_time,
            reason: "최적화 중입니다",
          },
        })),
        summary:
          "호라이가 더 나은 계획을 세우고 있어요 🌟 오늘도 좋은 하루 되세요 😊",
      },
    });
  }
});

// 🆕 추천 일정 적용 엔드포인트
app.post("/api/ordo/apply-recommendations", async (req, res) => {
  try {
    const { userId, date, recommendations } = req.body;

    console.log(`✅ ${date} 날짜의 추천 일정 적용 요청`);
    console.log(`👤 사용자 ID: ${userId}`);
    console.log(`📝 적용할 추천 수: ${recommendations?.length || 0}`);

    if (!userId || !date || !recommendations || recommendations.length === 0) {
      return res.status(400).json({
        success: false,
        error: "필수 정보가 누락되었습니다",
      });
    }

    // 기존 해당 날짜 일정 삭제 (선택적)
    // await Event.deleteMany({
    //   userId: new mongoose.Types.ObjectId(userId),
    //   startDate: {
    //     $gte: new Date(date + 'T00:00:00.000Z'),
    //     $lt: new Date(date + 'T23:59:59.999Z')
    //   }
    // });

    // 새 추천 일정들을 데이터베이스에 저장
    const createdEvents = [];

    for (const rec of recommendations) {
      const suggested = rec.suggested;

      // 시간 변환 (HH:MM -> Date)
      const [startHour, startMin] = suggested.start_time.split(":");
      const [endHour, endMin] = suggested.end_time.split(":");

      const startDate = new Date(date);
      startDate.setHours(parseInt(startHour), parseInt(startMin), 0, 0);

      const endDate = new Date(date);
      endDate.setHours(parseInt(endHour), parseInt(endMin), 0, 0);

      // 다음날로 넘어가는 경우 처리
      if (endDate <= startDate) {
        endDate.setDate(endDate.getDate() + 1);
      }

      const eventData = {
        userId: new mongoose.Types.ObjectId(userId),
        title: suggested.title,
        startDate: startDate,
        endDate: endDate,
        color: "#E8F4FD", // 추천 일정은 파란색으로
        description: `호라이 추천: ${suggested.reason}`,
        isRecommended: true, // 추천 일정 플래그
      };

      const newEvent = new Event(eventData);
      const savedEvent = await newEvent.save();
      createdEvents.push(savedEvent);

      console.log(
        `✅ 추천 일정 생성: ${suggested.title} (${suggested.start_time}-${suggested.end_time})`
      );
    }

    res.json({
      success: true,
      message: `🎉 ${recommendations.length}개의 추천 일정이 성공적으로 적용되었습니다!`,
      applied_count: createdEvents.length,
      events: createdEvents.map((event) => ({
        id: event._id,
        title: event.title,
        startDate: event.startDate,
        endDate: event.endDate,
        color: event.color,
        description: event.description,
      })),
    });
  } catch (error) {
    console.error("추천 일정 적용 오류:", error);
    res.status(500).json({
      success: false,
      error: "추천 일정 적용 중 오류가 발생했습니다",
      details: error.message,
    });
  }
});

// Daily 한마디 엔드포인트
app.post("/api/ordo/daily", async (req, res) => {
  try {
    const { events, date } = req.body;

    console.log(`💭 ${date} Daily 한마디 생성 요청`);
    console.log(`📊 일정 수: ${events?.length || 0}개`);

    const result = await optimizeSchedule(events || [], "daily");
    res.json(result);
  } catch (error) {
    console.error("Daily 한마디 오류:", error);
    res.status(500).json({
      success: false,
      error: "Daily 한마디 생성 중 오류가 발생했습니다",
      fallback:
        "오늘도 의미 있는 하루가 되길 바라요. ✨ 호라이가 언제나 함께 할게요. 오늘도 좋은 하루 되세요 ��",
    });
  }
});

const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const Workspace = require("../models/Workspace");
const Task = require("../models/Task");
const SharedEvent = require("../models/SharedEvent");
const SharedFile = require("../models/SharedFile");
const User = require("../models/User");
const multer = require("multer");
const path = require("path");

// JWT 인증 미들웨어
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  console.log("[Collaboration Auth] URL:", req.url);
  console.log("[Collaboration Auth] Token:", token ? "Present" : "Missing");

  if (!token) {
    return res.status(401).json({ error: "로그인이 필요합니다." });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      console.log("[Collaboration Auth] JWT Error:", err.message);
      return res.status(403).json({ error: "유효하지 않은 토큰입니다." });
    }
    console.log("[Collaboration Auth] User:", user);
    req.user = user;
    req.userId = user.userId;
    console.log("[Collaboration Auth] Set userId:", req.userId);
    next();
  });
};

// 파일 업로드 설정
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/collaboration/");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB 제한
  },
});

// 임시: 손상된 워크스페이스 수정
router.post("/fix-workspaces", authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;

    // owner가 null인 워크스페이스들 찾기
    const brokenWorkspaces = await Workspace.find({ owner: null });
    console.log("[수정] 손상된 워크스페이스 개수:", brokenWorkspaces.length);

    for (const workspace of brokenWorkspaces) {
      // 첫 번째 admin 멤버를 owner로 설정
      const adminMember = workspace.members.find((m) => m.role === "admin");
      if (adminMember && adminMember.user) {
        workspace.owner = adminMember.user;
        await workspace.save();
        console.log(
          `[수정] 워크스페이스 ${workspace.name} owner 설정: ${adminMember.user}`
        );
      }
    }

    res.json({
      message: "워크스페이스 수정 완료",
      fixed: brokenWorkspaces.length,
    });
  } catch (error) {
    console.error("워크스페이스 수정 오류:", error);
    res.status(500).json({ error: "서버 오류가 발생했습니다." });
  }
});

// 워크스페이스 목록 조회
router.get("/workspaces", authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;

    const workspaces = await Workspace.find({
      $or: [{ owner: userId }, { "members.user": userId }],
    }).populate("owner", "name email");

    res.json(workspaces);
  } catch (error) {
    console.error("워크스페이스 조회 오류:", error);
    res.status(500).json({ error: "서버 오류가 발생했습니다." });
  }
});

// 새 워크스페이스 생성
router.post("/workspaces", authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;

    // 사용자 정보 조회
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "사용자를 찾을 수 없습니다." });
    }

    const { name, description, type, avatar } = req.body;

    const workspace = new Workspace({
      name,
      description,
      type: type || "project",
      avatar: avatar || "🚀",
      owner: userId,
      members: [
        {
          user: userId,
          email: user.email,
          name: user.name,
          role: "admin",
          status: "online",
        },
      ],
    });

    await workspace.save();
    await workspace.populate("owner", "username email");

    res.status(201).json(workspace);
  } catch (error) {
    console.error("워크스페이스 생성 오류:", error);
    res.status(500).json({ error: "서버 오류가 발생했습니다." });
  }
});

// 워크스페이스 상세 조회
router.get("/workspaces/:id", authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;

    const workspace = await Workspace.findById(req.params.id)
      .populate("owner", "name email")
      .populate("members.user", "name email");

    if (!workspace) {
      return res
        .status(404)
        .json({ error: "워크스페이스를 찾을 수 없습니다." });
    }

    // 접근 권한 확인 (owner가 null일 수도 있으므로 안전하게 체크)
    const isOwner =
      workspace.owner &&
      workspace.owner._id &&
      workspace.owner._id.toString() === userId;

    const isMember = workspace.members.some(
      (m) => m.user && m.user._id && m.user._id.toString() === userId
    );

    const hasAccess = isOwner || isMember;

    if (!hasAccess) {
      return res.status(403).json({ error: "접근 권한이 없습니다." });
    }

    // owner가 null인 경우 warning 로그
    if (!workspace.owner) {
      console.warn(
        `[워크스페이스 조회] owner가 null인 워크스페이스: ${workspace._id}`
      );
    }

    res.json(workspace);
  } catch (error) {
    console.error("워크스페이스 조회 오류:", error);
    res.status(500).json({ error: "서버 오류가 발생했습니다." });
  }
});

// 멤버 초대
router.post("/workspaces/:id/invite", authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;

    const { email, role } = req.body;
    const workspace = await Workspace.findById(req.params.id);

    if (!workspace) {
      return res
        .status(404)
        .json({ error: "워크스페이스를 찾을 수 없습니다." });
    }

    // 권한 확인 (관리자만 초대 가능)
    const isAdmin =
      workspace.owner.toString() === userId ||
      workspace.members.some(
        (m) => m.user && m.user.toString() === userId && m.role === "admin"
      );

    if (!isAdmin) {
      return res.status(403).json({ error: "초대 권한이 없습니다." });
    }

    // 이미 멤버인지 확인
    const existingMember = workspace.members.find((m) => m.email === email);
    if (existingMember) {
      return res.status(400).json({ error: "이미 워크스페이스 멤버입니다." });
    }

    // 사용자 찾기
    const invitedUser = await User.findOne({ email });

    workspace.members.push({
      user: invitedUser ? invitedUser._id : null,
      email,
      name: invitedUser ? invitedUser.name : email.split("@")[0],
      role: role || "member",
      status: "offline",
    });

    await workspace.save();

    res.json({ message: "멤버가 성공적으로 초대되었습니다." });
  } catch (error) {
    console.error("멤버 초대 오류:", error);
    res.status(500).json({ error: "서버 오류가 발생했습니다." });
  }
});

// 작업 목록 조회
router.get("/workspaces/:id/tasks", authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;

    const tasks = await Task.find({ workspace: req.params.id })
      .populate("assignee.user", "name email")
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    // 클라이언트로 보낼 때 status 역매핑
    const statusReverseMapping = {
      todo: "todo",
      "in-progress": "doing",
      completed: "done",
    };

    const mappedTasks = tasks.map((task) => ({
      ...task.toObject(),
      status: statusReverseMapping[task.status] || task.status,
      assigneeName: task.assignee?.user?.name || null,
      assigneeEmail: task.assignee?.user?.email || null,
    }));

    res.json({ tasks: mappedTasks });
  } catch (error) {
    console.error("작업 조회 오류:", error);
    res.status(500).json({ error: "서버 오류가 발생했습니다." });
  }
});

// 새 작업 생성
router.post("/workspaces/:id/tasks", authenticateToken, async (req, res) => {
  try {
    console.log("[작업 생성] API 호출됨 - 워크스페이스 ID:", req.params.id);
    console.log("[작업 생성] Raw body:", req.body);

    const userId = req.userId;
    const { title, description, status, priority, assignedTo, dueDate } =
      req.body;

    console.log("[작업 생성] 요청 데이터:", {
      userId,
      title,
      description,
      status,
      priority,
      assignedTo,
      dueDate,
    });

    // 입력 검증
    if (!title) {
      return res.status(400).json({ error: "작업 제목은 필수입니다." });
    }

    // 워크스페이스 접근 권한 확인
    const workspace = await Workspace.findOne({
      _id: req.params.id,
      $or: [{ owner: userId }, { "members.user": userId }],
    });

    if (!workspace) {
      return res
        .status(404)
        .json({ error: "워크스페이스를 찾을 수 없습니다." });
    }

    // 프론트엔드와 모델의 status 값 매핑
    const statusMapping = {
      todo: "todo",
      doing: "in-progress",
      done: "completed",
    };

    const task = new Task({
      title,
      description,
      status: statusMapping[status] || "todo",
      priority: priority || "medium",
      workspace: req.params.id,
      createdBy: userId,
      assignee: assignedTo ? { user: assignedTo } : null,
      dueDate: dueDate ? new Date(dueDate) : null,
    });

    await task.save();
    console.log("[작업 생성] 성공:", task._id);

    // populate 해서 반환
    const populatedTask = await Task.findById(task._id)
      .populate("assignee.user", "name email")
      .populate("createdBy", "name email");

    // 클라이언트로 보낼 때 status 역매핑
    const statusReverseMapping = {
      todo: "todo",
      "in-progress": "doing",
      completed: "done",
    };

    const mappedTask = {
      ...populatedTask.toObject(),
      status:
        statusReverseMapping[populatedTask.status] || populatedTask.status,
      assigneeName: populatedTask.assignee?.user?.name || null,
      assigneeEmail: populatedTask.assignee?.user?.email || null,
    };

    res.status(201).json(mappedTask);
  } catch (error) {
    console.error("작업 생성 오류:", error);
    res.status(500).json({ error: "서버 오류가 발생했습니다." });
  }
});

// 작업 상태 업데이트
router.patch("/tasks/:id/status", authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const { status } = req.body;

    console.log("[작업 상태 업데이트] 요청:", {
      taskId: req.params.id,
      status,
      userId,
    });

    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ error: "작업을 찾을 수 없습니다." });
    }

    // 워크스페이스 접근 권한 확인
    const workspace = await Workspace.findOne({
      _id: task.workspace,
      $or: [{ owner: userId }, { "members.user": userId }],
    });

    if (!workspace) {
      return res.status(403).json({ error: "접근 권한이 없습니다." });
    }

    // 프론트엔드와 모델의 status 값 매핑
    const statusMapping = {
      todo: "todo",
      doing: "in-progress",
      done: "completed",
    };

    task.status = statusMapping[status] || status;
    await task.save();

    // populate 해서 반환
    const populatedTask = await Task.findById(task._id)
      .populate("assignee.user", "name email")
      .populate("createdBy", "name email");

    // 클라이언트로 보낼 때 status 역매핑
    const statusReverseMapping = {
      todo: "todo",
      "in-progress": "doing",
      completed: "done",
    };

    const mappedTask = {
      ...populatedTask.toObject(),
      status:
        statusReverseMapping[populatedTask.status] || populatedTask.status,
      assigneeName: populatedTask.assignee?.user?.name || null,
      assigneeEmail: populatedTask.assignee?.user?.email || null,
    };

    console.log("[작업 상태 업데이트] 성공:", task._id);
    res.json(mappedTask);
  } catch (error) {
    console.error("작업 상태 업데이트 오류:", error);
    res.status(500).json({ error: "서버 오류가 발생했습니다." });
  }
});

// 작업 수정
router.put("/tasks/:id", authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const { title, description, status, priority, assignedTo, dueDate } =
      req.body;

    console.log("[작업 수정] 요청:", {
      taskId: req.params.id,
      title,
      description,
      status,
      priority,
      assignedTo,
      dueDate,
      userId,
    });

    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ error: "작업을 찾을 수 없습니다." });
    }

    // 워크스페이스 접근 권한 확인
    const workspace = await Workspace.findOne({
      _id: task.workspace,
      $or: [{ owner: userId }, { "members.user": userId }],
    });

    if (!workspace) {
      return res.status(403).json({ error: "접근 권한이 없습니다." });
    }

    // 프론트엔드와 모델의 status 값 매핑
    const statusMapping = {
      todo: "todo",
      doing: "in-progress",
      done: "completed",
    };

    // 작업 업데이트
    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (status !== undefined) task.status = statusMapping[status] || status;
    if (priority !== undefined) task.priority = priority;
    if (assignedTo !== undefined) {
      task.assignee = assignedTo ? { user: assignedTo } : null;
    }
    if (dueDate !== undefined) {
      task.dueDate = dueDate ? new Date(dueDate) : null;
    }

    await task.save();

    // populate 해서 반환
    const populatedTask = await Task.findById(task._id)
      .populate("assignee.user", "name email")
      .populate("createdBy", "name email");

    // 클라이언트로 보낼 때 status 역매핑
    const statusReverseMapping = {
      todo: "todo",
      "in-progress": "doing",
      completed: "done",
    };

    const mappedTask = {
      ...populatedTask.toObject(),
      status:
        statusReverseMapping[populatedTask.status] || populatedTask.status,
      assigneeName: populatedTask.assignee?.user?.name || null,
      assigneeEmail: populatedTask.assignee?.user?.email || null,
    };

    console.log("[작업 수정] 성공:", task._id);
    res.json(mappedTask);
  } catch (error) {
    console.error("작업 수정 오류:", error);
    res.status(500).json({ error: "서버 오류가 발생했습니다." });
  }
});

// 작업 삭제
router.delete("/tasks/:id", authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;

    console.log("[작업 삭제] 요청:", { taskId: req.params.id, userId });

    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ error: "작업을 찾을 수 없습니다." });
    }

    // 워크스페이스 접근 권한 확인
    const workspace = await Workspace.findOne({
      _id: task.workspace,
      $or: [{ owner: userId }, { "members.user": userId }],
    });

    if (!workspace) {
      return res.status(403).json({ error: "접근 권한이 없습니다." });
    }

    await Task.findByIdAndDelete(req.params.id);

    console.log("[작업 삭제] 성공:", req.params.id);
    res.json({ message: "작업이 삭제되었습니다." });
  } catch (error) {
    console.error("작업 삭제 오류:", error);
    res.status(500).json({ error: "서버 오류가 발생했습니다." });
  }
});

// 공유 일정 목록 조회
router.get("/workspaces/:id/events", authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;

    const events = await SharedEvent.find({ workspace: req.params.id })
      .populate("participants.user", "name email")
      .populate("createdBy", "name email")
      .sort({ startDate: 1 });

    res.json(events);
  } catch (error) {
    console.error("일정 조회 오류:", error);
    res.status(500).json({ error: "서버 오류가 발생했습니다." });
  }
});

// 새 공유 일정 생성
router.post("/workspaces/:id/events", authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    // 프론트엔드에서 start/end 또는 startDate/endDate로 보낼 수 있음
    const { title, description, start, end, startDate, endDate, status } =
      req.body;

    console.log("[이벤트 생성] 요청 데이터:", {
      title,
      description,
      start,
      end,
      startDate,
      endDate,
      status,
    });

    // 날짜 필드 우선순위: startDate/endDate > start/end
    const finalStartDate = startDate || start;
    const finalEndDate = endDate || end;

    // 입력 검증
    if (!title || !finalStartDate || !finalEndDate) {
      return res.status(400).json({
        error: "제목, 시작일, 종료일은 필수입니다.",
      });
    }

    // 워크스페이스 접근 권한 확인
    const workspace = await Workspace.findOne({
      _id: req.params.id,
      $or: [{ owner: userId }, { "members.user": userId }],
    });

    if (!workspace) {
      return res
        .status(404)
        .json({ error: "워크스페이스를 찾을 수 없습니다." });
    }

    const parsedStartDate = new Date(finalStartDate);
    const parsedEndDate = new Date(finalEndDate);

    console.log("[이벤트 생성] 변환된 날짜:", {
      parsedStartDate,
      parsedEndDate,
      originalStart: finalStartDate,
      originalEnd: finalEndDate,
    });

    // 날짜 유효성 검사
    if (isNaN(parsedStartDate.getTime()) || isNaN(parsedEndDate.getTime())) {
      return res.status(400).json({
        error: "유효하지 않은 날짜 형식입니다.",
      });
    }

    const event = new SharedEvent({
      title,
      description,
      startDate: parsedStartDate,
      endDate: parsedEndDate,
      workspace: req.params.id,
      createdBy: userId,
    });

    await event.save();
    console.log("[이벤트 생성] 성공:", event._id);
    res.status(201).json(event);
  } catch (error) {
    console.error("이벤트 생성 오류:", error);
    res.status(500).json({ error: "서버 오류가 발생했습니다." });
  }
});

// 파일 업로드
router.post(
  "/workspaces/:id/files",
  authenticateToken,
  upload.single("file"),
  async (req, res) => {
    try {
      const userId = req.userId;
      console.log("[파일 업로드] 시작:", {
        userId,
        workspaceId: req.params.id,
        fileName: req.file?.originalname,
        fileSize: req.file?.size,
      });

      if (!userId) {
        console.log("[파일 업로드] 인증 실패: userId가 없음");
        return res.status(401).json({ error: "인증이 필요합니다." });
      }

      if (!req.file) {
        console.log("[파일 업로드] 파일이 없음");
        return res.status(400).json({ error: "파일이 없습니다." });
      }

      // 워크스페이스 접근 권한 확인
      const workspace = await Workspace.findOne({
        _id: req.params.id,
        $or: [{ owner: userId }, { "members.user": userId }],
      });

      if (!workspace) {
        console.log(
          "[파일 업로드] 워크스페이스를 찾을 수 없음:",
          req.params.id
        );
        return res
          .status(404)
          .json({ error: "워크스페이스를 찾을 수 없습니다." });
      }

      console.log("[파일 업로드] SharedFile 생성 데이터:", {
        originalName: req.file.originalname,
        fileName: req.file.filename,
        workspace: req.params.id,
        uploadedBy: userId,
        userIdType: typeof userId,
        userIdValue: userId,
      });

      const file = new SharedFile({
        originalName: req.file.originalname,
        fileName: req.file.filename,
        fileId: req.file.filename,
        mimeType: req.file.mimetype,
        size: req.file.size,
        workspace: req.params.id,
        uploadedBy: userId,
        url: `/uploads/collaboration/${req.file.filename}`,
      });

      console.log("[파일 업로드] 저장 전 파일 객체:", file.toObject());
      await file.save();
      console.log("[파일 업로드] 성공:", file._id);
      res.status(201).json(file);
    } catch (error) {
      console.error("파일 업로드 오류:", error);
      res.status(500).json({ error: "서버 오류가 발생했습니다." });
    }
  }
);

// 파일 목록 조회
router.get("/workspaces/:id/files", authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;

    const files = await SharedFile.find({ workspace: req.params.id })
      .populate("uploadedBy", "name email")
      .sort({ createdAt: -1 });

    res.json(files);
  } catch (error) {
    console.error("파일 조회 오류:", error);
    res.status(500).json({ error: "서버 오류가 발생했습니다." });
  }
});

// 파일 다운로드
router.get("/files/:id/download", authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;

    const file = await SharedFile.findById(req.params.id);
    if (!file) {
      return res.status(404).json({ error: "파일을 찾을 수 없습니다." });
    }

    // 다운로드 카운트 증가
    file.downloadCount += 1;
    await file.save();

    const filePath = path.join(
      __dirname,
      "../uploads/collaboration/",
      file.fileName
    );
    res.download(filePath, file.originalName);
  } catch (error) {
    console.error("파일 다운로드 오류:", error);
    res.status(500).json({ error: "서버 오류가 발생했습니다." });
  }
});

// 작업 수정
router.put(
  "/workspaces/:workspaceId/tasks/:taskId",
  authenticateToken,
  async (req, res) => {
    try {
      const userId = req.userId;
      const { workspaceId, taskId } = req.params;
      const updateData = req.body;

      // 워크스페이스 접근 권한 확인
      const workspace = await Workspace.findOne({
        _id: workspaceId,
        $or: [{ owner: userId }, { "members.user": userId }],
      });

      if (!workspace) {
        return res
          .status(404)
          .json({ error: "워크스페이스를 찾을 수 없습니다." });
      }

      // 작업 수정
      const task = await Task.findOneAndUpdate(
        { _id: taskId, workspace: workspaceId },
        updateData,
        { new: true }
      ).populate("assignedTo", "name email");

      if (!task) {
        return res.status(404).json({ error: "작업을 찾을 수 없습니다." });
      }

      res.json(task);
    } catch (error) {
      console.error("작업 수정 오류:", error);
      res.status(500).json({ error: "서버 오류가 발생했습니다." });
    }
  }
);

// 작업 삭제
router.delete(
  "/workspaces/:workspaceId/tasks/:taskId",
  authenticateToken,
  async (req, res) => {
    try {
      const userId = req.userId;
      const { workspaceId, taskId } = req.params;

      // 워크스페이스 접근 권한 확인
      const workspace = await Workspace.findOne({
        _id: workspaceId,
        $or: [{ owner: userId }, { "members.user": userId }],
      });

      if (!workspace) {
        return res
          .status(404)
          .json({ error: "워크스페이스를 찾을 수 없습니다." });
      }

      // 작업 삭제
      const task = await Task.findOneAndDelete({
        _id: taskId,
        workspace: workspaceId,
      });

      if (!task) {
        return res.status(404).json({ error: "작업을 찾을 수 없습니다." });
      }

      res.json({ message: "작업이 삭제되었습니다." });
    } catch (error) {
      console.error("작업 삭제 오류:", error);
      res.status(500).json({ error: "서버 오류가 발생했습니다." });
    }
  }
);

// 일정 수정
router.put(
  "/workspaces/:workspaceId/events/:eventId",
  authenticateToken,
  async (req, res) => {
    try {
      const userId = req.userId;
      const { workspaceId, eventId } = req.params;
      const updateData = req.body;

      // 워크스페이스 접근 권한 확인
      const workspace = await Workspace.findOne({
        _id: workspaceId,
        $or: [{ owner: userId }, { "members.user": userId }],
      });

      if (!workspace) {
        return res
          .status(404)
          .json({ error: "워크스페이스를 찾을 수 없습니다." });
      }

      // 일정 수정
      const event = await SharedEvent.findOneAndUpdate(
        { _id: eventId, workspace: workspaceId },
        updateData,
        { new: true }
      )
        .populate("createdBy", "name email")
        .populate("participants", "name email");

      if (!event) {
        return res.status(404).json({ error: "일정을 찾을 수 없습니다." });
      }

      res.json(event);
    } catch (error) {
      console.error("일정 수정 오류:", error);
      res.status(500).json({ error: "서버 오류가 발생했습니다." });
    }
  }
);

// 일정 삭제
router.delete(
  "/workspaces/:workspaceId/events/:eventId",
  authenticateToken,
  async (req, res) => {
    try {
      const userId = req.userId;
      const { workspaceId, eventId } = req.params;

      // 워크스페이스 접근 권한 확인
      const workspace = await Workspace.findOne({
        _id: workspaceId,
        $or: [{ owner: userId }, { "members.user": userId }],
      });

      if (!workspace) {
        return res
          .status(404)
          .json({ error: "워크스페이스를 찾을 수 없습니다." });
      }

      // 일정 삭제
      const event = await SharedEvent.findOneAndDelete({
        _id: eventId,
        workspace: workspaceId,
      });

      if (!event) {
        return res.status(404).json({ error: "일정을 찾을 수 없습니다." });
      }

      res.json({ message: "일정이 삭제되었습니다." });
    } catch (error) {
      console.error("일정 삭제 오류:", error);
      res.status(500).json({ error: "서버 오류가 발생했습니다." });
    }
  }
);

// 파일 삭제
router.delete(
  "/workspaces/:workspaceId/files/:fileId",
  authenticateToken,
  async (req, res) => {
    try {
      const userId = req.userId;
      const { workspaceId, fileId } = req.params;
      const fs = require("fs");

      // 워크스페이스 접근 권한 확인
      const workspace = await Workspace.findOne({
        _id: workspaceId,
        $or: [{ owner: userId }, { "members.user": userId }],
      });

      if (!workspace) {
        return res
          .status(404)
          .json({ error: "워크스페이스를 찾을 수 없습니다." });
      }

      // 파일 정보 조회
      const file = await SharedFile.findOne({
        _id: fileId,
        workspace: workspaceId,
      });

      if (!file) {
        return res.status(404).json({ error: "파일을 찾을 수 없습니다." });
      }

      // 물리적 파일 삭제
      const filePath = path.join(__dirname, "..", file.filePath);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      // DB에서 파일 정보 삭제
      await SharedFile.findByIdAndDelete(fileId);

      res.json({ message: "파일이 삭제되었습니다." });
    } catch (error) {
      console.error("파일 삭제 오류:", error);
      res.status(500).json({ error: "서버 오류가 발생했습니다." });
    }
  }
);

// 받은 초대 목록 조회
router.get("/invitations/received", authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;

    // 임시로 빈 배열 반환 (실제 구현에서는 Invitation 모델이 필요)
    res.json({
      success: true,
      data: {
        invitations: [],
      },
    });
  } catch (error) {
    console.error("초대 목록 조회 오류:", error);
    res.status(500).json({
      success: false,
      error: "서버 오류가 발생했습니다.",
    });
  }
});

// 사용자 검색
router.get("/users/search", authenticateToken, async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim().length === 0) {
      return res.json({ users: [] });
    }

    const users = await User.find({
      $or: [
        { name: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } },
      ],
    })
      .select("name email")
      .limit(10);

    res.json({ users });
  } catch (error) {
    console.error("사용자 검색 오류:", error);
    res.status(500).json({ error: "서버 오류가 발생했습니다." });
  }
});

// 워크스페이스 초대장 보내기
router.post(
  "/workspaces/:id/invitations",
  authenticateToken,
  async (req, res) => {
    try {
      const userId = req.userId;
      const { email, role = "member", message } = req.body;
      const workspaceId = req.params.id;

      console.log("[멤버 초대] 요청:", { userId, email, role, workspaceId });

      // 워크스페이스 확인 및 권한 검사
      const workspace = await Workspace.findById(workspaceId);
      if (!workspace) {
        return res
          .status(404)
          .json({ error: "워크스페이스를 찾을 수 없습니다." });
      }

      console.log("[멤버 초대] 워크스페이스 정보:", {
        id: workspace._id,
        owner: workspace.owner,
        members: workspace.members.length,
      });

      // 입력값 검증 추가
      if (!email || email.trim() === "") {
        console.log("[멤버 초대] 이메일이 없음");
        return res.status(400).json({ error: "이메일은 필수입니다." });
      }

      const isOwner = workspace.owner && workspace.owner.toString() === userId;
      const isAdmin = workspace.members.some(
        (m) => m.user && m.user.toString() === userId && m.role === "admin"
      );

      console.log("[멤버 초대] 권한 확인:", { isOwner, isAdmin, userId });

      if (!isOwner && !isAdmin) {
        console.log("[멤버 초대] 권한 없음");
        return res.status(403).json({ error: "초대 권한이 없습니다." });
      }

      // 이미 멤버인지 확인 (userId로 확인하는 부분 수정)
      console.log("[멤버 초대] 기존 멤버 확인 시작");
      const existingMember = workspace.members.find((m) => {
        const userMatch = m.user && m.user.toString() === userId;
        const emailMatch = m.email === email;
        console.log("[멤버 초대] 멤버 확인:", {
          memberEmail: m.email,
          targetEmail: email,
          emailMatch,
        });
        return emailMatch; // userId 확인 제거, 이메일만 확인
      });

      console.log("[멤버 초대] 기존 멤버 결과:", existingMember);

      if (existingMember) {
        console.log("[멤버 초대] 이미 멤버임");
        return res.status(400).json({ error: "이미 워크스페이스 멤버입니다." });
      }

      // 초대받을 사용자 찾기
      console.log("[멤버 초대] 사용자 검색:", email);
      const targetUser = await User.findOne({ email });
      console.log(
        "[멤버 초대] 사용자 검색 결과:",
        targetUser ? "찾음" : "없음"
      );

      // 멤버로 직접 추가
      if (targetUser) {
        console.log("[멤버 초대] 기존 사용자 추가");
        workspace.members.push({
          user: targetUser._id,
          email: targetUser.email,
          name: targetUser.name,
          role: role,
          status: "offline",
        });
      } else {
        console.log("[멤버 초대] 신규 사용자 추가");
        // 사용자가 존재하지 않는 경우 이메일만으로 추가
        workspace.members.push({
          user: null,
          email: email,
          name: email.split("@")[0],
          role: role,
          status: "offline",
        });
      }

      console.log("[멤버 초대] 워크스페이스 저장 시작");

      // owner 필드가 없는 경우 현재 사용자로 설정
      if (!workspace.owner) {
        console.log(
          "[멤버 초대] owner 필드가 없어서 현재 사용자로 설정:",
          userId
        );
        workspace.owner = userId;
      }

      console.log("[멤버 초대] 저장 전 워크스페이스 상태:", {
        id: workspace._id,
        owner: workspace.owner,
        membersCount: workspace.members.length,
      });

      await workspace.save();
      console.log("[멤버 초대] 성공:", email);
      res.json({ message: "멤버를 성공적으로 초대했습니다." });
    } catch (error) {
      console.error("초대 전송 오류:", error);
      res.status(500).json({ error: "서버 오류가 발생했습니다." });
    }
  }
);

// 워크스페이스 나가기
router.post("/workspaces/:id/leave", authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const workspaceId = req.params.id;

    console.log("[나가기] 요청:", { userId, workspaceId });

    // 워크스페이스 찾기
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return res
        .status(404)
        .json({ error: "워크스페이스를 찾을 수 없습니다." });
    }

    console.log("[나가기] 워크스페이스 정보:", {
      id: workspace._id,
      owner: workspace.owner,
      membersCount: workspace.members.length,
    });

    // 사용자가 멤버인지 확인
    const memberIndex = workspace.members.findIndex(
      (m) => m.user && m.user.toString() === userId
    );

    if (memberIndex === -1) {
      return res.status(404).json({ error: "워크스페이스 멤버가 아닙니다." });
    }

    // 워크스페이스 소유자인 경우 특별 처리
    const isOwner = workspace.owner && workspace.owner.toString() === userId;

    // 멤버 목록에서 제거
    workspace.members.splice(memberIndex, 1);

    // owner가 나가는 경우 또는 owner가 null인 경우 처리
    if (isOwner || !workspace.owner) {
      console.log(
        "[나가기] owner 교체 필요:",
        isOwner ? "소유자가 나가는 중" : "owner가 null"
      );

      // 남은 admin 멤버 중 첫 번째를 owner로 설정
      const remainingAdmins = workspace.members.filter(
        (m) => m.role === "admin" && m.user
      );

      if (remainingAdmins.length > 0) {
        workspace.owner = remainingAdmins[0].user;
        console.log("[나가기] 새 owner 설정 (admin):", remainingAdmins[0].user);
      } else {
        // admin이 없으면 일반 멤버 중 첫 번째를 admin으로 승격하고 owner로 설정
        const remainingMembers = workspace.members.filter((m) => m.user);

        if (remainingMembers.length > 0) {
          remainingMembers[0].role = "admin";
          workspace.owner = remainingMembers[0].user;
          console.log(
            "[나가기] 새 admin/owner 설정:",
            remainingMembers[0].user
          );
        } else {
          // 마지막 멤버가 나가는 경우 - 워크스페이스 삭제
          console.log("[나가기] 마지막 멤버가 나가는 중 - 워크스페이스 삭제");

          try {
            // 관련 데이터들도 함께 삭제
            await Task.deleteMany({ workspace: workspaceId });
            await SharedEvent.deleteMany({ workspace: workspaceId });
            await SharedFile.deleteMany({ workspace: workspaceId });
            await Workspace.findByIdAndDelete(workspaceId);

            console.log("[나가기] 워크스페이스 및 관련 데이터 삭제 완료");
            return res.json({
              message:
                "워크스페이스를 나갔습니다. 마지막 멤버였으므로 워크스페이스가 삭제되었습니다.",
              workspaceDeleted: true,
            });
          } catch (deleteError) {
            console.error("[나가기] 워크스페이스 삭제 중 오류:", deleteError);
            return res
              .status(500)
              .json({ error: "워크스페이스 삭제 중 오류가 발생했습니다." });
          }
        }
      }
    }

    console.log("[나가기] 저장 전 상태:", {
      owner: workspace.owner,
      membersCount: workspace.members.length,
    });

    await workspace.save();
    console.log("[나가기] 성공");

    res.json({ message: "워크스페이스를 나갔습니다." });
  } catch (error) {
    console.error("워크스페이스 나가기 오류:", error);
    res.status(500).json({ error: "서버 오류가 발생했습니다." });
  }
});

// 손상된 워크스페이스 수정 API (임시)
router.post("/fix-workspaces", authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    console.log("[수정] 워크스페이스 수정 시작, 사용자:", userId);

    // owner가 null인 워크스페이스 찾기
    const brokenWorkspaces = await Workspace.find({
      $or: [{ owner: null }, { owner: { $exists: false } }],
    });

    console.log("[수정] 손상된 워크스페이스 개수:", brokenWorkspaces.length);

    let fixedCount = 0;

    for (const workspace of brokenWorkspaces) {
      console.log(`[수정] 워크스페이스 ${workspace._id} 수정 중...`);

      // 멤버 중에서 admin 찾기
      const adminMember = workspace.members.find(
        (m) => m.role === "admin" && m.user
      );

      if (adminMember) {
        workspace.owner = adminMember.user;
        console.log(`[수정] admin을 owner로 설정: ${adminMember.user}`);
      } else {
        // admin이 없으면 첫 번째 멤버를 admin으로 승격하고 owner로 설정
        const firstMember = workspace.members.find((m) => m.user);
        if (firstMember) {
          firstMember.role = "admin";
          workspace.owner = firstMember.user;
          console.log(
            `[수정] 첫 번째 멤버를 admin/owner로 설정: ${firstMember.user}`
          );
        } else {
          // 멤버가 없으면 현재 사용자를 owner로 설정하고 멤버로 추가
          const user = await User.findById(userId);
          workspace.owner = userId;
          workspace.members.push({
            user: userId,
            email: user.email,
            name: user.name,
            role: "admin",
            status: "online",
          });
          console.log(
            `[수정] 빈 워크스페이스에 현재 사용자를 owner로 설정: ${userId}`
          );
        }
      }

      await workspace.save();
      fixedCount++;
      console.log(`[수정] 워크스페이스 ${workspace._id} 수정 완료`);
    }

    console.log(`[수정] 총 ${fixedCount}개 워크스페이스 수정 완료`);
    res.json({
      message: `${fixedCount}개의 워크스페이스를 수정했습니다.`,
      fixedCount,
      totalBroken: brokenWorkspaces.length,
    });
  } catch (error) {
    console.error("워크스페이스 수정 오류:", error);
    res.status(500).json({ error: "수정 중 오류가 발생했습니다." });
  }
});

module.exports = router;

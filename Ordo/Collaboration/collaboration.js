// 콜라보레이션 실시간 협업 메인 스크립트
// 주요 기능: 워크스페이스/일정/작업/파일/멤버 관리, 실시간 동기화, 권한, 자동완성, UI/버튼 제어 등

const socket = io({ withCredentials: true });
let currentUser = null;
let currentWorkspace = null;
let workspaceList = [];
let workspaceMembers = [];
let calendarEvents = [];
let taskList = [];
let fileList = [];
let workspaceInvitations = [];
let isAdmin = false;

// 테스트 함수 (디버깅용)
window.testModal = function () {
  console.log("모달 테스트 함수 호출됨");
  showSuccessModal({
    title: "테스트 모달",
    message: "모달이 정상적으로 작동합니다!",
    icon: "✅",
    buttonText: "확인",
  });
};

// 인증 토큰 포함 fetch 래퍼
function authFetch(url, options = {}) {
  const token = localStorage.getItem("token");
  return fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: "Bearer " + token,
      "Content-Type": "application/json",
    },
    credentials: "include",
  });
}

// ===== 초기화 =====
document.addEventListener("DOMContentLoaded", async () => {
  // 저장된 테마 적용
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "dark") {
    document.documentElement.setAttribute("data-theme", "dark");
  } else {
    document.documentElement.removeAttribute("data-theme");
  }
  try {
    await fetchCurrentUser();
    await loadWorkspaceList();
    await loadWorkspaceInvitations();

    // Socket.IO 실시간 이벤트 리스너 설정
    setupSocketListeners();
  } catch (e) {
    console.error("초기화 오류:", e);
  }

  // 모든 주요 버튼 클릭 이벤트 위임
  document.body.addEventListener("click", (e) => {
    // 다크모드 토글
    if (e.target.closest(".theme-toggle")) {
      // data-theme 속성 토글
      const isDark =
        document.documentElement.getAttribute("data-theme") === "dark";
      if (isDark) {
        document.documentElement.removeAttribute("data-theme");
        localStorage.setItem("theme", "light");
      } else {
        document.documentElement.setAttribute("data-theme", "dark");
        localStorage.setItem("theme", "dark");
      }
    }
    // 메인으로 버튼
    if (e.target.closest(".back-button")) {
      window.location.href = "/Main/index.html";
    }
    // 워크스페이스 생성 버튼
    if (e.target.closest(".new-workspace-btn")) {
      // 입력값 초기화
      const modal = document.querySelector(".workspace-modal");
      if (modal) {
        const form = modal.querySelector("form");
        if (form) {
          form.querySelector("input").value = "";
          form.querySelector("select").selectedIndex = 0;
          form.querySelector("textarea").value = "";
        }
      }
      openModal(".workspace-modal");
    }
    // 워크스페이스 생성 모달 취소
    if (e.target.closest(".modal .cancel-btn")) {
      closeAllModals();
    }
    // 워크스페이스 생성 모달 제출 (정확히 워크스페이스 모달 내에서만 동작)
    if (e.target.closest(".workspace-modal .submit-btn")) {
      e.preventDefault();
      const form = e.target.closest("form");
      if (!form) return;
      const name = form.querySelector("input")?.value.trim();
      const type = form.querySelector("select")?.value;
      const desc = form.querySelector("textarea")?.value.trim();
      if (!name)
        return showConfirmModal({
          title: "입력 오류",
          message: "워크스페이스 이름을 입력해주세요.",
          icon: "⚠️",
          confirmText: "확인",
          onConfirm: () => {},
          onCancel: null,
        });
      // 랜덤 이모지
      const icons = [
        "🚀",
        "👥",
        "📚",
        "👤",
        "🦄",
        "🌈",
        "��",
        "🎨",
        "🦉",
        "🦊",
      ];
      const icon = icons[Math.floor(Math.random() * icons.length)];
      authFetch("/api/collaboration/workspaces", {
        method: "POST",
        body: JSON.stringify({ name, type, description: desc, icon }),
      }).then(async (res) => {
        if (res.ok) {
          closeAllModals();
          loadWorkspaceList();
        } else {
          const err = await res.json().catch(() => ({ message: "오류" }));
          showConfirmModal({
            title: "워크스페이스 생성 실패",
            message:
              err.error || err.message || "워크스페이스 생성에 실패했습니다.",
            icon: "❌",
            confirmText: "확인",
            onConfirm: () => {},
            onCancel: null,
          });
        }
      });
    }
    // 작업 추가 버튼
    if (e.target.closest(".task-btn")) {
      showTaskModal();
    }
    // 워크스페이스 삭제(관리자만)
    if (e.target.closest("#delete-workspace-btn")) {
      if (!isAdmin) return;
      if (!confirm("정말 삭제?")) return;
      authFetch(`/api/collaboration/workspaces/${currentWorkspace._id}`, {
        method: "DELETE",
      }).then(async (res) => {
        if (res.ok) loadWorkspaceList();
        else {
          const err = await res.json().catch(() => ({ message: "오류" }));
          alert(err.error || err.message || "워크스페이스 삭제 실패");
        }
      });
    }
    // 탭 버튼
    const tabBtn = e.target.closest(".tab-btn");
    if (tabBtn) {
      const tabBtns = Array.from(document.querySelectorAll(".tab-btn"));
      const idx = tabBtns.indexOf(tabBtn);
      if (idx !== -1) showTab(idx);
    }
    // 캘린더 추가/동기화 버튼
    if (e.target.closest(".calendar-btn.add")) {
      showEventModal();
    }
    if (e.target.closest(".calendar-btn.sync")) {
      loadCalendarEvents();
      showSuccessModal({
        title: "동기화 완료",
        message: "캘린더가 동기화되었습니다.",
        icon: "🔄",
        buttonText: "확인",
      });
    }
    // 파일 업로드 버튼
    if (e.target.closest(".file-btn")) {
      showFileUploadModal();
    }
    // 멤버 초대 버튼
    if (e.target.closest(".member-btn")) {
      showInviteModal();
    }
  });

  // 파일 업로드 input 동적 바인딩 (예시)
  document.body.addEventListener("change", (e) => {
    if (e.target.matches(".file-upload-input")) {
      // 파일 업로드 처리 함수 호출
      handleFileUpload(e.target.files);
    }
  });

  // 멤버 초대 자동완성 등 추가 이벤트 위임 필요시 여기에...
});

// ===== 사용자 정보 =====
async function fetchCurrentUser() {
  try {
    const res = await authFetch("/api/profile");
    if (!res.ok) throw new Error("로그인 필요");
    const userData = await res.json();
    currentUser = {
      id: userData._id,
      name: userData.name,
      email: userData.email,
    };
  } catch {
    showConfirmModal({
      title: "세션 만료",
      message: "로그인 세션이 만료되었습니다.\n다시 로그인해주세요.",
      icon: "⏰",
      confirmText: "로그인하기",
      onConfirm: () => {
        window.location.href = "/Login";
      },
      onCancel: null,
    });
  }
}

// ===== 워크스페이스 =====
async function loadWorkspaceList() {
  const res = await authFetch("/api/collaboration/workspaces");
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "오류" }));
    alert(err.error || err.message || "워크스페이스 목록 오류");
    return;
  }
  const data = await res.json();
  workspaceList = Array.isArray(data) ? data : data.workspaces || [];
  renderWorkspaceList();
  if (workspaceList.length > 0) selectWorkspace(workspaceList[0]._id);
}

function renderWorkspaceList() {
  const list = document.querySelector(".workspace-list");
  list.innerHTML = "";
  workspaceList.forEach((ws) => {
    const div = document.createElement("div");
    div.className =
      "workspace-item" +
      (currentWorkspace && ws._id === currentWorkspace._id ? " active" : "");
    div.dataset.id = ws._id;
    // ws.icon이 있으면 사용, 없으면 getWorkspaceAvatar(ws.type)
    div.innerHTML = `
      <div class="workspace-avatar">${
        ws.icon || getWorkspaceAvatar(ws.type)
      }</div>
      <div class="workspace-info">
        <div class="workspace-name">${ws.name}</div>
        <div class="workspace-members">${ws.members.length}명</div>
      </div>
    `;
    div.onclick = () => selectWorkspace(ws._id);
    list.appendChild(div);
  });
}

function getWorkspaceAvatar(type) {
  return (
    { project: "🚀", team: "👥", study: "📚", personal: "👤" }[type] || "📁"
  );
}

async function selectWorkspace(id) {
  currentWorkspace = workspaceList.find((w) => w._id === id);

  // 워크스페이스 소유자인지 확인
  const isOwner =
    currentWorkspace &&
    currentWorkspace.owner &&
    (typeof currentWorkspace.owner === "object"
      ? currentWorkspace.owner._id === currentUser.id
      : currentWorkspace.owner === currentUser.id);

  // isAdmin 판별: 소유자이거나 members 배열에서 현재 유저가 admin인지 확인
  isAdmin =
    isOwner ||
    (currentWorkspace &&
      currentWorkspace.members.some((m) => {
        // m.user는 ObjectId이거나 객체일 수 있음
        return (
          (m.user && (m.user._id || m.user)) === currentUser.id &&
          m.role === "admin"
        );
      }));

  console.log("[디버그] selectWorkspace isAdmin 계산:", {
    isOwner: isOwner,
    isAdmin: isAdmin,
    currentUserId: currentUser.id,
    workspaceOwnerId: currentWorkspace?.owner?._id || currentWorkspace?.owner,
  });

  renderWorkspaceList();
  renderWorkspaceHeader();
  await loadWorkspaceMembers();
  renderMemberList();
  await loadCalendarEvents();
  await loadTaskList();
  await loadFileList();
  renderRoleInSidebar();
}

function renderWorkspaceHeader() {
  document.querySelector(".workspace-avatar-large").textContent =
    currentWorkspace.icon || getWorkspaceAvatar(currentWorkspace.type);
  document.querySelector(".workspace-details h2").textContent =
    currentWorkspace.name;
  document.querySelector(".workspace-description").textContent =
    currentWorkspace.description || "";
  // 워크스페이스 액션 버튼 모두 제거 후(초기화)
  let actions = document.querySelector(".workspace-actions");
  if (actions) actions.innerHTML = "";

  console.log("[디버그] renderWorkspaceHeader 삭제 버튼:", {
    hasActions: !!actions,
    isAdmin: isAdmin,
    shouldShowDeleteButton: actions && isAdmin,
  });

  // 워크스페이스 삭제 버튼 추가(관리자만)
  if (actions && isAdmin) {
    const delBtn = document.createElement("button");
    delBtn.className = "action-btn delete-workspace-btn";
    delBtn.title = "워크스페이스 삭제";
    delBtn.innerHTML = "🗑️";
    delBtn.onclick = () => {
      showConfirmModal({
        title: "워크스페이스 삭제",
        message:
          "정말 이 워크스페이스를 삭제하시겠습니까?\n(모든 데이터가 삭제됩니다)",
        icon: "🗑️",
        confirmText: "삭제",
        onConfirm: () => {
          authFetch(`/api/collaboration/workspaces/${currentWorkspace._id}`, {
            method: "DELETE",
          }).then(async (res) => {
            if (res.ok) loadWorkspaceList();
            else {
              const err = await res.json().catch(() => ({ message: "오류" }));
              alert(err.error || err.message || "워크스페이스 삭제 실패");
            }
          });
        },
      });
    };
    actions.appendChild(delBtn);
  }
}

function renderRoleInSidebar() {
  console.log("[디버그] renderRoleInSidebar 시작");
  console.log("[디버그] currentWorkspace:", currentWorkspace);
  console.log("[디버그] currentUser:", currentUser);

  // 현재 워크스페이스 소유자인지 확인
  const isOwner =
    currentWorkspace &&
    currentWorkspace.owner &&
    (typeof currentWorkspace.owner === "object"
      ? currentWorkspace.owner._id === currentUser.id
      : currentWorkspace.owner === currentUser.id);

  console.log("[디버그] isOwner 확인:", {
    hasWorkspace: !!currentWorkspace,
    hasOwner: !!(currentWorkspace && currentWorkspace.owner),
    ownerType: typeof currentWorkspace?.owner,
    ownerId: currentWorkspace?.owner?._id || currentWorkspace?.owner,
    currentUserId: currentUser.id,
    isOwner: isOwner,
  });

  if (isOwner) {
    console.log("[디버그] 소유자로 인식 - 관리자 설정");
    document.querySelector(".user-name").textContent = currentUser.name;
    document.querySelector(".user-role").textContent = "관리자";
    return;
  }

  // workspaceMembers에서 현재 사용자 찾기
  const member = workspaceMembers.find(
    (m) => (m.user && (m.user._id || m.user)) === currentUser.id
  );

  console.log("[디버그] 멤버에서 찾기:");
  console.log("workspaceMembers:", workspaceMembers);
  console.log("foundMember:", member);
  console.log("memberRole:", member?.role);

  // 각 멤버 상세 확인
  workspaceMembers.forEach((m, index) => {
    console.log(`[디버그] 멤버 ${index}:`, {
      user: m.user,
      userId: m.user?._id || m.user,
      currentUserId: currentUser.id,
      match: (m.user && (m.user._id || m.user)) === currentUser.id,
      role: m.role,
      email: m.email,
      name: m.name,
    });
  });

  document.querySelector(".user-name").textContent =
    member?.name || currentUser.name;
  document.querySelector(".user-role").textContent =
    member?.role === "admin" ? "관리자" : "멤버";
}

// ===== 공유 캘린더 =====
async function loadCalendarEvents() {
  if (!currentWorkspace) return;
  const res = await authFetch(
    `/api/collaboration/workspaces/${currentWorkspace._id}/events`
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "오류" }));
    alert(err.error || err.message || "일정 목록 오류");
    return;
  }
  const data = await res.json();
  calendarEvents = Array.isArray(data) ? data : data.events || [];
  renderCalendarEvents();
}
function renderCalendarEvents() {
  const list = document.querySelector(".shared-events");
  list.innerHTML = "";
  calendarEvents.forEach((ev) => {
    const div = document.createElement("div");
    div.className = "event-item";
    div.innerHTML = `
      <div class="event-time">${formatEventTime(ev)}</div>
      <div class="event-content">
        <div class="event-title">${ev.title}</div>
        <div class="event-desc">${ev.description || ""}</div>
      </div>
      <div class="event-status" data-status="${formatEventStatus(
        ev
      )}">${formatEventStatus(ev)}</div>
    `;
    div.onclick = () => showEventModal(ev);
    list.appendChild(div);
  });
}
function formatEventTime(ev) {
  // 서버에서 startDate, endDate로 보내므로 이를 확인
  const startDate = ev.startDate || ev.start;
  const endDate = ev.endDate || ev.end;

  const d1 = new Date(startDate);
  const d2 = new Date(endDate);

  // 날짜가 유효하지 않으면 기본값 반환
  if (isNaN(d1.getTime()) || isNaN(d2.getTime())) {
    return "날짜 정보 없음";
  }

  // 시간 없이 월/일만 표시
  return `${d1.getMonth() + 1}/${d1.getDate()} ~ ${
    d2.getMonth() + 1
  }/${d2.getDate()}`;
}
function formatEventStatus(ev) {
  return ev.status === "confirmed" ? "확정" : "대기";
}

// ===== 모달 관리 =====

// 모달 열기
function openModal(selector) {
  const modal = document.querySelector(selector);
  if (modal) {
    modal.classList.add("show");
    // 첫 번째 입력 필드에 포커스
    const firstInput = modal.querySelector(
      'input[type="email"], input[type="text"], textarea'
    );
    if (firstInput) {
      setTimeout(() => firstInput.focus(), 100);
    }
  }
}

// 모달 닫기
function closeModal(selector) {
  const modal = document.querySelector(selector);
  if (modal) {
    modal.classList.remove("show");
  }
}

// 모든 모달 닫기
function closeAllModals() {
  document.querySelectorAll(".modal").forEach((modal) => {
    modal.classList.remove("show");
  });
}

// ===== 각 삭제 유형별 모달 함수들 =====

// 워크스페이스 삭제 모달
function showWorkspaceDeleteModal(message, onConfirm, onCancel) {
  showConfirmModal({
    title: "워크스페이스 삭제",
    message: message,
    icon: "🗑️",
    confirmText: "삭제",
    onConfirm: onConfirm,
    onCancel: onCancel,
  });
}

// 일정 삭제 모달
function showEventDeleteModal(message, onConfirm, onCancel) {
  showConfirmModal({
    title: "일정 삭제",
    message: message,
    icon: "🗑️",
    confirmText: "삭제",
    onConfirm: onConfirm,
    onCancel: onCancel,
  });
}

// 작업 삭제 모달
function showTaskDeleteModal(message, onConfirm, onCancel) {
  showConfirmModal({
    title: "작업 삭제",
    message: message,
    icon: "🗑️",
    confirmText: "삭제",
    onConfirm: onConfirm,
    onCancel: onCancel,
  });
}

// 파일 삭제 모달
function showFileDeleteModal(message, onConfirm, onCancel) {
  showConfirmModal({
    title: "파일 삭제",
    message: message,
    icon: "🗑️",
    confirmText: "삭제",
    onConfirm: onConfirm,
    onCancel: onCancel,
  });
}

// 워크스페이스 나가기 모달
function showLeaveWorkspaceModal(message, onConfirm, onCancel) {
  showConfirmModal({
    title: "워크스페이스 나가기",
    message: message,
    icon: "🚪",
    confirmText: "나가기",
    onConfirm: onConfirm,
    onCancel: onCancel,
  });
}

// ===== 모달 유틸(Chat 스타일) =====
function showChatStyleModal({
  title,
  fields,
  onSubmit,
  submitText = "확인",
  cancelText = "취소",
  showDelete,
  onDelete,
}) {
  // 기존 모달 제거
  document
    .querySelectorAll(".modal.chat-style-modal")
    .forEach((m) => m.remove());
  const modal = document.createElement("div");
  modal.className = "modal chat-style-modal show";
  modal.innerHTML = `
    <div class="modal-content">
      <h3>${title}</h3>
      <form>
        ${fields
          .map((f) => {
            if (f.type === "select") {
              return `<div class="form-group">
              <label>${f.label}</label>
              <select name="${f.name}" ${f.required ? "required" : ""}>
                ${f.options
                  .map(
                    (opt) =>
                      `<option value="${opt.value}"${
                        opt.value === f.value ? " selected" : ""
                      }>${opt.label}</option>`
                  )
                  .join("")}
              </select>
            </div>`;
            } else {
              return `<div class="form-group">
              <label>${f.label}</label>
              <input type="${f.type || "text"}" name="${f.name}" value="${
                f.value || ""
              }" ${f.required ? "required" : ""} ${
                f.disabled ? "disabled" : ""
              }/>
            </div>`;
            }
          })
          .join("")}
        <div class="form-buttons">
          <button type="button" class="cancel-btn">${cancelText}</button>
          <button type="submit" class="submit-btn">${submitText}</button>
          ${
            showDelete
              ? '<button type="button" class="delete-btn">삭제</button>'
              : ""
          }
        </div>
      </form>
    </div>
  `;
  document.body.appendChild(modal);
  modal.querySelector(".cancel-btn").onclick = () => modal.remove();
  if (showDelete && onDelete) {
    modal.querySelector(".delete-btn").onclick = () => onDelete(modal);
  }
  modal.querySelector("form").onsubmit = (e) => {
    e.preventDefault();
    const data = {};
    fields.forEach((f) => {
      if (f.type === "select") {
        data[f.name] = modal.querySelector(`[name="${f.name}"]`).value;
      } else {
        data[f.name] = modal.querySelector(`[name="${f.name}"]`).value;
      }
    });
    onSubmit(data, modal);
  };
}

// ===== 예쁜 삭제 확인 모달 =====
function showConfirmModal({
  title = "확인",
  message,
  onConfirm,
  onCancel,
  icon = "❓",
  confirmText = "확인",
  cancelText = "취소",
}) {
  // 기존 confirm 모달 제거
  document.querySelectorAll(".modal.confirm-modal").forEach((m) => m.remove());
  const modal = document.createElement("div");
  modal.className = "modal confirm-modal show";
  modal.innerHTML = `
    <div class="modal-content chat-style-modal-content" style="max-width: 380px; padding: 20px;">
      <div class="modal-icon" style="font-size:2rem;text-align:center;margin-bottom:8px;">${icon}</div>
      <h3 style="margin:8px 0 12px 0;font-size:1.1rem;text-align:center;">${title}</h3>
      <div style="margin: 12px 0 20px 0; font-size: 0.95rem; color: #555; text-align: center; line-height: 1.4;">${message}</div>
      <div class="form-buttons" style="gap: 8px;">
        <button type="button" class="cancel-btn" style="padding: 8px 16px; font-size: 0.9rem;">${cancelText}</button>
        <button type="button" class="delete-btn" style="background:linear-gradient(135deg, #ff6b6b, #ff4444);color:white;padding: 8px 16px; font-size: 0.9rem;">${confirmText}</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  modal.querySelector(".cancel-btn").onclick = () => {
    modal.remove();
    if (onCancel) onCancel();
  };
  modal.querySelector(".delete-btn").onclick = () => {
    modal.remove();
    if (onConfirm) onConfirm();
  };
}

// ===== 공유 캘린더 모달 기반 =====
function showEventModal(ev) {
  if (!currentWorkspace) return;
  if (!ev) {
    // 새 일정 추가
    showChatStyleModal({
      title: "일정 추가",
      fields: [
        { label: "제목", name: "title", required: true },
        { label: "설명", name: "description" },
        { label: "시작일", name: "start", type: "date", required: true },
        { label: "종료일", name: "end", type: "date", required: true },
      ],
      submitText: "추가",
      onSubmit: (data, modal) => {
        authFetch(
          `/api/collaboration/workspaces/${currentWorkspace._id}/events`,
          {
            method: "POST",
            body: JSON.stringify(data),
          }
        ).then(async (res) => {
          if (res.ok) {
            modal.remove();
            loadCalendarEvents();
          } else {
            const err = await res.json().catch(() => ({ message: "오류" }));
            alert(err.error || err.message || "일정 추가 실패");
          }
        });
      },
    });
  } else {
    // 일정 수정/삭제
    showChatStyleModal({
      title: "일정 수정/삭제",
      fields: [
        { label: "제목", name: "title", value: ev.title, required: true },
        { label: "설명", name: "description", value: ev.description },
        {
          label: "시작일",
          name: "start",
          type: "date",
          value: ev.start?.slice(0, 10),
          required: true,
        },
        {
          label: "종료일",
          name: "end",
          type: "date",
          value: ev.end?.slice(0, 10),
          required: true,
        },
      ],
      submitText: "수정",
      showDelete: true,
      onDelete: (modal) => {
        showConfirmModal({
          title: "일정 삭제",
          message: "정말 이 일정을 삭제하시겠습니까?",
          icon: "��️",
          confirmText: "삭제",
          onConfirm: () => {
            authFetch(`/api/collaboration/events/${ev._id}`, {
              method: "DELETE",
            }).then(async (res) => {
              if (res.ok) {
                modal.remove();
                loadCalendarEvents();
              } else {
                const err = await res.json().catch(() => ({ message: "오류" }));
                alert(err.error || err.message || "일정 삭제 실패");
              }
            });
          },
        });
      },
      onSubmit: (data, modal) => {
        authFetch(`/api/collaboration/events/${ev._id}`, {
          method: "PUT",
          body: JSON.stringify(data),
        }).then(async (res) => {
          if (res.ok) {
            modal.remove();
            loadCalendarEvents();
          } else {
            const err = await res.json().catch(() => ({ message: "오류" }));
            alert(err.error || err.message || "일정 수정 실패");
          }
        });
      },
    });
  }
}

// 캘린더 추가/동기화 버튼 바인딩
function setupCalendarButtons() {
  const addBtn = document.querySelector(".calendar-controls .calendar-btn");
  const syncBtn = document.querySelector(
    ".calendar-controls .calendar-btn:nth-child(2)"
  );
  if (addBtn) addBtn.onclick = () => showEventModal();
  if (syncBtn)
    syncBtn.onclick = () => {
      loadCalendarEvents();
      alert("캘린더가 동기화되었습니다.");
    };
}
setupCalendarButtons();

// ===== 작업 관리 =====
async function loadTaskList() {
  if (!currentWorkspace) return;
  const res = await authFetch(
    `/api/collaboration/workspaces/${currentWorkspace._id}/tasks`
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "오류" }));
    alert(err.error || err.message || "작업 목록 오류");
    return;
  }
  const data = await res.json();
  taskList = Array.isArray(data) ? data : data.tasks || [];
  renderTaskList();
}
function renderTaskList() {
  // 칸반 보드에 상태별로 작업 렌더링
  const columns = [
    { status: "todo", title: "할 일", icon: "📝", color: "todo" },
    { status: "doing", title: "진행 중", icon: "⏳", color: "doing" },
    { status: "done", title: "완료", icon: "✅", color: "done" },
  ];
  const board = document.querySelector(".task-board");
  if (!board) return;
  board.innerHTML = "";
  const priorityOrder = {
    high: 1,
    medium: 2,
    low: 3,
    "": 4,
    undefined: 4,
    null: 4,
  };
  columns.forEach((col) => {
    const colDiv = document.createElement("div");
    colDiv.className = "task-column " + col.color;
    colDiv.innerHTML = `
      <div class="column-header">
        <h4>${col.icon} ${col.title}</h4>
        <span class="task-count">${
          taskList.filter((t) => t.status === col.status).length
        }</span>
      </div>
      <div class="task-list"></div>
    `;
    const listDiv = colDiv.querySelector(".task-list");
    // 우선순위별 정렬
    taskList
      .filter((t) => t.status === col.status)
      .sort(
        (a, b) =>
          (priorityOrder[a.priority] || 4) - (priorityOrder[b.priority] || 4)
      )
      .forEach((task) => {
        const card = document.createElement("div");
        card.className =
          "task-card" + (task.status === "done" ? " completed" : "");
        card.innerHTML = `
          <div class="task-card-header">
            <span class="task-status-badge ${col.color}">${col.icon} ${
          col.title
        }</span>
            <span class="task-priority-badge ${task.priority || "none"}">
              ${
                task.priority === "high"
                  ? "🔥 높음"
                  : task.priority === "medium"
                  ? "⚡ 보통"
                  : task.priority === "low"
                  ? "💧 낮음"
                  : "-"
              }
            </span>
            <span class="task-assignee">${
              task.assigneeName ? "👤 " + task.assigneeName : ""
            }</span>
          </div>
          <div class="task-title">${task.title}</div>
          <div class="task-desc">${task.description || ""}</div>
          <div class="task-card-footer">
            <span class="task-due">${
              task.dueDate ? "⏰ " + task.dueDate : ""
            }</span>
          </div>
        `;
        card.onclick = () => showTaskModal(task);
        listDiv.appendChild(card);
      });
    board.appendChild(colDiv);
  });
}

// ===== 작업 추가/수정 모달 =====
function showTaskModal(task) {
  if (!currentWorkspace) return;
  if (!task) {
    // 새 작업 추가
    showChatStyleModal({
      title: "작업 추가",
      fields: [
        { label: "제목", name: "title", required: true },
        { label: "설명", name: "description" },
        {
          label: "상태",
          name: "status",
          type: "select",
          options: [
            { value: "todo", label: "할 일" },
            { value: "doing", label: "진행 중" },
            { value: "done", label: "완료" },
          ],
          value: "todo",
          required: true,
        },
        {
          label: "우선순위",
          name: "priority",
          type: "select",
          options: [
            { value: "", label: "선택" },
            { value: "high", label: "높음" },
            { value: "medium", label: "보통" },
            { value: "low", label: "낮음" },
          ],
          value: "",
          required: false,
        },
      ],
      submitText: "추가",
      onSubmit: (data, modal) => {
        if (!["todo", "doing", "done"].includes(data.status))
          return alert("상태는 todo/doing/done 중 하나여야 합니다.");
        authFetch(
          `/api/collaboration/workspaces/${currentWorkspace._id}/tasks`,
          {
            method: "POST",
            body: JSON.stringify(data),
          }
        ).then(async (res) => {
          if (res.ok) {
            modal.remove();
            loadTaskList();
          } else {
            const err = await res.json().catch(() => ({ message: "오류" }));
            alert(err.error || err.message || "작업 추가 실패");
          }
        });
      },
    });
  } else {
    // 작업 수정/삭제
    showChatStyleModal({
      title: "작업 수정/삭제",
      fields: [
        { label: "제목", name: "title", value: task.title, required: true },
        { label: "설명", name: "description", value: task.description },
        {
          label: "상태",
          name: "status",
          type: "select",
          options: [
            { value: "todo", label: "할 일" },
            { value: "doing", label: "진행 중" },
            { value: "done", label: "완료" },
          ],
          value: task.status,
          required: true,
        },
        {
          label: "우선순위",
          name: "priority",
          type: "select",
          options: [
            { value: "", label: "선택" },
            { value: "high", label: "높음" },
            { value: "medium", label: "보통" },
            { value: "low", label: "낮음" },
          ],
          value: task.priority || "",
          required: false,
        },
      ],
      submitText: "수정",
      showDelete: true,
      onDelete: (modal) => {
        showConfirmModal({
          title: "작업 삭제",
          message: "정말 이 작업을 삭제하시겠습니까?",
          icon: "🗑️",
          confirmText: "삭제",
          onConfirm: () => {
            authFetch(`/api/collaboration/tasks/${task._id}`, {
              method: "DELETE",
            }).then(async (res) => {
              if (res.ok) {
                modal.remove();
                loadTaskList();
              } else {
                const err = await res.json().catch(() => ({ message: "오류" }));
                alert(err.error || err.message || "작업 삭제 실패");
              }
            });
          },
        });
      },
      onSubmit: (data, modal) => {
        if (!["todo", "doing", "done"].includes(data.status))
          return alert("상태는 todo/doing/done 중 하나여야 합니다.");
        authFetch(`/api/collaboration/tasks/${task._id}`, {
          method: "PUT",
          body: JSON.stringify(data),
        }).then(async (res) => {
          if (res.ok) {
            modal.remove();
            loadTaskList();
          } else {
            const err = await res.json().catch(() => ({ message: "오류" }));
            alert(err.error || err.message || "작업 수정 실패");
          }
        });
      },
    });
  }
}

// 작업 추가 버튼 바인딩
function setupTaskButton() {
  const addBtn = document.querySelector(".tasks-header .task-btn");
  if (addBtn) addBtn.onclick = () => showTaskModal();
}
setupTaskButton();

// ===== 파일 공유 =====
async function loadFileList() {
  if (!currentWorkspace) return;
  const res = await authFetch(
    `/api/collaboration/workspaces/${currentWorkspace._id}/files`
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "오류" }));
    alert(err.error || err.message || "파일 목록 오류");
    return;
  }
  const data = await res.json();
  fileList = Array.isArray(data) ? data : data.files || [];
  renderFileList();
}
function renderFileList() {
  const list = document.querySelector(".file-list");
  if (!list) return;
  list.innerHTML = "";
  fileList.forEach((file) => {
    const size =
      file.readableSize || (file.size ? formatFileSize(file.size) : "");
    const div = document.createElement("div");
    div.className = "file-item";
    div.innerHTML = `
      <div class="file-icon">📄</div>
      <div class="file-info">
        <div class="file-name">${file.originalName}</div>
        <div class="file-meta">${
          file.uploadedBy && file.uploadedBy.name
            ? file.uploadedBy.name
            : file.uploaderName || ""
        } • ${size}</div>
      </div>
      <div class="file-actions">
        <button class="file-action-btn" title="다운로드">⬇️</button>
        ${
          file.uploadedBy === currentUser.id ||
          (file.uploadedBy && file.uploadedBy._id === currentUser.id)
            ? '<button class="file-action-btn" title="삭제">🗑️</button>'
            : ""
        }
      </div>
    `;
    // 다운로드/삭제 버튼 바인딩
    div.querySelector('.file-action-btn[title="다운로드"]').onclick = (e) => {
      e.stopPropagation();
      downloadFile(file);
    };
    if (
      file.uploadedBy === currentUser.id ||
      (file.uploadedBy && file.uploadedBy._id === currentUser.id)
    ) {
      const deleteBtn = div.querySelector('.file-action-btn[title="삭제"]');
      if (deleteBtn) {
        deleteBtn.onclick = (e) => {
          e.stopPropagation();
          showConfirmModal({
            message: "정말 이 파일을 삭제하시겠습니까?",
            onConfirm: () => deleteFile(file),
          });
        };
      }
    }
    list.appendChild(div);
  });
}
function formatFileSize(size) {
  if (!size) return "";
  const units = ["B", "KB", "MB", "GB"];
  let i = 0;
  let s = size;
  while (s >= 1024 && i < units.length - 1) {
    s /= 1024;
    i++;
  }
  return Math.round(s * 100) / 100 + " " + units[i];
}
function downloadFile(file) {
  // 인증 토큰을 포함한 URL 생성
  const token = localStorage.getItem("token");
  const url = `/api/collaboration/files/${file._id}/download`;

  console.log("[클라이언트 로그] 파일 다운로드 시도:", file._id);

  // 새 창에서 다운로드 시작
  const downloadWindow = window.open("", "_blank");
  if (!downloadWindow) {
    alert("팝업이 차단되었습니다. 팝업 차단을 해제해주세요.");
    return;
  }

  // 인증 토큰을 포함하여 파일 다운로드 요청
  fetch(url, {
    headers: {
      Authorization: "Bearer " + token,
    },
  })
    .then((response) => {
      console.log("[클라이언트 로그] 다운로드 응답 상태:", response.status);
      if (!response.ok) {
        throw new Error(`파일 다운로드에 실패했습니다. (${response.status})`);
      }
      return response.blob();
    })
    .then((blob) => {
      // Blob URL 생성 및 다운로드 링크 클릭
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = file.originalName || file.filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(blobUrl);
      document.body.removeChild(a);
      downloadWindow.close();
    })
    .catch((error) => {
      console.error("[클라이언트 로그] 파일 다운로드 에러:", error);
      alert(error.message || "파일 다운로드에 실패했습니다.");
      downloadWindow.close();
    });
}
function deleteFile(file) {
  authFetch(`/api/collaboration/files/${file._id}`, { method: "DELETE" }).then(
    async (res) => {
      if (res.ok) {
        loadFileList();
      } else {
        const err = await res.json().catch(() => ({ message: "오류" }));
        alert(err.error || err.message || "파일 삭제 실패");
      }
    }
  );
}

// ===== 워크스페이스 멤버 로드 =====
async function loadWorkspaceMembers() {
  if (!currentWorkspace) return;

  try {
    // 워크스페이스 상세 정보를 다시 가져와서 populate된 멤버 정보를 얻음
    const res = await authFetch(
      `/api/collaboration/workspaces/${currentWorkspace._id}`
    );
    if (res.ok) {
      const workspaceDetail = await res.json();
      workspaceMembers = workspaceDetail.members || [];
      console.log("[디버그] 멤버 로드 완료:", workspaceMembers);
    } else {
      console.error("워크스페이스 상세 조회 실패");
      workspaceMembers = currentWorkspace.members || [];
    }
  } catch (error) {
    console.error("멤버 로드 오류:", error);
    workspaceMembers = currentWorkspace.members || [];
  }
}

// ===== 멤버 리스트 렌더링 =====
function renderMemberList() {
  const list = document.querySelector(".member-list");
  if (!list) return;
  list.innerHTML = "";

  // 현재 워크스페이스 소유자인지 확인
  const isOwner =
    currentWorkspace &&
    currentWorkspace.owner &&
    (typeof currentWorkspace.owner === "object"
      ? currentWorkspace.owner._id === currentUser.id
      : currentWorkspace.owner === currentUser.id);

  // 멤버 헤더에 나가기 버튼 추가 (소유자가 아닌 경우)
  const membersHeader = document.querySelector(".members-header");
  if (membersHeader && !isOwner) {
    // 기존 나가기 버튼 제거
    const existingLeaveBtn = membersHeader.querySelector(
      ".leave-workspace-small-btn"
    );
    if (existingLeaveBtn) {
      existingLeaveBtn.remove();
    }

    // 새 나가기 버튼 추가 (멤버 초대 버튼 앞에)
    const memberBtn = membersHeader.querySelector(".member-btn");
    if (memberBtn) {
      const leaveBtn = document.createElement("button");
      leaveBtn.className = "leave-workspace-small-btn";
      leaveBtn.innerHTML = `<span class="leave-icon">🚪</span> 워크스페이스 나가기`;
      leaveBtn.onclick = showLeaveWorkspaceConfirm;

      // 멤버 초대 버튼 앞에 삽입
      membersHeader.insertBefore(leaveBtn, memberBtn);
    }
  } else if (membersHeader && isOwner) {
    // 소유자인 경우 나가기 버튼 제거
    const existingLeaveBtn = membersHeader.querySelector(
      ".leave-workspace-small-btn"
    );
    if (existingLeaveBtn) {
      existingLeaveBtn.remove();
    }
  }

  // 멤버 목록 렌더링
  workspaceMembers.forEach((m) => {
    // m.user는 객체 또는 id일 수 있음
    const user =
      typeof m.user === "object" ? m.user : { name: "알 수 없음", email: "" };
    const role = m.role === "admin" ? "관리자" : "멤버";
    list.innerHTML += `
      <div class="member-item">
        <div class="member-avatar">👤</div>
        <div class="member-info">
          <div class="member-name">${user.name || ""}</div>
          <div class="member-email">${user.email || ""}</div>
        </div>
        <div class="member-role ${m.role}">${role}</div>
      </div>
    `;
  });
}

// 워크스페이스 나가기 확인 모달
function showLeaveWorkspaceConfirm() {
  showConfirmModal({
    title: "워크스페이스 나가기",
    message:
      "정말로 이 워크스페이스를 나가시겠습니까?<br>나가시면 다시 초대를 받아야 합니다.",
    icon: "🚪",
    confirmText: "나가기",
    onConfirm: async () => {
      try {
        const res = await authFetch(
          `/api/collaboration/workspaces/${currentWorkspace._id}/leave`,
          {
            method: "POST",
          }
        );

        const data = await res.json();
        if (res.ok) {
          console.log("워크스페이스 나가기 성공, 모달 표시 시도:", data);

          if (data.workspaceDeleted) {
            console.log("워크스페이스 삭제 모달 표시");
            showSuccessModal({
              title: "워크스페이스 나가기 완료",
              message:
                "워크스페이스를 나갔습니다.\n마지막 멤버였으므로 워크스페이스가 삭제되었습니다.",
              icon: "🗑️",
              buttonText: "확인",
            });
          } else {
            console.log("일반 나가기 모달 표시");
            showSuccessModal({
              title: "워크스페이스 나가기 완료",
              message: "워크스페이스를 성공적으로 나갔습니다.",
              icon: "👋",
              buttonText: "확인",
            });
          }

          // 현재 워크스페이스 초기화
          currentWorkspace = null;

          // 워크스페이스 목록 새로고침
          await loadWorkspaceList();

          // 첫 번째 워크스페이스 선택 또는 빈 상태 표시
          if (workspaceList.length > 0) {
            await selectWorkspace(workspaceList[0]._id);
          } else {
            // 워크스페이스가 없으면 빈 상태 표시
            document.querySelector(".workspace-name").textContent =
              "워크스페이스를 선택하세요";
            document.querySelector(".workspace-header").style.display = "none";
            document.querySelectorAll(".tab-pane").forEach((pane) => {
              pane.innerHTML =
                '<p style="text-align: center; color: #666; margin-top: 50px;">워크스페이스를 선택하거나 생성하세요.</p>';
            });
          }
        } else {
          throw new Error(data.error || "워크스페이스 나가기에 실패했습니다.");
        }
      } catch (error) {
        showConfirmModal({
          title: "오류 발생",
          message: error.message,
          icon: "❌",
          confirmText: "확인",
          onConfirm: () => {},
          onCancel: null,
        });
      }
    },
  });
}

// ===== 다크모드 토글 =====
// function setupThemeToggle() {
//   const btn = document.querySelector('.theme-toggle');
//   if (!btn) return;
//   btn.onclick = () => {
//     document.body.classList.toggle('dark');
//     // 필요시 localStorage 등에 저장 가능
//   };
// }

// ===== 탭 전환 함수 =====
function showTab(idx) {
  const tabBtns = document.querySelectorAll(".tab-btn");
  const tabPanes = document.querySelectorAll(".tab-pane");
  if (!tabBtns || !tabPanes) return;
  tabBtns.forEach((b, i) => b.classList.toggle("active", i === idx));
  tabPanes.forEach((p, i) => p.classList.toggle("active", i === idx));
}

// ===== 공유 캘린더 모달 기반 =====
function showEventModal(ev) {
  if (!currentWorkspace) return;
  if (!ev) {
    // 새 일정 추가
    showChatStyleModal({
      title: "일정 추가",
      fields: [
        { label: "제목", name: "title", required: true },
        { label: "설명", name: "description" },
        { label: "시작일", name: "start", type: "date", required: true },
        { label: "종료일", name: "end", type: "date", required: true },
      ],
      submitText: "추가",
      onSubmit: (data, modal) => {
        authFetch(
          `/api/collaboration/workspaces/${currentWorkspace._id}/events`,
          {
            method: "POST",
            body: JSON.stringify(data),
          }
        ).then(async (res) => {
          if (res.ok) {
            modal.remove();
            loadCalendarEvents();
          } else {
            const err = await res.json().catch(() => ({ message: "오류" }));
            alert(err.error || err.message || "일정 추가 실패");
          }
        });
      },
    });
  } else {
    // 일정 수정/삭제
    showChatStyleModal({
      title: "일정 수정/삭제",
      fields: [
        { label: "제목", name: "title", value: ev.title, required: true },
        { label: "설명", name: "description", value: ev.description },
        {
          label: "시작일",
          name: "start",
          type: "date",
          value: ev.start?.slice(0, 10),
          required: true,
        },
        {
          label: "종료일",
          name: "end",
          type: "date",
          value: ev.end?.slice(0, 10),
          required: true,
        },
      ],
      submitText: "수정",
      showDelete: true,
      onDelete: (modal) => {
        showConfirmModal({
          title: "일정 삭제",
          message: "정말 이 일정을 삭제하시겠습니까?",
          icon: "��️",
          confirmText: "삭제",
          onConfirm: () => {
            authFetch(`/api/collaboration/events/${ev._id}`, {
              method: "DELETE",
            }).then(async (res) => {
              if (res.ok) {
                modal.remove();
                loadCalendarEvents();
              } else {
                const err = await res.json().catch(() => ({ message: "오류" }));
                alert(err.error || err.message || "일정 삭제 실패");
              }
            });
          },
        });
      },
      onSubmit: (data, modal) => {
        authFetch(`/api/collaboration/events/${ev._id}`, {
          method: "PUT",
          body: JSON.stringify(data),
        }).then(async (res) => {
          if (res.ok) {
            modal.remove();
            loadCalendarEvents();
          } else {
            const err = await res.json().catch(() => ({ message: "오류" }));
            alert(err.error || err.message || "일정 수정 실패");
          }
        });
      },
    });
  }
}

// ===== Socket.IO 이벤트 =====

// 실시간 초대 알림 수신
socket.on("new_workspace_invitation", (data) => {
  const { invitation } = data;

  // 초대 목록에 추가
  workspaceInvitations.unshift(invitation);
  updateInvitationsUI();

  // 알림 표시
  showNotification(
    `${invitation.workspace.name} 워크스페이스에 초대되었습니다!`,
    "info"
  );
});

// 초대 상태 변경 알림
socket.on("invitation_responded", (data) => {
  const { invitationId, status, workspaceName, userName } = data;

  if (status === "accepted") {
    showNotification(
      `${userName}님이 ${workspaceName} 워크스페이스 초대를 수락했습니다.`,
      "success"
    );
    // 워크스페이스 멤버 목록 새로고침
    if (currentWorkspace) {
      loadWorkspaceMembers(currentWorkspace._id);
    }
  } else if (status === "declined") {
    showNotification(
      `${userName}님이 ${workspaceName} 워크스페이스 초대를 거절했습니다.`,
      "info"
    );
  }
});

// ===== 공유 캘린더 모달 기반 =====
function showEventModal(ev) {
  if (!currentWorkspace) return;
  if (!ev) {
    // 새 일정 추가
    showChatStyleModal({
      title: "일정 추가",
      fields: [
        { label: "제목", name: "title", required: true },
        { label: "설명", name: "description" },
        { label: "시작일", name: "start", type: "date", required: true },
        { label: "종료일", name: "end", type: "date", required: true },
      ],
      submitText: "추가",
      onSubmit: (data, modal) => {
        authFetch(
          `/api/collaboration/workspaces/${currentWorkspace._id}/events`,
          {
            method: "POST",
            body: JSON.stringify(data),
          }
        ).then(async (res) => {
          if (res.ok) {
            modal.remove();
            loadCalendarEvents();
          } else {
            const err = await res.json().catch(() => ({ message: "오류" }));
            alert(err.error || err.message || "일정 추가 실패");
          }
        });
      },
    });
  } else {
    // 일정 수정/삭제
    showChatStyleModal({
      title: "일정 수정/삭제",
      fields: [
        { label: "제목", name: "title", value: ev.title, required: true },
        { label: "설명", name: "description", value: ev.description },
        {
          label: "시작일",
          name: "start",
          type: "date",
          value: (ev.startDate || ev.start)?.slice(0, 10),
          required: true,
        },
        {
          label: "종료일",
          name: "end",
          type: "date",
          value: (ev.endDate || ev.end)?.slice(0, 10),
          required: true,
        },
      ],
      submitText: "수정",
      showDelete: true,
      onDelete: (modal) => {
        showConfirmModal({
          title: "일정 삭제",
          message: "정말 이 일정을 삭제하시겠습니까?",
          icon: "🗑️",
          confirmText: "삭제",
          onConfirm: () => {
            authFetch(`/api/collaboration/events/${ev._id}`, {
              method: "DELETE",
            }).then(async (res) => {
              if (res.ok) {
                modal.remove();
                loadCalendarEvents();
              } else {
                const err = await res.json().catch(() => ({ message: "오류" }));
                alert(err.error || err.message || "일정 삭제 실패");
              }
            });
          },
        });
      },
      onSubmit: (data, modal) => {
        authFetch(`/api/collaboration/events/${ev._id}`, {
          method: "PUT",
          body: JSON.stringify(data),
        }).then(async (res) => {
          if (res.ok) {
            modal.remove();
            loadCalendarEvents();
          } else {
            const err = await res.json().catch(() => ({ message: "오류" }));
            alert(err.error || err.message || "일정 수정 실패");
          }
        });
      },
    });
  }
}

// ===== 작업 관리 =====
async function loadTaskList() {
  if (!currentWorkspace) return;
  const res = await authFetch(
    `/api/collaboration/workspaces/${currentWorkspace._id}/tasks`
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "오류" }));
    alert(err.error || err.message || "작업 목록 오류");
    return;
  }
  const data = await res.json();
  taskList = data.tasks || [];
  renderTaskList();
}
function renderTaskList() {
  // 칸반 보드에 상태별로 작업 렌더링
  const columns = [
    { status: "todo", title: "할 일", icon: "📝", color: "todo" },
    { status: "doing", title: "진행 중", icon: "⏳", color: "doing" },
    { status: "done", title: "완료", icon: "✅", color: "done" },
  ];
  const board = document.querySelector(".task-board");
  if (!board) return;
  board.innerHTML = "";
  const priorityOrder = {
    high: 1,
    medium: 2,
    low: 3,
    "": 4,
    undefined: 4,
    null: 4,
  };
  columns.forEach((col) => {
    const colDiv = document.createElement("div");
    colDiv.className = "task-column " + col.color;
    colDiv.innerHTML = `
      <div class="column-header">
        <h4>${col.icon} ${col.title}</h4>
        <span class="task-count">${
          taskList.filter((t) => t.status === col.status).length
        }</span>
      </div>
      <div class="task-list"></div>
    `;
    const listDiv = colDiv.querySelector(".task-list");
    // 우선순위별 정렬
    taskList
      .filter((t) => t.status === col.status)
      .sort(
        (a, b) =>
          (priorityOrder[a.priority] || 4) - (priorityOrder[b.priority] || 4)
      )
      .forEach((task) => {
        const card = document.createElement("div");
        card.className =
          "task-card" + (task.status === "done" ? " completed" : "");
        card.innerHTML = `
          <div class="task-card-header">
            <span class="task-status-badge ${col.color}">${col.icon} ${
          col.title
        }</span>
            <span class="task-priority-badge ${task.priority || "none"}">
              ${
                task.priority === "high"
                  ? "🔥 높음"
                  : task.priority === "medium"
                  ? "⚡ 보통"
                  : task.priority === "low"
                  ? "💧 낮음"
                  : "-"
              }
            </span>
            <span class="task-assignee">${
              task.assigneeName ? "👤 " + task.assigneeName : ""
            }</span>
          </div>
          <div class="task-title">${task.title}</div>
          <div class="task-desc">${task.description || ""}</div>
          <div class="task-card-footer">
            <span class="task-due">${
              task.dueDate ? "⏰ " + task.dueDate : ""
            }</span>
          </div>
        `;
        card.onclick = () => showTaskModal(task);
        listDiv.appendChild(card);
      });
    board.appendChild(colDiv);
  });
}

// ===== 작업 추가/수정 모달 =====
function showTaskModal(task) {
  if (!currentWorkspace) return;
  if (!task) {
    // 새 작업 추가
    showChatStyleModal({
      title: "작업 추가",
      fields: [
        { label: "제목", name: "title", required: true },
        { label: "설명", name: "description" },
        {
          label: "상태",
          name: "status",
          type: "select",
          options: [
            { value: "todo", label: "할 일" },
            { value: "doing", label: "진행 중" },
            { value: "done", label: "완료" },
          ],
          value: "todo",
          required: true,
        },
        {
          label: "우선순위",
          name: "priority",
          type: "select",
          options: [
            { value: "", label: "선택" },
            { value: "high", label: "높음" },
            { value: "medium", label: "보통" },
            { value: "low", label: "낮음" },
          ],
          value: "",
          required: false,
        },
      ],
      submitText: "추가",
      onSubmit: (data, modal) => {
        if (!["todo", "doing", "done"].includes(data.status))
          return alert("상태는 todo/doing/done 중 하나여야 합니다.");
        authFetch(
          `/api/collaboration/workspaces/${currentWorkspace._id}/tasks`,
          {
            method: "POST",
            body: JSON.stringify(data),
          }
        ).then(async (res) => {
          if (res.ok) {
            modal.remove();
            loadTaskList();
          } else {
            const err = await res.json().catch(() => ({ message: "오류" }));
            alert(err.error || err.message || "작업 추가 실패");
          }
        });
      },
    });
  } else {
    // 작업 수정/삭제
    showChatStyleModal({
      title: "작업 수정/삭제",
      fields: [
        { label: "제목", name: "title", value: task.title, required: true },
        { label: "설명", name: "description", value: task.description },
        {
          label: "상태",
          name: "status",
          type: "select",
          options: [
            { value: "todo", label: "할 일" },
            { value: "doing", label: "진행 중" },
            { value: "done", label: "완료" },
          ],
          value: task.status,
          required: true,
        },
        {
          label: "우선순위",
          name: "priority",
          type: "select",
          options: [
            { value: "", label: "선택" },
            { value: "high", label: "높음" },
            { value: "medium", label: "보통" },
            { value: "low", label: "낮음" },
          ],
          value: task.priority || "",
          required: false,
        },
      ],
      submitText: "수정",
      showDelete: true,
      onDelete: (modal) => {
        showConfirmModal({
          title: "작업 삭제",
          message: "정말 이 작업을 삭제하시겠습니까?",
          icon: "🗑️",
          confirmText: "삭제",
          onConfirm: () => {
            authFetch(`/api/collaboration/tasks/${task._id}`, {
              method: "DELETE",
            }).then(async (res) => {
              if (res.ok) {
                modal.remove();
                loadTaskList();
              } else {
                const err = await res.json().catch(() => ({ message: "오류" }));
                alert(err.error || err.message || "작업 삭제 실패");
              }
            });
          },
        });
      },
      onSubmit: (data, modal) => {
        if (!["todo", "doing", "done"].includes(data.status))
          return alert("상태는 todo/doing/done 중 하나여야 합니다.");
        authFetch(`/api/collaboration/tasks/${task._id}`, {
          method: "PUT",
          body: JSON.stringify(data),
        }).then(async (res) => {
          if (res.ok) {
            modal.remove();
            loadTaskList();
          } else {
            const err = await res.json().catch(() => ({ message: "오류" }));
            alert(err.error || err.message || "작업 수정 실패");
          }
        });
      },
    });
  }
}

// 파일 업로드 모달 함수
function showFileUploadModal() {
  showChatStyleModal({
    title: "파일 업로드",
    fields: [{ label: "파일", name: "file", type: "file", required: true }],
    submitText: "업로드",
    onSubmit: (data, modal) => {
      const fileInput = document.querySelector(
        '.chat-style-modal input[type="file"]'
      );
      if (!fileInput || !fileInput.files[0]) return alert("파일을 선택하세요.");
      const formData = new FormData();
      formData.append("file", fileInput.files[0]);

      // 파일 업로드 요청은 일반 fetch 사용 (authFetch는 Content-Type: application/json을 자동으로 추가함)
      fetch(`/api/collaboration/workspaces/${currentWorkspace._id}/files`, {
        method: "POST",
        headers: {
          Authorization: "Bearer " + localStorage.getItem("token"),
        },
        body: formData,
      }).then(async (res) => {
        if (res.ok) {
          modal.remove();
          loadFileList();
        } else {
          const err = await res.json().catch(() => ({ message: "오류" }));
          alert(err.error || err.message || "파일 업로드 실패");
        }
      });
    },
  });
}

// 멤버 초대 모달 함수
function showInviteModal() {
  showChatStyleModal({
    title: "멤버 초대",
    fields: [
      {
        label: "이메일",
        name: "email",
        type: "email",
        required: true,
        placeholder: "초대할 멤버의 이메일을 입력하세요",
      },
      {
        label: "권한",
        name: "role",
        type: "select",
        options: [
          { value: "member", label: "멤버" },
          { value: "admin", label: "관리자" },
        ],
        value: "member",
        required: true,
      },
      {
        label: "초대 메시지 (선택)",
        name: "message",
        type: "textarea",
        required: false,
        placeholder: "워크스페이스에 대한 간단한 설명을 적어주세요",
      },
    ],
    submitText: "초대 보내기",
    onSubmit: (data, modal) => {
      // 로딩 상태 표시
      const submitBtn = modal.querySelector(".submit-btn");
      const originalText = submitBtn.textContent;
      submitBtn.textContent = "초대 중...";
      submitBtn.disabled = true;

      authFetch(
        `/api/collaboration/workspaces/${currentWorkspace._id}/invitations`,
        {
          method: "POST",
          body: JSON.stringify(data),
        }
      )
        .then(async (res) => {
          const result = await res.json();
          if (res.ok) {
            modal.remove();
            loadWorkspaceMembers();
            renderMemberList();
            showNotification(
              result.message || "초대를 성공적으로 보냈습니다!",
              "success"
            );
          } else {
            showNotification(
              result.error || "멤버 초대에 실패했습니다.",
              "error"
            );
            // 버튼 상태 복구
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
          }
        })
        .catch((error) => {
          console.error("초대 오류:", error);
          showNotification("초대 중 오류가 발생했습니다.", "error");
          // 버튼 상태 복구
          submitBtn.textContent = originalText;
          submitBtn.disabled = false;
        });
    },
  });

  // ===== 자동완성 기능 추가 =====
  setTimeout(() => {
    const modal = document.querySelector(".chat-style-modal");
    const input = modal && modal.querySelector('input[name="email"]');
    if (!input) return;
    let suggestBox = document.createElement("div");
    suggestBox.className = "autocomplete-suggest-box";
    suggestBox.style.position = "absolute";
    suggestBox.style.zIndex = 1000;
    suggestBox.style.background = "#fff";
    suggestBox.style.border = "1px solid #ccc";
    suggestBox.style.width = input.offsetWidth + "px";
    suggestBox.style.maxHeight = "180px";
    suggestBox.style.overflowY = "auto";
    suggestBox.style.display = "none";
    input.parentNode.appendChild(suggestBox);

    let lastQuery = "";
    input.addEventListener("input", async function () {
      const q = input.value.trim();
      if (q.length < 2) {
        suggestBox.style.display = "none";
        return;
      }
      if (q === lastQuery) return;
      lastQuery = q;
      const res = await authFetch(
        `/api/collaboration/users/search?q=${encodeURIComponent(q)}`
      );
      if (!res.ok) {
        suggestBox.style.display = "none";
        return;
      }
      const data = await res.json();
      if (!data.users || !data.users.length) {
        suggestBox.style.display = "none";
        return;
      }
      suggestBox.innerHTML = data.users
        .map(
          (u) =>
            `<div class='suggest-item' style='padding:6px 12px;cursor:pointer;'>${u.name} <span style='color:#888;font-size:12px;'>${u.email}</span></div>`
        )
        .join("");
      suggestBox.style.display = "block";
      Array.from(suggestBox.children).forEach((item, idx) => {
        item.onclick = () => {
          input.value = data.users[idx].email;
          suggestBox.style.display = "none";
        };
      });
    });
    input.addEventListener("blur", () =>
      setTimeout(() => {
        suggestBox.style.display = "none";
      }, 200)
    );
  }, 100);
}

// ===== 워크스페이스 초대 관리 =====

// 받은 초대 목록 로드
async function loadWorkspaceInvitations() {
  try {
    const response = await authFetch("/api/collaboration/invitations/received");
    const result = await response.json();

    if (result.success) {
      workspaceInvitations = result.data.invitations || [];
      updateInvitationsUI();
      console.log(
        "[초대] 받은 초대 목록 로드:",
        workspaceInvitations.length + "개",
        workspaceInvitations
      );
    } else {
      console.error("초대 목록 로드 실패:", result.error);
      workspaceInvitations = [];
      updateInvitationsUI();
    }
  } catch (error) {
    console.error("초대 목록 로드 오류:", error);
    workspaceInvitations = [];
    updateInvitationsUI();
  }
}

// 초대 UI 업데이트
function updateInvitationsUI() {
  const invitationsList = document.querySelector(".invitations-list");
  const invitationCount = document.querySelector(".invitation-count");

  if (!invitationsList || !invitationCount) return;

  // 카운트 업데이트
  invitationCount.textContent = workspaceInvitations.length;

  // 카운트 표시/숨김 처리
  if (workspaceInvitations.length === 0) {
    invitationCount.style.display = "none";
  } else {
    invitationCount.style.display = "inline-block";
  }

  // 초대가 없는 경우
  if (workspaceInvitations.length === 0) {
    invitationsList.innerHTML = `
      <div class="empty-invitations">
        <div class="empty-invitations-icon">📭</div>
        <p>받은 초대가 없습니다</p>
      </div>
    `;
    return;
  }

  // 초대 목록 렌더링
  invitationsList.innerHTML = workspaceInvitations
    .map(
      (invitation) => `
    <div class="invitation-item" data-id="${invitation._id}">
      <div class="invitation-info">
        <div class="invitation-workspace-name">
          <span class="invitation-workspace-icon">${
            invitation.workspace.icon || "🏢"
          }</span>
          ${invitation.workspace.name}
        </div>
        <div class="invitation-inviter">
          ${invitation.inviter.name}님의 초대
        </div>
        ${
          invitation.message
            ? `<div class="invitation-message">"${invitation.message}"</div>`
            : ""
        }
        <div class="invitation-meta">
          <span class="invitation-date">${formatInvitationDate(
            invitation.createdAt
          )}</span>
          <span class="invitation-role">${getRoleDisplayName(
            invitation.role
          )}</span>
        </div>
      </div>
      <div class="invitation-actions">
        <button class="invitation-btn accept-btn" onclick="respondToInvitation('${
          invitation._id
        }', 'accepted')">
          ✅ 수락
        </button>
        <button class="invitation-btn decline-btn" onclick="respondToInvitation('${
          invitation._id
        }', 'declined')">
          ❌ 거절
        </button>
      </div>
    </div>
  `
    )
    .join("");
}

// 초대 응답 (수락/거절)
// 초대 응답 처리
async function respondToInvitation(invitationId, response) {
  try {
    console.log("[클라이언트] 초대 응답 요청:", {
      invitationId,
      response,
      url: `/api/collaboration/invitations/${invitationId}`,
    });

    const result = await authFetch(
      `/api/collaboration/invitations/${invitationId}`,
      {
        method: "PUT",
        body: JSON.stringify({ status: response }),
      }
    );

    const data = await result.json();

    if (data.success) {
      // 초대 목록에서 제거
      workspaceInvitations = workspaceInvitations.filter(
        (inv) => inv._id !== invitationId
      );
      updateInvitationsUI();

      if (response === "accepted") {
        // 워크스페이스 목록 새로고침
        await loadWorkspaceList();
        showNotification("워크스페이스 초대를 수락했습니다!", "success");
      } else {
        showNotification("초대를 거절했습니다.", "info");
      }
    } else {
      showNotification(data.error || "초대 응답에 실패했습니다.", "error");
    }
  } catch (error) {
    console.error("초대 응답 오류:", error);
    showNotification("초대 응답 중 오류가 발생했습니다.", "error");
  }
}

// 워크스페이스 초대 보내기
async function sendWorkspaceInvitation(
  workspaceId,
  email,
  role = "member",
  message = ""
) {
  try {
    const response = await authFetch(
      `/api/collaboration/workspaces/${workspaceId}/invitations`,
      {
        method: "POST",
        body: JSON.stringify({ email, role, message }),
      }
    );

    const result = await response.json();

    if (response.ok) {
      showNotification("초대가 성공적으로 전송되었습니다.", "success");
      return result;
    } else {
      throw new Error(result.error || "초대 전송에 실패했습니다.");
    }
  } catch (error) {
    console.error("초대 전송 오류:", error);
    showNotification(
      error.message || "초대 전송 중 오류가 발생했습니다.",
      "error"
    );
    throw error;
  }
}

// 유틸리티 함수들
function formatInvitationDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  if (diffMinutes < 1) {
    return "방금 전";
  } else if (diffMinutes < 60) {
    return `${diffMinutes}분 전`;
  } else if (diffHours < 24) {
    return `${diffHours}시간 전`;
  } else if (diffDays < 7) {
    return `${diffDays}일 전`;
  } else {
    return date.toLocaleDateString("ko-KR", {
      month: "short",
      day: "numeric",
    });
  }
}

function getRoleDisplayName(role) {
  const roleNames = {
    admin: "관리자",
    member: "멤버",
    viewer: "뷰어",
  };
  return roleNames[role] || role;
}

// 알림 메시지 표시
function showSuccessModal({
  title = "성공",
  message,
  icon = "✅",
  buttonText = "확인",
}) {
  const modal = document.createElement("div");
  modal.className = "modal success-modal";
  modal.innerHTML = `
    <div class="modal-overlay"></div>
    <div class="modal-content success-modal-content">
      <div class="success-icon">${icon}</div>
      <h3 class="success-title">${title}</h3>
      <p class="success-message">${message.replace(/\n/g, "<br>")}</p>
      <button class="success-btn">${buttonText}</button>
    </div>
  `;

  // 스타일 추가
  if (!document.querySelector("#success-modal-styles")) {
    const style = document.createElement("style");
    style.id = "success-modal-styles";
    style.textContent = `
      .success-modal {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .success-modal .modal-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(5px);
      }

      .success-modal-content {
        background: white;
        border-radius: 20px;
        padding: 40px 30px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
        text-align: center;
        max-width: 400px;
        position: relative;
        animation: successSlideIn 0.3s ease-out;
        border: 3px solid #10b981;
      }

      [data-theme="dark"] .success-modal-content {
        background: #2d3748;
        color: white;
        border-color: #10b981;
      }

      .success-icon {
        font-size: 60px;
        margin-bottom: 20px;
        animation: successBounce 0.6s ease-out;
      }

      .success-title {
        color: #10b981;
        font-size: 24px;
        font-weight: bold;
        margin: 0 0 15px 0;
      }

      [data-theme="dark"] .success-title {
        color: #34d399;
      }

      .success-message {
        color: #6b7280;
        font-size: 16px;
        line-height: 1.5;
        margin: 0 0 30px 0;
      }

      [data-theme="dark"] .success-message {
        color: #d1d5db;
      }

      .success-btn {
        background: linear-gradient(135deg, #10b981, #059669);
        color: white;
        border: none;
        padding: 12px 30px;
        border-radius: 25px;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
      }

      .success-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
      }

      .success-btn:active {
        transform: translateY(0);
      }

      @keyframes successSlideIn {
        from {
          opacity: 0;
          transform: scale(0.8) translateY(-20px);
        }
        to {
          opacity: 1;
          transform: scale(1) translateY(0);
        }
      }

      @keyframes successBounce {
        0%, 20%, 50%, 80%, 100% {
          transform: translateY(0);
        }
        40% {
          transform: translateY(-10px);
        }
        60% {
          transform: translateY(-5px);
        }
      }
    `;
    document.head.appendChild(style);
  }

  document.body.appendChild(modal);

  // 버튼 클릭 시 모달 닫기
  modal.querySelector(".success-btn").onclick = () => {
    modal.style.animation = "successSlideIn 0.2s ease-in reverse";
    setTimeout(() => modal.remove(), 200);
  };

  // 오버레이 클릭 시 모달 닫기
  modal.querySelector(".modal-overlay").onclick = () => {
    modal.style.animation = "successSlideIn 0.2s ease-in reverse";
    setTimeout(() => modal.remove(), 200);
  };

  return modal;
}

function showNotification(message, type = "info") {
  // 기존 알림 제거
  const existingNotification = document.querySelector(".notification");
  if (existingNotification) {
    existingNotification.remove();
  }

  // 새 알림 생성
  const notification = document.createElement("div");
  notification.className = `notification ${type}`;
  notification.textContent = message;

  // 스타일 설정
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${
      type === "success" ? "#10b981" : type === "error" ? "#ef4444" : "#3b82f6"
    };
    color: white;
    padding: 16px 24px;
    border-radius: 12px;
    box-shadow: 0 10px 25px rgba(0,0,0,0.1);
    z-index: 10000;
    font-weight: 500;
    max-width: 300px;
    word-wrap: break-word;
    animation: slideInNotification 0.3s ease-out;
  `;

  document.body.appendChild(notification);

  // 3초 후 자동 제거
  setTimeout(() => {
    notification.style.animation = "slideOutNotification 0.3s ease-in forwards";
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 300);
  }, 3000);
}

// CSS 애니메이션 추가 (한 번만 추가)
if (!document.querySelector("#notification-styles")) {
  const style = document.createElement("style");
  style.id = "notification-styles";
  style.textContent = `
    @keyframes slideInNotification {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    @keyframes slideOutNotification {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(100%);
        opacity: 0;
      }
    }
  `;
  document.head.appendChild(style);
}

// Socket.IO 실시간 이벤트 리스너 설정
function setupSocketListeners() {
  if (!socket) {
    console.warn("Socket.IO가 초기화되지 않았습니다.");
    return;
  }

  // 새로운 워크스페이스 초대 받았을 때
  socket.on("new_workspace_invitation", (data) => {
    console.log("[실시간] 새 워크스페이스 초대 받음:", data);

    // 초대 목록에 추가
    if (data.invitation) {
      workspaceInvitations.unshift(data.invitation);
      updateInvitationsUI();

      // 알림 표시
      showNotification(
        `${data.invitation.inviter.name}님이 "${data.invitation.workspace.name}" 워크스페이스에 초대했습니다.`,
        "info"
      );

      // 브라우저 알림 (권한이 있는 경우)
      if (Notification.permission === "granted") {
        new Notification("새 워크스페이스 초대", {
          body: `${data.invitation.inviter.name}님이 "${data.invitation.workspace.name}"에 초대했습니다.`,
          icon: "/Login/image-8.png",
        });
      }
    }
  });

  // 초대 응답 받았을 때 (초대한 사람용)
  socket.on("invitation_responded", (data) => {
    console.log("[실시간] 초대 응답 받음:", data);

    const statusText = data.status === "accepted" ? "수락" : "거절";
    const icon = data.status === "accepted" ? "✅" : "❌";

    showNotification(
      `${data.userName}님이 "${data.workspaceName}" 초대를 ${statusText}했습니다. ${icon}`,
      data.status === "accepted" ? "success" : "info"
    );

    // 워크스페이스 목록 새로고침 (수락한 경우)
    if (data.status === "accepted") {
      loadWorkspaceList();
      loadWorkspaceMembers();
    }
  });

  // 워크스페이스 멤버 변경 알림
  socket.on("workspace_member_updated", (data) => {
    console.log("[실시간] 워크스페이스 멤버 업데이트:", data);

    if (currentWorkspace && data.workspaceId === currentWorkspace._id) {
      loadWorkspaceMembers();
      renderMemberList();
    }
  });

  // 연결 상태 로그
  socket.on("connect", () => {
    console.log("[Socket.IO] 서버에 연결됨");
  });

  socket.on("disconnect", () => {
    console.log("[Socket.IO] 서버와 연결 끊김");
  });

  // 브라우저 알림 권한 요청
  if ("Notification" in window && Notification.permission === "default") {
    Notification.requestPermission().then((permission) => {
      console.log("[알림] 브라우저 알림 권한:", permission);
    });
  }
}

// 모든 모달 닫기
function closeAllModals() {
  document.querySelectorAll(".modal").forEach((modal) => {
    modal.classList.remove("show");
  });
}

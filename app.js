import { firebaseConfig, classId } from "./firebase-config.js";

const $ = selector => document.querySelector(selector);
const configured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId);
const channel = "BroadcastChannel" in window ? new BroadcastChannel(`oncuvate-${classId}`) : null;
const state = {
  role: "",
  studentId: "",
  selectedStudentId: "",
  students: new Map(),
  messages: [],
  board: "",
  brushColor: "#4b24a5",
  brushSize: 5,
  drawing: false,
  api: null,
  unsubscribers: []
};

const pageNames = ["출발", "전체 모습", "색과 무늬", "몸의 부분", "움직임", "사는 환경", "정보 구분", "글 완성"];
const demoKey = `oncuvate_demo_${classId}`;

function setStatus(message, error = false) {
  $("#loginStatus").textContent = message;
  $("#loginStatus").style.color = error ? "var(--oc-danger)" : "#247354";
}

function setConsoleStatus(message) {
  $("#consoleStatus").textContent = message;
  clearTimeout(setConsoleStatus.timer);
  setConsoleStatus.timer = setTimeout(() => $("#consoleStatus").textContent = "", 2200);
}

function demoData() {
  try {
    return JSON.parse(localStorage.getItem(demoKey)) || { students: {}, messages: {}, boards: {} };
  } catch {
    return { students: {}, messages: {}, boards: {} };
  }
}

function saveDemo(data) {
  localStorage.setItem(demoKey, JSON.stringify(data));
  channel?.postMessage({ type: "refresh" });
}

async function initFirebase() {
  if (!configured) {
    $("#connectionState").textContent = "데모 모드";
    return null;
  }

  const [{ initializeApp }, authModule, firestoreModule] = await Promise.all([
    import("https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js"),
    import("https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js"),
    import("https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js")
  ]);
  const app = initializeApp(firebaseConfig);
  const auth = authModule.getAuth(app);
  const db = firestoreModule.getFirestore(app);
  state.api = { auth, db, authModule, firestoreModule };
  $("#connectionState").textContent = "Firebase 연결";
  $("#connectionState").classList.add("online");
  return state.api;
}

async function enterStudent(studentId) {
  state.role = "student";
  state.studentId = studentId.trim();
  if (!state.studentId) return;

  if (configured) {
    const { auth, db, authModule, firestoreModule: fs } = state.api;
    if (!auth.currentUser) await authModule.signInAnonymously(auth);
    await fs.setDoc(fs.doc(db, "classes", classId, "students", state.studentId), {
      studentId: state.studentId,
      uid: auth.currentUser.uid,
      online: true,
      currentPage: 0,
      progress: 0,
      chars: 0,
      animal: "",
      answers: {},
      updatedAt: fs.serverTimestamp()
    }, { merge: true });
  } else {
    const data = demoData();
    data.students[state.studentId] = {
      studentId: state.studentId, online: true, currentPage: 0,
      progress: 0, chars: 0, animal: "", answers: {}, updatedAt: Date.now()
    };
    saveDemo(data);
  }

  showStudio("student", `학생 ${state.studentId}`);
  subscribeStudent();
  window.addEventListener("beforeunload", markOffline);
}

async function enterTeacher(email, password) {
  state.role = "teacher";
  if (configured) {
    const { auth, authModule } = state.api;
    await authModule.signInWithEmailAndPassword(auth, email, password);
  } else if (!email || !password) {
    throw new Error("강사 이메일과 비밀번호를 입력해 주세요.");
  }
  showStudio("teacher", "강사 계정");
  subscribeRoster();
}

function showStudio(role, label) {
  $("#entrance").hidden = true;
  $("#studio").hidden = false;
  $("#studentView").hidden = role !== "student";
  $("#teacherView").hidden = role !== "teacher";
  $("#sessionName").textContent = label;
}

async function markOffline() {
  if (state.role !== "student" || !state.studentId) return;
  if (configured && state.api) {
    const { db, firestoreModule: fs } = state.api;
    await fs.setDoc(fs.doc(db, "classes", classId, "students", state.studentId), {
      online: false, updatedAt: fs.serverTimestamp()
    }, { merge: true });
  } else {
    const data = demoData();
    if (data.students[state.studentId]) {
      data.students[state.studentId].online = false;
      data.students[state.studentId].updatedAt = Date.now();
      saveDemo(data);
    }
  }
}

async function logout() {
  await markOffline();
  state.unsubscribers.forEach(unsubscribe => unsubscribe?.());
  state.unsubscribers = [];
  if (configured && state.api?.auth.currentUser) await state.api.authModule.signOut(state.api.auth);
  location.reload();
}

async function updateProgress(progress) {
  if (state.role !== "student") return;
  const entry = {
    studentId: state.studentId,
    online: true,
    currentPage: progress.activePage,
    progress: progress.progress,
    chars: progress.chars,
    animal: progress.animal,
    answers: progress.answers,
    updatedAt: Date.now()
  };
  if (configured) {
    const { db, firestoreModule: fs } = state.api;
    await fs.setDoc(fs.doc(db, "classes", classId, "students", state.studentId), {
      ...entry, updatedAt: fs.serverTimestamp()
    }, { merge: true });
  } else {
    const data = demoData();
    data.students[state.studentId] = entry;
    saveDemo(data);
  }
}

function subscribeStudent() {
  if (configured) {
    const { db, firestoreModule: fs } = state.api;
    const messagesRef = fs.collection(db, "classes", classId, "students", state.studentId, "messages");
    state.unsubscribers.push(fs.onSnapshot(fs.query(messagesRef, fs.orderBy("createdAt", "desc"), fs.limit(20)), snapshot => {
      state.messages = snapshot.docs.map(item => ({ id: item.id, ...item.data() }));
      renderStudentMessages();
    }));
    state.unsubscribers.push(fs.onSnapshot(fs.doc(db, "classes", classId, "students", state.studentId, "shared", "board"), snapshot => {
      state.board = snapshot.data()?.image || "";
      renderStudentBoard();
    }));
  } else {
    refreshDemoStudent();
    channel?.addEventListener("message", refreshDemoStudent);
    window.addEventListener("storage", refreshDemoStudent);
  }
}

function refreshDemoStudent() {
  const data = demoData();
  state.messages = data.messages[state.studentId] || [];
  state.board = data.boards[state.studentId] || "";
  renderStudentMessages();
  renderStudentBoard();
}

function renderStudentMessages() {
  const list = $("#studentMessages");
  const messages = [...state.messages].sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0));
  list.innerHTML = messages.length ? messages.map(item => `
    <article class="message-item">
      <p>${escapeHtml(item.text)}</p>
      <time>${formatTime(item.createdAt)}</time>
    </article>`).join("") : `<p class="section-label">아직 받은 메시지가 없어요.</p>`;
  $("#latestMessage").innerHTML = `<p>${messages.length ? escapeHtml(messages[0].text) : "선생님이 보내는 안내와 응원 메시지가 여기에 표시됩니다."}</p>`;
}

function renderStudentBoard() {
  const canvas = $("#studentBoard");
  const context = canvas.getContext("2d");
  context.clearRect(0, 0, canvas.width, canvas.height);
  $("#boardEmpty").hidden = Boolean(state.board);
  if (!state.board) return;
  const image = new Image();
  image.onload = () => context.drawImage(image, 0, 0, canvas.width, canvas.height);
  image.src = state.board;
}

function subscribeRoster() {
  if (configured) {
    const { db, firestoreModule: fs } = state.api;
    state.unsubscribers.push(fs.onSnapshot(fs.collection(db, "classes", classId, "students"), snapshot => {
      state.students = new Map(snapshot.docs.map(item => [item.id, { id: item.id, ...item.data() }]));
      renderRoster();
      if (state.selectedStudentId) selectStudent(state.selectedStudentId);
    }));
  } else {
    refreshDemoRoster();
    channel?.addEventListener("message", refreshDemoRoster);
    window.addEventListener("storage", refreshDemoRoster);
  }
}

function refreshDemoRoster() {
  const students = demoData().students || {};
  state.students = new Map(Object.entries(students).map(([id, value]) => [id, { id, ...value }]));
  renderRoster();
  if (state.selectedStudentId) selectStudent(state.selectedStudentId);
}

function renderRoster() {
  const query = $("#studentSearch").value.trim();
  const students = [...state.students.values()]
    .filter(student => !query || student.id.includes(query))
    .sort((a, b) => Number(b.online) - Number(a.online) || a.id.localeCompare(b.id));
  $("#onlineCount").textContent = `${students.filter(item => item.online).length}명 접속`;
  $("#studentList").innerHTML = students.length ? students.map(student => `
    <button class="student-row ${student.online ? "online" : ""} ${student.id === state.selectedStudentId ? "active" : ""}" data-student="${escapeHtml(student.id)}">
      <span class="status-dot"></span>
      <span><strong>${escapeHtml(student.id)}</strong><small>${student.online ? " 활동 중" : " 오프라인"}</small></span>
      <b>${Number(student.progress || 0)}%</b>
    </button>`).join("") : `<p class="section-label">입장한 학생이 없습니다.</p>`;
}

function selectStudent(studentId) {
  const student = state.students.get(studentId);
  if (!student) return;
  state.selectedStudentId = studentId;
  $("#emptyMonitor").hidden = true;
  $("#monitorContent").hidden = false;
  $("#selectedStudent").textContent = `학생 ${studentId}`;
  $("#selectedPresence").textContent = student.online ? "온라인" : "오프라인";
  $("#selectedPresence").classList.toggle("online", Boolean(student.online));
  $("#metricPage").textContent = pageNames[Number(student.currentPage || 0)] || `${student.currentPage || 0}단계`;
  $("#metricProgress").textContent = `${Number(student.progress || 0)}%`;
  $("#metricChars").textContent = `${Number(student.chars || 0)}자`;
  $("#metricAnimal").textContent = student.animal || "-";
  $("#lastUpdated").textContent = formatTime(student.updatedAt);
  const answers = Object.entries(student.answers || {}).sort(([a], [b]) => Number(a) - Number(b));
  $("#answerPreview").textContent = answers.length
    ? answers.map(([step, text]) => `${step}단계\n${text || "(아직 작성하지 않음)"}`).join("\n\n")
    : "학생이 글을 쓰기 시작하면 여기에 표시됩니다.";
  $("#sendMessageButton").disabled = false;
  $("#sendBoardButton").disabled = false;
  renderRoster();
}

async function sendMessage() {
  const text = $("#teacherMessage").value.trim();
  if (!state.selectedStudentId || !text) return;
  if (configured) {
    const { db, firestoreModule: fs } = state.api;
    await fs.addDoc(fs.collection(db, "classes", classId, "students", state.selectedStudentId, "messages"), {
      text, createdAt: fs.serverTimestamp(), sender: state.api.auth.currentUser?.email || "teacher"
    });
  } else {
    const data = demoData();
    data.messages[state.selectedStudentId] ||= [];
    data.messages[state.selectedStudentId].unshift({ text, createdAt: Date.now(), sender: "teacher" });
    saveDemo(data);
  }
  $("#teacherMessage").value = "";
  setConsoleStatus(`학생 ${state.selectedStudentId}에게 메시지를 보냈습니다.`);
}

async function sendBoard() {
  if (!state.selectedStudentId) return;
  const image = $("#teacherBoard").toDataURL("image/png");
  if (configured) {
    const { db, firestoreModule: fs } = state.api;
    await fs.setDoc(fs.doc(db, "classes", classId, "students", state.selectedStudentId, "shared", "board"), {
      image, updatedAt: fs.serverTimestamp(), sender: state.api.auth.currentUser?.email || "teacher"
    });
  } else {
    const data = demoData();
    data.boards[state.selectedStudentId] = image;
    saveDemo(data);
  }
  setConsoleStatus(`학생 ${state.selectedStudentId}에게 판서를 보냈습니다.`);
}

function setupBoard() {
  const canvas = $("#teacherBoard");
  const context = canvas.getContext("2d");
  context.lineCap = "round";
  context.lineJoin = "round";

  const point = event => {
    const bounds = canvas.getBoundingClientRect();
    const source = event.touches?.[0] || event;
    return {
      x: (source.clientX - bounds.left) * canvas.width / bounds.width,
      y: (source.clientY - bounds.top) * canvas.height / bounds.height
    };
  };
  const start = event => {
    event.preventDefault();
    state.drawing = true;
    const p = point(event);
    context.beginPath();
    context.moveTo(p.x, p.y);
  };
  const draw = event => {
    if (!state.drawing) return;
    event.preventDefault();
    const p = point(event);
    context.strokeStyle = state.brushColor;
    context.lineWidth = state.brushSize;
    context.lineTo(p.x, p.y);
    context.stroke();
  };
  const end = () => state.drawing = false;
  canvas.addEventListener("pointerdown", start);
  canvas.addEventListener("pointermove", draw);
  window.addEventListener("pointerup", end);
  canvas.addEventListener("touchstart", start, { passive: false });
  canvas.addEventListener("touchmove", draw, { passive: false });
  window.addEventListener("touchend", end);
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, character => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[character]);
}

function formatTime(value) {
  if (!value) return "아직 기록 없음";
  const date = value?.toDate ? value.toDate() : new Date(value);
  if (Number.isNaN(date.getTime())) return "방금 전";
  return new Intl.DateTimeFormat("ko-KR", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(date);
}

$("#showTeacher").addEventListener("click", () => {
  $("#studentLogin").hidden = true;
  $("#showTeacher").hidden = true;
  $("#teacherLogin").hidden = false;
  $("#teacherEmail").focus();
});
$("#showStudent").addEventListener("click", () => {
  $("#teacherLogin").hidden = true;
  $("#studentLogin").hidden = false;
  $("#showTeacher").hidden = false;
  $("#studentNumber").focus();
});
$("#studentLogin").addEventListener("submit", async event => {
  event.preventDefault();
  setStatus("입장하는 중입니다.");
  try { await enterStudent($("#studentNumber").value); } catch (error) { setStatus(error.message || "입장하지 못했습니다.", true); }
});
$("#teacherLogin").addEventListener("submit", async event => {
  event.preventDefault();
  setStatus("강사 콘솔을 여는 중입니다.");
  try { await enterTeacher($("#teacherEmail").value, $("#teacherPassword").value); } catch (error) { setStatus(error.message || "강사 로그인을 확인해 주세요.", true); }
});
$("#logoutButton").addEventListener("click", logout);
$("#studentSearch").addEventListener("input", renderRoster);
$("#studentList").addEventListener("click", event => {
  const button = event.target.closest("[data-student]");
  if (button) selectStudent(button.dataset.student);
});
$("#sendMessageButton").addEventListener("click", sendMessage);
$("#sendBoardButton").addEventListener("click", sendBoard);
$("#clearBoard").addEventListener("click", () => {
  const canvas = $("#teacherBoard");
  canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
});
document.querySelectorAll(".quick-messages button").forEach(button => button.addEventListener("click", () => {
  $("#teacherMessage").value = button.dataset.message;
  $("#teacherMessage").focus();
}));
document.querySelectorAll(".color-tool").forEach(button => button.addEventListener("click", () => {
  document.querySelectorAll(".color-tool").forEach(item => item.classList.remove("active"));
  button.classList.add("active");
  state.brushColor = button.dataset.color;
}));
$("#brushSize").addEventListener("input", event => state.brushSize = Number(event.target.value));
window.addEventListener("message", event => {
  if (event.origin !== window.location.origin || event.data?.type !== "oncuvate-progress") return;
  updateProgress(event.data);
});

setupBoard();
initFirebase().catch(error => setStatus(`Firebase 설정을 확인해 주세요: ${error.message}`, true));

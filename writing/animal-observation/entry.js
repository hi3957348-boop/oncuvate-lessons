const lessonUrl = "./lesson.html";
const options = document.getElementById("entryOptions");
const codeForm = document.getElementById("codeForm");
const classCode = document.getElementById("classCode");
const studentNumber = document.getElementById("studentNumber");
const formStatus = document.getElementById("formStatus");

document.getElementById("selfEntry").addEventListener("click", () => {
  sessionStorage.setItem("oncuvate_entry", JSON.stringify({
    lessonId: "animal-observation-01",
    topicId: "animal",
    genreId: "observation_description",
    mode: "self",
    enteredAt: new Date().toISOString()
  }));
  location.href = `${lessonUrl}?mode=self`;
});

document.getElementById("liveEntry").addEventListener("click", () => {
  options.hidden = true;
  codeForm.hidden = false;
  classCode.focus();
});

document.getElementById("backToOptions").addEventListener("click", () => {
  codeForm.hidden = true;
  options.hidden = false;
  formStatus.textContent = "";
});

classCode.addEventListener("input", () => {
  classCode.value = classCode.value.replace(/\D/g, "").slice(0, 5);
});

studentNumber.addEventListener("input", () => {
  studentNumber.value = studentNumber.value.replace(/\D/g, "").slice(0, 12);
});

codeForm.addEventListener("submit", event => {
  event.preventDefault();
  if (!/^\d{5}$/.test(classCode.value)) {
    formStatus.textContent = "수업 코드는 숫자 5자리로 입력해 주세요.";
    classCode.focus();
    return;
  }
  if (!studentNumber.value.trim()) {
    formStatus.textContent = "학생번호를 입력해 주세요.";
    studentNumber.focus();
    return;
  }
  const entry = {
    lessonId: "animal-observation-01",
    topicId: "animal",
    genreId: "observation_description",
    mode: "live",
    classCode: classCode.value,
    studentNumber: studentNumber.value,
    enteredAt: new Date().toISOString()
  };
  sessionStorage.setItem("oncuvate_entry", JSON.stringify(entry));
  location.href = `${lessonUrl}?mode=live&code=${encodeURIComponent(entry.classCode)}&student=${encodeURIComponent(entry.studentNumber)}`;
});

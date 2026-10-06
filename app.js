const MODES = {
  focus: { label: "Focus", caption: "TIME TO FOCUS", seconds: 25 * 60 },
  short: { label: "Short break", caption: "SHORT BREAK", seconds: 5 * 60 },
  long: { label: "Long break", caption: "LONG BREAK", seconds: 15 * 60 },
};

const STORAGE_KEY = "little-focus-state";
const ring = document.querySelector(".ring-progress");
const display = document.querySelector("#timer-display");
const caption = document.querySelector("#timer-caption");
const hint = document.querySelector("#timer-hint");
const startButton = document.querySelector("#start-button");
const sessionCount = document.querySelector("#session-count");
const cycleCount = document.querySelector("#cycle-count");
const modeButtons = [...document.querySelectorAll(".mode-button")];
const circumference = 2 * Math.PI * 108;

let savedState;
try {
  savedState = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
} catch {
  savedState = {};
}

let mode = MODES[savedState.mode] ? savedState.mode : "focus";
let completedSessions = Number.isInteger(savedState.completedSessions) && savedState.completedSessions >= 0
  ? savedState.completedSessions
  : 0;
let remainingSeconds = MODES[mode].seconds;
let endsAt = null;
let intervalId = null;

ring.style.strokeDasharray = String(circumference);

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ mode, completedSessions }));
  } catch {
    // The timer remains usable when browser storage is unavailable.
  }
}

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
  const remainder = (seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${remainder}`;
}

function render() {
  const duration = MODES[mode].seconds;
  display.textContent = formatTime(remainingSeconds);
  caption.textContent = MODES[mode].caption;
  ring.style.strokeDashoffset = String(circumference * (1 - remainingSeconds / duration));
  document.title = `${formatTime(remainingSeconds)} — ${MODES[mode].label} | little focus`;
  startButton.querySelector("span:last-child").textContent = intervalId
    ? "Pause timer"
    : mode === "focus" ? "Start focus" : "Start break";
  startButton.querySelector(".play-icon").textContent = intervalId ? "Ⅱ" : "▶";
  hint.textContent = intervalId ? "You’re doing great. Keep going." : "Ready when you are";
  sessionCount.textContent = String(completedSessions);
  cycleCount.textContent = `${completedSessions % 4} of 4`;
  modeButtons.forEach((button) => {
    const selected = button.dataset.mode === mode;
    button.classList.toggle("is-selected", selected);
    button.setAttribute("aria-pressed", String(selected));
  });
}

function stopTimer() {
  if (intervalId !== null) {
    window.clearInterval(intervalId);
    intervalId = null;
  }
  endsAt = null;
}

function switchMode(nextMode) {
  stopTimer();
  mode = nextMode;
  remainingSeconds = MODES[mode].seconds;
  saveState();
  render();
}

function tick() {
  remainingSeconds = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
  if (remainingSeconds === 0) {
    stopTimer();
    if (mode === "focus") {
      completedSessions += 1;
      mode = completedSessions % 4 === 0 ? "long" : "short";
      remainingSeconds = MODES[mode].seconds;
      hint.textContent = "Focus session complete. Take a well-earned break.";
    } else {
      mode = "focus";
      remainingSeconds = MODES[mode].seconds;
      hint.textContent = "Break complete. Ready for another focus session?";
    }
    saveState();
    render();
    hint.textContent = mode === "focus"
      ? "Break complete. Ready for another focus session?"
      : "Focus session complete. Take a well-earned break.";
    return;
  }
  render();
}

function startTimer() {
  if (intervalId !== null) {
    remainingSeconds = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
    stopTimer();
    render();
    return;
  }
  endsAt = Date.now() + remainingSeconds * 1000;
  intervalId = window.setInterval(tick, 250);
  render();
}

startButton.addEventListener("click", startTimer);
document.querySelector("#reset-button").addEventListener("click", () => {
  stopTimer();
  remainingSeconds = MODES[mode].seconds;
  render();
});

modeButtons.forEach((button) => {
  button.addEventListener("click", () => switchMode(button.dataset.mode));
});

render();

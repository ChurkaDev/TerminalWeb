const terminalWindow = document.querySelector("#terminalWindow");
const titleBar = document.querySelector("#titleBar");
const terminalBody = document.querySelector("#terminalBody");
const terminalOutput = document.querySelector("#terminalOutput");
const terminalForm = document.querySelector("#terminalForm");
const terminalInput = document.querySelector("#terminalInput");
const promptLabel = document.querySelector("#promptLabel");
const resizeHandles = document.querySelectorAll("[data-resize]");

const cISLanguagePrefixes = ["ru", "kk", "uk", "be", "uz", "ky", "tg", "az", "hy", "ka", "mo"];
const cISTimeZones = [
  "Europe/Moscow",
  "Europe/Minsk",
  "Europe/Kyiv",
  "Asia/Almaty",
  "Asia/Aqtau",
  "Asia/Aqtobe",
  "Asia/Atyrau",
  "Asia/Oral",
  "Asia/Qostanay",
  "Asia/Bishkek",
  "Asia/Tashkent",
  "Asia/Samarkand",
  "Asia/Dushanbe",
  "Asia/Ashgabat",
  "Asia/Yerevan",
  "Asia/Baku",
  "Asia/Tbilisi"
];

function detectLanguage() {
  const languages = navigator.languages?.length ? navigator.languages : [navigator.language || "en"];
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const hasCISLanguage = languages.some((language) => cISLanguagePrefixes.includes(language.toLowerCase().split("-")[0]));
  const hasCISTimeZone = cISTimeZones.includes(timeZone);

  return hasCISLanguage || hasCISTimeZone ? "ru" : "en";
}

const language = detectLanguage();

const messages = {
  ru: {
    fallbackProjects: [
      "Репозитории GitHub пока не загрузились",
      "Проверь username в profile.githubUser или лимиты GitHub API"
    ],
    help: [
      "Доступные команды:",
      "  help      показать список команд",
      "  neofetch  вывести профиль системы",
      "  projects  показать открытые репозитории GitHub",
      "  stack     показать технологии",
      "  contact   показать контакт",
      "  snake     запустить змейку в терминале",
      "  clear     очистить терминал"
    ],
    neofetchHint: "Введите help, чтобы увидеть доступные команды.",
    projectsTitle: "Открытые репозитории:",
    snakeRestart: "Новая змейка запущена заново.",
    snakeInput: "snake запущена: WASD/стрелки, q — выход",
    snakeHeader: (score) => `Snake — score: ${score} | WASD/стрелки, q — выход`,
    snakeGameOver: "Игра окончена.",
    snakeCrash: "Змейка разбилась.",
    snakeWin: "Победа.",
    snakeStop: "Змейка остановлена.",
    githubUnavailable: "GitHub API недоступен",
    githubConnect: "Подключение к GitHub API...",
    sessionOpen: "Сессия открыта. Добро пожаловать в Arch.",
    commandNotFound: (command) => `Команда не найдена: ${command}. Введите help.`
  },
  en: {
    fallbackProjects: [
      "GitHub repositories have not loaded yet",
      "Check profile.githubUser or GitHub API rate limits"
    ],
    help: [
      "Available commands:",
      "  help      show command list",
      "  neofetch  show system profile",
      "  projects  show public GitHub repositories",
      "  stack     show technologies",
      "  contact   show contact",
      "  snake     start snake in the terminal",
      "  clear     clear terminal"
    ],
    neofetchHint: "Type help to see available commands.",
    projectsTitle: "Public repositories:",
    snakeRestart: "Snake restarted.",
    snakeInput: "snake started: WASD/arrows, q — quit",
    snakeHeader: (score) => `Snake — score: ${score} | WASD/arrows, q — quit`,
    snakeGameOver: "Game over.",
    snakeCrash: "Snake crashed.",
    snakeWin: "You won.",
    snakeStop: "Snake stopped.",
    githubUnavailable: "GitHub API is unavailable",
    githubConnect: "Connecting to GitHub API...",
    sessionOpen: "Session opened. Welcome to Arch.",
    commandNotFound: (command) => `Command not found: ${command}. Type help.`
  }
};

const text = messages[language];

const profile = {
  name: "ChurkaDev",
  login: "guest@arch",
  githubUser: "ChurkaDev",
  os: "Arch Linux x86_64",
  shell: "zsh 5.9",
  stack: ["Java", "Kotlin", "Python", "Frontend: HTML, CSS, JavaScript, TypeScript"],
  contact: "orkensabyrzhan@gmail.com",
  projects: []
};

const fallbackProjects = text.fallbackProjects;

const commands = {
  help: text.help,
  neofetch: createNeofetch,
  projects: createProjectsOutput,
  stack: () => ["Stack:", ...profile.stack.map((item) => `  • ${item}`)],
  contact: () => ["Contact:", `  ${profile.contact}`],
  snake: startSnake
};

let isBooting = true;
let dragState = null;
let resizeState = null;
let wobbleId = 0;
let snakeState = null;
let commandHistory = [];
let historyIndex = 0;

const wobble = {
  x: 0,
  y: 0,
  vx: 0,
  vy: 0,
  targetX: 0,
  targetY: 0,
  active: false
};

promptLabel.textContent = getPrompt();

function createNeofetch() {
  return [
    "            /\\                  " + `${profile.name}@github`,
    "           /  \\                 " + "----------------",
    "          /    \\                " + `OS: ${profile.os}`,
    "         _\\     \\              " + `Shell: ${profile.shell}`,
    "        /        \\             " + `Stack: ${profile.stack.slice(0, 3).join(", ")}`,
    "       /          \\            " + `Repos: ${profile.projects.length || "loading"}`,
    "      /     __   \\_\\           " + `Contact: ${profile.contact}`,
    "     /     /  \\     \\          ",
    "    /__,--'    '--,__\\         ",
    "",
    text.neofetchHint
  ];
}

function createProjectsOutput() {
  const projects = profile.projects.length ? profile.projects : fallbackProjects;

  return [
    text.projectsTitle,
    ...projects.map((project, index) => `  ${index + 1}. ${project}`)
  ];
}

function startSnake() {
  if (snakeState) {
    stopSnake(text.snakeRestart);
  }

  const gameLine = appendLine("", "line snake-game");
  snakeState = {
    width: 24,
    height: 12,
    snake: [{ x: 5, y: 6 }, { x: 4, y: 6 }, { x: 3, y: 6 }],
    food: { x: 14, y: 6 },
    direction: { x: 1, y: 0 },
    nextDirection: { x: 1, y: 0 },
    score: 0,
    line: gameLine,
    timer: 0
  };

  terminalInput.contentEditable = "false";
  terminalInput.textContent = text.snakeInput;
  terminalInput.focus({ preventScroll: true });
  renderSnake();
  snakeState.timer = window.setInterval(tickSnake, 115);
}

function stopSnake(message = text.snakeGameOver) {
  if (!snakeState) {
    return;
  }

  window.clearInterval(snakeState.timer);
  appendLine(`${message} Score: ${snakeState.score}`, "line accent");
  snakeState = null;
  terminalInput.textContent = "";
  terminalInput.contentEditable = "true";
  focusTerminal();
}

function renderSnake() {
  if (!snakeState) {
    return;
  }

  const { width, height, snake, food, score, line } = snakeState;
  const body = new Set(snake.map((part) => `${part.x}:${part.y}`));
  const rows = [];

  rows.push(text.snakeHeader(score));
  rows.push(`┌${"─".repeat(width)}┐`);

  for (let y = 0; y < height; y += 1) {
    let row = "│";

    for (let x = 0; x < width; x += 1) {
      const isHead = snake[0].x === x && snake[0].y === y;
      const isFood = food.x === x && food.y === y;

      if (isHead) {
        row += "●";
      } else if (isFood) {
        row += "◆";
      } else if (body.has(`${x}:${y}`)) {
        row += "○";
      } else {
        row += " ";
      }
    }

    row += "│";
    rows.push(row);
  }

  rows.push(`└${"─".repeat(width)}┘`);
  line.textContent = rows.join("\n");
  scrollToBottom();
}

function tickSnake() {
  if (!snakeState) {
    return;
  }

  snakeState.direction = snakeState.nextDirection;
  const head = snakeState.snake[0];
  const nextHead = {
    x: head.x + snakeState.direction.x,
    y: head.y + snakeState.direction.y
  };

  const hitWall = nextHead.x < 0 || nextHead.x >= snakeState.width || nextHead.y < 0 || nextHead.y >= snakeState.height;
  const hitSelf = snakeState.snake.some((part) => part.x === nextHead.x && part.y === nextHead.y);

  if (hitWall || hitSelf) {
    stopSnake(text.snakeCrash);
    return;
  }

  snakeState.snake.unshift(nextHead);

  if (nextHead.x === snakeState.food.x && nextHead.y === snakeState.food.y) {
    snakeState.score += 1;
    placeSnakeFood();
  } else {
    snakeState.snake.pop();
  }

  renderSnake();
}

function placeSnakeFood() {
  const occupied = new Set(snakeState.snake.map((part) => `${part.x}:${part.y}`));
  const freeCells = [];

  for (let y = 0; y < snakeState.height; y += 1) {
    for (let x = 0; x < snakeState.width; x += 1) {
      if (!occupied.has(`${x}:${y}`)) {
        freeCells.push({ x, y });
      }
    }
  }

  if (!freeCells.length) {
    stopSnake(text.snakeWin);
    return;
  }

  snakeState.food = freeCells[Math.floor(Math.random() * freeCells.length)];
}

function setSnakeDirection(x, y) {
  if (!snakeState) {
    return false;
  }

  const current = snakeState.direction;

  if (current.x + x === 0 && current.y + y === 0) {
    return true;
  }

  snakeState.nextDirection = { x, y };
  return true;
}

async function loadGithubProjects() {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 2800);

  try {
    const response = await fetch(`https://api.github.com/users/${profile.githubUser}/repos?sort=updated&per_page=100`, {
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(text.githubUnavailable);
    }

    const repos = await response.json();
    profile.projects = repos
      .filter((repo) => !repo.fork)
      .map((repo) => {
        const language = repo.language ? ` · ${repo.language}` : "";
        const description = repo.description ? ` — ${repo.description}` : "";
        return `${repo.name}${language}${description}`;
      });
  } catch (error) {
    profile.projects = [];
  } finally {
    window.clearTimeout(timeoutId);
  }
}

function appendLine(text = "", className = "line") {
  const line = document.createElement("div");
  line.className = className;
  line.textContent = text;
  terminalOutput.append(line);
  scrollToBottom();
  return line;
}

function appendLines(lines, className = "line") {
  lines.forEach((line) => appendLine(line, className));
}

async function appendLinesAnimated(lines, className = "line", delay = 72) {
  for (const line of lines) {
    appendLine(line, className);
    await wait(delay + Math.random() * 38);
  }
}

function scrollToBottom() {
  terminalBody.scrollTop = terminalBody.scrollHeight;
}

function wait(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function setTerminalInput(value) {
  terminalInput.textContent = value;
  moveCaretToEnd();
}

function getTerminalInput() {
  return terminalInput.textContent.replace(/\n/g, "");
}

function moveCaretToEnd() {
  const range = document.createRange();
  const selection = window.getSelection();

  range.selectNodeContents(terminalInput);
  range.collapse(false);
  selection.removeAllRanges();
  selection.addRange(range);
}

async function typeCommand(command) {
  setTerminalInput("");

  for (const char of command) {
    terminalInput.textContent += char;
    moveCaretToEnd();
    await wait(36 + Math.random() * 30);
  }

  await wait(200);
  appendLine(`${getPrompt()} ${command}`, "line command");
  setTerminalInput("");
}

async function bootTerminal() {
  terminalInput.contentEditable = "false";
  await wait(260);
  appendLine(text.githubConnect, "line dim");
  await loadGithubProjects();
  appendLine(text.sessionOpen, "line accent");
  await wait(320);
  await typeCommand("neofetch");
  await appendLinesAnimated(createNeofetch(), "line", 58);
  isBooting = false;
  terminalInput.contentEditable = "true";
  focusTerminal();
}

function getPrompt() {
  return `${profile.login}:~$`;
}

function focusTerminal() {
  if (!isBooting) {
    terminalInput.focus({ preventScroll: true });
    moveCaretToEnd();
  }
}

function runCommand(rawCommand) {
  const input = rawCommand.trim();
  appendLine(`${getPrompt()} ${rawCommand}`, "line command");

  if (!input) {
    return;
  }

  const [commandName] = input.toLowerCase().split(/\s+/);

  if (commandName === "clear") {
    if (snakeState) {
      stopSnake(text.snakeStop);
    }

    terminalOutput.replaceChildren();
    return;
  }

  const command = commands[commandName];

  if (!command) {
    appendLine(text.commandNotFound(commandName), "line error");
    return;
  }

  const result = typeof command === "function" ? command(input) : command;

  if (Array.isArray(result)) {
    appendLines(result, "line");
  }
}

function placeWindow(rect) {
  terminalWindow.classList.add("placed");
  terminalWindow.style.width = `${rect.width}px`;
  terminalWindow.style.height = `${rect.height}px`;
  terminalWindow.style.left = `${rect.left}px`;
  terminalWindow.style.top = `${rect.top}px`;
}

function keepWindowInViewport() {
  const rect = terminalWindow.getBoundingClientRect();
  const width = Math.min(rect.width, window.innerWidth);
  const height = Math.min(rect.height, window.innerHeight);
  const maxLeft = Math.max(0, window.innerWidth - width);
  const maxTop = Math.max(0, window.innerHeight - height);

  terminalWindow.style.width = `${width}px`;
  terminalWindow.style.height = `${height}px`;
  terminalWindow.style.left = `${Math.min(Math.max(rect.left, 0), maxLeft)}px`;
  terminalWindow.style.top = `${Math.min(Math.max(rect.top, 0), maxTop)}px`;
  terminalWindow.classList.add("placed");
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function startWobble() {
  if (wobble.active) {
    return;
  }

  wobble.active = true;

  function tick() {
    const spring = 0.17;
    const damping = 0.78;

    wobble.vx += (wobble.targetX - wobble.x) * spring;
    wobble.vy += (wobble.targetY - wobble.y) * spring;
    wobble.vx *= damping;
    wobble.vy *= damping;
    wobble.x += wobble.vx;
    wobble.y += wobble.vy;

    terminalWindow.style.setProperty("--wobble-x", wobble.x.toFixed(4));
    terminalWindow.style.setProperty("--wobble-y", wobble.y.toFixed(4));

    const almostStill = Math.abs(wobble.x) + Math.abs(wobble.y) + Math.abs(wobble.vx) + Math.abs(wobble.vy) < 0.001;

    if (!dragState && almostStill) {
      wobble.active = false;
      wobble.x = 0;
      wobble.y = 0;
      terminalWindow.style.setProperty("--wobble-x", "0");
      terminalWindow.style.setProperty("--wobble-y", "0");
      return;
    }

    wobbleId = window.requestAnimationFrame(tick);
  }

  wobbleId = window.requestAnimationFrame(tick);
}

function setWobbleTarget(deltaX, deltaY) {
  wobble.targetX = clamp(deltaX * -0.0027, -0.032, 0.032);
  wobble.targetY = clamp(deltaY * 0.0015, -0.022, 0.022);
  startWobble();
}

function releaseWobble() {
  wobble.targetX = 0;
  wobble.targetY = 0;
  startWobble();
}

function startDrag(event) {
  if (event.button !== undefined && event.button !== 0) {
    return;
  }

  event.preventDefault();
  const rect = terminalWindow.getBoundingClientRect();
  dragState = {
    pointerId: event.pointerId,
    shiftX: event.clientX - rect.left,
    shiftY: event.clientY - rect.top,
    width: rect.width,
    height: rect.height,
    lastX: rect.left,
    lastY: rect.top
  };

  placeWindow(rect);
  terminalWindow.classList.add("dragging");
  titleBar.setPointerCapture(event.pointerId);
  startWobble();
}

function moveDrag(event) {
  if (!dragState || dragState.pointerId !== event.pointerId) {
    return;
  }

  const maxLeft = Math.max(0, window.innerWidth - dragState.width);
  const maxTop = Math.max(0, window.innerHeight - dragState.height);
  const nextLeft = Math.min(Math.max(event.clientX - dragState.shiftX, 0), maxLeft);
  const nextTop = Math.min(Math.max(event.clientY - dragState.shiftY, 0), maxTop);

  terminalWindow.style.left = `${nextLeft}px`;
  terminalWindow.style.top = `${nextTop}px`;
  setWobbleTarget(nextLeft - dragState.lastX, nextTop - dragState.lastY);
  dragState.lastX = nextLeft;
  dragState.lastY = nextTop;
}

function stopDrag(event) {
  if (!dragState || dragState.pointerId !== event.pointerId) {
    return;
  }

  titleBar.releasePointerCapture(event.pointerId);
  terminalWindow.classList.remove("dragging");
  dragState = null;
  releaseWobble();
}

function startResize(event) {
  if (event.button !== undefined && event.button !== 0) {
    return;
  }

  event.preventDefault();
  event.stopPropagation();
  const rect = terminalWindow.getBoundingClientRect();

  resizeState = {
    pointerId: event.pointerId,
    handle: event.currentTarget,
    direction: event.currentTarget.dataset.resize,
    startX: event.clientX,
    startY: event.clientY,
    startWidth: rect.width,
    startHeight: rect.height,
    left: rect.left,
    top: rect.top
  };

  placeWindow(rect);
  terminalWindow.classList.add("resizing");
  event.currentTarget.setPointerCapture(event.pointerId);
}

function moveResize(event) {
  if (!resizeState || resizeState.pointerId !== event.pointerId) {
    return;
  }

  const minWidth = Number.parseInt(getComputedStyle(terminalWindow).minWidth, 10);
  const minHeight = Number.parseInt(getComputedStyle(terminalWindow).minHeight, 10);
  const maxWidth = Math.max(minWidth, window.innerWidth - resizeState.left);
  const maxHeight = Math.max(minHeight, window.innerHeight - resizeState.top);
  const deltaX = event.clientX - resizeState.startX;
  const deltaY = event.clientY - resizeState.startY;

  if (resizeState.direction === "right" || resizeState.direction === "corner") {
    terminalWindow.style.width = `${Math.min(Math.max(resizeState.startWidth + deltaX, minWidth), maxWidth)}px`;
  }

  if (resizeState.direction === "bottom" || resizeState.direction === "corner") {
    terminalWindow.style.height = `${Math.min(Math.max(resizeState.startHeight + deltaY, minHeight), maxHeight)}px`;
  }
}

function stopResize(event) {
  if (!resizeState || resizeState.pointerId !== event.pointerId) {
    return;
  }

  resizeState.handle.releasePointerCapture(event.pointerId);
  terminalWindow.classList.remove("resizing");
  resizeState = null;
  keepWindowInViewport();
}

function handleSnakeKey(event) {
  if (!snakeState) {
    return false;
  }

  const key = event.key.toLowerCase();
  const handled =
    (key === "arrowup" || key === "w") ? setSnakeDirection(0, -1) :
    (key === "arrowdown" || key === "s") ? setSnakeDirection(0, 1) :
    (key === "arrowleft" || key === "a") ? setSnakeDirection(-1, 0) :
    (key === "arrowright" || key === "d") ? setSnakeDirection(1, 0) :
    false;

  if (handled) {
    event.preventDefault();
    return true;
  }

  if (key === "q" || key === "escape") {
    event.preventDefault();
    stopSnake(text.snakeStop);
    return true;
  }

  event.preventDefault();
  return true;
}

function browseHistory(step) {
  if (!commandHistory.length) {
    return;
  }

  historyIndex = Math.min(Math.max(historyIndex + step, 0), commandHistory.length);
  setTerminalInput(commandHistory[historyIndex] || "");
}

function rememberCommand(command) {
  const trimmed = command.trim();

  if (!trimmed) {
    historyIndex = commandHistory.length;
    return;
  }

  if (commandHistory[commandHistory.length - 1] !== trimmed) {
    commandHistory.push(trimmed);
  }

  historyIndex = commandHistory.length;
}

terminalForm.addEventListener("submit", (event) => {
  event.preventDefault();

  if (isBooting) {
    return;
  }

  const command = getTerminalInput();
  rememberCommand(command);
  setTerminalInput("");
  runCommand(command);
});

terminalInput.addEventListener("keydown", (event) => {
  if (handleSnakeKey(event)) {
    return;
  }

  if (isBooting) {
    event.preventDefault();
    return;
  }

  if (event.key === "Enter") {
    event.preventDefault();
    terminalForm.requestSubmit();
    return;
  }

  if (event.key === "ArrowUp") {
    event.preventDefault();
    browseHistory(-1);
    return;
  }

  if (event.key === "ArrowDown") {
    event.preventDefault();
    browseHistory(1);
    return;
  }

  if (event.key === "Escape") {
    event.preventDefault();
    setTerminalInput("");
  }
});

function insertPlainText(text) {
  const selection = window.getSelection();

  if (!selection.rangeCount) {
    terminalInput.textContent += text;
    moveCaretToEnd();
    return;
  }

  const range = selection.getRangeAt(0);
  range.deleteContents();
  range.insertNode(document.createTextNode(text));
  range.collapse(false);
  selection.removeAllRanges();
  selection.addRange(range);
}

terminalInput.addEventListener("paste", (event) => {
  event.preventDefault();
  const text = event.clipboardData.getData("text/plain").replace(/[\r\n]+/g, " ");
  insertPlainText(text);
});

terminalBody.addEventListener("pointerdown", focusTerminal);
terminalWindow.addEventListener("pointerdown", focusTerminal);
titleBar.addEventListener("pointerdown", startDrag);
titleBar.addEventListener("pointermove", moveDrag);
titleBar.addEventListener("pointerup", stopDrag);
titleBar.addEventListener("pointercancel", stopDrag);

resizeHandles.forEach((handle) => {
  handle.addEventListener("pointerdown", startResize);
  handle.addEventListener("pointermove", moveResize);
  handle.addEventListener("pointerup", stopResize);
  handle.addEventListener("pointercancel", stopResize);
});

window.addEventListener("keydown", (event) => {
  handleSnakeKey(event);
});

window.addEventListener("resize", keepWindowInViewport);
window.addEventListener("blur", () => window.cancelAnimationFrame(wobbleId));

bootTerminal();

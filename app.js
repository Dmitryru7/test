// Заглушка для Telegram Web App API
if (typeof window.Telegram === 'undefined') {
  window.Telegram = {
    WebApp: {
      ready: () => console.log('Telegram Web App is ready'),
      initDataUnsafe: { user: { id: "local_user_id" } },
    },
  };
}

const tg = window.Telegram.WebApp;
tg.ready();

const userId = tg.initDataUnsafe.user?.id || "default_user_id";

// Режимы таймера
const modes = {
  DAY: { name: "Сутки", maxTime: 24 * 60 * 60 },
  WEEK: { name: "Неделя", maxTime: 168 * 60 * 60 },
};

let currentMode = modes.DAY;
let timerValue = 0;
let globalTimerValue = 0;
let isTimerRunning = false;
let timerInterval;
let lastModeSwitch = Date.now();
let lastUpdateTime = Date.now();

// Элементы DOM
const timerDisplay = document.getElementById('timer');
const globalTimerDisplay = document.getElementById('globalTimer');
const startStopTimerButton = document.getElementById('startStopTimer');
const modeDisplay = document.getElementById('modeDisplay');
const switchModeButton = document.getElementById('switchMode');
const nextSwitchTimeDisplay = document.getElementById('nextSwitchTime');

// Периодический бэкап данных (каждые 10 секунд)
const BACKUP_INTERVAL = 10000; // 10 секунд
let backupInterval;

// Сохранение данных в localStorage
function saveToLocalStorage() {
  const userData = {
    globalTimer: globalTimerValue,
    timerValue: timerValue,
    currentMode: currentMode.name,
    lastModeSwitch: lastModeSwitch,
    isTimerRunning: isTimerRunning,
    lastUpdateTime: lastUpdateTime,
  };
  localStorage.setItem('userData', JSON.stringify(userData));
}

// Восстановление данных из localStorage
function loadFromLocalStorage() {
  const localData = JSON.parse(localStorage.getItem('userData')) || {};
  globalTimerValue = localData.globalTimer || 0;
  timerValue = localData.timerValue || 0;
  currentMode = modes[localData.currentMode] || modes.DAY;
  lastModeSwitch = new Date(localData.lastModeSwitch) || Date.now();
  isTimerRunning = localData.isTimerRunning || false;
  lastUpdateTime = new Date(localData.lastUpdateTime) || Date.now();

  // Если таймер был запущен до перезагрузки, вычисляем, сколько времени прошло
  if (isTimerRunning) {
    const timeElapsed = Math.floor((Date.now() - lastUpdateTime) / 1000);
    timerValue += timeElapsed;
    globalTimerValue += timeElapsed;
    startTimer(); // Запускаем таймер снова
  }

  updateUI();
}

// Обновление интерфейса
function updateUI() {
  timerDisplay.textContent = formatTime(timerValue);
  globalTimerDisplay.textContent = `Глобальный счетчик: ${formatTime(globalTimerValue)}`;
  modeDisplay.textContent = `Режим: ${currentMode.name}`;
  updateModeSwitchCooldown();
}

// Форматирование времени
function formatTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

// Переключение режима
function updateModeSwitchCooldown() {
  const now = Date.now();
  const timeLeft = lastModeSwitch + 24 * 60 * 60 * 1000 - now;

  if (timeLeft > 0) {
    switchModeButton.disabled = true;
    nextSwitchTimeDisplay.textContent = formatTime(Math.floor(timeLeft / 1000));
  } else {
    switchModeButton.disabled = false;
    nextSwitchTimeDisplay.textContent = "Режим можно переключить";
  }
}

// Управление таймером
function startTimer() {
  if (timerValue >= currentMode.maxTime) {
    timerValue = 0;
  }
  isTimerRunning = true;
  lastUpdateTime = Date.now();
  startStopTimerButton.textContent = "Стоп";
  timerInterval = setInterval(() => {
    if (timerValue < currentMode.maxTime) {
      timerValue++;
      globalTimerValue++;
      updateUI();
    } else {
      stopTimer();
    }
  }, 1000);
  saveToLocalStorage(); // Сохраняем данные
}

function stopTimer() {
  isTimerRunning = false;
  clearInterval(timerInterval);
  startStopTimerButton.textContent = "Старт";
  saveToLocalStorage(); // Сохраняем данные
}

// Переключение режима
switchModeButton.addEventListener('click', () => {
  if (switchModeButton.disabled) return;

  currentMode = currentMode === modes.DAY ? modes.WEEK : modes.DAY;
  lastModeSwitch = Date.now();
  updateUI();
  saveToLocalStorage(); // Сохраняем данные
});

// Управление таймером
startStopTimerButton.addEventListener('click', () => {
  if (isTimerRunning) {
    stopTimer();
  } else {
    startTimer();
  }
});

// Навигация
const navButtons = document.querySelectorAll('.navbar button');
navButtons.forEach(button => {
  button.addEventListener('click', () => {
    const targetPageId = button.getAttribute('data-page');
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => {
      if (page.id === targetPageId) {
        page.classList.add('active');
      } else {
        page.classList.remove('active');
      }
    });
  });
});

// Загрузка данных при запуске
loadFromLocalStorage();

// Сохранение данных при закрытии страницы
window.addEventListener('beforeunload', () => {
  saveToLocalStorage();
});

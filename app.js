// Инициализация Telegram Web App
const tg = window.Telegram?.WebApp || {
  initDataUnsafe: { user: { id: "test_user" } },
  ready: () => console.log("Telegram Web App is ready"),
};
tg.ready();

// Конфигурация
const MODE_DURATION = 24 * 60 * 60; // 24 часа в секундах
let isTimerRunning = false;
let startTimestamp = 0;
let accumulatedTime = 0;
let globalTime = 0;

// Элементы интерфейса
const timerElement = document.getElementById('timer');
const claimButton = document.getElementById('claimButton');
const globalTimerElement = document.getElementById('globalTimer');

// Инициализация пользователя
const userId = tg.initDataUnsafe.user?.id;
let userData = null;

console.log("Инициализация приложения...");
console.log("User ID:", userId);

// Загрузка данных пользователя
async function loadUserData() {
  try {
    const response = await fetch(`/api/users/${userId}`);
    userData = await response.json();
    
    accumulatedTime = calculateAccumulatedTime(userData);
    globalTime = userData.globalTime || 0;
    
    if (userData.isTimerRunning) {
      startTimer();
    } else if (accumulatedTime >= MODE_DURATION) {
      showClaimButton();
    }
    
    updateUI();
  } catch (error) {
    console.error('Ошибка загрузки данных:', error);
    initNewUser();
  }
}

// Расчет накопленного времени
function calculateAccumulatedTime(data) {
  if (!data.isTimerRunning) return data.accumulatedTime;
  const passedSeconds = Math.floor((Date.now() - data.lastUpdate) / 1000);
  return Math.min(data.accumulatedTime + passedSeconds, MODE_DURATION);
}

// Запуск таймера
function startTimer() {
  if (isTimerRunning) return;
  
  isTimerRunning = true;
  startTimestamp = Date.now();
  claimButton.disabled = true;
  claimButton.textContent = 'Таймер запущен';
  
  // Обновление каждую секунду
  const interval = setInterval(() => {
    const elapsed = Math.floor((Date.now() - startTimestamp) / 1000);
    accumulatedTime = Math.min(elapsed + (userData?.accumulatedTime || 0), MODE_DURATION);
    
    if (accumulatedTime >= MODE_DURATION) {
      clearInterval(interval);
      isTimerRunning = false;
      showClaimButton();
    }
    
    updateUI();
    saveProgress();
  }, 1000);
}

// Показать кнопку "Забрать"
function showClaimButton() {
  claimButton.disabled = false;
  claimButton.textContent = `Забрать ${formatTime(MODE_DURATION)}!`;
  claimButton.onclick = claimReward;
}

// Забрать награду
async function claimReward() {
  globalTime += MODE_DURATION;
  accumulatedTime = 0;
  isTimerRunning = false;
  
  await fetch(`/api/users/${userId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      accumulatedTime: 0,
      globalTime,
      isTimerRunning: false
    })
  });
  
  updateUI();
  claimButton.textContent = 'Старт';
  claimButton.onclick = startTimer;
}

// Сохранение прогресса
async function saveProgress() {
  await fetch(`/api/users/${userId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      accumulatedTime,
      globalTime,
      isTimerRunning,
      lastUpdate: Date.now()
    })
  });
}

// Форматирование времени
function formatTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

// Обновление интерфейса
function updateUI() {
  const remaining = MODE_DURATION - accumulatedTime;
  timerElement.textContent = formatTime(remaining);
  globalTimerElement.textContent = `Накоплено: ${formatTime(globalTime)}`;
}

// Инициализация нового пользователя
async function initNewUser() {
  userData = {
    userId,
    accumulatedTime: 0,
    globalTime: 0,
    isTimerRunning: false,
    lastUpdate: Date.now()
  };
  
  await fetch('/api/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData)
  });
  
  updateUI();
}

// Навигация
const navButtons = document.querySelectorAll('.navbar button');
navButtons.forEach(button => {
  button.addEventListener('click', () => {
    const targetPageId = button.getAttribute('data-page');
    console.log("Переход на страницу:", targetPageId);
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

// Инициализация кнопки "Старт"
claimButton.onclick = () => {
  console.log("Кнопка 'Старт' нажата");
  startTimer();
};

// Запуск приложения
if (userId) {
  loadUserData();
} else {
  document.body.innerHTML = '<h1>Ошибка авторизации</h1>';
}

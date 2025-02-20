require('dotenv').config({ path: __dirname + '/test.env' });

console.log('MONGODB_URI:', process.env.MONGODB_URI);

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Подключение к MongoDB
mongoose.connect(process.env.MONGODB_URI);

// Модель пользователя
const userSchema = new mongoose.Schema({
  telegramId: { type: String, required: true, unique: true },
  globalTimer: { type: Number, default: 0 },
  timerValue: { type: Number, default: 0 },
  currentMode: { type: String, default: 'DAY' },
  lastModeSwitch: { type: Date, default: Date.now },
  isTimerRunning: { type: Boolean, default: false },
  lastUpdateTime: { type: Date, default: Date.now },
  referrals: [{ type: String }],
  bonusHistory: [{
    date: { type: Date, default: Date.now },
    amount: { type: Number, required: true },
  }],
});

const User = mongoose.model('User', userSchema);

// Обработчик для корневого пути
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

// Получение данных пользователя
app.get('/user/:telegramId', async (req, res) => {
  try {
    const user = await User.findOne({ telegramId: req.params.telegramId });
    if (!user) {
      // Если пользователь не найден, создаём нового
      const newUser = new User({ telegramId: req.params.telegramId });
      await newUser.save();
      return res.json(newUser);
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Обновление данных пользователя
app.post('/user/:telegramId/update', async (req, res) => {
  const { globalTimer, timerValue, currentMode, lastModeSwitch, isTimerRunning, lastUpdateTime } = req.body;
  try {
    const user = await User.findOne({ telegramId: req.params.telegramId });
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (globalTimer !== undefined) user.globalTimer = globalTimer;
    if (timerValue !== undefined) user.timerValue = timerValue;
    if (currentMode !== undefined) user.currentMode = currentMode;
    if (lastModeSwitch !== undefined) user.lastModeSwitch = lastModeSwitch;
    if (isTimerRunning !== undefined) user.isTimerRunning = isTimerRunning;
    if (lastUpdateTime !== undefined) user.lastUpdateTime = lastUpdateTime;

    await user.save();
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Запуск сервера
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

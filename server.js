const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
app.use(express.json());

// Подключение к MongoDB
mongoose.connect(process.env.MONGODB_URI);
const userSchema = new mongoose.Schema({
  userId: { type: String, unique: true, required: true },
  accumulatedTime: { type: Number, default: 0 },
  globalTime: { type: Number, default: 0 },
  isTimerRunning: { type: Boolean, default: false },
  lastUpdate: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// API Endpoints
app.get('/api/users/:userId', async (req, res) => {
  try {
    const user = await User.findOne({ userId: req.params.userId });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/users', async (req, res) => {
  try {
    const newUser = new User(req.body);
    await newUser.save();
    res.status(201).json(newUser);
  } catch (error) {
    res.status(400).json({ error: 'Invalid data' });
  }
});

app.put('/api/users/:userId', async (req, res) => {
  try {
    const updatedUser = await User.findOneAndUpdate(
      { userId: req.params.userId },
      req.body,
      { new: true }
    );
    res.json(updatedUser);
  } catch (error) {
    res.status(400).json({ error: 'Update failed' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

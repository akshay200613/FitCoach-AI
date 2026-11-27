const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db = require('../database');

const router = express.Router();

router.post('/register', (req, res) => {
  try {
    const { email, password, full_name } = req.body;
    if (!email || !password || !full_name) {
      return res.status(400).json({ error: 'Email, password, and full name are required' });
    }

    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const userId = uuidv4();

    db.prepare('INSERT INTO users (id, email, password, full_name) VALUES (?, ?, ?, ?)').run(userId, email, hashedPassword, full_name);

    const token = jwt.sign({ id: userId, email }, process.env.JWT_SECRET, { expiresIn: '30d' });

    res.status(201).json({
      token,
      user: { id: userId, email, full_name, onboarding_completed: 0 }
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

router.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = bcrypt.compareSync(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '30d' });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        onboarding_completed: user.onboarding_completed
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

router.get('/me', require('../middleware/auth').authenticateToken, (req, res) => {
  try {
    const user = db.prepare('SELECT id, email, full_name, onboarding_completed, created_at FROM users WHERE id = ?').get(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    const profile = db.prepare('SELECT * FROM user_profiles WHERE user_id = ?').get(req.user.id);
    const health = db.prepare('SELECT * FROM health_profiles WHERE user_id = ?').get(req.user.id);
    const goals = db.prepare('SELECT * FROM fitness_goals WHERE user_id = ?').get(req.user.id);

    res.json({ user, profile, health, goals });
  } catch (err) {
    console.error('Get user error:', err);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Delete account
router.delete('/account', require('../middleware/auth').authenticateToken, (req, res) => {
  try {
    const userId = req.user.id;
    // Delete all user data in dependency order
    db.prepare('DELETE FROM completed_sets WHERE session_id IN (SELECT id FROM workout_sessions WHERE user_id = ?)').run(userId);
    db.prepare('DELETE FROM workout_sessions WHERE user_id = ?').run(userId);
    db.prepare('DELETE FROM workout_plans WHERE user_id = ?').run(userId);
    db.prepare('DELETE FROM progress_measurements WHERE user_id = ?').run(userId);
    db.prepare('DELETE FROM ai_conversations WHERE user_id = ?').run(userId);
    db.prepare('DELETE FROM nutrition_profiles WHERE user_id = ?').run(userId);
    db.prepare('DELETE FROM fitness_goals WHERE user_id = ?').run(userId);
    db.prepare('DELETE FROM health_profiles WHERE user_id = ?').run(userId);
    db.prepare('DELETE FROM user_profiles WHERE user_id = ?').run(userId);
    db.prepare('DELETE FROM users WHERE id = ?').run(userId);
    res.json({ message: 'Account deleted successfully' });
  } catch (err) {
    console.error('Delete account error:', err);
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

module.exports = router;

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../database');
const { authenticateToken } = require('../middleware/auth');
const { chatWithAI, generateNutritionPlan } = require('../aiEngine');

const router = express.Router();

// AI Chat
router.post('/chat', authenticateToken, async (req, res) => {
  try {
    const { message } = req.body;
    const userId = req.user.id;

    // Get user context
    const profile = db.prepare('SELECT * FROM user_profiles WHERE user_id = ?').get(userId);
    const health = db.prepare('SELECT * FROM health_profiles WHERE user_id = ?').get(userId);
    const goals = db.prepare('SELECT * FROM fitness_goals WHERE user_id = ?').get(userId);
    const recentSessions = db.prepare(`SELECT * FROM workout_sessions WHERE user_id = ? ORDER BY started_at DESC LIMIT 10`).all(userId);
    const activePlan = db.prepare('SELECT plan_data FROM workout_plans WHERE user_id = ? AND is_active = 1 LIMIT 1').get(userId);

    // Save user message
    db.prepare('INSERT INTO ai_conversations (id, user_id, role, content) VALUES (?,?,?,?)').run(uuidv4(), userId, 'user', message);

    // Get conversation history
    const history = db.prepare('SELECT role, content FROM ai_conversations WHERE user_id = ? ORDER BY created_at DESC LIMIT 20').all(userId).reverse();

    const context = {
      profile,
      health,
      goals,
      recentSessions,
      activePlan: activePlan ? JSON.parse(activePlan.plan_data) : null
    };

    const reply = await chatWithAI(message, context, history);

    // Save AI response
    db.prepare('INSERT INTO ai_conversations (id, user_id, role, content) VALUES (?,?,?,?)').run(uuidv4(), userId, 'assistant', reply);

    res.json({ reply });
  } catch (err) {
    console.error('AI chat error:', err);
    res.status(500).json({ error: 'AI chat failed: ' + err.message });
  }
});

// Get conversation history
router.get('/history', authenticateToken, (req, res) => {
  try {
    const conversations = db.prepare('SELECT role, content, created_at FROM ai_conversations WHERE user_id = ? ORDER BY created_at ASC LIMIT 100').all(req.user.id);
    res.json({ conversations });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

// Clear conversation history
router.delete('/history', authenticateToken, (req, res) => {
  try {
    db.prepare('DELETE FROM ai_conversations WHERE user_id = ?').run(req.user.id);
    res.json({ message: 'History cleared' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to clear history' });
  }
});

// Generate nutrition plan
router.post('/nutrition', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { diet_preference } = req.body;

    const profile = db.prepare('SELECT * FROM user_profiles WHERE user_id = ?').get(userId);
    const goals = db.prepare('SELECT * FROM fitness_goals WHERE user_id = ?').get(userId);

    if (!profile) return res.status(400).json({ error: 'Complete your profile first' });

    const nutrition = await generateNutritionPlan({
      age: profile.age,
      gender: profile.gender,
      weight_kg: profile.current_weight_kg,
      height_cm: profile.height_cm,
      target_weight_kg: profile.target_weight_kg,
      goal: goals?.primary_goal || 'general fitness',
      diet_preference: diet_preference || 'non-vegetarian',
      fitness_experience: profile.fitness_experience,
      workout_days: profile.workout_days_per_week
    });

    // Save/update nutrition profile
    const existing = db.prepare('SELECT id FROM nutrition_profiles WHERE user_id = ?').get(userId);
    if (existing) {
      db.prepare(`UPDATE nutrition_profiles SET diet_preference=?, daily_calories=?, protein_g=?, carbs_g=?, fats_g=?, water_ml=?, meal_plan=?, updated_at=CURRENT_TIMESTAMP WHERE user_id=?`)
        .run(diet_preference, nutrition.daily_calories, nutrition.protein_g, nutrition.carbs_g, nutrition.fats_g, nutrition.water_ml, JSON.stringify(nutrition.meals || []), userId);
    } else {
      db.prepare(`INSERT INTO nutrition_profiles (id, user_id, diet_preference, daily_calories, protein_g, carbs_g, fats_g, water_ml, meal_plan) VALUES (?,?,?,?,?,?,?,?,?)`)
        .run(uuidv4(), userId, diet_preference, nutrition.daily_calories, nutrition.protein_g, nutrition.carbs_g, nutrition.fats_g, nutrition.water_ml, JSON.stringify(nutrition.meals || []));
    }

    res.json({ nutrition });
  } catch (err) {
    console.error('Nutrition error:', err);
    res.status(500).json({ error: 'Failed to generate nutrition plan' });
  }
});

// Get saved nutrition profile
router.get('/nutrition', authenticateToken, (req, res) => {
  try {
    const nutrition = db.prepare('SELECT * FROM nutrition_profiles WHERE user_id = ?').get(req.user.id);
    if (nutrition && nutrition.meal_plan) {
      nutrition.meal_plan = JSON.parse(nutrition.meal_plan);
    }
    res.json({ nutrition });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch nutrition profile' });
  }
});

module.exports = router;

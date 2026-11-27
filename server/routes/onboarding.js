const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Save/update user profile (Step 1 of onboarding)
router.post('/profile', authenticateToken, (req, res) => {
  try {
    const { age, gender, height_cm, current_weight_kg, target_weight_kg } = req.body;
    const userId = req.user.id;

    let bmi = null;
    if (height_cm && current_weight_kg) {
      const heightM = height_cm / 100;
      bmi = Math.round((current_weight_kg / (heightM * heightM)) * 10) / 10;
    }

    const existing = db.prepare('SELECT id FROM user_profiles WHERE user_id = ?').get(userId);
    
    if (existing) {
      db.prepare(`UPDATE user_profiles SET age=?, gender=?, height_cm=?, current_weight_kg=?, target_weight_kg=?, bmi=?, updated_at=CURRENT_TIMESTAMP WHERE user_id=?`)
        .run(age, gender, height_cm, current_weight_kg, target_weight_kg, bmi, userId);
    } else {
      db.prepare(`INSERT INTO user_profiles (id, user_id, age, gender, height_cm, current_weight_kg, target_weight_kg, bmi) VALUES (?,?,?,?,?,?,?,?)`)
        .run(uuidv4(), userId, age, gender, height_cm, current_weight_kg, target_weight_kg, bmi);
    }

    res.json({ message: 'Profile saved', bmi });
  } catch (err) {
    console.error('Profile error:', err);
    res.status(500).json({ error: 'Failed to save profile' });
  }
});

// Save/update health profile (Step 2)
router.post('/health', authenticateToken, (req, res) => {
  try {
    const { medical_conditions, injuries, joint_pain, exercises_to_avoid, physically_active, additional_info } = req.body;
    const userId = req.user.id;

    const existing = db.prepare('SELECT id FROM health_profiles WHERE user_id = ?').get(userId);
    
    if (existing) {
      db.prepare(`UPDATE health_profiles SET medical_conditions=?, injuries=?, joint_pain=?, exercises_to_avoid=?, physically_active=?, additional_info=?, updated_at=CURRENT_TIMESTAMP WHERE user_id=?`)
        .run(medical_conditions || '', injuries || '', joint_pain || '', exercises_to_avoid || '', physically_active ? 1 : 0, additional_info || '', userId);
    } else {
      db.prepare(`INSERT INTO health_profiles (id, user_id, medical_conditions, injuries, joint_pain, exercises_to_avoid, physically_active, additional_info) VALUES (?,?,?,?,?,?,?,?)`)
        .run(uuidv4(), userId, medical_conditions || '', injuries || '', joint_pain || '', exercises_to_avoid || '', physically_active ? 1 : 0, additional_info || '');
    }

    res.json({ message: 'Health profile saved' });
  } catch (err) {
    console.error('Health error:', err);
    res.status(500).json({ error: 'Failed to save health profile' });
  }
});

// Save fitness experience (Step 3)
router.post('/experience', authenticateToken, (req, res) => {
  try {
    const { fitness_experience, exercise_duration } = req.body;
    const userId = req.user.id;

    db.prepare(`UPDATE user_profiles SET fitness_experience=?, exercise_duration=?, updated_at=CURRENT_TIMESTAMP WHERE user_id=?`)
      .run(fitness_experience, exercise_duration, userId);

    res.json({ message: 'Experience saved' });
  } catch (err) {
    console.error('Experience error:', err);
    res.status(500).json({ error: 'Failed to save experience' });
  }
});

// Save workout preferences (Step 4)
router.post('/preferences', authenticateToken, (req, res) => {
  try {
    const { workout_location, workout_days_per_week, workout_duration, available_equipment } = req.body;
    const userId = req.user.id;

    db.prepare(`UPDATE user_profiles SET workout_location=?, workout_days_per_week=?, workout_duration=?, available_equipment=?, updated_at=CURRENT_TIMESTAMP WHERE user_id=?`)
      .run(workout_location, workout_days_per_week, workout_duration, JSON.stringify(available_equipment || []), userId);

    res.json({ message: 'Preferences saved' });
  } catch (err) {
    console.error('Preferences error:', err);
    res.status(500).json({ error: 'Failed to save preferences' });
  }
});

// Save fitness goals
router.post('/goals', authenticateToken, (req, res) => {
  try {
    const { primary_goal, secondary_goal, target_timeline } = req.body;
    const userId = req.user.id;

    const existing = db.prepare('SELECT id FROM fitness_goals WHERE user_id = ?').get(userId);
    
    if (existing) {
      db.prepare(`UPDATE fitness_goals SET primary_goal=?, secondary_goal=?, target_timeline=?, updated_at=CURRENT_TIMESTAMP WHERE user_id=?`)
        .run(primary_goal, secondary_goal || null, target_timeline || null, userId);
    } else {
      db.prepare(`INSERT INTO fitness_goals (id, user_id, primary_goal, secondary_goal, target_timeline) VALUES (?,?,?,?,?)`)
        .run(uuidv4(), userId, primary_goal, secondary_goal || null, target_timeline || null);
    }

    // Mark onboarding as completed
    db.prepare('UPDATE users SET onboarding_completed = 1 WHERE id = ?').run(userId);

    res.json({ message: 'Goals saved' });
  } catch (err) {
    console.error('Goals error:', err);
    res.status(500).json({ error: 'Failed to save goals' });
  }
});

// Get full onboarding data
router.get('/data', authenticateToken, (req, res) => {
  try {
    const profile = db.prepare('SELECT * FROM user_profiles WHERE user_id = ?').get(req.user.id);
    const health = db.prepare('SELECT * FROM health_profiles WHERE user_id = ?').get(req.user.id);
    const goals = db.prepare('SELECT * FROM fitness_goals WHERE user_id = ?').get(req.user.id);

    res.json({ profile, health, goals });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch onboarding data' });
  }
});

// Update profile
router.put('/profile', authenticateToken, (req, res) => {
  try {
    const fields = req.body;
    const userId = req.user.id;

    const profile = db.prepare('SELECT * FROM user_profiles WHERE user_id = ?').get(userId);
    if (!profile) return res.status(404).json({ error: 'Profile not found' });

    const updates = [];
    const values = [];
    
    for (const [key, val] of Object.entries(fields)) {
      if (['age', 'gender', 'height_cm', 'current_weight_kg', 'target_weight_kg', 'fitness_experience', 'exercise_duration', 'workout_location', 'workout_days_per_week', 'workout_duration'].includes(key)) {
        updates.push(`${key}=?`);
        values.push(val);
      }
      if (key === 'available_equipment') {
        updates.push('available_equipment=?');
        values.push(JSON.stringify(val));
      }
    }

    if (fields.height_cm && fields.current_weight_kg) {
      const h = fields.height_cm / 100;
      updates.push('bmi=?');
      values.push(Math.round((fields.current_weight_kg / (h * h)) * 10) / 10);
    }

    if (updates.length > 0) {
      updates.push('updated_at=CURRENT_TIMESTAMP');
      values.push(userId);
      db.prepare(`UPDATE user_profiles SET ${updates.join(',')} WHERE user_id=?`).run(...values);
    }

    res.json({ message: 'Profile updated' });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

module.exports = router;

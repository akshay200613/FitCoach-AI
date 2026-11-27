const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Add measurement
router.post('/', authenticateToken, (req, res) => {
  try {
    const { weight_kg, waist_cm, chest_cm, arm_cm, thigh_cm, hip_cm, notes } = req.body;

    db.prepare(`INSERT INTO progress_measurements (id, user_id, weight_kg, waist_cm, chest_cm, arm_cm, thigh_cm, hip_cm, notes) VALUES (?,?,?,?,?,?,?,?,?)`)
      .run(uuidv4(), req.user.id, weight_kg, waist_cm, chest_cm, arm_cm, thigh_cm, hip_cm, notes || '');

    // Update current weight in profile if provided
    if (weight_kg) {
      const profile = db.prepare('SELECT height_cm FROM user_profiles WHERE user_id = ?').get(req.user.id);
      if (profile && profile.height_cm) {
        const h = profile.height_cm / 100;
        const bmi = Math.round((weight_kg / (h * h)) * 10) / 10;
        db.prepare('UPDATE user_profiles SET current_weight_kg = ?, bmi = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?')
          .run(weight_kg, bmi, req.user.id);
      }
    }

    res.json({ message: 'Measurement recorded' });
  } catch (err) {
    console.error('Progress error:', err);
    res.status(500).json({ error: 'Failed to record measurement' });
  }
});

// Get all measurements
router.get('/', authenticateToken, (req, res) => {
  try {
    const measurements = db.prepare('SELECT * FROM progress_measurements WHERE user_id = ? ORDER BY measured_at ASC').all(req.user.id);
    res.json({ measurements });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch measurements' });
  }
});

// Get progress summary
router.get('/summary', authenticateToken, (req, res) => {
  try {
    const userId = req.user.id;
    const profile = db.prepare('SELECT * FROM user_profiles WHERE user_id = ?').get(userId);
    
    const first = db.prepare('SELECT * FROM progress_measurements WHERE user_id = ? ORDER BY measured_at ASC LIMIT 1').get(userId);
    const latest = db.prepare('SELECT * FROM progress_measurements WHERE user_id = ? ORDER BY measured_at DESC LIMIT 1').get(userId);
    
    const workoutsThisMonth = db.prepare(`SELECT COUNT(*) as count FROM workout_sessions WHERE user_id = ? AND status = 'completed' AND started_at >= date('now', '-30 days')`).get(userId);
    
    const totalWorkouts = db.prepare(`SELECT COUNT(*) as count FROM workout_sessions WHERE user_id = ? AND status = 'completed'`).get(userId);

    const weeklyCompletion = db.prepare(`
      SELECT date(started_at) as day, COUNT(*) as workouts 
      FROM workout_sessions 
      WHERE user_id = ? AND status = 'completed' AND started_at >= date('now', '-28 days')
      GROUP BY date(started_at) ORDER BY day
    `).all(userId);

    res.json({
      profile,
      initial: first,
      current: latest,
      workouts_this_month: workoutsThisMonth.count,
      total_workouts: totalWorkouts.count,
      weekly_completion: weeklyCompletion
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch progress summary' });
  }
});

// Delete a measurement
router.delete('/:id', authenticateToken, (req, res) => {
  try {
    db.prepare('DELETE FROM progress_measurements WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
    res.json({ message: 'Measurement deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete measurement' });
  }
});

module.exports = router;

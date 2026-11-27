const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../database');
const { authenticateToken } = require('../middleware/auth');
const { generateWorkoutPlan } = require('../aiEngine');

const router = express.Router();

// Generate a new workout plan
router.post('/generate', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const profile = db.prepare('SELECT * FROM user_profiles WHERE user_id = ?').get(userId);
    const health = db.prepare('SELECT * FROM health_profiles WHERE user_id = ?').get(userId);
    const goals = db.prepare('SELECT * FROM fitness_goals WHERE user_id = ?').get(userId);
    const user = db.prepare('SELECT full_name FROM users WHERE id = ?').get(userId);

    if (!profile || !goals) {
      return res.status(400).json({ error: 'Please complete your profile and set your goals first' });
    }

    const userContext = {
      name: user.full_name,
      age: profile.age,
      gender: profile.gender,
      height_cm: profile.height_cm,
      weight_kg: profile.current_weight_kg,
      target_weight_kg: profile.target_weight_kg,
      bmi: profile.bmi,
      fitness_experience: profile.fitness_experience,
      exercise_duration: profile.exercise_duration,
      workout_location: profile.workout_location,
      workout_days: profile.workout_days_per_week,
      workout_duration: profile.workout_duration,
      equipment: (() => {
        try { return JSON.parse(profile.available_equipment || '[]'); } catch { return []; }
      })(),
      medical_conditions: health?.medical_conditions || '',
      injuries: health?.injuries || '',
      joint_pain: health?.joint_pain || '',
      exercises_to_avoid: health?.exercises_to_avoid || '',
      primary_goal: goals.primary_goal,
      secondary_goal: goals.secondary_goal,
      target_timeline: goals.target_timeline
    };

    const plan = await generateWorkoutPlan(userContext);

    // Deactivate old plans
    db.prepare('UPDATE workout_plans SET is_active = 0 WHERE user_id = ?').run(userId);

    // Save new plan
    const planId = uuidv4();
    db.prepare('INSERT INTO workout_plans (id, user_id, plan_name, plan_data) VALUES (?,?,?,?)')
      .run(planId, userId, plan.planName || 'My Workout Plan', JSON.stringify(plan));

    res.json({ plan: { id: planId, ...plan } });
  } catch (err) {
    console.error('Generate plan error:', err);
    res.status(500).json({ error: 'Failed to generate workout plan: ' + err.message });
  }
});

// Get active workout plan
router.get('/active', authenticateToken, (req, res) => {
  try {
    const plan = db.prepare('SELECT * FROM workout_plans WHERE user_id = ? AND is_active = 1 ORDER BY created_at DESC LIMIT 1').get(req.user.id);
    if (!plan) return res.json({ plan: null });
    
    res.json({ plan: { id: plan.id, ...JSON.parse(plan.plan_data), created_at: plan.created_at } });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch workout plan' });
  }
});

// Get all plans (history)
router.get('/history', authenticateToken, (req, res) => {
  try {
    const plans = db.prepare('SELECT id, plan_name, is_active, created_at FROM workout_plans WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id);
    res.json({ plans });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch plan history' });
  }
});

// Start a workout session
router.post('/session/start', authenticateToken, (req, res) => {
  try {
    const { plan_id, day_name, workout_name } = req.body;
    const sessionId = uuidv4();

    db.prepare('INSERT INTO workout_sessions (id, user_id, plan_id, day_name, workout_name) VALUES (?,?,?,?,?)')
      .run(sessionId, req.user.id, plan_id, day_name, workout_name);

    res.json({ session_id: sessionId });
  } catch (err) {
    res.status(500).json({ error: 'Failed to start session' });
  }
});

// Record a completed set
router.post('/session/set', authenticateToken, (req, res) => {
  try {
    const { session_id, exercise_name, set_number, reps, weight_kg, skipped } = req.body;

    db.prepare('INSERT INTO completed_sets (id, session_id, exercise_name, set_number, reps, weight_kg, completed, skipped) VALUES (?,?,?,?,?,?,?,?)')
      .run(uuidv4(), session_id, exercise_name, set_number, reps || 0, weight_kg || 0, skipped ? 0 : 1, skipped ? 1 : 0);

    res.json({ message: 'Set recorded' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to record set' });
  }
});

// Complete a workout session
router.post('/session/complete', authenticateToken, (req, res) => {
  try {
    const { session_id, total_duration_minutes } = req.body;

    db.prepare('UPDATE workout_sessions SET status = ?, completed_at = CURRENT_TIMESTAMP, total_duration_minutes = ? WHERE id = ? AND user_id = ?')
      .run('completed', total_duration_minutes || 0, session_id, req.user.id);

    res.json({ message: 'Workout completed!' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to complete session' });
  }
});

// Get workout history
router.get('/sessions', authenticateToken, (req, res) => {
  try {
    const sessions = db.prepare(`
      SELECT ws.*, 
        (SELECT COUNT(*) FROM completed_sets cs WHERE cs.session_id = ws.id AND cs.completed = 1) as sets_completed,
        (SELECT COUNT(*) FROM completed_sets cs WHERE cs.session_id = ws.id) as total_sets
      FROM workout_sessions ws 
      WHERE ws.user_id = ? 
      ORDER BY ws.started_at DESC 
      LIMIT 50
    `).all(req.user.id);

    res.json({ sessions });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

// Get session details
router.get('/session/:id', authenticateToken, (req, res) => {
  try {
    const session = db.prepare('SELECT * FROM workout_sessions WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
    if (!session) return res.status(404).json({ error: 'Session not found' });

    const sets = db.prepare('SELECT * FROM completed_sets WHERE session_id = ? ORDER BY exercise_name, set_number').all(req.params.id);

    res.json({ session, sets });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch session details' });
  }
});

// Get dashboard stats
router.get('/stats', authenticateToken, (req, res) => {
  try {
    const userId = req.user.id;
    
    const totalSessions = db.prepare('SELECT COUNT(*) as count FROM workout_sessions WHERE user_id = ? AND status = ?').get(userId, 'completed');
    
    const thisWeek = db.prepare(`SELECT COUNT(*) as count FROM workout_sessions WHERE user_id = ? AND status = 'completed' AND started_at >= date('now', '-7 days')`).get(userId);
    
    const streak = calculateStreak(userId);
    
    const recentSession = db.prepare(`SELECT * FROM workout_sessions WHERE user_id = ? ORDER BY started_at DESC LIMIT 1`).get(userId);

    const totalSets = db.prepare(`SELECT COUNT(*) as count FROM completed_sets cs JOIN workout_sessions ws ON cs.session_id = ws.id WHERE ws.user_id = ? AND cs.completed = 1`).get(userId);

    res.json({
      total_workouts: totalSessions.count,
      this_week: thisWeek.count,
      streak,
      recent_session: recentSession,
      total_sets: totalSets.count
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

function calculateStreak(userId) {
  const sessions = db.prepare(`
    SELECT DISTINCT date(started_at) as workout_date 
    FROM workout_sessions 
    WHERE user_id = ? AND status = 'completed' 
    ORDER BY workout_date DESC
  `).all(userId);

  if (sessions.length === 0) return 0;

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < sessions.length; i++) {
    const sessionDate = new Date(sessions[i].workout_date);
    const expectedDate = new Date(today);
    expectedDate.setDate(expectedDate.getDate() - i);
    expectedDate.setHours(0, 0, 0, 0);

    const diff = Math.abs(sessionDate.getTime() - expectedDate.getTime());
    if (diff <= 86400000) { // Within one day
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

module.exports = router;

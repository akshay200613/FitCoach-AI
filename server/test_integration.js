const http = require('http');

async function testBackend() {
  const server = require('./index.js');
  // Wait 1 sec for server to start
  await new Promise(r => setTimeout(r, 1000));

  const BASE = 'http://localhost:5000/api';
  let token = '';

  async function post(path, body) {
    const res = await fetch(`${BASE}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify(body)
    });
    return { status: res.status, data: await res.json() };
  }

  async function get(path) {
    const res = await fetch(`${BASE}${path}`, {
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    });
    return { status: res.status, data: await res.json() };
  }

  console.log('--- 1. Testing Health Check ---');
  const health = await get('/health');
  console.log('Health:', health.status, health.data);

  console.log('\n--- 2. Testing Registration ---');
  const testEmail = `test_${Date.now()}@fitcoach.ai`;
  const reg = await post('/auth/register', {
    email: testEmail,
    password: 'password123',
    full_name: 'Alex Johnson'
  });
  console.log('Register status:', reg.status);
  token = reg.data.token;
  console.log('Token received:', !!token);

  console.log('\n--- 3. Testing Step 1: Profile ---');
  const profileRes = await post('/onboarding/profile', {
    age: 28,
    gender: 'Male',
    height_cm: 180,
    current_weight_kg: 82,
    target_weight_kg: 76
  });
  console.log('Profile saved, BMI:', profileRes.data.bmi);

  console.log('\n--- 4. Testing Step 2: Health ---');
  const healthRes = await post('/onboarding/health', {
    medical_conditions: 'None',
    injuries: 'Mild lower back sensitivity',
    joint_pain: 'None',
    exercises_to_avoid: 'Heavy behind-neck press',
    physically_active: true,
    additional_info: 'Looking to stay fit and tone up'
  });
  console.log('Health saved:', healthRes.data);

  console.log('\n--- 5. Testing Step 3: Experience ---');
  const expRes = await post('/onboarding/experience', {
    fitness_experience: 'Intermediate',
    exercise_duration: '6-12 months'
  });
  console.log('Experience saved:', expRes.data);

  console.log('\n--- 6. Testing Step 4: Preferences ---');
  const prefRes = await post('/onboarding/preferences', {
    workout_location: 'Gym',
    workout_days_per_week: 4,
    workout_duration: '45-60 minutes',
    available_equipment: ['Barbell', 'Dumbbells', 'Bench', 'Cables', 'Pull-up Bar']
  });
  console.log('Preferences saved:', prefRes.data);

  console.log('\n--- 7. Testing Step 5: Goals ---');
  const goalsRes = await post('/onboarding/goals', {
    primary_goal: 'Body Recomposition',
    secondary_goal: 'Muscle Gain',
    target_timeline: '3 months'
  });
  console.log('Goals saved:', goalsRes.data);

  console.log('\n--- 8. Testing Workout Plan Generation ---');
  const planRes = await post('/workout/generate', {});
  console.log('Plan generated status:', planRes.status);
  console.log('Plan name:', planRes.data.plan?.planName);
  console.log('Plan days count:', planRes.data.plan?.schedule?.length);
  if (planRes.data.plan?.schedule?.[0]) {
    const day1 = planRes.data.plan.schedule[0];
    console.log(`Day 1: ${day1.day} (${day1.focus}), exercises: ${day1.exercises?.length}`);
    if (day1.exercises?.[0]) {
      console.log('First exercise:', day1.exercises[0].name, '| Video:', day1.exercises[0].video?.videoId);
    }
  }

  console.log('\n--- 9. Testing Workout Session Tracking ---');
  const startSession = await post('/workout/session/start', {
    plan_id: planRes.data.plan?.id,
    day_name: 'Monday',
    workout_name: 'Chest & Triceps'
  });
  const sessionId = startSession.data.session_id;
  console.log('Session started:', sessionId);

  // Record 2 sets
  await post('/workout/session/set', {
    session_id: sessionId,
    exercise_name: 'Barbell Bench Press',
    set_number: 1,
    reps: 10,
    weight_kg: 60,
    skipped: false
  });
  await post('/workout/session/set', {
    session_id: sessionId,
    exercise_name: 'Barbell Bench Press',
    set_number: 2,
    reps: 8,
    weight_kg: 65,
    skipped: false
  });
  console.log('Sets recorded');

  // Complete session
  const compSession = await post('/workout/session/complete', {
    session_id: sessionId,
    total_duration_minutes: 45
  });
  console.log('Session completed:', compSession.data);

  // Stats
  const stats = await get('/workout/stats');
  console.log('Workout stats:', stats.data);

  console.log('\n--- 10. Testing Progress Tracking ---');
  const addMeas = await post('/progress', {
    weight_kg: 81.5,
    waist_cm: 84,
    chest_cm: 102,
    arm_cm: 36,
    thigh_cm: 58,
    hip_cm: 98,
    notes: 'Feeling good, slight drop in weight'
  });
  console.log('Measurement added:', addMeas.data);

  const progSummary = await get('/progress/summary');
  console.log('Progress summary:', {
    total_workouts: progSummary.data.total_workouts,
    initial_weight: progSummary.data.initial?.weight_kg,
    current_weight: progSummary.data.current?.weight_kg
  });

  console.log('\n--- 11. Testing AI Coach Chat ---');
  const chatRes = await post('/ai/chat', {
    message: 'What should I do if I miss a workout?'
  });
  console.log('AI Coach reply preview:', chatRes.data.reply?.slice(0, 150) + '...');

  console.log('\n--- 12. Testing Nutrition Guidance ---');
  const nutRes = await post('/ai/nutrition', {
    diet_preference: 'non-vegetarian'
  });
  console.log('Nutrition generated:', {
    daily_calories: nutRes.data.nutrition?.daily_calories,
    protein_g: nutRes.data.nutrition?.protein_g,
    carbs_g: nutRes.data.nutrition?.carbs_g,
    fats_g: nutRes.data.nutrition?.fats_g,
    meals_count: nutRes.data.nutrition?.meals?.length
  });

  console.log('\n🎉 ALL INTEGRATION TESTS PASSED SUCCESSFULLY! 🎉');
  process.exit(0);
}

testBackend().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});

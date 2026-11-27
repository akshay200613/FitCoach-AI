const { getExerciseVideo } = require('./exerciseVideos');

// AI Engine - Works with Gemini API or provides intelligent fallback
// Set GEMINI_API_KEY in .env to enable AI-powered generation

async function callGeminiAPI(prompt, jsonMode = false) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    return null; // Will use deterministic fallback
  }

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 8192,
          responseMimeType: jsonMode ? 'application/json' : 'text/plain'
        }
      })
    });

    const data = await response.json();
    if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
      return data.candidates[0].content.parts[0].text;
    }
    return null;
  } catch (err) {
    console.error('Gemini API error:', err.message);
    return null;
  }
}

// ============================================================
// DETERMINISTIC WORKOUT GENERATION ENGINE (Fallback + Validation)
// ============================================================

const muscleGroupExercises = {
  chest: {
    gym: {
      beginner: [
        { name: 'Barbell Bench Press', sets: 3, reps: '10-12', rest: '90 sec', difficulty: 'Beginner', muscle: 'Chest', instructions: ['Lie flat on the bench with feet on the ground', 'Grip the bar slightly wider than shoulder width', 'Lower the bar to mid-chest with control', 'Press up until arms are extended but not locked'], mistakes: ['Bouncing the bar off chest', 'Flaring elbows too wide', 'Lifting hips off the bench'] },
        { name: 'Dumbbell Flyes', sets: 3, reps: '12-15', rest: '60 sec', difficulty: 'Beginner', muscle: 'Chest', instructions: ['Lie on a flat bench holding dumbbells above chest', 'Lower arms out to the sides with a slight bend in elbows', 'Feel the stretch across your chest', 'Squeeze chest to bring dumbbells back together'], mistakes: ['Going too heavy', 'Straightening arms completely', 'Lowering weights too fast'] },
        { name: 'Push Ups', sets: 3, reps: '10-15', rest: '60 sec', difficulty: 'Beginner', muscle: 'Chest', instructions: ['Place hands shoulder-width apart on the floor', 'Keep body in a straight line from head to heels', 'Lower chest towards the floor', 'Push back up to starting position'], mistakes: ['Sagging hips', 'Flaring elbows out too wide', 'Not going low enough'] },
      ],
      intermediate: [
        { name: 'Barbell Bench Press', sets: 4, reps: '8-10', rest: '90 sec', difficulty: 'Intermediate', muscle: 'Chest', instructions: ['Lie flat on the bench with feet on the ground', 'Grip the bar slightly wider than shoulder width', 'Lower the bar to mid-chest with control', 'Press up explosively while maintaining control'], mistakes: ['Bouncing the bar off chest', 'Uneven pressing', 'Not using full range of motion'] },
        { name: 'Incline Dumbbell Press', sets: 3, reps: '10-12', rest: '75 sec', difficulty: 'Intermediate', muscle: 'Upper Chest', instructions: ['Set bench to 30-45 degree angle', 'Press dumbbells from shoulder level upward', 'Keep wrists straight and aligned', 'Lower with control, feeling the stretch'], mistakes: ['Setting incline too steep', 'Using momentum', 'Flaring elbows excessively'] },
        { name: 'Cable Crossover', sets: 3, reps: '12-15', rest: '60 sec', difficulty: 'Intermediate', muscle: 'Chest', instructions: ['Stand between cable machines with handles high', 'Step forward for stability', 'Bring handles together in front of chest', 'Squeeze and hold briefly at the bottom'], mistakes: ['Using too much weight', 'Bending at the waist', 'Not controlling the negative'] },
        { name: 'Dumbbell Flyes', sets: 3, reps: '12-15', rest: '60 sec', difficulty: 'Intermediate', muscle: 'Chest', instructions: ['Lie on flat bench, arms extended above chest', 'Lower with slight elbow bend', 'Stretch chest at bottom', 'Contract to bring weights together'], mistakes: ['Going too heavy', 'Turning it into a press', 'Hyperextending at the bottom'] },
      ],
      advanced: [
        { name: 'Barbell Bench Press', sets: 5, reps: '5-8', rest: '120 sec', difficulty: 'Advanced', muscle: 'Chest', instructions: ['Set up with arch and leg drive', 'Grip bar firmly and unrack with control', 'Lower to chest with controlled tempo', 'Drive explosively through the sticking point'], mistakes: ['Losing tightness', 'Inconsistent bar path', 'Not breathing properly'] },
        { name: 'Incline Barbell Bench Press', sets: 4, reps: '6-8', rest: '90 sec', difficulty: 'Advanced', muscle: 'Upper Chest', instructions: ['Set bench to 30 degrees', 'Use shoulder-width or slightly wider grip', 'Touch upper chest', 'Press with power'], mistakes: ['Too steep an incline', 'Bouncing off chest', 'Uneven lockout'] },
        { name: 'Chest Dips', sets: 4, reps: '8-12', rest: '90 sec', difficulty: 'Advanced', muscle: 'Lower Chest', instructions: ['Lean forward about 30 degrees', 'Lower until upper arms are parallel to floor', 'Press up without locking elbows', 'Keep tension on chest throughout'], mistakes: ['Going too deep', 'Not leaning forward enough', 'Swinging body'] },
        { name: 'Cable Crossover', sets: 3, reps: '12-15', rest: '60 sec', difficulty: 'Advanced', muscle: 'Chest', instructions: ['Vary cable height for different angles', 'Focus on peak contraction', 'Control the eccentric portion', 'Use drop sets on the last set'], mistakes: ['Ego lifting', 'Losing form on drop sets', 'Rushing reps'] },
      ]
    },
    home: {
      beginner: [
        { name: 'Push Ups', sets: 3, reps: '8-12', rest: '60 sec', difficulty: 'Beginner', muscle: 'Chest', instructions: ['Hands shoulder-width apart', 'Keep core tight and body straight', 'Lower chest to floor', 'Push back up fully'], mistakes: ['Sagging hips', 'Looking up instead of down', 'Partial range of motion'] },
        { name: 'Wide Push Ups', sets: 3, reps: '8-10', rest: '60 sec', difficulty: 'Beginner', muscle: 'Chest', instructions: ['Place hands wider than shoulder width', 'Lower chest to floor', 'Push up to starting position', 'Keep elbows at 45 degrees'], mistakes: ['Hands too far forward', 'Dropping head', 'Not engaging core'] },
        { name: 'Diamond Push Ups', sets: 2, reps: '6-10', rest: '60 sec', difficulty: 'Beginner', muscle: 'Inner Chest / Triceps', instructions: ['Form a diamond shape with thumbs and index fingers', 'Keep elbows close to body', 'Lower chest to hands', 'Press up with control'], mistakes: ['Flaring elbows', 'Not touching chest to hands', 'Rushing reps'] },
      ],
      intermediate: [
        { name: 'Push Ups', sets: 4, reps: '15-20', rest: '45 sec', difficulty: 'Intermediate', muscle: 'Chest', instructions: ['Hands shoulder-width apart', 'Maintain perfect form throughout', 'Full range of motion each rep', 'Control the negative'], mistakes: ['Losing form as fatigue sets in', 'Partial reps', 'Not breathing properly'] },
        { name: 'Diamond Push Ups', sets: 3, reps: '10-15', rest: '60 sec', difficulty: 'Intermediate', muscle: 'Inner Chest / Triceps', instructions: ['Diamond hand position under chest', 'Keep elbows tucked', 'Full range of motion', 'Squeeze at the top'], mistakes: ['Flaring elbows', 'Sagging core', 'Rushing'] },
        { name: 'Dumbbell Bench Press', sets: 3, reps: '10-12', rest: '75 sec', difficulty: 'Intermediate', muscle: 'Chest', instructions: ['Lie on floor or bench', 'Press dumbbells from chest level', 'Control the descent', 'Full extension at top'], mistakes: ['Dropping weights too fast', 'Uneven pressing', 'Not using full range'] },
      ],
      advanced: [
        { name: 'Push Ups', sets: 4, reps: '20-25', rest: '45 sec', difficulty: 'Advanced', muscle: 'Chest', instructions: ['Vary hand positions across sets', 'Slow eccentric (3 seconds down)', 'Explosive concentric', 'Maintain perfect form'], mistakes: ['Sacrificing form for reps', 'Not varying stimulus', 'Inadequate range of motion'] },
        { name: 'Dumbbell Bench Press', sets: 4, reps: '8-10', rest: '90 sec', difficulty: 'Advanced', muscle: 'Chest', instructions: ['Heavy dumbbells with controlled form', 'Deep stretch at bottom', 'Powerful press to lockout', 'Superset with flyes if possible'], mistakes: ['Going too heavy for form', 'Bouncing weights', 'Not stabilizing'] },
        { name: 'Dumbbell Flyes', sets: 3, reps: '12-15', rest: '60 sec', difficulty: 'Advanced', muscle: 'Chest', instructions: ['Wide arc with slight elbow bend', 'Maximum stretch at bottom', 'Squeeze hard at top', 'Use slow tempo'], mistakes: ['Going too heavy', 'Turning into a press', 'Not controlling the negative'] },
      ]
    }
  },
  back: {
    gym: {
      beginner: [
        { name: 'Lat Pulldown', sets: 3, reps: '10-12', rest: '75 sec', difficulty: 'Beginner', muscle: 'Lats', instructions: ['Grip bar slightly wider than shoulder width', 'Pull bar to upper chest', 'Squeeze shoulder blades together', 'Control the return slowly'], mistakes: ['Leaning too far back', 'Using momentum', 'Not pulling to chest'] },
        { name: 'Seated Cable Row', sets: 3, reps: '10-12', rest: '75 sec', difficulty: 'Beginner', muscle: 'Mid Back', instructions: ['Sit with chest up and slight knee bend', 'Pull handle to lower chest/upper abdomen', 'Squeeze back muscles at peak contraction', 'Extend arms fully on return'], mistakes: ['Rounding the back', 'Using too much arm', 'Swinging torso'] },
        { name: 'Dumbbell Row', sets: 3, reps: '10-12', rest: '60 sec', difficulty: 'Beginner', muscle: 'Lats / Mid Back', instructions: ['Place one knee and hand on bench', 'Pull dumbbell to hip', 'Keep back flat and core tight', 'Lower with control'], mistakes: ['Rotating torso', 'Using momentum', 'Rounding back'] },
      ],
      intermediate: [
        { name: 'Barbell Row', sets: 4, reps: '8-10', rest: '90 sec', difficulty: 'Intermediate', muscle: 'Back', instructions: ['Hinge at hips, back at 45 degrees', 'Pull bar to lower chest', 'Squeeze back at top', 'Lower with control'], mistakes: ['Standing too upright', 'Using body English', 'Rounding lower back'] },
        { name: 'Pull Ups', sets: 3, reps: '6-10', rest: '90 sec', difficulty: 'Intermediate', muscle: 'Lats', instructions: ['Hang with arms fully extended', 'Pull chin over bar', 'Squeeze lats at top', 'Lower with control'], mistakes: ['Kipping', 'Half reps', 'Not engaging lats'] },
        { name: 'Lat Pulldown', sets: 3, reps: '10-12', rest: '75 sec', difficulty: 'Intermediate', muscle: 'Lats', instructions: ['Wide overhand grip', 'Pull to upper chest', 'Focus on lat engagement', 'Control the negative'], mistakes: ['Pulling behind neck', 'Using too much bicep', 'Leaning excessively'] },
        { name: 'Face Pull', sets: 3, reps: '15-20', rest: '60 sec', difficulty: 'Intermediate', muscle: 'Rear Delts / Upper Back', instructions: ['Set cable at face height', 'Pull rope to face, spreading ends apart', 'Squeeze shoulder blades', 'Hold for a count'], mistakes: ['Using too much weight', 'Not externally rotating', 'Using momentum'] },
      ],
      advanced: [
        { name: 'Deadlift', sets: 4, reps: '5-6', rest: '180 sec', difficulty: 'Advanced', muscle: 'Full Back / Posterior Chain', instructions: ['Set up with bar over mid-foot', 'Hinge at hips, flat back', 'Drive through heels', 'Lock out at top with shoulders back'], mistakes: ['Rounding lower back', 'Bar drifting from body', 'Hyperextending at lockout'] },
        { name: 'Barbell Row', sets: 4, reps: '6-8', rest: '90 sec', difficulty: 'Advanced', muscle: 'Back', instructions: ['Heavy weight with strict form', 'Pull to lower chest/upper abdomen', 'Pause at top', 'Control eccentric'], mistakes: ['Using too much momentum', 'Rounding back', 'Not pausing at top'] },
        { name: 'Pull Ups', sets: 4, reps: '8-12', rest: '90 sec', difficulty: 'Advanced', muscle: 'Lats', instructions: ['Add weight if bodyweight is easy', 'Full range of motion', 'Vary grip width across sets', 'Controlled tempo'], mistakes: ['Kipping', 'Partial range of motion', 'Not varying stimulus'] },
        { name: 'T-Bar Row', sets: 3, reps: '8-10', rest: '90 sec', difficulty: 'Advanced', muscle: 'Mid Back', instructions: ['Straddle the bar', 'Pull to chest with elbows tight', 'Squeeze at the top', 'Control the descent'], mistakes: ['Rounding back', 'Using momentum', 'Pulling with arms'] },
      ]
    },
    home: {
      beginner: [
        { name: 'Superman', sets: 3, reps: '12-15', rest: '45 sec', difficulty: 'Beginner', muscle: 'Lower Back', instructions: ['Lie face down with arms extended', 'Lift arms, chest, and legs simultaneously', 'Hold for 2 seconds at top', 'Lower slowly'], mistakes: ['Jerking movements', 'Hyperextending neck', 'Not squeezing glutes'] },
        { name: 'Dumbbell Row', sets: 3, reps: '10-12', rest: '60 sec', difficulty: 'Beginner', muscle: 'Back', instructions: ['Hinge forward with one hand on support', 'Pull dumbbell to hip', 'Squeeze back muscle', 'Lower with control'], mistakes: ['Rotating torso', 'Using momentum', 'Not pulling high enough'] },
        { name: 'Resistance Band Pull Apart', sets: 3, reps: '15-20', rest: '45 sec', difficulty: 'Beginner', muscle: 'Upper Back', instructions: ['Hold band at shoulder width at chest height', 'Pull band apart by squeezing shoulder blades', 'Hold stretched position briefly', 'Return with control'], mistakes: ['Using arms instead of back', 'Shrugging shoulders', 'Going too fast'] },
      ],
      intermediate: [
        { name: 'Pull Ups', sets: 3, reps: '5-8', rest: '90 sec', difficulty: 'Intermediate', muscle: 'Lats', instructions: ['Hang from bar or door frame pull-up bar', 'Pull chin above bar', 'Control the negative', 'Full extension at bottom'], mistakes: ['Kipping', 'Half reps', 'Swinging'] },
        { name: 'Dumbbell Row', sets: 4, reps: '10-12', rest: '60 sec', difficulty: 'Intermediate', muscle: 'Back', instructions: ['Both arms or single arm', 'Pull to hip with elbow driving back', 'Squeeze back', 'Control negative'], mistakes: ['Not hinging enough', 'Using too much bicep', 'Rushing'] },
        { name: 'Superman', sets: 3, reps: '15-20', rest: '45 sec', difficulty: 'Intermediate', muscle: 'Lower Back', instructions: ['Lie face down', 'Lift and hold for 3-5 seconds', 'Alternate arm/leg lifts', 'Engage core throughout'], mistakes: ['Hyperextending neck', 'Rushing', 'Not engaging glutes'] },
      ],
      advanced: [
        { name: 'Pull Ups', sets: 4, reps: '8-12', rest: '90 sec', difficulty: 'Advanced', muscle: 'Lats', instructions: ['Add weight with backpack or belt', 'Vary grip: wide, close, underhand', 'Slow negatives (3-5 sec)', 'Full ROM each rep'], mistakes: ['Kipping', 'Partial reps', 'Not varying grip'] },
        { name: 'One Arm Dumbbell Row', sets: 4, reps: '8-10', rest: '75 sec', difficulty: 'Advanced', muscle: 'Back', instructions: ['Heavy dumbbell', 'Strict form, pull to hip', 'Pause at top', 'Slow eccentric'], mistakes: ['Rotating torso', 'Using momentum', 'Not pausing at contraction'] },
        { name: 'Hyperextension', sets: 3, reps: '15-20', rest: '60 sec', difficulty: 'Advanced', muscle: 'Lower Back', instructions: ['Use exercise ball or edge of bed', 'Lower torso down', 'Rise to slightly above parallel', 'Hold at top'], mistakes: ['Hyperextending', 'Using momentum', 'Going too fast'] },
      ]
    }
  },
  shoulders: {
    gym: {
      beginner: [
        { name: 'Dumbbell Shoulder Press', sets: 3, reps: '10-12', rest: '75 sec', difficulty: 'Beginner', muscle: 'Shoulders', instructions: ['Sit with back supported', 'Press dumbbells overhead', 'Do not lock elbows completely', 'Lower to ear level'], mistakes: ['Arching back excessively', 'Flaring elbows', 'Using momentum'] },
        { name: 'Lateral Raise', sets: 3, reps: '12-15', rest: '60 sec', difficulty: 'Beginner', muscle: 'Side Delts', instructions: ['Stand with dumbbells at sides', 'Raise arms to shoulder height', 'Lead with elbows slightly', 'Lower with control'], mistakes: ['Using too much weight', 'Swinging body', 'Raising above shoulder height'] },
        { name: 'Front Raise', sets: 3, reps: '12-15', rest: '60 sec', difficulty: 'Beginner', muscle: 'Front Delts', instructions: ['Hold dumbbells in front of thighs', 'Raise one or both arms to eye level', 'Keep slight bend in elbows', 'Lower slowly'], mistakes: ['Swinging weights', 'Going too heavy', 'Leaning back'] },
      ],
      intermediate: [
        { name: 'Overhead Press', sets: 4, reps: '8-10', rest: '90 sec', difficulty: 'Intermediate', muscle: 'Shoulders', instructions: ['Stand with bar at collar bone', 'Press overhead to lockout', 'Engage core throughout', 'Lower under control'], mistakes: ['Excessive back arch', 'Pressing in front instead of overhead', 'Not engaging core'] },
        { name: 'Dumbbell Lateral Raise', sets: 4, reps: '12-15', rest: '60 sec', difficulty: 'Intermediate', muscle: 'Side Delts', instructions: ['Slight forward lean', 'Raise to shoulder height', 'Lead with elbows', 'Control the negative'], mistakes: ['Using momentum', 'Shrugging up', 'Going too heavy'] },
        { name: 'Rear Delt Fly', sets: 3, reps: '15-20', rest: '60 sec', difficulty: 'Intermediate', muscle: 'Rear Delts', instructions: ['Bend forward at hips', 'Raise dumbbells to sides', 'Squeeze shoulder blades', 'Lower slowly'], mistakes: ['Using back instead of rear delts', 'Going too heavy', 'Not squeezing at top'] },
        { name: 'Dumbbell Shrugs', sets: 3, reps: '12-15', rest: '60 sec', difficulty: 'Intermediate', muscle: 'Traps', instructions: ['Hold heavy dumbbells at sides', 'Shrug shoulders straight up', 'Hold at top briefly', 'Lower with control'], mistakes: ['Rolling shoulders', 'Using momentum', 'Not pausing at top'] },
      ],
      advanced: [
        { name: 'Overhead Press', sets: 5, reps: '5-6', rest: '120 sec', difficulty: 'Advanced', muscle: 'Shoulders', instructions: ['Strict press from rack', 'Engage glutes and core', 'Press to full lockout', 'Control the descent'], mistakes: ['Excessive lean back', 'Soft lockout', 'Not bracing core'] },
        { name: 'Arnold Press', sets: 4, reps: '8-10', rest: '90 sec', difficulty: 'Advanced', muscle: 'Shoulders', instructions: ['Start with palms facing you', 'Rotate and press overhead', 'Reverse the motion on descent', 'Full range of motion'], mistakes: ['Rushing the rotation', 'Using momentum', 'Partial range of motion'] },
        { name: 'Lateral Raise', sets: 4, reps: '12-15', rest: '60 sec', difficulty: 'Advanced', muscle: 'Side Delts', instructions: ['Use drop sets or partials', 'Strict form, controlled tempo', 'Full range of motion', 'Squeeze at top'], mistakes: ['Ego lifting', 'Losing form', 'Not controlling negative'] },
        { name: 'Face Pull', sets: 3, reps: '15-20', rest: '60 sec', difficulty: 'Advanced', muscle: 'Rear Delts', instructions: ['High cable setting', 'Pull to face with external rotation', 'Hold and squeeze', 'Slow return'], mistakes: ['Using too much weight', 'Not rotating', 'Using momentum'] },
      ]
    },
    home: {
      beginner: [
        { name: 'Dumbbell Shoulder Press', sets: 3, reps: '10-12', rest: '75 sec', difficulty: 'Beginner', muscle: 'Shoulders', instructions: ['Seated or standing', 'Press overhead', 'Lower to ears', 'Keep core tight'], mistakes: ['Arching back', 'Locking elbows hard', 'Using momentum'] },
        { name: 'Lateral Raise', sets: 3, reps: '12-15', rest: '60 sec', difficulty: 'Beginner', muscle: 'Side Delts', instructions: ['Light dumbbells or water bottles', 'Raise to shoulder height', 'Lead with elbows', 'Lower slowly'], mistakes: ['Going too heavy', 'Swinging', 'Shrugging'] },
        { name: 'Front Raise', sets: 2, reps: '12-15', rest: '60 sec', difficulty: 'Beginner', muscle: 'Front Delts', instructions: ['Hold weights in front of thighs', 'Raise to eye level', 'Alternate arms if needed', 'Control descent'], mistakes: ['Using momentum', 'Leaning back', 'Going too heavy'] },
      ],
      intermediate: [
        { name: 'Dumbbell Shoulder Press', sets: 4, reps: '8-10', rest: '75 sec', difficulty: 'Intermediate', muscle: 'Shoulders', instructions: ['Standing for core engagement', 'Press overhead to full extension', 'Lower past ear level', 'Control throughout'], mistakes: ['Excessive back arch', 'Half reps', 'Using momentum'] },
        { name: 'Lateral Raise', sets: 4, reps: '12-15', rest: '60 sec', difficulty: 'Intermediate', muscle: 'Side Delts', instructions: ['Strict form', 'Raise to shoulder height', 'Hold at top briefly', 'Slow negative'], mistakes: ['Going too heavy', 'Swinging', 'Not pausing at top'] },
        { name: 'Rear Delt Fly', sets: 3, reps: '15-20', rest: '60 sec', difficulty: 'Intermediate', muscle: 'Rear Delts', instructions: ['Bend forward at hips', 'Light dumbbells', 'Raise to sides', 'Squeeze shoulder blades'], mistakes: ['Not bending enough', 'Using too much weight', 'Rushing'] },
      ],
      advanced: [
        { name: 'Arnold Press', sets: 4, reps: '8-10', rest: '90 sec', difficulty: 'Advanced', muscle: 'Shoulders', instructions: ['Full rotation through the press', 'Heavy but controlled', 'Seated or standing', 'Focus on mind-muscle connection'], mistakes: ['Rushing rotation', 'Going too heavy', 'Losing form'] },
        { name: 'Lateral Raise', sets: 4, reps: '12-15', rest: '45 sec', difficulty: 'Advanced', muscle: 'Side Delts', instructions: ['Use mechanical drop sets', 'Strict form throughout', 'Pause at top', 'Control descent'], mistakes: ['Breaking form for reps', 'Using momentum', 'Not reaching failure'] },
        { name: 'Push Ups', sets: 3, reps: '15-20', rest: '60 sec', difficulty: 'Advanced', muscle: 'Shoulders / Chest', instructions: ['Pike push-up position for more shoulder emphasis', 'Lower head towards floor', 'Push up to starting position', 'Keep legs straight'], mistakes: ['Not enough pike angle', 'Flaring elbows', 'Rushing reps'] },
      ]
    }
  },
  biceps: {
    gym: {
      beginner: [
        { name: 'Dumbbell Bicep Curl', sets: 3, reps: '10-12', rest: '60 sec', difficulty: 'Beginner', muscle: 'Biceps', instructions: ['Stand with dumbbells at sides', 'Curl weights to shoulders', 'Keep elbows stationary', 'Lower with control'], mistakes: ['Swinging body', 'Moving elbows forward', 'Using momentum'] },
        { name: 'Hammer Curl', sets: 3, reps: '10-12', rest: '60 sec', difficulty: 'Beginner', muscle: 'Biceps / Forearms', instructions: ['Hold dumbbells with neutral grip (palms facing each other)', 'Curl to shoulder height', 'Keep elbows pinned to sides', 'Lower slowly'], mistakes: ['Swinging', 'Moving elbows', 'Going too fast'] },
      ],
      intermediate: [
        { name: 'Barbell Curl', sets: 3, reps: '8-10', rest: '75 sec', difficulty: 'Intermediate', muscle: 'Biceps', instructions: ['Stand with shoulder-width grip', 'Curl bar to shoulders', 'Squeeze at top', 'Control the negative'], mistakes: ['Leaning back', 'Swinging bar', 'Partial reps'] },
        { name: 'Incline Dumbbell Curl', sets: 3, reps: '10-12', rest: '60 sec', difficulty: 'Intermediate', muscle: 'Biceps', instructions: ['Set bench at 45 degrees', 'Let arms hang straight down', 'Curl up with control', 'Maximum stretch at bottom'], mistakes: ['Not letting arms hang', 'Using momentum', 'Rushing'] },
        { name: 'Hammer Curl', sets: 3, reps: '10-12', rest: '60 sec', difficulty: 'Intermediate', muscle: 'Biceps / Forearms', instructions: ['Neutral grip curls', 'Alternate arms or together', 'Squeeze at top', 'Slow negative'], mistakes: ['Swinging', 'Moving elbows forward', 'Going too heavy'] },
      ],
      advanced: [
        { name: 'Barbell Curl', sets: 4, reps: '6-8', rest: '75 sec', difficulty: 'Advanced', muscle: 'Biceps', instructions: ['Heavy but strict form', 'No body swing', 'Full range of motion', 'Squeeze and hold at top'], mistakes: ['Cheat curling', 'Partial range', 'Not squeezing'] },
        { name: 'Preacher Curl', sets: 3, reps: '8-10', rest: '60 sec', difficulty: 'Advanced', muscle: 'Biceps', instructions: ['Arms fully on pad', 'Curl to full contraction', 'Slow eccentric (3 sec)', 'Full extension at bottom'], mistakes: ['Lifting elbows off pad', 'Partial range', 'Going too heavy'] },
        { name: 'Concentration Curl', sets: 3, reps: '10-12', rest: '60 sec', difficulty: 'Advanced', muscle: 'Biceps', instructions: ['Sit with elbow against inner thigh', 'Curl with focus on mind-muscle connection', 'Squeeze hard at top', 'Controlled negative'], mistakes: ['Using momentum', 'Moving elbow off thigh', 'Rushing'] },
      ]
    },
    home: {
      beginner: [
        { name: 'Dumbbell Bicep Curl', sets: 3, reps: '10-12', rest: '60 sec', difficulty: 'Beginner', muscle: 'Biceps', instructions: ['Stand with dumbbells or water bottles', 'Curl to shoulders', 'Keep elbows stationary', 'Lower slowly'], mistakes: ['Swinging', 'Moving elbows', 'Going too fast'] },
        { name: 'Hammer Curl', sets: 3, reps: '10-12', rest: '60 sec', difficulty: 'Beginner', muscle: 'Biceps', instructions: ['Neutral grip', 'Curl to shoulder height', 'Elbows at sides', 'Control the motion'], mistakes: ['Using momentum', 'Moving elbows', 'Partial range'] },
      ],
      intermediate: [
        { name: 'Dumbbell Bicep Curl', sets: 3, reps: '10-12', rest: '60 sec', difficulty: 'Intermediate', muscle: 'Biceps', instructions: ['Alternate arms or together', 'Full range of motion', 'Squeeze at top', 'Slow negative'], mistakes: ['Swinging', 'Half reps', 'Going too fast'] },
        { name: 'Concentration Curl', sets: 3, reps: '10-12', rest: '60 sec', difficulty: 'Intermediate', muscle: 'Biceps', instructions: ['Seated with elbow on thigh', 'Curl with control', 'Peak contraction', 'Lower fully'], mistakes: ['Using body momentum', 'Moving elbow', 'Rushing'] },
        { name: 'Resistance Band Curl', sets: 3, reps: '12-15', rest: '45 sec', difficulty: 'Intermediate', muscle: 'Biceps', instructions: ['Stand on band', 'Curl handles up', 'Keep elbows tight', 'Control throughout'], mistakes: ['Letting band snap back', 'Not controlling eccentric', 'Poor band placement'] },
      ],
      advanced: [
        { name: 'Chin Ups', sets: 4, reps: '6-10', rest: '90 sec', difficulty: 'Advanced', muscle: 'Biceps / Lats', instructions: ['Underhand grip on bar', 'Pull chin above bar', 'Slow negative', 'Full extension at bottom'], mistakes: ['Kipping', 'Half reps', 'Not controlling negative'] },
        { name: 'Dumbbell Bicep Curl', sets: 4, reps: '8-10', rest: '60 sec', difficulty: 'Advanced', muscle: 'Biceps', instructions: ['Heavy weight, strict form', 'Full range of motion', 'Squeeze at top', '3-sec negative'], mistakes: ['Cheat curling', 'Short range', 'Going too fast'] },
        { name: 'Hammer Curl', sets: 3, reps: '10-12', rest: '60 sec', difficulty: 'Advanced', muscle: 'Biceps / Forearms', instructions: ['Heavy dumbbells', 'Strict form', 'Squeeze at top', 'Slow eccentric'], mistakes: ['Swinging', 'Moving elbows', 'Using momentum'] },
      ]
    }
  },
  triceps: {
    gym: {
      beginner: [
        { name: 'Tricep Rope Pushdown', sets: 3, reps: '12-15', rest: '60 sec', difficulty: 'Beginner', muscle: 'Triceps', instructions: ['Stand facing cable machine', 'Push rope down and spread at bottom', 'Keep elbows at sides', 'Control the return'], mistakes: ['Leaning over the bar', 'Moving elbows', 'Using too much weight'] },
        { name: 'Bench Dips', sets: 3, reps: '10-12', rest: '60 sec', difficulty: 'Beginner', muscle: 'Triceps', instructions: ['Hands on bench behind you', 'Lower body by bending elbows', 'Push back up', 'Keep back close to bench'], mistakes: ['Going too deep', 'Flaring elbows', 'Not engaging triceps'] },
      ],
      intermediate: [
        { name: 'Tricep Pushdown', sets: 3, reps: '10-12', rest: '60 sec', difficulty: 'Intermediate', muscle: 'Triceps', instructions: ['Stand facing cable machine', 'Push bar down to full extension', 'Squeeze triceps hard', 'Slow return'], mistakes: ['Using too much weight', 'Moving elbows', 'Leaning forward'] },
        { name: 'Skull Crushers', sets: 3, reps: '10-12', rest: '75 sec', difficulty: 'Intermediate', muscle: 'Triceps', instructions: ['Lie on bench with EZ bar or dumbbells', 'Lower weight to forehead area', 'Extend arms back up', 'Keep elbows stationary'], mistakes: ['Flaring elbows', 'Moving upper arms', 'Going too heavy'] },
        { name: 'Overhead Tricep Extension', sets: 3, reps: '10-12', rest: '60 sec', difficulty: 'Intermediate', muscle: 'Triceps', instructions: ['Hold dumbbell behind head with both hands', 'Extend arms overhead', 'Squeeze at top', 'Lower with control'], mistakes: ['Flaring elbows wide', 'Not fully extending', 'Arching back'] },
      ],
      advanced: [
        { name: 'Close Grip Bench Press', sets: 4, reps: '6-8', rest: '90 sec', difficulty: 'Advanced', muscle: 'Triceps', instructions: ['Hands shoulder-width apart on bar', 'Lower to lower chest', 'Press up with triceps', 'Keep elbows tucked'], mistakes: ['Grip too narrow', 'Flaring elbows', 'Bouncing off chest'] },
        { name: 'Tricep Dips', sets: 4, reps: '8-12', rest: '90 sec', difficulty: 'Advanced', muscle: 'Triceps', instructions: ['Upright body position', 'Lower until elbows at 90 degrees', 'Press up with triceps', 'Add weight if needed'], mistakes: ['Going too deep', 'Leaning forward (shifts to chest)', 'Using momentum'] },
        { name: 'Skull Crushers', sets: 3, reps: '8-10', rest: '75 sec', difficulty: 'Advanced', muscle: 'Triceps', instructions: ['Heavy weight, strict form', 'Lower to forehead or behind head', 'Full extension', 'Controlled tempo'], mistakes: ['Too heavy for form', 'Moving elbows', 'Rushing reps'] },
      ]
    },
    home: {
      beginner: [
        { name: 'Bench Dips', sets: 3, reps: '8-12', rest: '60 sec', difficulty: 'Beginner', muscle: 'Triceps', instructions: ['Use chair or sturdy surface', 'Lower body by bending elbows', 'Push back up', 'Keep back close to surface'], mistakes: ['Going too deep', 'Flaring elbows out', 'Pushing from legs'] },
        { name: 'Diamond Push Ups', sets: 2, reps: '6-10', rest: '60 sec', difficulty: 'Beginner', muscle: 'Triceps', instructions: ['Hands in diamond position', 'Lower chest to hands', 'Press up', 'Keep elbows close'], mistakes: ['Flaring elbows', 'Sagging hips', 'Partial reps'] },
      ],
      intermediate: [
        { name: 'Dumbbell Tricep Extension', sets: 3, reps: '10-12', rest: '60 sec', difficulty: 'Intermediate', muscle: 'Triceps', instructions: ['Hold dumbbell behind head', 'Extend arms overhead', 'Squeeze at top', 'Lower slowly'], mistakes: ['Flaring elbows', 'Not extending fully', 'Arching back'] },
        { name: 'Tricep Kickback', sets: 3, reps: '12-15', rest: '60 sec', difficulty: 'Intermediate', muscle: 'Triceps', instructions: ['Bend forward at hips', 'Extend arm back fully', 'Squeeze tricep', 'Control return'], mistakes: ['Not extending fully', 'Swinging', 'Moving upper arm'] },
        { name: 'Diamond Push Ups', sets: 3, reps: '10-15', rest: '60 sec', difficulty: 'Intermediate', muscle: 'Triceps', instructions: ['Diamond hand position', 'Full range of motion', 'Control tempo', 'Keep elbows close'], mistakes: ['Flaring elbows', 'Sagging hips', 'Rushing'] },
      ],
      advanced: [
        { name: 'Diamond Push Ups', sets: 4, reps: '15-20', rest: '45 sec', difficulty: 'Advanced', muscle: 'Triceps', instructions: ['Strict form', 'Slow eccentric', 'Full extension', 'Controlled throughout'], mistakes: ['Breaking form at fatigue', 'Partial reps', 'Using momentum'] },
        { name: 'Dumbbell Tricep Extension', sets: 4, reps: '8-10', rest: '60 sec', difficulty: 'Advanced', muscle: 'Triceps', instructions: ['Heavy dumbbell', 'Full range of motion', 'Squeeze hard at top', '3-sec negative'], mistakes: ['Not controlling weight', 'Moving elbows', 'Arching back'] },
        { name: 'Bench Dips', sets: 3, reps: '15-20', rest: '60 sec', difficulty: 'Advanced', muscle: 'Triceps', instructions: ['Add weight on lap', 'Full range of motion', 'Squeeze at top', 'Controlled negative'], mistakes: ['Going too deep', 'Not adding progressive overload', 'Rushing'] },
      ]
    }
  },
  legs: {
    gym: {
      beginner: [
        { name: 'Leg Press', sets: 3, reps: '10-12', rest: '90 sec', difficulty: 'Beginner', muscle: 'Quads / Glutes', instructions: ['Sit with back flat against pad', 'Place feet shoulder-width on platform', 'Push until legs extended (not locked)', 'Lower with control'], mistakes: ['Locking knees', 'Lifting hips off pad', 'Too narrow foot placement'] },
        { name: 'Leg Extension', sets: 3, reps: '12-15', rest: '60 sec', difficulty: 'Beginner', muscle: 'Quads', instructions: ['Sit with back against pad', 'Extend legs to full extension', 'Squeeze quads at top', 'Lower with control'], mistakes: ['Using momentum', 'Going too heavy', 'Hyperextending knees'] },
        { name: 'Leg Curl', sets: 3, reps: '12-15', rest: '60 sec', difficulty: 'Beginner', muscle: 'Hamstrings', instructions: ['Lie face down on machine', 'Curl legs towards glutes', 'Squeeze hamstrings', 'Lower slowly'], mistakes: ['Lifting hips', 'Using momentum', 'Partial range'] },
        { name: 'Calf Raise', sets: 3, reps: '15-20', rest: '45 sec', difficulty: 'Beginner', muscle: 'Calves', instructions: ['Stand on step or calf raise machine', 'Rise up on toes', 'Squeeze at top', 'Lower below step level'], mistakes: ['Bouncing', 'Partial range', 'Going too fast'] },
      ],
      intermediate: [
        { name: 'Barbell Squat', sets: 4, reps: '8-10', rest: '120 sec', difficulty: 'Intermediate', muscle: 'Quads / Glutes', instructions: ['Bar on upper back (high bar) or rear delts (low bar)', 'Squat to at least parallel', 'Drive through whole foot', 'Keep chest up'], mistakes: ['Knees caving in', 'Rounding back', 'Not reaching depth'] },
        { name: 'Romanian Deadlift', sets: 3, reps: '10-12', rest: '90 sec', difficulty: 'Intermediate', muscle: 'Hamstrings / Glutes', instructions: ['Hold bar at hips', 'Hinge at hips, pushing them back', 'Lower bar along legs', 'Feel hamstring stretch and return'], mistakes: ['Rounding back', 'Bending knees too much', 'Bar drifting from legs'] },
        { name: 'Leg Press', sets: 3, reps: '10-12', rest: '90 sec', difficulty: 'Intermediate', muscle: 'Quads', instructions: ['Moderate to heavy weight', 'Full range of motion', 'Control negative', 'Do not lock knees'], mistakes: ['Locking knees', 'Partial range', 'Lifting butt off seat'] },
        { name: 'Walking Lunges', sets: 3, reps: '12 each leg', rest: '75 sec', difficulty: 'Intermediate', muscle: 'Quads / Glutes', instructions: ['Step forward into lunge', 'Lower until back knee nearly touches floor', 'Drive through front heel', 'Alternate legs'], mistakes: ['Knee going past toe excessively', 'Short steps', 'Leaning forward'] },
        { name: 'Standing Calf Raise', sets: 4, reps: '15-20', rest: '45 sec', difficulty: 'Intermediate', muscle: 'Calves', instructions: ['Full range of motion', 'Squeeze at top', 'Slow negative', 'Full stretch at bottom'], mistakes: ['Bouncing', 'Partial range', 'Going too fast'] },
      ],
      advanced: [
        { name: 'Barbell Squat', sets: 5, reps: '5-6', rest: '180 sec', difficulty: 'Advanced', muscle: 'Quads / Glutes', instructions: ['Heavy weight, perfect form', 'Below parallel', 'Brace core hard', 'Drive explosively'], mistakes: ['Rounding back', 'Knees caving', 'Cutting depth'] },
        { name: 'Romanian Deadlift', sets: 4, reps: '8-10', rest: '90 sec', difficulty: 'Advanced', muscle: 'Hamstrings', instructions: ['Heavy barbell or dumbbells', 'Deep stretch at bottom', 'Powerful hip extension', 'Control throughout'], mistakes: ['Rounding back', 'Using too much momentum', 'Not stretching enough'] },
        { name: 'Bulgarian Split Squat', sets: 3, reps: '8-10 each', rest: '90 sec', difficulty: 'Advanced', muscle: 'Quads / Glutes', instructions: ['Rear foot elevated on bench', 'Lower until front thigh is parallel', 'Drive through front heel', 'Keep torso upright'], mistakes: ['Leaning forward', 'Not going deep enough', 'Losing balance'] },
        { name: 'Hip Thrust', sets: 4, reps: '10-12', rest: '90 sec', difficulty: 'Advanced', muscle: 'Glutes', instructions: ['Upper back on bench, barbell on hips', 'Drive hips up to full extension', 'Squeeze glutes hard at top', 'Lower with control'], mistakes: ['Hyperextending lower back', 'Not squeezing at top', 'Using too much momentum'] },
        { name: 'Standing Calf Raise', sets: 4, reps: '12-15', rest: '45 sec', difficulty: 'Advanced', muscle: 'Calves', instructions: ['Heavy weight', 'Full ROM', 'Pause at top and bottom', 'Various foot positions'], mistakes: ['Bouncing', 'Partial range', 'Not varying angles'] },
      ]
    },
    home: {
      beginner: [
        { name: 'Bodyweight Squat', sets: 3, reps: '12-15', rest: '60 sec', difficulty: 'Beginner', muscle: 'Quads / Glutes', instructions: ['Stand with feet shoulder-width apart', 'Squat down as if sitting in a chair', 'Keep chest up and knees over toes', 'Push through heels to stand'], mistakes: ['Knees caving inward', 'Not going deep enough', 'Rounding back'] },
        { name: 'Lunges', sets: 3, reps: '10 each leg', rest: '60 sec', difficulty: 'Beginner', muscle: 'Quads / Glutes', instructions: ['Step forward into lunge', 'Lower until back knee nearly touches floor', 'Push back to starting position', 'Alternate legs'], mistakes: ['Knee going past toe', 'Short steps', 'Leaning forward'] },
        { name: 'Glute Bridge', sets: 3, reps: '15-20', rest: '45 sec', difficulty: 'Beginner', muscle: 'Glutes', instructions: ['Lie on back with knees bent', 'Push hips up squeezing glutes', 'Hold at top briefly', 'Lower slowly'], mistakes: ['Pushing from lower back', 'Not squeezing glutes', 'Going too fast'] },
        { name: 'Calf Raise', sets: 3, reps: '15-20', rest: '45 sec', difficulty: 'Beginner', muscle: 'Calves', instructions: ['Stand on edge of step', 'Rise up on toes', 'Lower heels below step', 'Repeat with control'], mistakes: ['Bouncing', 'Not using full range', 'Going too fast'] },
      ],
      intermediate: [
        { name: 'Goblet Squat', sets: 4, reps: '10-12', rest: '75 sec', difficulty: 'Intermediate', muscle: 'Quads / Glutes', instructions: ['Hold dumbbell at chest', 'Squat deep', 'Keep torso upright', 'Drive through heels'], mistakes: ['Not going deep enough', 'Rounding back', 'Letting weight pull you forward'] },
        { name: 'Bulgarian Split Squat', sets: 3, reps: '10-12 each', rest: '75 sec', difficulty: 'Intermediate', muscle: 'Quads / Glutes', instructions: ['Rear foot on chair or bench', 'Lower until front thigh is parallel', 'Drive up through front heel', 'Keep torso upright'], mistakes: ['Leaning forward', 'Not going deep', 'Losing balance'] },
        { name: 'Romanian Deadlift', sets: 3, reps: '10-12', rest: '75 sec', difficulty: 'Intermediate', muscle: 'Hamstrings', instructions: ['Hold dumbbells at hips', 'Hinge forward at hips', 'Feel hamstring stretch', 'Return to standing'], mistakes: ['Rounding back', 'Bending knees too much', 'Not hinging enough'] },
        { name: 'Standing Calf Raise', sets: 3, reps: '15-20', rest: '45 sec', difficulty: 'Intermediate', muscle: 'Calves', instructions: ['Hold dumbbells for added resistance', 'Full range of motion', 'Squeeze at top', 'Slow negative'], mistakes: ['Bouncing', 'Partial range', 'Going too fast'] },
      ],
      advanced: [
        { name: 'Goblet Squat', sets: 4, reps: '12-15', rest: '60 sec', difficulty: 'Advanced', muscle: 'Quads / Glutes', instructions: ['Heavy dumbbell', 'Deep squat with pause at bottom', 'Explosive drive up', 'Control throughout'], mistakes: ['Not going deep', 'Rushing', 'Rounding back'] },
        { name: 'Bulgarian Split Squat', sets: 4, reps: '10-12 each', rest: '90 sec', difficulty: 'Advanced', muscle: 'Quads / Glutes', instructions: ['Hold heavy dumbbells', 'Full range of motion', 'Slow eccentric', 'Drive through heel'], mistakes: ['Not going deep enough', 'Losing balance', 'Using momentum'] },
        { name: 'Romanian Deadlift', sets: 4, reps: '8-10', rest: '90 sec', difficulty: 'Advanced', muscle: 'Hamstrings', instructions: ['Heavy dumbbells', 'Deep stretch', 'Controlled movement', 'Squeeze glutes at top'], mistakes: ['Rounding back', 'Not stretching enough', 'Using momentum'] },
        { name: 'Hip Thrust', sets: 4, reps: '12-15', rest: '75 sec', difficulty: 'Advanced', muscle: 'Glutes', instructions: ['Back on couch/bench, weight on hips', 'Drive hips high', 'Squeeze glutes hard', 'Lower with control'], mistakes: ['Not squeezing at top', 'Hyperextending back', 'Using momentum'] },
      ]
    }
  },
  abs: {
    gym: {
      beginner: [
        { name: 'Crunches', sets: 3, reps: '15-20', rest: '45 sec', difficulty: 'Beginner', muscle: 'Abs', instructions: ['Lie on back with knees bent', 'Curl shoulders off floor', 'Squeeze abs at top', 'Lower with control'], mistakes: ['Pulling on neck', 'Using momentum', 'Partial range'] },
        { name: 'Plank', sets: 3, reps: '20-30 sec', rest: '45 sec', difficulty: 'Beginner', muscle: 'Core', instructions: ['Forearms and toes on floor', 'Body in straight line', 'Engage core throughout', 'Breathe steadily'], mistakes: ['Hips sagging', 'Hips too high', 'Holding breath'] },
        { name: 'Leg Raise', sets: 3, reps: '10-12', rest: '45 sec', difficulty: 'Beginner', muscle: 'Lower Abs', instructions: ['Lie on back with hands under hips', 'Raise legs to 90 degrees', 'Lower slowly without touching floor', 'Keep lower back pressed down'], mistakes: ['Arching lower back', 'Using momentum', 'Going too fast'] },
      ],
      intermediate: [
        { name: 'Cable Crunch', sets: 3, reps: '12-15', rest: '60 sec', difficulty: 'Intermediate', muscle: 'Abs', instructions: ['Kneel in front of cable machine', 'Crunch down towards floor', 'Squeeze abs hard', 'Control the return'], mistakes: ['Using hip flexors', 'Not crunching deep enough', 'Too much weight'] },
        { name: 'Hanging Leg Raise', sets: 3, reps: '10-12', rest: '60 sec', difficulty: 'Intermediate', muscle: 'Lower Abs', instructions: ['Hang from bar', 'Raise legs to 90 degrees or higher', 'Control the swing', 'Lower slowly'], mistakes: ['Swinging', 'Using momentum', 'Partial range'] },
        { name: 'Russian Twist', sets: 3, reps: '20 (10 each side)', rest: '45 sec', difficulty: 'Intermediate', muscle: 'Obliques', instructions: ['Sit with torso at 45 degrees', 'Hold weight or hands together', 'Rotate torso side to side', 'Keep feet off floor for more challenge'], mistakes: ['Rounding back', 'Moving hips instead of torso', 'Going too fast'] },
        { name: 'Plank', sets: 3, reps: '45-60 sec', rest: '45 sec', difficulty: 'Intermediate', muscle: 'Core', instructions: ['Forearms on floor', 'Body perfectly straight', 'Squeeze every muscle', 'Breathe normally'], mistakes: ['Sagging hips', 'Hips too high', 'Not engaging glutes'] },
      ],
      advanced: [
        { name: 'Hanging Leg Raise', sets: 4, reps: '12-15', rest: '60 sec', difficulty: 'Advanced', muscle: 'Abs', instructions: ['Raise legs to bar (toes to bar)', 'Control the descent', 'Minimal swing', 'Full range of motion'], mistakes: ['Excessive swinging', 'Using momentum', 'Half reps'] },
        { name: 'Ab Rollout', sets: 3, reps: '10-12', rest: '75 sec', difficulty: 'Advanced', muscle: 'Core', instructions: ['Kneel with ab wheel', 'Roll out as far as possible', 'Engage core to pull back', 'Keep back flat'], mistakes: ['Arching lower back', 'Not going far enough', 'Using hip flexors'] },
        { name: 'Cable Crunch', sets: 4, reps: '12-15', rest: '60 sec', difficulty: 'Advanced', muscle: 'Abs', instructions: ['Heavy weight', 'Deep crunch', 'Squeeze and hold', 'Controlled negative'], mistakes: ['Not isolating abs', 'Using momentum', 'Half reps'] },
        { name: 'Side Plank', sets: 3, reps: '30-45 sec each', rest: '45 sec', difficulty: 'Advanced', muscle: 'Obliques', instructions: ['Forearm on floor, body sideways', 'Hips up, body in line', 'Hold position', 'Breathe normally'], mistakes: ['Dropping hips', 'Not stacking feet', 'Holding breath'] },
      ]
    },
    home: {
      beginner: [
        { name: 'Crunches', sets: 3, reps: '15-20', rest: '45 sec', difficulty: 'Beginner', muscle: 'Abs', instructions: ['Lie on back', 'Curl shoulders off floor', 'Squeeze abs', 'Lower slowly'], mistakes: ['Pulling on neck', 'Using momentum', 'Partial range'] },
        { name: 'Plank', sets: 3, reps: '20-30 sec', rest: '45 sec', difficulty: 'Beginner', muscle: 'Core', instructions: ['Forearms and toes', 'Straight line body', 'Engage everything', 'Breathe steadily'], mistakes: ['Sagging hips', 'Hips pike up', 'Holding breath'] },
        { name: 'Dead Bug', sets: 3, reps: '10 each side', rest: '45 sec', difficulty: 'Beginner', muscle: 'Core', instructions: ['Lie on back, arms up, knees at 90 degrees', 'Extend opposite arm and leg', 'Keep lower back pressed to floor', 'Return and alternate'], mistakes: ['Arching back', 'Going too fast', 'Not pressing back down'] },
      ],
      intermediate: [
        { name: 'Bicycle Crunches', sets: 3, reps: '20 (10 each)', rest: '45 sec', difficulty: 'Intermediate', muscle: 'Abs / Obliques', instructions: ['Lie on back', 'Bring knee to opposite elbow', 'Rotate torso', 'Alternate sides'], mistakes: ['Pulling on neck', 'Going too fast', 'Not rotating enough'] },
        { name: 'Mountain Climbers', sets: 3, reps: '20 (10 each)', rest: '45 sec', difficulty: 'Intermediate', muscle: 'Core / Cardio', instructions: ['Start in push-up position', 'Drive knees to chest alternating', 'Keep hips level', 'Maintain steady pace'], mistakes: ['Hips bouncing up', 'Not bringing knee far enough', 'Going too slow or too fast'] },
        { name: 'Leg Raise', sets: 3, reps: '12-15', rest: '45 sec', difficulty: 'Intermediate', muscle: 'Lower Abs', instructions: ['Lie flat on back', 'Raise legs to 90 degrees', 'Lower slowly without touching', 'Keep back pressed down'], mistakes: ['Arching back', 'Using momentum', 'Partial range'] },
        { name: 'Plank', sets: 3, reps: '45-60 sec', rest: '45 sec', difficulty: 'Intermediate', muscle: 'Core', instructions: ['Perfect form', 'Engage everything', 'Steady breathing', 'Add variations if too easy'], mistakes: ['Losing form', 'Sagging', 'Holding breath'] },
      ],
      advanced: [
        { name: 'V-Ups', sets: 4, reps: '12-15', rest: '45 sec', difficulty: 'Advanced', muscle: 'Abs', instructions: ['Lie flat', 'Simultaneously raise legs and torso', 'Touch toes at top', 'Lower with control'], mistakes: ['Using momentum', 'Not touching toes', 'Bending knees'] },
        { name: 'Mountain Climbers', sets: 3, reps: '30 (15 each)', rest: '30 sec', difficulty: 'Advanced', muscle: 'Core / Cardio', instructions: ['Fast pace', 'Keep hips level', 'Full range of motion', 'Maintain form'], mistakes: ['Hips bouncing', 'Partial range', 'Losing form'] },
        { name: 'Russian Twist', sets: 3, reps: '20 (10 each)', rest: '45 sec', difficulty: 'Advanced', muscle: 'Obliques', instructions: ['Feet off floor', 'Hold weight', 'Full rotation', 'Controlled pace'], mistakes: ['Rounding back', 'Moving hips', 'Going too fast'] },
        { name: 'Plank', sets: 3, reps: '60-90 sec', rest: '45 sec', difficulty: 'Advanced', muscle: 'Core', instructions: ['Add weight on back', 'Perfect form entire duration', 'Engage every muscle', 'Control breathing'], mistakes: ['Losing form late', 'Sagging', 'Not challenging enough'] },
      ]
    }
  }
};

// Split templates by goal and available days
const splitTemplates = {
  3: {
    'fat_loss': [
      { day: 'Monday', focus: 'Full Body + Cardio', muscles: ['chest', 'back', 'legs'] },
      { day: 'Wednesday', focus: 'Full Body + Cardio', muscles: ['shoulders', 'legs', 'abs'] },
      { day: 'Friday', focus: 'Full Body + Cardio', muscles: ['back', 'biceps', 'triceps', 'abs'] },
    ],
    'muscle_gain': [
      { day: 'Monday', focus: 'Push (Chest, Shoulders, Triceps)', muscles: ['chest', 'shoulders', 'triceps'] },
      { day: 'Wednesday', focus: 'Pull (Back, Biceps)', muscles: ['back', 'biceps'] },
      { day: 'Friday', focus: 'Legs & Abs', muscles: ['legs', 'abs'] },
    ],
    'default': [
      { day: 'Monday', focus: 'Upper Body', muscles: ['chest', 'back', 'shoulders'] },
      { day: 'Wednesday', focus: 'Lower Body & Core', muscles: ['legs', 'abs'] },
      { day: 'Friday', focus: 'Full Body', muscles: ['chest', 'back', 'biceps', 'triceps'] },
    ]
  },
  4: {
    'muscle_gain': [
      { day: 'Monday', focus: 'Chest & Triceps', muscles: ['chest', 'triceps'] },
      { day: 'Tuesday', focus: 'Back & Biceps', muscles: ['back', 'biceps'] },
      { day: 'Thursday', focus: 'Legs', muscles: ['legs'] },
      { day: 'Friday', focus: 'Shoulders & Abs', muscles: ['shoulders', 'abs'] },
    ],
    'default': [
      { day: 'Monday', focus: 'Upper Body Push', muscles: ['chest', 'shoulders', 'triceps'] },
      { day: 'Tuesday', focus: 'Lower Body', muscles: ['legs'] },
      { day: 'Thursday', focus: 'Upper Body Pull', muscles: ['back', 'biceps'] },
      { day: 'Friday', focus: 'Full Body & Core', muscles: ['legs', 'shoulders', 'abs'] },
    ]
  },
  5: {
    'muscle_gain': [
      { day: 'Monday', focus: 'Chest & Triceps', muscles: ['chest', 'triceps'] },
      { day: 'Tuesday', focus: 'Back & Biceps', muscles: ['back', 'biceps'] },
      { day: 'Wednesday', focus: 'Legs', muscles: ['legs'] },
      { day: 'Thursday', focus: 'Rest / Active Recovery', muscles: [] },
      { day: 'Friday', focus: 'Shoulders & Abs', muscles: ['shoulders', 'abs'] },
      { day: 'Saturday', focus: 'Full Body', muscles: ['chest', 'back', 'legs'] },
    ],
    'strength': [
      { day: 'Monday', focus: 'Squat Focus', muscles: ['legs'] },
      { day: 'Tuesday', focus: 'Bench Press Focus', muscles: ['chest', 'triceps'] },
      { day: 'Wednesday', focus: 'Rest / Active Recovery', muscles: [] },
      { day: 'Thursday', focus: 'Deadlift Focus', muscles: ['back', 'legs'] },
      { day: 'Friday', focus: 'Overhead Press Focus', muscles: ['shoulders', 'biceps', 'abs'] },
    ],
    'default': [
      { day: 'Monday', focus: 'Chest & Triceps', muscles: ['chest', 'triceps'] },
      { day: 'Tuesday', focus: 'Back & Biceps', muscles: ['back', 'biceps'] },
      { day: 'Wednesday', focus: 'Legs', muscles: ['legs'] },
      { day: 'Thursday', focus: 'Shoulders & Abs', muscles: ['shoulders', 'abs'] },
      { day: 'Friday', focus: 'Full Body', muscles: ['chest', 'back', 'legs'] },
    ]
  },
  6: {
    'muscle_gain': [
      { day: 'Monday', focus: 'Push (Chest, Shoulders, Triceps)', muscles: ['chest', 'shoulders', 'triceps'] },
      { day: 'Tuesday', focus: 'Pull (Back, Biceps)', muscles: ['back', 'biceps'] },
      { day: 'Wednesday', focus: 'Legs', muscles: ['legs'] },
      { day: 'Thursday', focus: 'Push (Chest, Shoulders, Triceps)', muscles: ['chest', 'shoulders', 'triceps'] },
      { day: 'Friday', focus: 'Pull (Back, Biceps)', muscles: ['back', 'biceps'] },
      { day: 'Saturday', focus: 'Legs & Abs', muscles: ['legs', 'abs'] },
    ],
    'default': [
      { day: 'Monday', focus: 'Chest & Triceps', muscles: ['chest', 'triceps'] },
      { day: 'Tuesday', focus: 'Back & Biceps', muscles: ['back', 'biceps'] },
      { day: 'Wednesday', focus: 'Legs', muscles: ['legs'] },
      { day: 'Thursday', focus: 'Shoulders & Abs', muscles: ['shoulders', 'abs'] },
      { day: 'Friday', focus: 'Full Body Strength', muscles: ['chest', 'back', 'legs'] },
      { day: 'Saturday', focus: 'Cardio & Core', muscles: ['abs'] },
    ]
  },
  2: {
    'default': [
      { day: 'Monday', focus: 'Upper Body', muscles: ['chest', 'back', 'shoulders', 'biceps', 'triceps'] },
      { day: 'Thursday', focus: 'Lower Body & Core', muscles: ['legs', 'abs'] },
    ]
  },
  7: {
    'default': [
      { day: 'Monday', focus: 'Chest', muscles: ['chest'] },
      { day: 'Tuesday', focus: 'Back', muscles: ['back'] },
      { day: 'Wednesday', focus: 'Shoulders & Abs', muscles: ['shoulders', 'abs'] },
      { day: 'Thursday', focus: 'Legs', muscles: ['legs'] },
      { day: 'Friday', focus: 'Arms', muscles: ['biceps', 'triceps'] },
      { day: 'Saturday', focus: 'Full Body / Weak Points', muscles: ['chest', 'back', 'legs'] },
      { day: 'Sunday', focus: 'Active Recovery / Light Cardio', muscles: ['abs'] },
    ]
  }
};

function getGoalKey(goal) {
  if (!goal) return 'default';
  const g = goal.toLowerCase();
  if (g.includes('fat') || g.includes('loss') || g.includes('recomp')) return 'fat_loss';
  if (g.includes('muscle') || g.includes('gain') || g.includes('six') || g.includes('abs')) return 'muscle_gain';
  if (g.includes('strength')) return 'strength';
  return 'default';
}

function generateDeterministicPlan(ctx) {
  const level = (ctx.fitness_experience || 'beginner').toLowerCase();
  const isGym = ctx.workout_location && ctx.workout_location.toLowerCase().includes('gym');
  const locationType = isGym ? 'gym' : 'home';
  const days = ctx.workout_days || 4;
  const goalKey = getGoalKey(ctx.primary_goal);

  const templates = splitTemplates[days] || splitTemplates[4];
  const split = templates[goalKey] || templates['default'];

  const warmUp = {
    name: 'Warm Up',
    description: 'Light cardio and dynamic stretching to prepare your body for the workout',
    duration: '5-10 minutes',
    exercises: [
      'Light jogging or jumping jacks (2-3 minutes)',
      'Arm circles (30 seconds each direction)',
      'Leg swings (10 each leg)',
      'Bodyweight squats (10 reps)',
      'Hip circles (10 each direction)',
      'Cat-cow stretch (10 reps)'
    ]
  };

  const coolDown = {
    name: 'Cool Down',
    description: 'Static stretching and controlled breathing to aid recovery',
    duration: '5-10 minutes',
    exercises: [
      'Hamstring stretch (30 seconds each side)',
      'Quad stretch (30 seconds each side)',
      'Shoulder stretch (30 seconds each arm)',
      'Chest stretch (30 seconds)',
      'Hip flexor stretch (30 seconds each side)',
      'Deep breathing (1-2 minutes)'
    ]
  };

  const schedule = split.map(dayTemplate => {
    if (dayTemplate.muscles.length === 0) {
      return {
        day: dayTemplate.day,
        focus: dayTemplate.focus,
        isRestDay: true,
        activities: [
          'Light walking (20-30 minutes)',
          'Gentle stretching or yoga',
          'Foam rolling',
          'Stay hydrated and focus on nutrition'
        ]
      };
    }

    let exercises = [];
    dayTemplate.muscles.forEach(muscle => {
      const muscleData = muscleGroupExercises[muscle];
      if (muscleData && muscleData[locationType] && muscleData[locationType][level]) {
        const muscleExercises = muscleData[locationType][level];
        // Take 2-3 exercises per muscle group based on how many muscles are trained that day
        const count = dayTemplate.muscles.length <= 2 ? 3 : 2;
        exercises.push(...muscleExercises.slice(0, count));
      }
    });

    // Attach video data
    exercises = exercises.map(ex => {
      const video = getExerciseVideo(ex.name);
      return {
        ...ex,
        description: `Target muscle: ${ex.muscle}. ${ex.sets} sets of ${ex.reps} reps with ${ex.rest} rest between sets.`,
        video: video
      };
    });

    // Add cardio for fat loss goals
    if (goalKey === 'fat_loss') {
      exercises.push({
        name: 'Cardio Finisher',
        sets: 1,
        reps: '15-20 minutes',
        rest: 'N/A',
        difficulty: level.charAt(0).toUpperCase() + level.slice(1),
        muscle: 'Cardiovascular',
        description: 'Choose: brisk walking on incline, cycling, rowing, or elliptical at moderate intensity',
        instructions: ['Choose your preferred cardio equipment', 'Maintain moderate intensity (can hold a conversation but slightly breathless)', 'Keep heart rate in fat-burning zone', 'Cool down with 2-3 minutes at easy pace'],
        mistakes: ['Going too intense and burning out', 'Skipping the cardio portion', 'Not staying hydrated'],
        video: getExerciseVideo('treadmill running')
      });
    }

    const durationMap = {
      '15-30 minutes': '25 minutes',
      '30-45 minutes': '40 minutes',
      '45-60 minutes': '50 minutes',
      '60-90 minutes': '75 minutes'
    };

    return {
      day: dayTemplate.day,
      focus: dayTemplate.focus,
      isRestDay: false,
      warmUp,
      coolDown,
      estimatedDuration: durationMap[ctx.workout_duration] || '45 minutes',
      exercises
    };
  });

  return {
    planName: `${ctx.primary_goal || 'Fitness'} Plan - ${level.charAt(0).toUpperCase() + level.slice(1)}`,
    level,
    location: locationType,
    daysPerWeek: days,
    goal: ctx.primary_goal,
    schedule,
    safetyNotes: [
      'Always warm up before starting your workout.',
      'Stay hydrated throughout your workout.',
      'If you experience any pain, dizziness, or unusual discomfort, stop exercising immediately.',
      'Listen to your body and rest when needed.',
      'Consult a healthcare professional before starting any new exercise program.',
      'Progress gradually — do not increase weight or intensity too quickly.',
      'Focus on proper form rather than lifting heavy weights.',
      'Allow adequate rest between workout days for recovery.'
    ],
    generatedAt: new Date().toISOString()
  };
}

// ============================================================
// MAIN API FUNCTIONS
// ============================================================

async function generateWorkoutPlan(userContext) {
  // Try AI-powered generation first
  const aiPrompt = `You are an expert personal fitness trainer. Generate a personalized workout plan based on this user profile:

Name: ${userContext.name}
Age: ${userContext.age}
Gender: ${userContext.gender || 'Not specified'}
Height: ${userContext.height_cm} cm
Weight: ${userContext.weight_kg} kg
Target Weight: ${userContext.target_weight_kg || 'Not set'} kg
BMI: ${userContext.bmi}
Fitness Experience: ${userContext.fitness_experience}
Exercise Duration: ${userContext.exercise_duration}
Workout Location: ${userContext.workout_location}
Days Per Week: ${userContext.workout_days}
Workout Duration: ${userContext.workout_duration}
Available Equipment: ${JSON.stringify(userContext.equipment)}
Medical Conditions: ${userContext.medical_conditions || 'None'}
Injuries: ${userContext.injuries || 'None'}
Joint Pain: ${userContext.joint_pain || 'None'}
Exercises to Avoid: ${userContext.exercises_to_avoid || 'None'}
Primary Goal: ${userContext.primary_goal}
Secondary Goal: ${userContext.secondary_goal || 'None'}

IMPORTANT: Return a JSON object with this structure:
{
  "planName": "string",
  "level": "beginner|intermediate|advanced",
  "location": "gym|home",
  "daysPerWeek": number,
  "goal": "string",
  "schedule": [
    {
      "day": "Monday",
      "focus": "Chest & Triceps",
      "isRestDay": false,
      "estimatedDuration": "45 minutes",
      "exercises": [
        {
          "name": "Exercise Name",
          "muscle": "Target Muscle",
          "sets": 3,
          "reps": "10-12",
          "rest": "60 sec",
          "difficulty": "Beginner",
          "description": "Brief description",
          "instructions": ["Step 1", "Step 2"],
          "mistakes": ["Common mistake 1", "Common mistake 2"]
        }
      ]
    }
  ],
  "safetyNotes": ["Safety note 1", "Safety note 2"]
}

RULES:
- Respect health limitations and injuries. Avoid exercises that might aggravate them.
- Match difficulty to experience level.
- Include warm-up and cool-down recommendations.
- Use only exercises that match the available equipment and location.
- Each exercise name must be a common, well-known exercise name.
- Do NOT invent video URLs.`;

  const aiResponse = await callGeminiAPI(aiPrompt, true);
  
  if (aiResponse) {
    try {
      let plan = JSON.parse(aiResponse);
      // Attach verified video data to each exercise
      if (plan.schedule) {
        plan.schedule = plan.schedule.map(day => {
          if (day.exercises) {
            day.exercises = day.exercises.map(ex => ({
              ...ex,
              video: getExerciseVideo(ex.name)
            }));
          }
          // Add warm-up and cool-down if missing
          if (!day.warmUp && !day.isRestDay) {
            day.warmUp = {
              name: 'Warm Up',
              description: 'Light cardio and dynamic stretching',
              duration: '5-10 minutes',
              exercises: ['Light cardio (2-3 min)', 'Dynamic stretching (3-5 min)']
            };
          }
          if (!day.coolDown && !day.isRestDay) {
            day.coolDown = {
              name: 'Cool Down',
              description: 'Static stretching',
              duration: '5-10 minutes',
              exercises: ['Full body static stretching (5-10 min)']
            };
          }
          return day;
        });
      }
      plan.generatedAt = new Date().toISOString();
      return plan;
    } catch (parseErr) {
      console.error('Failed to parse AI response, falling back to deterministic engine');
    }
  }

  // Fallback to deterministic generation
  return generateDeterministicPlan(userContext);
}

async function chatWithAI(message, context, history) {
  const systemPrompt = `You are FitCoach AI, a knowledgeable and supportive personal fitness coach assistant.

USER PROFILE:
- Fitness Experience: ${context.profile?.fitness_experience || 'Unknown'}
- Goal: ${context.goals?.primary_goal || 'General Fitness'}
- Workout Location: ${context.profile?.workout_location || 'Unknown'}
- Current Weight: ${context.profile?.current_weight_kg || 'Unknown'} kg
- Target Weight: ${context.profile?.target_weight_kg || 'Not set'} kg
- Health Conditions: ${context.health?.medical_conditions || 'None reported'}
- Injuries: ${context.health?.injuries || 'None reported'}
- Workout Days: ${context.profile?.workout_days_per_week || 'Unknown'} days/week

RECENT WORKOUTS: ${context.recentSessions ? context.recentSessions.length + ' sessions recently' : 'No recent sessions'}

RULES:
1. Be encouraging and supportive
2. Give practical, actionable advice
3. Never diagnose medical conditions
4. Recommend consulting a doctor for health concerns
5. Respect the user's limitations and injuries
6. Suggest exercise modifications when appropriate
7. Never recommend extreme training volumes or crash diets
8. If the user reports pain, advise them to stop and seek medical advice
9. Keep responses concise but helpful
10. Base advice on the user's experience level`;

  const historyText = history.map(h => `${h.role === 'user' ? 'User' : 'AI Coach'}: ${h.content}`).join('\n');

  const fullPrompt = `${systemPrompt}\n\nConversation History:\n${historyText}\n\nUser: ${message}\n\nAI Coach:`;

  const aiResponse = await callGeminiAPI(fullPrompt);
  
  if (aiResponse) {
    return aiResponse;
  }

  // Intelligent fallback responses
  const lowerMsg = message.toLowerCase();
  
  if (lowerMsg.includes('miss') && lowerMsg.includes('workout')) {
    return "It's completely normal to miss a workout occasionally. Don't stress about it! Here's what I recommend:\n\n1. **Don't try to make it up by doubling the next workout** — this increases injury risk.\n2. **Just continue with your next scheduled workout** as planned.\n3. **If you miss frequently**, consider adjusting your schedule to fewer days that you can consistently commit to.\n\nConsistency over time matters more than any single session. You've got this! 💪";
  }
  
  if (lowerMsg.includes('replace') || lowerMsg.includes('substitute') || lowerMsg.includes('alternative')) {
    return "Of course you can substitute exercises! Here are some guidelines:\n\n1. **Replace with exercises targeting the same muscle group** — e.g., swap bench press for dumbbell press.\n2. **Match the movement pattern** — replace a push with a push, a pull with a pull.\n3. **Consider your equipment** — choose substitutes that work with what you have.\n4. **Maintain similar difficulty** — don't swap a compound movement for an isolation exercise.\n\nTell me which exercise you want to replace and I'll suggest specific alternatives!";
  }
  
  if (lowerMsg.includes('progress') || lowerMsg.includes('plateau') || lowerMsg.includes('not improving')) {
    return "Plateaus are a normal part of fitness! Here's how to break through:\n\n1. **Progressive Overload** — Gradually increase weight, reps, or sets.\n2. **Vary Your Training** — Change exercises, rep ranges, or rest periods.\n3. **Check Your Nutrition** — Ensure adequate protein (1.6-2.2g per kg bodyweight) and calories.\n4. **Prioritize Recovery** — Get 7-9 hours of sleep and manage stress.\n5. **Be Patient** — Progress slows as you advance. Trust the process.\n\nWould you like me to suggest specific changes to your current routine?";
  }
  
  if (lowerMsg.includes('pain') || lowerMsg.includes('hurt') || lowerMsg.includes('injury')) {
    return "⚠️ **Safety First!** If you're experiencing pain during exercise:\n\n1. **Stop the exercise immediately** — Pain is your body's warning signal.\n2. **Don't push through pain** — There's a difference between discomfort and pain.\n3. **Apply RICE** (Rest, Ice, Compression, Elevation) for minor issues.\n4. **See a healthcare professional** if pain persists or is severe.\n\nI strongly recommend getting medical clearance before continuing your workout routine. Your safety is more important than any workout! 🏥";
  }
  
  if (lowerMsg.includes('diet') || lowerMsg.includes('eat') || lowerMsg.includes('nutrition') || lowerMsg.includes('food') || lowerMsg.includes('meal')) {
    const goal = context.goals?.primary_goal?.toLowerCase() || '';
    if (goal.includes('loss') || goal.includes('fat')) {
      return "For your fat loss goal, here's general nutrition guidance:\n\n1. **Moderate calorie deficit** — Aim for 300-500 calories below maintenance.\n2. **High protein** — 1.8-2.2g per kg bodyweight to preserve muscle.\n3. **Prioritize whole foods** — Fruits, vegetables, lean proteins, whole grains.\n4. **Stay hydrated** — Aim for 2-3 liters of water daily.\n5. **Don't skip meals** — Regular eating helps manage hunger.\n\nCheck out the Nutrition section in the app for personalized recommendations!";
    }
    return "Great question about nutrition! Here are some general guidelines:\n\n1. **Protein** — Essential for muscle repair: 1.6-2.2g per kg bodyweight.\n2. **Carbs** — Your energy source: prioritize complex carbs.\n3. **Healthy Fats** — Important for hormones: nuts, avocados, olive oil.\n4. **Hydration** — Minimum 2 liters of water daily, more on workout days.\n5. **Timing** — Eat a balanced meal 2-3 hours before training.\n\nCheck the Nutrition section for a personalized meal plan!";
  }

  return "Great question! Here are some general tips:\n\n1. **Stay consistent** with your workout schedule.\n2. **Focus on progressive overload** — gradually increase the challenge.\n3. **Prioritize recovery** — sleep, nutrition, and rest days matter.\n4. **Track your progress** — use the Progress section to log measurements.\n5. **Listen to your body** — rest when needed, push when you can.\n\nFeel free to ask me anything specific about your exercises, form, nutrition, or recovery! 💪";
}

async function generateNutritionPlan(ctx) {
  // Calculate BMR using Mifflin-St Jeor equation
  let bmr;
  if (ctx.gender && ctx.gender.toLowerCase() === 'female') {
    bmr = 10 * ctx.weight_kg + 6.25 * ctx.height_cm - 5 * ctx.age - 161;
  } else {
    bmr = 10 * ctx.weight_kg + 6.25 * ctx.height_cm - 5 * ctx.age + 5;
  }

  // Activity multiplier
  const activityMultipliers = { 2: 1.375, 3: 1.465, 4: 1.55, 5: 1.635, 6: 1.725, 7: 1.9 };
  const activityMultiplier = activityMultipliers[ctx.workout_days] || 1.55;
  let tdee = Math.round(bmr * activityMultiplier);

  // Adjust based on goal
  const goal = (ctx.goal || '').toLowerCase();
  let dailyCalories;
  if (goal.includes('loss') || goal.includes('fat') || goal.includes('recomp')) {
    dailyCalories = Math.round(tdee - 400);
  } else if (goal.includes('gain') || goal.includes('muscle')) {
    dailyCalories = Math.round(tdee + 350);
  } else {
    dailyCalories = tdee;
  }

  // Macros
  const proteinPerKg = goal.includes('muscle') || goal.includes('strength') ? 2.0 : 1.8;
  const protein_g = Math.round(ctx.weight_kg * proteinPerKg);
  const fats_g = Math.round(dailyCalories * 0.25 / 9);
  const carbs_g = Math.round((dailyCalories - protein_g * 4 - fats_g * 9) / 4);
  const water_ml = Math.round(ctx.weight_kg * 35);

  // AI-powered meal plan attempt
  const aiPrompt = `Generate a simple daily meal plan for someone with these requirements:
- Calories: ${dailyCalories} kcal
- Protein: ${protein_g}g
- Carbs: ${carbs_g}g
- Fats: ${fats_g}g
- Diet: ${ctx.diet_preference}
- Goal: ${ctx.goal}

Return JSON:
{
  "meals": [
    { "name": "Breakfast", "time": "8:00 AM", "foods": ["food 1", "food 2"], "calories": 500, "protein": 30, "carbs": 50, "fats": 15 }
  ]
}

Include 4-5 meals. Use simple, common foods appropriate for the diet preference.`;

  let meals = [];
  const aiResponse = await callGeminiAPI(aiPrompt, true);
  
  if (aiResponse) {
    try {
      const parsed = JSON.parse(aiResponse);
      meals = parsed.meals || [];
    } catch {}
  }

  // Fallback meals
  if (meals.length === 0) {
    const isVeg = ctx.diet_preference === 'vegetarian' || ctx.diet_preference === 'vegan';
    const isEggetarian = ctx.diet_preference === 'eggetarian';

    meals = [
      {
        name: 'Breakfast',
        time: '8:00 AM',
        foods: isVeg 
          ? ['Oatmeal with nuts and fruits', 'Greek yogurt (or soy yogurt if vegan)', 'Green tea'] 
          : isEggetarian 
            ? ['Scrambled eggs (3 whole)', 'Whole wheat toast', 'Fruit', 'Green tea']
            : ['Scrambled eggs (3 whole)', 'Whole wheat toast', 'Avocado', 'Green tea'],
        calories: Math.round(dailyCalories * 0.25),
        protein: Math.round(protein_g * 0.25),
        carbs: Math.round(carbs_g * 0.3),
        fats: Math.round(fats_g * 0.2)
      },
      {
        name: 'Mid-Morning Snack',
        time: '10:30 AM',
        foods: isVeg 
          ? ['Mixed nuts (30g)', 'Banana', 'Protein shake (plant-based)']
          : ['Mixed nuts (30g)', 'Apple', 'Protein shake'],
        calories: Math.round(dailyCalories * 0.15),
        protein: Math.round(protein_g * 0.15),
        carbs: Math.round(carbs_g * 0.1),
        fats: Math.round(fats_g * 0.25)
      },
      {
        name: 'Lunch',
        time: '1:00 PM',
        foods: isVeg 
          ? ['Brown rice', 'Lentil curry (dal)', 'Mixed vegetable salad', 'Paneer or tofu (100g)']
          : ['Brown rice or quinoa', 'Grilled chicken breast (150g)', 'Mixed vegetable salad', 'Olive oil dressing'],
        calories: Math.round(dailyCalories * 0.3),
        protein: Math.round(protein_g * 0.3),
        carbs: Math.round(carbs_g * 0.35),
        fats: Math.round(fats_g * 0.25)
      },
      {
        name: 'Post-Workout / Afternoon Snack',
        time: '4:30 PM',
        foods: isVeg 
          ? ['Protein shake (plant-based)', 'Banana', 'Peanut butter (1 tbsp)']
          : ['Protein shake', 'Banana', 'Rice cakes with peanut butter'],
        calories: Math.round(dailyCalories * 0.1),
        protein: Math.round(protein_g * 0.15),
        carbs: Math.round(carbs_g * 0.15),
        fats: Math.round(fats_g * 0.1)
      },
      {
        name: 'Dinner',
        time: '7:30 PM',
        foods: isVeg 
          ? ['Whole wheat roti/chapati', 'Chickpea curry', 'Steamed vegetables', 'Raita or salad']
          : ['Sweet potato or whole wheat pasta', 'Grilled fish or lean meat (150g)', 'Steamed broccoli', 'Mixed salad'],
        calories: Math.round(dailyCalories * 0.2),
        protein: Math.round(protein_g * 0.15),
        carbs: Math.round(carbs_g * 0.1),
        fats: Math.round(fats_g * 0.2)
      }
    ];
  }

  return {
    daily_calories: dailyCalories,
    bmr: Math.round(bmr),
    tdee,
    protein_g,
    carbs_g,
    fats_g,
    water_ml,
    meals,
    notes: [
      'These are general estimates. Individual needs vary based on metabolism and activity level.',
      'Adjust portions based on how your body responds over 2-3 weeks.',
      'Prioritize whole, minimally processed foods when possible.',
      'Stay hydrated — drink water throughout the day.',
      'This is general guidance, not a medical prescription. Consult a registered dietitian for specific dietary needs.'
    ]
  };
}

module.exports = { generateWorkoutPlan, chatWithAI, generateNutritionPlan };

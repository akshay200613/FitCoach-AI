import os
import json
import math
import datetime
import httpx
from .exercise_videos import get_exercise_video

# AI Engine - Works with Gemini API or provides intelligent deterministic fallback
async def call_gemini_api(prompt: str, json_mode: bool = False) -> str | None:
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key or api_key == "your_gemini_api_key_here":
        return None

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={api_key}"
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": 0.7,
            "maxOutputTokens": 8192,
            "responseMimeType": "application/json" if json_mode else "text/plain"
        }
    }

    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.post(url, json=payload)
            if response.status_code == 200:
                data = response.json()
                candidates = data.get("candidates", [])
                if candidates and "content" in candidates[0]:
                    parts = candidates[0]["content"].get("parts", [])
                    if parts and "text" in parts[0]:
                        return parts[0]["text"]
    except Exception as e:
        print(f"Gemini API error: {e}")
    return None


MUSCLE_GROUP_EXERCISES = {
  'chest': {
    'gym': {
      'beginner': [
        {'name': 'Barbell Bench Press', 'sets': 3, 'reps': '10-12', 'rest': '90 sec', 'difficulty': 'Beginner', 'muscle': 'Chest', 'instructions': ['Lie flat on the bench with feet on the ground', 'Grip the bar slightly wider than shoulder width', 'Lower the bar to mid-chest with control', 'Press up until arms are extended but not locked'], 'mistakes': ['Bouncing the bar off chest', 'Flaring elbows too wide', 'Lifting hips off the bench']},
        {'name': 'Dumbbell Flyes', 'sets': 3, 'reps': '12-15', 'rest': '60 sec', 'difficulty': 'Beginner', 'muscle': 'Chest', 'instructions': ['Lie on a flat bench holding dumbbells above chest', 'Lower arms out to the sides with a slight bend in elbows', 'Feel the stretch across your chest', 'Squeeze chest to bring dumbbells back together'], 'mistakes': ['Going too heavy', 'Straightening arms completely', 'Lowering weights too fast']},
        {'name': 'Push Ups', 'sets': 3, 'reps': '10-15', 'rest': '60 sec', 'difficulty': 'Beginner', 'muscle': 'Chest', 'instructions': ['Place hands shoulder-width apart on the floor', 'Keep body in a straight line from head to heels', 'Lower chest towards the floor', 'Push back up to starting position'], 'mistakes': ['Sagging hips', 'Flaring elbows out too wide', 'Not going low enough']},
      ],
      'intermediate': [
        {'name': 'Barbell Bench Press', 'sets': 4, 'reps': '8-10', 'rest': '90 sec', 'difficulty': 'Intermediate', 'muscle': 'Chest', 'instructions': ['Lie flat on the bench with feet on the ground', 'Grip the bar slightly wider than shoulder width', 'Lower the bar to mid-chest with control', 'Press up explosively while maintaining control'], 'mistakes': ['Bouncing the bar off chest', 'Uneven pressing', 'Not using full range of motion']},
        {'name': 'Incline Dumbbell Press', 'sets': 3, 'reps': '10-12', 'rest': '75 sec', 'difficulty': 'Intermediate', 'muscle': 'Upper Chest', 'instructions': ['Set bench to 30-45 degree angle', 'Press dumbbells from shoulder level upward', 'Keep wrists straight and aligned', 'Lower with control, feeling the stretch'], 'mistakes': ['Setting incline too steep', 'Using momentum', 'Flaring elbows excessively']},
        {'name': 'Cable Crossover', 'sets': 3, 'reps': '12-15', 'rest': '60 sec', 'difficulty': 'Intermediate', 'muscle': 'Chest', 'instructions': ['Stand between cable machines with handles high', 'Step forward for stability', 'Bring handles together in front of chest', 'Squeeze and hold briefly at the bottom'], 'mistakes': ['Using too much weight', 'Bending at the waist', 'Not controlling the negative']},
        {'name': 'Dumbbell Flyes', 'sets': 3, 'reps': '12-15', 'rest': '60 sec', 'difficulty': 'Intermediate', 'muscle': 'Chest', 'instructions': ['Lie on flat bench, arms extended above chest', 'Lower with slight elbow bend', 'Stretch chest at bottom', 'Contract to bring weights together'], 'mistakes': ['Going too heavy', 'Turning it into a press', 'Hyperextending at the bottom']},
      ],
      'advanced': [
        {'name': 'Barbell Bench Press', 'sets': 5, 'reps': '5-8', 'rest': '120 sec', 'difficulty': 'Advanced', 'muscle': 'Chest', 'instructions': ['Set up with arch and leg drive', 'Grip bar firmly and unrack with control', 'Lower to chest with controlled tempo', 'Drive explosively through the sticking point'], 'mistakes': ['Losing tightness', 'Inconsistent bar path', 'Not breathing properly']},
        {'name': 'Incline Barbell Bench Press', 'sets': 4, 'reps': '6-8', 'rest': '90 sec', 'difficulty': 'Advanced', 'muscle': 'Upper Chest', 'instructions': ['Set bench to 30 degrees', 'Use shoulder-width or slightly wider grip', 'Touch upper chest', 'Press with power'], 'mistakes': ['Too steep an incline', 'Bouncing off chest', 'Uneven lockout']},
        {'name': 'Chest Dips', 'sets': 4, 'reps': '8-12', 'rest': '90 sec', 'difficulty': 'Advanced', 'muscle': 'Lower Chest', 'instructions': ['Lean forward about 30 degrees', 'Lower until upper arms are parallel to floor', 'Press up without locking elbows', 'Keep tension on chest throughout'], 'mistakes': ['Going too deep', 'Not leaning forward enough', 'Swinging body']},
        {'name': 'Cable Crossover', 'sets': 3, 'reps': '12-15', 'rest': '60 sec', 'difficulty': 'Advanced', 'muscle': 'Chest', 'instructions': ['Vary cable height for different angles', 'Focus on peak contraction', 'Control the eccentric portion', 'Use drop sets on the last set'], 'mistakes': ['Ego lifting', 'Losing form on drop sets', 'Rushing reps']},
      ]
    },
    'home': {
      'beginner': [
        {'name': 'Push Ups', 'sets': 3, 'reps': '8-12', 'rest': '60 sec', 'difficulty': 'Beginner', 'muscle': 'Chest', 'instructions': ['Hands shoulder-width apart', 'Keep core tight and body straight', 'Lower chest to floor', 'Push back up fully'], 'mistakes': ['Sagging hips', 'Looking up instead of down', 'Partial range of motion']},
        {'name': 'Wide Push Ups', 'sets': 3, 'reps': '8-10', 'rest': '60 sec', 'difficulty': 'Beginner', 'muscle': 'Chest', 'instructions': ['Place hands wider than shoulder width', 'Lower chest to floor', 'Push up to starting position', 'Keep elbows at 45 degrees'], 'mistakes': ['Hands too far forward', 'Dropping head', 'Not engaging core']},
        {'name': 'Diamond Push Ups', 'sets': 2, 'reps': '6-10', 'rest': '60 sec', 'difficulty': 'Beginner', 'muscle': 'Inner Chest / Triceps', 'instructions': ['Form a diamond shape with thumbs and index fingers', 'Keep elbows close to body', 'Lower chest to hands', 'Press up with control'], 'mistakes': ['Flaring elbows', 'Not touching chest to hands', 'Rushing reps']},
      ],
      'intermediate': [
        {'name': 'Push Ups', 'sets': 4, 'reps': '15-20', 'rest': '45 sec', 'difficulty': 'Intermediate', 'muscle': 'Chest', 'instructions': ['Hands shoulder-width apart', 'Maintain perfect form throughout', 'Full range of motion each rep', 'Control the negative'], 'mistakes': ['Losing form as fatigue sets in', 'Partial reps', 'Not breathing properly']},
        {'name': 'Diamond Push Ups', 'sets': 3, 'reps': '10-15', 'rest': '60 sec', 'difficulty': 'Intermediate', 'muscle': 'Inner Chest / Triceps', 'instructions': ['Diamond hand position under chest', 'Keep elbows tucked', 'Full range of motion', 'Squeeze at the top'], 'mistakes': ['Flaring elbows', 'Sagging core', 'Rushing']},
        {'name': 'Dumbbell Bench Press', 'sets': 3, 'reps': '10-12', 'rest': '75 sec', 'difficulty': 'Intermediate', 'muscle': 'Chest', 'instructions': ['Lie on floor or bench', 'Press dumbbells from chest level', 'Control the descent', 'Full extension at top'], 'mistakes': ['Dropping weights too fast', 'Uneven pressing', 'Not using full range']},
      ],
      'advanced': [
        {'name': 'Push Ups', 'sets': 4, 'reps': '20-25', 'rest': '45 sec', 'difficulty': 'Advanced', 'muscle': 'Chest', 'instructions': ['Vary hand positions across sets', 'Slow eccentric (3 seconds down)', 'Explosive concentric', 'Maintain perfect form'], 'mistakes': ['Sacrificing form for reps', 'Not varying stimulus', 'Inadequate range of motion']},
        {'name': 'Dumbbell Bench Press', 'sets': 4, 'reps': '8-10', 'rest': '90 sec', 'difficulty': 'Advanced', 'muscle': 'Chest', 'instructions': ['Heavy dumbbells with controlled form', 'Deep stretch at bottom', 'Powerful press to lockout', 'Superset with flyes if possible'], 'mistakes': ['Going too heavy for form', 'Bouncing weights', 'Not stabilizing']},
        {'name': 'Dumbbell Flyes', 'sets': 3, 'reps': '12-15', 'rest': '60 sec', 'difficulty': 'Advanced', 'muscle': 'Chest', 'instructions': ['Wide arc with slight elbow bend', 'Maximum stretch at bottom', 'Squeeze hard at top', 'Use slow tempo'], 'mistakes': ['Going too heavy', 'Turning into a press', 'Not controlling the negative']},
      ]
    }
  },
  'back': {
    'gym': {
      'beginner': [
        {'name': 'Lat Pulldown', 'sets': 3, 'reps': '10-12', 'rest': '75 sec', 'difficulty': 'Beginner', 'muscle': 'Lats', 'instructions': ['Grip bar slightly wider than shoulder width', 'Pull bar to upper chest', 'Squeeze shoulder blades together', 'Control the return slowly'], 'mistakes': ['Leaning too far back', 'Using momentum', 'Not pulling to chest']},
        {'name': 'Seated Cable Row', 'sets': 3, 'reps': '10-12', 'rest': '75 sec', 'difficulty': 'Beginner', 'muscle': 'Mid Back', 'instructions': ['Sit with chest up and slight knee bend', 'Pull handle to lower chest/upper abdomen', 'Squeeze back muscles at peak contraction', 'Extend arms fully on return'], 'mistakes': ['Rounding the back', 'Using too much arm', 'Swinging torso']},
        {'name': 'Dumbbell Row', 'sets': 3, 'reps': '10-12', 'rest': '60 sec', 'difficulty': 'Beginner', 'muscle': 'Lats / Mid Back', 'instructions': ['Place one knee and hand on bench', 'Pull dumbbell to hip', 'Keep back flat and core tight', 'Lower with control'], 'mistakes': ['Rotating torso', 'Using momentum', 'Rounding back']},
      ],
      'intermediate': [
        {'name': 'Barbell Row', 'sets': 4, 'reps': '8-10', 'rest': '90 sec', 'difficulty': 'Intermediate', 'muscle': 'Back', 'instructions': ['Hinge at hips, back at 45 degrees', 'Pull bar to lower chest', 'Squeeze back at top', 'Lower with control'], 'mistakes': ['Standing too upright', 'Using body English', 'Rounding lower back']},
        {'name': 'Pull Ups', 'sets': 3, 'reps': '6-10', 'rest': '90 sec', 'difficulty': 'Intermediate', 'muscle': 'Lats', 'instructions': ['Hang with arms fully extended', 'Pull chin over bar', 'Squeeze lats at top', 'Lower with control'], 'mistakes': ['Kipping', 'Half reps', 'Not engaging lats']},
        {'name': 'Lat Pulldown', 'sets': 3, 'reps': '10-12', 'rest': '75 sec', 'difficulty': 'Intermediate', 'muscle': 'Lats', 'instructions': ['Wide overhand grip', 'Pull to upper chest', 'Focus on lat engagement', 'Control the negative'], 'mistakes': ['Pulling behind neck', 'Using too much bicep', 'Leaning excessively']},
        {'name': 'Face Pull', 'sets': 3, 'reps': '15-20', 'rest': '60 sec', 'difficulty': 'Intermediate', 'muscle': 'Rear Delts / Upper Back', 'instructions': ['Set cable at face height', 'Pull rope to face, spreading ends apart', 'Squeeze shoulder blades', 'Hold for a count'], 'mistakes': ['Using too much weight', 'Not externally rotating', 'Using momentum']},
      ],
      'advanced': [
        {'name': 'Deadlift', 'sets': 4, 'reps': '5-6', 'rest': '180 sec', 'difficulty': 'Advanced', 'muscle': 'Full Back / Posterior Chain', 'instructions': ['Set up with bar over mid-foot', 'Hinge at hips, flat back', 'Drive through heels', 'Lock out at top with shoulders back'], 'mistakes': ['Rounding lower back', 'Bar drifting from body', 'Hyperextending at lockout']},
        {'name': 'Barbell Row', 'sets': 4, 'reps': '6-8', 'rest': '90 sec', 'difficulty': 'Advanced', 'muscle': 'Back', 'instructions': ['Heavy weight with strict form', 'Pull to lower chest/upper abdomen', 'Pause at top', 'Control eccentric'], 'mistakes': ['Using too much momentum', 'Rounding back', 'Not pausing at top']},
        {'name': 'Pull Ups', 'sets': 4, 'reps': '8-12', 'rest': '90 sec', 'difficulty': 'Advanced', 'muscle': 'Lats', 'instructions': ['Add weight if bodyweight is easy', 'Full range of motion', 'Vary grip width across sets', 'Controlled tempo'], 'mistakes': ['Kipping', 'Partial range of motion', 'Not varying stimulus']},
        {'name': 'T-Bar Row', 'sets': 3, 'reps': '8-10', 'rest': '90 sec', 'difficulty': 'Advanced', 'muscle': 'Mid Back', 'instructions': ['Straddle the bar', 'Pull to chest with elbows tight', 'Squeeze at the top', 'Control the descent'], 'mistakes': ['Rounding back', 'Using momentum', 'Pulling with arms']},
      ]
    },
    'home': {
      'beginner': [
        {'name': 'Superman', 'sets': 3, 'reps': '12-15', 'rest': '45 sec', 'difficulty': 'Beginner', 'muscle': 'Lower Back', 'instructions': ['Lie face down with arms extended', 'Lift arms, chest, and legs simultaneously', 'Hold for 2 seconds at top', 'Lower slowly'], 'mistakes': ['Jerking movements', 'Hyperextending neck', 'Not squeezing glutes']},
        {'name': 'Dumbbell Row', 'sets': 3, 'reps': '10-12', 'rest': '60 sec', 'difficulty': 'Beginner', 'muscle': 'Back', 'instructions': ['Hinge forward with one hand on support', 'Pull dumbbell to hip', 'Squeeze back muscle', 'Lower with control'], 'mistakes': ['Rotating torso', 'Using momentum', 'Not pulling high enough']},
        {'name': 'Superman', 'sets': 3, 'reps': '15-20', 'rest': '45 sec', 'difficulty': 'Beginner', 'muscle': 'Upper Back', 'instructions': ['Lie prone with arms extended', 'Squeeze back and glutes', 'Hold peak', 'Return smoothly'], 'mistakes': ['Jerking', 'Holding breath']},
      ],
      'intermediate': [
        {'name': 'Pull Ups', 'sets': 3, 'reps': '5-8', 'rest': '90 sec', 'difficulty': 'Intermediate', 'muscle': 'Lats', 'instructions': ['Hang from bar', 'Pull chin above bar', 'Control the negative', 'Full extension at bottom'], 'mistakes': ['Kipping', 'Half reps', 'Swinging']},
        {'name': 'Dumbbell Row', 'sets': 4, 'reps': '10-12', 'rest': '60 sec', 'difficulty': 'Intermediate', 'muscle': 'Back', 'instructions': ['Both arms or single arm', 'Pull to hip with elbow driving back', 'Squeeze back', 'Control negative'], 'mistakes': ['Not hinging enough', 'Using too much bicep', 'Rushing']},
        {'name': 'Superman', 'sets': 3, 'reps': '15-20', 'rest': '45 sec', 'difficulty': 'Intermediate', 'muscle': 'Lower Back', 'instructions': ['Lie face down', 'Lift and hold for 3-5 seconds', 'Alternate arm/leg lifts', 'Engage core throughout'], 'mistakes': ['Hyperextending neck', 'Rushing', 'Not engaging glutes']},
      ],
      'advanced': [
        {'name': 'Pull Ups', 'sets': 4, 'reps': '8-12', 'rest': '90 sec', 'difficulty': 'Advanced', 'muscle': 'Lats', 'instructions': ['Add weight with backpack or belt', 'Vary grip: wide, close, underhand', 'Slow negatives (3-5 sec)', 'Full ROM each rep'], 'mistakes': ['Kipping', 'Partial reps', 'Not varying grip']},
        {'name': 'One Arm Dumbbell Row', 'sets': 4, 'reps': '8-10', 'rest': '75 sec', 'difficulty': 'Advanced', 'muscle': 'Back', 'instructions': ['Heavy dumbbell', 'Strict form, pull to hip', 'Pause at top', 'Slow eccentric'], 'mistakes': ['Rotating torso', 'Using momentum', 'Not pausing at contraction']},
        {'name': 'Hyperextension', 'sets': 3, 'reps': '15-20', 'rest': '60 sec', 'difficulty': 'Advanced', 'muscle': 'Lower Back', 'instructions': ['Use exercise ball or edge of bed', 'Lower torso down', 'Rise to slightly above parallel', 'Hold at top'], 'mistakes': ['Hyperextending', 'Using momentum', 'Going too fast']},
      ]
    }
  },
  'shoulders': {
    'gym': {
      'beginner': [
        {'name': 'Dumbbell Shoulder Press', 'sets': 3, 'reps': '10-12', 'rest': '75 sec', 'difficulty': 'Beginner', 'muscle': 'Shoulders', 'instructions': ['Sit with back supported', 'Press dumbbells overhead', 'Do not lock elbows completely', 'Lower to ear level'], 'mistakes': ['Arching back excessively', 'Flaring elbows', 'Using momentum']},
        {'name': 'Lateral Raise', 'sets': 3, 'reps': '12-15', 'rest': '60 sec', 'difficulty': 'Beginner', 'muscle': 'Side Delts', 'instructions': ['Stand with dumbbells at sides', 'Raise arms to shoulder height', 'Lead with elbows slightly', 'Lower with control'], 'mistakes': ['Using too much weight', 'Swinging body', 'Raising above shoulder height']},
        {'name': 'Front Raise', 'sets': 3, 'reps': '12-15', 'rest': '60 sec', 'difficulty': 'Beginner', 'muscle': 'Front Delts', 'instructions': ['Hold dumbbells in front of thighs', 'Raise one or both arms to eye level', 'Keep slight bend in elbows', 'Lower slowly'], 'mistakes': ['Swinging weights', 'Going too heavy', 'Leaning back']},
      ],
      'intermediate': [
        {'name': 'Overhead Press', 'sets': 4, 'reps': '8-10', 'rest': '90 sec', 'difficulty': 'Intermediate', 'muscle': 'Shoulders', 'instructions': ['Stand with bar at collar bone', 'Press overhead to lockout', 'Engage core throughout', 'Lower under control'], 'mistakes': ['Excessive back arch', 'Pressing in front instead of overhead', 'Not engaging core']},
        {'name': 'Dumbbell Lateral Raise', 'sets': 4, 'reps': '12-15', 'rest': '60 sec', 'difficulty': 'Intermediate', 'muscle': 'Side Delts', 'instructions': ['Slight forward lean', 'Raise to shoulder height', 'Lead with elbows', 'Control the negative'], 'mistakes': ['Using momentum', 'Shrugging up', 'Going too heavy']},
        {'name': 'Rear Delt Fly', 'sets': 3, 'reps': '15-20', 'rest': '60 sec', 'difficulty': 'Intermediate', 'muscle': 'Rear Delts', 'instructions': ['Bend forward at hips', 'Raise dumbbells to sides', 'Squeeze shoulder blades', 'Lower slowly'], 'mistakes': ['Using back instead of rear delts', 'Going too heavy', 'Not squeezing at top']},
        {'name': 'Dumbbell Shrugs', 'sets': 3, 'reps': '12-15', 'rest': '60 sec', 'difficulty': 'Intermediate', 'muscle': 'Traps', 'instructions': ['Hold heavy dumbbells at sides', 'Shrug shoulders straight up', 'Hold at top briefly', 'Lower with control'], 'mistakes': ['Rolling shoulders', 'Using momentum', 'Not pausing at top']},
      ],
      'advanced': [
        {'name': 'Overhead Press', 'sets': 5, 'reps': '5-6', 'rest': '120 sec', 'difficulty': 'Advanced', 'muscle': 'Shoulders', 'instructions': ['Strict press from rack', 'Engage glutes and core', 'Press to full lockout', 'Control the descent'], 'mistakes': ['Excessive lean back', 'Soft lockout', 'Not bracing core']},
        {'name': 'Arnold Press', 'sets': 4, 'reps': '8-10', 'rest': '90 sec', 'difficulty': 'Advanced', 'muscle': 'Shoulders', 'instructions': ['Start with palms facing you', 'Rotate and press overhead', 'Reverse the motion on descent', 'Full range of motion'], 'mistakes': ['Rushing the rotation', 'Using momentum', 'Partial range of motion']},
        {'name': 'Lateral Raise', 'sets': 4, 'reps': '12-15', 'rest': '60 sec', 'difficulty': 'Advanced', 'muscle': 'Side Delts', 'instructions': ['Use drop sets or partials', 'Strict form, controlled tempo', 'Full range of motion', 'Squeeze at top'], 'mistakes': ['Ego lifting', 'Losing form', 'Not controlling negative']},
        {'name': 'Face Pull', 'sets': 3, 'reps': '15-20', 'rest': '60 sec', 'difficulty': 'Advanced', 'muscle': 'Rear Delts', 'instructions': ['High cable setting', 'Pull to face with external rotation', 'Hold and squeeze', 'Slow return'], 'mistakes': ['Using too much weight', 'Not rotating', 'Using momentum']},
      ]
    },
    'home': {
      'beginner': [
        {'name': 'Dumbbell Shoulder Press', 'sets': 3, 'reps': '10-12', 'rest': '75 sec', 'difficulty': 'Beginner', 'muscle': 'Shoulders', 'instructions': ['Seated or standing', 'Press overhead', 'Lower to ears', 'Keep core tight'], 'mistakes': ['Arching back', 'Locking elbows hard', 'Using momentum']},
        {'name': 'Lateral Raise', 'sets': 3, 'reps': '12-15', 'rest': '60 sec', 'difficulty': 'Beginner', 'muscle': 'Side Delts', 'instructions': ['Light dumbbells or water bottles', 'Raise to shoulder height', 'Lead with elbows', 'Lower slowly'], 'mistakes': ['Going too heavy', 'Swinging', 'Shrugging']},
      ],
      'intermediate': [
        {'name': 'Dumbbell Shoulder Press', 'sets': 4, 'reps': '8-10', 'rest': '75 sec', 'difficulty': 'Intermediate', 'muscle': 'Shoulders', 'instructions': ['Standing for core engagement', 'Press overhead to full extension', 'Lower past ear level', 'Control throughout'], 'mistakes': ['Excessive back arch', 'Half reps', 'Using momentum']},
        {'name': 'Lateral Raise', 'sets': 4, 'reps': '12-15', 'rest': '60 sec', 'difficulty': 'Intermediate', 'muscle': 'Side Delts', 'instructions': ['Strict form', 'Raise to shoulder height', 'Hold at top briefly', 'Slow negative'], 'mistakes': ['Going too heavy', 'Swinging', 'Not pausing at top']},
        {'name': 'Rear Delt Fly', 'sets': 3, 'reps': '15-20', 'rest': '60 sec', 'difficulty': 'Intermediate', 'muscle': 'Rear Delts', 'instructions': ['Bend forward at hips', 'Light dumbbells', 'Raise to sides', 'Squeeze shoulder blades'], 'mistakes': ['Not bending enough', 'Using too much weight', 'Rushing']},
      ],
      'advanced': [
        {'name': 'Arnold Press', 'sets': 4, 'reps': '8-10', 'rest': '90 sec', 'difficulty': 'Advanced', 'muscle': 'Shoulders', 'instructions': ['Full rotation through the press', 'Heavy but controlled', 'Seated or standing', 'Focus on mind-muscle connection'], 'mistakes': ['Rushing rotation', 'Going too heavy', 'Losing form']},
        {'name': 'Lateral Raise', 'sets': 4, 'reps': '12-15', 'rest': '45 sec', 'difficulty': 'Advanced', 'muscle': 'Side Delts', 'instructions': ['Use mechanical drop sets', 'Strict form throughout', 'Pause at top', 'Control descent'], 'mistakes': ['Breaking form for reps', 'Using momentum', 'Not reaching failure']},
      ]
    }
  },
  'biceps': {
    'gym': {
      'beginner': [
        {'name': 'Dumbbell Bicep Curl', 'sets': 3, 'reps': '10-12', 'rest': '60 sec', 'difficulty': 'Beginner', 'muscle': 'Biceps', 'instructions': ['Stand with dumbbells at sides', 'Curl weights to shoulders', 'Keep elbows stationary', 'Lower with control'], 'mistakes': ['Swinging body', 'Moving elbows forward', 'Using momentum']},
        {'name': 'Hammer Curl', 'sets': 3, 'reps': '10-12', 'rest': '60 sec', 'difficulty': 'Beginner', 'muscle': 'Biceps / Forearms', 'instructions': ['Hold dumbbells with neutral grip', 'Curl to shoulder height', 'Keep elbows pinned to sides', 'Lower slowly'], 'mistakes': ['Swinging', 'Moving elbows', 'Going too fast']},
      ],
      'intermediate': [
        {'name': 'Barbell Curl', 'sets': 3, 'reps': '8-10', 'rest': '75 sec', 'difficulty': 'Intermediate', 'muscle': 'Biceps', 'instructions': ['Stand with shoulder-width grip', 'Curl bar to shoulders', 'Squeeze at top', 'Control the negative'], 'mistakes': ['Leaning back', 'Swinging bar', 'Partial reps']},
        {'name': 'Hammer Curl', 'sets': 3, 'reps': '10-12', 'rest': '60 sec', 'difficulty': 'Intermediate', 'muscle': 'Biceps / Forearms', 'instructions': ['Neutral grip curls', 'Alternate arms or together', 'Squeeze at top', 'Slow negative'], 'mistakes': ['Swinging', 'Moving elbows forward', 'Going too heavy']},
      ],
      'advanced': [
        {'name': 'Barbell Curl', 'sets': 4, 'reps': '6-8', 'rest': '75 sec', 'difficulty': 'Advanced', 'muscle': 'Biceps', 'instructions': ['Heavy but strict form', 'No body swing', 'Full range of motion', 'Squeeze and hold at top'], 'mistakes': ['Cheat curling', 'Partial range', 'Not squeezing']},
        {'name': 'Preacher Curl', 'sets': 3, 'reps': '8-10', 'rest': '60 sec', 'difficulty': 'Advanced', 'muscle': 'Biceps', 'instructions': ['Arms fully on pad', 'Curl to full contraction', 'Slow eccentric (3 sec)', 'Full extension at bottom'], 'mistakes': ['Lifting elbows off pad', 'Partial range', 'Going too heavy']},
      ]
    },
    'home': {
      'beginner': [
        {'name': 'Dumbbell Bicep Curl', 'sets': 3, 'reps': '10-12', 'rest': '60 sec', 'difficulty': 'Beginner', 'muscle': 'Biceps', 'instructions': ['Stand with dumbbells or water bottles', 'Curl to shoulders', 'Keep elbows stationary', 'Lower slowly'], 'mistakes': ['Swinging', 'Moving elbows', 'Going too fast']},
        {'name': 'Hammer Curl', 'sets': 3, 'reps': '10-12', 'rest': '60 sec', 'difficulty': 'Beginner', 'muscle': 'Biceps', 'instructions': ['Neutral grip', 'Curl to shoulder height', 'Elbows at sides', 'Control the motion'], 'mistakes': ['Using momentum', 'Moving elbows', 'Partial range']},
      ],
      'intermediate': [
        {'name': 'Dumbbell Bicep Curl', 'sets': 3, 'reps': '10-12', 'rest': '60 sec', 'difficulty': 'Intermediate', 'muscle': 'Biceps', 'instructions': ['Alternate arms or together', 'Full range of motion', 'Squeeze at top', 'Slow negative'], 'mistakes': ['Swinging', 'Half reps', 'Going too fast']},
        {'name': 'Concentration Curl', 'sets': 3, 'reps': '10-12', 'rest': '60 sec', 'difficulty': 'Intermediate', 'muscle': 'Biceps', 'instructions': ['Seated with elbow on thigh', 'Curl with control', 'Peak contraction', 'Lower fully'], 'mistakes': ['Using body momentum', 'Moving elbow', 'Rushing']},
      ],
      'advanced': [
        {'name': 'Chin Ups', 'sets': 4, 'reps': '6-10', 'rest': '90 sec', 'difficulty': 'Advanced', 'muscle': 'Biceps / Lats', 'instructions': ['Underhand grip on bar', 'Pull chin above bar', 'Slow negative', 'Full extension at bottom'], 'mistakes': ['Kipping', 'Half reps', 'Not controlling negative']},
        {'name': 'Hammer Curl', 'sets': 3, 'reps': '10-12', 'rest': '60 sec', 'difficulty': 'Advanced', 'muscle': 'Biceps / Forearms', 'instructions': ['Heavy dumbbells', 'Strict form', 'Squeeze at top', 'Slow eccentric'], 'mistakes': ['Swinging', 'Moving elbows', 'Using momentum']},
      ]
    }
  },
  'triceps': {
    'gym': {
      'beginner': [
        {'name': 'Tricep Rope Pushdown', 'sets': 3, 'reps': '12-15', 'rest': '60 sec', 'difficulty': 'Beginner', 'muscle': 'Triceps', 'instructions': ['Stand facing cable machine', 'Push rope down and spread at bottom', 'Keep elbows at sides', 'Control the return'], 'mistakes': ['Leaning over the bar', 'Moving elbows', 'Using too much weight']},
        {'name': 'Bench Dips', 'sets': 3, 'reps': '10-12', 'rest': '60 sec', 'difficulty': 'Beginner', 'muscle': 'Triceps', 'instructions': ['Hands on bench behind you', 'Lower body by bending elbows', 'Push back up', 'Keep back close to bench'], 'mistakes': ['Going too deep', 'Flaring elbows', 'Not engaging triceps']},
      ],
      'intermediate': [
        {'name': 'Tricep Pushdown', 'sets': 3, 'reps': '10-12', 'rest': '60 sec', 'difficulty': 'Intermediate', 'muscle': 'Triceps', 'instructions': ['Stand facing cable machine', 'Push bar down to full extension', 'Squeeze triceps hard', 'Slow return'], 'mistakes': ['Using too much weight', 'Moving elbows', 'Leaning forward']},
        {'name': 'Skull Crushers', 'sets': 3, 'reps': '10-12', 'rest': '75 sec', 'difficulty': 'Intermediate', 'muscle': 'Triceps', 'instructions': ['Lie on bench with EZ bar or dumbbells', 'Lower weight to forehead area', 'Extend arms back up', 'Keep elbows stationary'], 'mistakes': ['Flaring elbows', 'Moving upper arms', 'Going too heavy']},
      ],
      'advanced': [
        {'name': 'Close Grip Bench Press', 'sets': 4, 'reps': '6-8', 'rest': '90 sec', 'difficulty': 'Advanced', 'muscle': 'Triceps', 'instructions': ['Hands shoulder-width apart on bar', 'Lower to lower chest', 'Press up with triceps', 'Keep elbows tucked'], 'mistakes': ['Grip too narrow', 'Flaring elbows', 'Bouncing off chest']},
        {'name': 'Tricep Dips', 'sets': 4, 'reps': '8-12', 'rest': '90 sec', 'difficulty': 'Advanced', 'muscle': 'Triceps', 'instructions': ['Upright body position', 'Lower until elbows at 90 degrees', 'Press up with triceps', 'Add weight if needed'], 'mistakes': ['Going too deep', 'Leaning forward (shifts to chest)', 'Using momentum']},
      ]
    },
    'home': {
      'beginner': [
        {'name': 'Bench Dips', 'sets': 3, 'reps': '8-12', 'rest': '60 sec', 'difficulty': 'Beginner', 'muscle': 'Triceps', 'instructions': ['Use chair or sturdy surface', 'Lower body by bending elbows', 'Push back up', 'Keep back close to surface'], 'mistakes': ['Going too deep', 'Flaring elbows out', 'Pushing from legs']},
        {'name': 'Diamond Push Ups', 'sets': 2, 'reps': '6-10', 'rest': '60 sec', 'difficulty': 'Beginner', 'muscle': 'Triceps', 'instructions': ['Hands in diamond position', 'Lower chest to hands', 'Press up', 'Keep elbows close'], 'mistakes': ['Flaring elbows', 'Sagging hips', 'Partial reps']},
      ],
      'intermediate': [
        {'name': 'Dumbbell Tricep Extension', 'sets': 3, 'reps': '10-12', 'rest': '60 sec', 'difficulty': 'Intermediate', 'muscle': 'Triceps', 'instructions': ['Hold dumbbell behind head', 'Extend arms overhead', 'Squeeze at top', 'Lower slowly'], 'mistakes': ['Flaring elbows', 'Not extending fully', 'Arching back']},
        {'name': 'Diamond Push Ups', 'sets': 3, 'reps': '10-15', 'rest': '60 sec', 'difficulty': 'Intermediate', 'muscle': 'Triceps', 'instructions': ['Diamond hand position', 'Full range of motion', 'Control tempo', 'Keep elbows close'], 'mistakes': ['Flaring elbows', 'Sagging hips', 'Rushing']},
      ],
      'advanced': [
        {'name': 'Diamond Push Ups', 'sets': 4, 'reps': '15-20', 'rest': '45 sec', 'difficulty': 'Advanced', 'muscle': 'Triceps', 'instructions': ['Strict form', 'Slow eccentric', 'Full extension', 'Controlled throughout'], 'mistakes': ['Breaking form at fatigue', 'Partial reps', 'Using momentum']},
        {'name': 'Dumbbell Tricep Extension', 'sets': 4, 'reps': '8-10', 'rest': '60 sec', 'difficulty': 'Advanced', 'muscle': 'Triceps', 'instructions': ['Heavy dumbbell', 'Full range of motion', 'Squeeze hard at top', '3-sec negative'], 'mistakes': ['Not controlling weight', 'Moving elbows', 'Arching back']},
      ]
    }
  },
  'legs': {
    'gym': {
      'beginner': [
        {'name': 'Leg Press', 'sets': 3, 'reps': '10-12', 'rest': '90 sec', 'difficulty': 'Beginner', 'muscle': 'Quads / Glutes', 'instructions': ['Sit with back flat against pad', 'Place feet shoulder-width on platform', 'Push until legs extended (not locked)', 'Lower with control'], 'mistakes': ['Locking knees', 'Lifting hips off pad', 'Too narrow foot placement']},
        {'name': 'Leg Extension', 'sets': 3, 'reps': '12-15', 'rest': '60 sec', 'difficulty': 'Beginner', 'muscle': 'Quads', 'instructions': ['Sit with back against pad', 'Extend legs to full extension', 'Squeeze quads at top', 'Lower with control'], 'mistakes': ['Using momentum', 'Going too heavy', 'Hyperextending knees']},
        {'name': 'Calf Raise', 'sets': 3, 'reps': '15-20', 'rest': '45 sec', 'difficulty': 'Beginner', 'muscle': 'Calves', 'instructions': ['Stand on step or calf raise machine', 'Rise up on toes', 'Squeeze at top', 'Lower below step level'], 'mistakes': ['Bouncing', 'Partial range', 'Going too fast']},
      ],
      'intermediate': [
        {'name': 'Barbell Squat', 'sets': 4, 'reps': '8-10', 'rest': '120 sec', 'difficulty': 'Intermediate', 'muscle': 'Quads / Glutes', 'instructions': ['Bar on upper back', 'Squat to parallel', 'Drive through whole foot', 'Keep chest up'], 'mistakes': ['Knees caving in', 'Rounding back', 'Not reaching depth']},
        {'name': 'Romanian Deadlift', 'sets': 3, 'reps': '10-12', 'rest': '90 sec', 'difficulty': 'Intermediate', 'muscle': 'Hamstrings / Glutes', 'instructions': ['Hold bar at hips', 'Hinge at hips, pushing them back', 'Lower bar along legs', 'Feel hamstring stretch and return'], 'mistakes': ['Rounding back', 'Bending knees too much', 'Bar drifting from legs']},
        {'name': 'Walking Lunges', 'sets': 3, 'reps': '12 each leg', 'rest': '75 sec', 'difficulty': 'Intermediate', 'muscle': 'Quads / Glutes', 'instructions': ['Step forward into lunge', 'Lower until back knee nearly touches floor', 'Drive through front heel', 'Alternate legs'], 'mistakes': ['Knee going past toe excessively', 'Short steps', 'Leaning forward']},
        {'name': 'Standing Calf Raise', 'sets': 4, 'reps': '15-20', 'rest': '45 sec', 'difficulty': 'Intermediate', 'muscle': 'Calves', 'instructions': ['Full range of motion', 'Squeeze at top', 'Slow negative', 'Full stretch at bottom'], 'mistakes': ['Bouncing', 'Partial range', 'Going too fast']},
      ],
      'advanced': [
        {'name': 'Barbell Squat', 'sets': 5, 'reps': '5-6', 'rest': '180 sec', 'difficulty': 'Advanced', 'muscle': 'Quads / Glutes', 'instructions': ['Heavy weight, perfect form', 'Below parallel', 'Brace core hard', 'Drive explosively'], 'mistakes': ['Rounding back', 'Knees caving', 'Cutting depth']},
        {'name': 'Romanian Deadlift', 'sets': 4, 'reps': '8-10', 'rest': '90 sec', 'difficulty': 'Advanced', 'muscle': 'Hamstrings', 'instructions': ['Heavy barbell or dumbbells', 'Deep stretch at bottom', 'Powerful hip extension', 'Control throughout'], 'mistakes': ['Rounding back', 'Using too much momentum', 'Not stretching enough']},
        {'name': 'Hip Thrust', 'sets': 4, 'reps': '10-12', 'rest': '90 sec', 'difficulty': 'Advanced', 'muscle': 'Glutes', 'instructions': ['Upper back on bench, barbell on hips', 'Drive hips up to full extension', 'Squeeze glutes hard at top', 'Lower with control'], 'mistakes': ['Hyperextending lower back', 'Not squeezing at top', 'Using too much momentum']},
      ]
    },
    'home': {
      'beginner': [
        {'name': 'Bodyweight Squat', 'sets': 3, 'reps': '12-15', 'rest': '60 sec', 'difficulty': 'Beginner', 'muscle': 'Quads / Glutes', 'instructions': ['Stand with feet shoulder-width apart', 'Squat down as if sitting in a chair', 'Keep chest up and knees over toes', 'Push through heels to stand'], 'mistakes': ['Knees caving inward', 'Not going deep enough', 'Rounding back']},
        {'name': 'Lunges', 'sets': 3, 'reps': '10 each leg', 'rest': '60 sec', 'difficulty': 'Beginner', 'muscle': 'Quads / Glutes', 'instructions': ['Step forward into lunge', 'Lower until back knee nearly touches floor', 'Push back to starting position', 'Alternate legs'], 'mistakes': ['Knee going past toe', 'Short steps', 'Leaning forward']},
        {'name': 'Glute Bridge', 'sets': 3, 'reps': '15-20', 'rest': '45 sec', 'difficulty': 'Beginner', 'muscle': 'Glutes', 'instructions': ['Lie on back with knees bent', 'Push hips up squeezing glutes', 'Hold at top briefly', 'Lower slowly'], 'mistakes': ['Pushing from lower back', 'Not squeezing glutes', 'Going too fast']},
        {'name': 'Calf Raise', 'sets': 3, 'reps': '15-20', 'rest': '45 sec', 'difficulty': 'Beginner', 'muscle': 'Calves', 'instructions': ['Stand on edge of step', 'Rise up on toes', 'Lower heels below step', 'Repeat with control'], 'mistakes': ['Bouncing', 'Not using full range', 'Going too fast']},
      ],
      'intermediate': [
        {'name': 'Goblet Squat', 'sets': 4, 'reps': '10-12', 'rest': '75 sec', 'difficulty': 'Intermediate', 'muscle': 'Quads / Glutes', 'instructions': ['Hold dumbbell at chest', 'Squat deep', 'Keep torso upright', 'Drive through heels'], 'mistakes': ['Not going deep enough', 'Rounding back', 'Letting weight pull you forward']},
        {'name': 'Bulgarian Split Squat', 'sets': 3, 'reps': '10-12 each', 'rest': '75 sec', 'difficulty': 'Intermediate', 'muscle': 'Quads / Glutes', 'instructions': ['Rear foot on chair or bench', 'Lower until front thigh is parallel', 'Drive up through front heel', 'Keep torso upright'], 'mistakes': ['Leaning forward', 'Not going deep', 'Losing balance']},
        {'name': 'Standing Calf Raise', 'sets': 3, 'reps': '15-20', 'rest': '45 sec', 'difficulty': 'Intermediate', 'muscle': 'Calves', 'instructions': ['Hold dumbbells for added resistance', 'Full range of motion', 'Squeeze at top', 'Slow negative'], 'mistakes': ['Bouncing', 'Partial range', 'Going too fast']},
      ],
      'advanced': [
        {'name': 'Goblet Squat', 'sets': 4, 'reps': '12-15', 'rest': '60 sec', 'difficulty': 'Advanced', 'muscle': 'Quads / Glutes', 'instructions': ['Heavy dumbbell', 'Deep squat with pause at bottom', 'Explosive drive up', 'Control throughout'], 'mistakes': ['Not going deep', 'Rushing', 'Rounding back']},
        {'name': 'Bulgarian Split Squat', 'sets': 4, 'reps': '10-12 each', 'rest': '90 sec', 'difficulty': 'Advanced', 'muscle': 'Quads / Glutes', 'instructions': ['Hold heavy dumbbells', 'Full range of motion', 'Slow eccentric', 'Drive through heel'], 'mistakes': ['Not going deep enough', 'Losing balance', 'Using momentum']},
        {'name': 'Hip Thrust', 'sets': 4, 'reps': '12-15', 'rest': '75 sec', 'difficulty': 'Advanced', 'muscle': 'Glutes', 'instructions': ['Back on couch/bench, weight on hips', 'Drive hips high', 'Squeeze glutes hard', 'Lower with control'], 'mistakes': ['Not squeezing at top', 'Hyperextending back', 'Using momentum']},
      ]
    }
  },
  'abs': {
    'gym': {
      'beginner': [
        {'name': 'Crunches', 'sets': 3, 'reps': '15-20', 'rest': '45 sec', 'difficulty': 'Beginner', 'muscle': 'Abs', 'instructions': ['Lie on back with knees bent', 'Curl shoulders off floor', 'Squeeze abs at top', 'Lower with control'], 'mistakes': ['Pulling on neck', 'Using momentum', 'Partial range']},
        {'name': 'Plank', 'sets': 3, 'reps': '20-30 sec', 'rest': '45 sec', 'difficulty': 'Beginner', 'muscle': 'Core', 'instructions': ['Forearms and toes on floor', 'Body in straight line', 'Engage core throughout', 'Breathe steadily'], 'mistakes': ['Hips sagging', 'Hips too high', 'Holding breath']},
      ],
      'intermediate': [
        {'name': 'Cable Crunch', 'sets': 3, 'reps': '12-15', 'rest': '60 sec', 'difficulty': 'Intermediate', 'muscle': 'Abs', 'instructions': ['Kneel in front of cable machine', 'Crunch down towards floor', 'Squeeze abs hard', 'Control the return'], 'mistakes': ['Using hip flexors', 'Not crunching deep enough', 'Too much weight']},
        {'name': 'Russian Twist', 'sets': 3, 'reps': '20 (10 each side)', 'rest': '45 sec', 'difficulty': 'Intermediate', 'muscle': 'Obliques', 'instructions': ['Sit with torso at 45 degrees', 'Hold weight or hands together', 'Rotate torso side to side', 'Keep feet off floor for more challenge'], 'mistakes': ['Rounding back', 'Moving hips instead of torso', 'Going too fast']},
        {'name': 'Plank', 'sets': 3, 'reps': '45-60 sec', 'rest': '45 sec', 'difficulty': 'Intermediate', 'muscle': 'Core', 'instructions': ['Forearms on floor', 'Body perfectly straight', 'Squeeze every muscle', 'Breathe normally'], 'mistakes': ['Sagging hips', 'Hips too high', 'Not engaging glutes']},
      ],
      'advanced': [
        {'name': 'Hanging Leg Raise', 'sets': 4, 'reps': '12-15', 'rest': '60 sec', 'difficulty': 'Advanced', 'muscle': 'Abs', 'instructions': ['Raise legs to bar', 'Control the descent', 'Minimal swing', 'Full range of motion'], 'mistakes': ['Excessive swinging', 'Using momentum', 'Half reps']},
        {'name': 'Ab Rollout', 'sets': 3, 'reps': '10-12', 'rest': '75 sec', 'difficulty': 'Advanced', 'muscle': 'Core', 'instructions': ['Kneel with ab wheel', 'Roll out as far as possible', 'Engage core to pull back', 'Keep back flat'], 'mistakes': ['Arching lower back', 'Not going far enough', 'Using hip flexors']},
        {'name': 'Side Plank', 'sets': 3, 'reps': '30-45 sec each', 'rest': '45 sec', 'difficulty': 'Advanced', 'muscle': 'Obliques', 'instructions': ['Forearm on floor, body sideways', 'Hips up, body in line', 'Hold position', 'Breathe normally'], 'mistakes': ['Dropping hips', 'Not stacking feet', 'Holding breath']},
      ]
    },
    'home': {
      'beginner': [
        {'name': 'Crunches', 'sets': 3, 'reps': '15-20', 'rest': '45 sec', 'difficulty': 'Beginner', 'muscle': 'Abs', 'instructions': ['Lie on back', 'Curl shoulders off floor', 'Squeeze abs', 'Lower slowly'], 'mistakes': ['Pulling on neck', 'Using momentum', 'Partial range']},
        {'name': 'Plank', 'sets': 3, 'reps': '20-30 sec', 'rest': '45 sec', 'difficulty': 'Beginner', 'muscle': 'Core', 'instructions': ['Forearms and toes', 'Straight line body', 'Engage everything', 'Breathe steadily'], 'mistakes': ['Sagging hips', 'Hips pike up', 'Holding breath']},
      ],
      'intermediate': [
        {'name': 'Bicycle Crunches', 'sets': 3, 'reps': '20 (10 each)', 'rest': '45 sec', 'difficulty': 'Intermediate', 'muscle': 'Abs / Obliques', 'instructions': ['Lie on back', 'Bring knee to opposite elbow', 'Rotate torso', 'Alternate sides'], 'mistakes': ['Pulling on neck', 'Going too fast', 'Not rotating enough']},
        {'name': 'Mountain Climbers', 'sets': 3, 'reps': '20 (10 each)', 'rest': '45 sec', 'difficulty': 'Intermediate', 'muscle': 'Core / Cardio', 'instructions': ['Start in push-up position', 'Drive knees to chest alternating', 'Keep hips level', 'Maintain steady pace'], 'mistakes': ['Hips bouncing up', 'Not bringing knee far enough', 'Going too slow or too fast']},
        {'name': 'Plank', 'sets': 3, 'reps': '45-60 sec', 'rest': '45 sec', 'difficulty': 'Intermediate', 'muscle': 'Core', 'instructions': ['Perfect form', 'Engage everything', 'Steady breathing'], 'mistakes': ['Losing form', 'Sagging', 'Holding breath']},
      ],
      'advanced': [
        {'name': 'V-Ups', 'sets': 4, 'reps': '12-15', 'rest': '45 sec', 'difficulty': 'Advanced', 'muscle': 'Abs', 'instructions': ['Lie flat', 'Simultaneously raise legs and torso', 'Touch toes at top', 'Lower with control'], 'mistakes': ['Using momentum', 'Not touching toes', 'Bending knees']},
        {'name': 'Russian Twist', 'sets': 3, 'reps': '20 (10 each)', 'rest': '45 sec', 'difficulty': 'Advanced', 'muscle': 'Obliques', 'instructions': ['Feet off floor', 'Hold weight', 'Full rotation', 'Controlled pace'], 'mistakes': ['Rounding back', 'Moving hips', 'Going too fast']},
        {'name': 'Plank', 'sets': 3, 'reps': '60-90 sec', 'rest': '45 sec', 'difficulty': 'Advanced', 'muscle': 'Core', 'instructions': ['Add weight on back', 'Perfect form entire duration', 'Engage every muscle', 'Control breathing'], 'mistakes': ['Losing form late', 'Sagging', 'Not challenging enough']},
      ]
    }
  }
}

SPLIT_TEMPLATES = {
  3: {
    'fat_loss': [
      {'day': 'Monday', 'focus': 'Full Body + Cardio', 'muscles': ['chest', 'back', 'legs']},
      {'day': 'Wednesday', 'focus': 'Full Body + Cardio', 'muscles': ['shoulders', 'legs', 'abs']},
      {'day': 'Friday', 'focus': 'Full Body + Cardio', 'muscles': ['back', 'biceps', 'triceps', 'abs']},
    ],
    'muscle_gain': [
      {'day': 'Monday', 'focus': 'Push (Chest, Shoulders, Triceps)', 'muscles': ['chest', 'shoulders', 'triceps']},
      {'day': 'Wednesday', 'focus': 'Pull (Back, Biceps)', 'muscles': ['back', 'biceps']},
      {'day': 'Friday', 'focus': 'Legs & Abs', 'muscles': ['legs', 'abs']},
    ],
    'default': [
      {'day': 'Monday', 'focus': 'Upper Body', 'muscles': ['chest', 'back', 'shoulders']},
      {'day': 'Wednesday', 'focus': 'Lower Body & Core', 'muscles': ['legs', 'abs']},
      {'day': 'Friday', 'focus': 'Full Body', 'muscles': ['chest', 'back', 'biceps', 'triceps']},
    ]
  },
  4: {
    'muscle_gain': [
      {'day': 'Monday', 'focus': 'Chest & Triceps', 'muscles': ['chest', 'triceps']},
      {'day': 'Tuesday', 'focus': 'Back & Biceps', 'muscles': ['back', 'biceps']},
      {'day': 'Thursday', 'focus': 'Legs', 'muscles': ['legs']},
      {'day': 'Friday', 'focus': 'Shoulders & Abs', 'muscles': ['shoulders', 'abs']},
    ],
    'default': [
      {'day': 'Monday', 'focus': 'Upper Body Push', 'muscles': ['chest', 'shoulders', 'triceps']},
      {'day': 'Tuesday', 'focus': 'Lower Body', 'muscles': ['legs']},
      {'day': 'Thursday', 'focus': 'Upper Body Pull', 'muscles': ['back', 'biceps']},
      {'day': 'Friday', 'focus': 'Full Body & Core', 'muscles': ['legs', 'shoulders', 'abs']},
    ]
  },
  5: {
    'muscle_gain': [
      {'day': 'Monday', 'focus': 'Chest & Triceps', 'muscles': ['chest', 'triceps']},
      {'day': 'Tuesday', 'focus': 'Back & Biceps', 'muscles': ['back', 'biceps']},
      {'day': 'Wednesday', 'focus': 'Legs', 'muscles': ['legs']},
      {'day': 'Thursday', 'focus': 'Rest / Active Recovery', 'muscles': []},
      {'day': 'Friday', 'focus': 'Shoulders & Abs', 'muscles': ['shoulders', 'abs']},
      {'day': 'Saturday', 'focus': 'Full Body', 'muscles': ['chest', 'back', 'legs']},
    ],
    'strength': [
      {'day': 'Monday', 'focus': 'Squat Focus', 'muscles': ['legs']},
      {'day': 'Tuesday', 'focus': 'Bench Press Focus', 'muscles': ['chest', 'triceps']},
      {'day': 'Wednesday', 'focus': 'Rest / Active Recovery', 'muscles': []},
      {'day': 'Thursday', 'focus': 'Deadlift Focus', 'muscles': ['back', 'legs']},
      {'day': 'Friday', 'focus': 'Overhead Press Focus', 'muscles': ['shoulders', 'biceps', 'abs']},
    ],
    'default': [
      {'day': 'Monday', 'focus': 'Chest & Triceps', 'muscles': ['chest', 'triceps']},
      {'day': 'Tuesday', 'focus': 'Back & Biceps', 'muscles': ['back', 'biceps']},
      {'day': 'Wednesday', 'focus': 'Legs', 'muscles': ['legs']},
      {'day': 'Thursday', 'focus': 'Shoulders & Abs', 'muscles': ['shoulders', 'abs']},
      {'day': 'Friday', 'focus': 'Full Body', 'muscles': ['chest', 'back', 'legs']},
    ]
  },
  6: {
    'muscle_gain': [
      {'day': 'Monday', 'focus': 'Push (Chest, Shoulders, Triceps)', 'muscles': ['chest', 'shoulders', 'triceps']},
      {'day': 'Tuesday', 'focus': 'Pull (Back, Biceps)', 'muscles': ['back', 'biceps']},
      {'day': 'Wednesday', 'focus': 'Legs', 'muscles': ['legs']},
      {'day': 'Thursday', 'focus': 'Push (Chest, Shoulders, Triceps)', 'muscles': ['chest', 'shoulders', 'triceps']},
      {'day': 'Friday', 'focus': 'Pull (Back, Biceps)', 'muscles': ['back', 'biceps']},
      {'day': 'Saturday', 'focus': 'Legs & Abs', 'muscles': ['legs', 'abs']},
    ],
    'default': [
      {'day': 'Monday', 'focus': 'Chest & Triceps', 'muscles': ['chest', 'triceps']},
      {'day': 'Tuesday', 'focus': 'Back & Biceps', 'muscles': ['back', 'biceps']},
      {'day': 'Wednesday', 'focus': 'Legs', 'muscles': ['legs']},
      {'day': 'Thursday', 'focus': 'Shoulders & Abs', 'muscles': ['shoulders', 'abs']},
      {'day': 'Friday', 'focus': 'Full Body Strength', 'muscles': ['chest', 'back', 'legs']},
      {'day': 'Saturday', 'focus': 'Cardio & Core', 'muscles': ['abs']},
    ]
  },
  2: {
    'default': [
      {'day': 'Monday', 'focus': 'Upper Body', 'muscles': ['chest', 'back', 'shoulders', 'biceps', 'triceps']},
      {'day': 'Thursday', 'focus': 'Lower Body & Core', 'muscles': ['legs', 'abs']},
    ]
  },
  7: {
    'default': [
      {'day': 'Monday', 'focus': 'Chest', 'muscles': ['chest']},
      {'day': 'Tuesday', 'focus': 'Back', 'muscles': ['back']},
      {'day': 'Wednesday', 'focus': 'Shoulders & Abs', 'muscles': ['shoulders', 'abs']},
      {'day': 'Thursday', 'focus': 'Legs', 'muscles': ['legs']},
      {'day': 'Friday', 'focus': 'Arms', 'muscles': ['biceps', 'triceps']},
      {'day': 'Saturday', 'focus': 'Full Body / Weak Points', 'muscles': ['chest', 'back', 'legs']},
      {'day': 'Sunday', 'focus': 'Active Recovery / Light Cardio', 'muscles': ['abs']},
    ]
  }
}

def get_goal_key(goal: str | None) -> str:
    if not goal:
        return 'default'
    g = goal.lower()
    if 'fat' in g or 'loss' in g or 'recomp' in g:
        return 'fat_loss'
    if 'muscle' in g or 'gain' in g or 'six' in g or 'abs' in g:
        return 'muscle_gain'
    if 'strength' in g:
        return 'strength'
    return 'default'

def generate_deterministic_plan(ctx: dict) -> dict:
    level = (ctx.get("fitness_experience") or "beginner").lower()
    if level not in ["beginner", "intermediate", "advanced"]:
        level = "beginner"
        
    is_gym = "gym" in (ctx.get("workout_location") or "").lower()
    location_type = "gym" if is_gym else "home"
    days = ctx.get("workout_days") or 4
    if days not in SPLIT_TEMPLATES:
        days = 4
        
    goal_key = get_goal_key(ctx.get("primary_goal"))
    templates = SPLIT_TEMPLATES.get(days, SPLIT_TEMPLATES[4])
    split = templates.get(goal_key, templates.get("default", []))

    warm_up = {
        'name': 'Warm Up',
        'description': 'Light cardio and dynamic stretching to prepare your body for the workout',
        'duration': '5-10 minutes',
        'exercises': [
            'Light jogging or jumping jacks (2-3 minutes)',
            'Arm circles (30 seconds each direction)',
            'Leg swings (10 each leg)',
            'Bodyweight squats (10 reps)',
            'Hip circles (10 each direction)',
            'Cat-cow stretch (10 reps)'
        ]
    }

    cool_down = {
        'name': 'Cool Down',
        'description': 'Static stretching and controlled breathing to aid recovery',
        'duration': '5-10 minutes',
        'exercises': [
            'Hamstring stretch (30 seconds each side)',
            'Quad stretch (30 seconds each side)',
            'Shoulder stretch (30 seconds each arm)',
            'Chest stretch (30 seconds)',
            'Hip flexor stretch (30 seconds each side)',
            'Deep breathing (1-2 minutes)'
        ]
    }

    schedule = []
    for day_template in split:
        if not day_template.get("muscles"):
            schedule.append({
                'day': day_template['day'],
                'focus': day_template['focus'],
                'isRestDay': True,
                'activities': [
                    'Light walking (20-30 minutes)',
                    'Gentle stretching or yoga',
                    'Foam rolling',
                    'Stay hydrated and focus on nutrition'
                ]
            })
            continue

        exercises = []
        for muscle in day_template["muscles"]:
            m_data = MUSCLE_GROUP_EXERCISES.get(muscle, {})
            loc_data = m_data.get(location_type, {})
            lvl_exercises = loc_data.get(level, [])
            count = 3 if len(day_template["muscles"]) <= 2 else 2
            exercises.extend(lvl_exercises[:count])

        # Attach video & description
        formatted_exercises = []
        for ex in exercises:
            vid = get_exercise_video(ex["name"])
            formatted_exercises.append({
                **ex,
                'description': f"Target muscle: {ex['muscle']}. {ex['sets']} sets of {ex['reps']} reps with {ex['rest']} rest between sets.",
                'video': vid
            })

        if goal_key == 'fat_loss':
            formatted_exercises.append({
                'name': 'Cardio Finisher',
                'sets': 1,
                'reps': '15-20 minutes',
                'rest': 'N/A',
                'difficulty': level.capitalize(),
                'muscle': 'Cardiovascular',
                'description': 'Choose: brisk walking on incline, cycling, rowing, or elliptical at moderate intensity',
                'instructions': ['Choose your preferred cardio equipment', 'Maintain moderate intensity', 'Cool down with 2-3 minutes at easy pace'],
                'mistakes': ['Going too intense and burning out', 'Skipping the cardio portion'],
                'video': get_exercise_video('treadmill running')
            })

        duration_map = {
            '15-30 minutes': '25 minutes',
            '30-45 minutes': '40 minutes',
            '45-60 minutes': '50 minutes',
            '60-90 minutes': '75 minutes'
        }

        schedule.append({
            'day': day_template['day'],
            'focus': day_template['focus'],
            'isRestDay': False,
            'warmUp': warm_up,
            'coolDown': cool_down,
            'estimatedDuration': duration_map.get(ctx.get("workout_duration"), '45 minutes'),
            'exercises': formatted_exercises
        })

    return {
        'planName': f"{ctx.get('primary_goal') or 'Fitness'} Plan - {level.capitalize()}",
        'level': level,
        'location': location_type,
        'daysPerWeek': days,
        'goal': ctx.get("primary_goal"),
        'schedule': schedule,
        'safetyNotes': [
            'Always warm up before starting your workout.',
            'Stay hydrated throughout your workout.',
            'If you experience any pain, dizziness, or unusual discomfort, stop exercising immediately.',
            'Listen to your body and rest when needed.',
            'Consult a healthcare professional before starting any new exercise program.',
            'Progress gradually — do not increase weight or intensity too quickly.',
            'Focus on proper form rather than lifting heavy weights.',
            'Allow adequate rest between workout days for recovery.'
        ],
        'generatedAt': datetime.datetime.now(datetime.timezone.utc).isoformat()
    }


async def generate_workout_plan(user_context: dict) -> dict:
    ai_prompt = f"""You are an expert personal fitness trainer. Generate a personalized workout plan based on this user profile:

Name: {user_context.get('name')}
Age: {user_context.get('age')}
Gender: {user_context.get('gender') or 'Not specified'}
Height: {user_context.get('height_cm')} cm
Weight: {user_context.get('weight_kg')} kg
Target Weight: {user_context.get('target_weight_kg') or 'Not set'} kg
BMI: {user_context.get('bmi')}
Fitness Experience: {user_context.get('fitness_experience')}
Workout Location: {user_context.get('workout_location')}
Days Per Week: {user_context.get('workout_days')}
Workout Duration: {user_context.get('workout_duration')}
Available Equipment: {json.dumps(user_context.get('equipment') or [])}
Medical Conditions: {user_context.get('medical_conditions') or 'None'}
Injuries: {user_context.get('injuries') or 'None'}
Joint Pain: {user_context.get('joint_pain') or 'None'}
Exercises to Avoid: {user_context.get('exercises_to_avoid') or 'None'}
Primary Goal: {user_context.get('primary_goal')}

Return a JSON object with:
planName, level, location, daysPerWeek, goal, schedule (array of days with day, focus, isRestDay, estimatedDuration, exercises), safetyNotes."""

    ai_response = await call_gemini_api(ai_prompt, json_mode=True)
    if ai_response:
        try:
            plan = json.loads(ai_response)
            if "schedule" in plan:
                for day in plan["schedule"]:
                    if "exercises" in day:
                        for ex in day["exercises"]:
                            ex["video"] = get_exercise_video(ex.get("name", ""))
                    if not day.get("warmUp") and not day.get("isRestDay"):
                        day["warmUp"] = {
                            "name": "Warm Up",
                            "description": "Light cardio and dynamic stretching",
                            "duration": "5-10 minutes",
                            "exercises": ["Light cardio (2-3 min)", "Dynamic stretching (3-5 min)"]
                        }
                    if not day.get("coolDown") and not day.get("isRestDay"):
                        day["coolDown"] = {
                            "name": "Cool Down",
                            "description": "Static stretching",
                            "duration": "5-10 minutes",
                            "exercises": ["Full body static stretching (5-10 min)"]
                        }
                plan["generatedAt"] = datetime.datetime.now(datetime.timezone.utc).isoformat()
                return plan
        except Exception:
            pass

    return generate_deterministic_plan(user_context)


async def chat_with_ai(message: str, context: dict, history: list) -> str:
    profile = context.get("profile") or {}
    goals = context.get("goals") or {}
    health = context.get("health") or {}

    system_prompt = f"""You are FitCoach AI, a supportive personal fitness coach.
USER: Experience={profile.get('fitness_experience')}, Goal={goals.get('primary_goal')}, Weight={profile.get('current_weight_kg')}kg.
Injuries: {health.get('injuries') or 'None'}.
Rules: Be encouraging, practical, never diagnose conditions, advise doctor for pain, concise replies."""

    history_text = "\n".join([f"{'User' if h.get('role') == 'user' else 'AI Coach'}: {h.get('content')}" for h in history])
    full_prompt = f"{system_prompt}\n\nHistory:\n{history_text}\n\nUser: {message}\n\nAI Coach:"

    ai_response = await call_gemini_api(full_prompt)
    if ai_response:
        return ai_response

    lower_msg = message.lower()
    if 'miss' in lower_msg and 'workout' in lower_msg:
        return "It's completely normal to miss a workout occasionally. Don't stress about it! Here's what I recommend:\n\n1. **Don't try to make it up by doubling the next workout** — this increases injury risk.\n2. **Just continue with your next scheduled workout** as planned.\n3. **If you miss frequently**, consider adjusting your schedule to fewer days that you can consistently commit to.\n\nConsistency over time matters more than any single session. You've got this! 💪"
    if 'replace' in lower_msg or 'substitute' in lower_msg or 'alternative' in lower_msg:
        return "Of course you can substitute exercises! Here are some guidelines:\n\n1. **Replace with exercises targeting the same muscle group** — e.g., swap bench press for dumbbell press.\n2. **Match the movement pattern** — replace a push with a push, a pull with a pull.\n3. **Consider your equipment** — choose substitutes that work with what you have.\n4. **Maintain similar difficulty** — don't swap a compound movement for an isolation exercise.\n\nTell me which exercise you want to replace and I'll suggest specific alternatives!"
    if 'progress' in lower_msg or 'plateau' in lower_msg or 'not improving' in lower_msg:
        return "Plateaus are a normal part of fitness! Here's how to break through:\n\n1. **Progressive Overload** — Gradually increase weight, reps, or sets.\n2. **Vary Your Training** — Change exercises, rep ranges, or rest periods.\n3. **Check Your Nutrition** — Ensure adequate protein (1.6-2.2g per kg bodyweight) and calories.\n4. **Prioritize Recovery** — Get 7-9 hours of sleep and manage stress.\n5. **Be Patient** — Progress slows as you advance. Trust the process."
    if 'pain' in lower_msg or 'hurt' in lower_msg or 'injury' in lower_msg:
        return "⚠️ **Safety First!** If you're experiencing pain during exercise:\n\n1. **Stop the exercise immediately** — Pain is your body's warning signal.\n2. **Don't push through pain** — There's a difference between discomfort and pain.\n3. **Apply RICE** (Rest, Ice, Compression, Elevation) for minor issues.\n4. **See a healthcare professional** if pain persists or is severe.\n\nI strongly recommend getting medical clearance before continuing your workout routine. Your safety is more important than any workout! 🏥"
    if any(k in lower_msg for k in ['diet', 'eat', 'nutrition', 'food', 'meal']):
        return "Great question about nutrition! Here are key guidelines:\n\n1. **Protein** — 1.6-2.2g per kg bodyweight for muscle repair.\n2. **Carbs** — Primary fuel source: prioritize complex whole grains.\n3. **Healthy Fats** — Essential for hormones: nuts, seeds, avocados, olive oil.\n4. **Hydration** — Aim for at least 2-3 liters of water daily.\n\nVisit the Nutrition tab for personalized meal guidance!"

    return "Great question! Here are some general tips:\n\n1. **Stay consistent** with your workout schedule.\n2. **Focus on progressive overload** — gradually increase the challenge.\n3. **Prioritize recovery** — sleep, nutrition, and rest days matter.\n4. **Track your progress** — use the Progress section to log measurements.\n5. **Listen to your body** — rest when needed, push when you can.\n\nFeel free to ask me anything specific about your exercises, form, nutrition, or recovery! 💪"


async def generate_nutrition_plan(ctx: dict) -> dict:
    weight_kg = float(ctx.get("weight_kg") or 70)
    height_cm = float(ctx.get("height_cm") or 175)
    age = int(ctx.get("age") or 25)
    gender = (ctx.get("gender") or "male").lower()
    days = int(ctx.get("workout_days") or 4)

    # Mifflin-St Jeor equation
    if gender == "female":
        bmr = 10 * weight_kg + 6.25 * height_cm - 5 * age - 161
    else:
        bmr = 10 * weight_kg + 6.25 * height_cm - 5 * age + 5

    activity_multipliers = {2: 1.375, 3: 1.465, 4: 1.55, 5: 1.635, 6: 1.725, 7: 1.9}
    activity = activity_multipliers.get(days, 1.55)
    tdee = round(bmr * activity)

    goal = (ctx.get("goal") or "").lower()
    if 'loss' in goal or 'fat' in goal or 'recomp' in goal:
        daily_calories = round(tdee - 400)
    elif 'gain' in goal or 'muscle' in goal:
        daily_calories = round(tdee + 350)
    else:
        daily_calories = tdee

    protein_per_kg = 2.0 if ('muscle' in goal or 'strength' in goal) else 1.8
    protein_g = round(weight_kg * protein_per_kg)
    fats_g = round(daily_calories * 0.25 / 9)
    carbs_g = round((daily_calories - protein_g * 4 - fats_g * 9) / 4)
    water_ml = round(weight_kg * 35)

    diet_pref = ctx.get("diet_preference") or "non-vegetarian"
    is_veg = diet_pref in ["vegetarian", "vegan"]
    is_eggetarian = diet_pref == "eggetarian"

    meals = [
        {
            'name': 'Breakfast',
            'time': '8:00 AM',
            'foods': ['Oatmeal with nuts and fruits', 'Greek or soy yogurt', 'Green tea'] if is_veg else (
                ['Scrambled eggs (3 whole)', 'Whole wheat toast', 'Fruit', 'Green tea'] if is_eggetarian else
                ['Scrambled eggs (3 whole)', 'Whole wheat toast', 'Avocado', 'Green tea']
            ),
            'calories': round(daily_calories * 0.25),
            'protein': round(protein_g * 0.25),
            'carbs': round(carbs_g * 0.3),
            'fats': round(fats_g * 0.2)
        },
        {
            'name': 'Mid-Morning Snack',
            'time': '10:30 AM',
            'foods': ['Mixed nuts (30g)', 'Banana', 'Plant-based protein shake'] if is_veg else ['Mixed nuts (30g)', 'Apple', 'Whey protein shake'],
            'calories': round(daily_calories * 0.15),
            'protein': round(protein_g * 0.15),
            'carbs': round(carbs_g * 0.1),
            'fats': round(fats_g * 0.25)
        },
        {
            'name': 'Lunch',
            'time': '1:00 PM',
            'foods': ['Brown rice', 'Lentil curry (dal)', 'Mixed vegetable salad', 'Paneer or tofu (100g)'] if is_veg else ['Brown rice or quinoa', 'Grilled chicken breast (150g)', 'Mixed salad', 'Olive oil'],
            'calories': round(daily_calories * 0.3),
            'protein': round(protein_g * 0.3),
            'carbs': round(carbs_g * 0.35),
            'fats': round(fats_g * 0.25)
        },
        {
            'name': 'Post-Workout / Snack',
            'time': '4:30 PM',
            'foods': ['Protein shake', 'Banana', 'Peanut butter on rice cake'],
            'calories': round(daily_calories * 0.1),
            'protein': round(protein_g * 0.15),
            'carbs': round(carbs_g * 0.15),
            'fats': round(fats_g * 0.1)
        },
        {
            'name': 'Dinner',
            'time': '7:30 PM',
            'foods': ['Whole wheat roti', 'Chickpea curry', 'Steamed vegetables'] if is_veg else ['Sweet potato', 'Grilled fish or lean meat (150g)', 'Steamed greens'],
            'calories': round(daily_calories * 0.2),
            'protein': round(protein_g * 0.15),
            'carbs': round(carbs_g * 0.1),
            'fats': round(fats_g * 0.2)
        }
    ]

    return {
        'daily_calories': daily_calories,
        'bmr': round(bmr),
        'tdee': tdee,
        'protein_g': protein_g,
        'carbs_g': carbs_g,
        'fats_g': fats_g,
        'water_ml': water_ml,
        'meals': meals,
        'notes': [
            'These are general estimates. Individual needs vary based on metabolism and activity level.',
            'Adjust portions based on how your body responds over 2-3 weeks.',
            'Prioritize whole, minimally processed foods when possible.',
            'Stay hydrated — drink water throughout the day.',
            'This is general guidance, not a medical prescription.'
        ]
    }

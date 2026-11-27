import asyncio
import time
from fastapi.testclient import TestClient
from api.index import app

client = TestClient(app)

def run_tests():
    print("--- 1. Testing Health Check ---")
    res = client.get("/api/health")
    assert res.status_code == 200, f"Health check failed: {res.text}"
    print("Health:", res.status_code, res.json())

    test_email = f"fastapi_test_{int(time.time())}@example.com"
    print(f"\n--- 2. Testing Registration ({test_email}) ---")
    res = client.post("/api/auth/register", json={
        "email": test_email,
        "password": "Password123!",
        "full_name": "FastAPI Tester"
    })
    assert res.status_code == 201, f"Registration failed: {res.text}"
    data = res.json()
    token = data["token"]
    user_id = data["user"]["id"]
    headers = {"Authorization": f"Bearer {token}"}
    print("Registered successfully, user_id:", user_id)

    print("\n--- 3. Testing Step 1: Profile ---")
    res = client.post("/api/onboarding/profile", headers=headers, json={
        "age": 28,
        "gender": "male",
        "height_cm": 180,
        "current_weight_kg": 82,
        "target_weight_kg": 75
    })
    assert res.status_code == 200, f"Profile failed: {res.text}"
    print("Profile saved:", res.json())

    print("\n--- 4. Testing Step 2: Health ---")
    res = client.post("/api/onboarding/health", headers=headers, json={
        "medical_conditions": "None",
        "injuries": "Minor left knee strain",
        "joint_pain": "Occasional knee stiffness",
        "exercises_to_avoid": "Heavy leg press",
        "physically_active": 1,
        "additional_info": "Prefers controlled tempo"
    })
    assert res.status_code == 200, f"Health failed: {res.text}"
    print("Health saved:", res.json())

    print("\n--- 5. Testing Step 3: Experience ---")
    res = client.post("/api/onboarding/experience", headers=headers, json={
        "fitness_experience": "intermediate",
        "exercise_duration": "6-12 months"
    })
    assert res.status_code == 200, f"Experience failed: {res.text}"
    print("Experience saved:", res.json())

    print("\n--- 6. Testing Step 4: Preferences ---")
    res = client.post("/api/onboarding/preferences", headers=headers, json={
        "workout_location": "Gym",
        "workout_days_per_week": 4,
        "workout_duration": "45-60 minutes",
        "available_equipment": ["Barbell", "Dumbbells", "Bench", "Pull-up Bar"]
    })
    assert res.status_code == 200, f"Preferences failed: {res.text}"
    print("Preferences saved:", res.json())

    print("\n--- 7. Testing Step 5: Goals ---")
    res = client.post("/api/onboarding/goals", headers=headers, json={
        "primary_goal": "Body Recomposition",
        "secondary_goal": "Strength Building",
        "target_timeline": "12 weeks"
    })
    assert res.status_code == 200, f"Goals failed: {res.text}"
    print("Goals saved:", res.json())

    print("\n--- 8. Testing Workout Plan Generation ---")
    res = client.post("/api/workout/generate", headers=headers)
    assert res.status_code == 200, f"Generate plan failed: {res.text}"
    plan = res.json()["plan"]
    print("Plan generated:", plan["planName"])
    print("Days count:", len(plan["schedule"]))
    day1 = plan["schedule"][0]
    print(f"Day 1: {day1['day']} ({day1['focus']}), exercises: {len(day1.get('exercises', []))}")
    if day1.get("exercises"):
        first_ex = day1["exercises"][0]
        print(f"First exercise: {first_ex['name']} | Video: {first_ex.get('video', {}).get('videoId')}")

    print("\n--- 9. Testing Workout Session Tracking ---")
    res = client.post("/api/workout/session/start", headers=headers, json={
        "plan_id": plan["id"],
        "day_name": "Monday",
        "workout_name": day1["focus"]
    })
    assert res.status_code == 200, f"Start session failed: {res.text}"
    session_id = res.json()["session_id"]
    print("Session started:", session_id)

    res = client.post("/api/workout/session/set", headers=headers, json={
        "session_id": session_id,
        "exercise_name": "Barbell Bench Press",
        "set_number": 1,
        "reps": 10,
        "weight_kg": 60,
        "skipped": False
    })
    assert res.status_code == 200, f"Record set failed: {res.text}"

    res = client.post("/api/workout/session/complete", headers=headers, json={
        "session_id": session_id,
        "total_duration_minutes": 45
    })
    assert res.status_code == 200, f"Complete session failed: {res.text}"
    print("Session completed successfully")

    res = client.get("/api/workout/stats", headers=headers)
    assert res.status_code == 200, f"Stats failed: {res.text}"
    print("Workout stats:", res.json())

    print("\n--- 10. Testing Progress Tracking ---")
    res = client.post("/api/progress", headers=headers, json={
        "weight_kg": 81.5,
        "waist_cm": 84,
        "chest_cm": 102,
        "arm_cm": 37,
        "thigh_cm": 58,
        "hip_cm": 98,
        "notes": "Feeling strong"
    })
    assert res.status_code == 200, f"Progress measurement failed: {res.text}"
    print("Measurement added successfully")

    res = client.get("/api/progress/summary", headers=headers)
    assert res.status_code == 200, f"Progress summary failed: {res.text}"
    print("Summary total workouts:", res.json().get("total_workouts"))

    print("\n--- 11. Testing AI Coach Chat ---")
    res = client.post("/api/ai/chat", headers=headers, json={
        "message": "What should I do if I miss a workout?"
    })
    assert res.status_code == 200, f"AI chat failed: {res.text}"
    print("AI reply preview:", res.json()["reply"][:120], "...")

    print("\n--- 12. Testing Nutrition Guidance ---")
    res = client.post("/api/ai/nutrition", headers=headers, json={
        "diet_preference": "non-vegetarian"
    })
    assert res.status_code == 200, f"Nutrition failed: {res.text}"
    nut = res.json()["nutrition"]
    print("Nutrition generated:", {
        "calories": nut.get("daily_calories"),
        "protein": nut.get("protein_g"),
        "carbs": nut.get("carbs_g"),
        "fats": nut.get("fats_g"),
        "meals_count": len(nut.get("meals") or [])
    })

    print("\n--- 13. Testing Account Deletion ---")
    res = client.delete("/api/auth/account", headers=headers)
    assert res.status_code == 200, f"Account deletion failed: {res.text}"
    print("Account deleted:", res.json())

    res = client.get("/api/auth/me", headers=headers)
    assert res.status_code == 401 or res.status_code == 404, f"User should be deleted: {res.status_code}"
    print("Verified: User token is no longer valid (deleted)")

    print("\n🎉 ALL FASTAPI INTEGRATION TESTS PASSED SUCCESSFULLY! 🎉")

if __name__ == "__main__":
    run_tests()

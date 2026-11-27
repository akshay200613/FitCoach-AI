import uuid
import json
from typing import Any
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from ..database import get_connection
from ..auth import get_current_user

router = APIRouter(prefix="/onboarding", tags=["onboarding"])

class ProfileRequest(BaseModel):
    age: int | None = None
    gender: str | None = None
    height_cm: float | None = None
    current_weight_kg: float | None = None
    target_weight_kg: float | None = None

class HealthRequest(BaseModel):
    medical_conditions: str | None = ""
    injuries: str | None = ""
    joint_pain: str | None = ""
    exercises_to_avoid: str | None = ""
    physically_active: int | bool | None = 0
    additional_info: str | None = ""

class ExperienceRequest(BaseModel):
    fitness_experience: str | None = None
    exercise_duration: str | None = None

class PreferencesRequest(BaseModel):
    workout_location: str | None = None
    workout_days_per_week: int | None = None
    workout_duration: str | None = None
    available_equipment: list[str] | None = []

class GoalsRequest(BaseModel):
    primary_goal: str
    secondary_goal: str | None = None
    target_timeline: str | None = None

@router.post("/profile")
def save_profile(body: ProfileRequest, current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    bmi = None
    if body.height_cm and body.current_weight_kg and body.height_cm > 0:
        height_m = body.height_cm / 100.0
        bmi = round(body.current_weight_kg / (height_m * height_m), 1)

    conn = get_connection()
    try:
        existing = conn.execute("SELECT id FROM user_profiles WHERE user_id = ?", (user_id,)).fetchone()
        with conn:
            if existing:
                conn.execute(
                    """UPDATE user_profiles 
                       SET age=?, gender=?, height_cm=?, current_weight_kg=?, target_weight_kg=?, bmi=?, updated_at=CURRENT_TIMESTAMP 
                       WHERE user_id=?""",
                    (body.age, body.gender, body.height_cm, body.current_weight_kg, body.target_weight_kg, bmi, user_id),
                )
            else:
                conn.execute(
                    """INSERT INTO user_profiles (id, user_id, age, gender, height_cm, current_weight_kg, target_weight_kg, bmi) 
                       VALUES (?,?,?,?,?,?,?,?)""",
                    (str(uuid.uuid4()), user_id, body.age, body.gender, body.height_cm, body.current_weight_kg, body.target_weight_kg, bmi),
                )
        return {"message": "Profile saved", "bmi": bmi}
    finally:
        conn.close()

@router.post("/health")
def save_health(body: HealthRequest, current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    active_int = 1 if body.physically_active else 0
    conn = get_connection()
    try:
        existing = conn.execute("SELECT id FROM health_profiles WHERE user_id = ?", (user_id,)).fetchone()
        with conn:
            if existing:
                conn.execute(
                    """UPDATE health_profiles 
                       SET medical_conditions=?, injuries=?, joint_pain=?, exercises_to_avoid=?, physically_active=?, additional_info=?, updated_at=CURRENT_TIMESTAMP 
                       WHERE user_id=?""",
                    (body.medical_conditions or "", body.injuries or "", body.joint_pain or "", body.exercises_to_avoid or "", active_int, body.additional_info or "", user_id),
                )
            else:
                conn.execute(
                    """INSERT INTO health_profiles (id, user_id, medical_conditions, injuries, joint_pain, exercises_to_avoid, physically_active, additional_info) 
                       VALUES (?,?,?,?,?,?,?,?)""",
                    (str(uuid.uuid4()), user_id, body.medical_conditions or "", body.injuries or "", body.joint_pain or "", body.exercises_to_avoid or "", active_int, body.additional_info or ""),
                )
        return {"message": "Health profile saved"}
    finally:
        conn.close()

@router.post("/experience")
def save_experience(body: ExperienceRequest, current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    conn = get_connection()
    try:
        existing = conn.execute("SELECT id FROM user_profiles WHERE user_id = ?", (user_id,)).fetchone()
        with conn:
            if existing:
                conn.execute(
                    "UPDATE user_profiles SET fitness_experience=?, exercise_duration=?, updated_at=CURRENT_TIMESTAMP WHERE user_id=?",
                    (body.fitness_experience, body.exercise_duration, user_id),
                )
            else:
                conn.execute(
                    "INSERT INTO user_profiles (id, user_id, fitness_experience, exercise_duration) VALUES (?,?,?,?)",
                    (str(uuid.uuid4()), user_id, body.fitness_experience, body.exercise_duration),
                )
        return {"message": "Experience saved"}
    finally:
        conn.close()

@router.post("/preferences")
def save_preferences(body: PreferencesRequest, current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    eq_json = json.dumps(body.available_equipment or [])
    conn = get_connection()
    try:
        existing = conn.execute("SELECT id FROM user_profiles WHERE user_id = ?", (user_id,)).fetchone()
        with conn:
            if existing:
                conn.execute(
                    "UPDATE user_profiles SET workout_location=?, workout_days_per_week=?, workout_duration=?, available_equipment=?, updated_at=CURRENT_TIMESTAMP WHERE user_id=?",
                    (body.workout_location, body.workout_days_per_week, body.workout_duration, eq_json, user_id),
                )
            else:
                conn.execute(
                    "INSERT INTO user_profiles (id, user_id, workout_location, workout_days_per_week, workout_duration, available_equipment) VALUES (?,?,?,?,?,?)",
                    (str(uuid.uuid4()), user_id, body.workout_location, body.workout_days_per_week, body.workout_duration, eq_json),
                )
        return {"message": "Preferences saved"}
    finally:
        conn.close()

@router.post("/goals")
def save_goals(body: GoalsRequest, current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    conn = get_connection()
    try:
        existing = conn.execute("SELECT id FROM fitness_goals WHERE user_id = ?", (user_id,)).fetchone()
        with conn:
            if existing:
                conn.execute(
                    "UPDATE fitness_goals SET primary_goal=?, secondary_goal=?, target_timeline=?, updated_at=CURRENT_TIMESTAMP WHERE user_id=?",
                    (body.primary_goal, body.secondary_goal, body.target_timeline, user_id),
                )
            else:
                conn.execute(
                    "INSERT INTO fitness_goals (id, user_id, primary_goal, secondary_goal, target_timeline) VALUES (?,?,?,?,?)",
                    (str(uuid.uuid4()), user_id, body.primary_goal, body.secondary_goal, body.target_timeline),
                )
            # Mark onboarding completed
            conn.execute("UPDATE users SET onboarding_completed = 1 WHERE id = ?", (user_id,))
        return {"message": "Goals saved"}
    finally:
        conn.close()

@router.get("/data")
def get_onboarding_data(current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    conn = get_connection()
    try:
        profile = conn.execute("SELECT * FROM user_profiles WHERE user_id = ?", (user_id,)).fetchone()
        health = conn.execute("SELECT * FROM health_profiles WHERE user_id = ?", (user_id,)).fetchone()
        goals = conn.execute("SELECT * FROM fitness_goals WHERE user_id = ?", (user_id,)).fetchone()

        return {
            "profile": dict(profile) if profile else None,
            "health": dict(health) if health else None,
            "goals": dict(goals) if goals else None,
        }
    finally:
        conn.close()

@router.put("/profile")
def update_profile(fields: dict[str, Any], current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    conn = get_connection()
    try:
        profile = conn.execute("SELECT * FROM user_profiles WHERE user_id = ?", (user_id,)).fetchone()
        if not profile:
            raise HTTPException(status_code=404, detail="Profile not found")

        updates = []
        values = []

        allowed = [
            'age', 'gender', 'height_cm', 'current_weight_kg', 'target_weight_kg',
            'fitness_experience', 'exercise_duration', 'workout_location',
            'workout_days_per_week', 'workout_duration'
        ]
        for key in allowed:
            if key in fields:
                updates.append(f"{key}=?")
                values.append(fields[key])

        if 'available_equipment' in fields:
            updates.append("available_equipment=?")
            val = fields['available_equipment']
            values.append(json.dumps(val) if not isinstance(val, str) else val)

        h = fields.get("height_cm") or profile["height_cm"]
        w = fields.get("current_weight_kg") or profile["current_weight_kg"]
        if h and w and float(h) > 0:
            h_m = float(h) / 100.0
            bmi = round(float(w) / (h_m * h_m), 1)
            updates.append("bmi=?")
            values.append(bmi)

        if updates:
            updates.append("updated_at=CURRENT_TIMESTAMP")
            values.append(user_id)
            with conn:
                conn.execute(f"UPDATE user_profiles SET {', '.join(updates)} WHERE user_id=?", tuple(values))

        return {"message": "Profile updated"}
    finally:
        conn.close()

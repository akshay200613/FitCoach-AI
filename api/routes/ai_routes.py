import uuid
import json
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from ..database import get_connection
from ..auth import get_current_user
from ..ai_engine import chat_with_ai, generate_nutrition_plan

router = APIRouter(prefix="/ai", tags=["ai"])

class ChatRequest(BaseModel):
    message: str

class NutritionRequest(BaseModel):
    diet_preference: str | None = "non-vegetarian"

@router.post("/chat")
async def chat(body: ChatRequest, current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    conn = get_connection()
    try:
        profile = conn.execute("SELECT * FROM user_profiles WHERE user_id = ?", (user_id,)).fetchone()
        health = conn.execute("SELECT * FROM health_profiles WHERE user_id = ?", (user_id,)).fetchone()
        goals = conn.execute("SELECT * FROM fitness_goals WHERE user_id = ?", (user_id,)).fetchone()
        recent_sessions = conn.execute("SELECT * FROM workout_sessions WHERE user_id = ? ORDER BY started_at DESC LIMIT 10", (user_id,)).fetchall()
        active_plan_row = conn.execute("SELECT plan_data FROM workout_plans WHERE user_id = ? AND is_active = 1 LIMIT 1", (user_id,)).fetchone()

        active_plan = None
        if active_plan_row and active_plan_row["plan_data"]:
            try:
                active_plan = json.loads(active_plan_row["plan_data"])
            except Exception:
                pass

        user_msg_id = str(uuid.uuid4())
        with conn:
            conn.execute(
                "INSERT INTO ai_conversations (id, user_id, role, content) VALUES (?,?,?,?)",
                (user_msg_id, user_id, "user", body.message),
            )

        history_rows = conn.execute(
            "SELECT role, content FROM ai_conversations WHERE user_id = ? ORDER BY created_at DESC LIMIT 20",
            (user_id,),
        ).fetchall()
        history = [dict(h) for h in reversed(history_rows)]

        context = {
            "profile": dict(profile) if profile else None,
            "health": dict(health) if health else None,
            "goals": dict(goals) if goals else None,
            "recentSessions": [dict(s) for s in recent_sessions],
            "activePlan": active_plan,
        }

        reply = await chat_with_ai(body.message, context, history)

        ai_msg_id = str(uuid.uuid4())
        with conn:
            conn.execute(
                "INSERT INTO ai_conversations (id, user_id, role, content) VALUES (?,?,?,?)",
                (ai_msg_id, user_id, "assistant", reply),
            )

        return {"reply": reply}
    finally:
        conn.close()

@router.get("/history")
def get_ai_history(current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    conn = get_connection()
    try:
        rows = conn.execute(
            "SELECT id, role, content, created_at FROM ai_conversations WHERE user_id = ? ORDER BY created_at ASC LIMIT 100",
            (user_id,),
        ).fetchall()
        return {"conversations": [dict(r) for r in rows]}
    finally:
        conn.close()

@router.delete("/history")
def clear_ai_history(current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    conn = get_connection()
    try:
        with conn:
            conn.execute("DELETE FROM ai_conversations WHERE user_id = ?", (user_id,))
        return {"message": "History cleared"}
    finally:
        conn.close()

@router.post("/nutrition")
async def create_nutrition(body: NutritionRequest, current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    conn = get_connection()
    try:
        profile = conn.execute("SELECT * FROM user_profiles WHERE user_id = ?", (user_id,)).fetchone()
        goals = conn.execute("SELECT * FROM fitness_goals WHERE user_id = ?", (user_id,)).fetchone()

        if not profile:
            raise HTTPException(status_code=400, detail="Complete your profile first")

        nutrition = await generate_nutrition_plan({
            "age": profile["age"],
            "gender": profile["gender"],
            "weight_kg": profile["current_weight_kg"],
            "height_cm": profile["height_cm"],
            "target_weight_kg": profile["target_weight_kg"],
            "goal": goals["primary_goal"] if goals else "general fitness",
            "diet_preference": body.diet_preference or "non-vegetarian",
            "fitness_experience": profile["fitness_experience"],
            "workout_days": profile["workout_days_per_week"],
        })

        existing = conn.execute("SELECT id FROM nutrition_profiles WHERE user_id = ?", (user_id,)).fetchone()
        with conn:
            if existing:
                conn.execute(
                    """UPDATE nutrition_profiles 
                       SET diet_preference=?, daily_calories=?, protein_g=?, carbs_g=?, fats_g=?, water_ml=?, meal_plan=?, updated_at=CURRENT_TIMESTAMP 
                       WHERE user_id=?""",
                    (body.diet_preference, nutrition["daily_calories"], nutrition["protein_g"], nutrition["carbs_g"], nutrition["fats_g"], nutrition["water_ml"], json.dumps(nutrition.get("meals") or []), user_id),
                )
            else:
                conn.execute(
                    """INSERT INTO nutrition_profiles (id, user_id, diet_preference, daily_calories, protein_g, carbs_g, fats_g, water_ml, meal_plan) 
                       VALUES (?,?,?,?,?,?,?,?,?)""",
                    (str(uuid.uuid4()), user_id, body.diet_preference, nutrition["daily_calories"], nutrition["protein_g"], nutrition["carbs_g"], nutrition["fats_g"], nutrition["water_ml"], json.dumps(nutrition.get("meals") or [])),
                )

        return {"nutrition": nutrition}
    finally:
        conn.close()

@router.get("/nutrition")
def get_nutrition(current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    conn = get_connection()
    try:
        row = conn.execute("SELECT * FROM nutrition_profiles WHERE user_id = ?", (user_id,)).fetchone()
        if not row:
            return {"nutrition": None}

        data = dict(row)
        if data.get("meal_plan"):
            try:
                data["meal_plan"] = json.loads(data["meal_plan"])
            except Exception:
                pass
        return {"nutrition": data}
    finally:
        conn.close()

import uuid
import json
import datetime
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from ..database import get_connection
from ..auth import get_current_user
from ..ai_engine import generate_workout_plan

router = APIRouter(prefix="/workout", tags=["workout"])

class StartSessionRequest(BaseModel):
    plan_id: str | None = None
    day_name: str
    workout_name: str

class RecordSetRequest(BaseModel):
    session_id: str
    exercise_name: str
    set_number: int
    reps: int | None = 0
    weight_kg: float | None = 0.0
    skipped: bool | int | None = False

class CompleteSessionRequest(BaseModel):
    session_id: str
    total_duration_minutes: int | None = 0

@router.post("/generate")
async def generate_plan(current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    conn = get_connection()
    try:
        profile = conn.execute("SELECT * FROM user_profiles WHERE user_id = ?", (user_id,)).fetchone()
        health = conn.execute("SELECT * FROM health_profiles WHERE user_id = ?", (user_id,)).fetchone()
        goals = conn.execute("SELECT * FROM fitness_goals WHERE user_id = ?", (user_id,)).fetchone()
        user = conn.execute("SELECT full_name FROM users WHERE id = ?", (user_id,)).fetchone()

        if not profile or not goals:
            raise HTTPException(status_code=400, detail="Please complete your profile and set your goals first")

        equipment = []
        try:
            equipment = json.loads(profile["available_equipment"] or "[]")
        except Exception:
            pass

        user_context = {
            "name": user["full_name"],
            "age": profile["age"],
            "gender": profile["gender"],
            "height_cm": profile["height_cm"],
            "weight_kg": profile["current_weight_kg"],
            "target_weight_kg": profile["target_weight_kg"],
            "bmi": profile["bmi"],
            "fitness_experience": profile["fitness_experience"],
            "exercise_duration": profile["exercise_duration"],
            "workout_location": profile["workout_location"],
            "workout_days": profile["workout_days_per_week"],
            "workout_duration": profile["workout_duration"],
            "equipment": equipment,
            "medical_conditions": health["medical_conditions"] if health else "",
            "injuries": health["injuries"] if health else "",
            "joint_pain": health["joint_pain"] if health else "",
            "exercises_to_avoid": health["exercises_to_avoid"] if health else "",
            "primary_goal": goals["primary_goal"],
            "secondary_goal": goals["secondary_goal"],
            "target_timeline": goals["target_timeline"],
        }

        plan = await generate_workout_plan(user_context)
        plan_id = str(uuid.uuid4())
        plan_name = plan.get("planName") or "My Workout Plan"

        with conn:
            conn.execute("UPDATE workout_plans SET is_active = 0 WHERE user_id = ?", (user_id,))
            conn.execute(
                "INSERT INTO workout_plans (id, user_id, plan_name, plan_data) VALUES (?,?,?,?)",
                (plan_id, user_id, plan_name, json.dumps(plan)),
            )

        return {"plan": {"id": plan_id, **plan}}
    finally:
        conn.close()

@router.get("/active")
def get_active_plan(current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    conn = get_connection()
    try:
        plan_row = conn.execute(
            "SELECT * FROM workout_plans WHERE user_id = ? AND is_active = 1 ORDER BY created_at DESC LIMIT 1",
            (user_id,),
        ).fetchone()
        if not plan_row:
            return {"plan": None}

        plan_data = json.loads(plan_row["plan_data"])
        return {
            "plan": {
                "id": plan_row["id"],
                **plan_data,
                "created_at": plan_row["created_at"],
            }
        }
    finally:
        conn.close()

@router.get("/history")
def get_plan_history(current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    conn = get_connection()
    try:
        plans = conn.execute(
            "SELECT id, plan_name, is_active, created_at FROM workout_plans WHERE user_id = ? ORDER BY created_at DESC",
            (user_id,),
        ).fetchall()
        return {"plans": [dict(p) for p in plans]}
    finally:
        conn.close()

@router.post("/session/start")
def start_session(body: StartSessionRequest, current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    session_id = str(uuid.uuid4())
    conn = get_connection()
    try:
        with conn:
            conn.execute(
                "INSERT INTO workout_sessions (id, user_id, plan_id, day_name, workout_name) VALUES (?,?,?,?,?)",
                (session_id, user_id, body.plan_id, body.day_name, body.workout_name),
            )
        return {"session_id": session_id}
    finally:
        conn.close()

@router.post("/session/set")
def record_set(body: RecordSetRequest, current_user: dict = Depends(get_current_user)):
    set_id = str(uuid.uuid4())
    skipped_int = 1 if body.skipped else 0
    completed_int = 0 if body.skipped else 1

    conn = get_connection()
    try:
        with conn:
            conn.execute(
                """INSERT INTO completed_sets (id, session_id, exercise_name, set_number, reps, weight_kg, completed, skipped)
                   VALUES (?,?,?,?,?,?,?,?)""",
                (set_id, body.session_id, body.exercise_name, body.set_number, body.reps or 0, body.weight_kg or 0.0, completed_int, skipped_int),
            )
        return {"message": "Set recorded"}
    finally:
        conn.close()

@router.post("/session/complete")
def complete_session(body: CompleteSessionRequest, current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    conn = get_connection()
    try:
        with conn:
            conn.execute(
                """UPDATE workout_sessions 
                   SET status = 'completed', completed_at = CURRENT_TIMESTAMP, total_duration_minutes = ? 
                   WHERE id = ? AND user_id = ?""",
                (body.total_duration_minutes or 0, body.session_id, user_id),
            )
        return {"message": "Workout completed!"}
    finally:
        conn.close()

@router.get("/sessions")
def get_sessions(current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    conn = get_connection()
    try:
        rows = conn.execute(
            """SELECT ws.*, COUNT(cs.id) as total_sets_completed 
               FROM workout_sessions ws 
               LEFT JOIN completed_sets cs ON ws.id = cs.session_id AND cs.completed = 1 
               WHERE ws.user_id = ? 
               GROUP BY ws.id 
               ORDER BY ws.started_at DESC""",
            (user_id,),
        ).fetchall()
        return {"sessions": [dict(r) for r in rows]}
    finally:
        conn.close()

@router.get("/session/{session_id}")
def get_session_detail(session_id: str, current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    conn = get_connection()
    try:
        session = conn.execute(
            "SELECT * FROM workout_sessions WHERE id = ? AND user_id = ?",
            (session_id, user_id),
        ).fetchone()
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")

        sets = conn.execute(
            "SELECT * FROM completed_sets WHERE session_id = ? ORDER BY exercise_name, set_number",
            (session_id,),
        ).fetchall()

        return {"session": dict(session), "sets": [dict(s) for s in sets]}
    finally:
        conn.close()

@router.get("/stats")
def get_workout_stats(current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    conn = get_connection()
    try:
        total = conn.execute(
            "SELECT COUNT(*) as count FROM workout_sessions WHERE user_id = ? AND status = 'completed'",
            (user_id,),
        ).fetchone()["count"]

        this_week = conn.execute(
            """SELECT COUNT(*) as count FROM workout_sessions 
               WHERE user_id = ? AND status = 'completed' AND started_at >= date('now', '-7 days')""",
            (user_id,),
        ).fetchone()["count"]

        recent = conn.execute(
            "SELECT * FROM workout_sessions WHERE user_id = ? ORDER BY started_at DESC LIMIT 1",
            (user_id,),
        ).fetchone()

        total_sets = conn.execute(
            """SELECT COUNT(*) as count FROM completed_sets cs 
               JOIN workout_sessions ws ON cs.session_id = ws.id 
               WHERE ws.user_id = ? AND cs.completed = 1""",
            (user_id,),
        ).fetchone()["count"]

        # Calculate consecutive days streak
        sessions = conn.execute(
            """SELECT DISTINCT date(started_at) as session_date 
               FROM workout_sessions 
               WHERE user_id = ? AND status = 'completed' 
               ORDER BY session_date DESC""",
            (user_id,),
        ).fetchall()

        streak = 0
        if sessions:
            today = datetime.date.today()
            dates = []
            for s in sessions:
                try:
                    d = datetime.date.fromisoformat(s["session_date"].split()[0])
                    dates.append(d)
                except Exception:
                    pass

            if dates:
                first_date = dates[0]
                diff = (today - first_date).days
                if diff <= 1:
                    streak = 1
                    current_chk = first_date
                    for next_date in dates[1:]:
                        if (current_chk - next_date).days == 1:
                            streak += 1
                            current_chk = next_date
                        elif current_chk == next_date:
                            continue
                        else:
                            break

        return {
            "total_workouts": total,
            "this_week": this_week,
            "streak": streak,
            "recent_session": dict(recent) if recent else None,
            "total_sets": total_sets,
        }
    finally:
        conn.close()

import uuid
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from ..database import get_connection
from ..auth import get_current_user

router = APIRouter(prefix="/progress", tags=["progress"])

class MeasurementRequest(BaseModel):
    weight_kg: float | None = None
    waist_cm: float | None = None
    chest_cm: float | None = None
    arm_cm: float | None = None
    thigh_cm: float | None = None
    hip_cm: float | None = None
    notes: str | None = ""

@router.post("")
def add_measurement(body: MeasurementRequest, current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    m_id = str(uuid.uuid4())
    conn = get_connection()
    try:
        with conn:
            conn.execute(
                """INSERT INTO progress_measurements 
                   (id, user_id, weight_kg, waist_cm, chest_cm, arm_cm, thigh_cm, hip_cm, notes) 
                   VALUES (?,?,?,?,?,?,?,?,?)""",
                (m_id, user_id, body.weight_kg, body.waist_cm, body.chest_cm, body.arm_cm, body.thigh_cm, body.hip_cm, body.notes or ""),
            )

            if body.weight_kg:
                profile = conn.execute("SELECT height_cm FROM user_profiles WHERE user_id = ?", (user_id,)).fetchone()
                if profile and profile["height_cm"]:
                    h_m = float(profile["height_cm"]) / 100.0
                    bmi = round(body.weight_kg / (h_m * h_m), 1)
                    conn.execute(
                        "UPDATE user_profiles SET current_weight_kg = ?, bmi = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?",
                        (body.weight_kg, bmi, user_id),
                    )

        return {"message": "Measurement recorded"}
    finally:
        conn.close()

@router.get("")
def get_measurements(current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    conn = get_connection()
    try:
        rows = conn.execute(
            "SELECT * FROM progress_measurements WHERE user_id = ? ORDER BY measured_at ASC",
            (user_id,),
        ).fetchall()
        return {"measurements": [dict(r) for r in rows]}
    finally:
        conn.close()

@router.get("/summary")
def get_progress_summary(current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    conn = get_connection()
    try:
        profile = conn.execute("SELECT * FROM user_profiles WHERE user_id = ?", (user_id,)).fetchone()
        first = conn.execute("SELECT * FROM progress_measurements WHERE user_id = ? ORDER BY measured_at ASC LIMIT 1", (user_id,)).fetchone()
        latest = conn.execute("SELECT * FROM progress_measurements WHERE user_id = ? ORDER BY measured_at DESC LIMIT 1", (user_id,)).fetchone()

        this_month = conn.execute(
            """SELECT COUNT(*) as count FROM workout_sessions 
               WHERE user_id = ? AND status = 'completed' AND started_at >= date('now', '-30 days')""",
            (user_id,),
        ).fetchone()["count"]

        total = conn.execute(
            "SELECT COUNT(*) as count FROM workout_sessions WHERE user_id = ? AND status = 'completed'",
            (user_id,),
        ).fetchone()["count"]

        weekly = conn.execute(
            """SELECT date(started_at) as day, COUNT(*) as workouts 
               FROM workout_sessions 
               WHERE user_id = ? AND status = 'completed' AND started_at >= date('now', '-28 days')
               GROUP BY date(started_at) ORDER BY day""",
            (user_id,),
        ).fetchall()

        return {
            "profile": dict(profile) if profile else None,
            "initial": dict(first) if first else None,
            "current": dict(latest) if latest else None,
            "workouts_this_month": this_month,
            "total_workouts": total,
            "weekly_completion": [dict(w) for w in weekly],
        }
    finally:
        conn.close()

@router.delete("/{measurement_id}")
def delete_measurement(measurement_id: str, current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    conn = get_connection()
    try:
        with conn:
            conn.execute("DELETE FROM progress_measurements WHERE id = ? AND user_id = ?", (measurement_id, user_id))
        return {"message": "Measurement deleted"}
    finally:
        conn.close()

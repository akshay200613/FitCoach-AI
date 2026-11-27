import uuid
from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel
from ..database import get_connection
from ..auth import hash_password, verify_password, create_access_token, get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])

class RegisterRequest(BaseModel):
    email: str
    password: str
    full_name: str

class LoginRequest(BaseModel):
    email: str
    password: str

@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(body: RegisterRequest):
    if not body.email or not body.password or not body.full_name:
        raise HTTPException(status_code=400, detail="Email, password, and full name are required")
    if "@" not in body.email:
        raise HTTPException(status_code=400, detail="Valid email address is required")

    conn = get_connection()
    try:
        existing = conn.execute("SELECT id FROM users WHERE email = ?", (body.email.lower().strip(),)).fetchone()
        if existing:
            raise HTTPException(status_code=409, detail="Email already registered")

        user_id = str(uuid.uuid4())
        hashed = hash_password(body.password)

        conn.execute(
            "INSERT INTO users (id, email, password, full_name) VALUES (?, ?, ?, ?)",
            (user_id, body.email.lower().strip(), hashed, body.full_name.strip()),
        )
        conn.commit()

        token = create_access_token(user_id, body.email.lower().strip())
        return {
            "token": token,
            "user": {
                "id": user_id,
                "email": body.email.lower().strip(),
                "full_name": body.full_name.strip(),
                "onboarding_completed": 0,
            }
        }
    finally:
        conn.close()

@router.post("/login")
def login(body: LoginRequest):
    conn = get_connection()
    try:
        user = conn.execute("SELECT * FROM users WHERE email = ?", (body.email.lower().strip(),)).fetchone()
        if not user or not verify_password(body.password, user["password"]):
            raise HTTPException(status_code=401, detail="Invalid credentials")

        token = create_access_token(user["id"], user["email"])
        return {
            "token": token,
            "user": {
                "id": user["id"],
                "email": user["email"],
                "full_name": user["full_name"],
                "onboarding_completed": user["onboarding_completed"],
            }
        }
    finally:
        conn.close()

@router.get("/me")
def get_me(current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    conn = get_connection()
    try:
        user = conn.execute(
            "SELECT id, email, full_name, onboarding_completed, created_at FROM users WHERE id = ?",
            (user_id,),
        ).fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        profile = conn.execute("SELECT * FROM user_profiles WHERE user_id = ?", (user_id,)).fetchone()
        health = conn.execute("SELECT * FROM health_profiles WHERE user_id = ?", (user_id,)).fetchone()
        goals = conn.execute("SELECT * FROM fitness_goals WHERE user_id = ?", (user_id,)).fetchone()

        return {
            "user": dict(user),
            "profile": dict(profile) if profile else None,
            "health": dict(health) if health else None,
            "goals": dict(goals) if goals else None,
        }
    finally:
        conn.close()

@router.delete("/account")
def delete_account(current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    conn = get_connection()
    try:
        with conn:
            conn.execute("DELETE FROM completed_sets WHERE session_id IN (SELECT id FROM workout_sessions WHERE user_id = ?)", (user_id,))
            conn.execute("DELETE FROM workout_sessions WHERE user_id = ?", (user_id,))
            conn.execute("DELETE FROM workout_plans WHERE user_id = ?", (user_id,))
            conn.execute("DELETE FROM progress_measurements WHERE user_id = ?", (user_id,))
            conn.execute("DELETE FROM ai_conversations WHERE user_id = ?", (user_id,))
            conn.execute("DELETE FROM nutrition_profiles WHERE user_id = ?", (user_id,))
            conn.execute("DELETE FROM fitness_goals WHERE user_id = ?", (user_id,))
            conn.execute("DELETE FROM health_profiles WHERE user_id = ?", (user_id,))
            conn.execute("DELETE FROM user_profiles WHERE user_id = ?", (user_id,))
            conn.execute("DELETE FROM users WHERE id = ?", (user_id,))
        return {"message": "Account deleted successfully"}
    finally:
        conn.close()

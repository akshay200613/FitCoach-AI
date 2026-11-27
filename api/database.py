import os
import sqlite3
from pathlib import Path

def get_db_path() -> str:
    # On Vercel / serverless environments, only /tmp is writable
    if os.environ.get("VERCEL") or os.environ.get("AWS_LAMBDA_FUNCTION_NAME"):
        return "/tmp/fitness.db"
    
    explicit_path = os.environ.get("DATABASE_PATH")
    if explicit_path:
        return explicit_path
        
    # Check if existing server/fitness.db exists
    server_db = Path(__file__).resolve().parent.parent / "server" / "fitness.db"
    if server_db.parent.exists():
        return str(server_db)
        
    local_db = Path(__file__).resolve().parent / "fitness.db"
    return str(local_db)

DB_PATH = get_db_path()

def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    try:
        conn.execute("PRAGMA journal_mode = WAL;")
    except Exception:
        pass
    return conn

def init_db():
    conn = get_connection()
    with conn:
        conn.executescript("""
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            full_name TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            onboarding_completed INTEGER DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS user_profiles (
            id TEXT PRIMARY KEY,
            user_id TEXT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            age INTEGER,
            gender TEXT,
            height_cm REAL,
            current_weight_kg REAL,
            target_weight_kg REAL,
            bmi REAL,
            fitness_experience TEXT,
            exercise_duration TEXT,
            workout_location TEXT,
            workout_days_per_week INTEGER,
            workout_duration TEXT,
            available_equipment TEXT DEFAULT '[]',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS health_profiles (
            id TEXT PRIMARY KEY,
            user_id TEXT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            medical_conditions TEXT DEFAULT '',
            injuries TEXT DEFAULT '',
            joint_pain TEXT DEFAULT '',
            exercises_to_avoid TEXT DEFAULT '',
            physically_active INTEGER DEFAULT 0,
            additional_info TEXT DEFAULT '',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS fitness_goals (
            id TEXT PRIMARY KEY,
            user_id TEXT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            primary_goal TEXT NOT NULL,
            secondary_goal TEXT,
            target_timeline TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS workout_plans (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            plan_name TEXT NOT NULL,
            plan_data TEXT NOT NULL,
            is_active INTEGER DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS workout_sessions (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            plan_id TEXT REFERENCES workout_plans(id),
            day_name TEXT NOT NULL,
            workout_name TEXT NOT NULL,
            started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            completed_at DATETIME,
            total_duration_minutes INTEGER,
            status TEXT DEFAULT 'in_progress'
        );

        CREATE TABLE IF NOT EXISTS completed_sets (
            id TEXT PRIMARY KEY,
            session_id TEXT NOT NULL REFERENCES workout_sessions(id) ON DELETE CASCADE,
            exercise_name TEXT NOT NULL,
            set_number INTEGER NOT NULL,
            reps INTEGER,
            weight_kg REAL,
            completed INTEGER DEFAULT 1,
            skipped INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS progress_measurements (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            weight_kg REAL,
            waist_cm REAL,
            chest_cm REAL,
            arm_cm REAL,
            thigh_cm REAL,
            hip_cm REAL,
            notes TEXT,
            measured_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS nutrition_profiles (
            id TEXT PRIMARY KEY,
            user_id TEXT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            diet_preference TEXT DEFAULT 'non-vegetarian',
            daily_calories REAL,
            protein_g REAL,
            carbs_g REAL,
            fats_g REAL,
            water_ml REAL,
            meal_plan TEXT DEFAULT '[]',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS ai_conversations (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            role TEXT NOT NULL,
            content TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS idx_sessions_user ON workout_sessions(user_id);
        CREATE INDEX IF NOT EXISTS idx_sets_session ON completed_sets(session_id);
        CREATE INDEX IF NOT EXISTS idx_progress_user ON progress_measurements(user_id);
        CREATE INDEX IF NOT EXISTS idx_ai_conv_user ON ai_conversations(user_id);
        """)
    conn.close()

# Auto-initialize on import
init_db()

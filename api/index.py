import os
import datetime
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

from fastapi import FastAPI, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from .routes import auth_routes, onboarding_routes, workout_routes, progress_routes, ai_routes

app = FastAPI(
    title="FitCoach AI API",
    description="FastAPI Backend for FitCoach AI",
    version="2.0.0",
)

# Enable CORS for all origins (supports both Vercel domain and localhost)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Router with /api prefix (matches frontend fetch calls)
api_router = APIRouter(prefix="/api")

@api_router.get("/health")
def api_health():
    return {
        "status": "OK",
        "framework": "FastAPI",
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
    }

api_router.include_router(auth_routes.router)
api_router.include_router(onboarding_routes.router)
api_router.include_router(workout_routes.router)
api_router.include_router(progress_routes.router)
api_router.include_router(ai_routes.router)

app.include_router(api_router)

# Also support top-level /health
@app.get("/health")
def health():
    return {
        "status": "OK",
        "framework": "FastAPI",
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
    }

# Local static serving for production build if client/dist exists
client_dist = Path(__file__).resolve().parent.parent / "client" / "dist"
if client_dist.exists() and (client_dist / "index.html").exists():
    app.mount("/assets", StaticFiles(directory=str(client_dist / "assets")), name="assets")

    @app.get("/{full_path:path}")
    def serve_spa(full_path: str):
        # Do not catch /api calls
        if full_path.startswith("api"):
            return None
        file_path = client_dist / full_path
        if file_path.is_file():
            return FileResponse(str(file_path))
        return FileResponse(str(client_dist / "index.html"))

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 5000))
    uvicorn.run("api.index:app", host="0.0.0.0", port=port, reload=True)

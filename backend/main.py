"""
main.py — AutoFix Campus FastAPI application entry point.
"""
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from apscheduler.schedulers.background import BackgroundScheduler
from dotenv import load_dotenv

from database import engine
import models
from routers import complaints, staff, dashboard, events, logs, ratings, auth, chatbot
from seed import seed

from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from fastapi import Request, WebSocket, WebSocketDisconnect
from services.websocket_service import manager
from limiter import limiter

load_dotenv()

# ── Startup / Shutdown ─────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create DB tables (additive only — won't drop existing data)
    models.Base.metadata.create_all(bind=engine)
    # Seed staff if empty
    seed()
    # Start background escalation monitor
    scheduler = BackgroundScheduler()

    def run_monitor():
        from database import SessionLocal
        from agents import MonitoringAgent
        db = SessionLocal()
        try:
            MonitoringAgent().run(db)
        finally:
            db.close()

    scheduler.add_job(run_monitor, "interval", seconds=60, id="escalation_monitor")
    scheduler.start()
    print("[AUTOFIX] Monitoring Agent started (every 60s)")
    yield
    scheduler.shutdown()
    print("[AUTOFIX] Scheduler shut down.")


# ── App ────────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="AutoFix Campus API",
    description="Autonomous AI-powered campus complaint resolution system.",
    version="2.0.0",
    lifespan=lifespan,
)

# Allow React dev server + all origins for hackathon demo
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Serve uploaded images
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Register all routers
app.include_router(complaints.router)
app.include_router(ratings.router)
app.include_router(staff.router)
app.include_router(dashboard.router)
app.include_router(events.router)
app.include_router(logs.router)
app.include_router(auth.router)
app.include_router(chatbot.router)


@app.get("/")
def root():
    return {"message": "AutoFix Campus API v2.0 is running 🚀", "docs": "/docs"}

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

"""
schemas.py — Pydantic request/response schemas for AutoFix Campus
"""
from pydantic import BaseModel
from typing import Optional
from datetime import datetime


# ─── Staff Schemas ───────────────────────────────────────────────────────────

class StaffBase(BaseModel):
    name: str
    role: str
    phone: Optional[str] = None
    building: str
    is_available: bool = True
    current_load: int = 0
    points: int = 0

class StaffOut(StaffBase):
    id: int
    model_config = {"from_attributes": True}


# ─── Complaint Schemas ────────────────────────────────────────────────────────

class ComplaintCreate(BaseModel):
    description: str
    location: str
    is_anonymous: bool = False

class ComplaintOut(BaseModel):
    id: int
    description: str
    location: str
    is_anonymous: bool
    image_path: Optional[str] = None
    issue_type: Optional[str] = None
    priority: str
    ai_confidence: float
    ai_reasoning: Optional[str] = None
    sentiment_score: Optional[float] = None
    resolution_summary: Optional[str] = None
    status: str
    submitted_at: datetime
    assigned_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None
    work_started_at: Optional[datetime] = None
    assigned_staff: Optional[StaffOut] = None
    proof_image_path: Optional[str] = None
    verification_status: Optional[str] = None
    verification_note: Optional[str] = None
    escalation_count: int
    sla_deadline: Optional[datetime] = None
    student_rating: Optional[int] = None
    rejection_reason: Optional[str] = None
    model_config = {"from_attributes": True}

class StatusUpdate(BaseModel):
    status: str   # "In Progress" or "Completed"

class RatingCreate(BaseModel):
    rating: int   # 1-5

class RejectionCreate(BaseModel):
    reason: str


# ─── Dashboard Schemas ────────────────────────────────────────────────────────

class DashboardStats(BaseModel):
    total: int
    pending: int
    assigned: int
    in_progress: int
    resolved: int
    escalated: int
    avg_resolution_minutes: Optional[float] = None
    staff_performance: list[dict]


# ─── Auth Schemas ─────────────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    role: str   # "student" | "staff" | "admin"
    name: str

class LoginResponse(BaseModel):
    token: str
    role: str
    name: str

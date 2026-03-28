"""
models.py — SQLAlchemy ORM models for AutoFix Campus
"""
from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, Float, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from database import Base


class Staff(Base):
    __tablename__ = "staff"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    role = Column(String, nullable=False)           # e.g. Electrician, Cleaner
    phone = Column(String, nullable=True)
    building = Column(String, nullable=False)       # Location/zone
    is_available = Column(Boolean, default=True)
    current_load = Column(Integer, default=0)       # Active task count
    points = Column(Integer, default=0)             # Gamification score

    assignments = relationship("Complaint", back_populates="assigned_staff")


class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(Integer, primary_key=True, index=True)
    description = Column(Text, nullable=False)
    location = Column(String, nullable=False)
    image_path = Column(String, nullable=True)          # Optional submitted image
    is_anonymous = Column(Boolean, default=False)        # Anonymous submission

    # AI-classified fields
    issue_type = Column(String, nullable=True)          # Electrical, Cleaning, etc.
    priority = Column(String, default="Medium")         # Low / Medium / High / Critical
    ai_confidence = Column(Float, default=0.0)
    ai_reasoning = Column(Text, nullable=True)          # Explanation from the AI
    sentiment_score = Column(Float, nullable=True)      # 0.0=calm, 1.0=very urgent/frustrated
    resolution_summary = Column(Text, nullable=True)    # AI-generated post-resolution summary

    # Status tracking
    status = Column(String, default="Pending")          # Pending/Assigned/In Progress/Resolved/Escalated
    submitted_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    assigned_at = Column(DateTime, nullable=True)
    resolved_at = Column(DateTime, nullable=True)
    work_started_at = Column(DateTime, nullable=True)   # When staff clicked "Start Work"

    # Assignment
    assigned_staff_id = Column(Integer, ForeignKey("staff.id"), nullable=True)
    assigned_staff = relationship("Staff", back_populates="assignments")

    # Proof / verification
    proof_image_path = Column(String, nullable=True)
    verification_status = Column(String, nullable=True)  # verified / rejected
    verification_note = Column(Text, nullable=True)

    # Escalation
    escalation_count = Column(Integer, default=0)
    sla_deadline = Column(DateTime, nullable=True)

    # Student feedback
    student_rating = Column(Integer, nullable=True)      # 1-5 stars

    # Rejection
    rejection_reason = Column(Text, nullable=True)       # Staff rejection note

"""
agents.py — Multi-Agent System for AutoFix Campus (Autonomous Brain)

Defines specialized agents that handle specific decision-making tasks autonomously.
Each agent appends to a shared in-memory log that is streamed via SSE to the frontend.
"""
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, Optional, List
from sqlalchemy.orm import Session
import collections
import os

from models import Complaint, Staff
from services.ai_service import classify_complaint, verify_proof_image, analyze_sentiment, generate_auto_summary
from services.assignment_service import assign_staff, set_sla_deadline

SLA_MINUTES = int(os.getenv("SLA_MINUTES", "10"))

# --- Live Agent Log Buffer ---
_AGENT_LOG = []

def log_agent_event(agent_name: str, message: str, complaint_id: Optional[int] = None, level: str = "info"):
    entry = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "agent": agent_name,
        "complaint_id": complaint_id,
        "level": level,
        "message": message
    }
    _AGENT_LOG.append(entry)
    # Keep log size manageable
    if len(_AGENT_LOG) > 200:
        _AGENT_LOG.pop(0)
    print(f"[{agent_name}] {message}")

def get_agent_log() -> List[dict]:
    return _AGENT_LOG


# ── Agents ────────────────────────────────────────────────────────────────────

class ComplaintAgent:
    """Agent #1: Understands the complaint, extracts details, decides priority, and measures sentiment."""
    NAME = "ComplaintIntel"

    def run(self, description: str, location: str, complaint_id: Optional[int] = None) -> Dict[str, Any]:
        log_agent_event("ComplaintIntel", f"Analyzing and classifying issue at {location}...", complaint_id)
        result = classify_complaint(description, location)
        sentiment = result.get("sentiment_score") or analyze_sentiment(description)
        result["sentiment_score"] = sentiment
        log_agent_event("ComplaintIntel", f"Classified as '{result['issue_type']}' (priority: {result['priority']}, confidence: {result['ai_confidence']})", complaint_id)
        return result


class AssignmentAgent:
    """Agent #2: Decides *who* should fix it based on skill, availability, and proximity."""
    NAME = "Assignment"

    def run(self, db: Session, complaint: Complaint) -> Optional[Staff]:
        log_agent_event("Assignment", f"Scanning for optimal staff for {complaint.issue_type} in {complaint.location}...", complaint.id)
        staff = assign_staff(db, complaint)
        if staff:
            log_agent_event("Assignment", f"Found best match: {staff.name} ({staff.role}) with load {staff.current_load}", complaint.id)
        else:
            log_agent_event("Assignment", "No available staff found for this role/location.", complaint.id, level="warning")
        return staff


class VerificationAgent:
    """Agent #5: Decides if work is actually done by analyzing proof images."""
    NAME = "Verification"

    def run(self, image_path: str, issue_type: str, complaint_id: Optional[int] = None) -> Dict[str, Any]:
        log_agent_event("Verification", f"Running visual analysis on proof image for {issue_type}...", complaint_id)
        result = verify_proof_image(image_path, issue_type)
        status = "APPROVED" if result["verified"] else "REJECTED"
        log_agent_event("Verification", f"Visual check {status}: {result['note']}", complaint_id)
        return result


class EscalationAgent:
    """Agent #4: Handles failures, SLA breaches, and reassignments."""
    NAME = "Escalation"

    def run(self, db: Session, complaint: Complaint):
        log_agent_event("Escalation", f"Complaint #{complaint.id} breached SLA or failed verification. Initiating reassignment...", complaint.id, level="warning")

        complaint.escalation_count += 1
        old_staff_id = complaint.assigned_staff_id

        if old_staff_id:
            staff = db.query(Staff).filter(Staff.id == old_staff_id).first()
            if staff and staff.current_load > 0:
                staff.current_load -= 1

        complaint.assigned_staff_id = None
        db.flush()

        new_staff = AssignmentAgent().run(db, complaint)

        if new_staff and new_staff.id != old_staff_id:
            log_agent_event("Escalation", f"Successfully reassigned task to {new_staff.name} ({new_staff.role})", complaint.id)
            sla_mins = _sla_minutes(complaint)
            complaint.assigned_staff_id = new_staff.id
            complaint.assigned_at = datetime.now(timezone.utc)
            complaint.sla_deadline = datetime.now(timezone.utc) + timedelta(minutes=sla_mins)
            complaint.status = "Escalated"
        else:
            log_agent_event("Escalation", "No replacement staff found. Marking as Escalated for manual admin intervention.", complaint.id, level="error")
            complaint.assigned_staff_id = old_staff_id
            complaint.status = "Escalated"

        db.commit()


class MonitoringAgent:
    """Agent #3: Tracks progress autonomously and triggers escalation if delayed."""
    NAME = "Monitoring"

    def run(self, db: Session):
        now = datetime.now(timezone.utc)
        breached = db.query(Complaint).filter(
            Complaint.status.in_(["Assigned", "In Progress"]),
            Complaint.sla_deadline != None,
            Complaint.sla_deadline < now,
        ).all()

        if breached:
            log_agent_event("Monitoring", f"Detected {len(breached)} SLA breaches. Triggering Escalation Agent for each.")
        
        for complaint in breached:
            EscalationAgent().run(db, complaint)


class CoordinatorAgent:
    """Coordinator (Main Brain): Orchestrates all specialized agents in sequence."""
    NAME = "Coordinator"

    def process_new_complaint(self, db: Session, complaint: Complaint) -> Complaint:
        """Sequential Agent Pipeline: Complaint → Assignment → Monitor"""
        log_agent_event("Coordinator", f"New complaint received. Starting autonomous resolution loop.", complaint.id)

        # Step 1: Classify
        intel = ComplaintAgent().run(complaint.description, complaint.location, complaint.id)
        complaint.issue_type = intel["issue_type"]
        complaint.priority = intel["priority"]
        complaint.ai_confidence = intel["ai_confidence"]
        complaint.ai_reasoning = intel.get("ai_reasoning", "No reasoning provided.")
        complaint.sentiment_score = intel.get("sentiment_score", 0.0)
        db.commit()

        # Step 2: Assign staff
        best_staff = AssignmentAgent().run(db, complaint)

        if best_staff:
            sla_mins = _sla_minutes(complaint)
            complaint.assigned_staff_id = best_staff.id
            complaint.assigned_at = datetime.now(timezone.utc)
            complaint.sla_deadline = datetime.now(timezone.utc) + timedelta(minutes=sla_mins)
            complaint.status = "Assigned"
        else:
            complaint.status = "Pending"

        db.commit()
        db.refresh(complaint)
        return complaint

    def process_verification(self, db: Session, complaint: Complaint, proof_path: str) -> Complaint:
        """Sequential Agent Pipeline: Verify → Resolve OR Escalate"""
        log_agent_event("Coordinator", f"Verification requested with proof image. Engaging agents.", complaint.id)

        result = VerificationAgent().run(proof_path, complaint.issue_type or "Unknown", complaint.id)

        complaint.verification_status = "verified" if result["verified"] else "rejected"
        complaint.verification_note = result["note"]

        if result["verified"]:
            log_agent_event("Coordinator", "Verification approved. Awarding points and resolving complaint.", complaint.id)
            complaint.status = "Resolved"
            complaint.resolved_at = datetime.now(timezone.utc)

            # Generate resolution summary
            complaint.resolution_summary = generate_auto_summary(
                complaint.issue_type or "Unknown",
                complaint.location,
                result["note"]
            )

            # Award points to staff
            if complaint.assigned_staff_id:
                staff = db.query(Staff).filter(Staff.id == complaint.assigned_staff_id).first()
                if staff:
                    if staff.current_load > 0:
                        staff.current_load -= 1
                    points_earned = {"Critical": 50, "High": 30, "Medium": 20, "Low": 10}.get(complaint.priority, 20)
                    staff.points += points_earned
        else:
            log_agent_event("Coordinator", f"Verification rejected for #{complaint.id}. Routing to Escalation Agent...", complaint.id, level="warning")
            EscalationAgent().run(db, complaint)

        db.commit()
        db.refresh(complaint)
        return complaint


# ── Helper ────────────────────────────────────────────────────────────────────

def _sla_minutes(complaint: Complaint) -> int:
    """Dynamic SLA based on priority and issue type."""
    if complaint.priority == "Critical":
        return 2
    if complaint.priority == "High":
        return 4
    if complaint.issue_type == "Cleaning" or complaint.priority == "Low":
        return 15
    return 10

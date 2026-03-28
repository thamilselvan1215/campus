"""
services/assignment_service.py — Autonomous staff assignment logic.

Matches complaint issue type to staff role, then selects the most
appropriate available staff member based on:
  1. Role match (exact or compatible)
  2. Building proximity (same building preferred)
  3. Current workload (lower is better)
"""
from sqlalchemy.orm import Session
from datetime import datetime, timezone, timedelta
import os

from models import Staff, Complaint

SLA_MINUTES = int(os.getenv("SLA_MINUTES", "10"))

# Maps issue type → staff roles that can handle it
ROLE_MAP = {
    "Electrical": ["Electrician", "General Maintenance"],
    "Plumbing": ["Plumber", "General Maintenance"],
    "Internet / IT": ["IT Technician", "IT Support"],
    "Cleaning": ["Cleaner", "Housekeeping"],
    "HVAC / AC": ["HVAC Technician", "Electrician", "General Maintenance"],
    "Security": ["Security Officer", "Security Guard"],
    "Structural": ["Civil Technician", "General Maintenance"],
    "Pest Control": ["Pest Control Officer", "General Maintenance"],
}


def assign_staff(db: Session, complaint: Complaint) -> Staff | None:
    """
    Find and assign the best available staff member for a complaint.
    Returns the assigned Staff object, or None if nobody is available.
    """
    issue_type = complaint.issue_type or "Structural"
    eligible_roles = ROLE_MAP.get(issue_type, ["General Maintenance"])

    # Query all available staff matching eligible roles
    candidates = db.query(Staff).filter(
        Staff.is_available == True,
        Staff.role.in_(eligible_roles)
    ).all()

    if not candidates:
        # Fall back to any available staff
        candidates = db.query(Staff).filter(Staff.is_available == True).all()

    if not candidates:
        return None

    # Score: prefer same building (bonus -5 to load), then lowest load
    def score(staff: Staff) -> int:
        load = staff.current_load
        if staff.building.lower() == complaint.location.lower():
            load -= 5  # proximity bonus
        return load

    best = min(candidates, key=score)

    # Update staff load
    best.current_load += 1
    db.commit()

    return best


def set_sla_deadline(complaint: Complaint, db: Session):
    """Set the SLA deadline from the moment of assignment."""
    complaint.sla_deadline = datetime.now(timezone.utc) + timedelta(minutes=SLA_MINUTES)
    db.commit()

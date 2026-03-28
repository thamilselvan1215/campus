"""
routers/staff.py — Staff management endpoints.
"""
from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models import Staff, Complaint
from schemas import StaffOut

router = APIRouter(prefix="/staff", tags=["Staff"])


@router.get("/", response_model=List[StaffOut])
def list_staff(db: Session = Depends(get_db)):
    """Return all staff members."""
    return db.query(Staff).all()


@router.get("/{staff_id}/tasks")
def get_staff_tasks(staff_id: int, db: Session = Depends(get_db)):
    """Return all complaints assigned to a specific staff member."""
    tasks = db.query(Complaint).filter(
        Complaint.assigned_staff_id == staff_id,
        Complaint.status.in_(["Assigned", "In Progress", "Escalated"])
    ).order_by(Complaint.id.desc()).all()
    return tasks

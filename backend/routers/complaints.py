"""
routers/complaints.py — Complaint submission, retrieval, status update, verification,
escalation, simulation, rejection, and complaint status start time tracking.
"""
import os
import shutil
import random
from datetime import datetime, timezone
from typing import List

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session

from database import get_db
from models import Complaint, Staff
from schemas import ComplaintCreate, ComplaintOut, StatusUpdate, RejectionCreate
from agents import CoordinatorAgent

router = APIRouter(prefix="/complaints", tags=["Complaints"])

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/", response_model=ComplaintOut)
def submit_complaint(
    description: str = Form(...),
    location: str = Form(...),
    is_anonymous: bool = Form(False),
    image: UploadFile = File(None),
    db: Session = Depends(get_db)
):
    """
    Submit a new complaint.
    Automatically triggers AI classification and staff assignment.
    """
    image_path = None
    if image and image.filename:
        image_path = f"{UPLOAD_DIR}/{datetime.now(timezone.utc).timestamp()}_{image.filename}"
        with open(image_path, "wb") as f:
            shutil.copyfileobj(image.file, f)

    complaint = Complaint(
        description=description,
        location=location,
        image_path=image_path,
        is_anonymous=is_anonymous,
    )
    db.add(complaint)
    db.flush()

    coordinator = CoordinatorAgent()
    complaint = coordinator.process_new_complaint(db, complaint)
    return complaint


@router.post("/simulate")
def simulate_complaints(count: int = 10, db: Session = Depends(get_db)):
    """
    Hackathon Demo: Generate `count` random complaints through the AI coordinator.
    """
    LOCATIONS = ['Engineering Block', 'Science Block', 'Admin Block', 'Library',
                 'Residence A', 'Cafeteria', 'Main Gate', 'Sports Complex']
    ISSUES = [
        "The AC in the server room is leaking water and the temperature is rising dangerously.",
        "There is a huge hole in the drywall near the cafeteria entrance. Emergency!",
        "Wi-Fi is completely down in the Library. Students are complaining loudly.",
        "A stray dog is roaming near the Main Gate. Security needed urgently.",
        "Flickering lights in the Engineering Block hallway — very dangerous.",
        "Main toilet in Science Block is overflowing and flooding the floor.",
        "Rat spotted near the Residence A kitchen. This is unacceptable!",
        "Someone spilled coffee in the Admin Block lobby — very slippery.",
        "The power socket in Lab 3B sparked and is melting. Short circuit risk!",
        "The internet cable in the library conference room is completely cut.",
        "Bad smell from drains in the cafeteria kitchen. Very unpleasant.",
        "Air conditioning in Lecture Hall A is broken — it's unbearably hot!",
    ]

    coordinator = CoordinatorAgent()
    created = []

    for _ in range(count):
        complaint = Complaint(
            description=random.choice(ISSUES),
            location=random.choice(LOCATIONS),
        )
        db.add(complaint)
        db.flush()
        complaint = coordinator.process_new_complaint(db, complaint)
        created.append(complaint.id)

    return {"message": f"Successfully simulated {count} complaints", "ids": created}


@router.get("/", response_model=List[ComplaintOut])
def list_complaints(db: Session = Depends(get_db)):
    """Return all complaints ordered by newest first."""
    return db.query(Complaint).order_by(Complaint.id.desc()).all()


@router.get("/{complaint_id}", response_model=ComplaintOut)
def get_complaint(complaint_id: int, db: Session = Depends(get_db)):
    """Return a single complaint by ID."""
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    return complaint


@router.patch("/{complaint_id}/status", response_model=ComplaintOut)
def update_status(complaint_id: int, body: StatusUpdate, db: Session = Depends(get_db)):
    """
    Staff updates complaint status.
    When status becomes 'In Progress', record work_started_at timestamp.
    """
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    allowed = {"Assigned", "In Progress", "Escalated"}
    if complaint.status not in allowed:
        raise HTTPException(status_code=400, detail=f"Cannot update status from '{complaint.status}'")

    complaint.status = body.status
    if body.status == "In Progress" and not complaint.work_started_at:
        complaint.work_started_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(complaint)
    return complaint


@router.post("/{complaint_id}/verify", response_model=ComplaintOut)
def verify_complaint(
    complaint_id: int,
    proof: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Staff uploads proof image. AI verifies the resolution.
    If verified → Resolved + auto-summary + points. If rejected → Reassigned.
    """
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    proof_path = f"{UPLOAD_DIR}/proof_{datetime.now(timezone.utc).timestamp()}_{proof.filename}"
    with open(proof_path, "wb") as f:
        shutil.copyfileobj(proof.file, f)
    complaint.proof_image_path = proof_path

    coordinator = CoordinatorAgent()
    complaint = coordinator.process_verification(db, complaint, proof_path)
    return complaint


@router.post("/{complaint_id}/escalate", response_model=ComplaintOut)
def manually_escalate(complaint_id: int, db: Session = Depends(get_db)):
    """
    Manually trigger escalation for demo purposes (simulates SLA breach).
    """
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    from agents import EscalationAgent
    EscalationAgent().run(db, complaint)
    return complaint


@router.post("/{complaint_id}/reject", response_model=ComplaintOut)
def reject_complaint(complaint_id: int, body: RejectionCreate, db: Session = Depends(get_db)):
    """
    Staff rejects a complaint with a reason.
    Frees the staff member and re-queues the complaint as Pending.
    """
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    if complaint.status not in {"Assigned", "In Progress", "Escalated"}:
        raise HTTPException(status_code=400, detail="Complaint cannot be rejected in its current state.")

    # Free staff load
    if complaint.assigned_staff_id:
        staff = db.query(Staff).filter(Staff.id == complaint.assigned_staff_id).first()
        if staff and staff.current_load > 0:
            staff.current_load -= 1

    complaint.status = "Pending"
    complaint.rejection_reason = body.reason
    complaint.assigned_staff_id = None
    complaint.assigned_at = None
    db.commit()
    db.refresh(complaint)
    return complaint

"""
routers/ratings.py — Student complaint ratings (1-5 stars).
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import Complaint
from schemas import RatingCreate, ComplaintOut

router = APIRouter(prefix="/complaints", tags=["Ratings"])


@router.post("/{complaint_id}/rate", response_model=ComplaintOut)
def rate_complaint(complaint_id: int, body: RatingCreate, db: Session = Depends(get_db)):
    """
    Student submits a star rating (1-5) for a resolved complaint.
    """
    if not (1 <= body.rating <= 5):
        raise HTTPException(status_code=400, detail="Rating must be between 1 and 5.")
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found.")
    if complaint.status != "Resolved":
        raise HTTPException(status_code=400, detail="Can only rate resolved complaints.")
    complaint.student_rating = body.rating
    db.commit()
    db.refresh(complaint)
    return complaint

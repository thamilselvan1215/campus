"""
services/escalation_service.py — SLA monitoring and auto-escalation.

Runs as a background scheduler job every minute.
Complaints that exceed their SLA deadline without resolution are automatically escalated.
"""
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from database import SessionLocal
from models import Complaint, Staff


def check_and_escalate():
    """
    Scheduler job: scan all active complaints for SLA breaches and escalate.
    Called every 60 seconds by APScheduler.
    """
    db: Session = SessionLocal()
    try:
        now = datetime.now(timezone.utc)

        # Find complaints that are assigned/in-progress but past their SLA
        breached = db.query(Complaint).filter(
            Complaint.status.in_(["Assigned", "In Progress"]),
            Complaint.sla_deadline != None,
            Complaint.sla_deadline < now,
        ).all()

        for complaint in breached:
            print(f"[ESCALATION] Complaint #{complaint.id} breached SLA. Escalating...")
            complaint.escalation_count += 1

            # Free up the previously assigned staff
            if complaint.assigned_staff_id:
                staff = db.query(Staff).filter(Staff.id == complaint.assigned_staff_id).first()
                if staff and staff.current_load > 0:
                    staff.current_load -= 1

            # Try to reassign to a different available staff
            from services.assignment_service import assign_staff, set_sla_deadline

            # Temporarily detach to allow reassignment
            old_staff_id = complaint.assigned_staff_id
            complaint.assigned_staff_id = None
            db.flush()

            new_staff = assign_staff(db, complaint)
            if new_staff and new_staff.id != old_staff_id:
                complaint.assigned_staff_id = new_staff.id
                complaint.assigned_at = now
                set_sla_deadline(complaint, db)
                complaint.status = "Escalated"
                print(f"[ESCALATION] Reassigned to {new_staff.name}")
            else:
                # No one available — mark escalated and notify admin
                complaint.status = "Escalated"
                complaint.assigned_staff_id = old_staff_id
                print(f"[ESCALATION] No replacement found. Marked Escalated for admin review.")

        db.commit()
    except Exception as e:
        print(f"[ESCALATION ERROR] {e}")
        db.rollback()
    finally:
        db.close()

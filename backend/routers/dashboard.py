"""
routers/dashboard.py — Admin dashboard statistics, heatmap, categories, SLA breaches, leaderboard.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models import Complaint, Staff
from schemas import DashboardStats

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/stats", response_model=DashboardStats)
def get_stats(db: Session = Depends(get_db)):
    """Aggregate statistics for the admin dashboard."""
    all_complaints = db.query(Complaint).all()
    total = len(all_complaints)

    status_counts = {"pending": 0, "assigned": 0, "in_progress": 0, "resolved": 0, "escalated": 0, "pending_review": 0}
    resolution_times = []

    for c in all_complaints:
        s = c.status.lower().replace(" ", "_")
        if s in status_counts:
            status_counts[s] += 1
        if c.resolved_at and c.assigned_at:
            delta = (c.resolved_at - c.assigned_at).total_seconds() / 60
            resolution_times.append(delta)

    avg_resolution = round(sum(resolution_times) / len(resolution_times), 1) if resolution_times else None

    all_staff = db.query(Staff).all()
    staff_perf = []
    for staff in all_staff:
        resolved = db.query(Complaint).filter(
            Complaint.assigned_staff_id == staff.id,
            Complaint.status == "Resolved"
        ).count()
        total_assigned = db.query(Complaint).filter(
            Complaint.assigned_staff_id == staff.id
        ).count()

        # Avg resolution time for this staff
        resolved_complaints = db.query(Complaint).filter(
            Complaint.assigned_staff_id == staff.id,
            Complaint.status == "Resolved",
            Complaint.resolved_at != None,
            Complaint.assigned_at != None,
        ).all()
        staff_rtimes = [(c.resolved_at - c.assigned_at).total_seconds() / 60 for c in resolved_complaints]
        avg_rt = round(sum(staff_rtimes) / len(staff_rtimes), 1) if staff_rtimes else None

        avg_rating_complaints = [c for c in db.query(Complaint).filter(
            Complaint.assigned_staff_id == staff.id,
            Complaint.student_rating != None
        ).all()]
        avg_rating = round(sum(c.student_rating for c in avg_rating_complaints) / len(avg_rating_complaints), 1) if avg_rating_complaints else None

        staff_perf.append({
            "id": staff.id,
            "name": staff.name,
            "role": staff.role,
            "building": staff.building,
            "resolved": resolved,
            "total_assigned": total_assigned,
            "current_load": staff.current_load,
            "is_available": staff.is_available,
            "points": staff.points,
            "avg_resolution_minutes": avg_rt,
            "avg_rating": avg_rating,
        })

    return DashboardStats(
        total=total,
        pending=status_counts["pending"],
        pending_review=status_counts["pending_review"],
        assigned=status_counts["assigned"],
        in_progress=status_counts["in_progress"],
        resolved=status_counts["resolved"],
        escalated=status_counts["escalated"],
        avg_resolution_minutes=avg_resolution,
        staff_performance=staff_perf,
    )


@router.get("/heatmap")
def get_heatmap(db: Session = Depends(get_db)):
    """Returns complaint counts per campus location for the heatmap."""
    all_complaints = db.query(Complaint).all()
    heatmap = {}
    for c in all_complaints:
        heatmap[c.location] = heatmap.get(c.location, 0) + 1
    return [{"location": loc, "count": count} for loc, count in sorted(heatmap.items(), key=lambda x: -x[1])]


@router.get("/categories")
def get_categories(db: Session = Depends(get_db)):
    """Returns complaint counts per issue type for the pie/bar chart."""
    all_complaints = db.query(Complaint).all()
    cats = {}
    for c in all_complaints:
        key = c.issue_type or "Unknown"
        cats[key] = cats.get(key, 0) + 1
    return [{"category": k, "count": v} for k, v in sorted(cats.items(), key=lambda x: -x[1])]


@router.get("/sla_breaches")
def get_sla_breaches(db: Session = Depends(get_db)):
    """Returns all complaints that were escalated (historical SLA breach log)."""
    breached = db.query(Complaint).filter(Complaint.escalation_count > 0).order_by(Complaint.id.desc()).all()
    return [
        {
            "id": c.id,
            "issue_type": c.issue_type,
            "location": c.location,
            "priority": c.priority,
            "escalation_count": c.escalation_count,
            "status": c.status,
            "submitted_at": c.submitted_at.isoformat() if c.submitted_at else None,
            "sla_deadline": c.sla_deadline.isoformat() if c.sla_deadline else None,
        }
        for c in breached
    ]


@router.get("/leaderboard")
def get_leaderboard(db: Session = Depends(get_db)):
    """Returns staff ranked by gamification points."""
    all_staff = db.query(Staff).order_by(Staff.points.desc()).all()
    return [
        {
            "rank": i + 1,
            "id": s.id,
            "name": s.name,
            "role": s.role,
            "building": s.building,
            "points": s.points,
            "current_load": s.current_load,
            "is_available": s.is_available,
        }
        for i, s in enumerate(all_staff)
    ]


@router.get("/summary")
def get_ai_summary(db: Session = Depends(get_db)):
    """Generates an AI executive summary report of campus maintenance activity."""
    from collections import Counter
    from datetime import datetime, timezone, timedelta

    all_complaints = db.query(Complaint).all()
    total = len(all_complaints)
    if total == 0:
        return {"summary": "No complaints have been submitted yet. The campus is all clear! ✅", "stats": {}}

    # Compute stats
    recent = [c for c in all_complaints if c.submitted_at and c.submitted_at > datetime.now(timezone.utc) - timedelta(days=7)]
    resolved = [c for c in all_complaints if c.status == "Resolved"]
    escalated = [c for c in all_complaints if c.escalation_count > 0]
    critical = [c for c in all_complaints if c.priority == "Critical"]

    issue_counts = Counter(c.issue_type for c in all_complaints if c.issue_type)
    location_counts = Counter(c.location for c in all_complaints if c.location)
    top_issue = issue_counts.most_common(1)[0] if issue_counts else ("N/A", 0)
    top_location = location_counts.most_common(1)[0] if location_counts else ("N/A", 0)

    # Top staff by points
    all_staff = db.query(Staff).order_by(Staff.points.desc()).limit(3).all()
    top_staff_str = ", ".join(f"{s.name} ({s.points}pts)" for s in all_staff) if all_staff else "N/A"

    # Resolution rate
    res_rate = round((len(resolved) / total) * 100) if total > 0 else 0

    # Avg resolution time
    rtimes = [(c.resolved_at - c.assigned_at).total_seconds() / 60
              for c in resolved if c.resolved_at and c.assigned_at]
    avg_rt = round(sum(rtimes) / len(rtimes), 1) if rtimes else None

    # Build AI summary
    summary_lines = [
        f"📊 **AutoFix Campus — AI Executive Summary**",
        f"",
        f"**Period**: All-time ({total} total complaints, {len(recent)} in the last 7 days)",
        f"",
        f"**📋 Overview**",
        f"- Resolution Rate: **{res_rate}%** ({len(resolved)} resolved out of {total})",
        f"- Average Resolution Time: **{avg_rt} minutes**" if avg_rt else "- Average Resolution Time: Not enough data yet",
        f"- Escalated Complaints: **{len(escalated)}** ({round(len(escalated)/total*100)}% escalation rate)",
        f"- Critical Issues: **{len(critical)}** flagged",
        f"",
        f"**🏆 Top Performers**",
        f"- {top_staff_str}",
        f"",
        f"**📍 Hotspots**",
        f"- Most problematic location: **{top_location[0]}** ({top_location[1]} complaints)",
        f"- Most common issue type: **{top_issue[0]}** ({top_issue[1]} cases)",
        f"",
        f"**💡 AI Recommendations**",
    ]

    # Smart recommendations
    if top_issue[0] == "Electrical" and top_issue[1] > 3:
        summary_lines.append(f"- ⚡ High electrical complaints detected. Consider scheduling a full wiring audit of {top_location[0]}.")
    if top_issue[0] == "Plumbing" and top_issue[1] > 3:
        summary_lines.append(f"- 🔧 Plumbing issues are recurring. Recommend inspection of main water lines at {top_location[0]}.")
    if len(escalated) > total * 0.2:
        summary_lines.append(f"- 🚨 High escalation rate ({round(len(escalated)/total*100)}%). Consider increasing staff capacity or SLA windows.")
    if res_rate < 60:
        summary_lines.append(f"- ⚠️ Resolution rate is below 60%. Review current staff assignments and complaint backlog.")
    if res_rate >= 80:
        summary_lines.append(f"- ✅ Excellent resolution rate of {res_rate}%. Maintenance operations are performing well.")
    if not summary_lines[-1].startswith("-"):
        summary_lines.append(f"- ✅ System is operating within normal parameters. Continue monitoring SLA deadlines.")

    stats = {
        "total": total,
        "recent_7d": len(recent),
        "resolved": len(resolved),
        "resolution_rate_pct": res_rate,
        "escalated": len(escalated),
        "critical": len(critical),
        "avg_resolution_minutes": avg_rt,
        "top_issue": top_issue[0],
        "top_location": top_location[0],
        "top_staff": [{"name": s.name, "points": s.points} for s in all_staff],
    }

    return {"summary": "\n".join(summary_lines), "stats": stats}


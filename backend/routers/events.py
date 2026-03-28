"""
routers/events.py — Daily Notice Board and Event Organizer API
"""
from fastapi import APIRouter
from services.event_service import generate_daily_poster
import datetime

router = APIRouter(prefix="/events", tags=["Events"])

# Basic caching to prevent rate-limiting/overspending OpenAI credits during demo
cached_poster = None
last_generated_date = None

@router.get("/today")
def get_today_event():
    """
    Returns today's AI-generated poster and event details.
    Cached daily.
    """
    global cached_poster, last_generated_date
    today_str = datetime.datetime.now().strftime("%Y-%m-%d")
    
    if cached_poster and last_generated_date == today_str:
        return cached_poster
        
    cached_poster = generate_daily_poster()
    last_generated_date = today_str
    
    return cached_poster

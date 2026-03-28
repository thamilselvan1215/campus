"""
routers/logs.py — Server-Sent Events (SSE) stream for the live agent decision log.
"""
import json
import asyncio
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from agents import get_agent_log

router = APIRouter(prefix="/logs", tags=["Logs"])

_last_sent_index = {}  # simple in-process tracker per connection is not needed for SSE


async def _event_generator():
    """Yields new log entries as SSE events every second."""
    sent_count = 0
    while True:
        log = get_agent_log()
        new_entries = log[sent_count:]
        for entry in new_entries:
            yield f"data: {json.dumps(entry)}\n\n"
            sent_count += 1
        await asyncio.sleep(1)


@router.get("/stream")
async def stream_logs():
    """
    SSE endpoint — streams live agent log entries to the frontend.
    Connect with EventSource('/logs/stream') in the browser.
    """
    return StreamingResponse(
        _event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        }
    )


@router.get("/all")
def get_all_logs():
    """Return all buffered log entries as JSON (for initial page load)."""
    return get_agent_log()

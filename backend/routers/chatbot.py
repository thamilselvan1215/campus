"""
routers/chatbot.py — AutoFix AI Buddy: Conversational complaint assistant.
A stateless chatbot that guides the student through filing a complaint.
"""
import random
from fastapi import APIRouter
from pydantic import BaseModel
from services.ai_service import classify_complaint, analyze_sentiment

LOCATIONS = [
    'Engineering Block', 'Science Block', 'Admin Block', 'Library',
    'Residence A', 'Residence B', 'Cafeteria', 'Sports Complex',
    'Main Gate', 'Lecture Hall A',
]

router = APIRouter(prefix="/chatbot", tags=["Chatbot"])


class ChatMessage(BaseModel):
    message: str
    state: dict = {}  # tracks conversation state: {step, description, location}


class ChatResponse(BaseModel):
    reply: str
    state: dict
    ready: bool = False   # True when enough info collected to auto-fill the form
    prefill: dict = {}    # {description, location} to prefill the form


GREETINGS = ["hi", "hello", "hey", "helo", "sup", "start", "help", "hai"]
LOCATION_HINTS = {loc.lower(): loc for loc in LOCATIONS}


def _find_location(text: str):
    """Try to find a campus location in the message."""
    tl = text.lower()
    for key, val in LOCATION_HINTS.items():
        if key in tl:
            return val
    return None


def _bot_reply(msg: str) -> str:
    return msg


@router.post("/message", response_model=ChatResponse)
def chat(body: ChatMessage):
    msg = body.message.strip()
    state = dict(body.state)
    step = state.get("step", "hello")

    msg_lower = msg.lower()

    # ─── STEP: Hello / Initial Greeting ───────────────────────────────────────
    if step == "hello" or any(g in msg_lower for g in GREETINGS):
        state["step"] = "describe"
        return ChatResponse(
            reply="👋 Hi! I'm **AutoFix AI Buddy** — your smart maintenance assistant!\n\n"
                  "Tell me what's wrong on campus. For example: *\"The lights in the library are flickering\"*",
            state=state
        )

    # ─── STEP: Capture description ────────────────────────────────────────────
    if step == "describe":
        if len(msg) < 10:
            return ChatResponse(
                reply="🤔 Can you describe the problem in a bit more detail? The more you tell me, the better I can help!",
                state=state
            )

        state["description"] = msg
        state["step"] = "location"

        # Try to detect location from description
        detected_loc = _find_location(msg)
        if detected_loc:
            state["location"] = detected_loc
            state["step"] = "confirm"
            classification = classify_complaint(msg, detected_loc)
            state["issue_type"] = classification.get("issue_type", "General")
            state["priority"] = classification.get("priority", "Medium")
            sentiment = classification.get("sentiment_score", 0)
            urgency_note = " 🚨 I can sense urgency in your message — I'll flag this as **high priority**!" if sentiment > 0.4 else ""
            return ChatResponse(
                reply=f"Got it! 🔍 I detected **{classification['issue_type']}** issue at **{detected_loc}**. Priority: **{classification['priority']}**.{urgency_note}\n\n"
                      f"Should I submit this complaint for you? Just say **yes** or **no**.",
                state=state,
            )

        return ChatResponse(
            reply=f"📍 Got it! Now, **where** on campus is this problem?\n\n"
                  f"Options: {', '.join(LOCATIONS[:5])}... (or just type the location name)",
            state=state
        )

    # ─── STEP: Capture location ────────────────────────────────────────────────
    if step == "location":
        detected_loc = _find_location(msg)
        if not detected_loc:
            return ChatResponse(
                reply=f"🤔 I couldn't find that location. Please choose one of: **{', '.join(LOCATIONS)}**",
                state=state
            )

        state["location"] = detected_loc
        state["step"] = "confirm"
        desc = state.get("description", "")
        classification = classify_complaint(desc, detected_loc)
        state["issue_type"] = classification.get("issue_type", "General")
        state["priority"] = classification.get("priority", "Medium")
        sentiment = analyze_sentiment(desc)
        urgency_note = " 🚨 High urgency detected — flagging as **Critical**!" if sentiment > 0.5 else ""
        return ChatResponse(
            reply=f"✅ Perfect! Here's what I've got:\n\n"
                  f"• **Issue**: {state['issue_type']}\n"
                  f"• **Location**: {detected_loc}\n"
                  f"• **Priority**: {state['priority']}{urgency_note}\n\n"
                  f"Ready to submit? Say **yes** to auto-fill the form, or **no** to cancel.",
            state=state
        )

    # ─── STEP: Confirm ────────────────────────────────────────────────────────
    if step == "confirm":
        if any(w in msg_lower for w in ["yes", "ok", "sure", "submit", "yep", "go", "confirm", "yeah"]):
            prefill = {
                "description": state.get("description", ""),
                "location": state.get("location", LOCATIONS[0])
            }
            state["step"] = "done"
            return ChatResponse(
                reply=f"🚀 **Complaint auto-filled!** I've pre-loaded your details into the form. Just hit **Submit** to send it to the AI coordinator!\n\n"
                      f"*(You can also edit anything before submitting.)*",
                state=state,
                ready=True,
                prefill=prefill
            )
        else:
            state["step"] = "describe"
            state.pop("description", None)
            state.pop("location", None)
            return ChatResponse(
                reply="No problem! Let's start over. What's the issue you'd like to report?",
                state=state
            )

    # ─── STEP: Done / Follow-up ───────────────────────────────────────────────
    if step == "done":
        state["step"] = "describe"
        return ChatResponse(
            reply="Want to report another issue? Just describe what's wrong and I'll help you file it! 👷",
            state=state
        )

    # ─── Fallback ─────────────────────────────────────────────────────────────
    state["step"] = "describe"
    return ChatResponse(
        reply="🤖 I'm your AutoFix AI Buddy! Describe a campus maintenance problem and I'll help you report it instantly.",
        state=state
    )

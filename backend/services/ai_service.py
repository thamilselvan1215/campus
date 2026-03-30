"""
services/ai_service.py — AI complaint classification, proof verification,
sentiment analysis, auto-summary, and resolution summaries.

Priority: Gemini 1.5 Flash → OpenAI GPT-3.5 → Mock fallback
"""
import os
import re
import json
import random
from dotenv import load_dotenv

load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
USE_MOCK_AI = os.getenv("USE_MOCK_AI", "true").lower() == "true"

# Issue type → keywords for mock classification
ISSUE_KEYWORDS = {
    "Electrical": ["power", "light", "electricity", "socket", "switchboard", "bulb", "fan", "short circuit", "wire", "blackout", "flickering"],
    "Plumbing": ["water", "pipe", "leak", "tap", "toilet", "flush", "drain", "flood", "overflow", "clog", "wet"],
    "Internet / IT": ["wifi", "internet", "network", "connection", "router", "cable", "server", "slow", "disconnected", "down", "laptop"],
    "Cleaning": ["dirty", "clean", "trash", "garbage", "waste", "smell", "odor", "sweep", "mop", "rubbish", "spill", "stain"],
    "HVAC / AC": ["hot", "cold", "air conditioning", "ac", "aircon", "ventilation", "heating", "humid", "temperature", "stuffy"],
    "Security": ["lock", "door", "key", "lost", "break in", "security", "camera", "cctv", "access", "theft", "stranger", "dog"],
    "Structural": ["crack", "wall", "ceiling", "roof", "floor", "broken", "damage", "collapse", "paint", "chip", "hole"],
    "Pest Control": ["pest", "cockroach", "rat", "mouse", "insect", "bug", "ant", "spider", "mosquito", "infestation"],
}

PRIORITY_KEYWORDS = {
    "Critical": ["emergency", "danger", "urgent", "immediately", "fire", "flood", "collapse", "blackout", "no power", "short circuit", "danger"],
    "High": ["broken", "not working", "failed", "serious", "impact", "major", "completely", "very bad"],
    "Low": ["minor", "small", "little", "slight", "cosmetic", "minor", "tiny"],
}

URGENCY_KEYWORDS = ["urgent", "emergency", "immediately", "help", "can't work", "impossible", "terrible", "horrible", "awful", "so bad", "fix it now", "unacceptable", "frustrated", "annoyed", "angry"]


# ─── Public API ───────────────────────────────────────────────────────────────

def classify_complaint(description: str, location: str) -> dict:
    """
    Classify a complaint. Returns: {issue_type, priority, ai_confidence, extracted_location, ai_reasoning, sentiment_score}
    Strategy: PII Redaction -> Gemini → OpenAI → Mock
    """
    # Simple PII Redaction
    safe_desc = re.sub(r'[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,7}', '[REDACTED EMAIL]', description)
    safe_desc = re.sub(r'\b\d{10}\b', '[REDACTED PHONE]', safe_desc)

    if not USE_MOCK_AI and GEMINI_API_KEY:
        result = _classify_with_gemini(safe_desc, location)
        if result:
            return result
    if not USE_MOCK_AI and OPENAI_API_KEY:
        result = _classify_with_openai(safe_desc, location)
        if result:
            return result
    return _classify_with_mock(safe_desc, location)


def verify_proof_image(image_path: str, issue_type: str) -> dict:
    """
    Verify a staff-uploaded proof image.
    Mock logic: accepts ~85% of images, generates rich issue-specific notes.
    """
    accepted = random.random() < 0.85
    issue_notes = {
        "Electrical": ("All sockets and switches appear functional. No exposed wiring detected.", "Image is too dark or blurry to confirm electrical repairs."),
        "Plumbing": ("Area is dry and clean. Pipes and fixtures look intact and sealed.", "Cannot confirm plumbing fix — water marks or moisture still visible."),
        "Internet / IT": ("Equipment appears powered on and properly connected. Cables are tidy.", "Cannot verify IT fix — equipment status unclear in the image."),
        "Cleaning": ("Area looks clean and free of debris. Good job.", "Area does not appear fully clean. Please re-clean and re-upload."),
        "HVAC / AC": ("AC/ventilation unit appears to be operational based on visible indicators.", "Cannot confirm HVAC repair from this image angle."),
        "Security": ("Lock/door mechanism appears intact and secure.", "Security concern not clearly resolved in the image."),
        "Structural": ("Damage appears to have been repaired or patched. Structural integrity restored.", "Repair is incomplete or damage still visible."),
        "Pest Control": ("Area appears treated and clean. No visible pest activity.", "Evidence of pests may still be present. Ensure full treatment was applied."),
    }
    ok_msg, fail_msg = issue_notes.get(issue_type, ("Issue appears resolved based on submitted image.", "Image does not sufficiently demonstrate resolution."))
    return {
        "verified": accepted,
        "note": f"✅ {ok_msg}" if accepted else f"❌ {fail_msg}",
    }


def analyze_sentiment(description: str) -> float:
    """
    Returns a sentiment urgency score from 0.0 (calm) to 1.0 (very urgent/frustrated).
    Simple keyword-based mock.
    """
    desc_lower = description.lower()
    hits = sum(1 for kw in URGENCY_KEYWORDS if kw in desc_lower)
    score = min(hits * 0.18, 1.0)
    # Also boost if ALL CAPS
    caps_ratio = sum(1 for c in description if c.isupper()) / max(len(description), 1)
    score = min(score + caps_ratio * 0.3, 1.0)
    return round(score, 2)


def generate_auto_summary(issue_type: str, location: str, resolution_note: str) -> str:
    """
    Generates a brief AI resolution summary after a complaint is closed.
    """
    templates = [
        f"The {issue_type} issue at {location} has been successfully resolved. {resolution_note} Campus operations have returned to normal.",
        f"Resolution confirmed for the {issue_type} complaint at {location}. {resolution_note} Thank you for your patience.",
        f"AI verification approved the resolution of the {issue_type} problem at {location}. {resolution_note}",
    ]
    return random.choice(templates)


# ─── Private helpers ──────────────────────────────────────────────────────────

def _classify_with_mock(description: str, location: str) -> dict:
    """Keyword-based classification for demo purposes."""
    desc_lower = description.lower()

    scores = {}
    for issue, keywords in ISSUE_KEYWORDS.items():
        score = sum(1 for kw in keywords if kw in desc_lower)
        if score > 0:
            scores[issue] = score

    if scores:
        issue_type = max(scores, key=scores.get)
        confidence = min(0.65 + scores[issue_type] * 0.1 + random.uniform(0, 0.1), 0.99)
    else:
        issue_type = random.choice(list(ISSUE_KEYWORDS.keys()))
        confidence = round(random.uniform(0.45, 0.60), 2)

    priority = "Medium"
    for p, keywords in PRIORITY_KEYWORDS.items():
        if any(kw in desc_lower for kw in keywords):
            priority = p
            break

    sentiment = analyze_sentiment(description)

    reasoning = (
        f"Detected '{issue_type}' indicators in the complaint description. "
        f"Priority set to '{priority}' based on urgency signals. "
        f"Sentiment urgency score: {int(sentiment * 100)}%."
    )

    return {
        "issue_type": issue_type,
        "priority": priority,
        "ai_confidence": round(confidence, 2),
        "extracted_location": location,
        "ai_reasoning": reasoning,
        "sentiment_score": sentiment,
    }


def _classify_with_gemini(description: str, location: str) -> dict | None:
    """Gemini 1.5 Flash based classification."""
    try:
        import google.generativeai as genai
        genai.configure(api_key=GEMINI_API_KEY)
        model = genai.GenerativeModel("gemini-1.5-flash")

        prompt = f"""You are a campus maintenance AI. Analyze the complaint and return ONLY a valid JSON object with these fields:
- issue_type: one of [Electrical, Plumbing, Internet / IT, Cleaning, HVAC / AC, Security, Structural, Pest Control]
- priority: one of [Low, Medium, High, Critical]
- ai_confidence: float between 0 and 1
- ai_reasoning: brief 1-2 sentence explanation
- sentiment_score: float 0.0 (calm) to 1.0 (very frustrated/urgent)

Complaint: "{description}"
Location: "{location}"

Return ONLY valid JSON, no markdown, no explanation."""

        response = model.generate_content(
            prompt,
            generation_config={"response_mime_type": "application/json"}
        )
        raw = response.text.strip()
        result = json.loads(raw)
        result["extracted_location"] = location
        return result
    except Exception as e:
        print(f"[AI] Gemini failed, trying next: {e}")
        return None


def _classify_with_openai(description: str, location: str) -> dict | None:
    """OpenAI GPT-based classification."""
    try:
        from openai import OpenAI
        client = OpenAI(api_key=OPENAI_API_KEY)

        prompt = f"""You are a campus maintenance classifier. Analyze the complaint below and return a JSON object:
- issue_type: one of [Electrical, Plumbing, Internet / IT, Cleaning, HVAC / AC, Security, Structural, Pest Control]
- priority: one of [Low, Medium, High, Critical]
- ai_confidence: float between 0 and 1
- ai_reasoning: brief explanation (1-2 sentences)
- sentiment_score: float 0.0 (calm) to 1.0 (very frustrated/urgent)

Complaint: "{description}"
Location: "{location}"

Return ONLY valid JSON, no explanation."""

        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            response_format={ "type": "json_object" },
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2,
        )
        raw = response.choices[0].message.content.strip()
        result = json.loads(raw)
        result["extracted_location"] = location
        return result
    except Exception as e:
        print(f"[AI] OpenAI failed, falling back to mock: {e}")
        return None

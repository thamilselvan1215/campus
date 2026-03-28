"""
services/event_service.py — AI Event Organizer
Checks the current date, identifies the event, and uses OpenAI to generate a poster and tagline.
"""
from datetime import datetime
import os
import json
import random

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
USE_MOCK_AI = os.getenv("USE_MOCK_AI", "true").lower() == "true"

MOCK_POSTERS = [
    "https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
]

def generate_daily_poster() -> dict:
    today = datetime.now()
    month_day = today.strftime("%m-%d")

    events = {
        "01-26": "Republic Day",
        "02-28": "National Science Day",
        "08-15": "Independence Day",
        "11-14": "Children's Day",
        "12-25": "Christmas",
        "03-27": "Spring Open Mic & Mixer" # Specific default for the demo
    }

    event_name = events.get(month_day, "Campus Weekly Event")
    
    if USE_MOCK_AI or not OPENAI_API_KEY:
        return {
            "event_name": event_name,
            "poster_title": f"{event_name} 🔥",
            "tagline": "Unwind, Connect, and Celebrate the Weekend!",
            "theme": "Vibrant, Musical, and Relaxed",
            "image_url": random.choice(MOCK_POSTERS)
        }

    # Use Real AI
    try:
        from openai import OpenAI
        client = OpenAI(api_key=OPENAI_API_KEY)
        
        # 1. Generate text concepts
        prompt = f"""
        You are an AI Event Organizer for a college campus. Today's event is '{event_name}'.
        Generate a catchy JSON payload with the following fields:
        - event_name
        - poster_title (catchy and bold)
        - tagline (1 short creative line)
        - theme (festive / cultural / educational based on event)
        - design_description (A highly detailed DALL-E image prompt for a poster. MUST use a vibrant magenta/pink background with neon fireworks, a large dark tilted diamond/square shape in the center, and a bright 3D yellow ribbon crossing it. DO NOT include heavy text on the image, pure aesthetic. Target for campus events.)
        Return ONLY valid JSON.
        """
        
        res = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7
        )
        
        raw_content = res.choices[0].message.content.strip()
        import re
        raw_content = re.sub(r"```json|```", "", raw_content).strip()
        data = json.loads(raw_content)
        description = data.get("design_description", f"A stunning aesthetic poster representing {event_name} without any text.")

        # 2. Generate Image with DALL-E 3
        img_res = client.images.generate(
            model="dall-e-3",
            prompt=description,
            size="1024x1024",
            quality="standard",
            n=1,
        )
        
        data["image_url"] = img_res.data[0].url
        return data

    except Exception as e:
        print(f"[AI] Event Organizer failed: {e}")
        return {
            "event_name": event_name,
            "poster_title": f"{event_name}",
            "tagline": "Join the celebration!",
            "theme": "Campus Festival",
            "image_url": random.choice(MOCK_POSTERS)
        }

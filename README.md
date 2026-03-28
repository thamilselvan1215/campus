# 🤖 AutoFix Campus

**Autonomous AI-powered campus complaint resolution system.**

> Complaint intake → AI classification → Auto-assignment → SLA monitoring → Escalation → AI verification → Resolution

---

## 📁 Project Structure

```
autofix-campus/
├── backend/
│   ├── main.py                    # FastAPI entry point
│   ├── database.py                # SQLite setup
│   ├── models.py                  # ORM models
│   ├── schemas.py                 # Pydantic schemas
│   ├── seed.py                    # Dummy staff data (15 members)
│   ├── requirements.txt
│   ├── routers/
│   │   ├── complaints.py          # Complaint CRUD + AI pipeline
│   │   ├── staff.py               # Staff endpoints
│   │   └── dashboard.py           # Admin stats
│   └── services/
│       ├── ai_service.py          # OpenAI + mock classification
│       ├── assignment_service.py  # Auto-assignment logic
│       └── escalation_service.py  # SLA monitoring + escalation
└── frontend/
    └── src/
        ├── App.jsx                # Nav + routing
        ├── api/index.js           # Axios API client
        ├── pages/
        │   ├── StudentPanel.jsx   # Complaint submission + tracker
        │   ├── StaffPanel.jsx     # Staff tasks + verification
        │   └── AdminDashboard.jsx # Admin overview + stats
        └── components/
            ├── StatusBadge.jsx
            └── StatsCard.jsx
```

---

## 🚀 Quick Start

### 1. Backend

```powershell
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

- API runs at: http://localhost:8000
- Swagger docs: http://localhost:8000/docs

### 2. Frontend

```powershell
cd frontend
npm install
npm run dev
```

- App runs at: http://localhost:5173

---

## 🎬 Demo Flow

1. **Submit Complaint** (Student Panel)
   - Type any complaint e.g. "The lights in Lab 3B are flickering"
   - AI will classify it as **Electrical** and assign an electrician automatically

2. **View Assignment** (Staff Panel)
   - Select the assigned staff member
   - Click "Start Work" → status becomes **In Progress**

3. **Simulate Escalation** (Admin Dashboard)
   - Click the 🚨 Escalate button on any complaint
   - Watch it reassign automatically

4. **Verify Completion** (Staff Panel)
   - Upload any image as proof
   - AI verifies it → complaint marked **Resolved**

---

## 🧠 Autonomous Features

| Feature | How it works |
|---|---|
| AI Classification | Keyword-based mock (or real OpenAI GPT-3.5 if key set) |
| Auto-Assignment | Role match + building proximity + lowest workload |
| SLA Monitoring | APScheduler checks every 60s for breaches |
| Auto-Escalation | Reassigns or marks Escalated if SLA breached |
| AI Verification | 85% acceptance rate mock (or Vision API) |

---

## 🔑 Optional: OpenAI Integration

Edit `backend/.env`:
```
OPENAI_API_KEY=sk-your-key-here
USE_MOCK_AI=false
```

---

## 📡 Key API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/complaints/` | Submit complaint (classifies + assigns) |
| GET | `/complaints/` | List all complaints |
| PATCH | `/complaints/{id}/status` | Update status |
| POST | `/complaints/{id}/verify` | Upload proof + AI verify |
| POST | `/complaints/{id}/escalate` | Manual escalate |
| GET | `/staff/` | List all staff |
| GET | `/staff/{id}/tasks` | Staff's active tasks |
| GET | `/dashboard/stats` | Admin aggregated stats |

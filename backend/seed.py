"""
seed.py — Seed the database with dummy staff members.
Run once: python seed.py
"""
from database import SessionLocal, engine
from models import Base, Staff

# Create all tables
Base.metadata.create_all(bind=engine)

STAFF_DATA = [
    {"name": "Thamil",   "role": "Electrician",          "email": "thamilselvan0240@gmail.com",   "phone": "+91-000-000-0001", "building": "Engineering Block"},
    {"name": "Ragul",    "role": "Electrician",          "email": "thamilselvan0240@gmail.com",   "phone": "+91-000-000-0002", "building": "Science Block"},
    {"name": "Indhu",    "role": "Plumber",              "email": "thamilselvan0240@gmail.com",   "phone": "+91-000-000-0003", "building": "Residence A"},
    {"name": "Prianka", "role": "Plumber",              "email": "indhumathikumar15@gmail.com", "phone": "+91-000-000-0004", "building": "Residence B"},
    {"name": "Mohana",   "role": "IT Technician",        "email": "indhumathikumar15@gmail.com", "phone": "+91-000-000-0005", "building": "Admin Block"},
    {"name": "Hari",     "role": "IT Technician",        "email": "indhumathikumar15@gmail.com", "phone": "+91-000-000-0006", "building": "Library"},
    {"name": "Athesh",   "role": "Cleaner",              "email": "raagshiva@gmail.com",         "phone": "+91-000-000-0007", "building": "Engineering Block"},
    {"name": "Pori",     "role": "Cleaner",              "email": "raagshiva@gmail.com",         "phone": "+91-000-000-0008", "building": "Science Block"},
    {"name": "Siva",     "role": "HVAC Technician",      "email": "raagshiva@gmail.com",         "phone": "+91-000-000-0009", "building": "Admin Block"},
    {"name": "Madesh",   "role": "Security Officer",     "email": "adhavankuppusamy@gmail.com",  "phone": "+91-000-000-0010", "building": "Main Gate"},
    {"name": "Mugilan",  "role": "Civil Technician",     "email": "adhavankuppusamy@gmail.com",  "phone": "+91-000-000-0011", "building": "Engineering Block"},
    {"name": "Jeeva",    "role": "General Maintenance",  "email": "adhavankuppusamy@gmail.com",  "phone": "+91-000-000-0012", "building": "Residence A"},
    {"name": "Sabari",   "role": "Pest Control Officer", "email": "spyeditz0240@gmail.com",      "phone": "+91-000-000-0013", "building": "Cafeteria"},
    {"name": "Giri",     "role": "General Maintenance",  "email": "spyeditz0240@gmail.com",      "phone": "+91-000-000-0014", "building": "Sports Complex"},
    {"name": "Niranjan", "role": "IT Support",           "email": "spyeditz0240@gmail.com",      "phone": "+91-000-000-0015", "building": "Library"},
]


def seed():
    db = SessionLocal()
    try:
        existing = db.query(Staff).count()
        if existing > 0:
            print(f"[SEED] {existing} staff already in database. Skipping.")
            return
        for s in STAFF_DATA:
            db.add(Staff(**s))
        db.commit()
        print(f"[SEED] Inserted {len(STAFF_DATA)} staff members.")
    finally:
        db.close()


if __name__ == "__main__":
    seed()

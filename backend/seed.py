"""
seed.py — Seed the database with dummy staff members.
Run once: python seed.py
"""
from database import SessionLocal, engine
from models import Base, Staff

# Create all tables
Base.metadata.create_all(bind=engine)

STAFF_DATA = [
    {"name": "Amara Okafor",    "role": "Electrician",         "phone": "+27-11-000-0001", "building": "Engineering Block"},
    {"name": "Sipho Ndlovu",    "role": "Electrician",         "phone": "+27-11-000-0002", "building": "Science Block"},
    {"name": "Fatima Hassan",   "role": "Plumber",             "phone": "+27-11-000-0003", "building": "Residence A"},
    {"name": "Kagiso Molefe",   "role": "Plumber",             "phone": "+27-11-000-0004", "building": "Residence B"},
    {"name": "Thabo Dlamini",   "role": "IT Technician",       "phone": "+27-11-000-0005", "building": "Admin Block"},
    {"name": "Zanele Khumalo",  "role": "IT Technician",       "phone": "+27-11-000-0006", "building": "Library"},
    {"name": "Bongani Sithole", "role": "Cleaner",             "phone": "+27-11-000-0007", "building": "Engineering Block"},
    {"name": "Nomsa Vilakazi",  "role": "Cleaner",             "phone": "+27-11-000-0008", "building": "Science Block"},
    {"name": "Ravi Patel",      "role": "HVAC Technician",     "phone": "+27-11-000-0009", "building": "Admin Block"},
    {"name": "Leilani Mokoena", "role": "Security Officer",    "phone": "+27-11-000-0010", "building": "Main Gate"},
    {"name": "Aiden Ferreira",  "role": "Civil Technician",   "phone": "+27-11-000-0011", "building": "Engineering Block"},
    {"name": "Precious Nkosi",  "role": "General Maintenance", "phone": "+27-11-000-0012", "building": "Residence A"},
    {"name": "Oluwaseun Adeyemi","role": "Pest Control Officer","phone": "+27-11-000-0013", "building": "Cafeteria"},
    {"name": "Miriam Zwane",    "role": "General Maintenance", "phone": "+27-11-000-0014", "building": "Sports Complex"},
    {"name": "Neo Mahlangu",    "role": "IT Support",          "phone": "+27-11-000-0015", "building": "Library"},
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

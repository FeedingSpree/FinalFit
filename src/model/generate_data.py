import random
import string
from datetime import datetime, timedelta
import firebase_admin
from firebase_admin import credentials, firestore

# Initialize Firebase
cred = credentials.Certificate(r"C:\Users\Jose Mari\Documents\C2\Firebase Private Key\campusfit-8468c-firebase-adminsdk-fbsvc-f90c6530de.json")
firebase_admin.initialize_app(cred)
db = firestore.client()

def generate_violation_id(date_obj):
    date_part = date_obj.strftime("%m%d%y")  # MMDDYY format
    random_part = ''.join(random.choices(string.ascii_uppercase, k=4))
    return f"VIO{date_part}{random_part}"

def generate_violation_data(num_entries=200):
    violations = ["cap", "shorts", "sleeveless"]
    current_year = datetime.now().year
    data = []

    for _ in range(num_entries):
        # Random month and day (safe range)
        random_month = random.randint(1, 12)
        random_day = random.randint(1, 28)
        date_obj = datetime(current_year, random_month, random_day)

        # Random time between 6:00 AM and 8:00 PM
        hour = random.randint(6, 20)
        minute = random.randint(0, 59)
        second = random.randint(0, 59)
        date_obj = date_obj.replace(hour=hour, minute=minute, second=second)

        violation_id = generate_violation_id(date_obj)
        violation = random.choice(violations)
        building_number = random.randint(1, 6)
        floor_number = random.randint(1, 6)
        camera_number = random.randint(1, 6)

        date_str = date_obj.strftime("%Y-%m-%d")
        time_str = date_obj.strftime("%H:%M:%S")

        entry = {
            "violation_id": violation_id,
            "violation": violation,
            "building_number": building_number,
            "floor_number": floor_number,
            "camera_number": camera_number,
            "date": date_str,
            "time": time_str
        }
        data.append(entry)

    return data

def upload_to_firestore(data, collection_name="violationlogs"):
    for entry in data:
        doc_ref = db.collection(collection_name).document(entry["violation_id"])
        doc_ref.set(entry)
    print(f"{len(data)} documents uploaded to Firestore.")

# Generate and upload
data = generate_violation_data(200)
upload_to_firestore(data)

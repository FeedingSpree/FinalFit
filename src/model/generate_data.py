import random
import string
from datetime import datetime, timedelta
import firebase_admin
from firebase_admin import credentials, firestore

# Initialize Firebase
cred = credentials.Certificate(r"C:\Users\Jose Mari\Documents\C2\Firebase Private Key\campusfit-8468c-firebase-adminsdk-fbsvc-f90c6530de.json")
firebase_admin.initialize_app(cred)
db = firestore.client()

def generate_student_data(num_entries=50):
    # Define data pools
    first_names = ["John", "Maria", "James", "Sarah", "Michael", "Emma", "David", "Sofia", "Daniel", "Olivia"]
    last_names = ["Garcia", "Santos", "Cruz", "Reyes", "Torres", "Lopez", "Rivera", "Gomez", "Flores", "Martinez"]
    
    departments = {
        "CBE": [
            "Accountancy",
            "Accounting Information Systems",
            "Financial Management",
            "Human Resource Management",
            "Logistics and Supply Management",
            "Marketing Management"
        ],
        "CCS": [
            "Computer Science",
            "Data Science and Analytics",
            "Information Systems",
            "Information Technology"
        ],
        "CEA": [
            "Architecture",
            "Civil Engineering",
            "Computer Engineering",
            "Electrical Engineering",
            "Electronics Engineering",
            "Environmental and Sanitary Engineering",
            "Industrial Engineering",
            "Mechanical Engineering"
        ],
        "CoA": [
            "BA English",
            "BA Political Science"
        ],
        "CoE": [
            "BSE Major in English",
            "BSE Major in Mathematics",
            "BSE Major in Sciences",
            "Bachelor of Special Needs Education"
        ]
    }
    
    year_levels = ["1st Year", "2nd Year", "3rd Year", "4th Year", "5th Year"]
    violations = ["Cap", "Shorts", "Sleeveless"]
    
    data = []
    current_year = datetime.now().year

    for _ in range(num_entries):
        # Generate random name
        first_name = random.choice(first_names)
        last_name = random.choice(last_names)
        full_name = f"{first_name} {last_name}"
        
        # Select random department and program
        department = random.choice(list(departments.keys()))
        program = random.choice(departments[department])
        
        # Generate random date within April-May 2024
        random_month = random.randint(4, 5)
        random_day = random.randint(1, 28)
        date_obj = datetime(current_year, random_month, random_day)
        date_str = date_obj.strftime("%m-%d-%Y")
        
        entry = {
            "name": full_name,
            "program": program,
            "yearLevel": random.choice(year_levels),
            "violation": random.choice(violations),
            "date": date_str,
            "department": department
        }
        data.append(entry)

    return data

def upload_to_firestore(data, collection_name="studentrecords"):
    batch = db.batch()
    
    for entry in data:
        doc_ref = db.collection(collection_name).document()
        batch.set(doc_ref, entry)
    
    # Commit the batch
    batch.commit()
    print(f"{len(data)} student records uploaded to Firestore.")

if __name__ == "__main__":
    try:
        # Generate and upload data
        student_data = generate_student_data(200)  # Generate 50 records
        upload_to_firestore(student_data)
        print("Data generation and upload completed successfully!")
    except Exception as e:
        print(f"An error occurred: {str(e)}")

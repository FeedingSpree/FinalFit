import firebase_admin
from firebase_admin import credentials, firestore

# Initialize Firebase app
cred = credentials.Certificate(r"C:\Users\Fred\Documents\GitHub\c2-project-020325-main\c2-project-020325-main\src\model\campusfit-557ab-firebase-adminsdk-fbsvc-1eb3edef87.json")
#cred = credentials.Certificate(r"C:\Users\Jose Mari\Documents\C2\Firebase Private Key\c2-collider-firebase-adminsdk-fbsvc-151657dc6e.json")
firebase_admin.initialize_app(cred)


db = firestore.client()

def delete_documents(studentrecords, limit):
    """
    Delete up to `limit` number of documents from the specified Firestore collection.
    """
    collection_ref = db.collection(studentrecords)
    docs = collection_ref.limit(limit).stream()

    deleted = 0
    for doc in docs:
        doc.reference.delete()
        deleted += 1
        print(f"Deleted doc: {doc.id}")

    print(f"Deleted {deleted} documents from '{studentrecords}' collection.")

# Example usage:
delete_documents("studentrecords", 50)  # Delete 50 documents from "studentrecords"

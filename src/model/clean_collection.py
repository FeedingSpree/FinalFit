import firebase_admin
from firebase_admin import credentials, firestore

# Initialize Firebase app
cred = credentials.Certificate(r"C:\Users\Jose Mari\Documents\C2\Firebase Private Key\campusfit-8468c-firebase-adminsdk-fbsvc-f90c6530de.json")
firebase_admin.initialize_app(cred)

db = firestore.client()

def delete_documents(nonviolationlogs, limit):
    """
    Delete up to `limit` number of documents from the specified Firestore collection.
    """
    collection_ref = db.collection(nonviolationlogs)
    docs = collection_ref.limit(limit).stream()

    deleted = 0
    for doc in docs:
        doc.reference.delete()
        deleted += 1
        print(f"Deleted doc: {doc.id}")

    print(f"Deleted {deleted} documents from '{nonviolationlogs}' collection.")

# Example usage:
delete_documents("nonviolationlogs", 324)  # Delete 10 documents from "nonviolationlogs"

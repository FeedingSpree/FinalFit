import firebase_admin
from firebase_admin import credentials, firestore

# Initialize Firebase app
cred = credentials.Certificate(r"C:\Users\Jose Mari\Documents\C2\Firebase Private Key\campusfit-8468c-firebase-adminsdk-fbsvc-f90c6530de.json")
firebase_admin.initialize_app(cred)

db = firestore.client()

#replace "violationlogs" with the collection name you want to delete documents from
def delete_all_documents(violationlogs):
    collection_ref = db.collection(violationlogs)
    docs = collection_ref.stream()

    deleted = 0
    for doc in docs:
        doc.reference.delete()
        deleted += 1
        print(f"Deleted doc: {doc.id}")

    print(f"Deleted {deleted} documents from '{violationlogs}' collection.")

# Example usage:
delete_all_documents("violationlogs")  # Replace with your collection name

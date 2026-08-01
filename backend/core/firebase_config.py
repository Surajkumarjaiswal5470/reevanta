import os
import json
import logging
import firebase_admin
from firebase_admin import credentials, auth

logger = logging.getLogger("reevanta.firebase")

def init_firebase_admin():
    """
    Initialize Firebase Admin SDK for Python backend.
    """
    if firebase_admin._apps:
        return firebase_admin.get_app()

    service_account_path = os.getenv("FIREBASE_SERVICE_ACCOUNT_PATH", "firebase_credentials.json")
    service_account_json = os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON", "")

    try:
        if os.path.exists(service_account_path):
            cred = credentials.Certificate(service_account_path)
            app = firebase_admin.initialize_app(cred)
            logger.info("Firebase Admin SDK initialized from JSON file.")
            return app
        elif service_account_json:
            cred_dict = json.loads(service_account_json)
            cred = credentials.Certificate(cred_dict)
            app = firebase_admin.initialize_app(cred)
            logger.info("Firebase Admin SDK initialized from env JSON.")
            return app
        else:
            logger.warning("Firebase credentials file or env JSON not found. Skipping Admin SDK initialization.")
            return None
    except Exception as e:
        logger.error(f"Failed to initialize Firebase Admin SDK: {e}")
        return None

def verify_firebase_id_token(id_token: str):
    """
    Verify Firebase ID Token sent from frontend.
    Returns decoded token dictionary or None.
    """
    try:
        init_firebase_admin()
        decoded_token = auth.verify_id_token(id_token)
        return decoded_token
    except Exception as e:
        logger.error(f"Invalid Firebase ID Token: {e}")
        return None

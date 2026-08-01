import os
import json
import logging
# ``firebase_admin`` is optional for local testing. If it is not installed we
# provide a lightweight stub so that the rest of the code can be imported
# without raising ``ModuleNotFoundError``.
try:
    import firebase_admin
    from firebase_admin import credentials, auth
except ImportError:  # pragma: no cover
    firebase_admin = None
    credentials = None
    auth = None

logger = logging.getLogger("reevanta.firebase")

def init_firebase_admin():
    """Initialize Firebase Admin SDK if the library is available.

    In test environments the ``firebase_admin`` package may not be installed.
    This function now safely returns ``None`` when the SDK cannot be used,
    allowing the rest of the application to start without Firebase.
    """
    if not firebase_admin:
        logger.info("firebase_admin not installed – skipping Firebase init.")
        return None

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
    """Verify a Firebase ID token if the SDK is available.

    When ``firebase_admin`` is not installed this function simply returns
    ``None`` and logs the situation, allowing authentication‑related routes to be
    exercised in unit tests without requiring external credentials.
    """
    if not firebase_admin:
        logger.info("firebase_admin not installed – skipping token verification.")
        return None
    try:
        init_firebase_admin()
        decoded_token = auth.verify_id_token(id_token)
        return decoded_token
    except Exception as e:
        logger.error(f"Invalid Firebase ID Token: {e}")
        return None

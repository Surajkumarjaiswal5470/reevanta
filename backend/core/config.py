import os
from pathlib import Path
from dotenv import load_dotenv

ROOT_DIR = Path(__file__).parent.parent
load_dotenv(ROOT_DIR / '.env')

MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.environ.get('DB_NAME', 'reevanta')
JWT_SECRET = os.environ.get('JWT_SECRET', 'reevanta-production-secret-key-change-me')
JWT_ALGORITHM = "HS256"

BREVO_API_KEY = os.environ.get('BREVO_API_KEY', '').strip()
SENDER_EMAIL = os.environ.get('SENDER_EMAIL', 'noreply@reevanta.com').strip()
SENDER_NAME = os.environ.get('SENDER_NAME', 'RIVAANTA Luxury Wear').strip()

ADMIN_NAME = "spk"
ADMIN_SECRET_KEY = "PHOENIX"
ADMIN_EMAIL = os.environ.get('ADMIN_EMAIL', 'spk@reevanta.com').strip()
ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD', 'PHOENIX').strip()
ADMIN_PHONE = "+9779715102007"

CORS_ORIGINS = os.environ.get('CORS_ORIGINS', '*')
ENVIRONMENT = os.environ.get('ENVIRONMENT', 'development').strip()

# Twilio SMS Configuration
TWILIO_ACCOUNT_SID = os.environ.get('TWILIO_ACCOUNT_SID', '').strip()
TWILIO_AUTH_TOKEN = os.environ.get('TWILIO_AUTH_TOKEN', '').strip()
TWILIO_PHONE_NUMBER = os.environ.get('TWILIO_PHONE_NUMBER', '').strip()
TWILIO_MAIN_ACCOUNT_SID = os.environ.get('TWILIO_MAIN_ACCOUNT_SID', '').strip() or TWILIO_ACCOUNT_SID

# Redis & CDN Configuration
REDIS_URL = os.environ.get('REDIS_URL', 'redis://localhost:6379/0').strip()
CDN_BASE_URL = os.environ.get('CDN_BASE_URL', '').strip()

# Meilisearch Configuration
MEILISEARCH_URL = os.environ.get('MEILISEARCH_URL', 'http://127.0.0.1:7700').strip()
MEILISEARCH_MASTER_KEY = os.environ.get('MEILISEARCH_MASTER_KEY', 'reevanta_meilisearch_master_key').strip()

# NepalOTP Configuration
NEPALOTP_API_KEY = os.environ.get('NEPALOTP_API_KEY', '').strip()

# ImageKit Configuration
IMAGEKIT_PUBLIC_KEY = os.environ.get('IMAGEKIT_PUBLIC_KEY', 'public_0oD+msTktt3r1xWwdVrOqlBUyDA=').strip()
IMAGEKIT_PRIVATE_KEY = os.environ.get('IMAGEKIT_PRIVATE_KEY', 'private_BqZaPX73d1p6Ma4xHTWIYqwZD4M=').strip()
IMAGEKIT_URL_ENDPOINT = os.environ.get('IMAGEKIT_URL_ENDPOINT', 'https://ik.imagekit.io/h7oalyucx').strip()

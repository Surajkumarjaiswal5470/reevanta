import pytest
from fastapi import HTTPException
from core.database import serialize_doc, to_object_id
from core.security import hash_password, verify_password, create_access_token, verify_token
from core.rate_limiter import rate_limiter
from core.security_middleware import sanitize_data, sanitize_text

def test_unit_serialize_doc():
    """Unit test for database document serialization."""
    raw_doc = {"_id": "65c1a2b3c4d5e6f7a8b9c0d1", "title": "Organza Saree", "price": 4500}
    serialized = serialize_doc(raw_doc)
    assert "id" in serialized
    assert serialized["id"] == "65c1a2b3c4d5e6f7a8b9c0d1"
    assert "_id" not in serialized

def test_unit_object_id_conversion():
    """Unit test for PyObjectId string/ObjectID conversion safety."""
    valid_id = "65c1a2b3c4d5e6f7a8b9c0d1"
    oid = to_object_id(valid_id)
    assert oid is not None
    assert str(oid) == valid_id

    invalid_id = "invalid-id-string"
    with pytest.raises(HTTPException) as exc_info:
        to_object_id(invalid_id)
    assert exc_info.value.status_code == 404

def test_unit_password_hashing():
    """Unit test for Bcrypt password hashing and verification."""
    raw_pass = "EnterprisePass123!"
    hashed = hash_password(raw_pass)
    assert hashed != raw_pass
    assert verify_password(raw_pass, hashed) is True
    assert verify_password("WrongPass123!", hashed) is False

def test_unit_jwt_token_handling():
    """Unit test for JWT token creation and verification."""
    token = create_access_token("65c1a2b3c4d5e6f7a8b9c0d1", "test@reevanta.com")
    assert isinstance(token, str)
    decoded = verify_token(token)
    assert decoded["sub"] == "65c1a2b3c4d5e6f7a8b9c0d1"
    assert decoded["email"] == "test@reevanta.com"

def test_unit_security_sanitization():
    """Unit test for XSS and Script injection data sanitization."""
    dirty_input = "<script>alert('xss')</script>Normal Text"
    sanitized = sanitize_text(dirty_input)
    assert "<script>" not in sanitized
    assert "Normal Text" in sanitized

    dirty_dict = {"title": "<script>alert('bad')</script>Saree"}
    clean_dict = sanitize_data(dirty_dict)
    assert "<script>" not in clean_dict["title"]
    assert "Saree" in clean_dict["title"]

def test_unit_rate_limiter_buckets():
    """Unit test for rate limiter requests tracking."""
    rate_limiter.ip_requests.clear()
    for i in range(50):
        is_limited, _ = rate_limiter.is_rate_limited(f"192.168.1.{i}", "/api/health", "GET")
        assert is_limited is False
    assert len(rate_limiter.ip_requests) <= 5000

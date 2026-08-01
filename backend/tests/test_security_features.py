from server import app
from core.rate_limiter import rate_limiter
from core.security_middleware import SecurityHeadersMiddleware, sanitize_text, sanitize_data

def test_security_middlewares_registered():
    middlewares = [m.cls.__name__ for m in app.user_middleware if hasattr(m, 'cls')]
    assert "SecurityHeadersMiddleware" in middlewares
    assert "RateLimitMiddleware" in middlewares

def test_xss_sanitizer():
    dangerous_input = "<script>alert('xss')</script>Hello <iframe src='evil.com'></iframe>World"
    cleaned = sanitize_text(dangerous_input)
    assert "<script>" not in cleaned
    assert "<iframe" not in cleaned
    assert "Hello World" in cleaned

    dict_data = {"name": "Test <script>alert(1)</script>", "age": 25}
    sanitized_dict = sanitize_data(dict_data)
    assert sanitized_dict["name"] == "Test "

def test_rate_limiter_tracking():
    ip = "192.168.1.100"
    for _ in range(5):
        rate_limiter.record_failed_login(ip)
    assert rate_limiter.is_login_locked_out(ip) is True
    rate_limiter.reset_failed_login(ip)
    assert rate_limiter.is_login_locked_out(ip) is False

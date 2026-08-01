"""Top‑level ``services`` package wrapper.

Tests and modules import ``services`` directly (e.g. ``from services.email_service
import send_email_brevo``). The actual implementation lives under ``backend/services``.
This wrapper re‑exports the backend services package so that the import paths used
in the code remain functional.
"""

from importlib import import_module
import sys

_backend_services = import_module("backend.services")
for name in getattr(_backend_services, "__all__", []):
    globals()[name] = getattr(_backend_services, name)
if not getattr(_backend_services, "__all__", None):
    for name in dir(_backend_services):
        if not name.startswith("_"):
            globals()[name] = getattr(_backend_services, name)
sys.modules[__name__] = _backend_services
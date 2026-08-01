"""Top‑level ``models`` package wrapper.

Tests import ``models`` directly (e.g. ``from models.auth import AdminSecretLoginRequest``).
The actual implementation resides under ``backend/models``. This wrapper re‑exports
the backend models so that the import paths used in the tests remain valid.
"""

from importlib import import_module
import sys

_backend_models = import_module("backend.models")
for name in getattr(_backend_models, "__all__", []):
    globals()[name] = getattr(_backend_models, name)
if not getattr(_backend_models, "__all__", None):
    for name in dir(_backend_models):
        if not name.startswith("_"):
            globals()[name] = getattr(_backend_models, name)
sys.modules[__name__] = _backend_models
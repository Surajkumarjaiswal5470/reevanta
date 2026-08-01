"""Top‑level ``routers`` package wrapper.

Test modules import routers via ``from routers.auth import router`` etc. The real
router modules live under ``backend/routers``. This wrapper forwards attribute
access to the backend package, making the import paths compatible without
changing the test code.
"""

from importlib import import_module
import sys

_backend_routers = import_module("backend.routers")
for name in getattr(_backend_routers, "__all__", []):
    globals()[name] = getattr(_backend_routers, name)
if not getattr(_backend_routers, "__all__", None):
    for name in dir(_backend_routers):
        if not name.startswith("_"):
            globals()[name] = getattr(_backend_routers, name)
sys.modules[__name__] = _backend_routers
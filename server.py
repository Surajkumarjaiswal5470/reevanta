"""Top‑level ``server`` module wrapper.

The test suite imports the FastAPI ``app`` instance via ``from server import
app``. The actual implementation lives in ``backend/server.py``. This wrapper
re‑exports the ``app`` object (and any other public symbols) so that the import
remains unchanged.
"""

from importlib import import_module
import sys

_backend_server = import_module("backend.server")
# Re‑export public attributes
for name in getattr(_backend_server, "__all__", []):
    globals()[name] = getattr(_backend_server, name)
if not getattr(_backend_server, "__all__", None):
    for name in dir(_backend_server):
        if not name.startswith("_"):
            globals()[name] = getattr(_backend_server, name)
# Ensure ``import server`` returns this wrapper module
sys.modules[__name__] = _backend_server
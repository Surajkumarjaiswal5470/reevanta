"""Top-level ``core`` package wrapper.

The test suite imports symbols directly from ``core`` (e.g. ``from core.config
import MONGO_URL``). In the project layout the actual implementation lives in
``backend/core``. To make the imports work without modifying the tests we expose
the ``backend.core`` package as a top‑level ``core`` package.

All public names are re‑exported so that ``import core`` behaves exactly like
``import backend.core``.
"""

from importlib import import_module
import sys

# Import the real backend core package
_backend_core = import_module("backend.core")

# Re‑export its public attributes
for name in getattr(_backend_core, "__all__", []):
    globals()[name] = getattr(_backend_core, name)

# If ``__all__`` is not defined, export everything that does not start with an
# underscore.
if not getattr(_backend_core, "__all__", None):
    for name in dir(_backend_core):
        if not name.startswith("_"):
            globals()[name] = getattr(_backend_core, name)

# Ensure ``core`` appears as a proper module in ``sys.modules``
sys.modules[__name__] = _backend_core
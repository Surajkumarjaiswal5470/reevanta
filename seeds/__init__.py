"""Top‑level ``seeds`` package wrapper.

The backend implementation lives under ``backend/seeds``. Tests import
``seeds.catalog_data`` directly, so we re‑export the backend package here.
"""

from importlib import import_module
import sys

_backend_seeds = import_module("backend.seeds")
for name in getattr(_backend_seeds, "__all__", []):
    globals()[name] = getattr(_backend_seeds, name)
if not getattr(_backend_seeds, "__all__", None):
    for name in dir(_backend_seeds):
        if not name.startswith("_"):
            globals()[name] = getattr(_backend_seeds, name)
sys.modules[__name__] = _backend_seeds# Makes the top‑level ``seeds`` directory a Python package so imports like
# ``from seeds.catalog_data import SEED_PRODUCTS`` work correctly.
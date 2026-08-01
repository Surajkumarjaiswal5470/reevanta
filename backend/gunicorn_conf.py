"""
Production Gunicorn Configuration for 5,000+ Concurrent Users
────────────────────────────────────────────────────────────────
Optimized ASGI server config with Uvicorn workers, connection pooling,
high backlog queue, and memory recycling.

Run with:
    gunicorn -c backend/gunicorn_conf.py backend.server:app
"""

import multiprocessing
import os

# Worker Processes & Concurrency
cpu_count = multiprocessing.cpu_count()
workers = int(os.environ.get("WEB_CONCURRENCY", cpu_count * 2 + 1))
worker_class = "uvicorn.workers.UvicornWorker"

# Networking & Binding
bind = os.environ.get("BIND", "0.0.0.0:8001")
backlog = 2048  # High connection queue for traffic spikes
keepalive = 65  # Keep connections alive for HTTP/1.1 reuse

# Timeout Controls
timeout = 30
graceful_timeout = 15

# Memory & Process Recycling (Prevents memory leaks under 5,000+ load)
max_requests = 10000
max_requests_jitter = 1000

# Logging
loglevel = os.environ.get("LOG_LEVEL", "info")
accesslog = "-"
errorlog = "-"

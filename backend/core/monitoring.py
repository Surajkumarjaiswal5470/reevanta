import os
import logging

logger = logging.getLogger("reevanta.monitoring")

SENTRY_DSN = os.getenv("SENTRY_DSN", "")

_sentry_initialized = False

def init_sentry():
    """Initializes Sentry Error Tracking SDK if DSN is configured."""
    global _sentry_initialized
    if not SENTRY_DSN:
        logger.info("[Sentry] No SENTRY_DSN set. Running local error tracking fallback.")
        return False

    try:
        import sentry_sdk
        from sentry_sdk.integrations.fastapi import FastApiIntegration
        from sentry_sdk.integrations.logging import LoggingIntegration

        sentry_sdk.init(
            dsn=SENTRY_DSN,
            traces_sample_rate=0.2,
            profiles_sample_rate=0.1,
            integrations=[
                FastApiIntegration(),
                LoggingIntegration(level=logging.INFO, event_level=logging.ERROR),
            ],
            environment=os.getenv("NODE_ENV", "production")
        )
        _sentry_initialized = True
        logger.info("[Sentry] Error tracking initialized successfully.")
        return True
    except Exception as e:
        logger.error(f"[Sentry Error] Failed to initialize Sentry: {e}")
        return False


def capture_exception(exception: Exception, extra_context: dict = None):
    """Captures exception to Sentry and local logs."""
    logger.error(f"[Uncaught Exception] {exception}", exc_info=True)
    if _sentry_initialized:
        try:
            import sentry_sdk
            with sentry_sdk.push_scope() as scope:
                if extra_context:
                    for k, v in extra_context.items():
                        scope.set_extra(k, v)
                sentry_sdk.capture_exception(exception)
        except Exception:
            pass

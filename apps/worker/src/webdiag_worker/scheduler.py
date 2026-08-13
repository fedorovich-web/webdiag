from __future__ import annotations

import os
import time

from webdiag_worker.ai import cleanup_ai_artifacts
from webdiag_worker.monitoring import run_due_monitors


def run_cycle() -> None:
    try:
        run_due_monitors()
    except Exception as error:
        print(f"monitoring scheduler error: {type(error).__name__}", flush=True)
    if os.getenv("WEBDIAG_AI_INTERNAL_TOKEN"):
        try:
            cleanup_ai_artifacts()
        except Exception as error:
            print(f"AI artifact cleanup error: {type(error).__name__}", flush=True)


def main() -> None:
    configured = int(os.getenv("WEBDIAG_MONITORING_SCHEDULER_INTERVAL_SECONDS", "60"))
    interval = max(30, min(300, configured))
    while True:
        run_cycle()
        time.sleep(interval)


if __name__ == "__main__":
    main()

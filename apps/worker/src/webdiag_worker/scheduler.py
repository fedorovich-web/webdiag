from __future__ import annotations

import os
import time

from webdiag_worker.monitoring import run_due_monitors


def main() -> None:
    configured = int(os.getenv("WEBDIAG_MONITORING_SCHEDULER_INTERVAL_SECONDS", "60"))
    interval = max(30, min(300, configured))
    while True:
        try:
            run_due_monitors()
        except Exception as error:
            print(f"monitoring scheduler error: {type(error).__name__}", flush=True)
        time.sleep(interval)


if __name__ == "__main__":
    main()

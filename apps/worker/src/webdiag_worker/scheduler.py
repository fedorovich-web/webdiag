from __future__ import annotations

import os
import time

from webdiag_worker.ai import cleanup_ai_artifacts, run_one_ai_job
from webdiag_worker.autonomous_provider import AutonomousAIProvider
from webdiag_worker.crawler import run_one_crawl
from webdiag_worker.monitoring import run_due_monitors


def _drain_ai_jobs(limit: int = 10) -> int:
    try:
        with AutonomousAIProvider.from_env() as provider:
            processed = 0
            while processed < limit and run_one_ai_job(provider):
                processed += 1
            return processed
    except Exception as error:
        print(f"AI job scheduler error: {type(error).__name__}", flush=True)
        return 0


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
        try:
            _drain_ai_jobs()
        except Exception as error:
            print(f"AI job drain error: {type(error).__name__}", flush=True)
    if os.getenv("WEBDIAG_CRAWLER_INTERNAL_TOKEN"):
        try:
            run_one_crawl()
        except Exception as error:
            print(f"crawler scheduler error: {type(error).__name__}", flush=True)


def main() -> None:
    configured = int(os.getenv("WEBDIAG_MONITORING_SCHEDULER_INTERVAL_SECONDS", "60"))
    interval = max(30, min(300, configured))
    while True:
        run_cycle()
        time.sleep(interval)


if __name__ == "__main__":
    main()

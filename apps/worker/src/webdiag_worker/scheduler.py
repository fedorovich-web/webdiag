from __future__ import annotations

import os
import threading
import time

from webdiag_worker.ai import cleanup_ai_artifacts, run_one_ai_job
from webdiag_worker.vercel_gateway_provider import VercelAIGatewayProvider
from webdiag_worker.crawler import run_one_crawl
from webdiag_worker.monitoring import run_due_monitors


def _drain_ai_jobs(limit: int = 10) -> int:
    try:
        with VercelAIGatewayProvider.from_env() as provider:
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
    if os.getenv("WEBDIAG_CRAWLER_INTERNAL_TOKEN"):
        try:
            run_one_crawl()
        except Exception as error:
            print(f"crawler scheduler error: {type(error).__name__}", flush=True)


def _run_ai_loop() -> None:
    while True:
        _drain_ai_jobs()
        time.sleep(2)


def main() -> None:
    configured = int(os.getenv("WEBDIAG_MONITORING_SCHEDULER_INTERVAL_SECONDS", "60"))
    interval = max(30, min(300, configured))
    if os.getenv("WEBDIAG_AI_RUNTIME_ENABLED", "false").lower() == "true":
        if not os.getenv("WEBDIAG_AI_INTERNAL_TOKEN"):
            raise RuntimeError("AI worker requires its internal token")
        with VercelAIGatewayProvider.from_env():
            pass
        threading.Thread(target=_run_ai_loop, name="webdiag-ai-worker", daemon=True).start()
    while True:
        run_cycle()
        time.sleep(interval)


if __name__ == "__main__":
    main()

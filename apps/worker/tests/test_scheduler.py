from unittest.mock import patch

from webdiag_worker.scheduler import run_cycle


def test_scheduler_runs_artifact_cleanup_only_when_ai_is_configured(monkeypatch) -> None:
    monkeypatch.delenv("WEBDIAG_CRAWLER_INTERNAL_TOKEN", raising=False)
    monkeypatch.delenv("WEBDIAG_AI_INTERNAL_TOKEN", raising=False)
    with (
        patch("webdiag_worker.scheduler.run_due_monitors", return_value=0),
        patch("webdiag_worker.scheduler.cleanup_ai_artifacts") as cleanup,
        patch("webdiag_worker.scheduler.run_one_crawl") as crawl,
    ):
        run_cycle()
    cleanup.assert_not_called()
    crawl.assert_not_called()

    monkeypatch.setenv("WEBDIAG_AI_INTERNAL_TOKEN", "a" * 32)
    with (
        patch("webdiag_worker.scheduler.run_due_monitors", return_value=0),
        patch(
            "webdiag_worker.scheduler.cleanup_ai_artifacts",
            return_value=(2, 0),
        ) as cleanup,
        patch("webdiag_worker.scheduler.run_one_crawl") as crawl,
    ):
        run_cycle()
    cleanup.assert_called_once_with()
    crawl.assert_not_called()

    monkeypatch.setenv("WEBDIAG_CRAWLER_INTERNAL_TOKEN", "c" * 32)
    with (
        patch("webdiag_worker.scheduler.run_due_monitors", return_value=0),
        patch("webdiag_worker.scheduler.cleanup_ai_artifacts", return_value=(0, 0)),
        patch("webdiag_worker.scheduler.run_one_crawl", return_value=False) as crawl,
    ):
        run_cycle()
    crawl.assert_called_once_with()

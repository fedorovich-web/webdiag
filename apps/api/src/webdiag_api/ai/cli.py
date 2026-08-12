from __future__ import annotations

import argparse
import sys
from collections.abc import Sequence

from webdiag_api.ai.storage import CreditConflictError, SqliteAIStore


def _parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(prog="python -m webdiag_api.ai.cli")
    commands = parser.add_subparsers(dest="command", required=True)
    grant = commands.add_parser("grant-credits")
    grant.add_argument("--database-path", required=True)
    grant.add_argument("--user-id", required=True)
    grant.add_argument("--confirm-user-id", required=True)
    grant.add_argument("--quantity", required=True, type=int)
    grant.add_argument("--reason", required=True)
    grant.add_argument("--correlation-id", required=True)
    return parser


def main(argv: Sequence[str] | None = None) -> int:
    arguments = _parser().parse_args(argv)
    if arguments.user_id != arguments.confirm_user_id:
        print("credit grant confirmation does not match target user", file=sys.stderr)
        return 2
    store = SqliteAIStore(arguments.database_path)
    try:
        entry = store.grant_credits(
            user_id=arguments.user_id,
            quantity=arguments.quantity,
            reason=arguments.reason,
            correlation_id=arguments.correlation_id,
        )
    except (ValueError, CreditConflictError) as error:
        print(str(error), file=sys.stderr)
        return 2
    account = store.get_credit_account(user_id=arguments.user_id)
    print(
        f"ledger_id={entry.id} user_id={entry.user_id} "
        f"available={account.available} reserved={account.reserved}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

# Audit URL Redaction Design

## Problem

The public audit accepts query strings because they can change the fetched page, but the
current snapshot persists and returns that complete URL. Query parameters may contain
tokens or other credentials. A valid request can therefore copy secret-like data into the
SQLite job, run, affected URL, or evidence payloads.

## Boundary

- Keep the validated complete URL only in memory while fetching and evaluating the page.
- Remove userinfo, query, and fragment from every URL written to an audit snapshot.
- Apply the same projection on reads so older stored snapshots cannot expose these parts
  through the API.
- Preserve scheme, host, allowed port, and path so the report still identifies the page.
- Do not change SSRF validation, redirect validation, or the URL sent to the target server.

## Verification

- A request containing a query token reaches the mocked target with that query intact.
- POST and GET responses do not contain the token.
- New SQLite job and run payloads do not contain the token.
- Typed redaction tests cover targets, affected URLs, redirect evidence, and nested URL
  metadata without rewriting ordinary non-URL evidence.

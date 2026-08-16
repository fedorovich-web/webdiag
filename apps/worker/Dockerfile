FROM python:3.14-slim-bookworm AS builder
WORKDIR /build
COPY requirements/python-build.lock.txt /tmp/python-build.lock.txt
RUN python -m pip --isolated install --no-cache-dir --index-url https://pypi.org/simple --require-hashes --only-binary=:all: -r /tmp/python-build.lock.txt
COPY apps/worker /build/apps/worker
RUN python -m pip --isolated wheel --no-cache-dir --no-deps --no-build-isolation --wheel-dir /wheels /build/apps/worker

FROM python:3.14-slim-bookworm AS runtime
WORKDIR /app
COPY requirements/python-worker.lock.txt /tmp/python-runtime.lock.txt
RUN python -m pip --isolated install --no-cache-dir --index-url https://pypi.org/simple --require-hashes --only-binary=:all: -r /tmp/python-runtime.lock.txt
COPY --from=builder /wheels/webdiag_worker-*.whl /tmp/webdiag/
RUN python -m pip --isolated install --no-cache-dir --no-deps /tmp/webdiag/*.whl && rm -f /tmp/webdiag/*.whl
CMD ["dramatiq", "webdiag_worker.actors"]

FROM python:3.14-slim-bookworm@sha256:48b13b003dda20b16f9442b8475aa05fe21bf6579a8c881db92ffb4d8fd20f83 AS builder
WORKDIR /build
COPY requirements/python-build.lock.txt /tmp/python-build.lock.txt
RUN python -m pip --isolated install --no-cache-dir --index-url https://pypi.org/simple --require-hashes --only-binary=:all: -r /tmp/python-build.lock.txt
COPY apps/api /build/apps/api
RUN python -m pip --isolated wheel --no-cache-dir --no-deps --no-build-isolation --wheel-dir /wheels /build/apps/api

FROM python:3.14-slim-bookworm@sha256:48b13b003dda20b16f9442b8475aa05fe21bf6579a8c881db92ffb4d8fd20f83 AS runtime
WORKDIR /app
COPY requirements/python-api.lock.txt /tmp/python-runtime.lock.txt
RUN python -m pip --isolated install --no-cache-dir --index-url https://pypi.org/simple --require-hashes --only-binary=:all: -r /tmp/python-runtime.lock.txt
COPY --from=builder /wheels/webdiag_api-*.whl /tmp/webdiag/
RUN python -m pip --isolated install --no-cache-dir --no-deps /tmp/webdiag/*.whl && rm -f /tmp/webdiag/*.whl
EXPOSE 8000
CMD ["uvicorn", "webdiag_api.main:app", "--host", "0.0.0.0", "--port", "8000"]

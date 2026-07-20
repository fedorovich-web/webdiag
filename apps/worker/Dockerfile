FROM python:3.14-slim-bookworm
WORKDIR /app
COPY apps/worker /app/apps/worker
RUN python -m pip install --no-cache-dir "/app/apps/worker[rabbitmq]"
CMD ["dramatiq", "webdiag_worker.actors"]

FROM python:3.14-slim-bookworm
WORKDIR /app
COPY apps/api /app/apps/api
RUN python -m pip install --no-cache-dir /app/apps/api
EXPOSE 8000
CMD ["uvicorn", "webdiag_api.main:app", "--host", "0.0.0.0", "--port", "8000"]

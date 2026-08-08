# KANT OS — container image
# Base image is multi-arch, so this also builds on Raspberry Pi (arm64/armv7).
FROM python:3.12-slim

WORKDIR /kant

COPY os/ ./os/
COPY server/ ./server/

EXPOSE 8420

# Zero third-party Python dependencies — stdlib http.server only.
CMD ["python3", "server/server.py", "--host", "0.0.0.0", "--port", "8420"]

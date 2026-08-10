FROM node:22-bookworm-slim AS frontend-build

WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend ./
RUN npm run build

FROM node:22-bookworm-slim

WORKDIR /app/backend

RUN apt-get update && apt-get install -y --no-install-recommends python3 python3-pip \
    && rm -rf /var/lib/apt/lists/*

COPY backend/package*.json ./
RUN npm ci

COPY ml/runtime-requirements.txt /app/ml/runtime-requirements.txt
RUN pip3 install -r /app/ml/runtime-requirements.txt --break-system-packages

COPY backend ./
COPY ml /app/ml
COPY --from=frontend-build /app/frontend/dist /app/frontend/dist

RUN python3 /app/ml/train.py && python3 /app/ml/train_chatbot.py

EXPOSE 10000

CMD ["node", "server.js"]

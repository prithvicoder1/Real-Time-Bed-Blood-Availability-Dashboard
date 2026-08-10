# CareBridge — real-time bed & blood coordination

CareBridge coordinates hospital beds, blood inventory, ambulances, facility verification, and capacity forecasts through patient, hospital, and administrator portals.

## Stack

- Semantic HTML5, responsive CSS and dependency-free browser JavaScript (Vite is used only for development/build)
- Node.js, Express and a confidence-aware NLP assistant
- PostgreSQL 17 with JSONB inventory snapshots and audit records
- Python, pandas, NumPy and scikit-learn forecasting
- Docker Compose for a reproducible local stack

## Quick start with Docker

```bash
cp .env.example .env
docker compose up --build
```

Open `http://localhost:5173`. The API health endpoint is `http://localhost:5001/api/health`.
PostgreSQL is available to local database clients on port `5433` (the containers communicate on the standard internal port `5432`).

## Local development

```bash
cd backend && npm install && npm start
cd frontend && npm install && npm run dev
```

Set `DATABASE_URL`, `JWT_SECRET`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` from `.env.example`. When PostgreSQL is unavailable, the public directory deliberately falls back to clearly labelled demonstration inventory.

## Deploy to Render

The root `render.yaml` creates a free Docker web service and a free managed PostgreSQL database. In Render, choose **New → Blueprint**, connect this repository, and apply the Blueprint. Render asks for `ADMIN_EMAIL` and `ADMIN_PASSWORD`; use a strong, unique password.

The Docker service builds the Vite frontend and serves it from Express, so the UI and `/api` share one public URL. The API applies `backend/db/init.sql` during startup and seeds the bundled public directory when the database is empty.

### Where data is stored

- Hospital accounts, resource snapshots, certificate metadata, and audit events are stored in PostgreSQL through `DATABASE_URL`. Locally this is the `postgres_data` Docker volume; on Render it is the managed `carebridge-db` database.
- Uploaded PDF/JPG/PNG certificate files and their metadata are stored in PostgreSQL, avoiding Render's paid persistent-disk requirement.
- The 150 bundled directory records and simulated demonstration inventory live in `backend/data/hospitals.json`; they are copied into PostgreSQL on startup.
- Trained ML artifacts are versioned in `ml/` and embedded in the Docker image. They are not database records.

Render's free web service sleeps after inactivity, and its free PostgreSQL database expires after 30 days. Upgrade or move the database before that deadline if the stored hospital and certificate data must be retained.

## Train and test the ML model

```bash
cd ml
python3 -m pip install -r requirements.txt
python3 train.py
python3 -m unittest -v test_model.py
```

The training command creates both `occupancy_model.pkl` and `occupancy_model.joblib`, plus `model_metrics.json`. The notebook `occupancy_training.ipynb` documents the same workflow. The default dataset is deterministic, privacy-safe simulation. To use governed data:

```bash
python3 train.py --data data/authorised_inventory.csv
```

The input contract and privacy requirements are documented in `ml/data/README.md`. Reported demo accuracy must never be presented as clinical validation.

## Verification workflow

Certificate screening records file integrity, document metadata, registry identifiers and risk signals. It always returns a manual-review status. Facility identity should be checked against the ABDM Health Facility Registry and accreditation identifiers against the issuing authority; automated screening is not proof that a certificate is genuine.

## Quality checks

```bash
cd frontend && npm test
cd ../backend && npm test
cd ../ml && python3 -m unittest -v test_model.py
docker compose config --quiet
```

## Data sources and limitations

CareBridge distinguishes live partner feeds from demonstration data. Useful authoritative sources for a production pilot include the ABDM Health Facility Registry for facility identity and India's Open Government Data Platform for aggregate infrastructure reference data. Public aggregate datasets are not substitutes for hospital-provided real-time bed or blood inventory.

The bundled directory contains 150 public facility identity/location records from the National Hospital Directory layer published through Living Atlas India. Refresh it with `cd backend && npm run sync:hospitals`. Because that directory does not publish live inventory, every generated bed and blood value is explicitly labelled `simulated_demo` in the dataset and UI.

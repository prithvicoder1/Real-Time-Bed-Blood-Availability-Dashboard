<div align="center">

# CareBridge

### Find capacity. Coordinate care.

An emergency capacity network for discovering hospital beds and blood inventory, forecasting near-term occupancy, registering facilities, and reviewing operational evidence.

[![Live Demo](https://img.shields.io/badge/Live_Demo-Open_CareBridge-00a88f?style=for-the-badge)](https://carebridge-92bh.onrender.com/)
[![Hospital Sign In](https://img.shields.io/badge/Hospital-Sign_In-00a88f?style=for-the-badge)](https://carebridge-92bh.onrender.com/#signin)
[![API Health](https://img.shields.io/badge/API-Health_Check-b8ff4f?style=for-the-badge)](https://carebridge-92bh.onrender.com/api/health)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ed?style=for-the-badge&logo=docker&logoColor=white)](https://github.com/prithvicoder1/CareBridge/blob/main/backend/Dockerfile)
[![Render](https://img.shields.io/badge/Deploy-Render-7656ff?style=for-the-badge&logo=render&logoColor=white)](https://render.com/deploy)

</div>

[![CareBridge live dashboard](docs/assets/carebridge-dashboard.png)](https://carebridge-92bh.onrender.com/)

> [!IMPORTANT]
> CareBridge is an operational demonstration, not a clinical decision system. Directory identities are based on public records, but bundled bed and blood values are simulated unless a verified hospital feed is connected. Confirm availability directly with the facility and call **112** for life-threatening emergencies.

## Live application

**Production URL:** [https://carebridge-92bh.onrender.com/](https://carebridge-92bh.onrender.com/)

**Hospital sign in:** [https://carebridge-92bh.onrender.com/#signin](https://carebridge-92bh.onrender.com/#signin)

The deployed application provides one responsive interface for patients, hospitals, and network administrators. It currently loads 150 facility directory records and exposes its runtime state through [`/api/health`](https://carebridge-92bh.onrender.com/api/health).

## What CareBridge does

- **Nationwide facility discovery** — search 150 hospital directory records by hospital, city, state, resource, or blood group.
- **Bed and blood visibility** — compare total and occupied beds, ICU capacity, oxygen beds, and all eight blood groups.
- **14-hour occupancy forecasting** — turn current occupancy into a simple pressure forecast with stable, monitor, high, and critical bands.
- **Hospital registration portal** — facilities can create accounts, maintain contact and licence details, and publish inventory updates.
- **Certificate screening** — capture issuer and registry identifiers, generate SHA-256 fingerprints, and surface explainable risk signals for manual review.
- **Network administration** — review pending hospitals, approve or reject registrations, inspect aggregate statistics, and audit recent changes.
- **CareBot assistant** — answer resource and workflow questions with confidence-aware NLP and live directory context.
- **Emergency workflow** — keep the national emergency number and safety-first guidance immediately accessible.

## Architecture

```mermaid
flowchart LR
    U["Patient / Hospital / Administrator"] --> UI["HTML + CSS + JavaScript UI"]
    UI --> API["Node.js + Express API"]
    API --> DB["PostgreSQL"]
    API --> NLP["CareBot NLP model"]
    API --> ML["scikit-learn occupancy model"]
    API --> DIR["150-facility directory"]
    API --> VERIFY["Certificate screening"]
```

The production Docker image builds the Vite frontend and serves it from Express. The browser and `/api` therefore use the same Render domain, avoiding cross-origin configuration and separate frontend hosting.

## Technology stack

| Layer | Technology |
| --- | --- |
| Frontend | Semantic HTML5, responsive CSS, dependency-free JavaScript, Vite |
| API | Node.js, Express, JWT, bcrypt, Multer |
| Database | Neon PostgreSQL 18, JSONB inventory snapshots, `BYTEA` certificate storage |
| Machine learning | Python, pandas, NumPy, scikit-learn, joblib |
| NLP | Word and character TF-IDF with logistic regression and confidence fallback |
| Infrastructure | Docker, Docker Compose, Render Blueprint |

## Machine-learning workflow

The occupancy pipeline uses a time-aware training and evaluation workflow:

1. Validate an authorised dataset or generate the deterministic privacy-safe demonstration dataset.
2. Engineer occupancy, time, weekday, weather, holiday, and facility-type features.
3. Train with a chronological 80/20 split to avoid future-to-past leakage.
4. Compare the model against a persistence baseline.
5. Export reproducible `.pkl` and `.joblib` artifacts plus JSON metrics.

The bundled demonstration model reports an R² of `0.990` and MAE of `1.021` percentage points on simulated holdout data. These numbers demonstrate pipeline behaviour; they are **not clinical validation or evidence of real-world accuracy**.

Training notebooks:

- [`ml/occupancy_training.ipynb`](ml/occupancy_training.ipynb) — forecasting workflow, evaluation, and model card.
- [`ml/chatbot_training.ipynb`](ml/chatbot_training.ipynb) — CareBot intent training and evaluation.

## Run locally with Docker

```bash
git clone https://github.com/prithvicoder1/CareBridge.git
cd CareBridge
cp .env.example .env
docker compose up --build
```

Open:

- Application: [http://localhost:5173](http://localhost:5173)
- API health: [http://localhost:5001/api/health](http://localhost:5001/api/health)
- PostgreSQL client port: `5433` (`5432` inside Docker)

## Local development

Start the backend and frontend in separate terminals:

```bash
cd backend
npm install
npm start
```

```bash
cd frontend
npm install
npm run dev
```

Create `.env` from [`.env.example`](.env.example) and set secure values for:

```env
DATABASE_URL=postgresql://carebridge:carebridge@localhost:5432/carebridge
JWT_SECRET=replace-with-a-long-random-secret
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=replace-with-a-strong-password
```

## Train and test

```bash
cd ml
python3 -m pip install -r requirements.txt
python3 train.py
python3 train_chatbot.py
python3 -m unittest -v test_model.py
```

To train the forecast model on governed data:

```bash
python3 train.py --data data/authorised_inventory.csv
```

The required columns, validation rules, and privacy expectations are documented in [`ml/data/README.md`](ml/data/README.md).

## Data storage

| Data | Local development | Render deployment |
| --- | --- | --- |
| Hospital accounts and profiles | PostgreSQL `postgres_data` volume | Neon PostgreSQL |
| Bed and blood snapshots | PostgreSQL | Neon PostgreSQL |
| Certificate files and metadata | PostgreSQL | Neon PostgreSQL |
| Audit events | PostgreSQL | Neon PostgreSQL |
| Public directory seed | `backend/data/hospitals.json` | Docker image, seeded into PostgreSQL |
| Trained model artifacts | `ml/` | Docker image |

Passwords are stored as bcrypt hashes. Certificate uploads are stored in PostgreSQL so the free Render web service does not depend on an ephemeral filesystem.

## Deploy with Render

The repository includes [`render.yaml`](render.yaml). To create the full free-tier preview stack:

1. Create a Neon PostgreSQL project and copy its pooled connection string.
2. In Render, select **New → Blueprint** and connect `prithvicoder1/CareBridge` on `main`.
3. Set `DATABASE_URL` to the Neon pooled connection string.
4. Enter secure values for `ADMIN_EMAIL` and `ADMIN_PASSWORD`, then apply the Blueprint.

The Blueprint creates the Docker web service, generates `JWT_SECRET`, uses the externally managed Neon database, runs the schema automatically, and checks `/api/health`.

> [!NOTE]
> Render free web services sleep after inactivity, so the first request after a quiet period can take approximately 50 seconds. The persistent database is hosted on Neon and is not tied to Render’s expiring free PostgreSQL instances.

## Quality checks

```bash
cd frontend && npm test
cd ../backend && npm test
cd ../ml && python3 -m unittest -v test_model.py
docker compose config --quiet
```

The production Docker image is also smoke-tested against the homepage and `/api/health` before release.

## Data sources and responsible use

The bundled directory contains 150 public facility identity and location records derived from the National Hospital Directory layer published through Living Atlas India. Refresh it with:

```bash
cd backend
npm run sync:hospitals
```

The directory does not provide live bed or blood availability. Generated inventory is therefore labelled `simulated_demo` throughout the API and interface. A production deployment should use governed, timestamped hospital feeds, verify facility identity through ABDM HFR, and validate accreditation data with its issuing authority.

## Repository structure

```text
CareBridge/
├── backend/          Express API, PostgreSQL schema, chatbot and directory
├── frontend/         HTML, CSS and JavaScript interface
├── ml/               notebooks, training code, tests and model artifacts
├── docs/assets/      README media
├── docker-compose.yml
└── render.yaml       Render Blueprint
```

## Licence

This project is released under the [MIT License](LICENSE).

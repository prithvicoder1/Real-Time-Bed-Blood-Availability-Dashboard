# Data contract and provenance

The committed model is trained on a deterministic, privacy-safe simulation. It is designed to prove the pipeline and user experience, not to support clinical or capacity decisions.

For a real deployment, export authorised, de-identified hourly snapshots with: `timestamp`, `hospital_id`, `total_beds`, `occupied_beds`, `temperature`, `is_holiday`, and optional `facility_type`. Split by time—not randomly—to avoid future leakage.

Useful authoritative reference sources include India's ABDM Health Facility Registry for facility identity and the Open Government Data Platform for aggregate infrastructure context. Neither source is represented as a live bed-availability feed. Real-time inventory must come directly from participating hospitals under a data-sharing agreement.

Never include patient names, ABHA numbers, phone numbers, diagnoses, or free-text notes in the training file.

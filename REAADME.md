# Atlandrak - User Profile Service

This service is the central backend component for managing user profiles, authentication, and personal data within the Atlandrak federated ecosystem.

## 1. Overview

- **Purpose:** Provides REST API endpoints for all user-related operations.
- **Deployment:** Containerized with Docker and deployed as a serverless service on Google Cloud Run.
- **Endpoint:** `https://account.atlandrak.com` (via Global External HTTPS Load Balancer)

---

## 2. Technology Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Language:** TypeScript
- **Package Manager:** pnpm (within a monorepo structure)
- **Containerization:** Docker
- **Cloud Provider:** Google Cloud Platform (GCP)
- **Hosting:** Cloud Run
- **Container Registry:** Artifact Registry
- **Networking:** Cloud Load Balancing

---

## 3. Setup & Installation

This service is part of the `atlandrak` monorepo. To run it, you must be at the root of the monorepo.

1.  **Install Dependencies:**
    ```bash
    # From the monorepo root (e.g., ~/atlandrak)
    pnpm install -r
    ```

---

## 4. Running Locally

You can run the service in development mode with hot-reloading using the following command:

```bash
# From the monorepo root
pnpm --filter user-profile-service dev

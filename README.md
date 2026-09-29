# SignalDesk AI

**AI-Powered Lead Management & Sales Automation Platform**

SignalDesk AI is a full-stack application that helps businesses streamline lead management, automate customer follow-ups, and improve sales efficiency. It combines AI-powered email generation, intelligent lead scoring, and background job processing to help sales teams manage prospects and convert more leads into customers.

## Tech Stack

React.js, Vite, Tailwind CSS, Node.js, Express.js, PostgreSQL, Redis, BullMQ, Groq API, Nodemailer, Docker, Docker Compose.

## Key Features

* **Lead Management:** Organize leads, manage customer information, and track their status throughout the sales pipeline.
* **AI-Powered Lead Scoring:** Automatically categorize leads as Hot, Warm, or Cold based on their status, source, and follow-up activity.
* **AI Email Generation:** Generate personalized follow-up emails using the Groq API.
* **Automated Follow-Ups:** Schedule emails using BullMQ and Redis, with automatic retries for failed jobs.
* **Smart Follow-Up Cancellation:** Cancel pending follow-ups when a lead is converted or marked as lost.
* **Stale Lead Detection:** Identify inactive leads that require attention.
* **Conversion Analytics:** Monitor lead activity, follow-up performance, and conversion trends.

## Getting Started

### 1. Configure Environment Variables

```bash
cp .env.example .env
```

Configure `POSTGRES_PASSWORD`, `JWT_SECRET`, and `GROQ_API_KEY` in your `.env` file. Add SMTP credentials to enable real email delivery.

### 2. Start the Application

```bash
docker compose up --build -d
```

### 3. Access the Application

* **Frontend:** http://localhost:5173
* **API Health:** http://localhost:5000/api/health

Create an account through the registration page to get started.

## Verify the Application

```bash
docker compose ps
curl http://localhost:5000/api/health
docker compose logs -f backend
```

## How It Works

SignalDesk AI stores lead information and follow-up records in PostgreSQL, while Redis and BullMQ handle scheduled background jobs. When a follow-up becomes due, the worker checks the lead's current status before processing the email. Failed jobs are automatically retried, and pending follow-ups are cancelled when a lead is converted or lost.

The application also periodically identifies stale leads and updates dashboard analytics, helping businesses prioritize prospects and maintain consistent communication.

## Docker Commands

```bash
docker compose stop
docker compose down
docker compose down -v
```

* `docker compose stop` — Stops running containers.
* `docker compose down` — Removes containers while preserving database volumes.
* `docker compose down -v` — Removes containers and associated volumes, deleting stored database data.

**Note:** Without SMTP configuration, emails are logged to the backend console instead of being delivered. The application may still mark these follow-ups as sent.

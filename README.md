# Resume Job Matcher 🎯

> Semantic job matching powered by Endee Vector Database + HuggingFace AI

## Problem Statement

Manually scanning job descriptions to find best fit is tedious and keyword-dependent.
This tool embeds your resume and job descriptions into Endee's high-performance vector space,
then finds the most semantically similar opportunities — ranked by true relevance, not just keywords.

## System Architecture

Resume Text → HF Embeddings (384-dim) → Endee `resumes` index
Job Descriptions → HF Embeddings (384-dim) → Endee `jobs` index
Match Query → Endee cosine similarity search → Top-K results → AI explanation

## How Endee is Used

- Two separate Endee indexes: `resumes` and `jobs`
- Embedding dimension: 384 (sentence-transformers/all-MiniLM-L6-v2)
- Space type: cosine similarity for semantic matching
- Operations: `upsert` for ingestion, `query` for matching
- Endee provides sub-millisecond vector search with no external dependencies

## Tech Stack

| Layer      | Technology                              |
| ---------- | --------------------------------------- |
| Vector DB  | Endee (Docker)                          |
| Embeddings | HF all-MiniLM-L6-v2 (free)              |
| LLM        | HF Mistral-7B-Instruct (free)           |
| Backend    | Node.js + TypeScript + Express          |
| Frontend   | React + TypeScript + Vite + TailwindCSS |

## Setup & Run

1. Fork and clone this repo
2. Copy `.env.example` to `.env` and add your free HuggingFace token (huggingface.co/settings/tokens)
3. `docker compose up -d` (starts Endee on :8080)
4. `cd backend && npm install && npm run dev` (starts API on :3001)
5. `cd frontend && npm install && npm run dev` (starts UI on :5173)
6. Visit http://localhost:5173

## API Reference

| Method | Endpoint           | Description                         |
| ------ | ------------------ | ----------------------------------- |
| POST   | /api/resume/ingest | Embed and store resume in Endee     |
| POST   | /api/jobs/ingest   | Embed and store a job description   |
| POST   | /api/match         | Find top-K matching jobs for resume |
| GET    | /api/jobs          | List all ingested jobs              |
| GET    | /health            | Service health check                |

## Mandatory Endee Steps Completed

- [x] Starred the official Endee repo
- [x] Forked the repo to personal account
- [x] Built project on top of the forked repository

# PLAN.md — Resume-to-Job Matcher

## AI-Powered Semantic Job Matching using Endee Vector Database

> **Codex Instructions**: Read this entire file before writing a single line of code.
> Follow every section in order. Do not skip steps. Do not use OpenAI APIs anywhere.
> Use only free/open-source embedding models via HuggingFace Inference API (free tier).

---

## 0. What We're Building

A full-stack web app where a user pastes their resume text and a list of job descriptions.
The app embeds everything into **Endee** (vector DB), then semantically ranks which jobs
best match the resume — with an explanation of _why_ each job matches.

**Core flow:**

```
User pastes resume → embed → store in Endee (resume index)
User pastes job JDs → embed each → store in Endee (jobs index)
Click "Find Matches" → query Endee with resume vector → get top-K similar jobs → display ranked with match score + skill overlap
```

**Why this is impressive to evaluators:**

- Uses Endee for BOTH storing and querying vectors (not just as a toy)
- RAG layer: after finding matches, pulls job context and generates fit explanation
- Agentic touch: auto-extracts skills from resume before embedding
- Real use case with compelling demo data

---

## 1. Tech Stack

| Layer           | Choice                                                                    | Why                                        |
| --------------- | ------------------------------------------------------------------------- | ------------------------------------------ |
| Vector DB       | Endee (Docker)                                                            | Required by challenge                      |
| Embeddings      | HuggingFace `sentence-transformers/all-MiniLM-L6-v2` via HF Inference API | Free, 384-dim, excellent for semantic text |
| Backend         | Node.js + TypeScript + Express                                            | Raghul's core stack                        |
| Frontend        | React + TypeScript + Vite + TailwindCSS                                   | Raghul's core stack                        |
| AI Explanation  | HuggingFace `mistralai/Mistral-7B-Instruct-v0.3` via HF Inference API     | Free tier, great for text generation       |
| Package manager | npm                                                                       |                                            |
| Container       | Docker Compose (Endee only — app runs locally)                            |                                            |

**HuggingFace Free Tier**: Sign up at huggingface.co → Settings → Access Tokens → New token (read).
Store as `HF_API_TOKEN` in `.env`. Free tier gives ~1000 req/day — more than enough for demo.

---

## 2. Exact Project Structure

```
resume-job-matcher/
├── PLAN.md                   ← this file
├── README.md                 ← write last (template provided in Section 8)
├── docker-compose.yml        ← Endee service only
├── .env.example              ← template env vars (never commit .env)
├── .gitignore
├── package.json              ← root scripts
├── backend/
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts          ← Express server entry point
│       ├── routes/
│       │   ├── resume.ts     ← POST /api/resume/ingest
│       │   ├── jobs.ts       ← POST /api/jobs/ingest, GET /api/jobs
│       │   └── match.ts      ← POST /api/match
│       ├── services/
│       │   ├── endee.ts      ← Endee client wrapper (index creation, upsert, query)
│       │   ├── embeddings.ts ← HuggingFace embedding calls
│       │   └── explain.ts    ← HuggingFace LLM call for match explanation
│       └── utils/
│           └── skills.ts     ← simple skill extraction from text
├── frontend/
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── index.html
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       ├── components/
│       │   ├── ResumeInput.tsx    ← textarea for resume paste
│       │   ├── JobInput.tsx       ← add job descriptions one by one
│       │   ├── MatchResults.tsx   ← ranked job cards with scores
│       │   └── SkillBadges.tsx    ← skill tags extracted from resume
│       └── api/
│           └── client.ts          ← fetch wrapper for backend calls
└── demo/
    ├── sample_resume.txt     ← ready-to-paste resume for demo
    └── sample_jobs.json      ← 5 sample jobs to ingest
```

---

## 3. Environment Variables

Create `.env` in project root (never commit this):

```env
# HuggingFace (free tier - get token at huggingface.co/settings/tokens)
HF_API_TOKEN=hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Endee Vector DB
ENDEE_BASE_URL=http://localhost:8080
ENDEE_AUTH_TOKEN=

# Backend
PORT=3001
NODE_ENV=development

# Frontend (Vite)
VITE_API_BASE_URL=http://localhost:3001
```

Create `.env.example` with the same keys but empty values.

---

## 4. Docker Compose Setup

**File: `docker-compose.yml`** — runs Endee only (app runs natively)

```yaml
version: "3.8"

services:
    endee:
        image: endeeio/endee-server:latest
        container_name: endee-server
        ports:
            - "8080:8080"
        ulimits:
            nofile: 100000
        environment:
            NDD_NUM_THREADS: 0
            NDD_AUTH_TOKEN: ""
        volumes:
            - endee-data:/data
        restart: unless-stopped

volumes:
    endee-data:
```

Run with: `docker compose up -d`
Verify: `curl http://localhost:8080/api/v1/index/list`

---

## 5. Backend — Detailed Implementation

### 5.1 `backend/package.json`

```json
{
    "name": "resume-job-matcher-backend",
    "version": "1.0.0",
    "scripts": {
        "dev": "ts-node-dev --respawn src/index.ts",
        "build": "tsc",
        "start": "node dist/index.js"
    },
    "dependencies": {
        "cors": "^2.8.5",
        "dotenv": "^16.4.5",
        "endee": "^0.1.0",
        "express": "^4.18.2",
        "uuid": "^9.0.0"
    },
    "devDependencies": {
        "@types/cors": "^2.8.17",
        "@types/express": "^4.17.21",
        "@types/node": "^20.12.0",
        "@types/uuid": "^9.0.8",
        "ts-node-dev": "^2.0.0",
        "typescript": "^5.4.5"
    }
}
```

### 5.2 `backend/tsconfig.json`

```json
{
    "compilerOptions": {
        "target": "ES2020",
        "module": "commonjs",
        "lib": ["ES2020"],
        "outDir": "./dist",
        "rootDir": "./src",
        "strict": true,
        "esModuleInterop": true,
        "skipLibCheck": true,
        "forceConsistentCasingInFileNames": true,
        "resolveJsonModule": true
    },
    "include": ["src/**/*"],
    "exclude": ["node_modules", "dist"]
}
```

### 5.3 `backend/src/services/endee.ts`

```typescript
import { Endee, Precision } from "endee";
import dotenv from "dotenv";
dotenv.config();

// all-MiniLM-L6-v2 outputs 384 dimensions
const VECTOR_DIMENSION = 384;

let client: Endee | null = null;

export function getEndeeClient(): Endee {
    if (!client) {
        client = new Endee(process.env.ENDEE_AUTH_TOKEN || "");
        client.setBaseUrl(
            `${process.env.ENDEE_BASE_URL || "http://localhost:8080"}/api/v1`,
        );
    }
    return client;
}

export async function ensureIndexExists(indexName: string): Promise<void> {
    const c = getEndeeClient();
    try {
        await c.getIndex(indexName);
    } catch {
        await c.createIndex({
            name: indexName,
            dimension: VECTOR_DIMENSION,
            spaceType: "cosine",
            precision: Precision.INT8,
        });
        console.log(`[Endee] Created index: ${indexName}`);
    }
}

export async function upsertVector(
    indexName: string,
    id: string,
    vector: number[],
    meta: Record<string, unknown>,
): Promise<void> {
    await ensureIndexExists(indexName);
    const index = await getEndeeClient().getIndex(indexName);
    await index.upsert([{ id, vector, meta }]);
}

export async function queryVectors(
    indexName: string,
    vector: number[],
    topK: number,
): Promise<
    Array<{ id: string; similarity: number; meta: Record<string, unknown> }>
> {
    await ensureIndexExists(indexName);
    const index = await getEndeeClient().getIndex(indexName);
    const results = await index.query({ vector, topK });
    return results.map((r) => ({
        id: r.id,
        similarity: r.similarity,
        meta: r.meta as Record<string, unknown>,
    }));
}
```

### 5.4 `backend/src/services/embeddings.ts`

```typescript
// HuggingFace Inference API — free tier
// Model: sentence-transformers/all-MiniLM-L6-v2
// Output: 384-dimensional float vectors
// Free tier: ~1000 requests/day — enough for demo

const HF_EMBED_URL =
    "https://api-inference.huggingface.co/pipeline/feature-extraction/sentence-transformers/all-MiniLM-L6-v2";

export async function embed(text: string): Promise<number[]> {
    const response = await fetch(HF_EMBED_URL, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${process.env.HF_API_TOKEN}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            inputs: text,
            options: { wait_for_model: true },
        }),
    });

    if (!response.ok) {
        const err = await response.text();
        throw new Error(
            `HuggingFace embedding failed (${response.status}): ${err}`,
        );
    }

    const data = (await response.json()) as number[] | number[][];

    // HF returns nested array for sentence-transformers: [[0.1, 0.2, ...]]
    if (Array.isArray(data[0])) {
        return data[0] as number[];
    }
    return data as number[];
}

// Embeds a list of texts sequentially with a small delay to respect rate limits
export async function embedBatch(texts: string[]): Promise<number[][]> {
    const results: number[][] = [];
    for (const text of texts) {
        const vector = await embed(text);
        results.push(vector);
        await new Promise((r) => setTimeout(r, 250)); // 250ms between calls
    }
    return results;
}
```

### 5.5 `backend/src/services/explain.ts`

```typescript
// HuggingFace Inference API — free tier
// Model: mistralai/Mistral-7B-Instruct-v0.3
// Generates a 2-sentence explanation of why a job matches the resume

const HF_LLM_URL =
    "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.3";

export async function explainMatch(
    resumeSnippet: string,
    jobTitle: string,
    jobDescription: string,
    matchScore: number,
    sharedSkills: string[],
): Promise<string> {
    const prompt = `<s>[INST] You are a recruiter. Explain in exactly 2 sentences why this candidate matches this job. Be specific.

Candidate summary: ${resumeSnippet.slice(0, 400)}

Job: ${jobTitle}
Description: ${jobDescription.slice(0, 300)}
Match: ${(matchScore * 100).toFixed(0)}%
Shared skills: ${sharedSkills.join(", ")}

Write exactly 2 sentences. [/INST]`;

    try {
        const response = await fetch(HF_LLM_URL, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${process.env.HF_API_TOKEN}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                inputs: prompt,
                parameters: {
                    max_new_tokens: 120,
                    temperature: 0.4,
                    return_full_text: false,
                },
                options: { wait_for_model: true },
            }),
        });

        if (!response.ok) {
            return buildFallback(jobTitle, sharedSkills);
        }

        const data = (await response.json()) as Array<{
            generated_text: string;
        }>;
        return (data[0]?.generated_text || "").trim().slice(0, 300);
    } catch {
        // Fallback: never let LLM failure break match results
        return buildFallback(jobTitle, sharedSkills);
    }
}

function buildFallback(jobTitle: string, sharedSkills: string[]): string {
    const top = sharedSkills.slice(0, 3).join(", ");
    return `Your experience with ${top || "relevant technologies"} aligns well with this ${jobTitle} role. The semantic similarity between your resume and this job description indicates strong compatibility.`;
}
```

### 5.6 `backend/src/utils/skills.ts`

```typescript
const TECH_SKILLS = [
    "react",
    "typescript",
    "javascript",
    "node.js",
    "nodejs",
    "express",
    "python",
    "java",
    "golang",
    "rust",
    "c++",
    "sql",
    "postgresql",
    "mongodb",
    "redis",
    "docker",
    "kubernetes",
    "aws",
    "gcp",
    "azure",
    "git",
    "graphql",
    "rest",
    "api",
    "microservices",
    "tailwindcss",
    "css",
    "html",
    "next.js",
    "nextjs",
    "vue",
    "angular",
    "spring",
    "fastapi",
    "django",
    "flask",
    "machine learning",
    "deep learning",
    "nlp",
    "llm",
    "vector",
    "embedding",
    "ci/cd",
    "github actions",
    "linux",
    "bash",
    "websockets",
    "kafka",
    "data engineering",
    "data science",
    "ai",
    "ml",
    "rag",
    "langchain",
    "distributed systems",
    "system design",
    "real-time",
];

export function extractSkills(text: string): string[] {
    const lower = text.toLowerCase();
    return TECH_SKILLS.filter((skill) => lower.includes(skill));
}

export function getSharedSkills(resumeText: string, jobText: string): string[] {
    const resumeSkills = new Set(extractSkills(resumeText));
    const jobSkills = new Set(extractSkills(jobText));
    return [...resumeSkills].filter((s) => jobSkills.has(s));
}
```

### 5.7 `backend/src/routes/resume.ts`

```typescript
import { Router, Request, Response } from "express";
import { embed } from "../services/embeddings";
import { upsertVector } from "../services/endee";
import { extractSkills } from "../utils/skills";

const router = Router();

// POST /api/resume/ingest
// Body: { text: string }
router.post("/ingest", async (req: Request, res: Response) => {
    try {
        const { text } = req.body as { text: string };
        if (!text || text.trim().length < 50) {
            return res
                .status(400)
                .json({ error: "Resume text too short (min 50 chars)" });
        }

        const vector = await embed(text);
        const skills = extractSkills(text);

        await upsertVector("resumes", "current-resume", vector, {
            text: text.slice(0, 1000),
            skills,
            timestamp: new Date().toISOString(),
        });

        return res.json({
            success: true,
            skills,
            vectorDimension: vector.length,
            message: "Resume indexed in Endee successfully",
        });
    } catch (err) {
        console.error("[resume/ingest]", err);
        return res.status(500).json({ error: String(err) });
    }
});

export default router;
```

### 5.8 `backend/src/routes/jobs.ts`

```typescript
import { Router, Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { embed } from "../services/embeddings";
import { upsertVector } from "../services/endee";
import { extractSkills } from "../utils/skills";

const router = Router();

// In-memory job store (no DB needed for this demo)
export const jobStore: Record<
    string,
    {
        title: string;
        company: string;
        description: string;
        skills: string[];
    }
> = {};

// POST /api/jobs/ingest
router.post("/ingest", async (req: Request, res: Response) => {
    try {
        const { title, company, description } = req.body as {
            title: string;
            company: string;
            description: string;
        };

        if (!title || !description) {
            return res
                .status(400)
                .json({ error: "title and description are required" });
        }

        const id = uuidv4();
        const combinedText = `${title} at ${company || "Unknown Company"}. ${description}`;
        const vector = await embed(combinedText);
        const skills = extractSkills(combinedText);

        jobStore[id] = { title, company: company || "", description, skills };

        await upsertVector("jobs", id, vector, {
            title,
            company: company || "",
            description: description.slice(0, 500),
            skills,
        });

        return res.json({
            success: true,
            id,
            skills,
            jobCount: Object.keys(jobStore).length,
        });
    } catch (err) {
        console.error("[jobs/ingest]", err);
        return res.status(500).json({ error: String(err) });
    }
});

// GET /api/jobs
router.get("/", (req: Request, res: Response) => {
    const jobs = Object.entries(jobStore).map(([id, data]) => ({
        id,
        ...data,
    }));
    return res.json({ jobs, count: jobs.length });
});

export default router;
```

### 5.9 `backend/src/routes/match.ts`

```typescript
import { Router, Request, Response } from "express";
import { embed } from "../services/embeddings";
import { queryVectors, ensureIndexExists } from "../services/endee";
import { explainMatch } from "../services/explain";
import { getSharedSkills } from "../utils/skills";

const router = Router();

// POST /api/match
// Body: { resumeText: string, topK?: number }
router.post("/", async (req: Request, res: Response) => {
    try {
        const { resumeText, topK = 5 } = req.body as {
            resumeText: string;
            topK?: number;
        };

        if (!resumeText || resumeText.trim().length < 50) {
            return res
                .status(400)
                .json({ error: "Resume text required (min 50 chars)" });
        }

        const resumeVector = await embed(resumeText);

        await ensureIndexExists("jobs");
        const results = await queryVectors("jobs", resumeVector, topK);

        if (results.length === 0) {
            return res.json({
                matches: [],
                message:
                    "No jobs found. Please ingest some job descriptions first.",
            });
        }

        // Enrich with explanations (only top 3 to save HF API quota)
        const enrichedMatches = await Promise.all(
            results.map(async (result, index) => {
                const meta = result.meta as {
                    title: string;
                    company: string;
                    description: string;
                    skills: string[];
                };
                const sharedSkills = getSharedSkills(
                    resumeText,
                    meta.description || "",
                );

                let explanation = "";
                if (index < 3) {
                    explanation = await explainMatch(
                        resumeText,
                        meta.title,
                        meta.description,
                        result.similarity,
                        sharedSkills,
                    );
                }

                return {
                    id: result.id,
                    title: meta.title,
                    company: meta.company,
                    description: meta.description,
                    matchScore: parseFloat(
                        (result.similarity * 100).toFixed(1),
                    ),
                    sharedSkills,
                    explanation,
                    rank: index + 1,
                };
            }),
        );

        return res.json({
            matches: enrichedMatches,
            total: enrichedMatches.length,
        });
    } catch (err) {
        console.error("[match]", err);
        return res.status(500).json({ error: String(err) });
    }
});

export default router;
```

### 5.10 `backend/src/index.ts`

```typescript
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import resumeRoutes from "./routes/resume";
import jobRoutes from "./routes/jobs";
import matchRoutes from "./routes/match";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: "*" }));
app.use(express.json({ limit: "10mb" }));

// Health check — verify Endee connection
app.get("/health", (req, res) => {
    res.json({
        status: "ok",
        endeeUrl: process.env.ENDEE_BASE_URL,
        timestamp: new Date().toISOString(),
    });
});

app.use("/api/resume", resumeRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/match", matchRoutes);

app.listen(PORT, () => {
    console.log(`Backend running at http://localhost:${PORT}`);
    console.log(
        `Endee vector DB at: ${process.env.ENDEE_BASE_URL || "http://localhost:8080"}`,
    );
});
```

---

## 6. Frontend — Detailed Implementation

### 6.1 `frontend/package.json`

```json
{
    "name": "resume-job-matcher-frontend",
    "version": "1.0.0",
    "scripts": {
        "dev": "vite",
        "build": "tsc && vite build",
        "preview": "vite preview"
    },
    "dependencies": {
        "react": "^18.2.0",
        "react-dom": "^18.2.0"
    },
    "devDependencies": {
        "@types/react": "^18.2.0",
        "@types/react-dom": "^18.2.0",
        "@vitejs/plugin-react": "^4.2.1",
        "autoprefixer": "^10.4.19",
        "postcss": "^8.4.38",
        "tailwindcss": "^3.4.3",
        "typescript": "^5.4.5",
        "vite": "^5.2.0"
    }
}
```

### 6.2 App Architecture (3-step wizard)

**Step 1 — Resume Input**

- Large textarea: "Paste your resume here"
- Submit → POST `/api/resume/ingest`
- Show extracted skills as colorful badges
- Show "✓ Resume indexed in Endee" with green checkmark

**Step 2 — Add Jobs**

- Form: Title, Company, Description fields
- "Add Job" button → POST `/api/jobs/ingest`
- List of added jobs grows below form
- Require at least 1 job; show count badge

**Step 3 — Match Results**

- "Find Best Matches" button → POST `/api/match`
- Loading spinner while matching
- Ranked cards showing:
    - Rank badge (1st, 2nd, 3rd...)
    - Job title + company name
    - Match score (large %, color coded: ≥70 green, 50-69 yellow, <50 gray)
    - Shared skills as small badges
    - AI explanation in italic text (only top 3)
- Footer: "Powered by Endee Vector Database"

### 6.3 `frontend/src/api/client.ts`

```typescript
const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

export interface IngestResumeResponse {
    success: boolean;
    skills: string[];
    vectorDimension: number;
    message: string;
}

export interface IngestJobResponse {
    success: boolean;
    id: string;
    skills: string[];
    jobCount: number;
}

export interface Match {
    id: string;
    title: string;
    company: string;
    description: string;
    matchScore: number;
    sharedSkills: string[];
    explanation: string;
    rank: number;
}

export interface MatchResponse {
    matches: Match[];
    total: number;
    message?: string;
}

export async function ingestResume(
    text: string,
): Promise<IngestResumeResponse> {
    const res = await fetch(`${BASE_URL}/api/resume/ingest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
}

export async function ingestJob(
    title: string,
    company: string,
    description: string,
): Promise<IngestJobResponse> {
    const res = await fetch(`${BASE_URL}/api/jobs/ingest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, company, description }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
}

export async function findMatches(
    resumeText: string,
    topK = 5,
): Promise<MatchResponse> {
    const res = await fetch(`${BASE_URL}/api/match`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeText, topK }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
}
```

### 6.4 `frontend/src/App.tsx` — State Shape

```typescript
// App manages these state variables:
// step: 1 | 2 | 3
// resumeText: string
// resumeSkills: string[]
// jobs: Array<{ id: string; title: string; company: string }>
// matches: Match[]
// loading: boolean
// error: string | null

// Step transitions:
// 1 → 2: after successful resume ingest
// 2 → 3: after clicking "Find Matches" and getting results
// Can go back using a stepper nav at top
```

### 6.5 Visual Design Requirements

- Dark background: `#0f1117` (deep dark navy)
- Card background: `#1a1d27`
- Accent color: `#6366f1` (indigo) — matches Endee's purple branding
- Green score: `#10b981`, Yellow: `#f59e0b`, Gray: `#6b7280`
- Font: Use `font-mono` for scores and IDs, `font-sans` for regular text
- Step indicator at top showing 3 steps with active/done states
- Smooth transitions between steps
- Mobile responsive

---

## 7. Root `package.json`

```json
{
    "name": "resume-job-matcher",
    "version": "1.0.0",
    "private": true,
    "scripts": {
        "install:all": "cd backend && npm install && cd ../frontend && npm install",
        "dev:backend": "cd backend && npm run dev",
        "dev:frontend": "cd frontend && npm run dev",
        "build:backend": "cd backend && npm run build",
        "build:frontend": "cd frontend && npm run build",
        "docker:up": "docker compose up -d",
        "docker:down": "docker compose down",
        "docker:logs": "docker logs -f endee-server"
    }
}
```

**Startup order:**

1. `npm run docker:up` → Endee on :8080
2. `npm run dev:backend` → Express on :3001
3. `npm run dev:frontend` → Vite on :5173
4. Open http://localhost:5173

---

## 8. `demo/` Folder Contents

### `demo/sample_resume.txt`

```
Full Stack Software Engineer with 2 years of experience building production-grade web applications.
Core stack: React, TypeScript, Node.js, Express, PostgreSQL, MongoDB, Redis.
Built real-time collaborative tools using WebSockets. Designed REST APIs serving 10K+ requests/day.
Docker and GitHub Actions for CI/CD. Familiar with distributed systems and microservices patterns.
Data engineering internship: Python, SQL, ETL pipelines. AWS S3 and Lambda basics.
Strong problem-solving background; competitive programming and system design experience.
```

### `demo/sample_jobs.json`

```json
[
    {
        "title": "Frontend Engineer",
        "company": "Atlassian",
        "description": "Build scalable UI components in React and TypeScript. 2+ years with modern JavaScript frameworks. GraphQL and REST API experience required. Bonus: performance optimization, accessibility."
    },
    {
        "title": "Backend Engineer",
        "company": "Razorpay",
        "description": "Node.js engineer for payment infrastructure. PostgreSQL and Redis required. Microservices, Docker, and high-throughput API design. 2+ years backend experience."
    },
    {
        "title": "Data Engineer",
        "company": "Flipkart",
        "description": "Python and SQL for large-scale data pipelines. Distributed systems, Kafka, AWS S3. ETL experience essential. Strong analytical thinking required."
    },
    {
        "title": "Full Stack Developer",
        "company": "Zepto",
        "description": "React + Node.js for fast-growing startup. TypeScript, PostgreSQL, Docker required. Real-time features and WebSockets experience a strong plus."
    },
    {
        "title": "ML Engineer",
        "company": "Sarvam AI",
        "description": "Python and deep learning for NLP/LLM projects. Model deployment via REST APIs. Familiarity with embeddings, vector search, and RAG architectures preferred."
    }
]
```

---

## 9. README Template (Write This Last)

```markdown
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
```

---

## 10. Codex Execution Checklist

Complete in this exact order:

- [ ] Create root `package.json`
- [ ] Create `docker-compose.yml`
- [ ] Create `.env.example`
- [ ] Create `.gitignore` (include: `node_modules`, `.env`, `dist`, `build`, `.DS_Store`)
- [ ] Create `backend/` with all files from Section 5 (5.1 through 5.10)
- [ ] Create `frontend/` with Vite + React + Tailwind config
- [ ] Implement all frontend components from Section 6
- [ ] Create `demo/` folder with `sample_resume.txt` and `sample_jobs.json`
- [ ] Run `npm install` in backend and frontend
- [ ] Verify TypeScript compiles with `npx tsc --noEmit` in backend (0 errors)
- [ ] Write `README.md` using template from Section 8

**Definition of done:** `docker compose up -d` + both dev servers running → user can paste resume, add jobs, and see ranked matches at http://localhost:5173.

---

## 11. Hard Rules for Codex

1. Never use `openai` npm package or `api.openai.com` anywhere
2. Never use `langchain` — implement everything directly
3. The HuggingFace URL in section 5.4 is exact — do not change it
4. All Endee operations must go through `backend/src/services/endee.ts`
5. Every route must return `{ error: string }` on failure — no uncaught crashes
6. Vector dimension is exactly **384** — hardcoded, not configurable
7. The `explainMatch` function must have a fallback — match results must work even if the LLM call fails
8. Frontend must work fully before adding any animations or polish
9. No `<form>` HTML tags in React — use `onClick` handlers only
10. All fetch calls in frontend must go through `frontend/src/api/client.ts`

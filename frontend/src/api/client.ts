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

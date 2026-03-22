import { useState } from "react";
import {
    findMatches,
    ingestJob,
    ingestResume,
    type Match,
} from "./api/client";
import JobInput, { type AddedJob } from "./components/JobInput";
import MatchResults from "./components/MatchResults";
import ResumeInput from "./components/ResumeInput";

type Step = 1 | 2 | 3;

const STEPS: Array<{ id: Step; label: string }> = [
    { id: 1, label: "Resume" },
    { id: 2, label: "Jobs" },
    { id: 3, label: "Matches" },
];

function getStepState(currentStep: Step, step: Step): "done" | "active" | "idle" {
    if (step < currentStep) {
        return "done";
    }
    if (step === currentStep) {
        return "active";
    }
    return "idle";
}

export default function App() {
    const [step, setStep] = useState<Step>(1);
    const [resumeText, setResumeText] = useState("");
    const [resumeSkills, setResumeSkills] = useState<string[]>([]);
    const [jobs, setJobs] = useState<AddedJob[]>([]);
    const [matches, setMatches] = useState<Match[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleResumeSubmit() {
        setLoading(true);
        setError(null);

        try {
            const response = await ingestResume(resumeText);
            setResumeSkills(response.skills);
            setStep(2);
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        } finally {
            setLoading(false);
        }
    }

    async function handleAddJob(
        title: string,
        company: string,
        description: string,
    ) {
        setLoading(true);
        setError(null);

        try {
            const response = await ingestJob(title, company, description);
            setJobs((current) => [
                ...current,
                {
                    id: response.id,
                    title,
                    company,
                },
            ]);
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        } finally {
            setLoading(false);
        }
    }

    async function handleFindMatches() {
        setLoading(true);
        setError(null);

        try {
            const response = await findMatches(resumeText);
            setMatches(response.matches);
            setStep(3);
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="min-h-screen bg-[#0f1117] px-4 py-8 font-sans text-white sm:px-6 lg:px-8">
            <div className="mx-auto max-w-6xl">
                <header className="mb-8">
                    <p className="text-sm uppercase tracking-[0.35em] text-indigo-300">
                        Resume Job Matcher
                    </p>
                    <h1 className="mt-3 text-4xl font-semibold tracking-tight">
                        Semantic job matching with Endee
                    </h1>
                    <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
                        Paste a resume, ingest job descriptions, and rank the
                        strongest matches with vector search and AI explanations.
                    </p>
                </header>

                <nav className="mb-8 grid gap-3 md:grid-cols-3">
                    {STEPS.map((item) => {
                        const state = getStepState(step, item.id);
                        const isClickable =
                            item.id === 1 ||
                            (item.id === 2 && resumeSkills.length > 0) ||
                            (item.id === 3 && matches.length > 0);

                        return (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => {
                                    if (isClickable) {
                                        setStep(item.id);
                                        setError(null);
                                    }
                                }}
                                disabled={!isClickable}
                                className={`rounded-2xl border px-4 py-4 text-left transition ${
                                    state === "active"
                                        ? "border-[#6366f1] bg-[#1a1d27] shadow-[0_0_0_1px_rgba(99,102,241,0.35)]"
                                        : state === "done"
                                          ? "border-emerald-500/30 bg-[#1a1d27]"
                                          : "border-slate-800 bg-[#1a1d27]/60"
                                } disabled:cursor-not-allowed disabled:opacity-70`}
                            >
                                <div className="flex items-center gap-3">
                                    <span
                                        className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold ${
                                            state === "active"
                                                ? "bg-[#6366f1] text-white"
                                                : state === "done"
                                                  ? "bg-emerald-500 text-white"
                                                  : "bg-slate-800 text-slate-300"
                                        }`}
                                    >
                                        {state === "done" ? "✓" : item.id}
                                    </span>
                                    <div>
                                        <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
                                            Step {item.id}
                                        </p>
                                        <p className="mt-1 text-lg font-medium">
                                            {item.label}
                                        </p>
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </nav>

                {step === 1 ? (
                    <ResumeInput
                        resumeText={resumeText}
                        skills={resumeSkills}
                        loading={loading}
                        error={error}
                        onResumeTextChange={setResumeText}
                        onSubmit={handleResumeSubmit}
                    />
                ) : null}

                {step === 2 ? (
                    <div className="space-y-6">
                        <ResumeInput
                            resumeText={resumeText}
                            skills={resumeSkills}
                            loading={false}
                            error={null}
                            onResumeTextChange={setResumeText}
                            onSubmit={handleResumeSubmit}
                        />
                        <JobInput
                            jobs={jobs}
                            loading={loading}
                            error={error}
                            onAddJob={handleAddJob}
                        />
                        <div className="rounded-2xl bg-[#1a1d27] p-6 shadow-xl">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <h2 className="text-xl font-semibold">
                                        Ready to match
                                    </h2>
                                    <p className="mt-2 text-sm text-slate-300">
                                        Add at least one job description, then
                                        move to step 3.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleFindMatches}
                                    disabled={loading || jobs.length === 0}
                                    className="rounded-xl bg-[#6366f1] px-4 py-2 font-medium text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {loading ? "Matching..." : "Find Best Matches"}
                                </button>
                            </div>
                        </div>
                    </div>
                ) : null}

                {step === 3 ? (
                    <div className="space-y-6">
                        <div className="rounded-2xl bg-[#1a1d27] p-6 shadow-xl">
                            <div className="flex flex-wrap items-center justify-between gap-4">
                                <div>
                                    <h2 className="text-xl font-semibold">
                                        Matching summary
                                    </h2>
                                    <p className="mt-2 text-sm text-slate-300">
                                        {jobs.length} job{jobs.length === 1 ? "" : "s"} ingested and{" "}
                                        {matches.length} match{matches.length === 1 ? "" : "es"} returned.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setStep(2)}
                                    className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-slate-500"
                                >
                                    Back to Jobs
                                </button>
                            </div>
                        </div>
                        <MatchResults
                            resumeText={resumeText}
                            matches={matches}
                            loading={loading}
                            error={error}
                            onFindMatches={handleFindMatches}
                        />
                    </div>
                ) : null}
            </div>
        </main>
    );
}

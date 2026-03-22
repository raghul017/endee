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

function inferSkillCount(text: string): number {
    const normalized = text.toLowerCase();
    const terms = [
        "react",
        "typescript",
        "node.js",
        "nodejs",
        "postgresql",
        "docker",
        "redis",
        "microservices",
        "websockets",
        "real-time",
        "api",
    ];

    return terms.filter((term) => normalized.includes(term)).length;
}

function getStepState(currentStep: Step, step: Step): "done" | "active" | "idle" {
    if (step < currentStep) {
        return "done";
    }
    if (step === currentStep) {
        return "active";
    }
    return "idle";
}

function getLoadingLabel(step: Step): string {
    if (step === 1) {
        return "Analyzing";
    }
    if (step === 2) {
        return "Adding";
    }
    return "Analyzing";
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
                    skillCount: inferSkillCount(
                        `${title} ${company} ${description}`.trim(),
                    ),
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
            const response = await findMatches(resumeText, 5);
            setMatches(response.matches);
            setStep(3);
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="app-shell">
            <div className="container">
                <header className="page-header">
                    <p className="eyebrow">Resume Job Matcher</p>
                    <h1 className="display-title">
                        Semantic matching for developers who care about signal.
                    </h1>
                    <p className="page-copy">
                        Paste a resume, ingest a small set of roles, and rank
                        the strongest fit using Endee vector search with
                        explanation generation on top.
                    </p>
                </header>

                <nav
                    className="stepper"
                    aria-label="Workflow steps"
                >
                    <div className="stepper-line" aria-hidden="true" />
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
                                className="stepper-item"
                                disabled={!isClickable}
                                onClick={() => {
                                    if (isClickable) {
                                        setStep(item.id);
                                        setError(null);
                                    }
                                }}
                            >
                                <span
                                    className={`stepper-dot stepper-dot--${state}`}
                                    aria-hidden="true"
                                >
                                    {state === "done" ? "✓" : item.id}
                                </span>
                                <span className="stepper-label">{item.label}</span>
                            </button>
                        );
                    })}
                </nav>

                <section className="section-stack">
                    {step === 1 ? (
                        <ResumeInput
                            resumeText={resumeText}
                            skills={resumeSkills}
                            loading={loading}
                            error={error}
                            onResumeTextChange={setResumeText}
                            onSubmit={handleResumeSubmit}
                            loadingLabel={getLoadingLabel(1)}
                        />
                    ) : null}

                    {step === 2 ? (
                        <>
                            <ResumeInput
                                resumeText={resumeText}
                                skills={resumeSkills}
                                loading={false}
                                error={null}
                                onResumeTextChange={setResumeText}
                                onSubmit={handleResumeSubmit}
                                loadingLabel={getLoadingLabel(1)}
                            />
                            <JobInput
                                jobs={jobs}
                                loading={loading}
                                error={error}
                                onAddJob={handleAddJob}
                                loadingLabel={getLoadingLabel(2)}
                            />
                            <section className="panel">
                                <div className="panel-row">
                                    <div>
                                        <h2 className="panel-title">
                                            Ready to compare
                                        </h2>
                                        <p className="panel-copy">
                                            Add at least one job, then rank the
                                            strongest matches against your
                                            indexed resume.
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        className="button button--primary"
                                        disabled={loading || jobs.length === 0}
                                        onClick={handleFindMatches}
                                    >
                                        {loading ? "Analyzing···" : "Find matches"}
                                    </button>
                                </div>
                            </section>
                        </>
                    ) : null}

                    {step === 3 ? (
                        <>
                            <section className="panel">
                                <div className="panel-row">
                                    <div>
                                        <h2 className="panel-title">
                                            Matching summary
                                        </h2>
                                        <p className="panel-copy">
                                            {jobs.length} saved role
                                            {jobs.length === 1 ? "" : "s"} and{" "}
                                            {matches.length} ranked match
                                            {matches.length === 1 ? "" : "es"}.
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        className="button button--ghost"
                                        onClick={() => {
                                            setStep(2);
                                            setError(null);
                                        }}
                                    >
                                        Edit jobs
                                    </button>
                                </div>
                            </section>
                            <MatchResults
                                resumeText={resumeText}
                                matches={matches}
                                loading={loading}
                                error={error}
                                onFindMatches={handleFindMatches}
                            />
                        </>
                    ) : null}
                </section>
            </div>
        </main>
    );
}

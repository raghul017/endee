import { useState } from "react";

export interface AddedJob {
    id: string;
    title: string;
    company: string;
    skillCount?: number;
}

interface JobInputProps {
    jobs: AddedJob[];
    loading: boolean;
    error: string | null;
    onAddJob: (title: string, company: string, description: string) => void;
    loadingLabel: string;
}

export default function JobInput({
    jobs,
    loading,
    error,
    onAddJob,
    loadingLabel,
}: JobInputProps) {
    const [title, setTitle] = useState("");
    const [company, setCompany] = useState("");
    const [description, setDescription] = useState("");

    function handleAddJob() {
        onAddJob(title, company, description);
        setTitle("");
        setCompany("");
        setDescription("");
    }

    return (
        <section className="panel">
            <div className="section-heading">
                <h2 className="editorial-heading">Add target roles</h2>
                <p className="section-copy">
                    Build a short comparison set. The strongest semantic matches
                    will rise to the top.
                </p>
            </div>

            <div className="jobs-grid">
                <div className="job-form">
                    <div className="field-group">
                        <label className="field-label" htmlFor="job-title">
                            Title
                        </label>
                        <input
                            id="job-title"
                            value={title}
                            onChange={(event) => setTitle(event.target.value)}
                            placeholder="Full Stack Developer"
                            className={`text-input ${error ? "is-error" : ""}`}
                        />
                    </div>

                    <div className="field-group">
                        <label className="field-label" htmlFor="job-company">
                            Company
                        </label>
                        <input
                            id="job-company"
                            value={company}
                            onChange={(event) => setCompany(event.target.value)}
                            placeholder="Zepto"
                            className={`text-input ${error ? "is-error" : ""}`}
                        />
                    </div>

                    <div className="field-group">
                        <label
                            className="field-label"
                            htmlFor="job-description"
                        >
                            Description
                        </label>
                        <textarea
                            id="job-description"
                            value={description}
                            onChange={(event) =>
                                setDescription(event.target.value)
                            }
                            placeholder="React, Node.js, TypeScript, PostgreSQL, Docker, WebSockets, real-time systems..."
                            className={`text-input text-area text-area--job ${
                                error ? "is-error" : ""
                            }`}
                        />
                        {error ? <p className="field-error">{error}</p> : null}
                    </div>

                    <div className="job-form-footer">
                        <button
                            type="button"
                            className="button button--primary button--mobile-full"
                            onClick={handleAddJob}
                            disabled={loading}
                        >
                            {loading ? `${loadingLabel}···` : "Add job"}
                        </button>
                    </div>
                </div>

                <div className="jobs-list">
                    <div className="jobs-list-header">
                        <p className="meta-label">Added jobs</p>
                        <span className="meta-inline">
                            {jobs.length} total
                        </span>
                    </div>

                    {jobs.length === 0 ? (
                        <p className="empty-copy">
                            Saved roles will appear here once you start adding
                            them.
                        </p>
                    ) : (
                        <div>
                            {jobs.map((job) => (
                                <div key={job.id} className="job-row">
                                    <div className="job-row-main">
                                        <p className="job-row-title">
                                            {job.title}
                                        </p>
                                        <p className="job-row-company">
                                            {job.company || "Unknown Company"}
                                        </p>
                                    </div>
                                    <div className="job-row-side">
                                        <span className="skill-count-badge">
                                            {(job.skillCount ?? 0)
                                                .toString()}{" "}
                                            skills
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}

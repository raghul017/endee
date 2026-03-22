import { useState } from "react";

export interface AddedJob {
    id: string;
    title: string;
    company: string;
}

interface JobInputProps {
    jobs: AddedJob[];
    loading: boolean;
    error: string | null;
    onAddJob: (title: string, company: string, description: string) => void;
}

export default function JobInput({
    jobs,
    loading,
    error,
    onAddJob,
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
        <section className="rounded-2xl bg-[#1a1d27] p-6 text-white shadow-xl">
            <div className="mb-4 flex items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-semibold">Step 2: Add Jobs</h2>
                    <p className="mt-2 text-sm text-slate-300">
                        Add jobs one by one. At least 1 job is required before
                        matching.
                    </p>
                </div>
                <span className="rounded-full bg-indigo-500/20 px-3 py-1 text-sm text-indigo-200">
                    {jobs.length} job{jobs.length === 1 ? "" : "s"}
                </span>
            </div>

            <div className="space-y-3">
                <input
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="Job title"
                    className="w-full rounded-xl border border-slate-700 bg-[#0f1117] px-4 py-3 text-sm text-white outline-none transition focus:border-indigo-500"
                />
                <input
                    value={company}
                    onChange={(event) => setCompany(event.target.value)}
                    placeholder="Company"
                    className="w-full rounded-xl border border-slate-700 bg-[#0f1117] px-4 py-3 text-sm text-white outline-none transition focus:border-indigo-500"
                />
                <textarea
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    placeholder="Job description"
                    className="min-h-48 w-full rounded-xl border border-slate-700 bg-[#0f1117] p-4 text-sm text-white outline-none transition focus:border-indigo-500"
                />
            </div>

            <div className="mt-4">
                <button
                    type="button"
                    onClick={handleAddJob}
                    disabled={loading}
                    className="rounded-xl bg-indigo-500 px-4 py-2 font-medium text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {loading ? "Adding..." : "Add Job"}
                </button>
            </div>

            {error ? (
                <p className="mt-3 text-sm text-red-400">{error}</p>
            ) : null}

            {jobs.length > 0 ? (
                <div className="mt-6 space-y-3">
                    <h3 className="text-sm font-medium text-slate-200">
                        Added Jobs
                    </h3>
                    <div className="space-y-3">
                        {jobs.map((job) => (
                            <div
                                key={job.id}
                                className="rounded-xl border border-slate-800 bg-[#0f1117] p-4"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <p className="font-medium text-white">
                                            {job.title}
                                        </p>
                                        <p className="text-sm text-slate-400">
                                            {job.company || "Unknown Company"}
                                        </p>
                                    </div>
                                    <span className="font-mono text-xs text-slate-500">
                                        {job.id.slice(0, 8)}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : null}
        </section>
    );
}

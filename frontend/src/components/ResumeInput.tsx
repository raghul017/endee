import SkillBadges from "./SkillBadges";

interface ResumeInputProps {
    resumeText: string;
    skills: string[];
    loading: boolean;
    error: string | null;
    onResumeTextChange: (value: string) => void;
    onSubmit: () => void;
}

export default function ResumeInput({
    resumeText,
    skills,
    loading,
    error,
    onResumeTextChange,
    onSubmit,
}: ResumeInputProps) {
    return (
        <section className="rounded-2xl bg-[#1a1d27] p-6 text-white shadow-xl">
            <div className="mb-4">
                <h2 className="text-2xl font-semibold">Step 1: Resume Input</h2>
                <p className="mt-2 text-sm text-slate-300">
                    Paste your resume here and index it in Endee before adding
                    jobs.
                </p>
            </div>

            <textarea
                value={resumeText}
                onChange={(event) => onResumeTextChange(event.target.value)}
                placeholder="Paste your resume here"
                className="min-h-64 w-full rounded-xl border border-slate-700 bg-[#0f1117] p-4 text-sm text-white outline-none transition focus:border-indigo-500"
            />

            <div className="mt-4 flex items-center gap-3">
                <button
                    type="button"
                    onClick={onSubmit}
                    disabled={loading}
                    className="rounded-xl bg-indigo-500 px-4 py-2 font-medium text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {loading ? "Indexing..." : "Submit Resume"}
                </button>
                {skills.length > 0 && !loading && !error ? (
                    <span className="text-sm text-emerald-400">
                        ✓ Resume indexed in Endee
                    </span>
                ) : null}
            </div>

            {error ? (
                <p className="mt-3 text-sm text-red-400">{error}</p>
            ) : null}

            {skills.length > 0 ? (
                <div className="mt-5 space-y-3">
                    <h3 className="text-sm font-medium text-slate-200">
                        Extracted Skills
                    </h3>
                    <SkillBadges skills={skills} />
                </div>
            ) : null}
        </section>
    );
}

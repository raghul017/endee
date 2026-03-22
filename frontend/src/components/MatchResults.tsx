import { type Match } from "../api/client";
import SkillBadges from "./SkillBadges";

interface MatchResultsProps {
    resumeText: string;
    matches: Match[];
    loading: boolean;
    error: string | null;
    onFindMatches: () => void;
}

function getScoreColor(score: number): string {
    if (score >= 70) {
        return "text-emerald-400";
    }
    if (score >= 50) {
        return "text-amber-400";
    }
    return "text-slate-400";
}

function getRankLabel(rank: number): string {
    if (rank === 1) {
        return "1st";
    }
    if (rank === 2) {
        return "2nd";
    }
    if (rank === 3) {
        return "3rd";
    }
    return `${rank}th`;
}

export default function MatchResults({
    resumeText,
    matches,
    loading,
    error,
    onFindMatches,
}: MatchResultsProps) {
    return (
        <section className="rounded-2xl bg-[#1a1d27] p-6 text-white shadow-xl">
            <div className="mb-4">
                <h2 className="text-2xl font-semibold">
                    Step 3: Match Results
                </h2>
                <p className="mt-2 text-sm text-slate-300">
                    Find the best matching roles for the indexed resume.
                </p>
            </div>

            <button
                type="button"
                onClick={onFindMatches}
                disabled={loading || resumeText.trim().length < 50}
                className="rounded-xl bg-indigo-500 px-4 py-2 font-medium text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
                {loading ? "Matching..." : "Find Best Matches"}
            </button>

            {loading ? (
                <div className="mt-4 flex items-center gap-3 text-sm text-slate-300">
                    <span className="inline-block h-3 w-3 animate-pulse rounded-full bg-indigo-400"></span>
                    Loading matches...
                </div>
            ) : null}

            {error ? (
                <p className="mt-3 text-sm text-red-400">{error}</p>
            ) : null}

            {matches.length > 0 ? (
                <div className="mt-6 space-y-4">
                    {matches.map((match) => (
                        <article
                            key={match.id}
                            className="rounded-2xl border border-slate-800 bg-[#0f1117] p-5"
                        >
                            <div className="flex flex-wrap items-start justify-between gap-4">
                                <div className="space-y-2">
                                    <span className="inline-flex rounded-full bg-indigo-500/20 px-3 py-1 text-xs font-medium text-indigo-200">
                                        {getRankLabel(match.rank)}
                                    </span>
                                    <div>
                                        <h3 className="text-xl font-semibold">
                                            {match.title}
                                        </h3>
                                        <p className="text-sm text-slate-400">
                                            {match.company}
                                        </p>
                                    </div>
                                </div>
                                <div
                                    className={`font-mono text-3xl font-semibold ${getScoreColor(
                                        match.matchScore,
                                    )}`}
                                >
                                    {match.matchScore}%
                                </div>
                            </div>

                            <p className="mt-4 text-sm leading-6 text-slate-300">
                                {match.description}
                            </p>

                            <div className="mt-4">
                                <SkillBadges skills={match.sharedSkills} />
                            </div>

                            {match.explanation ? (
                                <p className="mt-4 italic text-slate-300">
                                    {match.explanation}
                                </p>
                            ) : null}
                        </article>
                    ))}
                </div>
            ) : null}

            <p className="mt-6 text-center text-xs uppercase tracking-[0.3em] text-slate-500">
                Powered by Endee Vector Database
            </p>
        </section>
    );
}

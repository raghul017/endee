import { type Match } from "../api/client";
import SkillBadges from "./SkillBadges";

interface MatchResultsProps {
    resumeText: string;
    matches: Match[];
    loading: boolean;
    error: string | null;
    onFindMatches: () => void;
}

function getScoreTone(score: number): "green" | "yellow" | "neutral" {
    if (score > 70) {
        return "green";
    }
    if (score >= 50) {
        return "yellow";
    }
    return "neutral";
}

function getRankLabel(rank: number): string {
    return rank.toString().padStart(2, "0");
}

export default function MatchResults({
    resumeText,
    matches,
    loading,
    error,
    onFindMatches,
}: MatchResultsProps) {
    return (
        <section className="panel">
            <div className="results-header">
                <div>
                    <h2 className="editorial-heading">Top matches</h2>
                    <p className="section-copy">
                        {matches.length} result{matches.length === 1 ? "" : "s"}{" "}
                        ranked against the current resume vector.
                    </p>
                </div>
                <button
                    type="button"
                    className="button button--primary"
                    disabled={loading || resumeText.trim().length < 50}
                    onClick={onFindMatches}
                >
                    {loading ? "Analyzing···" : "Refresh ranking"}
                </button>
            </div>

            {error ? <p className="field-error">{error}</p> : null}

            {matches.length === 0 && !loading ? (
                <p className="empty-copy">
                    No matches yet. Run the ranking step once you have added a
                    few jobs.
                </p>
            ) : null}

            <div className="matches-list">
                {matches.map((match, index) => {
                    const tone = getScoreTone(match.matchScore);

                    return (
                        <article
                            key={match.id}
                            className={`match-card match-card--${tone}`}
                            style={
                                {
                                    animationDelay: `${index * 80}ms`,
                                } as React.CSSProperties
                            }
                        >
                            <span className="match-rank">
                                {getRankLabel(match.rank)}
                            </span>
                            <div className="match-card-header">
                                <div className="match-meta">
                                    <h3 className="match-title">
                                        {match.title}
                                    </h3>
                                    <p className="match-company">
                                        {match.company}
                                    </p>
                                </div>
                                <div className={`match-score match-score--${tone}`}>
                                    {match.matchScore}%
                                </div>
                            </div>

                            <p className="match-description">
                                {match.description}
                            </p>

                            <SkillBadges skills={match.sharedSkills} />

                            {match.explanation ? (
                                <p className="match-explanation">
                                    {match.explanation}
                                </p>
                            ) : null}
                        </article>
                    );
                })}
            </div>
        </section>
    );
}

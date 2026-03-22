import SkillBadges from "./SkillBadges";

interface ResumeInputProps {
    resumeText: string;
    skills: string[];
    loading: boolean;
    error: string | null;
    onResumeTextChange: (value: string) => void;
    onSubmit: () => void;
    loadingLabel: string;
}

export default function ResumeInput({
    resumeText,
    skills,
    loading,
    error,
    onResumeTextChange,
    onSubmit,
    loadingLabel,
}: ResumeInputProps) {
    return (
        <section className="panel">
            <div className="section-heading">
                <h2 className="editorial-heading">Paste your resume</h2>
                <p className="section-copy">
                    We&apos;ll extract your skills and index them as vectors in
                    Endee
                </p>
            </div>

            <div className="field-group">
                <textarea
                    value={resumeText}
                    onChange={(event) => onResumeTextChange(event.target.value)}
                    placeholder="Paste your resume here"
                    className={`text-input text-area ${error ? "is-error" : ""}`}
                />
                {error ? <p className="field-error">{error}</p> : null}
            </div>

            <div className="section-actions">
                <button
                    type="button"
                    className="button button--primary"
                    onClick={onSubmit}
                    disabled={loading}
                >
                    {loading ? `${loadingLabel}···` : "Index resume"}
                </button>
            </div>

            {skills.length > 0 && !error ? (
                <>
                    <div className="status-banner status-banner--success">
                        <span className="status-mark">✓</span>
                        <span>Indexed in Endee</span>
                        <span className="status-divider">·</span>
                        <span>384-dim vector</span>
                        <span className="status-divider">·</span>
                        <span>cosine similarity</span>
                    </div>

                    <div className="skills-section">
                        <p className="meta-label">Extracted skills</p>
                        <SkillBadges skills={skills} />
                    </div>
                </>
            ) : null}
        </section>
    );
}

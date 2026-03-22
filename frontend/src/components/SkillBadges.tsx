interface SkillBadgesProps {
    skills: string[];
}

export default function SkillBadges({ skills }: SkillBadgesProps) {
    if (skills.length === 0) {
        return null;
    }

    return (
        <div className="tag-list">
            {skills.map((skill) => (
                <span key={skill} className="tag">
                    {skill}
                </span>
            ))}
        </div>
    );
}

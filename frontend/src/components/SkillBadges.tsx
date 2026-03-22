interface SkillBadgesProps {
    skills: string[];
}

export default function SkillBadges({ skills }: SkillBadgesProps) {
    if (skills.length === 0) {
        return null;
    }

    return (
        <div className="flex flex-wrap gap-2">
            {skills.map((skill) => (
                <span
                    key={skill}
                    className="rounded-full bg-indigo-500/20 px-3 py-1 text-sm text-indigo-200"
                >
                    {skill}
                </span>
            ))}
        </div>
    );
}

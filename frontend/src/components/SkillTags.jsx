export default function SkillTags({ skills = [], tone = 'neutral' }) {
  const styles = {
    neutral: 'bg-mist text-ink-soft',
    matched: 'bg-teal-soft text-teal',
    missing: 'bg-amber-soft text-amber'
  }[tone];

  if (!skills.length) return null;

  return (
    <ul className="flex flex-wrap gap-1.5">
      {skills.map((skill) => {
        const name = typeof skill === 'string' ? skill : skill.name;
        return (
          <li key={name} className={`rounded-full px-2.5 py-1 font-mono text-[11px] ${styles}`}>
            {name}
          </li>
        );
      })}
    </ul>
  );
}

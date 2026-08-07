export function Field({ label, hint, children }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      {hint && <span className="mt-0.5 block text-xs text-ink-soft">{hint}</span>}
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

export const inputClass =
  'w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm text-ink placeholder:text-ink-soft/60 focus:border-teal focus:outline-none';

export function Notice({ tone = 'info', children }) {
  if (!children) return null;
  const styles = {
    info: 'bg-mist text-ink-soft',
    error: 'bg-[#f8e4e8] text-rose',
    success: 'bg-teal-soft text-teal'
  }[tone];
  return <p className={`rounded-lg px-3.5 py-2.5 text-sm ${styles}`} role={tone === 'error' ? 'alert' : undefined}>{children}</p>;
}

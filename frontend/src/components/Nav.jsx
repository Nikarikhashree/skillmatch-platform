import { NavLink } from 'react-router-dom';

const LINKS = [
  ['/browse', 'Browse projects'],
  ['/join', 'Join as a professional'],
  ['/post', 'Post a project'],
  ['/volunteer', 'Volunteer'],
  ['/support', 'Support us'],
  ['/dashboard', 'Impact dashboard']
];

export default function Nav() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/90 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-3">
        <NavLink to="/" className="font-display text-lg font-extrabold tracking-tight">
          Skill<span className="text-teal">Match</span>
        </NavLink>

        <ul className="flex flex-wrap items-center gap-1">
          {LINKS.map(([to, label]) => (
            <li key={to}>
              <NavLink
                to={to}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-2 text-sm transition ${isActive ? 'bg-ink text-white' : 'text-ink-soft hover:bg-mist hover:text-ink'}`
                }
              >
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
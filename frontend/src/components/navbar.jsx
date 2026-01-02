import { NavLink } from "react-router-dom";

export default function Navbar() {
  const linkBase =
    "text-lg font-semibold tracking-wide transition-all duration-300";

  const inactive =
    "text-white/70 hover:text-white hover:scale-[1.05]";

  const active =
    "text-cyan-300 scale-[1.05] underline underline-offset-8";

  return (
    <header className="relative z-50">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-8 py-6">

        {/* LOGO */}
        <div className="text-2xl md:text-3xl font-extrabold tracking-tight">
          <span className="text-white">Fin</span>
          <span className="bg-gradient-to-r from-cyan-300 to-emerald-300 bg-clip-text text-transparent">
            Sight
          </span>
        </div>

        {/* NAV LINKS */}
        <div className="hidden items-center gap-10 md:flex">

          <NavLink to="/" className={({ isActive }) =>
            `${linkBase} ${isActive ? active : inactive}`}>
            Home
          </NavLink>

          <NavLink to="/dashboard" className={({ isActive }) =>
            `${linkBase} ${isActive ? active : inactive}`}>
            Dashboard
          </NavLink>

          <NavLink to="/upload" className={({ isActive }) =>
            `${linkBase} ${isActive ? active : inactive}`}>
            Upload
          </NavLink>

          <NavLink to="/simulation" className={({ isActive }) =>
            `${linkBase} ${isActive ? active : inactive}`}>
            Simulation
          </NavLink>

          <NavLink to="/forecast" className={({ isActive }) =>
            `${linkBase} ${isActive ? active : inactive}`}>
            Forecast
          </NavLink>

          <NavLink to="/optimize" className={({ isActive }) =>
            `${linkBase} ${isActive ? active : inactive}`}>
            Optimize
          </NavLink>

          <NavLink to="/ask-ai" className={({ isActive }) =>
            `${linkBase} ${isActive ? active : inactive}`}>
            Ask AI
          </NavLink>
        </div>

        {/* SIGN IN */}
        <button className="rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400 px-5 py-2 text-sm font-semibold text-black shadow-lg shadow-emerald-400/30 transition hover:scale-105">
          Sign In
        </button>
      </nav>
    </header>
  );
}

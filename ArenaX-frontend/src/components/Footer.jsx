import { Link } from "react-router-dom";

function Footer() {
  return (
    <footer className="relative border-t border-[var(--color-arena-border)] bg-gradient-to-b from-[#08090d] via-[#050508] to-black text-zinc-400 overflow-hidden">
      {/* Background Subtle Red Aura */}
      <div className="absolute left-1/4 bottom-0 -z-0 h-64 w-96 rounded-full bg-red-500/5 blur-[120px] pointer-events-none" />

      <div className="relative mx-auto grid max-w-7xl gap-12 px-6 py-16 md:grid-cols-5">
        {/* Brand Section */}
        <div className="md:col-span-2 space-y-4">
          <Link
            to="/"
            className="group inline-flex items-center gap-1.5 font-display text-3xl font-extrabold tracking-wider text-white transition duration-300"
          >
            <span>Arena</span>
            <span className="text-red-500 group-hover:scale-110 transition duration-300 inline-block">X</span>
            <span className="ml-2 rounded-full border border-red-500/30 bg-red-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-red-400">
              ESPORTS
            </span>
          </Link>

          <p className="max-w-md text-xs leading-relaxed text-zinc-400">
            A competitive esports tournament platform built for the MOBA gaming community. Organize bracket tournaments, recruit roster positions, and compete for victory.
          </p>

          <div className="flex items-center gap-3 pt-2 text-xs font-semibold text-zinc-400">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-emerald-400 border border-emerald-500/20">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              Platform Online
            </span>
            <span className="text-zinc-500">•</span>
            <span className="font-display tracking-wider uppercase text-zinc-400">MOBA League Engine</span>
          </div>
        </div>

        {/* Explore Links */}
        <div>
          <h3 className="mb-5 text-sm font-display font-extrabold uppercase tracking-widest text-white flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
            Explore
          </h3>

          <div className="flex flex-col gap-3 text-xs">
            {[
              { label: "Home", to: "/" },
              { label: "Tournaments", to: "/tournaments" },
              { label: "Teams", to: "/teams" },
              { label: "Free Agents", to: "/free-agents" },
            ].map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="group flex items-center gap-2 font-medium text-zinc-400 transition-all duration-300 hover:text-red-400 hover:translate-x-2"
              >
                <span className="text-zinc-600 transition-all duration-300 group-hover:text-red-500 group-hover:translate-x-0.5">
                  &rarr;
                </span>
                <span>{link.label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Account Links */}
        <div>
          <h3 className="mb-5 text-sm font-display font-extrabold uppercase tracking-widest text-white flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
            Account
          </h3>

          <div className="flex flex-col gap-3 text-xs">
            {[
              { label: "Login", to: "/login" },
              { label: "Sign Up", to: "/signup" },
              { label: "My Tournaments", to: "/tournaments" },
              { label: "About Us", to: "/about" },
            ].map((link) => (
              <Link
                key={link.label}
                to={link.to}
                className="group flex items-center gap-2 font-medium text-zinc-400 transition-all duration-300 hover:text-red-400 hover:translate-x-2"
              >
                <span className="text-zinc-600 transition-all duration-300 group-hover:text-red-500 group-hover:translate-x-0.5">
                  &rarr;
                </span>
                <span>{link.label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Games Supported */}
        <div>
          <h3 className="mb-5 text-sm font-display font-extrabold uppercase tracking-widest text-white flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
            Games
          </h3>

          <div className="flex flex-col gap-3 text-xs">
            {[
              "Dota 2",
              "League of Legends",
              "Mobile Legends",
              "Honor of Kings",
            ].map((game) => (
              <div
                key={game}
                className="group flex items-center gap-2 font-medium text-zinc-400 transition-all duration-300 hover:text-red-400 hover:translate-x-2 cursor-pointer"
              >
                <span className="h-1 w-1 rounded-full bg-zinc-600 group-hover:bg-red-500 group-hover:scale-150 transition duration-300" />
                <span>{game}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-[var(--color-arena-border)] bg-black/60">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-6 text-xs text-zinc-500 sm:flex-row">
          <p>© 2026 ArenaX Competitive Esports Platform. All rights reserved.</p>
          <div className="flex gap-6">
            <span className="hover:text-zinc-400 transition cursor-pointer">Privacy Policy</span>
            <span className="hover:text-zinc-400 transition cursor-pointer">Terms of Service</span>
            <span className="hover:text-zinc-400 transition cursor-pointer">Platform Status</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
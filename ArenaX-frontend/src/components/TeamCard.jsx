import React from "react";
import { useNavigate } from "react-router-dom";

function TeamCard({ team, onDisband }) {
  const navigate = useNavigate();

  const isForming = (team.status || "").toLowerCase() === "forming";
  const isCaptain = (team.role || "").toLowerCase() === "captain";

  return (
    <div className="group relative flex flex-col justify-between rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 transition duration-200 hover:-translate-y-1 hover:border-red-500/50 hover:bg-zinc-900/80">
      <div>
        {/* Top Badges */}
        <div className="flex items-center justify-between gap-2 mb-4">
          <span className="rounded-md bg-zinc-800 px-2.5 py-1 text-xs font-mono font-bold text-zinc-300 border border-zinc-700/50">
            [{team.team_tag}]
          </span>

          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider border ${
              isForming
                ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
            }`}
          >
            {team.status || "Forming"}
          </span>
        </div>

        {/* Team Avatar & Title */}
        <div className="flex items-center gap-4 mb-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-zinc-700 bg-zinc-800 text-xl font-black text-red-500 group-hover:border-red-500/50 transition">
            {(team.team_name || "T").charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="text-xl font-bold text-white group-hover:text-red-500 transition line-clamp-1">
              {team.team_name}
            </h3>
            <p className="text-xs font-medium text-red-400 mt-0.5">
              {team.game_name}
            </p>
          </div>
        </div>

        {/* User Role Details */}
        <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/60 p-3.5 space-y-2 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-zinc-400">Your Role</span>
            <span
              className={`font-semibold capitalize px-2 py-0.5 rounded text-[11px] ${
                isCaptain
                  ? "bg-red-500/10 text-red-400 border border-red-500/20"
                  : "bg-zinc-800 text-zinc-300"
              }`}
            >
              {team.role || "Member"}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-zinc-400">Roster Position</span>
            <span className="font-medium text-zinc-300">
              {team.is_substitute ? (
                <span className="text-amber-400">Substitute</span>
              ) : (
                <span className="text-emerald-400">Main Roster</span>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="mt-6 flex items-center gap-2">
        <button
          onClick={() => navigate(`/teams/${team.team_id}`)}
          className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800/40 py-2.5 text-sm font-semibold text-white transition hover:border-red-500 hover:bg-red-500 hover:shadow-lg hover:shadow-red-500/10 text-center"
        >
          View Team Roster
        </button>
        {isCaptain && onDisband && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDisband(team);
            }}
            title="Disband Team"
            className="rounded-lg border border-red-500/30 bg-red-500/10 p-2.5 text-red-400 transition hover:bg-red-500 hover:text-white"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

export default TeamCard;

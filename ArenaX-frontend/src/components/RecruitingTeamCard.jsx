import React from "react";

function RecruitingTeamCard({ team, onApply, hasApplied }) {
  // team fields: team_id, team_name, team_tag, game_id, game_name, status, captain_username, active_member_count, open_slots
  const isForming = (team.status || "").toLowerCase() === "forming";
  const memberCount = team.active_member_count || 1;
  const openSlots = team.open_slots !== undefined ? team.open_slots : Math.max(0, 5 - memberCount);

  return (
    <div className="flex flex-col justify-between rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 transition duration-200 hover:-translate-y-1 hover:border-red-500/50 hover:bg-zinc-900/80">
      <div>
        {/* Top Badges */}
        <div className="flex items-center justify-between gap-2 mb-4">
          <span className="rounded-md bg-red-500/10 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-red-500 border border-red-500/20">
            {team.game_name}
          </span>

          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider border ${
              isForming
                ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${isForming ? "bg-amber-400" : "bg-emerald-400"}`} />
            {team.status || "Recruiting"}
          </span>
        </div>

        {/* Team Identity */}
        <div className="flex items-center gap-4 mb-5">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-red-500/30 bg-gradient-to-br from-red-500/20 to-zinc-900 text-2xl font-black text-red-500 shadow-md">
            {(team.team_name || "T").charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-white truncate">
                {team.team_name}
              </h3>
              <span className="font-mono text-xs font-bold text-zinc-400 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800 shrink-0">
                [{team.team_tag}]
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Captain: <span className="text-zinc-200 font-medium">{team.captain_username || "Unknown"}</span>
            </p>
          </div>
        </div>

        {/* Capacity & Slot Summary */}
        <div className="space-y-2.5 text-xs border-t border-zinc-800/80 pt-4">
          <div className="flex justify-between items-center">
            <span className="text-zinc-400">Roster Capacity</span>
            <span className="font-mono font-bold text-white bg-zinc-950 px-2.5 py-1 rounded border border-zinc-800">
              {memberCount} / 5 PLAYERS
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-zinc-400">Main Roster Slots</span>
            <span className="font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/20">
              {openSlots} {openSlots === 1 ? "OPEN SLOT" : "OPEN SLOTS"}
            </span>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="mt-6 pt-4 border-t border-zinc-800/80">
        {hasApplied ? (
          <button
            disabled
            className="w-full rounded-xl bg-zinc-800 border border-zinc-700 py-2.5 text-xs font-bold text-emerald-400 cursor-default flex items-center justify-center gap-1.5"
          >
            <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
            </svg>
            APPLICATION SENT
          </button>
        ) : (
          <button
            onClick={() => onApply(team)}
            className="w-full rounded-xl bg-red-500 py-2.5 text-xs font-bold text-white transition hover:bg-red-600 shadow-lg shadow-red-500/10 active:scale-95 flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            APPLY TO JOIN
          </button>
        )}
      </div>
    </div>
  );
}

export default RecruitingTeamCard;

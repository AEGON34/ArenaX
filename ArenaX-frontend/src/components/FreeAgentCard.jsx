import React from "react";

function FreeAgentCard({ agent, onInvite, invitationSent }) {
  // agent fields: free_agent_id, account_id, game_id, game_name, game_username, game_uid, server_region, preferred_role, university, availability_status
  const isAvailable = (agent.availability_status || "").toLowerCase() === "available";

  return (
    <div className="flex flex-col justify-between rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 transition duration-200 hover:-translate-y-1 hover:border-red-500/50 hover:bg-zinc-900/80">
      <div>
        {/* Top Badges */}
        <div className="flex items-center justify-between gap-2 mb-4">
          <span className="rounded-md bg-red-500/10 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-red-500 border border-red-500/20">
            {agent.game_name}
          </span>

          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider border ${
              isAvailable
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                : "bg-zinc-800 text-zinc-400 border-zinc-700"
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${isAvailable ? "bg-emerald-400" : "bg-zinc-500"}`} />
            {agent.availability_status || "Available"}
          </span>
        </div>

        {/* Player Avatar & Title */}
        <div className="flex items-center gap-4 mb-5">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-zinc-700 bg-zinc-800 text-xl font-black text-red-500 shadow-md">
            {(agent.game_username || "P").charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <h3 className="text-lg font-bold text-white truncate">
              {agent.game_username}
            </h3>
            <span className="inline-block mt-0.5 rounded px-2 py-0.5 text-[11px] font-bold uppercase bg-zinc-800 text-zinc-300 border border-zinc-700">
              {agent.preferred_role ? `[ ${agent.preferred_role.toUpperCase()} ]` : "[ FLEX / ANY ]"}
            </span>
          </div>
        </div>

        {/* Details Grid */}
        <div className="space-y-2.5 text-xs border-t border-zinc-800/80 pt-4">
          <div className="flex justify-between items-center">
            <span className="text-zinc-400">UID</span>
            <span className="font-mono text-zinc-300 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800">
              {agent.game_uid}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-zinc-400">Region</span>
            <span className="font-medium text-zinc-300 uppercase bg-zinc-800/60 px-2 py-0.5 rounded text-[11px]">
              {agent.server_region}
            </span>
          </div>

          {/* University row - ONLY show if available */}
          {agent.university && agent.university.trim() !== "" && (
            <div className="flex justify-between items-start">
              <span className="text-zinc-400">University</span>
              <span className="font-medium text-right text-zinc-300 text-[11px] max-w-[170px] truncate">
                {agent.university}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Action Footer */}
      <div className="mt-6 pt-4 border-t border-zinc-800/80">
        {invitationSent ? (
          <button
            disabled
            className="w-full rounded-xl bg-zinc-800 border border-zinc-700 py-2.5 text-xs font-bold text-emerald-400 cursor-default flex items-center justify-center gap-1.5"
          >
            <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
            </svg>
            INVITATION SENT
          </button>
        ) : (
          <button
            onClick={() => onInvite(agent)}
            className="w-full rounded-xl bg-red-500 py-2.5 text-xs font-bold text-white transition hover:bg-red-600 shadow-lg shadow-red-500/10 active:scale-95"
          >
            INVITE TO TEAM
          </button>
        )}
      </div>
    </div>
  );
}

export default FreeAgentCard;

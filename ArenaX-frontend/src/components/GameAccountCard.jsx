import React from "react";

function GameAccountCard({ account, game, onEdit, onDelete }) {
  // game: { game_id, game_name, short_code }
  const gameName = game ? game.game_name : `Game #${account.game_id}`;
  const shortCode = game ? game.short_code : "GAME";

  return (
    <div className="relative flex flex-col justify-between rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 transition duration-200 hover:border-zinc-700 hover:bg-zinc-900/80">
      <div>
        {/* Card Header: Game & Free Agent status */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <span className="rounded-md bg-red-500/10 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-red-500 border border-red-500/20">
              {shortCode}
            </span>
            <h3 className="font-bold text-white text-lg">{gameName}</h3>
          </div>

          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium border ${
              account.is_free_agent
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                : "bg-zinc-800/80 text-zinc-400 border-zinc-700/50"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                account.is_free_agent ? "bg-emerald-400" : "bg-zinc-500"
              }`}
            />
            {account.is_free_agent ? "Free Agent" : "In Team"}
          </span>
        </div>

        {/* Info Grid */}
        <div className="space-y-3 text-sm">
          <div className="flex justify-between items-center py-1.5 border-b border-zinc-800/50">
            <span className="text-zinc-400">Username</span>
            <span className="font-semibold text-white">{account.game_username}</span>
          </div>

          <div className="flex justify-between items-center py-1.5 border-b border-zinc-800/50">
            <span className="text-zinc-400">UID</span>
            <span className="font-mono text-xs font-semibold text-zinc-300 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800">
              {account.game_uid}
            </span>
          </div>

          <div className="flex justify-between items-center py-1.5 border-b border-zinc-800/50">
            <span className="text-zinc-400">Region</span>
            <span className="font-medium text-zinc-300 uppercase bg-zinc-800/60 px-2 py-0.5 rounded text-xs">
              {account.server_region}
            </span>
          </div>

          {/* University row - ONLY display if present */}
          {account.university && account.university.trim() !== "" && (
            <div className="flex justify-between items-start py-1.5 border-b border-zinc-800/50">
              <span className="text-zinc-400">University</span>
              <span className="font-medium text-right text-zinc-300 text-xs max-w-[180px] truncate">
                {account.university}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Action Footer */}
      <div className="mt-6 pt-4 border-t border-zinc-800/60 flex justify-end gap-2">
        <button
          onClick={() => onDelete(account)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800/50 px-3.5 py-1.5 text-xs font-semibold text-red-400 transition hover:border-red-500/50 hover:bg-red-500/10"
        >
          Delete
        </button>
        <button
          onClick={() => onEdit(account)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800/50 px-3.5 py-1.5 text-xs font-semibold text-zinc-200 transition hover:border-red-500/50 hover:bg-zinc-800 hover:text-white"
        >
          <svg className="w-3.5 h-3.5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Edit Account
        </button>
      </div>
    </div>
  );
}

export default GameAccountCard;

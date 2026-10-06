import React from "react";
import { useNavigate } from "react-router-dom";
import { formatPrizePool } from "../utils/formatters";

const GAME_BANNERS = {
  "dota 2": "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=800&auto=format&fit=crop",
  "league of legends": "https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=800&auto=format&fit=crop",
  "mobile legends": "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?q=80&w=800&auto=format&fit=crop",
  "honor of kings": "https://images.unsplash.com/photo-1560253023-3ec5d502959f?q=80&w=800&auto=format&fit=crop",
};

const DEFAULT_BANNER = "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=800&auto=format&fit=crop";

const STATUS_STYLES = {
  draft: "bg-zinc-800 text-zinc-400 border-zinc-700",
  published: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  live: "bg-red-500/10 text-red-400 border-red-500/30 animate-pulse",
  completed: "bg-zinc-800/80 text-zinc-400 border-zinc-700",
};

const FORMAT_LABELS = {
  single_elimination: "Single Elimination",
  double_elimination: "Double Elimination",
};

function TournamentCard({ tournament }) {
  const navigate = useNavigate();

  const gameKey = (tournament.game_name || "").toLowerCase();
  const bannerUrl = GAME_BANNERS[gameKey] || DEFAULT_BANNER;
  const statusStyle = STATUS_STYLES[tournament.status] || STATUS_STYLES.draft;
  const isLive = tournament.status === "live";

  return (
    <div
      onClick={() => navigate(`/tournaments/${tournament.tournament_id}`)}
      className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/60 transition duration-300 hover:-translate-y-1.5 hover:border-red-500/50 hover:shadow-2xl hover:shadow-red-500/10 cursor-pointer"
    >
      {/* Banner Image Header */}
      <div className="relative h-40 w-full overflow-hidden bg-zinc-950">
        <img
          src={bannerUrl}
          alt={tournament.game_name}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105 opacity-65 group-hover:opacity-85"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/40 to-transparent" />

        {/* Game Title Tag */}
        <span className="absolute top-3 left-3 rounded-md bg-zinc-950/80 backdrop-blur-md px-2.5 py-1 text-[11px] font-black tracking-wider text-red-400 uppercase border border-red-500/20 shadow-md">
          {tournament.game_name}
        </span>

        {/* Status Badge */}
        <span
          className={`absolute top-3 right-3 flex items-center gap-1.5 rounded-full backdrop-blur-md px-3 py-1 text-xs font-bold uppercase tracking-wider border shadow-md ${statusStyle}`}
        >
          {isLive && <span className="h-2 w-2 rounded-full bg-red-500 animate-ping" />}
          {tournament.status}
        </span>
      </div>

      {/* Card Content */}
      <div className="p-6 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="text-xl font-black text-white group-hover:text-red-500 transition line-clamp-1">
            {tournament.name}
          </h3>

          {/* Details */}
          <div className="mt-4 space-y-2.5 text-xs text-zinc-400 border-t border-zinc-800/80 pt-4">
            <div className="flex justify-between items-center">
              <span>Format</span>
              <span className="font-semibold text-zinc-200">
                {FORMAT_LABELS[tournament.format] || tournament.format}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span>Organizer</span>
              <span className="font-medium text-zinc-300">
                @{tournament.organizer_username || "ArenaX Staff"}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span>Prize Pool</span>
              <span className="font-semibold text-emerald-400">
                {formatPrizePool(tournament.prize_pool_usd)}
              </span>
            </div>

            {tournament.registration_status && (
              <div className="flex justify-between items-center pt-1 border-t border-zinc-800/50">
                <span>Registration</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase border ${
                    tournament.registration_status === "OPEN"
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      : tournament.registration_status === "NOT_STARTED"
                      ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                      : tournament.registration_status === "FROZEN"
                      ? "bg-purple-500/10 text-purple-400 border-purple-500/20"
                      : "bg-zinc-800 text-zinc-400 border-zinc-700"
                  }`}
                >
                  {tournament.registration_status === "NOT_STARTED"
                    ? "NOT STARTED"
                    : tournament.registration_status}
                </span>
              </div>
            )}

            {tournament.registration_end_at && (
              <div className="flex justify-between items-center text-[11px] text-zinc-500">
                <span>Deadline</span>
                <span className="text-zinc-400">
                  {new Date(tournament.registration_end_at).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/tournaments/${tournament.tournament_id}`);
          }}
          className="mt-6 w-full rounded-xl border border-zinc-700 bg-zinc-800/60 py-2.5 text-xs font-bold text-white transition duration-200 group-hover:border-red-500 group-hover:bg-red-500 group-hover:shadow-lg group-hover:shadow-red-500/20"
        >
          View Tournament Details →
        </button>
      </div>
    </div>
  );
}

export default TournamentCard;
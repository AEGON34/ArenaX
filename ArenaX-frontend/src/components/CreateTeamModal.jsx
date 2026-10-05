import React, { useState, useEffect } from "react";
import { createTeam } from "../api";
import { useNavigate } from "react-router-dom";

function CreateTeamModal({ isOpen, onClose, onSuccess, games = [] }) {
  const [gameId, setGameId] = useState("");
  const [teamName, setTeamName] = useState("");
  const [teamTag, setTeamTag] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    if (games.length > 0) {
      setGameId(String(games[0].game_id));
    }
    setTeamName("");
    setTeamTag("");
    setErrorMessage("");
  }, [isOpen, games]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (!gameId) {
      setErrorMessage("Please select a game.");
      return;
    }
    if (!teamName.trim()) {
      setErrorMessage("Team Name is required.");
      return;
    }
    if (!teamTag.trim()) {
      setErrorMessage("Team Tag is required.");
      return;
    }

    setLoading(true);

    try {
      const res = await createTeam({
        game_id: parseInt(gameId, 10),
        team_name: teamName.trim(),
        team_tag: teamTag.trim().toUpperCase(),
      });

      onSuccess(res.teamId);
      onClose();
    } catch (err) {
      console.error(err);
      if (err.isUnauthenticated) {
        window.location.href = "/login";
        return;
      }
      setErrorMessage(err.message || "Failed to create team. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-950 p-6 md:p-8 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4 mb-6">
          <div>
            <h2 className="text-xl font-black text-white">Create New Team</h2>
            <p className="text-xs text-zinc-400 mt-1">
              Assemble your competitive squad and represent your game.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-zinc-400 transition hover:bg-zinc-900 hover:text-white"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Error Banner */}
        {errorMessage && (
          <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 p-3.5 text-xs text-red-400 flex items-start gap-2.5">
            <svg className="w-4 h-4 text-red-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <p className="font-semibold">{errorMessage}</p>
              {errorMessage.toLowerCase().includes("game account") && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    navigate("/profile");
                  }}
                  className="mt-2 text-xs underline font-bold text-red-400 hover:text-red-300"
                >
                  Go to Profile to Link a Game Account &rarr;
                </button>
              )}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Game Selection */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-zinc-300">
              Select Game <span className="text-red-500">*</span>
            </label>
            <select
              value={gameId}
              onChange={(e) => setGameId(e.target.value)}
              required
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm text-white outline-none focus:border-red-500"
            >
              {games.length === 0 ? (
                <option value="">No games available</option>
              ) : (
                games.map((g) => (
                  <option key={g.game_id} value={g.game_id}>
                    {g.game_name} ({g.short_code})
                  </option>
                ))
              )}
            </select>
            <p className="text-[11px] text-zinc-500 mt-1">
              Note: You must have an active game account for the selected game.
            </p>
          </div>

          {/* Team Name */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-zinc-300">
              Team Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. ArenaX Warriors"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              required
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-red-500"
            />
          </div>

          {/* Team Tag */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-zinc-300">
              Team Tag (2-5 letters) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. AXW"
              maxLength={6}
              value={teamTag}
              onChange={(e) => setTeamTag(e.target.value.toUpperCase())}
              required
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm uppercase text-white outline-none placeholder:text-zinc-600 focus:border-red-500 font-mono"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-zinc-800/80 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-zinc-700 px-4 py-2.5 text-sm font-semibold text-zinc-300 transition hover:bg-zinc-900 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-red-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-600 disabled:opacity-50"
            >
              {loading ? "Creating Team..." : "Create Team"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateTeamModal;

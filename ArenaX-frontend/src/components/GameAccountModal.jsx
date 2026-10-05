import React, { useState, useEffect } from "react";
import { createGameAccount, updateGameAccount } from "../api";

function GameAccountModal({ isOpen, onClose, onSuccess, editingAccount, games = [] }) {
  const isEditMode = !!editingAccount;

  const [gameId, setGameId] = useState("");
  const [gameUsername, setGameUsername] = useState("");
  const [gameUid, setGameUid] = useState("");
  const [serverRegion, setServerRegion] = useState("SEA");
  const [isFreeAgent, setIsFreeAgent] = useState(true);
  const [university, setUniversity] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (editingAccount) {
      setGameId(editingAccount.game_id ? String(editingAccount.game_id) : "");
      setGameUsername(editingAccount.game_username || "");
      setGameUid(editingAccount.game_uid || "");
      setServerRegion(editingAccount.server_region || "SEA");
      setIsFreeAgent(editingAccount.is_free_agent ?? true);
      setUniversity(editingAccount.university || "");
    } else {
      setGameId(games.length > 0 ? String(games[0].game_id) : "");
      setGameUsername("");
      setGameUid("");
      setServerRegion("SEA");
      setIsFreeAgent(true);
      setUniversity("");
    }
    setErrorMessage("");
  }, [editingAccount, isOpen, games]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (!isEditMode && !gameId) {
      setErrorMessage("Please select a game.");
      return;
    }
    if (!gameUsername.trim()) {
      setErrorMessage("Game Username is required.");
      return;
    }
    if (!gameUid.trim()) {
      setErrorMessage("Game UID is required.");
      return;
    }
    if (!serverRegion.trim()) {
      setErrorMessage("Server Region is required.");
      return;
    }

    setLoading(true);

    try {
      if (isEditMode) {
        // Edit mode MUST NOT send game_id or attempt to edit game_id
        await updateGameAccount(editingAccount.account_id, {
          game_username: gameUsername.trim(),
          game_uid: gameUid.trim(),
          server_region: serverRegion.trim(),
        });
      } else {
        await createGameAccount({
          game_id: parseInt(gameId, 10),
          game_username: gameUsername.trim(),
          game_uid: gameUid.trim(),
          server_region: serverRegion.trim(),
          is_free_agent: isFreeAgent,
          university: university.trim() || null,
        });
      }

      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      if (err.isUnauthenticated) {
        window.location.href = "/login";
        return;
      }
      setErrorMessage(err.message || "Failed to save game account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const currentGame = games.find((g) => String(g.game_id) === String(gameId));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-950 p-6 md:p-8 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4 mb-6">
          <div>
            <h2 className="text-xl font-black text-white">
              {isEditMode ? "Edit Game Account" : "Add Game Account"}
            </h2>
            <p className="text-xs text-zinc-400 mt-1">
              {isEditMode
                ? "Update your game identifier and details."
                : "Link a game account to participate in tournaments and teams."}
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
          <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 p-3.5 text-xs text-red-400 flex items-start gap-2">
            <svg className="w-4 h-4 text-red-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Game Selection */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-zinc-300">
              Game {isEditMode && <span className="text-zinc-500 font-normal">(Cannot be changed)</span>}
            </label>
            {isEditMode ? (
              <div className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-sm text-zinc-400">
                {currentGame ? `${currentGame.game_name} (${currentGame.short_code})` : `Game ID: ${gameId}`}
              </div>
            ) : (
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
            )}
          </div>

          {/* Game Username */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-zinc-300">
              Game Username <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. ProGamer99"
              value={gameUsername}
              onChange={(e) => setGameUsername(e.target.value)}
              required
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-red-500"
            />
          </div>

          {/* Game UID */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-zinc-300">
              Game UID <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. 109823412"
              value={gameUid}
              onChange={(e) => setGameUid(e.target.value)}
              required
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-red-500"
            />
          </div>

          {/* Server Region */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-zinc-300">
              Server Region <span className="text-red-500">*</span>
            </label>
            <select
              value={serverRegion}
              onChange={(e) => setServerRegion(e.target.value)}
              required
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm text-white outline-none focus:border-red-500"
            >
              <option value="SEA">SEA (Southeast Asia)</option>
              <option value="NA">NA (North America)</option>
              <option value="EU">EU (Europe)</option>
              <option value="ASIA">ASIA (East Asia)</option>
              <option value="SA">SA (South America)</option>
              <option value="GLOBAL">GLOBAL</option>
            </select>
          </div>

          {/* Fields only available in Create mode */}
          {!isEditMode && (
            <>
              {/* Free Agent Status */}
              <div>
                <label className="flex items-center gap-2 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={isFreeAgent}
                    onChange={(e) => setIsFreeAgent(e.target.checked)}
                    className="accent-red-500 h-4 w-4 rounded"
                  />
                  <span className="text-xs font-semibold text-zinc-300">
                    Available as Free Agent
                  </span>
                </label>
                <p className="text-[11px] text-zinc-500 mt-1 pl-6">
                  Allow team captains to see your profile for recruitment.
                </p>
              </div>

              {/* University */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-zinc-300">
                  University <span className="text-zinc-500 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. United International University"
                  value={university}
                  onChange={(e) => setUniversity(e.target.value)}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-red-500"
                />
              </div>
            </>
          )}

          {/* Form Actions */}
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
              {loading ? (isEditMode ? "Saving..." : "Creating...") : (isEditMode ? "Save Changes" : "Add Game Account")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default GameAccountModal;

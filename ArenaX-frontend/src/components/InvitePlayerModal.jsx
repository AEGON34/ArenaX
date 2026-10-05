import React, { useState, useEffect } from "react";
import { sendTeamInvitation } from "../api";
import { useNavigate } from "react-router-dom";

function InvitePlayerModal({ isOpen, onClose, onSuccess, targetAgent, myTeams = [] }) {
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();

  // Filter captain's teams to only those matching the target player's game
  const compatibleTeams = myTeams.filter(
    (t) => (t.game_name || "").toLowerCase() === (targetAgent?.game_name || "").toLowerCase()
  );

  useEffect(() => {
    if (compatibleTeams.length > 0) {
      setSelectedTeamId(String(compatibleTeams[0].team_id));
    } else {
      setSelectedTeamId("");
    }
    setErrorMessage("");
  }, [targetAgent, isOpen, myTeams]);

  if (!isOpen || !targetAgent) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (!selectedTeamId) {
      setErrorMessage("Please select a compatible team for this player.");
      return;
    }

    setLoading(true);

    try {
      await sendTeamInvitation({
        team_id: parseInt(selectedTeamId, 10),
        game_account_id: targetAgent.account_id,
      });

      onSuccess(targetAgent.account_id);
      onClose();
    } catch (err) {
      console.error(err);
      if (err.isUnauthenticated) {
        window.location.href = "/login";
        return;
      }

      if (err.status === 409) {
        setErrorMessage("An invitation is already pending for this player.");
      } else if (err.status === 403) {
        setErrorMessage("You are not authorized to invite players for this team.");
      } else {
        setErrorMessage(err.message || "Failed to send invitation. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950 p-6 md:p-8 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4 mb-6">
          <div>
            <h2 className="text-xl font-black text-white">Invite Player to Roster</h2>
            <p className="text-xs text-zinc-400 mt-1">
              Send an official team recruitment invitation.
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
            <span className="font-semibold">{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Target Player Card Info */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-2">
            <p className="text-[11px] font-semibold uppercase text-zinc-500">Recruit Target</p>
            <div className="flex items-center justify-between">
              <span className="font-bold text-white text-base">{targetAgent.game_username}</span>
              <span className="rounded bg-red-500/10 border border-red-500/20 px-2 py-0.5 text-xs font-bold text-red-400 uppercase">
                {targetAgent.game_name}
              </span>
            </div>
            <p className="text-xs text-zinc-400 font-mono">UID: {targetAgent.game_uid}</p>
          </div>

          {/* Compatible Team Selection */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-zinc-300">
              Select Compatible Team <span className="text-red-500">*</span>
            </label>

            {compatibleTeams.length === 0 ? (
              <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-900/30 p-4 text-center space-y-3">
                <p className="text-xs text-zinc-400">
                  You don't have a team for <span className="font-bold text-white">{targetAgent.game_name}</span>.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    navigate("/teams");
                  }}
                  className="rounded-lg bg-red-500 px-4 py-2 text-xs font-bold text-white hover:bg-red-600 transition"
                >
                  + Create {targetAgent.game_name} Team
                </button>
              </div>
            ) : (
              <select
                value={selectedTeamId}
                onChange={(e) => setSelectedTeamId(e.target.value)}
                required
                className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm text-white outline-none focus:border-red-500"
              >
                {compatibleTeams.map((t) => (
                  <option key={t.team_id} value={t.team_id}>
                    {t.team_name} [{t.team_tag}] ({t.game_name})
                  </option>
                ))}
              </select>
            )}
          </div>

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
              disabled={loading || compatibleTeams.length === 0}
              className="rounded-lg bg-red-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-600 disabled:opacity-50"
            >
              {loading ? "Sending..." : "Send Invitation"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default InvitePlayerModal;

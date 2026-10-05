import React, { useState, useEffect } from "react";
import { getMyTeams, registerTeamForTournament } from "../api";

function RegisterTeamModal({ isOpen, onClose, onSuccess, tournament }) {
  const [eligibleTeams, setEligibleTeams] = useState([]);
  const [teamId, setTeamId] = useState("");

  const [loadingTeams, setLoadingTeams] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!isOpen || !tournament) return;

    setErrorMessage("");
    setLoadingTeams(true);

    getMyTeams()
      .then((teams) => {
        const filtered = teams.filter(
          (t) =>
            (t.role || "").toLowerCase() === "captain" &&
            t.game_name === tournament.game_name
        );
        setEligibleTeams(filtered);
        if (filtered.length > 0) {
          setTeamId(String(filtered[0].team_id));
        } else {
          setTeamId("");
        }
      })
      .catch((err) => {
        console.error(err);
        setErrorMessage("Failed to load your teams.");
      })
      .finally(() => setLoadingTeams(false));
  }, [isOpen, tournament]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (!teamId) {
      setErrorMessage("Please select a team.");
      return;
    }

    setSubmitting(true);
    try {
      await registerTeamForTournament({
        tournament_id: tournament.tournament_id,
        team_id: parseInt(teamId, 10),
      });
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      if (err.isUnauthenticated) {
        window.location.href = "/login";
        return;
      }
      setErrorMessage(err.message || "Failed to register team.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-950 p-6 md:p-8 shadow-2xl">
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4 mb-6">
          <div>
            <h2 className="text-xl font-black text-white">Register For Tournament</h2>
            <p className="text-xs text-zinc-400 mt-1">{tournament?.name}</p>
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

        {errorMessage && (
          <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 p-3.5 text-xs text-red-400">
            <p className="font-semibold">{errorMessage}</p>
          </div>
        )}

        {loadingTeams ? (
          <div className="h-20 rounded-xl border border-zinc-800 bg-zinc-900/30 animate-pulse" />
        ) : eligibleTeams.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-900/20 p-6 text-center text-sm text-zinc-400">
            You don't captain any <span className="text-white font-semibold">{tournament?.game_name}</span> team.
            Create one first from the Teams page.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-zinc-300">
                Select Your Team <span className="text-red-500">*</span>
              </label>
              <select
                value={teamId}
                onChange={(e) => setTeamId(e.target.value)}
                required
                className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm text-white outline-none focus:border-red-500"
              >
                {eligibleTeams.map((t) => (
                  <option key={t.team_id} value={t.team_id}>
                    {t.team_name} [{t.team_tag}]
                  </option>
                ))}
              </select>
            </div>

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
                disabled={submitting}
                className="rounded-lg bg-red-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-600 disabled:opacity-50"
              >
                {submitting ? "Registering..." : "Register Team"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default RegisterTeamModal;
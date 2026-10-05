import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createTeamApplication } from "../api";

function ApplyToTeamModal({ isOpen, onClose, onSuccess, targetTeam, myGameAccounts = [] }) {
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const navigate = useNavigate();

  // Filter game accounts belonging to the team's game
  const compatibleAccounts = myGameAccounts.filter(
    (ga) => targetTeam && String(ga.game_id) === String(targetTeam.game_id)
  );

  useEffect(() => {
    if (compatibleAccounts.length > 0) {
      setSelectedAccountId(String(compatibleAccounts[0].account_id));
    } else {
      setSelectedAccountId("");
    }
    setErrorMsg("");
  }, [targetTeam, myGameAccounts]);

  if (!isOpen || !targetTeam) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAccountId) {
      setErrorMsg("Please select a game account to apply.");
      return;
    }

    setSubmitting(true);
    setErrorMsg("");

    try {
      await createTeamApplication({
        team_id: targetTeam.team_id,
        game_account_id: Number(selectedAccountId),
      });

      onSuccess(targetTeam.team_id);
      onClose();
    } catch (err) {
      console.error(err);
      if (err.status === 409) {
        setErrorMsg(err.message || "An application or invitation is already pending for this team.");
      } else if (err.status === 400) {
        setErrorMsg(err.message || "You cannot apply to this team.");
      } else if (err.status === 403) {
        setErrorMsg("You are not authorized to use this game account.");
      } else {
        setErrorMsg(err.message || "Failed to submit team application.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-900 pb-4">
          <div>
            <span className="text-[11px] font-bold tracking-widest text-red-500 uppercase">
              RECRUITMENT APPLICATION
            </span>
            <h3 className="text-xl font-black text-white mt-0.5">
              Apply to {targetTeam.team_name}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-900 hover:text-white transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-xs text-red-400 flex items-center gap-2">
            <svg className="w-4 h-4 shrink-0 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Team Overview Box */}
        <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/50 p-4 space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-zinc-400">Target Game</span>
            <span className="font-bold text-red-400">{targetTeam.game_name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-400">Team Captain</span>
            <span className="font-medium text-white">{targetTeam.captain_username}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-400">Open Roster Slots</span>
            <span className="font-bold text-emerald-400">{targetTeam.open_slots || 1} Slots</span>
          </div>
        </div>

        {/* Form Body */}
        {compatibleAccounts.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-900/30 p-6 text-center space-y-3">
            <p className="text-xs text-zinc-300 font-semibold">
              You don't have a game account for <span className="text-red-400 font-bold">{targetTeam.game_name}</span>.
            </p>
            <p className="text-[11px] text-zinc-500">
              Link your {targetTeam.game_name} account on your profile to apply to this team.
            </p>
            <button
              type="button"
              onClick={() => {
                onClose();
                navigate("/profile");
              }}
              className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-red-500 px-4 py-2 text-xs font-bold text-white hover:bg-red-600 transition"
            >
              + ADD GAME ACCOUNT
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-zinc-300">
                Select Your Game Account
              </label>
              <select
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-white outline-none focus:border-red-500"
              >
                {compatibleAccounts.map((acc) => (
                  <option key={acc.account_id} value={acc.account_id}>
                    {acc.game_username} (UID: {acc.game_uid}) — {acc.server_region}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="rounded-xl border border-zinc-700 bg-zinc-900 px-5 py-2.5 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-xl bg-red-500 px-6 py-2.5 text-xs font-bold text-white hover:bg-red-600 transition shadow-lg shadow-red-500/20 disabled:opacity-50"
              >
                {submitting ? "Submitting..." : "SUBMIT APPLICATION"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default ApplyToTeamModal;

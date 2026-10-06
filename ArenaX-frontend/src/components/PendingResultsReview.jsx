import React, { useEffect, useState } from "react";
import { getPendingMatchResults, verifyMatchResult, rejectMatchResult } from "../api";
import ConfirmModal from "./ConfirmModal";

function PendingResultsReview({ tournamentId, onRefreshData, onToast }) {
  const [pendingList, setPendingList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Edit / Verify modal state
  const [selectedResult, setSelectedResult] = useState(null);
  const [editWinnerId, setEditWinnerId] = useState("");
  const [editKillsA, setEditKillsA] = useState("");
  const [editKillsB, setEditKillsB] = useState("");

  // Confirm modal for Reject
  const [rejectResultId, setRejectResultId] = useState(null);

  const fetchPendingResults = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const data = await getPendingMatchResults(tournamentId);
      setPendingList(data.pendingResults || []);
    } catch (err) {
      console.error("Failed to load pending results:", err);
      // Suppress 404/403 if not organizer
      if (!err.isUnauthenticated && err.status !== 403) {
        setErrorMsg(err.message || "Failed to load pending results.");
      }
      setPendingList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tournamentId) {
      fetchPendingResults();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tournamentId]);

  const handleOpenVerifyModal = (resultItem) => {
    setSelectedResult(resultItem);
    setEditWinnerId(String(resultItem.winning_registration_id));
    setEditKillsA(String(resultItem.team_a_kills));
    setEditKillsB(String(resultItem.team_b_kills));
    setErrorMsg("");
  };

  const handleConfirmVerify = async (e) => {
    e.preventDefault();
    if (!selectedResult) return;

    setActionLoading(true);
    setErrorMsg("");
    try {
      await verifyMatchResult(selectedResult.match_id, {
        winning_registration_id: Number(editWinnerId),
        team_a_kills: Number(editKillsA),
        team_b_kills: Number(editKillsB),
      });

      onToast && onToast(`Match #${selectedResult.match_id} result verified!`);
      setSelectedResult(null);
      await fetchPendingResults();
      onRefreshData && onRefreshData();
    } catch (err) {
      console.error("Verification error:", err);
      setErrorMsg(err.message || err.data?.error || "Failed to verify result.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectResultId) return;

    setActionLoading(true);
    setErrorMsg("");
    try {
      await rejectMatchResult(rejectResultId);
      onToast && onToast("Submitted result rejected.");
      setRejectResultId(null);
      await fetchPendingResults();
      onRefreshData && onRefreshData();
    } catch (err) {
      console.error("Rejection error:", err);
      setErrorMsg(err.message || err.data?.error || "Failed to reject result.");
      setRejectResultId(null);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950/60 p-6 text-center text-xs text-zinc-500 animate-pulse">
        Checking for pending match results...
      </div>
    );
  }

  if (pendingList.length === 0) {
    return (
      <div className="mt-6 rounded-2xl border border-dashed border-zinc-800/80 bg-zinc-950/40 p-6 text-center text-xs text-zinc-500">
        No pending match results awaiting review.
      </div>
    );
  }

  return (
    <div className="mt-6 rounded-2xl border border-amber-500/30 bg-zinc-950/90 p-6 shadow-xl space-y-4">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-black text-white">Pending Match Results</h3>
            <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-bold text-amber-400 border border-amber-500/20">
              {pendingList.length} Awaiting Verification
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Review submitted scores and evidence before official verification.
          </p>
        </div>

        <button
          onClick={fetchPendingResults}
          className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:text-white"
        >
          Refresh
        </button>
      </div>

      {errorMsg && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">
          {errorMsg}
        </div>
      )}

      {/* List of Pending Submissions */}
      <div className="space-y-3">
        {pendingList.map((item) => (
          <div
            key={item.result_id}
            className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs">
                <span className="font-bold text-white">Match #{item.match_id}</span>
                <span className="text-zinc-500">•</span>
                <span className="text-zinc-400">{item.stage_name} ({item.group_name})</span>
                <span className="text-zinc-500">•</span>
                <span className="text-zinc-500">By @{item.submitted_by_username}</span>
              </div>

              <div className="text-xs font-semibold text-zinc-300 flex items-center gap-4 pt-1">
                <span>
                  Team A Kills: <strong className="text-white">{item.team_a_kills}</strong>
                </span>
                <span>
                  Team B Kills: <strong className="text-white">{item.team_b_kills}</strong>
                </span>
                {item.evidence_url && (
                  <a
                    href={item.evidence_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-red-400 underline hover:text-red-300 font-bold"
                  >
                    View Evidence ↗
                  </a>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
              <button
                type="button"
                onClick={() => handleOpenVerifyModal(item)}
                className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-500 transition"
              >
                Review & Verify
              </button>
              <button
                type="button"
                onClick={() => setRejectResultId(item.match_id)}
                className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-xs font-bold text-red-400 hover:bg-red-500/20 transition"
              >
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Verify & Edit Score Modal */}
      {selectedResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white">Verify Match Result #{selectedResult.match_id}</h3>
            <p className="text-xs text-zinc-400">
              Confirm or adjust the submitted score and winning team before official verification.
            </p>

            <form onSubmit={handleConfirmVerify} className="space-y-4 pt-2">
              <div>
                <label className="mb-1 block text-xs font-semibold text-zinc-300">
                  Winning Team <span className="text-red-500">*</span>
                </label>
                {selectedResult.participants && selectedResult.participants.length > 0 ? (
                  <select
                    value={editWinnerId}
                    onChange={(e) => setEditWinnerId(e.target.value)}
                    required
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2.5 text-xs text-white outline-none focus:border-red-500"
                  >
                    <option value="">-- Select Verified Winner --</option>
                    {selectedResult.participants.map((p) => (
                      <option key={p.registration_id} value={p.registration_id}>
                        {p.team_name} {p.team_tag ? `[${p.team_tag}]` : ""} (Side {p.side})
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="number"
                    value={editWinnerId}
                    onChange={(e) => setEditWinnerId(e.target.value)}
                    required
                    placeholder="Winning Registration ID"
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2.5 text-xs text-white outline-none focus:border-red-500"
                  />
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-zinc-300">
                    {selectedResult.participants?.find((p) => p.side === "A")?.team_name || "Team A"} Kills
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editKillsA}
                    onChange={(e) => setEditKillsA(e.target.value)}
                    required
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2.5 text-xs text-white outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-zinc-300">
                    {selectedResult.participants?.find((p) => p.side === "B")?.team_name || "Team B"} Kills
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editKillsB}
                    onChange={(e) => setEditKillsB(e.target.value)}
                    required
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2.5 text-xs text-white outline-none focus:border-red-500"
                  />
                </div>
              </div>

              {selectedResult.evidence_url && (
                <div className="pt-1 text-xs">
                  <span className="text-zinc-400">Submitted Evidence: </span>
                  <a
                    href={selectedResult.evidence_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-red-400 underline font-bold"
                  >
                    Open Link ↗
                  </a>
                </div>
              )}

              <div className="mt-6 flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedResult(null)}
                  disabled={actionLoading}
                  className="rounded-xl border border-zinc-700 px-4 py-2 text-xs font-semibold text-zinc-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-500 disabled:opacity-50"
                >
                  {actionLoading ? "Verifying..." : "Confirm Verification"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Reject Modal */}
      <ConfirmModal
        isOpen={Boolean(rejectResultId)}
        title="Reject Match Result?"
        message="This will reject the captain's submitted score. The match will remain uncompleted and available for resubmission."
        confirmVariant="danger"
        onConfirm={handleConfirmReject}
        onClose={() => setRejectResultId(null)}
        loading={actionLoading}
      />
    </div>
  );
}

export default PendingResultsReview;

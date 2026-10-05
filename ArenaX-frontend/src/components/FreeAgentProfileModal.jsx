import React, { useState, useEffect } from "react";
import { createFreeAgentProfile, updateFreeAgentProfile } from "../api";
import { useNavigate } from "react-router-dom";

function FreeAgentProfileModal({
  isOpen,
  onClose,
  onSuccess,
  editingProfile,
  myGameAccounts = [],
  games = []
}) {
  const isEditMode = !!editingProfile;

  const [selectedGaId, setSelectedGaId] = useState("");
  const [availabilityStatus, setAvailabilityStatus] = useState("available");
  const [preferredRole, setPreferredRole] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    if (editingProfile) {
      setSelectedGaId(String(editingProfile.account_id));
      setAvailabilityStatus(editingProfile.availability_status || "available");
      setPreferredRole(editingProfile.preferred_role || "");
    } else {
      setSelectedGaId(myGameAccounts.length > 0 ? String(myGameAccounts[0].account_id) : "");
      setAvailabilityStatus("available");
      setPreferredRole("");
    }
    setErrorMessage("");
  }, [editingProfile, isOpen, myGameAccounts]);

  if (!isOpen) return null;

  const selectedGa = myGameAccounts.find((ga) => String(ga.account_id) === String(selectedGaId));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (!isEditMode && !selectedGaId) {
      setErrorMessage("Please select a game account.");
      return;
    }

    setLoading(true);

    try {
      if (isEditMode) {
        await updateFreeAgentProfile(editingProfile.free_agent_id, {
          availability_status: availabilityStatus,
          preferred_role: preferredRole.trim() || null,
        });
      } else {
        await createFreeAgentProfile({
          game_account_id: parseInt(selectedGaId, 10),
          preferred_role: preferredRole.trim() || null,
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
      setErrorMessage(err.message || "Failed to save recruitment profile.");
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
            <h2 className="text-xl font-black text-white">
              {isEditMode ? "Edit Recruitment Profile" : "Create Free-Agent Profile"}
            </h2>
            <p className="text-xs text-zinc-400 mt-1">
              {isEditMode
                ? "Update your availability and preferred role for team discovery."
                : "List your linked game account to receive roster invitations."}
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
          {/* Game Account Selection */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-zinc-300">
              Select Game Account {isEditMode && <span className="text-zinc-500 font-normal">(Fixed)</span>}
            </label>
            {isEditMode ? (
              <div className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-sm text-zinc-300 flex justify-between items-center">
                <span className="font-bold">{editingProfile.game_username}</span>
                <span className="text-xs text-red-400 uppercase font-bold">{editingProfile.game_name}</span>
              </div>
            ) : myGameAccounts.length === 0 ? (
              <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-900/30 p-4 text-center space-y-3">
                <p className="text-xs text-zinc-400">
                  You haven't linked any game accounts to your profile yet.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    navigate("/profile");
                  }}
                  className="rounded-lg bg-red-500 px-4 py-2 text-xs font-bold text-white hover:bg-red-600 transition"
                >
                  Go to Profile to Add Game Account
                </button>
              </div>
            ) : (
              <select
                value={selectedGaId}
                onChange={(e) => setSelectedGaId(e.target.value)}
                required
                className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm text-white outline-none focus:border-red-500"
              >
                {myGameAccounts.map((ga) => {
                  const matchedG = games.find((g) => String(g.game_id) === String(ga.game_id));
                  const gName = matchedG ? matchedG.game_name : `Game #${ga.game_id}`;
                  return (
                    <option key={ga.account_id} value={ga.account_id}>
                      {ga.game_username} ({gName}) — UID: {ga.game_uid}
                    </option>
                  );
                })}
              </select>
            )}
          </div>

          {/* Selected Account Summary Preview */}
          {!isEditMode && selectedGa && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-3 text-xs space-y-1 text-zinc-400">
              <div className="flex justify-between">
                <span>Server Region:</span>
                <span className="text-white font-semibold uppercase">{selectedGa.server_region}</span>
              </div>
              {selectedGa.university && (
                <div className="flex justify-between">
                  <span>University:</span>
                  <span className="text-white font-semibold">{selectedGa.university}</span>
                </div>
              )}
            </div>
          )}

          {/* Availability Status (Edit Mode) */}
          {isEditMode && (
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-zinc-300">
                Availability Status <span className="text-red-500">*</span>
              </label>
              <select
                value={availabilityStatus}
                onChange={(e) => setAvailabilityStatus(e.target.value)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm text-white outline-none focus:border-red-500"
              >
                <option value="available">Available (Discoverable)</option>
                <option value="unavailable">Unavailable (Hidden from discovery)</option>
              </select>
            </div>
          )}

          {/* Preferred Role Select */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-zinc-300">
              Preferred Role <span className="text-zinc-500 font-normal">(Optional)</span>
            </label>
            <select
              value={preferredRole}
              onChange={(e) => setPreferredRole(e.target.value)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm text-white outline-none focus:border-red-500"
            >
              <option value="">Select Preferred Role...</option>
              <option value="Marksman">Marksman</option>
              <option value="Clashlaner">Clashlaner</option>
              <option value="Jungler">Jungler</option>
              <option value="Roam">Roam</option>
              <option value="Midlaner">Midlaner</option>
            </select>
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
              disabled={loading || (!isEditMode && myGameAccounts.length === 0)}
              className="rounded-lg bg-red-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-600 disabled:opacity-50"
            >
              {loading ? "Saving..." : isEditMode ? "Save Changes" : "Create Profile"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default FreeAgentProfileModal;

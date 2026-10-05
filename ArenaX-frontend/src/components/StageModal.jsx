import React, { useState, useEffect } from "react";
import { createStage, updateStage } from "../api";

function StageModal({ isOpen, onClose, onSuccess, tournamentId, editingStage = null }) {
  const [stageOrder, setStageOrder] = useState("1");
  const [stageName, setStageName] = useState("");
  const [stageFormat, setStageFormat] = useState("single_elimination");

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const isEditMode = Boolean(editingStage);

  useEffect(() => {
    if (isEditMode) {
      setStageOrder(String(editingStage.stage_order));
      setStageName(editingStage.stage_name);
      setStageFormat(editingStage.stage_format);
    } else {
      setStageOrder("1");
      setStageName("");
      setStageFormat("single_elimination");
    }
    setErrorMessage("");
  }, [isOpen, editingStage]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    const orderNum = parseInt(stageOrder, 10);

    if (!Number.isInteger(orderNum) || orderNum < 1) {
      setErrorMessage("Stage order must be a positive whole number.");
      return;
    }
    if (!stageName.trim()) {
      setErrorMessage("Stage name is required.");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        stage_order: orderNum,
        stage_name: stageName.trim(),
        stage_format: stageFormat,
      };

      if (isEditMode) {
        await updateStage(editingStage.stage_id, payload);
      } else {
        await createStage({ tournament_id: tournamentId, ...payload });
      }
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      if (err.isUnauthenticated) {
        window.location.href = "/login";
        return;
      }
      setErrorMessage(err.message || "Failed to save stage. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950 p-6 md:p-8 shadow-2xl">
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4 mb-6">
          <div>
            <h2 className="text-xl font-black text-white">
              {isEditMode ? "Edit Stage" : "Add Tournament Stage"}
            </h2>
            <p className="text-xs text-zinc-400 mt-1">
              e.g. Group Stage, Quarterfinal, Semifinal, Final
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

        {errorMessage && (
          <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 p-3.5 text-xs text-red-400">
            <p className="font-semibold">{errorMessage}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-zinc-300">
              Stage Order <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              value={stageOrder}
              onChange={(e) => setStageOrder(e.target.value)}
              required
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm text-white outline-none focus:border-red-500"
            />
            <p className="mt-1 text-[11px] text-zinc-500">Determines the sequence - 1 runs before 2, and so on.</p>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-zinc-300">
              Stage Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Group Stage"
              value={stageName}
              onChange={(e) => setStageName(e.target.value)}
              required
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-red-500"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-zinc-300">
              Stage Format <span className="text-red-500">*</span>
            </label>
            <select
              value={stageFormat}
              onChange={(e) => setStageFormat(e.target.value)}
              required
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm text-white outline-none focus:border-red-500"
            >
              <option value="single_elimination">Single Elimination</option>
              <option value="double_elimination">Double Elimination</option>
            </select>
            <p className="mt-1 text-[11px] text-zinc-500">Each stage can use a different format from the others.</p>
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
              disabled={loading}
              className="rounded-lg bg-red-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-600 disabled:opacity-50"
            >
              {loading ? "Saving..." : isEditMode ? "Save Changes" : "Add Stage"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default StageModal;
import { useState, useEffect } from "react";
import {
  getStageGroups,
  generateGroups,
  resetGroups,
  swapGroupMembers,
  moveGroupMember,
  removeGroupMember,
  generateGroupMatches,
  generateQualification,
  assignFinalRank,
  generateBracket,
} from "../api";
import ConfirmModal from "./ConfirmModal";
import PendingResultsReview from "./PendingResultsReview";
import PlayoffBracketView from "./PlayoffBracketView";

const STATUS_BADGES = {
  not_generated: { label: "Not Generated", style: "bg-zinc-800 text-zinc-400 border-zinc-700" },
  groups_assigned: { label: "Groups Assigned", style: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  matches_generated: { label: "Matches Generated", style: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  qualified: { label: "Qualified", style: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
  bracket_generated: { label: "Playoffs Generated", style: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
};

function GroupStageManager({ stageId, tournamentId, tournamentStatus, onToast }) {
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [stageData, setStageData] = useState(null);

  const effectiveTournamentId = tournamentId || stageData?.tournament_id;

  // Allocation mode state
  const [assignmentMode, setAssignmentMode] = useState("sequential");

  // Modal controls
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, type: "", title: "", message: "", confirmVariant: "primary" });
  
  // Swap modal state
  const [swapModalOpen, setSwapModalOpen] = useState(false);
  const [regIdA, setRegIdA] = useState("");
  const [regIdB, setRegIdB] = useState("");

  // Move modal state
  const [moveModalOpen, setMoveModalOpen] = useState(false);
  const [moveRegId, setMoveRegId] = useState("");
  const [toGroupId, setToGroupId] = useState("");

  const fetchGroupData = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const data = await getStageGroups(stageId);
      setStageData(data);
    } catch (err) {
      console.error("Failed to load group stage data:", err);
      setErrorMsg(err.message || err.data?.error || "Failed to load group stage data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (stageId) {
      fetchGroupData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stageId]);

  const groupStatus = stageData?.groupGenerationStatus || "not_generated";
  const isLocked = tournamentStatus && ["live", "completed"].includes(tournamentStatus);
  const canModifyGroups = groupStatus === "groups_assigned" && !isLocked;

  // Rank modal state
  const [rankModalOpen, setRankModalOpen] = useState(false);
  const [rankMemberItem, setRankMemberItem] = useState(null);
  const [rankValue, setRankValue] = useState("1");

  const handleGenerateGroupsClick = () => {
    setConfirmModal({
      isOpen: true,
      type: "generate_groups",
      title: "Generate Groups?",
      message: `Approved registrations will be split into groups of 4 using ${assignmentMode.toUpperCase()} assignment.`,
      confirmVariant: "primary",
    });
  };

  const handleResetGroupsClick = () => {
    setConfirmModal({
      isOpen: true,
      type: "reset_groups",
      title: "Reset Groups?",
      message: "This will remove all current group assignments. You can then re-generate groups.",
      confirmVariant: "danger",
    });
  };

  const handleGenerateMatchesClick = () => {
    setConfirmModal({
      isOpen: true,
      type: "generate_matches",
      title: "Generate Group Matches?",
      message: "This will create round-robin matches for every group. Group assignments will then be locked.",
      confirmVariant: "primary",
    });
  };

  const handleGenerateQualificationClick = () => {
    setConfirmModal({
      isOpen: true,
      type: "generate_qualification",
      title: "Generate Top-2 Qualification?",
      message: "This will evaluate group standings (Wins -> Total Kills -> Kill Difference) and mark the top 2 teams in each group as qualified.",
      confirmVariant: "primary",
    });
  };

  const handleGenerateBracketClick = () => {
    setConfirmModal({
      isOpen: true,
      type: "generate_bracket",
      title: "Generate Playoff Bracket?",
      message: "This will seed qualified teams into Upper Bracket (and Play-In round if 24 teams) with BO3/BO5 series settings.",
      confirmVariant: "primary",
    });
  };

  const handleConfirmAction = async () => {
    setActionLoading(true);
    setErrorMsg("");
    try {
      if (confirmModal.type === "generate_groups") {
        await generateGroups(stageId, { assignmentMode });
        onToast && onToast("Groups generated successfully!");
      } else if (confirmModal.type === "reset_groups") {
        await resetGroups(stageId);
        onToast && onToast("Groups reset successfully!");
      } else if (confirmModal.type === "generate_matches") {
        await generateGroupMatches(stageId);
        onToast && onToast("Group matches generated successfully!");
      } else if (confirmModal.type === "generate_qualification") {
        await generateQualification(stageId);
        onToast && onToast("Top-2 qualification generated successfully!");
      } else if (confirmModal.type === "generate_bracket") {
        await generateBracket(stageId);
        onToast && onToast("Playoff Double Elimination bracket generated successfully!");
      } else if (confirmModal.type === "remove_member") {
        await removeGroupMember(stageId, confirmModal.registrationId);
        onToast && onToast(`Team "${confirmModal.teamName}" removed from group and registration rejected!`);
      } else if (confirmModal.type === "swap_members") {
        await swapGroupMembers(stageId, { registrationIdA: Number(regIdA), registrationIdB: Number(regIdB) });
        onToast && onToast("Teams swapped successfully!");
        setSwapModalOpen(false);
        setRegIdA("");
        setRegIdB("");
      } else if (confirmModal.type === "move_member") {
        await moveGroupMember(stageId, { registrationId: Number(moveRegId), toGroupId: Number(toGroupId) });
        onToast && onToast("Team moved successfully!");
        setMoveModalOpen(false);
        setMoveRegId("");
        setToGroupId("");
      }

      setConfirmModal({ isOpen: false, type: "", title: "", message: "", confirmVariant: "primary" });
      await fetchGroupData();
    } catch (err) {
      console.error("Action error:", err);
      if (err.code === "QUALIFICATION_TIE_UNRESOLVED" || err.data?.code === "QUALIFICATION_TIE_UNRESOLVED") {
        setErrorMsg(
          "QUALIFICATION BLOCKED: A 2nd/3rd place tie exists. Please click 'Rank' on tied teams to set an organizer final_rank (1–4) before generating qualification."
        );
      } else {
        setErrorMsg(err.message || err.data?.error || "Operation failed.");
      }
      setConfirmModal({ isOpen: false, type: "", title: "", message: "", confirmVariant: "primary" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenRankModal = (member) => {
    setRankMemberItem(member);
    setRankValue(String(member.final_rank || "1"));
    setErrorMsg("");
    setRankModalOpen(true);
  };

  const handleSaveRank = async (e) => {
    e.preventDefault();
    if (!rankMemberItem) return;
    setActionLoading(true);
    setErrorMsg("");
    try {
      await assignFinalRank(
        stageId,
        rankMemberItem.group_id,
        rankMemberItem.member_id,
        Number(rankValue)
      );
      onToast && onToast(`Assigned tie-breaker rank #${rankValue} to ${rankMemberItem.team_name}`);
      setRankModalOpen(false);
      setRankMemberItem(null);
      await fetchGroupData();
    } catch (err) {
      console.error("Rank assignment error:", err);
      setErrorMsg(err.message || err.data?.error || "Failed to assign final rank.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenSwapModal = () => {
    setRegIdA("");
    setRegIdB("");
    setErrorMsg("");
    setSwapModalOpen(true);
  };

  const handleConfirmSwap = async () => {
    if (!regIdA || !regIdB || regIdA === regIdB) {
      setErrorMsg("Please select two different teams to swap.");
      return;
    }
    setActionLoading(true);
    setErrorMsg("");
    try {
      await swapGroupMembers(stageId, { registrationIdA: Number(regIdA), registrationIdB: Number(regIdB) });
      onToast && onToast("Teams swapped successfully!");
      setSwapModalOpen(false);
      setRegIdA("");
      setRegIdB("");
      await fetchGroupData();
    } catch (err) {
      console.error("Swap error:", err);
      setErrorMsg(err.message || err.data?.error || "Failed to swap teams.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenMoveModal = (preselectedRegId = "") => {
    setMoveRegId(preselectedRegId);
    setToGroupId("");
    setErrorMsg("");
    setMoveModalOpen(true);
  };

  const handleConfirmMove = async () => {
    if (!moveRegId || !toGroupId) {
      setErrorMsg("Please select a team and a target destination group.");
      return;
    }
    setActionLoading(true);
    setErrorMsg("");
    try {
      await moveGroupMember(stageId, { registrationId: Number(moveRegId), toGroupId: Number(toGroupId) });
      onToast && onToast("Team moved successfully!");
      setMoveModalOpen(false);
      setMoveRegId("");
      setToGroupId("");
      await fetchGroupData();
    } catch (err) {
      console.error("Move error:", err);
      setErrorMsg(err.message || err.data?.error || "Failed to move team.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenRemoveModal = (member) => {
    setErrorMsg("");
    setConfirmModal({
      isOpen: true,
      type: "remove_member",
      registrationId: member.registration_id,
      teamName: member.team_name,
      title: "Remove Team from Group?",
      message: `Remove "${member.team_name}" from group and reject their registration? The slot will become empty.`,
      confirmVariant: "danger",
    });
  };

  // Group members and matches helper
  const groups = stageData?.groups || [];
  const membersByGroup = {};
  const members = [];
  const allMatches = [];
  groups.forEach((g) => {
    const gMems = g.members || [];
    membersByGroup[g.group_id] = gMems;
    gMems.forEach((m) => members.push({ ...m, group_id: g.group_id }));
    if (g.matches) allMatches.push(...g.matches);
  });

  return (
    <div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950/80 p-6 shadow-xl">
      {/* Header & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-900 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-black text-white">Group Stage Management</h2>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold uppercase border ${
                STATUS_BADGES[groupStatus]?.style || STATUS_BADGES.not_generated.style
              }`}
            >
              {STATUS_BADGES[groupStatus]?.label || groupStatus}
            </span>
          </div>
          <p className="mt-1 text-xs text-zinc-400">
            Organize registrations into groups of 4 and generate round-robin matches.
          </p>
        </div>

        {/* State Indicator Pills */}
        <div className="flex items-center gap-2 text-xs font-medium text-zinc-400">
          <span className={groupStatus !== "not_generated" ? "text-emerald-400 font-bold" : ""}>
            {groupStatus !== "not_generated" ? "✓" : "○"} Teams Assigned
          </span>
          <span className="text-zinc-600">•</span>
          <span className={["matches_generated", "qualified", "bracket_generated"].includes(groupStatus) ? "text-emerald-400 font-bold" : ""}>
            {["matches_generated", "qualified", "bracket_generated"].includes(groupStatus) ? "✓" : "○"} Matches Generated
          </span>
        </div>
      </div>

      {/* Error Banner */}
      {errorMsg && (
        <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-xs text-red-400 flex items-center justify-between gap-3">
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg("")} className="text-red-400 hover:text-white font-bold">
            ✕
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading ? (
        <div className="mt-6 space-y-4">
          <div className="h-12 w-full animate-pulse rounded-xl bg-zinc-900/60" />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="h-48 animate-pulse rounded-xl bg-zinc-900/40" />
            <div className="h-48 animate-pulse rounded-xl bg-zinc-900/40" />
          </div>
        </div>
      ) : (
        <>
          {/* STATE A: NOT GENERATED -> Show Allocation Selector & Generate Button */}
          {groupStatus === "not_generated" && (
            <div className="mt-6 rounded-xl border border-dashed border-zinc-800 bg-zinc-900/20 p-8 text-center">
              <h3 className="text-base font-bold text-white">No Groups Generated Yet</h3>
              <p className="mt-1 text-xs text-zinc-400">
                Select an assignment mode and click generate to split approved teams into 4-team groups.
              </p>

              <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
                <div className="flex items-center gap-2 bg-zinc-900 p-1.5 rounded-xl border border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setAssignmentMode("sequential")}
                    className={`rounded-lg px-4 py-2 text-xs font-semibold transition ${
                      assignmentMode === "sequential"
                        ? "bg-red-500 text-white shadow-md shadow-red-500/20"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    Sequential
                  </button>
                  <button
                    type="button"
                    onClick={() => setAssignmentMode("random")}
                    className={`rounded-lg px-4 py-2 text-xs font-semibold transition ${
                      assignmentMode === "random"
                        ? "bg-red-500 text-white shadow-md shadow-red-500/20"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    Random
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleGenerateGroupsClick}
                  disabled={actionLoading}
                  className="rounded-xl bg-red-500 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-red-500/20 transition hover:bg-red-600 disabled:opacity-50"
                >
                  {actionLoading ? "Generating..." : "Generate Groups"}
                </button>
              </div>
            </div>
          )}

          {/* STATE B: GROUPS ASSIGNED / MATCHES GENERATED / QUALIFIED / BRACKET GENERATED */}
          {groupStatus !== "not_generated" && (
            <div className="mt-6 space-y-6">
              {/* Action Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-zinc-900/60 p-4 rounded-xl border border-zinc-800/80">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Group Actions:</span>
                  {canModifyGroups && (
                    <>
                      <button
                        type="button"
                        onClick={handleOpenSwapModal}
                        className="rounded-lg border border-zinc-700 bg-zinc-950 px-3.5 py-1.5 text-xs font-semibold text-zinc-300 transition hover:border-zinc-500 hover:text-white"
                      >
                        ⇄ Swap Teams
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenMoveModal("")}
                        className="rounded-lg border border-zinc-700 bg-zinc-950 px-3.5 py-1.5 text-xs font-semibold text-zinc-300 transition hover:border-zinc-500 hover:text-white"
                      >
                        ➔ Move Team
                      </button>

                      <button
                        type="button"
                        onClick={handleResetGroupsClick}
                        className="rounded-lg border border-red-500/30 bg-red-500/10 px-3.5 py-1.5 text-xs font-semibold text-red-400 transition hover:bg-red-500/20"
                      >
                        Reset Groups
                      </button>
                    </>
                  )}
                </div>

                {groupStatus === "groups_assigned" && tournamentStatus !== "completed" && (
                  <button
                    type="button"
                    onClick={handleGenerateMatchesClick}
                    disabled={actionLoading}
                    className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-500 disabled:opacity-50"
                  >
                    {actionLoading ? "Generating..." : "Generate Group Matches"}
                  </button>
                )}

                {groupStatus === "matches_generated" && tournamentStatus !== "completed" && (
                  <button
                    type="button"
                    onClick={handleGenerateQualificationClick}
                    disabled={actionLoading}
                    className="rounded-xl bg-purple-600 px-5 py-2 text-xs font-bold text-white shadow-lg shadow-purple-600/20 transition hover:bg-purple-500 disabled:opacity-50"
                  >
                    {actionLoading ? "Generating..." : "Generate Top-2 Qualification"}
                  </button>
                )}

                {["qualified", "bracket_generated"].includes(groupStatus) && (
                  <span className="rounded-xl bg-purple-500/10 px-4 py-2 text-xs font-bold text-purple-400 border border-purple-500/20">
                    ✓ Top-2 Qualification Complete
                  </span>
                )}

                {groupStatus === "qualified" && tournamentStatus !== "completed" && (
                  <button
                    type="button"
                    onClick={handleGenerateBracketClick}
                    disabled={actionLoading}
                    className="rounded-xl bg-amber-600 px-5 py-2 text-xs font-bold text-white shadow-lg shadow-amber-600/20 transition hover:bg-amber-500 disabled:opacity-50"
                  >
                    {actionLoading ? "Generating..." : "Generate Playoff Bracket"}
                  </button>
                )}

                {groupStatus === "bracket_generated" && (
                  <span className="rounded-xl bg-amber-500/10 px-4 py-2 text-xs font-bold text-amber-400 border border-amber-500/20">
                    ✓ Playoff Bracket Generated
                  </span>
                )}
              </div>

              {/* Group Cards Grid */}
              <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
                {groups.map((group) => {
                  const groupMembers = membersByGroup[group.group_id] || [];
                  return (
                    <div
                      key={group.group_id}
                      className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden"
                    >
                      <div className="border-b border-zinc-800 bg-zinc-950/80 px-4 py-3 flex items-center justify-between">
                        <h4 className="text-sm font-black text-white">{group.group_name}</h4>
                        <span className="text-[11px] font-semibold text-zinc-500">
                          {groupMembers.length} / 4 Teams
                        </span>
                      </div>

                      <div className="p-3">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="border-b border-zinc-800/60 text-zinc-500 text-[11px] uppercase tracking-wider">
                              <th className="pb-2 pl-2 font-semibold">Slot</th>
                              <th className="pb-2 font-semibold">Team</th>
                              <th className="pb-2 pr-2 text-right font-semibold">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-800/40">
                            {[1, 2, 3, 4].map((slotNum) => {
                              const member = groupMembers.find((m) => Number(m.slot) === slotNum);
                              return (
                                <tr key={slotNum} className="hover:bg-zinc-800/20">
                                  <td className="py-2.5 pl-2 font-bold text-red-500">{slotNum}</td>
                                  <td className="py-2.5 font-medium text-white">
                                    {member ? (
                                      <div className="flex items-center gap-2">
                                        <span>{member.team_name}</span>
                                        {member.team_tag && (
                                          <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] font-bold text-zinc-400">
                                            [{member.team_tag}]
                                          </span>
                                        )}
                                        {member.qualified && (
                                          <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-bold text-emerald-400 border border-emerald-500/20">
                                            Qualified
                                          </span>
                                        )}
                                        {member.final_rank && (
                                          <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-bold text-amber-400 border border-amber-500/20">
                                            R#{member.final_rank}
                                          </span>
                                        )}
                                      </div>
                                    ) : (
                                      <span className="text-zinc-600 italic">Empty Slot</span>
                                    )}
                                  </td>
                                  <td className="py-2.5 pr-2 text-right">
                                    {member && !isLocked && (
                                      <div className="flex items-center justify-end gap-2">
                                        <button
                                          type="button"
                                          onClick={() => handleOpenRankModal(member)}
                                          className="text-[11px] font-semibold text-amber-400 hover:text-amber-300 transition"
                                          title="Set manual tie-breaker rank (1-4)"
                                        >
                                          Set Rank
                                        </button>

                                        {canModifyGroups && (
                                          <>
                                            <button
                                              type="button"
                                              onClick={() => handleOpenMoveModal(String(member.registration_id))}
                                              className="text-[11px] font-semibold text-zinc-400 hover:text-white transition"
                                            >
                                              Move
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => handleOpenRemoveModal(member)}
                                              className="text-[11px] font-semibold text-red-400 hover:text-red-300 transition"
                                              title="Remove team from group and reject registration"
                                            >
                                              Remove
                                            </button>
                                          </>
                                        )}
                                      </div>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Optional Preview of Group Matches if generated */}
              {["matches_generated", "qualified", "bracket_generated"].includes(groupStatus) && (
                <div className="mt-8 pt-6 border-t border-zinc-800/80">
                  <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4">
                    Group Stage Matches Preview
                  </h4>

                  {allMatches.length > 0 ? (
                    <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
                      {allMatches.slice(0, 12).map((m) => (
                        <div
                          key={m.match_id}
                          className="rounded-lg border border-zinc-800/80 bg-zinc-950/60 p-3 flex items-center justify-between text-xs"
                        >
                          <span className="font-semibold text-zinc-400">Round {m.round_number}</span>
                          <div className="flex items-center gap-2 text-white font-medium">
                            <span>{m.participants?.[0]?.team_name || "TBD"}</span>
                            <span className="text-zinc-500 font-bold">vs</span>
                            <span>{m.participants?.[1]?.team_name || "TBD"}</span>
                          </div>
                          <span className={`text-[10px] font-bold uppercase rounded px-2 py-0.5 ${
                            m.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-zinc-800 text-zinc-400'
                          }`}>
                            {m.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-zinc-500">Group round-robin matches created successfully.</p>
                  )}
                </div>
              )}

              {/* Pending Match Results Review for Organizer */}
              {effectiveTournamentId && (
                <PendingResultsReview
                  tournamentId={effectiveTournamentId}
                  onRefreshData={fetchGroupData}
                  onToast={onToast}
                />
              )}

              {/* Playoff Double Elimination Bracket View */}
              {groupStatus === "bracket_generated" && (
                <PlayoffBracketView
                  stageId={stageId}
                  tournamentId={effectiveTournamentId}
                  onToast={onToast}
                />
              )}
            </div>
          )}
        </>
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmVariant={confirmModal.confirmVariant}
        onConfirm={handleConfirmAction}
        onClose={() => setConfirmModal({ isOpen: false, type: "", title: "", message: "", confirmVariant: "primary" })}
        loading={actionLoading}
      />

      {/* Swap Modal */}
      {swapModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white">Swap Two Teams</h3>
            <p className="text-xs text-zinc-400">Select two teams to swap their group/slot positions.</p>

            <div>
              <label className="mb-1 block text-xs font-semibold text-zinc-300">Select Team 1</label>
              <select
                value={regIdA}
                onChange={(e) => setRegIdA(e.target.value)}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2.5 text-xs text-white outline-none focus:border-red-500"
              >
                <option value="">-- Choose First Team --</option>
                {members.map((m) => {
                  const g = groups.find((grp) => String(grp.group_id) === String(m.group_id));
                  return (
                    <option key={m.registration_id} value={m.registration_id}>
                      {g?.group_name}: {m.team_name}
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-zinc-300">Select Team 2</label>
              <select
                value={regIdB}
                onChange={(e) => setRegIdB(e.target.value)}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2.5 text-xs text-white outline-none focus:border-red-500"
              >
                <option value="">-- Choose Second Team --</option>
                {members
                  .filter((m) => String(m.registration_id) !== String(regIdA))
                  .map((m) => {
                    const g = groups.find((grp) => String(grp.group_id) === String(m.group_id));
                    return (
                      <option key={m.registration_id} value={m.registration_id}>
                        {g?.group_name}: {m.team_name}
                      </option>
                    );
                  })}
              </select>
            </div>

            <div className="mt-6 flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSwapModalOpen(false)}
                className="rounded-xl border border-zinc-700 px-4 py-2 text-xs font-semibold text-zinc-300 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSwap}
                className="rounded-xl bg-red-500 px-4 py-2 text-xs font-semibold text-white hover:bg-red-600"
              >
                Swap Teams
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Move Modal */}
      {moveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white">Move Team to Group</h3>
            <p className="text-xs text-zinc-400">Select a team and its destination group.</p>

            <div>
              <label className="mb-1 block text-xs font-semibold text-zinc-300">Select Team</label>
              <select
                value={moveRegId}
                onChange={(e) => setMoveRegId(e.target.value)}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2.5 text-xs text-white outline-none focus:border-red-500"
              >
                <option value="">-- Choose Team to Move --</option>
                {members.map((m) => {
                  const g = groups.find((grp) => String(grp.group_id) === String(m.group_id));
                  return (
                    <option key={m.registration_id} value={m.registration_id}>
                      {g?.group_name}: {m.team_name}
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-zinc-300">Destination Group</label>
              <select
                value={toGroupId}
                onChange={(e) => setToGroupId(e.target.value)}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2.5 text-xs text-white outline-none focus:border-red-500"
              >
                <option value="">-- Choose Target Group --</option>
                {groups.map((g) => {
                  const count = (membersByGroup[g.group_id] || []).length;
                  return (
                    <option key={g.group_id} value={g.group_id}>
                      {g.group_name} ({count} / 4 teams)
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="mt-6 flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setMoveModalOpen(false)}
                className="rounded-xl border border-zinc-700 px-4 py-2 text-xs font-semibold text-zinc-300 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmMove}
                className="rounded-xl bg-red-500 px-4 py-2 text-xs font-semibold text-white hover:bg-red-600"
              >
                Move Team
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Rank Modal */}
      {rankModalOpen && rankMemberItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white">Assign Tie-Breaker Rank</h3>
            <p className="text-xs text-zinc-400">
              Set an organizer-controlled final rank (1–4) for <strong className="text-white">{rankMemberItem.team_name}</strong> to resolve group standings ties.
            </p>

            <form onSubmit={handleSaveRank} className="space-y-4 pt-2">
              <div>
                <label className="mb-1 block text-xs font-semibold text-zinc-300">Final Rank (1–4)</label>
                <select
                  value={rankValue}
                  onChange={(e) => setRankValue(e.target.value)}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2.5 text-xs text-white outline-none focus:border-red-500"
                >
                  <option value="1">Rank 1 (1st Place)</option>
                  <option value="2">Rank 2 (2nd Place)</option>
                  <option value="3">Rank 3 (3rd Place)</option>
                  <option value="4">Rank 4 (4th Place)</option>
                </select>
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setRankModalOpen(false)}
                  disabled={actionLoading}
                  className="rounded-xl border border-zinc-700 px-4 py-2 text-xs font-semibold text-zinc-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="rounded-xl bg-amber-500 px-5 py-2 text-xs font-bold text-zinc-950 hover:bg-amber-400 disabled:opacity-50"
                >
                  {actionLoading ? "Saving..." : "Save Rank"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default GroupStageManager;

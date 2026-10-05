import React, { useEffect, useState } from "react";
import { getStageGroups, getGroupStandings } from "../api";
import SubmitResultModal from "./SubmitResultModal";
import PlayoffBracketView from "./PlayoffBracketView";

function PublicGroupStageView({ stageId, onToast }) {
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [stageData, setStageData] = useState(null);
  
  // Submit Result Modal state
  const [selectedMatchForSubmit, setSelectedMatchForSubmit] = useState(null);
  
  // Active sub-tab inside Group Stage: 'standings' | 'groups' | 'matches' | 'bracket'
  const [activeTab, setActiveTab] = useState("standings");
  
  // Active selected group filter for Standings/Matches view
  const [selectedGroupId, setSelectedGroupId] = useState(null);

  // Map of groupId -> { loading, error, standingsList }
  const [standingsMap, setStandingsMap] = useState({});

  const fetchStageData = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const data = await getStageGroups(stageId);
      setStageData(data);

      const groups = data.groups || [];
      if (groups.length > 0) {
        setSelectedGroupId(groups[0].group_id);
        // Load standings for all groups
        fetchStandingsForGroups(stageId, groups);
      }
    } catch (err) {
      console.error("Failed to load public group stage:", err);
      setErrorMsg(err.message || "Unable to load group stage data.");
    } finally {
      setLoading(false);
    }
  };

  const fetchStandingsForGroups = async (stgId, groupList) => {
    const map = {};
    for (const g of groupList) {
      try {
        const res = await getGroupStandings(stgId, g.group_id);
        map[g.group_id] = {
          loading: false,
          error: null,
          standings: res.standings || [],
        };
      } catch (err) {
        console.error(`Failed to load standings for group ${g.group_id}:`, err);
        map[g.group_id] = {
          loading: false,
          error: "Unable to load standings for this group.",
          standings: [],
        };
      }
    }
    setStandingsMap(map);
  };

  useEffect(() => {
    if (stageId) {
      fetchStageData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stageId]);

  if (loading) {
    return (
      <div className="mt-8 space-y-4">
        <div className="h-10 w-48 animate-pulse rounded-xl bg-zinc-900" />
        <div className="h-64 animate-pulse rounded-2xl border border-zinc-800 bg-zinc-900/40" />
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="mt-8 rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-center text-xs text-red-400">
        <span>{errorMsg}</span>
        <button
          onClick={fetchStageData}
          className="ml-3 font-bold underline hover:text-white"
        >
          Try Again
        </button>
      </div>
    );
  }

  const groups = stageData?.groups || [];
  const members = stageData?.members || [];
  const matches = stageData?.matches || stageData?.matchesMap || [];
  const groupStatus = stageData?.groupGenerationStatus || "not_generated";

  if (groups.length === 0 || groupStatus === "not_generated") {
    return (
      <div className="mt-8 rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/20 p-12 text-center">
        <h4 className="text-base font-bold text-white">Groups Have Not Been Generated Yet</h4>
        <p className="mt-1 text-xs text-zinc-400">
          The tournament organizer has not generated group assignments for this stage yet.
        </p>
      </div>
    );
  }

  // Filter members by group
  const activeGroupMembers = members.filter(
    (m) => String(m.group_id) === String(selectedGroupId)
  );

  // Filter standings by selected group
  const activeStandingsData = standingsMap[selectedGroupId] || {
    loading: false,
    error: null,
    standings: [],
  };

  // Filter matches by selected group
  const activeGroupMatches = Array.isArray(matches)
    ? matches.filter((m) => String(m.group_id) === String(selectedGroupId))
    : Object.values(matches).filter((m) => String(m.group_id) === String(selectedGroupId));

  // Group matches by round
  const matchesByRound = {};
  activeGroupMatches.forEach((m) => {
    const round = m.round_number || 1;
    if (!matchesByRound[round]) matchesByRound[round] = [];
    matchesByRound[round].push(m);
  });

  return (
    <div className="mt-8 pt-8 border-t border-zinc-800/80">
      {/* View Header & Sub-Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-xl font-black text-white">Group Stage</h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Group stage standings, teams, and round-robin matches.
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-1 bg-zinc-900 p-1.5 rounded-xl border border-zinc-800 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab("standings")}
            className={`rounded-lg px-4 py-2 text-xs font-semibold transition ${
              activeTab === "standings"
                ? "bg-red-500 text-white shadow-md shadow-red-500/20"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            Standings
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("groups")}
            className={`rounded-lg px-4 py-2 text-xs font-semibold transition ${
              activeTab === "groups"
                ? "bg-red-500 text-white shadow-md shadow-red-500/20"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            Groups & Teams
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("matches")}
            className={`rounded-lg px-4 py-2 text-xs font-semibold transition ${
              activeTab === "matches"
                ? "bg-red-500 text-white shadow-md shadow-red-500/20"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            Matches
          </button>

          {groupStatus === "bracket_generated" && (
            <button
              type="button"
              onClick={() => setActiveTab("bracket")}
              className={`rounded-lg px-4 py-2 text-xs font-semibold transition ${
                activeTab === "bracket"
                  ? "bg-amber-500 text-zinc-950 font-bold shadow-md shadow-amber-500/20"
                  : "text-amber-400 hover:text-amber-300 font-bold"
              }`}
            >
              Playoff Bracket
            </button>
          )}
        </div>
      </div>

      {/* Group Selector Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 scrollbar-none">
        <span className="text-xs font-bold text-zinc-500 uppercase shrink-0 mr-1">Group:</span>
        {groups.map((g) => (
          <button
            key={g.group_id}
            type="button"
            onClick={() => setSelectedGroupId(g.group_id)}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition shrink-0 border ${
              String(selectedGroupId) === String(g.group_id)
                ? "bg-zinc-800 text-white border-zinc-600 shadow-md"
                : "bg-zinc-950/80 text-zinc-400 border-zinc-800/80 hover:border-zinc-700 hover:text-white"
            }`}
          >
            {g.group_name}
          </button>
        ))}
      </div>

      {/* TAB 1: STANDINGS */}
      {activeTab === "standings" && (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 overflow-hidden shadow-xl">
          {activeStandingsData.loading ? (
            <div className="p-8 text-center text-xs text-zinc-500 animate-pulse">Loading standings...</div>
          ) : activeStandingsData.error ? (
            <div className="p-8 text-center text-xs text-red-400">{activeStandingsData.error}</div>
          ) : activeStandingsData.standings.length === 0 ? (
            <div className="p-12 text-center text-xs text-zinc-500">No standings data available for this group.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-zinc-800 bg-zinc-950/90 text-zinc-400 text-[11px] uppercase tracking-wider">
                    <th className="py-3.5 pl-6 font-bold">Rank</th>
                    <th className="py-3.5 font-bold">Team</th>
                    <th className="py-3.5 text-center font-bold">P</th>
                    <th className="py-3.5 text-center font-bold">W</th>
                    <th className="py-3.5 text-center font-bold">L</th>
                    <th className="py-3.5 text-center font-bold">Kills</th>
                    <th className="py-3.5 text-center font-bold">+/-</th>
                    <th className="py-3.5 pr-6 text-right font-bold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {activeStandingsData.standings.map((row) => (
                    <tr
                      key={row.member_id}
                      className={`hover:bg-zinc-800/30 transition ${
                        row.qualified ? "bg-emerald-500/5" : ""
                      }`}
                    >
                      {/* Rank */}
                      <td className="py-4 pl-6 font-black text-white">
                        <div className="flex items-center gap-1.5">
                          <span className={row.rank === 1 ? "text-amber-400" : row.rank === 2 ? "text-slate-300" : "text-zinc-400"}>
                            #{row.rank}
                          </span>
                          {row.final_rank && (
                            <span className="text-[10px] text-zinc-500 font-normal" title="Organizer tie-breaker rank">
                              (R{row.final_rank})
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Team */}
                      <td className="py-4 font-bold text-white">
                        <div className="flex items-center gap-2">
                          <span>{row.team_name}</span>
                          {row.team_tag && (
                            <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] font-bold text-zinc-400">
                              [{row.team_tag}]
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Stats */}
                      <td className="py-4 text-center font-semibold text-zinc-300">{row.played}</td>
                      <td className="py-4 text-center font-semibold text-emerald-400">{row.wins}</td>
                      <td className="py-4 text-center font-semibold text-red-400">{row.losses}</td>
                      <td className="py-4 text-center font-semibold text-white">{row.total_kills}</td>
                      <td
                        className={`py-4 text-center font-semibold ${
                          row.kill_difference > 0
                            ? "text-emerald-400"
                            : row.kill_difference < 0
                            ? "text-red-400"
                            : "text-zinc-400"
                        }`}
                      >
                        {row.kill_difference > 0 ? `+${row.kill_difference}` : row.kill_difference}
                      </td>

                      {/* Status */}
                      <td className="py-4 pr-6 text-right">
                        {row.qualified ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold uppercase text-emerald-400 border border-emerald-500/20">
                            ✓ Qualified
                          </span>
                        ) : (
                          <span className="text-[11px] text-zinc-500 font-medium">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: GROUPS & TEAMS */}
      {activeTab === "groups" && (
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2">
          {groups.map((group) => {
            const gMembers = members.filter((m) => String(m.group_id) === String(group.group_id));
            return (
              <div
                key={group.group_id}
                className="rounded-2xl border border-zinc-800 bg-zinc-900/50 overflow-hidden shadow-xl"
              >
                <div className="border-b border-zinc-800 bg-zinc-950/80 px-5 py-3.5 flex items-center justify-between">
                  <h4 className="text-base font-black text-white">{group.group_name}</h4>
                  <span className="text-xs font-semibold text-zinc-500">{gMembers.length} / 4 Teams</span>
                </div>

                <div className="p-4 space-y-2.5">
                  {[1, 2, 3, 4].map((slotNum) => {
                    const member = gMembers.find((m) => Number(m.slot) === slotNum);
                    return (
                      <div
                        key={slotNum}
                        className="rounded-xl border border-zinc-800/80 bg-zinc-950/60 p-3.5 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-500/10 text-xs font-black text-red-500 border border-red-500/20">
                            {slotNum}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-white">
                              {member ? member.team_name : <span className="text-zinc-600 italic">Empty Slot</span>}
                            </p>
                            {member?.team_tag && (
                              <p className="text-[11px] font-semibold text-zinc-500">Tag: [{member.team_tag}]</p>
                            )}
                          </div>
                        </div>

                        {member?.qualified && (
                          <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase text-emerald-400 border border-emerald-500/20">
                            Qualified
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 3: MATCHES */}
      {activeTab === "matches" && (
        <div className="space-y-6">
          {Object.keys(matchesByRound).length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/20 p-12 text-center text-xs text-zinc-400">
              No group matches generated yet for this group.
            </div>
          ) : (
            Object.keys(matchesByRound).map((roundNum) => (
              <div key={roundNum} className="space-y-3">
                <h4 className="text-xs font-bold tracking-widest text-zinc-400 uppercase">
                  Round {roundNum} Matches
                </h4>

                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                  {matchesByRound[roundNum].map((m) => {
                    const teamA = m.participants?.[0];
                    const teamB = m.participants?.[1];
                    const isCompleted = m.status === "completed";

                    return (
                      <div
                        key={m.match_id}
                        className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 shadow-lg flex flex-col justify-between"
                      >
                        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3 mb-3 text-xs">
                          <span className="font-semibold text-zinc-500">Match #{m.match_id}</span>
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase border ${
                              isCompleted
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                : "bg-zinc-800 text-zinc-400 border-zinc-700"
                            }`}
                          >
                            {m.status}
                          </span>
                        </div>

                        {/* Match Participants & Score */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-bold text-white">
                              {teamA?.team_name || "TBD"}
                              {teamA?.team_tag && <span className="text-xs text-zinc-500 ml-1">[{teamA.team_tag}]</span>}
                            </span>
                          </div>

                          <div className="text-center text-xs font-bold text-zinc-500 my-1 uppercase tracking-widest">
                            VS
                          </div>

                          <div className="flex items-center justify-between text-sm">
                            <span className="font-bold text-white">
                              {teamB?.team_name || "TBD"}
                              {teamB?.team_tag && <span className="text-xs text-zinc-500 ml-1">[{teamB.team_tag}]</span>}
                            </span>
                          </div>
                        </div>

                        {!isCompleted && (
                          <div className="mt-4 pt-3 border-t border-zinc-800/80 flex justify-end">
                            <button
                              type="button"
                              onClick={() => setSelectedMatchForSubmit(m)}
                              className="rounded-lg bg-red-500/10 border border-red-500/30 px-3 py-1.5 text-xs font-bold text-red-400 hover:bg-red-500/20 transition"
                            >
                              Submit Result
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 4: PLAYOFF BRACKET */}
      {activeTab === "bracket" && (
        <PlayoffBracketView stageId={stageId} />
      )}

      {/* Submit Result Modal */}
      <SubmitResultModal
        isOpen={Boolean(selectedMatchForSubmit)}
        match={selectedMatchForSubmit}
        onClose={() => setSelectedMatchForSubmit(null)}
        onSuccess={(msg) => {
          fetchStageData();
          onToast && onToast(msg);
        }}
      />
    </div>
  );
}

export default PublicGroupStageView;

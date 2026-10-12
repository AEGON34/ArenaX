import React, { useEffect, useState } from "react";
import { getBracket, getMe, getMyTeams, getMyRegistrations } from "../api";
import SubmitResultModal from "./SubmitResultModal";
import PendingResultsReview from "./PendingResultsReview";

function PlayoffBracketView({ stageId, tournamentId, onToast }) {
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [bracketData, setBracketData] = useState(null);
  const [fetchedTournamentId, setFetchedTournamentId] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [myCaptainTeamIds, setMyCaptainTeamIds] = useState([]);
  const [myCaptainRegIds, setMyCaptainRegIds] = useState([]);
  const [selectedMatchForSubmit, setSelectedMatchForSubmit] = useState(null);

  const effectiveTournamentId = tournamentId || fetchedTournamentId;

  // Active section filter: 'all' | 'play_in' | 'upper' | 'lower' | 'grand_final'
  const [activeSection, setActiveSection] = useState("upper");

  const fetchBracket = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const data = await getBracket(stageId);
      setBracketData(data.bracket || null);
      if (data.tournament_id || data.tournamentId) {
        setFetchedTournamentId(data.tournament_id || data.tournamentId);
      }
    } catch (err) {
      console.error("Failed to fetch playoff bracket:", err);
      setErrorMsg(err.message || err.data?.error || "Failed to load playoff bracket.");
    } finally {
      setLoading(false);
    }
  };

  const fetchUserData = async () => {
    try {
      const meData = await getMe();
      const user = meData.user || null;
      setCurrentUser(user);

      if (user) {
        try {
          const [myTeams, myRegs] = await Promise.all([
            getMyTeams().catch(() => []),
            getMyRegistrations().catch(() => []),
          ]);

          const capTeamIdsFromTeams = (myTeams || [])
            .filter((t) => (t.role && t.role.toLowerCase() === "captain") || t.is_captain)
            .map((t) => Number(t.team_id));

          const capTeamIdsFromRegs = (myRegs || [])
            .filter((r) => r.team_id)
            .map((r) => Number(r.team_id));

          const allCapTeamIds = Array.from(
            new Set([...capTeamIdsFromTeams, ...capTeamIdsFromRegs])
          );
          const regIds = (myRegs || [])
            .filter((r) => r.registration_id)
            .map((r) => Number(r.registration_id));

          setMyCaptainTeamIds(allCapTeamIds);
          setMyCaptainRegIds(regIds);
        } catch (teamErr) {
          console.error("Failed to load user teams/registrations:", teamErr);
        }
      }
    } catch {
      setCurrentUser(null);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  useEffect(() => {
    if (stageId) {
      fetchBracket();
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
        <button onClick={fetchBracket} className="ml-3 font-bold underline hover:text-white">
          Retry
        </button>
      </div>
    );
  }

  if (!bracketData) {
    return (
      <div className="mt-8 rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/20 p-12 text-center text-xs text-zinc-500">
        No playoff bracket available yet.
      </div>
    );
  }

  const playInMatches = bracketData.playIn || [];
  const upperMatches = bracketData.upperBracket || [];
  const lowerMatches = bracketData.lowerBracket || [];
  const grandFinalMatch = bracketData.grandFinal || null;

  const hasPlayIn = playInMatches.length > 0;

  // Helper: Group matches by round_number
  const groupMatchesByRound = (matchList) => {
    const rounds = {};
    matchList.forEach((m) => {
      const r = m.round_number || 1;
      if (!rounds[r]) rounds[r] = [];
      rounds[r].push(m);
    });
    return rounds;
  };

  const renderMatchCard = (m) => {
    const participants = m.participants || [];
    const sideA = participants.find((p) => p.side === "A");
    const sideB = participants.find((p) => p.side === "B");
    const isCompleted = m.status === "completed" || m.result_status === "VERIFIED";
    const bestOf = m.best_of || "BO1";
    const hasBothParticipants = Boolean(sideA && sideB);

    const isCaptainOfMatch = (m.participants || []).some(
      (p) =>
        (p.team_id && myCaptainTeamIds.includes(Number(p.team_id))) ||
        (p.registration_id && myCaptainRegIds.includes(Number(p.registration_id)))
    );

    const isPendingVerification =
      m.result_status === "SUBMITTED" ||
      m.status === "pending_verification";

    return (
      <div
        key={m.match_id}
        className="w-72 shrink-0 rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4 shadow-xl flex flex-col justify-between"
      >
        {/* Card Header */}
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2.5 mb-3 text-[11px]">
          <span className="font-bold text-zinc-400">Match #{m.match_id}</span>
          <div className="flex items-center gap-1.5">
            <span
              className={`rounded px-1.5 py-0.5 font-black uppercase text-[9px] ${
                bestOf === "BO5"
                  ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                  : bestOf === "BO3"
                  ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                  : "bg-zinc-800 text-zinc-400"
              }`}
            >
              {bestOf}
            </span>
            <span
              className={`rounded-full px-2 py-0.5 font-bold uppercase text-[9px] border ${
                isCompleted
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                  : "bg-zinc-800 text-zinc-400 border-zinc-700"
              }`}
            >
              {m.status}
            </span>
          </div>
        </div>

        {/* Participant Side A */}
        <div className="space-y-2">
          <div
            className={`rounded-xl border p-2.5 text-xs flex items-center justify-between ${
              sideA ? "border-zinc-800 bg-zinc-950/80" : "border-dashed border-zinc-800/60 bg-zinc-950/30 text-zinc-500"
            }`}
          >
            <div className="flex items-center gap-2 truncate">
              <span className="text-[10px] font-bold text-red-500">A</span>
              {sideA ? (
                <span className="font-bold text-white truncate">
                  {sideA.team_name} {sideA.team_tag ? `[${sideA.team_tag}]` : ""}
                </span>
              ) : (
                <span className="italic text-zinc-500 text-[11px]">Winner/Loser of Previous Match</span>
              )}
            </div>
            {sideA?.bye_status && (
              <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-bold text-emerald-400 border border-emerald-500/20">
                BYE
              </span>
            )}
          </div>

          <div className="text-center text-[10px] font-black text-zinc-600 uppercase tracking-widest">
            VS
          </div>

          {/* Participant Side B */}
          <div
            className={`rounded-xl border p-2.5 text-xs flex items-center justify-between ${
              sideB ? "border-zinc-800 bg-zinc-950/80" : "border-dashed border-zinc-800/60 bg-zinc-950/30 text-zinc-500"
            }`}
          >
            <div className="flex items-center gap-2 truncate">
              <span className="text-[10px] font-bold text-red-500">B</span>
              {sideB ? (
                <span className="font-bold text-white truncate">
                  {sideB.team_name} {sideB.team_tag ? `[${sideB.team_tag}]` : ""}
                </span>
              ) : (
                <span className="italic text-zinc-500 text-[11px]">Winner/Loser of Previous Match</span>
              )}
            </div>
            {sideB?.bye_status && (
              <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-bold text-emerald-400 border border-emerald-500/20">
                BYE
              </span>
            )}
          </div>
        </div>

        {/* Action Footer */}
        <div className="mt-3 pt-2.5 border-t border-zinc-800/80 flex items-center justify-between text-xs">
          {isCompleted ? (
            <span className="text-emerald-400 font-bold text-[11px]">✓ Result Verified</span>
          ) : isPendingVerification ? (
            currentUser?.role === "organizer" ? (
              <span className="text-amber-400 font-bold text-[11px]">⚡ Pending Organizer Review</span>
            ) : (
              <span className="text-amber-400 font-semibold text-[11px]">⏳ Result Submitted (Awaiting Review)</span>
            )
          ) : isCaptainOfMatch && hasBothParticipants ? (
            <button
              type="button"
              onClick={() => setSelectedMatchForSubmit(m)}
              className="w-full rounded-lg bg-red-500 px-3 py-1 text-xs font-bold text-white hover:bg-red-600 shadow-md shadow-red-500/20 transition"
            >
              Submit Result
            </button>
          ) : hasBothParticipants ? (
            <span className="text-zinc-500 text-[11px] font-medium">Scheduled</span>
          ) : (
            <span className="text-zinc-600 text-[11px] italic">Awaiting Advancing Teams</span>
          )}
        </div>

        {/* Advancement Links Preview */}
        {m.advancements && m.advancements.length > 0 && (
          <div className="mt-2.5 pt-2 border-t border-zinc-800/40 text-[10px] text-zinc-500 flex flex-wrap gap-2">
            {m.advancements.map((adv) => (
              <span key={adv.advancement_id} className="truncate">
                {adv.outcome_type === "WINNER" ? "➔ Winner" : "➔ Loser"} to Match #{adv.destination_match_id} ({adv.destination_side})
              </span>
            ))}
          </div>
        )}
      </div>
    );
  };

  const getRoundTitle = (sectionKey, roundNumber, maxRounds) => {
    const r = Number(roundNumber);
    const max = Number(maxRounds);
    if (sectionKey === "Upper Bracket") {
      if (r === max) return "Upper Final";
      if (r === max - 1) return "Semifinals";
      if (r === max - 2) return "Quarterfinals";
      return `Round ${r}`;
    }
    if (sectionKey === "Lower Bracket") {
      if (r === max) return "Lower Final";
      if (r === max - 1) return "Lower Semifinal";
      return `Lower Round ${r}`;
    }
    if (sectionKey === "Play-In Round") {
      return `Play-In Round ${r}`;
    }
    return `Round ${r}`;
  };

  const renderBracketSection = (matchesList, sectionTitle) => {
    const rounds = groupMatchesByRound(matchesList);
    const roundNumbers = Object.keys(rounds).sort((a, b) => Number(a) - Number(b));
    const maxRound = roundNumbers.length > 0 ? Math.max(...roundNumbers.map(Number)) : 1;

    if (roundNumbers.length === 0) {
      return (
        <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/20 p-8 text-center text-xs text-zinc-500">
          No matches in {sectionTitle}.
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">{sectionTitle}</h4>

        {/* Horizontal Round Columns */}
        <div className="flex items-start gap-6 overflow-x-auto pb-4 scrollbar-thin">
          {roundNumbers.map((rNum) => (
            <div key={rNum} className="space-y-3 shrink-0">
              <div className="rounded-lg bg-zinc-900 px-3 py-1.5 text-center text-xs font-black text-white border border-zinc-800">
                {getRoundTitle(sectionTitle, rNum, maxRound)}
              </div>
              <div className="space-y-4">
                {rounds[rNum].map((matchItem) => renderMatchCard(matchItem))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="mt-8 pt-8 border-t border-zinc-800/80 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-black text-white">Playoff Double Elimination Bracket</h3>
            <span className="rounded-full bg-purple-500/10 px-3 py-1 text-xs font-bold text-purple-400 border border-purple-500/20">
              Double Elimination
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Upper Bracket, Lower Bracket, BO3 Semifinals, and BO5 Grand Final.
          </p>
        </div>

        {/* Bracket Section Filters */}
        <div className="flex items-center gap-1 bg-zinc-900 p-1.5 rounded-xl border border-zinc-800 self-start sm:self-auto">
          {hasPlayIn && (
            <button
              type="button"
              onClick={() => setActiveSection("play_in")}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                activeSection === "play_in" ? "bg-red-500 text-white" : "text-zinc-400 hover:text-white"
              }`}
            >
              Play-In Round
            </button>
          )}

          <button
            type="button"
            onClick={() => setActiveSection("upper")}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              activeSection === "upper" ? "bg-red-500 text-white" : "text-zinc-400 hover:text-white"
            }`}
          >
            Upper Bracket
          </button>

          <button
            type="button"
            onClick={() => setActiveSection("lower")}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              activeSection === "lower" ? "bg-red-500 text-white" : "text-zinc-400 hover:text-white"
            }`}
          >
            Lower Bracket
          </button>

          <button
            type="button"
            onClick={() => setActiveSection("grand_final")}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              activeSection === "grand_final" ? "bg-red-500 text-white" : "text-zinc-400 hover:text-white"
            }`}
          >
            Grand Final (BO5)
          </button>
        </div>
      </div>

      {/* Render Active Bracket Section */}
      {activeSection === "play_in" && hasPlayIn && renderBracketSection(playInMatches, "Play-In Round")}

      {activeSection === "upper" && renderBracketSection(upperMatches, "Upper Bracket")}

      {activeSection === "lower" && renderBracketSection(lowerMatches, "Lower Bracket")}

      {activeSection === "grand_final" && (
        <div className="space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Grand Final (BO5)</h4>
          {grandFinalMatch ? (
            <div className="flex justify-center p-4">
              {renderMatchCard(grandFinalMatch)}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/20 p-8 text-center text-xs text-zinc-500">
              Grand Final match not available yet.
            </div>
          )}
        </div>
      )}

      {/* Organizer Pending Results Review Section */}
      {currentUser?.role === "organizer" && effectiveTournamentId && (
        <PendingResultsReview
          tournamentId={effectiveTournamentId}
          onRefreshData={fetchBracket}
          onToast={onToast}
        />
      )}

      {/* Submit Result Modal */}
      <SubmitResultModal
        isOpen={Boolean(selectedMatchForSubmit)}
        match={selectedMatchForSubmit}
        onClose={() => setSelectedMatchForSubmit(null)}
        onSuccess={(msg) => {
          fetchBracket();
          onToast && onToast(msg);
        }}
      />
    </div>
  );
}

export default PlayoffBracketView;

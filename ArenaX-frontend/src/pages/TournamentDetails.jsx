import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import RegisterTeamModal from "../components/RegisterTeamModal";
import PublicGroupStageView from "../components/PublicGroupStageView";
import PlayoffBracketView from "../components/PlayoffBracketView";
import { getTournamentDetails, getMe, getMyRegistrations, getTournamentStages } from "../api";
import { formatPrizePool } from "../utils/formatters";

const STATUS_STYLES = {
  draft: "bg-zinc-700/30 text-zinc-400 border-zinc-600/30",
  published: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  live: "bg-red-500/10 text-red-400 border-red-500/30 animate-pulse",
  completed: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
};

const REG_TIMELINE_STYLES = {
  NOT_STARTED: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  OPEN: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  CLOSED: "bg-zinc-800 text-zinc-400 border-zinc-700",
  FROZEN: "bg-purple-500/10 text-purple-400 border-purple-500/20",
};

const REG_STATUS_STYLES = {
  pending: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  approved: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  rejected: "bg-red-500/10 text-red-400 border-red-500/20",
};

const FORMAT_LABELS = {
  group_stage: "Group Stage",
  single_elimination: "Single Elimination",
  double_elimination: "Double Elimination",
};

function TournamentDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [tournament, setTournament] = useState(null);
  const [stages, setStages] = useState([]);
  const [user, setUser] = useState(null);
  const [myRegistration, setMyRegistration] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [toastMessage, setToastMessage] = useState("");
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

  // Active Hub Tab: 'overview' | 'groups' | 'standings' | 'matches' | 'bracket'
  const [activeTab, setActiveTab] = useState("overview");

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 4000);
  };

  const fetchDetails = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const data = await getTournamentDetails(id);
      setTournament(data);

      try {
        const stagesData = await getTournamentStages(id);
        setStages(stagesData);
      } catch (stageErr) {
        console.error("Failed to load stages:", stageErr);
        setStages([]);
      }

      try {
        const meData = await getMe();
        setUser(meData.user);

        const myRegs = await getMyRegistrations();
        const existing = myRegs.find(
          (r) => String(r.tournament_id) === String(id)
        );
        setMyRegistration(existing || null);
      } catch {
        setUser(null);
      }
    } catch (err) {
      console.error("Failed to load tournament:", err);
      if (err.isUnauthenticated) {
        navigate("/login");
        return;
      }
      setErrorMsg(err.message || "Tournament not found.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, navigate]);

  const handleRegisterSuccess = () => {
    showToast("Registration submitted successfully!");
    fetchDetails();
  };

  const isOwner = user && tournament && Number(user.user_id) === Number(tournament.organizer_id);
  const groupStage = stages.find((s) => s.stage_format === "group_stage");
  const playoffStage =
    stages.find(
      (s) => s.stage_format === "single_elimination" || s.stage_format === "double_elimination"
    ) || (groupStage?.group_generation_status === "bracket_generated" ? groupStage : null);

  const regStatus = tournament?.registration_status || (tournament?.status === "published" ? "OPEN" : "CLOSED");
  const canShowRegisterButton =
    user && tournament && regStatus === "OPEN" && !myRegistration;

  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return null;
      return d.toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return null;
    }
  };

  // Lifecycle stage indicators (derived from backend stage and tournament states)
  const isRegDone = regStatus === "CLOSED" || regStatus === "FROZEN" || tournament?.status === "live" || tournament?.status === "completed";
  const isGroupsGenerated = groupStage && ["matches_generated", "qualified", "bracket_generated"].includes(groupStage.group_generation_status);
  const isQualified = groupStage && ["qualified", "bracket_generated"].includes(groupStage.group_generation_status);
  const isBracketGenerated = Boolean(playoffStage && (groupStage?.group_generation_status === "bracket_generated" || playoffStage.stage_format !== "group_stage"));
  const isCompleted = tournament?.status === "completed";

  return (
    <div className="min-h-screen bg-[var(--bg-obsidian)] text-white flex flex-col font-sans antialiased">
      <Navbar />

      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-950/90 px-5 py-3.5 text-sm text-emerald-300 shadow-2xl backdrop-blur-md">
          <span className="font-semibold">{toastMessage}</span>
        </div>
      )}

      <main className="mx-auto max-w-5xl w-full px-6 py-12 flex-1">
        {loading ? (
          <div className="h-64 rounded-2xl border border-zinc-800 bg-zinc-900/30 animate-pulse" />
        ) : errorMsg ? (
          <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/20 p-16 text-center">
            <h3 className="text-xl font-bold text-white">{errorMsg}</h3>
            <Link
              to="/tournaments"
              className="mt-6 inline-flex items-center gap-2 rounded-xl border border-zinc-700 px-6 py-3 font-semibold text-white transition hover:border-zinc-500"
            >
              &larr; Back to Tournaments
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Tournament Header Hero */}
            <div className="rounded-2xl border border-[var(--color-arena-border)] bg-[#090a0f] p-6 sm:p-8 shadow-2xl space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-2.5">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold uppercase border shadow-sm ${STATUS_STYLES[tournament.status] || STATUS_STYLES.draft}`}
                    >
                      {isCompleted ? "🏆 COMPLETED" : tournament.status}
                    </span>
                    <span className="text-xs font-black tracking-widest text-red-400 uppercase font-display border border-red-500/20 bg-red-500/10 px-2.5 py-0.5 rounded">
                      {tournament.game_name}
                    </span>
                    {tournament.registration_status && (
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase border ${REG_TIMELINE_STYLES[tournament.registration_status] || "bg-zinc-800 text-zinc-400 border-zinc-700"}`}
                      >
                        REGISTRATION {tournament.registration_status === "NOT_STARTED" ? "NOT STARTED" : tournament.registration_status}
                      </span>
                    )}
                  </div>

                  <h1 className="text-3xl md:text-5xl font-extrabold font-display tracking-wider text-white">
                    {tournament.name}
                  </h1>
                </div>

                {/* Organizer Management Shortcuts */}
                {isOwner && (
                  <div className="flex flex-wrap sm:flex-col gap-2 shrink-0">
                    <Link
                      to={`/tournaments/${id}/stages`}
                      className="rounded-xl bg-red-500 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-red-500/20 hover:bg-red-600 transition text-center"
                    >
                      ⚙ Manage Stages & Groups
                    </Link>
                    <Link
                      to={`/tournaments/${id}/registrations`}
                      className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2 text-xs font-semibold text-zinc-300 hover:border-zinc-500 hover:text-white transition text-center"
                    >
                      👥 Review Registrations
                    </Link>
                  </div>
                )}
              </div>

              {/* Tournament Lifecycle State Machine */}
              <div className="pt-4 border-t border-zinc-800/80">
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-3">
                  Tournament Lifecycle Progress
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
                  <div className={`p-2.5 rounded-xl border ${isRegDone ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" : regStatus === "OPEN" ? "border-red-500/40 bg-red-500/15 text-white font-bold animate-pulse" : "border-zinc-800 bg-zinc-900/40 text-zinc-500"}`}>
                    <div className="text-[10px] uppercase font-bold">{isRegDone ? "✓ Complete" : regStatus === "OPEN" ? "● Active" : "○ Upcoming"}</div>
                    <div className="text-xs font-semibold mt-0.5">Registration</div>
                  </div>

                  <div className={`p-2.5 rounded-xl border ${isQualified ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" : isGroupsGenerated ? "border-red-500/40 bg-red-500/15 text-white font-bold animate-pulse" : "border-zinc-800 bg-zinc-900/40 text-zinc-500"}`}>
                    <div className="text-[10px] uppercase font-bold">{isQualified ? "✓ Complete" : isGroupsGenerated ? "● Active" : "○ Upcoming"}</div>
                    <div className="text-xs font-semibold mt-0.5">Group Stage</div>
                  </div>

                  <div className={`p-2.5 rounded-xl border ${isQualified ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" : isGroupsGenerated ? "border-amber-500/30 bg-amber-500/10 text-amber-400 font-semibold" : "border-zinc-800 bg-zinc-900/40 text-zinc-500"}`}>
                    <div className="text-[10px] uppercase font-bold">{isQualified ? "✓ Complete" : isGroupsGenerated ? "● Pending" : "○ Upcoming"}</div>
                    <div className="text-xs font-semibold mt-0.5">Qualification</div>
                  </div>

                  <div className={`p-2.5 rounded-xl border ${isCompleted ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" : isBracketGenerated ? "border-red-500/40 bg-red-500/15 text-white font-bold animate-pulse" : "border-zinc-800 bg-zinc-900/40 text-zinc-500"}`}>
                    <div className="text-[10px] uppercase font-bold">{isCompleted ? "✓ Complete" : isBracketGenerated ? "● Active" : "○ Upcoming"}</div>
                    <div className="text-xs font-semibold mt-0.5">Playoffs</div>
                  </div>

                  <div className={`col-span-2 sm:col-span-1 p-2.5 rounded-xl border ${isCompleted ? "border-emerald-500/40 bg-emerald-500/20 text-emerald-400 font-bold" : "border-zinc-800 bg-zinc-900/40 text-zinc-500"}`}>
                    <div className="text-[10px] uppercase font-bold">{isCompleted ? "🏆 Winner Crowned" : "○ Upcoming"}</div>
                    <div className="text-xs font-semibold mt-0.5">Grand Final</div>
                  </div>
                </div>
              </div>

              {/* Quick Specs Grid */}
              <div className="grid gap-3 sm:grid-cols-4 pt-2">
                <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/80 p-3.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 font-display">Format</p>
                  <p className="mt-1 text-xs font-bold text-white capitalize">
                    {tournament.format?.replace("_", " ")}
                  </p>
                </div>
                <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/80 p-3.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 font-display">Organizer</p>
                  <p className="mt-1 text-xs font-bold text-white truncate">
                    @{tournament.organizer_username || "ArenaX Staff"}
                  </p>
                </div>
                <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/80 p-3.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 font-display">Prize Pool</p>
                  <p className="mt-1 text-xs font-extrabold text-emerald-400 font-display tracking-wider">
                    {formatPrizePool(tournament.prize_pool_usd)}
                  </p>
                </div>
                <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/80 p-3.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 font-display">Registration Window</p>
                  <p className="mt-1 text-xs font-bold text-zinc-300 truncate">
                    {tournament.registration_end_at ? `Closes ${formatDate(tournament.registration_end_at)}` : "Ongoing"}
                  </p>
                </div>
              </div>

              {/* Navigation Hub Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-2 border-t border-zinc-800/80 scrollbar-none">
                <button
                  type="button"
                  onClick={() => setActiveTab("overview")}
                  className={`rounded-xl px-4 py-2 text-xs font-bold transition shrink-0 ${activeTab === "overview" ? "bg-red-500 text-white shadow-md shadow-red-500/20" : "bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800"}`}
                >
                  Overview
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("groups")}
                  className={`rounded-xl px-4 py-2 text-xs font-bold transition shrink-0 ${activeTab === "groups" ? "bg-red-500 text-white shadow-md shadow-red-500/20" : "bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800"}`}
                >
                  Groups & Teams
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("standings")}
                  className={`rounded-xl px-4 py-2 text-xs font-bold transition shrink-0 ${activeTab === "standings" ? "bg-red-500 text-white shadow-md shadow-red-500/20" : "bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800"}`}
                >
                  Standings
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("matches")}
                  className={`rounded-xl px-4 py-2 text-xs font-bold transition shrink-0 ${activeTab === "matches" ? "bg-red-500 text-white shadow-md shadow-red-500/20" : "bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800"}`}
                >
                  Matches
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("bracket")}
                  className={`rounded-xl px-4 py-2 text-xs font-bold transition shrink-0 ${activeTab === "bracket" ? "bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20" : "bg-zinc-900 text-amber-400 hover:text-amber-300 hover:bg-zinc-800"}`}
                >
                  Playoff Bracket
                </button>
              </div>
            </div>

            {/* TAB 1: OVERVIEW */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                {/* Registration Action Section */}
                <div className="rounded-2xl border border-zinc-800 bg-[#090a0f] p-6 shadow-xl space-y-4">
                  <h3 className="text-base font-bold text-white">Team Registration</h3>

                  {/* Registration Timeline Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/60 p-4">
                      <span className="text-zinc-500">Registration Opens:</span>
                      <p className="mt-1 font-semibold text-white">
                        {formatDate(tournament.registration_start_at) || "Not restricted (Immediate)"}
                      </p>
                    </div>

                    <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/60 p-4">
                      <span className="text-zinc-500">Registration Deadline:</span>
                      <p className="mt-1 font-semibold text-white">
                        {formatDate(tournament.registration_end_at) || "Not restricted"}
                      </p>
                    </div>
                  </div>

                  {user ? (
                    <div>
                      {myRegistration ? (
                        <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/80 p-5 flex items-center justify-between">
                          <div>
                            <p className="text-xs text-zinc-500">Your Registered Team</p>
                            <p className="mt-1 text-sm font-bold text-white">
                              {myRegistration.team_name}
                            </p>
                          </div>
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold uppercase border ${REG_STATUS_STYLES[myRegistration.status] || "text-zinc-400"}`}
                          >
                            {myRegistration.status}
                          </span>
                        </div>
                      ) : canShowRegisterButton ? (
                        <button
                          onClick={() => setIsRegisterModalOpen(true)}
                          className="w-full rounded-xl bg-red-500 py-3.5 font-bold text-white shadow-xl shadow-red-500/20 transition hover:bg-red-600"
                        >
                          Register My Team
                        </button>
                      ) : (
                        <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-950/40 p-4 text-center text-xs text-zinc-500">
                          {regStatus === "NOT_STARTED"
                            ? "Registration has not opened yet. Check back at the opening date."
                            : regStatus === "FROZEN"
                            ? "Registration is frozen because group matches or stages have already started."
                            : "Registration is currently closed for this tournament."}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-950/40 p-6 text-center text-xs text-zinc-400">
                      <span>Please </span>
                      <Link to="/login" className="font-bold text-red-500 underline hover:text-red-400">
                        log in
                      </Link>
                      <span> as a team captain to register your team.</span>
                    </div>
                  )}
                </div>

                {/* Stages List */}
                <div className="rounded-2xl border border-zinc-800 bg-[#090a0f] p-6 shadow-xl space-y-4">
                  <h3 className="text-base font-bold text-white">Tournament Stages</h3>
                  {stages.length === 0 ? (
                    <p className="text-xs text-zinc-500 italic">No stages configured yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {stages.map((stage) => (
                        <div
                          key={stage.stage_id}
                          className="rounded-xl border border-zinc-800/80 bg-zinc-950/60 p-4 flex items-center justify-between"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10 border border-red-500/20 text-xs font-extrabold text-red-400">
                              {stage.stage_order}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-white">{stage.stage_name}</p>
                              <p className="text-xs text-zinc-500">
                                {FORMAT_LABELS[stage.stage_format] || stage.stage_format}
                              </p>
                            </div>
                          </div>
                          <span className="rounded-full bg-zinc-800 px-3 py-1 text-[11px] font-semibold text-zinc-400 uppercase">
                            {stage.group_generation_status?.replace("_", " ") || "Scheduled"}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: GROUPS & TEAMS */}
            {activeTab === "groups" && (
              <div>
                {groupStage ? (
                  <PublicGroupStageView
                    stageId={groupStage.stage_id}
                    tournamentId={id}
                    initialTab="groups"
                    onToast={showToast}
                  />
                ) : (
                  <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/20 p-16 text-center">
                    <h3 className="text-base font-bold text-white">GROUP STAGE NOT GENERATED YET</h3>
                    <p className="mt-1 text-xs text-zinc-400">
                      The organizer has not configured or generated groups for this tournament yet.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: STANDINGS */}
            {activeTab === "standings" && (
              <div>
                {groupStage ? (
                  <PublicGroupStageView
                    stageId={groupStage.stage_id}
                    tournamentId={id}
                    initialTab="standings"
                    onToast={showToast}
                  />
                ) : (
                  <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/20 p-16 text-center">
                    <h3 className="text-base font-bold text-white">STANDINGS NOT AVAILABLE YET</h3>
                    <p className="mt-1 text-xs text-zinc-400">
                      Group stage standings will be calculated and displayed once group matches begin.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: MATCHES */}
            {activeTab === "matches" && (
              <div>
                {groupStage ? (
                  <PublicGroupStageView
                    stageId={groupStage.stage_id}
                    tournamentId={id}
                    initialTab="matches"
                    onToast={showToast}
                  />
                ) : (
                  <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/20 p-16 text-center">
                    <h3 className="text-base font-bold text-white">MATCHES NOT GENERATED YET</h3>
                    <p className="mt-1 text-xs text-zinc-400">
                      Group matches will appear here once generated by the tournament organizer.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* TAB 5: PLAYOFF BRACKET */}
            {activeTab === "bracket" && (
              <div>
                {playoffStage ? (
                  <PlayoffBracketView
                    stageId={playoffStage.stage_id}
                    tournamentId={id}
                    onToast={showToast}
                  />
                ) : (
                  <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/20 p-16 text-center">
                    <h3 className="text-base font-bold text-white">PLAYOFF BRACKET NOT GENERATED YET</h3>
                    <p className="mt-1 text-xs text-zinc-400">
                      The playoff double-elimination bracket will appear here once teams qualify and the bracket is generated.
                    </p>
                  </div>
                )}
              </div>
            )}

            <Link
              to="/tournaments"
              className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-zinc-400 hover:text-white transition"
            >
              &larr; Back to Tournaments
            </Link>
          </div>
        )}
      </main>

      <RegisterTeamModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        onSuccess={handleRegisterSuccess}
        tournament={tournament}
      />

      <Footer />
    </div>
  );
}

export default TournamentDetails;
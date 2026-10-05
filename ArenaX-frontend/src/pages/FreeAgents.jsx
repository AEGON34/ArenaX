import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import FreeAgentCard from "../components/FreeAgentCard";
import RecruitingTeamCard from "../components/RecruitingTeamCard";
import InvitePlayerModal from "../components/InvitePlayerModal";
import ApplyToTeamModal from "../components/ApplyToTeamModal";
import {
  getFreeAgents,
  getRecruitingTeams,
  getGames,
  getMyTeams,
  getMyGameAccounts,
  getMyTeamApplications,
  getMe
} from "../api";

function FreeAgents() {
  const [activeTab, setActiveTab] = useState("players"); // "players" | "teams"
  const [freeAgents, setFreeAgents] = useState([]);
  const [recruitingTeams, setRecruitingTeams] = useState([]);
  const [games, setGames] = useState([]);
  const [myTeams, setMyTeams] = useState([]);
  const [myGameAccounts, setMyGameAccounts] = useState([]);
  const [user, setUser] = useState(null);

  // Filters for Free Agents
  const [selectedGame, setSelectedGame] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [universityInput, setUniversityInput] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState("");
  const [toastMessage, setToastMessage] = useState("");

  // Sent invitations map & Applied teams map
  const [sentInvitationsMap, setSentInvitationsMap] = useState({});
  const [appliedTeamIdsMap, setAppliedTeamIdsMap] = useState({});

  // Invite Modal State
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [targetAgent, setTargetAgent] = useState(null);

  // Apply Modal State
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [targetTeam, setTargetTeam] = useState(null);

  const navigate = useNavigate();

  // Load User, Games, Captain's Teams, My Game Accounts & Submitted Applications
  useEffect(() => {
    const initData = async () => {
      try {
        const userData = await getMe().catch(() => null);
        setUser(userData ? userData.user : null);

        const gamesList = await getGames().catch(() => []);
        setGames(gamesList);

        if (userData && userData.user) {
          const [teamsList, gaList, myApps] = await Promise.all([
            getMyTeams().catch(() => []),
            getMyGameAccounts().catch(() => []),
            getMyTeamApplications().catch(() => []),
          ]);

          setMyTeams(teamsList);
          setMyGameAccounts(gaList);

          // Build map of already applied teams
          const appMap = {};
          myApps.forEach((app) => {
            if ((app.application_status || "").toLowerCase() === "pending") {
              appMap[app.team_id] = true;
            }
          });
          setAppliedTeamIdsMap(appMap);
        }
      } catch (err) {
        console.error("Initialization error:", err);
      }
    };

    initData();
  }, []);

  // Fetch data depending on activeTab
  const fetchData = async () => {
    setLoading(true);
    setAuthError("");

    try {
      if (activeTab === "players") {
        const filters = {};
        if (selectedGame) filters.game_id = selectedGame;
        if (selectedRole) filters.preferred_role = selectedRole;
        if (universityInput.trim()) filters.university = universityInput.trim();
        if (searchInput.trim()) filters.search = searchInput.trim();

        const data = await getFreeAgents(filters);
        setFreeAgents(data);
      } else {
        const filters = {};
        if (selectedGame) filters.game_id = selectedGame;
        if (searchInput.trim()) filters.search = searchInput.trim();

        const data = await getRecruitingTeams(filters);
        setRecruitingTeams(data);
      }
    } catch (err) {
      console.error("Fetch error:", err);
      if (activeTab === "players" && err.status === 403) {
        setAuthError(err.message || "Player recruitment is available to team captains and organizers.");
        setFreeAgents([]);
      } else if (err.isUnauthenticated) {
        setAuthError("Please log in to continue.");
        setFreeAgents([]);
        setRecruitingTeams([]);
      } else {
        setFreeAgents([]);
        setRecruitingTeams([]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab, selectedGame, selectedRole]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchData();
  };

  const handleClearFilters = () => {
    setSelectedGame("");
    setSelectedRole("");
    setUniversityInput("");
    setSearchInput("");
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage("");
    }, 4000);
  };

  // Invitation Modal Handlers
  const handleOpenInviteModal = (agent) => {
    setTargetAgent(agent);
    setInviteModalOpen(true);
  };

  const handleInviteSuccess = (gameAccountId) => {
    setSentInvitationsMap((prev) => ({ ...prev, [gameAccountId]: true }));
    showToast("Invitation sent successfully.");
  };

  // Application Modal Handlers
  const handleOpenApplyModal = (team) => {
    setTargetTeam(team);
    setApplyModalOpen(true);
  };

  const handleApplySuccess = (teamId) => {
    setAppliedTeamIdsMap((prev) => ({ ...prev, [teamId]: true }));
    showToast("Application sent successfully.");
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col">
      <Navbar />

      {/* Success Notification Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-950/90 px-5 py-3.5 text-sm text-emerald-300 shadow-2xl backdrop-blur-md animate-fade-in">
          <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
          <span className="font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Hero Header */}
      <section className="border-b border-zinc-900 bg-gradient-to-b from-zinc-900/40 to-zinc-950 px-6 py-16 text-center relative overflow-hidden">
        <div className="mx-auto max-w-4xl relative z-10">
          <p className="mb-3 text-xs font-bold tracking-[0.3em] text-red-500 uppercase">
            ARENAX RECRUITMENT MARKETPLACE
          </p>

          <h1 className="text-4xl font-black md:text-6xl tracking-tight">
            {activeTab === "players" ? (
              <>FIND <span className="text-red-500">PLAYERS.</span></>
            ) : (
              <>FIND YOUR <span className="text-red-500">TEAM.</span></>
            )}
          </h1>

          <p className="mx-auto mt-4 max-w-xl text-zinc-400 text-sm md:text-base leading-relaxed">
            {activeTab === "players"
              ? "Build your roster with the right players. Discover available competitive free agents across MOBA esports titles."
              : "Find a team that matches your game and join the competition."}
          </p>
        </div>
      </section>

      {/* Primary Tab Navigation Toggle */}
      <div className="border-b border-zinc-800 bg-zinc-950/80 px-6 sticky top-16 z-30 backdrop-blur-md">
        <div className="mx-auto max-w-7xl flex justify-center">
          <div className="flex gap-2 p-1.5">
            <button
              onClick={() => {
                setActiveTab("players");
                handleClearFilters();
              }}
              className={`flex items-center gap-2 rounded-xl px-6 py-3 font-bold text-sm transition ${
                activeTab === "players"
                  ? "bg-red-500 text-white shadow-lg shadow-red-500/20"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-900"
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              FIND PLAYERS
            </button>

            <button
              onClick={() => {
                setActiveTab("teams");
                handleClearFilters();
              }}
              className={`flex items-center gap-2 rounded-xl px-6 py-3 font-bold text-sm transition ${
                activeTab === "teams"
                  ? "bg-red-500 text-white shadow-lg shadow-red-500/20"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-900"
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m0 0h4m-4 0V11m0 0h4m-4 0H7" />
              </svg>
              FIND A TEAM
            </button>
          </div>
        </div>
      </div>

      {/* Main Discovery Container */}
      <main className="mx-auto max-w-7xl w-full px-6 py-12 space-y-10 flex-1">
        {/* Search & Filter Toolbar */}
        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 shadow-xl space-y-6">
          <form onSubmit={handleSearchSubmit} className="space-y-4">
            {/* Search Input */}
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-zinc-300">
                {activeTab === "players"
                  ? "Search player by name or UID"
                  : "Search teams by name or tag"}
              </label>
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder={
                    activeTab === "players"
                      ? "Enter game username or UID (e.g. Player123 or 109823412)..."
                      : "Enter team name or tag (e.g. ArenaX Warriors or AXW)..."
                  }
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-red-500"
                />
                <button
                  type="submit"
                  className="rounded-xl bg-red-500 px-6 py-3 font-bold text-white transition hover:bg-red-600 shrink-0"
                >
                  Search
                </button>
              </div>
            </div>

            {/* Combined Filters Grid */}
            <div className={`grid gap-4 ${activeTab === "players" ? "sm:grid-cols-3" : "sm:grid-cols-1"}`}>
              {/* Game Filter */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-zinc-400">
                  Game
                </label>
                <select
                  value={selectedGame}
                  onChange={(e) => setSelectedGame(e.target.value)}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3.5 py-2.5 text-sm text-white outline-none focus:border-red-500"
                >
                  <option value="">All Games</option>
                  {games.map((g) => (
                    <option key={g.game_id} value={g.game_id}>
                      {g.game_name} ({g.short_code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Player-only filters */}
              {activeTab === "players" && (
                <>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-zinc-400">
                      Preferred Role
                    </label>
                    <select
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value)}
                      className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3.5 py-2.5 text-sm text-white outline-none focus:border-red-500"
                    >
                      <option value="">All Roles</option>
                      <option value="Marksman">Marksman</option>
                      <option value="Clashlaner">Clashlaner</option>
                      <option value="Jungler">Jungler</option>
                      <option value="Roam">Roam</option>
                      <option value="Midlaner">Midlaner</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-zinc-400">
                      University
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. UIU, BRAC, NSU"
                      value={universityInput}
                      onChange={(e) => setUniversityInput(e.target.value)}
                      className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3.5 py-2.5 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-red-500"
                    />
                  </div>
                </>
              )}
            </div>

            {/* Clear Filters Action */}
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={handleClearFilters}
                className="text-xs font-semibold text-zinc-400 hover:text-red-400 transition underline uppercase tracking-wider"
              >
                Clear Filters
              </button>
            </div>
          </form>
        </section>

        {/* 403 Forbidden / Authorization Error State (Only for players tab if restricted) */}
        {authError && activeTab === "players" && (
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-10 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Restricted Access</h3>
            <p className="text-sm text-zinc-300 max-w-md mx-auto mb-6">{authError}</p>

            {!user ? (
              <button
                onClick={() => navigate("/login")}
                className="rounded-xl bg-red-500 px-6 py-3 font-semibold text-white hover:bg-red-600 transition"
              >
                Login to ArenaX
              </button>
            ) : (
              <div className="flex justify-center gap-4">
                <button
                  onClick={() => navigate("/teams")}
                  className="rounded-xl bg-red-500 px-6 py-3 font-semibold text-white hover:bg-red-600 transition shadow-lg shadow-red-500/20"
                >
                  CREATE TEAM
                </button>
                <button
                  onClick={() => setActiveTab("teams")}
                  className="rounded-xl border border-zinc-700 bg-zinc-900 px-6 py-3 font-semibold text-white hover:bg-zinc-800 transition"
                >
                  BROWSE RECRUITING TEAMS
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 1: FIND PLAYERS GRID */}
        {activeTab === "players" && !authError && (
          <section>
            <div className="flex items-center justify-between mb-6 pb-3 border-b border-zinc-900">
              <div>
                <h2 className="text-xl font-bold text-white">Available Competitors</h2>
                <p className="text-xs text-zinc-400 mt-1">Players eligible for roster recruitment.</p>
              </div>
              <span className="text-xs font-mono font-semibold text-zinc-400 bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-lg">
                {freeAgents.length} {freeAgents.length === 1 ? "Player" : "Players"} Available
              </span>
            </div>

            {loading ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-64 rounded-2xl border border-zinc-800 bg-zinc-900/30 p-6 animate-pulse" />
                ))}
              </div>
            ) : freeAgents.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/20 p-16 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900 text-zinc-500">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-white">No available players found.</h3>
                <p className="mt-1 text-sm text-zinc-400">Try changing your search or filters.</p>
                <button
                  onClick={handleClearFilters}
                  className="mt-5 rounded-lg border border-zinc-700 px-4 py-2 text-xs font-semibold text-zinc-300 hover:bg-zinc-900"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {freeAgents.map((agent) => (
                  <FreeAgentCard
                    key={agent.free_agent_id}
                    agent={agent}
                    onInvite={handleOpenInviteModal}
                    invitationSent={Boolean(sentInvitationsMap[agent.account_id])}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {/* TAB 2: FIND A TEAM GRID */}
        {activeTab === "teams" && (
          <section>
            <div className="flex items-center justify-between mb-6 pb-3 border-b border-zinc-900">
              <div>
                <h2 className="text-xl font-bold text-white">Teams Recruiting Main Roster Players</h2>
                <p className="text-xs text-zinc-400 mt-1">Teams currently forming and looking for open roster slots.</p>
              </div>
              <span className="text-xs font-mono font-semibold text-zinc-400 bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-lg">
                {recruitingTeams.length} {recruitingTeams.length === 1 ? "Team" : "Teams"} Recruiting
              </span>
            </div>

            {loading ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-64 rounded-2xl border border-zinc-800 bg-zinc-900/30 p-6 animate-pulse" />
                ))}
              </div>
            ) : recruitingTeams.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/20 p-16 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900 text-zinc-500">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m0 0h4m-4 0V11m0 0h4m-4 0H7" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-white">No teams are currently recruiting.</h3>
                <p className="mt-1 text-sm text-zinc-400">Check back later or try clearing your search filters.</p>
                <button
                  onClick={handleClearFilters}
                  className="mt-5 rounded-lg border border-zinc-700 px-4 py-2 text-xs font-semibold text-zinc-300 hover:bg-zinc-900"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {recruitingTeams.map((team) => (
                  <RecruitingTeamCard
                    key={team.team_id}
                    team={team}
                    onApply={handleOpenApplyModal}
                    hasApplied={Boolean(appliedTeamIdsMap[team.team_id])}
                  />
                ))}
              </div>
            )}
          </section>
        )}
      </main>

      {/* Team Invitation Modal (For Captains) */}
      <InvitePlayerModal
        isOpen={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        onSuccess={handleInviteSuccess}
        targetAgent={targetAgent}
        myTeams={myTeams}
      />

      {/* Team Application Modal (For Players) */}
      <ApplyToTeamModal
        isOpen={applyModalOpen}
        onClose={() => setApplyModalOpen(false)}
        onSuccess={handleApplySuccess}
        targetTeam={targetTeam}
        myGameAccounts={myGameAccounts}
      />

      <Footer />
    </div>
  );
}

export default FreeAgents;
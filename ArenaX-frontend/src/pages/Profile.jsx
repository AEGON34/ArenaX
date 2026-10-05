import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import GameAccountCard from "../components/GameAccountCard";
import GameAccountModal from "../components/GameAccountModal";
import FreeAgentProfileModal from "../components/FreeAgentProfileModal";
import {
  getMe,
  getMyGameAccounts,
  getGames,
  logoutUser,
  getMyFreeAgents,
  deleteFreeAgentProfile,
  getMyTeamInvitations,
  acceptTeamInvitation,
  rejectTeamInvitation,
  getMyTeamApplications,
  deleteGameAccount
} from "../api";

function Profile() {
  const [user, setUser] = useState(null);
  const [gameAccounts, setGameAccounts] = useState([]);
  const [games, setGames] = useState([]);
  const [freeAgentProfiles, setFreeAgentProfiles] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [applications, setApplications] = useState([]);

  const [loadingUser, setLoadingUser] = useState(true);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [loadingFa, setLoadingFa] = useState(true);
  const [loadingInvitations, setLoadingInvitations] = useState(true);
  const [loadingApplications, setLoadingApplications] = useState(true);

  // Modals
  const [isGaModalOpen, setIsGaModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);

  const [isFaModalOpen, setIsFaModalOpen] = useState(false);
  const [editingFaProfile, setEditingFaProfile] = useState(null);

  const [toastMessage, setToastMessage] = useState("");

  const navigate = useNavigate();

  // Load User Info
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const data = await getMe();
        setUser(data.user);
      } catch (error) {
        console.error("Failed to load user profile:", error);
        navigate("/login");
      } finally {
        setLoadingUser(false);
      }
    };

    fetchUserData();
  }, [navigate]);

  // Load Game Accounts & Games
  const loadGameData = async () => {
    setLoadingAccounts(true);
    try {
      const [fetchedAccounts, fetchedGames] = await Promise.all([
        getMyGameAccounts(),
        getGames(),
      ]);
      setGameAccounts(fetchedAccounts);
      setGames(fetchedGames);
    } catch (error) {
      console.error("Failed to load game accounts:", error);
      if (error.isUnauthenticated) {
        navigate("/login");
      }
    } finally {
      setLoadingAccounts(false);
    }
  };

  // Load Free Agent Profiles
  const loadFreeAgentProfiles = async () => {
    setLoadingFa(true);
    try {
      const faList = await getMyFreeAgents();
      setFreeAgentProfiles(faList);
    } catch (error) {
      console.error("Failed to load free agent profiles:", error);
    } finally {
      setLoadingFa(false);
    }
  };

  // Load Invitations
  const loadInvitations = async () => {
    setLoadingInvitations(true);
    try {
      const fetchedInvitations = await getMyTeamInvitations();
      setInvitations(fetchedInvitations);
    } catch (error) {
      console.error("Failed to load team invitations:", error);
    } finally {
      setLoadingInvitations(false);
    }
  };

  // Load Team Applications
  const loadApplications = async () => {
    setLoadingApplications(true);
    try {
      const fetchedApps = await getMyTeamApplications();
      setApplications(fetchedApps);
    } catch (error) {
      console.error("Failed to load team applications:", error);
    } finally {
      setLoadingApplications(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadGameData();
      loadFreeAgentProfiles();
      loadInvitations();
      loadApplications();
    }
  }, [user]);

  const showSuccessToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage("");
    }, 4000);
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      window.dispatchEvent(new Event("auth-change"));
      navigate("/login");
    } catch (error) {
      console.error(error);
      window.dispatchEvent(new Event("auth-change"));
      navigate("/login");
    }
  };

  // Game Account Handlers
  const handleOpenAddGaModal = () => {
    setEditingAccount(null);
    setIsGaModalOpen(true);
  };

  const handleOpenEditGaModal = (account) => {
    setEditingAccount(account);
    setIsGaModalOpen(true);
  };

  const handleGaModalSuccess = () => {
    loadGameData();
    showSuccessToast(
      editingAccount
        ? "Game account updated successfully!"
        : "Game account added successfully!"
    );
  };

  
  const handleDeleteGameAccount = async (account) => {
    if (!window.confirm(`Delete game account "${account.game_username}"? This cannot be undone.`)) {
      return;
    }
    try {
      await deleteGameAccount(account.account_id);
      showSuccessToast("Game account deleted successfully.");
      loadGameData();
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to delete game account.");
    }
  };

  // Free Agent Handlers
  const handleOpenCreateFaModal = () => {
    setEditingFaProfile(null);
    setIsFaModalOpen(true);
  };

  const handleOpenEditFaModal = (profile) => {
    setEditingFaProfile(profile);
    setIsFaModalOpen(true);
  };

  const handleRemoveFaProfile = async (faId) => {
    if (!window.confirm("Remove your free-agent profile?")) return;
    try {
      await deleteFreeAgentProfile(faId);
      showSuccessToast("Free-agent profile removed successfully.");
      loadFreeAgentProfiles();
      loadGameData();
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to remove free-agent profile.");
    }
  };

  // Invitation Handlers
  const handleAcceptInvite = async (inv) => {
    try {
      await acceptTeamInvitation(inv.invitation_id);
      showSuccessToast(`You joined ${inv.team_name}!`);
      loadInvitations();
      loadApplications();
      loadGameData();
      loadFreeAgentProfiles();
      navigate(`/teams/${inv.team_id}`);
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to accept invitation.");
    }
  };

  const handleRejectInvite = async (invId) => {
    try {
      await rejectTeamInvitation(invId);
      showSuccessToast("Invitation rejected.");
      loadInvitations();
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to reject invitation.");
    }
  };

  if (loadingUser) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-zinc-800 border-t-red-500 mb-4" />
          <p className="text-sm font-medium text-zinc-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col">
      <Navbar />

      {/* Success Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-950/90 px-5 py-3.5 text-sm text-emerald-300 shadow-2xl backdrop-blur-md animate-fade-in">
          <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
          <span className="font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Hero Banner Header */}
      <section className="relative border-b border-zinc-900 bg-gradient-to-b from-zinc-900/60 to-zinc-950 px-6 py-12">
        <div className="mx-auto max-w-7xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-red-700 text-3xl font-black text-white shadow-xl shadow-red-500/10 border border-red-400/20">
              {user.username.charAt(0).toUpperCase()}
            </div>

            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-3xl font-black tracking-tight text-white">
                  Welcome, <span className="text-red-500">{user.username}</span>
                </h1>
                <span className="rounded-full bg-red-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-red-400 border border-red-500/20">
                  {user.role}
                </span>
                <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-400 border border-emerald-500/20">
                  {user.account_status}
                </span>
              </div>
              <p className="mt-1 text-sm text-zinc-400">
                ArenaX Esports Competitor Dashboard
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-zinc-300 transition hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-400"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
        </div>
      </section>

      {/* Main Content Sections */}
      <main className="mx-auto max-w-7xl w-full px-6 py-12 space-y-12 flex-1">
        {/* Section 1: Personal Information */}
        <section>
          <div className="mb-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-red-500" />
              Personal Information
            </h2>
            <p className="text-xs text-zinc-400 mt-1">
              Your registered platform user details.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-4">
              <p className="text-xs font-medium text-zinc-500">User ID</p>
              <p className="mt-1.5 font-mono text-sm font-semibold text-white">#{user.user_id}</p>
            </div>

            <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-4">
              <p className="text-xs font-medium text-zinc-500">Username</p>
              <p className="mt-1.5 text-sm font-semibold text-white">{user.username}</p>
            </div>

            <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-4">
              <p className="text-xs font-medium text-zinc-500">Email Address</p>
              <p className="mt-1.5 text-sm font-semibold text-white truncate">{user.email}</p>
            </div>

            <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-4">
              <p className="text-xs font-medium text-zinc-500">Platform Role</p>
              <p className="mt-1.5 text-sm font-semibold capitalize text-white">{user.role}</p>
            </div>

            <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-4">
              <p className="text-xs font-medium text-zinc-500">Account Status</p>
              <p className="mt-1.5 text-sm font-semibold capitalize text-emerald-400">{user.account_status}</p>
            </div>
          </div>
        </section>

        {/* Section 2: MY RECRUITMENT PROFILE */}
        <section>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                MY RECRUITMENT PROFILE
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                List your game accounts as free agents to be discovered by team captains.
              </p>
            </div>

            {freeAgentProfiles.length === 0 && (
              <button
                onClick={handleOpenCreateFaModal}
                className="inline-flex items-center gap-2 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-red-500/20 transition hover:bg-red-600 self-start sm:self-auto"
              >
                + CREATE FREE-AGENT PROFILE
              </button>
            )}
          </div>

          {loadingFa ? (
            <div className="h-28 rounded-2xl border border-zinc-800 bg-zinc-900/30 animate-pulse" />
          ) : freeAgentProfiles.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/20 p-8 text-center">
              <p className="text-sm font-semibold text-white">You are not currently listed as a free agent.</p>
              <p className="text-xs text-zinc-400 mt-1">
                Create a recruitment profile for one of your linked game accounts so team captains can invite you.
              </p>
              <button
                onClick={handleOpenCreateFaModal}
                className="mt-4 rounded-xl bg-red-500 px-5 py-2.5 text-xs font-bold text-white hover:bg-red-600 transition"
              >
                CREATE FREE-AGENT PROFILE
              </button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {freeAgentProfiles.map((fa) => (
                <div
                  key={fa.free_agent_id}
                  className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="rounded-md bg-red-500/10 px-2.5 py-1 text-xs font-bold uppercase text-red-400 border border-red-500/20">
                        {fa.game_name}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase border ${
                          (fa.availability_status || "").toLowerCase() === "available"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : "bg-zinc-800 text-zinc-400 border-zinc-700"
                        }`}
                      >
                        {fa.availability_status}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-white">{fa.game_username}</h3>

                    <div className="mt-3 space-y-1.5 text-xs text-zinc-400 border-t border-zinc-800/80 pt-3">
                      <div className="flex justify-between">
                        <span>Preferred Role:</span>
                        <span className="font-semibold text-white">{fa.preferred_role || "Flex / Any"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Region:</span>
                        <span className="uppercase text-zinc-300">{fa.server_region}</span>
                      </div>
                      {fa.university && (
                        <div className="flex justify-between">
                          <span>University:</span>
                          <span className="text-zinc-300 font-medium truncate max-w-[150px]">{fa.university}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-5 pt-3 border-t border-zinc-800/80">
                    <button
                      onClick={() => handleOpenEditFaModal(fa)}
                      className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800/50 py-2 text-xs font-semibold text-zinc-200 hover:bg-zinc-800 hover:text-white transition"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleRemoveFaProfile(fa.free_agent_id)}
                      className="flex-1 rounded-lg border border-red-500/30 bg-red-500/10 py-2 text-xs font-semibold text-red-400 hover:bg-red-500/20 transition"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Section 3: MY INVITATIONS */}
        <section>
          <div className="mb-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              MY INVITATIONS ({invitations.length})
            </h2>
            <p className="text-xs text-zinc-400 mt-1">
              Roster invitations sent by team captains to your linked game accounts.
            </p>
          </div>

          {loadingInvitations ? (
            <div className="h-32 rounded-2xl border border-zinc-800 bg-zinc-900/30 animate-pulse" />
          ) : invitations.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/20 p-8 text-center text-xs text-zinc-500">
              You don't have any invitations.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {invitations.map((inv) => {
                const isPending = (inv.invitation_status || "").toLowerCase() === "pending";
                const isAccepted = (inv.invitation_status || "").toLowerCase() === "accepted";

                return (
                  <div
                    key={inv.invitation_id}
                    className={`rounded-2xl border p-5 flex flex-col justify-between ${
                      isPending
                        ? "border-amber-500/30 bg-zinc-900/80"
                        : "border-zinc-800 bg-zinc-950/60"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="rounded-md bg-red-500/10 px-2.5 py-1 text-xs font-bold uppercase text-red-400 border border-red-500/20">
                          {inv.game_name}
                        </span>
                        <span className="text-xs font-mono font-bold text-zinc-400">
                          [{inv.team_tag}]
                        </span>
                      </div>

                      <h3 className="text-lg font-bold text-white">{inv.team_name}</h3>
                      <p className="text-xs text-zinc-400 mt-0.5">Captain: {inv.captain_username}</p>
                      <p className="text-[11px] text-zinc-500 mt-1">
                        Sent: {new Date(inv.sent_at).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="mt-5 pt-3 border-t border-zinc-800/80">
                      {isPending ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAcceptInvite(inv)}
                            className="flex-1 rounded-lg bg-emerald-500 py-2 text-xs font-bold text-white hover:bg-emerald-600 transition shadow-lg shadow-emerald-500/10"
                          >
                            ACCEPT
                          </button>
                          <button
                            onClick={() => handleRejectInvite(inv.invitation_id)}
                            className="flex-1 rounded-lg border border-zinc-700 py-2 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 hover:text-white transition"
                          >
                            REJECT
                          </button>
                        </div>
                      ) : (
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-zinc-500">Status</span>
                          <span
                            className={`font-bold uppercase px-2.5 py-0.5 rounded text-[11px] border ${
                              isAccepted
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                : "bg-red-500/10 text-red-400 border-red-500/20"
                            }`}
                          >
                            {inv.invitation_status}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Section 4: MY TEAM APPLICATIONS */}
        <section>
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-red-500" />
                MY TEAM APPLICATIONS ({applications.length})
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                Applications you have submitted to join recruiting team main rosters.
              </p>
            </div>
          </div>

          {loadingApplications ? (
            <div className="h-32 rounded-2xl border border-zinc-800 bg-zinc-900/30 animate-pulse" />
          ) : applications.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/20 p-8 text-center text-xs text-zinc-500">
              You haven't applied to any teams yet.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {applications.map((app) => {
                const status = (app.application_status || "").toLowerCase();
                const isPending = status === "pending";
                const isAccepted = status === "accepted";

                return (
                  <div
                    key={app.application_id}
                    className={`rounded-2xl border p-5 flex flex-col justify-between ${
                      isPending
                        ? "border-red-500/30 bg-zinc-900/80"
                        : "border-zinc-800 bg-zinc-950/60"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="rounded-md bg-red-500/10 px-2.5 py-1 text-xs font-bold uppercase text-red-400 border border-red-500/20">
                          {app.game_name}
                        </span>
                        <span className="text-xs font-mono font-bold text-zinc-400">
                          [{app.team_tag}]
                        </span>
                      </div>

                      <h3 className="text-lg font-bold text-white">{app.team_name}</h3>
                      <p className="text-[11px] text-zinc-500 mt-1">
                        Applied: {new Date(app.applied_at).toLocaleDateString()}
                      </p>
                      {app.responded_at && (
                        <p className="text-[11px] text-zinc-500">
                          Responded: {new Date(app.responded_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>

                    <div className="mt-5 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs">
                      <span className="text-zinc-500">Application Status</span>
                      <span
                        className={`font-bold uppercase px-2.5 py-0.5 rounded text-[11px] border ${
                          isPending
                            ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                            : isAccepted
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : "bg-red-500/10 text-red-400 border-red-500/20"
                        }`}
                      >
                        {app.application_status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Section 5: My Game Accounts */}
        <section>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-red-500" />
                My Game Accounts
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                Link your MOBA game accounts to join competitive teams and enter tournaments.
              </p>
            </div>

            <button
              onClick={handleOpenAddGaModal}
              className="inline-flex items-center gap-2 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-red-500/20 transition hover:bg-red-600 self-start sm:self-auto"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
              </svg>
              Add Game Account
            </button>
          </div>

          {loadingAccounts ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-56 rounded-2xl border border-zinc-800 bg-zinc-900/30 p-6 animate-pulse" />
              ))}
            </div>
          ) : gameAccounts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/20 p-12 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900 text-zinc-500">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M11 4a2 2 0 114 0v1a2 2 0 002 2h3a1 1 0 011 1v3a2 2 0 01-2 2h-1a2 2 0 100 4h1a2 2 0 012 2v3a1 1 0 01-1 1h-3a2 2 0 01-2-2v-1a2 2 0 10-4 0v1a2 2 0 01-2 2H4a1 1 0 01-1-1v-3a2 2 0 012-2h1a2 2 0 100-4H4a2 2 0 01-2-2V7a1 1 0 011-1h3a2 2 0 01-2-2V4z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-white">You haven't linked any game accounts yet.</h3>
              <p className="mt-1 text-sm text-zinc-400 max-w-md mx-auto">
                Link your game accounts (Dota 2, LoL, MLBB) to build rosters or sign up as a free agent.
              </p>
              <button
                onClick={handleOpenAddGaModal}
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-red-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-600"
              >
                + Add Game Account
              </button>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {gameAccounts.map((account) => {
                const matchedGame = games.find(
                  (g) => String(g.game_id) === String(account.game_id)
                );
                return (
                  <GameAccountCard
                    key={account.account_id}
                    account={account}
                    game={matchedGame}
                    onEdit={handleOpenEditGaModal}
                    onDelete={handleDeleteGameAccount}
                  />
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* Game Account Modal */}
      <GameAccountModal
        isOpen={isGaModalOpen}
        onClose={() => setIsGaModalOpen(false)}
        onSuccess={handleGaModalSuccess}
        editingAccount={editingAccount}
        games={games}
      />

      {/* Free Agent Profile Modal */}
      <FreeAgentProfileModal
        isOpen={isFaModalOpen}
        onClose={() => setIsFaModalOpen(false)}
        onSuccess={() => {
          loadFreeAgentProfiles();
          showSuccessToast(
            editingFaProfile
              ? "Free-agent profile updated successfully!"
              : "Free-agent profile created successfully!"
          );
        }}
        editingProfile={editingFaProfile}
        myGameAccounts={gameAccounts}
        games={games}
      />

      <Footer />
    </div>
  );
}

export default Profile;
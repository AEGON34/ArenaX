import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import TeamMemberCard from "../components/TeamMemberCard";
import {
  getTeamDetails,
  getMyGameAccounts,
  getReceivedTeamApplications,
  acceptTeamApplication,
  rejectTeamApplication,
  deleteTeam,
  updateMemberRole,
  removeTeamMember
} from "../api";

function TeamDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [team, setTeam] = useState(null);
  const [isCaptainUser, setIsCaptainUser] = useState(false);
  const [receivedApps, setReceivedApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingApps, setLoadingApps] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [toastMessage, setToastMessage] = useState("");
  const [showDisbandModal, setShowDisbandModal] = useState(false);
  const [isDisbanding, setIsDisbanding] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState(null);
  const [isRemovingMember, setIsRemovingMember] = useState(false);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage("");
    }, 4000);
  };

  const fetchDetails = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const [teamData, myAccounts] = await Promise.all([
        getTeamDetails(id),
        getMyGameAccounts().catch(() => []),
      ]);
      setTeam(teamData);

      // Determine if logged-in user is captain of this team
      const captainMember = (teamData?.members || []).find(
        (m) => (m.role || "").toLowerCase() === "captain"
      );
      if (captainMember && myAccounts.length > 0) {
        const isOwner = myAccounts.some(
          (ga) => String(ga.account_id) === String(captainMember.account_id)
        );
        setIsCaptainUser(isOwner);

        if (isOwner) {
          fetchReceivedApps();
        }
      } else {
        setIsCaptainUser(false);
      }
    } catch (err) {
      console.error("Failed to load team details:", err);
      if (err.isUnauthenticated) {
        navigate("/login");
        return;
      }
      setErrorMsg(err.message || "Team not found or failed to load.");
    } finally {
      setLoading(false);
    }
  };

  const fetchReceivedApps = async () => {
    setLoadingApps(true);
    try {
      const apps = await getReceivedTeamApplications();
      // Filter for this team
      const teamApps = apps.filter((a) => String(a.team_id) === String(id));
      setReceivedApps(teamApps);
    } catch (err) {
      console.error("Failed to fetch received team applications:", err);
    } finally {
      setLoadingApps(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchDetails();
    }
  }, [id, navigate]);

  const handleAcceptApp = async (appId) => {
    try {
      await acceptTeamApplication(appId);
      showToast("Player application accepted.");
      fetchDetails();
      fetchReceivedApps();
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to accept application.");
    }
  };

  const handleRejectApp = async (appId) => {
    try {
      await rejectTeamApplication(appId);
      showToast("Application rejected.");
      fetchReceivedApps();
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to reject application.");
    }
  };

  const handleDisbandTeam = async () => {
    setIsDisbanding(true);
    try {
      await deleteTeam(id);
      navigate("/teams", { state: { toastMessage: "Team disbanded successfully." } });
    } catch (err) {
      console.error("Failed to disband team:", err);
      alert(err.message || "Failed to disband team.");
      setIsDisbanding(false);
      setShowDisbandModal(false);
    }
  };

  const handleRoleChange = async (accountId, newRole) => {
    try {
      await updateMemberRole(id, accountId, newRole);
      showToast(newRole ? `Player role slot updated to ${newRole}.` : "Player role set to Flex.");
      fetchDetails();
    } catch (err) {
      console.error("Failed to update member role slot:", err);
      alert(err.message || "Failed to update member role slot.");
    }
  };

  const handleConfirmRemoveMember = async () => {
    if (!memberToRemove) return;
    setIsRemovingMember(true);
    try {
      await removeTeamMember(id, memberToRemove.account_id);
      showToast(`${memberToRemove.game_username} removed from team.`);
      setMemberToRemove(null);
      fetchDetails();
    } catch (err) {
      console.error("Failed to remove member:", err);
      alert(err.message || "Failed to remove member.");
    } finally {
      setIsRemovingMember(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-zinc-800 border-t-red-500 mb-4" />
          <p className="text-sm font-medium text-zinc-400">Loading team roster...</p>
        </div>
      </div>
    );
  }

  if (errorMsg || !team) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900 text-zinc-500">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Team Not Found</h2>
          <p className="text-sm text-zinc-400 max-w-md mb-6">{errorMsg || "The team you are looking for does not exist."}</p>
          <Link
            to="/teams"
            className="rounded-xl bg-red-500 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-red-600"
          >
            &larr; Back to My Teams
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const members = team.members || [];
  
  // Categorize roster members according to backend fields
  const captain = members.find((m) => (m.role || "").toLowerCase() === "captain");
  const mainRoster = members.filter(
    (m) => (m.role || "").toLowerCase() !== "captain" && !m.is_substitute
  );
  const substitutes = members.filter(
    (m) => (m.role || "").toLowerCase() !== "captain" && Boolean(m.is_substitute)
  );

  const isForming = (team.status || "").toLowerCase() === "forming";

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col">
      <Navbar />

      {/* Team Profile Banner */}
      <section className="border-b border-zinc-900 bg-gradient-to-b from-zinc-900/60 to-zinc-950 px-6 py-12">
        <div className="mx-auto max-w-5xl">
          {/* Back button */}
          <Link
            to="/teams"
            className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-white transition mb-8"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to My Teams
          </Link>

          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              {/* Logo Badge */}
              <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-3xl border border-red-500/30 bg-gradient-to-br from-red-500/20 to-zinc-900 text-4xl font-black text-red-500 shadow-2xl shadow-red-500/10">
                {team.team_name.charAt(0).toUpperCase()}
              </div>

              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
                    {team.team_name}
                  </h1>
                  <span className="rounded-lg bg-zinc-900 border border-zinc-700 px-3 py-1 font-mono text-sm font-bold text-zinc-200">
                    [{team.team_tag}]
                  </span>
                </div>

                <div className="flex items-center gap-3 mt-3">
                  <span className="text-sm font-semibold text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-1 rounded-full">
                    {team.game_name}
                  </span>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider border ${
                      isForming
                        ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                        : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    }`}
                  >
                    STATUS: {team.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Captain Actions & Status Summary */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              {isCaptainUser && (
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => navigate("/free-agents")}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-500 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-red-500/20 transition hover:bg-red-600"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                    RECRUIT PLAYERS
                  </button>
                  <button
                    onClick={() => setShowDisbandModal(true)}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-500/40 bg-red-500/10 px-5 py-3 text-sm font-bold text-red-400 hover:bg-red-500 hover:text-white transition"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    DISBAND TEAM
                  </button>
                </div>
              )}

              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 text-right shrink-0">
                <p className="text-xs text-zinc-400">Total Roster Size</p>
                <p className="text-2xl font-black text-white mt-1">{members.length} Players</p>
                <p className="text-[11px] text-zinc-500 mt-1">
                  {isForming ? "Needs 5 members to activate" : "Roster fully active"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-950/90 px-5 py-3.5 text-sm text-emerald-300 shadow-2xl backdrop-blur-md animate-fade-in">
          <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
          <span className="font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Roster Sections */}
      <main className="mx-auto max-w-5xl w-full px-6 py-12 space-y-10 flex-1">
        {/* Section 0: CAPTAIN RECEIVED TEAM APPLICATIONS */}
        {isCaptainUser && (
          <section className="rounded-2xl border border-red-500/30 bg-zinc-900/60 p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse" />
                  RECEIVED TEAM APPLICATIONS ({receivedApps.length})
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Players who have submitted applications to join your team's main roster.
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-zinc-400 bg-zinc-950 border border-zinc-800 px-3 py-1 rounded-lg">
                Captain View
              </span>
            </div>

            {loadingApps ? (
              <div className="h-24 rounded-xl border border-zinc-800 bg-zinc-900/30 animate-pulse" />
            ) : receivedApps.length === 0 ? (
              <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-950/40 p-6 text-center text-xs text-zinc-500">
                No player applications yet for this team.
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {receivedApps.map((app) => {
                  const isPending = (app.application_status || "").toLowerCase() === "pending";

                  return (
                    <div
                      key={app.application_id}
                      className="rounded-xl border border-zinc-800 bg-zinc-950/80 p-5 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-base font-bold text-white">{app.game_username}</h3>
                          <span
                            className={`px-2.5 py-0.5 rounded text-[11px] font-bold uppercase border ${
                              isPending
                                ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                : (app.application_status || "").toLowerCase() === "accepted"
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                : "bg-red-500/10 text-red-400 border-red-500/20"
                            }`}
                          >
                            {app.application_status}
                          </span>
                        </div>

                        <div className="space-y-1 text-xs text-zinc-400 border-t border-zinc-900 pt-2.5">
                          <div className="flex justify-between">
                            <span>UID:</span>
                            <span className="font-mono text-zinc-300">{app.game_uid}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Role:</span>
                            <span className="font-semibold text-white uppercase">
                              {app.preferred_role || "Flex / Any"}
                            </span>
                          </div>
                          {app.university && (
                            <div className="flex justify-between">
                              <span>University:</span>
                              <span className="text-zinc-300 truncate max-w-[160px]">
                                {app.university}
                              </span>
                            </div>
                          )}
                          <div className="flex justify-between pt-1">
                            <span>Applied:</span>
                            <span className="text-zinc-500">
                              {new Date(app.applied_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-zinc-900">
                        {isPending ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleAcceptApp(app.application_id)}
                              className="flex-1 rounded-lg bg-emerald-500 py-2 text-xs font-bold text-white hover:bg-emerald-600 transition shadow-lg shadow-emerald-500/10"
                            >
                              ACCEPT
                            </button>
                            <button
                              onClick={() => handleRejectApp(app.application_id)}
                              className="flex-1 rounded-lg border border-zinc-700 py-2 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 transition"
                            >
                              REJECT
                            </button>
                          </div>
                        ) : (
                          <div className="text-center text-[11px] text-zinc-500 font-medium">
                            Decision recorded
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* Section: TEAM ROLE SLOTS OVERVIEW (5 POSITIONS) */}
        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
                TEAM ROLE SLOTS (5 POSITIONS)
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Current roster role distribution across standard MOBA positions.
              </p>
            </div>
            {isCaptainUser && (
              <span className="text-[11px] font-semibold text-zinc-400 bg-zinc-950 border border-zinc-800 px-3 py-1 rounded-lg">
                Captain can switch player slots below
              </span>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {[
              { role: "Marksman", icon: "🎯" },
              { role: "Clashlaner", icon: "⚔️" },
              { role: "Jungler", icon: "🌲" },
              { role: "Roam", icon: "🛡️" },
              { role: "Midlaner", icon: "🔮" },
            ].map(({ role, icon }) => {
              const assignedMember = members.find(
                (m) => (m.assigned_role || "").toLowerCase() === role.toLowerCase()
              );

              return (
                <div
                  key={role}
                  className={`rounded-xl border p-4 flex flex-col justify-between transition ${
                    assignedMember
                      ? "border-red-500/30 bg-zinc-950/80 shadow-md"
                      : "border-dashed border-zinc-800 bg-zinc-950/30"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-black text-red-400 flex items-center gap-1.5 uppercase tracking-wide">
                        <span>{icon}</span> {role}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          assignedMember
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : "bg-zinc-800 text-zinc-500"
                        }`}
                      >
                        {assignedMember ? "FILLED" : "VACANT"}
                      </span>
                    </div>

                    {assignedMember ? (
                      <div className="mt-2">
                        <p className="font-bold text-white text-sm truncate">
                          {assignedMember.game_username}
                        </p>
                        <p className="text-[11px] text-zinc-400 capitalize mt-0.5">
                          {assignedMember.role || "Player"}
                          {assignedMember.preferred_role &&
                            assignedMember.preferred_role.toLowerCase() !== role.toLowerCase() && (
                              <span className="text-zinc-500 block text-[10px]">
                                (Prefers: {assignedMember.preferred_role})
                              </span>
                            )}
                        </p>
                      </div>
                    ) : (
                      <p className="mt-2 text-xs text-zinc-600 italic">No player assigned</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Section 1: CAPTAIN */}
        <section>
          <div className="mb-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-red-500" />
              CAPTAIN
            </h2>
            <p className="text-xs text-zinc-400">Team leader and roster administrator.</p>
          </div>

          {captain ? (
            <TeamMemberCard
              member={captain}
              isCaptainUser={isCaptainUser}
              onRoleChange={handleRoleChange}
            />
          ) : (
            <p className="text-xs text-zinc-500 italic">No captain assigned.</p>
          )}
        </section>

        {/* Section 2: MAIN ROSTER */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                MAIN ROSTER ({mainRoster.length})
              </h2>
              <p className="text-xs text-zinc-400">Starting active competitive players.</p>
            </div>
          </div>

          {mainRoster.length === 0 ? (
            <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/20 p-8 text-center">
              <p className="text-sm font-medium text-zinc-400">Your main roster beyond the captain is currently empty.</p>
              <p className="text-xs text-zinc-500 mt-1">Recruit free agents to build out your starting lineup.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {mainRoster.map((m) => (
                <TeamMemberCard
                  key={m.account_id}
                  member={m}
                  isCaptainUser={isCaptainUser}
                  onRoleChange={handleRoleChange}
                  onRemoveMember={(m) => setMemberToRemove(m)}
                />
              ))}
            </div>
          )}
        </section>

        {/* Section 3: SUBSTITUTES */}
        {substitutes.length > 0 && (
          <section>
            <div className="mb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                SUBSTITUTES ({substitutes.length})
              </h2>
              <p className="text-xs text-zinc-400">Backup and rotation squad members.</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {substitutes.map((m) => (
                <TeamMemberCard
                  key={m.account_id}
                  member={m}
                  isCaptainUser={isCaptainUser}
                  onRoleChange={handleRoleChange}
                  onRemoveMember={(m) => setMemberToRemove(m)}
                />
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Disband Confirmation Modal */}
      {showDisbandModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-red-500/30 bg-red-500/10 text-red-500">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>

            <h3 className="text-center text-xl font-bold text-white">Disband Team?</h3>
            <p className="mt-2 text-center text-xs text-zinc-400 leading-relaxed">
              Are you sure you want to disband <strong className="text-white">{team.team_name}</strong>? This action is permanent and cannot be undone. All roster memberships, invitations, applications, and tournament registrations will be deleted.
            </p>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                disabled={isDisbanding}
                onClick={() => setShowDisbandModal(false)}
                className="flex-1 rounded-xl border border-zinc-700 bg-zinc-800 py-3 text-sm font-semibold text-zinc-300 hover:bg-zinc-700 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDisbanding}
                onClick={handleDisbandTeam}
                className="flex-1 rounded-xl bg-red-500 py-3 text-sm font-bold text-white hover:bg-red-600 transition shadow-lg shadow-red-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isDisbanding ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Disbanding...
                  </>
                ) : (
                  "Yes, Disband"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remove Member Confirmation Modal */}
      {memberToRemove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-red-500/30 bg-red-500/10 text-red-500">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>

            <h3 className="text-center text-xl font-bold text-white">Remove Player?</h3>
            <p className="mt-2 text-center text-xs text-zinc-400 leading-relaxed">
              Are you sure you want to remove <strong className="text-white">{memberToRemove.game_username}</strong> from <strong className="text-white">{team.team_name}</strong>? They will be removed from the team roster and returned to free agency.
            </p>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                disabled={isRemovingMember}
                onClick={() => setMemberToRemove(null)}
                className="flex-1 rounded-xl border border-zinc-700 bg-zinc-800 py-3 text-sm font-semibold text-zinc-300 hover:bg-zinc-700 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isRemovingMember}
                onClick={handleConfirmRemoveMember}
                className="flex-1 rounded-xl bg-red-500 py-3 text-sm font-bold text-white hover:bg-red-600 transition shadow-lg shadow-red-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isRemovingMember ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Removing...
                  </>
                ) : (
                  "Yes, Remove Player"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

export default TeamDetails;
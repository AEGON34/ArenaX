import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import {
  getTournamentDetails,
  getTournamentRegistrations,
  approveRegistration,
  rejectRegistration,
  getMe,
} from "../api";

const REG_STATUS_STYLES = {
  pending: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  approved: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  rejected: "bg-red-500/10 text-red-400 border-red-500/20",
};

function TournamentRegistrations() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [tournament, setTournament] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checkingRole, setCheckingRole] = useState(true);
  const [actionErrorId, setActionErrorId] = useState(null);
  const [actionErrorMsg, setActionErrorMsg] = useState("");
  const [toastMessage, setToastMessage] = useState("");
  const [expandedRosters, setExpandedRosters] = useState({});

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 4000);
  };

  const toggleRoster = (regId) => {
    setExpandedRosters((prev) => ({
      ...prev,
      [regId]: !prev[regId],
    }));
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [tournamentData, regData] = await Promise.all([
        getTournamentDetails(id),
        getTournamentRegistrations(id),
      ]);
      setTournament(tournamentData);
      setRegistrations(regData);
    } catch (err) {
      console.error(err);
      if (err.isUnauthenticated) navigate("/login");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const checkAccess = async () => {
      try {
        const meData = await getMe();
        if (!meData.user || meData.user.role !== "organizer") {
          navigate("/tournaments");
          return;
        }
        setCheckingRole(false);
        loadData();
      } catch {
        navigate("/login");
      }
    };
    checkAccess();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, navigate]);

  const handleDecision = async (registrationId, decision) => {
    setActionErrorId(null);
    setActionErrorMsg("");
    try {
      if (decision === "approve") {
        await approveRegistration(registrationId);
      } else {
        await rejectRegistration(registrationId);
      }
      showToast(`Registration ${decision}d.`);
      loadData();
    } catch (err) {
      console.error(err);
      setActionErrorId(registrationId);
      setActionErrorMsg(err.message || "Failed to update registration.");
    }
  };

  if (checkingRole) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-zinc-700 border-t-red-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col">
      <Navbar />

      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-950/90 px-5 py-3.5 text-sm text-emerald-300 shadow-2xl backdrop-blur-md">
          <span className="font-semibold">{toastMessage}</span>
        </div>
      )}

      <main className="mx-auto max-w-4xl w-full px-6 py-16 flex-1">
        <div className="flex items-center gap-4 text-sm font-semibold text-zinc-400">
          <Link
            to={`/tournaments/${id}`}
            className="hover:text-white transition"
          >
            &larr; Back to Tournament
          </Link>
          <span>•</span>
          <Link
            to="/my-tournaments"
            className="hover:text-white transition"
          >
            My Tournaments
          </Link>
        </div>

        <div className="mt-4 mb-8">
          <h1 className="text-3xl font-black text-white">
            {tournament ? tournament.name : "Registrations"}
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Review registered teams, view player rosters, and manage tournament entry approvals.
          </p>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="h-24 rounded-2xl border border-zinc-800 bg-zinc-900/30 animate-pulse" />
            ))}
          </div>
        ) : registrations.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/20 p-16 text-center">
            <h3 className="text-lg font-bold text-white">No registrations yet.</h3>
            <p className="mt-2 text-sm text-zinc-400">
              Once teams register, they will show up here for approval.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {registrations.map((r) => {
              const isPending = r.status === "pending";
              const isExpanded = Boolean(expandedRosters[r.registration_id]);
              const roster = r.roster || [];
              const captain = roster.find((m) => m.role === "captain");
              const starters = roster.filter((m) => m.role !== "captain" && !m.is_substitute);
              const substitutes = roster.filter((m) => m.is_substitute || m.role === "substitute");

              return (
                <div
                  key={r.registration_id}
                  className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 flex flex-col gap-4"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-lg font-bold text-white">
                          {r.team_name}{" "}
                          <span className="text-zinc-500 font-mono text-sm">[{r.team_tag}]</span>
                        </h3>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold uppercase border ${REG_STATUS_STYLES[r.status]}`}
                        >
                          {r.status}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500">
                        Registered: {new Date(r.registered_at).toLocaleString()}
                      </p>
                      {actionErrorId === r.registration_id && (
                        <p className="text-xs text-red-400 mt-2">{actionErrorMsg}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => toggleRoster(r.registration_id)}
                        className="rounded-lg border border-zinc-700 bg-zinc-800/80 px-3.5 py-2 text-xs font-semibold text-zinc-200 hover:bg-zinc-700 hover:text-white transition flex items-center gap-1.5"
                      >
                        <svg
                          className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                        {isExpanded ? "Hide Roster" : "View Roster"} ({roster.length})
                      </button>

                      {r.status === "pending" && (
                        <>
                          <button
                            onClick={() => handleDecision(r.registration_id, "approve")}
                            className="rounded-lg bg-emerald-500 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-600 transition"
                          >
                            APPROVE
                          </button>
                          <button
                            onClick={() => handleDecision(r.registration_id, "reject")}
                            className="rounded-lg border border-zinc-700 px-4 py-2 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 transition"
                          >
                            REJECT
                          </button>
                        </>
                      )}

                      {r.status === "approved" && (
                        <button
                          onClick={() => handleDecision(r.registration_id, "reject")}
                          className="rounded-lg border border-red-500/30 bg-red-500/10 px-3.5 py-2 text-xs font-semibold text-red-400 hover:bg-red-500/20 transition"
                          title="Revoke approval and reject this registration"
                        >
                          Reject
                        </button>
                      )}

                      {r.status === "rejected" && (
                        <button
                          onClick={() => handleDecision(r.registration_id, "approve")}
                          className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/20 transition"
                          title="Re-approve this registration"
                        >
                          Approve
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Expandable Team Roster View */}
                  {isExpanded && (
                    <div className="mt-2 pt-4 border-t border-zinc-800/80 space-y-3">
                      <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                        Team Player Roster
                      </h4>

                      {roster.length === 0 ? (
                        <p className="text-xs text-zinc-500 italic">No player roster records found.</p>
                      ) : (
                        <div className="grid gap-3 sm:grid-cols-2">
                          {/* Captain */}
                          {captain && (
                            <div className="sm:col-span-2 rounded-xl border border-red-500/20 bg-red-500/5 p-3.5 flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <span className="rounded bg-red-500/20 px-2 py-0.5 text-[10px] font-black text-red-400 uppercase border border-red-500/30">
                                  CAPTAIN
                                </span>
                                <div>
                                  <p className="text-sm font-bold text-white">
                                    {captain.game_username || captain.username}
                                  </p>
                                  <p className="text-xs text-zinc-400">
                                    User: @{captain.username} {captain.game_uid && `• UID: ${captain.game_uid}`}
                                  </p>
                                </div>
                              </div>
                              {captain.assigned_role && (
                                <span className="text-xs font-semibold text-zinc-300 bg-zinc-800 px-2.5 py-1 rounded-md border border-zinc-700">
                                  {captain.assigned_role}
                                </span>
                              )}
                            </div>
                          )}

                          {/* Active Starters */}
                          {starters.map((m) => (
                            <div
                              key={m.game_account_id || m.user_id}
                              className="rounded-xl border border-zinc-800/80 bg-zinc-950/60 p-3 flex items-center justify-between"
                            >
                              <div>
                                <p className="text-xs font-semibold text-white">
                                  {m.game_username || m.username}
                                </p>
                                <p className="text-[11px] text-zinc-500">
                                  @{m.username} {m.game_uid && `• UID: ${m.game_uid}`}
                                </p>
                              </div>
                              {m.assigned_role ? (
                                <span className="text-xs text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                                  {m.assigned_role}
                                </span>
                              ) : (
                                <span className="text-[11px] text-zinc-500">Player</span>
                              )}
                            </div>
                          ))}

                          {/* Substitutes */}
                          {substitutes.length > 0 && (
                            <div className="sm:col-span-2 mt-2 pt-3 border-t border-zinc-800/60">
                              <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-2">
                                Substitutes ({substitutes.length})
                              </p>
                              <div className="grid gap-2 sm:grid-cols-2">
                                {substitutes.map((m) => (
                                  <div
                                    key={m.game_account_id || m.user_id}
                                    className="rounded-xl border border-amber-500/10 bg-amber-500/5 p-2.5 flex items-center justify-between"
                                  >
                                    <div>
                                      <p className="text-xs font-medium text-amber-200">
                                        {m.game_username || m.username}
                                      </p>
                                      <p className="text-[10px] text-zinc-500">
                                        @{m.username} {m.game_uid && `• UID: ${m.game_uid}`}
                                      </p>
                                    </div>
                                    <span className="text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 font-semibold">
                                      Substitute
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default TournamentRegistrations;
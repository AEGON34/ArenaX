import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import RegisterTeamModal from "../components/RegisterTeamModal";
import PublicGroupStageView from "../components/PublicGroupStageView";
import { getTournamentDetails, getMe, getMyRegistrations, getTournamentStages } from "../api";
import { formatPrizePool } from "../utils/formatters";

const STATUS_STYLES = {
  draft: "bg-zinc-700/30 text-zinc-400 border-zinc-600/30",
  published: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  live: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  completed: "bg-zinc-800 text-zinc-400 border-zinc-700",
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

  const canShowRegisterButton =
    user && tournament && tournament.status === "published" && !myRegistration;

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col">
      <Navbar />

      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-950/90 px-5 py-3.5 text-sm text-emerald-300 shadow-2xl backdrop-blur-md">
          <span className="font-semibold">{toastMessage}</span>
        </div>
      )}

      <main className="mx-auto max-w-4xl w-full px-6 py-20 flex-1">
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
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-8">
            <div className="flex items-center gap-3 mb-4">
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold uppercase border ${STATUS_STYLES[tournament.status]}`}
              >
                {tournament.status}
              </span>
              <span className="text-xs font-bold tracking-widest text-red-500 uppercase">
                {tournament.game_name}
              </span>
            </div>

            <h1 className="text-3xl md:text-4xl font-black text-white">{tournament.name}</h1>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/60 p-4">
                <p className="text-xs text-zinc-500">Format</p>
                <p className="mt-1 text-sm font-semibold text-white capitalize">
                  {tournament.format.replace("_", " ")}
                </p>
              </div>
              <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/60 p-4">
                <p className="text-xs text-zinc-500">Organizer</p>
                <p className="mt-1 text-sm font-semibold text-white">
                  {tournament.organizer_username}
                </p>
              </div>
              <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/60 p-4">
                <p className="text-xs text-zinc-500">Prize Pool</p>
                <p className="mt-1 text-sm font-semibold text-emerald-400">
                  {formatPrizePool(tournament.prize_pool_usd)}
                </p>
              </div>
            </div>

            {/* Stages Section - read only, public view */}
            {stages.length > 0 && (
              <div className="mt-8 pt-6 border-t border-zinc-800/80">
                <p className="text-xs font-bold tracking-widest text-zinc-500 uppercase mb-4">
                  Tournament Stages
                </p>
                <div className="space-y-2.5">
                  {stages.map((stage) => (
                    <div
                      key={stage.stage_id}
                      className="rounded-xl border border-zinc-800/80 bg-zinc-950/60 p-4 flex items-center gap-4"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-500/10 border border-red-500/20 text-xs font-bold text-red-400">
                        {stage.stage_order}
                      </div>
                      <div className="flex-1 flex items-center justify-between">
                        <span className="text-sm font-semibold text-white">{stage.stage_name}</span>
                        <span className="text-xs text-zinc-500">
                          {FORMAT_LABELS[stage.stage_format] || stage.stage_format}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Public Group Stage View (Groups, Standings, Matches) */}
            {stages.some((s) => s.stage_format === "group_stage") && (
              <PublicGroupStageView
                stageId={stages.find((s) => s.stage_format === "group_stage").stage_id}
                onToast={showToast}
              />
            )}

            {/* Registration Section */}
            {user && (
              <div className="mt-8 pt-6 border-t border-zinc-800/80">
                {myRegistration ? (
                  <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/60 p-5 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-zinc-500">Your Team's Registration</p>
                      <p className="mt-1 text-sm font-semibold text-white">
                        {myRegistration.team_name}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold uppercase border ${REG_STATUS_STYLES[myRegistration.status]}`}
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
                ) : tournament.status !== "published" ? (
                  <p className="text-center text-xs text-zinc-500">
                    Registration is not open for this tournament right now.
                  </p>
                ) : null}
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
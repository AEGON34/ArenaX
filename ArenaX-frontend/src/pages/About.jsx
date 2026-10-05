import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

function About() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">

      <Navbar />

      {/* Hero */}

      <section className="border-b border-zinc-900 bg-zinc-900/30 px-6 py-32 text-center">

        <p className="mb-5 text-xs font-bold tracking-[0.3em] text-red-500">
          ABOUT ARENAX
        </p>

        <h1 className="mx-auto max-w-4xl text-5xl font-black md:text-7xl">

          Built for the{" "}

          <span className="text-red-500">
            competitive community.
          </span>

        </h1>

        <p className="mx-auto mt-7 max-w-2xl leading-7 text-zinc-500">
          ArenaX brings players, teams and tournament
          organizers together in one structured esports platform.
        </p>

      </section>


      {/* Mission */}

      <section className="mx-auto max-w-4xl px-6 py-24">

        <p className="mb-5 text-xs font-bold tracking-[0.3em] text-red-500">
          OUR MISSION
        </p>

        <h2 className="text-4xl font-black md:text-5xl">

          Making competitive esports{" "}

          <span className="text-red-500">
            simple and organized.
          </span>

        </h2>

        <div className="mt-10 space-y-6 leading-8 text-zinc-500">

          <p>
            ArenaX is a web-based platform designed for
            hosting competitive MOBA tournaments.
            Players can create accounts, connect their
            game identities, build teams and participate
            in tournaments.
          </p>

          <p>
            Organizers can create tournaments, manage
            registrations, control tournament stages,
            manage brackets and confirm match results.
          </p>

        </div>

      </section>


      {/* Stats */}

      <section className="border-y border-zinc-900">

        <div className="mx-auto grid max-w-5xl md:grid-cols-3">

          <div className="border-b border-zinc-900 px-8 py-16 text-center md:border-b-0 md:border-r">
            <h2 className="text-5xl font-black text-red-500">
              03+
            </h2>
            <p className="mt-3 text-zinc-500">
              MOBA Games
            </p>
          </div>

          <div className="border-b border-zinc-900 px-8 py-16 text-center md:border-b-0 md:border-r">
            <h2 className="text-5xl font-black text-red-500">
              ∞
            </h2>
            <p className="mt-3 text-zinc-500">
              Competitive Matches
            </p>
          </div>

          <div className="px-8 py-16 text-center">
            <h2 className="text-5xl font-black text-red-500">
              01
            </h2>
            <p className="mt-3 text-zinc-500">
              Unified Platform
            </p>
          </div>

        </div>

      </section>

      <Footer />

    </div>
  );
}

export default About;
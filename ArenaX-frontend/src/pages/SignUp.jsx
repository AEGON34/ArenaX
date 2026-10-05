import React, { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";

function SignUp() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("player");
  const [terms, setTerms] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
        alert("Passwords do not match!");
        return;
    }

    if (!terms) {
        alert("Please agree to the terms and conditions.");
        return;
    }

    const userData = {
        username,
        email,
        password,
        role
    };

    //console.log(userData);
    

    try {
      const response = await fetch("http://localhost:5000/api/auth/signup", {
          method: "POST",
          headers: {
              "Content-Type": "application/json"
          },
          credentials: "include",
          body: JSON.stringify(userData)
      });

        const data = await response.json();

        if (response.ok) {
            alert(data.message);
        } else {
            alert(data.message);
        }

    } catch (error) {
        console.log(error);
        alert("Cannot connect to server!");
    }
};

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <Navbar />

      <div className="flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-2xl rounded-2xl border border-zinc-800 bg-zinc-900/60 p-8 md:p-10">

          <div className="mb-8 text-center">
            <h1 className="text-4xl font-black">
              Join <span className="text-red-500">ArenaX.</span>
            </h1>

            <p className="mt-3 text-sm text-zinc-500">
              Create your account and enter the competition.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Username */}
            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-300">
                Username
              </label>

              <input
                type="text"
                placeholder="Choose a username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-red-500"
              />
            </div>

            {/* Email */}
            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-300">
                Email
              </label>

              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-red-500"
              />
            </div>

            {/* Password Row */}
            <div className="grid gap-5 md:grid-cols-2">

              {/* Password */}
              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-300">
                  Password
                </label>

                <input
                  type="password"
                  placeholder="Create password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-red-500"
                />
              </div>

              {/* Confirm Password */}
              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-300">
                  Confirm Password
                </label>

                <input
                  type="password"
                  placeholder="Confirm password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-red-500"
                />
              </div>

            </div>

            {/* Account Type */}
            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-300">
                Account Type
              </label>

              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-white outline-none focus:border-red-500"
              >
                <option value="player">Player</option>
                <option value="organizer">Organizer</option>
              </select>
            </div>

            {/* Terms */}
            <div className="flex items-start gap-3 text-xs leading-5 text-zinc-400">
              <input
                type="checkbox"
                id="terms-checkbox"
                checked={terms}
                onChange={(e) => setTerms(e.target.checked)}
                className="mt-1 accent-red-500 cursor-pointer"
              />

              <label htmlFor="terms-checkbox" className="cursor-pointer">
                I agree to the{" "}
                <button
                  type="button"
                  onClick={() => setShowTermsModal(true)}
                  className="font-bold text-red-500 underline hover:text-red-400"
                >
                  ArenaX terms and conditions
                </button>
                .
              </label>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="w-full rounded-lg bg-red-500 py-3.5 font-semibold transition hover:bg-red-600"
            >
              Create Account
            </button>

          </form>

          <div className="mt-7 text-center text-sm text-zinc-500">
            Already have an account?{" "}

            <Link
              to="/login"
              className="font-semibold text-red-500 hover:text-red-400"
            >
              Login
            </Link>
          </div>

        </div>
      </div>

      {/* Terms & Conditions Modal */}
      {showTermsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-zinc-800 p-6">
              <h2 className="text-xl font-bold text-white">
                ArenaX <span className="text-red-500">Terms & Conditions</span>
              </h2>
              <button
                onClick={() => setShowTermsModal(false)}
                className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5 text-sm text-zinc-300 leading-relaxed">
              <section>
                <h3 className="font-semibold text-white text-base mb-1">1. User & Game Account Eligibility</h3>
                <p>
                  Each player is allowed strictly one user account on ArenaX. Game UIDs and usernames must be valid and accurately reflect your actual in-game identities. Smurfing or submitting fake UIDs will result in immediate disqualification.
                </p>
              </section>

              <section>
                <h3 className="font-semibold text-white text-base mb-1">2. Fair Play & Anti-Cheating Policy</h3>
                <p>
                  Zero tolerance for hacking, third-party script usage, exploitation of bugs, or toxic/abusive behavior toward opponents or match referees. Any team or player caught cheating will face a permanent ban from ArenaX tournaments.
                </p>
              </section>

              <section>
                <h3 className="font-semibold text-white text-base mb-1">3. Team Roster & Substitute Rules</h3>
                <p>
                  A full team roster consists of 5 starting players. Additional players joining an already full roster will be assigned as Substitute Players. Players can belong to only one active team per game category at a time.
                </p>
              </section>

              <section>
                <h3 className="font-semibold text-white text-base mb-1">4. Tournament Match Conduct</h3>
                <p>
                  Teams must check in at least 15 minutes before scheduled match times. Failure to present a complete team by match time will result in a forfeit. Tournament organizers hold final authority on match rulings and disputes.
                </p>
              </section>

              <section>
                <h3 className="font-semibold text-white text-base mb-1">5. Account Termination & System Rights</h3>
                <p>
                  ArenaX reserves the right to terminate accounts, revoke tournament rewards, or update rules as required to maintain competitive integrity across the platform.
                </p>
              </section>
            </div>

            {/* Footer */}
            <div className="border-t border-zinc-800 p-4 flex justify-end">
              <button
                onClick={() => {
                  setTerms(true);
                  setShowTermsModal(false);
                }}
                className="rounded-lg bg-red-500 px-6 py-2.5 font-semibold text-white hover:bg-red-600 transition"
              >
                I Agree & Accept
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SignUp;
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import About from "./pages/About";
import Tournaments from "./pages/Tournaments";
import Teams from "./pages/Teams";
import TeamDetails from "./pages/TeamDetails";
import FreeAgents from "./pages/FreeAgents";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import Profile from "./pages/Profile";
import MyTournaments from "./pages/MyTournaments";
import TournamentDetails from "./pages/TournamentDetails";
import TournamentRegistrations from "./pages/TournamentRegistrations";
import TournamentStages from "./pages/TournamentStages";

function App() {
  return (
    <BrowserRouter>

      <Routes>

        <Route path="/" element={<Home />} />

        <Route
          path="/about"
          element={<About />}
        />

        <Route
          path="/tournaments"
          element={<Tournaments />}
        />

        <Route
          path="/tournaments/:id"
          element={<TournamentDetails />}
        />

        <Route
          path="/my-tournaments"
          element={<MyTournaments />}
        />

        <Route
          path="/my-tournaments/:id/registrations"
          element={<TournamentRegistrations />}
        />

        <Route
          path="/my-tournaments/:id/stages"
          element={<TournamentStages />}
        />

        <Route
          path="/teams"
          element={<Teams />}
        />

        <Route
          path="/teams/:id"
          element={<TeamDetails />}
        />

        <Route
          path="/free-agents"
          element={<FreeAgents />}
        />

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/signup"
          element={<SignUp />}
        />

        <Route
          path="/profile"
          element={<Profile />}
        />

      </Routes>

    </BrowserRouter>
  );
}

export default App;
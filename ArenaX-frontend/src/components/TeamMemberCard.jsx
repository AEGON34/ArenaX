import React from "react";

const ROLE_ICONS = {
  Marksman: "🎯",
  Clashlaner: "⚔️",
  Jungler: "🌲",
  Roam: "🛡️",
  Midlaner: "🔮",
};

const VALID_ROLES = ["Marksman", "Clashlaner", "Jungler", "Roam", "Midlaner"];

function TeamMemberCard({ member, isCaptainUser, onRoleChange, onRemoveMember }) {
  // member: { account_id, game_username, role, assigned_role, preferred_role, is_substitute, is_active }
  const isCaptain = (member.role || "").toLowerCase() === "captain";
  const isActive = Boolean(member.is_active);
  const isSubstitute = Boolean(member.is_substitute);

  const assignedRole = member.assigned_role;
  const preferredRole = member.preferred_role;

  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border p-4 transition ${
        isCaptain
          ? "border-red-500/30 bg-red-500/5 hover:border-red-500/50"
          : "border-zinc-800 bg-zinc-900/40 hover:border-zinc-700"
      }`}
    >
      <div className="flex items-center gap-3.5">
        {/* Avatar */}
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl font-black text-lg ${
            isCaptain
              ? "bg-red-500 text-white shadow-lg shadow-red-500/20"
              : "bg-zinc-800 text-zinc-300 border border-zinc-700"
          }`}
        >
          {(member.game_username || "P").charAt(0).toUpperCase()}
        </div>

        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-bold text-white text-base">{member.game_username}</h4>

            {/* Team Position Role Badge */}
            <span
              className={`px-2 py-0.5 text-[11px] font-bold uppercase rounded border ${
                isCaptain
                  ? "bg-red-500/20 text-red-400 border-red-500/30"
                  : "bg-zinc-800 text-zinc-300 border-zinc-700"
              }`}
            >
              {member.role || "Player"}
            </span>
          </div>

          {/* Role Slot & Preferred Role Display */}
          <div className="flex items-center gap-2 mt-1.5 flex-wrap text-xs">
            <span className="font-semibold text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">
              {ROLE_ICONS[assignedRole] || "🎮"} {assignedRole || "Flex Slot"}
            </span>

            {preferredRole && preferredRole !== assignedRole && (
              <span className="text-zinc-400 text-[11px]">
                (Prefers: <span className="text-zinc-300">{preferredRole}</span>)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Right Actions: Role Selector (for Captain) & Badges */}
      <div className="flex items-center gap-3 self-end sm:self-center flex-wrap sm:flex-nowrap">
        {/* Captain Role Switcher */}
        {isCaptainUser && onRoleChange && (
          <div className="flex flex-col items-end">
            <label className="text-[10px] uppercase font-bold text-zinc-500 mb-0.5">
              Switch Slot
            </label>
            <select
              value={assignedRole || ""}
              onChange={(e) => onRoleChange(member.account_id, e.target.value)}
              className="rounded-lg border border-red-500/30 bg-zinc-950 px-2.5 py-1 text-xs font-semibold text-white outline-none focus:border-red-500 transition cursor-pointer"
            >
              <option value="">Flex / Unassigned</option>
              {VALID_ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_ICONS[r]} {r}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Captain Remove Member Button */}
        {isCaptainUser && !isCaptain && onRemoveMember && (
          <button
            onClick={() => onRemoveMember(member)}
            title="Remove Player from Team"
            className="rounded-lg border border-red-500/30 bg-red-500/10 p-2 text-red-400 hover:bg-red-500 hover:text-white transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}

        {/* Substitute status */}
        {isSubstitute && (
          <span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-400 border border-amber-500/20">
            Substitute
          </span>
        )}

        {/* Active status */}
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold border ${
            isActive
              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
              : "bg-zinc-800 text-zinc-500 border-zinc-700"
          }`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${isActive ? "bg-emerald-400" : "bg-zinc-500"}`} />
          {isActive ? "Active" : "Inactive"}
        </span>
      </div>
    </div>
  );
}

export default TeamMemberCard;

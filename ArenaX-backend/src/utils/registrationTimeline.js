/**
 * Registration Timeline Helper
 * Authoritative helper for calculating registration status and validating registration windows.
 */

/**
 * Calculates derived registration status for a tournament.
 * Statuses:
 * - 'NOT_STARTED': Tournament is draft, OR current time < registration_start_at.
 * - 'OPEN': Tournament is published, activeGroupStages === 0, and current time is within [start_at, end_at).
 * - 'CLOSED': Tournament is completed or live, OR current time >= registration_end_at.
 * - 'FROZEN': Active group stages or matches already generated (activeGroupStages > 0).
 *
 * @param {Object} tournament Tournament database record
 * @param {number} activeGroupStages Count of active group stages in tournament
 * @param {Date} [currentTime] Reference time (defaults to new Date())
 * @returns {string} One of: 'NOT_STARTED', 'OPEN', 'CLOSED', 'FROZEN'
 */
function getRegistrationStatus(tournament, activeGroupStages = 0, currentTime = new Date()) {
    if (!tournament) return "CLOSED";

    // Draft tournaments are not started publicly
    if (tournament.status === "draft") {
        return "NOT_STARTED";
    }

    // Completed or live tournaments have closed registration
    if (tournament.status === "completed" || tournament.status === "live") {
        return "CLOSED";
    }

    // Registration freeze overrides timeline windows once group stages/matches are generated
    if (Number(activeGroupStages) > 0) {
        return "FROZEN";
    }

    const now = currentTime instanceof Date ? currentTime : new Date(currentTime);

    if (tournament.registration_start_at) {
        const startDate = new Date(tournament.registration_start_at);
        if (!isNaN(startDate.getTime()) && now < startDate) {
            return "NOT_STARTED";
        }
    }

    if (tournament.registration_end_at) {
        const endDate = new Date(tournament.registration_end_at);
        if (!isNaN(endDate.getTime()) && now >= endDate) {
            return "CLOSED";
        }
    }

    return tournament.status === "published" ? "OPEN" : "CLOSED";
}

/**
 * Checks if registration is currently open.
 * @param {Object} tournament
 * @param {number} activeGroupStages
 * @param {Date} [currentTime]
 * @returns {boolean}
 */
function isRegistrationOpen(tournament, activeGroupStages = 0, currentTime = new Date()) {
    return getRegistrationStatus(tournament, activeGroupStages, currentTime) === "OPEN";
}

/**
 * Normalizes input date string or Date object to ISO string / MariaDB DATETIME format.
 * @param {string|Date|null} inputDate
 * @returns {string|null}
 */
function normalizeTimestamp(inputDate) {
    if (!inputDate) return null;
    const d = new Date(inputDate);
    if (isNaN(d.getTime())) return null;
    return d.toISOString().slice(0, 19).replace("T", " ");
}

module.exports = {
    getRegistrationStatus,
    isRegistrationOpen,
    normalizeTimestamp
};

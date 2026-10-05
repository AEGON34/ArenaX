/**
 * Prize Pool Validator
 * Validates monetary prize_pool_usd values according to ArenaX precision and boundary rules.
 */

function validatePrizePool(prizePool) {
    if (prizePool === undefined || prizePool === null || prizePool === "") {
        return { valid: true, value: null };
    }

    if (typeof prizePool === "boolean") {
        return { valid: false, error: "PRIZE POOL MUST BE A VALID NUMERIC VALUE" };
    }

    const strVal = String(prizePool).trim();
    if (strVal === "") {
        return { valid: true, value: null };
    }

    const num = Number(strVal);
    if (isNaN(num)) {
        return { valid: false, error: "PRIZE POOL MUST BE A VALID NUMERIC VALUE" };
    }

    if (num < 0) {
        return { valid: false, error: "PRIZE POOL CANNOT BE NEGATIVE" };
    }

    // Check decimal places strictly without silent rounding
    if (strVal.includes(".")) {
        const parts = strVal.split(".");
        const decimals = parts[1];
        if (decimals && decimals.length > 2) {
            return { valid: false, error: "PRIZE POOL CANNOT HAVE MORE THAN 2 DECIMAL PLACES" };
        }
    }

    return { valid: true, value: num };
}

module.exports = {
    validatePrizePool
};

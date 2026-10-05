/**
 * Generates Excel-style bijective base-26 group name letters:
 * 1  -> A
 * 26 -> Z
 * 27 -> AA
 * 52 -> AZ
 * 53 -> BA
 * 702 -> ZZ
 * 703 -> AAA
 */
function getExcelGroupLetter(n) {
    let result = "";
    let num = Number(n);
    while (num > 0) {
        num--;
        result = String.fromCharCode(65 + (num % 26)) + result;
        num = Math.floor(num / 26);
    }
    return result;
}

module.exports = {
    getExcelGroupLetter
};

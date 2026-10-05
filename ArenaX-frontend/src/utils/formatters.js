/**
 * Formats a prize pool USD value into standard monetary display.
 * e.g., 1000 -> "$1,000.00 USD", 500.5 -> "$500.50 USD", 0 -> "$0.00 USD", null -> "Prize pool not specified"
 */
export function formatPrizePool(prizePool) {
  if (prizePool === null || prizePool === undefined || prizePool === "") {
    return "Prize pool not specified";
  }
  const num = Number(prizePool);
  if (isNaN(num)) return "Prize pool not specified";
  return `$${num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD`;
}

/** System pages (not found, something went wrong). Filipino is the shape; English must match it key for key. */
const tagalog = {
  notFoundTitle: "Hindi makita ang pahina",
  notFoundBody: "Walang pahina sa lugar na ito. Bumalik tayo sa Tahanan at magpatuloy sa pagbasa.",
  errorTitle: "May nagkaproblema",
  errorBody: "Hindi namin mabuksan ang pahinang ito. Walang nawala sa iyong mga aklat at salita. Subukan ulit.",
  tryAgain: "Subukan ulit",
  goHome: "Bumalik sa Tahanan",
  openScan: "Buksan ang I-scan",
};

const english = {
  notFoundTitle: "Page not found",
  notFoundBody: "There is no page here. Let's go back Home and keep reading.",
  errorTitle: "Something went wrong",
  errorBody: "We could not open this page. Your books and words are safe. Please try again.",
  tryAgain: "Try again",
  goHome: "Back to Home",
  openScan: "Open Scan",
} satisfies typeof tagalog;

export const systemStrings = { tagalog, english };

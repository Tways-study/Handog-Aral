/** System pages (not found, something went wrong). Hiligaynon is the shape; Tagalog must match it key for key. */
const hiligaynon = {
  notFoundTitle: "Wala makita ang pahina",
  notFoundBody: "Wala sang pahina sa sini nga lugar. Magbalik kita sa Balay kag magpadayon sa pagbasa.",
  errorTitle: "May nagkaproblema",
  errorBody: "Indi namon maabri ang sini nga pahina. Wala nawala ang imo mga libro kag pulong. Probahi liwat.",
  tryAgain: "Probahi liwat",
  goHome: "Pabalik sa Balay",
  openScan: "Buksi ang I-scan",
};

const tagalog = {
  notFoundTitle: "Hindi makita ang pahina",
  notFoundBody: "Walang pahina sa lugar na ito. Bumalik tayo sa Tahanan at magpatuloy sa pagbasa.",
  errorTitle: "May nagkaproblema",
  errorBody: "Hindi namin mabuksan ang pahinang ito. Walang nawala sa iyong mga aklat at salita. Subukan ulit.",
  tryAgain: "Subukan ulit",
  goHome: "Bumalik sa Tahanan",
  openScan: "Buksan ang I-scan",
} satisfies typeof hiligaynon;

export const systemStrings = { hiligaynon, tagalog };

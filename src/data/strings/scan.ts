/** scan strings. Hiligaynon is the shape; Tagalog must match it key for key. */
const hiligaynon = {
  title: "I-Scan",
  modeCamera: "Camera",
  modeText: "Text",
  live: "LIVE",
  loading: "Ginapangita...",
  textPlaceholder: "I-paste o i-type diri ang teksto sang libro...",
  cameraPrompt: "Kuhai sang retrato ang libro",
  openCamera: "Buksa ang Camera",
  tapHint: "Tap any word to learn its meaning 👆",
  recentLabel: "Bag-o lang gin-tap:",
  recentEmpty: "Tap-a ang bisan ano nga pulong sa ibabaw ☝️",
  rescanBtn: "I-scan Liwat",
  newTextBtn: "Bag-o nga Teksto",
  showTextBtn: "Ipakita ang Teksto",
};

const tagalog = {
  title: "I-Scan",
  modeCamera: "Camera",
  modeText: "Teksto",
  live: "LIVE",
  loading: "Hinahanap...",
  textPlaceholder: "I-paste o i-type dito ang teksto ng libro...",
  cameraPrompt: "Kumuha ng larawan ng libro",
  openCamera: "Buksan ang Camera",
  tapHint: "I-tap ang kahit anong salita para matuto 👆",
  recentLabel: "Kakatapos lang i-tap:",
  recentEmpty: "I-tap ang kahit anong salita sa itaas ☝️",
  rescanBtn: "I-scan Muli",
  newTextBtn: "Bagong Teksto",
  showTextBtn: "Ipakita ang Teksto",
} satisfies typeof hiligaynon;

export const scanStrings = { hiligaynon, tagalog };

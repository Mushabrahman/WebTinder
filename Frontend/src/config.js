
const dev = window.location.hostname === "localhost";

export const BASE_URL = dev
  ? "https://localhost:8000"
  : "https://13.201.25.1:8000";

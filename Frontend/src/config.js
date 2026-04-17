
const dev = window.location.hostname === "localhost";

export const BASE_URL = dev
  ? "http://localhost:8000"
  : "http://13.201.25.1/";

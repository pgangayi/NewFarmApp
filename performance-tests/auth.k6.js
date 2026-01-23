import http from "k6/http";
import { check, sleep } from "k6";

export let options = {
  vus: __ENV.VUS ? Number(__ENV.VUS) : 10,
  duration: __ENV.DURATION || "30s",
};

const BASE = __ENV.BASE_URL || "http://localhost:8787";
const CREDENTIALS = {
  email: __ENV.TEST_USER_EMAIL || "perfuser@example.com",
  password: __ENV.TEST_USER_PASSWORD || "PerfPassw0rd!",
};

export default function () {
  // Attempt login
  const res = http.post(`${BASE}/api/auth/login`, JSON.stringify(CREDENTIALS), {
    headers: { "Content-Type": "application/json" },
  });

  check(res, {
    "login status 200": (r) => r.status === 200,
  });

  // Trigger forgot-password (non-blocking)
  http.post(
    `${BASE}/api/auth/forgot-password`,
    JSON.stringify({ email: CREDENTIALS.email }),
    {
      headers: { "Content-Type": "application/json" },
    },
  );

  sleep(1);
}

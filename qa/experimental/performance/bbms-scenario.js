import http from "k6/http";
import { check, sleep } from "k6";

const TARGET = __ENV.TARGET || "login";
const SCENARIO = __ENV.SCENARIO || "load";
const BASE_URL = __ENV.BASE_URL || "http://127.0.0.1:5000";
const LOGIN_ACCOUNTS = __ENV.LOGIN_ACCOUNTS_JSON ? JSON.parse(__ENV.LOGIN_ACCOUNTS_JSON) : [];

const scenarioOptions = {
  load: {
    executor: "constant-vus",
    vus: Number(__ENV.VUS || 10),
    duration: __ENV.DURATION || "20s",
  },
  stress: {
    executor: "ramping-vus",
    startVUs: 0,
    stages: [
      { duration: "10s", target: Number(__ENV.VUS || 20) },
      { duration: "20s", target: Number(__ENV.MAX_VUS || 35) },
      { duration: "10s", target: 0 },
    ],
  },
  spike: {
    executor: "ramping-vus",
    startVUs: 0,
    stages: [
      { duration: "5s", target: 5 },
      { duration: "5s", target: Number(__ENV.MAX_VUS || 60) },
      { duration: "10s", target: Number(__ENV.MAX_VUS || 60) },
      { duration: "5s", target: 0 },
    ],
  },
  endurance: {
    executor: "constant-vus",
    vus: Number(__ENV.VUS || 8),
    duration: __ENV.DURATION || "45s",
  },
};

export const options = {
  scenarios: {
    [SCENARIO]: scenarioOptions[SCENARIO] || scenarioOptions.load,
  },
  thresholds: {
    http_req_duration: [
      `avg<${__ENV.AVG_THRESHOLD_MS || 500}`,
      `med<${__ENV.MEDIAN_THRESHOLD_MS || 450}`,
      `p(95)<${__ENV.P95_THRESHOLD_MS || 900}`,
    ],
    http_req_failed: [`rate<${__ENV.ERROR_RATE_THRESHOLD || 0.02}`],
  },
};

function login(email, password) {
  const response = http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify({ email, password }),
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  check(response, {
    "login status is 200": (res) => res.status === 200,
  });

  return response.json("token");
}

export function setup() {
  if (TARGET === "login") {
    return {};
  }

  if (TARGET === "request") {
    return {
      token: login(__ENV.HOSPITAL_EMAIL, __ENV.HOSPITAL_PASSWORD),
    };
  }

  if (TARGET === "stock") {
    return {
      token: login(__ENV.LAB_EMAIL, __ENV.LAB_PASSWORD),
    };
  }

  return {};
}

export default function (data) {
  if (TARGET === "login") {
    const account = LOGIN_ACCOUNTS[(__ITER + __VU) % LOGIN_ACCOUNTS.length];
    const response = http.post(
      `${BASE_URL}/api/auth/login`,
      JSON.stringify({
        email: account.email,
        password: account.password,
      }),
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    check(response, {
      "auth login status is 200": (res) => res.status === 200,
    });
  }

  if (TARGET === "request") {
    const bloodTypes = ["A+", "B+", "O+", "AB-"];
    const bloodType = bloodTypes[__VU % bloodTypes.length];
    const response = http.post(
      `${BASE_URL}/api/hospital/blood/request`,
      JSON.stringify({
        labId: __ENV.LAB_ID,
        bloodType,
        units: (__ITER % 3) + 1,
      }),
      {
        headers: {
          Authorization: `Bearer ${data.token}`,
          "Content-Type": "application/json",
        },
      }
    );

    check(response, {
      "request creation status is 201": (res) => res.status === 201,
    });
  }

  if (TARGET === "stock") {
    const bloodTypes = ["A+", "O+", "B-", "AB+"];
    const bloodType = bloodTypes[__VU % bloodTypes.length];
    const response = http.post(
      `${BASE_URL}/api/blood-lab/blood/add`,
      JSON.stringify({
        bloodType,
        quantity: (__ITER % 4) + 1,
      }),
      {
        headers: {
          Authorization: `Bearer ${data.token}`,
          "Content-Type": "application/json",
        },
      }
    );

    check(response, {
      "stock update status is 200": (res) => res.status === 200,
    });
  }

  sleep(Number(__ENV.THINK_TIME_SECONDS || 0.2));
}

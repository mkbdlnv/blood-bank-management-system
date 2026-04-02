import assert from "node:assert/strict";
import { buildQaScenario } from "../support/testData.mjs";

const apiBaseUrl = (process.env.API_BASE_URL || "http://127.0.0.1:5000").replace(/\/$/, "");
const runId = process.env.QA_RUN_ID || Date.now().toString();
const scenario = buildQaScenario(runId);

function authHeaders(token) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function apiRequest(path, { method = "GET", token, body, expectedStatus } = {}) {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(token),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (expectedStatus && response.status !== expectedStatus) {
    throw new Error(
      `${method} ${path} expected ${expectedStatus} but got ${response.status}: ${JSON.stringify(payload)}`
    );
  }

  return { response, payload };
}

async function login(email, password, expectedStatus = 200) {
  const { payload } = await apiRequest("/api/auth/login", {
    method: "POST",
    body: { email, password },
    expectedStatus,
  });

  return payload;
}

async function registerUser(payload) {
  return apiRequest("/api/auth/register", {
    method: "POST",
    body: payload,
    expectedStatus: 201,
  });
}

function findFacilityByEmail(facilities, email) {
  return facilities.find((facility) => facility.email === email);
}

function tomorrowIsoDate() {
  const value = new Date();
  value.setDate(value.getDate() + 1);
  value.setHours(9, 0, 0, 0);
  return value.toISOString();
}

async function run() {
  console.log(`Running API smoke against ${apiBaseUrl} with QA_RUN_ID=${runId}`);

  const admin = await login("suraj@admin.com", "bbms@admin");
  assert.ok(admin.token, "Admin login should return a token");

  await registerUser(scenario.donor);
  await registerUser(scenario.hospital);
  await registerUser(scenario.bloodLab);

  const facilitiesList = await apiRequest("/api/admin/facilities", {
    token: admin.token,
    expectedStatus: 200,
  });

  const facilities = facilitiesList.payload.facilities || [];
  const hospitalFacility = findFacilityByEmail(facilities, scenario.hospital.email);
  const bloodLabFacility = findFacilityByEmail(facilities, scenario.bloodLab.email);

  assert.ok(hospitalFacility?._id, "Registered hospital should be visible for admin");
  assert.ok(bloodLabFacility?._id, "Registered blood lab should be visible for admin");

  await apiRequest(`/api/admin/facility/approve/${hospitalFacility._id}`, {
    method: "PUT",
    token: admin.token,
    expectedStatus: 200,
  });
  await apiRequest(`/api/admin/facility/approve/${bloodLabFacility._id}`, {
    method: "PUT",
    token: admin.token,
    expectedStatus: 200,
  });

  const donorLogin = await login(scenario.donor.email, scenario.donor.password);
  const hospitalLogin = await login(scenario.hospital.email, scenario.hospital.password);
  const bloodLabLogin = await login(scenario.bloodLab.email, scenario.bloodLab.password);

  assert.equal(donorLogin.user?.role, "donor");
  assert.equal(hospitalLogin.user?.role, "hospital");
  assert.equal(bloodLabLogin.user?.role, "blood-lab");

  const donorProfile = await apiRequest("/api/donor/profile", {
    token: donorLogin.token,
    expectedStatus: 200,
  });
  assert.equal(donorProfile.payload.donor?.email, scenario.donor.email);

  const createdCamp = await apiRequest("/api/blood-lab/camps", {
    method: "POST",
    token: bloodLabLogin.token,
    body: {
      title: `QA Blood Camp ${runId}`,
      description: "Automated QA smoke camp",
      date: tomorrowIsoDate(),
      time: { start: "10:00", end: "13:00" },
      location: {
        venue: "QA Convention Center",
        city: "Mumbai",
        state: "Maharashtra",
        pincode: scenario.bloodLab.address.pincode,
      },
      expectedDonors: 30,
    },
    expectedStatus: 201,
  });
  assert.equal(createdCamp.payload.success, true);

  const approvedLabs = await apiRequest("/api/facility/labs", {
    token: hospitalLogin.token,
    expectedStatus: 200,
  });
  const labIds = (approvedLabs.payload.labs || []).map((lab) => lab._id);
  assert.ok(
    labIds.includes(bloodLabFacility._id),
    "Approved blood lab should be listed for hospital requests"
  );

  const bloodRequest = await apiRequest("/api/hospital/blood/request", {
    method: "POST",
    token: hospitalLogin.token,
    body: {
      labId: bloodLabFacility._id,
      bloodType: "A+",
      units: 3,
    },
    expectedStatus: 201,
  });
  assert.equal(bloodRequest.payload.success, true);

  const labRequests = await apiRequest("/api/blood-lab/blood/requests", {
    token: bloodLabLogin.token,
    expectedStatus: 200,
  });
  const requestIds = (labRequests.payload.requests || []).map((request) => request._id);
  assert.ok(
    requestIds.includes(bloodRequest.payload.data?._id),
    "Blood lab should see the hospital request it just received"
  );

  const adminCamps = await apiRequest("/api/admin/camps", {
    token: admin.token,
    expectedStatus: 200,
  });
  const campIds = (adminCamps.payload.camps || []).map((camp) => camp._id);
  assert.ok(
    campIds.includes(createdCamp.payload.data?._id),
    "Admin camps endpoint should include the newly created camp"
  );

  console.log("API smoke passed:");
  console.log(`- donor: ${scenario.donor.email}`);
  console.log(`- hospital: ${scenario.hospital.email}`);
  console.log(`- blood lab: ${scenario.bloodLab.email}`);
  console.log(`- camp id: ${createdCamp.payload.data?._id}`);
  console.log(`- request id: ${bloodRequest.payload.data?._id}`);
}

run().catch((error) => {
  console.error("API smoke failed");
  console.error(error);
  process.exit(1);
});

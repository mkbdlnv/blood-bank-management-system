const apiBaseUrl = (process.env.API_BASE_URL || "http://127.0.0.1:5000").replace(/\/$/, "");
const adminEmail = process.env.QA_ADMIN_EMAIL || "suraj@admin.com";
const adminPassword = process.env.QA_ADMIN_PASSWORD || "bbms@admin";

function authHeaders(token) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function apiRequest(path, { method = "GET", token, body, expectedStatus } = {}) {
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

export async function loginApi(email, password, expectedStatus = 200) {
  const { payload } = await apiRequest("/api/auth/login", {
    method: "POST",
    body: { email, password },
    expectedStatus,
  });

  return payload;
}

export async function registerUser(payload) {
  return apiRequest("/api/auth/register", {
    method: "POST",
    body: payload,
    expectedStatus: 201,
  });
}

export async function loginAsAdmin() {
  const admin = await loginApi(adminEmail, adminPassword, 200);

  if (!admin.token) {
    throw new Error(
      `Admin login did not return a token. Verify ${adminEmail} exists and run backend/seedAdmin.js if needed.`
    );
  }

  return admin;
}

export async function getFacilities(adminToken) {
  const { payload } = await apiRequest("/api/admin/facilities", {
    token: adminToken,
    expectedStatus: 200,
  });

  return payload.facilities || [];
}

export function findFacilityByEmail(facilities, email) {
  return facilities.find((facility) => facility.email === email);
}

export async function registerPendingFacility(payload) {
  await registerUser(payload);
}

export async function registerApprovedFacility(payload) {
  const admin = await loginAsAdmin();
  await registerUser(payload);
  const facilities = await getFacilities(admin.token);
  const facility = findFacilityByEmail(facilities, payload.email);

  if (!facility?._id) {
    throw new Error(`Facility ${payload.email} was not visible to admin after registration.`);
  }

  await apiRequest(`/api/admin/facility/approve/${facility._id}`, {
    method: "PUT",
    token: admin.token,
    expectedStatus: 200,
  });

  return facility;
}

export async function rejectPendingFacility(facilityId, rejectionReason, adminToken) {
  return apiRequest(`/api/admin/facility/reject/${facilityId}`, {
    method: "PUT",
    token: adminToken,
    body: { rejectionReason },
    expectedStatus: 200,
  });
}

export async function createBloodRequest(token, payload) {
  return apiRequest("/api/hospital/blood/request", {
    method: "POST",
    token,
    body: payload,
    expectedStatus: 201,
  });
}

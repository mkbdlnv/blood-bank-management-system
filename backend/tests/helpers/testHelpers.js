import jwt from "jsonwebtoken";
import request from "supertest";
import Admin from "../../models/adminModel.js";
import Blood from "../../models/bloodModel.js";
import BloodRequest from "../../models/bloodRequestModel.js";
import Donor from "../../models/donorModel.js";
import Facility from "../../models/facilityModel.js";
import { buildAdminPayload, buildDonorPayload, buildFacilityPayload } from "./testData.js";

export function authHeader(token) {
  return { Authorization: `Bearer ${token}` };
}

export async function registerUser(app, payload) {
  return request(app)
    .post("/api/auth/register")
    .send(payload);
}

export async function loginUser(app, credentials) {
  return request(app)
    .post("/api/auth/login")
    .send(credentials);
}

export async function createTestAdmin(overrides = {}) {
  return Admin.create(buildAdminPayload(overrides));
}

export async function createTestDonor(overrides = {}) {
  return Donor.create(buildDonorPayload(overrides));
}

export async function createTestFacility(overrides = {}) {
  return Facility.create(buildFacilityPayload(overrides));
}

export async function loginAs(app, role, overrides = {}) {
  if (role === "admin") {
    const admin = await createTestAdmin(overrides);
    const response = await loginUser(app, {
      email: admin.email,
      password: overrides.password || buildAdminPayload().password,
    });

    return {
      user: admin,
      token: response.body.token,
      response,
    };
  }

  if (role === "donor") {
    const donorPayload = buildDonorPayload(overrides);
    await registerUser(app, donorPayload);
    const response = await loginUser(app, {
      email: donorPayload.email,
      password: donorPayload.password,
    });

    return {
      credentials: donorPayload,
      token: response.body.token,
      response,
    };
  }

  const facilityPayload = buildFacilityPayload({
    facilityType: role,
    role,
    ...overrides,
  });

  const facility = await createTestFacility({
    ...facilityPayload,
    status: overrides.status || "approved",
  });

  const response = await loginUser(app, {
    email: facility.email,
    password: facilityPayload.password,
  });

  return {
    user: facility,
    token: response.body.token,
    response,
  };
}

export function signToken(user) {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

export async function seedBloodStock({ bloodLab, hospital, bloodGroup = "O+", quantity = 10 }) {
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + 42);

  return Blood.create({
    bloodGroup,
    quantity,
    expiryDate,
    bloodLab,
    hospital,
  });
}

export async function seedBloodRequest(overrides = {}) {
  return BloodRequest.create({
    hospitalId: overrides.hospitalId,
    labId: overrides.labId,
    bloodType: overrides.bloodType || "O+",
    units: overrides.units || 2,
    status: overrides.status || "pending",
    processedAt: overrides.processedAt,
    notes: overrides.notes,
  });
}

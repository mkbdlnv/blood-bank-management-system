import request from "supertest";
import app from "../../app.js";
import { setupApiTestLifecycle } from "../setup/testDatabase.js";
import { buildDonorPayload, buildFacilityPayload } from "../helpers/testData.js";
import { authHeader, createTestAdmin, loginUser, registerUser, signToken } from "../helpers/testHelpers.js";

setupApiTestLifecycle();

describe("Auth API", () => {
  test("POST /api/auth/register registers a donor with valid input", async () => {
    const donorPayload = buildDonorPayload();

    const response = await registerUser(app, donorPayload);

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.user).toMatchObject({
      email: donorPayload.email,
      role: "donor",
    });
    expect(response.body.redirect).toBe("/donor/dashboard");
  });

  test("POST /api/auth/register registers a facility in pending status", async () => {
    const facilityPayload = buildFacilityPayload({ facilityType: "hospital", role: "hospital" });

    const response = await registerUser(app, facilityPayload);

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.user).toMatchObject({
      email: facilityPayload.email,
      role: "hospital",
    });
    expect(response.body.redirect).toBe("/");
  });

  test("POST /api/auth/register rejects duplicate registration for the same email", async () => {
    const donorPayload = buildDonorPayload();

    await registerUser(app, donorPayload);
    const duplicateResponse = await registerUser(app, donorPayload);

    expect(duplicateResponse.status).toBe(500);
    expect(duplicateResponse.body.message).toBe("Registration failed");
  });

  test("POST /api/auth/register rejects requests without a role", async () => {
    const donorPayload = buildDonorPayload();
    delete donorPayload.role;

    const response = await registerUser(app, donorPayload);

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Role is required");
  });

  test("POST /api/auth/register rejects an unsupported role", async () => {
    const donorPayload = buildDonorPayload({ role: "admin" });

    const response = await registerUser(app, donorPayload);

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Invalid role");
  });

  test("POST /api/auth/login logs in a donor with valid credentials", async () => {
    const donorPayload = buildDonorPayload();
    await registerUser(app, donorPayload);

    const response = await loginUser(app, {
      email: donorPayload.email,
      password: donorPayload.password,
    });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.token).toEqual(expect.any(String));
    expect(response.body.user).toMatchObject({
      email: donorPayload.email,
      role: "donor",
    });
    expect(response.body.redirect).toBe("/donor");
  });

  test("POST /api/auth/login rejects missing credentials", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({ email: "", password: "" });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Email and password are required");
  });

  test("POST /api/auth/login rejects an incorrect password", async () => {
    const donorPayload = buildDonorPayload();
    await registerUser(app, donorPayload);

    const response = await loginUser(app, {
      email: donorPayload.email,
      password: "WrongPass123!",
    });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Invalid credentials");
  });

  test("POST /api/auth/login blocks facilities that are still pending approval", async () => {
    const facilityPayload = buildFacilityPayload({ facilityType: "blood-lab", role: "blood-lab" });
    await registerUser(app, facilityPayload);

    const response = await loginUser(app, {
      email: facilityPayload.email,
      password: facilityPayload.password,
    });

    expect(response.status).toBe(403);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain("awaiting admin approval");
  });

  test("GET /api/auth/profile returns the authenticated admin profile", async () => {
    const admin = await createTestAdmin();
    const token = signToken(admin);

    const response = await request(app)
      .get("/api/auth/profile")
      .set(authHeader(token));

    expect(response.status).toBe(200);
    expect(response.body.user).toMatchObject({
      email: admin.email,
      role: "admin",
    });
  });

  test("GET /api/auth/profile rejects requests without a token", async () => {
    const response = await request(app).get("/api/auth/profile");

    expect(response.status).toBe(401);
    expect(response.body.message).toBe("No token provided");
  });

  test("GET /api/auth/profile rejects invalid bearer tokens", async () => {
    const response = await request(app)
      .get("/api/auth/profile")
      .set(authHeader("not-a-real-token"));

    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Token invalid or expired");
  });
});

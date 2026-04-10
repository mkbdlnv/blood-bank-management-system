import request from "supertest";
import app from "../../app.js";
import { buildDonorPayload } from "../helpers/testData.js";
import {
  authHeader,
  createTestDonor,
  createTestFacility,
  loginAs,
  seedBloodStock,
} from "../helpers/testHelpers.js";
import { setupApiTestLifecycle } from "../setup/testDatabase.js";

setupApiTestLifecycle();

describe("Hospital API", () => {
  test("POST /api/hospital/blood/request creates a blood request for an approved lab", async () => {
    const { token, user: hospital } = await loginAs(app, "hospital");
    const lab = await createTestFacility({
      facilityType: "blood-lab",
      role: "blood-lab",
      status: "approved",
    });

    const response = await request(app)
      .post("/api/hospital/blood/request")
      .set(authHeader(token))
      .send({
        labId: lab._id.toString(),
        bloodType: "A+",
        units: 3,
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toMatchObject({
      hospitalId: hospital._id.toString(),
      labId: lab._id.toString(),
      bloodType: "A+",
      units: 3,
      status: "pending",
    });
  });

  test("POST /api/hospital/blood/request rejects missing required fields", async () => {
    const { token } = await loginAs(app, "hospital");

    const response = await request(app)
      .post("/api/hospital/blood/request")
      .set(authHeader(token))
      .send({ bloodType: "A+" });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Please provide labId, bloodType, and units");
  });

  test("POST /api/hospital/blood/request rejects non-positive unit counts", async () => {
    const { token } = await loginAs(app, "hospital");
    const lab = await createTestFacility({
      facilityType: "blood-lab",
      role: "blood-lab",
      status: "approved",
    });

    const response = await request(app)
      .post("/api/hospital/blood/request")
      .set(authHeader(token))
      .send({
        labId: lab._id.toString(),
        bloodType: "A+",
        units: -1,
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Units must be at least 1");
  });

  test("POST /api/hospital/blood/request rejects requests to unapproved labs", async () => {
    const { token } = await loginAs(app, "hospital");
    const lab = await createTestFacility({
      facilityType: "blood-lab",
      role: "blood-lab",
      status: "pending",
    });

    const response = await request(app)
      .post("/api/hospital/blood/request")
      .set(authHeader(token))
      .send({
        labId: lab._id.toString(),
        bloodType: "B+",
        units: 2,
      });

    expect(response.status).toBe(404);
    expect(response.body.message).toBe("Blood lab not found or not approved");
  });

  test("POST /api/hospital/blood/request rejects donor tokens for facility-only access", async () => {
    const { token } = await loginAs(app, "donor");

    const response = await request(app)
      .post("/api/hospital/blood/request")
      .set(authHeader(token))
      .send({
        labId: "507f1f77bcf86cd799439011",
        bloodType: "O+",
        units: 1,
      });

    expect(response.status).toBe(404);
    expect(response.body.message).toBe("Facility not found");
  });

  test("GET /api/hospital/blood/requests returns the hospital request history", async () => {
    const { token } = await loginAs(app, "hospital");
    const approvedLab = await createTestFacility({
      facilityType: "blood-lab",
      role: "blood-lab",
      status: "approved",
      name: "QA Central Lab",
    });

    await request(app)
      .post("/api/hospital/blood/request")
      .set(authHeader(token))
      .send({
        labId: approvedLab._id.toString(),
        bloodType: "AB+",
        units: 4,
      });

    const response = await request(app)
      .get("/api/hospital/blood/requests")
      .set(authHeader(token));

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0]).toMatchObject({
      bloodType: "AB+",
      units: 4,
      status: "pending",
    });
    expect(response.body.data[0].labId).toMatchObject({
      name: "QA Central Lab",
    });
  });

  test("GET /api/hospital/blood/stock returns an empty array when the hospital has no inventory", async () => {
    const { token } = await loginAs(app, "hospital");

    const response = await request(app)
      .get("/api/hospital/blood/stock")
      .set(authHeader(token));

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toEqual([]);
  });

  test("GET /api/hospital/blood/stock returns the hospital inventory", async () => {
    const { token, user: hospital } = await loginAs(app, "hospital");
    await seedBloodStock({
      hospital: hospital._id,
      bloodGroup: "O-",
      quantity: 6,
    });

    const response = await request(app)
      .get("/api/hospital/blood/stock")
      .set(authHeader(token));

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          bloodGroup: "O-",
          quantity: 6,
        }),
      ])
    );
  });

  test("GET /api/hospital/donors returns donors visible to the hospital", async () => {
    const { token } = await loginAs(app, "hospital");
    const donor = await createTestDonor(buildDonorPayload({ fullName: "Visible Donor", bloodGroup: "A-" }));

    const response = await request(app)
      .get("/api/hospital/donors")
      .set(authHeader(token));

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.donors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          email: donor.email,
          fullName: "Visible Donor",
          bloodGroup: "A-",
        }),
      ])
    );
  });
});

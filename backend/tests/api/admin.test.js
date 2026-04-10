import mongoose from "mongoose";
import request from "supertest";
import app from "../../app.js";
import Facility from "../../models/facilityModel.js";
import { buildFacilityPayload } from "../helpers/testData.js";
import { authHeader, createTestFacility, loginAs } from "../helpers/testHelpers.js";
import { setupApiTestLifecycle } from "../setup/testDatabase.js";

setupApiTestLifecycle();

describe("Admin Facility Approval API", () => {
  test("GET /api/admin/facilities lists registered facilities for an authenticated admin", async () => {
    const { token } = await loginAs(app, "admin");
    const hospital = await createTestFacility({
      ...buildFacilityPayload({ facilityType: "hospital", role: "hospital" }),
      status: "pending",
    });
    const bloodLab = await createTestFacility({
      ...buildFacilityPayload({ facilityType: "blood-lab", role: "blood-lab" }),
      status: "approved",
    });

    const response = await request(app)
      .get("/api/admin/facilities")
      .set(authHeader(token));

    expect(response.status).toBe(200);
    expect(response.body.facilities).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ email: hospital.email }),
        expect.objectContaining({ email: bloodLab.email }),
      ])
    );
  });

  test("GET /api/admin/facilities rejects unauthenticated access", async () => {
    const response = await request(app).get("/api/admin/facilities");

    expect(response.status).toBe(401);
    expect(response.body.message).toBe("No token provided");
  });

  test("PUT /api/admin/facility/approve/:id approves a pending facility", async () => {
    const { token } = await loginAs(app, "admin");
    const facility = await createTestFacility({
      ...buildFacilityPayload({ facilityType: "hospital", role: "hospital" }),
      status: "pending",
    });

    const response = await request(app)
      .put(`/api/admin/facility/approve/${facility._id}`)
      .set(authHeader(token));

    const updatedFacility = await Facility.findById(facility._id);

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Facility approved");
    expect(updatedFacility.status).toBe("approved");
  });

  test("PUT /api/admin/facility/approve/:id returns 404 for an unknown facility id", async () => {
    const { token } = await loginAs(app, "admin");
    const missingId = new mongoose.Types.ObjectId();

    const response = await request(app)
      .put(`/api/admin/facility/approve/${missingId}`)
      .set(authHeader(token));

    expect(response.status).toBe(404);
    expect(response.body.message).toBe("Facility not found");
  });

  test("PUT /api/admin/facility/reject/:id rejects a facility and stores the reason", async () => {
    const { token } = await loginAs(app, "admin");
    const facility = await createTestFacility({
      ...buildFacilityPayload({ facilityType: "blood-lab", role: "blood-lab" }),
      status: "pending",
    });

    const response = await request(app)
      .put(`/api/admin/facility/reject/${facility._id}`)
      .set(authHeader(token))
      .send({ rejectionReason: "Incomplete registration documents" });

    const updatedFacility = await Facility.findById(facility._id);

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Facility rejected and status updated");
    expect(updatedFacility.status).toBe("rejected");
    expect(updatedFacility.rejectionReason).toBe("Incomplete registration documents");
  });

  test("PUT /api/admin/facility/reject/:id requires a rejection reason", async () => {
    const { token } = await loginAs(app, "admin");
    const facility = await createTestFacility({
      ...buildFacilityPayload({ facilityType: "hospital", role: "hospital" }),
      status: "pending",
    });

    const response = await request(app)
      .put(`/api/admin/facility/reject/${facility._id}`)
      .set(authHeader(token))
      .send({});

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Rejection reason is required.");
  });

  test("PUT /api/admin/facility/reject/:id returns 404 for an unknown facility id", async () => {
    const { token } = await loginAs(app, "admin");
    const missingId = new mongoose.Types.ObjectId();

    const response = await request(app)
      .put(`/api/admin/facility/reject/${missingId}`)
      .set(authHeader(token))
      .send({ rejectionReason: "No matching facility" });

    expect(response.status).toBe(404);
    expect(response.body.message).toBe("Facility not found");
  });

  test.todo("GET /api/admin/facilities should reject non-admin roles once RBAC is enforced");
});

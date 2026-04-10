import mongoose from "mongoose";
import request from "supertest";
import app from "../../app.js";
import Blood from "../../models/bloodModel.js";
import BloodRequest from "../../models/bloodRequestModel.js";
import {
  authHeader,
  createTestFacility,
  loginAs,
  seedBloodRequest,
  seedBloodStock,
} from "../helpers/testHelpers.js";
import { setupApiTestLifecycle } from "../setup/testDatabase.js";

setupApiTestLifecycle();

describe("Blood Lab API", () => {
  test("POST /api/blood-lab/blood/add adds a new blood stock record", async () => {
    const { token } = await loginAs(app, "blood-lab");

    const response = await request(app)
      .post("/api/blood-lab/blood/add")
      .set(authHeader(token))
      .send({ bloodType: "A+", quantity: 5 });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toMatchObject({
      bloodGroup: "A+",
      quantity: 5,
    });
  });

  test("POST /api/blood-lab/blood/add rejects invalid stock payloads", async () => {
    const { token } = await loginAs(app, "blood-lab");

    const response = await request(app)
      .post("/api/blood-lab/blood/add")
      .set(authHeader(token))
      .send({ bloodType: "", quantity: 0 });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Please provide valid bloodType and quantity");
  });

  test("POST /api/blood-lab/blood/add rejects donor access to facility-only inventory endpoints", async () => {
    const { token } = await loginAs(app, "donor");

    const response = await request(app)
      .post("/api/blood-lab/blood/add")
      .set(authHeader(token))
      .send({ bloodType: "B+", quantity: 2 });

    expect(response.status).toBe(404);
    expect(response.body.message).toBe("Facility not found");
  });

  test("POST /api/blood-lab/blood/remove removes blood units from stock", async () => {
    const { token, user: lab } = await loginAs(app, "blood-lab");
    const stock = await seedBloodStock({
      bloodLab: lab._id,
      bloodGroup: "O+",
      quantity: 8,
    });

    const response = await request(app)
      .post("/api/blood-lab/blood/remove")
      .set(authHeader(token))
      .send({ bloodType: "O+", quantity: 3 });

    const updatedStock = await Blood.findById(stock._id);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toEqual({
      bloodType: "O+",
      remainingQuantity: 5,
    });
    expect(updatedStock.quantity).toBe(5);
  });

  test("POST /api/blood-lab/blood/remove rejects removal when stock is insufficient", async () => {
    const { token, user: lab } = await loginAs(app, "blood-lab");
    await seedBloodStock({
      bloodLab: lab._id,
      bloodGroup: "AB-",
      quantity: 2,
    });

    const response = await request(app)
      .post("/api/blood-lab/blood/remove")
      .set(authHeader(token))
      .send({ bloodType: "AB-", quantity: 5 });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain("Insufficient stock");
  });

  test("POST /api/blood-lab/blood/remove returns 404 when the blood type is not stocked", async () => {
    const { token } = await loginAs(app, "blood-lab");

    const response = await request(app)
      .post("/api/blood-lab/blood/remove")
      .set(authHeader(token))
      .send({ bloodType: "B-", quantity: 1 });

    expect(response.status).toBe(404);
    expect(response.body.message).toBe("No stock found for blood type B-");
  });

  test("GET /api/blood-lab/blood/stock returns an empty array for a new blood lab", async () => {
    const { token } = await loginAs(app, "blood-lab");

    const response = await request(app)
      .get("/api/blood-lab/blood/stock")
      .set(authHeader(token));

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toEqual([]);
  });

  test("GET /api/blood-lab/blood/requests returns incoming hospital requests", async () => {
    const { token, user: lab } = await loginAs(app, "blood-lab");
    const hospital = await createTestFacility({
      facilityType: "hospital",
      role: "hospital",
      status: "approved",
      name: "QA Hospital West",
    });
    await seedBloodRequest({
      hospitalId: hospital._id,
      labId: lab._id,
      bloodType: "A-",
      units: 2,
    });

    const response = await request(app)
      .get("/api/blood-lab/blood/requests")
      .set(authHeader(token));

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.requests).toHaveLength(1);
    expect(response.body.requests[0]).toMatchObject({
      bloodType: "A-",
      units: 2,
      status: "pending",
    });
    expect(response.body.requests[0].hospitalId).toMatchObject({
      name: "QA Hospital West",
    });
  });

  test("PUT /api/blood-lab/blood/requests/:id accepts a request and transfers inventory to the hospital", async () => {
    const { token, user: lab } = await loginAs(app, "blood-lab");
    const hospital = await createTestFacility({
      facilityType: "hospital",
      role: "hospital",
      status: "approved",
      name: "Transfer Hospital",
    });
    const requestRecord = await seedBloodRequest({
      hospitalId: hospital._id,
      labId: lab._id,
      bloodType: "O-",
      units: 4,
    });
    await seedBloodStock({
      bloodLab: lab._id,
      bloodGroup: "O-",
      quantity: 10,
    });

    const response = await request(app)
      .put(`/api/blood-lab/blood/requests/${requestRecord._id}`)
      .set(authHeader(token))
      .send({ action: "accept" });

    const updatedRequest = await BloodRequest.findById(requestRecord._id);
    const labStock = await Blood.findOne({ bloodLab: lab._id, bloodGroup: "O-" });
    const hospitalStock = await Blood.findOne({ hospital: hospital._id, bloodGroup: "O-" });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Request accepted successfully");
    expect(updatedRequest.status).toBe("accepted");
    expect(updatedRequest.processedAt).toBeTruthy();
    expect(labStock.quantity).toBe(6);
    expect(hospitalStock.quantity).toBe(4);
  });

  test("PUT /api/blood-lab/blood/requests/:id rejects a request without changing stock", async () => {
    const { token, user: lab } = await loginAs(app, "blood-lab");
    const hospital = await createTestFacility({
      facilityType: "hospital",
      role: "hospital",
      status: "approved",
    });
    const requestRecord = await seedBloodRequest({
      hospitalId: hospital._id,
      labId: lab._id,
      bloodType: "B+",
      units: 2,
    });
    await seedBloodStock({
      bloodLab: lab._id,
      bloodGroup: "B+",
      quantity: 7,
    });

    const response = await request(app)
      .put(`/api/blood-lab/blood/requests/${requestRecord._id}`)
      .set(authHeader(token))
      .send({ action: "reject" });

    const updatedRequest = await BloodRequest.findById(requestRecord._id);
    const labStock = await Blood.findOne({ bloodLab: lab._id, bloodGroup: "B+" });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Request rejected successfully");
    expect(updatedRequest.status).toBe("rejected");
    expect(labStock.quantity).toBe(7);
  });

  test("PUT /api/blood-lab/blood/requests/:id rejects invalid actions", async () => {
    const { token, user: lab } = await loginAs(app, "blood-lab");
    const hospital = await createTestFacility({
      facilityType: "hospital",
      role: "hospital",
      status: "approved",
    });
    const requestRecord = await seedBloodRequest({
      hospitalId: hospital._id,
      labId: lab._id,
    });

    const response = await request(app)
      .put(`/api/blood-lab/blood/requests/${requestRecord._id}`)
      .set(authHeader(token))
      .send({ action: "hold" });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Invalid action. Must be 'accept' or 'reject'");
  });

  test("PUT /api/blood-lab/blood/requests/:id rejects already processed requests", async () => {
    const { token, user: lab } = await loginAs(app, "blood-lab");
    const hospital = await createTestFacility({
      facilityType: "hospital",
      role: "hospital",
      status: "approved",
    });
    const requestRecord = await seedBloodRequest({
      hospitalId: hospital._id,
      labId: lab._id,
      status: "accepted",
      processedAt: new Date(),
    });

    const response = await request(app)
      .put(`/api/blood-lab/blood/requests/${requestRecord._id}`)
      .set(authHeader(token))
      .send({ action: "reject" });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Request already processed");
  });

  test("PUT /api/blood-lab/blood/requests/:id returns 404 for an unknown request id", async () => {
    const { token } = await loginAs(app, "blood-lab");
    const missingId = new mongoose.Types.ObjectId();

    const response = await request(app)
      .put(`/api/blood-lab/blood/requests/${missingId}`)
      .set(authHeader(token))
      .send({ action: "accept" });

    expect(response.status).toBe(404);
    expect(response.body.message).toBe("Request not found");
  });
});

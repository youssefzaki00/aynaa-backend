const request = require("supertest");
const app = require("../server");
const ExcludedApp = require("../keywords-blocking-excluded-app/ExcludedApp");
const connectDB = require("../config/db");
const { createAdminToken } = require("../utils/createAdminToken.js");

describe("Excluded Apps API", () => {
  let db;
  let adminToken;

  beforeAll(async () => {
    db = await connectDB();
    await ExcludedApp.deleteMany({});
    adminToken = await createAdminToken();
  });

  afterAll(async () => {
    await ExcludedApp.deleteMany({});
  });

  describe("POST /api/v1/excluded-apps", () => {
    test("should return 401 without admin token", async () => {
      const res = await request(app)
        .post("/api/v1/excluded-apps")
        .send({ packageName: "com.example.app" });

      expect(res.statusCode).toBe(401);
    });

    test("should create an excluded app", async () => {
      const res = await request(app)
        .post("/api/v1/excluded-apps")
        .auth(adminToken, { type: "bearer" })
        .send({ packageName: "com.example.app" });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.excludedApp.packageName).toBe("com.example.app");
      expect(res.body.data.excludedApp.isActive).toBe(true);
    });

    test("should return 409 for duplicate package name", async () => {
      const res = await request(app)
        .post("/api/v1/excluded-apps")
        .auth(adminToken, { type: "bearer" })
        .send({ packageName: "com.example.app" });

      expect(res.statusCode).toBe(409);
    });
  });

  describe("GET /api/v1/excluded-apps", () => {
    test("should return 401 without admin token", async () => {
      const res = await request(app).get("/api/v1/excluded-apps");
      expect(res.statusCode).toBe(401);
    });

    test("should get excluded apps", async () => {
      const res = await request(app)
        .get("/api/v1/excluded-apps")
        .auth(adminToken, { type: "bearer" });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.excludedApps)).toBe(true);
      expect(res.body.data.excludedApps.length).toBeGreaterThan(0);
    });
  });

  describe("PATCH /api/v1/excluded-apps/:id", () => {
    let excludedAppId;

    beforeAll(async () => {
      await ExcludedApp.deleteMany({});
      const app = await ExcludedApp.create({ packageName: "com.test.update" });
      excludedAppId = app._id.toString();
    });

    test("should return 401 without admin token", async () => {
      const res = await request(app)
        .patch(`/api/v1/excluded-apps/${excludedAppId}`)
        .send({ isActive: false });

      expect(res.statusCode).toBe(401);
    });

    test("should update excluded app", async () => {
      const res = await request(app)
        .patch(`/api/v1/excluded-apps/${excludedAppId}`)
        .auth(adminToken, { type: "bearer" })
        .send({ isActive: false });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.excludedApp.isActive).toBe(false);
    });

    test("should return 404 for non-existent app", async () => {
      const fakeId = "507f1f77bcf86cd799439011";
      const res = await request(app)
        .patch(`/api/v1/excluded-apps/${fakeId}`)
        .auth(adminToken, { type: "bearer" })
        .send({ isActive: true });

      expect(res.statusCode).toBe(404);
    });
  });

  describe("DELETE /api/v1/excluded-apps/:id", () => {
    let excludedAppId;

    beforeAll(async () => {
      await ExcludedApp.deleteMany({});
      const app = await ExcludedApp.create({ packageName: "com.test.delete" });
      excludedAppId = app._id.toString();
    });

    test("should return 401 without admin token", async () => {
      const res = await request(app).delete(`/api/v1/excluded-apps/${excludedAppId}`);
      expect(res.statusCode).toBe(401);
    });

    test("should delete excluded app", async () => {
      const res = await request(app)
        .delete(`/api/v1/excluded-apps/${excludedAppId}`)
        .auth(adminToken, { type: "bearer" });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.deletedExcludedApp.packageName).toBe("com.test.delete");
    });

    test("should return 404 for non-existent app", async () => {
      const fakeId = "507f1f77bcf86cd799439011";
      const res = await request(app)
        .delete(`/api/v1/excluded-apps/${fakeId}`)
        .auth(adminToken, { type: "bearer" });

      expect(res.statusCode).toBe(404);
    });
  });
});
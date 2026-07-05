const request = require("supertest");
const app = require("../server");
const ExcludedApp = require("../keywords-blocking-excluded-app/ExcludedApp");
const connectDB = require("../config/db");
const { createTestAdminToken } = require("./helpers/testAuth");
const { runId, track, testPackage } = require("./helpers/testContext");

describe("Excluded Apps API", () => {
  let adminToken;
  let mainPackage;

  beforeAll(async () => {
    await connectDB();
    adminToken = (await createTestAdminToken()).token;
    mainPackage = testPackage("excluded");
  });

  const createTrackedExcludedApp = async (slug) => {
    const doc = await ExcludedApp.create({ packageName: testPackage(slug) });
    track("excludedApps", doc._id);
    return doc;
  };

  describe("POST /api/v1/excluded-apps", () => {
    test("should return 401 without admin token", async () => {
      const res = await request(app)
        .post("/api/v1/excluded-apps")
        .send({ packageName: testPackage("unauth") });

      expect(res.statusCode).toBe(401);
    });

    test("should create an excluded app", async () => {
      const res = await request(app)
        .post("/api/v1/excluded-apps")
        .auth(adminToken, { type: "bearer" })
        .send({ packageName: mainPackage });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.excludedApp.packageName).toBe(mainPackage);
      track("excludedApps", res.body.data.excludedApp.id);
    });

    test("should return 409 for duplicate package name", async () => {
      const res = await request(app)
        .post("/api/v1/excluded-apps")
        .auth(adminToken, { type: "bearer" })
        .send({ packageName: mainPackage });

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
        .auth(adminToken, { type: "bearer" })
        .query({ search: runId });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.excludedApps.length).toBeGreaterThan(0);
      expect(Array.isArray(res.body.data.deletedIds)).toBe(true);
    });
  });

  describe("lastSync and soft delete tombstones", () => {
    test("should return deletedIds after soft delete", async () => {
      const created = await createTrackedExcludedApp("sync-tombstone");
      const lastSync = new Date().toISOString();

      await new Promise((resolve) => setTimeout(resolve, 10));

      await request(app)
        .delete(`/api/v1/excluded-apps/${created._id}`)
        .auth(adminToken, { type: "bearer" });

      const res = await request(app)
        .get("/api/v1/excluded-apps")
        .auth(adminToken, { type: "bearer" })
        .query({ lastSync, search: runId });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.deletedIds.map(String)).toContain(created._id.toString());
      expect(res.body.data.excludedApps).toHaveLength(0);
    });
  });

  describe("PATCH /api/v1/excluded-apps/:id", () => {
    let excludedAppId;

    beforeAll(async () => {
      const doc = await createTrackedExcludedApp("update");
      excludedAppId = doc._id.toString();
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
    let packageName;

    beforeAll(async () => {
      const doc = await createTrackedExcludedApp("delete");
      excludedAppId = doc._id.toString();
      packageName = doc.packageName;
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
      expect(res.body.data.deletedExcludedApp.packageName).toBe(packageName);
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

const request = require("supertest");
const app = require("../server");
const AppModel = require("../models/App");
const connectDB = require("../config/db");
const { createTestAdminToken, createTestUserToken } = require("./helpers/testAuth");
const { runId, track, testPackage } = require("./helpers/testContext");

describe("Apps API", () => {
  let adminToken;
  let userToken;
  let mainPackage;

  beforeAll(async () => {
    await connectDB();
    userToken = (await createTestUserToken()).token;
    adminToken = (await createTestAdminToken()).token;
    mainPackage = testPackage("main");
  });

  const createTrackedApp = async (slug) => {
    const appDoc = await AppModel.create({ packageName: testPackage(slug) });
    track("apps", appDoc._id);
    return appDoc;
  };

  describe("POST /api/v1/apps", () => {
    test("should return 401 without admin token", async () => {
      const res = await request(app)
        .post("/api/v1/apps")
        .send({ packageName: testPackage("unauth") });

      expect(res.statusCode).toBe(401);
    });

    test("should create an app", async () => {
      const res = await request(app)
        .post("/api/v1/apps")
        .auth(adminToken, { type: "bearer" })
        .send({ packageName: mainPackage });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.app.packageName).toBe(mainPackage);
      track("apps", res.body.data.app.id);
    });

    test("should return 409 for duplicate package name", async () => {
      const res = await request(app)
        .post("/api/v1/apps")
        .auth(adminToken, { type: "bearer" })
        .send({ packageName: mainPackage });

      expect(res.statusCode).toBe(409);
    });
  });

  describe("GET /api/v1/apps", () => {
    test("should allow public access", async () => {
      const res = await request(app)
        .get("/api/v1/apps")
        .auth(userToken, { type: "bearer" })
        .query({ search: runId });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.apps)).toBe(true);
      expect(res.body.data.apps.length).toBe(1);
      expect(res.body.data.apps[0].packageName).toBe(mainPackage);
    });

    test("should filter by search query", async () => {
      const res = await request(app)
        .get("/api/v1/apps")
        .auth(userToken, { type: "bearer" })
        .query({ search: mainPackage });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.apps.length).toBe(1);
      expect(res.body.data.apps[0].packageName).toBe(mainPackage);
    });

    describe("should support lastSync query", () => {
      test("should return 0 apps", async () => {
        const res = await request(app)
          .get("/api/v1/apps")
          .auth(userToken, { type: "bearer" })
          .query({ lastSync: new Date().toISOString(), search: runId });

        expect(res.statusCode).toBe(200);
        expect(res.body.data.apps.length).toBe(0);
      });

      test("should return 1 app", async () => {
        const res = await request(app)
          .get("/api/v1/apps")
          .auth(userToken, { type: "bearer" })
          .query({
            lastSync: new Date("2020-02-01").toISOString(),
            search: runId,
          });

        expect(res.statusCode).toBe(200);
        expect(res.body.data.apps.length).toBe(1);
        expect(Array.isArray(res.body.data.deletedIds)).toBe(true);
      });
    });
  });

  describe("soft delete and lastSync tombstones", () => {
    test("should exclude soft-deleted app from full list", async () => {
      const created = await createTrackedApp("tombstone");

      await request(app)
        .delete(`/api/v1/apps/${created._id}`)
        .auth(adminToken, { type: "bearer" });

      const res = await request(app)
        .get("/api/v1/apps")
        .auth(userToken, { type: "bearer" })
        .query({ search: runId });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.apps).toHaveLength(1);
      expect(res.body.data.apps[0].packageName).toBe(mainPackage);
    });

    test("should return deletedIds in lastSync response after delete", async () => {
      const created = await createTrackedApp("sync-delete");
      const lastSync = new Date().toISOString();

      await new Promise((resolve) => setTimeout(resolve, 10));

      await request(app)
        .delete(`/api/v1/apps/${created._id}`)
        .auth(adminToken, { type: "bearer" });

      const res = await request(app)
        .get("/api/v1/apps")
        .auth(userToken, { type: "bearer" })
        .query({ lastSync, search: runId });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.deletedIds.map(String)).toContain(created._id.toString());
      expect(res.body.data.apps).toHaveLength(0);
    });
  });
});

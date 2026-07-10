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

    test("should restore soft-deleted app on recreate", async () => {
      const restorePackage = testPackage("restore");
      const created = await createTrackedApp("restore");

      await request(app)
        .delete(`/api/v1/apps/${created._id}`)
        .auth(adminToken, { type: "bearer" });

      const res = await request(app)
        .post("/api/v1/apps")
        .auth(adminToken, { type: "bearer" })
        .send({ packageName: restorePackage });

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toMatch(/restored/i);
      expect(res.body.data.app.id).toBe(created._id.toString());
      expect(res.body.data.app.isDeleted).toBe(false);
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
      expect(Array.isArray(res.body.data.items)).toBe(true);
      expect(res.body.data.items.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data.pagination).toBeDefined();
      expect(res.body.data.items.some((item) => item.packageName === mainPackage)).toBe(
        true,
      );
    });

    test("should filter by search query", async () => {
      const res = await request(app)
        .get("/api/v1/apps")
        .auth(userToken, { type: "bearer" })
        .query({ search: mainPackage });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.items.length).toBe(1);
      expect(res.body.data.items[0].packageName).toBe(mainPackage);
    });

    describe("should support lastSync query", () => {
      test("should return 0 apps", async () => {
        const res = await request(app)
          .get("/api/v1/apps")
          .auth(userToken, { type: "bearer" })
          .query({ lastSync: new Date().toISOString(), search: runId });

        expect(res.statusCode).toBe(200);
        expect(res.body.data.items.length).toBe(0);
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
        expect(res.body.data.items.length).toBeGreaterThanOrEqual(1);
        expect(Array.isArray(res.body.data.deleted)).toBe(true);
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
      expect(res.body.data.items.some((item) => item.id === created._id.toString())).toBe(
        false,
      );
      expect(res.body.data.items.some((item) => item.packageName === mainPackage)).toBe(
        true,
      );
    });

    test("should return deleted in lastSync response after delete", async () => {
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
      expect(res.body.data.deleted.map(String)).toContain(created._id.toString());
      expect(res.body.data.items).toHaveLength(0);
    });

    test("should return 200 when deleting already deleted app", async () => {
      const created = await createTrackedApp("delete-twice");

      const first = await request(app)
        .delete(`/api/v1/apps/${created._id}`)
        .auth(adminToken, { type: "bearer" });
      expect(first.statusCode).toBe(200);

      const second = await request(app)
        .delete(`/api/v1/apps/${created._id}`)
        .auth(adminToken, { type: "bearer" });
      expect(second.statusCode).toBe(200);
    });

    test("should return 404 when deleting non-existent app", async () => {
      const fakeId = "507f1f77bcf86cd799439011";
      const res = await request(app)
        .delete(`/api/v1/apps/${fakeId}`)
        .auth(adminToken, { type: "bearer" });

      expect(res.statusCode).toBe(404);
    });
  });
});

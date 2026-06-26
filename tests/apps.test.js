const request = require("supertest");
const app = require("../server");
const AppModel = require("../models/App");
const connectDB = require("../config/db");
const { createAdminToken } = require("../utils/createAdminToken.js");
const { createUserToken } = require("../utils/createUserToken");

describe("Apps API", () => {
  let db;
  let adminToken;
  let userToken;

  beforeAll(async () => {
    db = await connectDB();
    await AppModel.deleteMany({});
    userToken = await createUserToken();
    adminToken = await createAdminToken();
  });

  afterAll(async () => {
    await AppModel.deleteMany({});
  });

  describe("POST /api/v1/apps", () => {
    test("should return 401 without admin token", async () => {
      const res = await request(app)
        .post("/api/v1/apps")
        .send({ packageName: "com.example.app" });

      expect(res.statusCode).toBe(401);
    });

    test("should create an app", async () => {
      const res = await request(app)
        .post("/api/v1/apps")
        .auth(adminToken, { type: "bearer" })
        .send({ packageName: "com.example.app" });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.app.packageName).toBe("com.example.app");
    });

    test("should return 409 for duplicate package name", async () => {
      const res = await request(app)
        .post("/api/v1/apps")
        .auth(adminToken, { type: "bearer" })
        .send({ packageName: "com.example.app" });

      expect(res.statusCode).toBe(409);
    });
  });

  describe("GET /api/v1/apps", () => {
    test("should allow public access", async () => {
      const res = await request(app)
        .get("/api/v1/apps")
        .auth(userToken, { type: "bearer" });
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.apps)).toBe(true);
      expect(res.body.data.apps.length).toBe(1);
    });

    describe("should support lastSync query", () => {
      test("should return 0 apps", async () => {
        const res = await request(app)
          .get("/api/v1/apps")
          .auth(userToken, { type: "bearer" })
          .query({ lastSync: new Date().toISOString() });
        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data.apps)).toBe(true);
        expect(res.body.data.apps.length).toBe(0);
      });

      test("should return 1 app", async () => {
        const res = await request(app)
          .get("/api/v1/apps")
          .auth(userToken, { type: "bearer" })
          .query({ lastSync: new Date("2020-02-01").toISOString() });
        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data.apps)).toBe(true);
        expect(res.body.data.apps.length).toBe(1);
      });
    });
  });
});

const request = require("supertest");
const app = require("../server");
const connectDB = require("../config/db");
const Site = require("../site/Site");
const { createAdminToken } = require("../utils/createAdminToken");
const User = require("../models/User");
const Category = require("../models/Category");
const { createCategories } = require("./factories/category.factory");
const { createUserToken } = require("../utils/createUserToken");

describe("Sites API", () => {
  let db;
  let adminToken;
  let categories;
  let userToken;
  let categoryId;

  beforeAll(async () => {
    db = await connectDB();
    await Category.deleteMany({});
    await User.deleteMany({});

    await Site.deleteMany({});
    categories = await createCategories();

    adminToken = await createAdminToken();
    userToken = await createUserToken();
    categoryId = categories[0]._id.toString();
  });

  afterAll(async () => {
    await db.connection.close();
  });

  test("POST /api/v1/sites (admin) creates site", async () => {
    const res = await request(app)
      .post("/api/v1/sites")
      .auth(adminToken, { type: "bearer" })
      .send({
        url: "https://example.com",
        categoryId: categoryId,
      });
    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.site.id).toBeDefined();
    expect(res.body.data.site.url).toBe("https://example.com");
  });

  test("GET /api/v1/sites (admin) can see all by isActive query", async () => {
    await Site.create({
      url: "https://inactive.com",
      isActive: false,
      category: categoryId,
    });

    const resTrue = await request(app)
      .get("/api/v1/sites?isActive=true&isBlocked=true")
      .auth(adminToken, { type: "bearer" });

    expect(resTrue.statusCode).toBe(200);
    expect(Array.isArray(resTrue.body.data.sites)).toBe(true);
    expect(resTrue.body.data.sites.every((s) => s.isActive === true)).toBe(
      true,
    );
    expect(resTrue.body.data.sites.every((s) => s.isBlocked === true)).toBe(
      true,
    );

    const resAll = await request(app)
      .get("/api/v1/sites")
      .auth(adminToken, { type: "bearer" });

    expect(resAll.body.data.sites.length).toBeGreaterThanOrEqual(1);
  });

  test("GET /api/v1/sites (non-admin) only gets active", async () => {
    const res = await request(app)
      .get("/api/v1/sites")
      .auth(userToken, { type: "bearer" });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.sites.every((s) => s.isActive === true)).toBe(true);
  });

  test("PATCH /api/v1/sites/:id (admin) updates site", async () => {
    const site = await Site.create({
      url: "https://update-me.com",
      category: categoryId,
    });

    const res = await request(app)
      .patch(`/api/v1/sites/${site._id}`)
      .auth(adminToken, { type: "bearer" })
      .send({ url: "https://updated.com", isActive: false });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.site.url).toBe("https://updated.com");
    expect(res.body.data.site.isActive).toBe(false);
  });

  test("DELETE /api/v1/sites/:id (admin) soft-deletes site", async () => {
    const site = await Site.create({
      url: "https://delete.com",
      category: categoryId,
    });

    const res = await request(app)
      .delete(`/api/v1/sites/${site._id}`)
      .auth(adminToken, { type: "bearer" });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.id).toBe(site._id.toString());

    const removed = await Site.findById(site._id);
    expect(removed).not.toBeNull();
    expect(removed.deletedAt).not.toBeNull();
  });

  describe("lastSync and soft delete tombstones", () => {
    test("should return sites changed after lastSync", async () => {
      const site = await Site.create({
        url: "https://sync-test.com",
        category: categoryId,
      });
      const lastSync = new Date().toISOString();

      await request(app)
        .patch(`/api/v1/sites/${site._id}`)
        .auth(adminToken, { type: "bearer" })
        .send({ url: "https://sync-updated.com" });

      const res = await request(app)
        .get("/api/v1/sites")
        .auth(adminToken, { type: "bearer" })
        .query({ lastSync });

      expect(res.statusCode).toBe(200);
      const urls = res.body.data.sites.map((s) => s.url);
      expect(urls).toContain("https://sync-updated.com");
      expect(Array.isArray(res.body.data.deletedSiteIds)).toBe(true);
    });

    test("should return deletedSiteIds after soft delete", async () => {
      const site = await Site.create({
        url: "https://tombstone.com",
        category: categoryId,
      });
      const lastSync = new Date().toISOString();

      await new Promise((resolve) => setTimeout(resolve, 10));

      await request(app)
        .delete(`/api/v1/sites/${site._id}`)
        .auth(adminToken, { type: "bearer" });

      const res = await request(app)
        .get("/api/v1/sites")
        .auth(adminToken, { type: "bearer" })
        .query({ lastSync });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.deletedSiteIds.map(String)).toContain(site._id.toString());
      expect(res.body.data.sites.map((s) => s.id)).not.toContain(site._id.toString());
    });
  });

  describe("POST /api/v1/sites/upload", () => {
    test("upload sites file", async () => {
      const res = await request(app)
        .post("/api/v1/sites/upload")
        .auth(adminToken, { type: "bearer" })
        .attach("file", "tests/assets/test.txt")
        .field("categoryId", categories[0]._id.toString());

      expect(res.statusCode).toBe(200);

      const sites = await Site.find({})

      expect(sites.length).toBeGreaterThanOrEqual(10)

    });
  });
});

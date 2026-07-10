const request = require("supertest");
const app = require("../server");
const connectDB = require("../config/db");
const Site = require("../site/Site");
const { createTestAdminToken, createTestUserToken } = require("./helpers/testAuth");
const { createTestCategory } = require("./helpers/testFactories");
const { runId, track, testUrl } = require("./helpers/testContext");

describe("Sites API", () => {
  let adminToken;
  let userToken;
  let categoryId;

  beforeAll(async () => {
    await connectDB();
    const category = await createTestCategory("sites");
    categoryId = category._id.toString();
    adminToken = (await createTestAdminToken()).token;
    userToken = (await createTestUserToken()).token;
  });

  const createTrackedSite = async (slug, extra = {}) => {
    const site = await Site.create({
      url: testUrl(slug),
      category: categoryId,
      ...extra,
    });
    track("sites", site._id);
    return site;
  };

  test("POST /api/v1/sites (admin) creates site", async () => {
    const url = testUrl("created-via-api");
    const res = await request(app)
      .post("/api/v1/sites")
      .auth(adminToken, { type: "bearer" })
      .send({ url, categoryId });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.site.id).toBeDefined();
    expect(res.body.data.site.url).toBe(url);
    track("sites", res.body.data.site.id);
  });

  test("POST /api/v1/sites (admin) creates site with isActive false", async () => {
    const url = testUrl("inactive");
    const res = await request(app)
      .post("/api/v1/sites")
      .auth(adminToken, { type: "bearer" })
      .send({ url, categoryId, isActive: false });

    expect(res.statusCode).toBe(201);
    expect(res.body.data.site.isActive).toBe(false);
    track("sites", res.body.data.site.id);
  });

  test("POST /api/v1/sites returns 409 for duplicate url", async () => {
    const url = testUrl("duplicate");
    await Site.create({ url, category: categoryId });
    track("sites", (await Site.findOne({ url }))._id);

    const res = await request(app)
      .post("/api/v1/sites")
      .auth(adminToken, { type: "bearer" })
      .send({ url, categoryId });

    expect(res.statusCode).toBe(409);
  });

  test("POST /api/v1/sites restores soft-deleted site", async () => {
    const url = testUrl("restore");
    const site = await createTrackedSite("restore");
    site.deletedAt = new Date();
    await site.save();

    const res = await request(app)
      .post("/api/v1/sites")
      .auth(adminToken, { type: "bearer" })
      .send({ url, categoryId });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toMatch(/restored/i);
    expect(res.body.data.site.id).toBe(site._id.toString());
    expect(res.body.data.site.deletedAt).toBeUndefined();
  });

  test("GET /api/v1/sites (admin) can filter by isActive query", async () => {
    await createTrackedSite("filter-inactive", { isActive: false });
    await createTrackedSite("filter-active", { isActive: true });

    const resTrue = await request(app)
      .get("/api/v1/sites")
      .auth(adminToken, { type: "bearer" })
      .query({ isActive: true, search: runId });

    expect(resTrue.statusCode).toBe(200);
    expect(resTrue.body.data.items.every((s) => s.isActive === true)).toBe(true);
    expect(resTrue.body.data.items.some((s) => s.url.includes("filter-active"))).toBe(
      true,
    );
  });

  test("GET /api/v1/sites (admin) searches by url", async () => {
    await createTrackedSite("search-target");

    const res = await request(app)
      .get("/api/v1/sites")
      .auth(adminToken, { type: "bearer" })
      .query({ search: `${runId}-search-target` });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.items.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data.items.every((s) => s.url.includes(runId))).toBe(true);
    expect(res.body.data.pagination).toBeDefined();
  });

  test("GET /api/v1/sites returns both active and inactive", async () => {
    await createTrackedSite("user-inactive", { isActive: false });
    await createTrackedSite("user-active", { isActive: true });

    const res = await request(app)
      .get("/api/v1/sites")
      .auth(userToken, { type: "bearer" })
      .query({ search: runId });

    expect(res.statusCode).toBe(200);
    const urls = res.body.data.items.map((s) => s.url);
    expect(urls.some((u) => u.includes("user-inactive"))).toBe(true);
    expect(urls.some((u) => u.includes("user-active"))).toBe(true);
  });

  test("PATCH /api/v1/sites/:id (admin) updates site", async () => {
    const site = await createTrackedSite("update-me");
    const updatedUrl = testUrl("updated");

    const res = await request(app)
      .patch(`/api/v1/sites/${site._id}`)
      .auth(adminToken, { type: "bearer" })
      .send({ url: updatedUrl, isActive: false });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.site.url).toBe(updatedUrl);
    expect(res.body.data.site.isActive).toBe(false);
  });

  test("PATCH /api/v1/sites/:id (admin) toggles isActive", async () => {
    const site = await createTrackedSite("toggle-active", { isActive: true });

    const res = await request(app)
      .patch(`/api/v1/sites/${site._id}`)
      .auth(adminToken, { type: "bearer" })
      .send({ isActive: false });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.site.isActive).toBe(false);
  });

  test("DELETE /api/v1/sites/:id (admin) soft-deletes site", async () => {
    const site = await createTrackedSite("delete-me");

    const res = await request(app)
      .delete(`/api/v1/sites/${site._id}`)
      .auth(adminToken, { type: "bearer" });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.id).toBe(site._id.toString());

    const removed = await Site.findById(site._id);
    expect(removed).not.toBeNull();
    expect(removed.deletedAt).not.toBeNull();
  });

  test("DELETE /api/v1/sites returns 200 when already deleted", async () => {
    const site = await createTrackedSite("delete-twice");
    site.deletedAt = new Date();
    await site.save();

    const res = await request(app)
      .delete(`/api/v1/sites/${site._id}`)
      .auth(adminToken, { type: "bearer" });

    expect(res.statusCode).toBe(200);
  });

  test("DELETE /api/v1/sites returns 404 for non-existent site", async () => {
    const fakeId = "507f1f77bcf86cd799439011";
    const res = await request(app)
      .delete(`/api/v1/sites/${fakeId}`)
      .auth(adminToken, { type: "bearer" });

    expect(res.statusCode).toBe(404);
  });

  describe("lastSync and soft delete tombstones", () => {
    test("should return sites changed after lastSync", async () => {
      const site = await createTrackedSite("sync-test");
      const lastSync = new Date().toISOString();
      const updatedUrl = testUrl("sync-updated");

      await request(app)
        .patch(`/api/v1/sites/${site._id}`)
        .auth(adminToken, { type: "bearer" })
        .send({ url: updatedUrl });

      const res = await request(app)
        .get("/api/v1/sites")
        .auth(adminToken, { type: "bearer" })
        .query({ lastSync, search: runId });

      expect(res.statusCode).toBe(200);
      const urls = res.body.data.items.map((s) => s.url);
      expect(urls).toContain(updatedUrl);
      expect(Array.isArray(res.body.data.deleted)).toBe(true);
    });

    test("should return deleted after soft delete", async () => {
      const site = await createTrackedSite("tombstone");
      const lastSync = new Date().toISOString();

      await new Promise((resolve) => setTimeout(resolve, 10));

      await request(app)
        .delete(`/api/v1/sites/${site._id}`)
        .auth(adminToken, { type: "bearer" });

      const res = await request(app)
        .get("/api/v1/sites")
        .auth(adminToken, { type: "bearer" })
        .query({ lastSync, search: runId });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.deleted.map(String)).toContain(site._id.toString());
      expect(res.body.data.items.map((s) => s.id)).not.toContain(site._id.toString());
    });
  });

  describe("POST /api/v1/sites/upload", () => {
    test("upload sites file", async () => {
      const res = await request(app)
        .post("/api/v1/sites/upload")
        .auth(adminToken, { type: "bearer" })
        .attach("file", "tests/assets/test.txt")
        .field("categoryId", categoryId);

      expect(res.statusCode).toBe(200);

      const uploaded = await Site.find({ category: categoryId });
      uploaded.forEach((site) => track("sites", site._id));
      expect(uploaded.length).toBeGreaterThanOrEqual(10);
    });
  });
});

const request = require("supertest");
const app = require("../server");
const Keyword = require("../models/Keyword");
const connectDB = require("../config/db");
const { createKeywords } = require("./factories/keyword.factory.js");
const jwt = require("jsonwebtoken");
const { createAdminToken } = require("../utils/createAdminToken.js");
const { createCategories } = require("./factories/category.factory.js");
const Category = require("../models/Category.js");

// will be removed
// Load env vars
// No need to explicitly call dotenv again if server does it, but safer to do it:
// Actually server does it.
const adminKey = process.env.ADMIN_API_KEY;

describe("Admin Keyword Management API", () => {
  let keywords;
  let db;
  let adminToken;
  let keywordsCount = 20;
  beforeAll(async () => {
    db = await connectDB();
    await Keyword.deleteMany({});
    await Category.deleteMany({});
    keywords = await createKeywords(keywordsCount);
    adminToken = await createAdminToken();
  });

  describe("POST /api/v1/keywords", () => {
    test("should return 401 without admin token", async () => {
      const res = await request(app).post("/api/v1/keywords");
      expect(res.statusCode).toBe(401);
    });

    // test("should return 403 wit user token", async () => {
    //   const res = await request(app).post("/api/v1/keywords");
    //   expect(res.statusCode).toBe(401);
    // });

    it("should create a keyword", async () => {
      const res = await request(app)
        .post("/api/v1/keywords")
        .auth(adminToken, { type: "bearer" })
        .send({
          word: "violence",
          categoryId: keywords[0].category._id.toString(),
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.keyword.word).toBe("violence");

      keywordsCount++;
    });
  });

  // Test List
  describe("GET /api/v1/keywords should retrieve keywords", () => {
    it("should return all keywords", async () => {
      const res = await request(app)
        .get("/api/v1/keywords")
        .auth(adminToken, { type: "bearer" });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.keywords).toHaveLength(keywordsCount);
      expect(res.body.data.pagination.total).toBe(keywordsCount);
    });

    test("should return keywords created or updated after 2026-1-1", async () => {
      const res = await request(app)
        .get(`/api/v1/keywords?lastSync=${"2026-01-01"}`)
        .auth(adminToken, { type: "bearer" });
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body.data.deletedKeywordIds)).toBe(true);
      for (const keyword of res.body.data.keywords) {
        const createdAfter = new Date(keyword.createdAt) > new Date("2026-01-01");
        const updatedAfter = new Date(keyword.updatedAt) > new Date("2026-01-01");
        expect(createdAfter || updatedAfter).toBe(true);
      }
    });

    test("should return empty list for non-existent categoryId", async () => {
      const res = await request(app)
        .get("/api/v1/keywords?categoryId=507f1f77bcf86cd799439011")
        .auth(adminToken, { type: "bearer" });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.keywords).toEqual([]);
    });
  });

  // Test Delete
  describe("DELETE /api/v1/admin/keywords/:id", () => {
    test("should delete keyword", async () => {
      const res = await request(app)
        .delete(`/api/v1/keywords/${keywords[0]._id.toString()}`)
        .auth(adminToken, { type: "bearer" });

      expect(res.statusCode).toBe(200);
    });
  });

  // Test Update
  test("PATCH /api/v1/admin/keywords/:id should update keyword", async () => {
    const newCategoryId = keywords[1].category._id.toString();
    const res = await request(app)
      .patch(`/api/v1/keywords/${keywords[1]._id}`)
      .auth(adminToken, { type: "bearer" })
      .send({ word: "new", categoryId: newCategoryId });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.keyword.word).toBe("new");
    expect(res.body.data.keyword.category.id).toBe(newCategoryId);
  });

  describe("lastSync incremental sync", () => {
    let syncKeyword;
    let syncCategoryId;

    beforeAll(async () => {
      await Keyword.deleteMany({});
      await Category.deleteMany({});
      const categories = await createCategories(1);
      syncCategoryId = categories[0]._id.toString();
      syncKeyword = await Keyword.create({
        word: "syncword",
        category: categories[0]._id,
        isEnabled: true,
      });
    });

    test("should return update-only keyword after lastSync", async () => {
      const lastSync = new Date().toISOString();

      await request(app)
        .patch(`/api/v1/keywords/${syncKeyword._id}`)
        .auth(adminToken, { type: "bearer" })
        .send({ word: "syncword-updated" });

      const res = await request(app)
        .get(`/api/v1/keywords?lastSync=${lastSync}`)
        .auth(adminToken, { type: "bearer" });

      expect(res.statusCode).toBe(200);
      const words = res.body.data.keywords.map((k) => k.word);
      expect(words).toContain("syncword-updated");
    });

    test("should return deletedKeywordIds after soft delete", async () => {
      const keywordToDelete = await Keyword.create({
        word: "todelete",
        category: syncCategoryId,
        isEnabled: true,
      });
      const lastSync = new Date().toISOString();

      await new Promise((resolve) => setTimeout(resolve, 10));

      await request(app)
        .delete(`/api/v1/keywords/${keywordToDelete._id}`)
        .auth(adminToken, { type: "bearer" });

      const syncRes = await request(app)
        .get(`/api/v1/keywords?lastSync=${lastSync}`)
        .auth(adminToken, { type: "bearer" });

      expect(syncRes.statusCode).toBe(200);
      expect(syncRes.body.data.deletedKeywordIds.map(String)).toContain(
        keywordToDelete._id.toString()
      );

      const listRes = await request(app)
        .get("/api/v1/keywords")
        .auth(adminToken, { type: "bearer" });

      const ids = listRes.body.data.keywords.map((k) => k.id);
      expect(ids).not.toContain(keywordToDelete._id.toString());
    });
  });
});

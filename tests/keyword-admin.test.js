const request = require("supertest");
const app = require("../server");
const Keyword = require("../models/Keyword");
const connectDB = require("../config/db");
const { createTestAdminToken } = require("./helpers/testAuth");
const {
  createTestCategory,
  createTestKeywords,
} = require("./helpers/testFactories");
const { runId, track, testWord } = require("./helpers/testContext");

describe("Admin Keyword Management API", () => {
  let adminToken;
  let keywords;
  let keywordsCount;
  let categoryId;

  beforeAll(async () => {
    await connectDB();
    const category = await createTestCategory("keywords");
    categoryId = category._id;
    keywords = await createTestKeywords(20, categoryId);
    keywordsCount = keywords.length;
    adminToken = (await createTestAdminToken()).token;
  });

  const keywordSearchQuery = () => ({ search: runId });

  describe("POST /api/v1/keywords", () => {
    test("should return 401 without admin token", async () => {
      const res = await request(app).post("/api/v1/keywords");
      expect(res.statusCode).toBe(401);
    });

    it("should create a keyword", async () => {
      const word = testWord("created-via-api");
      const res = await request(app)
        .post("/api/v1/keywords")
        .auth(adminToken, { type: "bearer" })
        .send({ word, categoryId: categoryId.toString() });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.keyword.word).toBe(word);
      track("keywords", res.body.data.keyword.id);
      keywordsCount++;
    });

    test("should return 409 for duplicate word", async () => {
      const word = testWord("duplicate");
      const keyword = await Keyword.create({ word, category: categoryId, isEnabled: true });
      track("keywords", keyword._id);
      keywordsCount++;

      const res = await request(app)
        .post("/api/v1/keywords")
        .auth(adminToken, { type: "bearer" })
        .send({ word, categoryId: categoryId.toString() });

      expect(res.statusCode).toBe(409);
    });

    test("should restore soft-deleted keyword on recreate", async () => {
      const word = testWord("restore");
      const keyword = await Keyword.create({
        word,
        category: categoryId,
        isEnabled: true,
        deletedAt: new Date(),
      });
      track("keywords", keyword._id);

      const res = await request(app)
        .post("/api/v1/keywords")
        .auth(adminToken, { type: "bearer" })
        .send({ word, categoryId: categoryId.toString() });

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toMatch(/restored/i);
      expect(res.body.data.keyword.id).toBe(keyword._id.toString());
      keywordsCount++;
    });
  });

  describe("GET /api/v1/keywords should retrieve keywords", () => {
    it("should return all keywords for this test run", async () => {
      const res = await request(app)
        .get("/api/v1/keywords")
        .auth(adminToken, { type: "bearer" })
        .query(keywordSearchQuery());

      expect(res.statusCode).toBe(200);
      expect(res.body.data.items).toHaveLength(keywordsCount);
      expect(res.body.data.pagination.total).toBe(keywordsCount);
    });

    test("should return keywords created or updated after 2026-1-1", async () => {
      const res = await request(app)
        .get("/api/v1/keywords")
        .auth(adminToken, { type: "bearer" })
        .query({ lastSync: "2026-01-01", search: runId });

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body.data.deleted)).toBe(true);
      for (const keyword of res.body.data.items) {
        const createdAfter = new Date(keyword.createdAt) > new Date("2026-01-01");
        const updatedAfter = new Date(keyword.updatedAt) > new Date("2026-01-01");
        expect(createdAfter || updatedAfter).toBe(true);
      }
    });

    test("should return empty list for non-existent categoryId", async () => {
      const res = await request(app)
        .get("/api/v1/keywords")
        .auth(adminToken, { type: "bearer" })
        .query({ categoryId: "507f1f77bcf86cd799439011" });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.items).toEqual([]);
    });
  });

  describe("DELETE /api/v1/admin/keywords/:id", () => {
    test("should delete keyword", async () => {
      const res = await request(app)
        .delete(`/api/v1/keywords/${keywords[0]._id.toString()}`)
        .auth(adminToken, { type: "bearer" });

      expect(res.statusCode).toBe(200);
      keywordsCount--;
    });

    test("should return 200 when deleting already deleted keyword", async () => {
      const res = await request(app)
        .delete(`/api/v1/keywords/${keywords[0]._id.toString()}`)
        .auth(adminToken, { type: "bearer" });

      expect(res.statusCode).toBe(200);
    });

    test("should return 404 for non-existent keyword", async () => {
      const fakeId = "507f1f77bcf86cd799439011";
      const res = await request(app)
        .delete(`/api/v1/keywords/${fakeId}`)
        .auth(adminToken, { type: "bearer" });

      expect(res.statusCode).toBe(404);
    });
  });

  test("PATCH /api/v1/admin/keywords/:id should update keyword", async () => {
    const newWord = testWord("patched");
    const res = await request(app)
      .patch(`/api/v1/keywords/${keywords[1]._id}`)
      .auth(adminToken, { type: "bearer" })
      .send({ word: newWord, categoryId: categoryId.toString() });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.keyword.word).toBe(newWord);
    expect(res.body.data.keyword.category.id).toBe(categoryId.toString());
  });

  describe("lastSync incremental sync", () => {
    let syncKeyword;

    beforeAll(async () => {
      syncKeyword = await Keyword.create({
        word: testWord("syncword"),
        category: categoryId,
        isEnabled: true,
      });
      track("keywords", syncKeyword._id);
    });

    test("should return update-only keyword after lastSync", async () => {
      const lastSync = new Date().toISOString();
      const updatedWord = testWord("syncword-updated");

      await request(app)
        .patch(`/api/v1/keywords/${syncKeyword._id}`)
        .auth(adminToken, { type: "bearer" })
        .send({ word: updatedWord });

      const res = await request(app)
        .get("/api/v1/keywords")
        .auth(adminToken, { type: "bearer" })
        .query({ lastSync, search: runId });

      expect(res.statusCode).toBe(200);
      const words = res.body.data.items.map((k) => k.word);
      expect(words).toContain(updatedWord);
    });

    test("should return deleted after soft delete", async () => {
      const keywordToDelete = await Keyword.create({
        word: testWord("todelete"),
        category: categoryId,
        isEnabled: true,
      });
      track("keywords", keywordToDelete._id);
      const lastSync = new Date().toISOString();

      await new Promise((resolve) => setTimeout(resolve, 10));

      await request(app)
        .delete(`/api/v1/keywords/${keywordToDelete._id}`)
        .auth(adminToken, { type: "bearer" });

      const syncRes = await request(app)
        .get("/api/v1/keywords")
        .auth(adminToken, { type: "bearer" })
        .query({ lastSync, search: runId });

      expect(syncRes.statusCode).toBe(200);
      expect(syncRes.body.data.deleted.map(String)).toContain(
        keywordToDelete._id.toString(),
      );

      const listRes = await request(app)
        .get("/api/v1/keywords")
        .auth(adminToken, { type: "bearer" })
        .query(keywordSearchQuery());

      const ids = listRes.body.data.items.map((k) => k.id);
      expect(ids).not.toContain(keywordToDelete._id.toString());
    });
  });
});

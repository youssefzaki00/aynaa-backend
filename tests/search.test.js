const { applySearchFilter } = require("../utils/search");

describe("applySearchFilter", () => {
  test("adds case-insensitive regex $or for search fields", () => {
    const filter = { deletedAt: null };
    applySearchFilter(filter, "example", ["url"]);

    expect(filter.deletedAt).toBe(null);
    expect(filter.$or).toEqual([
      { url: { $regex: "example", $options: "i" } },
    ]);
  });

  test("escapes regex special characters", () => {
    const filter = {};
    applySearchFilter(filter, "test.com", ["url"]);

    expect(filter.$or[0].url.$regex).toBe("test\\.com");
  });

  test("combines with existing $or via $and", () => {
    const filter = {
      deletedAt: null,
      $or: [{ createdAt: { $gt: new Date("2020-01-01") } }],
    };
    applySearchFilter(filter, "foo", ["word"]);

    expect(filter.$or).toBeUndefined();
    expect(filter.$and).toHaveLength(2);
    expect(filter.$and[1].$or[0]).toEqual({
      word: { $regex: "foo", $options: "i" },
    });
  });

  test("ignores empty search", () => {
    const filter = { isActive: true };
    applySearchFilter(filter, "   ", ["url"]);
    expect(filter.$or).toBeUndefined();
  });
});

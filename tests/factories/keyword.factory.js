const { Types } = require("mongoose");

const { faker } = require("@faker-js/faker");
const Keyword = require("../../models/Keyword");
const { createCategories } = require("./category.factory");

exports.createKeywords = async (count) => {
  const keywords = [];
  faker.seed(123);

  const categories = await createCategories()

  for (let i = 0; i < count; i++) {
    const keyword = new Keyword({
      word: faker.word.noun(),
      category: faker.helpers.arrayElement(categories)._id, // Replace with a valid category ObjectId if needed
      isEnabled: faker.datatype.boolean(),
      createdAt: faker.date.anytime(),
      updatedAt: faker.date.anytime(),
    });
    keywords.push(keyword);
  }

  await Keyword.insertMany(keywords);
  return keywords;
};

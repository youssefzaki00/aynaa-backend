const { Types } = require('mongoose');

const {faker} = require('@faker-js/faker')
const Keyword =  require('../../models/Keyword')

exports.createKeywords = async(count) => {
    const keywords = [];
    faker.seed(123)

    for (let i = 0; i < count; i++) {
        const keyword = new Keyword({
            word: faker.word.noun(),
            category: new Types.ObjectId(), // Replace with a valid category ObjectId if needed
            isEnabled: faker.datatype.boolean(),
            createdAt: faker.date.anytime(),
            updatedAt: faker.date.anytime()
        });
        keywords.push(keyword);
    }

    await Keyword.insertMany(keywords);
    return keywords;
}
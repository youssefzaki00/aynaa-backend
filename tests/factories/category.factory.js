
const {faker} = require('@faker-js/faker')
const Category = require('../../models/Category');


exports.createCategories = async() => {
    const categories = [];
    faker.seed(123)

    const namesList = ['porn', 'violence', 'any']
    
    
    for (let i = 0; i < namesList.length; i++) {
        const category = new Category({
           name: namesList[i].toUpperCase(),
           displayName: namesList[i]
        });
        categories.push(category);
    }

    await Category.insertMany(categories);
    return categories;
}
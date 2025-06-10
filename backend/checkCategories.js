const mongoose = require('mongoose');
const Category = require('./models/Category');

async function checkCategories() {
    try {
        await mongoose.connect('mongodb://localhost:27017/jpstore');
        console.log('Connected to MongoDB');
        
        const categories = await Category.find({});
        console.log('\nAll categories in database:');
        console.log('Total count:', categories.length);
        
        categories.forEach((cat, index) => {
            console.log(`${index + 1}. ID: ${cat._id}`);
            console.log(`   Name: "${cat.name}"`);
            console.log(`   Description: "${cat.description}"`);
            console.log(`   Active: ${cat.isActive}`);
            console.log('---');
        });
        
        if (categories.length === 0) {
            console.log('No categories found in database');
        }
        
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\nDatabase connection closed');
        process.exit(0);
    }
}

checkCategories(); 
const mongoose = require('mongoose');
const Category = require('./models/Category');

async function checkAndFixIndexes() {
    try {
        await mongoose.connect('mongodb://localhost:27017/jpstore');
        console.log('Connected to MongoDB');
        
        // Get collection
        const collection = mongoose.connection.db.collection('categories');
        
        // Check current indexes
        const indexes = await collection.indexes();
        console.log('\nCurrent indexes:');
        indexes.forEach(index => {
            console.log('Index:', JSON.stringify(index, null, 2));
        });
        
        // Check if slug index exists
        const slugIndex = indexes.find(index => index.key && index.key.slug);
        if (slugIndex) {
            console.log('\nFound problematic slug index. Dropping it...');
            await collection.dropIndex('slug_1');
            console.log('Slug index dropped successfully!');
        } else {
            console.log('\nNo slug index found.');
        }
        
        // List indexes after dropping
        const newIndexes = await collection.indexes();
        console.log('\nIndexes after cleanup:');
        newIndexes.forEach(index => {
            console.log('Index:', JSON.stringify(index.key, null, 2));
        });
        
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\nDatabase connection closed');
        process.exit(0);
    }
}

checkAndFixIndexes(); 
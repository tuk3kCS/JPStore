const mongoose = require('mongoose');
const Category = require('./models/Category');

async function deleteCategory() {
    try {
        await mongoose.connect('mongodb://localhost:27017/jpstore');
        console.log('Connected to MongoDB');
        
        const result = await Category.deleteOne({ name: 'b' });
        console.log('Delete result:', result);
        
        if (result.deletedCount > 0) {
            console.log('Category "b" deleted successfully');
        } else {
            console.log('No category "b" found to delete');
        }
        
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.connection.close();
        console.log('Database connection closed');
        process.exit(0);
    }
}

deleteCategory(); 
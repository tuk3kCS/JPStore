const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import models
const Product = require('../models/Product');
const Brand = require('../models/Brand');

// Connect to MongoDB
async function connectDB() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/jpstore');
        console.log('Connected to MongoDB');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
}

// Migration function
async function migrateBrands() {
    try {
        console.log('Starting brand migration...');

        // Step 1: Get all products (temporarily disable the Product schema validation)
        const rawProducts = await mongoose.connection.db.collection('products').find({}).toArray();
        console.log(`Found ${rawProducts.length} products to migrate`);

        if (rawProducts.length === 0) {
            console.log('No products found to migrate');
            return;
        }

        // Step 2: Extract unique brand names
        const uniqueBrandNames = [...new Set(rawProducts
            .map(product => product.brand)
            .filter(brand => brand && typeof brand === 'string')
        )];

        console.log(`Found ${uniqueBrandNames.length} unique brand names:`, uniqueBrandNames);

        // Step 3: Create Brand documents for each unique brand name
        const brandMap = new Map();
        
        for (const brandName of uniqueBrandNames) {
            try {
                // Check if brand already exists
                let existingBrand = await Brand.findOne({ name: brandName });
                
                if (!existingBrand) {
                    // Create new brand
                    const newBrand = new Brand({
                        name: brandName,
                        description: `${brandName} brand - Auto-generated during migration`,
                        isActive: true
                    });
                    
                    existingBrand = await newBrand.save();
                    console.log(`Created brand: ${brandName} with ID: ${existingBrand._id}`);
                } else {
                    console.log(`Brand already exists: ${brandName} with ID: ${existingBrand._id}`);
                }
                
                brandMap.set(brandName, existingBrand._id);
            } catch (error) {
                console.error(`Error creating brand ${brandName}:`, error);
            }
        }

        // Step 4: Update all products to use Brand ObjectId references
        let updatedCount = 0;
        let errorCount = 0;

        for (const product of rawProducts) {
            try {
                if (product.brand && typeof product.brand === 'string') {
                    const brandId = brandMap.get(product.brand);
                    
                    if (brandId) {
                        await mongoose.connection.db.collection('products').updateOne(
                            { _id: product._id },
                            { $set: { brand: brandId } }
                        );
                        updatedCount++;
                        console.log(`Updated product ${product.name} - brand: ${product.brand} -> ${brandId}`);
                    } else {
                        console.warn(`No brand ID found for product ${product.name} with brand: ${product.brand}`);
                        errorCount++;
                    }
                } else if (product.brand && typeof product.brand === 'object') {
                    console.log(`Product ${product.name} already has ObjectId brand reference`);
                } else {
                    console.warn(`Product ${product.name} has no brand or invalid brand data`);
                    errorCount++;
                }
            } catch (error) {
                console.error(`Error updating product ${product.name}:`, error);
                errorCount++;
            }
        }

        console.log('\n--- Migration Summary ---');
        console.log(`Products processed: ${rawProducts.length}`);
        console.log(`Brands created/found: ${uniqueBrandNames.length}`);
        console.log(`Products updated: ${updatedCount}`);
        console.log(`Errors: ${errorCount}`);
        console.log('Brand migration completed successfully!');

    } catch (error) {
        console.error('Migration failed:', error);
    }
}

// Verification function
async function verifyMigration() {
    try {
        console.log('\n--- Verifying Migration ---');
        
        // Check brands
        const brands = await Brand.find({});
        console.log(`Total brands in database: ${brands.length}`);
        
        // Check products
        const products = await Product.find({}).populate('brand', 'name');
        console.log(`Total products in database: ${products.length}`);
        
        let validBrandReferences = 0;
        let invalidBrandReferences = 0;
        
        for (const product of products) {
            if (product.brand && product.brand.name) {
                validBrandReferences++;
            } else {
                invalidBrandReferences++;
                console.warn(`Product ${product.name} has invalid brand reference:`, product.brand);
            }
        }
        
        console.log(`Products with valid brand references: ${validBrandReferences}`);
        console.log(`Products with invalid brand references: ${invalidBrandReferences}`);
        
        if (invalidBrandReferences === 0) {
            console.log('✅ Migration verification successful!');
        } else {
            console.log('⚠️ Migration verification found issues');
        }
        
    } catch (error) {
        console.error('Verification failed:', error);
    }
}

// Main execution
async function main() {
    await connectDB();
    
    console.log('Starting brand migration process...\n');
    
    await migrateBrands();
    await verifyMigration();
    
    console.log('\nMigration process completed. Closing database connection...');
    await mongoose.connection.close();
    console.log('Database connection closed.');
    process.exit(0);
}

// Handle errors
process.on('unhandledRejection', (error) => {
    console.error('Unhandled rejection:', error);
    process.exit(1);
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught exception:', error);
    process.exit(1);
});

// Run migration
if (require.main === module) {
    main();
}

module.exports = { migrateBrands, verifyMigration }; 
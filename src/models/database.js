const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

class Database {
    constructor() {
        // Ensure database directory exists (important for fresh/manual deployments)
        const dbDir = path.join(__dirname, '../../database');
        if (!fs.existsSync(dbDir)) {
            try {
                fs.mkdirSync(dbDir, { recursive: true });
                console.log('Created database directory:', dbDir);
            } catch (e) {
                console.error('Failed to create database directory:', e.message);
            }
        }
        const dbPath = path.join(dbDir, 'products.db');
        this.db = new sqlite3.Database(dbPath, (err) => {
            if (err) {
                console.error('Error opening database:', err.message);
            } else {
                console.log('Connected to SQLite database');
                this.initTables();
            }
        });
    }

    initTables() {
        // Create products table
        this.db.run(`
            CREATE TABLE IF NOT EXISTS products (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                category TEXT NOT NULL,
                price DECIMAL(10,2) NOT NULL,
                description TEXT,
                brand TEXT,
                rating DECIMAL(3,2),
                image_url TEXT,
                specifications TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `, (err) => {
            if (err) {
                console.error('Error creating products table:', err);
                return;
            }
            console.log('Products table created successfully');
            
            // Create recommendations history table
            this.db.run(`
                CREATE TABLE IF NOT EXISTS recommendations (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_query TEXT,
                    recommended_products TEXT,
                    ai_response TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `, (err) => {
                if (err) {
                    console.error('Error creating recommendations table:', err);
                    return;
                }
                console.log('Recommendations table created successfully');
                
                // Seed sample data after tables are created
                this.seedData();
            });
        });
    }

    seedData() {
        const sampleProducts = [
            {
                name: "iPhone 15 Pro",
                category: "Electronics",
                price: 999.99,
                description: "Latest iPhone smartphone with A17 Pro chip and titanium design",
                brand: "Apple",
                rating: 4.8,
                image_url: null,
                specifications: JSON.stringify({
                    storage: "128GB",
                    camera: "48MP",
                    display: "6.1 inch",
                    color: "Natural Titanium"
                })
            },
            {
                name: "Samsung Galaxy S24 Ultra",
                category: "Electronics",
                price: 1199.99,
                description: "Premium Android smartphone with S Pen and AI features",
                brand: "Samsung",
                rating: 4.7,
                image_url: null,
                specifications: JSON.stringify({
                    storage: "256GB",
                    camera: "200MP",
                    display: "6.8 inch",
                    color: "Titanium Black"
                })
            },
            {
                name: "MacBook Air M3",
                category: "Electronics",
                price: 1299.99,
                description: "Lightweight laptop with M3 chip and all-day battery",
                brand: "Apple",
                rating: 4.9,
                image_url: null,
                specifications: JSON.stringify({
                    processor: "M3",
                    ram: "8GB",
                    storage: "256GB SSD",
                    display: "13.6 inch"
                })
            },
            {
                name: "Nike Air Max 270",
                category: "Fashion",
                price: 150.00,
                description: "Comfortable lifestyle sneakers with Air Max cushioning",
                brand: "Nike",
                rating: 4.4,
                image_url: null,
                specifications: JSON.stringify({
                    size: "US 9",
                    color: "Black/White",
                    material: "Mesh and synthetic",
                    type: "Running"
                })
            },
            {
                name: "Levi's 501 Original Jeans",
                category: "Fashion",
                price: 89.99,
                description: "Classic straight-leg jeans with authentic fit",
                brand: "Levi's",
                rating: 4.3,
                image_url: null,
                specifications: JSON.stringify({
                    size: "32x32",
                    color: "Medium Blue",
                    fit: "Straight",
                    material: "100% Cotton"
                })
            },
            {
                name: "KitchenAid Stand Mixer",
                category: "Home & Garden",
                price: 379.99,
                description: "Professional-grade stand mixer for baking enthusiasts",
                brand: "KitchenAid",
                rating: 4.8,
                image_url: null,
                specifications: JSON.stringify({
                    capacity: "5 quart",
                    power: "325 watts",
                    color: "Empire Red",
                    attachments: "Dough hook, beater, whip"
                })
            },
            {
                name: "Dyson V15 Detect",
                category: "Home & Garden",
                price: 649.99,
                description: "Cordless vacuum with laser dust detection",
                brand: "Dyson",
                rating: 4.7,
                image_url: null,
                specifications: JSON.stringify({
                    type: "Cordless",
                    battery: "60 minutes",
                    weight: "6.8 lbs",
                    features: "Laser detection, LCD screen"
                })
            },
            {
                name: "Fitbit Charge 6",
                category: "Sports",
                price: 199.99,
                description: "Advanced fitness tracker with GPS and heart rate monitoring",
                brand: "Fitbit",
                rating: 4.5,
                image_url: null,
                specifications: JSON.stringify({
                    battery: "7 days",
                    gps: "Built-in",
                    water_resistance: "50 meters",
                    features: "Heart rate, sleep tracking"
                })
            },
            {
                name: "moto edge",
                category: "Electronics",
                price: 199.99,
                description: "Affordable smartphone with great performance and long battery life",
                brand: "Motorola",
                rating: 4.2,
                image_url: null,
                specifications: JSON.stringify({
                    storage: "128GB",
                    camera: "50MP",
                    display: "6.6 inch",
                    battery: "5000mAh",
                    os: "Android 15"
                })
            },
            {
                name: "Google Pixel 7a",
                category: "Electronics",
                price: 399.99,
                description: "Budget-friendly Pixel smartphone with excellent camera and clean Android experience",
                brand: "Google",
                rating: 4.4,
                image_url: null,
                specifications: JSON.stringify({
                    storage: "128GB",
                    camera: "64MP",
                    display: "6.1 inch",
                    battery: "4385mAh",
                    os: "Android 14"
                })
            },
            {
                name: "OnePlus Nord CE 3",
                category: "Electronics",
                price: 349.99,
                description: "Mid-range smartphone with fast charging and smooth performance",
                brand: "OnePlus",
                rating: 4.3,
                image_url: null,
                specifications: JSON.stringify({
                    storage: "256GB",
                    camera: "50MP",
                    display: "6.7 inch",
                    battery: "5000mAh",
                    charging: "80W fast charging"
                })
            },
            {
                name: "The Lean Startup",
                category: "Books",
                price: 16.99,
                description: "How Today's Entrepreneurs Use Continuous Innovation",
                brand: "Crown Business",
                rating: 4.2,
                image_url: null,
                specifications: JSON.stringify({
                    author: "Eric Ries",
                    pages: "336",
                    format: "Paperback",
                    language: "English"
                })
            }
        ];

        // Check if data already exists
        this.db.get("SELECT COUNT(*) as count FROM products", (err, row) => {
            if (err) {
                console.error('Error checking existing data:', err);
                return;
            }
            
            if (row.count === 0) {
                console.log('Seeding database with sample products...');
                const stmt = this.db.prepare(`
                    INSERT INTO products (name, category, price, description, brand, rating, image_url, specifications)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                `);

                sampleProducts.forEach(product => {
                    stmt.run([
                        product.name,
                        product.category,
                        product.price,
                        product.description,
                        product.brand,
                        product.rating,
                        product.image_url,
                        product.specifications
                    ]);
                });

                stmt.finalize();
                console.log('Database seeded successfully!');
            }
        });
    }

    getAllProducts(callback) {
        this.db.all("SELECT * FROM products ORDER BY created_at DESC", callback);
    }

    getProductById(id, callback) {
        this.db.get("SELECT * FROM products WHERE id = ?", [id], callback);
    }

    getProductsByCategory(category, callback) {
        this.db.all("SELECT * FROM products WHERE category = ?", [category], callback);
    }

    getCategories(callback) {
        this.db.all("SELECT DISTINCT category FROM products", callback);
    }

    saveRecommendation(userQuery, recommendedProducts, aiResponse, callback) {
        this.db.run(
            "INSERT INTO recommendations (user_query, recommended_products, ai_response) VALUES (?, ?, ?)",
            [userQuery, JSON.stringify(recommendedProducts), aiResponse],
            callback
        );
    }

    close() {
        this.db.close((err) => {
            if (err) {
                console.error('Error closing database:', err.message);
            } else {
                console.log('Database connection closed.');
            }
        });
    }
}

module.exports = new Database();

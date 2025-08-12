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
                        image_url: "https://www.apple.com/v/iphone/home/cd/images/overview/consider/apple_intelligence__gbh77cvflkia_xlarge_2x.jpg",
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
                        image_url: "https://images.samsung.com/in/smartphones/galaxy-s24-ultra/images/galaxy-s24-ultra-highlights-color-carousel-exclusive-tb.jpg?imbypass=true",
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
                        image_url: "https://www.apple.com/v/macbook-air/u/images/overview/design/color/design_top_skyblue__eepkvlvjzcia_medium_2x.jpg",
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
                        image_url: "https://static.nike.com/a/images/c_limit,w_592,f_auto/t_product_v1/ohwu3kmhyqivaku9sxld/NIKE+AIR+MAX+270+%28PS%29.png",
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
                        image_url: "https://encrypted-tbn1.gstatic.com/shopping?q=tbn:ANd9GcQTcz7o9jHlVOvfZUb2CkqmIy5qmLwWjSOvzwMzlKqm-7mLiI4UuoLr_F8Q0RqmD3NG6CwY4hipvN79OlkyLEjgczB_wr98",
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
                        image_url: "https://www.kitchenaid.in/is/image/content/dam/global/kitchenaid/parts-and-accessories/small-appliances-accessories/images/hero-KSMC7QFB.tif?fmt=webp",
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
                        image_url: "https://dyson-h.assetsadobe2.com/is/image/content/dam/dyson/leap-petite-global/apac-dd/product-comparison/V15-Detect4.png?scl=1",
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
                        image_url: "https://lh3.googleusercontent.com/Cg_geEZ1_O2KrCE4nK166YrCxPZ_OWtsOrpL5vKhtRhANdlvSoueeJLcSrpo00chXeHWvIcTNiBJcihnRoBdggqzsbLbqX9cjw=s4092-w4092-e365-rw-v0-nu",
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
                        image_url: "https://encrypted-tbn2.gstatic.com/shopping?q=tbn:ANd9GcRPTUmAW5yWdh5XaJw_gFwuRFWivU4A_1WsRg444w1obvDHLk2iC4G1sytjQo_vYexPfhln8EisTsoiMgho-VQ09hajOpU0YA",
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
                        image_url: "https://encrypted-tbn1.gstatic.com/shopping?q=tbn:ANd9GcRFITF7FTdH0YUAul6DyqXmLBbqUDTcAxswmDnSp7AvCbkH1tkbSD8UnGbZqiLATRmzMR7bLwx5IN_RdlPfAFukOKtDuPv9XJSDZDhkJe7b",
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
                        image_url: "https://www.oneplus.in/content/dam/oasis/page/nord-ce-3-5g/images-color-pad-phone-gray-1.png.avif",
                        specifications: JSON.stringify({
                            storage: "256GB",
                            camera: "50MP",
                            display: "6.7 inch",
                            battery: "5000mAh",
                            charging: "80W fast charging"
                        })
                    },
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

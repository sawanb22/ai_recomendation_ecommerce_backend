const database = require('../models/database');

class ProductController {
    // Get all products
    getAllProducts(req, res) {
        database.getAllProducts((err, products) => {
            if (err) {
                console.error('Error fetching products:', err);
                return res.status(500).json({ error: 'Failed to fetch products' });
            }
            
            // Parse specifications JSON for each product
            const parsedProducts = products.map(product => ({
                ...product,
                specifications: JSON.parse(product.specifications || '{}')
            }));
            
            res.json(parsedProducts);
        });
    }

    // Get product by ID
    getProductById(req, res) {
        const { id } = req.params;
        
        database.getProductById(id, (err, product) => {
            if (err) {
                console.error('Error fetching product:', err);
                return res.status(500).json({ error: 'Failed to fetch product' });
            }
            
            if (!product) {
                return res.status(404).json({ error: 'Product not found' });
            }
            
            // Parse specifications JSON
            const parsedProduct = {
                ...product,
                specifications: JSON.parse(product.specifications || '{}')
            };
            
            res.json(parsedProduct);
        });
    }

    // Get products by category
    getProductsByCategory(req, res) {
        const { category } = req.params;
        
        database.getProductsByCategory(category, (err, products) => {
            if (err) {
                console.error('Error fetching products by category:', err);
                return res.status(500).json({ error: 'Failed to fetch products' });
            }
            
            // Parse specifications JSON for each product
            const parsedProducts = products.map(product => ({
                ...product,
                specifications: JSON.parse(product.specifications || '{}')
            }));
            
            res.json(parsedProducts);
        });
    }

    // Get all categories
    getCategories(req, res) {
        database.getCategories((err, categories) => {
            if (err) {
                console.error('Error fetching categories:', err);
                return res.status(500).json({ error: 'Failed to fetch categories' });
            }
            
            const categoryList = categories.map(cat => cat.category);
            res.json(categoryList);
        });
    }

    // Search products by query
    searchProducts(req, res) {
        const { q } = req.query;
        
        if (!q) {
            return res.status(400).json({ error: 'Search query is required' });
        }
        
        database.getAllProducts((err, products) => {
            if (err) {
                console.error('Error searching products:', err);
                return res.status(500).json({ error: 'Failed to search products' });
            }
            
            // Simple text search
            const searchTerm = q.toLowerCase();
            const filtered = products.filter(product => {
                const searchText = `${product.name} ${product.description} ${product.category} ${product.brand}`.toLowerCase();
                return searchText.includes(searchTerm);
            });
            
            // Parse specifications JSON for each product
            const parsedProducts = filtered.map(product => ({
                ...product,
                specifications: JSON.parse(product.specifications || '{}')
            }));
            
            res.json(parsedProducts);
        });
    }
}

module.exports = new ProductController();

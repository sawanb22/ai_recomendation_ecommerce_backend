const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

// Get all products
router.get('/', productController.getAllProducts.bind(productController));

// Search products
router.get('/search', productController.searchProducts.bind(productController));

// Get all categories
router.get('/categories', productController.getCategories.bind(productController));

// Get products by category
router.get('/category/:category', productController.getProductsByCategory.bind(productController));

// Get product by ID
router.get('/:id', productController.getProductById.bind(productController));

module.exports = router;

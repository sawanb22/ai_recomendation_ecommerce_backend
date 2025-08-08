const database = require('../models/database');
const geminiService = require('../services/geminiService');

class RecommendationController {
    // Get AI-powered product recommendations
    async getRecommendations(req, res) {
        try {
            const { query, category, priceRange } = req.body;
            
            if (!query) {
                return res.status(400).json({ error: 'Query is required' });
            }

            // Get products from database
            database.getAllProducts(async (err, products) => {
                if (err) {
                    console.error('Error fetching products for recommendations:', err);
                    return res.status(500).json({ error: 'Failed to fetch products' });
                }

                let filteredProducts = products; // Declare outside try block

                try {
                    console.log(`📦 Total products: ${products.length}`);
                    
                    // Filter products by category if specified
                    if (category && category !== 'all') {
                        filteredProducts = products.filter(p => p.category.toLowerCase() === category.toLowerCase());
                        console.log(`🏷️ After category filter (${category}): ${filteredProducts.length}`);
                    }

                    // Enhanced price filtering with proper validation
                    if (priceRange) {
                        const { min, max } = priceRange;
                        console.log(`💰 Applying price filter: min=${min}, max=${max}`);
                        
                        if (min !== undefined && min !== null && !isNaN(min)) {
                            const minPrice = parseFloat(min);
                            filteredProducts = filteredProducts.filter(p => {
                                const productPrice = parseFloat(p.price);
                                return productPrice >= minPrice;
                            });
                            console.log(`💰 After min price filter (>= $${minPrice}): ${filteredProducts.length}`);
                        }
                        
                        if (max !== undefined && max !== null && !isNaN(max)) {
                            const maxPrice = parseFloat(max);
                            filteredProducts = filteredProducts.filter(p => {
                                const productPrice = parseFloat(p.price);
                                return productPrice <= maxPrice;
                            });
                            console.log(`💰 After max price filter (<= $${maxPrice}): ${filteredProducts.length}`);
                        }
                    }

                    // Extract category/product type from query
                    const categoryFromQuery = this.extractCategoryFromQuery(query);
                    if (categoryFromQuery && !category) {
                        console.log(`🏷️ Extracted category from query: ${categoryFromQuery}`);
                        filteredProducts = filteredProducts.filter(p => {
                            const productCategory = p.category.toLowerCase();
                            const productName = p.name.toLowerCase();
                            const productDescription = p.description.toLowerCase();
                            
                            // Get the keywords for this category
                            const categoryKeywords = this.getCategoryKeywords(categoryFromQuery);
                            
                            // Check if any keyword matches the product
                            const matches = categoryKeywords.some(keyword => 
                                productCategory.includes(keyword) || 
                                productName.includes(keyword) ||
                                productDescription.includes(keyword)
                            );
                            
                            console.log(`🔍 Product: ${p.name} | Category: ${categoryFromQuery} | Matches: ${matches}`);
                            return matches;
                        });
                        console.log(`🏷️ After category filter (${categoryFromQuery}): ${filteredProducts.length}`);
                    }

                    // Extract price from query (e.g., "phone under $500")
                    const priceFromQuery = this.extractPriceFromQuery(query);
                    if (priceFromQuery && !priceRange) {
                        console.log(`💰 Extracted price from query: ${priceFromQuery}`);
                        filteredProducts = filteredProducts.filter(p => {
                            const productPrice = parseFloat(p.price);
                            return productPrice <= priceFromQuery;
                        });
                        console.log(`💰 After query price filter (<= $${priceFromQuery}): ${filteredProducts.length}`);
                    }

                    console.log(`✅ Final filtered products: ${filteredProducts.length}`);
                    if (filteredProducts.length > 0) {
                        console.log('💰 Price range of filtered products:', {
                            min: Math.min(...filteredProducts.map(p => parseFloat(p.price))),
                            max: Math.max(...filteredProducts.map(p => parseFloat(p.price)))
                        });
                    }

                    if (filteredProducts.length === 0) {
                        return res.json({
                            recommendations: [],
                            summary: 'No products found matching your criteria.',
                            alternativeSuggestions: 'Try adjusting your filters or search terms.'
                        });
                    }

                    // Get AI recommendations
                    const aiResponse = await geminiService.getProductRecommendations(query, filteredProducts);
                    
                    // Save recommendation to database for analytics
                    const recommendedProductIds = aiResponse.recommendations.map(r => r.productId);
                    database.saveRecommendation(
                        query,
                        recommendedProductIds,
                        JSON.stringify(aiResponse),
                        (saveErr) => {
                            if (saveErr) {
                                console.error('Error saving recommendation:', saveErr);
                            }
                        }
                    );

                    res.json(aiResponse);

                } catch (aiError) {
                    console.error('Error getting AI recommendations:', aiError);
                    
                    // Fallback to simple keyword matching (filteredProducts is now in scope)
                    const fallbackResults = this.getFallbackRecommendations(query, filteredProducts);
                    res.json(fallbackResults);
                }
            });

        } catch (error) {
            console.error('Error in getRecommendations:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // Fallback recommendation method
    getFallbackRecommendations(query, products) {
        const keywords = query.toLowerCase().split(/\s+/);
        const scored = products.map(product => {
            let score = 0;
            const searchText = `${product.name} ${product.description} ${product.category} ${product.brand}`.toLowerCase();
            
            keywords.forEach(keyword => {
                if (searchText.includes(keyword)) {
                    score += 1;
                }
            });
            
            // Boost score for exact matches
            if (searchText.includes(query.toLowerCase())) {
                score += 2;
            }
            
            return { product, score };
        });

        const recommendations = scored
            .filter(item => item.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, 5)
            .map((item, index) => ({
                productId: item.product.id,
                relevanceScore: Math.max(0.5, item.score / keywords.length),
                reasoning: `This product matches your search for "${query}". ${item.product.name} is a ${item.product.category.toLowerCase()} product that fits your criteria.`,
                product: {
                    ...item.product,
                    specifications: JSON.parse(item.product.specifications || '{}')
                }
            }));

        return {
            recommendations,
            summary: `Found ${recommendations.length} products matching "${query}". These results are based on keyword matching.`,
            alternativeSuggestions: recommendations.length === 0 
                ? 'Try using different keywords or browse our categories.'
                : 'For more personalized recommendations, try describing what you\'re looking for in more detail.'
        };
    }

    // Get recommendation history (for analytics)
    getRecommendationHistory(req, res) {
        database.db.all(
            "SELECT user_query, COUNT(*) as frequency FROM recommendations GROUP BY user_query ORDER BY frequency DESC LIMIT 10",
            (err, results) => {
                if (err) {
                    console.error('Error fetching recommendation history:', err);
                    return res.status(500).json({ error: 'Failed to fetch history' });
                }
                res.json(results);
            }
        );
    }

    // Extract price from natural language query
    extractPriceFromQuery(query) {
        const lowerQuery = query.toLowerCase();
        
        // Patterns to match price expressions
        const patterns = [
            /under\s*\$?(\d+)/i,           // "under $500", "under 500"
            /below\s*\$?(\d+)/i,          // "below $500", "below 500"
            /less\s+than\s*\$?(\d+)/i,    // "less than $500"
            /within\s*\$?(\d+)/i,         // "within $500"
            /budget\s+of\s*\$?(\d+)/i,    // "budget of $500"
            /max\s*\$?(\d+)/i,            // "max $500"
            /maximum\s*\$?(\d+)/i,        // "maximum $500"
            /\$(\d+)\s+or\s+less/i,       // "$500 or less"
            /up\s+to\s*\$?(\d+)/i,        // "up to $500"
        ];

        for (const pattern of patterns) {
            const match = lowerQuery.match(pattern);
            if (match && match[1]) {
                const price = parseFloat(match[1]);
                if (!isNaN(price) && price > 0) {
                    console.log(`💡 Extracted price constraint: $${price} from "${query}"`);
                    return price;
                }
            }
        }

        return null;
    }

    // Extract category/product type from natural language query
    extractCategoryFromQuery(query) {
        const lowerQuery = query.toLowerCase();
        
        // Define category mappings
        const categoryMappings = {
            'phone': ['phone', 'smartphone', 'mobile', 'iphone', 'android', 'galaxy', 'pixel', 'oneplus', 'motorola', 'moto'],
            'laptop': ['laptop', 'computer', 'macbook', 'notebook', 'gaming laptop'],
            'headphones': ['headphones', 'earbuds', 'earphones', 'headset', 'audio'],
            'shoes': ['shoes', 'sneakers', 'boots', 'footwear', 'running shoes'],
            'jeans': ['jeans', 'pants', 'denim', 'trousers'],
            'mixer': ['mixer', 'stand mixer', 'kitchen mixer', 'blender'],
            'vacuum': ['vacuum', 'cleaner', 'hoover'],
            'fitness': ['fitness', 'tracker', 'fitbit', 'watch', 'wearable'],
            'book': ['book', 'ebook', 'novel', 'read', 'literature']
        };

        // Check each category mapping
        for (const [category, keywords] of Object.entries(categoryMappings)) {
            for (const keyword of keywords) {
                if (lowerQuery.includes(keyword)) {
                    console.log(`💡 Extracted category: ${category} from keyword: ${keyword}`);
                    return category;
                }
            }
        }

        return null;
    }

    // Get keywords for a specific category
    getCategoryKeywords(category) {
        const categoryMappings = {
            'phone': ['phone', 'smartphone', 'mobile', 'iphone', 'android', 'galaxy', 'pixel', 'oneplus', 'motorola', 'moto'],
            'laptop': ['laptop', 'computer', 'macbook', 'notebook', 'gaming'],
            'headphones': ['headphones', 'earbuds', 'earphones', 'headset', 'audio'],
            'shoes': ['shoes', 'sneakers', 'boots', 'footwear', 'running'],
            'jeans': ['jeans', 'pants', 'denim', 'trousers'],
            'mixer': ['mixer', 'stand mixer', 'kitchen mixer', 'blender'],
            'vacuum': ['vacuum', 'cleaner', 'hoover'],
            'fitness': ['fitness', 'tracker', 'fitbit', 'watch', 'wearable'],
            'book': ['book', 'ebook', 'novel', 'read', 'literature']
        };

        return categoryMappings[category] || [category];
    }
}

module.exports = new RecommendationController();

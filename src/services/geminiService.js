const { GoogleGenerativeAI } = require('@google/generative-ai');

class GeminiService {
    constructor() {
        this.hasApiKey = !!process.env.GEMINI_API_KEY;
        
        if (!this.hasApiKey) {
            console.warn('⚠️ GEMINI_API_KEY not found - will use fallback recommendations');
            this.model = null;
        } else {
            try {
                this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
                this.model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
                console.log('✅ Gemini AI service initialized successfully');
            } catch (error) {
                console.error('❌ Error initializing Gemini AI:', error);
                this.model = null;
                this.hasApiKey = false;
            }
        }
    }

    async getProductRecommendations(userQuery, products) {
        // If no API key or model, use fallback immediately
        if (!this.hasApiKey || !this.model) {
            console.log('🔄 Using fallback recommendations (no Gemini API)');
            return this.getFallbackRecommendations(userQuery, products);
        }

        try {
            console.log('🤖 Getting recommendations from Gemini AI...');
            const prompt = this.buildRecommendationPrompt(userQuery, products);
            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();
            
            console.log('✅ Received response from Gemini AI');
            return this.parseRecommendationResponse(text, products);
        } catch (error) {
            console.error('❌ Error getting recommendations from Gemini:', error);
            console.log('🔄 Falling back to keyword-based recommendations');
            return this.getFallbackRecommendations(userQuery, products);
        }
    }

    buildRecommendationPrompt(userQuery, products) {
        const productList = products.map(p => ({
            id: p.id,
            name: p.name,
            category: p.category,
            price: p.price,
            description: p.description,
            brand: p.brand,
            rating: p.rating,
            specifications: JSON.parse(p.specifications || '{}')
        }));

        return `You are an expert product recommendation assistant for an e-commerce platform.

User Query: "${userQuery}"

Available Products:
${JSON.stringify(productList, null, 2)}

Based on the user's query, please recommend the most suitable products from the list above. 

Requirements:
1. Analyze the user's preferences (price range, category, features, brand, etc.)
2. Match products that best fit their criteria
3. Rank products by relevance to the query
4. Provide reasoning for each recommendation

Please respond in the following JSON format:
{
  "recommendations": [
    {
      "productId": 1,
      "relevanceScore": 0.95,
      "reasoning": "This product matches your criteria because..."
    }
  ],
  "summary": "Based on your query for '${userQuery}', I found these products that match your needs...",
  "alternativeSuggestions": "You might also consider..."
}

Return ONLY the JSON response, no additional text.`;
    }

    parseRecommendationResponse(text, products) {
        try {
            // Clean the response to extract JSON
            let cleanText = text.trim();
            
            // Remove markdown code blocks if present
            if (cleanText.startsWith('```json')) {
                cleanText = cleanText.replace(/```json\n?/, '').replace(/\n?```$/, '');
            } else if (cleanText.startsWith('```')) {
                cleanText = cleanText.replace(/```\n?/, '').replace(/\n?```$/, '');
            }
            
            const parsed = JSON.parse(cleanText);
            
            // Validate and enhance the response
            if (!parsed.recommendations || !Array.isArray(parsed.recommendations)) {
                throw new Error('Invalid recommendation format');
            }

            // Attach full product details to recommendations
            const enhancedRecommendations = parsed.recommendations.map(rec => {
                const product = products.find(p => p.id === rec.productId);
                return {
                    ...rec,
                    product: product || null
                };
            }).filter(rec => rec.product !== null);

            return {
                recommendations: enhancedRecommendations,
                summary: parsed.summary || 'Here are my recommendations based on your query.',
                alternativeSuggestions: parsed.alternativeSuggestions || ''
            };
        } catch (error) {
            console.error('Error parsing Gemini response:', error);
            console.log('Raw response:', text);
            
            // Fallback: return a simple recommendation based on text analysis
            return this.getFallbackRecommendations(text, products);
        }
    }

    getFallbackRecommendations(userQuery, products) {
        console.log('🔄 Using fallback recommendation logic...');
        
        // Simple fallback based on keyword matching
        const keywords = userQuery.toLowerCase().split(/\s+/);
        const scored = products.map(product => {
            let score = 0;
            const searchText = `${product.name} ${product.description} ${product.category} ${product.brand}`.toLowerCase();
            
            keywords.forEach(keyword => {
                if (searchText.includes(keyword)) {
                    score += 1;
                }
            });
            
            // Boost score for exact matches
            if (searchText.includes(userQuery.toLowerCase())) {
                score += 2;
            }
            
            return { product, score };
        });

        const recommendations = scored
            .filter(item => item.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, 5)
            .map(item => ({
                productId: item.product.id,
                relevanceScore: Math.max(0.3, Math.min(1.0, item.score / keywords.length)),
                reasoning: `This ${item.product.category.toLowerCase()} matches your search for "${userQuery}". ${item.product.name} by ${item.product.brand} fits your criteria with a price of $${item.product.price}.`,
                product: {
                    ...item.product,
                    specifications: typeof item.product.specifications === 'string' 
                        ? JSON.parse(item.product.specifications || '{}') 
                        : item.product.specifications
                }
            }));

        return {
            recommendations,
            summary: `Found ${recommendations.length} products matching "${userQuery}" using keyword analysis. ${recommendations.length === 0 ? 'Try different search terms.' : 'Results are ranked by relevance.'}`,
            alternativeSuggestions: recommendations.length === 0 
                ? 'Try using broader search terms or browse our product categories.'
                : 'For more personalized recommendations, consider enabling AI features.'
        };
    }
}

module.exports = new GeminiService();

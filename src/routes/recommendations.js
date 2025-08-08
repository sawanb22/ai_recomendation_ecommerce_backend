const express = require('express');
const router = express.Router();
const recommendationController = require('../controllers/recommendationController');

// Get AI recommendations
router.post('/', recommendationController.getRecommendations.bind(recommendationController));

// Get recommendation history (for analytics)
router.get('/history', recommendationController.getRecommendationHistory.bind(recommendationController));

module.exports = router;

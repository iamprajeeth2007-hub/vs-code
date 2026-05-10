const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const jwt = require('jsonwebtoken');

// Auth middleware
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET || 'campus-eats-super-secret-2025');
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// GET RATINGS
router.get('/:itemId/ratings', async (req, res) => {
  try {
    const { itemId } = req.params;
    
    const result = await pool.query(`
      SELECT 
        COUNT(*) as total_ratings,
        COALESCE(ROUND(AVG(rating)::numeric, 1), 0) as average_rating
      FROM dish_ratings
      WHERE item_id = $1
    `, [itemId]);
    
    const data = result.rows[0];
    
    res.json({
      item_id: itemId,
      average_rating: parseFloat(data.average_rating) || 0,
      total_ratings: parseInt(data.total_ratings) || 0
    });
  } catch (error) {
    console.error('Get ratings error:', error);
    res.status(500).json({ error: 'Failed to get ratings' });
  }
});

// SUBMIT RATING
router.post('/:itemId/rate', authenticate, async (req, res) => {
  try {
    const { itemId } = req.params;
    const { rating } = req.body;
    const { srn } = req.user;
    
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }
    
    // Check if student has ordered this dish
    const orderCheck = await pool.query(`
      SELECT 1 FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      WHERE oi.item_id = $1 
      AND o.srn = $2 
      AND o.status = 'completed'
      LIMIT 1
    `, [itemId, srn]);
    
    if (orderCheck.rows.length === 0) {
      return res.status(403).json({ error: 'You can only rate dishes you have ordered' });
    }
    
    // Insert or update rating
    await pool.query(`
      INSERT INTO dish_ratings (item_id, srn, rating)
      VALUES ($1, $2, $3)
      ON CONFLICT (item_id, srn) 
      DO UPDATE SET rating = $3, created_at = NOW()
    `, [itemId, srn, rating]);
    
    res.json({ success: true, message: 'Rating submitted' });
  } catch (error) {
    console.error('Submit rating error:', error);
    res.status(500).json({ error: 'Failed to submit rating' });
  }
});

// GET REVIEWS
router.get('/:itemId/reviews', async (req, res) => {
  try {
    const { itemId } = req.params;
    
    const result = await pool.query(`
      SELECT id, srn, rating, comment, created_at
      FROM dish_reviews
      WHERE item_id = $1
      ORDER BY created_at DESC
      LIMIT 50
    `, [itemId]);
    
    // Mask SRN
    const reviews = result.rows.map(review => ({
      ...review,
      srn: review.srn.substring(0, 3) + '****'
    }));
    
    res.json(reviews);
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({ error: 'Failed to get reviews' });
  }
});

// SUBMIT REVIEW
router.post('/:itemId/review', authenticate, async (req, res) => {
  try {
    const { itemId } = req.params;
    const { rating, comment } = req.body;
    const { srn } = req.user;
    
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }
    
    if (!comment || comment.trim().length === 0) {
      return res.status(400).json({ error: 'Review comment is required' });
    }
    
    if (comment.length > 500) {
      return res.status(400).json({ error: 'Review must be less than 500 characters' });
    }
    
    // Check if ordered
    const orderCheck = await pool.query(`
      SELECT 1 FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      WHERE oi.item_id = $1 
      AND o.srn = $2 
      AND o.status = 'completed'
      LIMIT 1
    `, [itemId, srn]);
    
    if (orderCheck.rows.length === 0) {
      return res.status(403).json({ error: 'You can only review dishes you have ordered' });
    }
    
    // Insert review
    await pool.query(`
      INSERT INTO dish_reviews (item_id, srn, rating, comment)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (item_id, srn) 
      DO UPDATE SET rating = $3, comment = $4, created_at = NOW()
    `, [itemId, srn, rating, comment.trim()]);
    
    // Also update rating
    await pool.query(`
      INSERT INTO dish_ratings (item_id, srn, rating)
      VALUES ($1, $2, $3)
      ON CONFLICT (item_id, srn) 
      DO UPDATE SET rating = $3, created_at = NOW()
    `, [itemId, srn, rating]);
    
    res.json({ success: true, message: 'Review submitted' });
  } catch (error) {
    console.error('Submit review error:', error);
    res.status(500).json({ error: 'Failed to submit review' });
  }
});

// CHECK IF CAN REVIEW
router.get('/:itemId/can-review', authenticate, async (req, res) => {
  try {
    const { itemId } = req.params;
    const { srn } = req.user;
    
    const orderCheck = await pool.query(`
      SELECT 1 FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      WHERE oi.item_id = $1 
      AND o.srn = $2 
      AND o.status = 'completed'
      LIMIT 1
    `, [itemId, srn]);
    
    const canReview = orderCheck.rows.length > 0;
    
    const reviewCheck = await pool.query(`
      SELECT rating, comment FROM dish_reviews
      WHERE item_id = $1 AND srn = $2
    `, [itemId, srn]);
    
    res.json({
      can_review: canReview,
      has_reviewed: reviewCheck.rows.length > 0,
      existing_review: reviewCheck.rows[0] || null
    });
  } catch (error) {
    console.error('Check review error:', error);
    res.status(500).json({ error: 'Failed to check review status' });
  }
});

module.exports = router;
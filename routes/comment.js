const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
const { isAuthenticated } = require('../middleware/auth');

router.post('/:boardId', isAuthenticated, commentController.createComment);

module.exports = router;

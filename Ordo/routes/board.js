const express = require('express');
const router = express.Router();
const boardController = require('../controllers/boardController');
const { isAuthenticated } = require('../middleware/auth');

router.get('/', boardController.listBoards);
router.get('/write', isAuthenticated, boardController.showWriteForm);
router.post('/write', isAuthenticated, boardController.createBoard);
router.get('/:id', boardController.viewBoard);
router.get('/:id/edit', isAuthenticated, boardController.showEditForm);
router.post('/:id/edit', isAuthenticated, boardController.updateBoard);
router.post('/:id/delete', isAuthenticated, boardController.deleteBoard);

module.exports = router;

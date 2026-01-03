const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { authenticateToken } = require('../middleware/auth');

// Toutes les routes sont protégées
router.use(authenticateToken);

router.get('/conversations', chatController.getConversations);
router.post('/conversations', chatController.startConversation);
router.get('/conversations/:id/messages', chatController.getMessages);
router.post('/conversations/:id/messages', chatController.sendMessage);
router.post('/conversations/:id/read', chatController.markAsRead);

module.exports = router;

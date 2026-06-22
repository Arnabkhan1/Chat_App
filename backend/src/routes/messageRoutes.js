const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const {
  getUsersForSidebar,
  getMessages,
  sendMessage,
  deleteMessage,
  editMessage,
} = require('../controllers/messageController');

router.get('/users', protect, getUsersForSidebar);
router.get('/:id', protect, getMessages);
router.post('/send/:id', protect, upload.single('image'), sendMessage);
router.delete('/:id', protect, deleteMessage);
router.put('/:id', protect, editMessage);

module.exports = router;
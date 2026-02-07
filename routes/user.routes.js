const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const { uploadAvatar } = require('../controllers/upload.controller');
const upload = require('../middleware/upload.middleware');

// Avatar upload
router.post('/upload-avatar', protect, upload.single('avatar'), uploadAvatar);

module.exports = router;

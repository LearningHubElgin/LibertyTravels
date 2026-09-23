const express = require('express');
const router = express.Router();
const settingController = require('../controllers/settingController');
const { authenticate, authorizeAdmin } = require('../middleware/auth');

router.get('/', authenticate, authorizeAdmin, settingController.getSettings);
router.put('/', authenticate, authorizeAdmin, settingController.updateSettings);

module.exports = router;


const express = require('express');
const router = express.Router();
const settingController = require('../controllers/settingController');
const { authenticate, authorizeAdmin, authorizeSuperAdmin } = require('../middleware/auth');

router.get('/', authenticate, authorizeAdmin, settingController.getSettings);
router.put('/', authenticate, authorizeSuperAdmin, settingController.updateSettings);

module.exports = router;

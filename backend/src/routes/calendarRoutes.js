const express = require('express');
const router = express.Router();
const calendarController = require('../controllers/calendarController');
const { authenticate, authorizeAdmin } = require('../middleware/auth');

router.use(authenticate, authorizeAdmin);

router.get('/events', calendarController.getCalendarEvents);

module.exports = router;

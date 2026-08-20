const express = require('express');
const router = express.Router();
const airlineController = require('../controllers/airlineController');
const { authenticate, authorizeAdmin } = require('../middleware/auth');

router.use(authenticate, authorizeAdmin);

router.get('/', airlineController.getAirlines);
router.post('/', airlineController.createAirline);
router.put('/:id', airlineController.updateAirline);
router.delete('/:id', airlineController.deleteAirline);

module.exports = router;


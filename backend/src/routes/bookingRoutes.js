const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { authenticate, authorizeAdmin } = require('../middleware/auth');

router.use(authenticate, authorizeAdmin);

router.get('/', bookingController.getBookings);
router.post('/', bookingController.createBooking);
router.get('/:id', bookingController.getBookingById);
router.put('/:id', bookingController.updateBooking);
router.put('/:id/status', bookingController.updateBookingStatus);
router.post('/:id/payments', bookingController.addPaymentToBooking);
router.delete('/:id', bookingController.deleteBooking);

module.exports = router;

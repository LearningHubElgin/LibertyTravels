const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate, authorizeSuperAdmin } = require('../middleware/auth');

// All User management routes require Super Admin privileges
router.use(authenticate, authorizeSuperAdmin);

router.get('/', userController.getUsers);
router.post('/', userController.createUser);
router.put('/:id', userController.updateUser);
router.patch('/:id', userController.updateUser);

// Status Toggle
router.put('/:id/status', userController.toggleUserStatus);
router.patch('/:id/status', userController.toggleUserStatus);
router.post('/:id/status', userController.toggleUserStatus);

// Reset Password
router.put('/:id/reset-password', userController.resetUserPassword);
router.post('/:id/reset-password', userController.resetUserPassword);
router.patch('/:id/reset-password', userController.resetUserPassword);

router.delete('/:id', userController.deleteUser);

module.exports = router;

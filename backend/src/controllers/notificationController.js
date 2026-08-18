const { Notification } = require('../models');

exports.getNotifications = async (req, res, next) => {
  try {
    const userId = req.user.id || req.user._id;

    const notifications = await Notification.find({
      $or: [
        { userId },
        { userId: null }
      ]
    })
      .sort({ createdAt: -1 })
      .limit(30);

    const unreadCount = notifications.filter(n => !n.read).length;

    return res.status(200).json({
      success: true,
      unreadCount,
      notifications
    });
  } catch (error) {
    next(error);
  }
};

exports.markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findById(id);

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    notification.read = true;
    await notification.save();

    return res.status(200).json({
      success: true,
      message: 'Notification marked as read',
      notification: notification.toJSON()
    });
  } catch (error) {
    next(error);
  }
};

exports.markAllAsRead = async (req, res, next) => {
  try {
    const userId = req.user.id || req.user._id;

    await Notification.updateMany(
      {
        $or: [{ userId }, { userId: null }],
        read: false
      },
      { $set: { read: true } }
    );

    return res.status(200).json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    next(error);
  }
};

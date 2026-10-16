const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    
    // Notification details
    type: {
      type: String,
      enum: ['transaction', 'low_balance', 'withdrawal_approved', 'withdrawal_rejected', 
             'deposit_success', 'security_alert', 'limit_reached', 'system'],
      required: true
    },
    
    title: { type: String, required: true },
    message: { type: String, required: true },
    
    // Priority
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium'
    },
    
    // Status
    read: { type: Boolean, default: false },
    readAt: Date,
    
    // Related entities
    transaction: { type: mongoose.Schema.Types.ObjectId, ref: 'Transaction' },
    wallet: { type: mongoose.Schema.Types.ObjectId, ref: 'Wallet' },
    
    // Actions
    action: {
      label: String,
      url: String,
      type: { type: String, enum: ['link', 'button', 'none'], default: 'none' }
    },
    
    // Metadata
    metadata: {
      type: Map,
      of: mongoose.Schema.Types.Mixed
    },
    
    // Expiry
    expiresAt: Date,
  },
  { timestamps: true }
);

// Index for faster queries
NotificationSchema.index({ user: 1, read: 1, createdAt: -1 });
NotificationSchema.index({ type: 1 });
NotificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Static method to create notification
NotificationSchema.statics.createNotification = async function(userId, data) {
  return await this.create({
    user: userId,
    ...data
  });
};

// Static method to mark as read
NotificationSchema.statics.markAsRead = async function(userId, notificationIds) {
  return await this.updateMany(
    { user: userId, _id: { $in: notificationIds } },
    { read: true, readAt: new Date() }
  );
};

module.exports = mongoose.model('Notification', NotificationSchema);

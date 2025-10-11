import mongoose from 'mongoose';
const { Schema } = mongoose;

const Subscriptions_Schema = new Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
        index: true  // Single field index for basic queries
    },

    razorpay_payment_id: String,
    razorpay_subscription_id: {
        type: String,
        index: true  // For looking up by Razorpay subscription ID
    },
    razorpay_signature: String,
    subscription_starts_at: Date,
    status: {
        type: String,
        index: true  // For filtering by status
    },
    recurring: {
        type: Boolean,
        default: false
    },

    is_del: {
        type: Boolean,
        default: false
    },

    created_at: {
        type: Date,
        default: Date.now
    },

    updatedAt: {
        type: Date
    }
});

// Compound indexes for common query patterns
Subscriptions_Schema.index({ user_id: 1, is_del: 1 }); // Get user's active subscriptions
Subscriptions_Schema.index({ user_id: 1, status: 1 }); // Get user's subscriptions by status
Subscriptions_Schema.index({ user_id: 1, created_at: -1 }); // Get user's subscriptions sorted by date
Subscriptions_Schema.index({ user_id: 1, is_del: 1, status: 1 }); // Get user's active subscriptions by status
Subscriptions_Schema.index({ status: 1, subscription_starts_at: 1 }); // For background jobs checking active subscriptions
Subscriptions_Schema.index({ razorpay_subscription_id: 1, is_del: 1 }); // Webhook lookups

// Optional: TTL index if you want to auto-delete old soft-deleted records
// Subscriptions_Schema.index({ updatedAt: 1 }, { expireAfterSeconds: 31536000, partialFilterExpression: { is_del: true } }); // 1 year

const Subscriptions_Schema_Model = mongoose.model('subscriptions', Subscriptions_Schema);
export default Subscriptions_Schema_Model;
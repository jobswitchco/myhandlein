import mongoose from 'mongoose';
const { Schema } = mongoose;

const Bookings_Schema = new Schema({

    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
        index: true  // Single field index for basic queries
    },

     block_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "blocks",
        index: true  // Single field index for basic queries
    },

    customer_name:{
        type: String
    },

    customer_mobile:{
        type: Number
    },

    customer_email:{
        type: String
    },

    selected_date: { type: Date},
    selected_timeSlot: { type: String},

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
Bookings_Schema.index({ user_id: 1, is_del: 1 });
Bookings_Schema.index({ user_id: 1, block_id: 1 });
Bookings_Schema.index({ block_id: 1, selected_date: 1, selected_timeSlot: 1 });

// Optional: TTL index if you want to auto-delete old soft-deleted records
// Subscriptions_Schema.index({ updatedAt: 1 }, { expireAfterSeconds: 31536000, partialFilterExpression: { is_del: true } }); // 1 year

const Bookings_Schema_Model = mongoose.model('bookings', Bookings_Schema);
export default Bookings_Schema_Model;
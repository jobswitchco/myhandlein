import mongoose from 'mongoose';
const { Schema } = mongoose;


const ProductCategory_Schema = new Schema({

    user_id: {
           type: mongoose.Schema.Types.ObjectId,
           ref: "users",
         },
 name: { type: String, required: true, trim: true, unique: true, index: true },
    created_at: { type: Date, default: Date.now },

    is_del: {
        type: Boolean,
        default: false
    },

    updatedAt: {
        type: Date
    }
});


const ProductCategory_Schema_Model = mongoose.model('product_categories', ProductCategory_Schema);
export default ProductCategory_Schema_Model;

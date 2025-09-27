import mongoose from "mongoose";
const { Schema } = mongoose;

const ProductsCatalogue_Schema = new Schema({

    user_id: { type: Schema.Types.ObjectId, ref: "users", index: true, required: false },
    title: { type: String, required: false },
    link: { type: String, required: false },
    imageUrl: { type: String, required: false },
    imagePublicId: { type: String, required: false },
    link_click_analytics: [{
  ip: { type: String, index: true },
  user_agent: { type: String },
  referrer: { type: String },
  country: { type: String, index: true },
  country_code: { type: String, index: true },
  region: { type: String },
  city: { type: String },
  postal: { type: String },
  latitude: { type: Number },
  longitude: { type: Number },
}],
   
      is_del: {
    type: Boolean,
    default: false,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
  updated_at: {
    type: Date,
  }
});

const ProductsCatalogue_Schema_Model = mongoose.model("products_catalogue", ProductsCatalogue_Schema);
export default ProductsCatalogue_Schema_Model;

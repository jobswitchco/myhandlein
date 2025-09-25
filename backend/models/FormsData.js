import mongoose from "mongoose";
const { Schema } = mongoose;

const FormsData_Schema = new Schema({

 form_id: { type: Schema.Types.ObjectId, ref: "blocks", index: true, required: false },
    user_id: { type: Schema.Types.ObjectId, ref: "users", index: true, required: false },
    block_id: { type: String, required: false },
    block_name: { type: String, required: false },
    values: { type: Schema.Types.Mixed, default: {} },
    meta: { type: Schema.Types.Mixed, default: {} },
    ip_address: { type: String, required: false },
    user_agent: { type: String, required: false },
    submitted_at: { type: Date, default: Date.now },
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

const FormsData_Schema_Model = mongoose.model("forms_data", FormsData_Schema);
export default FormsData_Schema_Model;

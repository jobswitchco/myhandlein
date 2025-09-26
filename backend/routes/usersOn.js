import express from "express";
import cookieParser from "cookie-parser";
const router = express.Router();
import USER from "../models/User.js";
import Block from "../models/Blocks.js";
import FormsData from "../models/FormsData.js";
import Product from "../models/ProductsCatalogue.js";
import mongoose from 'mongoose';
router.use(cookieParser());
import authenticateToken from "../middleware/authenticateTokenProfessional.js";
import generateJWTtoken  from "../middleware/generateJWTtoken.js";
import fs from "fs";
import multer from "multer";
import crypto from "crypto";
import util from "util";
const unlinkAsync = util.promisify(fs.unlink);
import { Storage } from '@google-cloud/storage';
const storage = new Storage();
const bucketName = "postlnbucketcom"; 
const bucket = storage.bucket(bucketName);
const upload = multer({ storage: multer.memoryStorage() });


router.post("/logout", authenticateToken, (req, res) => {
  res.clearCookie("token_professional", {
    httpOnly: true,
    secure: false, // Set to true in production with HTTPS
    sameSite: "Strict",
  });
  res.status(200).json({ message: "Logged out successfully" });
});

async function uploadBufferToGCS(buffer, originalName, mimeType) {
  if (!bucket) throw new Error("GCS bucket not configured.");
  const ext = path.extname(originalName) || "";
  const objectName = `products/${Date.now()}-${crypto
    .randomBytes(6)
    .toString("hex")}${ext}`;
  const file = bucket.file(objectName);

  return new Promise((resolve, reject) => {
    const stream = file.createWriteStream({
      metadata: { contentType: mimeType },
      resumable: false,
    });

    stream.on("error", (err) => reject(err));
    stream.on("finish", async () => {
      try {
        await file.makePublic();
        const publicUrl = `https://storage.googleapis.com/${bucketName}/${objectName}`;
        resolve({ publicUrl, objectName });
      } catch (err) {
        reject(err);
      }
    });

    // 🔑 Actually write the in-memory buffer to GCS
    stream.end(buffer);
  });
}


// Upload from a local file path (works with multer({ dest: "uploads/" }))
async function uploadFilePathToGCS(filePath, originalName, mimeType) {
  if (!bucket) throw new Error("GCS bucket not configured.");
  const ext = path.extname(originalName) || path.extname(filePath) || "";
  const objectName = `products/${Date.now()}-${crypto.randomBytes(6).toString("hex")}${ext}`;
  const file = bucket.file(objectName);

  return new Promise((resolve, reject) => {
    const readStream = fs.createReadStream(filePath);
    const writeStream = file.createWriteStream({
      metadata: { contentType: mimeType || "application/octet-stream" },
      resumable: false,
    });

    readStream.on("error", (err) => {
      reject(err);
    });

    writeStream.on("error", (err) => {
      reject(err);
    });

    writeStream.on("finish", async () => {
      try {
        await file.makePublic();
        const publicUrl = `https://storage.googleapis.com/${bucketName}/${objectName}`;

        // cleanup local file - don't block the response if deletion fails, but attempt it
        try {
          await unlinkAsync(filePath);
        } catch (unlinkErr) {
          console.warn("Failed to remove local upload file:", unlinkErr.message);
        }

        resolve({ publicUrl, objectName });
      } catch (err) {
        reject(err);
      }
    });

    // pipe the local file into GCS write stream
    readStream.pipe(writeStream);
  });
}


function normalizePosition(pos) {
  if (!pos) return null;
  const p = String(pos).trim().toLowerCase();
  if (["left", "headerimage1", "headerimage_1", "1"].includes(p)) return "leftHeadImage";
  if (["righttop", "right_top", "headerimage2", "headerimage_2", "2"].includes(p)) return "rightTopImage";
  if (["rightbottom", "right_bottom", "headerimage3", "headerimage_3", "3"].includes(p)) return "rightBottomImage";
  return null;
}


router.get("/fetch-blocks", authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.user_id;

    if (!userId) return res.status(401).json({ error: "Unauthenticated" });

    const q = { user_id: userId, archived: false, is_del: false };
    if (req.query.type) q.type = req.query.type;

    const blocks = await Block.find(q).sort({ order: 1 }).lean().exec();

    // Normalize to frontend-friendly shape if you like
    const normalized = blocks.map((b) => ({
      id: b._id,
      name: b.name,
      action: b.action,
      type: b.type,
      order: b.order,
      created_at: b.created_at,
      updated_at: b.updated_at,
      raw: b,
    }));

    return res.json(normalized);
  } catch (err) {
    console.error("GET /api/blocks error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/save-blocks", authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.user_id;
    if (!userId) return res.status(401).json({ error: "Unauthenticated" });

    const { name, action, type = "link", fields } = req.body;

    // Basic validation: name always required
    if (!name || !name.trim()) return res.status(400).json({ error: "name is required" });

    const allowed = ["link", "video", "product", "store", "form", "cta"];
    if (!allowed.includes(type)) return res.status(400).json({ error: "invalid type" });

    // If it's a form, expect an array of fields (but allow empty array if user will add later)
    let normalizedFields = undefined;
    if (type === "form") {
      if (fields !== undefined) {
        if (!Array.isArray(fields)) return res.status(400).json({ error: "fields must be an array" });
        // Basic per-field validation + normalization
        normalizedFields = fields.map((f, i) => {
          const key = (f.key || f.name || `field_${i}`).toString();
          const label = (f.label || "").toString();
          const ftype = (f.type || "text").toString();
          const placeholder = f.placeholder ? String(f.placeholder) : "";
          const required = !!f.required;

          if (!label || !label.trim()) throw { status: 400, message: `field ${i} missing label` };

          // extend supported types to include 'radio' and 'textarea' etc.
          const supportedTypes = ["text", "email", "tel", "textarea", "number", "radio"];
          if (!supportedTypes.includes(ftype)) throw { status: 400, message: `field ${i} has invalid type` };

          // normalize options for radio fields
          let options = undefined;
          if (ftype === "radio") {
            // accept array or comma-string
            if (f.options === undefined) {
              throw { status: 400, message: `field ${i} (radio) missing options` };
            }
            if (Array.isArray(f.options)) {
              options = f.options.map((o) => String(o).trim()).filter(Boolean);
            } else if (typeof f.options === "string") {
              options = f.options.split(",").map((s) => s.trim()).filter(Boolean);
            } else {
              throw { status: 400, message: `field ${i} (radio) options must be array or comma string` };
            }
            if (options.length === 0) throw { status: 400, message: `field ${i} (radio) requires at least one option` };
          }

          // Build normalized field object including options when present
          const normalized = { key, label: label.trim(), type: ftype, placeholder, required };
          if (options !== undefined) normalized.options = options;
          return normalized;
        });
      } else {
        // fields not supplied by the client — allow empty array to be created
        normalizedFields = [];
      }
    } else {
      // non-form: action required (URL or string)
      if (!action || !action.trim()) return res.status(400).json({ error: "action (URL) is required for this block type" });
    }

    // compute new order: put at the end
    const last = await Block.findOne({ user_id: userId }).sort({ order: -1 }).select("order").lean().exec();
    const newOrder = last ? last.order + 100 : 100;

    const payload = {
      user_id: userId,
      name: name.trim(),
      action: (action && action.trim()) || "",
      type,
      order: newOrder,
      created_at: new Date(),
      updated_at: new Date(),
    };

    if (type === "form") {
      payload.fields = normalizedFields;
      // optional: store a little preview in action for backward compatibility
      payload.action = JSON.stringify({ fields: normalizedFields });
    }

    const doc = await Block.create(payload);

    // return normalized created block
    return res.status(201).json({
      id: doc._id,
      name: doc.name,
      action: doc.action,
      type: doc.type,
      order: doc.order,
      created_at: doc.created_at,
      updated_at: doc.updated_at,
    });
  } catch (err) {
    // handle thrown validation object from map above
    if (err && err.status && err.message) {
      return res.status(err.status).json({ error: err.message });
    }

    console.error("POST /api/blocks error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});


router.delete('/delete-block/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.user_id;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const blockId = req.params.id;
    if (!blockId) return res.status(400).json({ success: false, message: 'Block id missing' });

    const block = await Block.findOne({ _id: blockId, user_id: userId }).lean();
    if (!block) return res.status(404).json({ success: false, message: 'Block not found' });

    await Block.deleteOne({ _id: blockId, user_id: userId });

    return res.json({ success: true, message: 'Deleted' });
  } catch (err) {
    console.error('delete-block error', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.get("/verify-login-token", authenticateToken, (req, res) => {
  if (!req.user) {
    return res.status(401).json({ valid: false });
  }
  return res.status(200).json({ valid: true, user: req.user });
  
});


router.post("/user-login-gmail", async (req, res) => {
  try {
    const { email, firstName, lastName, picture } = req.body;
    console.log("email : ", email);

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    let user = await USER.findOne({ email });
    let wasNew = false;

    if (!user) {
      user = await USER.create({
        email,
        name: `${firstName || ""} ${lastName || ""}`.trim(),
        picture,
        is_google_user: true,
      });
      wasNew = true;
    }

    const token = await generateJWTtoken(user._id, user.email);

    // Cookie options: adjust for your environment (see notes below)
    res.cookie("tokenMyhandleProf", token, {
      httpOnly: true,
      secure: false,    // set true in production when using HTTPS
      sameSite: "Lax",  // or 'None' if your frontend is on a different domain and you use HTTPS
    });

    return res.status(200).json({
      success: true,
      message: wasNew ? "User registered successfully" : "User logged in successfully",
      user: {
        user_id: user._id,
        user_email: user.email,
      },
      token,
      wasNew
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ error: "Internal server error", message: "An error occurred" });
  }
});

router.post("/save-username", authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.user_id;

    if (!userId) return res.status(401).json({ success: false, message: "Unauthenticated" });

    let { handleUserName, goal } = req.body || {};
    if (!handleUserName || typeof handleUserName !== "string") {
      return res.status(400).json({ success: false, message: "handleUserName is required" });
    }

    // sanitize & normalize
    handleUserName = handleUserName.trim().toLowerCase();

    // validate same pattern as frontend
    const usernameRegex = /^[a-zA-Z0-9._-]{3,30}$/;
    if (!usernameRegex.test(handleUserName)) {
      return res.status(400).json({ success: false, message: "Invalid username format" });
    }

    // check uniqueness (exclude current user)
    const existing = await USER.findOne({ handleUserName });
    if (existing && String(existing._id) !== String(userId)) {
      return res.status(409).json({ success: false, message: "Username already taken" });
    }

    // update current user
    const updated = await USER.findByIdAndUpdate(
      userId,
      { handleUserName, goal, updated_at: new Date() },
      { new: true }
    ).select("-password"); // remove sensitive fields if any

    return res.json({ success: true, message: "Username saved", user: updated });
  } catch (err) {
    console.error("handle-username error:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
});

router.get("/user/socials", authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.user_id;

    if (!userId) return res.status(401).json({ error: "Unauthenticated" });

    const user = await USER.findById(userId).select("socials").lean();
    return res.json({ socials: user?.socials || [] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/user/socials", authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.user_id;

    const { platform, url } = req.body;
    if (!platform || !url) return res.status(400).json({ error: "platform and url required" });

    const allowed = ["youtube", "twitter", "instagram", "linkedin", "whatsapp"];
    if (!allowed.includes(platform)) return res.status(400).json({ error: "invalid platform" });

    const user = await USER.findById(userId).select("socials");
    if (!user) return res.status(404).json({ error: "user not found" });

    // Case-insensitive duplicate check
    const exists = user.socials.some(s => String(s.platform).toLowerCase() === platform.toLowerCase());
    if (exists) return res.status(409).json({ error: "platform already added" });

    const socialObj = { platform, url, created_at: new Date() };
    user.socials.push(socialObj);
    await user.save();

    // return the new social (last item)
    const added = user.socials[user.socials.length - 1];
    return res.status(201).json({ social: added });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});


router.delete("/user/socials/:id", authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.user_id;

    if (!userId) return res.status(401).json({ error: "Unauthenticated" });

    const id = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: "invalid id" });

    const user = await USER.findById(userId).exec();
    if (!user) return res.status(404).json({ error: "user not found" });

    user.socials = user.socials.filter((s) => String(s._id) !== String(id));
    await user.save();

    return res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});


   router.get('/get-user-details', authenticateToken, async function (req, res){

    const userId = req.user?.user_id;

        if (!userId) {
          return res.status(400).json({ message: "Username is invalid." });
        }
  
    USER.findById(userId).then((result)=>{
  
      if(result){
  
      res.status(200).send({ success: true, data: { name: result.name, handleUserName: result.handleUserName, picture : result.picture, intro: result.intro, leftHeadImage: result.leftHeadImage, rightTopImage: result.rightTopImage, rightBottomImage: result.rightBottomImage}});
      res.end();

  
      }
  
      else{
      res.status(200).send({ success: false, data: null });
      res.end();
  
      }
  
    }).catch(e2=>{
  
      console.error("❌ Error fetching campaign details:", e2);
      return res.status(500).json({ error: "Internal Server Error" });
  
    })
  });

  router.post('/update-block-order', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.user_id;

    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { order } = req.body;
    if (!Array.isArray(order)) return res.status(400).json({ success: false, message: 'Invalid payload' });

    // For safety only allow updating blocks belonging to this user
    const bulkOps = order.map((item) => {
      return {
        updateOne: {
          filter: { _id: item.id, user_id: userId },
          update: { $set: { order: parseInt(item.order, 10) || 0, updated_at: new Date() } },
        },
      };
    });

    if (bulkOps.length === 0) return res.json({ success: true, message: 'No changes' });

    const result = await Block.bulkWrite(bulkOps);
    return res.json({ success: true, result });
  } catch (err) {
    console.error('update-block-order error', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.get('/profile', async (req, res) => {
  try {
    // prefer explicit query param in dev; in prod use extractSubdomain(req.headers.host)
    // const handle = (req.query.handle || extractSubdomain(req.headers.host || '') || '').trim().toLowerCase();
    const handle = 'sid4real';
    if (!handle) return res.status(400).json({ error: 'handle required' });

    // find user by handleUserName (case-insensitive)
    const user = await USER.findOne({ handleUserName: handle }).lean();
    if (!user) return res.status(404).json({ error: 'not found' });

    // fetch blocks for this user (published and not deleted) and sort by order asc
    const blocks = await Block.find({
      user_id: user._id,
      is_del: false,
    })
      .sort({ order: 1, created_at: -1 })
      .lean();


    // shape payload: remove internal mongo fields as needed
    const { _id, __v, ...userRest } = user;

    const payload = {
      ...userRest,
      id: String(_id),
      blocks: blocks || [],
      socials: user.socials || [],
    };

      console.log(' payload: ', payload );


    return res.json(payload);
  } catch (err) {
    console.error('GET /api/profile error:', err);
    return res.status(500).json({ error: 'internal' });
  }
});

router.post("/submit-form", async (req, res) => {
  try {
    // extract possible keys (be tolerant of different names)
    const {
      formId,
      userId,
      blockId,
      blockName,
      values = {},
      meta = {},
    } = req.body || {};

    // basic validation: values should be an object
    if (values == null || typeof values !== "object") {
      return res.status(400).json({ message: "Invalid values payload; expected an object." });
    }

    // collect IP and user agent if available
    const ip = req.headers["x-forwarded-for"]?.split(",")?.[0]?.trim() || req.ip || null;
    const ua = req.get("User-Agent") || null;

    const doc = new FormsData({
      form_id: formId || undefined,
      user_id: userId || undefined,
      block_id: blockId || undefined,
      block_name: blockName || undefined,
      values,
      meta,
      ip_address: ip,
      user_agent: ua,
      submitted_at: meta?.submittedAt ? new Date(meta.submittedAt) : undefined,
    });

    await doc.save();

    return res.status(201).json({ message: "Form submitted", id: doc._id });
  } catch (err) {
    console.error("Error saving form submission:", err);
    return res.status(500).json({ message: "Failed to save submission" });
  }
});


router.post("/upload-product", upload.single("image"), authenticateToken, async (req, res) => {
  try {

    const userId = req.user?.user_id;

    const { title, link } = req.body;
    if (!title || !link) {
      return res.status(400).json({ message: "title and link required" });
    }

    let imageUrl = null;
    let imagePublicId = null;

    if (req.file) {
      // Case A: multer({ dest: "uploads/" }) -> req.file.path exists (disk)
      if (req.file.path) {
        const uploaded = await uploadFilePathToGCS(req.file.path, req.file.originalname, req.file.mimetype);
        imageUrl = uploaded.publicUrl;
        imagePublicId = uploaded.objectName;
        // uploadFilePathToGCS already tries to unlink the local file after upload,
        // but in case your helper doesn't, ensure cleanup:
        if (fs.existsSync(req.file.path)) {
          try { await unlinkAsync(req.file.path); } catch (e) { /* ignore */ }
        }
      }
      // Case B: multer.memoryStorage() -> req.file.buffer exists
      else if (req.file.buffer) {
        const uploaded = await uploadBufferToGCS(req.file.buffer, req.file.originalname, req.file.mimetype);
        imageUrl = uploaded.publicUrl;
        imagePublicId = uploaded.objectName;
      } else {
        // Fallback: unexpected multer shape
        console.warn("Uploaded file present but no path or buffer found:", req.file);
      }
    }

    const prod = await Product.create({ user_id: userId, title, link, imageUrl, imagePublicId });
    return res.json({ product: prod });
  } catch (err) {
    console.error("Create product error:", err);

    // attempt to remove multer temp file on error (best-effort)
    try {
      if (req.file && req.file.path && fs.existsSync(req.file.path)) {
        await unlinkAsync(req.file.path);
      }
    } catch (cleanupErr) {
      console.warn("Failed to cleanup temp file:", cleanupErr.message);
    }

    return res.status(500).json({ message: "Error creating product", error: err.message });
  }
});


// GET /api/products/fet-user-products?page=1&limit=10
router.get("/fet-user-products", authenticateToken, async (req, res) => {

    const userId = req.user?.user_id;
    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const limit = Math.max(parseInt(req.query.limit || "10", 10), 1);
    const skip = (page - 1) * limit;

    try {
      // support req.user.id or req.user._id
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized: no user id" });
      }

      const filter = { user_id: userId, is_del: false };

      const [data, total] = await Promise.all([
        Product.find(filter).sort({ created_at: -1 }).skip(skip).limit(limit).lean(),
        Product.countDocuments(filter),
      ]);

      return res.json({ data, total });
    } catch (err) {
      console.error("List user products error:", err);
      return res.status(500).json({ message: "Error fetching products" });
    }
  }
);

router.post("/edit-product/:id", authenticateToken, upload.single("image"), async (req, res) => {
    try {

      const userId = req.user?.user_id;
      const id = req.params.id;
      const { title, link } = req.body;

      const product = await Product.findOne({_id: id, user_id : userId});
      if (!product) return res.status(404).json({ message: "Product not found" });

      // Update fields
      if (title) product.title = title;
      if (link) product.link = link;

      // If new image uploaded, upload to GCS and delete old object (if exists)
      if (req.file) {
        let uploaded;
        // Case A: multer({ dest: "uploads/" }) -> req.file.path exists (disk)
        if (req.file.path) {
          uploaded = await uploadFilePathToGCS(req.file.path, req.file.originalname, req.file.mimetype);
          // uploadFilePathToGCS already tries to unlink the local file after upload,
          // but double-check and cleanup if still present:
          try {
            if (fs.existsSync(req.file.path)) {
              await unlinkAsync(req.file.path);
            }
          } catch (e) {
            console.warn("Failed to unlink temp file:", e.message);
          }
        }
        // Case B: multer.memoryStorage() -> req.file.buffer exists
        else if (req.file.buffer) {
          uploaded = await uploadBufferToGCS(req.file.buffer, req.file.originalname, req.file.mimetype);
        } else {
          console.warn("Uploaded file present but neither path nor buffer found:", req.file);
        }

        if (uploaded) {
          // delete old object if exists
          if (product.imagePublicId && bucket) {
            try {
              await bucket.file(product.imagePublicId).delete();
            } catch (err) {
              console.warn("Failed to delete old image from GCS:", err.message);
              // not fatal
            }
          }

          product.imageUrl = uploaded.publicUrl;
          product.imagePublicId = uploaded.objectName;
        }
      }

      await product.save();
      return res.json({ product });
    } catch (err) {
      console.error("Edit product error:", err);

      // attempt to remove multer temp file on error (best-effort)
      try {
        if (req.file && req.file.path && fs.existsSync(req.file.path)) {
          await unlinkAsync(req.file.path);
        }
      } catch (cleanupErr) {
        console.warn("Failed to cleanup temp file:", cleanupErr.message);
      }

      return res.status(500).json({ message: "Error editing product", error: err.message });
    }
  }
);

router.delete("/delete-product/:id", authenticateToken, async (req, res) => {
    try {
      const userId = req.user?.user_id;
      const id = req.params.id;

      // validate id
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid product id" });
      }

      // find product
      const product = await Product.findOne({_id: id, user_id : userId});

      if (!product) return res.status(404).json({ message: "Product not found" });


      // if already soft-deleted
      if (product.is_del) {
        return res.status(400).json({ message: "Product already deleted" });
      }

      // Soft-delete: mark flags but keep DB row and GCS object intact
      product.is_del = true;
      product.updated_at = new Date();
      await product.save();

      return res.json({ message: "Product soft-deleted", productId: id });
    } catch (err) {
      console.error("Delete product error:", err);
      return res.status(500).json({ message: "Error deleting product" });
    }
  }
);

router.post(
  "/upload-header-image",
  authenticateToken,
  upload.single("image"),
  async (req, res) => {
    try {
      const userId = req.user?.user_id;
      if (!userId) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }

      // Multer memoryStorage provides file.buffer
      const file = req.file;
      const rawPosition = req.body?.position;

      // Basic validation
      if (!file || !file.buffer) {
        return res.status(400).json({
          success: false,
          message: "No file uploaded. Ensure you send multipart/form-data with field name 'image'.",
        });
      }

      const targetField = normalizePosition(rawPosition);
      if (!targetField) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid position value. Acceptable values: left | headerImage1 | 1, rightTop | headerImage2 | 2, rightBottom | headerImage3 | 3",
        });
      }

      // Upload buffer to GCS (your helper) - it should return { publicUrl, objectName }
      const { publicUrl, objectName } = await uploadBufferToGCS(
        file.buffer,
        file.originalname || `upload-${Date.now()}`,
        file.mimetype || "application/octet-stream"
      );

      if (!publicUrl) {
        return res.status(500).json({ success: false, message: "Failed to upload to storage" });
      }

      // Update user doc
      const update = { [targetField]: publicUrl, updated_at: new Date() };
      const updatedUser = await USER.findByIdAndUpdate(userId, { $set: update }, { new: true }).lean();

      if (!updatedUser) {
        return res.status(404).json({ success: false, message: "User not found" });
      }

      return res.json({
        success: true,
        url: publicUrl,
        updatedField: targetField,
        objectName,
        user: {
          _id: updatedUser._id,
          leftHeadImage: updatedUser.leftHeadImage,
          rightTopImage: updatedUser.rightTopImage,
          rightBottomImage: updatedUser.rightBottomImage,
        },
      });
    } catch (err) {
      console.error("upload-header-image error:", err);
      return res.status(500).json({
        success: false,
        message: "Upload failed",
        error: err?.message || String(err),
      });
    }
  }
);



export default router;

import express from 'express';
import http from 'http';
import fs from 'fs';
import path from 'path';
import dbConnection from "./db.js";
import bodyParser from "body-parser";
import cors from 'cors';
import usersOnBoard from "./routes/usersOn.js";
import mongoose from 'mongoose';
import UserModel from './models/User.js'
import BlockModel from './models/Blocks.js';
import FormsData from "./models/FormsData.js";
dbConnection();
const app = express();
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true, limit: "50mb" }));

app.use((req, res, next) => {
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
  next();
});

const corsOptions = {
  origin: '*',
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
  optionSuccessStatus: 200,
  changeOrigin: true,
};

app.use(cors(corsOptions));
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  next();
});
app.use("/usersOn", usersOnBoard);

// --- Simple helper: extract subdomain from Host header
function extractSubdomain(hostname = '') {
  if (!hostname) return null;
  const host = hostname.split(':')[0].toLowerCase();
  const parts = host.split('.');
  if (parts.length <= 2) return null;        // myhandle.in -> no subdomain
  if (parts[0] === 'www') return null;       // ignore www
  return parts.slice(0, parts.length - 2).join('.'); // a.b.myhandle.in -> 'a.b'
}


// ... other code ...

app.get('/profile', async (req, res) => {
  try {
    // prefer explicit query param in dev; in prod use extractSubdomain(req.headers.host)
    // const handle = (req.query.handle || extractSubdomain(req.headers.host || '') || '').trim().toLowerCase();
    const handle = 'sid4real';
    if (!handle) return res.status(400).json({ error: 'handle required' });

    // find user by handleUserName (case-insensitive)
    const user = await UserModel.findOne({ handleUserName: handle }).lean();
    if (!user) return res.status(404).json({ error: 'not found' });

    // fetch blocks for this user (published and not deleted) and sort by order asc
    const blocks = await BlockModel.find({
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

app.post("/submit-form", async (req, res) => {
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



// --- Serve static build and meta-inject index.html for SPA routes
const BUILD_DIR = path.join(process.cwd(), 'build');
const INDEX_HTML = path.join(BUILD_DIR, 'index.html');

let TEMPLATE_HTML = null;
try {
  TEMPLATE_HTML = fs.readFileSync(INDEX_HTML, 'utf8');
} catch (err) {
  console.warn('Warning: build/index.html not found. Make sure you run `npm run build` before using server to serve static files.');
  TEMPLATE_HTML = null;
}

// Serve static assets (JS/CSS/images)
if (fs.existsSync(BUILD_DIR)) {
  app.use(express.static(BUILD_DIR, { index: false }));
}

// Helper to build meta tags and inject initial profile
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildMetaTags(meta) {
  const tags = [];
  if (meta.title) tags.push(`<title>${escapeHtml(meta.title)}</title>`);
  if (meta.description) tags.push(`<meta name="description" content="${escapeHtml(meta.description)}">`);
  if (meta.url) tags.push(`<link rel="canonical" href="${escapeHtml(meta.url)}">`);

  // Open Graph
  if (meta.title) tags.push(`<meta property="og:title" content="${escapeHtml(meta.title)}">`);
  if (meta.description) tags.push(`<meta property="og:description" content="${escapeHtml(meta.description)}">`);
  if (meta.image) tags.push(`<meta property="og:image" content="${escapeHtml(meta.image)}">`);
  if (meta.url) tags.push(`<meta property="og:url" content="${escapeHtml(meta.url)}">`);

  // Twitter
  if (meta.title) tags.push(`<meta name="twitter:title" content="${escapeHtml(meta.title)}">`);
  if (meta.description) tags.push(`<meta name="twitter:description" content="${escapeHtml(meta.description)}">`);
  if (meta.image) tags.push(`<meta name="twitter:image" content="${escapeHtml(meta.image)}">`);

  return tags.join('\n');
}

// catch-all for client-side routes: inject meta & initial profile for subdomain requests
app.get('*', async (req, res, next) => {
  try {
    // If the request matches an existing static file, let express.static have handled it.
    // If template not loaded, fallback to next middleware (or 404).
    if (!TEMPLATE_HTML) return next();

    const host = req.headers.host || '';
    const subdomain = extractSubdomain(host);

    // If no subdomain, just serve normal index.html (no injection)
    if (!subdomain) {
      return res.type('html').send(TEMPLATE_HTML);
    }

    // Try to fetch profile from DB
    const profilesColl = mongoose.connection.collection('profiles');
    const profile = await profilesColl.findOne({ handle: subdomain.toLowerCase() });

    // If no profile, serve default index and let client show 404/notfound UI
    if (!profile) {
      return res.type('html').send(TEMPLATE_HTML);
    }

    // Build meta and initial profile script
    const meta = {
      title: profile.displayName ? `${profile.displayName} — MyHandle` : `${subdomain} — MyHandle`,
      description: profile.bio || profile.shortBio || `View ${profile.displayName || subdomain} on MyHandle`,
      image: profile.ogImage || profile.avatarUrl || `https://myhandle.in/static/default-og.png`,
      url: `https://${host}${req.originalUrl}`
    };

    const metaTags = buildMetaTags(meta);

    // Safe JSON for injection (escape < to avoid XSS ending script blocks)
    const safeJson = JSON.stringify(profile).replace(/</g, '\\u003c');

    const initialProfileScript = `<script>window.__INITIAL_PROFILE__ = ${safeJson};</script>`;

    // inject before </head>
    const html = TEMPLATE_HTML.replace(/<\/head>/i, `${metaTags}\n${initialProfileScript}\n</head>`);
    // Cache if you want (not included here)

    return res.type('html').send(html);
  } catch (err) {
    console.error('Error in meta-injection handler:', err);
    // fallback to default index
    if (TEMPLATE_HTML) return res.type('html').send(TEMPLATE_HTML);
    return next(err);
  }
});



const server = http.createServer(app);

server.listen(8001, () => {
  console.log('Server is running on port 8001');
});






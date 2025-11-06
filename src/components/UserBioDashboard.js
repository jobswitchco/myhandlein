// ProfileBlocksEditor.js
import React, { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Avatar,
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Paper,
  Stack,
  TextField,
  Typography,
  useTheme,
  Snackbar,
  Tabs,
  Grid,
  Tab,
  CircularProgress,
  Tooltip,
  FormControl,
  FormLabel,
  Radio,
  RadioGroup,
  FormControlLabel,
  Menu,
  MenuItem,
  Button,
  ClickAwayListener,
  Switch,
  Checkbox
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { styled } from "@mui/material/styles";
import EditIcon from "@mui/icons-material/Edit";
import LinkIcon from "@mui/icons-material/Link";
import AddIcon from "@mui/icons-material/Add";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import DeleteIcon from "@mui/icons-material/Delete";
import StorefrontIcon from "@mui/icons-material/Storefront";
import SmsOutlinedIcon from '@mui/icons-material/SmsOutlined';
import IndiaFlag from "../images/flag.png";
import SaveIcon from "@mui/icons-material/Save";
import ShareIcon from "@mui/icons-material/Share";
import YouTubeIcon from "@mui/icons-material/YouTube";
import TwitterIcon from "@mui/icons-material/Twitter";
import InstagramIcon from "@mui/icons-material/Instagram";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import MovieIcon from "@mui/icons-material/Movie";
import EmailIcon from '@mui/icons-material/EmailOutlined';
import DescriptionIcon from '@mui/icons-material/DescriptionOutlined';
import axios from "axios";
import { toast } from "react-toastify";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import newsletterBg from "../images/newsLetterBg.jpg";
import MailOutlinedIcon from '@mui/icons-material/MailOutlined';
import EventIcon from '@mui/icons-material/CalendarMonth';
import { CurrencyRupee } from '@mui/icons-material';
import { InputAdornment } from '@mui/material';

// ---------- Responsive Custom styled buttons ----------
const PrimaryBtn = styled("button")(({ theme }) => ({
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  border: "none",
  cursor: "pointer",
  padding: "10px 16px",
  borderRadius: 6,
  color: "#fff",
  fontWeight: 700,
  background: "#077A7D",
  transition: "transform .12s ease, box-shadow .12s ease",
  fontSize: 14,
  textTransform: "none",
  [theme.breakpoints.down("sm")]: {
    width: "100%",
    justifyContent: "center",
    padding: "12px 14px",
  },
}));

const MeetingButton = styled("button")(({ theme }) => ({
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  border: "none",
  cursor: "pointer",
  padding: "10px 16px",
  borderRadius: 6,
  color: "#fff",
  fontWeight: 700,
  background: "#EFEFF0",
  transition: "transform .12s ease, box-shadow .12s ease",
  fontSize: 14,
  textTransform: "none",
  [theme.breakpoints.down("sm")]: {
    width: "100%",
    justifyContent: "center",
    padding: "12px 14px",
  },
}));

const ShareUrlBtn = styled("button")(({ theme }) => ({
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  border: "none",
  cursor: "pointer",
  padding: "8px 14px",
  borderRadius: 999,
  color: "#fff",
  fontFamily: "Inter",
  fontWeight: 600,
  background: "linear-gradient(90deg,#7c3aed,#9f7aea)",
  boxShadow: "0 8px 24px rgba(124,58,237,0.14)",
  transition: "transform .12s ease, box-shadow .12s ease",
  fontSize: 12,
  textTransform: "none",
  [theme.breakpoints.down("sm")]: {
    width: "100%",
    justifyContent: "center",
    padding: "10px 12px",
  },
}));

const GhostBtn = styled("button")(({ theme }) => ({
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  border: "1px solid rgba(99,102,241,0.14)",
  cursor: "pointer",
  padding: "8px 14px",
  borderRadius: 999,
  color: "#374151",
  background: "#FFF",
  fontFamily: "Inter",
  fontWeight: 600,
  fontSize: 12,
  textTransform: "none",
  [theme.breakpoints.down("sm")]: {
    width: "100%",
    justifyContent: "center",
    padding: "10px 12px",
  },
}));

const HandleBtn = styled("button")(({ theme }) => ({
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  border: "1px solid rgba(99,102,241,0.14)",
  padding: "8px 14px",
  borderRadius: 999,
  color: "#374151",
  background: "#FFF",
  textTransform: "none",
  [theme.breakpoints.down("sm")]: {
    width: "100%",
    justifyContent: "center",
    padding: "10px 12px",
  },
}));

const AddPill = styled("button")(({ theme }) => ({
  display: "inline-flex",
  alignItems: "center",
  gap: 10,
  border: "none",
  cursor: "pointer",
  padding: "10px 18px",
  borderRadius: 999,
  color: "#fff",
  fontWeight: 700,
  background: "#6d28d9",
  boxShadow: "0 12px 30px rgba(99,102,241,0.12)",
  fontSize: 14,
  [theme.breakpoints.down("sm")]: {
    width: "100%",
    justifyContent: "center",
    padding: "12px 14px",
  },
}));


const BookingDialog = ({ open, onClose, onSave }) => {
  const [bookingData, setBookingData] = useState({
    title: '',
    duration: '30',
    description: '',
    bufferTime: '0',
    interactionType: 'voice',
    pricing: ''
  });

  const baseUrl = "/api/usersOn";
  const [apiSnack, setApiSnack] = useState({ open: false, message: "" });

// tweak limits here
const MAX_TITLE = 40;
const MAX_DESC  = 90;

  // put this near your component (or in a utils file)
const truncate = (str = "", max = 100) => {
  if (!str) return "";
  if (str.length <= max) return str;
  const slice = str.slice(0, max);
  // try to avoid cutting mid-word (fallback to hard cut)
  const cutAt = slice.lastIndexOf(" ");
  const safe = cutAt > max * 0.6 ? slice.slice(0, cutAt) : slice;
  // avoid trailing punctuation before ellipsis
  return safe.replace(/[.,;:!?-]+$/,"").trimEnd() + "...";
};



const [savingBlock, setSavingBlock] = useState(false);

const handleSave = async () => {
  setSavingBlock(true);

  // Prepare payload as object (not JSON string)
  const payload = {
    type: 'booking',
    name: bookingData.title,
    duration: bookingData.duration,
    description: bookingData.description,
    bufferTime: bookingData.bufferTime,
    interactionType: bookingData.interactionType,
    pricing: bookingData.pricing,
  };

  try {
    const res = await axios.post(baseUrl + "/save-blocks", payload, {
      withCredentials: true,
      headers: { "Content-Type": "application/json" },
    });

    const saved = res.data;

    const normalized = {
      id: saved._id || saved.id || `temp-${Date.now()}`,
      title: saved.name || payload.name,
      action: saved.action || payload.action,
      type: saved.type || payload.type,
      image: saved.image,
      raw: saved,
    };

    onSave(normalized);
    setApiSnack({ open: true, message: "Booking block added" });
    onClose();
  } catch (err) {
    console.error("saveBooking error:", err);
    const msg =
      err?.response?.data?.error ||
      err?.response?.data?.message ||
      err?.message ||
      "Could not save booking block";
    setApiSnack({ open: true, message: msg });
  } finally {
    setSavingBlock(false);
  }
};




  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Configure 1:1 Booking</DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        <Stack spacing={2.5} mt={1}>
          {/* Booking Title */}
          <TextField
            fullWidth
            label="Session Title"
            placeholder="e.g., 30-Min Consultation"
            value={bookingData.title}
            onChange={(e) => setBookingData({ ...bookingData, title: e.target.value })}
          />

          {/* Duration */}
          <TextField
            select
            fullWidth
            label="Session Duration"
            value={bookingData.duration}
            onChange={(e) => setBookingData({ ...bookingData, duration: e.target.value })}
            SelectProps={{ native: true }}
          >
            <option value="15">15 minutes</option>
            <option value="30">30 minutes</option>
            <option value="45">45 minutes</option>
            <option value="60">1 hour</option>
            <option value="90">1.5 hours</option>
            <option value="120">2 hours</option>
          </TextField>

          {/* Description */}
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Session Description"
            placeholder="Brief description of what this session includes..."
            value={bookingData.description}
            onChange={(e) => setBookingData({ ...bookingData, description: e.target.value })}
          />

          {/* Advanced Settings */}
          <Box sx={{ pt: 1 }}>
            
            <Stack spacing={2}>
              {/* Buffer Time */}
              <TextField
                select
                fullWidth
                label="Buffer Time Between Bookings"
                value={bookingData.bufferTime}
                onChange={(e) => setBookingData({ ...bookingData, bufferTime: e.target.value })}
                SelectProps={{ native: true }}
              >
                <option value="0">No buffer</option>
                <option value="5">5 minutes</option>
                <option value="10">10 minutes</option>
                <option value="15">15 minutes</option>
                <option value="30">30 minutes</option>
              </TextField>

               {/* Call Type */}
              <TextField
                select
                fullWidth
                label="Interaction Type"
                value={bookingData.interactionType}
                onChange={(e) => setBookingData({ ...bookingData, interactionType: e.target.value })}
                SelectProps={{ native: true }}
              >
                <option value="voice">Voice Meeting</option>
                <option value="video">Video Meeting</option>
              </TextField>

             
            </Stack>
          </Box>

          {/* Pricing  */}

<TextField
  fullWidth
  label="Session Price"
  placeholder="e.g., 300, 500, 900"
  type="number"
  value={bookingData.pricing}
  onChange={(e) => setBookingData({ ...bookingData, pricing: e.target.value })}
  InputProps={{
    startAdornment: (
      <InputAdornment position="start">
        <CurrencyRupee sx={{ fontSize: 18, color: '#6B7280' }} />
      </InputAdornment>
    ),
  }}
  sx={{
    '& .MuiOutlinedInput-root': {
      fontFamily: 'Inter',
      borderRadius: 2,
    },
  }}
/>


       {/* Preview */}
<Box sx={{ maxWidth : '75%'}}>
  <Typography variant="overline" sx={{ opacity: 0.7, display: "block", mb: 1 }}>
    Preview
  </Typography>
  <Paper 
    elevation={0} 
    sx={{ 
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 1.5,
      p: 1.25,
      borderRadius: 2,
      bgcolor: "#fff",
      border: (t) => `1px solid ${t.palette.divider}`,
      boxShadow: "0 10px 30px rgba(2,6,23,0.12)",
    }}
  >
    {/* Left: Icon + Title + Description */}
    <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.25, minWidth: 0, flex: 1 }}>
      <Box
        sx={{
          width: 44,
          height: 44,
          borderRadius: 1.25,
          display: "grid",
          placeItems: "center",
          bgcolor: alpha("#3b82f6", 0.06),
          color: "#3b82f6",
          flexShrink: 0,
        }}
      >
        <EventIcon sx={{ fontSize: 18 }} />
      </Box>

      <Box sx={{ display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0, flex: 1 }}>
        {/* Title */}
        <Typography
          sx={{
            fontFamily: "Inter",
            fontWeight: 600,
            fontSize: 15,
            whiteSpace: "nowrap",
            textOverflow: "ellipsis",
            overflow: "hidden",
            mb: 0.25,
          }}
          title={bookingData.title || "30-Min Consultation"}
        >
          {truncate(bookingData.title || "30-Min Consultation", MAX_TITLE)}
        </Typography>

        {/* Description */}
        {!!bookingData.description && (
          <Typography
            sx={{
              fontFamily: "Inter",
              fontSize: 12,
              color: "#9CA3AF",
              textOverflow: "ellipsis",
              mt: 0.25,
              mb: 0.5,
            }}
            title={bookingData.description}
          >
            {truncate(bookingData.description, MAX_DESC)}
          </Typography>
        )}

        {/* Duration + Meeting Type */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography
            sx={{
              fontFamily: "Inter",
              fontSize: 12,
              fontWeight: 600,
              color: "#6B7280",
            }}
          >
            {bookingData.duration || 30} mins
          </Typography>
          <Box sx={{ width: 4, height: 4, borderRadius: "50%", bgcolor: "#D1D5DB" }} />
          <Typography
            sx={{
              fontFamily: "Inter",
              fontSize: 12,
              fontWeight: 400,
              color: "#6B7280",
              whiteSpace: "nowrap",
            }}
          >
            {bookingData.interactionType === "voice" ? "Voice Meeting" : "Video Meeting"}
          </Typography>
        </Box>
      </Box>
    </Box>

    {/* Right: Action Button */}
    <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexShrink: 0 }}>
      <IconButton
        aria-label="open booking"
        onClick={(e) => {
          e.stopPropagation();
        }}
        sx={{
          width: 36,
          height: 36,
          borderRadius: 1,
          bgcolor: alpha("#3b82f6", 0.06),
          color: "#3b82f6",
          "&:hover": { bgcolor: alpha("#3b82f6", 0.14) },
        }}
        size="small"
      >
        <ArrowForwardIosIcon sx={{ fontSize: 14 }} />
      </IconButton>
    </Box>
  </Paper>
</Box>


        </Stack>
      </DialogContent>

    <DialogActions sx={{ gap: 1, p: 2 }}>
        <button
          onClick={onClose}
          style={{
            border: "none",
            background: "transparent",
            padding: "8px 12px",
            borderRadius: 8,
            cursor: "pointer",
            fontWeight: 700,
          }}
        >
          Cancel
        </button>

        <PrimaryBtn onClick={handleSave} disabled={!bookingData.title || savingBlock}>
          {savingBlock ? <CircularProgress size={18} /> : <SaveIcon />}
          <span style={{ marginLeft: 6 }}>
            {savingBlock ? "Saving..." : "Save Booking Block"}
          </span>
        </PrimaryBtn>
      </DialogActions>
    </Dialog>
  );
};

// ---------- Component ----------
export default function ProfileBlocksEditor() {
  const theme = useTheme();
  const navigate = useNavigate();
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingIntro, setIsEditingIntro] = useState(false);
  const fileInputRef = useRef(null);
  const [avatarHover, setAvatarHover] = useState(false);
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [tempLink, setTempLink] = useState("");
  const [name, setName] = useState("");
  const [userIntro, setUserIntro] = useState("");
  const [link, setLink] = useState("");
  const [copySnackOpen, setCopySnackOpen] = useState(false);
  const baseUrl = "http://localhost:8001/usersOn";
  const [userDetails, setUserDetails] = useState({});
const addCloseTimer = useRef(null);
  // ---------- Form submission dialog state ----------
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [currentFormBlock, setCurrentFormBlock] = useState(null); // the block user clicked
  const [formValues, setFormValues] = useState({}); // { fieldKey: value }
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({}); // { fieldKey: "error message" }
    const [dmEnabled, setDmEnabled] = useState(false);
    const [toggling, setToggling] = useState(false);
    const [newsletterText, setNewsletterText] = useState("Subscribe to Newsletter");
    const [newsletterDialogOpen, setNewsletterDialogOpen] = useState(false);
const [newsletterDialogText, setNewsletterDialogText] = useState("");
const [newsletterEmail, setNewsletterEmail] = useState("");
const [newsletterAccept, setNewsletterAccept] = useState(true);
const truncate = (str = "", max = 100) => {
  if (!str) return "";
  if (str.length <= max) return str;
  const slice = str.slice(0, max);
  // try to avoid cutting mid-word (fallback to hard cut)
  const cutAt = slice.lastIndexOf(" ");
  const safe = cutAt > max * 0.6 ? slice.slice(0, cutAt) : slice;
  // avoid trailing punctuation before ellipsis
  return safe.replace(/[.,;:!?-]+$/,"").trimEnd() + "...";
};

// tweak limits here
const MAX_TITLE = 40;
const MAX_DESC  = 60;




function openNewsletterDialog(block) {
  setNewsletterDialogText(block.action || block.title || "Subscribe to Newsletter");
  setNewsletterEmail("");
  setNewsletterAccept(true);
  setNewsletterDialogOpen(true);
}

function closeNewsletterDialog() {
  setNewsletterDialogOpen(false);
}
function handleSubscribe() {
  // no API call required — simply close dialog
  setNewsletterDialogOpen(false);
}

const makeWaUrl = (input, message = "") => {
  if (!input) return "";

  let raw = String(input).trim();

  // If it's already a WA link, just append message if provided
  if (/^https?:\/\/(wa\.me|api\.whatsapp\.com)/i.test(raw)) {
    if (message) {
      const sep = raw.includes("?") ? "&" : "?";
      return `${raw}${sep}text=${encodeURIComponent(message)}`;
    }
    return raw;
  }

  // Strip everything except digits and a leading +
  raw = raw.replace(/[^\d+]/g, "");
  // wa.me path should NOT contain '+'
  raw = raw.replace(/^\+/, "");

  let url = `https://wa.me/${raw}`;
  if (message) url += `?text=${encodeURIComponent(message)}`;
  return url;
};




  function openFormDialog(block) {
    // block.raw.fields OR JSON in block.action
    let fields = block.raw?.fields;
    if (!fields && typeof block.action === "string") {
      try {
        fields = JSON.parse(block.action).fields;
      } catch {}
    }
    fields = fields || [];

    // Build initial values object using field.key (fallback to label)
    const values = {};
    fields.forEach((f, i) => {
      const key =
        f.key ||
        f.name ||
        f.label?.toLowerCase().replace(/\s+/g, "_") ||
        uid("fldkey");
      if (f.type === "radio") {
        // default to empty so user must choose (change to f.options?.[0] to auto-select)
        values[key] = "";
      } else {
        values[key] = "";
      }
    });

    setCurrentFormBlock({
      ...block,
      _renderFields: fields.map((f, i) => ({ ...f, _key: f.key || `f_${i}` })),
    });
    setFormValues(values);
    setFormErrors({});
    setFormDialogOpen(true);
  }

  function closeFormDialog() {
    setFormDialogOpen(false);
    setCurrentFormBlock(null);
    setFormValues({});
    setFormErrors({});
  }

  // Social state
  const [socials, setSocials] = useState([]); // list fetched from backend
  const [loadingSocials, setLoadingSocials] = useState(false);
  const [addingSocial, setAddingSocial] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState(null); // 'youtube' | 'twitter' ...
  const [socialUrl, setSocialUrl] = useState("");
  const [socialApiMsg, setSocialApiMsg] = useState(null);

  const PLATFORMS = [
    { key: "youtube", label: "YouTube", Icon: YouTubeIcon },
    { key: "twitter", label: "Twitter", Icon: TwitterIcon },
    { key: "linkedin", label: "LinkedIn", Icon: LinkedInIcon },
    { key: "whatsapp", label: "WhatsApp", Icon: WhatsAppIcon },
    { key: "instagram", label: "Instagram", Icon: InstagramIcon },
  ];

  const availablePlatforms = PLATFORMS.filter(
    (p) =>
      !socials.some(
        (s) => String(s.platform).toLowerCase() === String(p.key).toLowerCase()
      )
  );

  // blocks + drag & drop
  const [blocks, setBlocks] = useState([]);
  const [draggingId, setDraggingId] = useState(null);

  // Add block dialog
  const [addOpen, setAddOpen] = useState(false);
  const [newBlockName, setNewBlockName] = useState("");
  const [newBlockAction, setNewBlockAction] = useState("");
  const [tab, setTab] = useState("link");

// Per-slot uploading flags (so each slot shows its own spinner)
const [uploadingHeader, setUploadingHeader] = useState({
  headerImage1: false,
  headerImage2: false,
  headerImage3: false,
});

// maps the frontend key to the position value the backend accepts
function positionForKey(key) {
  switch (key) {
    case "headerImage1":
    case "leftHeadImage":
      return "left";           // backend will normalize to leftHeadImage
    case "headerImage2":
    case "rightTopImage":
      return "rightTop";       // backend -> rightTopImage
    case "headerImage3":
    case "rightBottomImage":
      return "rightBottom";    // backend -> rightBottomImage
    default:
      return null;
  }
}

  async function fetchStoreStatus() {
    try {
      // If you already have an endpoint to get status, adjust path accordingly.
      const res = await axios.get(`${baseUrl}/dm-inbox-status`, { withCredentials: true });
      // Expect { enabled: true/false }
      if (res?.data?.enabled !== undefined) setDmEnabled(Boolean(res.data.enabled));
    } catch (err) {
      // If /store-status is not available, silently ignore. You can remove this catch or show a toast.
      console.warn("Could not fetch store status (expected GET /store-status).", err);
    }
  }

 async function toggleStoreEnabled(nextValue) {
    // optimistic UI
    const previous = dmEnabled;
    setDmEnabled(nextValue);
    setToggling(true);

    try {
      // backend router expected: POST /enable-store
      // sending { enabled: true/false } in body
      await axios.post(
        `${baseUrl}/enable-dm-inbox`,
        { enabled: nextValue },
        { withCredentials: true }
      );
     
      if(nextValue){
        toast.success('DM Feature is Enabled');
      }
      else{
        toast.warning('DM Feature is Disabled');
      }
          await fetchData();
      // success — nothing else required, state already updated
    } catch (err) {
      console.error("Error toggling store enable:", err);
      // revert optimistic update
      setDmEnabled(previous);
      alert("Failed to update store status. Please try again.");
    } finally {
      setToggling(false);
    }
  }

async function handleHeaderImageChange(e, key) {
  const file = e?.target?.files?.[0];
  if (!file) return;

  const slotKey = key || "headerImage1";
  const position = positionForKey(slotKey);
  if (!position) {
    console.warn("Unknown header image key", slotKey);
    return;
  }

  try {
    // show spinner for this slot
    setUploadingHeader((s) => ({ ...s, [slotKey]: true }));

    const fd = new FormData();
    fd.append("image", file);
    fd.append("position", position);

    // send to your endpoint - using baseUrl from earlier
    const res = await axios.post(`${baseUrl}/upload-header-image`, fd, {
      withCredentials: true,
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (progressEvent) => {
        // optional: you could track progressEvent.loaded / total here
      },
    });

    if (res?.data?.success) {
      // server returns updated user doc or url — prefer returned user fields if present
      const returnedUser = res.data.user;
      if (returnedUser) {
        // merge the three fields if returned
        setUserDetails((prev) => ({
          ...prev,
          leftHeadImage: returnedUser.leftHeadImage ?? prev.leftHeadImage,
          rightTopImage: returnedUser.rightTopImage ?? prev.rightTopImage,
          rightBottomImage: returnedUser.rightBottomImage ?? prev.rightBottomImage,
        }));
      } else if (res.data.url) {
        // fallback: update only the target field locally from returned URL
        // convert returnedField to local key (server uses leftHeadImage/rightTopImage/rightBottomImage)
        const returnedField = res.data.updatedField;
        if (returnedField) {
          setUserDetails((prev) => ({ ...prev, [returnedField]: res.data.url }));
        }
      }

      setApiSnack({ open: true, message: "Image uploaded" });
    } else {
      setApiSnack({ open: true, message: res?.data?.message || "Upload failed" });
      console.error("upload failed response", res?.data);
    }
  } catch (err) {
    console.error("upload error", err);
    setApiSnack({ open: true, message: err?.response?.data?.message || err.message || "Upload failed" });
  } finally {
    // hide spinner for this slot
    setUploadingHeader((s) => ({ ...s, [slotKey]: false }));
    // clear the file input value so the same file can be reselected if needed
    try { e.target.value = ""; } catch (ignore) {}
  }
}




  // --- Form tab state (dynamic fields) ---
  const [formFields, setFormFields] = useState([]);

  const uid = (prefix = "f") =>
    `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  function defaultFormFields() {
    return [
      {
        id: uid("name"),
        key: "name",
        label: "Name",
        type: "text",
        placeholder: "",
        required: true,
      },
    ];
  }

  function addFormField() {
    setFormFields((s) => [
      ...s,
      {
        id: uid("fld"),
        key: `field_${s.length + 1}`,
        label: "New field",
        type: "text",
        placeholder: "",
        required: false,
      },
    ]);
  }




  function updateFormField(id, patch) {
    setFormFields((s) => s.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  }

  function removeFormField(id) {
    setFormFields((s) => s.filter((f) => f.id !== id));
  }

  // --------- NEW: Add Field hover/menu state + helpers ----------
  // ---------- Add Field hover/menu state + helpers (single robust implementation) ----------
  const [addAnchor, setAddAnchor] = useState(null);

  const ADD_FIELD_TYPES = [
    { value: "text", label: "Text" },
    { value: "tel", label: "Phone" },
    { value: "email", label: "Email" },
    { value: "radio", label: "Radio" },
  ];

  // Accept either an Event (from mouse event / click) OR an element reference (e.currentTarget)
  function openAddMenu(targetOrEvent) {
    // cancel any pending close timer
    if (addCloseTimer.current) {
      clearTimeout(addCloseTimer.current);
      addCloseTimer.current = null;
    }

    // if caller passed an event, use currentTarget; otherwise assume it's the anchor element
    const anchor = targetOrEvent?.currentTarget ?? targetOrEvent ?? null;
    setAddAnchor(anchor);
  }

  function closeAddMenu(withDelay = true) {
    // clear any existing timer first
    if (addCloseTimer.current) {
      clearTimeout(addCloseTimer.current);
      addCloseTimer.current = null;
    }

    if (withDelay) {
      // small delay so mouse can transit from button -> menu
      addCloseTimer.current = setTimeout(() => {
        setAddAnchor(null);
        addCloseTimer.current = null;
      }, 160);
    } else {
      setAddAnchor(null);
    }
  }

  function createFieldOfType(type) {
    const id = uid("fld");
    const base = {
      id,
      key: `field_${Date.now().toString(36).slice(2, 7)}`,
      label: type === "radio" ? "Gender" : "New field",
      placeholder: "",
      required: false,
      type,
    };

    if (type === "radio") {
      base.options = ["Male", "Female"];
    }

    setFormFields((s) => [...s, base]);
    closeAddMenu(false);
  }


  // API/loading states
  const [loadingBlocks, setLoadingBlocks] = useState(false);
  const [loading, setLoading] = useState(false);
  const [savingBlock, setSavingBlock] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [apiSnack, setApiSnack] = useState({ open: false, message: "" });

  const api = axios.create({ baseURL: baseUrl || "", withCredentials: true });

  useEffect(() => {
    fetchSocials();
    fetchStoreStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchSocials() {
    setLoadingSocials(true);
    try {
      const res = await api.get("/user/socials");
      setSocials(res.data.socials || []);
    } catch (err) {
      console.error("fetchSocials", err);
      setSocialApiMsg("Failed to load socials");
    } finally {
      setLoadingSocials(false);
    }
  }

  async function saveSocial() {
    if (!selectedPlatform || !socialUrl.trim()) {
      setSocialApiMsg("Pick a platform and enter a URL");
      return;
    }
    setAddingSocial(true);
    try {
      const payload = { platform: selectedPlatform, url: socialUrl.trim() };
      const res = await api.post("/user/socials", payload);
      const added = res.data.social;
      if (added) {
        setSocials((s) => [...s, added]);
      } else {
        await fetchSocials();
      }
      setSelectedPlatform(null);
      setSocialUrl("");
      setSocialApiMsg("Saved");
    } catch (err) {
      console.error("saveSocial", err);
      setSocialApiMsg(err?.response?.data?.message || "Failed to save");
    } finally {
      setAddingSocial(false);
      setTimeout(() => setSocialApiMsg(null), 2000);
    }
  }

  async function deleteSocial(id) {
    try {
      await api.delete(`/user/socials/${id}`);
      setSocials((s) => s.filter((x) => String(x._id || x.id) !== String(id)));
    } catch (err) {
      console.error("deleteSocial", err);
      setSocialApiMsg("Delete failed");
      setTimeout(() => setSocialApiMsg(null), 2000);
    }
  }

  const handleSessionExpired = () => {
    toast.error("Session expired. Please log in again.");
    setTimeout(() => {
      navigate("/professional/login");
    }, 2000);
  };

  useEffect(() => {
    const verifyToken = async () => {
      setLoading(true);

      try {
        const res = await axios.get(`${baseUrl}/verify-login-token`, {
          withCredentials: true,
        });

        if (res.data.valid) {
          fetchData();
        } else {
          handleSessionExpired();
        }
      } catch (error) {
        if (
          error.response &&
          (error.response.status === 401 || error.response.status === 403)
        ) {
          handleSessionExpired();
        } else {
          toast.error("Network error, please try again later.");
          handleSessionExpired();
        }
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchData = async () => {
    try {
      const ress = await axios.get(baseUrl + "/get-user-details", {
        withCredentials: true,
      });
      if (ress.data.success) {
        setUserDetails(ress.data.data);
        setName(ress.data.data.name || "");
        // The backend may not have an intro yet; use .intro if present
        setUserIntro(ress.data.data.intro || "");
      } else {
        setLoading(false);
        toast.error("Session expired. Please log in again.");
        setTimeout(() => {
          navigate("/professional/login");
        }, 2000);
      }
    } catch (e) {
      setLoading(false);
      toast.error("Network error. Please log in again.");
      setTimeout(() => {
        navigate("/professional/login");
      }, 2000);
    }
  };

  // ---------- Effects ----------
  useEffect(() => {
    fetchBlocks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchBlocks() {
    setLoadingBlocks(true);
    try {
      const res = await axios.get(baseUrl + "/fetch-blocks", {
        withCredentials: true,
      });
      const data = res.data;

      const normalized = (data || []).map((b) => ({
        id: b._id || b.id,
        title: b.name || b.title || "",
        action: b.action || b.url || "",
        type: b.type || "link",
        image: b.image,
        raw: b,
      }));

      setBlocks(
        normalized.sort((a, b) => {
          const ao = a.raw?.order ?? 0;
          const bo = b.raw?.order ?? 0;
          return ao - bo;
        })
      );
    } catch (err) {
      console.error("fetchBlocks error:", err);
      const msg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        "Failed to load blocks";
      setApiSnack({ open: true, message: msg });
    } finally {
      setLoadingBlocks(false);
    }
  }

  // ---------- Handlers ----------
  function handleAvatarClick() {
    fileInputRef.current?.click();
  }
  function handleFileChange(e) {
    // handle avatar update if needed
  }

  function openCustomize() {
    setTempLink(userDetails.handleUserName);
    setCustomizeOpen(true);
  }
  function saveCustomize() {
    setLink(userDetails.handleUserName);
    setCustomizeOpen(false);
  }

  function openAdd() {
    setNewBlockName("");
    setNewBlockAction("");
    setTab("link");
    setFormFields([]); // ensure Name exists by default
    setAddOpen(true);
  }

async function saveAdd() {
  // Basic validation per tab
  if (tab === "form") {
    if (!newBlockName.trim() && formFields.length === 0) return;
  } else if (tab === "newsletter") {
    if (!newsletterText || !newsletterText.trim()) return;
  } else {
    // link/video/other non-form types require a name as before
    if (!newBlockName.trim()) return;
  }

  setSavingBlock(true);

  // map frontend tab to block type
  const type = tab === "video" ? "video" : tab === "form" ? "form" : tab === "newsletter" ? "newsletter" : "link";

  const payload = {
    name: newBlockName.trim() || (type === "form" ? "Contact form" : type === "newsletter" ? "Newsletter" : "Untitled"),
    action: newBlockAction?.trim() || "", // fallback, newsletter will supply newsletterText separately
    type,
  };

  // attach newsletterText when saving a newsletter
  if (type === "newsletter") {
    payload.newsletterText = (newsletterText || "").trim();
    // also populate action with the text (keeps backward compatibility & preview)
    payload.action = payload.newsletterText;
  }

  if (type === "form") {
    // Ensure each field is normalized and includes options if present
    payload.fields = formFields.map(({ id, ...rest }) => {
      let opts = rest.options;
      if (typeof opts === "string") {
        opts = opts.split(",").map((s) => s.trim()).filter(Boolean);
      }
      if (!Array.isArray(opts)) opts = opts === undefined ? [] : [String(opts)];
      return { ...rest, options: opts };
    });
    // store a JSON preview in action for backwards compatibility
    payload.action = JSON.stringify({ fields: payload.fields });
  }

  try {
    const res = await axios.post(baseUrl + "/save-blocks", payload, {
      withCredentials: true,
      headers: { "Content-Type": "application/json" },
    });

    const saved = res.data;

    const normalized = {
      id: saved._id || saved.id || `temp-${Date.now()}`,
      title: saved.name || payload.name,
      action: saved.action || payload.action,
      type: saved.type || payload.type,
      image: saved.image,
      raw: saved,
    };

    setBlocks((s) => [...s, normalized]);
    setAddOpen(false);
    setApiSnack({ open: true, message: "Block added" });
  } catch (err) {
    console.error("saveAdd error:", err);
    const msg =
      err?.response?.data?.error ||
      err?.response?.data?.message ||
      err?.message ||
      "Could not save block";
    setApiSnack({ open: true, message: msg });
  } finally {
    setSavingBlock(false);
  }
}



  async function deleteBlock(id) {
    // optimistic UI: show spinner for the deleting item
    setDeletingId(id);
    try {
      // call authenticated backend delete route
      const res = await api.delete(`/delete-block/${id}`);
      if (res.status === 200 && res.data.success !== false) {
        // remove locally
        setBlocks((s) => s.filter((b) => b.id !== id));
        setApiSnack({ open: true, message: "Block deleted" });
      } else {
        // server returned failure
        const msg = (res.data && (res.data.message || res.data.error)) || "Delete failed";
        setApiSnack({ open: true, message: msg });
      }
    } catch (err) {
      console.error("deleteBlock error:", err);
      const msg = err?.response?.data?.message || "Failed to delete";
      setApiSnack({ open: true, message: msg });
    } finally {
      setDeletingId(null);
    }
  }

  // Drag & Drop (native)
  function onDragStart(e, id) {
    setDraggingId(id);
    e.dataTransfer.effectAllowed = "move";
    try {
      e.dataTransfer.setData("text/plain", id);
    } catch {}
  }
  function onDragOver(e, overId) {
    e.preventDefault();
    if (!draggingId || draggingId === overId) return;
    setBlocks((prev) => {
      const arr = [...prev];
      const from = arr.findIndex((x) => x.id === draggingId);
      const to = arr.findIndex((x) => x.id === overId);
      if (from === -1 || to === -1) return prev;
      const [item] = arr.splice(from, 1);
      arr.splice(to, 0, item);
      return arr;
    });
  }

  // Persist order when drag ends
  async function onDragEnd() {
    setDraggingId(null);
    // Persist current order to backend
    await saveBlocksOrder();
  }

  // Save blocks order to backend
  async function saveBlocksOrder() {
    try {
      // prepare payload with id and order index (smaller index => higher)
      const payload = blocks.map((b, idx) => ({
        id: b.id,
        order: idx + 1, // 1-based order
      }));

      await api.post("/update-block-order", { order: payload }, { headers: { "Content-Type": "application/json" } });
      setApiSnack({ open: true, message: "Order saved" });
    } catch (err) {
      console.error("saveBlocksOrder", err);
      setApiSnack({ open: true, message: "Failed to save order" });
    }
  }

  // ---------- Preview rendering helpers ----------
  function renderPreviewBlock(b) {
    if (b.type === "link" || b.type === "cta") {
      return (
        <Paper
          key={b.id}
          sx={{
            p: 1.5,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderRadius: 2,
            color: "#0f1724",
            boxShadow: "0 10px 30px rgba(2,6,23,0.35)",
            cursor: "pointer",
            textAlign: "left",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 2, sm: 3, md: 3 } }}>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: 1.5,
                bgcolor: "#F0F0F0",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                // overflow: "hidden",
                flexShrink: 0,
              }}
            >
              <LinkIcon sx={{ fontSize: 16 }} />
            </Box>

            <Box>
              <Typography sx={{ fontFamily: "Inter", fontSize: "14px", fontWeight: 500 }}>{b.title}</Typography>
            </Box>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <ArrowForwardIosIcon sx={{ fontSize: 16, color: "rgba(15,23,42,0.5)" }} />
          </Box>
        </Paper>
      );
    }

    if (b.type === "product") {
      const hasImage = !!b.image;
      const isStringImage = hasImage && typeof b.image === "string";

      return (
        <Paper
          key={b.id}
          sx={{
            p: 1.5,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderRadius: 2,
            color: "#0f1724",
            boxShadow: "0 10px 30px rgba(2,6,23,0.35)",
            cursor: "pointer",
            textAlign: "left",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 2, sm: 3, md: 3 } }}>
            {isStringImage ? (
              <Box
                component="img"
                src={b.image}
                alt={b.title || "product image"}
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: 1.5,
                  objectFit: "cover",
                  display: "block",
                  flexShrink: 0,
                }}
              />
            ) : hasImage && React.isValidElement(b.image) ? (
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: 1.5,
                  // overflow: "hidden",
                  flexShrink: 0,
                }}
              >
                {b.image}
              </Box>
            ) : (
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: 1.5,
                  bgcolor: "#e9e7ff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Typography variant="caption" sx={{ color: "#6b21a8", fontWeight: 700 }}>
                  IMG
                </Typography>
              </Box>
            )}

            <Box>
              <Typography sx={{ fontFamily: "Inter", fontSize: "14px", fontWeight: 500 }}>{b.title}</Typography>
            </Box>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <ArrowForwardIosIcon sx={{ fontSize: 16, color: "rgba(15,23,42,0.5)" }} />
          </Box>
        </Paper>
      );
    }

    if (b.type === "video") {
      const ytId = getYouTubeId(b.action || "");
      const thumb = ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : null;

      return (
        <Paper
          key={b.id}
          sx={{
            p: 0,
            borderRadius: 2,
            border: "1px solid #37353E",
            // borderColor: '#FFFFFF',
            boxShadow: "0 10px 30px rgba(2,6,23,0.12)",
            cursor: b.action ? "pointer" : "default",
            overflow: "hidden",
          }}
          onClick={() => {
            if (b.action) window.open(b.action, "_blank");
          }}
          elevation={0}
        >
          <Box sx={{ position: "relative", width: "100%", aspectRatio: "16/9", bgcolor: "#000" }}>
            {thumb ? (
              <Box
                component="img"
                src={thumb}
                alt={b.title || "video thumbnail"}
                sx={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  objectPosition: "center",
                  display: "block",
                }}
              />
            ) : (
              <Box
                sx={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  bgcolor: "#F3F4F6",
                }}
              >
                <MovieIcon sx={{ fontSize: 28, color: "rgba(15,23,42,0.6)" }} />
              </Box>
            )}

            <Box
              sx={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                pointerEvents: "none",
              }}
            >
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: "50%",
                  bgcolor: "rgba(0,0,0,0.55)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 6px 18px rgba(2,6,23,0.28)",
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                  <path d="M8 5v14l11-7L8 5z" fill="#fff" />
                </svg>
              </Box>
            </Box>
          </Box>
        </Paper>
      );
    }

    if (b.type === "form") {
      // fields may be in b.raw.fields or JSON in b.action
      let fields = b.raw?.fields;
      if (!fields && typeof b.action === "string") {
        try {
          fields = JSON.parse(b.action).fields;
        } catch {}
      }
      return (
        <Paper key={b.id} sx={{ p: 1.5, borderRadius: 2, cursor: "pointer" }} onClick={() => openFormDialog(b)}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: 1.25,
                display: "grid",
                placeItems: "center",
                bgcolor: alpha("#10b981", 0.06),
                color: "#10b981",
                flexShrink: 0,
              }}
            >
              <AddIcon sx={{ fontSize: 18 }} />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontFamily: "Inter", fontSize: "14px", fontWeight: 600 }}>{b.title || "Contact form"}</Typography>
            </Box>
            <Box>
              <ArrowForwardIosIcon sx={{ fontSize: 16, color: "rgba(15,23,42,0.5)" }} />
            </Box>
          </Box>
        </Paper>
      );
    }

 if (b.type === "newsletter") {
  return (
    <Paper
      key={b.id}
      sx={{
        p: 2,
        borderRadius: 2,
        bgcolor: "#FFFFFF",
        border: "2px solid #E5E7EB",
        boxShadow: "none",
        cursor: "pointer",
        transition: "all .2s ease",
        "&:hover": {
          borderColor: "#1F2937",
          transform: "translateY(-2px)",
          boxShadow: "0 8px 24px rgba(0, 0, 0, 0.08)",
        },
      }}
      onClick={() => openNewsletterDialog(b)}
      elevation={0}
    >
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5, mb: 2 }}>
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: 1.5,
            display: "grid",
            placeItems: "center",
            bgcolor: "#F3F4F6",
            flexShrink: 0,
          }}
        >
          <MailOutlinedIcon sx={{ fontSize: 18, color: "#1F2937" }} />
        </Box>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            sx={{
              fontFamily: "Inter",
              fontSize: 14,
              fontWeight: 600,
              color: "#1F2937",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              mb: 0.25,
            }}
            title={b.action || b.title || "Subscribe to Newsletter"}
          >
            {b.action || b.title || "Newsletter"}
          </Typography>
          <Typography
            sx={{
              fontFamily: "Inter",
              fontSize: 12,
              fontWeight: 400,
              color: "#6B7280",
            }}
          >
            Stay updated with our latest news
          </Typography>
        </Box>
      </Box>

      {/* Input Row */}
      <Box
        sx={{
          display: "flex",
          alignItems: "stretch",
          gap: 1,
          bgcolor: "#F9FAFB",
          borderRadius: 1.5,
          p: 0.5,
          border: "1px solid #E5E7EB",
        }}
      >
        <Box
          sx={{
            flex: 1,
            px: 1.5,
            display: "flex",
            alignItems: "center",
          }}
        >
          <Typography
            sx={{
              fontFamily: "Inter",
              fontSize: 13,
              fontWeight: 400,
              color: "#9CA3AF",
            }}
          >
            Enter your email
          </Typography>
        </Box>

        <Box
          sx={{
            px: 2,
            py: 0.75,
            borderRadius: 1,
            bgcolor: "#1F2937",
            color: "#FFFFFF",
            fontFamily: "Inter",
            fontWeight: 600,
            fontSize: 13,
            whiteSpace: "nowrap",
            display: "flex",
            alignItems: "center",
            gap: 0.5,
            cursor: "pointer",
            transition: "all .15s ease",
            "&:hover": {
              bgcolor: "#111827",
            },
          }}
        >
          Subscribe
          <ArrowForwardIosIcon sx={{ fontSize: 11 }} />
        </Box>
      </Box>
    </Paper>
  );
}


if (b.type === "booking") {
  // Extract booking data from b.raw or parse from b.action
  let bookingConfig = {};
  if (b.raw?.duration) {
    bookingConfig = {
      duration: b.raw.duration,
      description: b.raw.description || "",
      interactionType: b.raw.interactionType || "voice",
    };
  } else if (typeof b.action === "string") {
    try {
      bookingConfig = JSON.parse(b.action);
    } catch {}
  }

  const isMeetingType = bookingConfig.interactionType === "voice"
    ? "Voice Meeting"
    : "Video Meeting";

  return (
    <Paper
      key={b.id}
      elevation={0}
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 1.5,
        p: 1.25,
        borderRadius: 2,
        bgcolor: "#fff",
        boxShadow: "0 10px 30px rgba(2,6,23,0.12)",
        cursor: "pointer",
        transition: "transform .12s ease, box-shadow .12s ease",
        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow: "0 12px 30px rgba(2,6,23,0.16)",
        },
      }}
      // onClick={() => openBookingDialog?.(b)}
    >
      {/* Left: Icon + Title + Description */}
      <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.25, minWidth: 0, flex: 1 }}>
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: 1.25,
            display: "grid",
            placeItems: "center",
            bgcolor: alpha("#3b82f6", 0.06),
            color: "#3b82f6",
            flexShrink: 0,
          }}
        >
          <EventIcon sx={{ fontSize: 18 }} />
        </Box>

        <Box sx={{ display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0, flex: 1 }}>
          {/* Title */}
          <Typography
            sx={{
              fontFamily: "Inter",
              fontWeight: 600,
              fontSize: 15,
              mb: 0.25,
            }}
          >
            {truncate(b.title || "1:1 Booking", MAX_TITLE)}
          </Typography>

           {/* Description */}
          {bookingConfig.description && (
            <Typography
              sx={{
                fontFamily: "Inter",
                fontSize: 12,
                color: "#9CA3AF",
                mt: 0.25,
              }}
            >
              {truncate(bookingConfig.description, MAX_DESC)}
            </Typography>
          )}

          {/* Duration + Meeting Type */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5 }}>
            <Typography
              sx={{
                fontFamily: "Inter",
                fontSize: 12,
                fontWeight: 600,
                color: "#6B7280",
              }}
            >
              {bookingConfig.duration || 30} mins
            </Typography>
            <Box sx={{ width: 4, height: 4, borderRadius: "50%", bgcolor: "#D1D5DB" }} />
            <Typography
              sx={{
                fontFamily: "Inter",
                fontSize: 12,
                fontWeight: 400,
                color: "#6B7280",
                whiteSpace: "nowrap",
              }}
            >
              {isMeetingType}
            </Typography>
          </Box>

         
        </Box>
      </Box>

      {/* Right: Action Button */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexShrink: 0 }}>
        <IconButton
          aria-label="open booking"
          onClick={(e) => {
            e.stopPropagation();
            // openBookingDialog?.(b);
          }}
          sx={{
            width: 36,
            height: 36,
            borderRadius: 1,
            bgcolor: alpha("#3b82f6", 0.06),
            color: "#3b82f6",
            "&:hover": { bgcolor: alpha("#3b82f6", 0.14) },
          }}
          size="small"
        >
          <ArrowForwardIosIcon sx={{ fontSize: 14 }} />
        </IconButton>
      </Box>
    </Paper>
  );
}



    return (
      <Paper key={b.id} sx={{ p: 1.5 }}>
        <Typography>{b.title}</Typography>
      </Paper>
    );
  }

  // ---------- copy to clipboard ----------
  async function copyToClipboard() {
    const text = userDetails.handleUserName + ".myhandle.in" || "";
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.setAttribute("readonly", "");
        ta.style.position = "absolute";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setCopySnackOpen(true);
    } catch (err) {
      setCopySnackOpen(true);
      console.error("Copy failed", err);
    }
  }

  // ---------- YouTube preview helper ----------
  const getYouTubeId = (url) => {
    if (!url) return null;
    try {
      const u = new URL(url);
      if (u.hostname.includes("youtube.com")) return u.searchParams.get("v");
      if (u.hostname === "youtu.be") return u.pathname.slice(1);
    } catch (e) {
      return null;
    }
    return null;
  };

  const renderYouTubePreview = (url) => {
    const id = getYouTubeId(url);
    if (!id) {
      return (
        <Box sx={{ p: 2 }}>
          <Typography variant="body2" sx={{ opacity: 0.75 }}>
            Paste a YouTube URL (e.g. https://youtu.be/xxxx or https://www.youtube.com/watch?v=xxxx) to preview it here.
          </Typography>
          {url && (
            <Typography variant="caption" sx={{ display: "block", mt: 1, wordBreak: "break-all" }}>
              {url}
            </Typography>
          )}
        </Box>
      );
    }

    const src = `https://www.youtube.com/embed/${id}`;
    return (
      <Box sx={{ position: "relative", pt: "56.25%" }}>
        <iframe
          title="youtube-preview"
          src={src}
          style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </Box>
    );
  };

  // ---------- Save profile changes (name / intro) ----------
  async function saveProfileField(payload) {
    try {
      const res = await api.post("/update-profile", payload, { headers: { "Content-Type": "application/json" } });
      if (res.data.success) {
        // merge into local userDetails
        setUserDetails((prev) => ({ ...prev, ...payload }));
        if (payload.name !== undefined) setName(payload.name);
        if (payload.intro !== undefined) setUserIntro(payload.intro);
        setApiSnack({ open: true, message: "Saved" });
      } else {
        setApiSnack({ open: true, message: res.data.message || "Save failed" });
      }
    } catch (err) {
      console.error("saveProfileField", err);
      setApiSnack({ open: true, message: "Failed to save" });
    }
  }

  // Called when user presses save icon or leaves field
  const handleSaveName = async () => {
    setIsEditingName(false);
    if ((userDetails.name || "") === name) return; // no change
    await saveProfileField({ name });
  };

  const handleSaveIntro = async () => {
    setIsEditingIntro(false);
    if ((userDetails.intro || "") === userIntro) return;
    await saveProfileField({ intro: userIntro });
  };

  return (

    <>
    <Box sx={{ p: { xs: 0, sm: 0, md: 1 }, py: 1,  minHeight: '100dvh', overflowY: 'auto', mb: 2  }}>
      <ToastContainer />
      {/* ROW 1: FULL WIDTH HEADER */}
          <Paper
            sx={{
              p: { xs: 2, sm: 3 },
              background: "#FFFFFF",
            }}
          >
            {/* Avatar + edit */}
            {/* <Stack sx={{ display: "flex", flexDirection: "row", gap: 2 }}> */}
        <Grid container spacing={1} >

  <Grid size={{ xs: 12, md: 2}}>
    <Box
      sx={{
        width: "100%",
        height: 140,
        borderRadius: 2,
        bgcolor: "#f4f4f4",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        overflow: "hidden",
      }}
      onClick={() => document.getElementById("image-upload-1")?.click()}
    >
      {uploadingHeader.headerImage1 ? (
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", height: "100%" }}>
          <CircularProgress size={28} />
        </Box>
      ) : userDetails?.leftHeadImage ? (
        <Box
          component="img"
          src={userDetails.leftHeadImage}
          alt="Header Left"
          sx={{
            width: "100%",
            height: "100%",
            objectFit: "contain",     // <-- show full image without cropping
            objectPosition: "center",
            backgroundColor: "#f4f4f4",
          }}
        />
      ) : (
        <Typography variant="body2" color="text.secondary">
          Add Image
        </Typography>
      )}

      <input
        id="image-upload-1"
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={(e) => handleHeaderImageChange(e, "headerImage1")}
      />
    </Box>
  </Grid>

  <Grid size={{ xs: 12, md: 6}}>
     <Box sx={{ display: "flex", flexDirection: "column" }}>
                {/* Name + role */}
                <Box sx={{ flex: 1, width: "100%" }}>
                  {!isEditingName ? (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                      <Typography
                        sx={{ fontFamily: "Inter", fontSize: "18px", fontWeight: 600, cursor: "pointer", wordBreak: "break-word" }}
                        onClick={() => setIsEditingName(true)}
                      >
                        {name || "Your name"}
                      </Typography>
                      <IconButton onClick={() => setIsEditingName(true)} aria-label="edit-name">
                        <EditIcon sx={{ fontSize: "16px" }} />
                      </IconButton>
                    </Box>
                  ) : (
                    <Box sx={{ display: "flex", gap: 1, alignItems: "center", width: "100%" }}>
                      <TextField
                        size="small"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onBlur={handleSaveName}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleSaveName();
                          }
                        }}
                        inputProps={{ maxLength: 60 }}
                        sx={{ flex: 1 }}
                      />
                      <IconButton color="primary" onClick={handleSaveName} aria-label="save-name">
                        <SaveIcon />
                      </IconButton>
                    </Box>
                  )}
                </Box>

                <Box >
                  {!isEditingIntro ? (
                    <Box sx={{ display: "flex", gap: 1, flexDirection: "row" }}>
                      <Typography
                        sx={{ fontFamily: "Inter", fontSize: "15px", fontWeight: 500, cursor: "pointer", wordBreak: "break-word", color: "grey" }}
                        onClick={() => setIsEditingIntro(true)}
                      >
                        {userIntro || "Write a short intro..."}
                      </Typography>
                      <IconButton onClick={() => setIsEditingIntro(true)} aria-label="edit-intro">
                        <EditIcon sx={{ fontSize: "16px" }} />
                      </IconButton>
                    </Box>
                  ) : (
                    <Box sx={{ display: "flex", gap: 1, flexDirection : 'row' }}>
                      <TextField
                        size="small"
                        value={userIntro}
                        onChange={(e) => setUserIntro(e.target.value)}
                        onBlur={handleSaveIntro}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveIntro();
                        }}
                        inputProps={{ maxLength: 160 }}
                        sx={{ flex: 1 }}
                      />
                      <IconButton color="primary" onClick={handleSaveIntro} aria-label="save-intro">
                        <SaveIcon />
                      </IconButton>
                    </Box>
                  )}
                </Box>

                  <Box>
            <Stack sx={{ display : 'flex', flexDirection : 'column', justifyContent : 'space-between', mt: 1.5}}>
            
            <Stack sx={{ display : 'flex', flexDirection : 'row', gap: 2, alignItems : 'center'}}>

              <Typography>
                {toggling ? "Updating..." : "Enable DM (Direct Message)"}
              </Typography>

   <FormControlLabel
                    control={
                      <Switch
                        checked={dmEnabled}
                        onChange={(e) => toggleStoreEnabled(e.target.checked)}
                        disabled={toggling}
                        inputProps={{ "aria-label": "Enable DM(Direct Message)" }}
                      />
                    }
                  />

            </Stack>
                  


               <Typography>
              Activate this feature to allow users to send you messages directly.
              </Typography>



             

            </Stack>
                
        
                </Box>

              </Box>
  </Grid>

  <Grid size={{ xs: 12, md: 4}}>
       {/* URL + actions: stack on mobile */}
            <Box
              sx={{
                minWidth: { xs: "100%", sm: 320 },
                textAlign: "right",
                mt: { xs: 1.5, sm: 0 },
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  gap: 1,
                  alignItems: "center",
                  justifyContent: "flex-end",
                  mt: 1,
                  flexDirection: { xs: "column", sm: "row" },
                }}
              >
        

                <Box sx={{ width: { xs: "100%", sm: "auto" } }}>
                  <HandleBtn title="Customize Link" onClick={() => window.open(`https://${userDetails.handleUserName}.myhandle.in`, "_blank", "noopener, noreferrer")}>
                    <LinkIcon style={{ fontSize: 18, cursor: "pointer" }} />
                    <Typography sx={{ fontFamily: "Inter", fontSize: 14, fontWeight: 500, wordBreak: "break-all", color: "#000000" }}>
                      {userDetails.handleUserName ? userDetails.handleUserName + ".myhandle.in" : "yourhandle.myhandle.in"}
                    </Typography>
                  </HandleBtn>
                </Box>

                <Box sx={{ width: { xs: "100%", sm: "auto" } }}>
                  <ShareUrlBtn onClick={copyToClipboard} aria-label="copy-link">
                    <ShareIcon style={{ fontSize: 16 }} />
                    Share
                  </ShareUrlBtn>
                </Box>
              </Box>
            </Box>
  </Grid>

  
        </Grid>

         
          </Paper>

      {/* ROW 2: LEFT = Blocks, RIGHT = Preview */}
      <Grid container spacing={2}>


        {/* LEFT: Blocks editor */}
        <Grid size={{ xs: 12, md: 8}}>

          <Paper sx={{ p: { xs: 1, sm: 3, md: 3 }, mt: 1.5 }}>
            {/* --- Social picker + saved socials --- */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1" sx={{ mb: 2 }}>
                Social accounts
              </Typography>

              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2 }}>
                {availablePlatforms.length === 0 ? (
                  <Typography variant="caption" color="text.secondary">
                    You've added all available platforms.
                  </Typography>
                ) : (
                  availablePlatforms.map(({ key, label, Icon }) => {
                    const selected = selectedPlatform === key;
                    return (
                      <Box
                        key={key}
                        onClick={() => {
                          setSelectedPlatform(selected ? null : key);
                          setSocialUrl("");
                        }}
                        sx={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 1,
                          cursor: "pointer",
                          px: 1.25,
                          py: 0.5,
                          borderRadius: 999,
                          border: selected ? `1px solid ${theme.palette.primary.main}` : "1px solid rgba(0,0,0,0.06)",
                          bgcolor: selected ? "background.paper" : "transparent",
                          minHeight: 36,
                        }}
                      >
                        <Icon sx={{ fontSize: 20, color: selected ? theme.palette.primary.main : "text.secondary" }} />
                        <Typography sx={{ fontFamily: "Inter", fontSize: "14px", fontWeight: 600 }}>{label}</Typography>
                      </Box>
                    );
                  })
                )}
              </Box>

              {selectedPlatform && (
                <Paper sx={{ p: 1, mb: 1, borderRadius: 2 }}>
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems="center">
                  <TextField
  fullWidth
  size="small"
  placeholder={
    selectedPlatform === "whatsapp"
      ? "Enter 10 Digit WhatsApp Number"
      : `Enter ${selectedPlatform} URL`
  }
  type={selectedPlatform === "whatsapp" ? "tel" : "url"}
  value={socialUrl}
  onChange={(e) => setSocialUrl(e.target.value)}
  inputProps={
    selectedPlatform === "whatsapp"
      ? { pattern: "^[+0-9]{10,15}$", inputMode: "tel" }
      : {}
  }
/>

                    {/* <TextField fullWidth size="small" placeholder={`Enter ${selectedPlatform} URL`} value={socialUrl} onChange={(e) => setSocialUrl(e.target.value)} /> */}
                    <PrimaryBtn onClick={saveSocial} disabled={addingSocial} style={{ display: "inline-flex", alignItems: "center" }}>
                      {addingSocial ? <CircularProgress size={18} /> : <SaveIcon />}
                      <span style={{ marginLeft: 8 }}>{addingSocial ? "Saving..." : "Save"}</span>
                    </PrimaryBtn>
                  </Stack>
                  {socialApiMsg && <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>{socialApiMsg}</Typography>}
                </Paper>
              )}

              <Stack spacing={1}>
                {loadingSocials ? (
                  <Box sx={{ py: 2, display: "flex", justifyContent: "center" }}>
                    <CircularProgress size={24} />
                  </Box>
                ) : socials.length === 0 ? (
                  <Typography variant="caption" color="text.secondary">No socials saved yet — pick one above to add.</Typography>
                ) : (
                  socials.map((s) => {
                    const Plat = PLATFORMS.find((p) => p.key === s.platform)?.Icon || LinkIcon;
                    return (
                      <Paper key={s._id || s.id || s.url} variant="outlined" sx={{ p: 1, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Plat sx={{ fontSize: 18 }} />
                          <Box>
                            <Typography variant="body2" sx={{ fontFamily: "Inter", fontWeight: 500, textTransform: "capitalize" }}>{s.platform}</Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ wordBreak: "break-all" }}>{s.url}</Typography>
                          </Box>
                        </Box>
                        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                          <IconButton onClick={() => window.open(s.url, "_blank")} size="small" title="Open">
                            <ChevronRightRoundedIcon fontSize="small" />
                          </IconButton>
                          <IconButton onClick={() => deleteSocial(s._id || s.id)} size="small" title="Delete">
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </Paper>
                    );
                  })
                )}
              </Stack>
            </Box>
            {/* --- end social picker --- */}
          </Paper>

          <Paper sx={{ p: { xs: 1, sm: 3, md: 3 }, mt: 1.5 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2, flexDirection: { xs: "column", sm: "row" }, gap: { xs: 1, sm: 0 } }}>
              <Typography variant="subtitle1">Block List</Typography>
              <Box sx={{ width: { xs: "100%", sm: "auto" } }}>
                <AddPill onClick={openAdd}>
                  <AddIcon />
                  Add New Blocks
                </AddPill>
              </Box>
            </Box>

            <Stack spacing={1}>
              {loadingBlocks ? (
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", py: 6 }}>
                  <CircularProgress />
                </Box>
              ) : (
                blocks.map((b) => (
                  <Paper
                    key={b.id}
                    variant="outlined"
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      p: 1.25,
                      cursor: "grab",
                      bgcolor: b.id === draggingId ? "action.selected" : "background.paper",
                    }}
                    draggable
                    onDragStart={(e) => onDragStart(e, b.id)}
                    onDragOver={(e) => onDragOver(e, b.id)}
                    onDragEnd={onDragEnd}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", pr: 1 }}>
                      <DragIndicatorIcon fontSize="small" color="action" />
                    </Box>

                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body1">{b.title}</Typography>
                      {/* <Typography variant="caption" color="text.secondary">
                        {b.action || "no action"}
                      </Typography> */}
                    </Box>

                    <Box sx={{ display: "flex", gap: 1 }}>
                      <button
                        onClick={() => deleteBlock(b.id)}
                        style={{
                          border: "none",
                          background: "transparent",
                          cursor: "pointer",
                          padding: 8,
                          borderRadius: 8,
                        }}
                        title="Delete block"
                        disabled={deletingId === b.id}
                      >
                        {deletingId === b.id ? <CircularProgress size={18} /> : <DeleteIcon fontSize="small" />}
                      </button>
                    </Box>
                  </Paper>
                ))
              )}

              {!loadingBlocks && blocks.length === 0 && (
                <Typography variant="body2" color="text.secondary">
                  No blocks yet — click "Add New Blocks".
                </Typography>
              )}
            </Stack>
          </Paper>
        </Grid>

      {/* Right Preview Images */}
<Grid size={{ xs: 12, md: 4}} mt={1.5} sx={{minHeight: '100dvh', overflowY: 'auto'}}>



  <Box
    sx={{
      // width: { xs: "100%", sm: "85%", md: "85%" },
      margin: "0 auto",
      boxShadow: "0 20px 60px rgba(15,23,42,0.12)",
      background: "linear-gradient(135deg, #0f0c29 0%, #0b0b0b 40%, #0b0b0b 100%)",
    }}
  >

       <Box
    sx={{
      position: "relative",
      // overflow: "hidden",
      height: { xs: 260, sm: 320 },
      bgcolor: "#0b0b0b",
    }}
  >
<Box
  component="img"
  src={userDetails.leftHeadImage}
  alt="hero"
  sx={{
    width: "100%",
    height: "100%",
    objectFit: "cover",
    objectPosition: { xs: "center 10%", sm: "center 25%" }, // shift focus to face
    display: "block",
  }}
/>


    {/* bottom gradient overlay for the ‘mix/gradient end’ */}
    <Box
      sx={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        height: "15%",
        background:
          "linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(8,8,12,0.55) 45%, rgba(8,8,12,0.85) 75%, #08080c 100%)",
        pointerEvents: "none",
      }}
    />
  </Box>

    <Box sx={{ p: { xs: 2, sm: 2 } }}>
      {/* --- Image Grid Preview --- */}




      {/* --- Name + Socials --- */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "space-between",
          mt: 1,
        }}
      >
        <Typography
          sx={{
            color: "#FFFFFF",
            fontFamily: "Inter",
            fontWeight: 500,
            fontSize: { xs: 16, sm: 18 },
          }}
        >
          {name}
        </Typography>

        
      {/* Intro below name + socials */}
      <Typography
        sx={{
          color: "#FFFFFF",
          fontFamily: "Inter",
          fontWeight: 400,
          fontSize: { xs: 12, sm: 13 },
          mt: 1,
        }}
      >
        {userIntro}
      </Typography>

        {/* Social icons row */}
     {/* Social icons row */}
<Box sx={{ display: "flex", gap: 1, alignItems: "center", mt: 1 }}>


  {socials.map((s) => {
  const key = (s.platform || s.name || "").toLowerCase();
   const IconComp =
      key === "youtube"
        ? YouTubeIcon
        : key === "twitter"
        ? TwitterIcon
        : key === "whatsapp"
        ? WhatsAppIcon
        : key === "instagram"
        ? InstagramIcon
        : key === "linkedin"
        ? LinkedInIcon
        : LinkIcon;

  const BRAND = {
    youtube: "#FF0000",
    twitter: "#1DA1F2",
    whatsapp: "#25D366",
    instagram: "#E1306C",
    linkedin: "#0077B5",
    default: "#6366f1",
  };
  const color = BRAND[key] || BRAND.default;
  const bg = alpha(color, 0.03);
  const hoverBg = alpha(color, 0.18);

  // ▼ changed
  const rawUrl = s.url || s.link || s.href || s.number || "";
  const url =
    key === "whatsapp"
      ? makeWaUrl(rawUrl, s.message || "")
      : rawUrl;

  return (
    <Tooltip key={s._id || rawUrl} title={(key && key.charAt(0).toUpperCase() + key.slice(1)) || "Link"} arrow>
      <IconButton
        onClick={() => url && window.open(url, "_blank", "noopener, noreferrer")}
        sx={{
          bgcolor: bg,
          borderRadius: 1,
          width: 34,
          height: 34,
          "&:hover": { bgcolor: hoverBg },
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        aria-label={`open ${key}`}
        size="small"
      >
        <IconComp sx={{ fontSize: 28, color: color }} />
      </IconButton>
    </Tooltip>
  );
})}


  {/* Store icon shown if store_enabled true */}
  {userDetails?.store_enabled ? (
    <IconButton
      onClick={() => alert("Store is enabled — open store or show products here.")}
      title="Open store"
      sx={{
        color: "#fff",
        ml: 0.5,
        // border: "1px solid rgba(255,255,255,0.12)",
        // bgcolor: "rgba(255,255,255,0.03)",
      }}
    >
      <StorefrontIcon sx={{ fontSize: 22 }} />
    </IconButton>
  ) : null}

    {userDetails?.dm_enabled ? (
    <IconButton
      onClick={() => alert("DM is enabled — open My Inbox.")}
      title="DM Enabled"
      sx={{
        color: "#fff",
        ml: 0.5,
        // border: "1px solid rgba(255,255,255,0.12)",
        // bgcolor: "rgba(255,255,255,0.03)",
      }}
    >
      <SmsOutlinedIcon sx={{ fontSize: 22 }} />
    </IconButton>
  ) : null}


</Box>

      </Box>


      {/* blocks area */}
      <Stack spacing={1.25} sx={{ mt: 1, mb: 1 }}>
        {loadingBlocks ? (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              py: 4,
            }}
          >
            <CircularProgress />
          </Box>
        ) : (
          blocks.map((b) => renderPreviewBlock(b))
        )}
      </Stack>

      <Box sx={{ mt: 1 }}>
        <Typography variant="caption" color="text.secondary">
          {link}
        </Typography>
      </Box>

              <Box sx={{ display: "flex", alignItems: "center", gap: 1, justifyContent: "center", mt: 3 }}>
  
   <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, ml: 1}}>
                <Typography sx={{ fontFamily: "Inter", fontWeight: 400, color: "rgba(255,255,255,0.8)", fontSize: { xs: 12, sm: 12 }, mb: 0.25 }}>Made in India</Typography>
                <Box component="img" src={IndiaFlag} alt="India flag" sx={{ width: 18, height: "auto", display: "block", borderRadius: "2px" }} aria-hidden={false} />
              </Box>
    </Box>
    </Box>
  </Box>
</Grid>

      </Grid>

    </Box>


    {/* -----------------------------------------------------  */}

          {/* Customize URL Dialog */}
      <Dialog open={customizeOpen} onClose={() => setCustomizeOpen(false)}>
        <DialogTitle>Customize Url</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Custom link"
            margin="dense"
            value={userDetails.handleUserName ? userDetails.handleUserName + ".myhandle.in" : tempLink}
            onChange={(e) => setTempLink(e.target.value)}
            InputProps={{
              startAdornment: (
                <span style={{ marginRight: 8, display: "inline-flex", alignItems: "center" }}>
                  <LinkIcon />
                </span>
              ),
            }}
          />
        </DialogContent>
        <DialogActions>
          <button
            onClick={() => setCustomizeOpen(false)}
            style={{
              border: "none",
              background: "transparent",
              padding: "8px 12px",
              borderRadius: 8,
              cursor: "pointer",
              fontWeight: 700,
            }}
          >
            Cancel
          </button>
          <PrimaryBtn onClick={saveCustomize}>Save</PrimaryBtn>
        </DialogActions>
      </Dialog>

      <Snackbar open={copySnackOpen} autoHideDuration={1800} onClose={() => setCopySnackOpen(false)} message="Link copied to clipboard" />
      <Snackbar open={apiSnack.open} autoHideDuration={2000} onClose={() => setApiSnack({ open: false, message: "" })} message={apiSnack.message} />

      {/* Add Block Dialog */}
      <Dialog open={addOpen} onClose={() => setAddOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Add New Block</DialogTitle>

        <DialogContent sx={{ pt: 1 }}>
          {/* Rounded tabs */}
           <Box sx={{ mb: 3 }}>
      <Typography variant="caption" sx={{ opacity: 0.7, mb: 1, display: "block" }}>
        Block Type
      </Typography>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(4, 1fr)" },
          gap: 1,
          p: 0.5,
          bgcolor: (t) => (t.palette.mode === "dark" ? "#0b1220" : "#f5f7fb"),
          borderRadius: 2.5,
        }}
      >
        {[
          { label: "Link", value: "link", icon: <LinkIcon /> },
          { label: "Video", value: "video", icon: <MovieIcon /> },
          { label: "1:1 Booking", value: "booking", icon: <EventIcon /> },
          { label: "Form", value: "form", icon: <DescriptionIcon /> },
          { label: "Newsletter", value: "newsletter", icon: <EmailIcon /> },
        ].map((item) => (
          <Button
    key={item.value}
    onClick={() => {
      if (item.value === "booking") {
        setBookingDialogOpen(true); // Open nested dialog
      } else {
        setTab(item.value);
        if (item.value === "form") setFormFields([]);
      }
    }}
    sx={{
      textTransform: "none",
      fontWeight: 600,
      fontSize: { xs: "0.75rem", sm: "0.875rem" }, // Adjusted for 5 items
      py: { xs: 1.5, sm: 1.75 },
      px: { xs: 0.5, sm: 1 },
      borderRadius: 2,
      display: "flex",
      flexDirection: "column",
      gap: 0.5,
      bgcolor: tab === item.value ? "background.paper" : "transparent",
      color: tab === item.value ? "primary.main" : "text.secondary",
      boxShadow: tab === item.value ? 2 : 0,
      transition: "all 0.2s ease",
      "&:hover": {
        bgcolor: tab === item.value ? "background.paper" : "rgba(0,0,0,0.02)",
      },
    }}
  >
    <Box sx={{ fontSize: "1.2rem" }}>{item.icon}</Box>
    {item.label}
  </Button>
        ))}
      </Box>
    </Box>

          {/* LINK TAB CONTENT */}
          {tab === "link" && (
            <Box>
              <Stack spacing={1.5}>
                <TextField fullWidth label="Name" margin="dense" value={newBlockName} onChange={(e) => setNewBlockName?.(e.target.value)} />
                <TextField
                  fullWidth
                  label="URL"
                  placeholder="https://example.com"
                  type="url"
                  margin="dense"
                  value={newBlockAction}
                  onChange={(e) => setNewBlockAction?.(e.target.value)}
                />
              </Stack>

              <Typography variant="overline" sx={{ opacity: 0.7, display: "block", mt: 2 }}>
                Preview
              </Typography>
              <Paper elevation={0} sx={{ borderRadius: 2, border: (t) => `1px solid ${t.palette.divider}`, p: 1 }}>
                <Stack direction="row" alignItems="center" spacing={1.5}>
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: 2,
                      display: "grid",
                      placeItems: "center",
                      bgcolor: (t) => (t.palette.mode === "dark" ? "#101826" : "#eef2ff"),
                    }}
                  >
                    <LinkIcon fontSize="small" />
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="subtitle2" noWrap>
                      {newBlockName || "Link title"}
                    </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.7 }} noWrap>
                      {newBlockAction || "https://your-link.com"}
                    </Typography>
                  </Box>
                  <IconButton size="small" aria-label="open">
                    <ChevronRightRoundedIcon />
                  </IconButton>
                </Stack>
              </Paper>
            </Box>
          )}

          {/* VIDEO TAB (YouTube-only) */}
          {tab === "video" && (
            <Box>
              <Stack spacing={1.5}>
                <TextField fullWidth label="Video Name" margin="dense" value={newBlockName} onChange={(e) => setNewBlockName?.(e.target.value)} />
                <TextField
                  fullWidth
                  label="Video URL"
                  placeholder="https://youtu.be/xxxx or https://www.youtube.com/watch?v=xxxx"
                  margin="dense"
                  value={newBlockAction}
                  onChange={(e) => setNewBlockAction?.(e.target.value)}
                />
              </Stack>

              <Typography variant="overline" sx={{ opacity: 0.7, display: "block", mt: 2 }}>
                Preview
              </Typography>

              <Paper elevation={0} sx={{ borderRadius: 2, border: (t) => `1px solid ${t.palette.divider}`, mt: 1 }}>
                {renderYouTubePreview(newBlockAction)}

                <Divider sx={{ my: 1 }} />

                <Stack direction="row" alignItems="center" spacing={1.5} sx={{ p: 1 }}>
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: 2,
                      display: "grid",
                      placeItems: "center",
                      bgcolor: (t) => (t.palette.mode === "dark" ? "#101826" : "#eef2ff"),
                    }}
                  >
                    <MovieIcon fontSize="small" />
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="subtitle2" noWrap>
                      {newBlockName || "Video title"}
                    </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.7 }} noWrap>
                      {newBlockAction || "Paste a YouTube URL"}
                    </Typography>
                  </Box>
                  <IconButton size="small" aria-label="open">
                    <ChevronRightRoundedIcon />
                  </IconButton>
                </Stack>
              </Paper>
            </Box>
          )}

          {/* FORM TAB */}
          {tab === "form" && (
            <Box>
              <Stack spacing={1}>
                {/* Block title (optional) */}
                <TextField fullWidth label="Form Title" margin="dense" placeholder="e.g. 1:1 Coaching - Sign up" value={newBlockName} onChange={(e) => setNewBlockName(e.target.value)} />

                {/* Dynamic fields list */}
                <Box sx={{ display: "grid", gap: 8, mt: 1 }}>
                  {formFields.map((f, idx) => (
                    <Paper key={f.id} variant="outlined" sx={{ p: 1, borderRadius: 2 }}>
                      <Grid container spacing={1} alignItems="center">
                        <Grid size={{ xs: 12, sm: 6}}>
                          <TextField
                            fullWidth
                            size="small"
                            label="Label"
                            value={f.label}
                            onChange={(e) => updateFormField(f.id, { label: e.target.value })}
                          />
                        </Grid>

                        {/* <Grid item xs={8} sm={4}>
                          <TextField
                            fullWidth
                            size="small"
                            label="Placeholder"
                            value={f.placeholder}
                            onChange={(e) => updateFormField(f.id, { placeholder: e.target.value })}
                          />
                        </Grid> */}

                        <Grid size={{ xs: 4, sm: 2}} sx={{ display: "flex", justifyContent: "flex-end" }}>
                          <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                            <TextField
                              select
                              SelectProps={{ native: true }}
                              size="small"
                              value={f.type}
                              onChange={(e) => updateFormField(f.id, { type: e.target.value })}
                              sx={{ minWidth: 110 }}
                            >
                              <option value="text">Text</option>
                              <option value="email">Email</option>
                              <option value="tel">Phone</option>
                              <option value="radio">Radio</option>
                            </TextField>

                            <Tooltip title="Remove field">
                              <IconButton size="small" onClick={() => removeFormField(f.id)} aria-label="remove-field">
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </Grid>

                        <Grid size={{ xs: 12}}>
                          <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                            <input
                              type="checkbox"
                              checked={!!f.required}
                              onChange={(e) => updateFormField(f.id, { required: e.target.checked })}
                              id={`req-${f.id}`}
                              style={{ width: 14, height: 14 }}
                            />
                            <label htmlFor={`req-${f.id}`} style={{ fontSize: 13, color: "rgba(0,0,0,0.7)" }}>
                              Required
                            </label>
                          </Box>
                        </Grid>

                        {/* Radio options editor: two editable inputs + add option button (replaces comma-field) */}
                        {f.type === "radio" && (
                          <Grid size={{ xs: 12}}>
                            <Box sx={{ mt: 1, display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 1 }}>
                              <TextField
                                size="small"
                                label="Option 1"
                                placeholder="e.g. Male"
                                value={(f.options && f.options[0]) || ""}
                                onChange={(e) => {
                                  const v = e.target.value;
                                  updateFormField(f.id, { options: [v, (f.options && f.options[1]) || ""] });
                                }}
                              />
                              <TextField
                                size="small"
                                label="Option 2"
                                placeholder="e.g. Female"
                                value={(f.options && f.options[1]) || ""}
                                onChange={(e) => {
                                  const v = e.target.value;
                                  updateFormField(f.id, { options: [(f.options && f.options[0]) || "", v] });
                                }}
                              />
                            </Box>

                            <Box sx={{ mt: 1, display: "flex", gap: 1, alignItems: "center" }}>
                              <Button
                                size="small"
                                onClick={() =>
                                  updateFormField(f.id, {
                                    options: [...(Array.isArray(f.options) ? f.options : []), `Option ${((f.options && f.options.length) || 0) + 1}`],
                                  })
                                }
                                sx={{ textTransform: "none" }}
                              >
                                + Add option
                              </Button>

                              <Typography variant="caption" sx={{ color: "text.secondary", ml: 1 }}>
                                Options editable here. You can add more after saving.
                              </Typography>
                            </Box>
                          </Grid>
                        )}
                      </Grid>
                    </Paper>
                  ))}

                  <Box>
                  
                  <Box sx={{ display: "inline-block" }}>
  <ClickAwayListener onClickAway={() => { if (addCloseTimer.current) clearTimeout(addCloseTimer.current); setAddAnchor(null); }}>
    <Box
      onMouseEnter={(e) => openAddMenu(e.currentTarget)}
      onMouseLeave={closeAddMenu}
      sx={{ display: "inline-block" }}
    >
      <Button
        variant="contained"
        onClick={(e) => {
          if (addAnchor) setAddAnchor(null);
          else openAddMenu(e.currentTarget);
        }}
        sx={{
          textTransform: "none",
          borderRadius: 2,
          px: 2,
          py: 1,
          background: "linear-gradient(90deg,#7c3aed,#9f7aea)",
          boxShadow: "0 12px 30px rgba(99,102,241,0.12)",
          color: "#fff",
          fontWeight: 700,
          display: "inline-flex",
          gap: 1,
        }}
      >
        <AddIcon />
        Add Field
      </Button>

      <Menu
        anchorEl={addAnchor}
        open={Boolean(addAnchor)}
        onClose={() => setAddAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        MenuListProps={{
          onMouseEnter: () => {
            if (addCloseTimer.current) {
              clearTimeout(addCloseTimer.current);
              addCloseTimer.current = null;
            }
          },
          onMouseLeave: closeAddMenu,
        }}
      >
        {ADD_FIELD_TYPES.map((t) => (
          <MenuItem key={t.value} onClick={() => createFieldOfType(t.value)} sx={{ textTransform: "none", fontWeight: 600 }}>
            {t.label}
          </MenuItem>
        ))}
      </Menu>
    </Box>
  </ClickAwayListener>
</Box>


                  </Box>
                </Box>
              </Stack>

              <Typography variant="overline" sx={{ opacity: 0.7, display: "block", mt: 2 }}>
                Preview
              </Typography>

              <Paper elevation={0} sx={{ borderRadius: 2, border: (t) => `1px solid ${t.palette.divider}`, p: 2, mt: 1 }}>
                <Stack spacing={1}>
                  <Typography variant="subtitle2">{newBlockName || "Contact form"}</Typography>

                  {formFields.map((f) => {
                    const opts = Array.isArray(f.options)
                      ? f.options
                      : (typeof f.options === "string" ? f.options.split(",").map((s) => s.trim()).filter(Boolean) : []);

                    return (
                      <Box key={f.id} sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                        {f.type === "textarea" ? (
                          <TextField fullWidth label={f.label} placeholder={f.placeholder} multiline rows={3} InputProps={{ readOnly: true }} />
                        ) : f.type === "radio" ? (
                          <FormControl component="fieldset" variant="standard" sx={{ mt: 0.5 }}>
                            <FormLabel component="legend" sx={{ fontSize: 13, mb: 0.5 }}>{f.label}</FormLabel>
                            <RadioGroup row>
                              {opts.map((opt, i) => (
                                <FormControlLabel key={i} value={opt} control={<Radio />} label={opt} disabled />
                              ))}
                            </RadioGroup>
                          </FormControl>
                        ) : (
                          <TextField fullWidth label={f.label} placeholder={f.placeholder} type={f.type || "text"} InputProps={{ readOnly: true }} />
                        )}
                      </Box>
                    );
                  })}

                  <PrimaryBtn onClick={() => { /* no-op on preview */ }} style={{ width: 160 }}>
                    Submit
                  </PrimaryBtn>
                </Stack>
              </Paper>
            </Box>
          )}

            {tab === "newsletter" && (
      <Box>
        <Stack spacing={1.5}>
          {/* editable pre-filled text */}
          <TextField
            fullWidth
            label="Newsletter Title"
            margin="dense"
            value={newsletterText}
            onChange={(e) => setNewsletterText(e.target.value)}
            placeholder="Subscribe to Newsletter"
          />

          <Typography variant="overline" sx={{ opacity: 0.7, display: "block", mt: 1 }}>
            Preview
          </Typography>

          <Paper elevation={0} sx={{ borderRadius: 2, border: (t) => `1px solid ${t.palette.divider}`, p: 2, mt: 1 }}>
            <Stack spacing={1.5}>
              <Typography variant="subtitle2">{newsletterText || "Subscribe to Newsletter"}</Typography>


              {/* Rounded, non-interactive email field preview */}
              <TextField
                fullWidth
                label="Your Email"
                placeholder="your@email.com"
                disabled // makes it non-clickable (preview-only)
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                  },
                }}
              />

           
            </Stack>
          </Paper>
        </Stack>
      </Box>
    )}
        </DialogContent>

        <DialogActions sx={{ gap: 1, p: 2 }}>
          <button
            onClick={() => setAddOpen(false)}
            style={{
              border: "none",
              background: "transparent",
              padding: "8px 12px",
              borderRadius: 8,
              cursor: "pointer",
              fontWeight: 700,
            }}
          >
            Cancel
          </button>

          <PrimaryBtn onClick={saveAdd} disabled={savingBlock}>
            {savingBlock ? <CircularProgress size={18} /> : <SaveIcon />}
            <span style={{ marginLeft: 6 }}>{savingBlock ? "Saving..." : "Save"}</span>
          </PrimaryBtn>
        </DialogActions>
      </Dialog>

      {/* ---------- Form Submission Dialog ---------- */}
      <Dialog open={formDialogOpen} onClose={closeFormDialog} fullWidth maxWidth="sm">
        <DialogTitle>{currentFormBlock?.title || "Submit form"}</DialogTitle>

        <DialogContent>
          <Box sx={{ mt: 0.5, display: "grid", gap: 1 }}>
            {currentFormBlock?._renderFields?.length === 0 && <Typography variant="body2" color="text.secondary">This form has no fields.</Typography>}

            {currentFormBlock?._renderFields?.map((f) => {
              const key = f._key || f.key || f.label?.toLowerCase().replace(/\s+/g, "_");
              const value = formValues[key] ?? "";
              const error = formErrors[key];

              // show textarea for textarea type, otherwise text/email/tel
              if ((f.type || "text") === "textarea") {
                return (
                  <TextField
                    key={key}
                    fullWidth
                    multiline
                    rows={4}
                    label={f.label || "Field"}
                    placeholder={f.placeholder || ""}
                    value={value}
                    onChange={(e) => setFormValues((s) => ({ ...s, [key]: e.target.value }))}
                    error={!!error}
                    helperText={error || (f.required ? "Required" : "")}
                    margin="dense"
                  />
                );
              }

              if (f.type === "radio") {
                const opts = Array.isArray(f.options)
                  ? f.options
                  : (typeof f.options === "string" ? f.options.split(",").map((s) => s.trim()).filter(Boolean) : []);

                return (
                  <FormControl key={key} component="fieldset" margin="dense" error={!!formErrors[key]}>
                    <FormLabel component="legend">{f.label}</FormLabel>
                    <RadioGroup
                      name={key}
                      value={formValues[key] ?? ""}
                      onChange={(e) => setFormValues((s) => ({ ...s, [key]: e.target.value }))}
                    >
                      {opts.map((opt, idx) => (
                        <FormControlLabel key={idx} value={opt} control={<Radio />} label={opt} />
                      ))}
                    </RadioGroup>
                    {formErrors[key] && <Typography variant="caption" color="error">{formErrors[key]}</Typography>}
                  </FormControl>
                );
              }

              return (
                <TextField
                  key={key}
                  fullWidth
                  label={f.label || "Field"}
                  placeholder={f.placeholder || ""}
                  type={f.type === "tel" ? "tel" : f.type === "email" ? "email" : "text"}
                  value={value}
                  onChange={(e) => setFormValues((s) => ({ ...s, [key]: e.target.value }))}
                  error={!!error}
                  helperText={error || (f.required ? "Required" : "")}
                  margin="dense"
                />
              );
            })}
          </Box>
        </DialogContent>

        <DialogActions sx={{ gap: 1, p: 2 }}>
          <button
            onClick={closeFormDialog}
            style={{
              border: "none",
              background: "transparent",
              padding: "8px 12px",
              borderRadius: 8,
              cursor: "pointer",
              fontWeight: 700,
            }}
          >
            Cancel
          </button>

          <PrimaryBtn
            onClick={async () => {
              // validate and submit
              if (!currentFormBlock) return;
              const fields = currentFormBlock._renderFields || [];
              const errors = {};
              fields.forEach((f, i) => {
                const key = f._key || f.key || `f_${i}`;
                if (f.required && !String(formValues[key] ?? "").trim()) {
                  errors[key] = `${f.label || "This field"} is required`;
                }
              });
              setFormErrors(errors);
              if (Object.keys(errors).length > 0) return;

              // build payload
              const payload = {
                blockId: currentFormBlock.id,
                blockName: currentFormBlock.title || currentFormBlock.name || "form",
                values: formValues, // { key: value }
                meta: { submittedAt: new Date().toISOString() },
              };

              setFormSubmitting(true);
              try {
                // endpoint: POST /submit-form  (adjust if your API expects /submit-form/:id)
                const res = await api.post("/submit-form", payload, { withCredentials: true, headers: { "Content-Type": "application/json" } });
                // success handling
                setApiSnack({ open: true, message: res.data?.message || "Submitted" });
                closeFormDialog();
              } catch (err) {
                console.error("form submit error", err);
                const msg = err?.response?.data?.message || "Failed to submit";
                setApiSnack({ open: true, message: msg });
              } finally {
                setFormSubmitting(false);
              }
            }}
            disabled={formSubmitting}
          >
            {formSubmitting ? <CircularProgress size={18} /> : <SaveIcon />}
            <span style={{ marginLeft: 8 }}>{formSubmitting ? "Submitting..." : "Submit"}</span>
          </PrimaryBtn>
        </DialogActions>
      </Dialog>

      {/* Newsletter subscribe dialog */}
<Dialog open={newsletterDialogOpen} onClose={closeNewsletterDialog} fullWidth maxWidth="sm">
  <DialogTitle sx={{ fontWeight: 700 }}>{newsletterDialogText || "Subscribe to Newsletter"}</DialogTitle>

  <DialogContent dividers>
    <Stack spacing={2}>
      <TextField
        label="Your email"
        type="email"
        fullWidth
        value={newsletterEmail}
        onChange={(e) => setNewsletterEmail(e.target.value)}
        placeholder="you@company.com"
        InputProps={{ sx: { borderRadius: 2 } }}
      />

      <FormControlLabel
        control={
          <Checkbox
            checked={newsletterAccept}
            onChange={(e) => setNewsletterAccept(e.target.checked)}
            size="small"
          />
        }
        label={<Typography sx={{ fontSize: 13 }}>I accept all terms &amp; conditions</Typography>}
      />
    </Stack>
  </DialogContent>

  <DialogActions sx={{ px: 2, py: 1 }}>
    <Box sx={{ flex: 1 }} /> {/* pushes subscribe to right */}
    <Button onClick={closeNewsletterDialog} sx={{ mr: 1 }}>
      Cancel
    </Button>
    <Button
      variant="contained"
      onClick={handleSubscribe}
      disabled={!newsletterAccept} // optional: require accept to be checked
      sx={{ borderRadius: 2 }}
    >
      Subscribe
    </Button>
  </DialogActions>
</Dialog>

 <BookingDialog
      open={bookingDialogOpen}
      onClose={() => setBookingDialogOpen(false)}
      onSave={(normalizedBlock) => {
        // Add the saved block to state
        setBlocks((s) => [...s, normalizedBlock]);
        setBookingDialogOpen(false);
        setAddOpen(false); // Close main dialog too
      }}
    />


    </>


  );
}

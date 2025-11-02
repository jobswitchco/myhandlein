import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Stack,
  Alert,
  TextField,
  Chip,
  Button,
  Paper,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  CircularProgress,
  Skeleton,
  Tooltip,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import axios from "axios";
import { useParams } from "react-router-dom";
import WestOutlinedIcon from "@mui/icons-material/WestOutlined";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";

/** Thin, long SVG arrow divider (TOP -> BOTTOM, vector-based, no MUI icon) */
function ThinDownArrowDivider() {
  return (
    <Box
      role="presentation"
      aria-hidden
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        color: "#FA812F",
        py: { xs: 1, sm: 1.5 },
      }}
    >
      <Box sx={{ height: { xs: 40, sm: 56 } }}>
        <svg viewBox="0 0 44 200" width="44" height="100%" preserveAspectRatio="xMidYMid meet">
          <line x1="22" y1="0" x2="22" y2="180" stroke="currentColor" strokeOpacity="0.88" strokeWidth="1.25" />
          <path
            d="M10 180 L22 198 L34 180"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.25"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </svg>
      </Box>
    </Box>
  );
}

/** Image with loading spinner */
function ImageWithLoader({ src, alt, sx = {} }) {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  return (
    <Box sx={{ position: "relative", ...sx }}>
      {imageLoading && !imageError && (
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: "action.hover",
            zIndex: 1,
          }}
        >
          <CircularProgress size={48} thickness={3.5} />
        </Box>
      )}

      {imageError ? (
        <Box
          sx={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: "action.hover",
            color: "text.secondary",
          }}
        >
          <Typography variant="body2">Failed to load image</Typography>
        </Box>
      ) : (
        <CardMedia
          component="img"
          image={src}
          alt={alt}
          onLoad={() => setImageLoading(false)}
          onError={() => {
            setImageLoading(false);
            setImageError(true);
          }}
          sx={{
            aspectRatio: "1 / 1",
            objectFit: "cover",
            display: imageLoading ? "none" : "block",
          }}
        />
      )}
    </Box>
  );
}

export default function AutomationDetails() {
  const { postId = "" } = useParams();
  const navigate = useNavigate();

  // fetch state
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // edit mode gate
  const [editMode, setEditMode] = useState(false);

  // media/meta from backend
  const [media, setMedia] = useState({ thumbnail: "", caption: "" });

  // 🔥 NEW: postLive status
  const [postLive, setPostLive] = useState(true);

  // status for Stop/Resume button
  const [status, setStatus] = useState("inactive");

  // Step 1: Keywords
  const [keywordInput, setKeywordInput] = useState("");
  const [keywords, setKeywords] = useState([]);

  // Step 2: Public Reply
  const [commentReply, setCommentReply] = useState("");
  const [shouldReply, setShouldReply] = useState("no");

  // Step 3: DM
  const [shouldDM, setShouldDM] = useState("no");
  const [dmMessage, setDmMessage] = useState("");
  const [dmBtnDialogOpen, setDmBtnDialogOpen] = useState(false);
  const [dmButtonDraft, setDmButtonDraft] = useState({ text: "", url: "" });
  const [dmButton, setDmButton] = useState(null);

  const baseUrl = "/api/usersOn";

  // snapshot of last-loaded/saved server state for diffing
  const originalRef = useRef(null);

  const data = useMemo(
    () => ({
      id: postId,
      thumbnail: media.thumbnail,
      caption: media.caption || "",
    }),
    [postId, media]
  );

  const missingThumb = !media.thumbnail;

  // Helpers
  const isValidUrl = (str = "") => {
    try {
      const url = new URL(str);
      return !!url.protocol && !!url.hostname;
    } catch {
      return false;
    }
  };

  const handleKeywordKeyDown = (e) => {
    if (e.key === "Enter" && keywordInput.trim() && editMode) {
      e.preventDefault();
      const value = keywordInput.trim();
      if (!keywords.includes(value)) setKeywords((prev) => [...prev, value]);
      setKeywordInput("");
    }
  };

  const handleDeleteKeyword = (kw) => {
    if (!editMode) return;
    setKeywords((prev) => prev.filter((k) => k !== kw));
  };

  const handleDMChoice = (e) => {
    if (!editMode) return;
    const val = e.target.value;
    setShouldDM(val);
    if (val === "no") {
      setDmMessage("");
      setDmButton(null);
    }
  };

  const openBtnDialog = () => {
    if (!editMode) return;
    setDmButtonDraft(dmButton || { text: "", url: "" });
    setDmBtnDialogOpen(true);
  };

  const closeBtnDialog = () => setDmBtnDialogOpen(false);

  const saveBtnDialog = () => {
    const text = (dmButtonDraft.text || "").trim();
    const url = (dmButtonDraft.url || "").trim();
    if (!text) {
      toast.error("Please enter button text");
      return;
    }
    if (!isValidUrl(url)) {
      toast.error("Please enter a valid URL (https://...)");
      return;
    }
    setDmButton({ text, url });
    setDmBtnDialogOpen(false);
  };

  // Map current UI state -> normalized doc
  const currentDoc = () => ({
    postId,
    keywords,
    hasPublicReply: shouldReply === "yes",
    publicReply: shouldReply === "yes" ? (commentReply || "").trim() : "",
    dm:
      shouldDM === "yes"
        ? {
            enabled: true,
            message: (dmMessage || "").trim(),
            button: dmButton ? { text: dmButton.text.trim(), url: dmButton.url.trim() } : null,
          }
        : { enabled: false, message: "", button: null },
  });

  // Shallow/targeted diff -> dot-path patch
  const buildPatch = (prev, next) => {
    const patch = {};
    const set = (k, v) => {
      patch[k] = v;
    };

    // keywords (order-sensitive)
    const sameArrays =
      Array.isArray(prev.keywords) &&
      Array.isArray(next.keywords) &&
      prev.keywords.length === next.keywords.length &&
      prev.keywords.every((v, i) => v === next.keywords[i]);
    if (!sameArrays) set("keywords", next.keywords);

    // public reply fields
    if (prev.hasPublicReply !== next.hasPublicReply) set("hasPublicReply", next.hasPublicReply);
    if ((prev.publicReply || "") !== (next.publicReply || "")) set("publicReply", next.publicReply);

    // dm core
    if ((prev.dm?.enabled || false) !== (next.dm?.enabled || false)) set("dm.enabled", next.dm.enabled);
    if ((prev.dm?.message || "") !== (next.dm?.message || "")) set("dm.message", next.dm.message);

    // dm.button
    const prevBtn = prev.dm?.button || null;
    const nextBtn = next.dm?.button || null;
    const bothNull = prevBtn === null && nextBtn === null;

    if (!bothNull) {
      if (nextBtn === null) {
        set("dm.button", null);
      } else if (prevBtn === null) {
        set("dm.button.text", nextBtn.text);
        set("dm.button.url", nextBtn.url);
      } else {
        if ((prevBtn.text || "") !== (nextBtn.text || "")) set("dm.button.text", nextBtn.text);
        if ((prevBtn.url || "") !== (nextBtn.url || "")) set("dm.button.url", nextBtn.url);
      }
    }

    return patch;
  };

  // Load details from backend
  useEffect(() => {
    if (!postId) return;
    let alive = true;
    (async () => {
      setLoading(true);
      setErr("");
      try {
        const res = await axios.post(baseUrl + "/automation/details", { postId }, { withCredentials: true });
        if (!alive) return;
        const d = res.data || {};
        setMedia({
          thumbnail: d.thumbnail,
          caption: d.caption || "",
        });
        setKeywords(Array.isArray(d.keywords) ? d.keywords : []);
        setShouldReply(d.hasPublicReply ? "yes" : "no");
        setCommentReply(d.publicReply || "");
        setStatus(d.status === "active" ? "active" : "inactive");

        // 🔥 Set postLive status
        setPostLive(d.postLive !== false);

        if (d.dm?.enabled) {
          setShouldDM("yes");
          setDmMessage(d.dm.message || "");
          setDmButton(d.dm.button ? { ...d.dm.button } : null);
        } else {
          setShouldDM("no");
          setDmMessage("");
          setDmButton(null);
        }

        const snapshot = {
          postId,
          keywords: Array.isArray(d.keywords) ? d.keywords : [],
          hasPublicReply: !!d.hasPublicReply,
          publicReply: d.publicReply || "",
          dm: {
            enabled: !!d.dm?.enabled,
            message: d.dm?.message || "",
            button: d.dm?.button ? { text: d.dm.button.text || "", url: d.dm.button.url || "" } : null,
          },
        };
        originalRef.current = snapshot;
      } catch (e) {
        setErr(e?.response?.data?.message || e.message || "Failed to load automation");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [postId]);

  // Save only what changed when finishing edit
  const handleDoneEditing = async () => {
    // 🔥 Prevent editing if post is deleted
    if (!postLive) {
      toast.error("Cannot edit automation for a deleted post");
      return;
    }

    if (!editMode) {
      setEditMode(true);
      return;
    }

    const prev = originalRef.current || {};
    const next = currentDoc();
    const patch = buildPatch(prev, next);

    if (Object.keys(patch).length === 0) {
      setEditMode(false);
      toast.info("No changes to save");
      return;
    }

    try {
      setLoading(true);
      setErr("");
      await axios.post(`${baseUrl}/automation/update`, { postId: next.postId, patch }, { withCredentials: true });

      originalRef.current = next;
      toast.success("Details Updated Successfully!");
      setEditMode(false);
    } catch (e) {
      setErr(e?.response?.data?.message || e.message || "Failed to update automation");
      toast.error(e?.response?.data?.message || "Failed to update automation");
    } finally {
      setLoading(false);
    }
  };

  // Toggle Stop/Resume - DISABLED if post is deleted
  const handleToggleAutomation = async () => {
    if (!data.id) {
      toast.error("Missing postId. Open the setup from a specific post.");
      return;
    }

    // 🔥 Prevent resuming automation for deleted posts
    if (!postLive) {
      toast.error("Cannot resume automation for a deleted post");
      return;
    }

    try {
      setLoading(true);
      const desired = status === "active" ? "inactive" : "active";
      const payload = { postId: data.id, status: desired };
      const res = await axios.post(`${baseUrl}/automation/stop`, payload, {
        withCredentials: true,
      });
      const updated = res?.data?.automation;
      setStatus(updated?.status || desired);
      toast.success(res?.data?.message || `Automation status updated to ${desired}.`);
    } catch (error) {
      console.error("Error toggling automation:", error);
      const msg =
        error.response?.data?.message ||
        error.message ||
        "Failed to update automation status. Please try again.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // Shared styles
  const cardSurface = {
    p: { xs: 2, sm: 2.5, md: 3 },
    borderRadius: { xs: 2, sm: 2.5, md: 3 },
    border: "1px solid",
    borderColor: "divider",
    bgcolor: "background.paper",
    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
  };

  const sectionTitle = {
    fontFamily: "Inter, ui-sans-serif, system-ui",
    fontSize: { xs: 15, sm: 16 },
    fontWeight: 600,
    letterSpacing: 0.2,
    color: "text.primary",
    mb: { xs: 1, sm: 1.5 },
  };

  const inputTight = {
    "& .MuiOutlinedInput-root": {
      minHeight: { xs: 44, sm: 46 },
      alignItems: "center",
      borderRadius: { xs: 1.5, sm: 2 },
      width: "100%",
    },
    "& .MuiOutlinedInput-input": {
      height: "100%",
      padding: { xs: "0 12px", sm: "0 14px" },
      fontSize: { xs: 15, sm: 16 },
      "::placeholder": { opacity: 0.5, fontSize: { xs: 15, sm: 16 } },
    },
  };

  const stepBadge = (n) => (
    <Box
      component="span"
      sx={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: { xs: 22, sm: 24 },
        height: { xs: 22, sm: 24 },
        borderRadius: "50%",
        fontSize: { xs: 11, sm: 12 },
        fontWeight: 700,
        mr: { xs: 0.75, sm: 1 },
        color: "primary.main",
        border: "1px solid",
        borderColor: "primary.main",
        bgcolor: "transparent",
        flexShrink: 0,
      }}
    >
      {n}
    </Box>
  );

  const isActive = status === "active";
  const statusBtnLabel = isActive ? "Stop Automation" : "Resume Automation";

  // Loading skeleton
  if (loading && !media.thumbnail) {
    return (
      <Box sx={{ p: { xs: 1.5, sm: 2.5, md: 3 }, maxWidth: 1400, mx: "auto" }}>
        <Stack sx={{ mb: 3, display: "flex", flexDirection: "row", gap: 2, alignItems: "center" }}>
          <Skeleton variant="circular" width={24} height={24} />
          <Skeleton variant="text" width={200} height={32} />
        </Stack>

        <Stack direction={{ xs: "column", md: "row" }} spacing={{ xs: 2, md: 3 }}>
          <Box sx={{ width: { xs: "100%", md: "38%" } }}>
            <Skeleton variant="rounded" height={400} sx={{ borderRadius: 3 }} />
          </Box>
          <Box sx={{ width: { xs: "100%", md: "62%" } }}>
            <Stack spacing={2}>
              <Skeleton variant="rounded" height={150} sx={{ borderRadius: 3 }} />
              <Skeleton variant="rounded" height={150} sx={{ borderRadius: 3 }} />
              <Skeleton variant="rounded" height={200} sx={{ borderRadius: 3 }} />
            </Stack>
          </Box>
        </Stack>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 1.5, sm: 2.5, md: 3 }, maxWidth: 1400, mx: "auto" }}>
      <Stack sx={{ mb: { xs: 2, sm: 3 }, display: "flex", flexDirection: "row", gap: { xs: 2, sm: 3 }, alignItems: "center" }}>
        <IconButton
          onClick={() => navigate("/professional/automations")}
          sx={{
            p: { xs: 0.5, sm: 1 },
            "&:hover": { bgcolor: "action.hover" },
          }}
        >
          <WestOutlinedIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />
        </IconButton>
        <Typography sx={{ fontFamily: "Inter", fontSize: { xs: 18, sm: 20 }, fontWeight: 600, letterSpacing: 0.2 }}>
          Automation Details
        </Typography>
      </Stack>

      {/* 🔥 Warning banner if post is deleted */}
      {!postLive && (
        <Alert
          severity="warning"
          icon={<WarningAmberIcon />}
          sx={{
            mb: 2,
            borderRadius: { xs: 1.5, sm: 2 },
            fontWeight: 500,
          }}
        >
          This post has been deleted from Instagram. The automation is now inactive and cannot be edited or resumed.
        </Alert>
      )}

      {/* Responsive two-column layout */}
      <Stack direction={{ xs: "column", md: "row" }} alignItems="flex-start" spacing={{ xs: 2, md: 3 }}>
        {/* LEFT: Media + DM Preview */}
        <Box sx={{ width: { xs: "100%", md: "38%" } }}>
          {!postId && (
            <Alert severity="warning" sx={{ mb: 2, borderRadius: { xs: 1.5, sm: 2 } }}>
              Missing <strong>postId</strong> in the URL.
            </Alert>
          )}

          {err && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: { xs: 1.5, sm: 2 } }}>
              {err}
            </Alert>
          )}

          <Card
            variant="outlined"
            sx={{
              borderRadius: { xs: 2, sm: 2.5, md: 3 },
              overflow: "hidden",
              borderColor: "divider",
              boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
              // 🔥 Dim the card if post is deleted
              opacity: postLive ? 1 : 0.6,
            }}
          >
            {missingThumb ? (
              <Box
                sx={{
                  aspectRatio: "1 / 1",
                  width: "100%",
                  bgcolor: "action.hover",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  No thumbnail provided
                </Typography>
              </Box>
            ) : (
              <ImageWithLoader src={data.thumbnail} alt={data.caption || `IG media ${data.id}`} sx={{ aspectRatio: "1 / 1" }} />
            )}

            <CardContent sx={{ p: { xs: 1.75, sm: 2.25 } }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 0.5 }}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ fontSize: { xs: 12, sm: 13 } }}>
                  Caption
                </Typography>
                {/* 🔥 Post status chip */}
                <Tooltip title={postLive ? "Post is live on Instagram" : "Post deleted from Instagram"}>
                  <Chip
                    size="small"
                    label={postLive ? "LIVE" : "DELETED"}
                    color={postLive ? "success" : "error"}
                    variant="outlined"
                    sx={{ fontSize: 11, height: 22 }}
                  />
                </Tooltip>
              </Stack>
              <Typography
                variant="body2"
                sx={{
                  display: "-webkit-box",
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                  fontSize: { xs: 14, sm: 15 },
                  lineHeight: 1.6,
                }}
              >
                {data.caption?.trim() ? data.caption : "No Caption"}
              </Typography>
            </CardContent>
          </Card>

          {/* DM PREVIEW */}
          {shouldDM === "yes" && (
            <Paper
              elevation={0}
              sx={{
                mt: { xs: 2, sm: 3, md: 4 },
                p: { xs: 1.5, sm: 2 },
                borderRadius: { xs: 2, sm: 2.5, md: 3 },
                border: "1px solid",
                borderColor: "divider",
                bgcolor: "background.paper",
              }}
            >
              <Typography
                variant="subtitle2"
                sx={{
                  mb: { xs: 1, sm: 1.5 },
                  fontWeight: 600,
                  fontSize: { xs: 14, sm: 15 },
                }}
              >
                DM Preview
              </Typography>

              <Box sx={{ display: "flex", gap: { xs: 1, sm: 1.5 } }}>
                <Box
                  sx={{
                    width: { xs: 32, sm: 36 },
                    height: { xs: 32, sm: 36 },
                    borderRadius: "50%",
                    bgcolor: "action.hover",
                    flexShrink: 0,
                  }}
                />
                <Box
                  sx={{
                    maxWidth: "100%",
                    p: { xs: 1, sm: 1.25 },
                    borderRadius: { xs: 1.5, sm: 2 },
                    bgcolor: "grey.100",
                    border: "1px solid",
                    borderColor: "grey.200",
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      whiteSpace: "pre-wrap",
                      fontSize: { xs: 14, sm: 15 },
                      lineHeight: 1.5,
                    }}
                  >
                    {dmMessage || "Your DM message will appear here..."}
                  </Typography>

                  {dmButton && (
                    <Button
                      variant="contained"
                      size="small"
                      sx={{
                        mt: { xs: 0.75, sm: 1 },
                        textTransform: "none",
                        borderRadius: { xs: 1.5, sm: 2 },
                        fontSize: { xs: 13, sm: 14 },
                      }}
                      disableElevation
                    >
                      {dmButton.text}
                    </Button>
                  )}
                </Box>
              </Box>
            </Paper>
          )}
        </Box>

        {/* RIGHT: Form (3 boxes) */}
        <Box sx={{ width: { xs: "100%", md: "62%" } }}>
          <Stack spacing={{ xs: 2, sm: 2.5, md: 3 }}>
            {/* Step 1 */}
            <Paper elevation={0} sx={cardSurface}>
              <Stack sx={{ display: "flex", flexDirection: "row", gap: { xs: 0.75, sm: 1 } }}>
                {stepBadge(1)}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={sectionTitle}>Keyword(s) to trigger Automation</Typography>

                  <TextField
                    fullWidth
                    placeholder={editMode ? "Type a keyword and press Enter" : "Keywords"}
                    helperText="Comments including these keywords will trigger automation."
                    value={keywordInput}
                    onChange={(e) => setKeywordInput(e.target.value)}
                    onKeyDown={handleKeywordKeyDown}
                    variant="outlined"
                    sx={{ mb: { xs: 1, sm: 1.5 }, ...inputTight }}
                    slotProps={{
                      input: { inputProps: { "aria-label": "Keyword input" } },
                      formHelperText: { sx: { fontSize: { xs: 12, sm: 13 } } },
                    }}
                    disabled={!editMode || !postLive}
                  />

                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: { xs: 0.75, sm: 1 } }}>
                    {keywords.map((kw, i) => (
                      <Chip
                        key={i}
                        label={kw}
                        onDelete={() => handleDeleteKeyword(kw)}
                        color="primary"
                        variant="outlined"
                        size={window.innerWidth < 600 ? "small" : "medium"}
                        sx={{
                          borderRadius: { xs: 1.5, sm: 2 },
                          "& .MuiChip-label": {
                            px: { xs: 1.25, sm: 1.5 },
                            fontWeight: 500,
                            fontSize: { xs: 13, sm: 14 },
                          },
                        }}
                        {...(!editMode || !postLive ? { onDelete: undefined } : {})}
                      />
                    ))}
                    {keywords.length === 0 && (
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: 13, sm: 14 } }}>
                        {editMode ? "Add keywords above" : "No keywords configured"}
                      </Typography>
                    )}
                  </Box>
                </Box>
              </Stack>
            </Paper>

            <ThinDownArrowDivider />

            {/* Step 2 */}
            <Paper elevation={0} sx={cardSurface}>
              <Stack sx={{ display: "flex", flexDirection: "row", gap: { xs: 0.75, sm: 1 } }}>
                {stepBadge(2)}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={sectionTitle}>Would you like to set up a Public Reply in the feed?</Typography>

                  <FormControl component="fieldset" sx={{ mb: { xs: 0.75, sm: 1 } }}>
                    <RadioGroup
                      value={shouldReply}
                      onChange={(e) => (editMode && postLive ? setShouldReply(e.target.value) : null)}
                      row
                    >
                      <FormControlLabel
                        value="yes"
                        control={<Radio size="small" />}
                        label={<Typography sx={{ fontSize: { xs: 14, sm: 15 } }}>Yes</Typography>}
                        disabled={!editMode || !postLive}
                      />
                      <FormControlLabel
                        value="no"
                        control={<Radio size="small" />}
                        label={<Typography sx={{ fontSize: { xs: 14, sm: 15 } }}>No</Typography>}
                        disabled={!editMode || !postLive}
                      />
                    </RadioGroup>
                  </FormControl>

                  {shouldReply === "yes" && (
                    <TextField
                      fullWidth
                      placeholder="Enter the message that will be sent as a reply to a comment."
                      value={commentReply}
                      onChange={(e) => setCommentReply(e.target.value)}
                      variant="outlined"
                      sx={inputTight}
                      disabled={!editMode || !postLive}
                    />
                  )}
                </Box>
              </Stack>
            </Paper>

            <ThinDownArrowDivider />

            {/* Step 3 — DM */}
            <Paper elevation={0} sx={cardSurface}>
              <Stack sx={{ display: "flex", flexDirection: "row", gap: { xs: 0.75, sm: 1 } }}>
                {stepBadge(3)}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={sectionTitle}>Would you like to send a DM?</Typography>

                  <FormControl component="fieldset" sx={{ mb: { xs: 0.75, sm: 1 } }}>
                    <RadioGroup value={shouldDM} onChange={handleDMChoice} row>
                      <FormControlLabel
                        value="yes"
                        control={<Radio size="small" />}
                        label={<Typography sx={{ fontSize: { xs: 14, sm: 15 } }}>Yes</Typography>}
                        disabled={!editMode || !postLive}
                      />
                      <FormControlLabel
                        value="no"
                        control={<Radio size="small" />}
                        label={<Typography sx={{ fontSize: { xs: 14, sm: 15 } }}>No</Typography>}
                        disabled={!editMode || !postLive}
                      />
                    </RadioGroup>
                  </FormControl>

                  {shouldDM === "yes" && (
                    <>
                      <TextField
                        fullWidth
                        placeholder="Write the DM message that will be sent."
                        value={dmMessage}
                        onChange={(e) => setDmMessage(e.target.value)}
                        variant="outlined"
                        multiline
                        minRows={2}
                        sx={{
                          mb: { xs: 1, sm: 1.25 },
                          "& .MuiOutlinedInput-root": {
                            borderRadius: { xs: 1.5, sm: 2 },
                            fontSize: { xs: 14, sm: 15 },
                          },
                        }}
                        disabled={!editMode || !postLive}
                      />

                      {/* Optional Button control */}
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                        <Button
                          variant="text"
                          onClick={openBtnDialog}
                          sx={{
                            textTransform: "none",
                            px: 0,
                            fontWeight: 600,
                            fontSize: { xs: 13, sm: 14 },
                          }}
                          disabled={!editMode || !postLive}
                        >
                          {dmButton ? "Edit Button" : "Add Button (optional)"}
                        </Button>
                        {dmButton && (
                          <>
                            <Chip
                              label={`${dmButton.text} → ${dmButton.url}`}
                              variant="outlined"
                              size="small"
                              sx={{
                                maxWidth: "100%",
                                borderRadius: { xs: 1.5, sm: 2 },
                                "& .MuiChip-label": {
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  fontSize: { xs: 12, sm: 13 },
                                },
                              }}
                            />
                            <IconButton
                              size="small"
                              aria-label="remove button"
                              onClick={() => (editMode && postLive ? setDmButton(null) : null)}
                              disabled={!editMode || !postLive}
                            >
                              <CloseIcon fontSize="small" />
                            </IconButton>
                          </>
                        )}
                      </Box>
                    </>
                  )}
                </Box>
              </Stack>
            </Paper>

            {/* Footer actions: Edit + Stop/Resume */}
            <Box
              sx={{
                display: "flex",
                flexDirection: { xs: "column", sm: "row" },
                justifyContent: "space-between",
                pt: { xs: 1, sm: 2 },
                gap: { xs: 1.5, sm: 2 },
              }}
            >
              <Button
                variant={editMode ? "contained" : "outlined"}
                size="large"
                onClick={handleDoneEditing}
                disabled={loading || !postLive}
                sx={{
                  flex: { xs: 1, sm: "0 1 auto" },
                  minWidth: { sm: 200 },
                  textTransform: "none",
                  fontSize: { xs: 15, sm: 16 },
                  fontWeight: 700,
                  borderRadius: { xs: 2, sm: 2.5 },
                  py: { xs: 1.25, sm: 1.5 },
                }}
              >
                {editMode ? "Done Editing" : "Edit Automation"}
              </Button>

              <Button
                variant="outlined"
                size="large"
                color={isActive ? "error" : "success"}
                onClick={handleToggleAutomation}
                disabled={loading || !postId || !postLive}
                sx={{
                  flex: { xs: 1, sm: "0 1 auto" },
                  minWidth: { sm: 200 },
                  textTransform: "none",
                  fontFamily: "Inter, ui-sans-serif, system-ui",
                  fontSize: { xs: 15, sm: 16 },
                  fontWeight: 700,
                  borderRadius: { xs: 2, sm: 2.5 },
                  py: { xs: 1.25, sm: 1.5 },
                }}
              >
                {statusBtnLabel}
              </Button>
            </Box>
          </Stack>
        </Box>
      </Stack>

      {/* Dialog: Add/Edit Button */}
      <Dialog
        open={dmBtnDialogOpen}
        onClose={closeBtnDialog}
        fullWidth
        maxWidth="xs"
        PaperProps={{
          sx: {
            borderRadius: { xs: 2, sm: 2.5 },
            m: { xs: 2, sm: 3 },
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, fontSize: { xs: 18, sm: 20 } }}>DM Button</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <TextField
            fullWidth
            label="Button Text"
            value={dmButtonDraft.text}
            onChange={(e) => setDmButtonDraft((d) => ({ ...d, text: e.target.value }))}
            sx={{ mt: 1.5 }}
          />
          <TextField
            fullWidth
            label="URL"
            placeholder="https://example.com"
            value={dmButtonDraft.url}
            onChange={(e) => setDmButtonDraft((d) => ({ ...d, url: e.target.value }))}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={closeBtnDialog}
            sx={{
              textTransform: "none",
              fontSize: { xs: 14, sm: 15 },
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={saveBtnDialog}
            sx={{
              textTransform: "none",
              fontSize: { xs: 14, sm: 15 },
            }}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

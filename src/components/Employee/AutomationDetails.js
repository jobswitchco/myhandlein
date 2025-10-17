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
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import axios from "axios";
import { useParams } from "react-router-dom";
import WestOutlinedIcon from '@mui/icons-material/WestOutlined';
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";


/** Thin, long SVG arrow divider (TOP -> BOTTOM, vector-based, no MUI icon) */
function ThinDownArrowDivider() {
  return (
    <Box
      role="presentation"
      aria-hidden
      sx={{ display: "flex", justifyContent: "center", alignItems: "center", color: "#FA812F" }}
    >
      <Box sx={{ height: 56 }}>
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

  // NEW: status for Stop/Resume button
  const [status, setStatus] = useState("inactive"); // "active" | "inactive"

  // Step 1: Keywords
  const [keywordInput, setKeywordInput] = useState("");
  const [keywords, setKeywords] = useState([]);

  // Step 2: Public Reply
  const [commentReply, setCommentReply] = useState("");
  const [shouldReply, setShouldReply] = useState("no"); // "yes" | "no"

  // Step 3: DM
  const [shouldDM, setShouldDM] = useState("no");
  const [dmMessage, setDmMessage] = useState("");
  const [dmBtnDialogOpen, setDmBtnDialogOpen] = useState(false);
  const [dmButtonDraft, setDmButtonDraft] = useState({ text: "", url: "" });
  const [dmButton, setDmButton] = useState(null); // { text, url } | null

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
    if (!text) return alert("Please enter button text");
    if (!isValidUrl(url)) return alert("Please enter a valid URL (https://...)");
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
        // clear
        set("dm.button", null);
      } else if (prevBtn === null) {
        // create
        set("dm.button.text", nextBtn.text);
        set("dm.button.url", nextBtn.url);
      } else {
        if ((prevBtn.text || "") !== (nextBtn.text || "")) set("dm.button.text", nextBtn.text);
        if ((prevBtn.url || "") !== (nextBtn.url || "")) set("dm.button.url", nextBtn.url);
      }
    }

    return patch;
  };

  // Load details from backend (POST, with credentials)
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
        // Map into local state
        setMedia({
          thumbnail: d.thumbnail,
          caption: d.caption || "",
        });
        setKeywords(Array.isArray(d.keywords) ? d.keywords : []);
        setShouldReply(d.hasPublicReply ? "yes" : "no");
        setCommentReply(d.publicReply || "");
        setStatus(d.status === "active" ? "active" : "inactive"); // <— NEW

        if (d.dm?.enabled) {
          setShouldDM("yes");
          setDmMessage(d.dm.message || "");
          setDmButton(d.dm.button ? { ...d.dm.button } : null);
        } else {
          setShouldDM("no");
          setDmMessage("");
          setDmButton(null);
        }

        // Save a normalized snapshot for diffing
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
    if (!editMode) {
      setEditMode(true);
      return;
    }

    const prev = originalRef.current || {};
    const next = currentDoc();
    const patch = buildPatch(prev, next);

    if (Object.keys(patch).length === 0) {
      setEditMode(false);
      return;
    }

    try {
      setLoading(true);
      setErr("");
      await axios.post(`${baseUrl}/automation/update`, { postId: next.postId, patch }, { withCredentials: true });

      originalRef.current = next;
      toast.success('Details Updated Successfully!');
      setEditMode(false);
    } catch (e) {
      setErr(e?.response?.data?.message || e.message || "Failed to update automation");
    } finally {
      setLoading(false);
    }
  };

  // Toggle Stop/Resume based on current status
  const handleToggleAutomation = async () => {
    if (!data.id) {
      alert("Missing postId. Open the setup from a specific post.");
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
      toast.success(res?.data?.message || `Automation status updated to ${desired}.`)
    } catch (error) {
      console.error("Error toggling automation:", error);
      const msg =
        error.response?.data?.message ||
        error.message ||
        "Failed to update automation status. Please try again.";
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  // Shared styles
  const cardSurface = {
    p: 3,
    borderRadius: 3,
    border: "1px solid",
    borderColor: "divider",
    bgcolor: "background.paper",
    boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
  };

  const sectionTitle = {
    fontFamily: "Inter, ui-sans-serif, system-ui",
    fontSize: 16,
    fontWeight: 600,
    letterSpacing: 0.2,
    color: "text.primary",
    mb: 1,
  };

  const inputTight = {
    "& .MuiOutlinedInput-root": {
      height: 46,
      alignItems: "center",
      borderRadius: 2,
      width: "100%",
    },
    "& .MuiOutlinedInput-input": {
      height: "100%",
      lineHeight: "46px",
      padding: "0 14px",
      fontSize: 16,
      "::placeholder": { opacity: 0.5, fontSize: 16 },
    },
  };

  const stepBadge = (n) => (
    <Box
      component="span"
      sx={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 24,
        height: 24,
        borderRadius: "50%",
        fontSize: 12,
        fontWeight: 700,
        mr: 1,
        color: "primary.main",
        border: "1px solid",
        borderColor: "primary.main",
        bgcolor: "transparent",
      }}
    >
      {n}
    </Box>
  );

  const isActive = status === "active";
  const statusBtnLabel = isActive ? "Stop Automation" : "Resume Automation";

  return (
    <Box sx={{ p: { xs: 1.5, sm: 2.5, md: 3 }, maxWidth: 1400, mx: "auto" }}>

          <Stack sx={{ mb: 3, display : 'flex', flexDirection : 'row', gap: 3, alignItems : 'center' }}>
            <WestOutlinedIcon sx={{ cursor : 'pointer'}}onClick={() => navigate("/professional/automations")}/>
            <Typography sx={{fontFamily : 'Inter', fontSize : '20px', fontWeight: 600, letterSpacing: 0.2 }}>
              Automation Details
            </Typography>
          </Stack>

          
      {/* Responsive two-column layout: stacked on mobile, side-by-side at md+ */}
      <Stack
        direction={{ xs: "column", md: "row" }}
        alignItems="flex-start"
        spacing={{ xs: 2, md: 3 }}
      >
        {/* LEFT: Media + DM Preview */}
        <Box sx={{ width: { xs: "100%", md: "38%" } }}>
        

          {!postId && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              Missing <strong>postId</strong> in the URL.
            </Alert>
          )}

          {err && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {err}
            </Alert>
          )}

          <Card
            variant="outlined"
            sx={{
              borderRadius: 3,
              overflow: "hidden",
              borderColor: "divider",
              boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
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
              <CardMedia
                component="img"
                image={data.thumbnail}
                alt={data.caption || `IG media ${data.id}`}
                sx={{ aspectRatio: "1 / 1", objectFit: "cover" }}
              />
            )}

            <CardContent sx={{ p: 2.25 }}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>
                Caption
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  display: "-webkit-box",
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
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
                mt: 4,
                p: 2,
                borderRadius: 3,
                border: "1px solid",
                borderColor: "divider",
                bgcolor: "background.paper",
              }}
            >
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                DM Preview
              </Typography>

              <Box sx={{ display: "flex", gap: 1.5 }}>
                <Box sx={{ width: 36, height: 36, borderRadius: "50%", bgcolor: "action.hover", flexShrink: 0 }} />
                <Box
                  sx={{
                    maxWidth: "100%",
                    p: 1.25,
                    borderRadius: 2,
                    bgcolor: "grey.100",
                    border: "1px solid",
                    borderColor: "grey.200",
                  }}
                >
                  <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                    {dmMessage || "Your DM message will appear here..."}
                  </Typography>

                  {dmButton && (
                    <Button variant="contained" size="small" sx={{ mt: 1, textTransform: "none", borderRadius: 2 }} disableElevation>
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
          <Stack spacing={3}>
            {/* Step 1 */}
            <Paper elevation={0} sx={cardSurface}>
              <Stack sx={{ display: "flex", flexDirection: "row", gap: 1 }}>
                <Typography> {stepBadge(1)}</Typography>
                <Box sx={{ flex: 1 }}>
                  <Typography sx={sectionTitle}>Keyword(s) to trigger Automation</Typography>

                  <TextField
                    fullWidth
                    placeholder={editMode ? "Type a keyword and press Enter" : "Keywords"}
                    helperText="Comments including these keywords will trigger automation."
                    value={keywordInput}
                    onChange={(e) => setKeywordInput(e.target.value)}
                    onKeyDown={handleKeywordKeyDown}
                    variant="outlined"
                    sx={{ mb: 1.5, ...inputTight }}
                    slotProps={{ input: { inputProps: { "aria-label": "Keyword input" } } }}
                    disabled={!editMode}
                  />

                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                    {keywords.map((kw, i) => (
                      <Chip
                        key={i}
                        label={kw}
                        onDelete={() => handleDeleteKeyword(kw)}
                        color="primary"
                        variant="outlined"
                        sx={{ borderRadius: 2, "& .MuiChip-label": { px: 1.5, fontWeight: 500 } }}
                        {...(!editMode ? { onDelete: undefined } : {})}
                      />
                    ))}
                    {keywords.length === 0 && (
                      <Typography variant="body2" color="text.secondary">
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
              <Stack sx={{ display: "flex", flexDirection: "row", gap: 1 }}>
                <Typography> {stepBadge(2)}</Typography>
                <Box sx={{ flex: 1 }}>
                  <Typography sx={sectionTitle}>Would you like to set up a Public Reply in the feed?</Typography>

                  <FormControl component="fieldset" sx={{ mb: 1 }}>
                    <RadioGroup value={shouldReply} onChange={(e) => (editMode ? setShouldReply(e.target.value) : null)} row>
                      <FormControlLabel value="yes" control={<Radio size="small" />} label="Yes" disabled={!editMode} />
                      <FormControlLabel value="no" control={<Radio size="small" />} label="No" disabled={!editMode} />
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
                      disabled={!editMode}
                    />
                  )}
                </Box>
              </Stack>
            </Paper>

            <ThinDownArrowDivider />

            {/* Step 3 — DM */}
            <Paper elevation={0} sx={cardSurface}>
              <Stack sx={{ display: "flex", flexDirection: "row", gap: 1 }}>
                <Typography> {stepBadge(3)}</Typography>
                <Box sx={{ flex: 1 }}>
                  <Typography sx={sectionTitle}>Would you like to send a DM?</Typography>

                  <FormControl component="fieldset" sx={{ mb: 1 }}>
                    <RadioGroup value={shouldDM} onChange={handleDMChoice} row>
                      <FormControlLabel value="yes" control={<Radio size="small" />} label="Yes" disabled={!editMode} />
                      <FormControlLabel value="no" control={<Radio size="small" />} label="No" disabled={!editMode} />
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
                        sx={{ mb: 1.25, "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                        disabled={!editMode}
                      />

                      {/* Optional Button control */}
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                        <Button
                          variant="text"
                          onClick={openBtnDialog}
                          sx={{ textTransform: "none", px: 0, fontWeight: 600 }}
                          disabled={!editMode}
                        >
                          {dmButton ? "Edit Button" : "Add Button (optional)"}
                        </Button>
                        {dmButton && (
                          <>
                            <Chip
                              label={`${dmButton.text} → ${dmButton.url}`}
                              variant="outlined"
                              size="small"
                              sx={{ maxWidth: "100%", borderRadius: 2 }}
                            />
                            <IconButton
                              size="small"
                              aria-label="remove button"
                              onClick={() => (editMode ? setDmButton(null) : null)}
                              disabled={!editMode}
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
            <Box sx={{ display: "flex", justifyContent: "space-between", pt: 2, gap: 2, flexWrap: "wrap" }}>
              <Button
                variant={editMode ? "contained" : "outlined"}
                size="large"
                onClick={handleDoneEditing}
                disabled={loading}
                sx={{
                  minWidth: 200,
                  textTransform: "none",
                  fontSize: 16,
                  fontWeight: 700,
                  borderRadius: 2.5,
                }}
              >
                {editMode ? "Done Editing" : "Edit Automation"}
              </Button>

              <Button
                variant="outlined"
                size="large"
                color={isActive ? "error" : "success"}
                onClick={handleToggleAutomation}
                disabled={loading || !postId}
                sx={{
                  minWidth: 200,
                  textTransform: "none",
                  fontFamily: "Inter, ui-sans-serif, system-ui",
                  fontSize: 16,
                  fontWeight: 700,
                  borderRadius: 2.5,
                }}
              >
                {statusBtnLabel}
              </Button>
            </Box>
          </Stack>
        </Box>
      </Stack>

      {/* Dialog: Add/Edit Button */}
      <Dialog open={dmBtnDialogOpen} onClose={closeBtnDialog} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 700 }}>DM Button</DialogTitle>
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
          <Button onClick={closeBtnDialog} sx={{ textTransform: "none" }}>
            Cancel
          </Button>
          <Button variant="contained" onClick={saveBtnDialog} sx={{ textTransform: "none" }}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

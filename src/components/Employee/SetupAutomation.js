import React, { useMemo, useState } from "react";
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
  IconButton
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import FlightTakeoffOutlinedIcon from "@mui/icons-material/FlightTakeoffOutlined";
import axios from "axios";
import { useParams, useLocation, useSearchParams } from "react-router-dom";
import WestOutlinedIcon from '@mui/icons-material/WestOutlined';
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";


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
        color: "#FA812F"
      }}
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

export default function SetupAutomation() {
  const { post_id } = useParams();
  const location = useLocation();
  const [searchParams] = useSearchParams();
    const navigate = useNavigate();
  

  // Base
  const baseUrl = "/api/usersOn";

  // Step 1: Keywords
  const [keywordInput, setKeywordInput] = useState("");
  const [keywords, setKeywords] = useState([]);

  // Step 2: Public Reply
  const [commentReply, setCommentReply] = useState("");
  const [shouldReply, setShouldReply] = useState("yes");

  // Step 3: DM
  const [shouldDM, setShouldDM] = useState("no");
  const [dmMessage, setDmMessage] = useState("");
  const [dmBtnDialogOpen, setDmBtnDialogOpen] = useState(false);
  const [dmButtonDraft, setDmButtonDraft] = useState({ text: "", url: "" });
  const [dmButton, setDmButton] = useState(null); // { text, url } | null

  const { id, thumbnail_url: stateThumb, caption: stateCaption } = location.state || {};
  const data = useMemo(() => {
    const fromParamsId = post_id || id || searchParams.get("id") || "";
    const fromParamsThumb = stateThumb || searchParams.get("thumbnail") || "";
    const fromParamsCaption = stateCaption || searchParams.get("caption") || "";
    return { id: fromParamsId, thumbnail: fromParamsThumb, caption: fromParamsCaption };
  }, [post_id, id, stateThumb, stateCaption, searchParams]);

  const missingThumb = !data.thumbnail;

  // Helpers
  const isValidUrl = (str = "") => {
    try {
      const url = new URL(str);
      return !!url.protocol && !!url.hostname;
    } catch {
      return false;
    }
  };

  // Step 1 handlers
  const handleKeywordKeyDown = (e) => {
    if (e.key === "Enter" && keywordInput.trim()) {
      e.preventDefault();
      const value = keywordInput.trim();
      if (!keywords.includes(value)) setKeywords((prev) => [...prev, value]);
      setKeywordInput("");
    }
  };
  const handleDeleteKeyword = (kw) => setKeywords((prev) => prev.filter((k) => k !== kw));

  // Step 3 handlers
  const handleDMChoice = (e) => {
    const val = e.target.value;
    setShouldDM(val);
    if (val === "no") {
      setDmMessage("");
      setDmButton(null);
    }
  };
  const openBtnDialog = () => {
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

  // Start Automation
  const handleStartAutomation = async () => {
    if (keywords.length === 0) {
      alert("Please add at least one keyword");
      return;
    }
    if (shouldReply === "yes" && !commentReply.trim()) {
      alert("Please enter a public reply message");
      return;
    }

    const dmEnabled = shouldDM === "yes";
    if (dmEnabled) {
      if (!dmMessage.trim()) {
        alert("Please enter the DM message");
        return;
      }
      if (dmButton) {
        if (!(dmButton.text || "").trim()) {
          alert("Please enter button text");
          return;
        }
        if (!isValidUrl(dmButton.url)) {
          alert("Please enter a valid button URL (https://...)");
          return;
        }
      }
    }

    try {
      const payload = {
        postId: data.id,
        keywords: [...keywords],
        commentReply: shouldReply === "yes" ? commentReply.trim() : null,
        dmEnabled,
        caption:data.caption,
        dm: dmEnabled
          ? {
              message: dmMessage.trim(),
              button: dmButton ? { text: dmButton.text.trim(), url: dmButton.url.trim() } : undefined,
            }
          : null,
      };

      const res = await axios.post(`${baseUrl}/automation/config`, payload, { withCredentials: true });
      console.log("Saved automation:", res.data);
      toast.success("Automation started successfully!");
      setTimeout(() => {
        navigate("/professional/automations");
        
      }, 2000);
    } catch (error) {
      console.error("Error starting automation:", error);
      const msg =
        error.response?.data?.message ||
        error.message ||
        "Failed to start automation. Please try again.";
      toast.error("Error! Please Try Again");

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

  return (
    <>
      <Stack sx={{ mt: 2, display : 'flex', flexDirection : 'row', gap: 3, alignItems : 'center' }}>
                <WestOutlinedIcon sx={{ cursor : 'pointer'}}onClick={() => navigate("/professional/fetch_media")}/>
                <Typography sx={{fontFamily : 'Inter', fontSize : '20px', fontWeight: 600, letterSpacing: 0.2 }}>
                  Setup Automation
                </Typography>
              </Stack>

    <Box
      sx={{
        // responsive two-column app layout (no MUI Grid)
        display: "grid",
        gridTemplateColumns: { xs: "1fr", md: "minmax(0, 420px) minmax(0, 1fr)" },
        gap: 1,
      }}
    >
      {/* LEFT: Media + DM Preview */}
      <Box sx={{ p: { xs: 1.5, sm: 2.5, md: 3 }, maxWidth: 800, mx: "auto", width: "100%" }}>
      

        {!data.id && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Missing <strong>post_id</strong> in the route (expected: <code>/automation/setup/:post_id</code>).
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
              {/* Avatar circle */}
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  bgcolor: "action.hover",
                  flexShrink: 0,
                }}
              />
              {/* Message bubble */}
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
                  <Button
                    variant="contained"
                    size="small"
                    sx={{ mt: 1, textTransform: "none", borderRadius: 2 }}
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

      {/* RIGHT: Form */}
      <Box sx={{ p: { xs: 1.5, sm: 2.5, md: 3 }, width: "100%" }}>
        <Stack spacing={3}>
          {/* Step 1 */}
          <Paper elevation={0} sx={cardSurface}>
            <Stack sx={{ display: "flex", flexDirection: "row", gap: 1 }}>
              <Typography>{stepBadge(1)}</Typography>

              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={sectionTitle}>Keyword(s) to trigger Automation</Typography>

                <TextField
                  fullWidth
                  placeholder="Type a keyword and press Enter"
                  helperText="Comments including these keywords will trigger automation."
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                  onKeyDown={handleKeywordKeyDown}
                  variant="outlined"
                  sx={{ mb: 1.5, ...inputTight }}
                  slotProps={{ input: { inputProps: { "aria-label": "Keyword input" } } }}
                />

                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                  {keywords.map((kw, i) => (
                    <Chip
                      key={i}
                      label={kw}
                      onDelete={() => handleDeleteKeyword(kw)}
                      color="primary"
                      variant="outlined"
                      sx={{
                        borderRadius: 2,
                        "& .MuiChip-label": { px: 1.5, fontWeight: 500 },
                      }}
                    />
                  ))}
                </Box>
              </Box>
            </Stack>
          </Paper>

          <ThinDownArrowDivider />

          {/* Step 2 */}
          <Paper elevation={0} sx={cardSurface}>
            <Stack sx={{ display: "flex", flexDirection: "row", gap: 1 }}>
              <Typography>{stepBadge(2)}</Typography>

              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={sectionTitle}>
                  Would you like to set up a Public Reply in the feed?
                </Typography>

                <FormControl component="fieldset" sx={{ mb: 1 }}>
                  <RadioGroup value={shouldReply} onChange={(e) => setShouldReply(e.target.value)} row>
                    <FormControlLabel value="yes" control={<Radio size="small" />} label="Yes" />
                    <FormControlLabel value="no" control={<Radio size="small" />} label="No" />
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
                  />
                )}
              </Box>
            </Stack>
          </Paper>

          <ThinDownArrowDivider />

          {/* Step 3 — DM */}
          <Paper elevation={0} sx={cardSurface}>
            <Stack sx={{ display: "flex", flexDirection: "row", gap: 1 }}>
              <Typography>{stepBadge(3)}</Typography>

              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={sectionTitle}>Would you like to send a DM?</Typography>

                <FormControl component="fieldset" sx={{ mb: 1 }}>
                  <RadioGroup value={shouldDM} onChange={handleDMChoice} row>
                    <FormControlLabel value="yes" control={<Radio size="small" />} label="Yes" />
                    <FormControlLabel value="no" control={<Radio size="small" />} label="No" />
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
                        mb: 1.25,
                        "& .MuiOutlinedInput-root": { borderRadius: 2 },
                      }}
                    />

                    {/* Optional Button control */}
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                      <Button
                        variant="text"
                        onClick={openBtnDialog}
                        sx={{ textTransform: "none", px: 0, fontWeight: 600 }}
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
                            onClick={() => setDmButton(null)}
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

          {/* Start */}
          <Box sx={{ display: "flex", justifyContent: "center", pt: 2 }}>
            <Button
              variant="contained"
              size="large"
              onClick={handleStartAutomation}
              startIcon={<FlightTakeoffOutlinedIcon sx={{ mr: 1 }} />}
              sx={{
                minWidth: 220,
                textTransform: "none",
                fontFamily: "Inter, ui-sans-serif, system-ui",
                fontSize: 16,
                fontWeight: 700,
                borderRadius: 2.5,
                boxShadow: "0 8px 20px rgba(0,0,0,0.12)",
              }}
            >
              Start Automation
            </Button>
          </Box>
        </Stack>
      </Box>

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

    </>
  );
}

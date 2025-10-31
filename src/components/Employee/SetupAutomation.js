import React, { useMemo, useState, useEffect } from "react";
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
  LinearProgress,
  Fade,
  Slide,
  Collapse,
  useMediaQuery,
  useTheme,
  Drawer
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import RocketLaunchIcon from "@mui/icons-material/RocketLaunch";
import KeyboardArrowLeftIcon from "@mui/icons-material/KeyboardArrowLeft";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import AddIcon from "@mui/icons-material/Add";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import SendIcon from "@mui/icons-material/Send";
import LabelIcon from "@mui/icons-material/Label";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import axios from "axios";
import { useParams, useLocation, useSearchParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

export default function SetupAutomation() {
  const { post_id } = useParams();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const isTablet = useMediaQuery(theme.breakpoints.down("lg"));

  const baseUrl = "/api/usersOn";

  // Form state
  const [keywordInput, setKeywordInput] = useState("");
  const [keywords, setKeywords] = useState([]);
  const [commentReply, setCommentReply] = useState("");
  const [shouldReply, setShouldReply] = useState("yes");
  const [shouldDM, setShouldDM] = useState("no");
  const [dmMessage, setDmMessage] = useState("");
  const [dmBtnDialogOpen, setDmBtnDialogOpen] = useState(false);
  const [dmButtonDraft, setDmButtonDraft] = useState({ text: "", url: "" });
  const [dmButton, setDmButton] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  // Validation state
  const [showValidationWarning, setShowValidationWarning] = useState(false);
  const [validationMessage, setValidationMessage] = useState("");

  const { id, thumbnail_url: stateThumb, caption: stateCaption } = location.state || {};
  const data = useMemo(() => {
    const fromParamsId = post_id || id || searchParams.get("id") || "";
    const fromParamsThumb = stateThumb || searchParams.get("thumbnail") || "";
    const fromParamsCaption = stateCaption || searchParams.get("caption") || "";
    return { id: fromParamsId, thumbnail: fromParamsThumb, caption: fromParamsCaption };
  }, [post_id, id, stateThumb, stateCaption, searchParams]);

  const missingThumb = !data.thumbnail;

  // Real-time validation for automation flow
  useEffect(() => {
    if (keywords.length > 0) {
      const hasReply = shouldReply === "yes" && commentReply.trim();
      const hasDM = shouldDM === "yes" && dmMessage.trim();
      
      if (!hasReply && !hasDM) {
        setShowValidationWarning(true);
        setValidationMessage("At least one action is required! Enable either Public Reply or Direct Message to complete the automation flow.");
      } else {
        setShowValidationWarning(false);
        setValidationMessage("");
      }
    } else {
      setShowValidationWarning(false);
      setValidationMessage("");
    }
  }, [keywords, shouldReply, commentReply, shouldDM, dmMessage]);

  // Calculate progress
  const calculateProgress = () => {
    let progress = 0;
    if (keywords.length > 0) progress += 25;
    
    const hasReply = shouldReply === "yes" && commentReply.trim();
    const hasDM = shouldDM === "yes" && dmMessage.trim();
    
    if (hasReply || shouldReply === "no") progress += 25;
    if (hasDM || shouldDM === "no") progress += 25;
    
    // Final check: at least one action must be enabled
    if (keywords.length > 0 && (hasReply || hasDM)) {
      progress += 25;
    }
    
    return Math.min(progress, 100);
  };

  const isValidUrl = (str = "") => {
    try {
      const url = new URL(str);
      return !!url.protocol && !!url.hostname;
    } catch {
      return false;
    }
  };

  const handleKeywordKeyDown = (e) => {
    if (e.key === "Enter" && keywordInput.trim()) {
      e.preventDefault();
      const value = keywordInput.trim();
      if (!keywords.includes(value)) setKeywords((prev) => [...prev, value]);
      setKeywordInput("");
    }
  };

  const handleDeleteKeyword = (kw) => setKeywords((prev) => prev.filter((k) => k !== kw));

  const handleReplyChange = (e) => {
    const val = e.target.value;
    setShouldReply(val);
    if (val === "no") {
      setCommentReply("");
    }
  };

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

  const handleStartAutomation = async () => {
    if (keywords.length === 0) {
      toast.error("Please add at least one keyword");
      return;
    }

    const hasReply = shouldReply === "yes" && commentReply.trim();
    const hasDM = shouldDM === "yes" && dmMessage.trim();

    if (!hasReply && !hasDM) {
      toast.error("Please enable at least one action: Public Reply OR Direct Message");
      return;
    }

    if (shouldReply === "yes" && !commentReply.trim()) {
      toast.error("Please enter a public reply message");
      return;
    }

    const dmEnabled = shouldDM === "yes";
    if (dmEnabled) {
      if (!dmMessage.trim()) {
        toast.error("Please enter the DM message");
        return;
      }
      if (dmButton) {
        if (!(dmButton.text || "").trim()) {
          toast.error("Please enter button text");
          return;
        }
        if (!isValidUrl(dmButton.url)) {
          toast.error("Please enter a valid button URL (https://...)");
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
        caption: data.caption,
        thumbnail: data.thumbnail,
        dm: dmEnabled
          ? {
              message: dmMessage.trim(),
              button: dmButton ? { text: dmButton.text.trim(), url: dmButton.url.trim() } : undefined,
            }
          : null,
      };

      const res = await axios.post(`${baseUrl}/automation/config`, payload, { withCredentials: true });
      toast.success("Automation started successfully!");
      setTimeout(() => {
        navigate("/professional/automations");
      }, 2000);
    } catch (error) {
      console.error("Error starting automation:", error);
      toast.error("Error! Please Try Again");
    }
  };

  const progress = calculateProgress();
  const isFormValid = progress === 100;

  // Preview Panel Component
  const PreviewPanel = () => (
    <Box>
      <Card
        elevation={0}
        sx={{
          borderRadius: { xs: 3, md: 4 },
          overflow: "hidden",
          border: "1px solid",
          borderColor: "grey.200",
          position: { xs: "relative", lg: "sticky" },
          top: { xs: 0, lg: 100 },
        }}
      >
        {missingThumb ? (
          <Box
            sx={{
              aspectRatio: "1 / 1",
              bgcolor: "grey.100",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Typography variant="body2" color="text.secondary">
              No thumbnail
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

        <CardContent sx={{ p: { xs: 2, md: 3 } }}>
          <Typography
            variant="body2"
            sx={{
              fontFamily: "Inter",
              color: "#475569",
              lineHeight: 1.6,
              display: "-webkit-box",
              WebkitLineClamp: 4,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              fontSize: { xs: "13px", md: "14px" },
            }}
          >
            {data.caption?.trim() || "No caption provided"}
          </Typography>
        </CardContent>

        {/* Public Reply Preview */}
        {shouldReply === "yes" && commentReply.trim() && (
          <Fade in>
            <Box sx={{ p: { xs: 2, md: 3 }, pt: 0 }}>
              <Box
                sx={{
                  p: 2,
                  borderRadius: 3,
                  background: "linear-gradient(135deg, #DBEAFE 0%, #BFDBFE 100%)",
                  border: "1px solid #93C5FD",
                }}
              >
                <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                  <ChatBubbleOutlineIcon sx={{ fontSize: 16, color: "#2563EB" }} />
                  <Typography
                    sx={{
                      fontFamily: "Inter",
                      fontSize: { xs: "11px", md: "12px" },
                      fontWeight: 600,
                      color: "#2563EB",
                    }}
                  >
                    PUBLIC REPLY PREVIEW
                  </Typography>
                </Stack>
                <Typography
                  sx={{
                    fontFamily: "Inter",
                    fontSize: { xs: "13px", md: "14px" },
                    color: "#1E40AF",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {commentReply}
                </Typography>
              </Box>
            </Box>
          </Fade>
        )}

        {/* DM Preview */}
        {shouldDM === "yes" && dmMessage.trim() && (
          <Fade in>
            <Box sx={{ p: { xs: 2, md: 3 }, pt: 0 }}>
              <Box
                sx={{
                  p: 2,
                  borderRadius: 3,
                  background: "linear-gradient(135deg, #E0E7FF 0%, #EDE9FE 100%)",
                  border: "1px solid #C7D2FE",
                }}
              >
                <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                  <SendIcon sx={{ fontSize: 16, color: "#6366F1" }} />
                  <Typography
                    sx={{
                      fontFamily: "Inter",
                      fontSize: { xs: "11px", md: "12px" },
                      fontWeight: 600,
                      color: "#6366F1",
                    }}
                  >
                    DM PREVIEW
                  </Typography>
                </Stack>
                <Typography
                  sx={{
                    fontFamily: "Inter",
                    fontSize: { xs: "13px", md: "14px" },
                    color: "#475569",
                    whiteSpace: "pre-wrap",
                    mb: dmButton ? 1.5 : 0,
                  }}
                >
                  {dmMessage}
                </Typography>
                {dmButton && (
                  <Button
                    variant="contained"
                    size="small"
                    fullWidth
                    disableElevation
                    sx={{
                      textTransform: "none",
                      fontFamily: "Inter",
                      fontWeight: 600,
                      borderRadius: 2,
                      bgcolor: "#6366F1",
                      fontSize: { xs: "13px", md: "14px" },
                      "&:hover": { bgcolor: "#4F46E5" },
                    }}
                  >
                    {dmButton.text}
                  </Button>
                )}
              </Box>
            </Box>
          </Fade>
        )}
      </Card>
    </Box>
  );

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#F8FAFC" }}>
      {/* Header */}
      <Box
        sx={{
          bgcolor: "white",
          borderBottom: "1px solid",
          borderColor: "grey.200",
          position: "sticky",
          top: 0,
          zIndex: 1000,
          px: { xs: 2, sm: 3, md: 4 },
          py: { xs: 1.5, md: 2 },
        }}
      >
        <Stack direction="row" alignItems="center" spacing={{ xs: 1.5, md: 2 }} maxWidth="1400px" mx="auto">
          <IconButton
            onClick={() => navigate("/professional/fetch_media")}
            size={isMobile ? "small" : "medium"}
            sx={{
              bgcolor: "grey.100",
              "&:hover": { bgcolor: "grey.200" },
            }}
          >
            <KeyboardArrowLeftIcon fontSize={isMobile ? "small" : "medium"} />
          </IconButton>
          <Box flex={1}>
            <Typography
              sx={{
                fontFamily: "Inter",
                fontSize: { xs: "18px", sm: "20px", md: "24px" },
                fontWeight: 700,
                color: "#0F172A",
              }}
            >
              Create Automation
            </Typography>
            {!isMobile && (
              <Typography sx={{ fontFamily: "Inter", fontSize: "14px", color: "#64748B", mt: 0.5 }}>
                Set up automated responses for your Instagram post
              </Typography>
            )}
          </Box>
          {!isMobile && (
            <Box sx={{ minWidth: { sm: 160, md: 200 } }}>
              <Stack direction="row" alignItems="center" spacing={1.5}>
                <Box flex={1}>
                  <LinearProgress
                    variant="determinate"
                    value={progress}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      bgcolor: "#E2E8F0",
                      "& .MuiLinearProgress-bar": {
                        borderRadius: 4,
                        background: isFormValid
                          ? "linear-gradient(90deg, #10B981 0%, #059669 100%)"
                          : "linear-gradient(90deg, #3B82F6 0%, #8B5CF6 100%)",
                      },
                    }}
                  />
                </Box>
                <Typography
                  sx={{
                    fontFamily: "Inter",
                    fontSize: "14px",
                    fontWeight: 600,
                    color: isFormValid ? "#10B981" : "#3B82F6",
                  }}
                >
                  {progress}%
                </Typography>
              </Stack>
            </Box>
          )}
          {isMobile && (
            <IconButton
              onClick={() => setShowPreview(true)}
              sx={{
                bgcolor: "#EEF2FF",
                color: "#6366F1",
                "&:hover": { bgcolor: "#E0E7FF" },
              }}
            >
              <VisibilityOutlinedIcon fontSize="small" />
            </IconButton>
          )}
        </Stack>

        {/* Mobile Progress Bar */}
        {isMobile && (
          <Box sx={{ mt: 1.5 }}>
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{
                height: 6,
                borderRadius: 3,
                bgcolor: "#E2E8F0",
                "& .MuiLinearProgress-bar": {
                  borderRadius: 3,
                  background: isFormValid
                    ? "linear-gradient(90deg, #10B981 0%, #059669 100%)"
                    : "linear-gradient(90deg, #3B82F6 0%, #8B5CF6 100%)",
                },
              }}
            />
            <Typography
              sx={{
                fontFamily: "Inter",
                fontSize: "12px",
                fontWeight: 600,
                color: isFormValid ? "#10B981" : "#64748B",
                mt: 0.5,
                textAlign: "center",
              }}
            >
              {progress}% Complete
            </Typography>
          </Box>
        )}
      </Box>

      {/* Main Content */}
      <Box
        sx={{
          maxWidth: "1400px",
          mx: "auto",
          px: { xs: 2, sm: 3, md: 4 },
          py: { xs: 3, md: 4 },
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "380px 1fr" },
          gap: { xs: 3, md: 4 },
        }}
      >
        {/* Left Sidebar - Preview (Desktop Only) */}
        {!isMobile && (
          <Fade in timeout={600}>
            <Box>
              <PreviewPanel />
            </Box>
          </Fade>
        )}

        {/* Right - Form Steps */}
        <Box>
          <Stack spacing={{ xs: 2.5, md: 3 }}>
            {/* Validation Warning Alert */}
            <Collapse in={showValidationWarning}>
              <Alert
                severity="warning"
                icon={<WarningAmberIcon />}
                sx={{
                  borderRadius: { xs: 3, md: 4 },
                  border: "2px solid #FCD34D",
                  bgcolor: "#FEF3C7",
                  "& .MuiAlert-message": {
                    fontFamily: "Inter",
                    fontSize: { xs: "13px", md: "14px" },
                    fontWeight: 500,
                    color: "#92400E",
                  },
                }}
              >
                {validationMessage}
              </Alert>
            </Collapse>

            {/* Step 1: Keywords */}
            <Slide direction="up" in timeout={400}>
              <Card
                elevation={0}
                sx={{
                  borderRadius: { xs: 3, md: 4 },
                  border: "2px solid",
                  borderColor: keywords.length > 0 ? "#10B981" : "grey.200",
                  bgcolor: "white",
                  transition: "all 0.3s ease",
                  position: "relative",
                  overflow: "visible",
                }}
              >
                {keywords.length > 0 && (
                  <Box
                    sx={{
                      position: "absolute",
                      top: { xs: -10, md: -12 },
                      right: { xs: 16, md: 20 },
                      bgcolor: "#10B981",
                      borderRadius: "50%",
                      width: { xs: 24, md: 28 },
                      height: { xs: 24, md: 28 },
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <CheckCircleIcon sx={{ fontSize: { xs: 18, md: 20 }, color: "white" }} />
                  </Box>
                )}

                <CardContent sx={{ p: { xs: 2.5, sm: 3, md: 4 } }}>
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={{ xs: 2, sm: 2 }}
                    alignItems={{ xs: "flex-start", sm: "flex-start" }}
                    mb={3}
                  >
                    <Box
                      sx={{
                        width: { xs: 44, md: 48 },
                        height: { xs: 44, md: 48 },
                        borderRadius: 3,
                        background: "linear-gradient(135deg, #F59E0B 0%, #F97316 100%)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <LabelIcon sx={{ color: "white", fontSize: { xs: 22, md: 24 } }} />
                    </Box>
                    <Box flex={1}>
                      <Stack direction="row" alignItems="center" spacing={1} mb={0.5} flexWrap="wrap">
                        <Typography
                          sx={{
                            fontFamily: "Inter",
                            fontSize: { xs: "18px", md: "20px" },
                            fontWeight: 700,
                            color: "#0F172A",
                          }}
                        >
                          Trigger Keywords
                        </Typography>
                        <Chip
                          label="STEP 1"
                          size="small"
                          sx={{
                            bgcolor: "#FEF3C7",
                            color: "#92400E",
                            fontWeight: 700,
                            fontSize: { xs: "10px", md: "11px" },
                            height: { xs: 20, md: 22 },
                          }}
                        />
                      </Stack>
                      <Typography
                        sx={{
                          fontFamily: "Inter",
                          fontSize: { xs: "13px", md: "14px" },
                          color: "#64748B",
                          lineHeight: 1.5,
                        }}
                      >
                        Add keywords that will trigger your automation when found in comments
                      </Typography>
                    </Box>
                  </Stack>

                  <TextField
                    fullWidth
                    placeholder="Type keyword and press Enter..."
                    value={keywordInput}
                    onChange={(e) => setKeywordInput(e.target.value)}
                    onKeyDown={handleKeywordKeyDown}
                    variant="outlined"
                    sx={{
                      mb: 2,
                      "& .MuiOutlinedInput-root": {
                        borderRadius: { xs: 2, md: 3 },
                        fontFamily: "Inter",
                        bgcolor: "#F8FAFC",
                        border: "2px solid transparent",
                        fontSize: { xs: "14px", md: "15px" },
                        "&:hover": {
                          bgcolor: "white",
                          "& .MuiOutlinedInput-notchedOutline": {
                            borderColor: "#E2E8F0",
                          },
                        },
                        "&.Mui-focused": {
                          bgcolor: "white",
                          border: "2px solid #F59E0B",
                          "& .MuiOutlinedInput-notchedOutline": {
                            border: "none",
                          },
                        },
                      },
                    }}
                  />

                  {keywords.length > 0 && (
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: { xs: 1, md: 1.5 } }}>
                      {keywords.map((kw, i) => (
                        <Chip
                          key={i}
                          label={kw}
                          onDelete={() => handleDeleteKeyword(kw)}
                          sx={{
                            bgcolor: "#FFF7ED",
                            color: "#EA580C",
                            border: "1px solid #FDBA74",
                            fontFamily: "Inter",
                            fontWeight: 600,
                            fontSize: { xs: "13px", md: "14px" },
                            borderRadius: 2,
                            height: { xs: 32, md: 36 },
                            "& .MuiChip-deleteIcon": {
                              color: "#EA580C",
                              fontSize: { xs: 18, md: 20 },
                              "&:hover": {
                                color: "#C2410C",
                              },
                            },
                          }}
                        />
                      ))}
                    </Box>
                  )}

                  {keywords.length === 0 && (
                    <Alert
                      severity="info"
                      icon={<InfoOutlinedIcon />}
                      sx={{
                        bgcolor: "#EFF6FF",
                        border: "1px solid #BFDBFE",
                        borderRadius: 2,
                        "& .MuiAlert-message": {
                          fontFamily: "Inter",
                          fontSize: { xs: "12px", md: "13px" },
                          color: "#1E40AF",
                        },
                      }}
                    >
                      💡 Example: "interested", "dm me", "price", etc.
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </Slide>

            {/* Step 2: Public Reply */}
            <Slide direction="up" in timeout={500}>
              <Card
                elevation={0}
                sx={{
                  borderRadius: { xs: 3, md: 4 },
                  border: "2px solid",
                  borderColor:
                    (shouldReply === "yes" && commentReply.trim()) || shouldReply === "no"
                      ? "#10B981"
                      : keywords.length > 0 && shouldReply === "yes" && !commentReply.trim()
                      ? "#F59E0B"
                      : "grey.200",
                  bgcolor: "white",
                  transition: "all 0.3s ease",
                  position: "relative",
                  overflow: "visible",
                }}
              >
                {((shouldReply === "yes" && commentReply.trim()) || shouldReply === "no") && (
                  <Box
                    sx={{
                      position: "absolute",
                      top: { xs: -10, md: -12 },
                      right: { xs: 16, md: 20 },
                      bgcolor: "#10B981",
                      borderRadius: "50%",
                      width: { xs: 24, md: 28 },
                      height: { xs: 24, md: 28 },
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <CheckCircleIcon sx={{ fontSize: { xs: 18, md: 20 }, color: "white" }} />
                  </Box>
                )}

                <CardContent sx={{ p: { xs: 2.5, sm: 3, md: 4 } }}>
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={{ xs: 2, sm: 2 }}
                    alignItems={{ xs: "flex-start", sm: "flex-start" }}
                    mb={3}
                  >
                    <Box
                      sx={{
                        width: { xs: 44, md: 48 },
                        height: { xs: 44, md: 48 },
                        borderRadius: 3,
                        background: "linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <ChatBubbleOutlineIcon sx={{ color: "white", fontSize: { xs: 22, md: 24 } }} />
                    </Box>
                    <Box flex={1}>
                      <Stack direction="row" alignItems="center" spacing={1} mb={0.5} flexWrap="wrap">
                        <Typography
                          sx={{
                            fontFamily: "Inter",
                            fontSize: { xs: "18px", md: "20px" },
                            fontWeight: 700,
                            color: "#0F172A",
                          }}
                        >
                          Public Reply
                        </Typography>
                        <Chip
                          label="STEP 2"
                          size="small"
                          sx={{
                            bgcolor: "#DBEAFE",
                            color: "#1E40AF",
                            fontWeight: 700,
                            fontSize: { xs: "10px", md: "11px" },
                            height: { xs: 20, md: 22 },
                          }}
                        />
                      </Stack>
                      <Typography
                        sx={{
                          fontFamily: "Inter",
                          fontSize: { xs: "13px", md: "14px" },
                          color: "#64748B",
                          lineHeight: 1.5,
                        }}
                      >
                        Reply publicly to comments that match your keywords
                      </Typography>
                    </Box>
                  </Stack>

                  <FormControl component="fieldset" sx={{ mb: 2 }}>
                    <RadioGroup value={shouldReply} onChange={handleReplyChange} row>
                      <FormControlLabel
                        value="yes"
                        control={
                          <Radio
                            sx={{
                              color: "#3B82F6",
                              "&.Mui-checked": {
                                color: "#3B82F6",
                              },
                            }}
                          />
                        }
                        label={
                          <Typography
                            sx={{
                              fontFamily: "Inter",
                              fontSize: { xs: "14px", md: "15px" },
                              fontWeight: 500,
                            }}
                          >
                            Yes, reply
                          </Typography>
                        }
                      />
                      <FormControlLabel
                        value="no"
                        control={
                          <Radio
                            sx={{
                              color: "#3B82F6",
                              "&.Mui-checked": {
                                color: "#3B82F6",
                              },
                            }}
                          />
                        }
                        label={
                          <Typography
                            sx={{
                              fontFamily: "Inter",
                              fontSize: { xs: "14px", md: "15px" },
                              fontWeight: 500,
                            }}
                          >
                            No, skip
                          </Typography>
                        }
                      />
                    </RadioGroup>
                  </FormControl>

                  {shouldReply === "yes" && (
                    <Fade in>
                      <TextField
                        fullWidth
                        multiline
                        rows={isMobile ? 2 : 3}
                        placeholder="Write your public reply message here..."
                        value={commentReply}
                        onChange={(e) => setCommentReply(e.target.value)}
                        variant="outlined"
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            borderRadius: { xs: 2, md: 3 },
                            fontFamily: "Inter",
                            bgcolor: "#F8FAFC",
                            border: "2px solid transparent",
                            fontSize: { xs: "14px", md: "15px" },
                            "&:hover": {
                              bgcolor: "white",
                              "& .MuiOutlinedInput-notchedOutline": {
                                borderColor: "#E2E8F0",
                              },
                            },
                            "&.Mui-focused": {
                              bgcolor: "white",
                              border: "2px solid #3B82F6",
                              "& .MuiOutlinedInput-notchedOutline": {
                                border: "none",
                              },
                            },
                          },
                        }}
                      />
                    </Fade>
                  )}
                </CardContent>
              </Card>
            </Slide>

            {/* Step 3: Direct Message */}
            <Slide direction="up" in timeout={600}>
              <Card
                elevation={0}
                sx={{
                  borderRadius: { xs: 3, md: 4 },
                  border: "2px solid",
                  borderColor:
                    (shouldDM === "yes" && dmMessage.trim()) || shouldDM === "no"
                      ? "#10B981"
                      : keywords.length > 0 && shouldDM === "yes" && !dmMessage.trim()
                      ? "#F59E0B"
                      : "grey.200",
                  bgcolor: "white",
                  transition: "all 0.3s ease",
                  position: "relative",
                  overflow: "visible",
                }}
              >
                {((shouldDM === "yes" && dmMessage.trim()) || shouldDM === "no") && (
                  <Box
                    sx={{
                      position: "absolute",
                      top: { xs: -10, md: -12 },
                      right: { xs: 16, md: 20 },
                      bgcolor: "#10B981",
                      borderRadius: "50%",
                      width: { xs: 24, md: 28 },
                      height: { xs: 24, md: 28 },
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <CheckCircleIcon sx={{ fontSize: { xs: 18, md: 20 }, color: "white" }} />
                  </Box>
                )}

                <CardContent sx={{ p: { xs: 2.5, sm: 3, md: 4 } }}>
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={{ xs: 2, sm: 2 }}
                    alignItems={{ xs: "flex-start", sm: "flex-start" }}
                    mb={3}
                  >
                    <Box
                      sx={{
                        width: { xs: 44, md: 48 },
                        height: { xs: 44, md: 48 },
                        borderRadius: 3,
                        background: "linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <SendIcon sx={{ color: "white", fontSize: { xs: 22, md: 24 } }} />
                    </Box>
                    <Box flex={1}>
                      <Stack direction="row" alignItems="center" spacing={1} mb={0.5} flexWrap="wrap">
                        <Typography
                          sx={{
                            fontFamily: "Inter",
                            fontSize: { xs: "18px", md: "20px" },
                            fontWeight: 700,
                            color: "#0F172A",
                          }}
                        >
                          Direct Message
                        </Typography>
                        <Chip
                          label="STEP 3"
                          size="small"
                          sx={{
                            bgcolor: "#EDE9FE",
                            color: "#6B21A8",
                            fontWeight: 700,
                            fontSize: { xs: "10px", md: "11px" },
                            height: { xs: 20, md: 22 },
                          }}
                        />
                      </Stack>
                      <Typography
                        sx={{
                          fontFamily: "Inter",
                          fontSize: { xs: "13px", md: "14px" },
                          color: "#64748B",
                          lineHeight: 1.5,
                        }}
                      >
                        Send automated DM to users who comment with your keywords
                      </Typography>
                    </Box>
                  </Stack>

                  <FormControl component="fieldset" sx={{ mb: 2 }}>
                    <RadioGroup value={shouldDM} onChange={handleDMChoice} row>
                      <FormControlLabel
                        value="yes"
                        control={
                          <Radio
                            sx={{
                              color: "#8B5CF6",
                              "&.Mui-checked": {
                                color: "#8B5CF6",
                              },
                            }}
                          />
                        }
                        label={
                          <Typography
                            sx={{
                              fontFamily: "Inter",
                              fontSize: { xs: "14px", md: "15px" },
                              fontWeight: 500,
                            }}
                          >
                            Yes, send DM
                          </Typography>
                        }
                      />
                      <FormControlLabel
                        value="no"
                        control={
                          <Radio
                            sx={{
                              color: "#8B5CF6",
                              "&.Mui-checked": {
                                color: "#8B5CF6",
                              },
                            }}
                          />
                        }
                        label={
                          <Typography
                            sx={{
                              fontFamily: "Inter",
                              fontSize: { xs: "14px", md: "15px" },
                              fontWeight: 500,
                            }}
                          >
                            No, skip
                          </Typography>
                        }
                      />
                    </RadioGroup>
                  </FormControl>

                  {shouldDM === "yes" && (
                    <Fade in>
                      <Stack spacing={2}>
                        <TextField
                          fullWidth
                          multiline
                          rows={isMobile ? 3 : 4}
                          placeholder="Write your DM message here..."
                          value={dmMessage}
                          onChange={(e) => setDmMessage(e.target.value)}
                          variant="outlined"
                          sx={{
                            "& .MuiOutlinedInput-root": {
                              borderRadius: { xs: 2, md: 3 },
                              fontFamily: "Inter",
                              bgcolor: "#F8FAFC",
                              border: "2px solid transparent",
                              fontSize: { xs: "14px", md: "15px" },
                              "&:hover": {
                                bgcolor: "white",
                                "& .MuiOutlinedInput-notchedOutline": {
                                  borderColor: "#E2E8F0",
                                },
                              },
                              "&.Mui-focused": {
                                bgcolor: "white",
                                border: "2px solid #8B5CF6",
                                "& .MuiOutlinedInput-notchedOutline": {
                                  border: "none",
                                },
                              },
                            },
                          }}
                        />

                        <Box>
                          <Button
                            variant="outlined"
                            startIcon={<AddIcon />}
                            onClick={openBtnDialog}
                            size={isMobile ? "small" : "medium"}
                            sx={{
                              textTransform: "none",
                              fontFamily: "Inter",
                              fontWeight: 600,
                              borderRadius: 2,
                              borderColor: "#8B5CF6",
                              color: "#8B5CF6",
                              fontSize: { xs: "13px", md: "14px" },
                              "&:hover": {
                                borderColor: "#7C3AED",
                                bgcolor: "#F5F3FF",
                              },
                            }}
                          >
                            {dmButton ? "Edit Button" : "Add Button (Optional)"}
                          </Button>

                          {dmButton && (
                            <Fade in>
                              <Box
                                sx={{
                                  mt: 2,
                                  p: { xs: 1.5, md: 2 },
                                  borderRadius: 2,
                                  bgcolor: "#F5F3FF",
                                  border: "1px solid #DDD6FE",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  gap: 2,
                                }}
                              >
                                <Box flex={1} minWidth={0}>
                                  <Typography
                                    sx={{
                                      fontFamily: "Inter",
                                      fontSize: { xs: "13px", md: "14px" },
                                      fontWeight: 600,
                                      color: "#6B21A8",
                                    }}
                                  >
                                    {dmButton.text}
                                  </Typography>
                                  <Typography
                                    sx={{
                                      fontFamily: "Inter",
                                      fontSize: { xs: "11px", md: "12px" },
                                      color: "#64748B",
                                      mt: 0.5,
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
                                      whiteSpace: "nowrap",
                                    }}
                                  >
                                    {dmButton.url}
                                  </Typography>
                                </Box>
                                <IconButton size="small" onClick={() => setDmButton(null)}>
                                  <CloseIcon fontSize="small" />
                                </IconButton>
                              </Box>
                            </Fade>
                          )}
                        </Box>
                      </Stack>
                    </Fade>
                  )}
                </CardContent>
              </Card>
            </Slide>

            {/* Launch Button */}
            <Fade in timeout={800}>
              <Box sx={{ display: "flex", justifyContent: "center", pt: { xs: 1, md: 2 }, pb: { xs: 2, md: 0 } }}>
                <Button
                  variant="contained"
                  size="large"
                  onClick={handleStartAutomation}
                  startIcon={<RocketLaunchIcon />}
                  disabled={!isFormValid}
                  fullWidth={isMobile}
                  sx={{
                    minWidth: { xs: "100%", sm: 280 },
                    height: { xs: 50, md: 56 },
                    textTransform: "none",
                    fontFamily: "Inter",
                    fontSize: { xs: "16px", md: "18px" },
                    fontWeight: 700,
                    borderRadius: { xs: 2.5, md: 3 },
                    background: isFormValid
                      ? "linear-gradient(135deg, #10B981 0%, #059669 100%)"
                      : "linear-gradient(135deg, #E2E8F0 0%, #CBD5E1 100%)",
                    color: isFormValid ? "white" : "#94A3B8",
                    boxShadow: isFormValid ? "0 10px 30px rgba(16, 185, 129, 0.4)" : "none",
                    "&:hover": {
                      background: isFormValid
                        ? "linear-gradient(135deg, #059669 0%, #047857 100%)"
                        : "linear-gradient(135deg, #E2E8F0 0%, #CBD5E1 100%)",
                      boxShadow: isFormValid ? "0 15px 40px rgba(16, 185, 129, 0.5)" : "none",
                    },
                    "&.Mui-disabled": {
                      color: "#94A3B8",
                      opacity: 1,
                    },
                  }}
                >
                  {isFormValid ? "Launch Automation 🚀" : "Complete Required Steps"}
                </Button>
              </Box>
            </Fade>
          </Stack>
        </Box>
      </Box>

      {/* Mobile Preview Drawer */}
      <Drawer
        anchor="bottom"
        open={showPreview}
        onClose={() => setShowPreview(false)}
        PaperProps={{
          sx: {
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            maxHeight: "90vh",
            overflow: "auto",
          },
        }}
      >
        <Box sx={{ p: 3 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
            <Typography sx={{ fontFamily: "Inter", fontSize: "18px", fontWeight: 700 }}>Preview</Typography>
            <IconButton size="small" onClick={() => setShowPreview(false)}>
              <CloseIcon />
            </IconButton>
          </Stack>
          <PreviewPanel />
        </Box>
      </Drawer>

      {/* Button Dialog */}
      <Dialog
        open={dmBtnDialogOpen}
        onClose={closeBtnDialog}
        fullWidth
        maxWidth="xs"
        fullScreen={isMobile}
        PaperProps={{
          sx: {
            borderRadius: { xs: 0, sm: 4 },
            m: { xs: 0, sm: 2 },
          },
        }}
      >
        <DialogTitle
          sx={{
            fontFamily: "Inter",
            fontWeight: 700,
            fontSize: { xs: "18px", md: "20px" },
            pb: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          Add DM Button
          {isMobile && (
            <IconButton size="small" onClick={closeBtnDialog}>
              <CloseIcon />
            </IconButton>
          )}
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <TextField
            fullWidth
            label="Button Text"
            placeholder="e.g., Visit Website"
            value={dmButtonDraft.text}
            onChange={(e) => setDmButtonDraft((d) => ({ ...d, text: e.target.value }))}
            sx={{
              mb: 2.5,
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
                fontFamily: "Inter",
                fontSize: { xs: "14px", md: "15px" },
              },
            }}
          />
          <TextField
            fullWidth
            label="Button URL"
            placeholder="https://example.com"
            value={dmButtonDraft.url}
            onChange={(e) => setDmButtonDraft((d) => ({ ...d, url: e.target.value }))}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
                fontFamily: "Inter",
                fontSize: { xs: "14px", md: "15px" },
              },
            }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button
            onClick={closeBtnDialog}
            fullWidth={isMobile}
            sx={{
              textTransform: "none",
              fontFamily: "Inter",
              fontWeight: 600,
              borderRadius: 2,
              color: "#64748B",
              fontSize: { xs: "14px", md: "15px" },
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={saveBtnDialog}
            fullWidth={isMobile}
            sx={{
              textTransform: "none",
              fontFamily: "Inter",
              fontWeight: 600,
              borderRadius: 2,
              bgcolor: "#8B5CF6",
              fontSize: { xs: "14px", md: "15px" },
              "&:hover": {
                bgcolor: "#7C3AED",
              },
            }}
          >
            Save Button
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

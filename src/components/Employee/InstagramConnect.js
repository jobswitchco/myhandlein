// InstagramConnect.jsx
import { useEffect, useState, useCallback } from "react";
import {
  Box, Button, Card, CardContent, CircularProgress, Alert, Chip, Tooltip,
  Fade, Zoom, Dialog, DialogTitle, DialogContent, DialogActions, Avatar,
  Typography, Stack
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import {
  VerifiedUser as VerifiedIcon, TrendingUp as TrendingUpIcon, Visibility as VisibilityIcon,
  Instagram as InstagramIcon, LinkOff as LinkOffIcon, CheckCircle as CheckCircleIcon,
  Warning as WarningIcon, ArrowForward as ArrowForwardRoundedIcon
} from "@mui/icons-material";
import axios from "axios";
import FeaturedPlayListOutlinedIcon from '@mui/icons-material/FeaturedPlayListOutlined';
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

/** --- NEW: business login constants --- */
const FB_APP_ID = "1360956302356492";
const FB_LOGIN_CONFIG_ID = "2452082071860610"; // from App → Facebook Login for Business → Configurations
const REDIRECT_URI = "https://myhandle.in/api/usersOn/meta-callback";
const FRONTEND_ORIGIN = 'https://myhandle.in';


/** Your existing backend endpoints */
const BACKEND_STATUS_URL  = "/api/usersOn/instagram-status";
const BACKEND_UNLINK_URL  = "/api/usersOn/unlink-instagram";
/** Optional: endpoint to list IG accounts after auth if you want */
const BACKEND_ACCOUNTS_URL = "/api/usersOn/list-instagram-accounts";
const BACKEND_SAVE_URL     = "/api/usersOn/save-instagram-account";

export default function InstagramConnect() {
  const theme = useTheme();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [checkingStatus, setCheckingStatus] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [connectedAccount, setConnectedAccount] = useState(null);
  const [selectOpen, setSelectOpen] = useState(false);
  const [candidates, setCandidates] = useState([]);


  const [unlinkDialogOpen, setUnlinkDialogOpen] = useState(false);
  const [unlinking, setUnlinking] = useState(false);

  const [savedIgUserId, setSavedIgUserId] = useState(null);

  // --- Check connection on mount
  useEffect(() => {
    (async () => {
      try {
        const { data } = await axios.get(BACKEND_STATUS_URL, { withCredentials: true });
        if (data?.instagramConnected) {
          setIsConnected(true);
          setConnectedAccount({
            username: data.igUsername,
            profilePic: data.igProfilePic,
            followersCount: data.followersCount,
          });
        }
      } catch (e) {
        console.error(e);
      } finally {
        setCheckingStatus(false);
      }
    })();
  }, []);

  /** --- NEW: open Business Login popup and wait for postMessage --- */
// InstagramConnect.jsx (only inside openBusinessLogin)
const openBusinessLogin = useCallback(async () => {
  setError("");
  setLoading(true);

  try {
    // 1) Ask backend for a signed state bound to this user
    const stateResp = await axios.post("/api/usersOn/meta-state", {}, { withCredentials: true });
    const state = stateResp.data?.state;
    console.log('state : ', state);
    if (!state) throw new Error("Unable to start Meta login");

    // 2) Build OAuth URL with signed state (no random state now)
    const q = new URLSearchParams({
      client_id: FB_APP_ID,
      redirect_uri: REDIRECT_URI,
      state,                         // <-- signed, user-bound
      response_type: "code",
      config_id: FB_LOGIN_CONFIG_ID,
    });

    const authUrl = `https://www.facebook.com/v24.0/dialog/oauth?${q.toString()}`;
    const w = 680, h = 760;
    const y = window.top.outerHeight / 2 + window.top.screenY - (h / 2);
    const x = window.top.outerWidth / 2 + window.top.screenX - (w / 2);

    const popup = window.open(
      authUrl,
      "metaBusinessLogin",
      `width=${w},height=${h},left=${x},top=${y},resizable=yes,scrollbars=yes`
    );
    if (!popup) throw new Error("Popup blocked. Please allow popups and try again.");

    const onMessage = async (event) => {
      const msg = event.data || {};
      if (msg.type !== "meta-auth") return;
      window.removeEventListener("message", onMessage);

      try {
        if (!msg.success) {
          setError(msg.error || "Facebook Business Login failed.");
          return;
        }
        const arr = msg.candidates || [];
        console.log('heheheheehe : ', arr);
        console.log('candidates : ', msg.candidates);
        if (arr.length === 1) {
          await handleSelect(arr[0]);
        } else if (arr.length > 1) {
          setCandidates(arr);
          setSelectOpen(true);
        } else {
          setError("No Instagram business accounts found.");
        }
      } catch (err) {
        setError(err?.response?.data?.error || err.message || "Failed after login.");
      } finally {
        setLoading(false);
      }
    };

    window.addEventListener("message", onMessage);

    const poll = setInterval(() => {
      if (popup.closed) {
        clearInterval(poll);
        window.removeEventListener("message", onMessage);
        setLoading(false);
      }
    }, 500);
  } catch (e) {
    setError(e.message || "Failed to start Meta login");
    setLoading(false);
  }
}, []);


  /** Save one selected IG account (same as your previous logic) */
  const handleSelect = useCallback(async (acc) => {
    try {
      const result = await axios.post(
        BACKEND_SAVE_URL,
        {
          pageId: acc.pageId,
          igUserId: acc.igUserId,
          username: acc.username,
          pageAccessToken: acc.pageAccessToken,
        },
        { withCredentials: true }
      );
      if (result.data?.success) {
        setSavedIgUserId(acc.igUserId);
        setIsConnected(true);
        setConnectedAccount({
          username: acc.username,
          profilePic: acc.profilePic,
          followersCount: acc.followersCount,
        });
      } else {
        setError("Failed to save Instagram account");
      }
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.error || err.message || "Failed to save Instagram account");
    }
  }, []);

  const handleUnlinkClick = () => setUnlinkDialogOpen(true);
  const handleCloseDialog = () => setUnlinkDialogOpen(false);

  const handleUnlink = useCallback(async () => {
    setUnlinking(true);
    try {
      const r = await axios.post(BACKEND_UNLINK_URL, {}, { withCredentials: true });
      if (r.status) {
        setUnlinkDialogOpen(false);
        toast.success("Instagram is Disconnected!");
        setTimeout(() => {
          setIsConnected(false);
          setConnectedAccount(null);
          setError("");
        }, 600);
      }
    } catch (err) {
      console.error("Unlink failed:", err);
      setError(err?.response?.data?.error || err.message || "Failed to unlink Instagram");
    } finally {
      setUnlinking(false);
    }
  }, []);

  // --------- UI (unchanged except the Connect button now calls openBusinessLogin) ---------

  if (checkingStatus) {
    return (
      <Card elevation={0} sx={{ maxWidth: 860, mx: "auto", borderRadius: 4, overflow: "hidden" }}>
        <CardContent>
          <Box display="flex" justifyContent="center" alignItems="center" py={6}>
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (isConnected && connectedAccount) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', height: '100vh' }}>
        {/* ... your existing Connected card ... */}
        {/* only the Unlink handlers changed */}
        {/* (omitted here for brevity — keep your exact JSX from your message) */}
      </Box>
    );
  }

  // Not Connected state
  return (
    <>
    <Box sx={{ display: 'flex', alignItems: 'center', height: '100vh' }}>
      <Card elevation={0} sx={{ maxWidth: 860, mx: "auto", borderRadius: 4, color: "white",
        position: "relative", overflow: "hidden",
        background: "linear-gradient(135deg, #C9CDCF 0%, #67C090 45%, #08CB00 100%)",
        boxShadow: "0 20px 60px rgba(29, 17, 86, 0.35)" }}>
        {/* ... your existing pretty UI ... */}

        {error && (
          <Fade in>
            <Alert severity="error" sx={{ bgcolor: alpha("#ffffff", 0.96), color: theme.palette.error.dark, borderRadius: 2 }}>
              {error}
            </Alert>
          </Fade>
        )}

        <Box textAlign="center">
          <Tooltip title={loading ? "Connecting..." : ""}>
            <span>
              <Button
                variant="contained"
                size="large"
                disabled={loading}
                onClick={openBusinessLogin}          // <-- changed
                startIcon={!loading ? <InstagramIcon sx={{ color: '#E1306C' }} /> : null}
                sx={{
                  minWidth: 300, py: 1.6, fontSize: "1.05rem", fontWeight: 800, letterSpacing: 0.2,
                  bgcolor: "white", color: "#5b7fff", borderRadius: 2.5,
                  boxShadow: "0 14px 30px rgba(0,0,0,0.28)",
                  "&:hover": { bgcolor: alpha("#ffffff", 0.95), transform: "translateY(-2px)", boxShadow: "0 18px 40px rgba(0,0,0,0.3)" },
                }}
              >
                {loading ? <CircularProgress size={22} /> :
                  <Typography sx={{ fontFamily: 'Inter', fontSize: '18px', fontWeight: 600, textTransform: 'none', color: '#E1306C' }}>
                    Connect Instagram
                  </Typography>}
              </Button>
            </span>
          </Tooltip>
          <Typography variant="caption" display="block" mt={2} sx={{ opacity: 0.85 }}>
            Secure via Facebook Business Login • Takes 10 seconds
          </Typography>
        </Box>

      </Card>
    </Box>

    <Dialog open={selectOpen} onClose={() => setSelectOpen(false)} maxWidth="sm" fullWidth>
  <DialogTitle>Select an Instagram account</DialogTitle>
  <DialogContent dividers>
    <Stack spacing={1.5}>
      {candidates.map((acc) => (
        <Button
          key={acc.igUserId}
          onClick={() => handleSelect(acc)}
          variant="outlined"
          sx={{ justifyContent: "flex-start", textTransform: "none" }}
          startIcon={
            <Avatar src={acc.profilePic} alt={acc.username} sx={{ width: 32, height: 32 }} />
          }
        >
          @{acc.username}
          <Typography component="span" sx={{ ml: 1, opacity: 0.7 }}>
            • {acc.followersCount ?? 0} followers
          </Typography>
          <Typography component="span" sx={{ ml: "auto", opacity: 0.6 }}>
            {acc.pageName}
          </Typography>
        </Button>
      ))}
    </Stack>
  </DialogContent>
  <DialogActions>
    <Button onClick={() => setSelectOpen(false)}>Cancel</Button>
  </DialogActions>
</Dialog>

</>

  );
}

/** Unchanged */
function FeatureChip({ icon, title, subtitle }) {
  return (
    <Stack direction="row" spacing={1.5} alignItems="center"
      sx={{ flex: "1 1 240px", minWidth: 0, p: 1.25, pr: 1.5, borderRadius: 2,
        bgcolor: (t) => alpha("#ffffff", 0.18),
        border: "1px solid rgba(255,255,255,0.22)", backdropFilter: "blur(6px)" }}>
      <Box sx={{ minWidth: 40, height: 40, borderRadius: 1.5, bgcolor: "white",
        display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 20px rgba(0,0,0,0.25)" }}>
        {icon}
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ fontFamily: 'Inter', fontSize: 15, fontWeight: 600, lineHeight: 1.1 }}>{title}</Typography>
        <Typography sx={{ fontFamily: 'Inter', fontSize: 13, mt: 0.25 }} noWrap>{subtitle}</Typography>
      </Box>
    </Stack>
  );
}

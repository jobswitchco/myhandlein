// InstagramConnect.jsx
import { useEffect, useState, useCallback } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Typography,
  Stack,
  Alert,
  Chip,
  Tooltip,
  Fade,
  Zoom,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import {
  VerifiedUser as VerifiedIcon,
  TrendingUp as TrendingUpIcon,
  Visibility as VisibilityIcon,
  Instagram as InstagramIcon,
  LinkOff as LinkOffIcon,
  CheckCircle as CheckCircleIcon,
  Logout as LogoutRoundedIcon,
  ArrowForward as ArrowForwardRoundedIcon,
  Warning as WarningIcon,
} from "@mui/icons-material";
import axios from "axios";
import FeaturedPlayListOutlinedIcon from '@mui/icons-material/FeaturedPlayListOutlined';
import 'react-toastify/dist/ReactToastify.css';
import { toast } from "react-toastify";


const FB_APP_ID = "1811723003562002";
const BACKEND_CONNECT_URL = "/api/usersOn/connect-instagram";
const BACKEND_STATUS_URL = "/api/usersOn/instagram-status";
const BACKEND_UNLINK_URL = "/api/usersOn/unlink-instagram";

function loadFacebookSDK() {
  return new Promise((resolve) => {
    if (window.FB) return resolve(true);

    window.fbAsyncInit = function () {
      window.FB.init({
        appId: FB_APP_ID,
        cookie: true,
        xfbml: false,
        version: "v20.0",
      });
      resolve(true);
    };

    (function (d, s, id) {
      const fjs = d.getElementsByTagName(s)[0];
      if (d.getElementById(id)) return;
      const js = d.createElement(s);
      js.id = id;
      js.src = "https://connect.facebook.net/en_US/sdk.js";
      fjs.parentNode.insertBefore(js, fjs);
    })(document, "script", "facebook-jssdk");
  });
}

export default function InstagramConnect() {
  const theme = useTheme();

  const [sdkReady, setSdkReady] = useState(false);
  const [auth, setAuth] = useState(null);
  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");
  const [igAccounts, setIgAccounts] = useState([]);
  const [saving, setSaving] = useState(false);
  const [savedIgUserId, setSavedIgUserId] = useState(null);

  // Connection status state
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [connectedAccount, setConnectedAccount] = useState(null);

  // Dialog state for unlink confirmation
  const [unlinkDialogOpen, setUnlinkDialogOpen] = useState(false);
  const [unlinking, setUnlinking] = useState(false);

  // Check Instagram connection status on mount
  useEffect(() => {
    const checkConnectionStatus = async () => {
      try {
        const response = await axios.get(BACKEND_STATUS_URL, { withCredentials: true });
        if (response?.data?.instagramConnected) {
          setIsConnected(true);
          setConnectedAccount({
            username: response.data.igUsername,
            profilePic: response.data.igProfilePic,
            followersCount: response.data.followersCount,
          });
        }
      } catch (err) {
        console.error("Error checking Instagram status:", err);
      } finally {
        setCheckingStatus(false);
      }
    };

    checkConnectionStatus();
  }, []);

  useEffect(() => {
    let mounted = true;
    loadFacebookSDK().then(() => {
      if (!mounted) return;
      setSdkReady(true);

      window.FB.getLoginStatus((res) => {
        if (res.status === "connected") {
          setAuth(res.authResponse);
        }
      });
    });
    return () => {
      mounted = false;
    };
  }, []);

  // Login and immediately fetch Instagram accounts
 const login = useCallback(() => {
  if (!sdkReady) return;

  setError("");
  setLoading(true);

  window.FB.login(
    (response) => {
      if (response.status !== "connected") {
        setLoading(false);
        setError("Login canceled or failed. Please try again.");
        return;
      }

      setAuth(response.authResponse);
        setCheckingStatus(true);
     

      axios
        .post(
          BACKEND_CONNECT_URL,
          { data: response.authResponse },
          { withCredentials: true }
        )
        .then(({ data }) => {
          if (data?.success && Array.isArray(data.igAccounts)) {
            setIgAccounts(data.igAccounts);

            setIsConnected(true);
          setConnectedAccount({
            username: data.igUsername,
            profilePic: data.igProfilePic,
            followersCount: data.followersCount,
          });
          } else {
            setError(data?.message || "Failed to fetch Instagram accounts");
          }
        })
        .catch((err) => {
          console.error("Error fetching IG accounts:", err);
          const msg =
            err?.response?.data?.error ||
            err?.message ||
            "Failed to fetch Instagram accounts";
          setError(msg);
        })
        .finally(() => {
          // setLoading(false);
        setCheckingStatus(false);

        });
    },
    {
      scope:
        "pages_show_list,public_profile,business_management",

      return_scopes: true,
    }
  );
}, [sdkReady]);


  // Open unlink dialog
  const handleUnlinkClick = () => {
    setUnlinkDialogOpen(true);
  };

  // Close unlink dialog
  const handleCloseDialog = () => {
    setUnlinkDialogOpen(false);
  };

  // Actual unlink handler
  const handleUnlink = useCallback(async () => {
    setUnlinking(true);
    try {
      const unlinkStatus = await axios.post(BACKEND_UNLINK_URL, {}, { withCredentials: true });

      if(unlinkStatus.status){
          setUnlinkDialogOpen(false);
        toast.success('Instagram is Disconnected!');
        setTimeout(() => {
          setIsConnected(false);
          setConnectedAccount(null);
          setError("");
        }, 1000);
      }
    } catch (err) {
      console.error("Unlink failed:", err);
      setError(err.response?.data?.error || err.message || "Failed to unlink Instagram");
    } finally {
      setUnlinking(false);
    }
  }, []);

  if (checkingStatus) {
    return (
      <Card
        elevation={0}
        sx={{
          maxWidth: 860,
          mx: "auto",
          borderRadius: 4,
          overflow: "hidden",
        }}
      >
        <CardContent>
          <Box display="flex" justifyContent="center" alignItems="center" py={6}>
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
    );
  }

  // Connected State UI
  if (isConnected && connectedAccount) {
    return (
    <Box sx={{ display : 'flex', alignItems : 'center', height: '100vh'}}>
      <Card
        elevation={0}
        sx={{
          maxWidth: 860,
          mx: "auto",
          borderRadius: 4,
          color: "white",
          position: "relative",
          overflow: "hidden",
          background: "linear-gradient(135deg, #34d399 0%, #10b981 40%, #059669 100%)",
          boxShadow: "0 20px 60px rgba(0, 96, 64, 0.35)",
        }}
      >
        <Box
          aria-hidden
          sx={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(700px 280px at -10% 10%, rgba(255,255,255,0.18) 0%, transparent 60%), radial-gradient(600px 280px at 110% 110%, rgba(255,255,255,0.16) 0%, transparent 60%)",
            pointerEvents: "none",
          }}
        />
        <CardContent sx={{ p: { xs: 3, sm: 4, md: 5 }, position: "relative" }}>
          <Stack spacing={3.5}>
            <Stack direction="row" alignItems="center" spacing={1.2}>
              <CheckCircleIcon sx={{ color: "white", fontSize: 28 }} />
              <Typography sx={{ fontFamily : 'Inter', fontWeight : 700, fontSize : '26px'}}>
                Instagram Connected
              </Typography>
            </Stack>

            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 3,
                p: { xs: 2, sm: 3 },
                bgcolor: alpha("#ffffff", 0.12),
                borderRadius: 3,
                border: "1px solid " + alpha("#ffffff", 0.2),
                backdropFilter: "blur(10px)",
              }}
            >
              <Avatar
                src={connectedAccount.profilePic}
                alt={connectedAccount.username}
                variant="rounded"
                sx={{
                  width: 80,
                  height: 80,
                  border: "3px solid",
                  borderColor: alpha("#ffffff", 0.6),
                  boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
                }}
              >
                <InstagramIcon sx={{ fontSize: 40 }} />
              </Avatar>

              <Box flex={1} minWidth={0}>
                <Typography gutterBottom noWrap sx={{fontFamily : 'Inter', fontWeight : 600, fontSize : '20px' }}>
                  @{connectedAccount.username} | {connectedAccount.followersCount} Followers
                </Typography>
                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                  <Chip
                    icon={<VerifiedIcon sx={{ color: "inherit !important" }} />}
                    label="Connected"
                    size="small"
                    sx={{
                      color: "white",
                      bgcolor: alpha("#ffffff", 0.2),
                      border: "1px solid " + alpha("#ffffff", 0.3),
                      ".MuiChip-icon": { color: "white" },
                    }}
                  />
                </Stack>
              </Box>

              <Tooltip title="Unlink this Instagram account">
                <span>
                  <Button
                    variant="outlined"
                    color="inherit"
                    startIcon={<LinkOffIcon />}
                    onClick={handleUnlinkClick}
                    sx={{
                      textTransform : 'none',
                      minWidth: 160,
                      borderColor: alpha("#ffffff", 0.55),
                      "&:hover": { bgcolor: alpha("#ffffff", 0.1), borderColor: "white" },
                    }}
                  >
                    Unlink Instagram
                  </Button>
                </span>
              </Tooltip>
            </Box>

            <Alert
              severity="success"
              icon={<CheckCircleIcon />}
              sx={{
                bgcolor: alpha("#ffffff", 0.96),
                color: theme.palette.success.dark,
                borderRadius: 2,
              }}
            >
              Your Instagram is linked! Your follower count will be displayed on your Link In Bio
              page for added credibility.
            </Alert>
          </Stack>
        </CardContent>
      </Card>

      {/* Unlink Confirmation Dialog */}
      <Dialog
        open={unlinkDialogOpen}
        onClose={handleCloseDialog}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
          }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 40,
                height: 40,
                borderRadius: "50%",
                bgcolor: alpha(theme.palette.warning.main, 0.1),
              }}
            >
              <WarningIcon sx={{ color: theme.palette.warning.main }} />
            </Box>
            <Typography sx={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 20 }}>
              Unlink Instagram?
            </Typography>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ fontFamily: 'Inter', fontSize: 15, color: 'text.secondary', mt: 1 }}>
            Are you sure you want to unlink your Instagram account? Your follower count will no longer be displayed on your Link In Bio page.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button
            onClick={handleCloseDialog}
            disabled={unlinking}
            sx={{
              textTransform: 'none',
              fontFamily: 'Inter',
              fontWeight: 600,
              color: 'text.secondary',
              "&:hover": {
                bgcolor: alpha(theme.palette.text.primary, 0.05),
              }
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleUnlink}
            disabled={unlinking}
            variant="contained"
            color="error"
            sx={{
              textTransform: 'none',
              fontFamily: 'Inter',
              fontWeight: 600,
              minWidth: 120,
            }}
          >
            {unlinking ? <CircularProgress size={20} sx={{ color: 'white' }} /> : "Yes, Proceed"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
    );
  }

  // Not Connected State UI
  return (
    <Box sx={{ display : 'flex', alignItems : 'center', height: '100vh'}}>
    <Card
      elevation={0}
      sx={{
        maxWidth: 860,
        mx: "auto",
        border: "none",
        color: "white",
        position: "relative",
        overflow: "hidden",
        borderRadius: 4,
        background: "linear-gradient(135deg, #C9CDCF 0%, #67C090 45%, #08CB00 100%)",
        boxShadow: "0 20px 60px rgba(29, 17, 86, 0.35)",
      }}
    >
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(800px 300px at 10% -10%, rgba(255,255,255,0.2) 0%, transparent 60%), radial-gradient(600px 300px at 110% 110%, rgba(255,255,255,0.18) 0%, transparent 60%)",
          pointerEvents: "none",
        }}
      />
      <CardContent sx={{ p: { xs: 3, sm: 4, md: 5 }, position: "relative" }}>
        <Stack spacing={3.5}>
          {/* Header */}
          <Box textAlign="center">
            <Zoom in>
              <Box
                sx={{
                  display: "inline-flex",
                  p: 2,
                  borderRadius: "50%",
                  bgcolor: alpha("#ffffff", 0.18),
                  mb: 2,
                  boxShadow: "0 8px 30px rgba(0,0,0,0.25)",
                  backdropFilter: "blur(6px)",
                }}
              >
                <InstagramIcon sx={{ fontSize: 44, color: "#E1306C" }} />
              </Box>
            </Zoom>
            <Typography sx={{ fontFamily: "Inter, system-ui", fontSize: { xs: 26, sm: 32 }, fontWeight: 800, letterSpacing: 0.2, color: '#E1306C' }}>
              Boost Your Credibility
            </Typography>
            <Typography sx={{ opacity: 0.95, fontFamily: "Inter, system-ui", fontSize: { xs: 16, sm: 18 }, mt: 0.5 }}>
              Connect Instagram & Stand Out
            </Typography>

            {/* Steps */}
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1}
              justifyContent="center"
              alignItems="center"
              sx={{ mt: 2 }}
            >
              {["Login with Facebook", "Select IG Account, that's it"].map((label, i) => {
                const done =
                  (i === 0 && !!auth?.accessToken) ||
                  (i === 1 && !!savedIgUserId) ||
                  (i === 2 && !!savedIgUserId);
                return (
                  <Stack key={label} direction="row" spacing={1.2} alignItems="center">
                    <Chip
                      label={i + 1}
                      icon={done ? <CheckCircleIcon /> : undefined}
                      sx={{
                        color: "white",
                        bgcolor: done ? alpha(theme.palette.success.main, 0.9) : alpha("#ffffff", 0.16),
                        ".MuiChip-icon": { color: "white" },
                        fontWeight: 800,
                      }}
                    />
                    <Typography sx={{ fontSize: 13, opacity: 0.9 }}>{label}</Typography>
                    {i < 1 && (
                      <ArrowForwardRoundedIcon
                        fontSize="small"
                        sx={{ mx: { xs: "auto", sm: 1 }, opacity: 0.6 }}
                      />
                    )}
                  </Stack>
                );
              })}
            </Stack>
          </Box>
          

          {/* Features */}
          <Box
            sx={{
              bgcolor: alpha("#ffffff", 0.14),
              border: "1px solid " + alpha("#ffffff", 0.18),
              borderRadius: 3,
              p: { xs: 2, sm: 3 },
              backdropFilter: "blur(10px)",
            }}
          >
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} useFlexGap sx={{ flexWrap: "wrap" }}>
              <FeatureChip icon={<VerifiedIcon sx={{ color : '#4C763B'}}/>} title="Verified Authenticity" subtitle="Show you're the real owner." />
              <FeatureChip icon={<TrendingUpIcon sx={{ color : '#FF0066'}}/>} title="Follower Count" subtitle="Let your followers count speak." />
              <FeatureChip icon={<VisibilityIcon sx={{ color : '#1055C9'}}/>} title="Instant Trust" subtitle="3× more engagement." />
              <FeatureChip icon={<FeaturedPlayListOutlinedIcon sx={{ color : '#000000'}}/>} title="More Features" subtitle="are coming soon..." />
            </Stack>
          </Box>

          {/* Error */}
          {error && (
            <Fade in>
              <Alert
                severity="error"
                sx={{
                  bgcolor: alpha("#ffffff", 0.96),
                  color: theme.palette.error.dark,
                  borderRadius: 2,
                }}
              >
                {error}
              </Alert>
            </Fade>
          )}

          {/* Connect / Logged in */}
          {!auth?.accessToken && (
            <Box textAlign="center">
              <Tooltip title={!sdkReady ? "SDK not ready" : loading ? "Connecting..." : ""}>
                <span>
                  <Button
                    variant="contained"
                    size="large"
                    disabled={!sdkReady || loading}
                    onClick={login}
                    startIcon={loading ? null : <InstagramIcon sx={{ color : '#E1306C'}}/>}
                    sx={{
                      minWidth: 300,
                      py: 1.6,
                      fontSize: "1.05rem",
                      fontWeight: 800,
                      letterSpacing: 0.2,
                      bgcolor: "white",
                      color: "#5b7fff",
                      borderRadius: 2.5,
                      boxShadow: "0 14px 30px rgba(0,0,0,0.28)",
                      transition: "transform .2s ease, box-shadow .2s ease, background .2s ease",
                      "&:hover": {
                        bgcolor: alpha("#ffffff", 0.95),
                        transform: "translateY(-2px)",
                        boxShadow: "0 18px 40px rgba(0,0,0,0.3)",
                      },
                    }}
                  >
                    {loading ? <CircularProgress size={22} /> : 
                    <Typography sx={{ fontFamily : 'Inter', fontSize : '18px', fontWeight: 600, textTransform : 'none', color: '#E1306C'}}>Connect Instagram</Typography>}
                  </Button>
                </span>
              </Tooltip>
              <Typography variant="caption" display="block" mt={2} sx={{ opacity: 0.85 }}>
                Secure via Facebook APIs • Takes 10 seconds
              </Typography>
            </Box>
          )}
        </Stack>
      </CardContent>
    </Card>
    </Box>
  );
}

/** Small presentational subcomponent for features */
function FeatureChip({ icon, title, subtitle }) {
  return (
    <Stack
      direction="row"
      spacing={1.5}
      alignItems="center"
      sx={{
        flex: "1 1 240px",
        minWidth: 0,
        p: 1.25,
        pr: 1.5,
        borderRadius: 2,
        bgcolor: (t) => alpha("#ffffff", 0.18),
        border: "1px solid rgba(255,255,255,0.22)",
        backdropFilter: "blur(6px)",
      }}
    >
      <Box
        sx={{
          minWidth: 40,
          height: 40,
          borderRadius: 1.5,
          bgcolor: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 8px 20px rgba(0,0,0,0.25)",
        }}
      >
        {icon}
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{fontFamily: 'Inter', fontSize: 15, fontWeight: 600, lineHeight: 1.1 }}>{title}</Typography>
        <Typography sx={{ fontFamily: 'Inter', fontSize: 13, mt: 0.25 }} noWrap>
          {subtitle}
        </Typography>
      </Box>
    </Stack>
  );
}
// AutomationList.jsx (JS)
import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  Box,
  Stack,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Chip,
  Avatar,
  Card,
  CardContent,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import InstagramIcon from "@mui/icons-material/Instagram";
import { DataGrid } from "@mui/x-data-grid";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

/** ---------- Small components ---------- */
function EmptyState({ onCreate }) {
  return (
    <Box
      sx={{
        py: 8,
        px: 3,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 2.5,
        border: "1px dashed",
        borderColor: "divider",
        borderRadius: 3,
        bgcolor: "background.default",
        textAlign: "center",
      }}
    >
      <Box
        sx={{
          width: 64,
          height: 64,
          borderRadius: "50%",
          display: "grid",
          placeItems: "center",
          bgcolor: "action.hover",
        }}
      >
        <InfoOutlinedIcon fontSize="large" />
      </Box>

      <Stack spacing={0.5}>
        <Typography sx={{ fontFamily: "Inter", fontSize: 20, fontWeight: 600, letterSpacing: 0.2 }}>
          Create your first automation
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary", maxWidth: 520, mx: "auto" }}>
          You don’t have any automations yet. Set up your first one to auto-DM,
          track status, and manage everything from one place.
        </Typography>
      </Stack>

      <Button
        variant="contained"
        startIcon={<AddIcon />}
        onClick={onCreate}
        sx={{ textTransform: "none", borderRadius: 2, px: 2.5 }}
      >
        New Automation
      </Button>
    </Box>
  );
}

/** ---------- Main Screen ---------- */
export default function AutomationList() {
  const navigate = useNavigate();

  /** ---- Backend endpoints (match InstagramConnect.jsx) ---- */
  const STATUS_URL = "/api/usersOn/instagram-status";     // { instagramConnected: boolean, ... }
  const META_STATE_URL = "/api/usersOn/meta-state";       // { state }
  const AUTOMATIONS_URL = "/api/usersOn/automations";     // GET ?page=1&limit=10

  /** ---- Meta app constants (same as InstagramConnect.jsx) ---- */
  const FB_APP_ID = "1360956302356492";
  const FB_LOGIN_CONFIG_ID = "2452082071860610";
  const REDIRECT_URI = "https://myhandle.in/api/usersOn/meta-callback";
  // Optional: if you want to strictly verify event.origin
  const FRONTEND_ORIGIN = window.location.origin; // e.g., https://myhandle.in

  /** ---- IG connect state ---- */
  const [igConnected, setIgConnected] = useState(null); // null = unknown; true/false after check
  const [igCheckErr, setIgCheckErr] = useState("");

  const [connectLoading, setConnectLoading] = useState(false);
  const [connectError, setConnectError] = useState("");

  /** ---- Table state ---- */
  const [rows, setRows] = useState([]);
  const [rowCount, setRowCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // server pagination state
  const [page, setPage] = useState(0); // 0-indexed for DataGrid
  const [pageSize, setPageSize] = useState(10);

  /** ---- Helpers ---- */
  const openCenteredPopup = (url) => {
    const w = 680, h = 760;
    const topWin = window.top || window;
    const y = (topWin.outerHeight / 2 + topWin.screenY) - (h / 2);
    const x = (topWin.outerWidth / 2 + topWin.screenX) - (w / 2);

    const features = [
      `width=${w}`,
      `height=${h}`,
      `left=${Math.max(0, x)}`,
      `top=${Math.max(0, y)}`,
      "resizable=yes",
      "scrollbars=yes",
    ].join(",");

    const popup = window.open(url, "metaBusinessLogin", features);
    if (!popup || popup.closed || typeof popup.closed === "undefined") {
      // popup blocked – fallback to full-page redirect
      window.location.href = url;
      return null;
    }
    return popup;
  };

  /** ---- Initial IG connection check ---- */
  const checkIgConnection = useCallback(async () => {
    setIgCheckErr("");
    setIgConnected(null);
    try {
      const res = await axios.get(STATUS_URL, { withCredentials: true });
      const { instagramConnected = false } = res.data || {};
      setIgConnected(!!instagramConnected);
      return !!instagramConnected;
    } catch (e) {
      setIgCheckErr(e?.response?.data?.message || e.message || "Failed to verify Instagram link");
      setIgConnected(false);
      return false;
    }
  }, [STATUS_URL]);

  useEffect(() => {
    (async () => {
      const ok = await checkIgConnection();
      if (ok) {
        fetchPage(0, pageSize);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** ---- Fetch automations (only when connected) ---- */
  const fetchPage = useCallback(
    async (pageArg = page, limitArg = pageSize) => {
      if (!igConnected) return;
      setLoading(true);
      setErr("");
      try {
        const res = await axios.get(`${AUTOMATIONS_URL}?page=${pageArg + 1}&limit=${limitArg}`, {
          withCredentials: true,
        });

        const {
          items = [],
          total = 0,
          page: serverPage = 1,
          limit = limitArg,
        } = res.data || {};

        const startIndex = (serverPage - 1) * limit;
        const withSno = items.map((it, idx) => ({
          id: it._id || it.postId || `${it.thumbnail}-${idx}`,
          ...it,
          sno: startIndex + idx + 1,
        }));

        setRows(withSno);
        setRowCount(total);
      } catch (e) {
        setErr(e?.response?.data?.message || e.message || "Failed to load automations");
      } finally {
        setLoading(false);
      }
    },
    [AUTOMATIONS_URL, igConnected, page, pageSize]
  );

  useEffect(() => {
    if (igConnected) {
      fetchPage(page, pageSize);
    }
  }, [igConnected, page, pageSize, fetchPage]);

  /** ---- Business Login handler (no FB SDK, no candidates) ---- */
  const handleConnectInstagram = useCallback(async () => {
    setConnectError("");
    setConnectLoading(true);

    try {
      // 1) get signed state
      const { data: stateResp } = await axios.post(META_STATE_URL, {}, { withCredentials: true });
      const state = stateResp?.state;
      if (!state) throw new Error("Unable to start Meta login");

      // 2) build OAuth URL
      const q = new URLSearchParams({
        client_id: FB_APP_ID,
        redirect_uri: REDIRECT_URI,
        state,
        response_type: "code",
        config_id: FB_LOGIN_CONFIG_ID,
      });

      const authUrl = `https://www.facebook.com/v24.0/dialog/oauth?${q.toString()}`;

      // 3) open popup
      const popup = openCenteredPopup(authUrl);
      if (!popup) {
        return; // full-page redirect fallback already triggered
      }

      // 4) wait for postMessage from /api/usersOn/meta-callback page
      const onMessage = async (event) => {
        // Optional: enforce origin
        if (event.origin !== FRONTEND_ORIGIN) return;

        const msg = event?.data || {};
        if (msg.type !== "meta-auth") return;
        window.removeEventListener("message", onMessage);

        try {
          if (!msg.success) {
            setConnectError(msg.error || "Facebook Business Login failed.");
            return;
          }

          // ✅ Backend has already written to USER. Just re-check connection and load.
          const ok = await checkIgConnection();
          if (ok) {
            toast.success("Instagram connected!");
            fetchPage(0, pageSize);
          } else {
            setConnectError("Connected, but verification failed. Please refresh and try again.");
          }
        } catch (err) {
          setConnectError(err?.response?.data?.error || err.message || "Failed after login.");
        } finally {
          setConnectLoading(false);
        }
      };

      window.addEventListener("message", onMessage);

      // 5) cleanup if popup is closed
      const poll = setInterval(() => {
        if (popup.closed) {
          clearInterval(poll);
          window.removeEventListener("message", onMessage);
          setConnectLoading(false);
        }
      }, 500);
    } catch (e) {
      setConnectError(e.message || "Failed to start Meta login");
      setConnectLoading(false);
    }
  }, [META_STATE_URL, checkIgConnection, fetchPage, pageSize]);

  /** ---- Table columns ---- */
  const columns = useMemo(
    () => [
      { field: "sno", headerName: "S.No", width: 90, sortable: false, align: "center", headerAlign: "center" },
      {
        field: "thumbnail",
        headerName: "Thumbnail",
        width: 110,
        sortable: false,
        renderCell: (params) => (
          <Avatar
            variant="rounded"
            src={params.value}
            alt={params.row.caption || "thumbnail"}
            sx={{ width: 72, height: 72 }}
          />
        ),
      },
      {
        field: "caption",
        headerName: "Caption",
        flex: 1,
        minWidth: 250,
        sortable: false,
        renderCell: ({ value }) => {
          const full = (value || "").trim();
          const text = full.length > 100 ? `${full.slice(0, 100)}…` : full;
          return (
            <Box sx={{ display: "flex", alignItems: "center", height: "100%", width: "100%" }}>
              <Typography variant="body2" noWrap title={full} sx={{ maxWidth: "100%" }}>
                {text || "—"}
              </Typography>
            </Box>
          );
        },
      },
      {
        field: "status",
        headerName: "Status",
        width: 110,
        renderCell: (params) => (
          <Chip
            size="small"
            label={String(params.value || "").toUpperCase()}
            color={params.value === "active" ? "success" : "default"}
            variant="outlined"
          />
        ),
      },
      {
        field: "repliedCount",
        headerName: "Replies Sent",
        width: 130,
        sortable: false,
        renderCell: (params) => (
          <Typography sx={{ textAlign: "center", alignItems: "center", mt: 1.5 }}>
            {params.value ?? 0}
          </Typography>
        ),
      },
      {
        field: "details",
        headerName: "Details",
        width: 140,
        sortable: false,
        filterable: false,
        renderCell: (params) => {
          const id = params.row?.postId;
          const handleClick = (e) => {
            e.stopPropagation();
            if (id) navigate(`/professional/automation/details/${encodeURIComponent(id)}`);
          };
          return (
            <Button
              size="small"
              variant="outlined"
              onClick={handleClick}
              disabled={!id}
              sx={{ textTransform: "none", borderRadius: 2, px: 1.5 }}
            >
              Details
            </Button>
          );
        },
      },
    ],
    [navigate]
  );

  /** ---- Top-level renders ---- */
  if (igConnected === null) {
    return (
      <Box sx={{ p: 3 }}>
        {igCheckErr ? (
          <Alert severity="error">{igCheckErr}</Alert>
        ) : (
          <Box sx={{ py: 6, display: "flex", justifyContent: "center" }}>
            <CircularProgress />
          </Box>
        )}
      </Box>
    );
  }

  if (!igConnected) {
    // Not connected: Connect card using Business Login flow
    return (
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 4 }}>
          <Typography sx={{ fontFamily: "Inter", fontSize: 20, fontWeight: 600, letterSpacing: 0.2 }}>
            Automation Section
          </Typography>
        </Stack>

        <Card
          elevation={0}
          sx={{
            border: "1px dashed",
            borderColor: "divider",
            borderRadius: 3,
            bgcolor: "background.default",
          }}
        >
          <CardContent>
            <Stack alignItems="center" spacing={2.5} sx={{ py: 3, textAlign: "center" }}>
              <Box
                sx={{
                  width: 72,
                  height: 72,
                  borderRadius: "50%",
                  display: "grid",
                  placeItems: "center",
                  bgcolor: "action.hover",
                }}
              >
                <InstagramIcon fontSize="large" />
              </Box>
              <Stack spacing={0.5}>
                <Typography sx={{ fontFamily: "Inter", fontSize: 20, fontWeight: 600 }}>
                  Connect your Instagram to continue
                </Typography>
                <Typography variant="body2" sx={{ color: "text.secondary", maxWidth: 560, mx: "auto" }}>
                  To set up automations, connect an Instagram account. Once connected, you can create
                  auto-replies, DMs, and track everything here.
                </Typography>
              </Stack>

              {connectError && <Alert severity="error">{connectError}</Alert>}

              <Button
                variant="contained"
                startIcon={!connectLoading && <InstagramIcon />}
                onClick={handleConnectInstagram}
                disabled={connectLoading}
                sx={{ textTransform: "none", borderRadius: 2, px: 2.5, minWidth: 220 }}
              >
                {connectLoading ? <CircularProgress size={20} sx={{ color: "white" }} /> : "Connect Instagram"}
              </Button>
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                Secure via Facebook Business Login • Takes ~10 seconds
              </Typography>
            </Stack>
          </CardContent>
        </Card>
      </Box>
    );
  }

  // Connected: show table or empty state
  if (err) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{err}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 4 }}>
        <Typography sx={{ fontFamily: "Inter", fontSize: "20px", fontWeight: 600, letterSpacing: 0.2 }}>
          Automation Section
        </Typography>
        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={() => navigate("/professional/fetch_media")}
          sx={{ fontFamily: "Inter", fontSize: "15px", fontWeight: 500, textTransform: "none" }}
        >
          New Automation
        </Button>
      </Stack>

      <div style={{ width: "100%" }}>
        {loading && rows.length === 0 ? (
          <Box sx={{ py: 6, display: "flex", justifyContent: "center" }}>
            <CircularProgress />
          </Box>
        ) : !loading && rowCount === 0 ? (
          <EmptyState onCreate={() => navigate("/professional/fetch_media")} />
        ) : (
          <DataGrid
            rows={rows}
            columns={columns}
            pagination
            paginationMode="server"
            page={page}
            onPageChange={(newPage) => setPage(newPage)}
            pageSize={pageSize}
            onPageSizeChange={(newSize) => setPageSize(newSize)}
            rowCount={rowCount}
            rowsPerPageOptions={[5, 10, 25, 50]}
            autoHeight
            loading={loading}
            disableRowSelectionOnClick
            sx={{
              "& .MuiDataGrid-columnHeaders": { fontWeight: 700 },
              "& .MuiDataGrid-cell": { alignItems: "center" },
            }}
          />
        )}
      </div>
    </Box>
  );
}

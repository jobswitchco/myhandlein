import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Box,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Stack,
  IconButton,
  Tooltip,
  Divider,
  Dialog,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import { useNavigate } from "react-router-dom";
import WestOutlinedIcon from '@mui/icons-material/WestOutlined';

export default function FetchInstagramMedia() {
  const [items, setItems] = useState([]);
  const [after, setAfter] = useState(null);
  const [hasNext, setHasNext] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Video player state
  const [playerOpen, setPlayerOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);

  // selection state
  const [selectedItem, setSelectedItem] = useState(null);

  const navigate = useNavigate();

  const baseUrl = "/api/usersOn";

  const fields = useMemo(
    () => "id,caption,media_type,media_url,permalink,thumbnail_url,timestamp",
    []
  );

  async function fetchPage(opts = { reset: false }) {
    const { reset } = opts;
    try {
      setLoading(true);
      setError("");
      const url = `${baseUrl}/instagram/media${
        reset || !after ? "" : `?after=${encodeURIComponent(after)}`
      }`;
      const res = await axios.get(url, { withCredentials: true });
      const payload = res?.data || {};
      const pageData = Array.isArray(payload.data) ? payload.data : [];
      setItems((prev) => (reset ? pageData : [...prev, ...pageData]));
      const nextCursor = payload?.paging?.cursors?.after || null;
      setAfter(nextCursor);
      setHasNext(Boolean(payload?.paging?.next));
      if (reset) setSelectedItem(null);
    } catch (err) {
      const apiMsg =
        err?.response?.data?.message || err?.message || "Failed to load media";
      setError(apiMsg);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPage({ reset: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openPlayer = (item) => {
    if (!item?.media_url) return;
    setCurrentItem(item);
    setPlayerOpen(true);
  };

  const closePlayer = () => {
    setPlayerOpen(false);
    setCurrentItem(null);
  };

  const handleSelect = (item) => {
    setSelectedItem((prev) => (prev?.id === item.id ? null : item));
  };

  const handleSetupAutomation = () => {
    if (!selectedItem) return;
    navigate(`/professional/automation/setup/${selectedItem.id}`, {
      state: { ...selectedItem },
      replace: false,
    });
  };

  const gridContent = (
    <Box
      sx={{
        display: "grid",
        gap: 2,
        gridTemplateColumns: {
          xs: "1fr",
          sm: "repeat(2, 1fr)",
          md: "repeat(3, 1fr)",
          lg: "repeat(4, 1fr)",
        },
        alignItems: "stretch",
      }}
    >
      {items.map((m) => {
        const isVideo = m.media_type === "VIDEO";
        const isCarousel = m.media_type === "CAROUSEL_ALBUM";
        const thumb = m.thumbnail_url || m.media_url;
        const isSelected = selectedItem?.id === m.id;

        return (
          <Card
            key={m.id}
            variant="outlined"
            onClick={() => handleSelect(m)}
            sx={{
              height: "100%",
              display: "flex",
              flexDirection: "column",
              borderRadius: 3,
              cursor: "pointer",
              outline: isSelected ? "3px solid" : "1px solid",
              outlineColor: isSelected ? "primary.main" : "divider",
              boxShadow: isSelected ? 6 : 0,
              transition: "box-shadow .2s, outline-color .2s, transform .05s",
              "&:active": { transform: "scale(0.997)" },
            }}
          >
            <Box sx={{ position: "relative" }}>
              <CardMedia
                component="img"
                image={thumb}
                alt={m.caption || `IG media ${m.id}`}
                sx={{
                  aspectRatio: "1 / 1",
                  objectFit: "cover",
                  opacity: isVideo ? 0.9 : 1,
                  userSelect: "none",
                  display: "block",
                  width: "100%",
                }}
              />

              {(isVideo || isCarousel) && (
                <Box
                  sx={{
                    position: "absolute",
                    top: 8,
                    right: 8,
                    px: 1,
                    py: 0.25,
                    bgcolor: "rgba(0,0,0,0.6)",
                    color: "#fff",
                    borderRadius: 1,
                    fontSize: 12,
                    textTransform: "uppercase",
                  }}
                >
                  {isVideo ? "Video" : "Carousel"}
                </Box>
              )}

              {isVideo && (
                <Box
                  sx={{
                    position: "absolute",
                    inset: 0,
                    display: "grid",
                    placeItems: "center",
                    pointerEvents: "none",
                  }}
                  aria-label="Play video"
                >
                  <IconButton
                    onClick={(e) => {
                      e.stopPropagation();
                      openPlayer(m);
                    }}
                    size="large"
                    sx={{
                      bgcolor: "rgba(0,0,0,0.55)",
                      border: "2px solid rgba(255,255,255,0.7)",
                      "&:hover": { bgcolor: "rgba(0,0,0,0.7)" },
                      pointerEvents: "auto",
                    }}
                  >
                    <PlayArrowIcon sx={{ fontSize: 42, color: "#fff" }} />
                  </IconButton>
                </Box>
              )}
            </Box>

            <CardContent sx={{ flexGrow: 1 }}>
              <Typography
                variant="body2"
                sx={{
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {m.caption?.trim() ? m.caption : "No Caption"}
              </Typography>
            </CardContent>
          </Card>
        );
      })}
    </Box>
  );

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 }, maxWidth: 1400, mx: "auto" }}>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 2 }}
      >
       <Stack sx={{ mb: 3, display : 'flex', flexDirection : 'row', gap: 3, alignItems : 'center' }}>
                 <WestOutlinedIcon sx={{ cursor : 'pointer'}}onClick={() => navigate("/professional/automations")}/>
                 <Typography sx={{fontFamily : 'Inter', fontSize : '20px', fontWeight: 600, letterSpacing: 0.2 }}>
                   Instagram Posts
                 </Typography>
               </Stack>

        {selectedItem ? (
          <Button
            variant="contained"
            onClick={handleSetupAutomation}
            disabled={!selectedItem}
            sx={{ borderRadius: 999 }}
          >
            Setup Automation
          </Button>
        ) : (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ textAlign: "right" }}
          >
            Select a post to set-up automation.
          </Typography>
        )}
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {items.length === 0 && loading ? (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
            gap: 16,
          }}
        >
          {[...Array(6)].map((_, i) => (
            <Box key={i} sx={{ height: 260, bgcolor: "action.hover", borderRadius: 3 }} />
          ))}
        </Box>
      ) : (
        gridContent
      )}

      <Divider sx={{ my: 2 }} />

      <Stack direction="row" justifyContent="center" sx={{ mt: 1 }}>
        {hasNext ? (
          <Button
            onClick={() => fetchPage({ reset: false })}
            disabled={loading}
            variant="contained"
          >
            {loading ? (
              <Stack direction="row" spacing={1} alignItems="center">
                <CircularProgress size={18} /> <span>Loading…</span>
              </Stack>
            ) : (
              "Load more"
            )}
          </Button>
        ) : (
          <Typography variant="body2" color="text.secondary">
            {items.length > 0 ? "No more results" : ""}
          </Typography>
        )}
      </Stack>

      {/* Video Player Modal */}
      <Dialog
        open={playerOpen}
        onClose={closePlayer}
        fullWidth
        maxWidth="md"
        PaperProps={{ sx: { borderRadius: 3, overflow: "hidden" } }}
      >
        <Box sx={{ position: "relative", bgcolor: "black" }}>
          {currentItem?.media_url ? (
            <video
              src={currentItem.media_url}
              controls
              autoPlay
              style={{ width: "100%", height: "auto", display: "block" }}
            />
          ) : null}
        </Box>
      </Dialog>
    </Box>
  );
}

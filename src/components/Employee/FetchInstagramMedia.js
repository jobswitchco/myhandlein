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
  Divider,
  Dialog,
  Tabs, // Use standard MUI Tabs
  Tab, // Use standard MUI Tab
} from "@mui/material";
// Note: Removed @mui/lab imports
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import WestOutlinedIcon from '@mui/icons-material/WestOutlined';
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import SearchOffIcon from '@mui/icons-material/SearchOff';
import InstagramIcon from '@mui/icons-material/Instagram';

// Define media type categories for filtering
const MEDIA_TYPES = {
    PHOTO: ['IMAGE', 'CAROUSEL_ALBUM'],
    VIDEO: ['VIDEO'],
    STORY: ['STORY'],
};

// --- Custom Empty States ---
const NoMediaYet = () => (
    <Box sx={{ py: 6, px: 3, display: "flex", flexDirection: "column", alignItems: "center", gap: 2.5, border: "2px dashed", borderColor: "grey.300", borderRadius: 3, bgcolor: "grey.50", textAlign: "center", mt: 3 }}>
        <Box sx={{ width: 64, height: 64, borderRadius: "50%", display: "grid", placeItems: "center", bgcolor: "primary.main", color: 'white' }}>
            <InstagramIcon fontSize="large" />
        </Box>
        <Typography variant="h6" fontWeight={700}>No Media Found</Typography>
        <Typography variant="body1" color="text.secondary" maxWidth={400}>
            We could not retrieve any posts or stories from your Instagram account. Ensure your account is connected and has recent media.
        </Typography>
    </Box>
);

const NoMediaInFilter = ({ filterName }) => (
    <Box sx={{ py: 6, px: 3, display: "flex", flexDirection: "column", alignItems: "center", gap: 2.5, border: "1px solid", borderColor: "warning.main", borderRadius: 3, bgcolor: "warning.lighter", textAlign: "center", mt: 3 }}>
        <Box sx={{ width: 64, height: 64, borderRadius: "50%", display: "grid", placeItems: "center", bgcolor: "warning.main", color: 'white' }}>
            <SearchOffIcon fontSize="large" />
        </Box>
        <Typography variant="h6" fontWeight={700}>No {filterName} Available</Typography>
        <Typography variant="body1" color="text.secondary" maxWidth={400}>
            Your media feed contains posts, but no items matching the "{filterName}" filter.
        </Typography>
    </Box>
);


export default function FetchInstagramMedia() {
  const [items, setItems] = useState([]);
  const [after, setAfter] = useState(null);
  const [hasNext, setHasNext] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Tabs State
  const [mediaTypeFilter, setMediaTypeFilter] = useState('all');

  // Video player state
  const [playerOpen, setPlayerOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);

  // selection state
  const [selectedItem, setSelectedItem] = useState(null);

  const navigate = useNavigate();
  const location = useLocation();
  
  const { automationType, followUpType } = location.state || {};

  const baseUrl = "/api/usersOn";

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
      toast.error(apiMsg);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPage({ reset: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Media Filtering ---
  const filteredItems = useMemo(() => {
    return items.filter(m => {
        const type = m.media_type;
        switch (mediaTypeFilter) {
            case 'all': return true;
            case 'photos': return MEDIA_TYPES.PHOTO.includes(type);
            case 'videos': return MEDIA_TYPES.VIDEO.includes(type) || type === 'REEL'; 
            case 'stories': return m.media_type === 'STORY'; 
            default: return true;
        }
    });
  }, [items, mediaTypeFilter]);

  // --- Handlers ---
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
    
    const stateData = {
      ...selectedItem,
      automationType,
      followUpType,
    };

    navigate(`/professional/automation/setup/${selectedItem.id}`, {
      state: stateData,
      replace: false,
    });
  };

  const renderMediaGrid = (mediaList) => (
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
        mt: 3,
      }}
    >
      {mediaList.map((m) => {
        const isVideo = m.media_type === "VIDEO";
        const isCarousel = m.media_type === "CAROUSEL_ALBUM";
        const isStory = m.media_type === "STORY";
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

              {(isVideo || isCarousel || isStory) && (
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
                  {isStory ? "Story" : isVideo ? "Video" : "Photo Set"}
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

  // Determine what content to show inside the panel
  const renderTabContent = (filterValue, filterName) => {
    if (loading && items.length === 0) {
      return <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>;
    }

    if (items.length === 0) {
      // Case 1: NO MEDIA EVER FETCHED
      return <NoMediaYet />;
    }

    if (filteredItems.length === 0) {
      // Case 2: MEDIA EXISTS, BUT NONE MATCHES FILTER
      return <NoMediaInFilter filterName={filterName} />;
    }

    // Case 3: Display filtered media
    return renderMediaGrid(filteredItems);
  };


  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 }, maxWidth: 1400, mx: "auto" }}>
      <Stack
        sx={{ mb: 4, display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
      >
        <Stack sx={{ display: 'flex', flexDirection: 'row', gap: 3, alignItems: 'center'}}>
          <WestOutlinedIcon 
            sx={{ cursor: 'pointer'}} 
            onClick={() => navigate("/professional/automations")}
          />
          <Typography sx={{
            fontFamily: 'Inter', 
            fontSize: {xs: '15px', sm: '15px', md: '20px'}, 
            fontWeight: 600, 
            letterSpacing: 0.2 
          }}>
            Instagram Media Selection
          </Typography>
        </Stack>

        {selectedItem ? (
          <Button
            variant="contained"
            onClick={handleSetupAutomation}
            disabled={!selectedItem}
            sx={{ 
              borderRadius: 999, 
              textTransform: 'none', 
              fontFamily: 'Inter', 
              fontSize: {xs: '12px', sm: '12px', md: '14px'} 
            }}
          >
            Setup Automation
          </Button>
        ) : (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ textAlign: "right" }}
          >
            Select a piece of media to set-up automation.
          </Typography>
        )}
      </Stack>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* --- Tabs UI using MUI/material Tabs and conditional rendering --- */}
      <Box sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={mediaTypeFilter} onChange={(e, newValue) => setMediaTypeFilter(newValue)} aria-label="media type filters" variant="scrollable">
            <Tab label={<Stack direction="row" spacing={1} alignItems="center" sx={{ textTransform : 'none'}}> All ({items.length})</Stack>} value="all" />
            <Tab label={<Stack direction="row" spacing={1} alignItems="center" sx={{ textTransform : 'none'}}> Photos ({items.filter(m => MEDIA_TYPES.PHOTO.includes(m.media_type)).length})</Stack>} value="photos" />
            <Tab label={<Stack direction="row" spacing={1} alignItems="center" sx={{ textTransform : 'none'}}> Videos ({items.filter(m => MEDIA_TYPES.VIDEO.includes(m.media_type)).length})</Stack>} value="videos" />
            <Tab label={<Stack direction="row" spacing={1} alignItems="center" sx={{ textTransform : 'none'}}> Stories ({items.filter(m => m.media_type === 'STORY').length})</Stack>} value="stories" />
          </Tabs>
        </Box>

        <Box sx={{ minHeight: 400 }}>
          {/* Conditional rendering based on the active tab */}
          {mediaTypeFilter === 'all' && renderTabContent('all', 'All Media')}
          {mediaTypeFilter === 'photos' && renderTabContent('photos', 'Photos')}
          {mediaTypeFilter === 'videos' && renderTabContent('videos', 'Videos')}
          {mediaTypeFilter === 'stories' && renderTabContent('stories', 'Stories')}
        </Box>
      </Box>
      {/* --- End Tabs UI --- */}


      <Divider sx={{ my: 2 }} />

      <Stack direction="row" justifyContent="center" sx={{ mt: 1 }}>
        {/* Load More Button appears only when 'All' is selected and there's a next page cursor */}
        {mediaTypeFilter === 'all' && hasNext ? (
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
            {items.length > 0 ? "End of media feed." : "No media found to automate."}
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
import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Box,
  List,
  ListItemButton,
  ListItemText,
  Paper,
  CircularProgress,
  Typography,
  Divider,
  Avatar,
  TextField,
  InputAdornment,
  Chip,
  ToggleButton,
  ToggleButtonGroup
} from "@mui/material";
import { Search, Handshake, Chat, FilterList } from "@mui/icons-material";
import { toast } from "react-toastify";
import MyChatWindow from "./MyChatWindow";

const API_BASE = "/api";

function formatTime(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function truncate(text = "", n = 50) {
  if (!text || text.length <= n) return text;
  return text.slice(0, n - 1) + "…";
}

// Category chip configuration
function getCategoryChipProps(category) {
  switch (category) {
    case "Collaboration":
      return {
        label: "Collaboration",
        color: "secondary",
        icon: <Handshake sx={{ fontSize: 16 }} />,
        bgcolor: "#9c27b0",
        textColor: "#fff"
      };
    case "General":
      return {
        label: "General",
        color: "default",
        icon: <Chat sx={{ fontSize: 14 }} />,
        bgcolor: "#757575",
        textColor: "#fff"
      };
    case "Uncategorized":
    default:
      return {
        label: "Uncategorized",
        color: "default",
        icon: null,
        bgcolor: "#e0e0e0",
        textColor: "#666"
      };
  }
}

export default function MyInbox() {
  const [conversations, setConversations] = useState([]);
  const [selectedConv, setSelectedConv] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    setLoading(true);
    try {
      const res = await axios.post(
        `${API_BASE}/usersOn/influencer/messages`,
        { limit: 200, skip: 0 },
        { withCredentials: true }
      );
      
      if (!res.data?.ok) {
        toast.error("Failed to fetch conversations");
        setConversations([]);
      } else {
        setConversations(res.data.conversations || []);
      }
    } catch (err) {
      console.error("fetch conversations error:", err);
      toast.error("Unable to fetch conversations");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectConversation = (conv) => {
    setSelectedConv(conv);
  };

  const handleCategoryFilter = (event, newFilter) => {
    if (newFilter !== null) {
      setCategoryFilter(newFilter);
    }
  };

  const filteredConversations = conversations
    .filter(conv => {
      // Category filter
      if (categoryFilter !== "all" && conv.category !== categoryFilter) {
        return false;
      }
      
      // Search filter
      const searchLower = searchTerm.toLowerCase();
      return (
        conv.from_name?.toLowerCase().includes(searchLower) ||
        conv.text?.toLowerCase().includes(searchLower) ||
        conv.category?.toLowerCase().includes(searchLower)
      );
    });

  // Count conversations by category
  const categoryCounts = conversations.reduce((acc, conv) => {
    const cat = conv.category || "Uncategorized";
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});

  return (
    <Box sx={{ display: "flex", height: "100vh", bgcolor: "#f5f5f5" }}>
      {/* Left Sidebar - Conversations List */}
      <Paper
        elevation={2}
        sx={{
          width: 350,
          display: "flex",
          flexDirection: "column",
          borderRadius: 0,
          borderRight: "1px solid #e0e0e0"
        }}
      >
        <Box sx={{ p: 2, bgcolor: "#1976d2", color: "white" }}>
          <Typography variant="h6" fontWeight="bold">Messages</Typography>
          <Typography variant="caption" sx={{ opacity: 0.9 }}>
            {filteredConversations.length} conversation{filteredConversations.length !== 1 ? 's' : ''}
          </Typography>
        </Box>

        <Box sx={{ p: 2 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search conversations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        {/* Category Filter */}
        <Box sx={{ px: 2, pb: 2 }}>
         
          <ToggleButtonGroup
            value={categoryFilter}
            exclusive
            onChange={handleCategoryFilter}
            size="small"
            fullWidth
            sx={{ 
              display: "flex",
              "& .MuiToggleButton-root": {
                fontSize: "0.7rem",
                py: 0.5,
                textTransform: "none",
                flex: 1
              }
            }}
          >
            <ToggleButton value="all">
              All ({conversations.length})
            </ToggleButton>
            <ToggleButton value="Collaboration">
              <Handshake sx={{ fontSize: 14, mr: 0.5 }} />
              {categoryCounts.Collaboration || 0}
            </ToggleButton>
            <ToggleButton value="General">
              <Chat sx={{ fontSize: 14, mr: 0.5 }} />
              {categoryCounts.General || 0}
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        <Divider />

        <Box sx={{ flexGrow: 1, overflow: "auto" }}>
          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" sx={{ py: 4 }}>
              <CircularProgress />
            </Box>
          ) : filteredConversations.length === 0 ? (
            <Box sx={{ p: 3, textAlign: "center" }}>
              <Typography color="text.secondary">
                {searchTerm || categoryFilter !== "all" 
                  ? "No conversations match your filters" 
                  : "No conversations found"}
              </Typography>
            </Box>
          ) : (
            <List disablePadding>
              {filteredConversations.map((conv) => {
                const chipProps = getCategoryChipProps(conv.category);
                
                return (
                  <React.Fragment key={conv._id}>
                    <ListItemButton
                      selected={selectedConv?._id === conv._id}
                      onClick={() => handleSelectConversation(conv)}
                      sx={{
                        py: 2,
                        "&.Mui-selected": {
                          bgcolor: "#e3f2fd",
                          "&:hover": { bgcolor: "#bbdefb" }
                        }
                      }}
                    >
                      <Avatar sx={{ mr: 2, bgcolor: "#1976d2" }}>
                        {(conv.from_name || "U")[0].toUpperCase()}
                      </Avatar>
                      <ListItemText
                        primary={
                          <Box display="flex" alignItems="center" gap={1}>
                            <Typography variant="subtitle2" fontWeight="600">
                              {conv.from_name || "Unknown"}
                            </Typography>
                          </Box>
                        }
                        secondary={
                          <Box>
                            {/* Category Chip */}
                            <Box sx={{ mb: 0.5, mt: 0.5 }}>
                              <Chip
                                icon={chipProps.icon}
                                label={chipProps.label}
                                size="small"
                                sx={{
                                  height: 20,
                                  fontSize: "0.7rem",
                                  fontWeight: 600,
                                  bgcolor: chipProps.bgcolor,
                                  color: chipProps.textColor,
                                  "& .MuiChip-icon": {
                                    color: chipProps.textColor,
                                    marginLeft: "4px"
                                  }
                                }}
                              />
                            </Box>
                            
                            {/* Message preview */}
                            <Typography variant="body2" color="text.secondary" noWrap>
                              {truncate(conv.text, 40)}
                            </Typography>
                            
                            {/* Timestamp */}
                            <Typography variant="caption" color="text.disabled">
                              {formatTime(conv.created_at)}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItemButton>
                    <Divider />
                  </React.Fragment>
                );
              })}
            </List>
          )}
        </Box>
      </Paper>

      {/* Right Panel - Chat Window */}
      <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column", bgcolor: "white", overflow: "hidden" }}>
        {!selectedConv ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "100%",
              color: "text.secondary"
            }}
          >
            <Typography variant="h6">Select a conversation to view messages</Typography>
          </Box>
        ) : (
          <Box sx={{ height: "100%", overflow: "auto" }}>
            <MyChatWindow
              conversationId={selectedConv.conversation_id}
              participantId={selectedConv.from_id}
              embedded={true}
            />
          </Box>
        )}
      </Box>
    </Box>
  );
}
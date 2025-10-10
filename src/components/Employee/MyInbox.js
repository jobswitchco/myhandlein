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
  InputAdornment
} from "@mui/material";
import { Search } from "@mui/icons-material";
import { toast } from "react-toastify";
import MyChatWindow from "./MyChatWindow";

const API_BASE = "/api/usersOn";

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

export default function MyInbox() {
  const [conversations, setConversations] = useState([]);
  const [selectedConv, setSelectedConv] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

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

  const filteredConversations = conversations.filter(conv =>
    conv.from_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.text?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

        <Divider />

        <Box sx={{ flexGrow: 1, overflow: "auto" }}>
          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" sx={{ py: 4 }}>
              <CircularProgress />
            </Box>
          ) : filteredConversations.length === 0 ? (
            <Box sx={{ p: 3, textAlign: "center" }}>
              <Typography color="text.secondary">No conversations found</Typography>
            </Box>
          ) : (
            <List disablePadding>
              {filteredConversations.map((conv) => (
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
                        <Typography variant="subtitle2" fontWeight="600">
                          {conv.from_name || "Unknown"}
                        </Typography>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary" noWrap>
                            {truncate(conv.text, 40)}
                          </Typography>
                          <Typography variant="caption" color="text.disabled">
                            {formatTime(conv.created_at)}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItemButton>
                  <Divider />
                </React.Fragment>
              ))}
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
            {/* Render MyChatWindow with conversationId and participantId */}
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
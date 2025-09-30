// src/components/MessagesTable.jsx  (only showing changed parts)
import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Box,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  CircularProgress, Typography, Button
} from "@mui/material";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

const API_BASE = "/api/usersOn";

function truncate(text = "", n = 20) {
  if (text.length <= n) return text;
  return text.slice(0, n - 1) + "…";
}

export default function MyInbox() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const limit = 200;
  const skip = 0;

  useEffect(() => {
    let cancelled = false;
    const fetchMessages = async () => {
      setLoading(true);
      try {
        const res = await axios.post(
          `${API_BASE}/influencer/messages`,
          { limit, skip },
          { withCredentials: true }
        );
        if (cancelled) return;
        if (!res.data?.ok) {
          toast.error("Failed to fetch messages");
          setRows([]);
        } else {
          // backend now returns `conversations` (one row per conversation)
          setRows(res.data.conversations || []);
        }
      } catch (err) {
        console.error("fetch messages error:", err);
        toast.error("Unable to fetch messages. Check console.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchMessages();
    return () => { cancelled = true; };
  }, [limit, skip]);


  const openConversation = (conversationId, participantId) => {
    // navigate to chat window; pass conversationId in params
    if (conversationId) {
      navigate(`/professional/my/chatwindow/${conversationId}`);
    } else if (participantId) {
      // fallback: navigate using participantId (server can resolve conversation)
      navigate(`/professional/chat-by-participant/${participantId}`);
    } else {
      toast.error("Conversation missing");
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>Messages</Typography>

      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" sx={{ py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table size="small" aria-label="messages table">
            <TableHead>
              <TableRow>
                <TableCell>S.no</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>From</TableCell>
                <TableCell>Message</TableCell>
                <TableCell>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">No messages found</TableCell>
                </TableRow>
              ) : rows.map((r, idx) => (
                <TableRow key={r._id}>
                  <TableCell>{idx + 1}</TableCell>
                  <TableCell>{r.created_at ? new Date(r.created_at).toLocaleString() : "-"}</TableCell>
                  <TableCell>{r.from_name || "Guest"}</TableCell>
                  <TableCell>{truncate(r.text || "", 20)}</TableCell>
                  <TableCell>
                    <Button variant="contained" size="small"
                      onClick={() => openConversation(r.conversation_id, r.from_participant_id)}>
                      Conversation
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Paper>
  );
}

import React, { useEffect, useState, useRef } from "react";
import io from "socket.io-client";
import axios from "axios";
import { Box, Paper, TextField, IconButton, Avatar, Typography } from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import { useLocation } from "react-router-dom";

const API_BASE = "/api";

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

function messageConversationId(message) {
  // message may carry conversation id in several shapes
  if (!message) return null;
  if (message.conversation && typeof message.conversation === "object" && message.conversation._id) return String(message.conversation._id);
  if (message.conversation && typeof message.conversation === "string") return String(message.conversation);
  if (message.conversation_id) return String(message.conversation_id);
  if (message.conversationId) return String(message.conversationId);
  return null;
}

function messageCreatedAt(message) {
  return new Date(message.created_at || message.createdAt || Date.now());
}

export default function ChatWindow() {
  const q = useQuery();
  const subdomain = q.get("subdomain") || "";
  const [influencer, setInfluencer] = useState(null);
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [typingFromInfluencer, setTypingFromInfluencer] = useState(false);
  const socketRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // fetch influencer
  useEffect(() => {
    if (!subdomain) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await axios.get(`${API_BASE}/usersOn/influencer/${encodeURIComponent(subdomain)}`);
        if (!cancelled) setInfluencer(res.data.influencer);
      } catch (err) {
        console.error("fetch influencer failed:", err);
      }
    })();
    return () => { cancelled = true; };
  }, [subdomain]);

  // find-or-create conversation
  useEffect(() => {
    if (!influencer) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await axios.post(`${API_BASE}/usersOn/conversations/find-or-create`, { subdomain }, { withCredentials: true });
        if (!cancelled) {
          setConversation(res.data.conversation);
          if (res.data.conversation && res.data.conversation._id) {
            const msgRes = await axios.get(`${API_BASE}/usersOn/messages/${res.data.conversation._id}`, { withCredentials: true });
            // server returns { messages: [...] } (normalized shape)
            setMessages(msgRes.data.messages || []);
          }
        }
      } catch (err) {
        console.error("find-or-create convo failed:", err);
      }
    })();
    return () => { cancelled = true; };
  }, [influencer, subdomain]);

  // create socket once when influencer is available
  useEffect(() => {
    if (!influencer) return;

    const socket = io("https://myhandle.in", {
   path: "/socket.io",
   transports: ["websocket", "polling"], // ok to start with both
   withCredentials: true, // keep ONLY if you actually rely on cookies (you do for participant token)
   query: { subdomain },
 });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("[ChatWidget] socket connected", socket.id);
    });

    socket.on("message:received", ({ message }) => {
      try {
        if (!message) return;
        const msgConvId = messageConversationId(message);
        if (conversation && String(msgConvId) !== String(conversation._id)) {
          console.log("[ChatWidget] ignoring message for other conversation:", msgConvId);
          return;
        }
        setMessages(prev => {
          if (prev.some(m => String(m._id) === String(message._id))) return prev;
          return [...prev, message];
        });
      } catch (err) {
        console.error("[ChatWidget] message:received handler error:", err);
      }
    });

    socket.on("message:saved", ({ message }) => {
      try {
        if (!message) return;
        setMessages(prev => {
          if (prev.some(m => String(m._id) === String(message._id))) return prev;
          return [...prev, message];
        });
      } catch (err) {
        console.error("[ChatWidget] message:saved handler error:", err);
      }
    });

    // typing event: show only when it comes from another socket (someone else typing in same conversation)
    socket.on("typing", (payload) => {
      try {
        if (!payload) return;
        if (!conversation || String(conversation._id) !== String(payload.conversationId)) return;
        if (payload.fromSocketId && payload.fromSocketId === socket.id) return; // ignore our own typing
        // If payload came from a user whose id equals influencer id OR payload lacks sender, treat as influencer typing
        const isFromInfluencer = !!payload.from && influencer && String(payload.from) === String(influencer._id);
        setTypingFromInfluencer(Boolean(payload.isTyping) && isFromInfluencer);
      } catch (err) {
        console.error("[ChatWidget] typing handler error:", err);
      }
    });

    socket.on("connect_error", (err) => {
      console.error("[ChatWidget] socket connect_error:", err);
    });

    socket.on("disconnect", (reason) => {
      console.log("[ChatWidget] socket disconnect:", reason);
    });

    return () => {
      try { socket.disconnect(); } catch (e) {}
      socketRef.current = null;
    };
    // IMPORTANT: do not include conversation in deps here; create socket once per influencer
  }, [influencer, subdomain]);

  // ensure join_conversation whenever conversation becomes available (no socket recreation)
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !conversation || !conversation._id) return;
    if (socket.connected) {
      console.log("[ChatWidget] emitting join_conversation", conversation._id);
      socket.emit("join_conversation", { conversationId: conversation._id });
    } else {
      socket.once("connect", () => {
        socket.emit("join_conversation", { conversationId: conversation._id });
      });
    }
  }, [conversation && conversation._id]);

  // emitTyping helper — include fromSocketId and a small guard/log
  const emitTyping = (isTyping) => {
    const socket = socketRef.current;
    if (!socket || !conversation || !conversation._id) {
      console.warn("[ChatWidget] emitTyping skipped — no socket or conversation yet", { isTyping, socketId: socket?.id, conversationId: conversation?._id });
      return;
    }
    const payload = { conversationId: conversation._id, isTyping, fromSocketId: socket.id };
    socket.emit("typing", payload);
  };

  // send message
  const sendMessage = async () => {
    if (!text.trim()) return;
    const socket = socketRef.current;
    if (!socket || !influencer || !conversation) {
      console.warn("[ChatWidget] sendMessage skipped — missing socket/influencer/conversation");
      return;
    }

    // optimistic UI: use same minimal fields server will reply with (try to follow new shape)
    const optimistic = {
      _id: "temp-" + Date.now(),
      text: text.trim(),
      createdAt: new Date().toISOString(),
      // try to mimic server: conversation ref available as id
      conversation: { _id: conversation._id },
      // sender will be empty until server returns; frontend treats missing sender as 'me'
    };
    setMessages(prev => [...prev, optimistic]);

    // emit actual message
    socket.emit("message:send", { conversationId: conversation._id, to_influencer_id: influencer._id, text: text.trim() });
    console.debug("[ChatWidget] emitted message:send", { conversationId: conversation._id, to_influencer_id: influencer._id });

    // clear typing
    const clearPayload = { conversationId: conversation._id, isTyping: false, fromSocketId: socket.id };
    socket.emit("typing", clearPayload);

    setText("");
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    setTypingFromInfluencer(false);
  };

  // decide alignment of a message: influencer => left, else right
  const isFromInfluencer = (m) => {
    if (!m) return false;
    // if server supplied normalized sender role
    if (m.senderRole && m.senderRole === "influencer") return true;
    // if server populated sender object
    if (m.sender && (m.sender._id || m.sender === influencer._id || m.sender === influencer?._id)) {
      const sid = String(m.sender._id || m.sender);
      return influencer && String(influencer._id) === sid;
    }
    // fallback: if message has from_user/from_participant shape, treat from_user === influencer
    if (m.from_user && influencer && String(m.from_user) === String(influencer._id)) return true;
    if (m.from_participant) return false;
    return false;
  };

  return (
    <Paper elevation={6} sx={{ width: 400, p: 1 }}>
      <Box display="flex" alignItems="center" gap={1} sx={{ mb: 1 }}>
        <Avatar src={influencer?.picture || ""} />
        <Box>
          <Typography fontSize={14}>{influencer?.name || influencer?.handleUserName || "Influencer"}</Typography>
          <Typography fontSize={12} color="text.secondary">Chat with {influencer?.handleUserName}</Typography>
        </Box>
      </Box>

      <Box sx={{ height: 320, overflowY: "auto", mb: 1, p: 1, bgcolor: "#fafafa", borderRadius: 1 }}>
        {messages.map((m) => {
          const align = isFromInfluencer(m) ? "left" : "right";
          return (
            <Box key={m._id} sx={{ display: "flex", justifyContent: align === "right" ? "flex-end" : "flex-start", mb: 1 }}>
              <Box sx={{ maxWidth: "80%", p: 1, borderRadius: 1, bgcolor: align === "right" ? "#DCF8C6" : "#fff", boxShadow: 0.5 }}>
                <Typography variant="body2">{m.text}</Typography>
                <Typography variant="caption" sx={{ display: "block", textAlign: "right", mt: 0.5 }}>
                  {messageCreatedAt(m).toLocaleTimeString()}
                </Typography>
              </Box>
            </Box>
          );
        })}
      </Box>

      <Box display="flex" gap={1} mb={10}>
        <TextField
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            emitTyping(true);
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = setTimeout(() => emitTyping(false), 900);
          }}
          variant="outlined"
          size="small"
          fullWidth
          placeholder="Write a message..."
        />
        <IconButton onClick={sendMessage} color="primary"><SendIcon /></IconButton>
      </Box>

      {typingFromInfluencer && <Typography variant="caption" sx={{ mt: 1 }}>{influencer?.name || "Influencer"} is typing...</Typography>}
    </Paper>
  );
}

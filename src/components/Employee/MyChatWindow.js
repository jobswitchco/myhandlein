import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import io from "socket.io-client";
import {
  Box, Paper, Avatar, Typography, TextField, Button, CircularProgress, Alert
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";

const API_BASE = "/api";

function initials(name = "") {
  return (name || "").split(" ").map(s => s[0]).join("").slice(0, 2).toUpperCase();
}

function toIdString(v) {
  if (v === null || v === undefined) return null;
  if (typeof v === "object" && (v._id || v.id)) return String(v._id || v.id);
  return String(v);
}

export default function MyChatWindow() {
  const { conversationId: paramConversationId, participantId: paramParticipantId } = useParams();
  const [conversation, setConversation] = useState(null);
  const [participant, setParticipant] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [typingFromParticipant, setTypingFromParticipant] = useState(false);
  const socketRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const scrollRef = useRef(null);
  const debugEmittedRef = useRef(false);

  // derived ids
  const influencerIdRef = useRef(null);
  const participantIdRef = useRef(null);

  // load conversation & messages
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setErrorMsg(null);
        setLoading(true);

        let convoResp = null;
        if (paramConversationId) {
          convoResp = await axios.get(`${API_BASE}/usersOn/conversations/${paramConversationId}`, { withCredentials: true });
        } else if (paramParticipantId) {
          convoResp = await axios.post(`${API_BASE}/usersOn/conversations/find-or-create-by-participant`, { participantId: paramParticipantId }, { withCredentials: true });
        } else {
          setErrorMsg("No conversationId or participantId provided in URL.");
          return;
        }

        if (cancelled) return;

        const convoData = convoResp?.data?.conversation || convoResp?.data || null;
        const participantData = convoResp?.data?.participant || null;

        if (!convoData) {
          setErrorMsg("Conversation not found");
          setConversation(null);
          setParticipant(participantData);
          setMessages([]);
          return;
        }

        setConversation(convoData);
        if (participantData) setParticipant(participantData);

        // derive influencer and participant ids from conversation & participant
        const derived = deriveParticipantInfluencerIds(convoData, participantData);
        influencerIdRef.current = derived.influencerId;
        participantIdRef.current = derived.participantId;

        const convIdToFetch = paramConversationId || convoData._id || convoData.conversation_id;
        if (!convIdToFetch) {
          setMessages([]);
          return;
        }

        const messagesRes = await axios.get(`${API_BASE}/usersOn/conversations/${convIdToFetch}/messages`, { withCredentials: true });
        if (cancelled) return;

        const msgs = messagesRes?.data?.messages || [];
        setMessages(msgs);

        // one-time debug log
        if (!debugEmittedRef.current && msgs.length > 0) {
          console.group("MyChatWindow - first message debug");
          console.log("first message example:", msgs[0]);
          console.log("participant object:", participantData);
          console.log("derived ids:", derived);
          console.groupEnd();
          debugEmittedRef.current = true;
        }
      } catch (err) {
        console.error("MyChatWindow: load error", err);
        setErrorMsg("Failed to load conversation. See console.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [paramConversationId, paramParticipantId]);

  // socket
  useEffect(() => {
    if (!conversation) return;


       const socket = io("https://myhandle.in", {
       path: "/socket.io",
       transports: ["websocket", "polling"], // ok to start with both
       withCredentials: true, // keep ONLY if you actually rely on cookies (you do for participant token)
      query: { subdomain: conversation?.subdomain || "" }

     });

    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("join_conversation", { conversationId: conversation._id });
    });

    socket.on("message:received", ({ message }) => {
      if (!message) return;
      const msgConvId = message.conversation_id || message.conversationId || message.conversation;
      if (String(msgConvId) !== String(conversation._id)) return;
      setMessages(prev => [...prev, message]);
    });

    socket.on("typing", (payload) => {
      try {
        if (!payload) return;
        if (!conversation || String(conversation._id) !== String(payload.conversationId)) return;
        if (payload.fromSocketId && payload.fromSocketId !== socket.id) {
          setTypingFromParticipant(Boolean(payload.isTyping));
        } else {
          setTypingFromParticipant(false);
        }
      } catch (err) {
        console.error("typing handler error", err);
      }
    });

    socket.on("disconnect", () => {});
    socket.on("connect_error", (err) => { console.error("socket connect_error", err); });

    return () => {
      try { socket.disconnect(); } catch (e) {}
      socketRef.current = null;
      if (typingTimeoutRef.current) { clearTimeout(typingTimeoutRef.current); typingTimeoutRef.current = null; }
    };
  }, [conversation]);

  // ensure join
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !conversation || !conversation._id) return;
    if (socket.connected) socket.emit("join_conversation", { conversationId: conversation._id });
    else socket.once("connect", () => socket.emit("join_conversation", { conversationId: conversation._id }));
  }, [conversation?._id]);

  // auto scroll
  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, typingFromParticipant]);

  // send message
  const sendMessage = async () => {
    const t = (text || "").trim();
    if (!t || !conversation) return;
    setText("");

    // optimistic -> mark sender as participant (current user in this UI)
    const tmp = {
      _id: `tmp-${Date.now()}`,
      text: t,
      createdAt: new Date().toISOString(),
      sender: { _id: participantIdRef.current || null },
      status: "sending"
    };
    setMessages(prev => [...prev, tmp]);

    const socket = socketRef.current;
    if (socket && socket.connected) {
      socket.emit("message:send", { conversationId: conversation._id, text: t });
      socket.emit("typing", { conversationId: conversation._id, isTyping: false, fromSocketId: socket.id });
      setTypingFromParticipant(false);
      return;
    }

    try {
      const res = await axios.post(`${API_BASE}/usersOn/messages/send`, { conversationId: conversation._id, text: t }, { withCredentials: true });
      const saved = res?.data?.message;
      setMessages(prev => prev.map(m => (String(m._id).startsWith("tmp-") ? saved : m)));
    } catch (err) {
      console.error("HTTP send error", err);
      setMessages(prev => prev.map(m => (String(m._id).startsWith("tmp-") ? { ...m, status: "failed" } : m)));
    }
  };

  if (loading) return <Box display="flex" alignItems="center" justifyContent="center" sx={{ py: 6 }}><CircularProgress /></Box>;

  // ===== classification helpers =====
  function deriveParticipantInfluencerIds(convo, participantObj) {
    // Try multiple shapes to find participantId and influencerId
    let pid = null;
    if (participantObj) {
      pid = toIdString(participantObj._id || participantObj.id || participantObj.user_id || participantObj);
    }
    // Conversation's participants array may be populated objects or ids
    let influencerId = null;
    let participantId = pid;

    const parts = Array.isArray(convo?.participants) ? convo.participants : [];
    for (const p of parts) {
      // p.user may be populated object or raw id
      const uid = p?.user ? toIdString(p.user) : (p?._id ? toIdString(p._id) : (p ? toIdString(p) : null));
      const role = (p?.role || "").toString().toLowerCase();
      if (!uid) continue;
      if (participantId && uid === participantId) {
        // already participant
      } else if (role === "influencer" || role === "admin" || (!participantId && role === "member")) {
        influencerId = uid;
      } else if (!participantId) {
        // if no explicit participant provided, choose first non-influencer as participant
        if (!participantId) participantId = uid;
      }
      // lastly if not set influencer yet and this uid is not participantId, use it
      if (!influencerId && participantId && uid !== participantId) influencerId = uid;
    }

    // fallback: some responses include conversation.influencer_id / conversation.influencer
    if (!influencerId) {
      if (convo?.influencer_id) influencerId = toIdString(convo.influencer_id);
      else if (convo?.influencer) influencerId = toIdString(convo.influencer._id || convo.influencer);
    }

    // final fallback: if conversation.participant_ids_sorted exists, pick the first id as influencer if no participant known
    if (!influencerId && convo?.participant_ids_sorted) {
      const partsSorted = convo.participant_ids_sorted.split("|").filter(Boolean);
      if (partsSorted.length === 2) {
        // choose the id that's not participantId
        influencerId = partsSorted.find(x => x !== participantId) || partsSorted[0];
      }
    }

    return { influencerId: influencerId || null, participantId: participantId || null };
  }

  function getSenderIdFromMessage(m) {
    if (!m) return null;
    if (m?.sender && (m.sender._id || m.sender.id)) return String(m.sender._id || m.sender.id);
    if (m?.senderId) return String(m.senderId);
    if (m?.from_user) return String(m.from_user);
    if (m?.fromUser) return String(m.fromUser);
    if (m?.from_participant_id) return String(m.from_participant_id);
    if (m?.from_participant) return String(m.from_participant);
    return null;
  }

  function isFromInfluencer(m) {
    const infId = influencerIdRef.current;
    if (!infId) return false;

    // direct matches
    const sid = getSenderIdFromMessage(m);
    if (sid && String(sid) === String(infId)) return true;

    // flags
    if (m?.senderRole && String(m.senderRole).toLowerCase() === "influencer") return true;
    if (m?.sender_type && String(m.sender_type).toLowerCase() === "influencer") return true;
    if (m?.from_influencer || m?.fromInfluencer) return true;

    return false;
  }

  function isFromParticipant(m) {
    const pId = participantIdRef.current;
    if (!pId) return false;

    const sid = getSenderIdFromMessage(m);
    if (sid && String(sid) === String(pId)) return true;

    if (m?.senderRole && String(m.senderRole).toLowerCase() === "participant") return true;
    if (m?.sender_type && String(m.sender_type).toLowerCase() === "participant") return true;
    if (m?.from_participant || m?.fromParticipant) return true;

    return false;
  }

  // Render
  return (
    <Paper sx={{ p: 2 }}>
      {!!errorMsg && <Alert severity="error" sx={{ mb: 2 }}>{errorMsg}</Alert>}

      <Box display="flex" alignItems="center" gap={2} sx={{ mb: 2 }}>
        <Avatar src={participant?.picture || ""}>{!participant?.picture && initials(participant?.name || participant?.email || "P")}</Avatar>
        <Box>
          <Typography variant="h6">{participant?.name || participant?.email || "Participant"}</Typography>
          <Typography variant="body2" color="textSecondary">Conversation</Typography>
        </Box>
      </Box>

   {/* === REPLACE THIS ENTIRE BLOCK: messages container === */}
<Box
  ref={scrollRef}
  sx={{
    height: 420,
    overflowY: "auto",
    bgcolor: "#fafafa",
    p: 2,
    borderRadius: 1,
    display: "flex",
    flexDirection: "column",
    gap: 1
  }}
>
  {messages.length === 0 ? (
    <Typography color="text.secondary">No messages yet</Typography>
  ) : (
    messages.map((m) => {
      // classification helpers (reuse your functions above)
      const fromParticipant = isFromParticipant(m);
      const fromInfluencer = isFromInfluencer(m);

      // determine final role
      const isParticipant =
        fromParticipant ||
        (!fromInfluencer &&
          (m.from_participant ||
            m.from_participant_id ||
            m.fromParticipant ||
            (getSenderIdFromMessage(m) &&
              participantIdRef.current &&
              String(getSenderIdFromMessage(m)) === String(participantIdRef.current))));

      const isInfluencer = fromInfluencer || (!isParticipant && !fromParticipant);

      // debug log — remove after verifying
      // eslint-disable-next-line no-console
      console.log("MSG CLASSIFY:", { id: getSenderIdFromMessage(m), isParticipant, isInfluencer, inf: influencerIdRef.current, part: participantIdRef.current });

      // bubble styling
      const bubbleBg = isInfluencer ? "#dcf8c6" : "#ffffff";
      const bubbleTextAlign = isInfluencer ? "right" : "left";
      const borderRadius = isInfluencer ? "16px 16px 6px 16px" : "16px 16px 16px 6px";

      const msgKey = m._id || m.id || `${m.createdAt || m.created_at || Date.now()}-${Math.random()}`;

      return (
        <Box
          key={msgKey}
          sx={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            gap: 0.25
          }}
        >
          {/* row with two columns: left (participant) and right (influencer).
              We use two flex children and change order so bubble/avatar end up on correct side. */}
          <Box sx={{ display: "flex", width: "100%", alignItems: "flex-end" }}>
            {/* LEFT CELL: participant avatar/bubble */}
            <Box
              sx={{
                display: "flex",
                alignItems: "flex-end",
                // If participant message => show bubble here, else keep empty space
                justifyContent: isParticipant ? "flex-start" : "flex-start",
                width: "50%"
              }}
            >
              {isParticipant ? (
                <>
                  <Avatar
                    src={participant?.picture || ""}
                    sx={{ width: 32, height: 32, fontSize: 12, mr: 1, flexShrink: 0 }}
                  >
                    {!participant?.picture && initials(participant?.name || participant?.email || "P")}
                  </Avatar>

                  <Box
                    sx={{
                      maxWidth: "82%",
                      p: 1.25,
                      bgcolor: bubbleBg,
                      boxShadow: 0.5,
                      borderRadius,
                      borderRadius,
                      wordBreak: "break-word"
                    }}
                  >
                    <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", textAlign: bubbleTextAlign }}>
                      {m.text || m.message || m.body}
                    </Typography>
                  </Box>
                </>
              ) : (
                /* keep the left half empty for influencer messages so layout stays stable */
                <Box sx={{ width: "100%" }} />
              )}
            </Box>

            {/* RIGHT CELL: influencer avatar/bubble */}
            <Box
              sx={{
                display: "flex",
                alignItems: "flex-end",
                justifyContent: isInfluencer ? "flex-end" : "flex-end",
                width: "50%"
              }}
            >
              {isInfluencer ? (
                <>
                  <Box
                    sx={{
                      maxWidth: "82%",
                      p: 1.25,
                      bgcolor: bubbleBg,
                      boxShadow: 0.5,
                      borderRadius,
                      wordBreak: "break-word",
                      mr: 1,
                      textAlign: bubbleTextAlign
                    }}
                  >
                    <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", textAlign: bubbleTextAlign }}>
                      {m.text || m.message || m.body}
                    </Typography>
                  </Box>

                  <Avatar
                    src={conversation?.influencer_picture || ""}
                    sx={{ width: 32, height: 32, fontSize: 12, flexShrink: 0 }}
                  >
                    {!conversation?.influencer_picture && initials(conversation?.influencer_name || conversation?.influencer?.name || "M")}
                  </Avatar>
                </>
              ) : (
                <Box sx={{ width: "100%" }} />
              )}
            </Box>
          </Box>

          {/* timestamp row aligned with bubble side */}
          <Box
            sx={{
              width: "100%",
              display: "flex",
              justifyContent: isInfluencer ? "flex-end" : "flex-start",
              pl: isParticipant ? 5 : 0,
              pr: isInfluencer ? 5 : 0
            }}
          >
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              {m.created_at ? new Date(m.created_at).toLocaleString() : m.createdAt ? new Date(m.createdAt).toLocaleString() : ""}
            </Typography>
            {m.status && <Typography variant="caption" sx={{ color: "text.secondary", ml: 1 }}>{m.status}</Typography>}
          </Box>
        </Box>
      );
    })
  )}
</Box>
{/* === END REPLACEMENT === */}


      <Box display="flex" gap={1} sx={{ mt: 2 }}>
        <TextField
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            const socket = socketRef.current;
            if (socket && conversation && conversation._id) {
              socket.emit("typing", { conversationId: conversation._id, isTyping: true, fromSocketId: socket.id });
              if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
              typingTimeoutRef.current = setTimeout(() => {
                if (socket && conversation && conversation._id) socket.emit("typing", { conversationId: conversation._id, isTyping: false, fromSocketId: socket.id });
                typingTimeoutRef.current = null;
              }, 900);
            }
          }}
          fullWidth
          placeholder="Reply..."
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
        />
        <Button variant="contained" endIcon={<SendIcon />} onClick={sendMessage}>Send</Button>
      </Box>

      {typingFromParticipant && <Typography variant="caption" sx={{ mt: 1 }}>{participant?.name || "Participant"} is typing...</Typography>}
    </Paper>
  );
}

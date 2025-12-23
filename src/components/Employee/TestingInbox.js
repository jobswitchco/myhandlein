import { useEffect, useState, useCallback, useRef, useMemo, useLayoutEffect } from "react";
import axios from "axios";
import EmojiPicker from "emoji-picker-react";
import {
  Box,
  Avatar,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Menu,
  MenuItem,
  TextField,
  Typography,
  Badge,
  CircularProgress,
  InputAdornment,
  Popover,
  Paper
} from "@mui/material";
import {
  Search,
  Send,
  MoreVert,
  Block,
  EmojiEmotions,
  Image as ImageIcon,
  Check,
  DoneAll,
  Close as CloseIcon
} from "@mui/icons-material";
import { getSocket } from "../../realtime/socket";


/* ---------- CONSTANTS ---------- */
const LABELS = ["Personal", "Lead", "General"];

const LABEL_STYLES = {
  Personal: { bg: "#E6F4EA", text: "#137333" },
  Lead: { bg: "#E8F0FE", text: "#1A56DB" },
  General: { bg: "#F1F3F4", text: "#4B5563" },
};

const getLastMessagePreview = (msg) => {
  if (!msg) return "No messages yet";
  if (msg.type === "system") return "Shared a reel";
  if (msg.type === "image") return "📷 Image";
  if (msg.type === "video") return "🎥 Video";
  if (msg.text?.trim()) return msg.text;
  return "New message";
};


export default function InboxManagement() {
  // Use environment variable or valid base URL
  const baseUrl = "/api/usersOn"; 

  /* ---------- STATE ---------- */
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [selectedConversationId, setSelectedConversationId] = useState(null);

  const [rawMessages, setRawMessages] = useState([]); // Store raw API data
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [activeLabel, setActiveLabel] = useState("All");
  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);
  const [syncingConvId, setSyncingConvId] = useState(null);

  // Menus & Popups
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [labelAnchor, setLabelAnchor] = useState(null);
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [emojiAnchor, setEmojiAnchor] = useState(null);

  // Refs
  const messagesContainerRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const prevScrollHeightRef = useRef(null); // For scroll restoration

   // 🔒 DEDUPE SET (CRITICAL)
  const messageIdSetRef = useRef(new Set());
  const [isSyncing, setIsSyncing] = useState(false);
  const syncingOlderRef = useRef(false);




  // File Upload State
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);


      /* ---------- SORT + DEDUPE ---------- */
const messages = useMemo(
  () =>
    [...rawMessages].sort(
      (a, b) =>
        new Date(a.createdAtPlatform) - new Date(b.createdAtPlatform)
    ),
  [rawMessages]
);




  /* ---------- FILE HANDLERS (FIX #3) ---------- */
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    // Create preview
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  /* ---------- EMOJI HANDLER (FIX #2) ---------- */
  const handleEmojiClick = (emojiData) => {
    setMessageText((prev) => prev + emojiData.emoji);
    // Optional: Keep picker open or close it
    // setEmojiAnchor(null); 
  };




// ==================== FRONTEND FIX ====================

// useEffect(() => {
//   const socket = getSocket();

//   const handler = (payload) => {
//     if (!["message:new", "conversation:updated", "participant:updated"].includes(payload.type)) return;

//     // Handle participant profile updates
//     if (payload.type === "participant:updated") {
//       setConversations(prev =>
//         prev.map(c =>
//           c._id === payload.conversationId
//             ? {
//                 ...c,
//                 participant: {
//                   ...c.participant,
//                   ...payload.data
//                 }
//               }
//             : c
//         )
//       );

//       // Also update selected conversation
//       setSelectedConversation(prev =>
//         prev?._id === payload.conversationId
//           ? {
//               ...prev,
//               participant: {
//                 ...prev.participant,
//                 ...payload.data
//               }
//             }
//           : prev
//       );
//       return;
//     }

//     // Handle conversation updates
//     if (payload.type === "conversation:updated") {
//       // 🔥 FIX 1: Older sync should NEVER reorder sidebar
//       if (payload.reason === "older-sync") {
//         if (payload.conversationId === selectedConversationId) {
//           setRawMessages([]);
//           messageIdSetRef.current.clear();
//           fetchMessages(selectedConversationId);
//         }
//         return; // ⛔ stop here
//       }

//       // 🔥 FIX 2: Only reorder when full data is provided
//       if (payload.data) {
//         setConversations(prev => {
//           const filtered = prev.filter(c => c._id !== payload.conversationId);
//           return [payload.data, ...filtered];
//         });
//       }
//       return;
//     }

//     // Handle new messages
//     if (payload.type === "message:new") {
//       const { conversationId, data } = payload;
      
//       // 🔥 CRITICAL: Validate message data
//       if (!data?._id || !conversationId) {
//         console.warn("Invalid message data:", payload);
//         return;
//       }

//       // 🔥 FIX: Strict deduplication using string comparison
//       const msgId = typeof data._id === 'object' ? data._id.toString() : String(data._id);
      
//       if (messageIdSetRef.current.has(msgId)) {
//         console.log("Duplicate message blocked:", msgId);
//         return;
//       }

//       // 🔥 CRITICAL FIX: Only add to chat if message belongs to CURRENT conversation
//       const isCurrentConversation = conversationId === selectedConversationId;
      
//       if (isCurrentConversation) {
//         messageIdSetRef.current.add(msgId);
        
//         setRawMessages((prev) => {
//           // Extra safety: check if message already exists in array
//           const exists = prev.some(m => {
//             const existingId = typeof m._id === 'object' ? m._id.toString() : String(m._id);
//             return existingId === msgId;
//           });
          
//           if (exists) {
//             console.log("Message already in array:", msgId);
//             return prev;
//           }
          
//           return [...prev, data];
//         });
//       }

//       // 🔥 FIX: Update sidebar for ALL conversations (not just current one)
//       setConversations((prev) => {
//         const existing = prev.find((c) => c._id === conversationId);
//         if (!existing) {
//           console.warn("Conversation not found in sidebar:", conversationId);
//           return prev;
//         }

//         // Create updated conversation object
//         const updated = {
//           ...existing,
//           lastMessage: {
//             text: data.text || (data.type === "image" ? "📷 Image" : data.type === "video" ? "🎥 Video" : "New message"),
//             type: data.type,
//             sender: data.sender,
//             timestamp: data.createdAtPlatform,
//           },
//           lastActivityAt: data.createdAtPlatform,
//           // 🔥 FIX: Only increment unread if NOT current conversation AND message is from them
//           unreadCount: isCurrentConversation
//             ? 0 // Reset unread if viewing this conversation
//             : data.sender === "them"
//               ? (existing.unreadCount || 0) + 1
//               : existing.unreadCount || 0,
//         };

//         // 🔥 FIX: Move to top regardless of which conversation it is
//         const filtered = prev.filter((c) => c._id !== conversationId);
//         return [updated, ...filtered];
//       });
//     }
//   };

//   socket.on("inbox:event", handler);
//   return () => socket.off("inbox:event", handler);
// }, [selectedConversationId, fetchMessages]);


// ==================== CORRECTED SOCKET HANDLER (NO DEPENDENCIES ISSUE) ====================

useEffect(() => {
  const socket = getSocket();

  const handler = (payload) => {
    if (!["message:new", "conversation:updated", "participant:updated"].includes(payload.type)) return;

    // Handle participant profile updates
    if (payload.type === "participant:updated") {
      setConversations(prev =>
        prev.map(c =>
          c._id === payload.conversationId
            ? {
                ...c,
                participant: {
                  ...c.participant,
                  ...payload.data
                }
              }
            : c
        )
      );

      // Also update selected conversation
      setSelectedConversation(prev =>
        prev?._id === payload.conversationId
          ? {
              ...prev,
              participant: {
                ...prev.participant,
                ...payload.data
              }
            }
          : prev
      );
      return;
    }

    // Handle conversation updates
    if (payload.type === "conversation:updated") {
      // 🔥 FIX 1: Older sync should NEVER reorder sidebar
      if (payload.reason === "older-sync") {
        if (payload.conversationId === selectedConversationId) {
          // 🔥 Call fetchMessages directly without dependency
          setRawMessages([]);
          messageIdSetRef.current.clear();
          
          // Inline fetch to avoid dependency issues
          (async () => {
            try {
              setLoadingMessages(true);
              const res = await axios.get(
                `${baseUrl}/conversations/${selectedConversationId}/messages`,
                {
                  withCredentials: true,
                  params: { limit: 20 },
                }
              );

              const payload = res.data?.data;
              if (payload) {
                const newMessages = payload.messages.filter(msg => {
                  const msgId = typeof msg._id === 'object' ? msg._id.toString() : String(msg._id);
                  
                  if (messageIdSetRef.current.has(msgId)) {
                    return false;
                  }
                  
                  messageIdSetRef.current.add(msgId);
                  return true;
                });

                setRawMessages(newMessages);
                setCursor(payload.nextCursor);
                setHasMore(payload.hasMore);
              }
            } catch (err) {
              console.error("Message fetch failed", err);
            } finally {
              setLoadingMessages(false);
            }
          })();
        }
        return; // ⛔ stop here
      }

      // 🔥 FIX 2: Only reorder when full data is provided
      if (payload.data) {
        setConversations(prev => {
          const filtered = prev.filter(c => c._id !== payload.conversationId);
          return [payload.data, ...filtered];
        });
      }
      return;
    }

    // Handle new messages
    if (payload.type === "message:new") {
      const { conversationId, data } = payload;
      
      // 🔥 CRITICAL: Validate message data
      if (!data?._id || !conversationId) {
        console.warn("Invalid message data:", payload);
        return;
      }

      // 🔥 FIX: Strict deduplication using string comparison
      const msgId = typeof data._id === 'object' ? data._id.toString() : String(data._id);
      
      if (messageIdSetRef.current.has(msgId)) {
        console.log("Duplicate message blocked:", msgId);
        return;
      }

      // 🔥 CRITICAL FIX: Only add to chat if message belongs to CURRENT conversation
      const isCurrentConversation = conversationId === selectedConversationId;
      
      if (isCurrentConversation) {
        messageIdSetRef.current.add(msgId);
        
        setRawMessages((prev) => {
          // Extra safety: check if message already exists in array
          const exists = prev.some(m => {
            const existingId = typeof m._id === 'object' ? m._id.toString() : String(m._id);
            return existingId === msgId;
          });
          
          if (exists) {
            console.log("Message already in array:", msgId);
            return prev;
          }
          
          return [...prev, data];
        });
      }

      // 🔥 FIX: Update sidebar for ALL conversations (not just current one)
      setConversations((prev) => {
        const existing = prev.find((c) => c._id === conversationId);
        if (!existing) {
          console.warn("Conversation not found in sidebar:", conversationId);
          return prev;
        }

        // Create updated conversation object
        const updated = {
          ...existing,
          lastMessage: {
            text: data.text || (data.type === "image" ? "📷 Image" : data.type === "video" ? "🎥 Video" : "New message"),
            type: data.type,
            sender: data.sender,
            timestamp: data.createdAtPlatform,
          },
          lastActivityAt: data.createdAtPlatform,
          // 🔥 FIX: Only increment unread if NOT current conversation AND message is from them
          unreadCount: isCurrentConversation
            ? 0 // Reset unread if viewing this conversation
            : data.sender === "them"
              ? (existing.unreadCount || 0) + 1
              : existing.unreadCount || 0,
        };

        // 🔥 FIX: Move to top regardless of which conversation it is
        const filtered = prev.filter((c) => c._id !== conversationId);
        return [updated, ...filtered];
      });
    }
  };

  socket.on("inbox:event", handler);
  return () => socket.off("inbox:event", handler);
}, [selectedConversationId]); // 🔥 REMOVED fetchMessages dependency

// ==================== KEEP YOUR EXISTING fetchMessages UNCHANGED ====================
// This should remain as is - no changes needed

useEffect(() => {
  const i = setInterval(async () => {
    const res = await axios.get(`${baseUrl}/conversations/sync-status`, {
      withCredentials: true,
    });
    setIsSyncing(res.data.syncing);
  }, 10000);

  return () => clearInterval(i);
}, []);




    /* ---------- FETCH CONVERSATIONS ---------- */
useEffect(() => {
  const loadInbox = async () => {
    try {
      setLoading(true);

      // 1️⃣ FAST: load from DB
      const res = await axios.get(`${baseUrl}/conversations`, {
        withCredentials: true,
      });

      const data = res.data?.data || [];
      setConversations(data);

      if (!selectedConversation && data.length > 0) {
        setSelectedConversation(data[0]);
        setSelectedConversationId(data[0]._id);
      }

      // 2️⃣ NON-BLOCKING: background sync
      axios.post(`${baseUrl}/conversations/sync`, {}, {
        withCredentials: true,
      }).catch(() => {});

    } catch (err) {
      console.error("Conversation load failed", err);
    } finally {
      setLoading(false);
    }
  };

  loadInbox();
}, []);



    /* ---------- JOIN / LEAVE ROOM ---------- */
useEffect(() => {
  if (!selectedConversationId) return;

  const socket = getSocket();

  if (socket.connected) {
    socket.emit("join_conversation", { conversationId: selectedConversationId });
  } else {
    socket.once("connect", () => {
      socket.emit("join_conversation", { conversationId: selectedConversationId });
    });
  }

  return () => {
    socket.emit("leave_conversation", {
      conversationId: selectedConversationId,
    });
  };
}, [selectedConversationId]);


  /* ---------- FETCH MESSAGES ---------- */
const fetchMessages = useCallback(
  async (conversationId, cursorParam = null) => {
    try {
      setLoadingMessages(true);

      if (cursorParam && messagesContainerRef.current) {
        prevScrollHeightRef.current =
          messagesContainerRef.current.scrollHeight;
      }

      const res = await axios.get(
        `${baseUrl}/conversations/${conversationId}/messages`,
        {
          withCredentials: true,
          params: cursorParam ? { cursor: cursorParam, limit: 20 } : { limit: 20 },
        }
      );

      const payload = res.data?.data;
      if (!payload) return;

      // 🔥 FIX: Add fetched messages to dedupe set
      const newMessages = payload.messages.filter(msg => {
        const msgId = typeof msg._id === 'object' ? msg._id.toString() : String(msg._id);
        
        if (messageIdSetRef.current.has(msgId)) {
          return false; // Skip duplicate
        }
        
        messageIdSetRef.current.add(msgId);
        return true;
      });

      setRawMessages((prev) =>
        cursorParam ? [...newMessages, ...prev] : newMessages
      );

      setCursor(payload.nextCursor);
      setHasMore(payload.hasMore);
    } catch (err) {
      console.error("Message fetch failed", err);
    } finally {
      setLoadingMessages(false);
    }
  },
  []
);

  /* ---------- RESET ON CONVERSATION CHANGE ---------- */
useEffect(() => {
  if (!selectedConversation?._id) return;

  // 🔥 Clear messages and dedupe set
  setRawMessages([]);
  messageIdSetRef.current.clear();
  setCursor(null);
  setHasMore(true);
  
  fetchMessages(selectedConversation._id);
}, [selectedConversation?._id, fetchMessages]);

  /* ---------- SCROLL MANAGEMENT ---------- */
  useLayoutEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    if (!prevScrollHeightRef.current) {
      container.scrollTop = container.scrollHeight;
    } else {
      const diff = container.scrollHeight - prevScrollHeightRef.current;
      container.scrollTop = diff;
      prevScrollHeightRef.current = null;
    }
  }, [messages]);


const handleScroll = async (e) => {
  const el = e.target;

  // Top reached
  if (el.scrollTop === 0 && !loadingMessages) {

    // 1️⃣ Load more from DB if possible
    if (hasMore && cursor) {
      fetchMessages(selectedConversation._id, cursor);
      return;
    }

    // 2️⃣ DB exhausted → ask backend to sync older
   if (!hasMore && !syncingOlderRef.current) {
  syncingOlderRef.current = true;

  axios.post(
    `${baseUrl}/conversations/${selectedConversation._id}/sync-older`,
    {},
    { withCredentials: true }
  ).finally(() => {
    syncingOlderRef.current = false;
  });
}

  }
};


  /* ---------- SEND MESSAGE ---------- */
const sendMessage = async () => {
  if (sending || !selectedConversation) return;
  if (!messageText.trim() && !selectedFile) return;

  setSending(true);

    const textToSend = messageText.trim();
    const fileToSend = selectedFile;

  try {
  

    // Clear inputs immediately
    setMessageText("");
    handleRemoveFile();

    // Send message
    if (fileToSend) {
      const formData = new FormData();
      formData.append("file", fileToSend);
      formData.append(
        "type",
        fileToSend.type.startsWith("video") ? "video" : "image"
      );
      if (textToSend) {
        formData.append("text", textToSend);
      }

      await axios.post(
        `${baseUrl}/conversations/${selectedConversation._id}/messages`,
        formData,
        {
          withCredentials: true,
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
    } else if (textToSend) {
      await axios.post(
        `${baseUrl}/conversations/${selectedConversation._id}/messages`,
        { text: textToSend, type: "text" },
        { withCredentials: true }
      );
    }

    // 🔥 DON'T add message here - socket will handle it
    // This prevents duplicates completely

    // Scroll to bottom
    setTimeout(() => {
      if (messagesContainerRef.current) {
        messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
      }
    }, 100);
  } catch (err) {
    console.error("Send message failed", err);
    alert("Failed to send message");
    setMessageText(textToSend); // Restore on error
  } finally {
    setSending(false);
    inputRef.current?.focus();
  }
};

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  /* ---------- FILTER CONVERSATIONS ---------- */
const sortedConversations = useMemo(() => {
  return [...conversations].sort((a, b) => {
    const ta = a.lastActivityAt
      ? new Date(a.lastActivityAt).getTime()
      : 0;

    const tb = b.lastActivityAt
      ? new Date(b.lastActivityAt).getTime()
      : 0;

    return tb - ta;
  });
}, [conversations]);


const filteredConversations = sortedConversations
  .filter((c) => activeLabel === "All" || c.label === activeLabel)
  .filter((c) =>
    c.participant?.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );


  const handleLabelChange = (label) => {
    setConversations((prev) =>
      prev.map((c) => (c._id === selectedConversation._id ? { ...c, label } : c))
    );
    setLabelAnchor(null);
    setMenuAnchor(null);
  };


const displayName =
  selectedConversation?.participant?.name ||
  selectedConversation?.participant?.username ||
  "Instagram User";

  const showUsername = selectedConversation?.participant?.username || "Instagram User";


  const formatPreviewTime = (date) => {
  const d = new Date(date);
  const now = new Date();

  const isToday =
    d.toDateString() === now.toDateString();

  return isToday
    ? d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleDateString([], { day: "2-digit", month: "short" });
};


  /* ========================================================= */

  return (
    <Box height="98vh" display="flex" sx={{ overflow: "hidden", bgcolor: "#f8fafc" }}>
      {/* ================= LEFT SIDEBAR ================= */}
      <Box
        width={360}
        bgcolor="#fff"
        borderRight="1px solid #e5e7eb"
        display="flex"
        flexDirection="column"
      >
        {/* Search & Tabs */}
        <Box p={2}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: <Search sx={{ mr: 1, color: "text.secondary" }} />,
            }}
          />
        </Box>
        <Box px={2} pb={2} display="flex" gap={1} flexWrap="wrap">
          {["All", ...LABELS].map((label) => (
            <Chip
              key={label}
              label={label}
              clickable
              size="small"
              color={activeLabel === label ? "primary" : "default"}
              onClick={() => setActiveLabel(label)}
            />
          ))}
        </Box>
        {isSyncing && (
  <Typography
    variant="caption"
    sx={{ ml: 1, color: "text.secondary" }}
  >
    Syncing…
  </Typography>
)}


        {/* Conversation List */}
        <Box flex={1} sx={{ overflowY: "auto" }}>
          {loading ? (
            <Box p={3} display="flex" justifyContent="center">
              <CircularProgress size={24} />
            </Box>
          ) : (
            filteredConversations.map((conv) => {
             const uname = conv.participant?.name || conv.participant?.username || "Instagram User";
const uInitial = uname.charAt(0).toUpperCase();

              const isSelected = selectedConversation?._id === conv._id;
              
              const previewDate =
  conv.lastActivityAt ||
  conv.lastMessage?.timestamp ||
  null;
              return (
                <Box
                  key={conv._id}
                  px={2}
                  py={2}
                  borderBottom="1px solid #f1f1f1"
      onClick={async () => {
              const isSameConversation = selectedConversationId === conv._id;

              try {
                // Show loading
                setSyncingConvId(conv._id);

                // 1️⃣ Trigger Meta sync and WAIT for completion
                await axios.post(
                  `${baseUrl}/conversations/${conv._id}/sync-latest`,
                  {},
                  { withCredentials: true }
                );

                // 2️⃣ If returning to same conversation, force refetch
                if (isSameConversation) {
                  setRawMessages([]);
                  messageIdSetRef.current.clear();
                  setCursor(null);
                  setHasMore(true);
                  await fetchMessages(conv._id);
                } else {
                  // 3️⃣ Switch conversation (triggers fetchMessages via useEffect)
                  setSelectedConversation(conv);
                  setSelectedConversationId(conv._id);
                }

                // 4️⃣ Refresh conversation list to update preview
                const res = await axios.get(`${baseUrl}/conversations`, {
                  withCredentials: true,
                });
                const freshConvos = res.data?.data || [];
                setConversations(freshConvos);

                // 5️⃣ Reset unread locally
                setConversations((prev) =>
                  prev.map((c) =>
                    c._id === conv._id ? { ...c, unreadCount: 0 } : c
                  )
                );
              } catch (err) {
                console.error("Sync failed:", err);
              } finally {
                setSyncingConvId(null);
              }
            }}


                  sx={{
                    cursor: "pointer",
                    bgcolor: isSelected ? "#EEF4FF" : "#fff",
                    transition: "0.2s",
                    "&:hover": { bgcolor: isSelected ? "#EEF4FF" : "#f9fafb" },
                     opacity: syncingConvId === conv._id ? 0.6 : 1,
                    pointerEvents: syncingConvId === conv._id ? "none" : "auto",
                  }}
                >
                  <Box display="flex" justifyContent="space-between">
                    <Box display="flex" gap={1.5} alignItems="center">
                    <Avatar
  src={conv.participant?.profilePic || undefined}
  sx={{ width: 40, height: 40 }}
>
  {!conv.participant?.profilePic && uname[0]?.toUpperCase()}
</Avatar>

                      <Box>
                      
                        <Typography fontWeight={600} fontSize="0.95rem">{uname}</Typography>
                        <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: "180px", fontSize: "0.85rem" }}>
                            {getLastMessagePreview(conv.lastMessage)}
                        </Typography>
                      </Box>
                    </Box>
                    <Box display="flex" flexDirection="column" alignItems="flex-end">
                       <Typography variant="caption" color="text.secondary" fontSize="0.7rem">
                       {previewDate && formatPreviewTime(previewDate)}
                        </Typography>
                        {conv.unreadCount > 0 && (
                          <Badge color="primary" badgeContent={conv.unreadCount} sx={{ mt: 1, mr: 1}} />
                        )}
                    </Box>
                  </Box>
                  
                  {conv.label && (
                      <Chip
                        size="small"
                        label={conv.label}
                        sx={{
                            mt: 1,
                            bgcolor: LABEL_STYLES[conv.label]?.bg,
                            color: LABEL_STYLES[conv.label]?.text,
                            fontSize: "0.7rem",
                            height: "20px",
                        }}
                        />
                  )}
                </Box>
              );
            })
          )}
        </Box>
      </Box>

      {/* ================= RIGHT CHAT ================= */}
      <Box flex={1} display="flex" flexDirection="column" bgcolor="#f0f2f5">
        {selectedConversation ? (
          <>
            {/* HEADER */}
            <Box
              px={3}
              py={1.5}
              bgcolor="#fff"
              borderBottom="1px solid #e5e7eb"
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              boxShadow="0 1px 2px rgba(0,0,0,0.05)"
            >
              <Box display="flex" gap={2} alignItems="center">
               <Avatar
  src={selectedConversation?.participant?.profilePic || undefined}
  sx={{ width: 40, height: 40 }}
>
  {!selectedConversation?.participant?.profilePic &&
    displayName[0]?.toUpperCase()}
</Avatar>

                <Box>
                  <Typography fontWeight={600} fontSize="1rem">
                    {displayName}
                  </Typography>

                  <Typography
                        sx={{
                            fontFamily: "Inter",
                            fontSize: "14px",
                            cursor: "pointer",
                            color: "#E83C91",
                            "&:hover": { textDecoration: "underline" }
                        }}
                        onClick={() =>
                            window.open(
                            `https://www.instagram.com/${showUsername}/`,
                            "_blank",
                            "noopener,noreferrer"
                            )
                        }
                        >
                        {showUsername}
                        </Typography>

                 
                </Box>
              </Box>

              <Box display="flex" gap={1} alignItems="center">
                 {/* Simplified Header Actions */}
                <Button variant="outlined" color="error" size="small" startIcon={<Block />} onClick={() => setBlockDialogOpen(true)}>
                  Block
                </Button>
                <IconButton onClick={(e) => setMenuAnchor(e.currentTarget)}>
                  <MoreVert />
                </IconButton>
              </Box>
            </Box>

            {/* MENUS */}
            <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={() => setMenuAnchor(null)}>
              <MenuItem onMouseEnter={(e) => setLabelAnchor(e.currentTarget)}>Label conversation as</MenuItem>
            </Menu>
            <Menu anchorEl={labelAnchor} open={Boolean(labelAnchor)} onClose={() => setLabelAnchor(null)}>
              {LABELS.map((label) => (
                <MenuItem key={label} onClick={() => handleLabelChange(label)}>
                  <Typography flex={1}>{label}</Typography>
                  {selectedConversation.label === label && <Check fontSize="small" />}
                </MenuItem>
              ))}
            </Menu>

            {/* MESSAGES AREA */}
            <Box
              ref={messagesContainerRef}
              flex={1}
              onScroll={handleScroll}
              sx={{
                overflowY: "auto",
                px: 3,
                py: 2,
                display: "flex",
                flexDirection: "column",
                gap: 0.5,
              }}
            >
              {loadingMessages && hasMore && (
                <Box textAlign="center" py={1}>
                  <CircularProgress size={20} />
                </Box>
              )}

              {messages.map((msg, index) => {
                const isMe = msg.sender === "me"; // ISSUE 1: Ensure backend returns 'me' correctly
                
                // Grouping Logic
                const prevMsg = messages[index - 1];
                const showAvatar = !isMe && (!prevMsg || prevMsg.sender !== msg.sender);
                const showTimestamp = !prevMsg || (new Date(msg.createdAtPlatform) - new Date(prevMsg.createdAtPlatform) > 300000); // 5 mins

                return (
                  <Box key={msg._id} display="flex" flexDirection="column">
                    {showTimestamp && (
                      <Box display="flex" justifyContent="center" my={2}>
                        <Typography variant="caption" sx={{ bgcolor: "#e0e7ff", color: "#4338ca", px: 1.5, py: 0.5, borderRadius: 4 }}>
                          {new Date(msg.createdAtPlatform).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'})}
                        </Typography>
                      </Box>
                    )}

                    <Box
                      display="flex"
                      justifyContent={isMe ? "flex-end" : "flex-start"}
                      alignItems="flex-end"
                      mb={showAvatar ? 1 : 0.2}
                    >
                      {/* Avatar for 'Them' */}
                      {!isMe && (
                          <Box width={32} mr={1}>
                             {showAvatar && (
                                <Avatar sx={{ width: 32, height: 32, bgcolor: "primary.main", fontSize: "0.8rem" }}>
                                    {displayName[0]?.toUpperCase()}
                                </Avatar>
                             )}
                          </Box>
                      )}

                      {/* Message Bubble */}
                      <Box
                        maxWidth="60%"
                        sx={{
                          bgcolor: isMe ? "#2563EB" : "#fff",
                          color: isMe ? "#fff" : "#1e293b",
                          borderRadius: isMe ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                          boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
                          p: 1.5,
                          position: "relative",
                          wordBreak: "break-word"
                        }}
                      >
                         {/* ISSUE 5: Handle Attachment/Text Rendering */}
                         
                         {/* Image Render */}
                       {msg.type === "image" && msg.mediaUrl && (
                          <Box
                            component="img"
                            src={msg.mediaUrl}
                            alt="attachment"
                            sx={{ borderRadius: 2, maxWidth: "100%" }}
                          />
                        )}

                        {msg.type === "video" && msg.mediaUrl && (
                          <video
                            src={msg.mediaUrl}
                            controls
                            style={{ maxWidth: "100%", borderRadius: 8 }}
                          />
                        )}


                         {/* Text Render */}
                         {msg.text ? (
                            <Typography variant="body2" fontSize="0.95rem" lineHeight={1.5}>
                                {msg.text}
                            </Typography>
                         ) : (
                             // Only show placeholder if NO media and NO text
                             (!msg.mediaUrl && !msg.text) && (
                                 <Typography variant="body2" fontStyle="italic">Attachment unavailable</Typography>
                             )
                         )}
                         {/* Action link for system messages (e.g. View on Instagram) */}
                        {msg.action?.url && (
                        <Typography
                            variant="body2"
                            sx={{
                            mt: 0.5,
                            color: isMe ? "#BFDBFE" : "#2563EB",
                            fontSize: "0.85rem",
                            cursor: "pointer",
                            fontWeight: 500,
                            "&:hover": { textDecoration: "underline" }
                            }}
                            onClick={() =>
                            window.open(msg.action.url, "_blank", "noopener,noreferrer")
                            }
                        >
                            {msg.action.label}
                        </Typography>
                        )}


                         {/* Metadata (Time + Read Receipt) */}
                         <Box display="flex" justifyContent="flex-end" alignItems="center" gap={0.5} mt={0.5}>
                             <Typography variant="caption" fontSize="0.65rem" sx={{ opacity: 0.8 }}>
                                {new Date(msg.createdAtPlatform).toLocaleTimeString([], { hour: '2-digit', minute:'2-digit'})}
                             </Typography>
                             {isMe && <DoneAll sx={{ fontSize: 14, color: msg.isRead ? "#93c5fd" : "#cbd5e1" }} />}
                         </Box>

                      </Box>
                    </Box>
                  </Box>
                );
              })}
            </Box>

            {/* INPUT AREA */}
            <Box bgcolor="#fff" px={2} py={2} borderTop="1px solid #e5e7eb">
              
              {/* ISSUE 3: Image Preview with Deselect */}
              {previewUrl && (
                  <Box 
                    mb={2} 
                    p={1} 
                    bgcolor="#f1f5f9" 
                    borderRadius={2} 
                    display="inline-flex" 
                    position="relative"
                    border="1px solid #e2e8f0"
                  >
                      <Box component="img" src={previewUrl} height={80} borderRadius={1} alt="Preview" />
                      <IconButton 
                        size="small" 
                        onClick={handleRemoveFile}
                        sx={{ 
                            position: "absolute", 
                            top: -8, 
                            right: -8, 
                            bgcolor: "#fff", 
                            border: "1px solid #cbd5e1",
                            "&:hover": { bgcolor: "#f1f1f1" }
                        }}
                      >
                          <CloseIcon fontSize="small" />
                      </IconButton>
                  </Box>
              )}

              <Box display="flex" alignItems="flex-end" gap={1}>
                <IconButton onClick={() => fileInputRef.current.click()} color="primary">
                  <ImageIcon />
                </IconButton>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  hidden
                  onChange={handleFileSelect}
                />

                <TextField
                  fullWidth
                  multiline
                  maxRows={4}
                  placeholder="Type a message..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={sending}
                  inputRef={inputRef}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: "20px",
                      bgcolor: "#f8fafc",
                      paddingRight: "40px" // Space for emoji
                    },
                  }}
                  InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                            {/* ISSUE 2: Emoji Trigger */}
                            <IconButton onClick={(e) => setEmojiAnchor(e.currentTarget)}>
                                <EmojiEmotions sx={{ color: "#64748b" }} />
                            </IconButton>
                        </InputAdornment>
                      )
                  }}
                />

                <IconButton
                  onClick={sendMessage}
                  disabled={(!messageText.trim() && !selectedFile) || sending}
                  sx={{
                    bgcolor: "primary.main",
                    color: "#fff",
                    width: 44, 
                    height: 44,
                    "&:hover": { bgcolor: "primary.dark" },
                    "&:disabled": { bgcolor: "#cbd5e1" },
                  }}
                >
                  {sending ? <CircularProgress size={20} sx={{ color: "#fff" }} /> : <Send />}
                </IconButton>
              </Box>

              {/* Emoji Popover */}
              <Popover
                open={Boolean(emojiAnchor)}
                anchorEl={emojiAnchor}
                onClose={() => setEmojiAnchor(null)}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                transformOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              >
                 <EmojiPicker onEmojiClick={handleEmojiClick} width={300} height={400} />
              </Popover>

            </Box>
          </>
        ) : (
          <Box flex={1} display="flex" alignItems="center" justifyContent="center">
            <Typography variant="h6" color="text.secondary">Select a conversation</Typography>
          </Box>
        )}
      </Box>

      {/* BLOCK DIALOG */}
      <Dialog open={blockDialogOpen} onClose={() => setBlockDialogOpen(false)}>
        <DialogTitle>Block User</DialogTitle>
        <DialogContent>Are you sure you want to block this user?</DialogContent>
        <DialogActions>
          <Button onClick={() => setBlockDialogOpen(false)}>Cancel</Button>
          <Button color="error" variant="contained">Block</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
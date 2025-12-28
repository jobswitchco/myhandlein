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
  Skeleton,
  Tooltip
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
const LABELS = ["Personal", "Leads", "General"];

const LABEL_STYLES = {
  Personal: { bg: "#E6F4EA", text: "#137333" },
  Leads: { bg: "#E8F0FE", text: "#1A56DB" },
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

  const [creatorId, setCreatorId] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);

  // File Upload State
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [hydratingFromMeta, setHydratingFromMeta] = useState(false);

  const [convCursor, setConvCursor] = useState(null);
  const [hasMoreConversations, setHasMoreConversations] = useState(true);
  const [loadingOlderConversations, setLoadingOlderConversations] = useState(false);

  const convListRef = useRef(null);
  const prevConvScrollHeightRef = useRef(null);


  const [loadingMetaConversations, setLoadingMetaConversations] = useState(false);

const loadingConversationsRef = useRef(false); // 🔥 Prevent duplicate calls
// 🔒 DEDUPE SET FOR CONVERSATIONS (CRITICAL)
const conversationIdSetRef = useRef(new Set());
const appendedInLastFetchRef = useRef(false);

 const [notesOpen, setNotesOpen] = useState(false);
  const [notesText, setNotesText] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [notesAnchor, setNotesAnchor] = useState({ x: 220, y: 800 });
  const notesRef = useRef(null);

const NOTES_WIDTH = 460;
const NOTES_MARGIN = 16; // breathing room from screen edge

const [notesHasPosition, setNotesHasPosition] = useState(false);
const openNotesCentered = () => {
  const x = Math.max(
    (window.innerWidth - NOTES_WIDTH) / 2,
    NOTES_MARGIN
  );

  const y = Math.max(
    (window.innerHeight - 260) / 2, // ~notes height
    NOTES_MARGIN
  );

  setNotesAnchor({ x, y });
  setNotesHasPosition(true);
  setNotesOpen(true);
};

const [initialNotesText, setInitialNotesText] = useState("");

const isNotesDirty = notesText.trim() !== initialNotesText.trim();


const handleDrag = (e) => {
  if (!notesRef.current) return;

  const startX = e.clientX;
  const startY = e.clientY;

  const { left, top } = notesRef.current.getBoundingClientRect();

  const handleMouseMove = (ev) => {
    if (!notesRef.current) return;

    notesRef.current.style.left = `${left + ev.clientX - startX}px`;
    notesRef.current.style.top = `${top + ev.clientY - startY}px`;
  };

  const handleMouseUp = () => {
    window.removeEventListener("mousemove", handleMouseMove);
    window.removeEventListener("mouseup", handleMouseUp);
  };

  window.addEventListener("mousemove", handleMouseMove);
  window.addEventListener("mouseup", handleMouseUp);
};



  const getNotesSnippet = (text, max = 70) => {
  if (!text) return "";
  return text.length > max ? text.slice(0, max) + "…" : text;
};



  const CHAT_MEDIA_STYLE = {
  maxWidth: "300px",
  maxHeight: "340px",
  objectFit: "contain",
  cursor: "pointer",
  display: "block",
};

const labelCounts = useMemo(() => {
  const counts = {
    Personal: 0,
    Leads: 0,
    General: 0,
  };

  for (const c of conversations) {
    if (counts[c.label] !== undefined) {
      counts[c.label]++;
    }
  }

  return counts;
}, [conversations]);



      /* ---------- SORT + DEDUPE ---------- */
const messages = useMemo(
  () =>
    [...rawMessages].sort(
      (a, b) =>
        new Date(a.createdAtPlatform) - new Date(b.createdAtPlatform)
    ),
  [rawMessages]
);


const markReadTimeoutRef = useRef(null);

const markConversationAsRead = (conversationId) => {
  if (markReadTimeoutRef.current) return;

  markReadTimeoutRef.current = setTimeout(async () => {
    try {
      await axios.post(
        `${baseUrl}/conversations/${conversationId}/mark-read`,
        {},
        { withCredentials: true }
      );
    } catch (e) {
      console.error("mark-read failed", e);
    } finally {
      markReadTimeoutRef.current = null;
    }
  }, 300); // debounce window
};


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

const loadOlderConversations = async () => {
  // 🔥 FIX #1 & #2: Prevent duplicate calls and check conditions
 if (loadingConversationsRef.current || !hasMoreConversations) {
    console.log('⏭️ Skipping load:', {
      loading: loadingConversationsRef.current,
      hasMore: hasMoreConversations,
      cursor: convCursor
    });
    return;
  }

  try {
    loadingConversationsRef.current = true;
    setLoadingOlderConversations(true);

    console.log('📥 Loading more conversations with cursor:', convCursor);

    const res = await axios.get(`${baseUrl}/conversations`, {
      withCredentials: true,
      params: {
        cursor: convCursor,
        limit: 10,
      },
    });

    const newConvos = res.data.data || [];
    
    console.log('✅ Loaded conversations:', {
      count: newConvos.length,
      nextCursor: res.data.nextCursor,
      hasMore: res.data.hasMore
    });

    // 🔥 FIX #2: Append new conversations
setConversations(prev => {
  const unique = [];

  for (const conv of newConvos) {
    if (!conversationIdSetRef.current.has(conv._id)) {
      conversationIdSetRef.current.add(conv._id);
      unique.push(conv);
    }
  }

  appendedInLastFetchRef.current = unique.length > 0;

  return [...prev, ...unique];
});


    setConvCursor(res.data.nextCursor);
    setHasMoreConversations(res.data.hasMore);
  } catch (err) {
    console.error('❌ Failed to load conversations:', err);
  } finally {
    loadingConversationsRef.current = false;
    setLoadingOlderConversations(false);
  }
};

const handleConvScroll = async (e) => {
  const el = e.target;

  if (syncingOlderRef.current) {
    return;
  }

  const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 60;

  console.log("📊 Conv Scroll Debug:", {
    nearBottom,
    loadingOlderConversations,
    loadingMetaConversations,
    hasMoreConversations,
    convCursor,
  });

  // ❌ Not near bottom → do nothing
  if (!nearBottom) return;

  // ❌ Already loading → do nothing
  if (loadingOlderConversations || loadingMetaConversations) return;

  /**
   * =========================================================
   * 1️⃣ PRIMARY PATH — PAGINATE DB
   * =========================================================
   */
  if (hasMoreConversations && convCursor) {
    console.log("✅ Paginating DB conversations");
    prevConvScrollHeightRef.current = el.scrollHeight;
    await loadOlderConversations();
    return;
  }

  /**
   * =========================================================
   * 2️⃣ FALLBACK — DB EXHAUSTED, FETCH FROM META
   * =========================================================
   */
  if (!hasMoreConversations && !syncingOlderRef.current) {
    console.log("🔄 DB exhausted, fetching from Meta...");
    
    syncingOlderRef.current = true;
    setLoadingMetaConversations(true);

    try {
      // Trigger Meta sync
      await axios.post(
        `${baseUrl}/conversations/load-more-from-meta`,
        {},
        { withCredentials: true }
      );

      console.log("⏳ Waiting for Meta sync to complete...");

      // Wait for backend to persist new conversations
      await new Promise(resolve => setTimeout(resolve, 1500));

      // 🔥 Refresh the entire conversation list from DB
   // ✅ After Meta sync, retry DB pagination
console.log("🔁 Retrying DB pagination after Meta sync...");

// IMPORTANT: allow cursor-based fetch even if convCursor is null
const res = await axios.get(`${baseUrl}/conversations`, {
  withCredentials: true,
  params: {
    cursor: convCursor,
    limit: 10,
  },
});

const newConvos = res.data?.data || [];

console.log("🧩 Meta → DB returned:", {
  fetched: newConvos.length,
  nextCursor: res.data.nextCursor,
  hasMore: res.data.hasMore,
});


      // 🔥 Only update if we got new conversations
   if (newConvos.length > 0) {
 setConversations(prev => {
  const unique = [];

  for (const conv of newConvos) {
    if (!conversationIdSetRef.current.has(conv._id)) {
      conversationIdSetRef.current.add(conv._id);
      unique.push(conv);
    }
  }

  appendedInLastFetchRef.current = unique.length > 0;

  return [...prev, ...unique];
});


  setConvCursor(res.data.nextCursor);
  setHasMoreConversations(res.data.hasMore);
  console.log("✅ Appended Meta conversations");
} else {
  console.log("ℹ️ No new conversations even after Meta");
  setHasMoreConversations(false);
}


    } catch (err) {
      console.error("❌ Meta sync failed", err);
    } finally {
      setLoadingMetaConversations(false);
      
      // Release lock after cooldown
      setTimeout(() => {
        syncingOlderRef.current = false;
      }, 500);
    }
  }
};


useEffect(() => {
  if (!notesOpen) return;

  const handleEsc = (e) => {
    if (e.key === "Escape") {
      setNotesOpen(false);
    }
  };

  window.addEventListener("keydown", handleEsc);
  return () => window.removeEventListener("keydown", handleEsc);
}, [notesOpen]);


useEffect(() => {
  if (appendedInLastFetchRef.current) {
    // allow one render frame to commit
    requestAnimationFrame(() => {
      appendedInLastFetchRef.current = false;
    });
  }
}, [conversations]);





  /* ---------- FETCH CREATOR ID (ONCE) ---------- */
useEffect(() => {
  let cancelled = false;

  (async () => {
    try {
   

      const res = await axios.get(`${baseUrl}/fetch-creatorid`, {
      withCredentials: true,
    });

      if (!cancelled) {
        setCreatorId(res.data?.user?._id || null);
      }
    } catch (err) {
      console.error("Failed to fetch creatorId", err);
    }
  })();

  return () => {
    cancelled = true;
  };
}, []);

/* ---------- JOIN CREATOR ROOM (SIDEBAR EVENTS) ---------- */
useEffect(() => {
  if (!creatorId) return;

  const socket = getSocket();

  if (socket.connected) {
    socket.emit("join_creator", { creatorId });
  } else {
    socket.once("connect", () => {
      socket.emit("join_creator", { creatorId });
    });
  }

  return () => {
    socket.emit("leave_creator", { creatorId });
  };
}, [creatorId]);



useEffect(() => {
  const socket = getSocket();

  const handler = (payload) => {
  if (
  ![
    "message:new",
    "conversation:updated",
    "participant:updated",
    "older-messages:ready",
  ].includes(payload.type)
) {
  return;
}


    /* ================= PARTICIPANT UPDATE ================= */
    if (payload.type === "participant:updated") {
      setConversations((prev) =>
        prev.map((c) =>
          c._id === payload.conversationId
            ? {
                ...c,
                participant: {
                  ...c.participant,
                  ...payload.data,
                },
              }
            : c
        )
      );

      setSelectedConversation((prev) =>
        prev?._id === payload.conversationId
          ? {
              ...prev,
              participant: {
                ...prev.participant,
                ...payload.data,
              },
            }
          : prev
      );

      return;
    }

    /* ================= CONVERSATION UPDATE ================= */
    if (payload.type === "conversation:updated") {
      const { conversationId, data, reason } = payload;

      if (reason === "older-sync") return;

      if (data) {
        setConversations((prev) =>
          prev.map((c) => {
            if (c._id !== conversationId) return c;

            const lastParticipantMessageAt =
              data.lastParticipantMessageAt ??
              c.lastParticipantMessageAt;

            const canReply = computeCanReply(lastParticipantMessageAt);

            return {
              ...c,
              ...data,
              lastParticipantMessageAt,
              canReply,
              replyDisabledReason: canReply
                ? null
                : "waiting_for_reply",
            };
          })
        );

        setSelectedConversation((prev) => {
          if (!prev || prev._id !== conversationId) return prev;

          const lastParticipantMessageAt =
            data.lastParticipantMessageAt ??
            prev.lastParticipantMessageAt;

          const canReply = computeCanReply(lastParticipantMessageAt);

          return {
            ...prev,
            ...data,
            lastParticipantMessageAt,
            canReply,
            replyDisabledReason: canReply
              ? null
              : "waiting_for_reply",
          };
        });
      }

      return;
    }

    /* ================= MESSAGE NEW ================= */
  if (payload.type === "message:new") {
  const { conversationId, data, conversation } = payload;

  const isActiveConversation =
    conversationId === selectedConversationId;

  const isFromThem = data?.sender === "them";

  /* =========================================================
     1️⃣ ACTIVE CHAT — APPEND MESSAGE
     ========================================================= */
  if (isActiveConversation) {
    const msgId = String(data._id);

    if (!messageIdSetRef.current.has(msgId)) {
      messageIdSetRef.current.add(msgId);
      setRawMessages((prev) => [...prev, data]);
    }
  }

  /* =========================================================
     2️⃣ AUTO MARK AS READ (CHAT IS OPEN)
     ========================================================= */
  if (isActiveConversation && isFromThem) {
    markConversationAsRead(conversationId); // 🔥 debounced fn
  }

  /* =========================================================
     3️⃣ SIDEBAR UPDATE (SOURCE OF TRUTH)
     ========================================================= */
  setConversations((prev) =>
    prev.map((c) => {
      if (c._id !== conversationId) return c;

      const lastParticipantMessageAt =
        conversation?.lastParticipantMessageAt ??
        (isFromThem ? data.createdAtPlatform : c.lastParticipantMessageAt);

      const canReply = computeCanReply(lastParticipantMessageAt);

      return {
        ...c,
        lastMessage: conversation?.lastMessage ?? c.lastMessage,
        lastActivityAt:
          conversation?.lastActivityAt ?? data.createdAtPlatform ?? c.lastActivityAt,

        unreadCount: isActiveConversation
          ? 0
          : conversation?.unreadCount ?? c.unreadCount,

        lastParticipantMessageAt,
        canReply,
        replyDisabledReason: canReply ? null : "waiting_for_reply",
      };
    })
  );

  /* =========================================================
     4️⃣ ACTIVE CONVERSATION SNAPSHOT
     ========================================================= */
  setSelectedConversation((prev) => {
    if (!prev || prev._id !== conversationId) return prev;

    const lastParticipantMessageAt =
      conversation?.lastParticipantMessageAt ??
      (isFromThem ? data.createdAtPlatform : prev.lastParticipantMessageAt);

    const canReply = computeCanReply(lastParticipantMessageAt);

    return {
      ...prev,
      lastMessage: conversation?.lastMessage ?? prev.lastMessage,
      lastActivityAt:
        conversation?.lastActivityAt ?? data.createdAtPlatform ?? prev.lastActivityAt,

      unreadCount: 0,
      lastParticipantMessageAt,
      canReply,
      replyDisabledReason: canReply ? null : "waiting_for_reply",
    };
  });
}

if (payload.type === "conversation:created") {
  setConversations(prev => {
    if (conversationIdSetRef.current.has(payload.data._id)) return prev;

    conversationIdSetRef.current.add(payload.data._id);
    return [payload.data, ...prev];
  });

  setSelectedConversation(payload.data);
  setSelectedConversationId(payload.data._id);
  return;
}

if (payload.type === "older-messages:ready") {
  const { conversationId } = payload;
  if (conversationId !== selectedConversationId) return;

  // 🔥 IMPORTANT: fetch more than UI page size
  fetchMessages(selectedConversationId, cursor, { limit: 25 });

  return;
}





  };

  socket.on("inbox:event", handler);
  return () => socket.off("inbox:event", handler);
}, [selectedConversationId]);



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

      // 🔥 FIX #3: Initial load gets first 10 conversations (newest first)
      const res = await axios.get(`${baseUrl}/conversations`, {
        withCredentials: true,
        params: { limit: 10 }
      });

      const data = res.data?.data || [];

      console.log('📥 Initial conversations loaded:', {
        count: data.length,
        nextCursor: res.data.nextCursor,
        hasMore: res.data.hasMore
      });

      // 🔥 FIX #3: Set initial state
      setConversations(data);
conversationIdSetRef.current = new Set(data.map(c => c._id));

      setConvCursor(res.data.nextCursor);
      setHasMoreConversations(res.data.hasMore);

      if (data.length === 0) {
        // DB empty → Meta hydration mode
        setHydratingFromMeta(true);

        await axios.post(
          `${baseUrl}/conversations/sync`,
          {},
          { withCredentials: true }
        );

        // Poll for conversations
        const retry = async () => {
          const r = await axios.get(`${baseUrl}/conversations`, {
            withCredentials: true,
          });

          const fresh = r.data?.data || [];
          if (fresh.length > 0) {
            setConversations(fresh);
conversationIdSetRef.current = new Set(fresh.map(c => c._id));

setConvCursor(r.data.nextCursor);
setHasMoreConversations(r.data.hasMore);

            setSelectedConversation(fresh[0]);
            setSelectedConversationId(fresh[0]._id);
            setHydratingFromMeta(false);
          } else {
            setTimeout(retry, 1500);
          }
        };

        retry();
        return;
      }

      // Normal path - select first conversation
      if (!selectedConversation && data.length > 0) {
        setSelectedConversation(data[0]);
        setSelectedConversationId(data[0]._id);
      }
    } catch (err) {
      console.error('❌ Load inbox failed:', err);
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
  async (conversationId, cursorParam = null, opts = {}) => {
    try {
      setLoadingMessages(true);
  if (cursorParam && messagesContainerRef.current) {
        prevScrollHeightRef.current = messagesContainerRef.current.scrollHeight;
        console.log('📏 Captured scroll height:', prevScrollHeightRef.current);
      }

      const res = await axios.get(
        `${baseUrl}/conversations/${conversationId}/messages`,
        {
          withCredentials: true,
          params: cursorParam
            ? { cursor: JSON.stringify(cursorParam), limit: 25 }
            : { limit: 25 },
        }
      );

      const payload = res.data?.data;
      if (!payload) return;

      /* =====================================================
         🚨 ADD THE SYNC-OLDER LOGIC RIGHT HERE
         ===================================================== */

      if (
        !payload.hasMore &&
        payload.dbExhausted &&
        cursorParam &&
        !syncingOlderRef.current
      ) {
        syncingOlderRef.current = true;

        try {
          console.log("🔄 DB exhausted → syncing older messages");

          await axios.post(
            `${baseUrl}/conversations/${conversationId}/sync-older`,
            {},
            { withCredentials: true }
          );

          // 🔁 re-fetch AFTER sync (same cursor)
          await fetchMessages(conversationId, cursorParam);
          return; // 🚨 stop this execution
        } finally {
          syncingOlderRef.current = false;
        }
      }

      /* =====================================================
         NORMAL FLOW CONTINUES BELOW
         ===================================================== */

      const newMessages = payload.messages.filter(msg => {
        const msgId =
          typeof msg._id === "object"
            ? msg._id.toString()
            : String(msg._id);

        if (messageIdSetRef.current.has(msgId)) return false;

        messageIdSetRef.current.add(msgId);
        return true;
      });

    // ✅ Prepend when paginating, replace on initial load
      setRawMessages(prev =>
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
  setNotesText(selectedConversation.notes?.text || "");
  setInitialNotesText(selectedConversation.notes?.text || ""); // 🔑 baseline
  setNotesOpen(false);
  setNotesHasPosition(false);
  fetchMessages(selectedConversation._id);
}, [selectedConversation?._id, fetchMessages]);

  /* ---------- SCROLL MANAGEMENT ---------- */
useLayoutEffect(() => {
  const container = messagesContainerRef.current;
  if (!container) return;

  if (!prevScrollHeightRef.current) {
    // ✅ New conversation - scroll to bottom
    container.scrollTop = container.scrollHeight;
  } else {
    // ✅ FIX: Maintain scroll position when prepending messages
    const newScrollHeight = container.scrollHeight;
    const heightDiff = newScrollHeight - prevScrollHeightRef.current;
    const currentScroll = container.scrollTop;
    
    // Add the height difference to current scroll position
    container.scrollTop = currentScroll + heightDiff;
    
    console.log('📍 Scroll restored:', {
      oldHeight: prevScrollHeightRef.current,
      newHeight: newScrollHeight,
      heightDiff,
      oldScroll: currentScroll,
      newScroll: container.scrollTop
    });
    
    prevScrollHeightRef.current = null;
  }
}, [messages]);

useLayoutEffect(() => {
  // 🔥 FIX #2: Restore scroll position after new conversations load
  if (
    !loadingOlderConversations &&
    prevConvScrollHeightRef.current &&
    convListRef.current
  ) {
    const diff =
      convListRef.current.scrollHeight - prevConvScrollHeightRef.current;

    console.log('🔧 Restoring scroll position, diff:', diff);
    
    convListRef.current.scrollTop += diff;
    prevConvScrollHeightRef.current = null;
  }
}, [conversations, loadingOlderConversations]);


const handleScroll = (e) => {
  const el = e.target;

  // Only when user reaches top
  if (el.scrollTop !== 0) return;

  // Prevent parallel fetches
  if (loadingMessages || syncingOlderRef.current) return;

  /**
   * 1️⃣ DB HAS MORE → paginate DB
   */
  if (hasMore) {
    fetchMessages(selectedConversationId, cursor);
    return;
  }

  /**
   * 2️⃣ DB EXHAUSTED → hydrate from Meta
   */
  console.log("🌐 DB exhausted → fetching older messages from Instagram");

  syncingOlderRef.current = true;
  setLoadingMessages(true);

  axios
    .post(
      `${baseUrl}/conversations/${selectedConversationId}/sync-older`,
      {},
      { withCredentials: true }
    )
    .finally(() => {
      // release lock after cooldown
      setTimeout(() => {
        syncingOlderRef.current = false;
        setLoadingMessages(false);
      }, 800);
    });
};







const saveNotes = async () => {
  if (!selectedConversation || !isNotesDirty) return;

  try {
    setSavingNotes(true);

    await axios.patch(
      `${baseUrl}/conversations/${selectedConversation._id}/notes`,
      { text: notesText },
      { withCredentials: true }
    );

    setInitialNotesText(notesText); // 🔑 reset dirty state
  } catch (e) {
    console.error("Failed to save notes", e);
  } finally {
    setSavingNotes(false);
  }
};



  /* ---------- SEND MESSAGE ---------- */
const sendMessage = async () => {
  if (sending || !selectedConversation) return;
  if (!messageText.trim() && !selectedFile) return;

  setSending(true);

  const textToSend = messageText.trim();
  const fileToSend = selectedFile;

  // clear UI immediately (optimistic UX)
  setMessageText("");
  handleRemoveFile();

  try {
    /** 1️⃣ SEND MEDIA FIRST **/
    if (fileToSend) {
      const formData = new FormData();
      formData.append("file", fileToSend);
      formData.append(
        "type",
        fileToSend.type.startsWith("video") ? "video" : "image"
      );

      await axios.post(
        `${baseUrl}/conversations/${selectedConversation._id}/messages`,
        formData,
        {
          withCredentials: true,
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
    }

    /** 2️⃣ SEND TEXT SECOND (SEPARATE MESSAGE) **/
    if (textToSend) {
      await axios.post(
        `${baseUrl}/conversations/${selectedConversation._id}/messages`,
        { text: textToSend, type: "text" },
        { withCredentials: true }
      );
    }

    // socket will handle UI updates
  } catch (err) {
    console.error("Send message failed", err);
    alert("Failed to send message");

    // restore text on failure
    setMessageText(textToSend);
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

  const WINDOW_MS = 24 * 60 * 60 * 1000;

function computeCanReply(lastParticipantMessageAt) {
  if (!lastParticipantMessageAt) return false;
  return Date.now() - new Date(lastParticipantMessageAt).getTime() <= WINDOW_MS;
}


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


const handleLabelChange = async (label) => {
  if (!selectedConversation) return;

  const convId = selectedConversation._id;

  // 🔥 Optimistic UI
  setConversations((prev) =>
    prev.map((c) =>
      c._id === convId
        ? { ...c, label, labelSource: "manual" }
        : c
    )
  );

  setSelectedConversation((prev) =>
    prev
      ? { ...prev, label, labelSource: "manual" }
      : prev
  );

  setLabelAnchor(null);
  setMenuAnchor(null);

  try {
    await axios.patch(
      `${baseUrl}/conversations/${convId}/label`,
      { label },
      { withCredentials: true }
    );
  } catch (err) {
    console.error("Failed to save label", err);
    alert("Failed to save label. Please retry.");
  }
};



const displayName =
  selectedConversation?.participant?.name ||
  selectedConversation?.participant?.username ||
  "Instagram User";

  const showUsername = selectedConversation?.participant?.username || "Instagram User";
const canReply = selectedConversation?.canReply === true;

const waitingMessage = `Waiting for reply from @${showUsername}`;


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
  {["All", ...LABELS].map((label) => {
    const isActive = activeLabel === label;
    const count = label !== "All" ? labelCounts[label] || 0 : null;

    return (
    <Chip
  key={label}
  clickable
  size="small"
  onClick={() => setActiveLabel(label)}
  sx={{
    bgcolor: isActive ? "#4D2B8C" : "#F1F3F4",
    color: isActive ? "#fff" : "#374151",
    fontFamily: 'Inter',
    "&:hover": {
      bgcolor: isActive ? "#3E2271" : "#E5E7EB",
    },
  }}
  label={
    <Box display="flex" alignItems="center" gap={0.75}>
      <span>{label}</span>

      {label !== "All" && count > 0 && (
        <Badge
          badgeContent={count}
          overlap="circular"
          sx={{
            "& .MuiBadge-badge": {
              position: "static", // 🔑 prevents overlap chaos
              transform: "none",
              bgcolor: isActive ? "#FFFFFF" : "#4D2B8C",
              color: isActive ? "#4D2B8C" : "#FFFFFF",
              fontSize: "0.65rem",
              fontFamily: 'Inter',
              fontWeight: 700,
              height: 18,
              minWidth: 18,
              px: 0.75,
              borderRadius: "999px",
              lineHeight: 1,
            },
          }}
        />
      )}
    </Box>
  }
/>
    );
  })}
</Box>

        {/* {isSyncing && (
  <Typography
    variant="caption"
    sx={{ ml: 1, color: "text.secondary" }}
  >
    Syncing…
  </Typography>
)} */}


        {/* Conversation List */}
<Box
        ref={convListRef}
        flex={1}
        sx={{ overflowY: "auto" }}
        onScroll={handleConvScroll}
      >
        {loading || hydratingFromMeta ? (
          <Box px={2}>
            {[...Array(6)].map((_, i) => (
              <Box key={i} display="flex" gap={2} py={2}>
                <Skeleton variant="circular" width={40} height={40} />
                <Box flex={1}>
                  <Skeleton width="60%" height={16} />
                  <Skeleton width="80%" height={14} />
                </Box>
              </Box>
            ))}
          </Box>
        ) : (
          <>
            {filteredConversations.map((conv) => {
              const uname = conv.participant?.name || conv.participant?.username || "Instagram User";
              const isSelected = selectedConversation?._id === conv._id;
              const previewDate = conv.lastActivityAt || conv.lastMessage?.timestamp || null;

              return (
                <Box
                  key={conv._id}
                  px={2}
                  py={2}
                  borderBottom="1px solid #f1f1f1"
                 onClick={async () => {
  const isSameConversation = selectedConversationId === conv._id;

  // 1️⃣ SELECT IMMEDIATELY (never block UI)
  setSelectedConversation(conv);
  setSelectedConversationId(conv._id);

  // If switching conversations, messages reset will happen
  // automatically via your useEffect on selectedConversation

  try {
    setSyncingConvId(conv._id);

    // 2️⃣ Sync latest messages from Meta (blocking)
    await axios.post(
      `${baseUrl}/conversations/${conv._id}/sync-latest`,
      {},
      { withCredentials: true }
    );

    // 3️⃣ Fetch UPDATED conversation snapshot
    const refreshed = await axios.get(
      `${baseUrl}/conversations`,
      {
        withCredentials: true,
        params: { limit: 1 },
      }
    );

    const updatedConv = refreshed.data?.data?.find(
      c => c._id === conv._id
    );

    if (updatedConv) {
      // 4️⃣ Update sidebar (single source of truth)
      setConversations(prev =>
        prev.map(c =>
          c._id === conv._id
            ? { ...updatedConv, unreadCount: 0 }
            : c
        )
      );

      // 5️⃣ Update active conversation snapshot
      setSelectedConversation(updatedConv);
      setSelectedConversationId(updatedConv._id);
    }

    // 6️⃣ If same conversation, force message refresh
    if (isSameConversation) {
      setRawMessages([]);
      messageIdSetRef.current.clear();
      setCursor(null);
      setHasMore(true);
      await fetchMessages(conv._id);
    }

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
                        <Typography fontWeight={600} fontSize="0.95rem">
                          {uname}
                        </Typography>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          noWrap
                          sx={{ maxWidth: "180px", fontSize: "0.85rem" }}
                        >
                          {getLastMessagePreview(conv.lastMessage)}
                        </Typography>
                      </Box>
                    </Box>
                    <Box display="flex" flexDirection="column" alignItems="flex-end">
                      <Typography variant="caption" color="text.secondary" fontSize="0.7rem">
                        {previewDate && formatPreviewTime(previewDate)}
                      </Typography>
                      {conv.unreadCount > 0 && (
                        <Badge
                          color="primary"
                          badgeContent={conv.unreadCount}
                          sx={{ mt: 1, mr: 1 }}
                        />
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
            })}

            {/* 🔥 Show skeleton loaders for BOTH DB pagination AND Meta sync */}
            {(loadingOlderConversations || loadingMetaConversations) && (
              <Box px={2}>
                {[...Array(3)].map((_, i) => (
                  <Box key={`skeleton-${i}`} display="flex" gap={2} py={2}>
                    <Skeleton variant="circular" width={40} height={40} />
                    <Box flex={1}>
                      <Skeleton width="60%" height={16} />
                      <Skeleton width="80%" height={14} />
                    </Box>
                  </Box>
                ))}
              </Box>
            )}

            {/* 🔥 Only show "All loaded" when NOT loading and truly no more */}
           {/* {!hasMoreConversations &&
 !loadingOlderConversations &&
 !loadingMetaConversations &&
 !appendedInLastFetchRef.current &&
 conversations.length > 0 && (
   <Box py={2} textAlign="center">
     <Typography variant="caption" color="text.secondary">
       All conversations loaded
     </Typography>
   </Box>
 )} */}



          </>

          )}

        
        </Box>
      </Box>

      {/* ================= RIGHT CHAT ================= */}
      <Box flex={1} display="flex" flexDirection="column" bgcolor="#f0f2f5">
     
     {hydratingFromMeta ? (
  <Box flex={1} p={3}>
    {[...Array(5)].map((_, i) => (
      <Skeleton
        key={i}
        variant="rounded"
        height={48}
        width={`${60 + i * 5}%`}
        sx={{ mb: 2 }}
      />
    ))}
  </Box>
) :
        selectedConversation ? (
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
<Box display="flex" alignItems="center" gap={2}>
  {selectedConversation?.notes?.text && (
    <Typography
      sx={{
        fontSize: "0.8rem",
        color: "#6B7280",
        maxWidth: 280,
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
        cursor: "pointer",
      }}
     onClick={(e) => {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  // Prefer opening slightly left of click
  let x = e.clientX - NOTES_WIDTH + 24;
  let y = e.clientY + 12;

  // Clamp horizontally
  if (x + NOTES_WIDTH + NOTES_MARGIN > viewportWidth) {
    x = viewportWidth - NOTES_WIDTH - NOTES_MARGIN;
  }

  if (x < NOTES_MARGIN) {
    x = NOTES_MARGIN;
  }

  // Optional: clamp vertically (nice polish)
  if (y + 220 > viewportHeight) {
    y = viewportHeight - 220;
  }

  setNotesAnchor({ x, y });
  setNotesOpen(true);
}}

    >
      {getNotesSnippet(selectedConversation.notes.text)}
    </Typography>
  )}

  <Typography
    sx={{
      fontSize: "0.85rem",
      cursor: "pointer",
      color: "#4D2B8C",
      fontWeight: 500,
    }}
  onClick={() => {
  openNotesCentered();
}}

  >
    📝 {selectedConversation?.notes?.text ? "Edit notes" : "Notes"}
  </Typography>
</Box>


                <IconButton onClick={(e) => setMenuAnchor(e.currentTarget)}>
                  <MoreVert />
                </IconButton>
              </Box>
            </Box>

{notesOpen && (
  <Box
  ref={notesRef}
    sx={{
      position: "fixed",
     top: notesAnchor?.y ?? 120,
    left: notesAnchor?.x ?? 800,
      width: NOTES_WIDTH,
      bgcolor: "#FFFFFF",
      borderRadius: 2,
      boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
      zIndex: 1300,
      cursor: "move",
    }}

  >

<Box
  px={2}
  py={1}
  display="flex"
  alignItems="flex-start"
  justifyContent="space-between"
  sx={{ cursor: "move", userSelect: "none", background: '#FFE4EF' }}
  onMouseDown={handleDrag}
>
  <Box>
    <Typography fontWeight={600} fontSize="0.85rem">
      🧠 Private notes
    </Typography>
    <Typography variant="caption" color="text.secondary">
      Only visible to you
    </Typography>
  </Box>

  {/* CLOSE */}
  <IconButton
    size="small"
    onClick={(e) => {
      e.stopPropagation(); // ⛔ don't trigger drag
      setNotesOpen(false);
    }}
    sx={{
      color: "#9CA3AF",
      "&:hover": {
        color: "#374151",
        bgcolor: "#F3F4F6",
      },
    }}
  >
    <CloseIcon fontSize="small" />
  </IconButton>
</Box>


<Box position="relative" sx={{ background: '#E8F9FF'}}>
  <TextField
    fullWidth
    multiline
    minRows={6}
    placeholder="Add a private note about this conversation or user."
    value={notesText}
    onChange={(e) => setNotesText(e.target.value)}
    sx={{
      "& .MuiInputBase-root": {
        paddingBottom: "48px", // 👈 space for the button
      },
    }}
  />

  {/* Save button */}
  {isNotesDirty && (
    <Box
      position="absolute"
      bottom={12}
      right={12}
    >
      <Button
        size="small"
        onClick={saveNotes}
        disabled={savingNotes}
        sx={{
          textTransform: "none",
          fontFamily: "Inter",
          bgcolor: "#4D2B8C",
          color: "#fff",
          fontSize: "0.7rem",
          px: 1.5,
          "&:hover": { bgcolor: "#3E2271" },
        }}
      >
        {savingNotes ? (
          <CircularProgress size={14} sx={{ color: "#fff" }} />
        ) : (
          "Save notes"
        )}
      </Button>
    </Box>
  )}
</Box>



  </Box>
)}

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
{loadingMessages && (
  <Box
    display="flex"
    justifyContent="center"
    alignItems="center"
    gap={1}
    py={1}
  >
    <CircularProgress size={18} />
    <Typography variant="caption" color="text.secondary">
      Loading more messages…
    </Typography>
  </Box>
)}



              {messages.map((msg, index) => {
                const isMe = msg.sender === "me"; // ISSUE 1: Ensure backend returns 'me' correctly
                
                // Grouping Logic
                const prevMsg = messages[index - 1];
                const showAvatar = !isMe && (!prevMsg || prevMsg.sender !== msg.sender);
                const showTimestamp = !prevMsg || (new Date(msg.createdAtPlatform) - new Date(prevMsg.createdAtPlatform) > 300000); // 5 mins
                const isMediaOnly = (msg.type === "image" || msg.type === "video") && !msg.text;

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
      <Avatar 
        src={selectedConversation?.participant?.profilePic || undefined}
        sx={{ width: 32, height: 32, bgcolor: "primary.main", fontSize: "0.8rem" }}
      >
        {!selectedConversation?.participant?.profilePic && displayName[0]?.toUpperCase()}
      </Avatar>
    )}
  </Box>
)}

                      {/* Message Bubble */}
                      <Box
                        maxWidth="60%"
                        sx={{
                          bgcolor: isMediaOnly ? "transparent" : isMe ? "#2563EB" : "#fff",
                          color: isMe ? "#fff" : "#1e293b",
                         borderRadius: isMediaOnly ? 0 : isMe ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                         boxShadow: isMediaOnly ? "none" : "0 1px 2px rgba(0,0,0,0.1)",
                        p: isMediaOnly ? 0 : 1.5,
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
                        sx={CHAT_MEDIA_STYLE}
                        onClick={() =>
                          setMediaPreview({ type: "image", url: msg.mediaUrl })
                        }
                      />
                    )}


                     {msg.type === "video" && msg.mediaUrl && (
                    <video
                      src={msg.mediaUrl}
                      controls
                      style={{
                        ...CHAT_MEDIA_STYLE,
                        maxHeight: "300px",
                        cursor: "default",
                      }}
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
                  placeholder={canReply ? "Type a message..." : waitingMessage}
                  value={canReply ? messageText : ""}
                  disabled={!canReply || sending}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyPress={handleKeyPress}
                  inputRef={inputRef}
                  sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: "20px",
                        bgcolor: canReply ? "#f8fafc" : "#f1f5f9",
                        color: canReply ? "inherit" : "#64748b",
                        fontStyle: canReply ? "normal" : "italic",
                        cursor: canReply ? "text" : "not-allowed",
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

               <Tooltip
                  title={!canReply ? waitingMessage : ""}
                  disableHoverListener={canReply}
                >
                  <span>
                    <IconButton
                      onClick={sendMessage}
                      disabled={!canReply || sending}
                      sx={{
                        bgcolor: canReply ? "primary.main" : "#cbd5e1",
                        color: "#fff",
                        width: 44,
                        height: 44,
                      }}
                    >
                      {sending ? <CircularProgress size={20} /> : <Send />}
                    </IconButton>
                  </span>
                </Tooltip>

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



{/* img/video on click full view  */}
      <Dialog
  open={mediaPreview?.type === "image"}
  onClose={() => setMediaPreview(null)}
  maxWidth="lg"
  fullWidth
>

  <DialogContent
    sx={{
      position: "relative",
      bgcolor: "#000",
      p: 0,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    {/* Close */}
    <IconButton
      onClick={() => setMediaPreview(null)}
      sx={{
        position: "absolute",
        top: 16,
        right: 16,
        color: "#fff",
        zIndex: 2,
      }}
    >
      <CloseIcon />
    </IconButton>

    {/* Download */}
    {mediaPreview?.url && (
   <IconButton
  onClick={() => window.open(mediaPreview.url, "_blank", "noopener,noreferrer")}
  sx={{
    position: "absolute",
    top: 16,
    right: 64,
    color: "#fff",
    zIndex: 2,
  }}
>
  ⬇️
</IconButton>

    )}

    {/* Media */}
    {mediaPreview?.type === "image" && (
      <img
        src={mediaPreview.url}
        alt="preview"
        style={{
          maxWidth: "100%",
          maxHeight: "90vh",
          objectFit: "contain",
        }}
      />
    )}

    {mediaPreview?.type === "video" && (
      <video
        src={mediaPreview.url}
        controls
        autoPlay
        style={{
          maxWidth: "100%",
          maxHeight: "90vh",
        }}
      />
    )}
  </DialogContent>
</Dialog>

    </Box>
  );
}
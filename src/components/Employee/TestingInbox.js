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

/* ---------- CONSTANTS ---------- */
const LABELS = ["Personal", "Lead", "General"];

const LABEL_STYLES = {
  Personal: { bg: "#E6F4EA", text: "#137333" },
  Lead: { bg: "#E8F0FE", text: "#1A56DB" },
  General: { bg: "#F1F3F4", text: "#4B5563" },
};

const getLastMessagePreview = (lastMessage) => {
  if (!lastMessage) return "No messages yet";
  if (lastMessage.type === "system") return "Shared a reel";
  if (lastMessage.type === "image") return "📷 Image";
  if (lastMessage.type === "video") return "🎥 Video";
  return lastMessage.text || "No messages yet";
};

export default function InboxManagement() {
  // Use environment variable or valid base URL
  const baseUrl = "/api/usersOn"; 

  /* ---------- STATE ---------- */
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);

  const [rawMessages, setRawMessages] = useState([]); // Store raw API data
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [activeLabel, setActiveLabel] = useState("All");
  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);

  // Menus & Popups
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [labelAnchor, setLabelAnchor] = useState(null);
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [emojiAnchor, setEmojiAnchor] = useState(null);

  // Refs
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const prevScrollHeightRef = useRef(null); // For scroll restoration

  // File Upload State
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  /* ---------- DEDUPLICATION LOGIC (FIX #4) ---------- */
  // We use useMemo to filter rawMessages and ensure unique IDs
  const messages = useMemo(() => {
    const seen = new Set();
    return rawMessages.filter((msg) => {
      if (seen.has(msg._id)) return false;
      seen.add(msg._id);
      return true;
    }).sort((a, b) => new Date(a.createdAtPlatform) - new Date(b.createdAtPlatform));
  }, [rawMessages]);

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

  console.log('Before Mount');
  /* ---------- FETCH CONVERSATIONS ---------- */
  useEffect(() => {
  console.log('On Mount');

    const fetchConversations = async () => {
      try {
        setLoading(true);
        const res = await axios.get(baseUrl+ "/conversations/sync", { withCredentials: true });
        const data = res.data?.data || [];
        console.log('Data::: ', data);
        setConversations(data);
        if(!selectedConversation && data.length > 0) {
            setSelectedConversation(data[0]);
        }
      } catch (err) {
        console.error("Conversation sync failed", err);
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseUrl]);

  /* ---------- FETCH MESSAGES ---------- */
  const fetchMessages = useCallback(async (conversationId, cursorParam = null) => {
    try {
      setLoadingMessages(true);
      
      // Capture scroll height before fetching for "Scroll to Top" restoration
      if (cursorParam && messagesContainerRef.current) {
        prevScrollHeightRef.current = messagesContainerRef.current.scrollHeight;
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

      setRawMessages((prev) =>
        cursorParam ? [...payload.messages, ...prev] : payload.messages
      );

      setCursor(payload.nextCursor);
      setHasMore(payload.hasMore);
    } catch (err) {
      console.error("Message fetch failed", err);
    } finally {
      setLoadingMessages(false);
    }
  }, [baseUrl]);

  // Reset when conversation changes
  useEffect(() => {
    if (!selectedConversation?._id) return;
    setRawMessages([]);
    setCursor(null);
    setHasMore(true);
    setPreviewUrl(null);
    setSelectedFile(null);
    setMessageText("");
    fetchMessages(selectedConversation._id);
  }, [selectedConversation?._id, fetchMessages]);

  /* ---------- SCROLL LOGIC (FIX #6) ---------- */
  // Use useLayoutEffect to adjust scroll position *before* the browser paints
  useLayoutEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    // 1. If loading initial messages (no previous scroll capture), scroll to bottom
    if (!prevScrollHeightRef.current) {
        container.scrollTop = container.scrollHeight;
    } 
    // 2. If we loaded older messages, restore scroll position
    else {
        const newScrollHeight = container.scrollHeight;
        const diff = newScrollHeight - prevScrollHeightRef.current;
        container.scrollTop = diff;
        prevScrollHeightRef.current = null; // Reset
    }
  }, [messages]); // Trigger whenever sorted messages update

  const handleScroll = (e) => {
    const el = e.target;
    // Trigger fetch when scrolled to top
    if (el.scrollTop === 0 && hasMore && !loadingMessages && cursor) {
      fetchMessages(selectedConversation._id, cursor);
    }
  };

  /* ---------- SEND MESSAGE ---------- */
  const sendMessage = async () => {
    if (sending || !selectedConversation) return;
    if (!messageText.trim() && !selectedFile) return;

    setSending(true);

    try {
      // 🟦 MEDIA MESSAGE
      if (selectedFile) {
        const formData = new FormData();
        formData.append("file", selectedFile);
        formData.append(
          "type",
          selectedFile.type.startsWith("video") ? "video" : "image"
        );
        if (messageText.trim()) {
          formData.append("text", messageText.trim());
        }

        const res = await axios.post(
          `${baseUrl}/conversations/${selectedConversation._id}/messages`,
          formData,
          {
            withCredentials: true,
            headers: { "Content-Type": "multipart/form-data" },
          }
        );

        if (res.data.success) {
          // Add new message to state immediately
          setRawMessages((prev) => [...prev, res.data.data]);
        }

        handleRemoveFile(); // Clear file
        setMessageText(""); // Clear text
      } 
      // 🟩 TEXT MESSAGE
      else if (messageText.trim()) {
        const textToSend = messageText.trim();
        setMessageText(""); // Clear optimistic

        const res = await axios.post(
          `${baseUrl}/conversations/${selectedConversation._id}/messages`,
          { text: textToSend, type: "text" },
          { withCredentials: true }
        );

        if (res.data.success) {
          setRawMessages((prev) => [...prev, res.data.data]);
        }
      }
    } catch (err) {
      console.error("Send message failed", err);
      alert("Failed to send message");
    } finally {
      setSending(false);
      // Optional: Scroll to bottom after send
      setTimeout(() => {
        if(messagesContainerRef.current) {
            messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
      }, 100);
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
  const filteredConversations = conversations
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
              
              return (
                <Box
                  key={conv._id}
                  px={2}
                  py={2}
                  borderBottom="1px solid #f1f1f1"
                  onClick={() => setSelectedConversation(conv)}
                  sx={{
                    cursor: "pointer",
                    bgcolor: isSelected ? "#EEF4FF" : "#fff",
                    transition: "0.2s",
                    "&:hover": { bgcolor: isSelected ? "#EEF4FF" : "#f9fafb" },
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
                        {conv.lastMessage?.timestamp &&
                            new Date(conv.lastMessage.timestamp).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
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
                         {(msg.type === 'image' || msg.mediaUrl) && (
                             <Box 
                                component="img" 
                                src={msg.mediaUrl} 
                                alt="attachment"
                                sx={{ borderRadius: 2, maxWidth: '100%', display: 'block', mb: msg.text ? 1 : 0 }} 
                             />
                         )}

                         {/* Text Render */}
                         {msg.text ? (
                            <Typography variant="body2" fontSize="0.95rem" lineHeight={1.5}>
                                {msg.text}
                            </Typography>
                         ) : (
                             // Only show placeholder if NO media and NO text
                             (!msg.mediaUrl && msg.type !== 'image' && msg.type !== 'sticker' && msg.type !== 'system') && (
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
              <div ref={messagesEndRef} />
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
import React, { useState, useEffect } from "react";
import {
  Avatar,
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  TextField,
  Chip,
  Button,
  IconButton,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Alert,
  Tooltip,
  InputAdornment,
  Switch,
  Slide
} from "@mui/material";

import PauseCircleOutlineIcon from '@mui/icons-material/PauseCircleOutline'; // Add Icon
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline'; // Add Icon
import SaveIcon from '@mui/icons-material/Save'; // Add Icon
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import SendIcon from "@mui/icons-material/Send";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import PersonIcon from "@mui/icons-material/Person";
import DownloadIcon from "@mui/icons-material/Download";
import QuizIcon from "@mui/icons-material/Quiz";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import CloseIcon from "@mui/icons-material/Close";
import RocketLaunchIcon from "@mui/icons-material/RocketLaunch";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import AddIcon from "@mui/icons-material/Add";
import LinkIcon from "@mui/icons-material/Link";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import InstagramIcon from "@mui/icons-material/Instagram";
import { useParams, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import ZoomOutIcon from "@mui/icons-material/ZoomOut";
import CenterFocusStrongIcon from "@mui/icons-material/CenterFocusStrong";
import FitScreenIcon from "@mui/icons-material/FitScreen";
import { TransformWrapper, TransformComponent, useControls } from "react-zoom-pan-pinch";
import axios from "axios";
import RotateLeftOutlinedIcon from '@mui/icons-material/RotateLeftOutlined';
import LinearProgress from '@mui/material/LinearProgress';
import RocketLaunchOutlinedIcon from '@mui/icons-material/RocketLaunchOutlined';
import PublicIcon from '@mui/icons-material/Public';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';


// --- FINAL UPDATED PHONE SIMULATOR ---
const PhoneSimulator = ({ 
  dmMessage, 
  buttonText, 
  flowNodes, 
  theme 
}) => {
  const [isFollowing, setIsFollowing] = useState(false);
  const [history, setHistory] = useState([]);
  // We no longer need currentStep to hide/show the main button, as it's now part of the history
  const [showRestart, setShowRestart] = useState(false);

  // Simulation States
  const [browserUrl, setBrowserUrl] = useState(null); 
  const [downloadState, setDownloadState] = useState(null); 
  const [igName, setIgName] = useState(''); 
  const [igProfilePic, setIgProfilePic] = useState(''); 

  // Container Ref for Slide Animation
  const [containerNode, setContainerNode] = useState(null);
  const baseUrl = "/api/usersOn";
  const api = axios.create({ baseURL: baseUrl || "", withCredentials: true });
  

    async function fetchIgDetails() {
    // setLoadingSocials(true);
    try {
      const res = await api.get("/user/insta-details");
      setIgName(res.data.igName || []);
      setIgProfilePic(res.data.igProfilePic || []);
    } catch (err) {
      console.error("fetIgDetails", err);
    } finally {
    }
  }

  useEffect(() => {
    resetSimulation();
    fetchIgDetails();
  }, [dmMessage, buttonText]);

  const resetSimulation = () => {
    // CHANGE 1: Initialize history WITH the button inside the message object
    setHistory([{ 
      type: 'system', 
      text: dmMessage,
      buttons: [{ 
        id: 'init-btn', 
        text: buttonText, 
        specialAction: 'start_flow' // Special marker to trigger the main flow
      }]
    }]);
    setShowRestart(false);
    setBrowserUrl(null);
    setDownloadState(null);
  };

  // --- 1. SHARED ACTION EXECUTOR ---
  const executeAction = (action) => {
    const newMessages = [];

    // REDIRECT
    if (action.type === 'redirectLink') {
      newMessages.push({ type: 'system', text: `🔗 Opening Link...` });
      setTimeout(() => {
          let url = action.config.redirectUrl || "";
          if (!url.startsWith('http')) url = `https://${url}`;
          setBrowserUrl(url);
      }, 1000);
    } 
    // DOWNLOAD (CHANGE 2: Show Button instead of auto-download)
    else if (action.type === 'downloadFile') {
      const fileName = action.config.downloadFile?.name || 'file.pdf';
      newMessages.push({ 
        type: 'system', 
        text: "Click below to download:", // Requested text
        buttons: [{
          id: `dl-${Date.now()}`,
          text: "Download Now",
          specialAction: 'manual_download',
          fileName: fileName
        }]
      });
    }
    // FOLLOW CHECK
    else if (action.type === 'followCheck') {
      if (isFollowing) {
         // ALREADY FOLLOWING: Show Success Branch
         newMessages.push({ 
           type: 'system', 
           text: action.config.followCheckYesMessage || "Thanks for following!",
           buttons: action.followingButtons 
         });
      } else {
         // NOT FOLLOWING
         const verifyButtons = action.notFollowingButtons.map(btn => ({
             ...btn,
             specialAction: 'verify_follow', 
             failureMessage: action.config.followCheckNoMessage, 
             successData: { 
                 message: action.config.followCheckYesMessage,
                 buttons: action.followingButtons 
             }
         }));

         newMessages.push({ 
           type: 'system', 
           text: action.config.followCheckNoMessage || "Please follow to continue.",
           buttons: verifyButtons 
         });
      }
    }
    // QUICK REPLY
    else if (action.type === 'quickReply') {
      newMessages.push({ 
          type: 'system', 
          text: action.config.quickReplyQuestion,
          buttons: action.replyOptions 
      });
    }
    // ASK FOLLOW
    else if (action.type === 'askToFollow') {
      newMessages.push({ type: 'system', text: `👤 Please follow @${action.config.instagramPage}` });
    }

    return newMessages;
  };

  // --- 2. HANDLE ROOT FLOW ---
  // Modified to accept the text of the button clicked
  const handleMainButtonClick = (clickedBtnText) => {
    setHistory(prev => [...prev, { type: 'user', text: clickedBtnText }]);
    
    let upcomingMessages = [];
    if (flowNodes.length === 0) {
        upcomingMessages.push({ type: 'system', text: "✅ End of automation" });
    } else {
        flowNodes.forEach(node => {
            const result = executeAction(node);
            upcomingMessages = [...upcomingMessages, ...result];
        });
    }

    setTimeout(() => {
        setHistory(prev => [...prev, ...upcomingMessages]);
        setShowRestart(true);
    }, 500);
  };

  // --- 3. HANDLE NESTED BUTTON CLICKS ---
  const handleSimulatedOptionClick = (btnData) => {
    
    // CHECK: Is this the Start Button?
    if (btnData.specialAction === 'start_flow') {
      handleMainButtonClick(btnData.text);
      return;
    }

    // CHECK: Is this the Download Button?
    if (btnData.specialAction === 'manual_download') {
      // Show user clicked "Download Now"
      setHistory(prev => [...prev, { type: 'user', text: btnData.text }]);
      setTimeout(() => simulateDownload(btnData.fileName), 500);
      return;
    }

    // 1. Add User Click to History
    setHistory(prev => [...prev, { type: 'user', text: btnData.text }]);

    // 2. CHECK: Is this a Verification Button?
    if (btnData.specialAction === 'verify_follow') {
        setTimeout(() => {
            if (!isFollowing) {
                // CASE A: User clicked "Following" but Toggle is OFF -> LOOP
                setHistory(prev => [...prev, { 
                    type: 'system', 
                    text: btnData.failureMessage || "❌ Check failed. Please follow to continue.",
                    buttons: [btnData] // Show the same verification button again
                }]);
            } else {
                // CASE B: User clicked "Following" and Toggle is ON -> SUCCESS
                setHistory(prev => [...prev, { 
                    type: 'system', 
                    text: btnData.successData.message || "Thanks for following!",
                    buttons: btnData.successData.buttons
                }]);
            }
        }, 600);
        return; // Stop standard processing
    }

    // 3. Standard Action Processing
    if (btnData.actions && btnData.actions.length > 0) {
        let upcomingMessages = [];
        btnData.actions.forEach(action => {
            const result = executeAction(action);
            upcomingMessages = [...upcomingMessages, ...result];
        });

        setTimeout(() => {
            setHistory(prev => [...prev, ...upcomingMessages]);
        }, 600);
    } 
    else {
        setTimeout(() => {
            // setHistory(prev => [...prev, { type: 'system', text: "✅ Done" }]);
        }, 600);
    }
  };

  const simulateDownload = (fileName) => {
      setDownloadState({ name: fileName, progress: 0, complete: false });
      let progress = 0;
      const interval = setInterval(() => {
          progress += 10;
          if (progress >= 100) {
              clearInterval(interval);
              setDownloadState({ name: fileName, progress: 100, complete: true });
              setTimeout(() => setDownloadState(null), 3000);
          } else {
              setDownloadState({ name: fileName, progress: progress, complete: false });
          }
      }, 100);
  };

  return (
    <Box
      ref={setContainerNode}
      sx={{
        position: "absolute",
        right: 40,
        top: "45vh",
        transform: "translateY(-50%)",
        width: '40vh',
        height: '80vh',
        bgcolor: "#57595B",
        borderRadius: "40px",
        boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
        border: "6px solid #57595B",
        zIndex: 1100,
        overflow: "hidden", 
        display: { xs: "none", lg: "flex" },
        flexDirection: "column",
        position: "absolute" 
      }}
    >
      {/* iPhone Notch */}
      <Box sx={{ height: 30, bgcolor: "#fff", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1200 }}>
        <Box sx={{ width: 80, height: 18, bgcolor: "#000", borderRadius: "10px 10px 10px 10px" }} />
      </Box>

      {/* Header */}
      <Box sx={{ bgcolor: "#fff", p: 1.5, borderBottom: "1px solid #eee", display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
             <Avatar
        alt="Profile Pic"
        src={igProfilePic || 'M'}
        sx={{ width: 30, height: 30 }}
      />
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{igName || 'MyHandle.in' }</Typography>
        </Stack>
        {/* Toggle Check Logic Visual */}
        {flowNodes.some(n => n.type === 'followCheck') && (
            <Stack direction="row" alignItems="center" spacing={0.5} sx={{ bgcolor: '#F3F4F6', px: 1, py:0.5, borderRadius: 2 }}>
                <Typography variant="caption" sx={{ fontSize: 10, fontWeight: 600, color: isFollowing ? '#10B981' : '#6B7280' }}>
                    {isFollowing ? "Following" : "Not Following"}
                </Typography>
                <Switch size="small" checked={isFollowing} onChange={(e) => setIsFollowing(e.target.checked)} sx={{ transform: "scale(0.7)" }} />
            </Stack>
        )}
      </Box>

      {/* Chat Area */}
      <Box sx={{ flex: 1, bgcolor: "#fff", p: 2, overflowY: "auto", display: "flex", flexDirection: "column", gap: 1.5 }}>
        {history.map((msg, index) => (
          <Box key={index} sx={{ alignSelf: msg.type === 'user' ? "flex-end" : "flex-start", maxWidth: "85%" }}>
            
            {/* CHANGE 3: Combined Box logic. If System, render buttons INSIDE. */}
            <Box sx={{ 
                p: 1.5, 
                bgcolor: msg.type === 'user' ? "#3B82F6" : "#F5F5F5", // Lighter gray for system messages
                color: msg.type === 'user' ? "#fff" : "#000", 
                borderRadius: msg.type === 'user' ? "18px 18px 0 18px" : "18px 18px 18px 0", 
                fontSize: "14px", 
                lineHeight: 1.4, 
                mb: 0.5 
            }}>
              {/* Message Text */}
              <Box sx={{ mb: (msg.buttons && msg.buttons.length > 0) ? 1.5 : 0 }}>
                {msg.text}
              </Box>
           
              {/* Render Buttons INSIDE the bubble if they exist */}
              {msg.buttons && (
                <Stack spacing={1}>
                    {msg.buttons.map(btn => (
                        <Button 
                            key={btn.id || btn.text}
                            fullWidth 
                            variant="contained" // Solid button
                            size="small"
                            onClick={() => handleSimulatedOptionClick(btn)}
                            sx={{ 
                                textTransform: 'none', 
                                borderRadius: 2, 
                                bgcolor: 'white', // White button inside gray bubble
                                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                                color: '#000',
                                fontWeight: 600,
                                border: '1px solid transparent',
                                '&:hover': { bgcolor: '#f9f9f9', borderColor: '#ddd', boxShadow: 'none' }
                            }}
                        >
                            {btn.text}
                        </Button>
                    ))}
                </Stack>
              )}
            </Box>

          </Box>
        ))}
      </Box>

      {/* Footer */}
      <Box sx={{ p: 2, borderTop: "1px solid #eee", bgcolor: "#fff" }}>
         {showRestart ? (
             <Button sx={{ fontFamily : 'Inter', fontSize : '14px', textTransform : 'none'}}fullWidth variant="text" size="medium" onClick={resetSimulation} startIcon={<RotateLeftOutlinedIcon />}>Restart Preview</Button>
         ) : (
            <Box sx={{ width: "100%", height: 36, borderRadius: 18, border: "1px solid #ddd", display: 'flex', alignItems: 'center', px: 2 }}>
                <Typography variant="caption" color="#aaa">Message...</Typography>
            </Box>
         )}
      </Box>
      <Box sx={{ height: 20, bgcolor: "#fff", display: "flex", justifyContent: "center", pt: 1 }}><Box sx={{ width: 100, height: 4, bgcolor: "#000", borderRadius: 2 }} /></Box>

      {/* --- OVERLAYS --- */}
      <Slide direction="up" in={Boolean(browserUrl)} container={containerNode}>
        <Box sx={{ position: 'absolute', top: 30, bottom: 0, left: 0, right: 0, bgcolor: 'white', zIndex: 1300, display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ p: 1, bgcolor: '#f0f0f0', borderBottom: '1px solid #ddd', display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="caption" sx={{ flex: 1, bgcolor: '#fff', px: 1, py: 0.5, borderRadius: 1, textAlign: 'center', fontSize: '10px', color: '#333', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}><PublicIcon sx={{ fontSize: 10, mr: 0.5, verticalAlign: 'middle' }} />{browserUrl}</Typography>
                <Typography variant="caption" onClick={() => setBrowserUrl(null)} sx={{ color: '#007AFF', fontWeight: 600, cursor: 'pointer' }}>Done</Typography>
            </Box>
            <Box sx={{ flex: 1, bgcolor: '#fff', position: 'relative' }}>
                <iframe src={browserUrl} title="Preview" style={{ width: '100%', height: '100%', border: 'none', position: 'relative', zIndex: 2 }} sandbox="allow-scripts allow-same-origin" />
                <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', zIndex: 1 }}><Typography variant="caption" color="text.secondary">Loading...<br/>(If blank, site blocks embeds)</Typography></Box>
            </Box>
        </Box>
      </Slide>

      <Slide direction="up" in={Boolean(downloadState)} container={containerNode}>
          <Box sx={{ position: 'absolute', bottom: 40, left: 16, right: 16, bgcolor: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(10px)', borderRadius: 3, p: 2, zIndex: 1400, color: 'white', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
              <Stack direction="row" spacing={2} alignItems="center">
                  <Box sx={{ width: 40, height: 40, bgcolor: downloadState?.complete ? '#10B981' : '#3B82F6', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {downloadState?.complete ? <CheckCircleOutlineIcon sx={{ color: 'white' }} /> : <FileDownloadIcon sx={{ color: 'white' }} />}
                  </Box>
                  <Box sx={{ flex: 1 }}>
                      <Typography variant="caption" sx={{ display: 'block', fontWeight: 600, mb: 0.5 }}>{downloadState?.complete ? 'Download Complete' : 'Downloading File...'}</Typography>
                      <Typography variant="caption" sx={{ display: 'block', color: '#aaa', fontSize: '10px', mb: 0.5 }}>{downloadState?.name}</Typography>
                      {!downloadState?.complete && (
                          <LinearProgress variant="determinate" value={downloadState?.progress || 0} sx={{ height: 4, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.2)', '& .MuiLinearProgress-bar': { bgcolor: '#3B82F6' } }} />
                      )}
                  </Box>
              </Stack>
          </Box>
      </Slide>
    </Box>
  );
};
// Zoom Controls Component
const ZoomControls = () => {
  const { zoomIn, zoomOut, resetTransform, centerView } = useControls();

  return (
    <Box
      sx={{
        position: "fixed",
        bottom: 24,
        right: 24,
        zIndex: 1001,
        display: "flex",
        flexDirection: "row",
        gap: 1,
        bgcolor: "white",
        borderRadius: 2,
        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        p: 1,
      }}
    >
      <Tooltip title="Zoom In" placement="left">
        <IconButton
          onClick={() => zoomIn()}
          size="small"
          sx={{
            bgcolor: "#F3F4F6",
            "&:hover": { bgcolor: "#E5E7EB" },
          }}
        >
          <ZoomInIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      <Tooltip title="Zoom Out" placement="left">
        <IconButton
          onClick={() => zoomOut()}
          size="small"
          sx={{
            bgcolor: "#F3F4F6",
            "&:hover": { bgcolor: "#E5E7EB" },
          }}
        >
          <ZoomOutIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      <Tooltip title="Reset Zoom" placement="left">
        <IconButton
          onClick={() => resetTransform()}
          size="small"
          sx={{
            bgcolor: "#F3F4F6",
            "&:hover": { bgcolor: "#E5E7EB" },
          }}
        >
          <CenterFocusStrongIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      <Tooltip title="Fit to Screen" placement="left">
        <IconButton
          onClick={() => {
            resetTransform();
            centerView(0.8);
          }}
          size="small"
          sx={{
            bgcolor: "#F3F4F6",
            "&:hover": { bgcolor: "#E5E7EB" },
          }}
        >
          <FitScreenIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </Box>
  );
};







export default function SetupAutoDmAutomation() {
  const { post_id } = useParams();
  const location = useLocation();
  const theme = useTheme();

  const { caption, thumbnail_url, id } = location.state || {};
  const [confDialogOpen, setConfDialogOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);


  const baseUrl = "/api/usersOn";

  // --- NEW STATES FOR EDIT/VIEW MODE ---
  const [existingAutomation, setExistingAutomation] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [isLoadingData, setIsLoadingData] = useState(true); 
  // -------------------------------------

  // State
  const [dmMessage, setDmMessage] = useState("Hey! Thanks for your interest 👋 Please click the below button to proceed.");
  const [buttonText, setButtonText] = useState("Send Link");
  const [flowNodes, setFlowNodes] = useState([]);
  const [keywords, setKeywords] = useState(['Link']);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedNodeType, setSelectedNodeType] = useState(null);
 
 const [inputValue, setInputValue] = useState("");

  const handleAddKeyword = () => {
    const newKeyword = inputValue.trim();
    if (newKeyword && !keywords.includes(newKeyword)) {
      setKeywords([...keywords, newKeyword]);
    }
    setInputValue("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddKeyword();
    }
  };

  const handleDeleteKeyword = (keywordToDelete) => {
    setKeywords(keywords.filter((kw) => kw !== keywordToDelete));
  };


  // Track context for nested action additions
  const [actionContext, setActionContext] = useState(null);

  // Node configuration states for dialog-based actions
  const [nodeConfig, setNodeConfig] = useState({
    redirectUrl: "",
    downloadFile: null,
    instagramPage: "thisis.ram",
  });



  useEffect(() => {
    const fetchAutomationConfig = async () => {
      try {
        setIsLoadingData(true);
        const response = await axios.get(`${baseUrl}/autodm/automation/config`, {
          withCredentials: true,
        });

        if (response.data?.exists) {
          const { data } = response.data;
          setExistingAutomation(true);
          setIsActive(data.status ==='active' ? true : false);
          
          // Populate fields from DB
          setKeywords(data.keywords || []);
          setDmMessage(data.dmMessage || "");
          setButtonText(data.buttonText || "Send Link");
          setFlowNodes(data.flowNodes || []);
        } else {
          setExistingAutomation(false);
        }
      } catch (error) {
        console.error("Error fetching automation config:", error);
        // Optional: toast.error("Could not load existing automation");
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchAutomationConfig();
  }, []);

  const handleUpdateAutomation = async () => {
    if (!dmMessage.trim()) {
      toast.error("Please enter a DM message");
      return;
    }

    try {
      const payload = {
        keywords,
        dmMessage,
        buttonText,
        flowNodes,
      };

      await axios.put(`${baseUrl}/autodm/automation/update`, payload, {
        withCredentials: true,
      });

      toast.success("Automation updated successfully!");
    } catch (error) {
      console.error("Error updating automation:", error);
      toast.error("Failed to update automation.");
    }
  };

  const handleToggleStatus = async () => {
    try {
      const newStatus = !isActive;
      
      await axios.patch(`${baseUrl}/autodm/automation/status`, { isActive: newStatus }, {
        withCredentials: true,
      });

      setIsActive(newStatus);
      toast.success(newStatus ? "Automation Resumed!" : "Automation Stopped.");
    } catch (error) {
      console.error("Error toggling status:", error);
      toast.error("Failed to change status.");
    }
  };

  

  // Action type configurations
  const actionTypes = [
    {
      type: "followCheck",
      title: "Follow Check",
      description: "Check whether user is following or not",
      icon: <PersonIcon />,
      color: "#10B981",
      bgColor: "#F0FDF4",
    },
    {
      type: "redirectLink",
      title: "Redirect to Link",
      description: "Redirect user to an external URL",
      icon: <LinkIcon />,
      color: "#8B5CF6",
      bgColor: "#F5F3FF",
    },
    {
      type: "downloadFile",
      title: "Download File",
      description: "Send a file for download (PDF or Image)",
      icon: <DownloadIcon />,
      color: "#3B82F6",
      bgColor: "#EFF6FF",
    },
   
    {
      type: "quickReply",
      title: "Quick Replies",
      description: "Ask question with quick reply options",
      icon: <QuizIcon />,
      color: "#F59E0B",
      bgColor: "#FFFBEB",
    },
  ];

  // Check if Follow Check is already used
  const isFollowCheckUsed = flowNodes.some((node) => node.type === "followCheck");

  const hasQuickReplyInMainFlow = flowNodes.some(
  (node) => node.type === "quickReply"
);
  // Always allow Quick Reply in nested contexts


const getAvailableActionTypes = () => {
    // Check if Follow Check is already used anywhere in the main flow.
    // This handles scenarios where a Follow Check node might have been added and later deleted,
    // although in your current logic, it mainly guards against accidental placement.
    const isFollowCheckUsed = flowNodes.some(node => node.type === 'followCheck');

    // ⚡️ Define the state: Is this the very first action selection?
    const isInitialSelection = !actionContext && flowNodes.length === 0;

    // --- Scenario 1: Initial Selection (Flow is empty) ---
    if (isInitialSelection) {
        // Show only Follow Check and Quick Replies for the very first step.
        return actionTypes.filter(type => 
            type.type === 'followCheck' || type.type === 'quickReply'
        );
    }

    // --- Scenario 2: Nested Selection (Inside a button or quick reply option) ---
    if (actionContext) {
        // Nested actions should only be non-structural elements (Links, Download, etc.).
        // Follow Check nodes are structural and should not be nested.
        return actionTypes.filter(type => 
            type.type !== 'followCheck'
        );
    }

    // --- Scenario 3: Subsequent Main Flow Selection (FlowNodes > 0, Context null) ---
    // User is adding an action *after* the initial node, at the main flow level.
    // We prevent adding Follow Check here, whether it was used or not.
    return actionTypes.filter(type => 
        type.type !== 'followCheck'
    );

    /* Note: The logic for Scenario 2 and 3 results in the same filter (excluding Follow Check), 
    meaning the use of the `isFollowCheckUsed` variable became redundant in this final design 
    because the logic simply blocks 'FollowCheck' after the very first step. 
    */
};

// ============================================================================
// BONUS: Also fix isFollowCheckUsedInContext to handle undefined cases
// ============================================================================

const isFollowCheckUsedInContext = (nodes, context) => {
  // Safety check: if context is falsy, return false
  if (!context) return false;

  // Safety check: if it's a button context, return false (buttons can't directly have followCheck)
  if (context.buttonId) return false;

  // Find the node in the current flow matching context.nodeId
  const node = nodes.find(n => n && n.id === context.nodeId);
  if (!node) return false;

  // If this node is a followCheck, return true
  if (node.type === 'followCheck') {
    return true;
  }

  // If node is a quickReply, check its replyOptions recursively for followCheck usage 
  if (node.type === 'quickReply' && context.optionId) {
    const option = node.replyOptions && node.replyOptions.find(opt => opt && opt.id === context.optionId);
    if (!option) return false;

    // Check actions in this option for followCheck type
    if (option.actions && option.actions.some(action => action && action.type === 'followCheck')) {
      return true;
    }
  }

  // Otherwise, no followCheck found in this context
  return false;
};


  // Reset node config when opening dialog
  const resetNodeConfig = () => {
    setNodeConfig({
      redirectUrl: "",
      downloadFile: null,
      instagramPage: "thisis.ram",
    });
  };

  // UPDATED: Handle action selection with full recursive support
  const handleActionSelect = (type) => {
    if (type === "followCheck") {
      const newNode = {
        id: Date.now(),
        type: "followCheck",
        config: {
          followCheckYesMessage: "Thanks for following! 🎉",
          followCheckNoMessage: "Please follow our page, and then click 'Following' button below to continue.",
        },
        followingButtons: [{ id: Date.now(), text: "Continue", actions: [] }],
        notFollowingButtons: [
          { id: Date.now() + 1, text: "Following", actions: [] },
        ],
      };
      setFlowNodes([...flowNodes, newNode]);
      setDialogOpen(false);
      setActionContext(null);
      resetNodeConfig();
      toast.success("Follow Check added!");
    } else if (type === "quickReply") {
      const newNode = {
        id: Date.now(),
        type: "quickReply",
        config: {
          quickReplyQuestion: "What would you like to do?",
        },
        replyOptions: [{ id: Date.now(), text: "Option 1", actions: [] }],
      };

      if (actionContext) {
        addQuickReplyToContext(newNode);
      } else {
        setFlowNodes([...flowNodes, newNode]);
      }

      setDialogOpen(false);
      setActionContext(null);
      resetNodeConfig();
      toast.success("Quick Replies added!");
    } else {
      resetNodeConfig();
      setSelectedNodeType(type);
    }
  };

  // HELPER: Add Quick Reply to any context (recursive support)
const addQuickReplyToContext = (newNode) => {
  const ctx = actionContext;

  if (ctx.type === "quickReply" && !ctx.parentOptionId) {
    // Main-flow Quick Reply → option
    const updatedNodes = flowNodes.map((node) =>
      node.id === ctx.nodeId && node.type === "quickReply"
        ? {
            ...node,
            replyOptions: node.replyOptions.map((opt) =>
              opt.id === ctx.optionId
                ? { ...opt, actions: [...(opt.actions || []), newNode] }
                : opt
            ),
          }
        : node
    );
    setFlowNodes(updatedNodes);
  } else if (ctx.type === "quickReply" && ctx.parentOptionId) {
    // Nested Quick Reply inside main-flow Quick Reply
    const updatedNodes = flowNodes.map((node) =>
      node.id === ctx.nodeId && node.type === "quickReply"
        ? {
            ...node,
            replyOptions: updateNestedQuickReply(
              node.replyOptions,
              ctx.parentOptionId,
              ctx.quickReplyActionId,
              ctx.optionId,
              newNode
            ),
          }
        : node
    );
    setFlowNodes(updatedNodes);
  } else if (ctx.type === "deepNestedQuickReply") {
    // NEW: Deep nested Quick Reply (3+ levels)
    const updatedNodes = flowNodes.map((node) => {
      if (node.id === ctx.nodeId && node.type === "quickReply") {
        return {
          ...node,
          replyOptions: node.replyOptions.map((parentOpt) =>
            parentOpt.id === ctx.parentOptionId
              ? {
                  ...parentOpt,
                  actions: parentOpt.actions.map((act) =>
                    act.id === ctx.parentQRActionId
                      ? {
                          ...act,
                          replyOptions: act.replyOptions.map((middleOpt) =>
                            middleOpt.id === ctx.middleOptionId
                              ? {
                                  ...middleOpt,
                                  actions: middleOpt.actions.map((a) =>
                                    a.id === ctx.nestedQRId
                                      ? {
                                          ...a,
                                          replyOptions: a.replyOptions.map((deepOpt) =>
                                            deepOpt.id === ctx.optionId
                                              ? { ...deepOpt, actions: [...(deepOpt.actions || []), newNode] }
                                              : deepOpt
                                          ),
                                        }
                                      : a
                                  ),
                                }
                              : middleOpt
                          ),
                        }
                      : act
                  ),
                }
              : parentOpt
          ),
        };
      }
      return node;
    });
    setFlowNodes(updatedNodes);
  } else if (ctx.type === "deepNestedButtonQuickReply") {
    // NEW: Deep nested Quick Reply inside Follow Check button
    const updatedNodes = flowNodes.map((node) => {
      if (node.id === ctx.nodeId && node.type === "followCheck") {
        const updateButtons = (buttons) =>
          buttons.map((btn) =>
            btn.id === ctx.buttonId
              ? {
                  ...btn,
                  actions: btn.actions.map((action) =>
                    action.id === ctx.quickReplyActionId
                      ? {
                          ...action,
                          replyOptions: action.replyOptions.map((parentOpt) =>
                            parentOpt.id === ctx.parentOptionId
                              ? {
                                  ...parentOpt,
                                  actions: parentOpt.actions.map((a) =>
                                    a.id === ctx.nestedQRId
                                      ? {
                                          ...a,
                                          replyOptions: a.replyOptions.map((deepOpt) =>
                                            deepOpt.id === ctx.optionId
                                              ? { ...deepOpt, actions: [...(deepOpt.actions || []), newNode] }
                                              : deepOpt
                                          ),
                                        }
                                      : a
                                  ),
                                }
                              : parentOpt
                          ),
                        }
                      : action
                  ),
                }
              : btn
          );

        if (ctx.branchType === "following") {
          return {
            ...node,
            followingButtons: updateButtons(node.followingButtons),
          };
        } else {
          return {
            ...node,
            notFollowingButtons: updateButtons(node.notFollowingButtons),
          };
        }
      }
      return node;
    });
    setFlowNodes(updatedNodes);
  } else if (ctx.type === "nestedQuickReply") {
    // Quick Reply inside Follow Check button
    const updatedNodes = flowNodes.map((node) => {
      if (node.id === ctx.nodeId && node.type === "followCheck") {
        const updateButtons = (buttons) =>
          buttons.map((btn) =>
            btn.id === ctx.buttonId
              ? {
                  ...btn,
                  actions: btn.actions.map((action) =>
                    action.id === ctx.quickReplyActionId
                      ? {
                          ...action,
                          replyOptions: action.replyOptions.map((opt) =>
                            opt.id === ctx.optionId
                              ? { ...opt, actions: [...(opt.actions || []), newNode] }
                              : opt
                          ),
                        }
                      : action
                  ),
                }
              : btn
          );

        if (ctx.branchType === "following") {
          return {
            ...node,
            followingButtons: updateButtons(node.followingButtons),
          };
        } else {
          return {
            ...node,
            notFollowingButtons: updateButtons(node.notFollowingButtons),
          };
        }
      }
      return node;
    });
    setFlowNodes(updatedNodes);
  } else {
    // Follow Check button (no Quick Reply nested yet)
    const updatedNodes = flowNodes.map((node) => {
      if (node.id === ctx.nodeId && node.type === "followCheck") {
        const updateButtons = (buttons) =>
          buttons.map((btn) =>
            btn.id === ctx.buttonId
              ? { ...btn, actions: [...btn.actions, newNode] }
              : btn
          );

        if (ctx.branchType === "following") {
          return {
            ...node,
            followingButtons: updateButtons(node.followingButtons),
          };
        } else {
          return {
            ...node,
            notFollowingButtons: updateButtons(node.notFollowingButtons),
          };
        }
      }
      return node;
    });
    setFlowNodes(updatedNodes);
  }
};


  // HELPER: Recursively update nested Quick Reply
  const updateNestedQuickReply = (
    options,
    parentOptionId,
    quickReplyActionId,
    targetOptionId,
    newNode
  ) => {
    return options.map((opt) =>
      opt.id === parentOptionId
        ? {
            ...opt,
            actions: opt.actions.map((action) =>
              action.id === quickReplyActionId
                ? {
                    ...action,
                    replyOptions: action.replyOptions.map((nestedOpt) =>
                      nestedOpt.id === targetOptionId
                        ? {
                            ...nestedOpt,
                            actions: [...(nestedOpt.actions || []), newNode],
                          }
                        : nestedOpt
                    ),
                  }
                : action
            ),
          }
        : opt
    );
  };

  // Add button to a branch
  const handleAddButton = (nodeId, branchType) => {
    const updatedNodes = flowNodes.map((node) => {
      if (node.id === nodeId && node.type === "followCheck") {
        const newButton = {
          id: Date.now(),
          text: `Button ${
            branchType === "following"
              ? node.followingButtons.length + 1
              : node.notFollowingButtons.length + 1
          }`,
          actions: [],
        };

        if (branchType === "following") {
          return {
            ...node,
            followingButtons: [...node.followingButtons, newButton],
          };
        } 
          if (branchType === "notFollowing" && node.notFollowingButtons.length >= 1) {
      toast.warning(
        "Only one verification button allowed. User must follow to proceed."
      );
      return;
    }
        else {
          return {
            ...node,
            notFollowingButtons: [...node.notFollowingButtons, newButton],
          };
        }
      }
      return node;
    });
    setFlowNodes(updatedNodes);
    toast.success("Button added!");
  };

  // Update button text
  const handleUpdateButtonText = (nodeId, branchType, buttonId, newText) => {
    const updatedNodes = flowNodes.map((node) => {
      if (node.id === nodeId && node.type === "followCheck") {
        if (branchType === "following") {
          return {
            ...node,
            followingButtons: node.followingButtons.map((btn) =>
              btn.id === buttonId ? { ...btn, text: newText } : btn
            ),
          };
        } else {
          return {
            ...node,
            notFollowingButtons: node.notFollowingButtons.map((btn) =>
              btn.id === buttonId ? { ...btn, text: newText } : btn
            ),
          };
        }
      }
      return node;
    });
    setFlowNodes(updatedNodes);
  };

  // Delete button
  const handleDeleteButton = (nodeId, branchType, buttonId) => {
    const updatedNodes = flowNodes.map((node) => {
      if (node.id === nodeId && node.type === "followCheck") {
        if (branchType === "following") {
          if (node.followingButtons.length <= 1) {
            toast.warning("At least one button is required");
            return node;
          }
          return {
            ...node,
            followingButtons: node.followingButtons.filter(
              (btn) => btn.id !== buttonId
            ),
          };
        } else {
          if (node.notFollowingButtons.length <= 1) {
            toast.warning("At least one button is required");
            return node;
          }
          return {
            ...node,
            notFollowingButtons: node.notFollowingButtons.filter(
              (btn) => btn.id !== buttonId
            ),
          };
        }
      }
      return node;
    });
    setFlowNodes(updatedNodes);
    toast.info("Button removed");
  };

  // Open dialog for adding action to a specific button
  const handleOpenAddActionDialog = (nodeId, branchType, buttonId) => {
    setActionContext({ nodeId, branchType, buttonId });
    resetNodeConfig();
    setDialogOpen(true);
  };

  // Quick Reply functions
  const handleAddQuickReplyOption = (nodeId) => {
    const updatedNodes = flowNodes.map((node) => {
      if (node.id === nodeId && node.type === "quickReply") {
        const newOption = {
          id: Date.now(),
          text: `Option ${node.replyOptions.length + 1}`,
          actions: [],
        };
        return {
          ...node,
          replyOptions: [...node.replyOptions, newOption],
        };
      }
      return node;
    });
    setFlowNodes(updatedNodes);
    toast.success("Option added!");
  };

  const handleUpdateQuickReplyOption = (nodeId, optionId, newText) => {
    const updatedNodes = flowNodes.map((node) => {
      if (node.id === nodeId && node.type === "quickReply") {
        return {
          ...node,
          replyOptions: node.replyOptions.map((opt) =>
            opt.id === optionId ? { ...opt, text: newText } : opt
          ),
        };
      }
      return node;
    });
    setFlowNodes(updatedNodes);
  };

  const handleDeleteQuickReplyOption = (nodeId, optionId) => {
    const updatedNodes = flowNodes.map((node) => {
      if (node.id === nodeId && node.type === "quickReply") {
        if (node.replyOptions.length <= 1) {
          toast.warning("At least one option is required");
          return node;
        }
        return {
          ...node,
          replyOptions: node.replyOptions.filter((opt) => opt.id !== optionId),
        };
      }
      return node;
    });
    setFlowNodes(updatedNodes);
    toast.info("Option removed");
  };

  const handleOpenQuickReplyActionDialog = (nodeId, optionId) => {
    setActionContext({ nodeId, optionId, type: "quickReply" });
    resetNodeConfig();
    setDialogOpen(true);
  };

  const handleDeleteQuickReplyAction = (nodeId, optionId, actionId) => {
    const updatedNodes = flowNodes.map((node) => {
      if (node.id === nodeId && node.type === "quickReply") {
        return {
          ...node,
          replyOptions: node.replyOptions.map((opt) =>
            opt.id === optionId
              ? {
                  ...opt,
                  actions: opt.actions.filter((action) => action.id !== actionId),
                }
              : opt
          ),
        };
      }
      return node;
    });
    setFlowNodes(updatedNodes);
    toast.info("Action removed");
  };

// 🛠️ FIXED: Handles updates for ALL node types (FollowCheck, QuickReply, and Nested variations)
const updateFlowNodesWithNewAction = (newAction) => {
  const ctx = actionContext;

  if (!ctx) {
    console.error("Context missing for nested action update.");
    return;
  }

  const updatedNodes = flowNodes.map((node) => {
    
    // CASE 1: Main-flow Quick Reply (Top level)
    if (ctx.type === "quickReply" && !ctx.parentOptionId) {
      if (node.id === ctx.nodeId && node.type === "quickReply") {
        return {
          ...node,
          replyOptions: node.replyOptions.map((opt) =>
            opt.id === ctx.optionId
              ? { ...opt, actions: [...(opt.actions || []), newAction] }
              : opt
          ),
        };
      }
    } 
    
    // CASE 2: Nested Quick Reply (inside another Quick Reply)
    else if (ctx.type === "quickReply" && ctx.parentOptionId) {
      if (node.id === ctx.nodeId && node.type === "quickReply") {
        return {
          ...node,
          replyOptions: updateNestedAction(
            node.replyOptions,
            ctx.parentOptionId,
            ctx.quickReplyActionId,
            ctx.optionId,
            newAction
          ),
        };
      }
    } 
    
    // CASE 3: Deep Nested Quick Reply (3+ levels)
    else if (ctx.type === "deepNestedQuickReply") {
      if (node.id === ctx.nodeId && node.type === "quickReply") {
        return {
          ...node,
          replyOptions: node.replyOptions.map((parentOpt) =>
            parentOpt.id === ctx.parentOptionId
              ? {
                  ...parentOpt,
                  actions: parentOpt.actions.map((act) =>
                    act.id === ctx.parentQRActionId
                      ? {
                          ...act,
                          replyOptions: act.replyOptions.map((middleOpt) =>
                            middleOpt.id === ctx.middleOptionId
                              ? {
                                  ...middleOpt,
                                  actions: middleOpt.actions.map((a) =>
                                    a.id === ctx.nestedQRId
                                      ? {
                                          ...a,
                                          replyOptions: a.replyOptions.map((deepOpt) =>
                                            deepOpt.id === ctx.optionId
                                              ? { ...deepOpt, actions: [...(deepOpt.actions || []), newAction] }
                                              : deepOpt
                                          ),
                                        }
                                      : a
                                  ),
                                }
                              : middleOpt
                          ),
                        }
                      : act
                  ),
                }
              : parentOpt
          ),
        };
      }
    } 
    
    // CASE 4: Deep Nested Quick Reply inside a Button
    else if (ctx.type === "deepNestedButtonQuickReply") {
      if (node.id === ctx.nodeId && node.type === "followCheck") {
        const updateButtons = (buttons) =>
          buttons.map((btn) =>
            btn.id === ctx.buttonId
              ? {
                  ...btn,
                  actions: btn.actions.map((action) =>
                    action.id === ctx.quickReplyActionId
                      ? {
                          ...action,
                          replyOptions: action.replyOptions.map((parentOpt) =>
                            parentOpt.id === ctx.parentOptionId
                              ? {
                                  ...parentOpt,
                                  actions: parentOpt.actions.map((a) =>
                                    a.id === ctx.nestedQRId
                                      ? {
                                          ...a,
                                          replyOptions: a.replyOptions.map((deepOpt) =>
                                            deepOpt.id === ctx.optionId
                                              ? { ...deepOpt, actions: [...(deepOpt.actions || []), newAction] }
                                              : deepOpt
                                          ),
                                        }
                                      : a
                                  ),
                                }
                              : parentOpt
                          ),
                        }
                      : action
                  ),
                }
              : btn
          );

        if (ctx.branchType === "following") {
          return { ...node, followingButtons: updateButtons(node.followingButtons) };
        } else {
          return { ...node, notFollowingButtons: updateButtons(node.notFollowingButtons) };
        }
      }
    } 
    
    // CASE 5: Quick Reply inside a Follow Check Button
    else if (ctx.type === "nestedQuickReply") {
      if (node.id === ctx.nodeId && node.type === "followCheck") {
        const updateButtons = (buttons) =>
          buttons.map((btn) =>
            btn.id === ctx.buttonId
              ? {
                  ...btn,
                  actions: btn.actions.map((action) =>
                    action.id === ctx.quickReplyActionId
                      ? {
                          ...action,
                          replyOptions: action.replyOptions.map((opt) =>
                            opt.id === ctx.optionId
                              ? { ...opt, actions: [...(opt.actions || []), newAction] }
                              : opt
                          ),
                        }
                      : action
                  ),
                }
              : btn
          );

        if (ctx.branchType === "following") {
          return { ...node, followingButtons: updateButtons(node.followingButtons) };
        } else {
          return { ...node, notFollowingButtons: updateButtons(node.notFollowingButtons) };
        }
      }
    } 
    
    // CASE 6: Standard Button Action (FollowCheck)
    else {
      if (node.id === ctx.nodeId && node.type === "followCheck") {
        const updateButtons = (buttons) =>
          buttons.map((btn) => {
            if (btn.id === ctx.buttonId) {
              return {
                ...btn,
                actions: [...(btn.actions || []), newAction],
              };
            }
            return btn;
          });

        if (ctx.branchType === "following") {
          return { ...node, followingButtons: updateButtons(node.followingButtons) };
        } else if (ctx.branchType === "notFollowing") {
          return { ...node, notFollowingButtons: updateButtons(node.notFollowingButtons) };
        }
      }
    }

    return node;
  });

  // Commit changes
  setFlowNodes(updatedNodes);
};

  // Validate and add node to flow
  const handleAddNode = async (type) => {
    // Validation
    if (type === "redirectLink") {
      if (!nodeConfig.redirectUrl.trim()) {
        toast.error("Please enter a valid URL");
        return;
      }
      try {
        new URL(nodeConfig.redirectUrl);
      } catch (e) {
        toast.error("Please enter a valid URL starting with https://");
        return;
      }
    }

    let finalConfig = { ...nodeConfig };
    let successMessage = "Action added!";

  if (type === "downloadFile") {
        const file = nodeConfig.downloadFile;
        if (!file || !(file instanceof File)) {
            toast.error("Please upload a file");
            return;
        }

        try {
            setIsUploading(true); // Start loading spinner
            
            const formData = new FormData();
            formData.append("file", file); // 'file' matches the backend's upload.single("file")

            // Call the new dedicated upload endpoint
            const response = await axios.post(`${baseUrl}/automation/upload-asset`, formData, {
                withCredentials: true,
                headers: { "Content-Type": "multipart/form-data" },
            });
            
           if (response.data?.success && response.data.publicUrl) {
        const publicUrl = response.data.publicUrl;
        
        // Populate the config for the new action object
        finalConfig.redirectUrl = publicUrl;
        finalConfig.downloadFile = {
            name: file.name,
            url: publicUrl 
        };

        // 💡 CRITICAL: Now, instead of immediately calling addActionToContext, 
        // we prepare the final action object and update the state explicitly.
        
        const newAction = {
            id: Date.now(), // Generate the new Action ID here
            type,
            config: finalConfig,
        };

        // The target action is nested. Use a function to find and update the state.
        updateFlowNodesWithNewAction(newAction); // ⬅️ NEW EXPLICIT CALL

        // Skip the common 'setFlowNodes([...flowNodes, newAction])' block later
        // and return immediately if the action was nested.
        setDialogOpen(false);
        setSelectedNodeType(null);
        setActionContext(null);
        resetNodeConfig();
        toast.success("File uploaded and action saved!");
        return; // Important: Exit here if the action was nested
    }
            else {
                throw new Error(response.data?.message || "File upload failed on the server.");
            }

        } catch (err) {
            console.error("File upload failed:", err);
            toast.error(err.message || "Failed to upload file. Check console.");
            return; // Stop execution if upload fails
        } finally {
            setIsUploading(false); // Stop loading spinner regardless of outcome
        }
    }

    const newAction = {
      id: Date.now(),
      type,
      config: { ...nodeConfig },
    };

    if (actionContext) {
      addActionToContext(newAction);
    } else {
      setFlowNodes([...flowNodes, newAction]);
    }

    setDialogOpen(false);
    setSelectedNodeType(null);
    setActionContext(null);
    resetNodeConfig();
    toast.success("Action added!");
  };

  // HELPER: Add non-QuickReply action to context
const addActionToContext = (newAction) => {
  const ctx = actionContext;

  if (ctx.type === "quickReply" && !ctx.parentOptionId) {
    // Main-flow Quick Reply
    const updatedNodes = flowNodes.map((node) =>
      node.id === ctx.nodeId && node.type === "quickReply"
        ? {
            ...node,
            replyOptions: node.replyOptions.map((opt) =>
              opt.id === ctx.optionId
                ? { ...opt, actions: [...opt.actions, newAction] }
                : opt
            ),
          }
        : node
    );
    setFlowNodes(updatedNodes);
  } else if (ctx.type === "quickReply" && ctx.parentOptionId) {
    // Nested Quick Reply
    const updatedNodes = flowNodes.map((node) =>
      node.id === ctx.nodeId && node.type === "quickReply"
        ? {
            ...node,
            replyOptions: updateNestedAction(
              node.replyOptions,
              ctx.parentOptionId,
              ctx.quickReplyActionId,
              ctx.optionId,
              newAction
            ),
          }
        : node
    );
    setFlowNodes(updatedNodes);
  } else if (ctx.type === "deepNestedQuickReply") {
    // NEW: Deep nested Quick Reply (3+ levels)
    const updatedNodes = flowNodes.map((node) => {
      if (node.id === ctx.nodeId && node.type === "quickReply") {
        return {
          ...node,
          replyOptions: node.replyOptions.map((parentOpt) =>
            parentOpt.id === ctx.parentOptionId
              ? {
                  ...parentOpt,
                  actions: parentOpt.actions.map((act) =>
                    act.id === ctx.parentQRActionId
                      ? {
                          ...act,
                          replyOptions: act.replyOptions.map((middleOpt) =>
                            middleOpt.id === ctx.middleOptionId
                              ? {
                                  ...middleOpt,
                                  actions: middleOpt.actions.map((a) =>
                                    a.id === ctx.nestedQRId
                                      ? {
                                          ...a,
                                          replyOptions: a.replyOptions.map((deepOpt) =>
                                            deepOpt.id === ctx.optionId
                                              ? { ...deepOpt, actions: [...(deepOpt.actions || []), newAction] }
                                              : deepOpt
                                          ),
                                        }
                                      : a
                                  ),
                                }
                              : middleOpt
                          ),
                        }
                      : act
                  ),
                }
              : parentOpt
          ),
        };
      }
      return node;
    });
    setFlowNodes(updatedNodes);
  } else if (ctx.type === "deepNestedButtonQuickReply") {
    // NEW: Deep nested Quick Reply inside Follow Check button
    const updatedNodes = flowNodes.map((node) => {
      if (node.id === ctx.nodeId && node.type === "followCheck") {
        const updateButtons = (buttons) =>
          buttons.map((btn) =>
            btn.id === ctx.buttonId
              ? {
                  ...btn,
                  actions: btn.actions.map((action) =>
                    action.id === ctx.quickReplyActionId
                      ? {
                          ...action,
                          replyOptions: action.replyOptions.map((parentOpt) =>
                            parentOpt.id === ctx.parentOptionId
                              ? {
                                  ...parentOpt,
                                  actions: parentOpt.actions.map((a) =>
                                    a.id === ctx.nestedQRId
                                      ? {
                                          ...a,
                                          replyOptions: a.replyOptions.map((deepOpt) =>
                                            deepOpt.id === ctx.optionId
                                              ? { ...deepOpt, actions: [...(deepOpt.actions || []), newAction] }
                                              : deepOpt
                                          ),
                                        }
                                      : a
                                  ),
                                }
                              : parentOpt
                          ),
                        }
                      : action
                  ),
                }
              : btn
          );

        if (ctx.branchType === "following") {
          return {
            ...node,
            followingButtons: updateButtons(node.followingButtons),
          };
        } else {
          return {
            ...node,
            notFollowingButtons: updateButtons(node.notFollowingButtons),
          };
        }
      }
      return node;
    });
    setFlowNodes(updatedNodes);
  } else if (ctx.type === "nestedQuickReply") {
    // Inside Follow Check button's Quick Reply
    const updatedNodes = flowNodes.map((node) => {
      if (node.id === ctx.nodeId && node.type === "followCheck") {
        const updateButtons = (buttons) =>
          buttons.map((btn) =>
            btn.id === ctx.buttonId
              ? {
                  ...btn,
                  actions: btn.actions.map((action) =>
                    action.id === ctx.quickReplyActionId
                      ? {
                          ...action,
                          replyOptions: action.replyOptions.map((opt) =>
                            opt.id === ctx.optionId
                              ? { ...opt, actions: [...(opt.actions || []), newAction] }
                              : opt
                          ),
                        }
                      : action
                  ),
                }
              : btn
          );

        if (ctx.branchType === "following") {
          return {
            ...node,
            followingButtons: updateButtons(node.followingButtons),
          };
        } else {
          return {
            ...node,
            notFollowingButtons: updateButtons(node.notFollowingButtons),
          };
        }
      }
      return node;
    });
    setFlowNodes(updatedNodes);
  } else {
    // Follow Check button
    const updatedNodes = flowNodes.map((node) => {
      if (node.id === ctx.nodeId && node.type === "followCheck") {
        const updateButtons = (buttons) =>
          buttons.map((btn) =>
            btn.id === ctx.buttonId
              ? { ...btn, actions: [...btn.actions, newAction] }
              : btn
          );

        if (ctx.branchType === "following") {
          return {
            ...node,
            followingButtons: updateButtons(node.followingButtons),
          };
        } else {
          return {
            ...node,
            notFollowingButtons: updateButtons(node.notFollowingButtons),
          };
        }
      }
      return node;
    });
    setFlowNodes(updatedNodes);
  }
};


  // HELPER: Update nested action recursively
  const updateNestedAction = (
    options,
    parentOptionId,
    quickReplyActionId,
    targetOptionId,
    newAction
  ) => {
    return options.map((opt) =>
      opt.id === parentOptionId
        ? {
            ...opt,
            actions: opt.actions.map((action) =>
              action.id === quickReplyActionId
                ? {
                    ...action,
                    replyOptions: action.replyOptions.map((nestedOpt) =>
                      nestedOpt.id === targetOptionId
                        ? {
                            ...nestedOpt,
                            actions: [...(nestedOpt.actions || []), newAction],
                          }
                        : nestedOpt
                    ),
                  }
                : action
            ),
          }
        : opt
    );
  };

  // Delete node
  const handleDeleteNode = (nodeId) => {
    setFlowNodes(flowNodes.filter((node) => node.id !== nodeId));
    toast.info("Action removed");
  };

  // Delete action from button
  const handleDeleteButtonAction = (nodeId, branchType, buttonId, actionId) => {
    const updatedNodes = flowNodes.map((node) => {
      if (node.id === nodeId && node.type === "followCheck") {
        const updateButtons = (buttons) =>
          buttons.map((btn) =>
            btn.id === buttonId
              ? {
                  ...btn,
                  actions: btn.actions.filter((action) => action.id !== actionId),
                }
              : btn
          );

        if (branchType === "following") {
          return {
            ...node,
            followingButtons: updateButtons(node.followingButtons),
          };
        } else {
          return {
            ...node,
            notFollowingButtons: updateButtons(node.notFollowingButtons),
          };
        }
      }
      return node;
    });
    setFlowNodes(updatedNodes);
    toast.info("Action removed");
  };

  // Render actions for a button
  const renderButtonActions = (nodeId, branchType, button, color) => {
    if (button.actions.length === 0) return null;

    const hasQuickReply = button.actions.some((action) => action.type === "quickReply");
    
    if (hasQuickReply) {
      return null;
    }

    return (
      <Box sx={{ mt: 2 }}>
        <Stack spacing={1}>
          {button.actions.map((action) => {
            const actionType = actionTypes.find((at) => at.type === action.type);
            if (!actionType) return null;

            return (
              <Card
                key={action.id}
                elevation={0}
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  border: "1px solid",
                  borderColor: actionType.color,
                  bgcolor: actionType.bgColor,
                  position: "relative",
                }}
              >
                <IconButton
                  size="small"
                  onClick={() =>
                    handleDeleteButtonAction(nodeId, branchType, button.id, action.id)
                  }
                  sx={{
                    position: "absolute",
                    top: 4,
                    right: 4,
                    bgcolor: "white",
                    "&:hover": { bgcolor: "#FEE2E2", color: "#EF4444" },
                    width: 24,
                    height: 24,
                  }}
                >
                  <CloseIcon sx={{ fontSize: 16 }} />
                </IconButton>

                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: 1.5,
                      bgcolor: actionType.color,
                      color: "white",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    {actionType.icon}
                  </Box>
                  <Box flex={1}>
                    <Typography sx={{ fontWeight: 600, fontSize: "13px", mb: 0.5 }}>
                      {actionType.title}
                    </Typography>
                    {action.type === "redirectLink" && (
                      <Typography
                        variant="caption"
                        sx={{ color: "#64748B", fontSize: "11px" }}
                      >
                        {action.config.redirectUrl}
                      </Typography>
                    )}
                    {action.type === "downloadFile" && (
                      <Typography
                        variant="caption"
                        sx={{ color: "#64748B", fontSize: "11px" }}
                      >
                        {action.config.downloadFile?.name}
                      </Typography>
                    )}
                    {action.type === "askToFollow" && (
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <InstagramIcon sx={{ fontSize: 14, color: "#64748B" }} />
                        <Typography
                          variant="caption"
                          sx={{ color: "#64748B", fontSize: "11px" }}
                        >
                          @{action.config.instagramPage}
                        </Typography>
                      </Stack>
                    )}
                  </Box>
                </Stack>
              </Card>
            );
          })}
        </Stack>
      </Box>
    );
  };

  // Render Quick Reply node for button actions
  const renderButtonQuickReply = (nodeId, branchType, button) => {
    const quickReplyAction = button.actions.find((action) => action.type === "quickReply");
    
    if (!quickReplyAction) return null;

    return (
      <Box sx={{ width: "100%", mt: 3 }}>
        {/* Connection line */}
        <Box sx={{ position: "relative", height: 60, mb: 2 }}>
          <Box
            sx={{
              position: "absolute",
              left: "50%",
              top: 0,
              width: 3,
              height: 60,
              bgcolor: "#F59E0B",
              transform: "translateX(-50%)",
            }}
          />
        </Box>

        {/* Quick Reply Node */}
        <Card
          elevation={0}
          sx={{
            p: 2.5,
            borderRadius: 3,
            border: "2px solid #F59E0B",
            bgcolor: "#FFFBEB",
            position: "relative",
          }}
        >
          <IconButton
            size="small"
            onClick={() =>
              handleDeleteButtonAction(nodeId, branchType, button.id, quickReplyAction.id)
            }
            sx={{
              position: "absolute",
              top: 8,
              right: 8,
              bgcolor: "white",
              "&:hover": { bgcolor: "#FEE2E2", color: "#EF4444" },
            }}
          >
            <DeleteOutlineIcon fontSize="small" />
          </IconButton>

          <Stack direction="row" spacing={2} alignItems="flex-start" mb={2}>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 2,
                bgcolor: "#F59E0B",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <QuizIcon />
            </Box>
            <Box flex={1}>
              <Typography sx={{ fontWeight: 700, fontSize: "16px", mb: 0.5 }}>
                Quick Replies
              </Typography>
              <Typography variant="caption" sx={{ color: "#64748B" }}>
                Ask question with quick reply options
              </Typography>
            </Box>
          </Stack>

          <Stack spacing={2}>
            <TextField
              fullWidth
              multiline
              rows={2}
              size="small"
              label="Question"
              placeholder="What would you like to do?"
              value={quickReplyAction.config.quickReplyQuestion}
              onChange={(e) => {
                const updatedNodes = flowNodes.map((node) => {
                  if (node.id === nodeId && node.type === "followCheck") {
                    const updateButtons = (buttons) =>
                      buttons.map((btn) =>
                        btn.id === button.id
                          ? {
                              ...btn,
                              actions: btn.actions.map((action) =>
                                action.id === quickReplyAction.id
                                  ? {
                                      ...action,
                                      config: {
                                        ...action.config,
                                        quickReplyQuestion: e.target.value,
                                      },
                                    }
                                  : action
                              ),
                            }
                          : btn
                      );

                    if (branchType === "following") {
                      return {
                        ...node,
                        followingButtons: updateButtons(node.followingButtons),
                      };
                    } else {
                      return {
                        ...node,
                        notFollowingButtons: updateButtons(node.notFollowingButtons),
                      };
                    }
                  }
                  return node;
                });
                setFlowNodes(updatedNodes);
              }}
            />

            <Button
              size="small"
              variant="text"
              startIcon={<AddIcon />}
              onClick={() => {
                const updatedNodes = flowNodes.map((node) => {
                  if (node.id === nodeId && node.type === "followCheck") {
                    const updateButtons = (buttons) =>
                      buttons.map((btn) =>
                        btn.id === button.id
                          ? {
                              ...btn,
                              actions: btn.actions.map((action) =>
                                action.id === quickReplyAction.id
                                  ? {
                                      ...action,
                                      replyOptions: [
                                        ...action.replyOptions,
                                        {
                                          id: Date.now(),
                                          text: `Option ${action.replyOptions.length + 1}`,
                                          actions: [],
                                        },
                                      ],
                                    }
                                  : action
                              ),
                            }
                          : btn
                      );

                    if (branchType === "following") {
                      return {
                        ...node,
                        followingButtons: updateButtons(node.followingButtons),
                      };
                    } else {
                      return {
                        ...node,
                        notFollowingButtons: updateButtons(node.notFollowingButtons),
                      };
                    }
                  }
                  return node;
                });
                setFlowNodes(updatedNodes);
                toast.success("Option added!");
              }}
              sx={{
                textTransform: "none",
                color: "#F59E0B",
                justifyContent: "flex-start",
                "&:hover": {
                  bgcolor: "#FFFBEB",
                },
              }}
            >
              Add Option
            </Button>
          </Stack>
        </Card>

        {/* Render Quick Reply Options */}
        {renderQuickReplyOptionsForButton(nodeId, branchType, button.id, quickReplyAction)}
      </Box>
    );
  };

  // Render Quick Reply options for button-based Quick Replies
  
const renderQuickReplyOptionsForButton = (nodeId, branchType, buttonId, quickReplyAction) => {
  const options = quickReplyAction.replyOptions ?? [];
  const totalOptions = options.length;
  const splitY = 40, downHeight = 60;

  let anchors = [];
  if (totalOptions === 1) {
    anchors = ["50%"];
  } else if (totalOptions === 2) {
    anchors = ["15%", "85%"];
  } else if (totalOptions > 2) {
    const step = 70 / (totalOptions - 1);
    anchors = Array.from({ length: totalOptions }, (_, i) => `${15 + step * i}%`);
  }

  if (totalOptions === 0) return null;

  return (
    <Box sx={{ width: "100%", mt: 3 }}>
      <Box sx={{ position: "relative", height: splitY + downHeight, mb: 2 }}>
        <Box sx={{ position: "absolute", left: "50%", top: 0, width: 3, height: splitY, bgcolor: "#F59E0B", transform: "translateX(-50%)", zIndex: 2 }}/>
        {totalOptions > 1 && (
          <Box sx={{ position: "absolute", left: "15%", width: "70%", top: splitY - 2, height: 3, bgcolor: "#F59E0B", zIndex: 1 }}/>
        )}
        {anchors.map(anchor => (
          <Box key={anchor} sx={{ position: "absolute", left: anchor, top: splitY, width: 3, height: downHeight, bgcolor: "#F59E0B", transform: "translateX(-50%)", zIndex: 1 }}/>
        ))}
      </Box>
      <Grid container spacing={2} justifyContent="space-between">
        {options.map((opt) => (
          <Grid item xs={12} md={totalOptions === 1 ? 12 : totalOptions === 2 ? 6 : 4} key={opt.id}>
            <Card elevation={0} sx={{ p: 2, borderRadius: 2, border: "2px solid #F59E0B", bgcolor: "white", position: "relative" }}>
                {options.length > 1 && (
                  <IconButton
                    size="small"
                    onClick={() => {
                      const updatedNodes = flowNodes.map((node) => {
                        if (node.id === nodeId && node.type === "followCheck") {
                          const updateButtons = (buttons) =>
                            buttons.map((btn) =>
                              btn.id === buttonId
                                ? {
                                    ...btn,
                                    actions: btn.actions.map((action) =>
                                      action.id === quickReplyAction.id
                                        ? {
                                            ...action,
                                            replyOptions: action.replyOptions.filter(
                                              (o) => o.id !== opt.id
                                            ),
                                          }
                                        : action
                                    ),
                                  }
                                : btn
                            );

                          if (branchType === "following") {
                            return {
                              ...node,
                              followingButtons: updateButtons(node.followingButtons),
                            };
                          } else {
                            return {
                              ...node,
                              notFollowingButtons: updateButtons(node.notFollowingButtons),
                            };
                          }
                        }
                        return node;
                      });
                      setFlowNodes(updatedNodes);
                      toast.info("Option removed");
                    }}
                    sx={{
                      position: "absolute",
                      top: 4,
                      right: 4,
                      bgcolor: "white",
                      "&:hover": { bgcolor: "#FEE2E2", color: "#EF4444" },
                    }}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                )}

                <Stack spacing={1.5}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Option Text"
                    value={opt.text}
                    onChange={(e) => {
                      const updatedNodes = flowNodes.map((node) => {
                        if (node.id === nodeId && node.type === "followCheck") {
                          const updateButtons = (buttons) =>
                            buttons.map((btn) =>
                              btn.id === buttonId
                                ? {
                                    ...btn,
                                    actions: btn.actions.map((action) =>
                                      action.id === quickReplyAction.id
                                        ? {
                                            ...action,
                                            replyOptions: action.replyOptions.map((o) =>
                                              o.id === opt.id
                                                ? { ...o, text: e.target.value }
                                                : o
                                            ),
                                          }
                                        : action
                                    ),
                                  }
                                : btn
                            );

                          if (branchType === "following") {
                            return {
                              ...node,
                              followingButtons: updateButtons(node.followingButtons),
                            };
                          } else {
                            return {
                              ...node,
                              notFollowingButtons: updateButtons(node.notFollowingButtons),
                            };
                          }
                        }
                        return node;
                      });
                      setFlowNodes(updatedNodes);
                    }}
                  />

                  {renderNestedQuickReplyOptionActions(nodeId, branchType, buttonId, quickReplyAction, opt)}

                  {/* RECURSIVE: Render nested Quick Reply if exists */}
                  {opt.actions?.some((a) => a.type === "quickReply") &&
                    renderNestedQuickReplyInButton(nodeId, branchType, buttonId, quickReplyAction, opt)}

                  {/* Only show Add Action button when option has no actions */}
                  {(!opt.actions || opt.actions.length === 0) && (
                    <Box>
                      <Typography
                        variant="caption"
                        sx={{ color: "#64748B", display: "block", mb: 1 }}
                      >
                        When user selects "{opt.text}"
                      </Typography>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<AddCircleOutlineIcon />}
                        fullWidth
                        onClick={() => {
                          setActionContext({
                            nodeId: nodeId,
                            branchType: branchType,
                            buttonId: buttonId,
                            quickReplyActionId: quickReplyAction.id,
                            optionId: opt.id,
                            type: "nestedQuickReply"
                          });
                          resetNodeConfig();
                          setDialogOpen(true);
                        }}
                        sx={{
                          textTransform: "none",
                          borderStyle: "dashed",
                          color: "#F59E0B",
                          borderColor: "#F59E0B",
                          "&:hover": {
                            bgcolor: "#FFFBEB",
                            borderColor: "#F59E0B",
                          },
                        }}
                      >
                        Add Action
                      </Button>
                    </Box>
                  )}
                </Stack>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  };

  // NEW: Render nested Quick Reply inside button Quick Reply (RECURSIVE SUPPORT)
// Replace renderNestedQuickReplyInButton with this:
const renderNestedQuickReplyInButton = (nodeId, branchType, buttonId, parentQR, option) => {
  const nestedQR = option.actions.find((a) => a.type === "quickReply");
  if (!nestedQR) return null;

  return (
    <Box sx={{ width: "100%", mt: 3 }}>
      {/* Connection line */}
      <Box sx={{ position: "relative", height: 60, mb: 2 }}>
        <Box
          sx={{
            position: "absolute",
            left: "50%",
            top: 0,
            width: 3,
            height: 60,
            bgcolor: "#F59E0B",
            transform: "translateX(-50%)",
          }}
        />
      </Box>

      {/* Nested Quick Reply Node */}
      <Card
        elevation={0}
        sx={{
          p: 2.5,
          borderRadius: 3,
          border: "2px solid #F59E0B",
          bgcolor: "#FFFBEB",
          position: "relative",
        }}
      >
        <IconButton
          size="small"
          onClick={() => {
            const updatedNodes = flowNodes.map((node) => {
              if (node.id === nodeId && node.type === "followCheck") {
                const updateButtons = (buttons) =>
                  buttons.map((btn) =>
                    btn.id === buttonId
                      ? {
                          ...btn,
                          actions: btn.actions.map((action) =>
                            action.id === parentQR.id
                              ? {
                                  ...action,
                                  replyOptions: action.replyOptions.map((opt) =>
                                    opt.id === option.id
                                      ? {
                                          ...opt,
                                          actions: opt.actions.filter(
                                            (a) => a.id !== nestedQR.id
                                          ),
                                        }
                                      : opt
                                  ),
                                }
                              : action
                          ),
                        }
                      : btn
                  );

                if (branchType === "following") {
                  return {
                    ...node,
                    followingButtons: updateButtons(node.followingButtons),
                  };
                } else {
                  return {
                    ...node,
                    notFollowingButtons: updateButtons(node.notFollowingButtons),
                  };
                }
              }
              return node;
            });
            setFlowNodes(updatedNodes);
            toast.info("Nested Quick Reply removed");
          }}
          sx={{
            position: "absolute",
            top: 8,
            right: 8,
            bgcolor: "white",
            "&:hover": { bgcolor: "#FEE2E2", color: "#EF4444" },
          }}
        >
          <DeleteOutlineIcon fontSize="small" />
        </IconButton>

        <Stack direction="row" spacing={2} alignItems="flex-start" mb={2}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 2,
              bgcolor: "#F59E0B",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <QuizIcon />
          </Box>
          <Box flex={1}>
            <Typography sx={{ fontWeight: 700, fontSize: "16px", mb: 0.5 }}>
              Quick Replies (Nested)
            </Typography>
            <Typography variant="caption" sx={{ color: "#64748B" }}>
              Ask question with quick reply options
            </Typography>
          </Box>
        </Stack>

        <Stack spacing={2}>
          <TextField
            fullWidth
            multiline
            rows={2}
            size="small"
            label="Question"
            placeholder="What would you like to do?"
            value={nestedQR.config.quickReplyQuestion}
            onChange={(e) => {
              const updatedNodes = flowNodes.map((node) => {
                if (node.id === nodeId && node.type === "followCheck") {
                  const updateButtons = (buttons) =>
                    buttons.map((btn) =>
                      btn.id === buttonId
                        ? {
                            ...btn,
                            actions: btn.actions.map((action) =>
                              action.id === parentQR.id
                                ? {
                                    ...action,
                                    replyOptions: action.replyOptions.map((opt) =>
                                      opt.id === option.id
                                        ? {
                                            ...opt,
                                            actions: opt.actions.map((a) =>
                                              a.id === nestedQR.id
                                                ? {
                                                    ...a,
                                                    config: {
                                                      ...a.config,
                                                      quickReplyQuestion: e.target.value,
                                                    },
                                                  }
                                                : a
                                            ),
                                          }
                                        : opt
                                    ),
                                  }
                                : action
                            ),
                          }
                        : btn
                    );

                  if (branchType === "following") {
                    return {
                      ...node,
                      followingButtons: updateButtons(node.followingButtons),
                    };
                  } else {
                    return {
                      ...node,
                      notFollowingButtons: updateButtons(node.notFollowingButtons),
                    };
                  }
                }
                return node;
              });
              setFlowNodes(updatedNodes);
            }}
          />

          <Button
            size="small"
            variant="text"
            startIcon={<AddIcon />}
            onClick={() => {
              const updatedNodes = flowNodes.map((node) => {
                if (node.id === nodeId && node.type === "followCheck") {
                  const updateButtons = (buttons) =>
                    buttons.map((btn) =>
                      btn.id === buttonId
                        ? {
                            ...btn,
                            actions: btn.actions.map((action) =>
                              action.id === parentQR.id
                                ? {
                                    ...action,
                                    replyOptions: action.replyOptions.map((opt) =>
                                      opt.id === option.id
                                        ? {
                                            ...opt,
                                            actions: opt.actions.map((a) =>
                                              a.id === nestedQR.id
                                                ? {
                                                    ...a,
                                                    replyOptions: [
                                                      ...(a.replyOptions || []),
                                                      {
                                                        id: Date.now(),
                                                        text: `Option ${(a.replyOptions?.length || 0) + 1}`,
                                                        actions: [],
                                                      },
                                                    ],
                                                  }
                                                : a
                                            ),
                                          }
                                        : opt
                                    ),
                                  }
                                : action
                            ),
                          }
                        : btn
                    );

                  if (branchType === "following") {
                    return {
                      ...node,
                      followingButtons: updateButtons(node.followingButtons),
                    };
                  } else {
                    return {
                      ...node,
                      notFollowingButtons: updateButtons(node.notFollowingButtons),
                    };
                  }
                }
                return node;
              });
              setFlowNodes(updatedNodes);
              toast.success("Option added!");
            }}
            sx={{
              textTransform: "none",
              color: "#F59E0B",
              justifyContent: "flex-start",
              "&:hover": {
                bgcolor: "#FFFBEB",
              },
            }}
          >
            Add Option
          </Button>
        </Stack>
      </Card>

      {/* Render nested options for button-based Quick Reply */}
      {renderNestedQuickReplyOptionsInButton(nodeId, branchType, buttonId, parentQR, option.id, nestedQR)}
    </Box>
  );
};

// NEW FUNCTION: Render nested options for button Quick Reply
const renderNestedQuickReplyOptionsInButton = (nodeId, branchType, buttonId, parentQR, parentOptionId, nestedQR) => {
  const options = nestedQR.replyOptions || [];

  if (options.length === 0) return null;

  return (
    <Box sx={{ width: "100%", mt: 3 }}>
      {/* Branching lines */}
      <Box
        sx={{ position: "relative", height: options.length > 1 ? 100 : 60, mb: 2 }}
      >
        <Box
          sx={{
            position: "absolute",
            left: "50%",
            top: 0,
            width: 3,
            height: options.length > 1 ? 40 : 60,
            bgcolor: "#F59E0B",
            transform: "translateX(-50%)",
          }}
        />

        {options.length > 1 && (
          <>
            <Box
              sx={{
                position: "absolute",
                left: "15%",
                right: "15%",
                top: 40,
                height: 3,
                bgcolor: "#F59E0B",
              }}
            />

            {options.map((opt, index) => {
              const totalOptions = options.length;
 const stepPercent = 100 / (totalOptions + 1)
const leftPosition = stepPercent * (index + 1)
              return (
                <Box
                  key={opt.id}
                  sx={{
                    position: "absolute",
                    left: `${leftPosition}%`,
                    top: 40,
                    width: 3,
                    height: 60,
                    bgcolor: "#F59E0B",
                    transform: "translateX(-50%)",
                  }}
                />
              );
            })}
          </>
        )}
      </Box>

      {/* Option nodes */}
      <Grid container spacing={2}>
        {options.map((opt) => (
          <Grid
            item
            xs={12}
            md={options.length === 1 ? 12 : options.length === 2 ? 6 : 4}
            key={opt.id}
          >
            <Card
              elevation={0}
              sx={{
                p: 2,
                borderRadius: 2,
                border: "2px solid #F59E0B",
                bgcolor: "white",
                position: "relative",
              }}
            >
              {options.length > 1 && (
                <IconButton
                  size="small"
                  onClick={() => {
                    const updatedNodes = flowNodes.map((node) => {
                      if (node.id === nodeId && node.type === "followCheck") {
                        const updateButtons = (buttons) =>
                          buttons.map((btn) =>
                            btn.id === buttonId
                              ? {
                                  ...btn,
                                  actions: btn.actions.map((action) =>
                                    action.id === parentQR.id
                                      ? {
                                          ...action,
                                          replyOptions: action.replyOptions.map((parentOpt) =>
                                            parentOpt.id === parentOptionId
                                              ? {
                                                  ...parentOpt,
                                                  actions: parentOpt.actions.map((a) =>
                                                    a.id === nestedQR.id
                                                      ? {
                                                          ...a,
                                                          replyOptions: a.replyOptions.filter(
                                                            (o) => o.id !== opt.id
                                                          ),
                                                        }
                                                      : a
                                                  ),
                                                }
                                              : parentOpt
                                          ),
                                        }
                                      : action
                                  ),
                                }
                              : btn
                          );

                        if (branchType === "following") {
                          return {
                            ...node,
                            followingButtons: updateButtons(node.followingButtons),
                          };
                        } else {
                          return {
                            ...node,
                            notFollowingButtons: updateButtons(node.notFollowingButtons),
                          };
                        }
                      }
                      return node;
                    });
                    setFlowNodes(updatedNodes);
                    toast.info("Option removed");
                  }}
                  sx={{
                    position: "absolute",
                    top: 4,
                    right: 4,
                    bgcolor: "white",
                    "&:hover": { bgcolor: "#FEE2E2", color: "#EF4444" },
                  }}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              )}

              <Stack spacing={1.5}>
                <TextField
                  fullWidth
                  size="small"
                  label="Option Text"
                  value={opt.text}
                  onChange={(e) => {
                    const updatedNodes = flowNodes.map((node) => {
                      if (node.id === nodeId && node.type === "followCheck") {
                        const updateButtons = (buttons) =>
                          buttons.map((btn) =>
                            btn.id === buttonId
                              ? {
                                  ...btn,
                                  actions: btn.actions.map((action) =>
                                    action.id === parentQR.id
                                      ? {
                                          ...action,
                                          replyOptions: action.replyOptions.map((parentOpt) =>
                                            parentOpt.id === parentOptionId
                                              ? {
                                                  ...parentOpt,
                                                  actions: parentOpt.actions.map((a) =>
                                                    a.id === nestedQR.id
                                                      ? {
                                                          ...a,
                                                          replyOptions: a.replyOptions.map((o) =>
                                                            o.id === opt.id
                                                              ? { ...o, text: e.target.value }
                                                              : o
                                                          ),
                                                        }
                                                      : a
                                                  ),
                                                }
                                              : parentOpt
                                          ),
                                        }
                                      : action
                                  ),
                                }
                              : btn
                          );

                        if (branchType === "following") {
                          return {
                            ...node,
                            followingButtons: updateButtons(node.followingButtons),
                          };
                        } else {
                          return {
                            ...node,
                            notFollowingButtons: updateButtons(node.notFollowingButtons),
                          };
                        }
                      }
                      return node;
                    });
                    setFlowNodes(updatedNodes);
                  }}
                />

              {/* Show Add Action for this nested option */}
{(!opt.actions || opt.actions.length === 0) && (
  <Box>
    <Typography
      variant="caption"
      sx={{ color: "#64748B", display: "block", mb: 1 }}
    >
      When user selects "{opt.text}"
    </Typography>
    <Button
      size="small"
      variant="outlined"
      startIcon={<AddCircleOutlineIcon />}
      fullWidth
      onClick={() => {
        // Set proper context for deeply nested button Quick Reply
        setActionContext({
          nodeId: nodeId,
          branchType: branchType,
          buttonId: buttonId,
          quickReplyActionId: parentQR.id,
          parentOptionId: parentOptionId,
          nestedQRId: nestedQR.id,
          optionId: opt.id,
          type: "deepNestedButtonQuickReply"
        });
        resetNodeConfig();
        setDialogOpen(true);
      }}
      sx={{
        textTransform: "none",
        borderStyle: "dashed",
        color: "#F59E0B",
        borderColor: "#F59E0B",
        "&:hover": {
          bgcolor: "#FFFBEB",
          borderColor: "#F59E0B",
        },
      }}
    >
      Add Action
    </Button>
  </Box>
)}

              </Stack>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};


  // Render actions for nested Quick Reply options
  const renderNestedQuickReplyOptionActions = (nodeId, branchType, buttonId, quickReplyAction, option) => {
    if (!option.actions || option.actions.length === 0) return null;

    // Filter out Quick Reply (it's rendered separately)
    const nonQRActions = option.actions.filter((a) => a.type !== "quickReply");
    if (nonQRActions.length === 0) return null;

    return (
      <Box sx={{ mt: 2 }}>
        <Stack spacing={1}>
          {nonQRActions.map((action) => {
            const actionType = actionTypes.find((at) => at.type === action.type);
            if (!actionType) return null;

            return (
              <Card
                key={action.id}
                elevation={0}
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  border: "1px solid",
                  borderColor: actionType.color,
                  bgcolor: actionType.bgColor,
                  position: "relative",
                }}
              >
                <IconButton
                  size="small"
                  onClick={() => {
                    const updatedNodes = flowNodes.map((node) => {
                      if (node.id === nodeId && node.type === "followCheck") {
                        const updateButtons = (buttons) =>
                          buttons.map((btn) =>
                            btn.id === buttonId
                              ? {
                                  ...btn,
                                  actions: btn.actions.map((act) =>
                                    act.id === quickReplyAction.id
                                      ? {
                                          ...act,
                                          replyOptions: act.replyOptions.map((opt) =>
                                            opt.id === option.id
                                              ? {
                                                  ...opt,
                                                  actions: opt.actions.filter(
                                                    (a) => a.id !== action.id
                                                  ),
                                                }
                                              : opt
                                          ),
                                        }
                                      : act
                                  ),
                                }
                              : btn
                          );

                        if (branchType === "following") {
                          return {
                            ...node,
                            followingButtons: updateButtons(node.followingButtons),
                          };
                        } else {
                          return {
                            ...node,
                            notFollowingButtons: updateButtons(node.notFollowingButtons),
                          };
                        }
                      }
                      return node;
                    });
                    setFlowNodes(updatedNodes);
                    toast.info("Action removed");
                  }}
                  sx={{
                    position: "absolute",
                    top: 4,
                    right: 4,
                    bgcolor: "white",
                    "&:hover": { bgcolor: "#FEE2E2", color: "#EF4444" },
                    width: 24,
                    height: 24,
                  }}
                >
                  <CloseIcon sx={{ fontSize: 16 }} />
                </IconButton>

                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: 1.5,
                      bgcolor: actionType.color,
                      color: "white",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    {actionType.icon}
                  </Box>
                  <Box flex={1}>
                    <Typography sx={{ fontWeight: 600, fontSize: "13px", mb: 0.5 }}>
                      {actionType.title}
                    </Typography>
                    {action.type === "redirectLink" && (
                      <Typography
                        variant="caption"
                        sx={{ color: "#64748B", fontSize: "11px" }}
                      >
                        {action.config.redirectUrl}
                      </Typography>
                    )}
                    {action.type === "downloadFile" && (
                      <Typography
                        variant="caption"
                        sx={{ color: "#64748B", fontSize: "11px" }}
                      >
                        {action.config.downloadFile?.name}
                      </Typography>
                    )}
                    {action.type === "askToFollow" && (
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <InstagramIcon sx={{ fontSize: 14, color: "#64748B" }} />
                        <Typography
                          variant="caption"
                          sx={{ color: "#64748B", fontSize: "11px" }}
                        >
                          @{action.config.instagramPage}
                        </Typography>
                      </Stack>
                    )}
                  </Box>
                </Stack>
              </Card>
            );
          })}
        </Stack>
      </Box>
    );
  };

  // Render Quick Reply option actions
const renderQuickReplyOptionActions = (nodeId, option) => {
  if (!option.actions || option.actions.length === 0) return null;

  const hasQuickReply = option.actions.some((action) => action.type === "quickReply");
  const hasFollowCheck = option.actions.some((action) => action.type === "followCheck");
  
  if (hasQuickReply || hasFollowCheck) {
    return null;
  }

  return (
    <Box sx={{ mt: 2 }}>
      <Stack spacing={1}>
        {option.actions.map((action) => {
          const actionType = actionTypes.find((at) => at.type === action.type);
          if (!actionType) return null;

          return (
            <Card
              key={action.id}
              elevation={0}
              sx={{
                p: 1.5,
                borderRadius: 2,
                border: "1px solid",
                borderColor: actionType.color,
                bgcolor: actionType.bgColor,
                position: "relative",
              }}
            >
              <IconButton
                size="small"
                onClick={() =>
                  handleDeleteQuickReplyAction(nodeId, option.id, action.id)
                }
                sx={{
                  position: "absolute",
                  top: 4,
                  right: 4,
                  bgcolor: "white",
                  "&:hover": { bgcolor: "#FEE2E2", color: "#EF4444" },
                  width: 24,
                  height: 24,
                }}
              >
                <CloseIcon sx={{ fontSize: 16 }} />
              </IconButton>

              <Stack direction="row" spacing={1.5} alignItems="center">
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: 1.5,
                    bgcolor: actionType.color,
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {actionType.icon}
                </Box>
                <Box flex={1}>
                  <Typography sx={{ fontWeight: 600, fontSize: "13px", mb: 0.5 }}>
                    {actionType.title}
                  </Typography>
                  {action.type === "redirectLink" && (
                    <Typography
                      variant="caption"
                      sx={{ color: "#64748B", fontSize: "11px" }}
                    >
                      {action.config.redirectUrl}
                    </Typography>
                  )}
                  {action.type === "downloadFile" && (
                    <Typography
                      variant="caption"
                      sx={{ color: "#64748B", fontSize: "11px" }}
                    >
                      {action.config.downloadFile?.name}
                    </Typography>
                  )}
                  {action.type === "askToFollow" && (
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <InstagramIcon sx={{ fontSize: 14, color: "#64748B" }} />
                      <Typography
                        variant="caption"
                        sx={{ color: "#64748B", fontSize: "11px" }}
                      >
                        @{action.config.instagramPage}
                      </Typography>
                    </Stack>
                  )}
                </Box>
              </Stack>
            </Card>
          );
        })}
      </Stack>
    </Box>
  );
};

const isNotFollowingBranchVerification = (branchType) => {
  return branchType === "notFollowing";
};

// const handleAddButton = (nodeId, branchType) => {
//   // NEW CONSTRAINT: Prevent adding multiple buttons in "notFollowing" branch
//   const node = flowNodes.find((n) => n.id === nodeId);
//   if (node && node.type === "followCheck") {
//     if (branchType === "notFollowing" && node.notFollowingButtons.length >= 1) {
//       toast.warning(
//         "Only one verification button allowed. User must follow to proceed."
//       );
//       return;
//     }
//   }

//   const updatedNodes = flowNodes.map((node) => {
//     if (node.id === nodeId && node.type === "followCheck") {
//       const newButton = {
//         id: Date.now(),
//         text: `Button ${
//           branchType === "following"
//             ? node.followingButtons.length + 1
//             : node.notFollowingButtons.length + 1
//         }`,
//         actions: [],
//       };

//       if (branchType === "following") {
//         return {
//           ...node,
//           followingButtons: [...node.followingButtons, newButton],
//         };
//       } else {
//         return {
//           ...node,
//           notFollowingButtons: [...node.notFollowingButtons, newButton],
//         };
//       }
//     }
//     return node;
//   });
//   setFlowNodes(updatedNodes);
//   toast.success("Button added!");
// };


const renderButtonFlowNodes = (node, branchType, buttons, color) => {
  const totalOptions = buttons.length;
  const splitY = 40, downHeight = 60;

  let anchors = [];
  if (totalOptions === 1) {
    anchors = ["50%"];
  } else if (totalOptions === 2) {
    anchors = ["15%", "85%"];
  } else if (totalOptions > 2) {
    const step = 70 / (totalOptions - 1);
    anchors = Array.from({ length: totalOptions }, (_, i) => `${15 + step * i}%`);
  }

  return (
    <Box sx={{ width: "100%", mt: 3 }}>
      {/* Connection lines from parent to buttons */}
      <Box sx={{ position: "relative", height: splitY + downHeight, mb: 2 }}>
        {/* Vertical line from parent */}
        <Box
          sx={{
            position: "absolute",
            left: "50%",
            top: 0,
            width: 3,
            height: splitY,
            bgcolor: color,
            transform: "translateX(-50%)",
            zIndex: 2,
          }}
        />
        {/* Horizontal line connecting buttons */}
        {totalOptions > 1 && (
          <Box
            sx={{
              position: "absolute",
              left: "15%",
              width: "70%",
              top: splitY - 2,
              height: 3,
              bgcolor: color,
              zIndex: 1,
            }}
          />
        )}
        {/* Vertical lines going down to each button */}
        {anchors.map((anchor) => (
          <Box
            key={anchor}
            sx={{
              position: "absolute",
              left: anchor,
              top: splitY,
              width: 3,
              height: downHeight,
              bgcolor: color,
              transform: "translateX(-50%)",
              zIndex: 1,
            }}
          />
        ))}
      </Box>

      {/* Button Cards Grid */}
      <Grid container spacing={2} justifyContent="space-between">
        {buttons.map((btn) => (
          <Grid
            item
            xs={12}
            md={totalOptions === 1 ? 12 : totalOptions === 2 ? 6 : 4}
            key={btn.id}
          >
            <Card
              elevation={0}
              sx={{
                p: 2,
                borderRadius: 2,
                border: `2px solid ${color}`,
                bgcolor: "white",
                position: "relative",
              }}
            >
              {/* Delete button - hide for notFollowing branch and only show if >1 button */}
              {buttons.length > 1 && branchType !== "notFollowing" && (
                <IconButton
                  size="small"
                  onClick={() =>
                    handleDeleteButton(node.id, branchType, btn.id)
                  }
                  sx={{
                    position: "absolute",
                    top: 4,
                    right: 4,
                    bgcolor: "white",
                    "&:hover": { bgcolor: "#FEE2E2", color: "#EF4444" },
                  }}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              )}

              <Stack spacing={1.5}>
                {/* CRITICAL: Different rendering for notFollowing branch */}
                {branchType === "notFollowing" ? (
                  // READ-ONLY "Following" button for verification
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: 1,
                      bgcolor: "#FEF2F2",
                      border: "1px solid #FECACA",
                      textAlign: "center",
                    }}
                  >
                    <Typography
                      sx={{
                        fontWeight: 600,
                        color: "#DC2626",
                        fontSize: "14px",
                      }}
                    >
                      🔗 Following
                    </Typography>
                  
                  </Box>
                ) : (
                  // Editable button text for "following" branch
                  <TextField
                    fullWidth
                    size="small"
                    label="Button Text"
                    value={btn.text}
                    onChange={(e) =>
                      handleUpdateButtonText(
                        node.id,
                        branchType,
                        btn.id,
                        e.target.value
                      )
                    }
                  />
                )}

                {/* Actions Section - only for "following" branch */}
                {branchType === "following" ? (
                  <>
                    {renderButtonActions(node.id, branchType, btn, color)}

                    {/* Show "Add Action" only if no actions exist */}
                    {btn.actions.length === 0 && (
                      <Box>
                        <Typography
                          variant="caption"
                          sx={{ color: "#64748B", display: "block", mb: 1 }}
                        >
                          When user clicks "{btn.text}"
                        </Typography>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<AddCircleOutlineIcon />}
                          fullWidth
                          onClick={() =>
                            handleOpenAddActionDialog(node.id, branchType, btn.id)
                          }
                          sx={{
                            textTransform: "none",
                            borderStyle: "dashed",
                            color: color,
                            borderColor: color,
                            "&:hover": {
                              bgcolor: "#F0FDF4",
                              borderColor: color,
                            },
                          }}
                        >
                          Add Action
                        </Button>
                      </Box>
                    )}
                  </>
                ) : (
                  // Info box for notFollowing branch - NO ACTIONS ALLOWED
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 1,
                      bgcolor: "#FFFBEB",
                      border: "1px dashed #FBBF24",
                    }}
                  >
                   
                    <Typography
                      variant="caption"
                      sx={{
                        color: "#64748B",
                        display: "block",
                        fontSize: "11px",
                      }}
                    >
                      User clicks Following button after following
                    </Typography>
                  </Box>
                )}
              </Stack>
            </Card>

            {/* Render Quick Reply if exists in button actions - only for "following" branch */}
            {branchType === "following" &&
              renderButtonQuickReply(node.id, branchType, btn)}
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};


const validateFollowCheckRules = (nodes) => {
  return nodes.map((node) => {
    if (node.type === "followCheck") {
      // Ensure notFollowing has exactly 1 button
      if (node.notFollowingButtons.length === 0) {
        node.notFollowingButtons = [
          {
            id: Date.now(),
            text: "Following",
            actions: [], // No actions allowed
          },
        ];
      }

      // Force exactly 1 button in notFollowing branch
      if (node.notFollowingButtons.length > 1) {
        node.notFollowingButtons = node.notFollowingButtons.slice(0, 1);
      }

      // Clear any actions from notFollowing button
      node.notFollowingButtons[0].actions = [];
      // Force button text to "Following"
      node.notFollowingButtons[0].text = "Following";
    }
    return node;
  });
};


  // Render Quick Reply options as branching nodes
const renderQuickReplyOptions = (node) => {
  const options = node.replyOptions ?? [];
  const totalOptions = options.length;
  const splitY = 40, downHeight = 60;

  let anchors = [];
  if (totalOptions === 1) {
    anchors = ["50%"];
  } else if (totalOptions === 2) {
    anchors = ["15%", "85%"];
  } else if (totalOptions > 2) {
    const step = 70 / (totalOptions - 1);
    anchors = Array.from({ length: totalOptions }, (_, i) => `${15 + step * i}%`);
  }

  return (
    <Box sx={{ width: "100%", mt: 3 }}>
      <Box sx={{ position: "relative", height: splitY + downHeight, mb: 2 }}>
        <Box sx={{ position: "absolute", left: "50%", top: 0, width: 3, height: splitY, bgcolor: "#F59E0B", transform: "translateX(-50%)", zIndex: 2 }}/>
        {totalOptions > 1 && (
          <Box sx={{ position: "absolute", left: "15%", width: "70%", top: splitY - 2, height: 3, bgcolor: "#F59E0B", zIndex: 1 }}/>
        )}
        {anchors.map(anchor => (
          <Box key={anchor} sx={{ position: "absolute", left: anchor, top: splitY, width: 3, height: downHeight, bgcolor: "#F59E0B", transform: "translateX(-50%)", zIndex: 1 }}/>
        ))}
      </Box>
      <Grid container spacing={2} justifyContent="space-between">
        {options.map((opt) => (
          <Grid item xs={12} md={totalOptions === 1 ? 12 : totalOptions === 2 ? 6 : 4} key={opt.id}>
            <Card elevation={0} sx={{ p: 2, borderRadius: 2, border: "2px solid #F59E0B", bgcolor: "white", position: "relative" }}>
              {totalOptions > 1 && (
                <IconButton size="small" onClick={() => handleDeleteQuickReplyOption(node.id, opt.id)}
                  sx={{ position: "absolute", top: 4, right: 4, bgcolor: "white", "&:hover": { bgcolor: "#FEE2E2", color: "#EF4444" } }}>
                  <CloseIcon fontSize="small" />
                </IconButton>
              )}
              <Stack spacing={1.5}>
                <TextField fullWidth size="small" label="Option Text" value={opt.text}
                  onChange={e => handleUpdateQuickReplyOption(node.id, opt.id, e.target.value)} />
                {renderQuickReplyOptionActions(node.id, opt)}
                {renderQuickReplyOptionQuickReply(node.id, opt)}
                {renderQuickReplyOptionFollowCheck(node.id, opt)}
                {(!opt.actions || opt.actions.length === 0) && (
                  <Box>
                    <Typography variant="caption" sx={{ color: "#64748B", display: "block", mb: 1 }}>
                      When user selects "{opt.text}"
                    </Typography>
                    <Button size="small" variant="outlined" startIcon={<AddCircleOutlineIcon />} fullWidth
                      onClick={() => handleOpenQuickReplyActionDialog(node.id, opt.id)}
                      sx={{
                        textTransform: "none", borderStyle: "dashed", color: "#F59E0B", borderColor: "#F59E0B",
                        "&:hover": { bgcolor: "#FFFBEB", borderColor: "#F59E0B" }
                      }}>
                      Add Action
                    </Button>
                  </Box>
                )}
              </Stack>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

// NEW: Render Follow Check inside Quick Reply option
// NEW: Render Follow Check inside Quick Reply option with full button rendering
const renderQuickReplyOptionFollowCheck = (nodeId, option) => {
  const followCheckAction = option.actions?.find((action) => action.type === "followCheck");
  
  if (!followCheckAction) return null;

  // Helper function to render buttons for nested Follow Check
  const renderNestedFollowCheckButtons = (branchType, buttons, color) => {
    const totalButtons = buttons.length;
    const splitY = 40, downHeight = 60;

    let anchors = [];
    if (totalButtons === 1) {
      anchors = ["50%"];
    } else if (totalButtons === 2) {
      anchors = ["15%", "85%"];
    } else if (totalButtons > 2) {
      const step = 70 / (totalButtons - 1);
      anchors = Array.from({ length: totalButtons }, (_, i) => `${15 + step * i}%`);
    }

    return (
      <Box sx={{ width: "100%", mt: 3 }}>
        <Box sx={{ position: "relative", height: splitY + downHeight, mb: 2 }}>
          <Box sx={{ position: "absolute", left: "50%", top: 0, width: 3, height: splitY, bgcolor: color, transform: "translateX(-50%)", zIndex: 2 }}/>
          {totalButtons > 1 && (
            <Box sx={{ position: "absolute", left: "15%", width: "70%", top: splitY - 2, height: 3, bgcolor: color, zIndex: 1 }}/>
          )}
          {anchors.map(anchor => (
            <Box key={anchor} sx={{ position: "absolute", left: anchor, top: splitY, width: 3, height: downHeight, bgcolor: color, transform: "translateX(-50%)", zIndex: 1 }}/>
          ))}
        </Box>
        <Grid container spacing={2} justifyContent="space-between">
          {buttons.map((btn) => (
            <Grid item xs={12} md={totalButtons === 1 ? 12 : totalButtons === 2 ? 6 : 4} key={btn.id}>
              <Card elevation={0} sx={{ p: 2, borderRadius: 2, border: `2px solid ${color}`, bgcolor: "white", position: "relative" }}>
                {buttons.length > 1 && (
                  <IconButton
                    size="small"
                    onClick={() => {
                      const updatedNodes = flowNodes.map((node) => {
                        if (node.id === nodeId && node.type === "quickReply") {
                          return {
                            ...node,
                            replyOptions: node.replyOptions.map((opt) =>
                              opt.id === option.id
                                ? {
                                    ...opt,
                                    actions: opt.actions.map((action) =>
                                      action.id === followCheckAction.id
                                        ? {
                                            ...action,
                                            [branchType === "following" ? "followingButtons" : "notFollowingButtons"]:
                                              action[branchType === "following" ? "followingButtons" : "notFollowingButtons"].filter(
                                                (b) => b.id !== btn.id
                                              ),
                                          }
                                        : action
                                    ),
                                  }
                                : opt
                            ),
                          };
                        }
                        return node;
                      });
                      setFlowNodes(updatedNodes);
                      toast.info("Button removed");
                    }}
                    sx={{
                      position: "absolute",
                      top: 4,
                      right: 4,
                      bgcolor: "white",
                      "&:hover": { bgcolor: "#FEE2E2", color: "#EF4444" },
                    }}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                )}

                <Stack spacing={1.5}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Button Text"
                    value={btn.text}
                    onChange={(e) => {
                      const updatedNodes = flowNodes.map((node) => {
                        if (node.id === nodeId && node.type === "quickReply") {
                          return {
                            ...node,
                            replyOptions: node.replyOptions.map((opt) =>
                              opt.id === option.id
                                ? {
                                    ...opt,
                                    actions: opt.actions.map((action) =>
                                      action.id === followCheckAction.id
                                        ? {
                                            ...action,
                                            [branchType === "following" ? "followingButtons" : "notFollowingButtons"]:
                                              action[branchType === "following" ? "followingButtons" : "notFollowingButtons"].map((b) =>
                                                b.id === btn.id ? { ...b, text: e.target.value } : b
                                              ),
                                          }
                                        : action
                                    ),
                                  }
                                : opt
                            ),
                          };
                        }
                        return node;
                      });
                      setFlowNodes(updatedNodes);
                    }}
                  />
                </Stack>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  };

  return (
    <Box sx={{ width: "100%", mt: 3 }}>
      {/* Connection line */}
      <Box sx={{ position: "relative", height: 60, mb: 2 }}>
        <Box
          sx={{
            position: "absolute",
            left: "50%",
            top: 0,
            width: 3,
            height: 60,
            bgcolor: "#10B981",
            transform: "translateX(-50%)",
          }}
        />
      </Box>

      {/* Follow Check Node */}
      <Card
        elevation={0}
        sx={{
          p: 2.5,
          borderRadius: 3,
          border: "2px solid #10B981",
          bgcolor: "#F0FDF4",
          position: "relative",
        }}
      >
        <IconButton
          size="small"
          onClick={() =>
            handleDeleteQuickReplyAction(nodeId, option.id, followCheckAction.id)
          }
          sx={{
            position: "absolute",
            top: 8,
            right: 8,
            bgcolor: "white",
            "&:hover": { bgcolor: "#FEE2E2", color: "#EF4444" },
          }}
        >
          <DeleteOutlineIcon fontSize="small" />
        </IconButton>

        <Stack direction="row" spacing={2} alignItems="flex-start" mb={2}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 2,
              bgcolor: "#10B981",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <PersonIcon />
          </Box>
          <Box flex={1}>
            <Typography sx={{ fontWeight: 700, fontSize: "16px", mb: 0.5 }}>
              Follow Check
            </Typography>
            <Typography variant="caption" sx={{ color: "#64748B" }}>
              Check whether user is following or not
            </Typography>
          </Box>
        </Stack>
      </Card>

      {/* Render Follow Check branches */}
      <Box sx={{ width: "100%", mt: 0 }}>
        <Box sx={{ position: "relative", height: 90, mb: 2 }}>
          {/* Vertical line down */}
          <Box
            sx={{
              position: "absolute",
              left: "50%",
              top: 0,
              width: 3,
              height: 30,
              bgcolor: "#10B981",
              transform: "translateX(-50%)",
              zIndex: 2,
            }}
          />
          {/* Horizontal split line */}
          <Box
            sx={{
              position: "absolute",
              left: "10%",
              width: "80%",
              top: 28,
              height: 3,
              bgcolor: "#10B981",
              zIndex: 1,
            }}
          />
          {/* Left branch (Following) */}
          <Box
            sx={{
              position: "absolute",
              left: "25%",
              top: 30,
              width: 3,
              height: 60,
              bgcolor: "#10B981",
              transform: "translateX(-50%)",
              zIndex: 1,
            }}
          />
          {/* Right branch (Not Following) */}
          <Box
            sx={{
              position: "absolute",
              left: "75%",
              top: 30,
              width: 3,
              height: 60,
              bgcolor: "#10B981",
              transform: "translateX(-50%)",
              zIndex: 1,
            }}
          />
        </Box>

        <Grid container spacing={3}>
          {/* LEFT: User Following */}
          <Grid item xs={12} md={6}>
            <Card
              elevation={0}
              sx={{
                p: 2.5,
                borderRadius: 3,
                border: "2px solid #10B981",
                bgcolor: "#F0FDF4",
              }}
            >
              <Stack direction="row" spacing={1.5} alignItems="center" mb={2}>
                <CheckCircleIcon sx={{ color: "#10B981", fontSize: 28 }} />
                <Typography sx={{ fontWeight: 700, fontSize: "15px" }}>
                  User Following
                </Typography>
              </Stack>

              <Stack spacing={2}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  size="small"
                  label="Message"
                  value={followCheckAction.config?.followCheckYesMessage || ""}
                  onChange={(e) => {
                    const updatedNodes = flowNodes.map((node) => {
                      if (node.id === nodeId && node.type === "quickReply") {
                        return {
                          ...node,
                          replyOptions: node.replyOptions.map((opt) =>
                            opt.id === option.id
                              ? {
                                  ...opt,
                                  actions: opt.actions.map((action) =>
                                    action.id === followCheckAction.id
                                      ? {
                                          ...action,
                                          config: {
                                            ...action.config,
                                            followCheckYesMessage: e.target.value,
                                          },
                                        }
                                      : action
                                  ),
                                }
                              : opt
                          ),
                        };
                      }
                      return node;
                    });
                    setFlowNodes(updatedNodes);
                  }}
                />

                <Button
                  size="small"
                  variant="text"
                  startIcon={<AddIcon />}
                  onClick={() => {
                    const updatedNodes = flowNodes.map((node) => {
                      if (node.id === nodeId && node.type === "quickReply") {
                        return {
                          ...node,
                          replyOptions: node.replyOptions.map((opt) =>
                            opt.id === option.id
                              ? {
                                  ...opt,
                                  actions: opt.actions.map((action) =>
                                    action.id === followCheckAction.id
                                      ? {
                                          ...action,
                                          followingButtons: [
                                            ...(action.followingButtons || []),
                                            {
                                              id: Date.now(),
                                              text: `Button ${(action.followingButtons?.length || 0) + 1}`,
                                              actions: [],
                                            },
                                          ],
                                        }
                                      : action
                                  ),
                                }
                              : opt
                          ),
                        };
                      }
                      return node;
                    });
                    setFlowNodes(updatedNodes);
                    toast.success("Button added!");
                  }}
                  sx={{
                    textTransform: "none",
                    color: "#10B981",
                    justifyContent: "flex-start",
                    "&:hover": {
                      bgcolor: "#F0FDF4",
                    },
                  }}
                >
                  Add Button
                </Button>
              </Stack>
            </Card>

            {/* Render following buttons */}
            {followCheckAction.followingButtons && followCheckAction.followingButtons.length > 0 &&
              renderNestedFollowCheckButtons("following", followCheckAction.followingButtons, "#10B981")}
          </Grid>

          {/* RIGHT: User Not Following */}
          <Grid item xs={12} md={6}>
            <Card
              elevation={0}
              sx={{
                p: 2.5,
                borderRadius: 3,
                border: "2px solid #EF4444",
                bgcolor: "#FEF2F2",
              }}
            >
              <Stack direction="row" spacing={1.5} alignItems="center" mb={2}>
                <CancelIcon sx={{ color: "#EF4444", fontSize: 28 }} />
                <Typography sx={{ fontWeight: 700, fontSize: "15px" }}>
                  User Not Following
                </Typography>
              </Stack>

              <Stack spacing={2}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  size="small"
                  label="Message"
                  value={followCheckAction.config?.followCheckNoMessage || ""}
                  onChange={(e) => {
                    const updatedNodes = flowNodes.map((node) => {
                      if (node.id === nodeId && node.type === "quickReply") {
                        return {
                          ...node,
                          replyOptions: node.replyOptions.map((opt) =>
                            opt.id === option.id
                              ? {
                                  ...opt,
                                  actions: opt.actions.map((action) =>
                                    action.id === followCheckAction.id
                                      ? {
                                          ...action,
                                          config: {
                                            ...action.config,
                                            followCheckNoMessage: e.target.value,
                                          },
                                        }
                                      : action
                                  ),
                                }
                              : opt
                          ),
                        };
                      }
                      return node;
                    });
                    setFlowNodes(updatedNodes);
                  }}
                />

                <Button
                  size="small"
                  variant="text"
                  startIcon={<AddIcon />}
                  onClick={() => {
                    const updatedNodes = flowNodes.map((node) => {
                      if (node.id === nodeId && node.type === "quickReply") {
                        return {
                          ...node,
                          replyOptions: node.replyOptions.map((opt) =>
                            opt.id === option.id
                              ? {
                                  ...opt,
                                  actions: opt.actions.map((action) =>
                                    action.id === followCheckAction.id
                                      ? {
                                          ...action,
                                          notFollowingButtons: [
                                            ...(action.notFollowingButtons || []),
                                            {
                                              id: Date.now(),
                                              text: `Button ${(action.notFollowingButtons?.length || 0) + 1}`,
                                              actions: [],
                                            },
                                          ],
                                        }
                                      : action
                                  ),
                                }
                              : opt
                          ),
                        };
                      }
                      return node;
                    });
                    setFlowNodes(updatedNodes);
                    toast.success("Button added!");
                  }}
                  sx={{
                    textTransform: "none",
                    color: "#EF4444",
                    justifyContent: "flex-start",
                    "&:hover": {
                      bgcolor: "#FEF2F2",
                    },
                  }}
                >
                  Add Button
                </Button>
              </Stack>
            </Card>

            {/* Render not following buttons */}
            {followCheckAction.notFollowingButtons && followCheckAction.notFollowingButtons.length > 0 &&
              renderNestedFollowCheckButtons("notFollowing", followCheckAction.notFollowingButtons, "#EF4444")}
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};




  // NEW: Render nested Quick Reply for main-flow Quick Reply options (RECURSIVE)
const renderQuickReplyOptionQuickReply = (nodeId, option) => {
  const quickReplyAction = option.actions?.find(action => action.type === "quickReply");
  if (!quickReplyAction) return null;

  return (
    <Box sx={{ width: "100%", mt: 3 }}>
      {/* Connection line from above */}
      <Box sx={{ position: "relative", height: 60, mb: 2 }}>
        <Box
          sx={{
            position: "absolute",
            left: "50%",
            top: 0,
            width: 3,
            height: 60,
            bgcolor: "#F59E0B",
            transform: "translateX(-50%)",
          }}
        />
      </Box>
      {/* Nested Quick Reply Node */}
      <Card
        elevation={0}
        sx={{
          p: 2.5,
          borderRadius: 3,
          border: "2px solid #F59E0B",
          bgcolor: "#FFFBEB",
          position: "relative",
        }}
      >
        <IconButton
          size="small"
          onClick={() =>
            handleDeleteQuickReplyAction(nodeId, option.id, quickReplyAction.id)
          }
          sx={{
            position: "absolute",
            top: 8,
            right: 8,
            bgcolor: "white",
            "&:hover": { bgcolor: "#FEE2E2", color: "#EF4444" },
          }}
        >
          <DeleteOutlineIcon fontSize="small" />
        </IconButton>
        <Stack direction="row" spacing={2} alignItems="flex-start" mb={2}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 2,
              bgcolor: "#F59E0B",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <QuizIcon />
          </Box>
          <Box flex={1}>
            <Typography sx={{ fontWeight: 700, fontSize: "16px", mb: 0.5 }}>
              Quick Replies (Nested)
            </Typography>
            <Typography variant="caption" sx={{ color: "#64748B" }}>
              Ask question with quick reply options
            </Typography>
          </Box>
        </Stack>
        <Stack spacing={2}>
          <TextField
            fullWidth
            multiline
            rows={2}
            size="small"
            label="Question"
            placeholder="What would you like to do?"
            value={quickReplyAction.config.quickReplyQuestion}
            onChange={e => {
              const updatedNodes = flowNodes.map(node => {
                if (node.id === nodeId && node.type === "quickReply") {
                  return {
                    ...node,
                    replyOptions: node.replyOptions.map(opt =>
                      opt.id === option.id
                        ? {
                            ...opt,
                            actions: opt.actions.map(action =>
                              action.id === quickReplyAction.id
                                ? {
                                    ...action,
                                    config: { ...action.config, quickReplyQuestion: e.target.value }
                                  }
                                : action
                            )
                          }
                        : opt
                    )
                  };
                }
                return node;
              });
              setFlowNodes(updatedNodes);
            }}
          />
          <Button
            size="small"
            variant="text"
            startIcon={<AddIcon />}
            onClick={() => {
              const updatedNodes = flowNodes.map(node => {
                if (node.id === nodeId && node.type === "quickReply") {
                  return {
                    ...node,
                    replyOptions: node.replyOptions.map(opt =>
                      opt.id === option.id
                        ? {
                            ...opt,
                            actions: opt.actions.map(action =>
                              action.id === quickReplyAction.id
                                ? {
                                    ...action,
                                    replyOptions: [
                                      ...(action.replyOptions || []),
                                      {
                                        id: Date.now(),
                                        text: `Option ${(action.replyOptions?.length || 0) + 1}`,
                                        actions: [],
                                      }
                                    ]
                                  }
                                : action
                            )
                          }
                        : opt
                    )
                  };
                }
                return node;
              });
              setFlowNodes(updatedNodes);
              toast.success("Option added!");
            }}
            sx={{
              textTransform: "none",
              color: "#F59E0B",
              justifyContent: "flex-start",
              "&:hover": { bgcolor: "#FFFBEB" }
            }}
          >
            Add Option
          </Button>
        </Stack>
      </Card>
      {/* Recursively render further nested options */}
      {renderNestedQuickReplyOptionsForMainFlow(nodeId, option.id, quickReplyAction)}
    </Box>
  );
};


  // NEW: Render nested Quick Reply options for main-flow Quick Replies (supports infinite nesting)
const renderNestedQuickReplyOptionsForMainFlow = (nodeId, parentOptionId, quickReplyAction) => {
  const options = quickReplyAction.replyOptions ?? [];
  const totalOptions = options.length;
  if (totalOptions === 0) return null;
  const splitY = 40, downHeight = 60;

  let anchors = [];
  if (totalOptions === 1) {
    anchors = ["50%"];
  } else if (totalOptions === 2) {
    anchors = ["15%", "85%"];
  } else if (totalOptions > 2) {
    const step = 70 / (totalOptions - 1);
    anchors = Array.from({ length: totalOptions }, (_, i) => `${15 + step * i}%`);
  }

  return (
    <Box sx={{ width: "100%", mt: 3 }}>
      <Box sx={{ position: "relative", height: splitY + downHeight, mb: 2 }}>
        <Box sx={{ position: "absolute", left: "50%", top: 0, width: 3, height: splitY, bgcolor: "#F59E0B", transform: "translateX(-50%)", zIndex: 2 }}/>
        {totalOptions > 1 && (
          <Box sx={{ position: "absolute", left: "15%", width: "70%", top: splitY - 2, height: 3, bgcolor: "#F59E0B", zIndex: 1 }}/>
        )}
        {anchors.map(anchor => (
          <Box key={anchor} sx={{ position: "absolute", left: anchor, top: splitY, width: 3, height: downHeight, bgcolor: "#F59E0B", transform: "translateX(-50%)", zIndex: 1 }}/>
        ))}
      </Box>
      <Grid container spacing={2} justifyContent="space-between">
        {options.map((opt, idx) => (
          <Grid item xs={12} md={totalOptions === 1 ? 12 : totalOptions === 2 ? 6 : 4} key={opt.id}>
            <Card elevation={0} sx={{ p: 2, borderRadius: 2, border: "2px solid #F59E0B", bgcolor: "white", position: "relative" }}>
              {totalOptions > 1 && (
                <IconButton size="small" onClick={() => {
                    const updatedNodes = flowNodes.map((node) => {
                      if (node.id === nodeId && node.type === "quickReply") {
                        return {
                          ...node,
                          replyOptions: node.replyOptions.map((parentOpt) =>
                            parentOpt.id === parentOptionId
                              ? {
                                  ...parentOpt,
                                  actions: parentOpt.actions.map((action) =>
                                    action.id === quickReplyAction.id
                                      ? {
                                          ...action,
                                          replyOptions: action.replyOptions.filter((o) => o.id !== opt.id)
                                        }
                                      : action
                                  )
                                }
                              : parentOpt
                          )
                        };
                      }
                      return node;
                    });
                    setFlowNodes(updatedNodes);
                    toast.info("Option removed");
                  }}
                  sx={{
                    position: "absolute",
                    top: 4,
                    right: 4,
                    bgcolor: "white",
                    "&:hover": { bgcolor: "#FEE2E2", color: "#EF4444" },
                  }}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              )}
              <Stack spacing={1.5}>
                <TextField
                  fullWidth
                  size="small"
                  label="Option Text"
                  value={opt.text}
                  onChange={(e) => {
                    const updatedNodes = flowNodes.map((node) => {
                      if (node.id === nodeId && node.type === "quickReply") {
                        return {
                          ...node,
                          replyOptions: node.replyOptions.map((parentOpt) =>
                            parentOpt.id === parentOptionId
                              ? {
                                  ...parentOpt,
                                  actions: parentOpt.actions.map((action) =>
                                    action.id === quickReplyAction.id
                                      ? {
                                          ...action,
                                          replyOptions: action.replyOptions.map((o) =>
                                            o.id === opt.id ? { ...o, text: e.target.value } : o
                                          )
                                        }
                                      : action
                                  )
                                }
                              : parentOpt
                          )
                        };
                      }
                      return node;
                    });
                    setFlowNodes(updatedNodes);
                  }}
                />
                {/* Render any non-quickReply actions for this nested option */}
                {renderNestedOptionActions(nodeId, parentOptionId, quickReplyAction, opt)}

                {/* Recursive: more nested quick replies */}
                {opt.actions?.some(a => a.type === "quickReply") &&
                  renderDeepNestedQuickReply(nodeId, parentOptionId, quickReplyAction, opt)
                }

                {/* Show Add Action only if no actions */}
                {(!opt.actions || opt.actions.length === 0) && (
                  <Box>
                    <Typography
                      variant="caption"
                      sx={{ color: "#64748B", display: "block", mb: 1 }}
                    >
                      When user selects "{opt.text}"
                    </Typography>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<AddCircleOutlineIcon />}
                      fullWidth
                      onClick={() => {
                        setActionContext({
                          nodeId: nodeId,
                          parentOptionId: parentOptionId,
                          quickReplyActionId: quickReplyAction.id,
                          optionId: opt.id,
                          type: "quickReply"
                        });
                        resetNodeConfig();
                        setDialogOpen(true);
                      }}
                      sx={{
                        textTransform: "none",
                        borderStyle: "dashed",
                        color: "#F59E0B",
                        borderColor: "#F59E0B",
                        "&:hover": {
                          bgcolor: "#FFFBEB",
                          borderColor: "#F59E0B",
                        },
                      }}
                    >
                      Add Action
                    </Button>
                  </Box>
                )}
              </Stack>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};



  // NEW: Render non-quickReply actions for deeply nested options
  const renderNestedOptionActions = (nodeId, parentOptionId, quickReplyAction, option) => {
    if (!option.actions || option.actions.length === 0) return null;

    const nonQuickReplyActions = option.actions.filter((action) => action.type !== "quickReply");
    
    if (nonQuickReplyActions.length === 0) return null;

    return (
      <Box sx={{ mt: 2 }}>
        <Stack spacing={1}>
          {nonQuickReplyActions.map((action) => {
            const actionType = actionTypes.find((at) => at.type === action.type);
            if (!actionType) return null;

            return (
              <Card
                key={action.id}
                elevation={0}
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  border: "1px solid",
                  borderColor: actionType.color,
                  bgcolor: actionType.bgColor,
                  position: "relative",
                }}
              >
                <IconButton
                  size="small"
                  onClick={() => {
                    const updatedNodes = flowNodes.map((node) => {
                      if (node.id === nodeId && node.type === "quickReply") {
                        return {
                          ...node,
                          replyOptions: node.replyOptions.map((parentOpt) =>
                            parentOpt.id === parentOptionId
                              ? {
                                  ...parentOpt,
                                  actions: parentOpt.actions.map((act) =>
                                    act.id === quickReplyAction.id
                                      ? {
                                          ...act,
                                          replyOptions: act.replyOptions.map((opt) =>
                                            opt.id === option.id
                                              ? {
                                                  ...opt,
                                                  actions: opt.actions.filter(
                                                    (a) => a.id !== action.id
                                                  ),
                                                }
                                              : opt
                                          ),
                                        }
                                      : act
                                  ),
                                }
                              : parentOpt
                          ),
                        };
                      }
                      return node;
                    });
                    setFlowNodes(updatedNodes);
                    toast.info("Action removed");
                  }}
                  sx={{
                    position: "absolute",
                    top: 4,
                    right: 4,
                    bgcolor: "white",
                    "&:hover": { bgcolor: "#FEE2E2", color: "#EF4444" },
                    width: 24,
                    height: 24,
                  }}
                >
                  <CloseIcon sx={{ fontSize: 16 }} />
                </IconButton>

                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: 1.5,
                      bgcolor: actionType.color,
                      color: "white",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    {actionType.icon}
                  </Box>
                  <Box flex={1}>
                    <Typography sx={{ fontWeight: 600, fontSize: "13px", mb: 0.5 }}>
                      {actionType.title}
                    </Typography>
                    {action.type === "redirectLink" && (
                      <Typography
                        variant="caption"
                        sx={{ color: "#64748B", fontSize: "11px" }}
                      >
                        {action.config.redirectUrl}
                      </Typography>
                    )}
                    {action.type === "downloadFile" && (
                      <Typography
                        variant="caption"
                        sx={{ color: "#64748B", fontSize: "11px" }}
                      >
                        {action.config.downloadFile?.name}
                      </Typography>
                    )}
                    {action.type === "askToFollow" && (
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <InstagramIcon sx={{ fontSize: 14, color: "#64748B" }} />
                        <Typography
                          variant="caption"
                          sx={{ color: "#64748B", fontSize: "11px" }}
                        >
                          @{action.config.instagramPage}
                        </Typography>
                      </Stack>
                    )}
                  </Box>
                </Stack>
              </Card>
            );
          })}
        </Stack>
      </Box>
    );
  };

  // NEW: Support infinite nesting of Quick Replies - RECURSIVE FUNCTION
// Replace the renderDeepNestedQuickReply function with this:
const renderDeepNestedQuickReply = (nodeId, parentOptionId, parentQRAction, option) => {
  const nestedQuickReply = option.actions?.find((action) => action.type === "quickReply");
  
  if (!nestedQuickReply) return null;

  return (
    <Box sx={{ width: "100%", mt: 3 }}>
      {/* Connection line */}
      <Box sx={{ position: "relative", height: 60, mb: 2 }}>
        <Box
          sx={{
            position: "absolute",
            left: "50%",
            top: 0,
            width: 3,
            height: 60,
            bgcolor: "#F59E0B",
            transform: "translateX(-50%)",
          }}
        />
      </Box>

      {/* Nested Quick Reply Card */}
      <Card
        elevation={0}
        sx={{
          p: 2.5,
          borderRadius: 3,
          border: "2px solid #F59E0B",
          bgcolor: "#FFFBEB",
          position: "relative",
        }}
      >
        <IconButton
          size="small"
          onClick={() => {
            const updatedNodes = flowNodes.map((node) => {
              if (node.id === nodeId && node.type === "quickReply") {
                return {
                  ...node,
                  replyOptions: node.replyOptions.map((parentOpt) =>
                    parentOpt.id === parentOptionId
                      ? {
                          ...parentOpt,
                          actions: parentOpt.actions.map((act) =>
                            act.id === parentQRAction.id
                              ? {
                                  ...act,
                                  replyOptions: act.replyOptions.map((opt) =>
                                    opt.id === option.id
                                      ? {
                                          ...opt,
                                          actions: opt.actions.filter(
                                            (a) => a.id !== nestedQuickReply.id
                                          ),
                                        }
                                      : opt
                                  ),
                                }
                              : act
                          ),
                        }
                      : parentOpt
                  ),
                };
              }
              return node;
            });
            setFlowNodes(updatedNodes);
            toast.info("Nested Quick Reply removed");
          }}
          sx={{
            position: "absolute",
            top: 8,
            right: 8,
            bgcolor: "white",
            "&:hover": { bgcolor: "#FEE2E2", color: "#EF4444" },
          }}
        >
          <DeleteOutlineIcon fontSize="small" />
        </IconButton>

        <Stack direction="row" spacing={2} alignItems="flex-start" mb={2}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 2,
              bgcolor: "#F59E0B",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <QuizIcon />
          </Box>
          <Box flex={1}>
            <Typography sx={{ fontWeight: 700, fontSize: "16px", mb: 0.5 }}>
              Quick Replies (Nested)
            </Typography>
            <Typography variant="caption" sx={{ color: "#64748B" }}>
              Ask question with quick reply options
            </Typography>
          </Box>
        </Stack>

        <Stack spacing={2}>
          <TextField
            fullWidth
            multiline
            rows={2}
            size="small"
            label="Question"
            placeholder="What would you like to do?"
            value={nestedQuickReply.config.quickReplyQuestion}
            onChange={(e) => {
              const updatedNodes = flowNodes.map((node) => {
                if (node.id === nodeId && node.type === "quickReply") {
                  return {
                    ...node,
                    replyOptions: node.replyOptions.map((parentOpt) =>
                      parentOpt.id === parentOptionId
                        ? {
                            ...parentOpt,
                            actions: parentOpt.actions.map((act) =>
                              act.id === parentQRAction.id
                                ? {
                                    ...act,
                                    replyOptions: act.replyOptions.map((opt) =>
                                      opt.id === option.id
                                        ? {
                                            ...opt,
                                            actions: opt.actions.map((a) =>
                                              a.id === nestedQuickReply.id
                                                ? {
                                                    ...a,
                                                    config: {
                                                      ...a.config,
                                                      quickReplyQuestion: e.target.value,
                                                    },
                                                  }
                                                : a
                                            ),
                                          }
                                        : opt
                                    ),
                                  }
                                : act
                            ),
                          }
                        : parentOpt
                    ),
                  };
                }
                return node;
              });
              setFlowNodes(updatedNodes);
            }}
          />

          <Button
            size="small"
            variant="text"
            startIcon={<AddIcon />}
            onClick={() => {
              const updatedNodes = flowNodes.map((node) => {
                if (node.id === nodeId && node.type === "quickReply") {
                  return {
                    ...node,
                    replyOptions: node.replyOptions.map((parentOpt) =>
                      parentOpt.id === parentOptionId
                        ? {
                            ...parentOpt,
                            actions: parentOpt.actions.map((act) =>
                              act.id === parentQRAction.id
                                ? {
                                    ...act,
                                    replyOptions: act.replyOptions.map((opt) =>
                                      opt.id === option.id
                                        ? {
                                            ...opt,
                                            actions: opt.actions.map((a) =>
                                              a.id === nestedQuickReply.id
                                                ? {
                                                    ...a,
                                                    replyOptions: [
                                                      ...(a.replyOptions || []),
                                                      {
                                                        id: Date.now(),
                                                        text: `Option ${(a.replyOptions?.length || 0) + 1}`,
                                                        actions: [],
                                                      },
                                                    ],
                                                  }
                                                : a
                                            ),
                                          }
                                        : opt
                                    ),
                                  }
                                : act
                            ),
                          }
                        : parentOpt
                    ),
                  };
                }
                return node;
              });
              setFlowNodes(updatedNodes);
              toast.success("Option added!");
            }}
            sx={{
              textTransform: "none",
              color: "#F59E0B",
              justifyContent: "flex-start",
              "&:hover": {
                bgcolor: "#FFFBEB",
              },
            }}
          >
            Add Option
          </Button>
        </Stack>
      </Card>

      {/* Render nested options */}
      {renderDeepNestedQuickReplyOptions(nodeId, parentOptionId, parentQRAction, option.id, nestedQuickReply)}
    </Box>
  );
};

// NEW FUNCTION: Render options for deeply nested Quick Reply
const renderDeepNestedQuickReplyOptions = (nodeId, parentOptionId, parentQRAction, optionId, nestedQuickReply) => {
  const options = nestedQuickReply.replyOptions || [];

  if (options.length === 0) return null;

  return (
    <Box sx={{ width: "100%", mt: 3 }}>
      {/* Branching lines */}
      <Box
        sx={{ position: "relative", height: options.length > 1 ? 100 : 60, mb: 2 }}
      >
        <Box
          sx={{
            position: "absolute",
            left: "50%",
            top: 0,
            width: 3,
            height: options.length > 1 ? 40 : 60,
            bgcolor: "#F59E0B",
            transform: "translateX(-50%)",
          }}
        />

        {options.length > 1 && (
          <>
            <Box
              sx={{
                position: "absolute",
                left: "15%",
                right: "15%",
                top: 40,
                height: 3,
                bgcolor: "#F59E0B",
              }}
            />

            {options.map((opt, index) => {
              const totalOptions = options.length;

              const stepPercent = 100 / (totalOptions + 1)
const leftPosition = stepPercent * (index + 1)
              return (
                <Box
                  key={opt.id}
                  sx={{
                    position: "absolute",
                    left: `${leftPosition}%`,
                    top: 40,
                    width: 3,
                    height: 60,
                    bgcolor: "#F59E0B",
                    transform: "translateX(-50%)",
                  }}
                />
              );
            })}
          </>
        )}
      </Box>

      {/* Option nodes */}
      <Grid container spacing={2}>
        {options.map((opt) => (
          <Grid
            item
            xs={12}
            md={options.length === 1 ? 12 : options.length === 2 ? 6 : 4}
            key={opt.id}
          >
            <Card
              elevation={0}
              sx={{
                p: 2,
                borderRadius: 2,
                border: "2px solid #F59E0B",
                bgcolor: "white",
                position: "relative",
              }}
            >
              {options.length > 1 && (
                <IconButton
                  size="small"
                  onClick={() => {
                    const updatedNodes = flowNodes.map((node) => {
                      if (node.id === nodeId && node.type === "quickReply") {
                        return {
                          ...node,
                          replyOptions: node.replyOptions.map((parentOpt) =>
                            parentOpt.id === parentOptionId
                              ? {
                                  ...parentOpt,
                                  actions: parentOpt.actions.map((act) =>
                                    act.id === parentQRAction.id
                                      ? {
                                          ...act,
                                          replyOptions: act.replyOptions.map((middleOpt) =>
                                            middleOpt.id === optionId
                                              ? {
                                                  ...middleOpt,
                                                  actions: middleOpt.actions.map((a) =>
                                                    a.id === nestedQuickReply.id
                                                      ? {
                                                          ...a,
                                                          replyOptions: a.replyOptions.filter(
                                                            (o) => o.id !== opt.id
                                                          ),
                                                        }
                                                      : a
                                                  ),
                                                }
                                              : middleOpt
                                          ),
                                        }
                                      : act
                                  ),
                                }
                              : parentOpt
                          ),
                        };
                      }
                      return node;
                    });
                    setFlowNodes(updatedNodes);
                    toast.info("Option removed");
                  }}
                  sx={{
                    position: "absolute",
                    top: 4,
                    right: 4,
                    bgcolor: "white",
                    "&:hover": { bgcolor: "#FEE2E2", color: "#EF4444" },
                  }}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              )}

              <Stack spacing={1.5}>
                <TextField
                  fullWidth
                  size="small"
                  label="Option Text"
                  value={opt.text}
                  onChange={(e) => {
                    const updatedNodes = flowNodes.map((node) => {
                      if (node.id === nodeId && node.type === "quickReply") {
                        return {
                          ...node,
                          replyOptions: node.replyOptions.map((parentOpt) =>
                            parentOpt.id === parentOptionId
                              ? {
                                  ...parentOpt,
                                  actions: parentOpt.actions.map((act) =>
                                    act.id === parentQRAction.id
                                      ? {
                                          ...act,
                                          replyOptions: act.replyOptions.map((middleOpt) =>
                                            middleOpt.id === optionId
                                              ? {
                                                  ...middleOpt,
                                                  actions: middleOpt.actions.map((a) =>
                                                    a.id === nestedQuickReply.id
                                                      ? {
                                                          ...a,
                                                          replyOptions: a.replyOptions.map((o) =>
                                                            o.id === opt.id
                                                              ? { ...o, text: e.target.value }
                                                              : o
                                                          ),
                                                        }
                                                      : a
                                                  ),
                                                }
                                              : middleOpt
                                          ),
                                        }
                                      : act
                                  ),
                                }
                              : parentOpt
                          ),
                        };
                      }
                      return node;
                    });
                    setFlowNodes(updatedNodes);
                  }}
                />

                {/* Show Add Action for nested option */}
                {(!opt.actions || opt.actions.length === 0) && (
                  <Box>
                    <Typography
                      variant="caption"
                      sx={{ color: "#64748B", display: "block", mb: 1 }}
                    >
                      When user selects "{opt.text}"
                    </Typography>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<AddCircleOutlineIcon />}
                      fullWidth
                      onClick={() => {
                        // Create a special context for deeply nested options
                        setActionContext({
                          nodeId: nodeId,
                          parentOptionId: parentOptionId,
                          parentQRActionId: parentQRAction.id,
                          middleOptionId: optionId,
                          nestedQRId: nestedQuickReply.id,
                          optionId: opt.id,
                          type: "deepNestedQuickReply"
                        });
                        resetNodeConfig();
                        setDialogOpen(true);
                      }}
                      sx={{
                        textTransform: "none",
                        borderStyle: "dashed",
                        color: "#F59E0B",
                        borderColor: "#F59E0B",
                        "&:hover": {
                          bgcolor: "#FFFBEB",
                          borderColor: "#F59E0B",
                        },
                      }}
                    >
                      Add Action
                    </Button>
                  </Box>
                )}
              </Stack>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};


  // Render Follow Check Branch
  const renderFollowCheckBranch = (node) => {
  const splitY = 30, downHeight = 50;
  const anchors = ["25%", "75%"];
  return (
    <Box sx={{ width: "100%", mt: 0 }}>
      <Box sx={{ position: "relative", height: splitY + downHeight, mb: 2 }}>
        <Box sx={{ position: "absolute", left: "50%", top: 0, width: 3, height: splitY, bgcolor: "#10B981", transform: "translateX(-50%)", zIndex: 2 }}/>
        <Box sx={{ position: "absolute", left: "10%", width: "80%", top: splitY - 2, height: 3, bgcolor: "#10B981", zIndex: 1 }}/>
        {anchors.map(anchor => (
          <Box key={anchor} sx={{ position: "absolute", left: anchor, top: splitY, width: 3, height: downHeight, bgcolor: "#10B981", transform: "translateX(-50%)", zIndex: 1 }}/>
        ))}
      </Box>
      <Grid container spacing={3}>
          {/* LEFT: User Following */}
          <Grid item xs={12} md={6}>
            <Card
              elevation={0}
              sx={{
                p: 2.5,
                borderRadius: 3,
                border: "2px solid #10B981",
                bgcolor: "#F0FDF4",
              }}
            >
              <Stack direction="row" spacing={1.5} alignItems="center" mb={2}>
                <CheckCircleIcon sx={{ color: "#10B981", fontSize: 28 }} />
                <Typography sx={{ fontWeight: 700, fontSize: "15px" }}>
                  User Following
                </Typography>
              </Stack>

              <Stack spacing={2}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  size="small"
                  label="Message"
                  value={node.config.followCheckYesMessage}
                  onChange={(e) => {
                    const updatedNodes = flowNodes.map((n) =>
                      n.id === node.id
                        ? {
                            ...n,
                            config: {
                              ...n.config,
                              followCheckYesMessage: e.target.value,
                            },
                          }
                        : n
                    );
                    setFlowNodes(updatedNodes);
                  }}
                />

                <Button
                  size="small"
                  variant="text"
                  startIcon={<AddIcon />}
                  onClick={() => handleAddButton(node.id, "following")}
                  sx={{
                    textTransform: "none",
                    color: "#10B981",
                    justifyContent: "flex-start",
                    "&:hover": {
                      bgcolor: "#F0FDF4",
                    },
                  }}
                >
                  Add Button
                </Button>
              </Stack>
            </Card>

            {renderButtonFlowNodes(
              node,
              "following",
              node.followingButtons,
              "#10B981"
            )}
          </Grid>

          {/* RIGHT: User Not Following */}
          <Grid item xs={12} md={6}>
            <Card
              elevation={0}
              sx={{
                p: 2.5,
                borderRadius: 3,
                border: "2px solid #EF4444",
                bgcolor: "#FEF2F2",
                pb: 8.25
              }}
            >
              <Stack direction="row" spacing={1.5} alignItems="center" mb={2}>
                <CancelIcon sx={{ color: "#EF4444", fontSize: 28 }} />
                <Typography sx={{ fontWeight: 700, fontSize: "15px" }}>
                  User Not Following
                </Typography>
              </Stack>

              <Stack spacing={2}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  size="small"
                  label="Message"
                  value={node.config.followCheckNoMessage}
                  onChange={(e) => {
                    const updatedNodes = flowNodes.map((n) =>
                      n.id === node.id
                        ? {
                            ...n,
                            config: {
                              ...n.config,
                              followCheckNoMessage: e.target.value,
                            },
                          }
                        : n
                    );
                    setFlowNodes(updatedNodes);
                  }}
                />
{/* 
                <Button
                  size="small"
                  variant="text"
                  startIcon={<AddIcon />}
                  onClick={() => handleAddButton(node.id, "notFollowing")}
                  sx={{
                    textTransform: "none",
                    color: "#EF4444",
                    justifyContent: "flex-start",
                    "&:hover": {
                      bgcolor: "#FEF2F2",
                    },
                  }}
                >
                  Add Button
                </Button> */}
              </Stack>
            </Card>

            {renderButtonFlowNodes(
              node,
              "notFollowing",
              node.notFollowingButtons,
              "#EF4444"
            )}
          </Grid>
        </Grid>
      </Box>
    );
  };

  // Render node based on type
  const renderNode = (node) => {
    const actionType = actionTypes.find((at) => at.type === node.type);
    if (!actionType) return null;

    if (node.type === "followCheck") {
      return (
        <Box key={node.id} sx={{ width: "100%", position: "relative" }}>
          <Card
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: 3,
              border: "2px solid",
              borderColor: actionType.color,
              bgcolor: actionType.bgColor,
              position: "relative",
              maxWidth: 600,
              mx: "auto",
            }}
          >
            <IconButton
              size="small"
              onClick={() => handleDeleteNode(node.id)}
              sx={{
                position: "absolute",
                top: 8,
                right: 8,
                bgcolor: "white",
                "&:hover": { bgcolor: "#FEE2E2", color: "#EF4444" },
              }}
            >
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>

            <Stack direction="row" spacing={2} alignItems="flex-start">
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 2,
                  bgcolor: actionType.color,
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {actionType.icon}
              </Box>
              <Box flex={1}>
                <Typography sx={{ fontWeight: 700, fontSize: "16px", mb: 0.5 }}>
                  {actionType.title}
                </Typography>
                <Typography variant="caption" sx={{ color: "#64748B" }}>
                  {actionType.description}
                </Typography>
              </Box>
            </Stack>
          </Card>

          {renderFollowCheckBranch(node)}
        </Box>
      );
    }

    if (node.type === "quickReply") {
      return (
        <Box key={node.id} sx={{ width: "100%", position: "relative" }}>
          <Card
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: 3,
              border: "2px solid #F59E0B",
              bgcolor: "#FFFBEB",
              position: "relative",
              maxWidth: 600,
              mx: "auto",
            }}
          >
            <IconButton
              size="small"
              onClick={() => handleDeleteNode(node.id)}
              sx={{
                position: "absolute",
                top: 8,
                right: 8,
                bgcolor: "white",
                "&:hover": { bgcolor: "#FEE2E2", color: "#EF4444" },
              }}
            >
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>

            <Stack direction="row" spacing={2} alignItems="flex-start" mb={2}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 2,
                  bgcolor: "#F59E0B",
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <QuizIcon />
              </Box>
              <Box flex={1}>
                <Typography sx={{ fontWeight: 700, fontSize: "16px", mb: 0.5 }}>
                  Quick Replies
                </Typography>
                <Typography variant="caption" sx={{ color: "#64748B" }}>
                  Ask question with quick reply options
                </Typography>
              </Box>
            </Stack>

            <Stack spacing={2}>
              <TextField
                fullWidth
                multiline
                rows={2}
                size="small"
                label="Question"
                placeholder="What would you like to do?"
                value={node.config.quickReplyQuestion}
                onChange={(e) => {
                  const updatedNodes = flowNodes.map((n) =>
                    n.id === node.id
                      ? {
                          ...n,
                          config: {
                            ...n.config,
                            quickReplyQuestion: e.target.value,
                          },
                        }
                      : n
                  );
                  setFlowNodes(updatedNodes);
                }}
              />

              <Button
                size="small"
                variant="text"
                startIcon={<AddIcon />}
                onClick={() => handleAddQuickReplyOption(node.id)}
                sx={{
                  textTransform: "none",
                  color: "#F59E0B",
                  justifyContent: "flex-start",
                  "&:hover": {
                    bgcolor: "#FFFBEB",
                  },
                }}
              >
                Add Option
              </Button>
            </Stack>
          </Card>

          {renderQuickReplyOptions(node)}
        </Box>
      );
    }

    return (
      <Card
        key={node.id}
        elevation={0}
        sx={{
          p: 2.5,
          borderRadius: 3,
          border: "2px solid",
          borderColor: actionType.color,
          bgcolor: actionType.bgColor,
          position: "relative",
        }}
      >
        <IconButton
          size="small"
          onClick={() => handleDeleteNode(node.id)}
          sx={{
            position: "absolute",
            top: 8,
            right: 8,
            bgcolor: "white",
            "&:hover": { bgcolor: "#FEE2E2", color: "#EF4444" },
          }}
        >
          <DeleteOutlineIcon fontSize="small" />
        </IconButton>

        <Stack direction="row" spacing={2} alignItems="flex-start">
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 2,
              bgcolor: actionType.color,
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {actionType.icon}
          </Box>
          <Box flex={1}>
            <Typography sx={{ fontWeight: 700, fontSize: "16px", mb: 0.5 }}>
              {actionType.title}
            </Typography>
            <Typography variant="caption" sx={{ color: "#64748B" }}>
              {actionType.description}
            </Typography>
          </Box>
        </Stack>

        {node.type === "redirectLink" && (
          <Box sx={{ mt: 2, pl: 8 }}>
            <Typography variant="caption" sx={{ fontWeight: 600 }}>
              URL: {node.config.redirectUrl}
            </Typography>
          </Box>
        )}

        {node.type === "downloadFile" && (
          <Box sx={{ mt: 2, pl: 8 }}>
            <Typography variant="caption" sx={{ fontWeight: 600 }}>
              File: {node.config.downloadFile?.name || "No file uploaded"}
            </Typography>
          </Box>
        )}

        {node.type === "askToFollow" && (
          <Box sx={{ mt: 2, pl: 8 }}>
            <Typography variant="caption" sx={{ fontWeight: 600 }}>
              Page: @{node.config.instagramPage}
            </Typography>
          </Box>
        )}
      </Card>
    );
  };

  // Action configuration dialog content
  const renderDialogContent = () => {
    if (!selectedNodeType) return null;

    switch (selectedNodeType) {
      case "redirectLink":
        return (
          <Stack spacing={3}>
            <Alert severity="info">
              Enter the URL where you want to redirect the user. Make sure it starts
              with https://
            </Alert>
            <TextField
              fullWidth
              label="Redirect URL"
              placeholder="https://example.com"
              value={nodeConfig.redirectUrl}
              onChange={(e) =>
                setNodeConfig({ ...nodeConfig, redirectUrl: e.target.value })
              }
              helperText="Example: https://mywebsite.com/download"
            />
          </Stack>
        );

      case "downloadFile":
        return (
          <Stack spacing={3}>
            <Alert severity="info">
              Upload a file (PDF or Image) that will be sent to the user.
            </Alert>
            <Box
              sx={{
                border: "2px dashed",
                borderColor: nodeConfig.downloadFile ? "#3B82F6" : "#CBD5E1",
                borderRadius: 2,
                p: 4,
                textAlign: "center",
                bgcolor: nodeConfig.downloadFile ? "#EFF6FF" : "#F8FAFC",
                cursor: "pointer",
                transition: "all 0.2s",
                "&:hover": {
                  borderColor: "#3B82F6",
                  bgcolor: "#EFF6FF",
                },
              }}
              component="label"
            >
              <input
                type="file"
                hidden
                accept="application/pdf,image/*"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    const validTypes = [
                      "application/pdf",
                      "image/png",
                      "image/jpeg",
                      "image/jpg",
                      "image/gif",
                    ];
                    if (validTypes.includes(file.type)) {
                      setNodeConfig({ ...nodeConfig, downloadFile: file });
                      toast.success("File selected!");
                    } else {
                      toast.error("Please upload a PDF or Image file");
                    }
                  }
                }}
              />
              <CloudUploadIcon sx={{ fontSize: 48, color: "#3B82F6", mb: 2 }} />
              <Typography sx={{ fontWeight: 600, mb: 0.5 }}>
                {nodeConfig.downloadFile
                  ? nodeConfig.downloadFile.name
                  : "Click to upload file"}
              </Typography>
              <Typography variant="caption" sx={{ color: "#64748B" }}>
                PDF or Image files only
              </Typography>
              {nodeConfig.downloadFile && (
                <Box sx={{ mt: 2 }}>
                  <Chip
                    icon={<InsertDriveFileIcon />}
                    label={`${(nodeConfig.downloadFile.size / 1024).toFixed(2)} KB`}
                    color="primary"
                    variant="outlined"
                  />
                </Box>
              )}
            </Box>
          </Stack>
        );

      case "askToFollow":
        return (
          <Stack spacing={3}>
            <Alert severity="info">
              The user will be asked to follow your Instagram page before proceeding.
            </Alert>
            <Box
              sx={{
                p: 3,
                borderRadius: 2,
                border: "2px solid #EC4899",
                bgcolor: "#FCE7F3",
              }}
            >
              <Stack direction="row" spacing={2} alignItems="center">
                <Box
                  sx={{
                    width: 56,
                    height: 56,
                    borderRadius: 2,
                    bgcolor: "#EC4899",
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <InstagramIcon sx={{ fontSize: 32 }} />
                </Box>
                <Box flex={1}>
                  <Typography
                    variant="caption"
                    sx={{ color: "#64748B", display: "block", mb: 0.5 }}
                  >
                    Instagram Page
                  </Typography>
                  <Typography sx={{ fontWeight: 700, fontSize: "18px" }}>
                    @{nodeConfig.instagramPage}
                  </Typography>
                </Box>
              </Stack>
            </Box>
            <Alert severity="warning">
              This username cannot be changed and is linked to your account.
            </Alert>
          </Stack>
        );

      default:
        return null;
    }
  };

const handleLaunchAutomation = async () => {
    setConfDialogOpen(false); 

    if (!dmMessage.trim()) {
      toast.error("Please enter a DM message");
      return;
    }

    try {
      const payload = {
        postType: 'autodm',
        dmMessage: dmMessage.trim(),
        buttonText: buttonText.trim(),
        flowNodes,
        keywords: keywords,
      };
      console.log('Automation Details: ', JSON.stringify(payload));

      await axios.post(`${baseUrl}/autodm/automation/config`, payload, {
        withCredentials: true,
      });

      // After successful creation, switch to edit mode view locally
      setExistingAutomation(true);
      setIsActive(true);
      toast.success("Automation started successfully!");
      
      // Optional: navigate away or stay here
      // navigate("/professional/automations"); 
    } catch (error) {
      console.error("Error starting automation:", error);
      toast.error("Error! Please Try Again");
    }
  };

    return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#F8FAFC" }}>
   

      {/* ============ ZOOM/PAN WRAPPER STARTS ============ */}
<Box sx={{
  width: "200vw",
  height: "calc(100vh - HEADER_HEIGHT)",
  overflow: "hidden",
  display: "flex",
  alignItems: "center",
  justifyContent: "center"
}}>
  <PhoneSimulator 
         dmMessage={dmMessage}
         buttonText={buttonText}
         flowNodes={flowNodes}
         theme={theme}
      />
   <TransformWrapper
  initialScale={1}
  minScale={0.3}
  maxScale={3}
  centerOnInit={true}
  wheel={{ step: 0.1 }}
  panning={{
    disabled: false,
    velocityDisabled: false,   // For inertia/momentum
    excluded: ["input", "textarea"], // exclude text fields
  }}
  doubleClick={{ disabled: true }}
  limitToBounds={false}      // Allow full pan freely
  centerZoomedOut={true}
>



        <>
          <ZoomControls />
          
          <TransformComponent
            wrapperStyle={{
              width: "100%",
              height: "calc(100vh - 80px)",
            }}
            contentStyle={{
              width: "100%",
              minHeight: "100%",
            }}
          >
            {/* Main Content */}
            <Box
              sx={{
                maxWidth: "100%",
                alignItems : 'center',
                px: { xs: 2, sm: 3, md: 4 },
                py: { xs: 3, md: 4 },
              }}
            >

        <Stack spacing={0} alignItems="center">

       <Box sx={{ maxWidth: 600, mx: "auto", p: 3 }}>
      {/* Keywords Input */}
      <Box
        sx={{
          p: 3,
          borderRadius: "16px",
          border: "2px solid #8B5CF6",
          bgcolor: "rgba(139, 92, 246, 0.1)",
          backdropFilter: "blur(10px)",
          mb: 3,
        }}
      >
        <Typography sx={{fontFamily : 'Inter', fontWeight: 600, fontSize: 20, mb: 0.5 }}>
          Keywords
        </Typography>
        <Typography color="textSecondary" mb={1} sx={{ fontFamily : 'Inter', fontSize : '14px'}}>
          Enter keyword(s) and press enter to add them
        </Typography>
        <TextField
          fullWidth
          size="small"
          placeholder="Type a keyword and hit enter"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          InputProps={{
            endAdornment: inputValue && (
              <InputAdornment position="end">
                <IconButton onClick={handleAddKeyword} edge="end" size="small" aria-label="add keyword">
                  +
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
        <Stack direction="row" spacing={1} mt={2} flexWrap="wrap">
          {keywords.map((keyword) => (
            <Chip
              key={keyword}
              label={keyword}
              onDelete={() => handleDeleteKeyword(keyword)}
              sx={{ mb: 1 }}
              color="primary"
            />
          ))}
        </Stack>
      </Box>

    


      {/* Arrow Down */}
      <Box sx={{ display: "flex", justifyContent: "center", mb: 3 }}>
        <ArrowDownwardIcon sx={{ fontSize: 36, color: "#8B5CF6" }} />
      </Box>


      {/* Arrow Down to next block can be added similarly */}
    </Box>

          {/* 2. Initial DM */}
          <Card
            elevation={0}
            sx={{
              width: "100%",
              maxWidth: 600,
              p: 3,
              borderRadius: 3,
              border: "2px solid",
              borderColor: "#8B5CF6",
              bgcolor: "white",
            }}
          >
            <Stack direction="row" spacing={2} alignItems="flex-start" mb={2}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 2,
                  bgcolor: "#8B5CF6",
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <SendIcon />
              </Box>
              <Box flex={1}>
                <Typography sx={{fontFamily : 'Inter', fontWeight: 600, fontSize: 20, mb: 0.5 }}>
                  Initial DM Message
                </Typography>
                <Typography sx={{ fontFamily : 'Inter', fontSize : '14px', color: "#64748B"}}>
                  This message will be sent to users who comment
                </Typography>
              </Box>
            </Stack>

            <Stack spacing={2}>
              <TextField
                fullWidth
                multiline
                rows={3}
                placeholder="Write your DM message..."
                value={dmMessage}
                onChange={(e) => setDmMessage(e.target.value)}
              />
              <TextField
                fullWidth
                size="small"
                label="Button Text"
                placeholder="e.g., Send Link"
                value={buttonText}
                onChange={(e) => setButtonText(e.target.value)}
              />
            </Stack>
          </Card>

          {/* Arrow */}
          <Box sx={{ py: 2 }}>
           
      {/* Arrow Down */}
      <Box sx={{ display: "flex", justifyContent: "center", mb: 3 }}>
        <ArrowDownwardIcon sx={{ fontSize: 36, color: "#8B5CF6" }} />
      </Box>
            <Typography
              variant="caption"
              sx={{
                display: "block",
                textAlign: "center",
                color: "#64748B",
                mt: 1,
                fontWeight: 600,
              }}
            >
              When user clicks "{buttonText}"
            </Typography>
          </Box>

       {/* 3. Flow Nodes */}
{flowNodes.map((node, index) => (
  <Box key={node.id} sx={{ width: "100%" }}>
    {renderNode(node)}
    {node.type !== "followCheck" &&
      node.type !== "quickReply" &&
      index < flowNodes.length - 1 && (
        <Box sx={{ py: 2, textAlign: "center" }}>
          <ArrowDownwardIcon sx={{ fontSize: 32, color: "#8B5CF6" }} />
        </Box>
      )}
  </Box>
))}

{/* Add Action Button - Only show if no Follow Check or Quick Reply exists */}
{flowNodes.length > 0 && !isFollowCheckUsed && !hasQuickReplyInMainFlow && (
  <Button
    variant="outlined"
    startIcon={<AddCircleOutlineIcon />}
    onClick={() => {
      setActionContext(null);
      resetNodeConfig();
      setDialogOpen(true);
    }}
    sx={{
      textTransform: "none",
      borderStyle: "dashed",
      color: "#8B5CF6",
      borderColor: "#8B5CF6",
      "&:hover": {
        bgcolor: "#F5F3FF",
        borderColor: "#8B5CF6",
      },
    }}
  >
    Add Action
  </Button>
)}



          {/* Add Action Button - Only show if no Follow Check exists */}
{!isFollowCheckUsed && !hasQuickReplyInMainFlow && (
  <Button
    variant="outlined"
    size="large"
    startIcon={<AddCircleOutlineIcon />}
    onClick={() => {
      setActionContext(null);
      setDialogOpen(true);
    }}
    sx={{
      width: "100%",
      maxWidth: 600,
      py: 2,
      mt: flowNodes.length > 0 ? 2 : 0,
      borderRadius: 3,
      borderStyle: "dashed",
      borderWidth: 2,
      borderColor: "#8B5CF6",
      color: "#8B5CF6",
      textTransform: "none",
      fontSize: "16px",
      fontWeight: 600,
      "&:hover": {
        borderWidth: 2,
        bgcolor: "#F5F3FF",
      },
    }}
  >
    Add Action
  </Button>
)}


          <Box sx={{ mt: 10, width: "100%", maxWidth: 600, pb: 10 }}>
                  {existingAutomation ? (
                    // === SCENARIO: AUTOMATION EXISTS (SHOW EDIT & STOP) ===
                    <Stack spacing={2}>
                      {/* Status Indicator */}
                      <Alert 
                        severity={isActive ? "success" : "warning"}
                        icon={isActive ? <PlayCircleOutlineIcon /> : <PauseCircleOutlineIcon />}
                        sx={{ mb: 1 }}
                      >
                        Current Status: <strong>{isActive ? "Active & Running" : "Stopped"}</strong>
                      </Alert>

                      <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                        {/* Update Button */}
                        <Button
                          variant="contained"
                          size="large"
                          fullWidth
                          onClick={handleUpdateAutomation}
                          startIcon={<SaveIcon />}
                          disabled={!dmMessage.trim()}
                          sx={{
                            height: 56,
                            textTransform: "none",
                            fontSize: "16px",
                            fontWeight: 700,
                            borderRadius: 3,
                            bgcolor: "#8B5CF6", // Purple for update
                            "&:hover": { bgcolor: "#7C3AED" },
                          }}
                        >
                          Update Automation
                        </Button>

                        {/* Stop/Resume Button */}
                        <Button
                          variant="outlined"
                          size="large"
                          fullWidth
                          onClick={handleToggleStatus}
                          startIcon={isActive ? <PauseCircleOutlineIcon /> : <PlayCircleOutlineIcon />}
                          sx={{
                            height: 56,
                            textTransform: "none",
                            fontSize: "16px",
                            fontWeight: 700,
                            borderRadius: 3,
                            borderWidth: 2,
                            color: isActive ? "#EF4444" : "#10B981", // Red for stop, Green for resume
                            borderColor: isActive ? "#EF4444" : "#10B981",
                            "&:hover": {
                              borderWidth: 2,
                              bgcolor: isActive ? "#FEF2F2" : "#F0FDF4",
                              borderColor: isActive ? "#EF4444" : "#10B981",
                            },
                          }}
                        >
                          {isActive ? "Stop Automation" : "Resume Automation"}
                        </Button>
                      </Stack>
                    </Stack>
                  ) : (
                    // === SCENARIO: NO AUTOMATION (SHOW LAUNCH) ===
                    <Button
                      variant="contained"
                      size="large"
                      fullWidth
                      onClick={() => setConfDialogOpen(true)}
                      startIcon={<RocketLaunchIcon />}
                      disabled={!dmMessage.trim()}
                      sx={{
                        height: 56,
                        textTransform: "none",
                        fontSize: "16px",
                        fontWeight: 700,
                        borderRadius: 3,
                        background: dmMessage.trim()
                          ? "linear-gradient(135deg, #10B981 0%, #059669 100%)"
                          : "linear-gradient(135deg, #E2E8F0 0%, #CBD5E1 100%)",
                        color: dmMessage.trim() ? "white" : "#94A3B8",
                        "&:hover": {
                          background: dmMessage.trim()
                            ? "linear-gradient(135deg, #059669 0%, #047857 100%)"
                            : "linear-gradient(135deg, #E2E8F0 0%, #CBD5E1 100%)",
                        },
                      }}
                    >
                      Launch Automation
                    </Button>
                  )}
                </Box>


        </Stack>
               </Box>
          </TransformComponent>
        </>
      </TransformWrapper>

</Box>
      {/* Action Selection Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setSelectedNodeType(null);
          setActionContext(null);
        }}
        maxWidth="lg"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography sx={{ fontWeight: 700, fontSize: "20px" }}>
              {selectedNodeType ? "Configure Action" : "Choose Action Type"}
            </Typography>
            <IconButton
              size="small"
              onClick={() => {
                setDialogOpen(false);
                setSelectedNodeType(null);
                setActionContext(null);
              }}
            >
              <CloseIcon />
            </IconButton>
          </Stack>
        </DialogTitle>

        <DialogContent>
          {!selectedNodeType ? (
            <Grid container spacing={2} sx={{ mt: 0.5 }}>
              {getAvailableActionTypes().map((action) => (
                <Grid item xs={12} sm={6} key={action.type}>
                  <Card
                    elevation={0}
                    sx={{
                      border: "2px solid",
                      borderColor: action.color,
                      bgcolor: action.bgColor,
                      borderRadius: 3,
                      cursor: "pointer",
                      transition: "all 0.2s",
                      "&:hover": {
                        transform: "translateY(-4px)",
                        boxShadow: 3,
                      },
                    }}
                    onClick={() => handleActionSelect(action.type)}
                  >
                    <CardContent sx={{ p: 3 }}>
                      <Stack spacing={2}>
                        <Box
                          sx={{
                            width: 56,
                            height: 56,
                            borderRadius: 2,
                            bgcolor: action.color,
                            color: "white",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          {action.icon}
                        </Box>
                        <Box>
                          <Typography
                            sx={{ fontWeight: 700, fontSize: "16px", mb: 0.5 }}
                          >
                            {action.title}
                          </Typography>
                          <Typography variant="body2" sx={{ color: "#64748B" }}>
                            {action.description}
                          </Typography>
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Box sx={{ mt: 1 }}>{renderDialogContent()}</Box>
          )}
        </DialogContent>

        {selectedNodeType && (
          <DialogActions sx={{ p: 3, pt: 0 }}>
            <Button
              onClick={() => setSelectedNodeType(null)}
              sx={{ textTransform: "none", color: "#64748B" }}
            >
              Cancel
            </Button>
          <Button
              variant="contained"
              onClick={() => handleAddNode(selectedNodeType)}
              sx={{ textTransform: "none" }}
              disabled={isUploading} // Disable while uploading
            >
              {isUploading ? "Uploading..." : (selectedNodeType === "downloadFile" ? "Upload & Save" : "Save")}
            </Button>
          </DialogActions>
        )}
      </Dialog>


       {/* CONFIRMATION DIALOG */}
            <Dialog open={confDialogOpen} onClose={() => setConfDialogOpen(false)} maxWidth="sm" fullWidth>
              <DialogTitle sx={{ color: 'error.main', fontWeight: 700 }}>Confirm Launch</DialogTitle>
              <DialogContent>
                  <Alert severity="warning" sx={{ mb: 2 }}>
                      Once an automation is launched, it cannot be edited. You may only STOP or DELETE it.
                  </Alert>
                  <Typography variant="body2">
                      Please review your automation flow and click ‘Launch Now’ to proceed, or go back to make changes.
                  </Typography>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setConfDialogOpen(false)} color="inherit" sx={{ textTransform : 'none'}}>Cancel</Button>
                <Button variant="contained" color="error" onClick={handleLaunchAutomation} startIcon={<RocketLaunchOutlinedIcon />} sx={{ textTransform : 'none'}}>
                  Launch Now
                </Button>
              </DialogActions>
            </Dialog>
    </Box>
  );
}

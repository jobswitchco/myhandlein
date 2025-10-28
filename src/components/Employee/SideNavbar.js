import React, { useState, useEffect } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import {
  AppBar,
  Toolbar,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  useMediaQuery,
  CircularProgress,
  Typography,
  Divider,
  Collapse,
  IconButton,
} from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined';
import SpaceDashboardOutlinedIcon from "@mui/icons-material/SpaceDashboardOutlined";
import { deepOrange, green } from "@mui/material/colors";
import MenuIcon from "@mui/icons-material/Menu";
import logo from "../../images/myhandle_logo.png";
import axios from "axios";
import { toast } from "react-toastify";
import InboxOutlinedIcon from '@mui/icons-material/InboxOutlined';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import BarChartOutlinedIcon from "@mui/icons-material/BarChartOutlined";
import AccountBoxOutlinedIcon from '@mui/icons-material/AccountBoxOutlined';
import SupportAgentOutlinedIcon from '@mui/icons-material/SupportAgentOutlined';
import MailOutlineOutlinedIcon from '@mui/icons-material/MailOutlineOutlined';
import ContactPageOutlinedIcon from '@mui/icons-material/ContactPageOutlined';
import LinkIcon from '@mui/icons-material/Link';
import InstagramIcon from '@mui/icons-material/Instagram';
import ConnectWithoutContactIcon from '@mui/icons-material/ConnectWithoutContact';
import ForumOutlinedIcon from '@mui/icons-material/ForumOutlined';
import NotificationsActiveOutlinedIcon from '@mui/icons-material/NotificationsActiveOutlined';
import AddPhotoAlternateOutlinedIcon from '@mui/icons-material/AddPhotoAlternateOutlined';
import UpiMandateModern from "./UpiMandate";
import CurrencyRupeeOutlinedIcon from '@mui/icons-material/CurrencyRupeeOutlined';
import "react-toastify/dist/ReactToastify.css";

const theme = createTheme({
  palette: {
    primary: { main: deepOrange[500] },
    secondary: { main: green[500] },
  },
});

export default function SideNavbar({ window }) {
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [anchorEl, setAnchorEl] = React.useState(null);
  const location = useLocation();
  const [greeting, setGreeting] = useState("");
  const [userName, setUserName] = useState("");
  const [hasAccess, setHasAccess] = useState(false);
  const [freeTrialDaysLeft, setFreeTrialLeftDays] = useState("");
  const [profilePicture, setProfilePicture] = useState("");
  const baseUrl = "/api/usersOn";
  const [currentTime, setCurrentTime] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Main menu states
  const [linkInBioOpen, setLinkInBioOpen] = useState(true);
  const [instagramOpen, setInstagramOpen] = useState(true);
  
  // Sub-menu states
  const [analyticsOpen, setAnalyticsOpen] = useState(false);
  const [mentionsOpen, setMentionsOpen] = useState(false);

  // Routes for Analytics (nested under Link In Bio)
  const analyticsRoutes = [
    "/professional/my/page/analytics",
    "/professional/my/store/analytics",
    "/professional/my/block/analytics",
  ];

  // Routes for Mentions (nested under Instagram)
  const mentionsRoutes = [
    "/professional/instagram/mentions/comments",
    "/professional/instagram/mentions/messages",
  ];

  // Routes for Link In Bio section
  const linkInBioRoutes = [
    "/professional/dashboard/analytics",
    "/professional/user/bio",
    "/professional/my/inbox",
    "/professional/store/products",
    ...analyticsRoutes,
    "/professional/newsletter/emails",
    "/professional/profile",
    "/professional/support",
    "/professional/my_orders"
  ];

  // Routes for Instagram section
  const instagramRoutes = [
    "/professional/fb_insta_redirect",
    "/professional/automations",
    "/professional/instagram/mentions",
    ...mentionsRoutes,
    "/professional/instagram/create-post",
  ];

  const isAnalyticsRoute = analyticsRoutes.includes(location.pathname);
  const isMentionsRoute = mentionsRoutes.includes(location.pathname);
  const isLinkInBioSection = linkInBioRoutes.includes(location.pathname);
  const isInstagramSection = instagramRoutes.includes(location.pathname);

  const goTo = (path) => {
    navigate(path);
    if (isSmallScreen) handleDrawerToggle();
  };

  const handleSessionExpired = () => {
    toast.error("Session expired. Please log in again.");
    setTimeout(() => {
      navigate('/professional/login');
    }, 1500);
  };

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchPaymentDetails = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${baseUrl}/fetch-payment-details`, {
          withCredentials: true,
        });
        setHasAccess(response.data.hasAccess);
      } catch (error) {
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
          handleSessionExpired();
        } else {
          console.log('error : ', error);
          handleSessionExpired();
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentDetails();
  }, []);

  const handleDrawerToggle = () => {
    setMobileOpen((prev) => !prev);
  };

  const drawerWidth = 260;

  const drawerContent = (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        backgroundColor: "#FAFBFC",
        pt: 0, // AppBar now handled by outer container padding on mobile
      }}
    >
      {/* Top section (logo + nav links) */}
      <Box sx={{ 
        flexGrow: 1, 
        overflowY: "auto", 
        overflowX: "hidden",
        '&::-webkit-scrollbar': { width: '6px' },
        '&::-webkit-scrollbar-track': { backgroundColor: '#F3F4F6', borderRadius: '10px' },
        '&::-webkit-scrollbar-thumb': {
          backgroundColor: '#CBD5E1',
          borderRadius: '10px',
          '&:hover': { backgroundColor: '#94A3B8' },
        },
        scrollbarWidth: 'none',
        scrollbarColor: '#CBD5E1 #F3F4F6',
      }}>
        <Toolbar sx={{ justifyContent: "space-between", px: 2.5, py: 2 }}>
          <Link
            to="/"
            style={{
              display: "flex",
              alignItems: "center",
              textDecoration: "none",
              color: "inherit",
            }}
          >
            <img
              src={logo}
              alt="MyHandle Logo"
              width="30"
              height="auto"
              style={{ display: "block" }}
            />
            <div
              style={{
                marginLeft: 8,
                fontWeight: 700,
                fontSize: "1.25rem",
                WebkitBackgroundClip: "text",
                color: '#000000'
              }}
            >
              MyHandle
            </div>
          </Link>
        </Toolbar>

        <List sx={{ px: 2, pt: 1 }}>
          {/* ===== LINK IN BIO MAIN MENU ===== */}
          <ListItem disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              onClick={() => setLinkInBioOpen((p) => !p)}
              sx={{
                borderRadius: "10px",
                py: 1,
                px: 1.5,
                backgroundColor: isLinkInBioSection ? "#0046FF" : "transparent",
                "&:hover": {
                  backgroundColor: isLinkInBioSection ? "rgba(102, 126, 234, 0.12)" : "rgba(0,0,0,0.03)",
                },
                transition: "all 0.2s ease",
              }}
            >
              <ListItemIcon sx={{ minWidth: 36 }}>
                <LinkIcon
                  sx={{
                    color: isLinkInBioSection ? "#FFFFFF" : "#6B7280",
                    fontSize: "1.3rem",
                  }}
                />
              </ListItemIcon>
              <ListItemText
                primary="Link In Bio"
                primaryTypographyProps={{
                  sx: {
                    color: isLinkInBioSection ? "#FFFFFF" : "#374151",
                    fontWeight: 600,
                    fontSize: "0.9rem",
                    fontFamily: "Inter"
                  },
                }}
              />
              {linkInBioOpen ? (
                <ExpandLessIcon sx={{ color: isLinkInBioSection ? "#FFFFFF" : "#9CA3AF", fontSize: "1.2rem" }} />
              ) : (
                <ExpandMoreIcon sx={{ color: isLinkInBioSection ? "#FFFFFF" : "#9CA3AF", fontSize: "1.2rem" }} />
              )}
            </ListItemButton>
          </ListItem>

          {/* Link In Bio Submenu */}
          <Collapse in={linkInBioOpen} timeout="auto" unmountOnExit>
            <List component="div" disablePadding sx={{ pl: 0.5, pr: 0 }}>
              {/* Dashboard */}
              <ListItem disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  onClick={() => goTo("/professional/dashboard/analytics")}
                  selected={location.pathname === "/professional/dashboard/analytics"}
                  sx={{
                    pl: 2,
                    borderRadius: "8px",
                    py: 0.75,
                    backgroundColor: location.pathname === "/professional/dashboard/analytics" ? "#6E8CFB" : "transparent",
                    "&:hover": { 
                      backgroundColor: "#6E8CFB",
                      "& .MuiListItemIcon-root, & .MuiListItemText-primary": { color: "#FFFFFF" }
                    },
                    "&.Mui-selected": { backgroundColor: "#6E8CFB" },
                    transition: "all 0.2s ease",
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <SpaceDashboardOutlinedIcon
                      sx={{
                        color: location.pathname === "/professional/dashboard/analytics" ? "#FFFFFF" : "#9CA3AF",
                        fontSize: "1.2rem",
                      }}
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary="Dashboard"
                    primaryTypographyProps={{
                      sx: {
                        color: location.pathname === "/professional/dashboard/analytics" ? "#FFFFFF" : "#6B7280",
                        fontWeight: location.pathname === "/professional/dashboard/analytics" ? 500 : 400,
                        fontSize: "0.875rem",
                      },
                    }}
                  />
                </ListItemButton>
              </ListItem>

              {/* Bio Page */}
              <ListItem disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  onClick={() => goTo("/professional/user/bio")}
                  selected={location.pathname === "/professional/user/bio"}
                  sx={{
                    pl: 2,
                    borderRadius: "8px",
                    py: 0.75,
                    backgroundColor: location.pathname === "/professional/user/bio" ? "#6E8CFB" : "transparent",
                    "&:hover": { 
                      backgroundColor: "#6E8CFB",
                      "& .MuiListItemIcon-root, & .MuiListItemText-primary": { color: "#FFFFFF" }
                    },
                    "&.Mui-selected": { backgroundColor: "#6E8CFB" },
                    transition: "all 0.2s ease",
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <ContactPageOutlinedIcon
                      sx={{
                        color: location.pathname === "/professional/user/bio" ? "#FFFFFF" : "#9CA3AF",
                        fontSize: "1.2rem",
                      }}
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary="Bio Page"
                    primaryTypographyProps={{
                      sx: {
                        color: location.pathname === "/professional/user/bio" ? "#FFFFFF" : "#6B7280",
                        fontWeight: location.pathname === "/professional/user/bio" ? 500 : 400,
                        fontSize: "0.875rem",
                      },
                    }}
                  />
                </ListItemButton>
              </ListItem>

              {/* Inbox */}
              <ListItem disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  onClick={() => goTo("/professional/my/inbox")}
                  selected={location.pathname === "/professional/my/inbox"}
                  sx={{
                    pl: 2,
                    borderRadius: "8px",
                    py: 0.75,
                    backgroundColor: location.pathname === "/professional/my/inbox" ? "#6E8CFB" : "transparent",
                    "&:hover": { 
                      backgroundColor: "#6E8CFB",
                      "& .MuiListItemIcon-root, & .MuiListItemText-primary": { color: "#FFFFFF" }
                    },
                    "&.Mui-selected": { backgroundColor: "#6E8CFB" },
                    transition: "all 0.2s ease",
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <InboxOutlinedIcon
                      sx={{
                        color: location.pathname === "/professional/my/inbox" ? "#FFFFFF" : "#9CA3AF",
                        fontSize: "1.2rem",
                      }}
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary="Inbox"
                    primaryTypographyProps={{
                      sx: {
                        color: location.pathname === "/professional/my/inbox" ? "#FFFFFF" : "#6B7280",
                        fontWeight: location.pathname === "/professional/my/inbox" ? 500 : 400,
                        fontSize: "0.875rem",
                      },
                    }}
                  />
                </ListItemButton>
              </ListItem>

              {/* Store */}
              <ListItem disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  onClick={() => goTo("/professional/store/products")}
                  selected={location.pathname === "/professional/store/products"}
                  sx={{
                    pl: 2,
                    borderRadius: "8px",
                    py: 0.75,
                    backgroundColor: location.pathname === "/professional/store/products" ? "#6E8CFB" : "transparent",
                    "&:hover": { 
                      backgroundColor: "#6E8CFB",
                      "& .MuiListItemIcon-root, & .MuiListItemText-primary": { color: "#FFFFFF" }
                    },
                    "&.Mui-selected": { backgroundColor: "#6E8CFB" },
                    transition: "all 0.2s ease",
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <StorefrontOutlinedIcon
                      sx={{
                        color: location.pathname === "/professional/store/products" ? "#FFFFFF" : "#9CA3AF",
                        fontSize: "1.2rem",
                      }}
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary="Store"
                    primaryTypographyProps={{
                      sx: {
                        color: location.pathname === "/professional/store/products" ? "#FFFFFF" : "#6B7280",
                        fontWeight: location.pathname === "/professional/store/products" ? 500 : 400,
                        fontSize: "0.875rem",
                      },
                    }}
                  />
                </ListItemButton>
              </ListItem>

              {/* My Orders */}
              <ListItem disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  onClick={() => goTo("/professional/my_orders")}
                  selected={location.pathname === "/professional/my_orders"}
                  sx={{
                    pl: 2,
                    borderRadius: "8px",
                    py: 0.75,
                    backgroundColor: location.pathname === "/professional/my_orders" ? "#6E8CFB" : "transparent",
                    "&:hover": { 
                      backgroundColor: "#6E8CFB",
                      "& .MuiListItemIcon-root, & .MuiListItemText-primary": { color: "#FFFFFF" }
                    },
                    "&.Mui-selected": { backgroundColor: "#6E8CFB" },
                    transition: "all 0.2s ease",
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <CurrencyRupeeOutlinedIcon
                      sx={{
                        color: location.pathname === "/professional/my_orders" ? "#FFFFFF" : "#9CA3AF",
                        fontSize: "1.2rem",
                      }}
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary="My Orders"
                    primaryTypographyProps={{
                      sx: {
                        color: location.pathname === "/professional/my_orders" ? "#FFFFFF" : "#6B7280",
                        fontWeight: location.pathname === "/professional/my_orders" ? 500 : 400,
                        fontSize: "0.875rem",
                      },
                    }}
                  />
                </ListItemButton>
              </ListItem>

              {/* Analytics (nested) */}
              <ListItem disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  onClick={() => setAnalyticsOpen((p) => !p)}
                  selected={isAnalyticsRoute}
                  sx={{
                    pl: 2,
                    borderRadius: "8px",
                    py: 0.75,
                    backgroundColor: isAnalyticsRoute ? "#6E8CFB" : "transparent",
                    "&:hover": { 
                      backgroundColor: "#6E8CFB",
                      "& .MuiListItemIcon-root, & .MuiListItemText-primary": { color: "#FFFFFF" }
                    },
                    "&.Mui-selected": { backgroundColor: "#6E8CFB" },
                    transition: "all 0.2s ease",
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <BarChartOutlinedIcon
                      sx={{
                        color: isAnalyticsRoute ? "#FFFFFF" : "#9CA3AF",
                        fontSize: "1.2rem",
                      }}
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary="Analytics"
                    primaryTypographyProps={{
                      sx: {
                        color: isAnalyticsRoute ? "#FFFFFF" : "#6B7280",
                        fontWeight: isAnalyticsRoute ? 500 : 400,
                        fontSize: "0.875rem",
                      },
                    }}
                  />
                  {analyticsOpen ? (
                    <ExpandLessIcon sx={{ color: isAnalyticsRoute ? "#FFFFFF" : "#9CA3AF", fontSize: "1rem" }} />
                  ) : (
                    <ExpandMoreIcon sx={{ color: isAnalyticsRoute ? "#FFFFFF" : "#9CA3AF", fontSize: "1rem" }} />
                  )}
                </ListItemButton>
              </ListItem>

              {/* Analytics submenu */}
              <Collapse in={analyticsOpen} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  <ListItem disablePadding sx={{ mb: 0.5, pl: 4 }}>
                    <ListItemButton
                      onClick={() => goTo("/professional/my/page/analytics")}
                      selected={location.pathname === "/professional/my/page/analytics"}
                      sx={{
                        borderRadius: "8px",
                        py: 0.6,
                        backgroundColor: location.pathname === "/professional/my/page/analytics" ? "#6E8CFB" : "transparent",
                        "&:hover": { 
                          backgroundColor: "#6E8CFB",
                          "& .MuiListItemText-primary": { color: "#FFFFFF" }
                        },
                        "&.Mui-selected": { backgroundColor: "#6E8CFB" },
                        transition: "all 0.2s ease",
                      }}
                    >
                      <ListItemText
                        primary="Page Analytics"
                        primaryTypographyProps={{
                          sx: {
                            color: location.pathname === "/professional/my/page/analytics" ? "#FFFFFF" : "#9CA3AF",
                            fontWeight: 400,
                            fontSize: "0.82rem",
                          },
                        }}
                      />
                    </ListItemButton>
                  </ListItem>

                  <ListItem disablePadding sx={{ mb: 0.5, pl: 4 }}>
                    <ListItemButton
                      onClick={() => goTo("/professional/my/store/analytics")}
                      selected={location.pathname === "/professional/my/store/analytics"}
                      sx={{
                        borderRadius: "8px",
                        py: 0.6,
                        backgroundColor: location.pathname === "/professional/my/store/analytics" ? "#6E8CFB" : "transparent",
                        "&:hover": { 
                          backgroundColor: "#6E8CFB",
                          "& .MuiListItemText-primary": { color: "#FFFFFF" }
                        },
                        "&.Mui-selected": { backgroundColor: "#6E8CFB" },
                        transition: "all 0.2s ease",
                      }}
                    >
                      <ListItemText
                        primary="Store Analytics"
                        primaryTypographyProps={{
                          sx: {
                            color: location.pathname === "/professional/my/store/analytics" ? "#FFFFFF" : "#9CA3AF",
                            fontWeight: 400,
                            fontSize: "0.82rem",
                          },
                        }}
                      />
                    </ListItemButton>
                  </ListItem>

                  <ListItem disablePadding sx={{ mb: 0.5, pl: 4 }}>
                    <ListItemButton
                      onClick={() => goTo("/professional/my/block/analytics")}
                      selected={location.pathname === "/professional/my/block/analytics"}
                      sx={{
                        borderRadius: "8px",
                        py: 0.6,
                        backgroundColor: location.pathname === "/professional/my/block/analytics" ? "#6E8CFB" : "transparent",
                        "&:hover": { 
                          backgroundColor: "#6E8CFB",
                          "& .MuiListItemText-primary": { color: "#FFFFFF" }
                        },
                        "&.Mui-selected": { backgroundColor: "#6E8CFB" },
                        transition: "all 0.2s ease",
                      }}
                    >
                      <ListItemText
                        primary="Block Analytics"
                        primaryTypographyProps={{
                          sx: {
                            color: location.pathname === "/professional/my/block/analytics" ? "#FFFFFF" : "#9CA3AF",
                            fontWeight: 400,
                            fontSize: "0.82rem",
                          },
                        }}
                      />
                    </ListItemButton>
                  </ListItem>
                </List>
              </Collapse>

              {/* Newsletter List */}
              <ListItem disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  onClick={() => goTo("/professional/newsletter/emails")}
                  selected={location.pathname === "/professional/newsletter/emails"}
                  sx={{
                    pl: 2,
                    borderRadius: "8px",
                    py: 0.75,
                    backgroundColor: location.pathname === "/professional/newsletter/emails" ? "#6E8CFB" : "transparent",
                    "&:hover": { 
                      backgroundColor: "#6E8CFB",
                      "& .MuiListItemIcon-root, & .MuiListItemText-primary": { color: "#FFFFFF" }
                    },
                    "&.Mui-selected": { backgroundColor: "#6E8CFB" },
                    transition: "all 0.2s ease",
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <MailOutlineOutlinedIcon
                      sx={{
                        color: location.pathname === "/professional/newsletter/emails" ? "#FFFFFF" : "#9CA3AF",
                        fontSize: "1.2rem",
                      }}
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary="Newsletter List"
                    primaryTypographyProps={{
                      sx: {
                        color: location.pathname === "/professional/newsletter/emails" ? "#FFFFFF" : "#6B7280",
                        fontWeight: location.pathname === "/professional/newsletter/emails" ? 500 : 400,
                        fontSize: "0.875rem",
                      },
                    }}
                  />
                </ListItemButton>
              </ListItem>

              {/* Profile */}
              <ListItem disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  onClick={() => goTo("/professional/profile")}
                  selected={location.pathname === "/professional/profile"}
                  sx={{
                    pl: 2,
                    borderRadius: "8px",
                    py: 0.75,
                    backgroundColor: location.pathname === "/professional/profile" ? "#6E8CFB" : "transparent",
                    "&:hover": { 
                      backgroundColor: "#6E8CFB",
                      "& .MuiListItemIcon-root, & .MuiListItemText-primary": { color: "#FFFFFF" }
                    },
                    "&.Mui-selected": { backgroundColor: "#6E8CFB" },
                    transition: "all 0.2s ease",
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <AccountBoxOutlinedIcon
                      sx={{
                        color: location.pathname === "/professional/profile" ? "#FFFFFF" : "#9CA3AF",
                        fontSize: "1.2rem",
                      }}
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary="Profile"
                    primaryTypographyProps={{
                      sx: {
                        color: location.pathname === "/professional/profile" ? "#FFFFFF" : "#6B7280",
                        fontWeight: location.pathname === "/professional/profile" ? 500 : 400,
                        fontSize: "0.875rem",
                      },
                    }}
                  />
                </ListItemButton>
              </ListItem>

              {/* Support */}
              <ListItem disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  onClick={() => goTo("/professional/support")}
                  selected={location.pathname === "/professional/support"}
                  sx={{
                    pl: 2,
                    borderRadius: "8px",
                    py: 0.75,
                    backgroundColor: location.pathname === "/professional/support" ? "#6E8CFB" : "transparent",
                    "&:hover": { 
                      backgroundColor: "#6E8CFB",
                      "& .MuiListItemIcon-root, & .MuiListItemText-primary": { color: "#FFFFFF" }
                    },
                    "&.Mui-selected": { backgroundColor: "#6E8CFB" },
                    transition: "all 0.2s ease",
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <SupportAgentOutlinedIcon
                      sx={{
                        color: location.pathname === "/professional/support" ? "#FFFFFF" : "#9CA3AF",
                        fontSize: "1.2rem",
                      }}
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary="Support"
                    primaryTypographyProps={{
                      sx: {
                        color: location.pathname === "/professional/support" ? "#FFFFFF" : "#6B7280",
                        fontWeight: location.pathname === "/professional/support" ? 500 : 400,
                        fontSize: "0.875rem",
                      },
                    }}
                  />
                </ListItemButton>
              </ListItem>
            </List>
          </Collapse>

          {/* ===== DIVIDER ===== */}
          <Divider sx={{ my: 2, mx: 1, borderColor: "#E5E7EB", borderWidth: 1 }} />

          {/* ===== INSTAGRAM MAIN MENU ===== */}
          <ListItem disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              onClick={() => setInstagramOpen((p) => !p)}
              sx={{
                borderRadius: "10px",
                py: 1,
                px: 1.5,
                backgroundColor: isInstagramSection ? "rgba(225, 48, 108, 0.08)" : "transparent",
                "&:hover": {
                  backgroundColor: isInstagramSection ? "rgba(225, 48, 108, 0.12)" : "rgba(0,0,0,0.03)",
                },
                transition: "all 0.2s ease",
              }}
            >
              <ListItemIcon sx={{ minWidth: 36 }}>
                <InstagramIcon
                  sx={{
                    color: isInstagramSection ? "#E1306C" : "#6B7280",
                    fontSize: "1.3rem",
                  }}
                />
              </ListItemIcon>
              <ListItemText
                primary="Instagram"
                primaryTypographyProps={{
                  sx: {
                    color: isInstagramSection ? "#E1306C" : "#374151",
                    fontWeight: 600,
                    fontSize: "0.9rem",
                  },
                }}
              />
              {instagramOpen ? (
                <ExpandLessIcon sx={{ color: isInstagramSection ? "#E1306C" : "#9CA3AF", fontSize: "1.2rem" }} />
              ) : (
                <ExpandMoreIcon sx={{ color: isInstagramSection ? "#E1306C" : "#9CA3AF", fontSize: "1.2rem" }} />
              )}
            </ListItemButton>
          </ListItem>

          {/* Instagram Submenu */}
          <Collapse in={instagramOpen} timeout="auto" unmountOnExit>
            <List component="div" disablePadding sx={{ pl: 0.5, pr: 0 }}>
              {/* Connect Instagram */}
              <ListItem disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  onClick={() => goTo("/professional/fb_insta_redirect")}
                  selected={location.pathname === "/professional/fb_insta_redirect"}
                  sx={{
                    pl: 2,
                    borderRadius: "8px",
                    py: 0.75,
                    backgroundColor: location.pathname === "/professional/fb_insta_redirect" ? "#F3F4F6" : "transparent",
                    "&:hover": { backgroundColor: "#F3F4F6" },
                    transition: "all 0.2s ease",
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <ConnectWithoutContactIcon
                      sx={{
                        color: location.pathname === "/professional/fb_insta_redirect" ? "#E1306C" : "#9CA3AF",
                        fontSize: "1.2rem",
                      }}
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary="Connect Instagram"
                    primaryTypographyProps={{
                      sx: {
                        color: location.pathname === "/professional/fb_insta_redirect" ? "#1F2937" : "#6B7280",
                        fontWeight: location.pathname === "/professional/fb_insta_redirect" ? 500 : 400,
                        fontSize: "0.875rem",
                      },
                    }}
                  />
                </ListItemButton>
              </ListItem>

              {/* Automation */}
              <ListItem disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  onClick={() => goTo("/professional/automations")}
                  selected={location.pathname === "/professional/automations"}
                  sx={{
                    pl: 2,
                    borderRadius: "8px",
                    py: 0.75,
                    backgroundColor: location.pathname === "/professional/automations" ? "#F3F4F6" : "transparent",
                    "&:hover": { backgroundColor: "#F3F4F6" },
                    transition: "all 0.2s ease",
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <ForumOutlinedIcon
                      sx={{
                        color: location.pathname === "/professional/automations" ? "#E1306C" : "#9CA3AF",
                        fontSize: "1.2rem",
                      }}
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary="Automation"
                    primaryTypographyProps={{
                      sx: {
                        color: location.pathname === "/professional/automations" ? "#1F2937" : "#6B7280",
                        fontWeight: location.pathname === "/professional/automations" ? 500 : 400,
                        fontSize: "0.875rem",
                      },
                    }}
                  />
                </ListItemButton>
              </ListItem>

              {/* Mentions (nested) */}
              <ListItem disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  onClick={() => setMentionsOpen((p) => !p)}
                  selected={isMentionsRoute}
                  sx={{
                    pl: 2,
                    borderRadius: "8px",
                    py: 0.75,
                    backgroundColor: isMentionsRoute ? "#F3F4F6" : "transparent",
                    "&:hover": { backgroundColor: "#F3F4F6" },
                    transition: "all 0.2s ease",
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <NotificationsActiveOutlinedIcon
                      sx={{
                        color: isMentionsRoute ? "#E1306C" : "#9CA3AF",
                        fontSize: "1.2rem",
                      }}
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary="Mentions"
                    primaryTypographyProps={{
                      sx: {
                        color: isMentionsRoute ? "#1F2937" : "#6B7280",
                        fontWeight: isMentionsRoute ? 500 : 400,
                        fontSize: "0.875rem",
                      },
                    }}
                  />
                  {mentionsOpen ? (
                    <ExpandLessIcon sx={{ color: "#9CA3AF", fontSize: "1rem" }} />
                  ) : (
                    <ExpandMoreIcon sx={{ color: "#9CA3AF", fontSize: "1rem" }} />
                  )}
                </ListItemButton>
              </ListItem>

              {/* Mentions submenu */}
              <Collapse in={mentionsOpen} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  <ListItem disablePadding sx={{ mb: 0.5 }}>
                    <ListItemButton
                      onClick={() => goTo("/professional/instagram/mentions/comments")}
                      selected={location.pathname === "/professional/instagram/mentions/comments"}
                      sx={{
                        pl: 8,
                        borderRadius: "8px",
                        py: 0.6,
                        backgroundColor: location.pathname === "/professional/instagram/mentions/comments" ? "#E5E7EB" : "transparent",
                        "&:hover": { backgroundColor: "#E5E7EB" },
                        transition: "all 0.2s ease",
                      }}
                    >
                      <ListItemText
                        primary="Comments Analytics"
                        primaryTypographyProps={{
                          sx: {
                            color: location.pathname === "/professional/instagram/mentions/comments" ? "#374151" : "#9CA3AF",
                            fontWeight: 400,
                            fontSize: "0.8rem",
                          },
                        }}
                      />
                    </ListItemButton>
                  </ListItem>

                  <ListItem disablePadding sx={{ mb: 0.5 }}>
                    <ListItemButton
                      onClick={() => goTo("/professional/instagram/mentions/messages")}
                      selected={location.pathname === "/professional/instagram/mentions/messages"}
                      sx={{
                        pl: 8,
                        borderRadius: "8px",
                        py: 0.6,
                        backgroundColor: location.pathname === "/professional/instagram/mentions/messages" ? "#E5E7EB" : "transparent",
                        "&:hover": { backgroundColor: "#E5E7EB" },
                        transition: "all 0.2s ease",
                      }}
                    >
                      <ListItemText
                        primary="Messages Analytics"
                        primaryTypographyProps={{
                          sx: {
                            color: location.pathname === "/professional/instagram/mentions/messages" ? "#374151" : "#9CA3AF",
                            fontWeight: 400,
                            fontSize: "0.8rem",
                          },
                        }}
                      />
                    </ListItemButton>
                  </ListItem>
                </List>
              </Collapse>

              {/* Create Post */}
              <ListItem disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  onClick={() => goTo("/professional/instagram/create-post")}
                  selected={location.pathname === "/professional/instagram/create-post"}
                  sx={{
                    pl: 2,
                    borderRadius: "8px",
                    py: 0.75,
                    backgroundColor: location.pathname === "/professional/instagram/create-post" ? "#F3F4F6" : "transparent",
                    "&:hover": { backgroundColor: "#F3F4F6" },
                    transition: "all 0.2s ease",
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <AddPhotoAlternateOutlinedIcon
                      sx={{
                        color: location.pathname === "/professional/instagram/create-post" ? "#E1306C" : "#9CA3AF",
                        fontSize: "1.2rem",
                      }}
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary="Create Post"
                    primaryTypographyProps={{
                      sx: {
                        color: location.pathname === "/professional/instagram/create-post" ? "#1F2937" : "#6B7280",
                        fontWeight: location.pathname === "/professional/instagram/create-post" ? 500 : 400,
                        fontSize: "0.875rem",
                      },
                    }}
                  />
                </ListItemButton>
              </ListItem>
            </List>
          </Collapse>

          {/* Profile (only on mobile) */}
          {isSmallScreen && (
            <ListItem disablePadding sx={{ mt: 2 }}>
              <ListItemButton
                onClick={() => goTo("/professional/profile")}
                selected={location.pathname === "/professional/profile"}
                sx={{
                  borderRadius: "8px",
                  py: 0.75,
                  pl: 2,
                  backgroundColor: location.pathname === "/professional/profile" ? "#F3F4F6" : "transparent",
                  "&:hover": { backgroundColor: "#F3F4F6" },
                  transition: "all 0.2s ease",
                }}
              >
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <AccountCircleOutlinedIcon
                    sx={{
                      color: location.pathname === "/professional/profile" ? "#667eea" : "#9CA3AF",
                      fontSize: "1.2rem",
                    }}
                  />
                </ListItemIcon>
                <ListItemText
                  primary="Profile"
                  primaryTypographyProps={{
                    sx: {
                      color: location.pathname === "/professional/profile" ? "#1F2937" : "#6B7280",
                      fontWeight: location.pathname === "/professional/profile" ? 500 : 400,
                      fontSize: "0.875rem",
                    },
                  }}
                />
              </ListItemButton>
            </ListItem>
          )}
        </List>
      </Box>

      {/* Bottom fixed section */}
      <Box
        sx={{
          p: 2,
          borderTop: "1px solid #E5E7EB",
          backgroundColor: "#FAFBFC",
          flexShrink: 0,
          ...(isSmallScreen && {
            position: "fixed",
            bottom: 0,
            left: 0,
            width: drawerWidth,
            zIndex: 1300,
          }),
        }}
      >
        {/* You can add premium upgrade card or user info here */}
      </Box>
    </Box>
  );

  return (
    <ThemeProvider theme={theme}>
      {/* Mobile AppBar with hamburger */}
      <AppBar
        position="fixed"
        color="inherit"
        elevation={0}
        sx={{
          display: { xs: "flex", sm: "none" },
          borderBottom: "1px solid #E5E7EB",
          bgcolor: "#FAFBFC",
          zIndex: (t) => t.zIndex.drawer + 1,
        }}
      >
        <Toolbar sx={{ px: 2 }}>
          <IconButton
            edge="start"
            aria-label="open drawer"
            onClick={handleDrawerToggle}
            sx={{ mr: 1, display: { xs: "inline-flex", sm: "none" } }}
          >
            <MenuIcon />
          </IconButton>

          {/* Brand (optional) */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <img src={logo} alt="MyHandle Logo" width="24" height="24" />
            <Typography variant="h6" sx={{ fontWeight: 700, fontSize: "1rem" }}>
              MyHandle
            </Typography>
          </Box>
        </Toolbar>
      </AppBar>

      {/* NOTE: removed the extra spacer <Toolbar /> to avoid double stacking height */}

      <Box
        sx={{
          display: "flex",
          minHeight: "100dvh",       // better on mobile than 100vh
          pt: { xs: 7, sm: 0 },      // 56px = default toolbar height on xs
          bgcolor: "#FAFBFC",
        }}
      >
        {/* Sidebar */}
        <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}>
          <Drawer
            anchor="left"
            variant="temporary"
            open={mobileOpen}
            onClose={handleDrawerToggle}
            ModalProps={{ keepMounted: true }}
            sx={{
              display: { xs: "block", sm: "none" },
              "& .MuiDrawer-paper": { width: drawerWidth, boxShadow: "0 0 40px rgba(0,0,0,0.05)" },
            }}
          >
            {drawerContent}
          </Drawer>

          <Drawer
            variant="permanent"
            sx={{
              display: { xs: "none", sm: "block" },
              "& .MuiDrawer-paper": { 
                width: drawerWidth, 
                borderRight: "1px solid #E5E7EB",
                boxShadow: "0 0 40px rgba(0,0,0,0.02)"
              },
            }}
            open
          >
            {drawerContent}
          </Drawer>
        </Box>

        {/* Main Content */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            width: "100%",
            maxWidth: { sm: `calc(100% - ${drawerWidth}px)` },
            overflow: 'auto',
            backgroundColor: "#FAFBFC",
            py: 1,
          }}
        >
          {loading ? (
            <Box sx={{ py: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <CircularProgress sx={{ color: "#667eea" }} />
            </Box>
          ) : (
            <Box sx={{ px: 2, py: 0 }}>
              {hasAccess ? <Outlet /> : <UpiMandateModern />}
            </Box>
          )}
        </Box>
      </Box>
    </ThemeProvider>
  );
}

SideNavbar.propTypes = {
  window: PropTypes.func,
};

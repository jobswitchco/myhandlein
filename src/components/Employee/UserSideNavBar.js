import React, { useState, useEffect } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import PropTypes from "prop-types";
import {
  Toolbar,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  useMediaQuery,
} from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined';
import SpaceDashboardOutlinedIcon from "@mui/icons-material/SpaceDashboardOutlined";
import { deepOrange, green } from "@mui/material/colors";
import logo from "../../images/postln_logo.svg";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "react-toastify/dist/ReactToastify.css";
import { toast } from "react-toastify";
import InboxOutlinedIcon from '@mui/icons-material/InboxOutlined';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import Collapse from "@mui/material/Collapse";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import BarChartOutlinedIcon from "@mui/icons-material/BarChartOutlined";
import AccountBoxOutlinedIcon from '@mui/icons-material/AccountBoxOutlined';
import SupportAgentOutlinedIcon from '@mui/icons-material/SupportAgentOutlined';

const theme = createTheme({
  palette: {
    primary: { main: deepOrange[500] },
    secondary: { main: green[500] },
  },
});

export default function UserSideNavbar({ window }) {

  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [anchorEl, setAnchorEl] = React.useState(null);
  const location = useLocation();
  const [greeting, setGreeting] = useState("");
  const [userName, setUserName] = useState("");
  const [freeTrialDaysLeft, setFreeTrialLeftDays] = useState("");
  const [profilePicture, setProfilePicture] = useState("");
  const baseUrl = "/api/usersOn";
  const [currentTime, setCurrentTime] = useState(new Date());
  const navigate = useNavigate();

  // Routes considered part of Analytics
  const analyticsRoutes = [
    "/professional/my/page/analytics",
    "/professional/store/analytics",
    "/professional/my/block/analytics",
  ];

  const isAnalyticsRoute = analyticsRoutes.includes(location.pathname);

  // IMPORTANT: purely controlled by clicking the Analytics main item.
  const [analyticsOpen, setAnalyticsOpen] = useState(false);

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
    const getGreeting = () => {
      const now = new Date();
      const hour = now.getHours();
      if (hour < 12) return "Good morning";
      else if (hour < 18) return "Good afternoon";
      else return "Good evening";
    };
    setGreeting(getGreeting());

    const fetchUserName = async () => {
      // try {
      //   const response = await axios.get(`${baseUrl}/get-user-name-image`, {
      //     withCredentials: true,
      //   });
      //   setUserName(response.data.name);
      //   setProfilePicture(response.data.profilePicture);
      //   setFreeTrialLeftDays(response.data.freeTrialDaysLeft);
      // } catch (error) {
      //   if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      //     handleSessionExpired();
      //   } else {
      //     console.error("Failed to fetch user name:", error);
      //     handleSessionExpired();
      //     setUserName("");
      //     toast.error("Failed to fetch user information.");
      //   }
      // }
    };

    fetchUserName();
  }, []);

  const getHeaderTitle = () => {
    switch (location.pathname) {
      case "/professional/myposts":
        return {
          title: "My posts",
          subtitle: "Posts you've created with PostLn."
        };
      case "/professional/newsletters":
        return {
          title: "Newsletters",
          subtitle: "Your latest AI-crafted newsletters"
        };
      default:
        return {
          title: `${greeting}, ${userName}! 🖐️`,
          subtitle: null
        };
    }
  };

  const handleDrawerToggle = () => {
    setMobileOpen((prev) => !prev);
  };

  const drawerWidth = 220;

  const drawerContent = (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        backgroundColor: "#F5F7F8",
        pt: isSmallScreen ? "64px" : 0,
      }}
    >
      {/* Top section (logo + nav links) */}
      <Box sx={{ flexGrow: 1, overflowY: "auto" }}>
        <Toolbar sx={{ justifyContent: "space-between" }}>
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
              alt="PostLn Logo"
              width="32"
              height="auto"
              style={{ display: "block" }}
            />
            <div
              style={{
                marginLeft: 2,
                fontWeight: 600,
                fontSize: "1.2rem",
              }}
            >
              PostLn
            </div>
          </Link>
        </Toolbar>

        <List sx={{ px: 1 }}>
          {/* Dashboard */}
          <ListItem disablePadding>
            <Link
              to="/professional/user/bio"
              style={{ textDecoration: "none", color: "black", width: "100%" }}
              onClick={handleDrawerToggle}
            >
              <ListItemButton
                selected={location.pathname === "/professional/user/bio"}
                sx={{
                  backgroundColor:
                    location.pathname === "/professional/user/bio"
                      ? "#e3e3f3"
                      : "transparent",
                  borderRadius: "6px",
                  py: 0.5,
                }}
              >
                <ListItemIcon>
                  <SpaceDashboardOutlinedIcon
                    sx={{
                      color:
                        location.pathname === "/professional/user/bio"
                          ? "#093FB4"
                          : "#7F8CAA",
                      transition: "color 0.3s",
                    }}
                  />
                </ListItemIcon>
                <ListItemText
                  primary="Dashboard"
                  primaryTypographyProps={{
                    sx: {
                      color:
                        location.pathname === "/professional/user/bio"
                          ? "#093FB4"
                          : "#7F8CAA",
                      fontWeight: 400,
                    },
                  }}
                />
              </ListItemButton>
            </Link>
          </ListItem>

          {/* My Inbox */}
          <ListItem disablePadding>
            <Link
              to="/professional/my/inbox"
              style={{ textDecoration: "none", color: "black", width: "100%" }}
              onClick={handleDrawerToggle}
            >
              <ListItemButton
                selected={location.pathname === "/professional/my/inbox"}
                sx={{
                  backgroundColor:
                    location.pathname === "/professional/my/inbox"
                      ? "#e3e3f3"
                      : "transparent",
                  borderRadius: "6px",
                  py: 0.5,
                }}
              >
                <ListItemIcon>
                  <InboxOutlinedIcon
                    sx={{
                      color:
                        location.pathname === "/professional/my/inbox"
                          ? "#093FB4"
                          : "#7F8CAA",
                      transition: "color 0.3s",
                    }}
                  />
                </ListItemIcon>
                <ListItemText
                  primary="My Inbox"
                  primaryTypographyProps={{
                    sx: {
                      color:
                        location.pathname === "/professional/my/inbox"
                          ? "#093FB4"
                          : "#7F8CAA",
                      fontWeight: 400,
                    },
                  }}
                />
              </ListItemButton>
            </Link>
          </ListItem>

          {/* Store */}
          <ListItem disablePadding>
            <Link
              to="/professional/store/products"
              style={{ textDecoration: "none", color: "black", width: "100%" }}
              onClick={handleDrawerToggle}
            >
              <ListItemButton
                selected={location.pathname === "/professional/store/products"}
                sx={{
                  backgroundColor:
                    location.pathname === "/professional/store/products"
                      ? "#e3e3f3"
                      : "transparent",
                  borderRadius: "6px",
                  py: 0.5,
                }}
              >
                <ListItemIcon>
                  <StorefrontOutlinedIcon
                    sx={{
                      color:
                        location.pathname === "/professional/store/products"
                          ? "#093FB4"
                          : "#7F8CAA",
                      transition: "color 0.3s",
                    }}
                  />
                </ListItemIcon>
                <ListItemText
                  primary="Store"
                  primaryTypographyProps={{
                    sx: {
                      color:
                        location.pathname === "/professional/store/products"
                          ? "#093FB4"
                          : "#7F8CAA",
                      fontWeight: 400,
                    },
                  }}
                />
              </ListItemButton>
            </Link>
          </ListItem>

          {/* Analytics (parent) */}
          <ListItem disablePadding>
            <ListItemButton
              onClick={() => setAnalyticsOpen((p) => !p)} // toggle only, no navigation
              selected={isAnalyticsRoute}                 // highlight when on any analytics route
              sx={{
                backgroundColor: isAnalyticsRoute ? "#e3e3f3" : "transparent",
                borderRadius: "6px",
                py: 0.5,
              }}
            >
              <ListItemIcon>
                <BarChartOutlinedIcon
                  sx={{
                    color: isAnalyticsRoute ? "#093FB4" : "#7F8CAA",
                    transition: "color 0.3s",
                  }}
                />
              </ListItemIcon>

              <ListItemText
                primary="Analytics"
                primaryTypographyProps={{
                  sx: {
                    color: isAnalyticsRoute ? "#093FB4" : "#7F8CAA",
                    fontWeight: 400,
                  },
                }}
              />

              {analyticsOpen ? (
                <ExpandLessIcon sx={{ color: isAnalyticsRoute ? "#093FB4" : "#7F8CAA" }} />
              ) : (
                <ExpandMoreIcon sx={{ color: isAnalyticsRoute ? "#093FB4" : "#7F8CAA" }} />
              )}
            </ListItemButton>
          </ListItem>

          {/* Analytics submenu */}
          <Collapse in={analyticsOpen} timeout="auto" unmountOnExit>
            <List component="div" disablePadding sx={{ mt: 0.5 }}>
              {/* Page Analytics */}
              <ListItem disablePadding>
                <ListItemButton
                  onClick={() => goTo("/professional/my/page/analytics")}
                  selected={location.pathname === "/professional/my/page/analytics"}
                  sx={{
                    pl: 7,
                    borderRadius: "6px",
                    py: 0.5,
                    "&.Mui-selected": { backgroundColor: "#F1F1F1" },
                    "&.Mui-selected:hover": { backgroundColor: "#d5d5d5" },
                    "&:hover": { backgroundColor: "#f3f4f6" },
                  }}
                >
                  <ListItemText
                    primary="Page Analytics"
                    primaryTypographyProps={{
                      sx: {
                        color:
                          location.pathname === "/professional/my/page/analytics"
                            ? "#111"
                            : "#7F8CAA",
                        fontWeight: 400,
                      },
                    }}
                  />
                </ListItemButton>
              </ListItem>

              {/* Store Analytics */}
              <ListItem disablePadding>
                <ListItemButton
                  onClick={() => goTo("/professional/my/store/analytics")}
                  selected={location.pathname === "/professional/my/store/analytics"}
                  sx={{
                    pl: 7,
                    borderRadius: "6px",
                    py: 0.5,
                    "&.Mui-selected": { backgroundColor: "#F1F1F1" },
                    "&.Mui-selected:hover": { backgroundColor: "#d5d5d5" },
                    "&:hover": { backgroundColor: "#d5d5d5" },
                  }}
                >
                  <ListItemText
                    primary="Store Analytics"
                    primaryTypographyProps={{
                      sx: {
                        color:
                          location.pathname === "/professional/my/store/analytics"
                            ? "#111"
                            : "#7F8CAA",
                        fontWeight: 400,
                      },
                    }}
                  />
                </ListItemButton>
              </ListItem>

              {/* Block Analytics */}
              <ListItem disablePadding>
                <ListItemButton
                  onClick={() => goTo("/professional/my/block/analytics")}
                  selected={location.pathname === "/professional/my/block/analytics"}
                  sx={{
                    pl: 7,
                    borderRadius: "6px",
                    py: 0.5,
                    "&.Mui-selected": { backgroundColor: "#F1F1F1" },
                    "&.Mui-selected:hover": { backgroundColor: "#d5d5d5" },
                    "&:hover": { backgroundColor: "#d5d5d5" },
                  }}
                >
                  <ListItemText
                    primary="Block Analytics"
                    primaryTypographyProps={{
                      sx: {
                        color:
                          location.pathname === "/professional/my/block/analytics"
                            ? "#111"
                            : "#7F8CAA",
                        fontWeight: 400,
                      },
                    }}
                  />
                </ListItemButton>
              </ListItem>
            </List>
          </Collapse>

              <ListItem disablePadding>
            <Link
              to="/professional/newsletter/emails"
              style={{ textDecoration: "none", color: "black", width: "100%" }}
              onClick={handleDrawerToggle}
            >
              <ListItemButton
                selected={location.pathname === "/professional/newsletter/emails"}
                sx={{
                  backgroundColor:
                    location.pathname === "/professional/newsletter/emails"
                      ? "#e3e3f3"
                      : "transparent",
                  borderRadius: "6px",
                  py: 0.5,
                }}
              >
                <ListItemIcon>
                  <EmailOutlinedIcon
                    sx={{
                      color:
                        location.pathname === "/professional/newsletter/emails"
                          ? "#093FB4"
                          : "#7F8CAA",
                      transition: "color 0.3s",
                    }}
                  />
                </ListItemIcon>
                <ListItemText
                  primary="Newsletter List"
                  primaryTypographyProps={{
                    sx: {
                      color:
                        location.pathname === "/professional/newsletter/emails"
                          ? "#093FB4"
                          : "#7F8CAA",
                      fontWeight: 400,
                    },
                  }}
                />
              </ListItemButton>
            </Link>
          </ListItem>

             <ListItem disablePadding>
            <Link
              to="/professional/profile"
              style={{ textDecoration: "none", color: "black", width: "100%" }}
              onClick={handleDrawerToggle}
            >
              <ListItemButton
                selected={location.pathname === "/professional/profile"}
                sx={{
                  backgroundColor:
                    location.pathname === "/professional/profile"
                      ? "#e3e3f3"
                      : "transparent",
                  borderRadius: "6px",
                  py: 0.5,
                }}
              >
                <ListItemIcon>
                  <AccountBoxOutlinedIcon
                    sx={{
                      color:
                        location.pathname === "/professional/profile"
                          ? "#093FB4"
                          : "#7F8CAA",
                      transition: "color 0.3s",
                    }}
                  />
                </ListItemIcon>
                <ListItemText
                  primary="Profile"
                  primaryTypographyProps={{
                    sx: {
                      color:
                        location.pathname === "/professional/profile"
                          ? "#093FB4"
                          : "#7F8CAA",
                      fontWeight: 400,
                    },
                  }}
                />
              </ListItemButton>
            </Link>
          </ListItem>

             <ListItem disablePadding>
            <Link
              to="/professional/support"
              style={{ textDecoration: "none", color: "black", width: "100%" }}
              onClick={handleDrawerToggle}
            >
              <ListItemButton
                selected={location.pathname === "/professional/support"}
                sx={{
                  backgroundColor:
                    location.pathname === "/professional/support"
                      ? "#e3e3f3"
                      : "transparent",
                  borderRadius: "6px",
                  py: 0.5,
                }}
              >
                <ListItemIcon>
                  <SupportAgentOutlinedIcon
                    sx={{
                      color:
                        location.pathname === "/professional/support"
                          ? "#093FB4"
                          : "#7F8CAA",
                      transition: "color 0.3s",
                    }}
                  />
                </ListItemIcon>
                <ListItemText
                  primary="Support"
                  primaryTypographyProps={{
                    sx: {
                      color:
                        location.pathname === "/professional/support"
                          ? "#093FB4"
                          : "#7F8CAA",
                      fontWeight: 400,
                    },
                  }}
                />
              </ListItemButton>
            </Link>
          </ListItem>

          {/* Profile (only on mobile) */}
          {isSmallScreen && (
            <ListItem disablePadding>
              <Link
                to="/professional/profile"
                style={{
                  textDecoration: "none",
                  color: "black",
                  width: "100%",
                }}
                onClick={handleDrawerToggle}
              >
                <ListItemButton
                  selected={location.pathname === "/professional/profile"}
                  sx={{
                    backgroundColor:
                      location.pathname === "/professional/profile"
                        ? "#e3e3f3"
                        : "transparent",
                    borderRadius: "6px",
                    py: 0.5,
                  }}
                >
                  <ListItemIcon>
                    <AccountCircleOutlinedIcon
                      sx={{
                        color:
                          location.pathname === "/professional/profile"
                            ? "#093FB4"
                            : "#7F8CAA",
                        transition: "color 0.3s",
                      }}
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary="Profile"
                    primaryTypographyProps={{
                      sx: {
                        color:
                          location.pathname === "/professional/profile"
                            ? "#093FB4"
                            : "#7F8CAA",
                        fontWeight: 400,
                      },
                    }}
                  />
                </ListItemButton>
              </Link>
            </ListItem>
          )}
        </List>
      </Box>

      {/* Bottom fixed plan card */}
      {/* <Box
        sx={{
          p: 2,
          borderTop: "1px solid #e0e0e0",
          backgroundColor: "#F5F7F8",
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
        <Typography sx={{ fontWeight: 500, mb: 1, fontFamily: "Inter", fontSize: "14px" }}>
          Free trial expires in {freeTrialDaysLeft} days
        </Typography>

        <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
          <Box sx={{ flexGrow: 1, mr: 2 }}>
            <LinearProgress
              variant="determinate"
              value={(freeTrialDaysLeft / 7) * 100}
              sx={{
                height: 8,
                borderRadius: 5,
                backgroundColor: "#e0e0e0",
                "& .MuiLinearProgress-bar": { backgroundColor: "#4f46e5" },
              }}
            />
          </Box>
          <Typography color="text.secondary" sx={{ fontSize: "12px" }}>
            {freeTrialDaysLeft} / 7 days
          </Typography>
        </Box>

        <Typography variant="body2" sx={{ color: "#555", mb: 1 }}>
          Upgrade to $9/mo to get{" "}
          <span style={{ fontWeight: 500, color: "#000" }}>30 AI Rewrites</span> instantly.
        </Typography>

        <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
          <Typography
            variant="body2"
            sx={{
              color: "#4f46e5",
              fontWeight: 500,
              cursor: "pointer",
              "&:hover": { textDecoration: "underline" },
            }}
          >
            Upgrade
          </Typography>
        </Box>
      </Box> */}
    </Box>
  );

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ display: "flex", height: "100vh" }}>
        {/* Sidebar */}
        <Box component="nav" sx={{ width: { sm: 220 }, flexShrink: { sm: 0 } }}>
          <Drawer
            anchor="left"
            variant="temporary"
            open={mobileOpen}
            onClose={handleDrawerToggle}
            ModalProps={{ keepMounted: true }}
            sx={{
              display: { xs: "block", sm: "none" },
              "& .MuiDrawer-paper": { width: 220 },
            }}
          >
            {drawerContent}
          </Drawer>

          <Drawer
            variant="permanent"
            sx={{
              display: { xs: "none", sm: "block" },
              "& .MuiDrawer-paper": { width: 220 },
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
            maxWidth: { sm: `calc(100% - 220px)` },
            px: 2,
            overflow: 'auto'
          }}
        >
          {/* Page Content */}
          <Box sx={{ px: 2, py: 0 }}>
            <Outlet />
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  );
};


UserSideNavbar.propTypes = {
  window: PropTypes.func,
};

import React, { useState, useEffect }from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import PropTypes from "prop-types";
import {
  AppBar,
  Toolbar,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  useMediaQuery,
  Typography,
  Menu,
  Divider,
  MenuItem,
  LinearProgress
} from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined';
import DateRangeOutlinedIcon from '@mui/icons-material/DateRangeOutlined';
import SpaceDashboardOutlinedIcon from "@mui/icons-material/SpaceDashboardOutlined";
import { deepOrange, blue, green, brown } from "@mui/material/colors";
import logo from "../../images/postln_logo.svg";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "react-toastify/dist/ReactToastify.css";
import { toast } from "react-toastify";
import InboxOutlinedIcon from '@mui/icons-material/InboxOutlined';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';

const theme = createTheme({
  palette: {
    primary: { main: deepOrange[500] },
    secondary: { main: green[500] },
  },
});

const UserSideNavbar = ({ window }) => {
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
  <Box
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
      </Box>

  </Box>
);


  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ display: "flex", height: "100vh" }}>

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
              "& .MuiDrawer-paper": { width: drawerWidth },
            }}
          >
            {drawerContent}
          </Drawer>

          <Drawer
            variant="permanent"
            sx={{
              display: { xs: "none", sm: "block" },
              "& .MuiDrawer-paper": { width: drawerWidth },
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
            px: 2,
            overflow: 'auto'
           
          }}
        >
          {/* AppBar for all screen sizes */}
 {/* <AppBar
  position="fixed"
  elevation={0}
  sx={{
    backgroundColor: "#F5F7F8",
    borderBottom: "1px solid #eee",
    zIndex: (theme) => theme.zIndex.drawer + 1,
    ml: { sm: `${drawerWidth}px` },
    width: { sm: `calc(100% - ${drawerWidth}px)` },
  }}
> */}
  {/* <Toolbar
    sx={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      minHeight: "64px",
      px: 3,
    }}
  > */}
    {/* Left: Greeting */}
{/* Left: Menu Icon (Mobile) + Greeting */}
{/* <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
  {isSmallScreen && (
    <IconButton onClick={handleDrawerToggle}>
      <svg width="24" height="24" viewBox="0 0 24 24">
        <path fill="#000" d="M3 6h18v2H3V6zm0 5h18v2H3v-2zm0 5h18v2H3v-2z" />
      </svg>
    </IconButton>
  )}
  {(() => {
    const { title, subtitle } = getHeaderTitle();
    return (
      <Box>
        <Typography sx={{ fontSize: isSmallScreen ? '14px' : '16px', fontWeight: 500, color: '#111' }}>
          {title}
        </Typography>
        {subtitle && (
          <Typography sx={{ fontSize: '14px', color: '#555', mt: 0.1 }}>
            {subtitle}
          </Typography>
        )}
      </Box>
    );
  })()}
</Box> */}




    {/* Right: Avatar with Menu */}
   {/* Right: Date-Time + Avatar */}
{/* <Box sx={{ display: "flex", alignItems: "center", gap: 3 }}>
   {!isSmallScreen && (
    <>

{location.pathname === "/professional/myposts" && (
  <Typography sx={{ fontSize: "14px", color: "#555", whiteSpace: "nowrap" }}>
    {`${currentTime.getDate().toString().padStart(2, "0")}-${currentTime.toLocaleString("en-US", {
      month: "short",
    }).toUpperCase()}-${currentTime.getFullYear()} ${currentTime
      .getHours()
      .toString()
      .padStart(2, "0")}:${currentTime
      .getMinutes()
      .toString()
      .padStart(2, "0")}:${currentTime
      .getSeconds()
      .toString()
      .padStart(2, "0")}`}
  </Typography>
)}

</> )}



 {!isSmallScreen && (
  <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
    <img
      src={profilePicture}
      alt="Profile"
      style={{ width: 40, height: 40, borderRadius: "50%" }}
    />
  </IconButton>
)}


      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        PaperProps={{
          elevation: 3,
          sx: {
            borderRadius: 2,
            mt: 1,
            minWidth: 200,
          },
        }}
      >
        <Box sx={{ px: 2, py: 1 }}>
          <Typography variant="subtitle1" fontWeight={500}>{userName}</Typography>
        </Box>

        <Divider />

          <Link
          to="/professional/profile"
          style={{ textDecoration: "none", color: "black", width: "100%" }}>
        <MenuItem>
        

          <AccountCircleOutlinedIcon fontSize="small" sx={{ mr: 1 }} />
          Profile
        </MenuItem>
          </Link>


      
      </Menu>
    </Box> */}
  {/* </Toolbar> */}
{/* </AppBar> */}




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

export default UserSideNavbar;

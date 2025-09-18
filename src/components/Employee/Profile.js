import { useState, useEffect } from "react";
import {
  TextField,
  Button,
  Typography,
  Grid,
  Box,
  Skeleton
} from "@mui/material";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import { logout } from "../../store/professionalSlice";

function Profile() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userDetails, setUserDetails] = useState('');
  // const baseUrl = "http://localhost:8001/usersOn";
  const baseUrl="/api/usersOn";

  const handleSignOut = async () => {
    try {
      await axios.post(baseUrl + "/logout", {}, { withCredentials: true });
      dispatch(logout());
      window.location.href = "/professional/login";
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(baseUrl + '/get-user-details', {
          withCredentials: true
        });
        setUserDetails(res.data);
        setLoading(false);
      } catch (e) {
        console.error(e);
      }
    };
    fetchData();
  }, []);

  return (
    <>
      <Grid container>
        <Grid item xs={12} sm={6} md={8}>
          <Box sx={{ mt: 3 }}>
            {/* Name */}
            <Box sx={{ mb: 3 }}>
              <Typography mb={1.5} sx={{ fontSize : '16px', fontWeight : 500}}>
                Name
              </Typography>
              {loading ? (
                <Skeleton variant="text" width="60%" height={30} />
              ) : (
                <Typography variant="body1">{userDetails.data.name}</Typography>
              )}
            </Box>

            <hr />

            {/* LinkedIn URL */}
            <Box sx={{ my: 3 }}>
              <Typography mb={1.5} sx={{ fontSize : '16px', fontWeight : 500}}>
                LinkedIn URL
              </Typography>
              {loading ? (
                <Skeleton variant="text" width="80%" height={30} />
              ) : (
                <Typography variant="body1">{userDetails.data.linkedInUrl}</Typography>
              )}
            </Box>

            <hr />

            {/* Last Login */}
            <Box sx={{ my: 3 }}>
              <Typography mb={1.5} sx={{ fontSize : '16px', fontWeight : 500}}>
                Last Login
              </Typography>
              {loading ? (
                <Skeleton variant="text" width="50%" height={30} />
              ) : (
                <Typography variant="body1">{userDetails.data.lastLogin}</Typography>
              )}
            </Box>

            <hr />

            {/* Signout Button */}
            <Box sx={{ textAlign: 'start', mt: 3 }}>
              <Button variant="outlined" color="secondary" onClick={handleSignOut} sx={{ textTransform : 'none'}}>
                Log Out
              </Button>
            </Box>
          </Box>
        </Grid>
      </Grid>

      <ToastContainer autoClose={2000} />
    </>
  );
}

export default Profile;

import { useState, useEffect } from 'react'
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid
} from '@mui/material';
import {login} from '../../store/professionalSlice';
import { useDispatch} from 'react-redux';
import { toast } from "react-toastify";
import CircularProgress from '@mui/material/CircularProgress';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useGoogleLogin } from '@react-oauth/google';
import GmailIcon from '../../images/google.png';
import wallBack from '../../images/wallback.jpg';

function WaitlistSignup() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(false);
  // const baseUrl = "http://localhost:8001/usersOn";
  const baseUrl="/api/usersOn";
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));


  useEffect(() => {
    // lock body scroll while component is mounted
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

      useEffect(() => {
      const verifyToken = async () => {
        try {
          const res = await axios.get(`${baseUrl}/verify-login-token`, { withCredentials: true });
          if (res.data.valid) {
            navigate("/professional/user/bio");
          } else {
            setIsLoading(false);
          }
        } catch (error) {
          setIsLoading(false);
        }
      };
  
      verifyToken();
    }, []);


const handleLoginSuccess = async (email_gm, firstName, lastName, picture) => {
  setIsLoading(true);
  try {
    console.log('email_gm : ', email_gm);
    const res = await axios.post(
      baseUrl + "/user-login-gmail",
      { email: email_gm, firstName, lastName, picture },
      { withCredentials: true }
    );

    setIsLoading(false);

    // safe guard: check data object
    const data = res?.data || {};

    if(data.success && data.wasNew){
      dispatch(login({ user_email: data.user.user_email, user_id: data.user.user_id }));
       setIsLoading(false);
      navigate("/creator/onboarding");

    }

      else if(data.success && !data.wasNew){
      dispatch(login({ user_email: data.user.user_email, user_id: data.user.user_id }));
       setIsLoading(false);
      navigate("/professional/user/bio");

    }
    else{

      toast.error("Something Wrong. Please login again.");
            setTimeout(() => {
            navigate('/professional/login');
            }, 1500);

    }

  } catch (err) {
    setIsLoading(false);

    console.log('Error : ', err);

    // If server responded with a message, show it
   toast.error("Something Wrong. Please try again.");
    setTimeout(() => {
      navigate('/professional/login');
   
    }, 1500);
  }
};


  const loginWithGoogle  = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const profileRes = await axios.get(
          "https://www.googleapis.com/oauth2/v3/userinfo",
          {
            headers: {
              Authorization: `Bearer ${tokenResponse.access_token}`,
            },
          }
        );
        const { email: gmEmail, given_name, family_name, picture } = profileRes.data;
        handleLoginSuccess(gmEmail, given_name, family_name, picture);
      } catch (err) {
        console.error("Failed fetching Google profile:", err);
        toast.error("Google sign-in failed. Please try again.");
      }
    },
    onError: () => {
      toast.error("Google sign-in failed. Please try again.");
    },
  });





  return (
    <>
      {isSmallScreen ? (
<Box
sx={{
        position: 'fixed',   // keep it pinned
        inset: 0,
        boxSizing: 'border-box',
        backgroundImage: `linear-gradient(rgba(255,255,255,0.6), rgba(255,255,255,0.6)), url(${wallBack})`,
        backgroundRepeat: 'no-repeat',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        p: { xs: 2, sm: 4 },
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
>
  <Grid item xs={12} paddingX={2} sx={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
      {isLoading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
          <CircularProgress color='success' />
        </div>
      ) : (
        <Box
          display='flex'
          flexDirection={'column'}
          margin='0 auto'
          padding={1}
          alignItems="center"
          sx={{ width: '100%' }}
        >
          <Typography textAlign='center' mb={2} sx={{ fontFamily : 'Inter', fontWeight : 400, fontSize : '20px', color: '#7F8CAA'}}>Get Early Access</Typography>

          {/* Google button + divider */}
          <Box display="flex" flexDirection="column" alignItems="center" width="100%">
            <Box
              onClick={() => loginWithGoogle()}
              sx={{
                border: '1px solid #ccc',
                backgroundColor: '#246be9',
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                width: '100%',
                justifyContent: 'center',
                gap: 1.5,
                py: 1,
                px: 3,
                cursor: 'pointer',
                '&:hover': { backgroundColor: '#1c54b3' }
              }}
            >
              <img
                src={GmailIcon}
                alt="Google"
                style={{ width: 28, height: 28, objectFit: 'contain', padding: 6, background: '#fff', borderRadius: 4 }}
              />
              <Typography sx={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 15, color: '#FFFFFF' }}>
                Proceed with Google
              </Typography>
            </Box>

          </Box>

        </Box>
      )}

      <ToastContainer autoClose={2000} />
  </Grid>
</Box>

  
      ) : (
        <Box sx={{ mx: 2, my: 2 }}>
          <Grid container spacing="1" >
          

<Box
sx={{
        position: 'fixed',   // keep it pinned
        inset: 0,
        boxSizing: 'border-box',
        backgroundImage: `linear-gradient(rgba(255,255,255,0.6), rgba(255,255,255,0.6)), url(${wallBack})`,
        backgroundRepeat: 'no-repeat',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        p: { xs: 2, sm: 4 },
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
>
            <Grid item xs={12} md={12} lg={12}>
                {isLoading ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', width: '100%' }}>
                    <CircularProgress color='success' />
                  </div>
                ) : (
                  <Box display='flex' flexDirection={'column'} maxWidth={350} margin='auto' marginTop={8}>
                    <Typography textAlign='center' marginBottom={4} sx={{ fontFamily : 'Inter', fontWeight : 400, fontSize : '26px', color: '#7F8CAA'}}>Get Early Access</Typography>

                    <Box display="flex" justifyContent="center">
                      <Box
                        minWidth={350}
                        onClick={() => loginWithGoogle()}
                        sx={{
                          border: '1px solid #ccc',
                          backgroundColor: '#246be9',
                          borderRadius: 2,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 1.5,
                          paddingY: 1,
                          paddingX: 3,
                          cursor: 'pointer',
                          '&:hover': {
                            backgroundColor: '#1c54b3',
                          },
                        }}
                      >
                        <img
                          src={GmailIcon}
                          alt="Google"
                          style={{ width: 28, height: 28, objectFit: 'contain', padding: 6, background: '#FFFFFF', borderRadius: 4 }}
                        />
                        <Typography sx={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 15, color: '#FFFFFF' }}>
                          Proceed with Google
                        </Typography>
                      </Box>
                    </Box>


                  </Box>
                )}

                <ToastContainer autoClose={2000} />
            </Grid>

            </Box>
          </Grid>
        </Box>
      )}

    </>
  )
}

export default WaitlistSignup

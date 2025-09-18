import { useState, useEffect } from "react";
import { Button, Typography, Grid, Stack, Box, Skeleton, Dialog, DialogTitle, DialogContent, TextField, DialogActions, CircularProgress, ClickAwayListener} from "@mui/material";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { logout } from "../../store/professionalSlice";
import { useDispatch } from "react-redux";
import LogoutIcon from '@mui/icons-material/Logout';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";




const AccountDetailsPage1 = () => {

      const dispatch = useDispatch();
      const navigate = useNavigate();
      const [ loading, setLoading ] = useState(false);
      const [ deleteRequestLoading, setDeleteRequestLoading ] = useState(false);
      const [ deleteCodeLoading, setDeleteCodeLoading ] = useState(false);
      const [ userDetails, setUserDetails ] = useState({});
      const [deleteAccountDialog, setDeleteAccountDialog] = useState(false);
      const [enterCodeDialog, setEnterCodeDialog] = useState(false);
      const [emailCode, setEmailCode] = useState("");
      // const baseUrl = "http://localhost:8001/usersOn";
  const baseUrl="/api/usersOn";

      const theme = useTheme();
      const isMobile = useMediaQuery(theme.breakpoints.down("sm"));


      
  const handleClickAway = () => {
    //this function keeps the dialogue open, even when user clicks outside the dialogue. dont delete this function
  };

      const handleSignOut = async () => {
        try {
            await axios.post(baseUrl + "/logout", {}, { withCredentials: true });
            dispatch(logout()); // Clear Redux state
            window.location.href = "/professional/login"; // Ensures full logout
        } catch (error) {
            console.error("Logout failed:", error);
        }
    };


    const handleDialogAccountDeleteClose = () => {
      setDeleteAccountDialog(false);
    };


      const checkPin = async (e) => {
        e.preventDefault();

        setDeleteCodeLoading(true);
    
        if(!emailCode){

            toast.warning("Enter valid 6-digit Pin");
          }
    
          else {
    
    
          await axios.post(baseUrl + "/check-deleteCode-withDb",
            { pin : emailCode }, {withCredentials : true}
          )
          .then((res) => {
    
                if(!res.data.matching){
    
        setDeleteCodeLoading(true);
                    toast.error("Invalid Code");
    
                }
                else if(res.data.matching){
                    
        setDeleteCodeLoading(true);
                    toast.success("Account and data has been deleted successfully!");
        dispatch(logout()); // Clear Redux state

                    setTimeout(() => {
                    navigate('/');
                    }, 2500);
                    
                }
    
          })
          .catch((err) => {
    
    
            if (err.response && err.response.data.error === "User does not exists!") {
              toast.warning("User does not exists");
            } 
    
            else if (err.response && err.response.data.error === "email, password mismatch") {
              toast.warning("Invalid email or password");
            } 
            
            else {
              toast.error("An error occurred. Please try again later.");
            }
          });
    
        }
    
        
      };

    

    const deleteAccount = async (e) => {
      e.preventDefault();
      setDeleteRequestLoading(true);
    
      try {
        const res = await axios.post(
          `${baseUrl}/delete-account-permanently-with-code`,
          {},
          { withCredentials: true }
        );
    
        if (res.data?.emailSent) {
          toast.success("Code sent to your email");
          setDeleteRequestLoading(false);
          setEnterCodeDialog(true);
        } else {
          toast.error("Technical error. Try again.");
        }
      } catch (err) {
        if (err.response) {
          const { error } = err.response.data;
    
          if (error === "User does not exist") {
            setDeleteRequestLoading(false);
            toast.warning("User does not exist");
          } else {
            setDeleteRequestLoading(false);
            toast.error(error || "Something went wrong. Try again.");
          }
        } else {
          setDeleteRequestLoading(false);
          toast.error("Network error. Please try again.");
        }
      }
    };
    
      
    const handleSessionExpired = () => {
      toast.error("Session expired. Please log in again.");
      setTimeout(() => {
        navigate('/professional/login');
      }, 2000);
    };
 

    useEffect(() => {
      const verifyToken = async () => {
        setLoading(true);
      
        try {
          const res = await axios.get(`${baseUrl}/verify-login-token`, { withCredentials: true });
      
          if (res.data.valid) {
            fetchData();
          } else {
            handleSessionExpired();
          }
        } catch (error) {
          if (error.response && (error.response.status === 401 || error.response.status === 403)) {
            handleSessionExpired();
          } else {
            toast.error("Network error, please try again later.");
            handleSessionExpired();

          }
        } finally {
          setLoading(false);
        }
      };
      
  
      verifyToken();
    }, []);

 
          const fetchData = async () => {
            try {
      
                    await axios.post(baseUrl + "/get-user-details", { }, { withCredentials : true}).then(ress=>{

                      if(ress.data.success){
                        setUserDetails(ress.data.data);
                      }
                      else {
                        setLoading(false);
                        toast.error("Session expired. Please log in again.");
                        setTimeout(() => {
                        navigate('/professional/login');
                        }, 2000);
                      }
            
                }).catch(e=>{
            
                })
            
            } catch (error) {
              setLoading(false);
              toast.error("Network error. Please log in again.");
              setTimeout(() => {
              navigate('/professional/login');
              }, 2000);
            }
          };

  return (
  <>

 

      <>
      {isMobile ? (
        <>

        <Stack sx={{ display : 'flex', flexDirection : 'column', gap: '1rem'}}>


        <Box sx={{display : 'flex', flexDirection : 'column', gap: '4px', py: '4px'}}>

                <Typography sx={{ fontSize : '14px', fontWeight : '500'}}>Email</Typography>

                  {loading ? (      <Skeleton variant="rectangular" height={20} />
                  ): (<Typography sx={{ fontSize : '14px', fontWeight : '400'}}>{userDetails.email}</Typography>) }

        </Box>

          <Box sx={{display : 'flex', flexDirection : 'column', gap: '4px', py: '4px'}}>

                <Typography sx={{ fontSize : '14px', fontWeight : '500'}}>Work Mail</Typography>

                  {loading ? (      <Skeleton variant="rectangular" height={20} />
                  ): (<Typography sx={{ fontSize : '14px', fontWeight : '400'}}>{userDetails.workmail}</Typography>) }

        </Box>


          <Box sx={{display : 'flex', flexDirection : 'column', gap: '4px', py: '4px'}}>

                <Typography sx={{ fontSize : '14px', fontWeight : '500'}}>Country</Typography>

                  {loading ? (      <Skeleton variant="rectangular" height={20} />
                  ): (<Typography sx={{ fontSize : '14px', fontWeight : '400'}}>{userDetails.country}</Typography>) }
                    
        </Box>

          <Box sx={{display : 'flex', flexDirection : 'column', gap: '4px', py: '4px'}}>

                <Typography sx={{ fontSize : '14px', fontWeight : '500'}}>Alerts & SMS</Typography>

                   {loading ? (      <Skeleton variant="rectangular" height={20} />
                  ): (<Typography sx={{ fontSize : '14px', fontWeight : '400'}}>+91 - {userDetails.mobile_number}</Typography>) }
                  
        </Box>

          <div style={{ textAlign: 'start'}}>
                    <Button startIcon={<LogoutIcon />} sx={{ color : 'grey', textTransform : 'none'}} variant="outlined" color="warning" onClick={handleSignOut} size="small">
                      Sign Out
                    </Button>
                  </div>


                    <Box sx={{display : 'flex', flexDirection : 'column', gap: '4px', py: '4px', mt: 3}}>

                <Typography sx={{ fontSize : '14px', fontWeight : '500', color: 'grey'}}>Delete my account & erase data</Typography>

                    {loading ? (
        <Skeleton variant="rectangular" width={80} height={32} />
      ) : (
        <Box
          onClick={() => setDeleteAccountDialog(true)}
          sx={{
            border: '1px solid grey',
            borderRadius: '4px',
            px: '22px',
            width: 'fit-content',
            py: '4px',
            cursor: 'pointer',
            ":hover": { backgroundColor: "#D6D6D6" },
          }}
        >
          <Typography sx={{ fontSize: '14px', fontWeight: 400 }}>Delete</Typography>
        </Box>
      )}
        </Box>


        </Stack>

         
        </>
      ) : (
        

          <Grid container mt={5}>

        <Grid item xs={12} sm={6} md={4}>
                <Typography sx={{ fontSize : '18px', fontWeight : '500'}}>Your Account</Typography>
        </Grid>

        <Grid item xs={12} sm={6} md={8}>
            
            <Grid container fullWidth sx={{  borderStyle : 'solid', borderWidth :'1px', borderColor : '#BCCCDC', marginBottom : '22px', paddingY : '12px', paddingX : '12px'}}>
                
                <Grid item md={4}>
                <Typography sx={{ fontSize : '14px', fontWeight : '500'}}>Email</Typography>
                </Grid>

                <Grid item md={8}>
                  {loading ? (      <Skeleton variant="rectangular" width={300} height={20} />
                  ): (<Typography sx={{ fontSize : '14px', fontWeight : '400'}}>{userDetails.email}</Typography>) }
                        
                </Grid>

            </Grid>


             <Grid container fullWidth sx={{  borderStyle : 'solid', borderWidth :'1px', borderColor : '#BCCCDC', marginBottom : '22px', paddingY : '12px', paddingX : '12px'}}>
                
                <Grid item md={4}>
                <Typography sx={{ fontSize : '14px', fontWeight : '500'}}>Work Mail</Typography>
                </Grid>

                <Grid item md={8}>
                  {loading ? (      <Skeleton variant="rectangular" width={300} height={20} />
                  ): (<Typography sx={{ fontSize : '14px', fontWeight : '400'}}>{userDetails.workmail}</Typography>) }
                        
                </Grid>

            </Grid>




               <Grid container fullWidth sx={{  borderStyle : 'solid', borderWidth :'1px', borderColor : '#BCCCDC', marginBottom : '22px', paddingY : '12px', paddingX : '12px'}}>
                
                <Grid item md={4}>
                <Typography sx={{ fontSize : '14px', fontWeight : '500'}}>Country</Typography>
                </Grid>

                <Grid item md={8}>
                  {loading ? (      <Skeleton variant="rectangular" width={300} height={20} />
                  ): (<Typography sx={{ fontSize : '14px', fontWeight : '400'}}>{userDetails.country}</Typography>) }
                        
                </Grid>

            </Grid>


              <Grid container fullWidth sx={{  borderStyle : 'solid', borderWidth :'1px', borderColor : '#BCCCDC', marginBottom : '22px', paddingY : '12px', paddingX : '12px'}}>
                
                <Grid item md={4}>
                <Typography sx={{ fontSize : '14px', fontWeight : '500'}}>Alerts & SMS</Typography>
                </Grid>

                <Grid item md={8}>
                  {loading ? (      <Skeleton variant="rectangular" width={300} height={20} />
                  ): (<Typography sx={{ fontSize : '14px', fontWeight : '400'}}>+91 - {userDetails.mobile_number}</Typography>) }
                        
                </Grid>

            </Grid>

            
       

            <div style={{ textAlign: 'start'}}>
                    <Button startIcon={<LogoutIcon />} sx={{ color : 'grey', textTransform : 'none'}} variant="outlined" color="warning" onClick={handleSignOut}>
                      Sign Out
                    </Button>
                  </div>

                



                  <Grid
  container
  fullWidth
  sx={{
    border: '1px solid #BCCCDC',
    mb: '44px',
    py: '12px',
    px: '12px',
    alignItems: 'center',
    mt: 16,
  }}
>
  {/* Left side text */}
  <Grid item xs={12} md={6}>
    <Typography sx={{ fontSize: '14px', fontWeight: 500 }}>
      Delete my account & erase data
    </Typography>
  </Grid>

  {/* Right side button */}
  <Grid item xs={12} md={6}>
    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
      {loading ? (
        <Skeleton variant="rectangular" width={80} height={32} />
      ) : (
        <Box
          onClick={() => setDeleteAccountDialog(true)}
          sx={{
            border: '1px solid grey',
            borderRadius: '4px',
            px: '12px',
            py: '4px',
            cursor: 'pointer',
            ":hover": { backgroundColor: "#D6D6D6" },
          }}
        >
          <Typography sx={{ fontSize: '14px', fontWeight: 400 }}>Delete</Typography>
        </Box>
      )}
    </Box>
  </Grid>
</Grid>




            
        </Grid>

     </Grid> 

    )}
    </>

   


{deleteAccountDialog && (
          <Dialog
            open={deleteAccountDialog}
            onClose={handleDialogAccountDeleteClose}
            disableEscapeKeyDown
            keepMounted
            maxWidth="sm" 
            fullWidth 
          >
            <DialogTitle>
              <Stack sx={{ display : 'flex', flexDirection : 'row', gap: 2, alignItems : 'center'}}>
                <Box sx={{ backgroundColor : '#F8E8EE', px: '6px', py: '2px', borderRadius : '6px', alignItems : 'center'}}>
                <DeleteOutlineOutlinedIcon sx={{ fontSize : isMobile ? '20px' : '26px', color: 'red' }}/>

                </Box>
                <Typography sx={{ fontSize : isMobile ? '15px' : '16px', fontWeight : 500}}>Delete account & erase data ?</Typography>
              </Stack>
              </DialogTitle>
            <DialogContent dividers>

              {deleteRequestLoading ? (  <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: 150 }}>
          <CircularProgress />
        </Box>) : (
                <>
                 <Typography sx={{fontSize: isMobile ? '15px' : '16px', marginTop: '5px', marginBottom : '22px'}} >
               All your data and account will be deleted permanently. This cannot be undone. Are you sure you want to proceed?
              </Typography>
          
            <div style={{ display : 'flex', flexDirection : 'row', gap: '2%', alignItems : 'center'}}>
          

<Typography sx={{ fontSize : '14px', fontWeight : '400', color : 'grey'}}>A delete code will be sent to your email address : {userDetails.email}</Typography>


</div>
                </>
              )}


        </DialogContent>
            <DialogActions>
              <Button onClick={()=> setDeleteAccountDialog(false)} sx={{ borderRadius : '18px', backgroundColor : '#EC5228', color : '#FFFFFF', px: 3, textTransform : 'none'}}>
                Cancel
              </Button>
              <Button color="success" onClick={deleteAccount} sx={{ textTransform : 'none'}}>
                Proceed
              </Button>
            </DialogActions>
          </Dialog>
      )}

          {enterCodeDialog && (
              <ClickAwayListener onClickAway={handleClickAway}>
                <Dialog
                 open={enterCodeDialog}
                 onClose={handleDialogAccountDeleteClose}
                 disableEscapeKeyDown
                 keepMounted
                 maxWidth="sm" 
                 fullWidth 
                >
                  <DialogTitle sx={{ fontSize : isMobile ? '16px' : '16px'}}>Delete Confirmation</DialogTitle>
                  <DialogContent dividers>

                  {deleteCodeLoading ? (  <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: 150 }}>
          <CircularProgress />
        </Box>) : (
                <>
                  <Typography sx={{fontSize: isMobile ? '15px' : '16px', marginTop: '5px'}} >
                  Enter the 6-digit delete code that was sent to {userDetails.email}
                    </Typography>
      
                    <TextField
                      type="email"
                      id="email"
                      onChange={(e) => {
                          setEmailCode(e.target.value);
                      }}
                      margin="normal"
                      variant="outlined"
                      label="6-digit code"
                      value={emailCode}
                    ></TextField>
                    </>
        )}
      
              </DialogContent>
                  <DialogActions>
                    <Button onClick={()=> setEnterCodeDialog(false)} color="primary" sx={{ textTransform : 'none'}}>
                      Cancel
                    </Button>
                    <Button color="success" onClick={checkPin} sx={{ borderRadius : '18px', backgroundColor : '#EC5228', color : '#FFFFFF', px: 3, textTransform : 'none'}}>
                      Submit
                    </Button>
                  </DialogActions>
                </Dialog>
              </ClickAwayListener>
            )}







           <ToastContainer autoClose= {2000}/>
      
  </>
  );
};

export default AccountDetailsPage1;

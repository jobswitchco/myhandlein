import { useState } from "react";
import { Box, Tab, Tabs } from "@mui/material";
import AccountDetailsPage1 from "./AccountDetailsPage1.js";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";





// Main Component
const AccountDetails = () => {
  const [activeTab, setActiveTab] = useState(0);
    const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));


  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };



  return (
    <Box sx={{ paddingX : isMobile ? '1rem' : '5rem'}}>
      {/* Sticky Header */}
      <div sx={{ position: "sticky", top: 0, zIndex: 1000 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          sx={{ alignItems : 'self-start'}}
        >
          <Tab
            label="Account"
            sx={{
              fontSize: "16px", // Custom font size
              fontWeight: "400", // Custom font weight
              textTransform: "none", // Remove uppercase transformation
              color: activeTab === 0 ? "primary.main" : "text.secondary", // Change color based on active tab
             
            }}
          />
       
        </Tabs>
      </div>

      {/* Content Area */}
      <Box mt={2}>
        {activeTab === 0 && <AccountDetailsPage1 />}
      
      </Box>
    </Box>
  );
};

export default AccountDetails;

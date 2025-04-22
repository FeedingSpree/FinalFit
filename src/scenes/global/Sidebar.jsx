import { useState, useEffect } from "react";
import { ProSidebar, Menu, MenuItem } from "react-pro-sidebar";
import { Box, IconButton, Typography, useTheme, Dialog, DialogActions, DialogContent, DialogTitle, Button } from "@mui/material";
import { Link, useLocation, useNavigate } from "react-router-dom"; // Add useNavigate
import "react-pro-sidebar/dist/css/styles.css";
import { tokens } from "../../theme";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import PeopleOutlinedIcon from "@mui/icons-material/PeopleOutlined";
import ContactsOutlinedIcon from "@mui/icons-material/ContactsOutlined";
import RecentActorsOutlinedIcon from '@mui/icons-material/RecentActorsOutlined';
import ReceiptOutlinedIcon from "@mui/icons-material/ReceiptOutlined";
import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import HelpOutlineOutlinedIcon from "@mui/icons-material/HelpOutlineOutlined";
import ExitToAppOutlinedIcon from '@mui/icons-material/ExitToAppOutlined';
import PieChartOutlineOutlinedIcon from "@mui/icons-material/PieChartOutlineOutlined";
import TimelineOutlinedIcon from "@mui/icons-material/TimelineOutlined";
import MenuOutlinedIcon from "@mui/icons-material/MenuOutlined";
import CameraAltOutlinedIcon from '@mui/icons-material/CameraAltOutlined';

import { getAuth } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase.tsx"; // update path as needed
import { getUsers } from "../../services/userService.ts";
import { addUserLog } from "../../services/userLogsService.ts";

const Item = ({ title, to, icon, selected, setSelected }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  
  const handleClick = () => {
    setSelected(title);
  };

  return (
    <MenuItem
      active={selected === title}
      style={{ color: colors.grey[100] }}
      onClick={handleClick}
      icon={icon}
    >
      <Typography>{title}</Typography>
      <Link to={to} />
    </MenuItem>
  );
};

const Sidebar = ({ isSidebar }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation(); // Added useLocation hook
  const navigate = useNavigate(); // Add navigate hook

  // Updated initialization of selected state
  const [selected, setSelected] = useState(() => {
    const path = location.pathname;
    const routeToTitle = {
      '/dashboard': 'Dashboard',
      '/live-feed': 'Live Feed',
      '/team': 'Users',
      '/contacts': 'Policies',
      '/invoices': 'Detection Logs',
      '/audittrails': 'Audit Trails',
      '/calendar': 'Calendar',
      '/faq': 'FAQ Page'
    };
    return routeToTitle[path] || 'Dashboard';
  });

  // Added effect to update selected state when route changes
  useEffect(() => {
    const path = location.pathname;
    const routeToTitle = {
      '/dashboard': 'Dashboard',
      '/live-feed': 'Live Feed',
      '/team': 'Users',
      '/contacts': 'Policies',
      '/invoices': 'Detection Logs',
      '/audittrails': 'Audit Trails',
      '/calendar': 'Calendar',
      '/faq': 'FAQ Page'
    };
    setSelected(routeToTitle[path] || 'Dashboard');
  }, [location]);

  const [userName, setUserName] = useState("Loading...");
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);

  useEffect(() => {
    const fetchUserName = async () => {
      // Get user data from session storage
      const sessionUser = JSON.parse(sessionStorage.getItem('user'));
      
      if (sessionUser) {
        try {
          const users = await getUsers();
          const currentUser = users.find(u => u.username === sessionUser.username);
          
          if (currentUser) {
            setUserName(currentUser.username);
          } else {
            setUserName("Unknown User");
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          setUserName("Error");
        }
      }
    };

    fetchUserName();
  }, []);

  const handleLogoutClick = () => {
    setIsLogoutDialogOpen(true);
  };

  const handleLogoutCancel = () => {
    setIsLogoutDialogOpen(false);
  };

  const handleLogoutConfirm = async () => {
    try {
      // Get current user from session storage
      const sessionUser = JSON.parse(sessionStorage.getItem('user'));
      
      if (sessionUser) {
        // Create logout log
        const now = new Date();
        const log = {
          log_id: sessionUser.log_id, // Use the same log_id
          username: sessionUser.username,
          action: "Logged Out",
          date: now.toISOString().split('T')[0],
          time: now.toTimeString().split(' ')[0]
        };

        // Add log entry
        await addUserLog(log);
      }

      // Clear all session/local storage
      sessionStorage.clear();
      localStorage.clear();

      // Reset all states
      setUserName("Loading...");
      setSelected("Dashboard");
      setIsLogoutDialogOpen(false);

      // Navigate to login page
      navigate('/', { replace: true });
      
      // Force a page reload to clear all state
      window.location.reload();
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  return (
    <Box
      sx={{
        "& .pro-sidebar-inner": {
          background: `${colors.primary[400]} !important`,
        },
        "& .pro-icon-wrapper": {
          backgroundColor: "transparent !important",
        },
        "& .pro-inner-item": {
          padding: "5px 35px 5px 20px !important",
        },
        "& .pro-inner-item:hover": {
          color: "#868dfb !important",
        },
        "& .pro-menu-item.active": {
          color: "#6870fa !important",
        },
      }}
    >
      <ProSidebar collapsed={!isSidebar}>
        <Menu iconShape="square">
          <MenuItem
            onClick={() => setIsCollapsed(!isCollapsed)}
            icon={isCollapsed ? <MenuOutlinedIcon /> : undefined}
            style={{
              margin: "10px 0 20px 0",
              color: colors.grey[100],
            }}
          >
            {!isCollapsed && (
              <Box display="flex" justifyContent="space-between" alignItems="center" ml="15px">
                <Typography variant="h3" color={colors.grey[100]}>
                  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; CAMPUSFIT
                </Typography>
                <IconButton onClick={() => setIsCollapsed(!isCollapsed)}>
                  <MenuOutlinedIcon />
                </IconButton>
              </Box>
            )}
          </MenuItem>

          {!isCollapsed && (
            <Box mb="25px">
              <Box display="flex" justifyContent="center" alignItems="center">
                <img
                  alt="profile-user"
                  width="100px"
                  height="100px"
                  src={`../../assets/user.png`}
                  style={{ cursor: "pointer", borderRadius: "50%" }}
                />
              </Box>
              <Box textAlign="center">
                <Typography
                  variant="h2"
                  color={colors.grey[100]}
                  fontWeight="bold"
                  sx={{ m: "10px 0 0 0" }}
                >
                  {userName}
                </Typography>
                <Typography variant="h5" color={colors.greenAccent[500]}>
                  Logged-in User
                </Typography>
              </Box>
            </Box>
          )}

          <Box paddingLeft={isCollapsed ? undefined : "10%"}>
            <Item title="Dashboard" to="/dashboard" icon={<HomeOutlinedIcon />} selected={selected} setSelected={setSelected} />
            <Item title="Live Feed" to="/live-feed" icon={<CameraAltOutlinedIcon />} selected={selected} setSelected={setSelected} />

            <Typography variant="h6" color={colors.grey[300]} sx={{ m: "15px 0 5px 20px" }}>
              Data
            </Typography>
            <Item title="Users" to="/team" icon={<PeopleOutlinedIcon />} selected={selected} setSelected={setSelected} />
            <Item title="Policies" to="/contacts" icon={<ContactsOutlinedIcon />} selected={selected} setSelected={setSelected} />
            <Item title="Detection Logs" to="/invoices" icon={<ReceiptOutlinedIcon />} selected={selected} setSelected={setSelected} />
            <Item title="Audit Trails" to="/audittrails" icon={<RecentActorsOutlinedIcon />} selected={selected} setSelected={setSelected} />

            <Typography variant="h6" color={colors.grey[300]} sx={{ m: "15px 0 5px 20px" }}>
              Pages
            </Typography>
            <Item title="Calendar" to="/calendar" icon={<CalendarTodayOutlinedIcon />} selected={selected} setSelected={setSelected} />
            <Item title="FAQ Page" to="/faq" icon={<HelpOutlineOutlinedIcon />} selected={selected} setSelected={setSelected} />
            <Item 
              title="Logout" 
              to="#" 
              icon={<ExitToAppOutlinedIcon />} 
              selected={selected} 
              setSelected={() => {
                setSelected("Logout");
                handleLogoutClick();
              }} 
            />
          </Box>
        </Menu>
      </ProSidebar>

      {/* Add the Logout Confirmation Dialog */}
      <Dialog
        open={isLogoutDialogOpen}
        onClose={handleLogoutCancel}
        PaperProps={{
          sx: {
            width: "350px",
            padding: "10px",
            borderRadius: "10px"
          }
        }}
      >
        <DialogTitle sx={{ 
          fontWeight: "bold",
          color: colors.grey[100]
        }}>
          Confirm Logout
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mt: 1 }}>
            Are you sure you want to log out? You will need to sign in again to access your account.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleLogoutCancel} color="primary">
            Cancel
          </Button>
          <Button 
            onClick={handleLogoutConfirm}
            sx={{
              color: colors.grey[100],
              fontWeight: "bold",
              backgroundColor: '#ffd700',
              "&:hover": {
                backgroundColor: '#e6c200',
              },
            }}
            variant="contained">
            Logout
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Sidebar;

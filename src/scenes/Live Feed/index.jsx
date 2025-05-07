// LiveFeed.jsx
import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  Typography, 
  useTheme, 
  Grid, 
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Snackbar,
  Alert,
  Button,
  Switch,
  FormControlLabel
} from "@mui/material";
import RefreshIcon from '@mui/icons-material/Refresh';
import VideoSettingsIcon from '@mui/icons-material/VideoSettings';
import { tokens } from "../../theme";
import Header from "../../components/Header";
import { useDetection } from "../../context/DetectionContext";

const MiniWebPlayer = ({ colors, buildingNumber, floorNumber, cameraNumber, useRtsp }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const playerRef = useRef(null);
  const { setIsFeedInitialized } = useDetection();

  // Determine the correct stream URL based on the useRtsp flag
  const streamUrl = useRtsp 
    ? "http://localhost:5000/api/rtsp-stream"  // RTSP stream endpoint
    : "http://localhost:5000/api/stream";      // Regular stream endpoint

  useEffect(() => {
    // Reset loading state when stream URL changes
    setIsLoading(true);
    setError(null);
    
    // Reset feed initialization when component unmounts
    return () => {
      if (setIsFeedInitialized) {
        setIsFeedInitialized(false);
      }
    };
  }, [setIsFeedInitialized, useRtsp]); // Add useRtsp as dependency

  return (
    <Box
      sx={{
        width: '100%',
        height: '80%',
        borderRadius: '16px',
        overflow: 'hidden',
        backgroundColor: colors.grey[100],
        position: 'relative',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Box
        sx={{
          width: "1550px",
          height: "835px",
          borderRadius: '12px',
          overflow: 'hidden',
          backgroundColor: colors.primary[400],
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Box
          ref={playerRef}
          component="img"
          src={streamUrl}
          sx={{
            width: '100%',
            height: '100%',
            border: 'none',
            objectFit: 'fill',
            objectPosition: 'center',
            display: 'block',
            opacity: isLoading ? 0 : 1,
            transition: 'opacity 0.3s'
          }}
          onLoad={() => {
            setIsLoading(false);
            if (setIsFeedInitialized) {
              setIsFeedInitialized(true);
            }
          }}
          onError={(e) => {
            console.error("Error loading feed:", e);
            setError("Failed to load video feed. Retrying...");
            setIsLoading(false);
            if (setIsFeedInitialized) {
              setIsFeedInitialized(false);
            }
          }}
        />
        {isLoading && (
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              color: colors.grey[100],
              zIndex: 2
            }}
          >
            {'Loading...'}
          </Box>
        )}
        {error && (
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              color: colors.redAccent[500],
              textAlign: 'center',
              zIndex: 2
            }}
          >
            {error}
          </Box>
        )}
      </Box>
    </Box>
  );
};

const LiveFeed = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [gridSize, setGridSize] = useState(1);
  const [selectedBuilding, setSelectedBuilding] = useState('');
  const [selectedFloor, setSelectedFloor] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const { violations, setShowAlert, hourlyViolations } = useDetection();
  const [showAlert, setShowAlertState] = useState(false);
  const [lastViolationCount, setLastViolationCount] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);
  const [useRtsp, setUseRtsp] = useState(false); // New state for RTSP toggle

  // Handle toggle between regular and RTSP stream
  const handleStreamToggle = () => {
    setUseRtsp(!useRtsp);
  };

  useEffect(() => {
    // Skip the effect on initial render
    if (!isInitialized) {
      setIsInitialized(true);
      setLastViolationCount(violations.length);
      return;
    }

    if (violations.length > lastViolationCount) {
      setShowAlert(true); // Update context alert state
      setShowAlertState(true); // Update local alert state
      const audio = new Audio('/alert.mp3');
      audio.play().catch(e => console.log('Audio play failed:', e));
    }
    setLastViolationCount(violations.length);
  }, [violations.length, isInitialized, setShowAlert]);

  const handleAlertClose = () => {
    setShowAlertState(false);
    setShowAlert(false); // Update context alert state
  };

  const renderVideoFeeds = () => {
    const feeds = [];
    for (let i = 0; i < gridSize; i++) {
      feeds.push(
        <Grid 
          item 
          xs={12} 
          md={gridSize === 1 ? 12 : 6}
          lg={gridSize === 1 ? 12 : 6}
          key={i}
        >
          <Box
            sx={{
              backgroundColor: colors.primary[400],
              height: gridSize === 1 ? "calc(100vh - 200px)" : "450px",
              borderRadius: "16px",
              position: 'relative',
              overflow: 'hidden',
              padding: '20px',
              boxShadow: `0 4px 12px rgba(0,0,0,0.2)`,
            }}
          >
            <Box
              sx={{
                backgroundColor: colors.grey[900],
                height: '100%',
                width: '100%',
                borderRadius: '12px',
                overflow: 'hidden',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <Box
                sx={{
                  position: 'relative',
                  flex: 1,
                  width: '100%',
                }}
              >
                <MiniWebPlayer 
                  colors={colors}
                  buildingNumber={selectedBuilding || "1"}
                  floorNumber={selectedFloor || "1"}
                  cameraNumber={i + 1}
                  useRtsp={useRtsp}
                />
              </Box>
            </Box>
          </Box>
        </Grid>
      );
    }
    return feeds;
  };

  return (
    <Box m="20px">
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Header title="Live Feed"/>
      </Box>
      
      <Grid 
        container 
        spacing={2} 
        justifyContent="center"
        alignItems="center"
      >
        {renderVideoFeeds()}
      </Grid>
      
      <Box mt={3}>
        <Paper
          sx={{
            backgroundColor: colors.grey[900],
            p: 2,
            cursor: 'pointer',
            border: showAlert ? `2px solid ${colors.redAccent[500]}` : `2px solid ${colors.grey[800]}`,
            borderRadius: '4px',
            transition: 'all 0.3s ease',
            animation: showAlert ? 'pulse 1.5s infinite' : 'none',
            '@keyframes pulse': {
              '0%': { boxShadow: '0 0 0 0 rgba(255, 0, 0, 0.4)' },
              '70%': { boxShadow: '0 0 0 10px rgba(255, 0, 0, 0)' },
              '100%': { boxShadow: '0 0 0 0 rgba(255, 0, 0, 0)' },
            },
          }}
          onClick={() => setOpenDialog(true)}
        >
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography 
              variant="h5" 
              sx={{
                color: showAlert ? colors.redAccent[500] : colors.grey[100],
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}
            >
              {showAlert && (
                <Box
                  component="span"
                  sx={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    backgroundColor: colors.redAccent[500],
                    animation: 'blink 1s infinite',
                    '@keyframes blink': {
                      '0%': { opacity: 0 },
                      '50%': { opacity: 1 },
                      '100%': { opacity: 0 },
                    },
                  }}
                />
              )}
              {hourlyViolations} Dress Code Violations Detected in the Past Hour
            </Typography>
          </Box>
        </Paper>

        <Dialog
          open={openDialog}
          onClose={() => setOpenDialog(false)}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              backgroundColor: colors.grey[900]
            }
          }}
        >
          <DialogTitle sx={{ color: colors.grey[100] }}>
            Dress Code Violation Logs
          </DialogTitle>
          <DialogContent sx={{ mt: 2 }}>
            <List>
              {violations.map((violation) => (
                <ListItem
                  key={violation.violation_id}
                  sx={{
                    backgroundColor: colors.grey[800],
                    mb: 1,
                    borderRadius: "4px"
                  }}
                >
                  <ListItemText
                    primary={`${violation.violation} Violation`}
                    secondary={
                      <Typography color={colors.grey[100]}>
                        Building {violation.building_number}, Floor {violation.floor_number}, Camera {violation.camera_number}
                        <br />
                        {new Date(`${violation.date}T${violation.time}`).toLocaleString()}
                      </Typography>
                    }
                  />
                </ListItem>
              ))}
            </List>
            {violations.length === 0 && (
              <Typography color={colors.grey[100]} align="center" py={2}>
                No violations found in the selected time period
              </Typography>
            )}
          </DialogContent>
        </Dialog>
      </Box>

      <FormControlLabel
        control={
          <Switch
            checked={useRtsp}
            onChange={handleStreamToggle}
            color="primary"
          />
        }
        label={
          <Box display="flex" alignItems="center" gap={1}>
            <VideoSettingsIcon />
            <Typography variant="body2">{useRtsp ? "RTSP Camera" : "Local Feed"}</Typography>
          </Box>
        }
        sx={{ 
          position: 'absolute',
          top: '50px',
          left: '1450px',
          margin: 0,
          backdropFilter: 'blur(4px)',
          '& .MuiTypography-root': {
            color: '#000',
            fontSize: '0.875rem'
          },
        }}
      />

      <Snackbar
        open={showAlert}
        autoHideDuration={5000}
        onClose={handleAlertClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          severity="error"
          variant="filled"
          sx={{ width: '100%' }}
          onClose={handleAlertClose}
        >
          New Dress Code Violation Detected!
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default LiveFeed;
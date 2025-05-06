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
  Button
} from "@mui/material";
import RefreshIcon from '@mui/icons-material/Refresh';
import { tokens } from "../../theme";
import Header from "../../components/Header";
import { useDetection } from "../../context/DetectionContext";

const MiniWebPlayer = ({ colors, buildingNumber, floorNumber, cameraNumber, videoSource, isRTSP }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const playerRef = useRef(null);
  const retryTimerRef = useRef(null);
  const { setIsFeedInitialized } = useDetection();

  // Clear retry timer on unmount
  useEffect(() => {
    return () => {
      if (retryTimerRef.current) {
        clearInterval(retryTimerRef.current);
      }
    };
  }, []);

  // Reset connection when video source changes
  useEffect(() => {
    setIsLoading(true);
    setError(null);
    setRetryCount(0);
    
    if (retryTimerRef.current) {
      clearInterval(retryTimerRef.current);
    }

    if (isRTSP) {
      initializeRTSPStream();
    }

    return () => {
      if (setIsFeedInitialized) {
        setIsFeedInitialized(false);
      }
    };
  }, [setIsFeedInitialized, videoSource]);

  const initializeRTSPStream = () => {
    if (!isRTSP) return;

    const attemptConnection = () => {
      if (playerRef.current) {
        console.log(`Attempting RTSP connection (attempt ${retryCount + 1})...`);
        playerRef.current.src = `${videoSource}?timestamp=${new Date().getTime()}`;
        playerRef.current.load();
        setRetryCount(prev => prev + 1);
      }
    };

    // Initial attempt
    attemptConnection();

    // Set up continuous retry mechanism
    retryTimerRef.current = setInterval(() => {
      if (isLoading || error) {
        attemptConnection();
      } else {
        clearInterval(retryTimerRef.current);
      }
    }, 5000); // Retry every 5 seconds
  };

  const handleStreamError = () => {
    console.error(`RTSP stream error (attempt ${retryCount})`);
    setError("Failed to load video feed. Retrying...");
    setIsLoading(false);
    if (setIsFeedInitialized) {
      setIsFeedInitialized(false);
    }
  };

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
          width: "100%",
          height: "100%",
          borderRadius: '12px',
          overflow: 'hidden',
          backgroundColor: colors.primary[400],
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        {isRTSP ? (
          <video
            ref={playerRef}
            autoPlay
            playsInline
            muted
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              display: isLoading ? 'none' : 'block'
            }}
            onLoadedData={() => {
              console.log('RTSP stream connected successfully');
              setIsLoading(false);
              setError(null);
              setRetryCount(0);
              if (setIsFeedInitialized) {
                setIsFeedInitialized(true);
              }
              if (retryTimerRef.current) {
                clearInterval(retryTimerRef.current);
              }
            }}
            onError={handleStreamError}
          />
        ) : (
          <Box
            ref={playerRef}
            component="img"
            src={videoSource}
            sx={{
              width: '100%',
              height: '100%',
              border: 'none',
              objectFit: 'contain',
              objectPosition: 'center',
              display: 'block',
              opacity: isLoading ? 0 : 1,
              transition: 'opacity 0.3s'
            }}
            onLoad={() => {
              setIsLoading(false);
              setError(null);
              if (setIsFeedInitialized) {
                setIsFeedInitialized(true);
              }
            }}
            onError={handleStreamError}
          />
        )}
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
            {isRTSP ? `Connecting to RTSP stream (attempt ${retryCount})...` : 'Loading...'}
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
            {`${error} (attempt ${retryCount})`}
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
  const { violations, setShowAlert, hourlyViolations } = useDetection();  // Add hourlyViolations
  const [showAlert, setShowAlertState] = useState(false);
  const [lastViolationCount, setLastViolationCount] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);
  const [videoSource, setVideoSource] = useState("http://localhost:5000/api/stream");
  const [isRTSP, setIsRTSP] = useState(false);

  const toggleVideoSource = () => {
    // Reset any existing connections first
    setVideoSource('');
    
    // Small delay to ensure clean transition
    setTimeout(() => {
      if (isRTSP) {
        setVideoSource("http://localhost:5000/api/stream");
      } else {
        setVideoSource("RTSP://admin:Test1234@192.168.100.139:554/onvif1");
      }
      setIsRTSP(!isRTSP);
    }, 100);
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
                  videoSource={videoSource}
                  isRTSP={isRTSP}
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
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Header title="Live Feed"/>
        <Button
          variant="contained"
          onClick={toggleVideoSource}
          sx={{
            backgroundColor: isRTSP ? colors.redAccent[500] : colors.greenAccent[500],
            color: colors.grey[100],
            fontWeight: "bold",
            '&:hover': {
              backgroundColor: isRTSP ? colors.redAccent[600] : colors.greenAccent[600],
            },
          }}
        >
          {isRTSP ? 'Switch to Local Feed' : 'RTSP Connection'}
        </Button>
      </Box>
      <Grid 
        container 
        spacing={2} 
        justifyContent="center" // Center horizontally
        alignItems="center"     // Center vertically if height permits
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

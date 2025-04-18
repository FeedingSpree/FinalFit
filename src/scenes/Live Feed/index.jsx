// LiveFeed.jsx
import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  Typography, 
  useTheme, 
  Grid, 
  Select, 
  MenuItem, 
  FormControl, 
  InputLabel,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItem,
  ListItemText,
  IconButton
} from "@mui/material";
import RefreshIcon from '@mui/icons-material/Refresh';
import { tokens } from "../../theme";
import Header from "../../components/Header";
import { getViolationLogs, addViolationLog } from "../../services/violationLogsService.ts";

const MiniWebPlayer = ({ colors, buildingNumber, floorNumber, cameraNumber, onViolationDetected }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [lastDetectionTime, setLastDetectionTime] = useState(0);
  const playerRef = useRef(null);

  useEffect(() => {
    const checkBackendStatus = async () => {
      try {
        const response = await fetch('http://localhost:5000/status');
        if (!response.ok) throw new Error('Backend not ready');
        const data = await response.json();
        console.log('Backend status:', data);
      } catch (err) {
        console.error('Backend check failed:', err);
        if (retryCount < 5) {
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
          }, 2000);
        }
      }
    };

    checkBackendStatus();
  }, [retryCount]);

  useEffect(() => {
    const checkDetection = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/detection');
        if (response.ok) {
          const data = await response.json();
          
          // Check if it's a violation detection
          if (data.type === "violation" && data.data) {
            const now = new Date();
            const violationLog = {
              building_number: parseInt(buildingNumber) || 1,
              camera_number: parseInt(cameraNumber) || 1,
              date: now.toISOString().split('T')[0],
              floor_number: parseInt(floorNumber) || 1,
              time: now.toTimeString().split(' ')[0],
              violation: data.data.violation,
              violation_id: data.data.violation_id
            };

            // Add to violation logs
            await addViolationLog(violationLog);
            // Notify parent component
            onViolationDetected(violationLog);
            console.log('Violation logged:', violationLog);
          }
        }
      } catch (error) {
        console.error('Error checking detection:', error);
      }
    };

    const detectionInterval = setInterval(checkDetection, 1000);
    return () => clearInterval(detectionInterval);
  }, [buildingNumber, floorNumber, cameraNumber, onViolationDetected]);

  const handleRefresh = () => {
    setIsLoading(true);
    setError(null);
    // Force reload the image by adding a timestamp to URL
    if (playerRef.current) {
      playerRef.current.src = `http://localhost:5000/api/stream?t=${Date.now()}`;
    }
  };

  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        border: `1px solid ${colors.grey[800]}`,
        borderRadius: '8px',
        overflow: 'hidden',
        backgroundColor: colors.primary[500],
        position: 'relative'
      }}
    >
      {/* Add refresh button */}
      <IconButton
        onClick={handleRefresh}
        sx={{
          position: 'absolute',
          top: 8,
          right: 8,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 3,
          '&:hover': {
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
          },
        }}
      >
        <RefreshIcon sx={{ color: colors.grey[100] }} />
      </IconButton>

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
          {retryCount > 0 ? `Connecting... (Attempt ${retryCount}/5)` : 'Loading...'}
        </Box>
      )}
      <Box
        ref={playerRef}
        component="img"
        src="http://localhost:5000/api/stream"
        sx={{
          width: '100%',
          height: '100%',
          border: 'none',
          objectFit: 'contain',
          display: 'block',
          opacity: isLoading ? 0 : 1,
          transition: 'opacity 0.3s'
        }}
        onLoad={() => setIsLoading(false)}
        onError={(e) => {
          console.error("Error loading feed:", e);
          setError("Failed to load video feed. Retrying...");
          setIsLoading(false);
          if (retryCount < 5) {
            setTimeout(() => setRetryCount(prev => prev + 1), 2000);
          }
        }}
      />
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
  );
};

const LiveFeed = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [gridSize, setGridSize] = useState(1);
  const [selectedBuilding, setSelectedBuilding] = useState('');
  const [selectedFloor, setSelectedFloor] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [violations, setViolations] = useState([]);
  const [filteredViolations, setFilteredViolations] = useState([]);
  const [realtimeViolations, setRealtimeViolations] = useState([]);

  useEffect(() => {
    const interval = setInterval(fetchAndFilterViolations, 60000); // Update every minute
    fetchAndFilterViolations(); // Initial fetch

    return () => clearInterval(interval);
  }, []);

  const fetchAndFilterViolations = async () => {
    try {
      const logs = await getViolationLogs();
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - (60 * 60 * 1000)); // 1 hour ago
      
      const filtered = logs.filter(violation => {
        const violationDate = new Date(`${violation.date}T${violation.time}`);
        return violationDate >= oneHourAgo && violationDate <= now;
      });

      setViolations(logs);
      setFilteredViolations(filtered);
    } catch (error) {
      console.error("Error fetching violation logs:", error);
    }
  };

  const handleViolationDetected = (violation) => {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - (60 * 60 * 1000));
    
    setRealtimeViolations(prev => {
      // Add new violation and filter out old ones
      const updated = [...prev, violation].filter(v => {
        const violationDate = new Date(`${v.date}T${v.time}`);
        return violationDate >= oneHourAgo;
      });
      return updated;
    });
  };

  const commonSelectStyles = {
    backgroundColor: colors.primary[400],
    height: "45px",
    "& .MuiSelect-select": {
      paddingTop: "10px",
    },
    "& .MuiOutlinedInput-notchedOutline": {
      border: "none"
    },
    "&:hover .MuiOutlinedInput-notchedOutline": {
      border: "none"
    },
    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
      border: "none"
    }
  };

  const handleGridChange = (event) => {
    setGridSize(event.target.value);
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
              height: gridSize === 1 ? "calc(100vh - 300px)" : "450px",
              borderRadius: "4px",
              position: 'relative',
              overflow: 'hidden',
              padding: '16px'
            }}
          >
            <Box
              sx={{
                position: 'relative',
                height: 'calc(100% - 40px)',
                width: '100%',
                borderRadius: '8px',
                overflow: 'hidden'
              }}
            >
              <MiniWebPlayer 
                colors={colors}
                buildingNumber={selectedBuilding || "1"}
                floorNumber={selectedFloor || "1"}
                cameraNumber={i + 1}
                onViolationDetected={handleViolationDetected}
              />
            </Box>

            {/* Overlay Text */}
            <Box
              sx={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
                padding: '20px 10px 10px',
                zIndex: 2,
                borderRadius: '0 0 4px 4px'
              }}
            >
              <Typography 
                variant="subtitle1" 
                color={colors.grey[100]}
                sx={{
                  textShadow: '1px 1px 2px rgba(0,0,0,0.5)'
                }}
              >
                Building {selectedBuilding || "?"} - Floor {selectedFloor || "?"} - Camera {i + 1}
              </Typography>
            </Box>
          </Box>
        </Grid>
      );
    }
    return feeds;
  };

  return (
    <Box m="20px">
      <Header title="Live Feed"/>
      {/* Optional Filters - Uncomment if needed
      <Grid container spacing={2} mb={2}>
        <Grid item xs={12} md={4}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="subtitle1" color={colors.grey[100]} sx={{ minWidth: '120px' }}>
              Camera Feeds:
            </Typography>
            <FormControl variant="filled" fullWidth>
              <InputLabel>Number of Feeds</InputLabel>
              <Select
                value={gridSize}
                onChange={handleGridChange}
                sx={commonSelectStyles}
              >
                <MenuItem value={1}>1 Feed</MenuItem>
                <MenuItem value={2}>2 Feeds</MenuItem>
                <MenuItem value={4}>4 Feeds</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Grid>

        <Grid item xs={12} md={4}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="subtitle1" color={colors.grey[100]} sx={{ minWidth: '120px' }}>
              Building Number:
            </Typography>
            <FormControl variant="filled" fullWidth>
              <InputLabel>Building Number</InputLabel>
              <Select
                value={selectedBuilding}
                onChange={(e) => setSelectedBuilding(e.target.value)}
                sx={commonSelectStyles}
              >
                {[1,2,3,4,5,6].map((num) => (
                  <MenuItem key={num} value={num}>Building {num}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Grid>

        <Grid item xs={12} md={4}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="subtitle1" color={colors.grey[100]} sx={{ minWidth: '120px' }}>
              Floor Number:
            </Typography>
            <FormControl variant="filled" fullWidth>
              <InputLabel>Floor Number</InputLabel>
              <Select
                value={selectedFloor}
                onChange={(e) => setSelectedFloor(e.target.value)}
                sx={commonSelectStyles}
              >
                {[1,2,3,4].map((num) => (
                  <MenuItem key={num} value={num}>Floor {num}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Grid>
      </Grid>
      */}

      <Grid container spacing={2}>
        {renderVideoFeeds()}
      </Grid>

      <Box mt={3}>
        <Paper
          sx={{
            backgroundColor: colors.primary[400],
            p: 2,
            cursor: 'pointer',
            border: '2px solid #ff0000',
            borderRadius: '4px'
          }}
          onClick={() => setOpenDialog(true)}
        >
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h5">
              {realtimeViolations.length} Dress Code Violations Detected in the Past Hour
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
              backgroundColor: colors.primary[400]
            }
          }}
        >
          <DialogTitle sx={{ color: colors.grey[100] }}>
            Dress Code Violation Logs
          </DialogTitle>
          <DialogContent sx={{ mt: 2 }}>
            <List>
              {realtimeViolations.map((violation) => (
                <ListItem
                  key={violation.violation_id}
                  sx={{
                    backgroundColor: colors.primary[300],
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
            {realtimeViolations.length === 0 && (
              <Typography color={colors.grey[100]} align="center" py={2}>
                No violations found in the selected time period
              </Typography>
            )}
          </DialogContent>
        </Dialog>
      </Box>
    </Box>
  );
};

export default LiveFeed;

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

const MiniWebPlayer = ({ colors }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
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
  const [timeFilter, setTimeFilter] = useState('1h');
  const [openDialog, setOpenDialog] = useState(false);

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

  const violations = [
    { 
      id: 1, 
      type: "No ID", 
      building: 1, 
      floor: 2, 
      camera: 3, 
      time: "2024-04-12 10:30:00" 
    },
    // Add more mock violations here
  ];

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
              <MiniWebPlayer colors={colors} />
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
              8 Dress Code Violations Detected
            </Typography>
            <FormControl variant="filled" sx={{ minWidth: 120 }}>
              <Select
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                sx={commonSelectStyles}
              >
                <MenuItem value="30m">Last 30 mins</MenuItem>
                <MenuItem value="1h">Last Hour</MenuItem>
                <MenuItem value="4h">Last 4 Hours</MenuItem>
                <MenuItem value="24h">Last 24 Hours</MenuItem>
              </Select>
            </FormControl>
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
              {violations.map((violation) => (
                <ListItem
                  key={violation.id}
                  sx={{
                    backgroundColor: colors.primary[300],
                    mb: 1,
                    borderRadius: "4px"
                  }}
                >
                  <ListItemText
                    primary={`${violation.type} Violation`}
                    secondary={
                      <Typography color={colors.grey[100]}>
                        Building {violation.building}, Floor {violation.floor}, Camera {violation.camera}
                        <br />
                        {new Date(violation.time).toLocaleString()}
                      </Typography>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </DialogContent>
        </Dialog>
      </Box>
    </Box>
  );
};

export default LiveFeed;

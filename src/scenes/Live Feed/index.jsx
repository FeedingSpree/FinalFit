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
  Alert
} from "@mui/material";
import RefreshIcon from '@mui/icons-material/Refresh';
import { tokens } from "../../theme";
import Header from "../../components/Header";
import { useDetection } from "../../context/DetectionContext";

const MiniWebPlayer = ({ colors, buildingNumber, floorNumber, cameraNumber }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const playerRef = useRef(null);

  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        borderRadius: '8px',
        overflow: 'hidden',
        backgroundColor: colors.grey[900],
        position: 'relative',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}
    >
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
      <Box
        ref={playerRef}
        component="img"
        src="http://localhost:5000/api/stream"
        sx={{
          width: '100%',
          height: '100%',
          border: 'none',
          objectFit: 'cover', // Changed from 'contain' to 'cover'
          display: 'block',
          opacity: isLoading ? 0 : 1,
          transition: 'opacity 0.3s'
        }}
        onLoad={() => setIsLoading(false)}
        onError={(e) => {
          console.error("Error loading feed:", e);
          setError("Failed to load video feed. Retrying...");
          setIsLoading(false);
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
  const { violations } = useDetection();
  const [showAlert, setShowAlert] = useState(false);
  const [lastViolationCount, setLastViolationCount] = useState(0);

  useEffect(() => {
    if (violations.length > lastViolationCount) {
      setShowAlert(true);
      const audio = new Audio('/alert.mp3'); // Add an alert.mp3 to your public folder
      audio.play().catch(e => console.log('Audio play failed:', e));
    }
    setLastViolationCount(violations.length);
  }, [violations.length]);

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
              backgroundColor: colors.grey[900],
              height: gridSize === 1 ? "calc(100vh - 200px)" : "450px",
              borderRadius: "10px",
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
              />
            </Box>

            <Box
              sx={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                padding: '20px 10px 10px',
                zIndex: 2,
                borderRadius: '0 0 4px 4px'
              }}
            >
              <Typography 
                variant="subtitle1" 
                color={colors.grey[100]}
                sx={{
                  //textShadow: '1px 1px 2px rgba(0,0,0,0.5)'
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
      <Grid container spacing={2}>
        {renderVideoFeeds()}
      </Grid>

      <Box mt={3}>
        <Paper
          sx={{
            backgroundColor: colors.grey[900],
            p: 2,
            cursor: 'pointer',
            border: showAlert ? `2px solid ${colors.redAccent[500]}` : '2px solid #ff0000',
            borderRadius: '4px',
            transition: 'all 0.3s ease',
            animation: showAlert ? 'pulse 1.5s infinite' : 'none',
            '@keyframes pulse': {
              '0%': {
                boxShadow: '0 0 0 0 rgba(255, 0, 0, 0.4)',
              },
              '70%': {
                boxShadow: '0 0 0 10px rgba(255, 0, 0, 0)',
              },
              '100%': {
                boxShadow: '0 0 0 0 rgba(255, 0, 0, 0)',
              },
            },
          }}
          onClick={() => setOpenDialog(true)}
        >
          <Box 
            display="flex" 
            justifyContent="space-between" 
            alignItems="center"
          >
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
              {violations.length} Dress Code Violations Detected in the Past Hour
            </Typography>
            <Box>
              <IconButton 
                onClick={(e) => {
                  e.stopPropagation();
                  setShowAlert(false);
                }}
                sx={{ 
                  color: colors.grey[100],
                  '&:hover': {
                    color: colors.redAccent[500]
                  }
                }}
              >
                <RefreshIcon />
              </IconButton>
            </Box>
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
        onClose={() => setShowAlert(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          severity="error"
          variant="filled"
          sx={{ width: '100%' }}
          onClose={() => setShowAlert(false)}
        >
          New Dress Code Violation Detected!
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default LiveFeed;
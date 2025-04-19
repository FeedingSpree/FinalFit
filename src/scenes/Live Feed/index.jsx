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
import { useDetection } from "../../context/DetectionContext";

const MiniWebPlayer = ({ colors, buildingNumber, floorNumber, cameraNumber }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const playerRef = useRef(null);

  const handleRefresh = () => {
    setIsLoading(true);
    setError(null);
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
              />
            </Box>

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
              {violations.length} Dress Code Violations Detected in the Past Hour
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
              {violations.map((violation) => (
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
            {violations.length === 0 && (
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

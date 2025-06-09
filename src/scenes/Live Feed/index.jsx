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
  FormControlLabel,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';
import { tokens } from "../../theme";
import Header from "../../components/Header";
import { useDetection } from "../../context/DetectionContext";

const MiniWebPlayer = ({ colors, buildingNumber, floorNumber, cameraNumber, selectedCamera }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const playerRef = useRef(null);
  const { setIsFeedInitialized } = useDetection();

  const getStreamUrl = () => {
    switch(selectedCamera) {
      case 1:
        return "http://localhost:5000/api/stream/camera1"; // recording_1.mp4
      case 2:
        return "http://localhost:5000/api/stream/camera2"; // sleeveless_1.mp4
      case 3:
        return "http://localhost:5000/api/stream/camera3"; // unifm.mp4
      case 4:
        return "http://localhost:5000/api/stream/camera4"; // male_pe.mp4
      case 5:
        return "http://localhost:5000/api/stream/camera5"; // fpeunif.mp4
      case 6:
        return "http://localhost:5000/api/stream/camera6"; // fregunif.mp4
      case 7:
        return "http://localhost:5000/api/rtsp-stream"; // RTSP stream
      default:
        return "http://localhost:5000/api/stream/camera1";
    }
  };

  const streamUrl = getStreamUrl();

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
  }, [setIsFeedInitialized, selectedCamera]); // Add selectedCamera as dependency

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
          width: "1200px",
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
  const [selectedCamera, setSelectedCamera] = useState(7); // New state for camera selection
  const [useRtsp, setUseRtsp] = useState(false); // Add useRtsp state
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  // Add camera selection handler
  const handleCameraChange = (event) => {
    setSelectedCamera(event.target.value);
  };

  const violationTypeMap = {
    'cap': "Cap",
    'shorts': "Shorts",
    'no_sleeves': "Sleeveless"
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
            {/* Add Camera Selector */}
            <FormControl 
              sx={{ 
                position: 'absolute',
                top: '30px',
                right: '30px',
                width: '150px',
                zIndex: 2,
                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                borderRadius: '8px',
                '& .MuiInputLabel-root': {
                  color: colors.grey[100],
                },
                '& .MuiSelect-select': {
                  color: colors.grey[100],
                },
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: colors.grey[700],
                },
              }}
            >
            </FormControl>

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
                  selectedCamera={selectedCamera}
                />
              </Box>
            </Box>
          </Box>
        </Grid>
      );
    }
    return feeds;
  };

  // Update the ImageViewerDialog component
  const ImageViewerDialog = ({ open, onClose, imageUrl }) => {
    const [loadError, setLoadError] = useState(false);

    return (
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: colors.grey[900],
            maxHeight: '90vh'
          }
        }}
      >
        <DialogTitle sx={{ color: colors.grey[100] }}>
          Violation Capture
          <IconButton
            onClick={onClose}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: colors.grey[100]
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box
            sx={{
              width: '100%',
              height: '70vh',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
            }}
          >
            {loadError ? (
              <Typography color="error">
                Failed to load image. Please try again.
              </Typography>
            ) : (
              <img
                src={imageUrl}
                alt="Violation capture"
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  objectFit: 'contain'
                }}
                onError={() => setLoadError(true)}
                onLoad={() => setLoadError(false)}
              />
            )}
          </Box>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <Box m="20px" sx={{ display: 'flex', gap: 2 }}>
      {/* Main Content */}
      <Box flex={1}>
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
      </Box>

      {/* Right Sidebar Panel */}
      <Box 
        sx={{ 
          width: '300px',
          backgroundColor: colors.primary[400],
          borderRadius: '16px',
          padding: '20px',
          height: 'calc(100vh - 100px)',
          position: 'sticky',
          top: '20px',
          border: `2px solid ${colors.grey[700]}`,
        }}
      >
        {/* Add Camera Selection at the top */}
        <FormControl 
          fullWidth
          sx={{ 
            marginBottom: '20px',
            '& .MuiInputLabel-root': {
              color: colors.grey[100],
            },
            '& .MuiSelect-select': {
              color: colors.grey[100],
            },
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: colors.grey[700],
            },
          }}
        >
          <Typography
            sx={{ 
              color: colors.grey[100],
              fontWeight: 'bold',
              paddingTop: '8px',
              paddingBottom: '8px',
              fontSize: '1rem'
            }}
          >
            Camera:
          </Typography>
          <Select
            value={selectedCamera}
            onChange={handleCameraChange}
          >
            <MenuItem value={1}>Camera 1</MenuItem>
            <MenuItem value={2}>Camera 2</MenuItem>
            <MenuItem value={3}>Camera 3</MenuItem>
            <MenuItem value={4}>Camera 4</MenuItem>
            <MenuItem value={5}>Camera 5</MenuItem>
            <MenuItem value={6}>Camera 6</MenuItem>
            <MenuItem value={7}>Camera 7</MenuItem>
          </Select>
        </FormControl>

        <Typography
          variant="h5"
          sx={{
            color: colors.grey[100],
            marginBottom: '20px',
            borderBottom: `1px solid ${colors.grey[700]}`,
            paddingBottom: '10px'
          }}
        >
          Violation Monitor
        </Typography>

        {/* Violation Counter Card */}
        <Paper
          sx={{
            backgroundColor: colors.grey[900],
            p: 3,
            cursor: 'pointer',
            border: showAlert ? `2px solid ${colors.redAccent[500]}` : `2px solid ${colors.grey[800]}`,
            borderRadius: '8px',
            transition: 'all 0.3s ease',
            marginBottom: '20px',
            animation: showAlert ? 'pulse 2s infinite' : 'none',
            '@keyframes pulse': {
              '0%': {
                boxShadow: '0 0 0 0 rgba(255, 99, 71, 0.4)'
              },
              '70%': {
                boxShadow: '0 0 0 10px rgba(255, 99, 71, 0)'
              },
              '100%': {
                boxShadow: '0 0 0 0 rgba(255, 99, 71, 0)'
              }
            },
          }}
          onClick={() => setOpenDialog(true)}
        >
          <Typography variant="h6" sx={{ color: colors.grey[100], marginBottom: 2 }}>
            Last Hour
          </Typography>
          <Box display="flex" alignItems="center" gap={2}>
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
            <Typography 
              variant="h3" 
              sx={{ 
                color: showAlert ? colors.redAccent[500] : colors.grey[100],
              }}
            >
              {hourlyViolations}
            </Typography>
            <Typography variant="body1" sx={{ color: colors.grey[300] }}>
              Violations
            </Typography>
          </Box>
        </Paper>

        {/* Recent Violations List */}
        <Typography variant="h6" sx={{ color: colors.grey[100], mb: 2 }}>
          Recent Violations
        </Typography>
        <Box sx={{ 
          maxHeight: 'calc(100vh - 350px)', 
          overflowY: 'auto',
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: colors.grey[900],
          },
          '&::-webkit-scrollbar-thumb': {
            background: colors.grey[700],
            borderRadius: '4px',
          },
        }}>
          {[...violations].reverse().slice(0, 5).map((violation) => (
            <Box
              key={violation.violation_id}
              sx={{
                backgroundColor: colors.grey[900],
                p: 2,
                mb: 1,
                borderRadius: '8px',
                '&:last-child': { mb: 0 },
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                '&:hover': {
                  backgroundColor: colors.grey[800],
                  transform: 'translateY(-2px)'
                }
              }}
              onClick={() => {
                if (violation.url) {
                  const imageUrl = `http://localhost:5000${violation.url}`;
                  setSelectedImage(imageUrl);
                  setImageViewerOpen(true);
                }
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="subtitle2" sx={{ color: colors.grey[100] }}>
                    {violationTypeMap[violation.violation] || violation.violation}
                  </Typography>
                  <Typography variant="caption" sx={{ color: colors.grey[400], display: 'block' }}>
                    {new Date(`${violation.date}T${violation.time}`).toLocaleString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true
                    })}
                  </Typography>
                  <Typography variant="caption" sx={{ color: colors.grey[400], display: 'block' }}>
                    {violation.camera_number}
                  </Typography>
                </Box>
                {violation.url && (
                  <Button
                    variant="text"
                    size="small"
                    sx={{
                      color: '#ffd700',
                      '&:hover': {
                        backgroundColor: 'rgba(255, 215, 0, 0.1)'
                      }
                    }}
                  >
                    View
                  </Button>
                )}
              </Box>
            </Box>
          ))}

        </Box>
      </Box>

      {/* Violation Details Dialog */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: colors.grey[900],
            backgroundImage: 'none',
            borderRadius: '12px',
          }
        }}
      >
        <DialogTitle 
          sx={{ 
            color: colors.grey[100],
            borderBottom: `1px solid ${colors.grey[800]}`,
            padding: '20px 24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <Typography variant="h5" component="div" sx={{ fontWeight: 'bold' }}>
            Dress Code Violation Logs
          </Typography>
          <IconButton 
            onClick={() => setOpenDialog(false)}
            sx={{ 
              color: colors.grey[500],
              '&:hover': { 
                color: colors.grey[100],
                backgroundColor: colors.grey[800]
              }
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 3 }}>
          {violations.length > 0 ? (
            <List sx={{ py: 0 }}>
              {[...violations]
                .sort((a, b) => new Date(`${b.date}T${b.time}`) - new Date(`${a.date}T${a.time}`))
                .map((violation) => (
                  <ListItem
                    key={violation.violation_id}
                    sx={{
                      backgroundColor: colors.grey[800],
                      mb: 2,
                      borderRadius: "8px",
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        backgroundColor: colors.grey[700],
                      },
                      padding: '16px'
                    }}
                  >
                    <Box sx={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography 
                          sx={{ 
                            color: colors.grey[100],
                            fontWeight: 'bold',
                            fontSize: '1rem',
                            mb: 0.5
                          }}
                        >
                          {`${violationTypeMap[violation.violation] || violation.violation} Violation`}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                          <Typography sx={{ color: colors.grey[400], fontSize: '0.875rem' }}>
                            {violation.camera_number}
                          </Typography>
                          <Box 
                            sx={{ 
                              width: '4px', 
                              height: '4px', 
                              borderRadius: '50%', 
                              backgroundColor: colors.grey[500] 
                            }} 
                          />
                          <Typography sx={{ color: colors.grey[400], fontSize: '0.875rem' }}>
                            {new Date(`${violation.date}T${violation.time}`).toLocaleString('en-US', {
                              month: 'long',
                              day: 'numeric',
                              year: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit',
                              hour12: true
                            })}
                          </Typography>
                        </Box>
                      </Box>
                      {violation.url && (
                        <Button
                          variant="contained"
                          size="small"
                          onClick={() => {
                            const imageUrl = `http://localhost:5000${violation.url}`;
                            setSelectedImage(imageUrl);
                            setImageViewerOpen(true);
                          }}
                          sx={{
                            backgroundColor: '#ffd700',
                            color: colors.grey[100],
                            fontWeight: 'bold',
                            '&:hover': {
                              backgroundColor: '#e6c200'
                            }
                          }}
                        >
                          View Image
                        </Button>
                      )}
                    </Box>
                  </ListItem>
                ))}
            </List>
          ) : (
            <Box 
              sx={{ 
                textAlign: 'center', 
                py: 4,
                backgroundColor: colors.grey[800],
                borderRadius: '8px'
              }}
            >
              <Typography color={colors.grey[100]}>
                No violations detected in the last hour
              </Typography>
            </Box>
          )}
        </DialogContent>
      </Dialog>


      {/* Image Viewer Dialog */}
      <ImageViewerDialog
        open={imageViewerOpen}
        onClose={() => setImageViewerOpen(false)}
        imageUrl={selectedImage}
      />

      {/* Alert Snackbar */}
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
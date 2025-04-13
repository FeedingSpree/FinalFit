// LiveFeed.jsx
import React, { useState } from 'react';
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
  ListItemText
} from "@mui/material";
import { tokens } from "../../theme";
import Header from "../../components/Header";

const LiveFeed = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [gridSize, setGridSize] = useState(1);
  const [selectedBuilding, setSelectedBuilding] = useState('');
  const [selectedFloor, setSelectedFloor] = useState('');
  const [timeFilter, setTimeFilter] = useState('1h');
  const [openDialog, setOpenDialog] = useState(false);

  // Common styles for Select components
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

  // Mock violation data
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
              height: gridSize === 1 ? "60vh" : 
                     gridSize === 2 ? "60vh" : 
                     "30vh",
              borderRadius: "4px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.3s ease"
            }}
          >
            <Typography variant="h6" color={colors.grey[100]}>
              Building {selectedBuilding} - Floor {selectedFloor}
            </Typography>
            <Typography variant="subtitle1" color={colors.grey[100]}>
              Camera {i + 1}
            </Typography>
          </Box>
        </Grid>
      );
    }
    return feeds;
  };

  return (
    <Box m="20px">
      <Header title="Live Feed"/>
      
      <Grid container spacing={2} mb={2}>
        <Grid item xs={12} md={4}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography 
              variant="subtitle1" 
              color={colors.grey[100]}
              sx={{ minWidth: '120px' }}
            >
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
            <Typography 
              variant="subtitle1" 
              color={colors.grey[100]}
              sx={{ minWidth: '120px' }}
            >
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
            <Typography 
              variant="subtitle1" 
              color={colors.grey[100]}
              sx={{ minWidth: '120px' }}
            >
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
            borderRadius: '4px',
            "& .MuiOutlinedInput-notchedOutline": {
              border: "none"
            }
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
              backgroundColor: colors.primary[400],
              "& .MuiOutlinedInput-notchedOutline": {
                border: "none"
              }
            }
          }}
        >
          <DialogTitle sx={{ backgroundColor: colors.primary[400], color: colors.grey[100] }}>
            Dress Code Violation Logs
          </DialogTitle>
          <DialogContent sx={{ backgroundColor: colors.primary[400], mt: 2 }}>
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
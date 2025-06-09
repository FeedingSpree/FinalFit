import React, { useState, useEffect } from 'react';
import {
  Box,
  useTheme,
  Button,
  Modal,
  TextField,
  Typography,
  Select,
  MenuItem,
  Dialog,
  DialogActions,
  DialogTitle,
  DialogContent,
  OutlinedInput,
  IconButton,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import {
  GridToolbarContainer,
  GridToolbarDensitySelector
} from '@mui/x-data-grid';
import { tokens } from "../../theme.js";
import Header from "../../components/Header.jsx";
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckIcon from '@mui/icons-material/Check';
// Firebase service functions
import {
  addViolationLog,
  updateViolationLog,
  getNonViolationLogs // Add this import
} from "../../services/violationLogsService.ts";
import {
  getReviewLogs,
  updateReviewLog,
  deleteReviewLog
} from "../../services/reviewLogsService.ts";
import { 
  addStudentRecord 
} from "../../services/studentRecordsService.ts";
import { current } from '@reduxjs/toolkit';

// Add these constants at the top of the file (before the components)
const yearLevel = ["1st Year", "2nd Year", "3rd Year", "4th Year", "5th Year"];
const departments = [
  "CBE",
  "CCS",
  "CEA",
  "CoA",
  "CoE"
];

const programs = {
  "CBE": [
    "Accountancy",
    "Accounting Information Sytems",
    "Financial Management",
    "Human Resource Management",
    "Logistics and Supply Management",
    "Marketing Management"
  ],
  "CCS": [
    "Computer Science",
    "Data Science and Analytics",
    "Information Systems",
    "Information Technology"
  ],
  "CEA": [
    "Architecture",
    "Civil Engineering",
    "Computer Engineering",
    "Electrical Engineering",
    "Electronics Engineering",
    "Environmental and Sanitary Engineering",
    "Industrial Engineering",
    "Mechanical Engineering"
  ],
  "CoA": [
    "BA English",
    "BA Political Science"
  ],
  "CoE": [
    "BSE Major in English",
    "BSE Major in Mathematics",
    "BSE Major in Sciences",
    "Bachelor of Special Needs Education"
  ]
};

// Modify CustomToolbar component
const CustomToolbar = ({ searchText, onSearchChange, dateFilter, onDateChange }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  
  return (
    <GridToolbarContainer sx={{ padding: "8px" }}>
      <Box
        sx={{
          p: 0.5,
          pb: 0,
          display: "flex",
          alignItems: "center",
          width: "100%",
          gap: 2
        }}
      >
        <TextField
          variant="outlined"
          size="small"
          placeholder="Search..."
          value={searchText}
          onChange={(e) => onSearchChange(e.target.value)}
          sx={{
            width: "300px",
            "& .MuiOutlinedInput-root": {
              backgroundColor: colors.primary[400],
              color: colors.grey[100],
              "& fieldset": {
                borderColor: colors.grey[400],
              },
              "&:hover fieldset": {
                borderColor: colors.grey[300],
              },
            },
            "& .MuiOutlinedInput-input": {
              color: colors.grey[100],
            },
          }}
        />
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography 
            variant="subtitle2" 
            sx={{ 
              color: colors.grey[100],
              fontSize: '0.875rem',
              whiteSpace: 'nowrap'
            }}
          >
            Search by date:
          </Typography>
          <TextField
            type="date"
            size="small"
            value={dateFilter}
            onChange={(e) => onDateChange(e.target.value)}
            sx={{
              width: "200px",
              "& .MuiOutlinedInput-root": {
                backgroundColor: colors.primary[400],
                color: colors.grey[100],
                "& fieldset": {
                  borderColor: colors.grey[400],
                },
                "&:hover fieldset": {
                  borderColor: colors.grey[300],
                },
              },
              "& .MuiOutlinedInput-input": {
                color: colors.grey[100],
                "&::-webkit-calendar-picker-indicator": {
                  cursor: "pointer"
                }
              },
            }}
          />
        </Box>
        <GridToolbarDensitySelector />
      </Box>
    </GridToolbarContainer>
  );
};

const AuditLogs = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [logs, setLogs] = useState([]);
  const [nonViolationLogs, setNonViolationLogs] = useState([]); // Add this state
  const [allViolationLogs, setAllViolationLogs] = useState([]); // Add new state for storing all logs
  const [allNonViolationLogs, setAllNonViolationLogs] = useState([]); // Add new state for storing all logs
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentLog, setCurrentLog] = useState(null);
  const [selectedRows, setSelectedRows] = useState([]);
  const [filterModel, setFilterModel] = useState({
    items: [],
    quickFilterValues: [],
  });
  const [sortModel, setSortModel] = useState([
    {
      field: 'date',
      sort: 'desc',
    },
  ]);
  const [searchText, setSearchText] = useState("");
  const [activeTable, setActiveTable] = useState('violations'); // Add this state
  const [dateFilter, setDateFilter] = useState(""); // Add this state
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [currentViolation, setCurrentViolation] = useState(null);

  useEffect(() => {
    fetchLogs();
  }, [activeTable]); // Add activeTable as dependency

  // Add a new function to check if filters are active
  const hasActiveFilters = () => {
    return !!(searchText || dateFilter);
  };

  // Modify the fetchLogs function to sort the data
  const fetchLogs = async () => {
    try {
      if (activeTable === 'violations') {
        const data = await getReviewLogs();
        // Sort data by date and time in descending order
        const sortedData = [...data].sort((a, b) => {
          const dateA = new Date(`${a.date}T${a.time}`);
          const dateB = new Date(`${b.date}T${b.time}`);
          return dateB - dateA;
        });
        
        setAllViolationLogs(sortedData);
        
        // Apply existing filters to new data
        let filteredData = [...sortedData];
        
        // Apply date filter with proper formatting
        if (dateFilter) {
          filteredData = filteredData.filter(log => {
            const logDate = new Date(log.date).toISOString().split('T')[0];
            return logDate === dateFilter;
          });
        }
        
        // Apply search filter if exists
        if (searchText) {
          filteredData = filteredData.filter(log => 
            Object.values(log).some(value => 
              value && value.toString().toLowerCase().includes(searchText.toLowerCase())
            )
          );
        }
        
        setLogs(filteredData);
      } else {
        const data = await getNonViolationLogs();
        // Sort data by date and time in descending order
        const sortedData = [...data].sort((a, b) => {
          const dateA = new Date(`${a.date}T${a.time}`);
          const dateB = new Date(`${b.date}T${b.time}`);
          return dateB - dateA;
        });
        
        setAllNonViolationLogs(sortedData);
        
        // Apply existing filters to new data
        let filteredData = [...sortedData];
        
        if (dateFilter) {
          filteredData = filteredData.filter(log => {
            const logDate = new Date(log.date).toISOString().split('T')[0];
            return logDate === dateFilter;
          });
        }
        
        if (searchText) {
          filteredData = filteredData.filter(log => 
            Object.values(log).some(value => 
              value && value.toString().toLowerCase().includes(searchText.toLowerCase())
            )
          );
        }
        
        setNonViolationLogs(filteredData);
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
    }
  };

  const handleDateChange = async (date) => {
    setDateFilter(date);
    
    let filteredLogs = activeTable === 'violations' 
      ? [...allViolationLogs] 
      : [...allNonViolationLogs];
    
    if (date) {
      filteredLogs = filteredLogs.filter(log => {
        const logDate = new Date(log.date).toISOString().split('T')[0];
        return logDate === date;
      });
    } else {
      // If date is cleared, resume auto-refresh
    }
    
    // Apply existing search filter if any
    if (searchText) {
      filteredLogs = filteredLogs.filter(log => 
        Object.values(log).some(value => 
          value && value.toString().toLowerCase().includes(searchText.toLowerCase())
        )
      );
    }
    
    if (activeTable === 'violations') {
      setLogs(filteredLogs);
    } else {
      setNonViolationLogs(filteredLogs); // Changed from filteredData to filteredLogs
    }
  };

  const handleOpenModal = (log = null) => {
    setCurrentLog(log);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentLog(null);
  };

  const handleSaveLog = async () => {
    const formattedLog = {
      ...currentLog,
      violation_id: currentLog.violation_id || `VIO-${Date.now()}`,
      // Keep the date in yyyy-mm-dd format
      date: currentLog.date,
      // Keep the time in HH:mm:ss format
      time: currentLog.time
    };

    if (currentLog.id) {
      await updateViolationLog(currentLog.id, formattedLog);
    } else {
      await addViolationLog(formattedLog);
    }
    await fetchLogs();
    handleCloseModal();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCurrentLog({ ...currentLog, [name]: value });
  };

  const handleSearch = (searchValue) => {
    setSearchText(searchValue);
    
    let filteredLogs = activeTable === 'violations' 
      ? [...allViolationLogs] 
      : [...allNonViolationLogs];
    
    if (dateFilter) {
      filteredLogs = filteredLogs.filter(log => {
        const logDate = new Date(log.date).toISOString().split('T')[0];
        return logDate === dateFilter;
      });
    }
    
    if (searchValue) {
      filteredLogs = filteredLogs.filter(log => 
        Object.values(log).some(value => 
          value && value.toString().toLowerCase().includes(searchValue.toLowerCase())
        )
      );
    } else {
      // If search is cleared and no date filter, resume auto-refresh
      if (!dateFilter) {
        //setIsFiltering(false);
      }
    }
    
    if (activeTable === 'violations') {
      setLogs(filteredLogs);
    } else {
      setNonViolationLogs(filteredLogs);
    }
  };

  const violationColumns = [
    {
      field: "violation",
      headerName: "Violation",
      flex: 1,
      cellClassName: "violation-column--cell",
      valueFormatter: ({ value }) => {
        const violationMap = {
          cap: "Cap",
          shorts: "Shorts",
          no_sleeves: "Sleeveless"
        };

        return violationMap[value] || (value ? value.charAt(0).toUpperCase() + value.slice(1) : '');
      }
    },
    {
      field: "date",
      headerName: "Date",
      flex: 1,
      valueFormatter: ({ value }) => {
        if (!value) return '';
        // Split the yyyy-mm-dd format
        const [year, month, day] = value.split('-');
        // Create date string in desired format
        const months = [
          'January', 'February', 'March', 'April', 'May', 'June',
          'July', 'August', 'September', 'October', 'November', 'December'
        ];
        return `${months[parseInt(month) - 1]} ${parseInt(day)}, ${year}`;
      }
    },
    {
      field: "time",
      headerName: "Time",
      flex: 1,
      valueFormatter: ({ value }) => {
        if (!value) return '';
        // Convert 24-hour format to 12-hour format
        const [hours, minutes, seconds] = value.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const hour12 = hour % 12 || 12;
        return `${hour12}:${minutes}:${seconds} ${ampm}`;
      }
    },
    {
      field: "status",
      headerName: "Status",
      flex: 1,
      renderCell: ({ value }) => {
        let backgroundColor;
        switch (value?.toLowerCase()) {
          case 'processed':
            backgroundColor = '#4caf50'; // green
            break;
          case 'pending':
            backgroundColor = '#ff9800'; // orange
            break;
          default:
            backgroundColor = '#757575'; // default grey
        }

        return (
          <Box
            sx={{
              backgroundColor,
              padding: '5px 10px',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100px', // Set fixed width
              minWidth: '100px', // Ensure minimum width
              height: '30px', // Set fixed height
            }}
          >
            <Typography sx={{ 
              color: '#fff',
              fontSize: '14px',
              fontWeight: 'bold',
              textAlign: 'center',
              width: '100%' // Ensure text takes full width of container
            }}>
              {value ? value.charAt(0).toUpperCase() + value.slice(1) : ''}
            </Typography>
          </Box>
        );
      },
    },
    {
      field: "actions",
      headerName: "Actions",
      flex: 0.8,
      sortable: false,
      filterable: false,
      renderCell: (params) => {
        return (
          <Box display="flex" gap="5px">
            {params.row.url && (
              <Typography
                onClick={() => {
                  const imageUrl = `http://localhost:5000${params.row.url}`;
                  setSelectedImage(imageUrl);
                  setCurrentViolation(params.row);
                  setImageViewerOpen(true);
                }}
                sx={{
                  color: '#0288D1',
                  cursor: 'pointer',
                  textDecoration: 'none',
                  textDecoration: 'underline',
                  '&:hover': {
                    textDecoration: 'underline',
                    color: '#1B247E'
                  },
                  fontSize: '14px',
                  fontWeight: 'medium'
                }}
              >
                Process Violation
              </Typography>
            )}
          </Box>
        );
      },
    }
  ];

  const nonViolationColumns = [
    { 
      field: "detection", 
      headerName: "Non-Violation", 
      flex: 1, 
      cellClassName: "detection-column--cell",
      valueFormatter: ({ value }) => {
        const detectionMap = {
          reg_unif_m: "Regular Uniform (Male)",
          reg_unif_f: "Regular Uniform (Female)",
          pe_unif_m: "PE Uniform (Male)",
          pe_unif_f: "PE Uniform (Female)"
        };

        return detectionMap[value] || (value ? value.charAt(0).toUpperCase() + value.slice(1) : '');
      }
    },
    {
      field: "date",
      headerName: "Date",
      flex: 1,
      valueFormatter: ({ value }) => {
        if (!value) return '';
        const [year, month, day] = value.split('-');
        const months = [
          'January', 'February', 'March', 'April', 'May', 'June',
          'July', 'August', 'September', 'October', 'November', 'December'
        ];
        return `${months[parseInt(month) - 1]} ${parseInt(day)}, ${year}`;
      }
    },
    {
      field: "time",
      headerName: "Time",
      flex: 1,
      valueFormatter: ({ value }) => {
        if (!value) return '';
        const [hours, minutes, seconds] = value.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const hour12 = hour % 12 || 12;
        return `${hour12}:${minutes}:${seconds} ${ampm}`;
      }
    },
    {
      field: "status",
      headerName: "Status",
      flex: 1,
      renderCell: ({ value }) => {
        return (
          <Box
            sx={{
              backgroundColor: '#4caf50',
              padding: '5px 10px',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100px',
              minWidth: '100px',
              height: '30px',
            }}
          >
            <Typography sx={{ 
              color: '#fff',
              fontSize: '14px',
              fontWeight: 'bold',
              textAlign: 'center',
              width: '100%'
            }}>
              {value ? value.charAt(0).toUpperCase() + value.slice(1) : 'Detected'}
            </Typography>
          </Box>
        );
      },
    },
    {
      field: "actions",
      headerName: "Actions",
      flex: 0.8,
      sortable: false,
      filterable: false,
      renderCell: (params) => {
        return (
          <Box display="flex" gap="5px">
            {params.row.url && (
              <Typography
                onClick={() => {
                  const imageUrl = `http://localhost:5000${params.row.url}`;
                  setSelectedImage(imageUrl);
                  setCurrentViolation(params.row);
                  setImageViewerOpen(true);
                }}
                sx={{
                  color: '#0288D1',
                  cursor: 'pointer',
                  textDecoration: 'none',
                  textDecoration: 'underline',
                  '&:hover': {
                    textDecoration: 'underline',
                    color: '#1B247E'
                  },
                  fontSize: '14px',
                  fontWeight: 'medium'
                }}
              >
                View Image
              </Typography>
            )}
          </Box>
        );
      },
    }
  ];

  const handleDelete = async (violation) => {
    try {
      await deleteReviewLog(violation.id);
      await fetchLogs();
      setImageViewerOpen(false);
      setSelectedImage(null);
      setCurrentViolation(null);
    } catch (error) {
      console.error('Error deleting log:', error);
    }
  };

  // Add handleRefresh function before the return statement in AuditLogs component
  const handleRefresh = () => {
    // Clear any filters before refreshing
    setSearchText("");
    setDateFilter("");
    // Fetch fresh data
    fetchLogs();
  };

  // Add refresh interval to AuditLogs component
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      if (!hasActiveFilters()) {
        fetchLogs();
      }
    }, 3000); // Refresh every 3 seconds

    return () => clearInterval(refreshInterval);
  }, [activeTable]);

  return (
    <Box m="20px">
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Header title="Detection Logs" />
        <Box>
          <Button
            onClick={() => setActiveTable('violations')}
            variant={activeTable === 'violations' ? 'contained' : 'outlined'}
            sx={{ 
              mr: 2,
              backgroundColor: activeTable === 'violations' ? '#ffd700' : 'transparent',
              color: activeTable === 'violations' ? colors.primary[500] : colors.grey[100],
              fontSize: '14px',
              fontWeight: 'bold',
              '&:hover': {
                backgroundColor: activeTable === 'violations' ? '#e6c200' : colors.grey[800]
              }
            }}
          >
            Violation Logs
          </Button>
          <Button
            onClick={() => setActiveTable('nonviolations')}
            variant={activeTable === 'nonviolations' ? 'contained' : 'outlined'}
            sx={{ 
              backgroundColor: activeTable === 'nonviolations' ? '#ffd700' : 'transparent',
              color: activeTable === 'nonviolations' ? colors.primary[500] : colors.grey[100],
              fontWeight: 'bold',
              fontSize: '14px',
              '&:hover': {
                backgroundColor: activeTable === 'nonviolations' ? '#e6c200' : colors.grey[800]
              }
            }}
          >
            Non-Violation Logs
          </Button>
        </Box>
      </Box>

      <Box m="0px 0 0 0" height="88vh">
        <DataGrid
          checkboxSelection
          rows={activeTable === 'violations' ? logs : nonViolationLogs}
          columns={activeTable === 'violations' ? violationColumns : nonViolationColumns}
          components={{
            Toolbar: CustomToolbar
          }}
          componentsProps={{
            toolbar: {
              searchText,
              onSearchChange: handleSearch,
              dateFilter,
              onDateChange: handleDateChange
            }
          }}
          sortModel={sortModel}
          onSortModelChange={(newModel) => setSortModel(newModel)}
          filterModel={filterModel}
          onFilterModelChange={(newModel) => setFilterModel(newModel)}
          onSelectionModelChange={(ids) => setSelectedRows(ids)}
          onRowDoubleClick={(params) => handleOpenModal(params.row)}
          initialState={{
            sorting: {
              sortModel: [{ field: 'date', sort: 'desc' }],
            },
          }}
          sx={{
            ...dataGridStyles(colors),
            border: "none",
            paddingTop: "5px",
          }}
        />
      </Box>

      <Modal
        open={isModalOpen}
        onClose={handleCloseModal}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box>
          <TextField
            label="Violation"
            fullWidth
            margin="normal"
            name="violation"
            value={currentLog?.violation || ''}
            onChange={handleChange}
            sx={textFieldStyle(colors)}
          />

          <TextField
            label="Building Number"
            fullWidth
            margin="normal"
            name="building_number"
            value={currentLog?.building_number || ''}
            onChange={handleChange}
            sx={textFieldStyle(colors)}
          />

          <TextField
            label="Floor Number"
            fullWidth
            margin="normal"
            name="floor_number"
            value={currentLog?.floor_number || ''}
            onChange={handleChange}
            sx={textFieldStyle(colors)}
          />

          <TextField
            label="Date"
            fullWidth
            margin="normal"
            name="date"
            type="date"
            value={
              currentLog?.date
                ? new Date(currentLog.date).toISOString().split('T')[0]
                : ''
            }
            onChange={(e) => {
              const date = new Date(e.target.value);
              setCurrentLog({ ...currentLog, date: date.toISOString() });
            }}
            sx={textFieldStyle(colors)}
            InputLabelProps={{ shrink: true }}
          />

          <TextField
            label="Time"
            fullWidth
            margin="normal"
            name="time"
            type="time"
            value={
              currentLog?.time
                ? new Date(currentLog.time).toISOString().split('T')[1].substring(0, 5)
                : ''
            }
            onChange={(e) => {
              const [hours, minutes] = e.target.value.split(':');
              const time = new Date();
              time.setHours(hours);
              time.setMinutes(minutes);
              setCurrentLog({ ...currentLog, time: time.toISOString() });
            }}
            sx={textFieldStyle(colors)}
            InputLabelProps={{ shrink: true }}
          />

          <Box mt={2}>
            <Button variant="contained" color="primary" onClick={handleSaveLog}>Save</Button>
            <Button variant="outlined" color="secondary" onClick={handleCloseModal}>Cancel</Button>
          </Box>
        </Box>
      </Modal>

      <ImageViewerDialog
        open={imageViewerOpen}
        onClose={() => {
          setImageViewerOpen(false);
          setSelectedImage(null);
          setCurrentViolation(null);
        }}
        imageUrl={selectedImage}
        currentViolation={currentViolation}
        onDelete={handleDelete}
        fetchLogs={fetchLogs}
        isViolation={activeTable === 'violations'} // Add this prop
      />
    </Box>
  );
};

// confirm delete dialog
const ConfirmDeleteDialog = ({ open, onClose, onConfirm, colors }) => (
  <Dialog
    open={open}
    onClose={onClose}
  >
    <DialogTitle sx={{ color: colors.grey[100] }}>
      Confirm Removal
    </DialogTitle>
    <DialogContent>
      <Typography sx={{ color: colors.grey[100] }}>
        Are you sure you want to remove this violation?
      </Typography>
    </DialogContent>
    <DialogActions>
      <Button 
        onClick={onClose}
        sx={{ 
          color: colors.grey[100],
          '&:hover': { backgroundColor: colors.grey[800] }
        }}
      >
        Cancel
      </Button>
      <Button 
        onClick={onConfirm}
        variant="contained"
        sx={{
          backgroundColor: colors.redAccent[600],
          color: colors.grey[100],
          '&:hover': { backgroundColor: colors.redAccent[700] }
        }}
      >
        Remove
      </Button>
    </DialogActions>
  </Dialog>
);

const ImageViewerDialog = ({ 
  open, 
  onClose, 
  imageUrl, 
  currentViolation, 
  onDelete,
  fetchLogs,
  isViolation = true // Add this prop to determine the type
}) => {
  const [loadError, setLoadError] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [formData, setFormData] = useState({
    studentNumber: '',
    name: '',
    department: '',
    program: '',
    yearLevel: '',
    violation: currentViolation?.violation || '',
    date: new Date().toISOString().split('T')[0]
  });
  const [formErrors, setFormErrors] = useState({});

  const validateName = (name) => /^[A-Za-z\s]+$/.test(name);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setFormErrors(prev => ({
      ...prev,
      [field]: ''
    }));

    if (field === 'studentNumber') {
      if (!value) {
        setFormErrors(prev => ({
          ...prev,
          studentNumber: 'Student number is required'
        }));
      } else if (!validateStudentNumber(value)) {
        setFormErrors(prev => ({
          ...prev,
          studentNumber: 'Student number must be exactly 7 digits'
        }));
      }
    }

    if (field === 'name') {
      if (!value) {
        setFormErrors(prev => ({
          ...prev,
          name: 'Student name is required'
        }));
      } else if (!validateStudentName(value)) {
        setFormErrors(prev => ({
          ...prev,
          name: 'Enter complete name (e.g., Juan Dela Cruz)'
        }));
      }
    }
  };

  const handleDepartmentChange = (e) => {
    const department = e.target.value;
    setFormData(prev => ({
      ...prev,
      department,
      program: ''
    }));
    setFormErrors(prev => ({
      ...prev,
      department: '',
      program: ''
    }));
  };

  const handleSubmit = async () => {
    let errors = {};

    if (!formData.studentNumber || !formData.studentNumber.trim()) {
      errors.studentNumber = 'Student number is required';
    }
    if (!formData.name || !validateName(formData.name)) {
      errors.name = 'Enter a valid name (letters and spaces only)';
    }
    if (!formData.department) errors.department = 'Department is required';
    if (!formData.program) errors.program = 'Program is required';
    if (!formData.yearLevel) errors.yearLevel = 'Year level is required';
    if (!formData.date) errors.date = 'Date is required';

    setFormErrors(errors);

    if (Object.keys(errors).length === 0) {
      try {
        const formattedData = {
          ...formData,
          violation: currentViolation.violation.charAt(0).toUpperCase() + currentViolation.violation.slice(1),
          date: currentViolation.date.split("-").slice(1).concat(currentViolation.date.split("-")[0]).join("-"),
          violation_id: currentViolation.violation_id,
          imageUrl: `http://localhost:5000${currentViolation.url}`
        };

        await addStudentRecord(formattedData);
        await updateReviewLog(currentViolation.id, { status: 'Processed' });
        await fetchLogs();
        onClose();
      } catch (error) {
        console.error('Error processing approval:', error);
      }
    }
  };

return (
  <>
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={isViolation ? "xl" : "md"}
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: colors.grey[900],
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column'
        }
      }}
    >
      <DialogTitle
        sx={{
          color: colors.grey[100],
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: `1px solid ${colors.grey[800]}`,
          px: 3,
          py: 2
        }}
      >
        <Typography variant="h6">
          {isViolation ? "Captured Violation" : "Captured Detection"}
        </Typography>
        <IconButton
          onClick={onClose}
          sx={{ color: colors.grey[100] }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent
        sx={{
          display: 'flex',
          flexDirection: isViolation ? 'row' : 'column',
          gap: 2,
          p: 3,
        }}
      >
        {/* Image Display */}
        <Box sx={{ 
          flex: isViolation ? 2 : 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          ...(isViolation && { borderRight: `1px solid ${colors.grey[800]}` })
        }}>
          {loadError ? (
            <Typography color="error">
              Failed to load image. Please try again.
            </Typography>
          ) : (
            <img
              src={imageUrl}
              alt="Detection capture"
              style={{
                maxWidth: '100%',
                maxHeight: isViolation ? '90%' : '70vh',
                objectFit: 'contain'
              }}
              onError={() => setLoadError(true)}
              onLoad={() => setLoadError(false)}
            />
          )}
        </Box>

        {/* Conditional Student Details Form */}
        {isViolation && (
          <Box
            sx={{
              flex: 1,
              backgroundColor: colors.grey[900],
              overflowY: 'auto'
            }}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* Ticket Number Field (Non-editable) */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, paddingTop: 2 }}>
                <Typography sx={{ color: colors.grey[100], fontWeight: 'bold' }}>
                  Ticket Number:
                </Typography>
                <Typography sx={{ color: colors.grey[100] }}>
                  {currentViolation?.violation_id || 'N/A'}
                </Typography>
              </Box>


              {/* Student Number Input */}
              <Box>
                <Typography sx={{ color: colors.grey[100], mb: 1, fontWeight: 'bold' }}>
                  Student Number *
                </Typography>
                <OutlinedInput
                  fullWidth
                  value={formData.studentNumber || ''}
                  onChange={(e) => {
                    // Only allow numbers
                    const value = e.target.value.replace(/[^\d]/g, '');
                    // Limit to 7 digits
                    if (value.length <= 7) {
                      handleInputChange('studentNumber', value);
                    }
                  }}
                  placeholder="Enter 7-digit student number"
                  error={!!formErrors.studentNumber}
                  inputProps={{
                    maxLength: 7,
                    inputMode: 'numeric',
                    pattern: '[0-9]*'
                  }}
                  sx={{
                    backgroundColor: colors.primary[400],
                    borderRadius: '4px',
                    '& .MuiOutlinedInput-input': { color: colors.grey[100] }
                  }}
                />
                {formErrors.studentNumber && (
                  <Typography color="error" variant="caption">
                    {formErrors.studentNumber}
                  </Typography>
                )}
              </Box>

              {/* Existing Name Input */}
              <Box>
                <Typography sx={{ color: colors.grey[100], mb: 1, fontWeight: 'bold' }}>
                  Student Name *
                </Typography>
                <OutlinedInput
                  fullWidth
                  value={formData.name}
                  onChange={(e) => {
                    // Only allow letters and spaces
                    const value = e.target.value.replace(/[^A-Za-z\s]/g, '');
                    handleInputChange('name', value);
                  }}
                  placeholder="Enter complete name"
                  error={!!formErrors.name}
                  sx={{
                    backgroundColor: colors.primary[400],
                    borderRadius: '4px',
                    '& .MuiOutlinedInput-input': { color: colors.grey[100] }
                  }}
                />
                {formErrors.name && (
                  <Typography color="error" variant="caption">
                    {formErrors.name}
                  </Typography>
                )}
              </Box>

              {/* Department Select */}
              <Box>
                <Typography sx={{ color: colors.grey[100], mb: 1, fontWeight: 'bold' }}>
                  Department *
                </Typography>
                <Select
                  fullWidth
                  value={formData.department}
                  onChange={handleDepartmentChange}
                  error={!!formErrors.department}
                  sx={{
                    backgroundColor: colors.primary[400],
                    color: colors.grey[100]
                  }}
                >
                  {departments.map((dept) => (
                    <MenuItem key={dept} value={dept}>{dept}</MenuItem>
                  ))}
                </Select>
                {formErrors.department && (
                  <Typography color="error" variant="caption">
                    {formErrors.department}
                  </Typography>
                )}
              </Box>

              {/* Program Select */}
              <Box>
                <Typography sx={{ color: colors.grey[100], mb: 1, fontWeight: 'bold' }}>
                  Program *
                </Typography>
                <Select
                  fullWidth
                  value={formData.program}
                  onChange={(e) => handleInputChange('program', e.target.value)}
                  error={!!formErrors.program}
                  disabled={!formData.department}
                  sx={{
                    backgroundColor: colors.primary[400],
                    color: colors.grey[100]
                  }}
                >
                  {formData.department &&
                    programs[formData.department].map((prog) => (
                      <MenuItem key={prog} value={prog}>{prog}</MenuItem>
                    ))}
                </Select>
                {formErrors.program && (
                  <Typography color="error" variant="caption">
                    {formErrors.program}
                  </Typography>
                )}
              </Box>

              {/* Year Level Select */}
              <Box>
                <Typography sx={{ color: colors.grey[100], mb: 1, fontWeight: 'bold' }}>
                  Year Level *
                </Typography>
                <Select
                  fullWidth
                  value={formData.yearLevel}
                  onChange={(e) => handleInputChange('yearLevel', e.target.value)}
                  error={!!formErrors.yearLevel}
                  sx={{
                    backgroundColor: colors.primary[400],
                    color: colors.grey[100]
                  }}
                >
                  {yearLevel.map((year) => (
                    <MenuItem key={year} value={year}>{year}</MenuItem>
                  ))}
                </Select>
                {formErrors.yearLevel && (
                  <Typography color="error" variant="caption">
                    {formErrors.yearLevel}
                  </Typography>
                )}
              </Box>

              {/* Action Buttons */}
              <Box sx={{
                display: 'flex',
                gap: 2,
                mt: 2,
                borderTop: `1px solid ${colors.grey[800]}`,
                pt: 3
              }}>
                <Button
                  variant="contained"
                  startIcon={<CheckIcon />}
                  onClick={handleSubmit}
                  disabled={
                    currentViolation?.status === 'Processed' || 
                    !isFormValid(formData)
                  }
                  sx={{
                    flex: 1,
                    backgroundColor: !isFormValid(formData) 
                      ? colors.grey[700] 
                      : '#ffd700',
                    color: colors.grey[100],
                    fontWeight: 'bold',
                    '&:hover': {
                      backgroundColor: !isFormValid(formData) 
                        ? colors.grey[700] 
                        : '#e6c200'
                    },
                    '&.Mui-disabled': {
                      backgroundColor: colors.grey[700],
                      color: colors.grey[500]
                    }
                  }}
                >
                  Submit to OSA
                </Button>
                <Button
                  variant="contained"
                  startIcon={<DeleteIcon />}
                  onClick={() => setConfirmDeleteOpen(true)}
                  disabled={currentViolation?.status === 'Processed'}
                  sx={{
                    flex: 1,
                    backgroundColor: currentViolation?.status === 'Processed'
                      ? colors.grey[700]
                      : colors.redAccent[600],
                    color: colors.grey[100],
                    fontWeight: 'bold',
                    '&:hover': {
                      backgroundColor: colors.redAccent[700]
                    }
                  }}
                >
                  Remove
                </Button>
              </Box>
            </Box>
          </Box>
        )}
      </DialogContent>
    </Dialog>

    {isViolation && (
      <ConfirmDeleteDialog
        open={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        onConfirm={() => {
          onDelete(currentViolation);
          setConfirmDeleteOpen(false);
        }}
        colors={colors}
      />
    )}
  </>
);
};

const validateStudentNumber = (number) => {
  const studentNumberRegex = /^\d{7}$/;  // Exactly 7 digits
  return studentNumberRegex.test(number);
};

const validateStudentName = (name) => {
  // Only letters and spaces, at least 2 words (first and last name)
  const nameRegex = /^[A-Za-z]+(?:\s[A-Za-z]+)+$/;
  return nameRegex.test(name);
};

const isFormValid = (formData) => {
  return (
    formData.studentNumber && 
    validateStudentNumber(formData.studentNumber) &&
    formData.name && 
    validateStudentName(formData.name) &&
    formData.department && 
    formData.program && 
    formData.yearLevel
  );
};

const textFieldStyle = (colors) => ({
  input: { color: colors.grey[100] },
  label: { color: colors.grey[100] }
});

const dataGridStyles = (colors) => ({
  "& .MuiDataGrid-root": {
    border: "none",
    fontSize: "16px",
    borderRadius: "16px",  // rounded corners
    overflow: "hidden",    // rounded corners
  },
  "& .MuiDataGrid-cell": {
    borderBottom: "none",
    color: colors.grey[100],
    fontSize: "15px",
  },
  "& .name-column--cell": {
    color: colors.grey[100],
  },
  "& .MuiDataGrid-columnHeaders": {
    backgroundColor: colors.grey[400],
    borderBottom: "none",
    color: colors.grey[900],
    fontSize: "16px",
    fontWeight: "bold",
    borderTopLeftRadius: "16px",    // rounded corners
    borderTopRightRadius: "16px",   // rounded corners
  },
  "& .MuiDataGrid-virtualScroller": {
    backgroundColor: colors.grey[900],
  },
  "& .MuiDataGrid-footerContainer": {
    borderTop: "none",
    backgroundColor: colors.grey[400],
    color: colors.grey[900],
    borderBottomLeftRadius: "16px",  // rounded corners
    borderBottomRightRadius: "16px", // rounded corners
  },
  "& .MuiCheckbox-root": {
    color: `${colors.grey[700]} !important`,
  },
  "& .MuiDataGrid-toolbarContainer": {
    padding: 2,
    "& .MuiButton-root": {
      color: colors.grey[100],
      fontSize: "14px",
    },
  },
  "& .MuiDataGrid-cell:focus": {
    outline: "  ",
  },
  "& .MuiDataGrid-row": { // hover color
    "&:hover": {
      backgroundColor: colors.grey[800],
     },
  },
  "& .MuiTablePagination-root": {
    color: colors.grey[900],
    fontSize: "15px",
    display: "flex",
    alignItems: "center",
    "& .MuiTablePagination-selectLabel": {
      fontSize: "15px",
      marginBottom: 0,
      marginTop: 0,
    },
    "& .MuiTablePagination-displayedRows": {
      fontSize: "15px",
      marginBottom: 0,
      marginTop: 0,
    },
    "& .MuiSelect-select": {
      fontSize: "15px",
      paddingTop: 0,
      paddingBottom: 0,
    },
    "& .MuiTablePagination-select": {
      marginRight: "8px",
      marginLeft: "8px",
    },
    "& .MuiTablePagination-toolbar": {
      minHeight: "auto",
      height: "48px",
      display: "flex",
      alignItems: "center",
    },
  },
  "& .MuiIconButton-root": {
    color: colors.grey[400],
  },
});

export default AuditLogs;

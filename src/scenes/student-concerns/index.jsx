import { 
  Box, 
  Button, 
  Typography, 
  useTheme, 
  TextField, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Card, 
  CardContent,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Chip
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { tokens } from "../../theme.js";
import Header from "../../components/Header.jsx";
import React, { useEffect, useState } from "react";
import { 
  addStudentConcern, 
  getStudentConcernsByStudent, 
  getConcernCategories,
  StudentConcern 
} from "../../services/studentConcernsService.ts";
import AddIcon from '@mui/icons-material/Add';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import VisibilityIcon from '@mui/icons-material/Visibility';

const StudentConcerns = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  const user = JSON.parse(sessionStorage.getItem('user')); // ✅ define first

  const [concerns, setConcerns] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [selectedConcern, setSelectedConcern] = useState(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  const [formData, setFormData] = useState({
    studentId: user?.user_id || '',   // ✅ now safe
    studentName: `${user?.first_name || ''} ${user?.last_name || ''}`,
    category: '',
    description: '',
    photoUrl: ''
  });

  const resetForm = () => {
    setFormData({
      studentId: user?.user_id || '',
      studentName: `${user?.first_name || ''} ${user?.last_name || ''}`,
      category: '',
      description: '',
      photoUrl: ''
    });
  };



  const categories = getConcernCategories();

  useEffect(() => {
    fetchConcerns();
  }, []);

 const fetchConcerns = async () => {
  try {
    setLoading(true);
    const userConcerns = await getStudentConcernsByStudent(user?.user_id || ''); // fixed
    setConcerns(userConcerns);
  } catch (error) {
    console.error("Error fetching concerns:", error);
    showSnackbar('Error fetching concerns', 'error');
  } finally {
    setLoading(false);
  }
};


  const showSnackbar = (message, severity = 'success') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const handleSubmit = async () => {
  if (!formData.studentId || !formData.studentName || !formData.category || !formData.description) {
    showSnackbar('Please fill in all required fields', 'error');
    return;
  }

  try {
    setLoading(true);

    const concernToSave = {
      ...formData,
      status: 'Pending',
      dateSubmitted: new Date().toLocaleDateString(),
      timeSubmitted: new Date().toLocaleTimeString(),
    };

    await addStudentConcern(concernToSave);

    showSnackbar('Concern submitted successfully!');
    setOpenDialog(false);
    resetForm();
    fetchConcerns();
  } catch (error) {
    console.error("Error submitting concern:", error);
    showSnackbar('Error submitting concern', 'error');
  } finally {
    setLoading(false);
  }
};


 

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleViewConcern = (concern) => {
    setSelectedConcern(concern);
    setViewDialogOpen(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending': return '#ff9800';
      case 'Reviewed': return '#2196f3';
      case 'Resolved': return '#4caf50';
      default: return '#757575';
    }
  };

  const columns = [
    {
      field: "studentId",
      headerName: "Student ID",
      flex: 0.8,
      sortable: true,
    },
    {
      field: "category",
      headerName: "Category",
      flex: 1,
      sortable: true,
    },
    {
      field: "description",
      headerName: "Description",
      flex: 2,
      sortable: false,
      renderCell: ({ row }) => (
        <Typography 
          sx={{ 
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            maxWidth: '100%'
          }}
        >
          {row.description}
        </Typography>
      ),
    },
    {
      field: "status",
      headerName: "Status",
      flex: 0.8,
      sortable: true,
      renderCell: ({ row }) => (
        <Chip
          label={row.status}
          sx={{
            backgroundColor: getStatusColor(row.status),
            color: 'white',
            fontWeight: 'bold'
          }}
        />
      ),
    },
    {
      field: "dateSubmitted",
      headerName: "Date Submitted",
      flex: 1,
      sortable: true,
    },
    {
      field: "actions",
      headerName: "Actions",
      flex: 0.8,
      sortable: false,
      renderCell: (params) => (
        <IconButton 
          onClick={() => handleViewConcern(params.row)}
          color="primary"
          size="small"
        >
          <VisibilityIcon />
        </IconButton>
      ),
    },
  ];

  return (
    <Box m="20px">
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Header title="My Concerns" subtitle="Submit and track your school concerns"/>
        <Button
          onClick={() => setOpenDialog(true)}
          variant="contained"
          startIcon={<AddIcon />}
          sx={{
            backgroundColor: '#ffd700',
            color: colors.grey[100],
            fontSize: "14px",
            fontWeight: "bold",
            padding: "10px 20px",
            "&:hover": {
              backgroundColor: '#e6c200',
            },
          }}
        >
          Submit New Concern
        </Button>
      </Box>

      <Box
        m="40px 0 0 0"
        height="75vh"
        sx={{
          "& .MuiDataGrid-root": {
            border: "none",
            fontSize: "16px",
            borderRadius: "16px",
            overflow: "hidden",
          },
          "& .MuiDataGrid-cell": {
            borderBottom: "none",
            color: colors.grey[100],
            fontSize: "15px",
          },
          "& .MuiDataGrid-columnHeaders": {
            backgroundColor: colors.grey[400],
            borderBottom: "none",
            color: colors.grey[900],
            fontSize: "16px",
            fontWeight: "bold",
            borderTopLeftRadius: "16px",
            borderTopRightRadius: "16px",
          },
          "& .MuiDataGrid-virtualScroller": {
            backgroundColor: colors.grey[900],
          },
          "& .MuiDataGrid-footerContainer": {
            borderTop: "none",
            backgroundColor: colors.grey[400],
            color: colors.grey[900],
            borderBottomLeftRadius: "16px",
            borderBottomRightRadius: "16px",
          },
        }}
      >
        <DataGrid
          rows={concerns}
          columns={columns}
          loading={loading}
          disableRowSelectionOnClick
          initialState={{
            sorting: {
              sortModel: [{ field: 'dateSubmitted', sort: 'desc' }],
            },
          }}
        />
      </Box>

      {/* Submit Concern Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={() => {
          setOpenDialog(false);
          resetForm();
        }}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: colors.grey[900],
          }
        }}
      >
        <DialogTitle sx={{ color: colors.grey[100], fontSize: '24px', fontWeight: 'bold' }}>
          Submit New Concern
        </DialogTitle>
        <DialogContent>
          <Box
            component="form"
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 3,
              padding: '20px',
            }}
            noValidate
            autoComplete="off"
          >
            <Box display="flex" gap={2}>
              <TextField
              placeholder="Enter Student ID"
              
              value={formData.studentId}
              onChange={(e) => handleInputChange('studentId', e.target.value)}
              fullWidth
              sx={{
                '& .MuiOutlinedInput-root': {
                  color: colors.grey[100],
                  '& fieldset': {
                    borderColor: colors.grey[400],
                  },
                  '&:hover fieldset': {
                    borderColor: colors.grey[300],
                  },
                },
                '& .MuiInputLabel-root': {
                  color: 'black !important',  // Force black label
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: 'black !important',  // Keep black even when focused
                },
                '& input::placeholder': {
                  color: 'black',      // force placeholder to black
                  opacity: 1           // ensure it’s visible
                },
              }}
            />

              <TextField
                placeholder="Full Name"
                value={formData.studentName}
                onChange={(e) => handleInputChange('studentName', e.target.value)}
                fullWidth
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: colors.grey[100],
                    '& fieldset': {
                      borderColor: colors.grey[400],
                    },
                    '&:hover fieldset': {
                      borderColor: colors.grey[300],
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: colors.grey[300],
                  },'& input::placeholder': {
                  color: 'black',      // force placeholder to black
                  opacity: 1           // ensure it’s visible
                },
                }}
              />
            </Box>

            <FormControl fullWidth>
              <InputLabel sx={{ color: colors.grey[300] }}>Category *</InputLabel>
              <Select
                value={formData.category}
                placeholder="Category"
                onChange={(e) => handleInputChange('category', e.target.value)}
                sx={{
                  color: colors.grey[100],
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: colors.grey[400],
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: colors.grey[300],
                  },
                  '& .MuiSelect-icon': {
                    color: colors.grey[100],
                  },'& input::placeholder': {
                  color: 'black',      // force placeholder to black
                  opacity: 1           // ensure it’s visible
                },
                }}
              >
                {categories.map((category) => (
                  <MenuItem key={category} value={category}>
                    {category}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              multiline
              rows={4}
              fullWidth
              placeholder="Please describe your concern in detail..."
              sx={{
                '& .MuiOutlinedInput-root': {
                  color: colors.grey[100],
                  '& fieldset': {
                    borderColor: colors.grey[400],
                  },
                  '&:hover fieldset': {
                    borderColor: colors.grey[300],
                  },
                },
                '& .MuiInputLabel-root': {
                  color: colors.grey[300],
                },
                '& input::placeholder': {
                  color: 'black',      // force placeholder to black
                  opacity: 1           // ensure it’s visible
                },
              }}
            />

            <Box>
              <Typography variant="body2" color={colors.grey[300]} mb={1}>
                Optional: Add Photo Evidence
              </Typography>
              <Button
                variant="outlined"
                startIcon={<PhotoCameraIcon />}
                sx={{
                  color: colors.grey[300],
                  borderColor: colors.grey[400],
                  '&:hover': {
                    borderColor: colors.grey[300],
                  },
                }}
                disabled
              >
                Upload Photo (Feature Coming Soon)
              </Button>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ padding: '20px' }}>
          <Button 
            onClick={() => {
              setOpenDialog(false);
              resetForm();
            }} 
            sx={{ color: colors.grey[100] }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            variant="contained" 
            disabled={loading}
            sx={{
              backgroundColor: '#ffd700',
              color: colors.grey[100],
              fontWeight: "bold",
              padding: "10px 20px",
              "&:hover": {
                backgroundColor: '#e6c200',
              },
            }}
          >
            {loading ? 'Submitting...' : 'Submit Concern'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Concern Dialog */}
      <Dialog
        open={viewDialogOpen}
        onClose={() => setViewDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: colors.grey[900],
          }
        }}
      >
        <DialogTitle sx={{ color: colors.grey[100], fontSize: '20px', fontWeight: 'bold' }}>
          Concern Details
        </DialogTitle>
        <DialogContent>
          {selectedConcern && (
            <Box sx={{ padding: '10px' }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" color={colors.grey[100]}>
                  Student: {selectedConcern.studentName}
                </Typography>
                <Chip
                  label={selectedConcern.status}
                  sx={{
                    backgroundColor: getStatusColor(selectedConcern.status),
                    color: 'white',
                    fontWeight: 'bold'
                  }}
                />
              </Box>
              
              <Typography variant="body2" color={colors.grey[300]} mb={1}>
                <strong>Student ID:</strong> {selectedConcern.studentId}
              </Typography>
              
              <Typography variant="body2" color={colors.grey[300]} mb={1}>
                <strong>Category:</strong> {selectedConcern.category}
              </Typography>
              
              <Typography variant="body2" color={colors.grey[300]} mb={1}>
                <strong>Date Submitted:</strong> {selectedConcern.dateSubmitted} at {selectedConcern.timeSubmitted}
              </Typography>
              
              <Typography variant="body2" color={colors.grey[300]} mb={2}>
                <strong>Description:</strong>
              </Typography>
              <Typography variant="body1" color={colors.grey[100]} mb={2}>
                {selectedConcern.description}
              </Typography>

              {selectedConcern.reviewNotes && (
                <>
                  <Typography variant="body2" color={colors.grey[300]} mb={1}>
                    <strong>Review Notes:</strong>
                  </Typography>
                  <Typography variant="body1" color={colors.grey[100]}>
                    {selectedConcern.reviewNotes}
                  </Typography>
                </>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setViewDialogOpen(false)} 
            sx={{ color: colors.grey[100] }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default StudentConcerns;
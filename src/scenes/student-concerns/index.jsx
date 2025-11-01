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
  Chip,
  Divider,
  Paper
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
import CloseIcon from '@mui/icons-material/Close';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import CategoryIcon from '@mui/icons-material/Category';
import DescriptionIcon from '@mui/icons-material/Description';
import AttachFileIcon from '@mui/icons-material/AttachFile';

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

      {/* Submit Concern Dialog - COLOR ONLY CHANGES (kept sizes/layout) */}
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
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.1)',
            overflow: 'visible'
          }
        }}
      >
        {/* Header Section: color changed to black + gold accent */}
        <Box sx={{ 
          background: 'linear-gradient(135deg, #000000 0%, #1a1a1a 100%)',
          padding: '32px',
          position: 'relative',
          borderBottom: '4px solid #ffd700'
        }}>
          <IconButton
            onClick={() => {
              setOpenDialog(false);
              resetForm();
            }}
            sx={{
              position: 'absolute',
              right: 16,
              top: 16,
              color: '#ffd700',
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              '&:hover': {
                backgroundColor: 'rgba(255, 215, 0, 0.12)',
              }
            }}
          >
            <CloseIcon />
          </IconButton>
          
          <Typography sx={{ 
            color: '#ffd700', 
            fontSize: '28px', 
            fontWeight: '700',
            marginBottom: '8px'
          }}>
            Submit New Concern
          </Typography>
          <Typography sx={{ 
            color: '#ffffffcc', 
            fontSize: '16px',
            fontWeight: '400'
          }}>
            We're here to help address your concerns promptly
          </Typography>
        </Box>

        <DialogContent sx={{ padding: '32px' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            
            {/* Student Information Section */}
            <Paper elevation={0} sx={{ 
              backgroundColor: '#f8f9fa',
              borderRadius: '12px',
              padding: '24px',
              border: '1px solid #e9ecef'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <PersonOutlineIcon sx={{ color: '#ffd700', mr: 1 }} />
                <Typography sx={{ 
                  fontSize: '16px', 
                  fontWeight: '600',
                  color: '#2d3748'
                }}>
                  Student Information
                </Typography>
              </Box>
              
              <Box display="flex" gap={2}>
                <TextField
                  placeholder="Student ID"
                  value={formData.studentId}
                  onChange={(e) => handleInputChange('studentId', e.target.value)}
                  fullWidth
                  variant="outlined"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: 'white',
                      borderRadius: '8px',
                      '& fieldset': {
                        borderColor: '#e2e8f0',
                        borderWidth: '2px',
                      },
                      '&:hover fieldset': {
                        borderColor: '#ffd700',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#ffd700',
                      },
                    },
                    '& input': {
                      padding: '14px 16px',
                      fontSize: '15px',
                      color: '#2d3748',
                      '&::placeholder': {
                        color: '#a0aec0',
                        opacity: 1,
                      }
                    }
                  }}
                />

                <TextField
                  placeholder="Full Name"
                  value={formData.studentName}
                  onChange={(e) => handleInputChange('studentName', e.target.value)}
                  fullWidth
                  variant="outlined"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: 'white',
                      borderRadius: '8px',
                      '& fieldset': {
                        borderColor: '#e2e8f0',
                        borderWidth: '2px',
                      },
                      '&:hover fieldset': {
                        borderColor: '#ffd700',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#ffd700',
                      },
                    },
                    '& input': {
                      padding: '14px 16px',
                      fontSize: '15px',
                      color: '#2d3748',
                      '&::placeholder': {
                        color: '#a0aec0',
                        opacity: 1,
                      }
                    }
                  }}
                />
              </Box>
            </Paper>

            {/* Category Section */}
            <Paper elevation={0} sx={{ 
              backgroundColor: '#f8f9fa',
              borderRadius: '12px',
              padding: '24px',
              border: '1px solid #e9ecef'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <CategoryIcon sx={{ color: '#ffd700', mr: 1 }} />
                <Typography sx={{ 
                  fontSize: '16px', 
                  fontWeight: '600',
                  color: '#2d3748'
                }}>
                  Concern Category
                </Typography>
              </Box>
              
              <FormControl fullWidth>
                <Select
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  displayEmpty
                  sx={{
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#e2e8f0',
                      borderWidth: '2px',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#ffd700',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#ffd700',
                    },
                    '& .MuiSelect-select': {
                      padding: '14px 16px',
                      fontSize: '15px',
                      color: formData.category ? '#2d3748' : '#a0aec0',
                    }
                  }}
                >
                  <MenuItem value="" disabled>
                    <em style={{ color: '#a0aec0' }}>Select a category</em>
                  </MenuItem>
                  {categories.map((category) => (
                    <MenuItem key={category} value={category}>
                      {category}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Paper>

            {/* Description Section */}
            <Paper elevation={0} sx={{ 
              backgroundColor: '#f8f9fa',
              borderRadius: '12px',
              padding: '24px',
              border: '1px solid #e9ecef'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <DescriptionIcon sx={{ color: '#ffd700', mr: 1 }} />
                <Typography sx={{ 
                  fontSize: '16px', 
                  fontWeight: '600',
                  color: '#2d3748'
                }}>
                  Detailed Description
                </Typography>
              </Box>
              
              <TextField
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                multiline
                rows={5}
                fullWidth
                placeholder="Please provide a detailed description of your concern. Include relevant dates, locations, and people involved if applicable..."
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    '& fieldset': {
                      borderColor: '#e2e8f0',
                      borderWidth: '2px',
                    },
                    '&:hover fieldset': {
                      borderColor: '#ffd700',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#ffd700',
                    },
                  },
                  '& textarea': {
                    padding: '14px 16px',
                    fontSize: '15px',
                    lineHeight: '1.6',
                    color: '#2d3748',
                    '&::placeholder': {
                      color: '#a0aec0',
                      opacity: 1,
                    }
                  }
                }}
              />
            </Paper>

            {/* Attachment Section */}
            <Paper elevation={0} sx={{ 
              backgroundColor: '#fef9f3',
              borderRadius: '12px',
              padding: '24px',
              border: '1px solid #fed7aa'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <AttachFileIcon sx={{ color: '#f59e0b', mr: 1 }} />
                <Typography sx={{ 
                  fontSize: '16px', 
                  fontWeight: '600',
                  color: '#2d3748'
                }}>
                  Supporting Documents (Coming Soon)
                </Typography>
              </Box>
              
              <Button
                variant="outlined"
                startIcon={<PhotoCameraIcon />}
                disabled
                sx={{
                  borderColor: '#fed7aa',
                  color: '#92400e',
                  backgroundColor: 'white',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  borderWidth: '2px',
                  textTransform: 'none',
                  fontSize: '14px',
                  fontWeight: '500',
                  '&:hover': {
                    borderColor: '#f59e0b',
                    backgroundColor: '#fef9f3',
                  },
                  '&.Mui-disabled': {
                    borderColor: '#fed7aa',
                    color: '#d97706',
                    opacity: 0.7,
                  }
                }}
              >
                Upload Photo Evidence (Coming Soon)
              </Button>
              <Typography sx={{ 
                mt: 1.5, 
                fontSize: '13px', 
                color: '#92400e',
                fontStyle: 'italic'
              }}>
                This feature will be available in the next update
              </Typography>
            </Paper>

          </Box>
        </DialogContent>

        {/* Footer Actions (color only) */}
        <DialogActions sx={{ 
          padding: '24px 32px',
          backgroundColor: '#f8f9fa',
          borderTop: '4px solid #ffd700'
        }}>
          <Button 
            onClick={() => {
              setOpenDialog(false);
              resetForm();
            }}
            sx={{ 
              color: '#4a5568',
              textTransform: 'none',
              fontSize: '15px',
              fontWeight: '500',
              padding: '10px 24px',
              borderRadius: '8px',
              '&:hover': {
                backgroundColor: '#e2e8f0',
              }
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            variant="contained" 
            disabled={loading || !formData.category || !formData.description}
            sx={{
              background: '#ffd700',
              color: '#000',
              textTransform: 'none',
              fontSize: '15px',
              fontWeight: '600',
              padding: '10px 32px',
              borderRadius: '8px',
              boxShadow: '0 4px 14px rgba(255, 215, 0, 0.25)',
              '&:hover': {
                backgroundColor: '#e6c200',
                transform: 'translateY(-1px)',
              },
              '&.Mui-disabled': {
                background: '#cbd5e0',
                boxShadow: 'none',
              },
              transition: 'all 0.2s ease'
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

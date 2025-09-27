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
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Snackbar,
  Alert
} from "@mui/material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import { tokens } from "../../theme.js";
import Header from "../../components/Header.jsx";
import React, { useEffect, useState } from "react";
import { 
  getStudentConcerns, 
  updateStudentConcern,
  deleteStudentConcern,
  StudentConcern 
} from "../../services/studentConcernsService.ts";
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

const StudentConcernsManagement = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [concerns, setConcerns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedConcern, setSelectedConcern] = useState(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [confirmText, setConfirmText] = useState('');

  const [reviewData, setReviewData] = useState({
    status: '',
    reviewNotes: ''
  });

  const user = JSON.parse(sessionStorage.getItem('user'));

  useEffect(() => {
    fetchConcerns();
  }, []);

  const fetchConcerns = async () => {
    try {
      setLoading(true);
      const allConcerns = await getStudentConcerns();
      setConcerns(allConcerns);
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

  const handleViewConcern = (concern) => {
    setSelectedConcern(concern);
    setViewDialogOpen(true);
  };

  const handleReviewConcern = (concern) => {
    setSelectedConcern(concern);
    setReviewData({
      status: concern.status,
      reviewNotes: concern.reviewNotes || ''
    });
    setReviewDialogOpen(true);
  };

  const handleDeleteClick = (concern) => {
    setSelectedConcern(concern);
    setDeleteDialogOpen(true);
    setConfirmText('');
  };

  const handleReviewSubmit = async () => {
    if (!reviewData.status) {
      showSnackbar('Please select a status', 'error');
      return;
    }

    try {
      setLoading(true);
      await updateStudentConcern(selectedConcern.id, {
        ...reviewData,
        reviewedBy: user.username,
        reviewDate: new Date().toISOString().split('T')[0]
      });
      
      showSnackbar('Concern updated successfully!');
      setReviewDialogOpen(false);
      fetchConcerns();
    } catch (error) {
      console.error("Error updating concern:", error);
      showSnackbar('Error updating concern', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (confirmText.toLowerCase() !== 'confirm') {
      showSnackbar('Please type "confirm" to delete', 'error');
      return;
    }

    try {
      setLoading(true);
      await deleteStudentConcern(selectedConcern.id);
      showSnackbar('Concern deleted successfully!');
      setDeleteDialogOpen(false);
      setConfirmText('');
      fetchConcerns();
    } catch (error) {
      console.error("Error deleting concern:", error);
      showSnackbar('Error deleting concern', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending': return '#ff9800';
      case 'Reviewed': return '#2196f3';
      case 'Resolved': return '#4caf50';
      default: return '#757575';
    }
  };

  const getCategoryColor = (category) => {
    const colors = {
      'Academic Issues': '#9c27b0',
      'Facility Problems': '#f44336',
      'Dress Code Violation': '#ff5722',
      'Bullying/Harassment': '#e91e63',
      'Safety Concerns': '#ff9800',
      'Food Services': '#4caf50',
      'Transportation': '#2196f3',
      'Technology Issues': '#607d8b',
      'Other': '#795548'
    };
    return colors[category] || '#757575';
  };

  const columns = [
    {
      field: "studentId",
      headerName: "Student ID",
      flex: 0.8,
      sortable: true,
    },
    {
      field: "studentName",
      headerName: "Student Name",
      flex: 1,
      sortable: true,
    },
    {
      field: "category",
      headerName: "Category",
      flex: 1.2,
      sortable: true,
      renderCell: ({ row }) => (
        <Chip
          label={row.category}
          size="small"
          sx={{
            backgroundColor: getCategoryColor(row.category),
            color: 'white',
            fontWeight: 'bold'
          }}
        />
      ),
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
      flex: 1.2,
      sortable: false,
      renderCell: (params) => (
        <Box display="flex" gap="5px">
          <IconButton 
            onClick={() => handleViewConcern(params.row)}
            color="primary"
            size="small"
            title="View Details"
          >
            <VisibilityIcon />
          </IconButton>
          <IconButton 
            onClick={() => handleReviewConcern(params.row)}
            color="success"
            size="small"
            title="Review/Update"
          >
            <EditIcon />
          </IconButton>
          <IconButton 
            onClick={() => handleDeleteClick(params.row)}
            color="error"
            size="small"
            title="Delete"
          >
            <DeleteIcon />
          </IconButton>
        </Box>
      ),
    },
  ];

  return (
    <Box m="20px">
      <Header title="Student Concerns Management" subtitle="Review and manage student-submitted concerns"/>

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
          "& .MuiDataGrid-toolbarContainer": {
            padding: 2,
            "& .MuiButton-root": {
              color: colors.grey[100],
              fontSize: "14px",
            },
          },
        }}
      >
        <DataGrid
          rows={concerns}
          columns={columns}
          loading={loading}
          disableRowSelectionOnClick
          components={{ Toolbar: GridToolbar }}
          initialState={{
            sorting: {
              sortModel: [{ field: 'dateSubmitted', sort: 'desc' }],
            },
          }}
        />
      </Box>

      {/* View Concern Dialog */}
      <Dialog
        open={viewDialogOpen}
        onClose={() => setViewDialogOpen(false)}
        maxWidth="md"
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
                  {selectedConcern.studentName} ({selectedConcern.studentId})
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
              
              <Box mb={2}>
                <Chip
                  label={selectedConcern.category}
                  sx={{
                    backgroundColor: getCategoryColor(selectedConcern.category),
                    color: 'white',
                    fontWeight: 'bold'
                  }}
                />
              </Box>
              
              <Typography variant="body2" color={colors.grey[300]} mb={1}>
                <strong>Date Submitted:</strong> {selectedConcern.dateSubmitted} at {selectedConcern.timeSubmitted}
              </Typography>
              
              <Typography variant="body2" color={colors.grey[300]} mb={2}>
                <strong>Description:</strong>
              </Typography>
              <Typography variant="body1" color={colors.grey[100]} mb={2} sx={{ 
                padding: '10px',
                backgroundColor: colors.grey[800],
                borderRadius: '8px'
              }}>
                {selectedConcern.description}
              </Typography>

              {selectedConcern.reviewedBy && (
                <>
                  <Typography variant="body2" color={colors.grey[300]} mb={1}>
                    <strong>Reviewed by:</strong> {selectedConcern.reviewedBy} on {selectedConcern.reviewDate}
                  </Typography>
                </>
              )}

              {selectedConcern.reviewNotes && (
                <>
                  <Typography variant="body2" color={colors.grey[300]} mb={1}>
                    <strong>Review Notes:</strong>
                  </Typography>
                  <Typography variant="body1" color={colors.grey[100]} sx={{ 
                    padding: '10px',
                    backgroundColor: colors.grey[800],
                    borderRadius: '8px'
                  }}>
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

      {/* Review Concern Dialog */}
      <Dialog
        open={reviewDialogOpen}
        onClose={() => setReviewDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: colors.grey[900],
          }
        }}
      >
        <DialogTitle sx={{ color: colors.grey[100], fontSize: '20px', fontWeight: 'bold' }}>
          Review Concern
        </DialogTitle>
        <DialogContent>
          <Box sx={{ padding: '10px', display: 'flex', flexDirection: 'column', gap: 3 }}>
            {selectedConcern && (
              <Typography variant="body1" color={colors.grey[300]}>
                <strong>Student:</strong> {selectedConcern.studentName} ({selectedConcern.studentId})
              </Typography>
            )}

            <FormControl fullWidth>
              <InputLabel sx={{ color: colors.grey[300] }}>Status *</InputLabel>
              <Select
                value={reviewData.status}
                label="Status *"
                onChange={(e) => setReviewData({...reviewData, status: e.target.value})}
                sx={{
                  color: colors.grey[100],
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: colors.grey[400],
                  },
                  '& .MuiSelect-icon': {
                    color: colors.grey[100],
                  },
                }}
              >
                <MenuItem value="Pending">Pending</MenuItem>
                <MenuItem value="Reviewed">Reviewed</MenuItem>
                <MenuItem value="Resolved">Resolved</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Review Notes"
              value={reviewData.reviewNotes}
              onChange={(e) => setReviewData({...reviewData, reviewNotes: e.target.value})}
              multiline
              rows={4}
              fullWidth
              placeholder="Add your review notes here..."
              sx={{
                '& .MuiOutlinedInput-root': {
                  color: colors.grey[100],
                  '& fieldset': {
                    borderColor: colors.grey[400],
                  },
                },
                '& .MuiInputLabel-root': {
                  color: colors.grey[300],
                },
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ padding: '20px' }}>
          <Button 
            onClick={() => setReviewDialogOpen(false)} 
            sx={{ color: colors.grey[100] }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleReviewSubmit}
            variant="contained" 
            disabled={loading}
            sx={{
              backgroundColor: '#ffd700',
              color: colors.grey[100],
              fontWeight: "bold",
              "&:hover": {
                backgroundColor: '#e6c200',
              },
            }}
          >
            {loading ? 'Updating...' : 'Update Concern'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setConfirmText('');
        }}
        PaperProps={{
          sx: {
            backgroundColor: colors.grey[900],
          }
        }}
      >
        <DialogTitle sx={{ color: colors.grey[100] }}>
          Confirm Delete Concern
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography sx={{ color: colors.grey[100], mb: 2 }}>
              Are you sure you want to delete this concern from{' '}
              <strong>{selectedConcern?.studentName}</strong>?
            </Typography>
            <Typography sx={{ color: colors.grey[100], mb: 2 }}>
              Type "confirm" to delete:
            </Typography>
            <TextField
              fullWidth
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Type 'confirm'"
              sx={{
                '& .MuiOutlinedInput-root': {
                  color: colors.grey[100],
                  '& fieldset': {
                    borderColor: colors.grey[400],
                  },
                },
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              setDeleteDialogOpen(false);
              setConfirmText('');
            }} 
            sx={{ color: colors.grey[100] }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            variant="contained"
            color="error"
            disabled={confirmText.toLowerCase() !== 'confirm' || loading}
          >
            {loading ? 'Deleting...' : 'Delete Concern'}
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

export default StudentConcernsManagement;
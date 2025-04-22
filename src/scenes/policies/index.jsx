import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  useTheme,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  OutlinedInput,
  Snackbar,
  Alert,
  IconButton,
  Radio,
  FormControlLabel,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import CloseIcon from "@mui/icons-material/Close";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { tokens } from "../../theme";
import Header from "../../components/Header";
import {
  getManagements,
  addManagement,
  updateManagement,
  deleteManagement,
} from "../../services/managementService.ts";
import { addUserLog } from "../../services/userLogsService.ts";

const validateDate = (dateStr) => {
  const regex = /^(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])-([12]\d{3})$/;
  if (!regex.test(dateStr)) return false;
  
  const [month, day, year] = dateStr.split('-').map(num => parseInt(num, 10));
  const date = new Date(year, month - 1, day);
  
  return date.getMonth() === month - 1 && 
         date.getDate() === day && 
         date.getFullYear() === year;
};

const AuditLogs = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  const [managements, setManagements] = useState([]);
  const [currentManagement, setCurrentManagement] = useState(null);
  const [selectedRows, setSelectedRows] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [formErrors, setFormErrors] = useState({
    start_date: '',
    end_date: ''
  });

  useEffect(() => {
    fetchManagements();
  }, []);

  const fetchManagements = async () => {
    const data = await getManagements();
    setManagements(data);
  };

  const handleOpenModal = (item = null) => {
    setCurrentManagement(item);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentManagement(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'status') {
      setCurrentManagement(prev => ({
        ...prev,
        [name]: value,
        start_date: value === 'Not Allowed' ? '' : prev?.start_date || '',
        end_date: value === 'Not Allowed' ? '' : prev?.end_date || ''
      }));
      return;
    }

    if (name === 'start_date' || name === 'end_date') {
      if (value && !validateDate(value)) {
        setFormErrors(prev => ({
          ...prev,
          [name]: 'Please enter date in MM-DD-YYYY format'
        }));
      } else {
        setFormErrors(prev => ({
          ...prev,
          [name]: ''
        }));
      }
    }

    setCurrentManagement(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    // Add validation for required dates when status is Allowed
    if (currentManagement?.status === 'Allowed' && 
        (!currentManagement.start_date || !currentManagement.end_date)) {
      setFormErrors({
        start_date: !currentManagement.start_date ? 'Start date is required' : '',
        end_date: !currentManagement.end_date ? 'End date is required' : ''
      });
      return;
    }

    try {
      const sessionUser = JSON.parse(sessionStorage.getItem('user'));
      
      if (currentManagement?.id) {
        await updateManagement(currentManagement.id, currentManagement);
        
        // Log the status change when saving
        if (sessionUser) {
          await addUserLog({
            log_id: sessionUser.log_id,
            username: sessionUser.username,
            action: currentManagement.status === 'Allowed' 
              ? "Deactivated a Violation" 
              : "Activated a Violation",
            date: new Date().toISOString().split('T')[0],
            time: new Date().toTimeString().split(' ')[0]
          });
        }
      } else {
        await addManagement(currentManagement);
      }
      
      fetchManagements();
      handleCloseModal();
      setSnackbarOpen(true);
    } catch (err) {
      console.error("Save failed:", err);
    }
  };

  const handleCloseSnackbar = (_, reason) => {
    if (reason === "clickaway") return;
    setSnackbarOpen(false);
  };

  const managementColumns = [
    { 
      field: "dress_code_id", 
      headerName: "Dress Code ID", 
      flex: 0.7,
      sortable: true,
    },
    {
      field: "dress_code",
      headerName: "Dress Code",
      flex: 1,
      sortable: true,
    },
    {
      field: "status",
      headerName: "Status",
      flex: 1,
      sortable: true,
    },
    {
      field: "start_date",
      headerName: "Start Date",
      flex: 1,
      sortable: true,
    },
    {
      field: "end_date",
      headerName: "End Date",
      flex: 1,
      sortable: true,
    },
    {
      field: "actions",
      headerName: "Actions",
      flex: 0.8,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Box display="flex" gap="5px">
          <IconButton 
            onClick={() => handleOpenModal(params.row)}
            color="primary"
            size="small"
          >
            <EditIcon />
          </IconButton>
        </Box>
      ),
    },
  ];

  return (
    <Box m="20px">
      <Header title="Policies" subtitle="Dress Code Policy Management" />
      <Box height="85vh">
        <DataGrid
          checkboxSelection
          rows={managements}
          columns={managementColumns}
          onSelectionModelChange={(ids) => setSelectedRows(ids)}
          sx={dataGridStyles(colors)}
        />
      </Box>

      {/* Dialog */}
      <Dialog 
        open={isModalOpen} 
        onClose={handleCloseModal}
        PaperProps={{
          sx: {
            backgroundColor: colors.grey[900],
          }
        }}
      >
        <DialogTitle sx={{ color: colors.grey[100] }}>
          Edit Policy
        </DialogTitle>
        <DialogContent>
          <Box
            component="form"
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              padding: '10px',
              '& .form-row': {
                display: 'flex',
                alignItems: 'center',
                gap: 2,
              },
              '& .form-label': {
                minWidth: '100px',
                textAlign: 'left',
              },
              '& .form-input': {
                flex: 1,
              },
            }}
            noValidate
            autoComplete="off"
          >
            <div className="form-row">
              <Typography
                className="form-label"
                sx={{ 
                  color: colors.grey[100],
                  fontWeight: 'bold'
                }}
              >
                Status
              </Typography>
              <Box 
                sx={{ 
                  display: 'flex',
                  gap: 4,
                  alignItems: 'center'
                }}
              >
                <Box 
                  sx={{ 
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}
                >
                  <Radio
                    checked={currentManagement?.status === 'Allowed'}
                    onChange={(e) => handleChange({
                      target: {
                        name: 'status',
                        value: 'Allowed'
                      }
                    })}
                    sx={{ 
                      color: colors.grey[100],
                      '&.Mui-checked': {
                        color: colors.greenAccent[500]
                      }
                    }}
                  />
                  <Typography sx={{ color: colors.grey[100] }}>
                    Allowed
                  </Typography>
                </Box>

                <Box 
                  sx={{ 
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}
                >
                  <Radio
                    checked={currentManagement?.status === 'Not Allowed'}
                    onChange={(e) => handleChange({
                      target: {
                        name: 'status',
                        value: 'Not Allowed'
                      }
                    })}
                    sx={{ 
                      color: colors.grey[100],
                      '&.Mui-checked': {
                        color: colors.redAccent[500]
                      }
                    }}
                  />
                  <Typography sx={{ color: colors.grey[100] }}>
                    Not Allowed
                  </Typography>
                </Box>
              </Box>
            </div>

            <div className="form-row">
              <Typography
                className="form-label"
                sx={{ 
                  color: colors.grey[100],
                  fontWeight: 'bold'
                }}
              >
                Start Date
              </Typography>
              <OutlinedInput
                className="form-input"
                name="start_date"
                placeholder="MM-DD-YYYY"
                value={currentManagement?.start_date || ''}
                onChange={handleChange}
                disabled={currentManagement?.status === 'Not Allowed'}
                error={!!formErrors.start_date}
                sx={{
                  color: colors.grey[100],
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: formErrors.start_date ? '#f44336' : colors.grey[400],
                    borderWidth: 1,
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: formErrors.start_date ? '#f44336' : colors.grey[100],
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: formErrors.start_date ? '#f44336' : colors.grey[100],
                  },
                  '&::placeholder': {
                    color: colors.grey[500],
                    opacity: 1,
                  },
                }}
              />
              {formErrors.start_date && (
                <Typography color="error" variant="caption">
                  {formErrors.start_date}
                </Typography>
              )}
            </div>

            <div className="form-row">
              <Typography
                className="form-label"
                sx={{ 
                  color: colors.grey[100],
                  fontWeight: 'bold'
                }}
              >
                End Date
              </Typography>
              <OutlinedInput
                className="form-input"
                name="end_date"
                placeholder="MM-DD-YYYY"
                value={currentManagement?.end_date || ''}
                onChange={handleChange}
                disabled={currentManagement?.status === 'Not Allowed'}
                error={!!formErrors.end_date}
                sx={{
                  color: colors.grey[100],
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: formErrors.end_date ? '#f44336' : colors.grey[400],
                    borderWidth: 1,
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: formErrors.end_date ? '#f44336' : colors.grey[100],
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: formErrors.end_date ? '#f44336' : colors.grey[100],
                  },
                  '&::placeholder': {
                    color: colors.grey[500],
                    opacity: 1,
                  },
                }}
              />
              {formErrors.end_date && (
                <Typography color="error" variant="caption">
                  {formErrors.end_date}
                </Typography>
              )}
            </div>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal} sx={{ color: colors.grey[100] }}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            variant="contained" 
            sx={{
              backgroundColor: '#ffd700',
              color: colors.grey[100],
              fontWeight: "bold",
              padding: "10px 20px",
              "&:hover": {
                backgroundColor: '#e6c200',
              },
            }}
            disabled={
              !!formErrors.start_date || 
              !!formErrors.end_date || 
              (currentManagement?.status === 'Allowed' && 
                (!currentManagement.start_date || !currentManagement.end_date))
            }
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity="success"
          sx={{ width: "100%" }}
        >
          Changes saved successfully!
        </Alert>
      </Snackbar>
    </Box>
  );
};

const dataGridStyles = (colors) => ({
  "& .MuiDataGrid-root": {
    border: "none",
    fontSize: "16px",
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
  },
  "& .MuiDataGrid-virtualScroller": {
    backgroundColor: colors.grey[900],
  },
  "& .MuiDataGrid-footerContainer": {
    borderTop: "none",
    backgroundColor: colors.grey[400],
    color: colors.grey[900],
  },
  "& .MuiCheckbox-root": {
    color: `${colors.grey[700]} !important`,
  },
  "& .MuiDataGrid-toolbarContainer": {
    padding: "8px 16px",
    backgroundColor: colors.grey[400],
    "& .MuiButton-root": {
      color: colors.grey[900],
      fontSize: "14px",
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

import React, { useState, useEffect } from 'react';
import {
  Box,
  useTheme,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  Typography,
  OutlinedInput,
  Select,
  MenuItem,
  DialogActions,
} from "@mui/material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import { 
  GridToolbarContainer,
  GridToolbarFilterButton,
  GridToolbarDensitySelector,
  GridToolbarExport
} from '@mui/x-data-grid';
import { tokens } from "../../theme";
import Header from "../../components/Header";
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

const ViolationHandling = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  
  const [records, setRecords] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    program: '',
    yearLevel: '',
    violation: '',
    date: '',
    department: ''
  });
  const [formErrors, setFormErrors] = useState({
    name: '',
    program: '',
    yearLevel: '',
    violation: '',
    date: '',
    department: ''
  });

  const yearLevels = ["1st Year", "2nd Year", "3rd Year", "4th Year", "5th Year"];
  const departments = [
    "CCIS (College of Computer and Information Sciences)",
    "CBA (College of Business Administration)",
    "CEAS (College of Engineering and Architecture Studies)",
    "CHTM (College of Health and Technology Management)",
    "CITHM (College of International Tourism and Hospitality Management)"
  ];
  
  const programs = {
    "CCIS (College of Computer and Information Sciences)": [
      "BSIT (Bachelor of Science in Information Technology)",
      "BSCS (Bachelor of Science in Computer Science)",
      "BSIS (Bachelor of Science in Information Systems)"
    ],
    "CBA (College of Business Administration)": [
      "BSA (Bachelor of Science in Accountancy)",
      "BSBA (Bachelor of Science in Business Administration)"
    ],
    "CEAS (College of Engineering and Architecture Studies)": [
      "BSCpE (Bachelor of Science in Computer Engineering)",
      "BSECE (Bachelor of Science in Electronics and Communications Engineering)",
      "BSEE (Bachelor of Science in Electrical Engineering)"
    ],
    "CHTM (College of Health and Technology Management)": [
      "BSN (Bachelor of Science in Nursing)",
      "BSRT (Bachelor of Science in Radiologic Technology)",
      "BSMT (Bachelor of Science in Medical Technology)"
    ],
    "CITHM (College of International Tourism and Hospitality Management)": [
      "BSHM (Bachelor of Science in Hospitality Management)",
      "BSTM (Bachelor of Science in Tourism Management)",
      "BSCA (Bachelor of Science in Culinary Arts)"
    ]
  };
  const violations = ["Cap", "Shorts", "Sleeveless"];

  const validateName = (name) => {
    const nameRegex = /^[A-Za-z\s]+$/;
    return nameRegex.test(name);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Reset error for this field
    setFormErrors(prev => ({
      ...prev,
      [field]: ''
    }));

    // Validate name field
    if (field === 'name' && !validateName(value)) {
      setFormErrors(prev => ({
        ...prev,
        name: 'Only letters and spaces are allowed'
      }));
    }
  };

  const columns = [
    { field: 'id', headerName: 'ID', flex: 0.5 },
    { 
      field: 'name', 
      headerName: 'Student Name', 
      flex: 1,
      cellClassName: "name-column--cell"
    },
    { 
      field: 'program', 
      headerName: 'Program', 
      flex: 0.8 
    },
    { 
      field: 'yearLevel', 
      headerName: 'Year Level', 
      flex: 0.7 
    },
    { 
      field: 'violation', 
      headerName: 'Violation', 
      flex: 1 
    },
    { 
      field: 'date', 
      headerName: 'Date', 
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
      field: 'department', 
      headerName: 'Department', 
      flex: 0.8 
    },
  ];

  const handleAddNew = () => {
    setSelectedRecord(null);
    setFormData({
      name: '',
      program: '',
      yearLevel: '',
      violation: '',
      date: '',
      department: ''
    });
    setFormErrors({
      name: '',
      program: '',
      yearLevel: '',
      violation: '',
      date: '',
      department: ''
    });
    setIsModalOpen(true);
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setSelectedRecord(null);
  };

  const handleSubmit = () => {
    // Reset all errors
    const newErrors = {
      name: '',
      program: '',
      yearLevel: '',
      violation: '',
      date: '',
      department: ''
    };

    // Validate required fields
    if (!formData.name) newErrors.name = 'Student name is required';
    if (!formData.program) newErrors.program = 'Program is required';
    if (!formData.yearLevel) newErrors.yearLevel = 'Year level is required';
    if (!formData.violation) newErrors.violation = 'Violation is required';
    if (!formData.date) newErrors.date = 'Date is required';
    if (!formData.department) newErrors.department = 'Department is required';

    // Check name format
    if (formData.name && !validateName(formData.name)) {
      newErrors.name = 'Only letters and spaces are allowed';
    }

    // Update form errors
    setFormErrors(newErrors);

    // Check if there are any errors
    if (Object.values(newErrors).some(error => error !== '')) {
      return;
    }

    // If no errors, proceed with submission
    try {
      if (selectedRecord) {
        // Update existing record
        setRecords(records.map(record => 
          record.id === selectedRecord.id ? { ...formData, id: record.id } : record
        ));
      } else {
        // Add new record
        setRecords([...records, { ...formData, id: Date.now() }]);
      }
      handleClose();
    } catch (error) {
      console.error("Error saving record:", error);
      alert("Error saving record. Please try again.");
    }
  };

  const handleDepartmentChange = (event) => {
    const department = event.target.value;
    setFormData({
      ...formData,
      department,
      program: '' // Reset program when department changes
    });
    setFormErrors(prev => ({
      ...prev,
      department: '',
      program: ''
    }));
  };

  const CustomToolbar = () => {
    return (
      <GridToolbarContainer>
        <GridToolbarFilterButton />
        <GridToolbarDensitySelector />
        <GridToolbarExport />
      </GridToolbarContainer>
    );
  };

  return (
    <Box m="20px">
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Header title="Violation Records"/>
        <Button
          onClick={handleAddNew}
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
          Add New Record
        </Button>
      </Box>

      <Box
        m="0px 0 0 0"
        height="87vh"
        sx={{
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
            padding: 2,
            "& .MuiButton-root": {
              color: colors.grey[100],
              fontSize: "14px",
            },
          },
          "& .MuiDataGrid-cell:focus": {
            outline: "none",
          },
          "& .MuiDataGrid-row": {
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
        }}
      >
        <DataGrid
          rows={records}
          columns={columns}
          components={{
            Toolbar: CustomToolbar
          }}
          checkboxSelection
          disableRowSelectionOnClick
        />
      </Box>

      <Dialog 
        open={isModalOpen} 
        onClose={handleClose}
        PaperProps={{
          sx: {
            backgroundColor: colors.grey[900],
          }
        }}
      >
        <DialogTitle sx={{ color: colors.grey[100] }}>
          {selectedRecord ? 'Edit Record' : 'Add New Record'}
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
                flexDirection: 'column',
                gap: 1,
              },
              '& .form-field': {
                display: 'flex',
                alignItems: 'flex-start',
                gap: 2,
                minWidth: '500px',
              },
              '& .form-label': {
                minWidth: '120px',
                textAlign: 'left',
                paddingTop: '8px',
              },
              '& .form-input': {
                flex: 1,
                minWidth: '350px',
              },
              '& .error-text': {
                marginLeft: 'calc(120px + 16px)',
                fontSize: '0.75rem',
              },
            }}
            noValidate
            autoComplete="off"
          >
            <div className="form-row">
              <div className="form-field">
                <Typography
                  className="form-label"
                  sx={{ 
                    color: colors.grey[100],
                    fontWeight: 'bold'
                  }}
                >
                  Student Name *
                </Typography>
                <OutlinedInput
                  className="form-input"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter student name"
                  error={!!formErrors.name}
                  sx={{
                    color: colors.grey[100],
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: formErrors.name ? '#f44336' : colors.grey[400],
                      borderWidth: 1,
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: formErrors.name ? '#f44336' : colors.grey[100],
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: formErrors.name ? '#f44336' : colors.grey[100],
                    },
                    '&::placeholder': {
                      color: colors.grey[500],
                      opacity: 1,
                    },
                  }}
                />
              </div>
              {formErrors.name && (
                <Typography 
                  className="error-text"
                  color="error" 
                  variant="caption"
                >
                  {formErrors.name}
                </Typography>
              )}
            </div>

            <div className="form-row">
              <div className="form-field">
                <Typography
                  className="form-label"
                  sx={{ 
                    color: colors.grey[100],
                    fontWeight: 'bold'
                  }}
                >
                  Department *
                </Typography>
                <Select
                  className="form-input"
                  value={formData.department}
                  onChange={handleDepartmentChange}
                  error={!!formErrors.department}
                  sx={{
                    color: colors.grey[100],
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: formErrors.department ? '#f44336' : colors.grey[400],
                      borderWidth: 1,
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: formErrors.department ? '#f44336' : colors.grey[100],
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: formErrors.department ? '#f44336' : colors.grey[100],
                    },
                    '& .MuiSelect-icon': {
                      color: colors.grey[100],
                    },
                  }}
                >
                  {departments.map((dept) => (
                    <MenuItem key={dept} value={dept}>{dept}</MenuItem>
                  ))}
                </Select>
              </div>
              {formErrors.department && (
                <Typography 
                  className="error-text"
                  color="error" 
                  variant="caption"
                >
                  {formErrors.department}
                </Typography>
              )}
            </div>

            <div className="form-row">
              <div className="form-field">
                <Typography
                  className="form-label"
                  sx={{ 
                    color: colors.grey[100],
                    fontWeight: 'bold'
                  }}
                >
                  Program *
                </Typography>
                <Select
                  className="form-input"
                  value={formData.program}
                  onChange={(e) => handleInputChange('program', e.target.value)}
                  error={!!formErrors.program}
                  disabled={!formData.department}
                  sx={{
                    color: colors.grey[100],
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: formErrors.program ? '#f44336' : colors.grey[400],
                      borderWidth: 1,
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: formErrors.program ? '#f44336' : colors.grey[100],
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: formErrors.program ? '#f44336' : colors.grey[100],
                    },
                    '& .MuiSelect-icon': {
                      color: colors.grey[100],
                    },
                  }}
                >
                  {formData.department && programs[formData.department].map((prog) => (
                    <MenuItem key={prog} value={prog}>{prog}</MenuItem>
                  ))}
                </Select>
              </div>
              {formErrors.program && (
                <Typography 
                  className="error-text"
                  color="error" 
                  variant="caption"
                >
                  {formErrors.program}
                </Typography>
              )}
            </div>

            <div className="form-row">
              <div className="form-field">
                <Typography
                  className="form-label"
                  sx={{ 
                    color: colors.grey[100],
                    fontWeight: 'bold'
                  }}
                >
                  Year Level *
                </Typography>
                <Select
                  className="form-input"
                  value={formData.yearLevel}
                  onChange={(e) => handleInputChange('yearLevel', e.target.value)}
                  error={!!formErrors.yearLevel}
                  sx={{
                    color: colors.grey[100],
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: formErrors.yearLevel ? '#f44336' : colors.grey[400],
                      borderWidth: 1,
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: formErrors.yearLevel ? '#f44336' : colors.grey[100],
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: formErrors.yearLevel ? '#f44336' : colors.grey[100],
                    },
                    '& .MuiSelect-icon': {
                      color: colors.grey[100],
                    },
                  }}
                >
                  {yearLevels.map((year) => (
                    <MenuItem key={year} value={year}>{year}</MenuItem>
                  ))}
                </Select>
              </div>
              {formErrors.yearLevel && (
                <Typography 
                  className="error-text"
                  color="error" 
                  variant="caption"
                >
                  {formErrors.yearLevel}
                </Typography>
              )}
            </div>

            <div className="form-row">
              <div className="form-field">
                <Typography
                  className="form-label"
                  sx={{ 
                    color: colors.grey[100],
                    fontWeight: 'bold'
                  }}
                >
                  Violation *
                </Typography>
                <Select
                  className="form-input"
                  value={formData.violation}
                  onChange={(e) => handleInputChange('violation', e.target.value)}
                  error={!!formErrors.violation}
                  sx={{
                    color: colors.grey[100],
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: formErrors.violation ? '#f44336' : colors.grey[400],
                      borderWidth: 1,
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: formErrors.violation ? '#f44336' : colors.grey[100],
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: formErrors.violation ? '#f44336' : colors.grey[100],
                    },
                    '& .MuiSelect-icon': {
                      color: colors.grey[100],
                    },
                  }}
                >
                  {violations.map((violation) => (
                    <MenuItem key={violation} value={violation}>{violation}</MenuItem>
                  ))}
                </Select>
              </div>
              {formErrors.violation && (
                <Typography 
                  className="error-text"
                  color="error" 
                  variant="caption"
                >
                  {formErrors.violation}
                </Typography>
              )}
            </div>

            <div className="form-row">
              <div className="form-field">
                <Typography
                  className="form-label"
                  sx={{ 
                    color: colors.grey[100],
                    fontWeight: 'bold'
                  }}
                >
                  Date *
                </Typography>
                <OutlinedInput
                  className="form-input"
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleInputChange('date', e.target.value)}
                  error={!!formErrors.date}
                  sx={{
                    color: colors.grey[100],
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: formErrors.date ? '#f44336' : colors.grey[400],
                      borderWidth: 1,
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: formErrors.date ? '#f44336' : colors.grey[100],
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: formErrors.date ? '#f44336' : colors.grey[100],
                    },
                  }}
                />
              </div>
              {formErrors.date && (
                <Typography 
                  className="error-text"
                  color="error" 
                  variant="caption"
                >
                  {formErrors.date}
                </Typography>
              )}
            </div>
          </Box>
        </DialogContent>
        <DialogActions sx={{ backgroundColor: colors.grey[900], padding: '20px' }}>
          <Button onClick={handleClose} sx={{ color: colors.grey[100] }}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
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
            disabled={Object.values(formErrors).some(error => error)}
          >
            {selectedRecord ? 'Save Changes' : 'Add Record'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

const textFieldStyle = (colors) => ({
  '& .MuiInputLabel-root': { 
    color: colors.grey[100],
    fontWeight: 'bold'
  },
  '& .MuiOutlinedInput-root': {
    '& fieldset': { borderColor: colors.grey[400] },
    '&:hover fieldset': { borderColor: colors.grey[100] },
    '&.Mui-focused fieldset': { borderColor: colors.grey[100] },
  },
  '& .MuiInputBase-input': { color: colors.grey[100] },
  '& .MuiSelect-icon': { color: colors.grey[100] },
  marginBottom: '15px'
});

export default ViolationHandling;
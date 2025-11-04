import { 
  Box, 
  Button, 
  Typography, 
  useTheme, 
  TextField, 
  FormControl, 
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
  Paper,
  ToggleButton,
  ToggleButtonGroup
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { tokens } from "../../theme.js";
import Header from "../../components/Header.jsx";
import React, { useEffect, useState } from "react";

/* =========================
   IMPORTANT: added imports for firebase gadget functions
   (Make sure studentConcernsService.ts below is placed at
    src/services/studentConcernsService.ts)
   ========================= */
import { 
  addStudentConcern, 
  getStudentConcernsByStudent, 
  getConcernCategories,
  // added gadget service functions:
  addGadgetRequest,
  getGadgetRequestsByStudent,
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
import ArticleIcon from '@mui/icons-material/Article';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import DownloadIcon from '@mui/icons-material/Download';

/* =========================
   Upload helper (added)
   - Sends file to local Express server (http://localhost:4000/upload)
   - Server must accept 'file' and 'folder' form fields and return JSON { filePath }
   - folder must be specified relative to project root upload server expects,
     but we use "../uploads/concerns" and "../uploads/gadgets" (since uploads is in scenes)
   ========================= */
const uploadFileToLocalServer = async (file, folder = "uploads") => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("folder", folder); // ✅ crucial: ensures Express gets the folder name

  const response = await fetch("http://localhost:4000/upload", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Upload failed: ${errText}`);
  }

  const data = await response.json();
  return data.filePath; // should look like /uploads/gadgets/file_123.jpg
};


const StudentConcerns = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  const user = JSON.parse(sessionStorage.getItem('user')); // ✅ define first

  // View toggle: 'concerns' or 'gadgets'
  const [view, setView] = useState('concerns');

  // concerns state (from your service)
  const [concerns, setConcerns] = useState([]);
  // gadget requests state (now Firebase-backed)
  const [gadgetRequests, setGadgetRequests] = useState([]);

  const [openDialog, setOpenDialog] = useState(false);
  const [openGadgetDialog, setOpenGadgetDialog] = useState(false);

  const [loading, setLoading] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [selectedConcern, setSelectedConcern] = useState(null);
  const [selectedGadget, setSelectedGadget] = useState(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  // Concern form data (existing)
  const [formData, setFormData] = useState({
    studentId: user?.user_id || '',
    studentName: `${user?.first_name || ''} ${user?.last_name || ''}`,
    category: '',
    description: '',
    photoUrl: ''
  });

  // Gadget request form data (new)
  const [gadgetForm, setGadgetForm] = useState({
    studentId: user?.user_id || '',
    studentName: `${user?.first_name || ''} ${user?.last_name || ''}`,
    itemName: '',
    purpose: '',
    proofImageUrl: '',
    status: 'Pending'
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

  const resetGadgetForm = () => {
    setGadgetForm({
      studentId: user?.user_id || '',
      studentName: `${user?.first_name || ''} ${user?.last_name || ''}`,
      itemName: '',
      purpose: '',
      proofImageUrl: '',
      status: 'Pending'
    });
  };

  const categories = getConcernCategories();

  useEffect(() => {
    fetchConcerns();
    fetchGadgetRequests();
    // eslint-disable-next-line
  }, []);

  /* -----------------------
     Fetch concerns (existing)
     ----------------------- */
  const fetchConcerns = async () => {
    try {
      setLoading(true);
      const userConcerns = await getStudentConcernsByStudent(user?.user_id || ''); // fixed
      // ensure each row has an `id` for DataGrid; if backend uses a different key, adjust
      const normalized = (userConcerns || []).map((c, idx) => ({ id: c.id ?? c.concern_id ?? idx, ...c }));
      setConcerns(normalized);
    } catch (error) {
      console.error("Error fetching concerns:", error);
      showSnackbar('Error fetching concerns', 'error');
    } finally {
      setLoading(false);
    }
  };

  /* -----------------------
     Fetch gadget requests (REPLACED: now uses Firebase)
     - Shows only the current user's gadget requests (privacy)
     ----------------------- */
  const fetchGadgetRequests = async () => {
    try {
      setLoading(true);
      // uses new service getGadgetRequestsByStudent
      const userGadgets = await getGadgetRequestsByStudent(user?.user_id || '');
      const normalized = (userGadgets || []).map((g, idx) => ({ id: g.id ?? g.gadget_id ?? idx, ...g }));
      setGadgetRequests(normalized);
    } catch (error) {
      console.error("Error fetching gadget requests:", error);
      showSnackbar('Error fetching gadget requests', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  /* -----------------------
     Submit Concern (existing) - now uses photoUrl path returned from local server
     ----------------------- */
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

      // call your existing service (addStudentConcern)
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

  /* -----------------------
     Submit gadget request (REPLACED: now saves to Firebase)
     ----------------------- */
  const handleGadgetSubmit = async () => {
    if (!gadgetForm.studentId || !gadgetForm.studentName || !gadgetForm.itemName || !gadgetForm.purpose || !gadgetForm.proofImageUrl) {
      showSnackbar('Please fill in all required fields for gadget request', 'error');
      return;
    }

    try {
      setLoading(true);
      const newReq = {
        ...gadgetForm,
        status: 'Pending',
        dateSubmitted: new Date().toLocaleDateString(),
        timeSubmitted: new Date().toLocaleTimeString(),
      };

      // USE FIREBASE: addGadgetRequest stores the document in Firestore
      await addGadgetRequest(newReq);

      showSnackbar('Gadget request submitted!');
      setOpenGadgetDialog(false);
      resetGadgetForm();
      fetchGadgetRequests();
    } catch (err) {
      console.error("Error saving gadget request:", err);
      showSnackbar('Error saving gadget request', 'error');
    } finally {
      setLoading(false);
    }
  };

  /* -----------------------
     File input handlers for concerns & gadgets
     - These upload file to your local server, receive relative path,
       then save that path into form state so when you call your existing
       addStudentConcern or addGadgetRequest, the DB will store the path.
     ----------------------- */
  const handleConcernFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      // Save inside /uploads/concerns (relative path ../uploads/concerns as per your layout)
      const relativePath = await uploadFileToLocalServer(file, "uploads");
      setFormData((prev) => ({ ...prev, photoUrl: relativePath }));
      showSnackbar("Concern photo uploaded successfully", "success");
    } catch (error) {
      console.error("Error uploading concern image:", error);
      showSnackbar("Failed to upload image", "error");
    }
  };
const getImageUrl = (path) => {
  if (!path) return "";
  // Normalize all paths to /uploads/... regardless of what Firebase stored
  const cleanPath = path.replace("../", "").replace("..", "");
  // If somehow it still contains a subfolder, no problem — Express serves all inside /uploads/
  if (!cleanPath.startsWith("/uploads")) return `http://localhost:4000/uploads/${cleanPath}`;
  return `http://localhost:4000${cleanPath}`;
};

  const handleGadgetFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      // Save inside /uploads/gadgets
      const relativePath = await uploadFileToLocalServer(file, "uploads");
      setGadgetForm((prev) => ({ ...prev, proofImageUrl: relativePath }));
      showSnackbar("OSA permit uploaded successfully", "success");
    } catch (error) {
      console.error("Error uploading gadget proof:", error);
      showSnackbar("Failed to upload permit image", "error");
    }
  };

  /* -----------------------
     View handlers
     ----------------------- */
  const handleViewConcern = (concern) => {
    setSelectedConcern(concern);
    setSelectedGadget(null);
    setViewDialogOpen(true);
  };

  const handleViewGadget = (gadget) => {
    setSelectedGadget(gadget);
    setSelectedConcern(null);
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

  /* -----------------------
     Export displayed table (CSV)
     Exports full dataset for the current view
     ----------------------- */
  const exportDisplayedTableAsCSV = () => {
    const data = view === 'concerns' ? concerns : gadgetRequests;
    if (!data || data.length === 0) {
      showSnackbar('No data to export', 'error');
      return;
    }

    // Collect all keys across items to form columns
    const keys = Array.from(data.reduce((acc, row) => {
      Object.keys(row).forEach(k => acc.add(k));
      return acc;
    }, new Set()));

    // CSV header
    const csvRows = [];
    csvRows.push(keys.join(','));

    // Each row: escape quotes and wrap fields with quotes if needed
    for (const row of data) {
      const values = keys.map(k => {
        let v = row[k] ?? '';
        // If it's an object, stringify
        if (typeof v === 'object') v = JSON.stringify(v);
        // Remove line breaks
        v = String(v).replace(/\r?\n|\r/g, ' ');
        // Escape quotes by doubling
        v = v.replace(/"/g, '""');
        // Wrap in quotes
        return `"${v}"`;
      });
      csvRows.push(values.join(','));
    }

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const filename = view === 'concerns' ? 'student_concerns_export.csv' : 'gadget_requests_export.csv';
    a.setAttribute('download', filename);
    a.click();
    URL.revokeObjectURL(url);
    showSnackbar('Export started', 'success');
  };

  /* -----------------------
     DataGrid columns for concerns & gadgets
     ----------------------- */
  const concernColumns = [
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

  const gadgetColumns = [
    {
      field: "studentId",
      headerName: "Student ID",
      flex: 0.8,
    },
    {
      field: "itemName",
      headerName: "Item Name",
      flex: 1.2,
    },
    {
      field: "purpose",
      headerName: "Purpose",
      flex: 1.8,
      renderCell: ({ row }) => (
        <Typography sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>
          {row.purpose}
        </Typography>
      ),
    },
    {
      field: "status",
      headerName: "Status",
      flex: 0.8,
      renderCell: ({ row }) => (
        <Chip label={row.status} sx={{ backgroundColor: getStatusColor(row.status), color: 'white', fontWeight: 'bold' }} />
      ),
    },
    {
      field: "dateSubmitted",
      headerName: "Date Submitted",
      flex: 1,
    },
    {
      field: "actions",
      headerName: "Actions",
      flex: 0.8,
      renderCell: (params) => (
        <IconButton onClick={() => handleViewGadget(params.row)} color="primary" size="small"><VisibilityIcon /></IconButton>
      ),
    },
  ];

  return (
    <Box m="20px">
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Header title="My Concerns" subtitle="Submit and track your school concerns"/>
        <Box display="flex" gap={2} alignItems="center">
          <ToggleButtonGroup
            value={view}
            exclusive
            onChange={(_, val) => { if (val) setView(val); }}
            size="small"
          >
            <ToggleButton value="concerns">Student Concerns</ToggleButton>
            <ToggleButton value="gadgets">Gadget Requests</ToggleButton>
          </ToggleButtonGroup>

          <Button
            onClick={() => { if (view === 'concerns') setOpenDialog(true); else setOpenGadgetDialog(true); }}
            variant="contained"
            startIcon={<AddIcon />}
            sx={{
              backgroundColor: '#ffd700',
              color: colors.grey[100],
              fontSize: "14px",
              fontWeight: "bold",
              padding: "10px 20px",
              "&:hover": { backgroundColor: '#e6c200' }
            }}
          >
            {view === 'concerns' ? 'Submit New Concern' : 'Request to Bring Gadget'}
          </Button>

          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={exportDisplayedTableAsCSV}
            sx={{
              borderColor: '#e2e8f0',
              color: '#1f2937',
              backgroundColor: 'white',
              padding: '10px 16px',
              textTransform: 'none'
            }}
          >
            Export Displayed Table
          </Button>
        </Box>
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
          rows={view === 'concerns' ? concerns : gadgetRequests}
          columns={view === 'concerns' ? concernColumns : gadgetColumns}
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
                  onChange={(e) => setFormData(p => ({ ...p, studentId: e.target.value }))}
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
                  onChange={(e) => setFormData(p => ({ ...p, studentName: e.target.value }))}
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
                  onChange={(e) => setFormData(p => ({ ...p, category: e.target.value }))}
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
                onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
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
                component="label"
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
                  }
                }}
              >
                Upload Photo Evidence
                {/* changed: file input now calls handleConcernFileChange which uploads to local server */}
                <input hidden accept="image/*" type="file" onChange={handleConcernFileChange} />
              </Button>
              <Typography sx={{ 
                mt: 1.5, 
                fontSize: '13px', 
                color: '#92400e',
                fontStyle: 'italic'
              }}>
                Attach photo evidence (stored locally).
              </Typography>

              {/* Display uploaded preview (note: prefix with http://localhost:4000 when rendering) */}
              {selectedConcern && selectedConcern.photoUrl && (
  <Box mt={2}>
    <img
      src={getImageUrl(selectedConcern.photoUrl)}
      alt="evidence"
      style={{ width: "100%", borderRadius: 8 }}
    />
  </Box>
)}

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

      {/* ----------------------------
          Gadget Request Dialog (new)
          ---------------------------- */}
      <Dialog open={openGadgetDialog} onClose={() => { setOpenGadgetDialog(false); resetGadgetForm(); }} maxWidth="md" fullWidth>
        <Box sx={{ background: 'linear-gradient(135deg, #000000 0%, #1a1a1a 100%)', padding: '24px', position: 'relative', borderBottom: '4px solid #ffd700' }}>
          <IconButton onClick={() => { setOpenGadgetDialog(false); resetGadgetForm(); }} sx={{ position: 'absolute', right: 16, top: 16, color: '#ffd700' }}><CloseIcon /></IconButton>
          <Typography sx={{ color: '#ffd700', fontSize: '22px', fontWeight: 700 }}>Request to Bring Gadget / Outside Items</Typography>
          <Typography sx={{ color: '#ffffffcc', fontSize: '14px' }}>Submit gadget details and upload your OSA permit proof.</Typography>
        </Box>

        <DialogContent sx={{ padding: '24px' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Paper elevation={0} sx={{ backgroundColor: '#f8f9fa', borderRadius: '12px', padding: '16px', border: '1px solid #e9ecef' }}>
              <Box display="flex" gap={2}>
                <TextField placeholder="Student ID" value={gadgetForm.studentId} onChange={(e) => setGadgetForm(p => ({ ...p, studentId: e.target.value }))} fullWidth variant="outlined" />
                <TextField placeholder="Full Name" value={gadgetForm.studentName} onChange={(e) => setGadgetForm(p => ({ ...p, studentName: e.target.value }))} fullWidth variant="outlined" />
              </Box>
            </Paper>

            <Paper elevation={0} sx={{ backgroundColor: '#f8f9fa', borderRadius: '12px', padding: '16px', border: '1px solid #e9ecef' }}>
              <Box display="flex" gap={2}>
                <TextField placeholder="Item Name (e.g., Phone, Drone, Camera)" value={gadgetForm.itemName} onChange={(e) => setGadgetForm(p => ({ ...p, itemName: e.target.value }))} fullWidth variant="outlined" />
                <TextField placeholder="Purpose" value={gadgetForm.purpose} onChange={(e) => setGadgetForm(p => ({ ...p, purpose: e.target.value }))} fullWidth variant="outlined" />
              </Box>
            </Paper>

            <Paper elevation={0} sx={{ backgroundColor: '#fef9f3', borderRadius: '12px', padding: '16px', border: '1px solid #fed7aa' }}>
              <Box display="flex" alignItems="center" gap={2}>
                <Button variant="outlined" startIcon={<FileUploadIcon />} component="label">
                  Upload OSA Permit Proof
                  <input hidden accept="image/*" type="file" onChange={handleGadgetFileChange} />
                </Button>

                {selectedGadget && selectedGadget.proofImageUrl && (
  <Box mt={2}>
    <img
      src={getImageUrl(selectedGadget.proofImageUrl)}
      alt="permit"
      style={{ width: "100%", borderRadius: 8 }}
    />
  </Box>
)}

              </Box>
              <Typography sx={{ mt: 1.5, fontSize: '13px', color: '#92400e', fontStyle: 'italic' }}>
                Upload a photo or scanned copy of your OSA permit (stored locally).
              </Typography>
            </Paper>
          </Box>
        </DialogContent>

        <DialogActions sx={{ padding: '16px', borderTop: '4px solid #ffd700' }}>
          <Button onClick={() => { setOpenGadgetDialog(false); resetGadgetForm(); }}>Cancel</Button>
          <Button onClick={handleGadgetSubmit} variant="contained" disabled={loading || !gadgetForm.itemName || !gadgetForm.purpose || !gadgetForm.proofImageUrl}>
            {loading ? 'Submitting...' : 'Submit Gadget Request'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Dialog for both concerns and gadget requests */}
      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontSize: 20, fontWeight: 'bold' }}>{selectedConcern ? 'Concern Details' : 'Gadget Request Details'}</DialogTitle>
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

              {selectedConcern && selectedConcern.photoUrl && (
  <Box mt={2}>
    <img
      src={getImageUrl(selectedConcern.photoUrl)}
      alt="evidence"
      style={{ width: "100%", borderRadius: 8 }}
    />
  </Box>
)}


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

          {selectedGadget && (
            <Box sx={{ padding: '10px' }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" color={colors.grey[100]}>
                  Student: {selectedGadget.studentName}
                </Typography>
                <Chip
                  label={selectedGadget.status}
                  sx={{
                    backgroundColor: getStatusColor(selectedGadget.status),
                    color: 'white',
                    fontWeight: 'bold'
                  }}
                />
              </Box>
              
              <Typography variant="body2" color={colors.grey[300]} mb={1}>
                <strong>Student ID:</strong> {selectedGadget.studentId}
              </Typography>
              
              <Typography variant="body2" color={colors.grey[300]} mb={1}>
                <strong>Item:</strong> {selectedGadget.itemName}
              </Typography>
              
              <Typography variant="body2" color={colors.grey[300]} mb={1}>
                <strong>Purpose:</strong> {selectedGadget.purpose}
              </Typography>

              <Typography variant="body2" color={colors.grey[300]} mb={2}>
                <strong>Date Submitted:</strong> {selectedGadget.dateSubmitted} at {selectedGadget.timeSubmitted}
              </Typography>

              {selectedGadget && selectedGadget.proofImageUrl && (
  <Box mt={2}>
    <img
      src={getImageUrl(selectedGadget.proofImageUrl)}
      alt="permit"
      style={{ width: "100%", borderRadius: 8 }}
    />
  </Box>
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

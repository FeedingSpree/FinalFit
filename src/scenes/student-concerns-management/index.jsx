// index.jsx – StudentConcernsManagement (Gold & Black Restyle, Part 2)
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
  Alert,
  Paper
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
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import CloseIcon from "@mui/icons-material/Close";
import CategoryIcon from '@mui/icons-material/Category';
import DescriptionIcon from '@mui/icons-material/Description';
import { Tabs, Tab } from "@mui/material";
import { getAllGadgetRequests, updateGadgetRequest } from "../../services/studentRecordsService.ts";

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
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");
  const [confirmText, setConfirmText] = useState("");
  const [activeTab, setActiveTab] = useState(0); // 0 = concerns, 1 = permits
  const [permits, setPermits] = useState([]);
  const [selectedPermit, setSelectedPermit] = useState(null);

  const [reviewData, setReviewData] = useState({
    status: "",
    reviewNotes: ""
  });

  const user = JSON.parse(sessionStorage.getItem("user"));

  useEffect(() => {
    // Fetch data based on the active tab
    if (activeTab === 0) {
      fetchConcerns();
    } else {
      fetchPermits();
    }
  }, [activeTab]); // Re-run this effect when activeTab changes

  const fetchConcerns = async () => {
    try {
      setLoading(true);
      const allConcerns = await getStudentConcerns();
      setConcerns(allConcerns);
    } catch (error) {
      console.error("Error fetching concerns:", error);
      showSnackbar("Error fetching concerns", "error");
    } finally {
      setLoading(false);
    }
  };
  
  const fetchPermits = async () => {
    try {
      setLoading(true);
      const data = await getAllGadgetRequests();
      setPermits(data);
    } catch (err) {
      console.error("Error fetching permits:", err);
      showSnackbar("Error fetching permits", "error");
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message, severity = "success") => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const handleViewItem = (item) => {
    // This generic handler works for both concerns and permits
    setSelectedConcern(item); // Use selectedConcern to store the item for the view dialog
    setViewDialogOpen(true);
  };

  const handleReviewConcern = (concern) => {
    setSelectedConcern(concern); // Set this for the submit handler
    setReviewData({
      status: concern.status,
      reviewNotes: concern.reviewNotes || ""
    });
    setReviewDialogOpen(true);
  };
  
  const handleReviewPermit = (permit) => {
    setSelectedPermit(permit); // Set this for the submit handler
    setSelectedConcern(permit); // Use this to populate student info in the dialog
    setReviewData({
      status: permit.status,
      reviewNotes: permit.reviewNotes || ""
    });
    setReviewDialogOpen(true);
  };


  const handleDeleteClick = (concern) => {
    setSelectedConcern(concern);
    setDeleteDialogOpen(true);
    setConfirmText("");
  };

  const handleReviewSubmit = async () => {
    if (!reviewData.status) {
      showSnackbar("Please select a status", "error");
      return;
    }
    
    try {
      setLoading(true);
      const reviewPayload = {
        ...reviewData,
        reviewedBy: user?.username || "OSA Staff",
        reviewDate: new Date().toLocaleDateString(), // Use consistent date format
      };

      if (activeTab === 1) {
        // Update gadget permit request
        await updateGadgetRequest(selectedPermit.id, reviewPayload);
        showSnackbar("Permit request updated successfully", "success");
        fetchPermits();
      } else {
        // Update student concern
        await updateStudentConcern(selectedConcern.id, reviewPayload);
        showSnackbar("Concern updated successfully", "success");
        fetchConcerns();
      }
      setReviewDialogOpen(false);
    } catch (err) {
      console.error("Error updating item:", err);
      showSnackbar("Failed to update", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (confirmText.toLowerCase() !== "confirm") {
      showSnackbar('Please type "confirm" to delete', "error");
      return;
    }

    try {
      setLoading(true);
      await deleteStudentConcern(selectedConcern.id);
      showSnackbar("Concern deleted successfully!");
      setDeleteDialogOpen(false);
      setConfirmText("");
      fetchConcerns();
    } catch (error) {
      console.error("Error deleting concern:", error);
      showSnackbar("Error deleting concern", "error");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Pending":
        return "#ff9800";
      case "Reviewed":
        return "#2196f3";
      case "Resolved":
        return "#4caf50";
      case "Approved": // Added for permits
        return "#4caf50";
      case "Denied": // Added for permits
        return "#f44336";
      default:
        return "#757575";
    }
  };

  const getCategoryColor = (category) => {
    const colors = {
      "Academic Issues": "#9c27b0",
      "Facility Problems": "#f44336",
      "Dress Code Violation": "#ff5722",
      "Bullying/Harassment": "#e91e63",
      "Safety Concerns": "#ff9800",
      "Food Services": "#4caf50",
      Transportation: "#2196f3",
      "Technology Issues": "#607d8b",
      Other: "#795548"
    };
    return colors[category] || "#757575";
  };

  // Columns for Student Concerns
  const columns = [
    { field: "studentId", headerName: "Student ID", flex: 0.8 },
    { field: "studentName", headerName: "Student Name", flex: 1 },
    
    {
      field: "category",
      headerName: "Category",
      flex: 1.2,
      renderCell: ({ row }) => (
        <Chip
          label={row.category}
          size="small"
          sx={{
            backgroundColor: getCategoryColor(row.category),
            color: "white",
            fontWeight: "bold"
          }}
        />
      )
    },
    {
      field: "description",
      headerName: "Description",
      flex: 2,
      renderCell: ({ row }) => (
        <Typography
          sx={{
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            maxWidth: "100%"
          }}
        >
          {row.description}
        </Typography>
      )
    },
    {
      field: "status",
      headerName: "Status",
      flex: 0.8,
      renderCell: ({ row }) => (
        <Chip
          label={row.status}
          sx={{
            backgroundColor: getStatusColor(row.status),
            color: "white",
            fontWeight: "bold"
          }}
        />
      )
    },
    { field: "dateSubmitted", headerName: "Date Submitted", flex: 1 },
    {
      field: "actions",
      headerName: "Actions",
      flex: 1.2,
      renderCell: (params) => (
        <Box display="flex" gap="5px">
          <IconButton
            onClick={() => handleViewItem(params.row)}
            size="small"
            sx={{ color: "#000" }}
            title="View Details"
          >
            <VisibilityIcon />
          </IconButton>
          <IconButton
            onClick={() => handleReviewConcern(params.row)}
            size="small"
            sx={{ color: "#000" }}
            title="Review/Update"
          >
            <EditIcon />
          </IconButton>
          <IconButton
            onClick={() => handleDeleteClick(params.row)}
            size="small"
            sx={{ color: "#000" }}
            title="Delete"
          >
            <DeleteIcon />
          </IconButton>
        </Box>
      )
    }
  ];

  // Define columns for permits
  const permitColumns = [
    { field: "studentId", headerName: "Student ID", flex: 1 },
    { field: "studentName", headerName: "Student Name", flex: 1.2 },
    { field: "itemName", headerName: "Item", flex: 1 },
    { field: "purpose", headerName: "Purpose", flex: 1.5 },
    {
      field: "status",
      headerName: "Status",
      flex: 0.8, 
      renderCell: ({ row }) => ( 
        <Chip
          label={row.status}
          sx={{
            backgroundColor: getStatusColor(row.status),
            color: "white",
            fontWeight: "bold"
          }}
        />
      )
    },
    { field: "dateSubmitted", headerName: "Date", flex: 1 },
    {
      field: "actions",
      headerName: "Actions",
      flex: 1.2, 
      renderCell: (params) => ( 
        <Box display="flex" gap="5px">
          <IconButton
            onClick={() => handleViewItem(params.row)} // Use generic view handler
            size="small"
            sx={{ color: "#000" }}
            title="View Details"
          >
            <VisibilityIcon />
          </IconButton>
          <IconButton
            onClick={() => handleReviewPermit(params.row)} // Use specific permit review handler
            size="small"
            sx={{ color: "#000" }}
            title="Review/Update"
          >
            <EditIcon />
          </IconButton>
        </Box>
      ),
    },
  ];

  // Common DataGrid styles
  const dataGridStyles = {
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
  };

  return (
    <Box m="20px">
      <Header
        title="Student Concerns Management"
        subtitle="Review and manage student-submitted concerns and permits"
      />

      {/* Tabs switcher */}
      <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
        <Tabs
          value={activeTab}
          onChange={(e, v) => setActiveTab(v)}
          textColor="inherit"
          indicatorColor="secondary"
        >
          <Tab label="Student Concerns" />
          <Tab label="Permit Requests" />
        </Tabs>
      </Box>

      {/* Student Concerns Table */}
      {activeTab === 0 && (
        <Box
          m="40px 0 0 0"
          height="75vh"
          sx={dataGridStyles}
        >
          <DataGrid
            rows={concerns}
            columns={columns}
            loading={loading}
            disableRowSelectionOnClick
            components={{ Toolbar: GridToolbar }}
            initialState={{
              sorting: {
                sortModel: [{ field: "dateSubmitted", sort: "desc" }],
              },
            }}
          />
        </Box>
      )}

      {/* Gadget Permit Requests Table */}
      {activeTab === 1 && (
        <Box
          m="40px 0 0 0"
          height="75vh"
          sx={dataGridStyles}
        >
          <DataGrid
            rows={permits}
            loading={loading}
            disableRowSelectionOnClick
            components={{ Toolbar: GridToolbar }}
            columns={permitColumns} 
            initialState={{
              sorting: {
                sortModel: [{ field: "dateSubmitted", sort: "desc" }],
              },
            }}
          />
        </Box>
      )}

      {/* View Concern/Permit Dialog (NOW DYNAMIC) */}
      <Dialog
        open={viewDialogOpen}
        onClose={() => setViewDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: "#ffffff",
            borderRadius: "16px",
            boxShadow: "0 20px 60px rgba(0,0,0,0.15)"
          }
        }}
      >
        {/* Header */}
        <Box
          sx={{
            background: "linear-gradient(135deg,#000000 0%,#1a1a1a 100%)",
            padding: "32px",
            borderBottom: "4px solid #ffd700",
            position: "relative"
          }}
        >
          <IconButton
            onClick={() => setViewDialogOpen(false)}
            sx={{
              position: "absolute",
              right: 16,
              top: 16,
              color: "#ffd700",
              backgroundColor: "rgba(255,255,255,0.03)",
              "&:hover": { backgroundColor: "rgba(255,215,0,0.12)" }
            }}
          >
            <CloseIcon />
          </IconButton>
          <Typography
            sx={{ color: "#ffd700", fontSize: "26px", fontWeight: "700" }}
          >
            {/* DYNAMIC TITLE */}
            {activeTab === 0 ? "Concern Details" : "Permit Details"}
          </Typography>
          <Typography sx={{ color: "#ffffffcc", fontSize: "15px" }}>
            {/* DYNAMIC SUBTITLE */}
            {activeTab === 0
              ? "Review all information submitted by the student"
              : "Review gadget permit request details"}
          </Typography>
        </Box>

        <DialogContent sx={{ padding: "32px" }}>
          {selectedConcern && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              {/* Student Info (Common) */}
              <Paper
                elevation={0}
                sx={{
                  backgroundColor: "#f8f9fa",
                  borderRadius: "12px",
                  padding: "24px",
                  border: "1px solid #e9ecef"
                }}
              >
                <Typography sx={{ fontWeight: "600", mb: 1, color: "#2d3748" }}>
                  Student
                </Typography>
                <Typography sx={{ color: "#4a5568" }}>
                  {selectedConcern.studentName} ({selectedConcern.studentId})
                </Typography>
              </Paper>

              {/* DYNAMIC CONTENT */}
              {activeTab === 0 ? (
                <>
                  {/* Concern-specific fields */}
                  <Paper
                    elevation={0}
                    sx={{
                      backgroundColor: "#f8f9fa",
                      borderRadius: "12px",
                      padding: "24px",
                      border: "1px solid #e9ecef"
                    }}
                  >
                    <Typography sx={{ fontWeight: "600", mb: 1, color: "#2d3748" }}>
                      Concern Category
                    </Typography>
                    <Chip
                      label={selectedConcern.category}
                      sx={{
                        backgroundColor: getCategoryColor(selectedConcern.category),
                        color: "white",
                        fontWeight: "bold"
                      }}
                    />
                  </Paper>

                  <Paper
                    elevation={0}
                    sx={{
                      backgroundColor: "#f8f9fa",
                      borderRadius: "12px",
                      padding: "24px",
                      border: "1px solid #e9ecef"
                    }}
                  >
                    <Typography sx={{ fontWeight: "600", mb: 1, color: "#2d3748" }}>
                      Description
                    </Typography>
                    <Typography sx={{ color: "#4a5568" }}>
                      {selectedConcern.description}
                    </Typography>
                  </Paper>
                </>
              ) : (
                <>
                  {/* Permit-specific fields */}
                  <Paper
                    elevation={0}
                    sx={{
                      backgroundColor: "#f8f9fa",
                      borderRadius: "12px",
                      padding: "24px",
                      border: "1px solid #e9ecef"
                    }}
                  >
                    <Typography sx={{ fontWeight: "600", mb: 1, color: "#2d3748" }}>
                      Item Name
                    </Typography>
                    <Typography sx={{ color: "#4a5568" }}>
                      {selectedConcern.itemName}
                    </Typography>
                  </Paper>

                  <Paper
                    elevation={0}
                    sx={{
                      backgroundColor: "#f8f9fa",
                      borderRadius: "12px",
                      padding: "24px",
                      border: "1px solid #e9ecef"
                    }}
                  >
                    <Typography sx={{ fontWeight: "600", mb: 1, color: "#2d3748" }}>
                      Purpose
                    </Typography>
                    <Typography sx={{ color: "#4a5568" }}>
                      {selectedConcern.purpose}
                    </Typography>
                  </Paper>
                </>
               
              )}
{/* Evidence/Image Attachment (Common) */}
             <img
  src={
    selectedConcern
      ? `http://localhost:4000${(selectedConcern.imageUrl || selectedConcern.proofImageUrl || "")
          .replace(/^(\.\.\/)+/, "")
          .replace(/^\/*/, "/")}`
      : ""
  }
  alt="Submitted Evidence"
  style={{
    width: "100%",
    height: "auto",
    display: "block",
    maxHeight: "400px",
    objectFit: "contain",
  }}
  onError={(e) => {
    e.target.style.display = "none"; // ⬅ hides the image if it fails to load
  }}
/>


              {/* Review Details (Common) */}
              {selectedConcern.reviewedBy && (
                <Paper
                  elevation={0}
                  sx={{
                    backgroundColor: "#f8f9fa",
                    borderRadius: "12px",
                    padding: "24px",
                    border: "1px solid #e9ecef"
                  }}
                >
                  <Typography
                    sx={{ fontWeight: "600", mb: 1, color: "#2d3748" }}
                  >
                    Review Details
                  </Typography>
                  <Typography sx={{ color: "#4a5568" }}>
                    Reviewed by: {selectedConcern.reviewedBy} on{" "}
                    {selectedConcern.reviewDate}
                  </Typography>
                  {selectedConcern.reviewNotes && (
                    <Typography sx={{ color: "#4a5568", mt: 1 }}>
                      Notes: {selectedConcern.reviewNotes}
                    </Typography>
                  )}
                </Paper>
              )}
            </Box>
          )}
        </DialogContent>

        <DialogActions
          sx={{
            padding: "24px 32px",
            backgroundColor: "#f8f9fa",
            borderTop: "4px solid #ffd700"
          }}
        >
          <Button
            onClick={() => setViewDialogOpen(false)}
            sx={{
              color: "#4a5568",
              textTransform: "none",
              fontWeight: "500",
              "&:hover": { backgroundColor: "#e2e8f0" }
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Review Concern/Permit Dialog (NOW DYNAMIC) */}
      <Dialog
        open={reviewDialogOpen}
        onClose={() => setReviewDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: "#ffffff",
            borderRadius: "16px",
            boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
          },
        }}
      >
        {/* Header */}
        <Box
          sx={{
            background: "linear-gradient(135deg,#000000 0%,#1a1a1a 100%)",
            padding: "32px",
            borderBottom: "4px solid #ffd700",
            position: "relative",
          }}
        >
          <IconButton
            onClick={() => setReviewDialogOpen(false)}
            sx={{
              position: "absolute",
              right: 16,
              top: 16,
              color: "#ffd700",
              backgroundColor: "rgba(255,255,255,0.03)",
              "&:hover": { backgroundColor: "rgba(255,215,0,0.12)" },
            }}
          >
            <CloseIcon />
          </IconButton>
          <Typography sx={{ color: "#ffd700", fontSize: "26px", fontWeight: "700" }}>
            {/* DYNAMIC TITLE */}
            {activeTab === 0 ? "Review Concern" : "Review Gadget Permit"}
          </Typography>
          <Typography sx={{ color: "#ffffffcc", fontSize: "15px" }}>
            {/* DYNAMIC SUBTITLE */}
            {activeTab === 0
              ? "Update the status or add notes for this concern"
              : "Update the status or add notes for this permit"}
          </Typography>
        </Box>

        {/* Content */}
        <DialogContent sx={{ padding: "32px" }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {/* Student Info */}
            {selectedConcern && (
              <Paper
                elevation={0}
                sx={{
                  backgroundColor: "#f8f9fa",
                  borderRadius: "12px",
                  padding: "24px",
                  border: "1px solid #e9ecef",
                }}
              >
                <Typography sx={{ color: "#2d3748", fontWeight: "600" }}>
                  Student: {selectedConcern.studentName} ({selectedConcern.studentId})
                </Typography>
              </Paper>
            )}

            {/* Status */}
            <Paper
              elevation={0}
              sx={{
                backgroundColor: "#f8f9fa",
                borderRadius: "12px",
                padding: "24px",
                border: "1px solid #e9ecef",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <CategoryIcon sx={{ color: "#ffd700", mr: 1 }} />
                <Typography sx={{ fontSize: "16px", fontWeight: "600", color: "#2d3748" }}>
                  Status
                </Typography>
              </Box>
              <FormControl fullWidth>
                <Select
                  // THIS IS THE FIX: Reverted to the logic from your original working file
                  value={reviewData.status}
                  onChange={(e) => setReviewData({ ...reviewData, status: e.target.value })}
                  displayEmpty
                  sx={{
                    backgroundColor: "white",
                    borderRadius: "8px",
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#e2e8f0",
                      borderWidth: "2px",
                    },
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#ffd700",
                    },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#ffd700",
                    },
                    "& .MuiSelect-select": {
                      padding: "14px 16px",
                      fontSize: "15px",
                      // THIS IS THE FIX: Reverted to the logic from your original working file
                      color: reviewData.status ? "#2d3748" : "#a0aec0",
                    },
                  }}
                >
                  <MenuItem value="" disabled>
                    <em style={{ color: "#a0aec0", fontStyle: "normal" }}>Select a status</em>
                  </MenuItem>
                  
                  {/* DYNAMIC MENU ITEMS */}
                  {activeTab === 0 ? (
                    [ // Must be in an array for React
                      <MenuItem key="pending" value="Pending">Pending</MenuItem>,
                      <MenuItem key="reviewed" value="Reviewed">Reviewed</MenuItem>,
                      <MenuItem key="resolved" value="Resolved">Resolved</MenuItem>
                    ]
                  ) : (
                    [ // Must be in an array for React
                      <MenuItem key="pending" value="Pending">Pending</MenuItem>,
                      <MenuItem key="reviewed" value="Reviewed">Reviewed</MenuItem>,
                      <MenuItem key="approved" value="Approved">Approved</MenuItem>,
                      <MenuItem key="denied" value="Denied">Denied</MenuItem>,
                      <MenuItem key="no-permit" value="No Permit Submitted">No Permit Submitted</MenuItem>
                    ]
                  )}
                </Select>
              </FormControl>
            </Paper>

            {/* Review Notes */}
            <Paper
              elevation={0}
              sx={{
                backgroundColor: "#f8f9fa",
                borderRadius: "12px",
                padding: "24px",
                border: "1px solid #e9ecef",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <DescriptionIcon sx={{ color: "#ffd700", mr: 1 }} />
                <Typography sx={{ fontSize: "16px", fontWeight: "600", color: "#2d3748" }}>
                  Review Notes
                </Typography>
              </Box>
              <TextField
                value={reviewData.reviewNotes}
                onChange={(e) => setReviewData({ ...reviewData, reviewNotes: e.target.value })}
                multiline
                rows={4}
                fullWidth
                placeholder="Add your review notes here..."
                sx={{
                  "& .MuiOutlinedInput-root": {
                    backgroundColor: "white",
                    borderRadius: "8px",
                    "& fieldset": {
                      borderColor: "#e2e8f0",
                      borderWidth: "2px",
                    },
                    "&:hover fieldset": { borderColor: "#ffd700" },
                    "&.Mui-focused fieldset": { borderColor: "#ffd700" },
                  },
                  "& textarea": {
                    padding: "14px 16px",
                    fontSize: "15px",
                    lineHeight: "1.6",
                    color: "#2d3748",
                    "&::placeholder": {
                      color: "#a0aec0",
                      opacity: 1,
                    },
                  },
                }}
              />
            </Paper>
          </Box>
        </DialogContent>

        {/* Footer */}
        <DialogActions
          sx={{
            padding: "24px 32px",
            backgroundColor: "#f8f9fa",
            borderTop: "4px solid #ffd700",
          }}
        >
          <Button
            onClick={() => setReviewDialogOpen(false)}
            sx={{
              color: "#4a5568",
              textTransform: "none",
              fontWeight: "500",
              "&:hover": { backgroundColor: "#e2e8f0" },
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleReviewSubmit}
            variant="contained"
            disabled={loading}
            sx={{
              background: "#ffd700",
              color: "#000",
              textTransform: "none",
              fontWeight: "600",
              padding: "10px 32px",
              borderRadius: "8px",
              boxShadow: "0 4px 14px rgba(255,215,0,0.25)",
              "&:hover": { backgroundColor: "#e6c200" },
              "&.Mui-disabled": { background: "#cbd5e0", boxShadow: "none" },
            }}
          >
            {/* DYNAMIC BUTTON TEXT */}
            {loading ? "Updating..." : (activeTab === 0 ? "Update Concern" : "Update Permit")}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog (Concerns Only) */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setConfirmText("");
        }}
        PaperProps={{
          sx: {
            backgroundColor: "#ffffff",
            borderRadius: "16px",
            boxShadow: "0 20px 60px rgba(0,0,0,0.15)"
          }
        }}
      >
        <Box
          sx={{
            background: "linear-gradient(135deg,#000000 0%,#1a1a1a 100%)",
            padding: "32px",
            borderBottom: "4px solid #ffd700",
            position: "relative"
          }}
        >
          <IconButton
            onClick={() => setDeleteDialogOpen(false)}
            sx={{
              position: "absolute",
              right: 16,
              top: 16,
              color: "#ffd700",
              backgroundColor: "rgba(255,255,255,0.03)",
              "&:hover": { backgroundColor: "rgba(255,215,0,0.12)" }
            }}
          >
            <CloseIcon />
          </IconButton>
          <Typography
            sx={{ color: "#ffd700", fontSize: "26px", fontWeight: "700" }}
          >
            Confirm Delete Concern
          </Typography>
          <Typography sx={{ color: "#ffffffcc", fontSize: "15px" }}>
            Please type “confirm” to proceed with deletion
          </Typography>
        </Box>

        <DialogContent sx={{ padding: "32px" }}>
          <Typography sx={{ color: "#2d3748", mb: 2 }}>
            Are you sure you want to delete this concern from{" "}
            <strong>{selectedConcern?.studentName}</strong>?
          </Typography>
          <TextField
            fullWidth
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="Type 'confirm'"
            sx={{
              "& .MuiOutlinedInput-root": {
                backgroundColor: "white",
                borderRadius: "8px",
                "& fieldset": {
                  borderColor: "#e2e8f0",
                  borderWidth: "2px"
                },
                "&:hover fieldset": { borderColor: "#ffd700" },
                "&.Mui-focused fieldset": { borderColor: "#ffd700" }
              }
            }}
          />
        </DialogContent>

        <DialogActions
          sx={{
            padding: "24px 32px",
            backgroundColor: "#f8f9fa",
            borderTop: "4px solid #ffd700"
          }}
        >
          <Button
            onClick={() => {
              setDeleteDialogOpen(false);
              setConfirmText("");
            }}
            sx={{
              color: "#4a5568",
              textTransform: "none",
              fontWeight: "500",
              "&:hover": { backgroundColor: "#e2e8f0" }
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            variant="contained"
            disabled={confirmText.toLowerCase() !== "confirm" || loading}
            sx={{
              background: "#ffd700",
              color: "#000",
              textTransform: "none",
              fontWeight: "600",
              padding: "10px 32px",
              borderRadius: "8px",
              boxShadow: "0 4px 14px rgba(255,215,0,0.25)",
              "&:hover": { backgroundColor: "#e6c200" },
              "&.Mui-disabled": {
                background: "#cbd5e0",
                boxShadow: "none"
              }
            }}
          >
            {loading ? "Deleting..." : "Delete Concern"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity={snackbarSeverity}
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default StudentConcernsManagement;
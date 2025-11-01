// index.jsx – StudentConcernsManagement (Gold & Black Restyle, Part 1)
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

  const [reviewData, setReviewData] = useState({
    status: "",
    reviewNotes: ""
  });

  const user = JSON.parse(sessionStorage.getItem("user"));

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
      showSnackbar("Error fetching concerns", "error");
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message, severity = "success") => {
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
      reviewNotes: concern.reviewNotes || ""
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
      await updateStudentConcern(selectedConcern.id, {
        ...reviewData,
        reviewedBy: user.username,
        reviewDate: new Date().toISOString().split("T")[0]
      });

      showSnackbar("Concern updated successfully!");
      setReviewDialogOpen(false);
      fetchConcerns();
    } catch (error) {
      console.error("Error updating concern:", error);
      showSnackbar("Error updating concern", "error");
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
            onClick={() => handleViewConcern(params.row)}
            size="small"
            sx={{
              color: "#000",
              
            }}
            title="View Details"
          >
            <VisibilityIcon />
          </IconButton>
          <IconButton
            onClick={() => handleReviewConcern(params.row)}
            size="small"
            sx={{
              color: "#000",
            
            }}
            title="Review/Update"
          >
            <EditIcon />
          </IconButton>
          <IconButton
            onClick={() => handleDeleteClick(params.row)}
            size="small"
            sx={{
              color: "#000",
              
            }}
            title="Delete"
          >
            <DeleteIcon />
          </IconButton>
        </Box>
      )
    }
  ];

  return (
    <Box m="20px">
      <Header
        title="Student Concerns Management"
        subtitle="Review and manage student-submitted concerns"
      />

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
        sortModel: [{ field: "dateSubmitted", sort: "desc" }],
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
            Concern Details
          </Typography>
          <Typography sx={{ color: "#ffffffcc", fontSize: "15px" }}>
            Review all information submitted by the student
          </Typography>
        </Box>

        <DialogContent sx={{ padding: "32px" }}>
          {selectedConcern && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
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

{/* Review Concern Dialog */}
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
      Review Concern
    </Typography>
    <Typography sx={{ color: "#ffffffcc", fontSize: "15px" }}>
      Update the status or add notes for this concern
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

      {/* Concern Status */}
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
            Concern Status
          </Typography>
        </Box>
        <FormControl fullWidth>
          <Select
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
                color: reviewData.status ? "#2d3748" : "#a0aec0",
              },
            }}
          >
            <MenuItem value="" disabled>
              <em style={{ color: "#a0aec0" }}>Select a status</em>
            </MenuItem>
            <MenuItem value="Pending">Pending</MenuItem>
            <MenuItem value="Reviewed">Reviewed</MenuItem>
            <MenuItem value="Resolved">Resolved</MenuItem>
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
      {loading ? "Updating..." : "Update Concern"}
    </Button>
  </DialogActions>
</Dialog>

      {/* Delete Confirmation Dialog */}
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

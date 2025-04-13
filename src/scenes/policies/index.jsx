import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  useTheme,
  Button,
  Modal,
  TextField,
  Snackbar,
  Alert,
  IconButton,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import CloseIcon from "@mui/icons-material/Close";
import { tokens } from "../../theme";
import Header from "../../components/Header";
import {
  getManagements,
  addManagement,
  updateManagement,
  deleteManagement,
} from "../../services/managementService.ts";

const AuditLogs = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  const [managements, setManagements] = useState([]);
  const [currentManagement, setCurrentManagement] = useState(null);
  const [selectedRows, setSelectedRows] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);

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
    setCurrentManagement({ ...currentManagement, [name]: value });
  };

  const handleSave = async () => {
    try {
      if (currentManagement?.id) {
        await updateManagement(currentManagement.id, currentManagement);
      } else {
        await addManagement(currentManagement);
      }
      fetchManagements();
      handleCloseModal();
    } catch (err) {
      console.error("Save failed:", err);
    }
  };

  const handleDeleteSelectedRows = async () => {
    try {
      for (let id of selectedRows) {
        await deleteManagement(id);
      }
      fetchManagements();
      setSnackbarOpen(true);
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  const handleCloseSnackbar = (_, reason) => {
    if (reason === "clickaway") return;
    setSnackbarOpen(false);
  };

  const managementColumns = [
    { field: "id", headerName: "ID", width: 90 },
    { field: "dress_code", headerName: "Dress Code", flex: 1 },
    { field: "status", headerName: "Status", flex: 1 },
    { field: "start_date", headerName: "Start Date", flex: 1 },
    { field: "end_date", headerName: "End Date", flex: 1 },
    {
      field: "actions",
      headerName: "Actions",
      flex: 1,
      renderCell: (params) => (
        <Button onClick={() => handleOpenModal(params.row)} color="secondary">
          Edit
        </Button>
      ),
    },
  ];

  return (
    <Box m="20px">
      <Header title="Audit Logs" subtitle="Dress Code Management" />

      <Typography variant="h5" color={colors.grey[100]} mt={3}>
        Dress Code Managements
      </Typography>

      <Button
        onClick={() => handleOpenModal()}
        sx={{ mt: 2, mb: 2 }}
        variant="contained"
        color="success"
      >
        Add Management
      </Button>

      <Button
        onClick={handleDeleteSelectedRows}
        disabled={selectedRows.length === 0}
        sx={{ ml: 2 }}
        variant="contained"
        color="error"
      >
        Delete Selected
      </Button>

      <Box height="70vh">
        <DataGrid
          checkboxSelection
          rows={managements}
          columns={managementColumns}
          onSelectionModelChange={(ids) => setSelectedRows(ids)}
          sx={dataGridStyles(colors)}
        />
      </Box>

      {/* Modal */}
      <Modal open={isModalOpen} onClose={handleCloseModal}>
        <Box sx={{ ...modalStyle, backgroundColor: colors.primary[500], color: colors.grey[500] }}>
        <Typography variant="h6" mb={2}>
  {currentManagement?.id ? "Edit Management" : "Add Management"}
</Typography>

<TextField
  name="dress_code"
  placeholder="Dress Code"
  label="Dress Code"
  variant="outlined"
  value={currentManagement?.dress_code || ""}
  fullWidth
  onChange={handleChange}
  margin="normal"
  InputLabelProps={{ style: { color: colors.grey[100] } }}
  InputProps={{
    style: {
      color: colors.grey[100],
    },
  }}
/>

<TextField
  name="status"
  placeholder="Status"
  label="Status"
  variant="outlined"
  value={currentManagement?.status || ""}
  fullWidth
  onChange={handleChange}
  margin="normal"
  InputLabelProps={{ style: { color: colors.grey[100] } }}
  InputProps={{
    style: {
      color: colors.grey[100],
    },
  }}
/>

<TextField
  name="start_date"
  placeholder="Start Date (YYYY-MM-DD)"
  label="Start Date (YYYY-MM-DD)"
  variant="outlined"
  value={currentManagement?.start_date || ""}
  fullWidth
  onChange={handleChange}
  margin="normal"
  InputLabelProps={{ style: { color: colors.grey[100] } }}
  InputProps={{
    style: {
      color: colors.grey[100],
    },
  }}
/>

<TextField
  name="end_date"
  placeholder="End Date (YYYY-MM-DD)"
  label="End Date (YYYY-MM-DD)"
  variant="outlined"
  value={currentManagement?.end_date || ""}
  fullWidth
  onChange={handleChange}
  margin="normal"
  InputLabelProps={{ style: { color: 'white' } }}
  InputProps={{
    style: {
      color: colors.grey[100],
    },
  }}
/>
          <Box mt={2}>
            <Button onClick={handleSave} variant="contained" color="primary" sx={{ mr: 2 }}>
              Save
            </Button>
            <Button onClick={handleCloseModal} variant="outlined" color="secondary">
              Cancel
            </Button>
          </Box>
        </Box>
      </Modal>

      {/* Snackbar */}
      <Snackbar
        open={snackbarOpen}
        onClose={handleCloseSnackbar}
        autoHideDuration={3000}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity="success"
          sx={{ width: "100%" }}
        >
          Selected rows deleted
        </Alert>
      </Snackbar>
    </Box>
  );
};

const modalStyle = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  border: "2px solid #000",
  boxShadow: 24,
  p: 4,
  minWidth: 400,
};

const dataGridStyles = (colors) => ({
  "& .MuiDataGrid-root": { border: "none" },
  "& .MuiDataGrid-cell": { borderBottom: "none" },
  "& .MuiDataGrid-columnHeaders": {
    backgroundColor: colors.blueAccent[700],
    borderBottom: "none",
  },
  "& .MuiDataGrid-virtualScroller": {
    backgroundColor: colors.primary[400],
  },
  "& .MuiDataGrid-footerContainer": {
    borderTop: "none",
    backgroundColor: colors.blueAccent[700],
  },
  "& .MuiCheckbox-root": {
    color: `${colors.greenAccent[200]} !important`,
  },
});

export default AuditLogs;

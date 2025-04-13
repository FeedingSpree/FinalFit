import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  useTheme,
  Button,
  Modal,
  TextField,
  Snackbar,
  Alert,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { tokens } from "../../theme";
import Header from "../../components/Header";

// Firebase service functions
import {
  getViolationLogs,
  addViolationLog,
  updateViolationLog,
  deleteViolationLog
} from "../../services/violationLogsService.ts";

const AuditLogs = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [logs, setLogs] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentLog, setCurrentLog] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [selectedRows, setSelectedRows] = useState([]);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    const data = await getViolationLogs();
    setLogs(data);
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
    if (currentLog.id) {
      await updateViolationLog(currentLog.id, currentLog);
    } else {
      await addViolationLog(currentLog);
    }
    await fetchLogs();
    handleCloseModal();
  };

  const handleDeleteSelectedRows = async () => {
    for (const id of selectedRows) {
      await deleteViolationLog(id);
    }
    await fetchLogs();
    setSnackbarOpen(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCurrentLog({ ...currentLog, [name]: value });
  };

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') return;
    setSnackbarOpen(false);
  };

  const columns = [
    { field: "id", headerName: "LOGID" },
    { field: "violation", headerName: "VIOLATION", flex: 1, cellClassName: "violation-column--cell" },
    { field: "building_number", headerName: "BUILDING NUMBER", flex: 1 },
    { field: "floor_number", headerName: "FLOOR NUMBER", flex: 1 },
    {
      field: "timestamp",
      headerName: "DATE & TIME",
      flex: 1,
      valueFormatter: ({ value }) => {
        if (!value) return '';
        const date = value instanceof Date ? value : new Date(value);
        return date.toLocaleString('en-PH', {
          timeZone: 'Asia/Manila',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          second: '2-digit',
          hour12: true
        });
      }
    },
  ];

  return (
    <Box m="20px">
      <Header title="Audit Logs" subtitle="List of Violators" />

      <Box
        m="40px 0 0 0"
        height="75vh"
        sx={{
          "& .MuiDataGrid-root": { border: "none" },
          "& .MuiDataGrid-cell": { borderBottom: "none" },
          "& .violation-column--cell": { color: colors.greenAccent[300] },
          "& .MuiDataGrid-columnHeaders": { backgroundColor: colors.blueAccent[700], borderBottom: "none" },
          "& .MuiDataGrid-virtualScroller": { backgroundColor: colors.primary[400] },
          "& .MuiDataGrid-footerContainer": { borderTop: "none", backgroundColor: colors.blueAccent[700] },
          "& .MuiCheckbox-root": { color: `${colors.greenAccent[200]} !important` },
        }}
      >
        <DataGrid
          checkboxSelection
          rows={logs}
          columns={columns}
          onSelectionModelChange={(ids) => setSelectedRows(ids)}
          onRowDoubleClick={(params) => handleOpenModal(params.row)}
        />
      </Box>

      <Modal
        open={isModalOpen}
        onClose={handleCloseModal}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={{ ...modalStyle, backgroundColor: colors.primary[500], color: colors.grey[100] }}>
          <Typography id="modal-modal-title" variant="h6" component="h2">
            {currentLog?.id ? 'Edit Log' : 'Add Log'}
          </Typography>

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
            label="Timestamp"
            fullWidth
            margin="normal"
            name="timestamp"
            type="datetime-local"
            value={
              currentLog?.timestamp
                ? new Date(currentLog.timestamp).toISOString().slice(0, 16)
                : ''
            }
            onChange={(e) => {
              const isoDate = new Date(e.target.value).toISOString();
              setCurrentLog({ ...currentLog, timestamp: isoDate });
            }}
            sx={textFieldStyle(colors)}
          />

          <Box mt={2}>
            <Button variant="contained" color="primary" onClick={handleSaveLog}>Save</Button>
            <Button variant="outlined" color="secondary" onClick={handleCloseModal}>Cancel</Button>
          </Box>
        </Box>
      </Modal>

      <Snackbar open={snackbarOpen} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: '100%' }}>
          Logs deleted
        </Alert>
      </Snackbar>
    </Box>
  );
};

const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
  minWidth: 400
};

const textFieldStyle = (colors) => ({
  input: { color: colors.grey[100] },
  label: { color: colors.grey[100] }
});

export default AuditLogs;

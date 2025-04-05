import React, { useState } from 'react';
import { Box, Typography, useTheme, Button, Modal, TextField, Snackbar, Alert, IconButton } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { tokens } from "../../theme";
import { mockAuditLogs } from "../../data/mockData";
import Header from "../../components/Header";
import CloseIcon from '@mui/icons-material/Close';

const AuditLogs = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [logs, setLogs] = useState(mockAuditLogs);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentLog, setCurrentLog] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [deletedLogs, setDeletedLogs] = useState([]);
  const [selectedRows, setSelectedRows] = useState([]);

  const handleOpenModal = (log = null) => {
    setCurrentLog(log);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentLog(null);
  };

  const handleSaveLog = () => {
    if (currentLog.id) {
      setLogs(logs.map(log => log.id === currentLog.id ? currentLog : log));
    } else {
      setLogs([...logs, { ...currentLog, id: logs.length + 1 }]);
    }
    handleCloseModal();
  };

  const handleDeleteSelectedRows = () => {
    const logsToDelete = logs.filter(log => selectedRows.includes(log.id));
    setDeletedLogs(logsToDelete);
    setLogs(logs.filter(log => !selectedRows.includes(log.id)));
    setSnackbarOpen(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCurrentLog({ ...currentLog, [name]: value });
  };

  const handleUndoDelete = () => {
    setLogs([...logs, ...deletedLogs]);
    setDeletedLogs([]);
    setSnackbarOpen(false);
  };

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  };

  const columns = [
    { field: "id", headerName: "LOGID" },
    {
      field: "violation",
      headerName: "VIOLATION",
      flex: 1,
      cellClassName: "violation-column--cell",
    },
    {
      field: "buildingNumber",
      headerName: "BUILDING NUMBER",
      flex: 1,
    },
    {
      field: "floorNumber",
      headerName: "FLOOR NUMBER",
      flex: 1,
    },
    {
      field: "date",
      headerName: "DATE",
      flex: 1,
    },
    {
      field: "complianceStatus",
      headerName: "COMPLIANCE STATUS",
      flex: 1,
    },
    {
      field: "time",
      headerName: "TIME",
      flex: 1,
    },
    {
      field: "actions",
      headerName: "Actions",
      flex: 1,
      renderCell: (params) => (
        <Box>
          <Button
            variant="contained"
            color="primary"
            onClick={(e) => {
              e.stopPropagation(); // Prevents the row from being selected
              handleOpenModal(params.row);
            }}
            sx={{ mr: 1 }}
          >
            Edit
          </Button>
        </Box>
      ),
    },
  ];

  return (
    <Box m="20px">
      <Header title="Audit Logs" subtitle="List of Violators" />
      <Button
        variant="contained"
        color="primary"
        onClick={() => handleOpenModal()}
        sx={{ mt: 3, mb: 3, backgroundColor: colors.blueAccent[700], color: colors.grey[100] }}
      >
        Add Audit
      </Button>
      <Button
        variant="contained"
        color="secondary"
        onClick={handleDeleteSelectedRows}
        sx={{ mt: 3, mb: 3, ml: 2 }}
        disabled={selectedRows.length === 0}
      >
        Delete Selected
      </Button>
      <Box
        m="40px 0 0 0"
        height="75vh"
        sx={{
          "& .MuiDataGrid-root": {
            border: "none",
          },
          "& .MuiDataGrid-cell": {
            borderBottom: "none",
          },
          "& .violation-column--cell": {
            color: colors.greenAccent[300],
          },
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
        }}
      >
        <DataGrid
          checkboxSelection
          rows={logs}
          columns={columns}
          onSelectionModelChange={(ids) => setSelectedRows(ids)}
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
            margin="normal"
            label="Violation"
            fullWidth
            name="violation"
            value={currentLog?.violation || ''}
            onChange={handleChange}
            sx={{ input: { color: colors.grey[100] }, label: { color: colors.grey[100] } }}
          />
          <TextField
            margin="normal"
            label="Building Number"
            fullWidth
            name="buildingNumber"
            value={currentLog?.buildingNumber || ''}
            onChange={handleChange}
            sx={{ input: { color: colors.grey[100] }, label: { color: colors.grey[100] } }}
          />
          <TextField
            margin="normal"
            label="Floor Number"
            fullWidth
            name="floorNumber"
            value={currentLog?.floorNumber || ''}
            onChange={handleChange}
            sx={{ input: { color: colors.grey[100] }, label: { color: colors.grey[100] } }}
          />
          <TextField
            margin="normal"
            label="Date"
            fullWidth
            name="date"
            value={currentLog?.date || ''}
            onChange={handleChange}
            sx={{ input: { color: colors.grey[100] }, label: { color: colors.grey[100] } }}
          />
          <TextField
            margin="normal"
            label="Compliance Status"
            fullWidth
            name="complianceStatus"
            value={currentLog?.complianceStatus || ''}
            onChange={handleChange}
            sx={{ input: { color: colors.grey[100] }, label: { color: colors.grey[100] } }}
          />
          <TextField
            margin="normal"
            label="Time"
            fullWidth
            name="time"
            value={currentLog?.time || ''}
            onChange={handleChange}
            sx={{ input: { color: colors.grey[100] }, label: { color: colors.grey[100] } }}
          />
          <Box mt={2}>
            <Button variant="contained" color="primary" onClick={handleSaveLog}>
              Save
            </Button>
            <Button variant="outlined" color="secondary" onClick={handleCloseModal}>
              Cancel
            </Button>
          </Box>
        </Box>
      </Modal>
      <Snackbar
        open={snackbarOpen}
        onClose={handleCloseSnackbar}
        message="Logs deleted"
        action={
          <>
            <Button color="inherit" size="small" onClick={handleUndoDelete}>
              UNDO
            </Button>
            <IconButton
              size="small"
              aria-label="close"
              color="inherit"
              onClick={handleCloseSnackbar}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </>
        }
      >
        <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: '100%' }}>
          Logs deleted
          <Button color="inherit" size="small" onClick={handleUndoDelete}>
            UNDO
          </Button>
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
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
};

export default AuditLogs;
import React, { useState, useEffect } from 'react';
import {
  Box,
  useTheme,
  Button,
  Modal,
  TextField,
  Alert,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { 
  GridToolbarContainer,
  GridToolbarFilterButton,
  GridToolbarDensitySelector,
  GridToolbarExport
} from '@mui/x-data-grid';
import { tokens } from "../../theme";
import Header from "../../components/Header";

// Import user logs service
import {
  getUserLogs,
  addUserLog,
  updateUserLog,
  deleteUserLog
} from "../../services/userLogsService.ts";

const CustomToolbar = () => {
  return (
    <GridToolbarContainer>
      <GridToolbarFilterButton />
      <GridToolbarDensitySelector />
      <GridToolbarExport />
    </GridToolbarContainer>
  );
};

const UserLogs = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [logs, setLogs] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentLog, setCurrentLog] = useState(null);
  const [selectedRows, setSelectedRows] = useState([]);
  const [filterModel, setFilterModel] = useState({
    items: [],
    quickFilterValues: [],
  });
  const [sortModel, setSortModel] = useState([
    {
      field: 'timestamp',
      sort: 'desc',
    },
  ]);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    const data = await getUserLogs();
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
    const now = new Date();
    const formattedLog = {
      ...currentLog,
      log_id: currentLog.log_id || `LOG-${Date.now()}`,
      date: now.toISOString().split('T')[0], // Format: YYYY-MM-DD
      time: now.toTimeString().split(' ')[0], // Format: HH:MM:SS
    };

    if (currentLog.id) {
      await updateUserLog(currentLog.id, formattedLog);
    } else {
      await addUserLog(formattedLog);
    }
    await fetchLogs();
    handleCloseModal();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCurrentLog({ ...currentLog, [name]: value });
  };

  const columns = [
    { 
      field: "log_id", 
      headerName: "Log ID",
      flex: 0.7,
    },
    { 
      field: "username", 
      headerName: "Username", 
      flex: 1,
      cellClassName: "name-column--cell"
    },
    { 
      field: "action", 
      headerName: "Action", 
      flex: 1, 
      cellClassName: "action-column--cell" 
    },
    {
      field: "date",
      headerName: "Date",
      flex: 1,
      valueFormatter: ({ value }) => {
        if (!value) return '';
        // Split the yyyy-mm-dd format
        const [year, month, day] = value.split('-');
        // Create date string in desired format
        const months = [
          'January', 'February', 'March', 'April', 'May', 'June',
          'July', 'August', 'September', 'October', 'November', 'December'
        ];
        return `${months[parseInt(month) - 1]} ${parseInt(day)}, ${year}`;
      }
    },
    {
      field: "time",
      headerName: "Time",
      flex: 1,
      valueFormatter: ({ value }) => {
        if (!value) return '';
        // Convert 24-hour format to 12-hour format
        const [hours, minutes, seconds] = value.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const hour12 = hour % 12 || 12;
        return `${hour12}:${minutes}:${seconds} ${ampm}`;
      }
    }
  ];

  return (
    <Box m="20px">
      <Header title="User Logs" subtitle="Logging and Monitoring of User Activities" />
      <Box m="0px 0 0 0" height="85vh">
        <DataGrid
          checkboxSelection
          rows={logs}
          columns={columns}
          components={{
            Toolbar: CustomToolbar
          }}
          sortModel={sortModel}
          onSortModelChange={(newModel) => setSortModel(newModel)}
          filterModel={filterModel}
          onFilterModelChange={(newModel) => setFilterModel(newModel)}
          onSelectionModelChange={(ids) => setSelectedRows(ids)}
          onRowDoubleClick={(params) => handleOpenModal(params.row)}
          initialState={{
            sorting: {
              sortModel: [{ field: 'timestamp', sort: 'desc' }],
            },
          }}
          sx={dataGridStyles(colors)}
        />
      </Box>

      <Modal
        open={isModalOpen}
        onClose={handleCloseModal}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 400,
          bgcolor: colors.primary[400],
          border: '2px solid #000',
          boxShadow: 24,
          p: 4,
        }}>
          <TextField
            label="Username"
            fullWidth
            margin="normal"
            name="username"
            value={currentLog?.username || ''}
            onChange={handleChange}
            sx={textFieldStyle(colors)}
          />

          <TextField
            label="Action"
            fullWidth
            margin="normal"
            name="action"
            value={currentLog?.action || ''}
            onChange={handleChange}
            sx={textFieldStyle(colors)}
          />

          <TextField
            label="User ID"
            fullWidth
            margin="normal"
            name="user_id"
            value={currentLog?.user_id || ''}
            onChange={handleChange}
            sx={textFieldStyle(colors)}
          />

          <Box mt={2} display="flex" justifyContent="space-between">
            <Button 
              variant="contained" 
              onClick={handleSaveLog}
              sx={{
                backgroundColor: colors.greenAccent[600],
                "&:hover": { backgroundColor: colors.greenAccent[700] }
              }}
            >
              Save
            </Button>
            <Button 
              variant="contained" 
              onClick={handleCloseModal}
              sx={{
                backgroundColor: colors.grey[500],
                "&:hover": { backgroundColor: colors.grey[700] }
              }}
            >
              Cancel
            </Button>
          </Box>
        </Box>
      </Modal>
    </Box>
  );
};

const textFieldStyle = (colors) => ({
  input: { color: colors.grey[100] },
  label: { color: colors.grey[100] },
  '& .MuiOutlinedInput-root': {
    '& fieldset': {
      borderColor: colors.grey[400],
    },
    '&:hover fieldset': {
      borderColor: colors.grey[300],
    },
    '&.Mui-focused fieldset': {
      borderColor: colors.grey[200],
    },
  }
});

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
    padding: 2,
    "& .MuiButton-root": {
      color: colors.grey[100],
      fontSize: "14px",
    },
  },
  "& .MuiDataGrid-row": {
    "&:hover": {
      backgroundColor: colors.grey[800],
    },
  },
  "& .MuiTablePagination-root": {
    color: colors.grey[900],
    fontSize: "15px",
  }
});

export default UserLogs;
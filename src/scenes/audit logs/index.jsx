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

// Firebase service functions
import {
  getViolationLogs,
  addViolationLog,
  updateViolationLog,
  deleteViolationLog
} from "../../services/violationLogsService.ts";

const CustomToolbar = ({ searchText, onSearchChange }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  
  return (
    <GridToolbarContainer sx={{ padding: "8px" }}>
      <Box
        sx={{
          p: 0.5,
          pb: 0,
          display: "flex",
          alignItems: "center",
          width: "100%",
        }}
      >
        <TextField
          variant="outlined"
          size="small"
          placeholder="Search..."
          value={searchText}
          onChange={(e) => onSearchChange(e.target.value)}
          sx={{
            width: "300px",
            marginRight: "16px",
            "& .MuiOutlinedInput-root": {
              backgroundColor: colors.primary[400],
              color: colors.grey[100],
              "& fieldset": {
                borderColor: colors.grey[400],
              },
              "&:hover fieldset": {
                borderColor: colors.grey[300],
              },
            },
            "& .MuiOutlinedInput-input": {
              color: colors.grey[100],
            },
          }}
        />
        <GridToolbarFilterButton />
        <GridToolbarDensitySelector />
        <GridToolbarExport />
      </Box>
    </GridToolbarContainer>
  );
};

const AuditLogs = () => {
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
      field: 'date',
      sort: 'desc',
    },
  ]);
  const [searchText, setSearchText] = useState("");

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
    const formattedLog = {
      ...currentLog,
      violation_id: currentLog.violation_id || `VIO-${Date.now()}`,
      // Keep the date in yyyy-mm-dd format
      date: currentLog.date,
      // Keep the time in HH:mm:ss format
      time: currentLog.time
    };

    if (currentLog.id) {
      await updateViolationLog(currentLog.id, formattedLog);
    } else {
      await addViolationLog(formattedLog);
    }
    await fetchLogs();
    handleCloseModal();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCurrentLog({ ...currentLog, [name]: value });
  };

  const handleSearch = (searchValue) => {
    setSearchText(searchValue);
    setFilterModel({
      ...filterModel,
      quickFilterValues: searchValue ? [searchValue] : [],
    });
  };

  const columns = [
    { 
      field: "violation_id", 
      headerName: "Violation ID",
      flex: 0.7,
    },
    { 
      field: "violation", 
      headerName: "Violation", 
      flex: 1, 
      cellClassName: "violation-column--cell", 
      valueFormatter: ({ value }) => {
        // Capitalize first letter of the violation value
        return value ? value.charAt(0).toUpperCase() + value.slice(1) : '';
      }
    },
    { 
      field: "building_number", 
      headerName: "Building Number", 
      flex: 1 
    },
    { 
      field: "floor_number", 
      headerName: "Floor Number", 
      flex: 1 
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
    },
  ];

  return (
    <Box m="20px">
      <Header title="Detection Logs"/>
      <Box m="0px 0 0 0" height="88vh">
        <DataGrid
          checkboxSelection
          rows={logs}
          columns={columns}
          components={{
            Toolbar: CustomToolbar
          }}
          componentsProps={{
            toolbar: {
              searchText,
              onSearchChange: handleSearch,
            }
          }}
          sortModel={sortModel}
          onSortModelChange={(newModel) => setSortModel(newModel)}
          filterModel={filterModel}
          onFilterModelChange={(newModel) => setFilterModel(newModel)}
          onSelectionModelChange={(ids) => setSelectedRows(ids)}
          onRowDoubleClick={(params) => handleOpenModal(params.row)}
          initialState={{
            sorting: {
              sortModel: [{ field: 'date', sort: 'desc' }],
            },
          }}
          sx={{
            ...dataGridStyles(colors),
            border: "none",
            paddingTop: "5px",
          }}
        />
      </Box>

      <Modal
        open={isModalOpen}
        onClose={handleCloseModal}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box>
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
            label="Date"
            fullWidth
            margin="normal"
            name="date"
            type="date"
            value={
              currentLog?.date
                ? new Date(currentLog.date).toISOString().split('T')[0]
                : ''
            }
            onChange={(e) => {
              const date = new Date(e.target.value);
              setCurrentLog({ ...currentLog, date: date.toISOString() });
            }}
            sx={textFieldStyle(colors)}
            InputLabelProps={{ shrink: true }}
          />

          <TextField
            label="Time"
            fullWidth
            margin="normal"
            name="time"
            type="time"
            value={
              currentLog?.time
                ? new Date(currentLog.time).toISOString().split('T')[1].substring(0, 5)
                : ''
            }
            onChange={(e) => {
              const [hours, minutes] = e.target.value.split(':');
              const time = new Date();
              time.setHours(hours);
              time.setMinutes(minutes);
              setCurrentLog({ ...currentLog, time: time.toISOString() });
            }}
            sx={textFieldStyle(colors)}
            InputLabelProps={{ shrink: true }}
          />

          <Box mt={2}>
            <Button variant="contained" color="primary" onClick={handleSaveLog}>Save</Button>
            <Button variant="outlined" color="secondary" onClick={handleCloseModal}>Cancel</Button>
          </Box>
        </Box>
      </Modal>
    </Box>
  );
};

const textFieldStyle = (colors) => ({
  input: { color: colors.grey[100] },
  label: { color: colors.grey[100] }
});

const dataGridStyles = (colors) => ({
  "& .MuiDataGrid-root": {
    border: "none",
    fontSize: "16px",
    borderRadius: "16px",  // rounded corners
    overflow: "hidden",    // rounded corners
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
    borderTopLeftRadius: "16px",    // rounded corners
    borderTopRightRadius: "16px",   // rounded corners
  },
  "& .MuiDataGrid-virtualScroller": {
    backgroundColor: colors.grey[900],
  },
  "& .MuiDataGrid-footerContainer": {
    borderTop: "none",
    backgroundColor: colors.grey[400],
    color: colors.grey[900],
    borderBottomLeftRadius: "16px",  // rounded corners
    borderBottomRightRadius: "16px", // rounded corners
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
    outline: "  ",
  },
  "& .MuiDataGrid-row": { // hover color
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
});

export default AuditLogs;

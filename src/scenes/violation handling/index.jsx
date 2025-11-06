import React, { useState, useEffect, useCallback } from 'react';
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
  TextField,
  IconButton
} from "@mui/material";
import ReportDialog from "./ReportDialog.jsx";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import { 
  GridToolbarContainer,
  GridToolbarDensitySelector
} from '@mui/x-data-grid';
import { tokens } from "../../theme";
import Header from "../../components/Header";
import AddIcon from '@mui/icons-material/Add';
import { getStudentRecords, addStudentRecord, updateStudentRecord, deleteStudentRecord } from '../../services/studentRecordsService.ts';
import { addUserLog } from '../../services/userLogsService.ts';
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import pdfMake from 'pdfmake/build/pdfmake';
import vfs from 'pdfmake/build/vfs_fonts.js';
import CloseIcon from '@mui/icons-material/Close';

// Initialize pdfMake
pdfMake.vfs = vfs;

const CustomToolbar = ({ value, onChange, dateFilter, onDateChange }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  
  return (
    <GridToolbarContainer>
      <Box
        sx={{
          p: 0.5,
          pb: 0,
          display: "flex",
          alignItems: "center",
          width: "100%",
          gap: 2
        }}
      >
        <TextField
          variant="outlined"
          size="small"
          placeholder="Search..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          sx={{
            width: "300px",
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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography 
            variant="subtitle2" 
            sx={{ 
              color: colors.grey[100],
              fontSize: '0.875rem',
              whiteSpace: 'nowrap'
            }}
          >
            Search by date:
          </Typography>
          <TextField
            type="date"
            size="small"
            value={dateFilter}
            onChange={(e) => onDateChange(e.target.value)}
            sx={{
              width: "200px",
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
                "&::-webkit-calendar-picker-indicator": {
                  cursor: "pointer"
                }
              },
            }}
          />
        </Box>
        <GridToolbarDensitySelector />
      </Box>
    </GridToolbarContainer>
  );
};

const ViolationHandling = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  
  const [records, setRecords] = useState([]);
  const [allRecords, setAllRecords] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [formData, setFormData] = useState({
    violation_id: '', // Add violation_id field
    studentNumber: '', // Add student number field
    name: '',
    program: '',
    yearLevel: '',
    violation: '',
    date: '',
    department: ''
  });
  const [formErrors, setFormErrors] = useState({
    violation_id: '', // Add violation_id error
    studentNumber: '', // Add student number error
    name: '',
    program: '',
    yearLevel: '',
    violation: '',
    date: '',
    department: ''
  });

  const [filterModel, setFilterModel] = useState({
    items: [],
    quickFilterValues: [],
  });

  const [sortModel, setSortModel] = useState([
    {
      field: 'date',
      sort: 'desc'  // Change from 'asc' to 'desc'
    }
  ]);

  const [isLoading, setIsLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [selectedRows, setSelectedRows] = useState([]);
  const [dateFilter, setDateFilter] = useState('');

  const yearLevels = ["1st Year", "2nd Year", "3rd Year", "4th Year", "5th Year"];
  const departments = [
    "CBE",
    "CCS",
    "CEA",
    "CoA",
    "CoE"
  ];
  
  const programs = {
    "CBE": [
      "Accountancy",
      "Accounting Information Sytems",
      "Financial Management",
      "Human Resource Management",
      "Logistics and Supply Management",
      "Marketing Management"
    ],
    "CCS": [
      "Computer Science",
      "Data Science and Analytics",
      "Information Systems",
      "Information Technology"
    ],
    "CEA": [
      "Architecture",
      "Civil Engineering",
      "Computer Engineering",
      "Electrical Engineering",
      "Electronics Engineering",
      "Environmental and Sanitary Engineering",
      "Industrial Engineering",
      "Mechanical Engineering"
    ],
    "CoA": [
      "BA English",
      "BA Political Science"
    ],
    "CoE": [
      "BSE Major in English",
      "BSE Major in Mathematics",
      "BSE Major in Sciences",
      "Bachelor of Special Needs Education"
    ]
  };

  const [customViolations, setCustomViolations] = useState([
    "Cap", "Shorts", "Sleeveless"  // Initial violations
  ]);

  const [newViolation, setNewViolation] = useState('');

  const handleViolationInput = (value) => {
    if (value === 'other') {
      // Don't do anything when 'other' is selected
      return;
    }
    handleInputChange('violation', value);
  };

  const handleAddCustomViolation = (violation) => {
    if (violation && !customViolations.includes(violation)) {
      setCustomViolations(prev => [...prev, violation]);
      handleInputChange('violation', violation);
      setNewViolation(''); // Clear the input
    }
  };

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

  const handleSortModelChange = (newSortModel) => {
    setSortModel(newSortModel);
  };

  const handleDateChange = async (date) => {
    setDateFilter(date);
    
    let filteredRecords = [...allRecords];
    
    // Apply date filter
    if (date) {
      const [year, month, day] = date.split('-');
      const formattedDate = `${month}-${day}-${year}`;
      filteredRecords = filteredRecords.filter(record => {
        const recordDate = new Date(record.date);
        const selectedDate = new Date(formattedDate);
        return recordDate.toDateString() === selectedDate.toDateString();
      });
    }
    
    // Apply search filter if exists
    if (searchText) {
      filteredRecords = filteredRecords.filter(record =>
        Object.values(record)
          .join(' ')
          .toLowerCase()
          .includes(searchText.toLowerCase())
      );
    }
    
    setRecords(filteredRecords);
    setFilterModel({
      ...filterModel,
      items: [
        ...filterModel.items.filter(item => item.field !== 'date'),
        ...(date ? [{
          field: 'date',
          operator: 'equals',
          value: date
        }] : [])
      ]
    });
  };

  const columns = [
    {
      field: "violation_id",
      headerName: "Ticket Number",
      flex: 1,
      cellClassName: "name-column--cell",
      sortable: true,
    },
    {
      field: "studentNumber",
      headerName: "Student Number",
      flex: 1,
      cellClassName: "name-column--cell",
      sortable: true,
    },
    {
      field: "name",
      headerName: "Student Name",
      flex: 1,
      cellClassName: "name-column--cell",
      sortable: true,
    },
    {
      field: "program",
      headerName: "Program",
      flex: 1,
      sortable: true,
    },
    {
      field: "yearLevel",
      headerName: "Year Level",
      flex: 0.7,
      sortable: true,
    },
    {
      field: "violation",
      headerName: "Violation",
      flex: 1,
      sortable: true,
    },
    {
      field: "date",
      headerName: "Date",
      flex: 1,
      sortable: true,
      valueFormatter: ({ value }) => {
        if (!value) return '';
        const [month, day, year] = value.split('-');
        const months = [
          'January', 'February', 'March', 'April', 'May', 'June',
          'July', 'August', 'September', 'October', 'November', 'December'
        ];
        return `${months[parseInt(month) - 1]} ${parseInt(day)}, ${year}`;
      },
    },
    {
      field: "department",
      headerName: "Department",
      flex: 1,
      sortable: true,
      renderCell: ({ row: { department } }) => {
        return (
          <Typography sx={{ fontSize: "15px" }}>
            {department}
          </Typography>
        );
      },
    },
    {
      field: "actions",
      headerName: "Actions",
      flex: 0.8,
      sortable: false,
      renderCell: (params) => (
        <Typography
          onClick={() => handleViewTicket(params.row)}
          sx={{
            color: '#0288D1',
            cursor: 'pointer',
            textDecoration: 'underline',
            '&:hover': {
              color: '#1B247E'
            }
          }}
        >
          View
        </Typography>
      ),
    },
  ];

  const handleAddNew = () => {
    setSelectedRecord(null);
    setFormData({
      violation_id: generateTicketNumber(), // Add generated ticket number
      studentNumber: '',                    // Add student number field
      name: '',
      program: '',
      yearLevel: '',
      violation: '',
      date: '',
      department: ''
    });
    setFormErrors({
      violation_id: '',
      studentNumber: '',
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

  const handleSubmit = async () => {
    const newErrors = {
      studentNumber: '',
      name: '',
      program: '',
      yearLevel: '',
      violation: '',
      date: '',
      department: ''
    };

    // Validate student number
    if (!formData.studentNumber) {
      newErrors.studentNumber = 'Student number is required';
    } else if (!/^\d{7}$/.test(formData.studentNumber)) {
      newErrors.studentNumber = 'Student number must be exactly 7 digits';
    }

    // Validate name field
    if (formData.name && !validateName(formData.name)) {
      newErrors.name = 'Only letters and spaces are allowed';
    }

    // Check for other existing validations
    if (!formData.name) newErrors.name = 'Student name is required';
    if (!formData.program) newErrors.program = 'Program is required';
    if (!formData.yearLevel) newErrors.yearLevel = 'Year level is required';
    if (!formData.violation) newErrors.violation = 'Violation is required';
    if (!formData.date) newErrors.date = 'Date is required';
    if (!formData.department) newErrors.department = 'Department is required';

    setFormErrors(newErrors);

    if (Object.values(newErrors).some(error => error !== '')) {
      return;
    }

    try {
      const [year, month, day] = formData.date.split('-');
      const formattedData = {
        ...formData,
        violation_id: formData.violation_id, // Include the ticket number
        studentNumber: formData.studentNumber,
        yearLevel: formData.yearLevel,
        date: `${month}-${day}-${year}`
      };

      // Get current user from session
      const sessionUser = JSON.parse(sessionStorage.getItem('user'));

      if (selectedRecord) {
        await updateStudentRecord(selectedRecord.id, formattedData);
      } else {
        // Generate a unique ID for the new record
        const newRecord = {
          ...formattedData,
          id: Date.now().toString() // Add a unique ID
        };
        await addStudentRecord(newRecord);
        
        // Add audit log
        await addUserLog({
          log_id: sessionUser.log_id,
          username: sessionUser?.username || 'System',
          action: "Recorded a Violation",
          date: new Date().toISOString().split('T')[0],
          time: new Date().toTimeString().split(' ')[0]
        });
      }
      
      // Fetch updated records and sort them
      const updatedRecords = await getStudentRecords();
      const sortedRecords = [...updatedRecords].sort((a, b) => {
        const dateA = new Date(a.date.split('-').reverse().join('-'));
        const dateB = new Date(b.date.split('-').reverse().join('-'));
        return dateB - dateA;
      });
      
      setAllRecords(sortedRecords);
      setRecords(sortedRecords);
      handleClose();
    } catch (error) {
      //console.error("Error saving record:", error);
      //alert("Error saving record. Please try again.");
      window.location.reload();
    }
  };
  // Add this function to aggregate student violations
  const aggregateViolations = (records) => {
    const violationCounts = records.reduce((acc, record) => {
      // Create a unique key for each student
      const studentKey = `${record.name}-${record.program}-${record.yearLevel}`;
      
      if (!acc[studentKey]) {
        acc[studentKey] = {
          ...record,
          violationCount: 1,
          violations: [record.violation]  // Keep track of violation types
        };
      } else {
        acc[studentKey].violationCount += 1;
        acc[studentKey].violations.push(record.violation);
        // Update the date to the most recent violation
        const currentDate = new Date(record.date);
        const existingDate = new Date(acc[studentKey].date);
        if (currentDate > existingDate) {
          acc[studentKey].date = record.date;
        }
      }
      return acc;
    }, {});

    return Object.values(violationCounts);
  };
  const handleDelete = async (id) => {
    try {
      setIsLoading(true);
      await deleteStudentRecord(id);
      const updatedRecords = await getStudentRecords();
      setRecords(updatedRecords);
      setIsLoading(false);
    } catch (error) {
      console.error("Error deleting record:", error);
      alert("Error deleting record. Please try again.");
    } finally {
      setIsLoading(false);
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

  const handleSearch = useCallback((searchValue) => {
    setSearchText(searchValue);
    
    let filteredRecords = [...allRecords];
    
    // Apply date filter if exists
    if (dateFilter) {
      const [year, month, day] = dateFilter.split('-');
      const formattedDate = `${month}-${day}-${year}`;
      filteredRecords = filteredRecords.filter(record => {
        const recordDate = new Date(record.date);
        const selectedDate = new Date(formattedDate);
        return recordDate.toDateString() === selectedDate.toDateString();
      });
    }
    
    // Apply search filter
    if (searchValue) {
      filteredRecords = filteredRecords.filter(record =>
        Object.values(record)
          .join(' ')
          .toLowerCase()
          .includes(searchValue.toLowerCase())
      );
    }
    
    setRecords(filteredRecords);
    setFilterModel({
      ...filterModel,
      quickFilterValues: searchValue ? [searchValue] : []
    });
  }, [allRecords, dateFilter, filterModel]);

  useEffect(() => {
  const fetchRecords = async () => {
    try {
      setIsLoading(true);
      const fetchedRecords = await getStudentRecords();
      
      // Filter out records with invalid dates and sort records by date in descending order
      const validRecords = fetchedRecords.filter(record => 
        record.date && typeof record.date === 'string' && record.date.trim() !== ''
      );
      
      const sortedRecords = [...validRecords].sort((a, b) => {
        try {
          // Handle the date parsing more safely
          const dateA = new Date(a.date.split('-').reverse().join('-'));
          const dateB = new Date(b.date.split('-').reverse().join('-'));
          
          // Check if dates are valid
          if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) {
            return 0; // Keep original order if dates are invalid
          }
          
          return dateB - dateA;  // Sort in descending order
        } catch (error) {
          console.warn('Error parsing date for record:', { a: a.date, b: b.date });
          return 0; // Keep original order if there's an error
        }
      });
      
      setAllRecords(sortedRecords);
      setRecords(sortedRecords);
    } catch (error) {
      console.error("Error fetching records:", error);
    } finally {
      setIsLoading(false);
    }
  };

  fetchRecords();
}, []);

  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [reportConfig, setReportConfig] = useState({
    startDate: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    department: 'all',
    reportType: 'detailed',
    sortBy: 'name', // Add default sort field
    sortOrder: 'asc' // Add default sort order
  });

  const handleReportConfigSubmit = async () => {
    try {
      // Get the logged-in user
      const user = JSON.parse(sessionStorage.getItem("user"));
      const generatedBy = [user.first_name, user.last_name].filter(Boolean).join(' ');

      // Log the report generation
      await addUserLog({
        log_id: user.log_id,
        username: user.username,
        action: "Generated Violations Report",
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().split(' ')[0]
      });

      // Filter records by department and date range
      let filteredRecords = [...records];
      
      // Apply department filter
      if (reportConfig.department !== 'all') {
        filteredRecords = filteredRecords.filter(record => 
          record.department === reportConfig.department
        );
      }

      // Apply date range filter
      filteredRecords = filteredRecords.filter(record => {
        const recordDate = new Date(record.date);
        const startDate = new Date(reportConfig.startDate);
        const endDate = new Date(reportConfig.endDate);
        recordDate.setHours(0, 0, 0, 0);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(0, 0, 0, 0);
        return recordDate >= startDate && recordDate <= endDate;
      });

      // First aggregate the violations
      const aggregatedRecords = aggregateViolations(filteredRecords);

      // Then sort the aggregated records
      const sortedRecords = aggregatedRecords.sort((a, b) => {
        const sortField = reportConfig.sortBy;
        const sortOrder = reportConfig.sortOrder === 'asc' ? 1 : -1;
        
        if (sortField === 'violationCount') {
          return (a.violationCount - b.violationCount) * sortOrder;
        }
        
        if (a[sortField] < b[sortField]) return -1 * sortOrder;
        if (a[sortField] > b[sortField]) return 1 * sortOrder;
        return 0;
      });


      // Generate statistics
      const summaryStatistics = {
        totalViolations: filteredRecords.length,
        byDepartment: {},
        byViolationType: {},
        byYearLevel: {
          "1st Year": 0,
          "2nd Year": 0,
          "3rd Year": 0,
          "4th Year": 0,
          "5th Year": 0
        },
        byProgram: {},
        byDate: {}
      };

      // Calculate statistics
      filteredRecords.forEach(record => {
        // By department
        if (!summaryStatistics.byDepartment[record.department]) {
          summaryStatistics.byDepartment[record.department] = 0;
        }
        summaryStatistics.byDepartment[record.department]++;

        // By violation type
        if (!summaryStatistics.byViolationType[record.violation]) {
          summaryStatistics.byViolationType[record.violation] = 0;
        }
        summaryStatistics.byViolationType[record.violation]++;

        // By year level
        if (summaryStatistics.byYearLevel.hasOwnProperty(record.yearLevel)) {
          summaryStatistics.byYearLevel[record.yearLevel]++;
        }

        // By program
        if (!summaryStatistics.byProgram[record.program]) {
          summaryStatistics.byProgram[record.program] = 0;
        }
        summaryStatistics.byProgram[record.program]++;

        // By date
        const formattedDate = new Date(record.date).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
        if (!summaryStatistics.byDate[formattedDate]) {
          summaryStatistics.byDate[formattedDate] = 0;
        }
        summaryStatistics.byDate[formattedDate]++;
      });

      const docDefinition = {
        pageMargins: [40, 120, 40, 60],
        header: {
          stack: [
            { 
              canvas: [
                { type: 'rect', x: 0, y: 0, w: 595.28, h: 100, color: '#ffd700' }
              ]
            },
            {
              stack: [
                {
                  text: 'Technological Institute of the Philippines',
                  fontSize: 22,
                  bold: true,
                  alignment: 'center',
                  margin: [0, 15, 0, 0],
                  color: '#222'
                },
                {
                  text: 'Student Violation Records',
                  fontSize: 16,
                  alignment: 'center',
                  margin: [0, 5, 0, 0],
                  color: '#222'
                }
              ],
              absolutePosition: { x: 40, y: 20 }
            }
          ]
        },
        footer: function(currentPage, pageCount) {
          return {
            stack: [
              { 
                canvas: [
                  { 
                    type: 'line', 
                    x1: 40, 
                    y1: 0, 
                    x2: 555.28, 
                    y2: 0, 
                    lineWidth: 1, 
                    lineColor: '#ffd700' 
                  }
                ] 
              },
              {
                columns: [
                  {
                    width: 'auto',
                    text: [
                      { text: 'Period: ', fontSize: 8, color: '#666' },
                      { 
                        text: `${new Date(reportConfig.startDate).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })} - ${new Date(reportConfig.endDate).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}`,
                        fontSize: 8,
                        color: '#666'
                      }
                    ],
                    margin: [40, 5, 10, 0]
                  },
                  {
                    width: 'auto',
                    text: [
                      { text: 'Generated by: ', fontSize: 8, color: '#666' },
                      { text: generatedBy, fontSize: 8, color: '#666' }
                    ],
                    margin: [25, 5, 10, 0]
                  },
                  // This is the NEW code with hour, minute, and seconds
{
  width: 'auto',
  text: [
    { text: 'Generated on: ', fontSize: 8, color: '#666' },
    {
      text: new Date().toLocaleString('en-US', { // Changed to toLocaleString
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit' // Added seconds
      }),
      fontSize: 8,
      color: '#666'
    }
  ],
  alignment: 'center',
  margin: [25, 5, 10, 0]
},
                  {
                    width: 'auto',
                    text: `Page ${currentPage} of ${pageCount}`,
                    fontSize: 8,
                    color: '#666',
                    margin: [20, 5, 10, 0]
                  }
                ]
              }
            ]
          };
        },
        content: [
          {
            text: 'Detailed Records',
            fontSize: 24,
            bold: true,
            alignment: 'center',
            margin: [0, 10, 0, 10]
          },
          {
            table: {
              headerRows: 1,
              widths: ['*', '*', '*', '*', '*'],
              body: [
                [
                  { text: 'Student Name', style: 'tableHeader' },
                  { text: 'Program', style: 'tableHeader' },
                  { text: 'Year Level', style: 'tableHeader', alignment: 'center' },
                  { text: 'Violation Count', style: 'tableHeader', alignment: 'center' },
                  { text: 'Department', style: 'tableHeader', alignment: 'center' }
                ],
                ...sortedRecords.map(record => [
                  { text: record.name, style: 'tableCell' },
                  { text: record.program, style: 'tableCell' },
                  { text: record.yearLevel, style: 'tableCell', alignment: 'center'},
                  { text: record.violationCount.toString(), style: 'tableCell', alignment: 'center'},
                  { text: record.department, style: 'tableCell', alignment: 'center' }
                ])
              ]
            },
            layout: {
              fillColor: function(rowIndex, node, columnIndex) {
                return rowIndex === 0 ? '#ffd700' : (rowIndex % 2 === 0 ? '#f9f9f9' : null);
              },
              hLineWidth: function(i, node) {
                return 0.5;
              },
              vLineWidth: function(i) {
                return 0;
              },
              hLineColor: function(i, node) {
                return '#e0e0e0';
              },
              paddingLeft: function(i) { return 8; },
              paddingRight: function(i) { return 8; },
              paddingTop: function(i) { return 6; },
              paddingBottom: function(i) { return 6; }
            }
          },
          {
            text: `${reportConfig.department === 'all' ? 'Overall' : reportConfig.department} Violations Report`,
            fontSize: 24,
            bold: true,
            alignment: 'center',
            margin: [0, 20, 0, 10],
            pageBreak: 'before'
          },
          {
            columns: [
              {
                width: '*',
                stack: [
                  {
                    text: 'Violations per Department',
                    fontSize: 16,
                    bold: true,
                    margin: [0, 0, 0, 10]
                  },
                  {
                    table: {
                      widths: ['*', 'auto', 'auto'],
                      body: [
                        [
                          { text: 'Department', style: 'tableHeader', fillColor: '#ffd700' },
                          { text: 'Count', style: 'tableHeader', fillColor: '#ffd700' },
                          { text: 'Percentage', style: 'tableHeader', fillColor: '#ffd700' }
                        ],
                        ...Object.entries(summaryStatistics.byDepartment)
                          .sort((a, b) => b[1] - a[1])
                          .map(([dept, count]) => [
                            { text: dept, style: 'tableCell' },
                            { text: count.toString(), style: 'tableCell', alignment: 'right' },
                            { 
                              text: `${((count / summaryStatistics.totalViolations) * 100).toFixed(1)}%`,
                              style: 'tableCell',
                              alignment: 'right'
                            }
                          ])
                      ]
                    },
                    layout: {
                      fillColor: function(rowIndex, node, columnIndex) {
                        return rowIndex === 0 ? '#ffd700' : (rowIndex % 2 === 0 ? '#f9f9f9' : null);
                      },
                      hLineWidth: function(i, node) {
                        return 0.5;
                      },
                      vLineWidth: function(i) {
                        return 0;
                      },
                      hLineColor: function(i, node) {
                        return '#e0e0e0';
                      },
                      paddingLeft: function(i) { return 8; },
                      paddingRight: function(i) { return 8; },
                      paddingTop: function(i) { return 6; },
                      paddingBottom: function(i) { return 6; }
                    }
                  }
                ]
              },
              {
                width: '*',
                stack: [
                  {
                    text: 'Violations per Type',
                    fontSize: 16,
                    bold: true,
                    margin: [0, 0, 0, 10]
                  },
                  {
                    table: {
                      widths: ['*', 'auto', 'auto'],
                      body: [
                        [
                          { text: 'Violation Type', style: 'tableHeader', fillColor: '#ffd700' },
                          { text: 'Count', style: 'tableHeader', fillColor: '#ffd700' },
                          { text: 'Percentage', style: 'tableHeader', fillColor: '#ffd700' }
                        ],
                        ...Object.entries(summaryStatistics.byViolationType)
                          .sort((a, b) => b[1] - a[1])
                          .map(([type, count]) => [
                            { text: type, style: 'tableCell' },
                            { text: count.toString(), style: 'tableCell', alignment: 'right' },
                            { 
                              text: `${((count / summaryStatistics.totalViolations) * 100).toFixed(1)}%`,
                              style: 'tableCell',
                              alignment: 'right'
                            }
                          ])
                      ]
                    },
                    layout: {
                      fillColor: function(rowIndex, node, columnIndex) {
                        return rowIndex === 0 ? '#ffd700' : (rowIndex % 2 === 0 ? '#f9f9f9' : null);
                      },
                      hLineWidth: function(i, node) {
                        return 0.5;
                      },
                      vLineWidth: function(i) {
                        return 0;
                      },
                      hLineColor: function(i, node) {
                        return '#e0e0e0';
                      },
                      paddingLeft: function(i) { return 8; },
                      paddingRight: function(i) { return 8; },
                      paddingTop: function(i) { return 6; },
                      paddingBottom: function(i) { return 6; }
                    }
                  }
                ]
              }
            ],
            columnGap: 20,
            margin: [0, 0, 0, 10]
          },
          {
            text: 'Violations per Year Level',
            fontSize: 16,
            bold: true,
            margin: [0, 0, 0, 10]
          },
          {
            table: {
              widths: ['*', 'auto', 'auto'],
              body: [
                [
                  { text: 'Year Level', style: 'tableHeader', fillColor: '#ffd700' },
                  { text: 'Count', style: 'tableHeader', fillColor: '#ffd700' },
                  { text: 'Percentage', style: 'tableHeader', fillColor: '#ffd700' }
                ],
                ...Object.entries(summaryStatistics.byYearLevel)
                  .sort((a, b) => b[1] - a[1])
                  .map(([level, count]) => [
                    { text: level, style: 'tableCell' },
                    { text: count.toString(), style: 'tableCell', alignment: 'right' },
                    { 
                      text: `${((count / summaryStatistics.totalViolations) * 100).toFixed(1)}%`,
                      style: 'tableCell',
                      alignment: 'right'
                    }
                  ])
              ]
            },
            layout: {
              fillColor: function(rowIndex, node, columnIndex) {
                return rowIndex === 0 ? '#ffd700' : (rowIndex % 2 === 0 ? '#f9f9f9' : null);
              },
              hLineWidth: function(i, node) {
                return 0.5;
              },
              vLineWidth: function(i) {
                return 0;
              },
              hLineColor: function(i, node) {
                return '#e0e0e0';
              },
              paddingLeft: function(i) { return 8; },
              paddingRight: function(i) { return 8; },
              paddingTop: function(i) { return 6; },
              paddingBottom: function(i) { return 6; }
            },
            columnGap: 20,
            margin: [0, 0, 0, 10]
          },
          {
            text: 'Violations per Program',
            fontSize: 16,
            bold: true,
            margin: [0, 0, 0, 10],
            pageBreak: 'before'
          },
          {
            table: {
              widths: ['*', 'auto', 'auto'],
              body: [
                [
                  { text: 'Program', style: 'tableHeader', fillColor: '#ffd700' },
                  { text: 'Count', style: 'tableHeader', fillColor: '#ffd700' },
                  { text: 'Percentage', style: 'tableHeader', fillColor: '#ffd700' }
                ],
                ...Object.entries(summaryStatistics.byProgram)
                  .sort((a, b) => b[1] - a[1])
                  .map(([program, count]) => [
                    { text: program, style: 'tableCell' },
                    { text: count.toString(), style: 'tableCell', alignment: 'right' },
                    { 
                      text: `${((count / summaryStatistics.totalViolations) * 100).toFixed(1)}%`,
                      style: 'tableCell',
                      alignment: 'right'
                    }
                  ])
              ]
            },
            layout: {
              fillColor: function(rowIndex, node, columnIndex) {
                return rowIndex === 0 ? '#ffd700' : (rowIndex % 2 === 0 ? '#f9f9f9' : null);
              },
              hLineWidth: function(i, node) {
                return 0.5;
              },
              vLineWidth: function(i) {
                return 0;
              },
              hLineColor: function(i, node) {
                return '#e0e0e0';
              },
              paddingLeft: function(i) { return 8; },
              paddingRight: function(i) { return 8; },
              paddingTop: function(i) { return 6; },
              paddingBottom: function(i) { return 6; }
            },
            margin: [0, 0, 0, 20]
          },
          {
            text: 'Violations per Day',
            fontSize: 16,
            bold: true,
            margin: [0, 0, 0, 10],
            pageBreak: 'before'
          },
          {
            table: {
              widths: ['*', 'auto', 'auto'],
              body: [
                [
                  { text: 'Date', style: 'tableHeader', fillColor: '#ffd700' },
                  { text: 'Count', style: 'tableHeader', fillColor: '#ffd700' },
                  { text: 'Percentage', style: 'tableHeader', fillColor: '#ffd700' }
                ],
                ...Object.entries(summaryStatistics.byDate)
                  .sort((a, b) => b[1] - a[1])
                  .map(([date, count]) => [
                    { text: date, style: 'tableCell' },
                    { text: count.toString(), style: 'tableCell', alignment: 'right' },
                    { 
                      text: `${((count / summaryStatistics.totalViolations) * 100).toFixed(1)}%`,
                      style: 'tableCell',
                      alignment: 'right'
                    }
                  ])
              ]
            },
            layout: {
              fillColor: function(rowIndex, node, columnIndex) {
                return rowIndex === 0 ? '#ffd700' : (rowIndex % 2 === 0 ? '#f9f9f9' : null);
              },
              hLineWidth: function(i, node) {
                return 0.5;
              },
              vLineWidth: function(i) {
                return 0;
              },
              hLineColor: function(i, node) {
                return '#e0e0e0';
              },
              paddingLeft: function(i) { return 8; },
              paddingRight: function(i) { return 8; },
              paddingTop: function(i) { return 6; },
              paddingBottom: function(i) { return 6; }
            },
            margin: [0, 0, 0, 20]
          }
        ],
      };

      // Create and download PDF
      pdfMake.createPdf(docDefinition).download(
        `Violation_Report_${reportConfig.department}_${reportConfig.startDate}_to_${reportConfig.endDate}.pdf`
      );

      // Close the dialog
      setIsReportDialogOpen(false);

      // Reset the form
      setReportConfig({
        startDate: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        department: 'all',
        reportType: 'detailed',
        sortBy: 'name',
        sortOrder: 'asc'
      });

    } catch (error) {
      console.error("Error generating report:", error);
    }
  };

  const [ticketDialogOpen, setTicketDialogOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);

  const handleViewTicket = (ticket) => {
    setSelectedTicket(ticket);
    setTicketDialogOpen(true);
  };

  // Add this function at the top of the ViolationHandling component
  const generateTicketNumber = () => {
    const today = new Date();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const yy = String(today.getFullYear()).slice(-2);
    const randomLetters = Array(4)
      .fill()
      .map(() => String.fromCharCode(65 + Math.floor(Math.random() * 26)))
      .join('');
    return `VIO${mm}${dd}${yy}${randomLetters}`;
  };

  return (
    <Box m="20px">
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Header title="Violation Records"/>
        <Box display="flex" gap="10px">
          <Button
            onClick={() => setIsReportDialogOpen(true)}
            variant="contained"
            startIcon={<DownloadOutlinedIcon />}
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
            Generate Report
          </Button>
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
      </Box>

      <Box
        m="0px 0 0 0"
        height="87vh"
        sx={{
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
          checkboxSelection
          rows={records}
          columns={columns}
          components={{
            Toolbar: CustomToolbar
          }}
          componentsProps={{
            toolbar: {
              value: searchText,
              onChange: handleSearch,
              dateFilter,
              onDateChange: handleDateChange,
          }}}
          loading={isLoading}
          disableRowSelectionOnClick
          sortModel={sortModel}
          onSortModelChange={handleSortModelChange}
          filterModel={filterModel}
          onFilterModelChange={(newModel) => setFilterModel(newModel)}
          onSelectionModelChange={(ids) => setSelectedRows(ids)}
          initialState={{
            sorting: {
              sortModel: [{ field: 'date', sort: 'desc' }]  // Change from 'asc' to 'desc'
            },
          }}
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
            {/* Ticket Number Display */}
            <div className="form-row">
              <div className="form-field">
                <Typography
                  className="form-label"
                  sx={{ 
                    color: colors.grey[100],
                    fontWeight: 'bold'
                  }}
                >
                  Ticket Number
                </Typography>
                <OutlinedInput
                  className="form-input"
                  value={formData.violation_id}
                  disabled
                  sx={{
                    backgroundColor: colors.grey[800],
                    color: colors.grey[100],
                    '& .MuiOutlinedInput-input': {
                      color: colors.grey[100],
                      '-webkit-text-fill-color': colors.grey[100],
                      cursor: 'default'
                    }
                  }}
                />
              </div>
            </div>

            {/* Student Number Input */}
            <div className="form-row">
              <div className="form-field">
                <Typography
                  className="form-label"
                  sx={{ 
                    color: colors.grey[100],
                    fontWeight: 'bold'
                  }}
                >
                  Student Number *
                </Typography>
                <OutlinedInput
                  className="form-input"
                  value={formData.studentNumber}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^\d]/g, '');
                    if (value.length <= 7) {
                      handleInputChange('studentNumber', value);
                    }
                  }}
                  placeholder="Enter 7-digit student number"
                  error={!!formErrors.studentNumber}
                  inputProps={{
                    maxLength: 7,
                    inputMode: 'numeric',
                    pattern: '[0-9]*'
                  }}
                  sx={{
                    color: colors.grey[100],
                    '& .MuiOutlinedInput-input': { color: colors.grey[100] }
                  }}
                />
              </div>
              {formErrors.studentNumber && (
                <Typography 
                  className="error-text"
                  color="error" 
                  variant="caption"
                >
                  {formErrors.studentNumber}
                </Typography>
              )}
            </div>
            {/* Student Name Input */}
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
                  onChange={(e) => {
                    // Only allow letters and spaces
                    const value = e.target.value.replace(/[^A-Za-z\s]/g, '');
                    handleInputChange('name', value);
                  }}
                  placeholder="Enter complete name"
                  error={!!formErrors.name}
                  sx={{
                    color: colors.grey[100],
                    '& .MuiOutlinedInput-input': { color: colors.grey[100] }
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
                  onChange={(e) => handleViolationInput(e.target.value)}
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
                  {/* Default violations */}
                  {customViolations.map((violation) => (
                    <MenuItem key={violation} value={violation}>{violation}</MenuItem>
                  ))}
                  {/* Option to add new violation */}
                  <MenuItem value="other">
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 1,
                      width: '100%' // Ensure full width
                    }}>
                      <AddIcon fontSize="small" />
                      <TextField
                        value={newViolation}
                        placeholder="Type and press Enter to add..."
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => {
                          e.stopPropagation();
                          setNewViolation(e.target.value);
                        }}
                        onKeyDown={(e) => {
                          e.stopPropagation();
                          if (e.key === 'Enter' && newViolation.trim()) {
                            e.preventDefault();
                            handleAddCustomViolation(newViolation.trim());
                          }
                        }}
                        sx={{
                          width: '100%', // Make TextField fill available space
                          '& .MuiOutlinedInput-root': {
                            '& fieldset': { border: 'none' },
                          },
                          '& .MuiInputBase-input': {
                            color: colors.grey[100],
                            padding: '8px 0', // Increase vertical padding
                            fontSize: '1rem', // Increase font size
                            '&::placeholder': {
                              color: colors.grey[400],
                              opacity: 1,
                              fontSize: '0.95rem', // Slightly larger placeholder text
                            }
                          }
                        }}
                      />
                    </Box>
                  </MenuItem>
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
                  inputProps={{
                    max: new Date().toISOString().split('T')[0] // Disable future dates
                  }}
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

      <ReportDialog
        open={isReportDialogOpen}
        onClose={() => {
          setIsReportDialogOpen(false);
          setReportConfig({
            startDate: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            endDate: new Date().toISOString().split('T')[0],
            department: 'all',
            reportType: 'detailed',
            sortBy: 'name',
            sortOrder: 'asc'
          });
        }}
        config={reportConfig}
        setConfig={setReportConfig}
        onSubmit={handleReportConfigSubmit}
        colors={colors}
        departments={departments}
      />

      <TicketDialog 
        open={ticketDialogOpen}
        onClose={() => {
          setTicketDialogOpen(false);
          setSelectedTicket(null);
        }}
        ticket={selectedTicket}
        colors={colors}
      />
    </Box>
  );
};

const TicketDialog = ({ open, onClose, ticket, colors }) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: colors.primary[400],
          backgroundImage: 'linear-gradient(rgba(255, 215, 0, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 215, 0, 0.05) 1px, transparent 1px)',
          backgroundSize: '20px 20px',
          borderRadius: '12px'
        }
      }}
    >
      <DialogTitle sx={{ 
        borderBottom: `2px solid ${colors.grey[800]}`,
        pb: 2,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Box>
          <Typography variant="h5" sx={{ color: colors.grey[100], fontWeight: 'bold' }}>
            Violation Ticket
          </Typography>
          <Typography variant="subtitle2" sx={{ color: colors.grey[300] }}>
            Ticket No: {ticket?.violation_id}
          </Typography>
        </Box>
        <IconButton onClick={onClose} sx={{ color: colors.grey[100] }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ mt: 2 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Image Preview Section */}
          <Box sx={{ 
            width: '100%',
            height: '200px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: colors.grey[900],
            borderRadius: '8px',
            border: `1px solid ${colors.grey[800]}`
          }}>
            {ticket?.imageUrl ? (
              <img
                src={ticket.imageUrl}
                alt="Violation capture"
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  objectFit: 'contain',
                  borderRadius: '8px'
                }}
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'block';
                }}
              />
            ) : (
              <Typography sx={{ 
                color: colors.grey[500],
                fontStyle: 'italic',
                textAlign: 'center'
              }}>
                No image available for preview
              </Typography>
            )}
          </Box>

          {/* Existing ticket details */}
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Typography variant="subtitle2" sx={{ color: colors.grey[300] }}>
                Student Number
              </Typography>
              <Typography sx={{ color: colors.grey[100], fontWeight: 'medium' }}>
                {ticket?.studentNumber}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Typography variant="subtitle2" sx={{ color: colors.grey[300] }}>
                Student Name
              </Typography>
              <Typography sx={{ color: colors.grey[100], fontWeight: 'medium' }}>
                {ticket?.name}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Typography variant="subtitle2" sx={{ color: colors.grey[300] }}>
                Department
              </Typography>
              <Typography sx={{ color: colors.grey[100], fontWeight: 'medium' }}>
                {ticket?.department}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Typography variant="subtitle2" sx={{ color: colors.grey[300] }}>
                Program
              </Typography>
              <Typography sx={{ color: colors.grey[100], fontWeight: 'medium' }}>
                {ticket?.program}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Typography variant="subtitle2" sx={{ color: colors.grey[300] }}>
                Year Level
              </Typography>
              <Typography sx={{ color: colors.grey[100], fontWeight: 'medium' }}>
                {ticket?.yearLevel}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Typography variant="subtitle2" sx={{ color: colors.grey[300] }}>
                Violation
              </Typography>
              <Typography sx={{ color: colors.grey[100], fontWeight: 'medium' }}>
                {ticket?.violation}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ 
            mt: 2, 
            pt: 2, 
            borderTop: `1px solid ${colors.grey[800]}`,
            display: 'flex',
            justifyContent: 'space-between'
          }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Typography variant="subtitle2" sx={{ color: colors.grey[300] }}>
                Date Issued
              </Typography>
              <Typography sx={{ color: colors.grey[100], fontWeight: 'medium' }}>
                {new Date(ticket?.date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </Typography>
            </Box>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default ViolationHandling;
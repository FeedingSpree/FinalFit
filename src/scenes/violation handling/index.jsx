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
  IconButton,
  TextField,
  FormLabel,
  RadioGroup,
  Radio,
  FormControlLabel,
  FormGroup,
  Checkbox
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
import { getStudentRecords, addStudentRecord, updateStudentRecord, deleteStudentRecord } from '../../services/studentRecordsService.ts';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { addUserLog } from '../../services/userLogsService.ts';
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import pdfMake from 'pdfmake/build/pdfmake';
import vfs from 'pdfmake/build/vfs_fonts.js';
import html2canvas from "html2canvas";
import CustomDatePicker from "../../components/CustomDatePicker";

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
        <GridToolbarExport />
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

  const [filterModel, setFilterModel] = useState({
    items: [],
    quickFilterValues: [],
  });

  const [sortModel, setSortModel] = useState([
    {
      field: 'name',
      sort: 'asc',
    },
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

  const handleSubmit = async () => {
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
      // Get the date parts from the YYYY-MM-DD format
      const [year, month, day] = formData.date.split('-');
        
      const formattedData = {
        ...formData,
        yearLevel: formData.yearLevel.toString(),
        date: `${month}-${day}-${year}`
      };

      // Get current user from session
      const sessionUser = JSON.parse(sessionStorage.getItem('user'));

      if (selectedRecord) {
        await updateStudentRecord(selectedRecord.id, formattedData);
      } else {
        await addStudentRecord(formattedData);
          
        // Add audit log for new violation record using the same log_id as the logged-in user
        await addUserLog({
          log_id: sessionUser.log_id, // Use the same log_id from session
          username: sessionUser?.username || 'System',
          action: "Recorded a Violation",
          date: new Date().toISOString().split('T')[0],
          time: new Date().toTimeString().split(' ')[0]
        });
      }
        
      const updatedRecords = await getStudentRecords();
      setRecords(updatedRecords);
      handleClose();
    } catch (error) {
      console.error("Error saving record:", error);
      alert("Error saving record. Please try again.");
    }
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
        setAllRecords(fetchedRecords); // Store all records
        setRecords(fetchedRecords);    // Display records
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
    startDate: '',
    endDate: '',
    department: '',
    reportType: 'detailed'
  });

  const handleReportConfigSubmit = async () => {
    try {
      const user = JSON.parse(sessionStorage.getItem("user"));
      const generatedBy = [user.first_name, user.last_name].filter(Boolean).join(' ');

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
        // Set hours to 0 for accurate date comparison
        recordDate.setHours(0, 0, 0, 0);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(0, 0, 0, 0);
        
        return recordDate >= startDate && recordDate <= endDate;
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
                    text: `Generated on: ${new Date().toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}`,
                    fontSize: 8,
                    color: '#666',
                    margin: [40, 5, 0, 0]
                  },
                  {
                    text: `Page ${currentPage} of ${pageCount}`,
                    fontSize: 8,
                    color: '#666',
                    alignment: 'right',
                    margin: [0, 5, 40, 0]
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
              widths: ['*', '*', '*', '*', '*', '*'],
              body: [
                [
                  { text: 'Student Name', style: 'tableHeader' },
                  { text: 'Program', style: 'tableHeader' },
                  { text: 'Year Level', style: 'tableHeader' },
                  { text: 'Violation', style: 'tableHeader' },
                  { text: 'Date', style: 'tableHeader' },
                  { text: 'Department', style: 'tableHeader' }
                ],
                ...filteredRecords.map(record => [
                  { text: record.name, style: 'tableCell' },
                  { text: record.program, style: 'tableCell' },
                  { text: record.yearLevel, style: 'tableCell' },
                  { text: record.violation, style: 'tableCell' },
                  { 
                    text: new Date(record.date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    }),
                    style: 'tableCell'
                  },
                  { text: record.department, style: 'tableCell' }
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
            text: 'Report Information',
            fontSize: 16,
            bold: true,
            margin: [0, 20, 0, 10]
          },
          {
            columns: [
              {
                width: 'auto',
                stack: [
                  { text: 'Period:', style: 'label' },
                  { text: 'Generated by:', style: 'label' },
                  { text: 'Department:', style: 'label' }
                ]
              },
              {
                width: '*',
                stack: [
                  { 
                    text: `${new Date(reportConfig.startDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} - ${new Date(reportConfig.endDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`,
                    style: 'value'
                  },
                  { text: generatedBy, style: 'value' },
                  { 
                    text: reportConfig.department === 'all' ? 'All Departments' : reportConfig.department,
                    style: 'value'
                  }
                ]
              }
            ],
            columnGap: 10,
            margin: [0, 0, 0, 20]
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
            margin: [0, 0, 0, 10]
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
        startDate: '',
        endDate: '',
        department: '',
        reportType: 'detailed'
      });

    } catch (error) {
      console.error("Error generating report:", error);
    }
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
              sortModel: [{ field: 'name', sort: 'asc' }],
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

      <Dialog
        open={isReportDialogOpen}
        onClose={() => {
          setIsReportDialogOpen(false);
          setReportConfig({
            startDate: '',
            endDate: '',
            department: '',
            reportType: 'detailed'
          });
        }}
        PaperProps={{
          sx: {
            backgroundColor: colors.grey[900],
            minWidth: '500px'
          }
        }}
      >
        <DialogTitle 
          sx={{ 
            color: colors.grey[100],
            borderBottom: `1px solid ${colors.grey[800]}`,
            padding: '20px 24px'
          }}
        >
          Generate Violation Report
        </DialogTitle>
        <DialogContent sx={{ padding: '24px' }}>
          <Box
            component="form"
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 3,
              '& .form-section': {
                display: 'flex',
                flexDirection: 'column',
                gap: 2
              }
            }}
          >
            {/* Department Selection */}
            <div className="form-section">
              <Typography
                sx={{ 
                  color: colors.grey[100],
                  fontWeight: 'bold',
                  fontSize: '1rem',
                  marginBottom: '8px'
                }}
              >
                Select Department
              </Typography>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                  gap: 2
                }}
              >
                <Button
                  onClick={() => setReportConfig(prev => ({
                    ...prev,
                    department: 'all'
                  }))}
                  sx={{
                    backgroundColor: reportConfig.department === 'all' ? '#ffd700' : colors.grey[800],
                    color: reportConfig.department === 'all' ? colors.grey[900] : colors.grey[100],
                    padding: '12px',
                    '&:hover': {
                      backgroundColor: reportConfig.department === 'all' ? '#e6c200' : colors.grey[700]
                    }
                  }}
                >
                  All Departments
                </Button>
                {departments.map(dept => (
                  <Button
                    key={dept}
                    onClick={() => setReportConfig(prev => ({
                      ...prev,
                      department: dept
                    }))}
                    sx={{
                      backgroundColor: reportConfig.department === dept ? '#ffd700' : colors.grey[800],
                      color: reportConfig.department === dept ? colors.grey[900] : colors.grey[100],
                      padding: '12px',
                      '&:hover': {
                        backgroundColor: reportConfig.department === dept ? '#e6c200' : colors.grey[700]
                      }
                    }}
                  >
                    {dept}
                  </Button>
                ))}
              </Box>
            </div>

            {/* Date Range Selection */}
            <div className="form-section">
              <Typography
                sx={{ 
                  color: colors.grey[100],
                  fontWeight: 'bold',
                  fontSize: '1rem',
                  marginBottom: '8px'
                }}
              >
                Select Date Range
              </Typography>
              <Box
                sx={{
                  display: 'flex',
                  gap: 2,
                  alignItems: 'center'
                }}
              >
                <Box sx={{ flex: 1 }}>
                  <Typography
                    sx={{ 
                      color: colors.grey[100],
                      fontSize: '0.875rem',
                      marginBottom: '4px'
                    }}
                  >
                    Start Date
                  </Typography>
                  <OutlinedInput
                    type="date"
                    fullWidth
                    value={reportConfig.startDate}
                    onChange={(e) => setReportConfig(prev => ({
                      ...prev,
                      startDate: e.target.value,
                      endDate: e.target.value > prev.endDate ? e.target.value : prev.endDate
                    }))}
                    sx={{
                      color: colors.grey[100],
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: colors.grey[400],
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: colors.grey[100],
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: colors.grey[100],
                      },
                    }}
                  />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography
                    sx={{ 
                      color: colors.grey[100],
                      fontSize: '0.875rem',
                      marginBottom: '4px'
                    }}
                  >
                    End Date
                  </Typography>
                  <OutlinedInput
                    type="date"
                    fullWidth
                    value={reportConfig.endDate}
                    onChange={(e) => setReportConfig(prev => ({
                      ...prev,
                      endDate: e.target.value
                    }))}
                    inputProps={{
                      min: reportConfig.startDate
                    }}
                    sx={{
                      color: colors.grey[100],
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: colors.grey[400],
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: colors.grey[100],
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: colors.grey[100],
                      },
                    }}
                  />
                </Box>
              </Box>
            </div>
          </Box>
        </DialogContent>
        <DialogActions 
          sx={{ 
            padding: '16px 24px',
            borderTop: `1px solid ${colors.grey[800]}`,
            gap: '12px'
          }}
        >
          <Button 
            onClick={() => {
              setIsReportDialogOpen(false);
              setReportConfig({
                startDate: '',
                endDate: '',
                department: '',
                reportType: 'detailed'
              });
            }}
            variant="outlined"
            sx={{ 
              color: colors.grey[100],
              borderColor: colors.grey[700],
              '&:hover': {
                borderColor: colors.grey[500],
                backgroundColor: colors.grey[800]
              }
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleReportConfigSubmit}
            variant="contained"
            disabled={!reportConfig.startDate || !reportConfig.endDate || !reportConfig.department}
            sx={{
              backgroundColor: '#ffd700',
              color: colors.grey[900],
              fontWeight: 'bold',
              '&:hover': {
                backgroundColor: '#e6c200'
              },
              '&.Mui-disabled': {
                backgroundColor: colors.grey[800],
                color: colors.grey[600]
              }
            }}
          >
            Generate Report
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
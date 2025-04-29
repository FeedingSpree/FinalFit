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

// Initialize pdfMake
pdfMake.vfs = vfs;

const CustomToolbar = ({ value, onChange }) => {
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

const ViolationHandling = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  
  const [records, setRecords] = useState([]);
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

  const violations = ["Cap", "Shorts", "Sleeveless"];

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
    setFilterModel(prev => ({
      ...prev,
      quickFilterValues: searchValue ? [searchValue] : []
    }));
  }, []);

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        setIsLoading(true);
        const fetchedRecords = await getStudentRecords();
        setRecords(fetchedRecords);
      } catch (error) {
        console.error("Error fetching records:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecords();
  }, []);

  const generateReport = async () => {
    try {
      const user = JSON.parse(sessionStorage.getItem("user"));
      const generatedBy = [user.first_name, user.last_name].filter(Boolean).join(' ');

      // Log the report generation
      await addUserLog({
        log_id: user.log_id,
        username: user.username,
        action: "Generated Violation Records Report",
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().split(' ')[0]
      });

      // Create table data from records
      const tableData = {
        table: {
          widths: ['*', '*', '*', '*', '*', '*'],
          body: [
            ['Student Name', 'Program', 'Year Level', 'Violation', 'Date', 'Department'],
            ...records.map(record => [
              record.name,
              record.program,
              record.yearLevel,
              record.violation,
              new Date(record.date).toLocaleDateString(undefined, {
                month: 'long',
                day: 'numeric',
                year: 'numeric'
              }),
              record.department
            ])
          ]
        }
      };

      // Create the PDF document definition
      const docDefinition = {
        pageMargins: [40, 60, 40, 60],
        footer: function(currentPage, pageCount) {
          return {
            text: `Page ${currentPage} of ${pageCount}`,
            alignment: 'right',
            margin: [0, 0, 40, 20],
            fontSize: 9,
            color: '#888'
          };
        },
        content: [
          // Colored header bar
          {
            canvas: [
              { type: 'rect', x: 0, y: 0, w: 515, h: 35, color: '#ffd700' }
            ],
            absolutePosition: { x: 40, y: 30 }
          },
          {
            text: 'Technological Institute of the Philippines - Quezon City',
            style: 'mainHeader',
            margin: [0, 10, 0, 0],
            alignment: 'center',
            color: '#222'
          },
          {
            text: 'Student Violation Records',
            style: 'subHeader',
            alignment: 'center',
            color: '#333'
          },
          {
            columns: [
              { text: `Generated by: ${generatedBy}`, style: 'meta' },
              { text: `Generated on: ${new Date().toLocaleString()}`, style: 'meta', alignment: 'right' }
            ],
            margin: [0, 10, 0, 10]
          },
          { canvas: [ { type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1, lineColor: '#ffd700' } ], margin: [0, 0, 0, 10] },
          { ...tableData, layout: 'zebra' }
        ],
        styles: {
          mainHeader: {
            fontSize: 18,
            bold: true,
            margin: [0, 16, 0, 4],
            color: '#222'
          },
          subHeader: {
            fontSize: 14,
            bold: true,
            margin: [0, 0, 0, 8],
            color: '#333'
          },
          meta: {
            fontSize: 10,
            color: '#555'
          }
        },
        defaultStyle: {
          fontSize: 10
        },
        tableLayouts: {
          zebra: {
            fillColor: function (rowIndex, node, columnIndex) {
              return rowIndex === 0
                ? '#ffd700'
                : rowIndex % 2 === 0
                ? '#f5f5f5'
                : null;
            },
            hLineColor: function(i, node) {
              return i === 0 ? '#ffd700' : '#ccc';
            },
            vLineColor: function(i, node) {
              return '#eee';
            }
          }
        }
      };

      pdfMake.createPdf(docDefinition).download('Student Violation Records.pdf');
    } catch (error) {
      console.error("Error generating report:", error);
    }
  };

  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [reportConfig, setReportConfig] = useState({
    timeframe: '',
    department: '',
    reportType: ''
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
      let startDate, endDate;
      const currentDate = new Date();
      
      switch (reportConfig.timeframe) {
        case 'weekly':
          startDate = new Date(currentDate);
          startDate.setDate(currentDate.getDate() - 7);
          endDate = currentDate;
          break;
        case 'monthly':
          startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
          endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
          break;
        case 'semestral':
          // Assuming semesters are Jun-Oct and Nov-Mar
          const currentMonth = currentDate.getMonth();
          if (currentMonth >= 5 && currentMonth <= 9) { // First semester
            startDate = new Date(currentDate.getFullYear(), 5, 1);
            endDate = new Date(currentDate.getFullYear(), 9, 31);
          } else { // Second semester
            startDate = currentMonth <= 4 
              ? new Date(currentDate.getFullYear() - 1, 10, 1)
              : new Date(currentDate.getFullYear(), 10, 1);
            endDate = currentMonth <= 4
              ? new Date(currentDate.getFullYear(), 2, 31)
              : new Date(currentDate.getFullYear() + 1, 2, 31);
          }
          break;
        case 'schoolYear':
          startDate = new Date(currentDate.getFullYear(), 5, 1); // June 1st
          endDate = new Date(currentDate.getFullYear() + 1, 4, 31); // May 31st
          break;
        default:
          startDate = reportConfig.startDate;
          endDate = reportConfig.endDate;
      }

      // Filter by date range
      filteredRecords = filteredRecords.filter(record => {
        const recordDate = new Date(record.date);
        return recordDate >= startDate && recordDate <= endDate;
      });

      // Create different content based on report type
      let reportContent = [];
      
      if (reportConfig.reportType === 'summary') {
        // Generate department-wise summary
        const summary = {};
        filteredRecords.forEach(record => {
          if (!summary[record.department]) {
            summary[record.department] = {
              total: 0,
              violations: { Cap: 0, Shorts: 0, Sleeveless: 0 }
            };
          }
          summary[record.department].total++;
          summary[record.department].violations[record.violation]++;
        });

        reportContent = [
          {
            text: 'Summary Statistics',
            style: 'sectionHeader',
            margin: [0, 20, 0, 10]
          },
          {
            table: {
              headerRows: 1,
              widths: ['*', 'auto', 'auto', 'auto', 'auto'],
              body: [
                [
                  { text: 'Department/Program', style: 'tableHeader' },
                  { text: 'Cap', style: 'tableHeader' },
                  { text: 'Shorts', style: 'tableHeader' },
                  { text: 'Sleeveless', style: 'tableHeader' },
                  { text: 'Total', style: 'tableHeader' }
                ],
                ...Object.entries(summary).map(([dept, data]) => [
                  { text: dept, style: 'tableCell' },
                  { text: data.violations.Cap, style: 'tableCell', alignment: 'right' },
                  { text: data.violations.Shorts, style: 'tableCell', alignment: 'right' },
                  { text: data.violations.Sleeveless, style: 'tableCell', alignment: 'right' },
                  { text: data.total, style: 'tableCell', alignment: 'right' }
                ])
              ]
            },
            layout: 'tableLayout'
          }
        ];
      } else {
        // Detailed report with all student records
        reportContent = [
          {
            text: 'Detailed Violation Records',
            style: 'sectionHeader',
            margin: [0, 20, 0, 10]
          },
          {
            table: {
              headerRows: 1,
              widths: ['*', '*', 'auto', 'auto', 'auto', 'auto'],
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
            layout: 'tableLayout'
          },
          {
            text: `Total Records: ${filteredRecords.length}`,
            style: 'totalRecords',
            margin: [0, 10, 0, 0],
            alignment: 'right'
          }
        ];
      }

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
        footer: {
          stack: [
            { canvas: [{ type: 'line', x1: 40, y1: 0, x2: 555.28, y2: 0, lineWidth: 1, lineColor: '#ffd700' }] },
            {
              columns: [
                { 
                  text: `Generated on: ${new Date().toLocaleString()}`,
                  fontSize: 8,
                  color: '#666',
                  margin: [40, 5, 0, 0]
                },
                {
                  text: `Page {page} of {totalPages}`,
                  fontSize: 8,
                  color: '#666',
                  alignment: 'right',
                  margin: [0, 5, 40, 0]
                }
              ]
            }
          ]
        },
        content: [
          {
            text: `${reportConfig.department === 'all' ? 'Overall' : reportConfig.department} Violation Report`,
            style: 'mainHeader',
            margin: [0, 20, 0, 10]
          },
          {
            columns: [
              { 
                stack: [
                  { text: `Report Period:`, style: 'label' },
                  { text: `Generated by:`, style: 'label' },
                  { text: `Department:`, style: 'label' },
                  { text: `Report Type:`, style: 'label' }
                ],
                width: 'auto'
              },
              { 
                stack: [
                  { text: `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`, style: 'value' },
                  { text: generatedBy, style: 'value' },
                  { text: reportConfig.department === 'all' ? 'All Departments' : reportConfig.department, style: 'value' },
                  { text: reportConfig.reportType === 'summary' ? 'Summary Report' : 'Detailed Report', style: 'value' }
                ],
                width: '*'
              }
            ],
            columnGap: 10,
            margin: [0, 0, 0, 20]
          },
          ...reportContent
        ],
        styles: {
          mainHeader: {
            fontSize: 24,
            bold: true,
            color: '#222',
            alignment: 'center'
          },
          sectionHeader: {
            fontSize: 18,
            bold: true,
            color: '#222',
            margin: [0, 15, 0, 5]
          },
          label: {
            fontSize: 11,
            color: '#666',
            margin: [0, 5, 0, 0]
          },
          value: {
            fontSize: 11,
            color: '#222',
            margin: [0, 5, 0, 0]
          },
          tableHeader: {
            fontSize: 11,
            bold: true,
            color: '#222',
            margin: [0, 5, 0, 5]
          },
          tableCell: {
            fontSize: 11,
            color: '#444',
            margin: [0, 5, 0, 5]
          },
          totalRecords: {
            fontSize: 12,
            bold: true,
            color: '#222'
          }
        },
        defaultStyle: {
          fontSize: 11,
          color: '#333'
        },
        tableLayouts: {
          tableLayout: {
            hLineWidth: function(i, node) {
              return (i === 0 || i === node.table.body.length) ? 2 : 1;
            },
            hLineColor: function(i, node) {
              return (i === 0 || i === node.table.body.length) ? '#ffd700' : '#dedede';
            },
            vLineWidth: function(i, node) {
              return (i === 0 || i === node.table.widths.length) ? 2 : 1;
            },
            vLineColor: function(i, node) {
              return (i === 0 || i === node.table.widths.length) ? '#ffd700' : '#dedede';
            },
            fillColor: function(rowIndex, node, columnIndex) {
              return (rowIndex === 0) ? '#ffd700' : (rowIndex % 2 === 0) ? '#f9f9f9' : null;
            },
            paddingLeft: function(i) { return 10; },
            paddingRight: function(i) { return 10; },
            paddingTop: function(i) { return 5; },
            paddingBottom: function(i) { return 5; }
          }
        }
      };

      // Create and download PDF
      pdfMake.createPdf(docDefinition).download(
        `${reportConfig.department}_${reportConfig.reportType}_Report_${reportConfig.timeframe}.pdf`
      );
      setIsReportDialogOpen(false);

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
              searchText,
              onChange: handleSearch,
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
                  onChange={(e) => handleInputChange('violation', e.target.value)}
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
                  {violations.map((violation) => (
                    <MenuItem key={violation} value={violation}>{violation}</MenuItem>
                  ))}
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
        onClose={() => setIsReportDialogOpen(false)}
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
            {/* Report Type Selection */}
            <div className="form-section">
              <Typography
                sx={{ 
                  color: colors.grey[100],
                  fontWeight: 'bold',
                  fontSize: '1rem',
                  marginBottom: '8px'
                }}
              >
                Select Report Type
              </Typography>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 2
                }}
              >
                {[
                  { value: 'summary', label: 'Summary Report', icon: '📊' },
                  { value: 'detailed', label: 'Detailed Report', icon: '📋' }
                ].map(option => (
                  <Button
                    key={option.value}
                    onClick={() => setReportConfig(prev => ({
                      ...prev,
                      reportType: option.value
                    }))}
                    sx={{
                      backgroundColor: reportConfig.reportType === option.value ? '#ffd700' : colors.grey[800],
                      color: reportConfig.reportType === option.value ? colors.grey[900] : colors.grey[100],
                      padding: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 1,
                      '&:hover': {
                        backgroundColor: reportConfig.reportType === option.value ? '#e6c200' : colors.grey[700]
                      }
                    }}
                  >
                    <Typography fontSize="24px">{option.icon}</Typography>
                    <Typography>{option.label}</Typography>
                  </Button>
                ))}
              </Box>
            </div>

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

            {/* Time Period Selection */}
            <div className="form-section">
              <Typography
                sx={{ 
                  color: colors.grey[100],
                  fontWeight: 'bold',
                  fontSize: '1rem',
                  marginBottom: '8px'
                }}
              >
                Select Time Period
              </Typography>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                  gap: 2
                }}
              >
                {[
                  { value: 'weekly', label: 'Weekly' },
                  { value: 'monthly', label: 'Monthly' },
                  { value: 'semestral', label: 'Semestral' },
                  { value: 'schoolYear', label: 'School Year' }
                ].map(option => (
                  <Button
                    key={option.value}
                    onClick={() => setReportConfig(prev => ({
                      ...prev,
                      timeframe: option.value
                    }))}
                    sx={{
                      backgroundColor: reportConfig.timeframe === option.value ? '#ffd700' : colors.grey[800],
                      color: reportConfig.timeframe === option.value ? colors.grey[900] : colors.grey[100],
                      padding: '12px',
                      '&:hover': {
                        backgroundColor: reportConfig.timeframe === option.value ? '#e6c200' : colors.grey[700]
                      }
                    }}
                  >
                    {option.label}
                  </Button>
                ))}
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
                timeframe: '',
                department: '',
                reportType: ''
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
            disabled={!reportConfig.timeframe || !reportConfig.department || !reportConfig.reportType}
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
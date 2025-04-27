import { Box, Button, IconButton, MenuItem, Select, Typography, useTheme } from "@mui/material";
import { tokens } from "../../theme";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import Header from "../../components/Header";
import { useEffect, useState } from "react";
import { getViolationLogs } from "../../services/violationLogsService.ts";
import { getDetectionLogs } from "../../services/detectionLogsService.ts";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";
import CustomDatePicker from "../../components/CustomDatePicker";
import pdfMake from 'pdfmake/build/pdfmake';
import vfs from 'pdfmake/build/vfs_fonts.js';
import html2canvas from "html2canvas";
import { getCalendarEvents } from "../../services/calendarService.ts";

pdfMake.vfs = vfs;
const VIOLATION_DISPLAY_NAMES = {
  no_sleeves: "Sleeveless",
  cap: "Cap",
  shorts: "Shorts"
};

const calculatePercentageChange = (violations) => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  // Format dates to match your data format
  const todayStr = today.toISOString().split('T')[0];
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  
  // Count violations for today and yesterday
  const todayCount = violations.filter(v => v.date === todayStr).length;
  const yesterdayCount = violations.filter(v => v.date === yesterdayStr).length;
  
  if (yesterdayCount === 0) return { percent: 0, increased: false };
  
  const percentChange = ((todayCount - yesterdayCount) / yesterdayCount) * 100;
  return {
    percent: Math.abs(Math.round(percentChange)),
    increased: percentChange > 0
  };
};

const calculateUniformPercentageChange = (detections) => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const todayStr = today.toISOString().split('T')[0];
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  
  const todayCount = detections.filter(d => d.date === todayStr).length;
  const yesterdayCount = detections.filter(d => d.date === yesterdayStr).length;
  
  if (yesterdayCount === 0) return { percent: 0, increased: false };
  
  const percentChange = ((todayCount - yesterdayCount) / yesterdayCount) * 100;
  return {
    percent: Math.abs(Math.round(percentChange)),
    increased: percentChange > 0
  };
};

const Dashboard = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [violations, setViolations] = useState([]);
  const [detections, setDetections] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [timeframe, setTimeframe] = useState("week");
  const [dateRange, setDateRange] = useState(() => {
    const today = new Date();
    const fromDate = new Date();
    fromDate.setDate(today.getDate() - 6); // Set to 6 days before today
    
    return {
      startDate: fromDate.toISOString().split('T')[0],
      endDate: today.toISOString().split('T')[0]
    };
  });
  const generateReport = async () => {
    // Capture chart images
    const violationsChartImg = await getChartImage('.violations-chart');
    const violationsRatioImg = await getChartImage('.violations-ratio-chart');
    const mostCommonViolationsImg = await getChartImage('.most-common-violations-chart');
    const uniformTypeImg = await getChartImage('.uniform-type-chart');

    // Violations Chart Table: Add header row
    const violationsChartHeader = ['Date', 'Hats/Caps', 'Shorts', 'Sleeveless'];
    const violationsChartBody = formatData().map((row) => [
      row.name,
      row.cap,
      row.shorts,
      row.no_sleeves
    ]);
    const violationsChartTable = {
      table: {
        widths: [100, 100, 100, 100],
        body: [
          violationsChartHeader,
          ...violationsChartBody
        ]
      }
    };

    // Violations Ratio Table: Show percentage
    const filteredViolations = violations.filter(v => isDateInRange(v.date));
    const totalViolations = filteredViolations.length || 1; // avoid division by zero
    const ratioData = calculateViolationsRatio().map((row) => [
      row.name,
      `${((row.value / totalViolations) * 100).toFixed(2)}%`
    ]);
    const violationsRatioTable = {
      table: {
        widths: [100, 100],
        body: [
          ['Type', 'Percentage'],
          ...ratioData
        ]
      }
    };

    // Most Common Violations Table (already has header)
    const mostCommonViolationsTable = {
      table: {
        widths: [100, 100],
        body: [
          ['Type', 'Value'],
          ...calculateViolationRanking().map((row) => [row.name, row.value])
        ]
      }
    };

    // Uniform Type Distribution Table: Add header row
    const uniformTypeHeader = ['Type', 'Male', 'Female'];
    const uniformTypeBody = calculateUniformDetections().map((row) => [
      row.name,
      row.male,
      row.female
    ]);
    const uniformTypeTable = {
      table: {
        widths: [100, 100, 100],
        body: [
          uniformTypeHeader,
          ...uniformTypeBody
        ]
      }
    };

    // PDF definition
    const user = JSON.parse(sessionStorage.getItem("user"));
    const generatedBy = user ? `${user.first_name} ${user.last_name}` : "Unknown";
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
          text: 'Violation and Compliance Report',
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
        {
          text: `Date Range: ${getDateRangeText()}`,
          style: 'meta',
          margin: [0, 0, 0, 10]
        },

        { canvas: [ { type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1, lineColor: '#ffd700' } ], margin: [0, 0, 0, 10] },

        // Violations Chart Section
        { text: 'Violations Chart', style: 'sectionHeader', margin: [0, 10, 0, 5] },
        violationsChartImg ? { image: violationsChartImg, width: 450, margin: [0, 0, 0, 10] } : {},
        { ...violationsChartTable, layout: 'zebra' },

        // Violations Ratio Section
        { text: 'Violations Ratio', style: 'sectionHeader', margin: [0, 15, 0, 5] },
        violationsRatioImg ? { image: violationsRatioImg, width: 300, margin: [0, 0, 0, 10] } : {},
        { ...violationsRatioTable, layout: 'zebra' },

        // Most Common Violations Section
        { text: 'Most Common Violations', style: 'sectionHeader', margin: [0, 15, 0, 5] },
        mostCommonViolationsImg ? { image: mostCommonViolationsImg, width: 400, margin: [0, 0, 0, 10] } : {},
        { ...mostCommonViolationsTable, layout: 'zebra' },

        // Uniform Type Distribution Section
        { text: 'Uniform Type Distribution', style: 'sectionHeader', margin: [0, 15, 0, 5] },
        uniformTypeImg ? { image: uniformTypeImg, width: 400, margin: [0, 0, 0, 10] } : {},
        { ...uniformTypeTable, layout: 'zebra' },
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
        sectionHeader: {
          fontSize: 13,
          bold: true,
          color: '#222',
          margin: [0, 10, 0, 4]
        },
        meta: {
          fontSize: 10,
          color: '#555'
        }
      },
      defaultStyle: {
        fontSize: 10
      },
      // Zebra layout for tables
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
  
    pdfMake.createPdf(docDefinition).download('Dress Code Violations Report.pdf');
  };
  // Add getDateRangeText function here
  const getDateRangeText = () => {
    const start = new Date(dateRange.startDate);
    const end = new Date(dateRange.endDate);
    return `${start.toLocaleDateString(undefined, { 
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })} - ${end.toLocaleDateString(undefined, { 
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })}`;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [violationLogs, detectionLogs, events] = await Promise.all([
          getViolationLogs(),
          getDetectionLogs(),
          getCalendarEvents()
        ]);
        setViolations(violationLogs);
        setDetections(detectionLogs);
        setCalendarEvents(events);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
  }, []);

  // Add this helper function
  const isDateInRange = (date) => {
    const checkDate = new Date(date);
    const start = new Date(dateRange.startDate);
    const end = new Date(dateRange.endDate);
    return checkDate >= start && checkDate <= end;
  };

  // Add this helper function after your existing helper functions
  const getDateInterval = (start, end) => {
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 7) return { unit: 'day', step: 1 }; // Show every day
    if (diffDays <= 31) return { unit: 'day', step: 2 }; // Show every other day
    if (diffDays <= 90) return { unit: 'week', step: 1 }; // Show weekly
    if (diffDays <= 365) return { unit: 'month', step: 1 }; // Show monthly
    return { unit: 'month', step: 3 }; // Show quarterly
  };

  // Update your formatData function
  const formatData = () => {
    const start = new Date(dateRange.startDate);
    const end = new Date(dateRange.endDate);
    const interval = getDateInterval(start, end);
    
    let dates = [];
    if (interval.unit === 'day') {
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      dates = Array.from({ length: Math.ceil(diffDays / interval.step) + 1 }, (_, i) => {
        const date = new Date(start);
        date.setDate(date.getDate() + (i * interval.step));
        return {
          fullDate: date.toISOString().split('T')[0],
          display: date.toLocaleDateString(undefined, { 
            month: 'short',
            day: 'numeric'
          })
        };
      });
    } else if (interval.unit === 'week') {
      let current = new Date(start);
      while (current <= end) {
        dates.push({
          fullDate: current.toISOString().split('T')[0],
          display: `W${Math.ceil((current.getDate() + current.getDay()) / 7)} ${current.toLocaleDateString(undefined, { 
            month: 'short'
          })}`
        });
        current.setDate(current.getDate() + 7);
      }
    } else if (interval.unit === 'month') {
      let current = new Date(start.getFullYear(), start.getMonth(), 1);
      while (current <= end) {
        dates.push({
          fullDate: current.toISOString().split('T')[0],
          display: current.toLocaleDateString(undefined, { 
            month: 'short',
            year: 'numeric'
          })
        });
        current.setMonth(current.getMonth() + interval.step);
      }
    }

    const grouped = {};
    dates.forEach(date => {
      grouped[date.display] = {
        name: date.display,
        cap: 0,
        shorts: 0,
        no_sleeves: 0
      };
    });

    // Aggregate violations based on interval
    violations.forEach(v => {
      if (isDateInRange(v.date)) {
        const vDate = new Date(v.date);
        let key;
        
        if (interval.unit === 'day') {
          key = vDate.toLocaleDateString(undefined, { 
            month: 'short',
            day: 'numeric'
          });
        } else if (interval.unit === 'week') {
          key = `W${Math.ceil((vDate.getDate() + vDate.getDay()) / 7)} ${vDate.toLocaleDateString(undefined, { 
            month: 'short'
          })}`;
        } else if (interval.unit === 'month') {
          key = vDate.toLocaleDateString(undefined, { 
            month: 'short',
            year: 'numeric'
          });
        }

        if (grouped[key]) {
          if (v.violation === "cap") grouped[key].cap += 1;
          if (v.violation === "shorts") grouped[key].shorts += 1;
          if (v.violation === "no_sleeves") grouped[key].no_sleeves += 1;
        }
      }
    });

    return Object.values(grouped);
  };

  // PIE CHART
  const calculateViolationsRatio = () => {
    const filteredViolations = violations.filter(v => isDateInRange(v.date));
    const totals = filteredViolations.reduce((acc, violation) => {
      const type = violation.violation;
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    const COLORS = ['#8884d8', '#82ca9d', '#ff6b6b'];
    
    return Object.entries(totals).map(([name, value], index) => ({
      name: VIOLATION_DISPLAY_NAMES[name] || name.charAt(0).toUpperCase() + name.slice(1),
      value,
      color: COLORS[index]
    }));
  };
  // BAR CHART
  const calculateViolationRanking = () => {
    const filteredViolations = violations.filter(v => isDateInRange(v.date));
    const totals = filteredViolations.reduce((acc, violation) => {
      const type = violation.violation;
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(totals)
      .map(([name, value]) => ({
        name: VIOLATION_DISPLAY_NAMES[name] || name.charAt(0).toUpperCase() + name.slice(1),
        value
      }))
      .sort((a, b) => b.value - a.value); // Sort by value in descending order
  };

  const calculateUniformDetections = () => {
    const filteredDetections = detections.filter(d => isDateInRange(d.date));
    // For year view, combine all detections into two categories
    if (timeframe === "year") {
      const yearTotals = {
        "PE": { name: "PE Uniform", male: 0, female: 0 },
        "Regular": { name: "Regular Uniform", male: 0, female: 0 },
        
      };

      filteredDetections.forEach(detection => {
        if (detection && detection.detection) {
          if (detection.detection.includes("Male PE")) {
            yearTotals["PE"].male++;
          } else if (detection.detection.includes("Female PE")) {
            yearTotals["PE"].female++;
          } else if (detection.detection.includes("Male Regular")) {
            yearTotals["Regular"].male++;
          } else if (detection.detection.includes("Female Regular")) {
            yearTotals["Regular"].female++;
          }
        }
      });

      return Object.values(yearTotals);
    }

    // For week and month views, keep existing logic
    const totals = {
      "PE Uniform": { name: "PE Uniform", male: 0, female: 0 },
      "Regular Uniform": { name: "Regular Uniform", male: 0, female: 0 }
    };

    filteredDetections.forEach(detection => {
      if (detection && detection.detection) {
        if (detection.detection.includes("Male PE")) {
          totals["PE Uniform"].male++;
        } else if (detection.detection.includes("Female PE")) {
          totals["PE Uniform"].female++;
        } else if (detection.detection.includes("Male Regular")) {
          totals["Regular Uniform"].male++;
        } else if (detection.detection.includes("Female Regular")) {
          totals["Regular Uniform"].female++;
        }
      }
    });

    return Object.values(totals);
  };

  // Helper to get base64 image from a DOM node (chart container)
  const getChartImage = async (selector) => {
    const node = document.querySelector(selector);
    if (!node) return null;
    const canvas = await html2canvas(node, { backgroundColor: null });
    return canvas.toDataURL("image/png");
  };

  // Add this helper function
  const getTodaysEvents = () => {
    const today = new Date();
    const todayFormatted = `${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}-${today.getFullYear()}`;

    return calendarEvents.filter(event => {
      const startDate = new Date(convertMMDDYYYYToDate(event.start_date));
      const endDate = new Date(convertMMDDYYYYToDate(event.end_date));
      const todayDate = new Date(convertMMDDYYYYToDate(todayFormatted));
      
      return todayDate >= startDate && todayDate <= endDate;
    });
  };

  // Add this helper function for date conversion
  const convertMMDDYYYYToDate = (dateString) => {
    if (!dateString) return null;
    const [month, day, year] = dateString.split('-');
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  };

  return (
    <Box m="30px">
      {/* HEADER */}
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Header title="Dashboard"/>
        <Box display="flex" alignItems="center" gap="20px">
          <Box display="flex" alignItems="center" gap="20px">
            {/* From Date Picker */}
            <Box display="flex" alignItems="center">
              <Typography
                variant="body2"
                color={colors.grey[100]}
                sx={{ minWidth: '40px' }}
              >
                From:
              </Typography>
              <CustomDatePicker
                value={dateRange.startDate}
                onChange={(newDate) => setDateRange(prev => ({
                  ...prev,
                  startDate: newDate
                }))}
              />
            </Box>

            {/* To Date Picker */}
            <Box display="flex" alignItems="center">
              <Typography
                variant="body2"
                color={colors.grey[100]}
                sx={{ minWidth: '40px' }}
              >
                To:
              </Typography>
              <CustomDatePicker
                value={dateRange.endDate}
                onChange={(newDate) => setDateRange(prev => ({
                  ...prev,
                  endDate: newDate
                }))}
              />
            </Box>
          </Box>
          <Button
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
  onClick={generateReport}
>
  <DownloadOutlinedIcon sx={{ mr: "10px" }} />
  Download Reports
</Button>
        </Box>
      </Box>
      {/* GRID & CHARTS */}
      <Box
        display="grid"
        gridTemplateColumns="repeat(12, 1fr)"
        gridAutoRows="minmax(150px, auto)"
        gap="10px"
      >
        {/* Today's Events Card */}
        <Box
          gridColumn="span 3"
          gridRow="span 2"
          backgroundColor={colors.grey[900]}
          p="20px"
          borderRadius="16px"
          display="flex"
          flexDirection="column"
        >
          {/* Date Container */}
          <Box 
            display="flex" 
            flexDirection="column" 
            alignItems="center" 
            mb={3}
          >
            {/* Large Day Number */}
            <Typography 
              variant="h1" 
              color={colors.grey[100]}
              sx={{ 
                fontSize: "72px", 
                fontWeight: "bold",
                lineHeight: 1,
                marginBottom: "8px"
              }}
            >
              {new Date().getDate()}
            </Typography>
            
            {/* Month and Year */}
            <Typography 
              variant="h5" 
              color={colors.grey[300]}
              sx={{ 
                fontWeight: "medium",
                textAlign: "center"
              }}
            >
              {new Date().toLocaleDateString(undefined, {
                weekday: 'long',
                month: 'long',
                year: 'numeric'
              })}
            </Typography>
          </Box>

          {/* Events Section */}
          <Box flexGrow={1}>
            <Typography 
              variant="h4" 
              fontWeight="bold" 
              color={colors.grey[100]} 
              mb={2}
              sx={{ borderBottom: `2px solid ${colors.grey[800]}`, paddingBottom: "8px" }}
            >
              Today's Events
            </Typography>
            
            <Box sx={{ 
              maxHeight: "calc(100% - 40px)", 
              overflowY: "auto",
              '&::-webkit-scrollbar': {
                width: '6px',
              },
              '&::-webkit-scrollbar-track': {
                background: colors.grey[800],
                borderRadius: '3px',
              },
              '&::-webkit-scrollbar-thumb': {
                background: colors.grey[600],
                borderRadius: '3px',
              }
            }}>
              {getTodaysEvents().length > 0 ? (
                getTodaysEvents().map((event) => (
                  <Box
                    key={event.id}
                    sx={{
                      backgroundColor: event.color || colors.primary[400],
                      borderRadius: "8px",
                      padding: "12px",
                      marginBottom: "8px",
                      opacity: 0.9,
                      transition: "all 0.2s ease",
                      border: `1px solid ${event.color || colors.primary[400]}`,
                      '&:hover': {
                        opacity: 1,
                      }
                    }}
                  >
                    <Typography 
                      variant="h5" 
                      color={colors.grey[100]}
                    >
                      {event.event_name}
                    </Typography>
                  </Box>
                ))
              ) : (
                <Typography 
                  variant="body1" 
                  color={colors.grey[300]} 
                  sx={{ 
                    fontStyle: 'italic',
                    textAlign: 'center',
                    marginTop: "20px"
                  }}
                >
                  No events scheduled for today
                </Typography>
              )}
            </Box>
          </Box>
        </Box>
{/* Analytics Cards */}
<Box
          gridColumn="span 2"
          gridRow="span 2"
          display="grid"
          gap="10px"
        >
          {/* Violations Analytics Card */}
          <Box
            backgroundColor={colors.grey[900]}
            borderRadius="16px"
            p="20px"
            display="flex"
            flexDirection="column"
            justifyContent="space-between"
          >
            <Box>
              <Typography
                variant="h3"
                fontWeight="bold"
                color={colors.grey[100]}
                mb={1}
              >
                Violations
              </Typography>
              <Typography
                variant="body2"
                color={colors.grey[300]}
              >
                Compared to yesterday
              </Typography>
            </Box>
            <Box
              alignSelf="flex-end"
            >
              {(() => {
                const change = calculatePercentageChange(violations);
                return (
                  <Typography
                    sx={{
                      color: !change.increased ? '#4caf50' : '#f44336',
                      display: 'flex',
                      alignItems: 'center',
                      fontSize: '50px', 
                      fontWeight: 'bold'
                    }}
                  >
                    {!change.increased ? '↓' : '↑'} {change.percent}%
                  </Typography>
                );
              })()}
            </Box>
          </Box>

          {/* Compliance Analytics Card */}
          <Box
            backgroundColor={colors.grey[900]}
            borderRadius="16px"
            p="20px"
            display="flex"
            flexDirection="column"
            justifyContent="space-between"
          >
            <Box>
              <Typography
                variant="h3"
                fontWeight="bold"
                color={colors.grey[100]}
                mb={1}
              >
                Compliance
              </Typography>
              <Typography
                variant="body2"
                color={colors.grey[300]}
              >
                Compared to yesterday
              </Typography>
            </Box>
            <Box
              alignSelf="flex-end"
            >
              {(() => {
                const change = calculateUniformPercentageChange(detections);
                return (
                  <Typography
                    sx={{
                      color: change.increased ? '#4caf50' : '#f44336',
                      display: 'flex',
                      alignItems: 'center',
                      fontSize: '50px', 
                      fontWeight: 'bold'
                    }}
                  >
                    {change.increased ? '↑' : '↓'} {change.percent}%
                  </Typography>
                );
              })()}
            </Box>
          </Box>
        </Box>
        {/* Dress Code Violations LINE CHART */}
        <Box
          gridColumn="span 7"
          gridRow="span 2"
          backgroundColor={colors.grey[900]}
          p="20px"
          borderRadius="16px"
        >
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h3" fontWeight="bold" color={colors.grey[100]} paddingBottom={"10px"}>
              Dress Code Violations
            </Typography>
          </Box>
          <Box height="300px" mt="20px">
            <div className="violations-chart" style={{ width: "100%", height: "100%" }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={formatData()} margin={{ top: 5, right: 30, left: 20, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.8} />
                  <XAxis 
                    dataKey="name"
                    angle={-45}
                    textAnchor="end"
                    height={70}
                    interval={0}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis />
                  <Tooltip 
                    formatter={(value, name) => [
                      value, 
                      VIOLATION_DISPLAY_NAMES[name] || name
                    ]} 
                  />
                  <Legend />
                  <Line type="monotone" dataKey="cap" name="Cap" stroke="#82ca9d" />
                  <Line type="monotone" dataKey="shorts" name="Shorts" stroke="#8884d8" />
                  <Line type="monotone" dataKey="no_sleeves" name="Sleeveless" stroke="#ff6b6b" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Box>
        </Box>

        {/* Violations Ratio PIE CHART */}
        <Box
          gridColumn="span 4"
          gridRow="span 2"
          backgroundColor={colors.grey[900]}
          p="20px"
          borderRadius="16px"
        >
          <Box display="flex" justifyContent="space-between" alignItems="center" flexDirection="column">
            <Box display="flex" justifyContent="space-between" alignItems="center" width="100%">
              <Typography variant="h3" fontWeight="bold" color={colors.grey[100]}>
                Violations Ratio
              </Typography>
            </Box>
          </Box>
          <Box height="260px" mt="25px" display="flex" flexDirection="column" alignItems="center" justifyContent="center">
            <div className="violations-ratio-chart" style={{ width: "100%", height: "100%" }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={calculateViolationsRatio()}
                    cx="50%"
                    cy="55%"
                    labelLine={true}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={90}
                    fill="#8884d8"
                    dataKey="value"
                    startAngle={90}
                    endAngle={-270}
                  >
                    {calculateViolationsRatio().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value, name) => [
                      `${value} violations`, 
                      name
                    ]} 
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Box>
        </Box>

        {/* MOST COMMON VIOLATIONS BAR CHART */}
        <Box
          gridColumn="span 4"
          gridRow="span 2"
          backgroundColor={colors.grey[900]}
          p="20px"
          borderRadius="16px"
        >
          <Box display="flex" justifyContent="space-between" alignItems="center" flexDirection="column">
            <Box display="flex" justifyContent="space-between" alignItems="center" width="100%">
              <Typography variant="h3" fontWeight="bold" color={colors.grey[100]}>
                Most Common Violations
              </Typography>
            </Box>
            <Typography variant="subtitle2" color={colors.grey[300]}>
              {getDateRangeText(timeframe)}
            </Typography>
          </Box>
          <Box height="260px" mt="25px">
            <div className="most-common-violations-chart" style={{ width: "100%", height: "100%" }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={calculateViolationRanking()}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.8} />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value) => [
                      `${value} violations`, 
                      "Total"
                    ]} 
                  />
                  <Bar dataKey="value" fill={colors.blueAccent[500]}>
                    {calculateViolationRanking().map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={index === 0 ? '#ff0000' : 
                              index === 1 ? '#ffa500' : 
                              '#ffff00'} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Box>
        </Box>

        {/* UNIFORM DETECTIONS CHART */}
        <Box
          gridColumn="span 4"
          gridRow="span 2"
          backgroundColor={colors.grey[900]}
          p="20px"
          borderRadius="16px"
        >
          <Box display="flex" justifyContent="space-between" alignItems="center" flexDirection="column">
            <Box display="flex" justifyContent="space-between" alignItems="center" width="100%">
              <Typography variant="h3" fontWeight="bold" color={colors.grey[100]}>
                Uniform Type Distribution
              </Typography>
            </Box>
            <Typography variant="subtitle2" color={colors.grey[300]}>
              {getDateRangeText(timeframe)}
            </Typography>
          </Box>
          <Box height="260px" mt="25px">
            <div className="uniform-type-chart" style={{ width: "100%", height: "100%" }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={calculateUniformDetections()}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.8} />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value, name) => [`${value} detections`, name]} />
                  <Legend />
                  <Bar 
                    dataKey="male" 
                    name="Male" 
                    fill={colors.blueAccent[500]} 
                    stackId="a"
                  />
                  <Bar 
                    dataKey="female" 
                    name="Female" 
                    fill={colors.redAccent[600]} 
                    stackId="a"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default Dashboard;
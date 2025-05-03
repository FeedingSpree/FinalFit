import { Box, Button, Typography, useTheme, Tooltip as MuiTooltip } from "@mui/material";
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
import { addUserLog } from "../../services/userLogsService.ts";

pdfMake.vfs = vfs;
const VIOLATION_DISPLAY_NAMES = {
  no_sleeves: "Sleeveless",
  cap: "Cap",
  shorts: "Shorts"
};

// First, update the calculatePercentageChange function to include actual numbers
const calculatePercentageChange = (violations) => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const todayStr = today.toISOString().split('T')[0];
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  
  const todayCount = violations.filter(v => v.date === todayStr).length;
  const yesterdayCount = violations.filter(v => v.date === yesterdayStr).length;
  
  if (yesterdayCount === 0) return { 
    percent: 0, 
    increased: false,
    todayCount,
    yesterdayCount,
    difference: todayCount - yesterdayCount 
  };
  
  const percentChange = ((todayCount - yesterdayCount) / yesterdayCount) * 100;
  return {
    percent: Math.abs(Math.round(percentChange)),
    increased: percentChange > 0,
    todayCount,
    yesterdayCount,
    difference: Math.abs(todayCount - yesterdayCount)
  };
};

// Update the calculateUniformPercentageChange function similarly
const calculateUniformPercentageChange = (detections) => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const todayStr = today.toISOString().split('T')[0];
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  
  const todayCount = detections.filter(d => d.date === todayStr).length;
  const yesterdayCount = detections.filter(d => d.date === yesterdayStr).length;
  
  if (yesterdayCount === 0) return { 
    percent: 0, 
    increased: false,
    todayCount,
    yesterdayCount,
    difference: todayCount - yesterdayCount 
  };
  
  const percentChange = ((todayCount - yesterdayCount) / yesterdayCount) * 100;
  return {
    percent: Math.abs(Math.round(percentChange)),
    increased: percentChange > 0,
    todayCount,
    yesterdayCount,
    difference: Math.abs(todayCount - yesterdayCount)
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
    today.setHours(12, 0, 0, 0); // Set to noon
    
    const fromDate = new Date(today);
    fromDate.setDate(today.getDate() - 6);
    fromDate.setHours(12, 0, 0, 0); // Set to noon
    
    return {
      startDate: fromDate.toISOString().slice(0, 10),
      endDate: today.toISOString().slice(0, 10)
    };
  });
  const generateReport = async () => {
    try {
      const user = JSON.parse(sessionStorage.getItem("user"));
      const generatedBy = [user.first_name, user.last_name].filter(Boolean).join(' ');

      // Log the report generation
      await addUserLog({
        log_id: user.log_id,
        username: user.username,
        action: "Generated Dashboard Report",
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().split(' ')[0]
      });

      const violationsChartImg = await getChartImage('.violations-chart');
      const violationsRatioImg = await getChartImage('.violations-ratio-chart');
      const mostCommonViolationsImg = await getChartImage('.most-common-violations-chart');
      const uniformTypeImg = await getChartImage('.uniform-type-chart');

      // Fix the tables data structure
      const violationsChartTable = {
        table: {
          headerRows: 1,
          widths: ['*', '*', '*', '*'],
          body: [
            ['Date', 'Hats/Caps', 'Shorts', 'Sleeveless'],
            ...formatData().map(row => [
              row.name,
              row.cap,
              row.shorts,
              row.no_sleeves
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
        pageBreak: 'avoid',
        margin: [0, 10, 0, 20],
        alignment: 'center'
      };

      const violationsRatioData = calculateViolationsRatio().map(row => [
        row.name,
        `${((row.value / violations.length) * 100).toFixed(2)}%`
      ]);

      const violationsRatioTable = {
        table: {
          headerRows: 1,
          widths: ['*', '*'],
          body: [
            ['Type', 'Percentage'],
            ...violationsRatioData
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
        pageBreak: 'avoid',
        margin: [50, 10, 50, 20],
        alignment: 'center'
      };

      const mostCommonViolationsTable = {
        table: {
          headerRows: 1,
          widths: ['*', '*'],
          alignment: 'center',
          body: [
            ['Violation Type', 'Count'],
            ...calculateViolationRanking().map(row => [
              row.name,
              row.value
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
        pageBreak: 'avoid',
        margin: [20, 10, 20, 20],
        alignment: 'center'
      };

      const uniformTypeTable = {
        table: {
          headerRows: 1,
          widths: ['*', '*', '*'],
          body: [
            ['Uniform Type', 'Male', 'Female'],
            ...calculateUniformDetections().map(row => [
              row.name,
              row.male,
              row.female
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
        pageBreak: 'avoid',
        margin: [20, 10, 20, 20],
        alignment: 'center'
      };

      // Create the PDF document definition
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
                  text: 'Dress Code Violation Monitoring System',
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
              { canvas: [{ type: 'line', x1: 40, y1: 0, x2: 555.28, y2: 0, lineWidth: 1, lineColor: '#ffd700' }] },
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
            text: 'Analytics Report',
            style: 'mainHeader',
            margin: [0, 20, 0, 10]
          },
          // Charts sections with improved spacing and descriptions
          { text: 'Violation Trends Analysis', style: 'sectionHeader', margin: [0, 30, 0, 10] },
          { text: 'Daily breakdown of dress code violations by type', style: 'sectionDescription' },
          violationsChartImg ? { 
            image: violationsChartImg, 
            width: 500, 
            alignment: 'center', 
            margin: [0, 10, 0, 20] 
          } : {},
          violationsChartTable,

          { text: 'Violation Distribution', style: 'sectionHeader', margin: [0, 30, 0, 10], pageBreak: 'before' },
          { text: 'Percentage breakdown of violation types', style: 'sectionDescription' },
          violationsRatioImg ? { 
            image: violationsRatioImg, 
            width: 500, 
            alignment: 'center', 
            margin: [0, 10, 0, 20] 
          } : {},
          violationsRatioTable,

          { text: 'Most Common Violations', style: 'sectionHeader', margin: [0, 30, 0, 10], pageBreak: 'before' },
          { text: 'Ranking of violations by frequency', style: 'sectionDescription' },
          mostCommonViolationsImg ? {
            image: mostCommonViolationsImg,
            width: 500,
            alignment: 'center',
            margin: [0, 10, 0, 20]
          } : {},
          mostCommonViolationsTable,

          { text: 'Uniform Compliance Analysis', style: 'sectionHeader', margin: [0, 30, 0, 10], pageBreak: 'before' },
          { text: 'Gender-based distribution of uniform compliance', style: 'sectionDescription' },
          uniformTypeImg ? { 
            image: uniformTypeImg, 
            width: 500, 
            alignment: 'center', 
            margin: [0, 10, 0, 20] 
          } : {},
          uniformTypeTable,

          // Report Metadata and Summary (moved to end)
          { text: 'Report Information', style: 'sectionHeader', margin: [0, 30, 0, 10], pageBreak: 'before' },
          {
            columns: [
              { 
                stack: [
                  { text: `Report Period:`, style: 'label' },
                  { text: `Generated by:`, style: 'label' },
                ],
                width: 'auto'
              },
              { 
                stack: [
                  { text: getDateRangeText(), style: 'value' },
                  { text: generatedBy, style: 'value' },
                ],
                width: '*'
              }
            ],
            columnGap: 10,
            margin: [0, 0, 0, 20]
          },
          {
            stack: [
              { 
                text: 'Summary Statistics', 
                style: 'sectionHeader',
                margin: [0, 20, 0, 10]
              },
              {
                columns: [
                  {
                    width: '*',
                    table: {
                      widths: ['*', 'auto'],
                      body: [
                        [
                          { text: 'Total Violations', style: 'tableHeader' },
                          { text: violations.length, style: 'tableCell', alignment: 'right' }
                        ],
                        [
                          { text: 'Total Detections', style: 'tableHeader' },
                          { text: detections.length, style: 'tableCell', alignment: 'right' }
                        ],
                        [
                          { text: 'Compliance Rate', style: 'tableHeader' },
                          { 
                            text: `${((detections.length - violations.length) / detections.length * 100).toFixed(1)}%`, 
                            style: 'tableCell',
                            alignment: 'right'
                          }
                        ]
                      ]
                    },
                    layout: 'lightHorizontalLines'
                  },
                  { width: 20, text: '' },
                  {
                    width: '*',
                    table: {
                      widths: ['*', 'auto'],
                      body: [
                        [
                          { text: 'Most Common Violation', style: 'tableHeader' },
                          { text: calculateViolationRanking()[0]?.name || 'N/A', style: 'tableCell', alignment: 'right' }
                        ],
                        [
                          { text: 'Period Trend', style: 'tableHeader' },
                          { 
                            text: violations.length > 0 ? '↑ Increasing' : '↓ Decreasing', 
                            style: 'tableCell',
                            alignment: 'right'
                          }
                        ],
                        [
                          { text: 'Peak Violation Day', style: 'tableHeader' },
                          { text: formatData()[0]?.name || 'N/A', style: 'tableCell', alignment: 'right' }
                        ]
                      ]
                    },
                    layout: 'lightHorizontalLines'
                  }
                ]
              }
            ]
          }
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
          sectionDescription: {
            fontSize: 11,
            color: '#666',
            italics: true
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
  
      pdfMake.createPdf(docDefinition).download('Dress Code Violations Report.pdf');
    } catch (error) {
      console.error("Error generating report:", error);
    }
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

  // Update getDateInterval for better granularity
  const getDateInterval = (start, end) => {
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 31) return { unit: 'day', step: 1 }; // Show daily up to a month
    if (diffDays <= 90) return { unit: 'week', step: 1 }; // Show weekly up to 3 months
    return { unit: 'month', step: 1 }; // Show monthly for longer periods
  };

  // Update the formatData function
  const formatData = () => {
    const start = new Date(dateRange.startDate);
    const end = new Date(dateRange.endDate);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    
    const interval = getDateInterval(start, end);

    // Filter violations within date range and normalize dates
    const filteredViolations = violations.filter(v => {
      const vDate = new Date(v.date);
      vDate.setHours(0, 0, 0, 0);
      return vDate >= start && vDate <= end;
    });

    let dates = [];
    if (interval.unit === 'day') {
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + interval.step)) {
        dates.push({
          fullDate: new Date(d).toISOString().split('T')[0],
          display: new Date(d).toLocaleDateString(undefined, { 
            month: 'short',
            day: 'numeric'
          })
        });
      }
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
        current.setMonth(current.getMonth() + 1);
      }
    }

    // Initialize data points with zero counts
    const grouped = {};
    dates.forEach(date => {
      grouped[date.fullDate] = {
        name: date.display,
        cap: 0,
        shorts: 0,
        no_sleeves: 0,
        date: date.fullDate
      };
    });

    // Aggregate violations using normalized dates
    filteredViolations.forEach(violation => {
      const vDate = new Date(violation.date);
      vDate.setHours(0, 0, 0, 0);
      const dateKey = vDate.toISOString().split('T')[0];
      
      if (grouped[dateKey]) {
        if (violation.violation === "cap") grouped[dateKey].cap += 1;
        if (violation.violation === "shorts") grouped[dateKey].shorts += 1;
        if (violation.violation === "no_sleeves") grouped[dateKey].no_sleeves += 1;
      }
    });

    // Convert to array and ensure proper date sorting
    return Object.values(grouped).sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
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

  // Update the getTodaysEvents function
  const getTodaysEvents = () => {
    const today = new Date();
    const todayFormatted = `${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}-${today.getFullYear()}`;

    return calendarEvents.filter(event => {
      const startDate = new Date(convertMMDDYYYYToDate(event.start_date));
      // Create end date and subtract one day
      const endDate = new Date(convertMMDDYYYYToDate(event.end_date));
      endDate.setDate(endDate.getDate() - 1); // Subtract one day from end date
      
      const todayDate = new Date(convertMMDDYYYYToDate(todayFormatted));
      
      // Set all times to midnight for consistent comparison
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(0, 0, 0, 0);
      todayDate.setHours(0, 0, 0, 0);
      
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
      <Box display="flex" justifyContent="space-between" alignItems="center" paddingBottom={"20px"}>
        <Header title="Dashboard" />
        <Box display="flex" alignItems="center" gap="20px" paddingTop={"50px"}>
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
                onChange={(newDate) => {
                  setDateRange(prev => ({
                    ...prev,
                    startDate: newDate,
                    // Reset end date if it's before new start date
                    endDate: new Date(prev.endDate) < new Date(newDate) ? newDate : prev.endDate
                  }));
                }}
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
                onChange={(newDate) => {
                  setDateRange(prev => ({
                    ...prev,
                    endDate: newDate
                  }));
                }}
                minDate={dateRange.startDate} // Pass start date as minimum date
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
                <>
                  {getTodaysEvents().slice(0, 3).map((event) => (
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
                  ))}
                  {getTodaysEvents().length > 3 && (
                    <MuiTooltip
                      title={
                        <Box>
                          {getTodaysEvents()
                            .slice(3)
                            .map((event) => (
                              <Typography
                                key={event.id}
                                sx={{
                                  color: colors.grey[100],
                                  padding: "4px 0",
                                  fontSize: "0.875rem",
                                  whiteSpace: "nowrap"
                                }}
                              >
                                {event.event_name}
                              </Typography>
                            ))}
                        </Box>
                      }
                      arrow
                      placement="bottom"
                      componentsProps={{
                        tooltip: {
                          sx: {
                            bgcolor: colors.grey[800],
                            '& .MuiTooltip-arrow': {
                              color: colors.grey[800],
                            },
                          },
                        },
                      }}
                    >
                      <Typography 
                        variant="body1" 
                        color={colors.grey[300]} 
                        sx={{ 
                          textAlign: 'center',
                          marginTop: "8px",
                          fontStyle: 'italic',
                          cursor: 'pointer',
                          '&:hover': {
                            color: colors.grey[100],
                          }
                        }}
                      >
                        +{getTodaysEvents().length - 3} more event{getTodaysEvents().length - 3 > 1 ? 's' : ''}
                      </Typography>
                    </MuiTooltip>
                  )}
                </>
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
                Detected Violations
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
              display="flex"
              flexDirection="column"
              alignItems="flex-end"
            >
              {(() => {
                const change = calculatePercentageChange(violations);
                return (
                  <>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography
                        sx={{
                          color: !change.increased ? '#4caf50' : '#f44336',
                          display: 'flex',
                          alignItems: 'center',
                          fontSize: '36px', 
                          fontWeight: 'bold'
                        }}
                      >
                        {!change.increased ? '↓' : '↑'} {change.percent}%
                      </Typography>
                      <Typography
                        sx={{
                          color: !change.increased ? '#4caf50' : '#f44336',
                          fontSize: '20px',
                          fontWeight: 'medium',
                          opacity: 0.7
                        }}
                      >
                        ({!change.increased ? '-' : '+'}{change.difference})
                      </Typography>
                    </Box>
                  </>
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
                Uniform Compliance
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
              display="flex"
              flexDirection="column"
              alignItems="flex-end"
            >
              {(() => {
                const change = calculateUniformPercentageChange(detections);
                return (
                  <>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography
                        sx={{
                          color: change.increased ? '#4caf50' : '#f44336',
                          display: 'flex',
                          alignItems: 'center',
                          fontSize: '36px', 
                          fontWeight: 'bold'
                        }}
                      >
                        {change.increased ? '↑' : '↓'} {change.percent}%
                      </Typography>
                      <Typography
                        sx={{
                          color: change.increased ? '#4caf50' : '#f44336',
                          fontSize: '20px',
                          fontWeight: 'medium',
                          opacity: 0.7
                        }}
                      >
                        ({change.increased ? '+' : '-'}{change.difference})
                      </Typography>
                    </Box>
                  </>
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
              Dress Code Violation Trends
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
          <Box display="flex" justifyContent="sp ace-between" alignItems="center" flexDirection="column">
            <Box display="flex" justifyContent="space-between" alignItems="center" width="100%">
              <Typography variant="h3" fontWeight="bold" color={colors.grey[100]}>
                Dress Code Violations Ratio
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
                    cy="50%"
                    labelLine={true}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={90}
                    fill="#8884d8"
                    dataKey="value"
                    startAngle={60}
                    endAngle={-300}
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
                <Legend layout="vertical" verticalAlign="middle" align="right" />
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
                Common Dress Code Violations
              </Typography>
            </Box>
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
                Uniform Compliance Distribution
              </Typography>
            </Box>
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
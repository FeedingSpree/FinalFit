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

// Add this after the imports
const VIOLATION_DISPLAY_NAMES = {
  no_sleeves: "Sleeveless",
  cap: "Cap",
  shorts: "Shorts"
};

// Add these helper functions after your existing imports
const getDateRangeText = (timeframe) => {
  const today = new Date();
  const formatDate = (date) => {
    return date.toLocaleDateString(undefined, { 
      weekday: "short",
      month: "short",
      day: "numeric"
    });
  };

  switch (timeframe) {
    case "week": {
      const startDate = new Date();
      startDate.setDate(today.getDate() - 6);
      return `${formatDate(startDate)} - ${formatDate(today)}`;
    }
    case "month": {
      const monthAgo = new Date();
      monthAgo.setMonth(today.getMonth() - 1);
      return `${formatDate(monthAgo)} - ${formatDate(today)}`;
    }
    case "year": {
      return `Year ${today.getFullYear()}`;
    }
    default:
      return "";
  }
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

// First, add this helper function after calculatePercentageChange
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
  // Remove these individual timeframe states
  // const [timeframe, setTimeframe] = useState("week");
  // const [pieTimeframe, setPieTimeframe] = useState("week");
  // const [barTimeframe, setBarTimeframe] = useState("week");
  // const [uniformTimeframe, setUniformTimeframe] = useState("week");

  // Add single timeframe state
  const [timeframe, setTimeframe] = useState("week");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [violationLogs, detectionLogs] = await Promise.all([
          getViolationLogs(),
          getDetectionLogs()
        ]);
        setViolations(violationLogs);
        setDetections(detectionLogs);
      } catch (error) {
        console.error("Error fetching logs:", error);
      }
    };
    fetchData();
  }, []);

  const formatData = () => {
    const grouped = {};
    const today = new Date();

    if (timeframe === "month") {
      const grouped = {};
      const today = new Date();
      const monthAgo = new Date();
      monthAgo.setMonth(today.getMonth() - 1);

      // Get dates for the past month divided into weeks
      const weeks = [];
      let currentDate = new Date(monthAgo);
      
      while (currentDate <= today) {
        const weekStart = new Date(currentDate);
        const weekEnd = new Date(currentDate);
        weekEnd.setDate(weekEnd.getDate() + 6);

        if (weekEnd > today) {
          weeks.push({
            start: weekStart,
            end: today,
            label: `${weekStart.toLocaleDateString(undefined, { 
              month: 'short',
              day: 'numeric'
            })} - ${today.toLocaleDateString(undefined, { 
              month: 'short',
              day: 'numeric'
            })}`
          });
        } else {
          weeks.push({
            start: weekStart,
            end: weekEnd,
            label: `${weekStart.toLocaleDateString(undefined, { 
              month: 'short',
              day: 'numeric'
            })} - ${weekEnd.toLocaleDateString(undefined, { 
              month: 'short',
              day: 'numeric'
            })}`
          });
        }

        currentDate.setDate(currentDate.getDate() + 7);
      }

      // Initialize grouped data
      weeks.forEach(week => {
        grouped[week.label] = { 
          name: week.label, 
          cap: 0, 
          shorts: 0, 
          no_sleeves: 0 
        };
      });

      // Count violations for each week
      violations.forEach((v) => {
        const violationDate = new Date(`${v.date}T${v.time}`);
        
        const matchingWeek = weeks.find(
          week => violationDate >= week.start && violationDate <= week.end
        );

        if (matchingWeek) {
          const key = matchingWeek.label;
          if (v.violation === "cap") grouped[key].cap += 1;
          if (v.violation === "shorts") grouped[key].shorts += 1;
          if (v.violation === "no_sleeves") grouped[key].no_sleeves += 1;
        }
      });

      return weeks.map(week => grouped[week.label]);
    }

    if (timeframe === "week") {
      const grouped = {};
      const today = new Date();
    
      // Modified to include full date format
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(today.getDate() - (6 - i));
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return {
          fullDate: `${yyyy}-${mm}-${dd}`,
          // Format: "Mon, Apr 17"
          weekday: d.toLocaleDateString(undefined, { 
            weekday: "short",
            month: "short",
            day: "numeric"
          }),
        };
      });
    
      violations.forEach((v) => {
        const violationDateStr = v.date;
        const violationDate = new Date(`${v.date}T${v.time}`);
        const fullDateMatch = last7Days.find(day => day.fullDate === violationDateStr);
    
        let key = "";
    
        if (timeframe === "week" && fullDateMatch) {
          key = fullDateMatch.weekday;
        }
    
        if (key) {
          if (!grouped[key]) {
            grouped[key] = { name: key, cap: 0, shorts: 0, no_sleeves: 0 };
          }
    
          if (v.violation === "cap") grouped[key].cap += 1;
          if (v.violation === "shorts") grouped[key].shorts += 1;
          if (v.violation === "no_sleeves") grouped[key].no_sleeves += 1;
        }
      });
    
      return last7Days.map((day) =>
        grouped[day.weekday] || { name: day.weekday, cap: 0, shorts: 0, no_sleeves: 0 }
      );
    }
  
    if (timeframe === "year") {
      const grouped = {};
      const today = new Date();
    
      violations.forEach((v) => {
        const violationDate = new Date(`${v.date}T${v.time}`);
        const year = today.getFullYear();
        if (violationDate.getFullYear() === year) {
          const key = violationDate.toLocaleString("default", { month: "short" });
          if (!grouped[key]) {
            grouped[key] = { name: key, cap: 0, shorts: 0, no_sleeves: 0 };
          }
          if (v.violation === "cap") grouped[key].cap += 1;
          if (v.violation === "shorts") grouped[key].shorts += 1;
          if (v.violation === "no_sleeves") grouped[key].no_sleeves += 1;
        }
      });
    
      const months = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sept", "Oct", "Nov", "Dec"
      ];
      return months.map((month) => grouped[month] || { name: month, cap: 0, shorts: 0, no_sleeves: 0 });
    }
    return Object.values(grouped);
  };
  // PIE CHART
  const calculateViolationsRatio = () => {
    const today = new Date();
    
    const filteredViolations = violations.filter(v => {
      const violationDate = new Date(`${v.date}T${v.time}`);
      
      if (timeframe === "week") {
        // Create array of last 7 days including today
        const last7Days = Array.from({ length: 7 }, (_, i) => {
          const d = new Date();
          d.setDate(today.getDate() - (6 - i));
          const yyyy = d.getFullYear();
          const mm = String(d.getMonth() + 1).padStart(2, '0');
          const dd = String(d.getDate()).padStart(2, '0');
          return `${yyyy}-${mm}-${dd}`;
        });
        
        return last7Days.includes(v.date);
      }
      
      if (timeframe === "month") {
        const monthAgo = new Date();
        monthAgo.setMonth(today.getMonth() - 1);
        return violationDate >= monthAgo && violationDate <= today;
      }
      
      if (timeframe === "year") {
        return violationDate.getFullYear() === today.getFullYear();
      }

      return true;
    });

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
    const today = new Date();
    
    const filteredViolations = violations.filter(v => {
      const violationDate = new Date(`${v.date}T${v.time}`);
      
      if (timeframe === "week") {
        // Create array of last 7 days including today
        const last7Days = Array.from({ length: 7 }, (_, i) => {
          const d = new Date();
          d.setDate(today.getDate() - (6 - i));
          const yyyy = d.getFullYear();
          const mm = String(d.getMonth() + 1).padStart(2, '0');
          const dd = String(d.getDate()).padStart(2, '0');
          return `${yyyy}-${mm}-${dd}`;
        });
        
        return last7Days.includes(v.date);
      }
      
      if (timeframe === "month") {
        const monthAgo = new Date();
        monthAgo.setMonth(today.getMonth() - 1);
        return violationDate >= monthAgo && violationDate <= today;
      }
      
      if (timeframe === "year") {
        return violationDate.getFullYear() === today.getFullYear();
      }

      return true;
    });

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
    const today = new Date();
    
    const filteredDetections = detections.filter(d => {
      const detectionDate = new Date(`${d.date}T${d.time}`);
      
      if (timeframe === "week") {
        const last7Days = Array.from({ length: 7 }, (_, i) => {
          const d = new Date();
          d.setDate(today.getDate() - (6 - i));
          const yyyy = d.getFullYear();
          const mm = String(d.getMonth() + 1).padStart(2, '0');
          const dd = String(d.getDate()).padStart(2, '0');
          return `${yyyy}-${mm}-${dd}`;
        });
        
        return last7Days.includes(d.date);
      }
      
      if (timeframe === "month") {
        const monthAgo = new Date();
        monthAgo.setMonth(today.getMonth() - 1);
        return detectionDate >= monthAgo && detectionDate <= today;
      }
      
      if (timeframe === "year") {
        return detectionDate.getFullYear() === today.getFullYear();
      }
    });

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

  return (
    <Box m="30px">
      {/* HEADER */}
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Header title="Dashboard"/>
        <Box display="flex" alignItems="center" gap="20px">
          <Select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            sx={{
              backgroundColor: colors.primary[900],
              color: colors.grey[100],
              borderRadius: "5px",
              ".MuiOutlinedInput-notchedOutline": { border: 0 },
            }}
          >
            <MenuItem value="week">Previous Week</MenuItem>
            <MenuItem value="month">Previous Month</MenuItem>
            <MenuItem value="year">This Year</MenuItem>
          </Select>
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
          >
            <DownloadOutlinedIcon sx={{ mr: "10px" }} />
            Download Reports
          </Button>
        </Box>
      </Box>
      {/* GRID & CHARTS */}
      <Box
        display="grid"
        gridTemplateColumns="repeat(12, 1fr)"  // Changed from 30 to 12 columns
        gridAutoRows="minmax(150px, auto)"     // Changed fixed height to minmax
        gap="10px"                             // Reduced gap
      >
        {/* VIOLATIONS LINE CHART */}
        <Box
          gridColumn="span 6"                  // Take up 8/12 columns
          gridRow="span 2"                     // Take up 2 rows
          backgroundColor={colors.grey[900]}
          p="20px"
          borderRadius="16px"
        >
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h3" fontWeight="bold" color={colors.grey[100]}>
              Dress Code Violations
            </Typography>
          </Box>
          <Box height="300px" mt="20px">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={formatData()} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.8} />
                <XAxis dataKey="name" />
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
          </Box>
        </Box>

        {/* VIOLATIONS RATIO PIE CHART */}
        <Box
          gridColumn="span 4"                  // Take up 4/12 columns
          gridRow="span 2"                     // Take up 2 rows
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
            <Typography variant="subtitle2" color={colors.grey[300]}>
              {getDateRangeText(timeframe)}
            </Typography>
          </Box>
          <Box height="260px" mt="25px" display="flex" flexDirection="column" alignItems="center" justifyContent="center">
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
          </Box>
        </Box>
      {/* ANALYTICS CARDS */}
      <Box
        display="flex"
        flexDirection="column"
        gap="10px"
        gridColumn="span 2"
        gridRow="span 2"
      >
        {/* Violations Analytics Card */}
        <Box
          backgroundColor={colors.grey[900]}
          borderRadius="16px"
          p="20px"
          height="202px"
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
          height="202px"
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
        {/* MOST COMMON VIOLATIONS BAR CHART */}
        <Box
          gridColumn="span 5"                  // Take up 5/12 columns
          gridRow="span 2"                     // Take up 2 rows
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
          </Box>
        </Box>

        {/* UNIFORM DETECTIONS CHART */}
        <Box
          gridColumn="span 7"                  // Take up 7/12 columns
          gridRow="span 2"                     // Take up 2 rows
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
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default Dashboard;
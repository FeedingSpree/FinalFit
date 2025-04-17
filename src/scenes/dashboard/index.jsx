import { Box, Button, IconButton, MenuItem, Select, Typography, useTheme } from "@mui/material";
import { tokens } from "../../theme";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import Header from "../../components/Header";
import StatBox from "../../components/StatBox";
import SchoolIcon from "@mui/icons-material/School";
import WarningIcon from "@mui/icons-material/Warning";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RepeatIcon from "@mui/icons-material/Repeat";
import { useEffect, useState } from "react";
import { getViolationLogs } from "../../services/violationLogsService.ts";
import { db } from "../../firebase.tsx";
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
} from "recharts";

const Dashboard = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [violations, setViolations] = useState([]);
  const [timeframe, setTimeframe] = useState("month");
  const [pieTimeframe, setPieTimeframe] = useState("year");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const logs = await getViolationLogs();
        setViolations(logs);
      } catch (error) {
        console.error("Error fetching violation logs:", error);
      }
    };
    fetchData();
  }, []);

  const formatData = () => {
    const grouped = {};
    const today = new Date();

    if (timeframe === "month") {
      // Calculate week ranges
      const endOfWeek4 = new Date();
      const startOfWeek4 = new Date(endOfWeek4);
      startOfWeek4.setDate(endOfWeek4.getDate() - 6);

      const endOfWeek3 = new Date(startOfWeek4);
      endOfWeek3.setDate(startOfWeek4.getDate() - 1);
      const startOfWeek3 = new Date(endOfWeek3);
      startOfWeek3.setDate(endOfWeek3.getDate() - 6);

      const endOfWeek2 = new Date(startOfWeek3);
      endOfWeek2.setDate(startOfWeek3.getDate() - 1);
      const startOfWeek2 = new Date(endOfWeek2);
      startOfWeek2.setDate(endOfWeek2.getDate() - 6);

      const endOfWeek1 = new Date(startOfWeek2);
      endOfWeek1.setDate(startOfWeek2.getDate() - 1);
      const startOfWeek1 = new Date(endOfWeek1);
      startOfWeek1.setDate(endOfWeek1.getDate() - 6);

      // Format date ranges
      const formatDateRange = (start, end) => {
        const formatDate = (date) => {
          const month = date.toLocaleString('default', { month: 'short' });
          const day = date.getDate();
          return `${month} ${day}`;
        };
        return `${formatDate(start)}-${formatDate(end)}`;
      };

      const weekRanges = [
        { key: `Week 1 (${formatDateRange(startOfWeek1, endOfWeek1)})`, start: startOfWeek1, end: endOfWeek1 },
        { key: `Week 2 (${formatDateRange(startOfWeek2, endOfWeek2)})`, start: startOfWeek2, end: endOfWeek2 },
        { key: `Week 3 (${formatDateRange(startOfWeek3, endOfWeek3)})`, start: startOfWeek3, end: endOfWeek3 },
        { key: `Week 4 (${formatDateRange(startOfWeek4, endOfWeek4)})`, start: startOfWeek4, end: endOfWeek4 }
      ];

      // Initialize grouped data with formatted keys
      weekRanges.forEach(({ key }) => {
        grouped[key] = { name: key, cap: 0, shorts: 0, sleeveless: 0 };
      });

      violations.forEach((v) => {
        const violationDate = new Date(`${v.date}T${v.time}`);
        
        // Find matching week range
        const matchingWeek = weekRanges.find(
          week => violationDate >= week.start && violationDate <= week.end
        );

        if (matchingWeek) {
          const key = matchingWeek.key;
          if (v.violation === "cap") grouped[key].cap += 1;
          if (v.violation === "shorts") grouped[key].shorts += 1;
          if (v.violation === "sleeveless") grouped[key].sleeveless += 1;
        }
      });

      // Return data in chronological order
      return weekRanges.map(({ key }) => grouped[key]);
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
            grouped[key] = { name: key, cap: 0, shorts: 0, sleeveless: 0 };
          }
    
          if (v.violation === "cap") grouped[key].cap += 1;
          if (v.violation === "shorts") grouped[key].shorts += 1;
          if (v.violation === "sleeveless") grouped[key].sleeveless += 1;
        }
      });
    
      return last7Days.map((day) =>
        grouped[day.weekday] || { name: day.weekday, cap: 0, shorts: 0, sleeveless: 0 }
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
            grouped[key] = { name: key, cap: 0, shorts: 0, sleeveless: 0 };
          }
    
          if (v.violation === "cap") grouped[key].cap += 1;
          if (v.violation === "shorts") grouped[key].shorts += 1;
          if (v.violation === "sleeveless") grouped[key].sleeveless += 1;
        }
      });
    
      const months = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
      ];
      return months.map((month) => grouped[month] || { name: month, cap: 0, shorts: 0, sleeveless: 0 });
    }
  
    return Object.values(grouped);
  };

  const calculateViolationsRatio = () => {
    const filteredViolations = violations.filter(v => {
      const violationDate = new Date(`${v.date}T${v.time}`);
      const today = new Date();

      if (pieTimeframe === "week") {
        const weekAgo = new Date();
        weekAgo.setDate(today.getDate() - 7);
        return violationDate >= weekAgo && violationDate <= today;
      }
      
      if (pieTimeframe === "month") {
        const monthAgo = new Date();
        monthAgo.setMonth(today.getMonth() - 1);
        return violationDate >= monthAgo && violationDate <= today;
      }
      
      if (pieTimeframe === "year") {
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
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
      color: COLORS[index]
    }));
  };

  return (
    <Box m="20px">
      {/* HEADER */}
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Header title="DASHBOARD" subtitle="Welcome to your dashboard" />
        <Box>
          <Button
            sx={{
              backgroundColor: colors.blueAccent[700],
              color: colors.grey[100],
              fontSize: "14px",
              fontWeight: "bold",
              padding: "10px 20px",
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
        gridTemplateColumns="repeat(12, 1fr)"
        gridAutoRows="140px"
        gap="20px"
      >
        {/* STAT BOXES */}
        <Box
          gridColumn="span 3"
          backgroundColor={colors.primary[400]}
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <StatBox
            title="157,367"
            subtitle="TOTAL STUDENTS MONITORED"
            progress="0.75"
            increase="+6.7%"
            icon={<SchoolIcon sx={{ color: colors.greenAccent[600], fontSize: "26px" }} />}
          />
        </Box>
        <Box
          gridColumn="span 3"
          backgroundColor={colors.primary[400]}
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <StatBox
            title="9,741"
            subtitle="DRESS CODE VIOLATIONS"
            progress="0.50"
            increase="-12.5%"
            icon={<WarningIcon sx={{ color: colors.redAccent[600], fontSize: "26px" }} />}
          />
        </Box>
        <Box
          gridColumn="span 3"
          backgroundColor={colors.primary[400]}
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <StatBox
            title="9.73%"
            subtitle="COMPLIANCE RATE"
            progress="0.30"
            increase="+3.5%"
            icon={<CheckCircleIcon sx={{ color: colors.greenAccent[600], fontSize: "26px" }} />}
          />
        </Box>
        <Box
          gridColumn="span 3"
          backgroundColor={colors.primary[400]}
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <StatBox
            title="81.94%"
            subtitle="REPEATED OFFENDERS"
            progress="0.80"
            increase="+11%"
            icon={<RepeatIcon sx={{ color: colors.greenAccent[600], fontSize: "26px" }} />}
          />
        </Box>

        {/* VIOLATIONS CHART & RIGHT PANEL */}
        <Box
          gridColumn="span 12"
          gridRow="span 3"
          display="grid"
          gridTemplateColumns="2fr 1fr" // Split into 2/3 and 1/3
          gap="20px"
        >
          {/* VIOLATIONS CHART */}
          <Box
            backgroundColor={colors.primary[400]}
            p="20px"
          >
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="h3" fontWeight="bold" color={colors.greenAccent[500]}>
                Dress Code Violations
              </Typography>
              <Select
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
                sx={{
                  backgroundColor: colors.primary[600],
                  color: colors.grey[100],
                  borderRadius: "5px",
                  ml: 2,
                  ".MuiOutlinedInput-notchedOutline": { border: 0 },
                }}
              >
                <MenuItem value="week">Previous Week</MenuItem>
                <MenuItem value="month">Previous Month</MenuItem>
                <MenuItem value="year">This Year</MenuItem>
              </Select>
            </Box>
            <Box height="400px" mt="20px">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={formatData()} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="cap" stroke="#8884d8" />
                  <Line type="monotone" dataKey="shorts" stroke="#82ca9d" />
                  <Line type="monotone" dataKey="sleeveless" stroke="#ff6b6b" />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </Box>

          {/* RIGHT PANEL */}
          <Box
            backgroundColor={colors.primary[400]}
            p="20px"
          >
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="h3" fontWeight="bold" color={colors.greenAccent[500]}>
                Violations Ratio
              </Typography>
              <Select
                value={pieTimeframe}
                onChange={(e) => setPieTimeframe(e.target.value)}
                sx={{
                  backgroundColor: colors.primary[600],
                  color: colors.grey[100],
                  borderRadius: "5px",
                  ml: 2,
                  ".MuiOutlinedInput-notchedOutline": { border: 0 },
                }}
              >
                <MenuItem value="week">Previous Week</MenuItem>
                <MenuItem value="month">Previous Month</MenuItem>
                <MenuItem value="year">This Year</MenuItem>
              </Select>
            </Box>
            <Box height="400px" display="flex" flexDirection="column" alignItems="center" justifyContent="center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={calculateViolationsRatio()}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={130}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {calculateViolationsRatio().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name) => [`${value} violations`, name]} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default Dashboard;

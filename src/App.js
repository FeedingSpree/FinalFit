import { useState } from "react";
import { Routes, Route } from "react-router-dom";
import Sidebar from "./scenes/global/Sidebar";
import Dashboard from "./scenes/dashboard";
import Users from "./scenes/users";
import DetectionLogs from "./scenes/detection logs";
import Policies from "./scenes/policies";
import FAQ from "./scenes/faq";
import Calendar from "./scenes/calendar/calendar";
import UserLogs from "./scenes/user logs";
import LiveFeed from "./scenes/Live Feed"; // Import the Live Feed page
import SignInUpPage from "./scenes/sign-in-up-page/SignInUpPage"; // Import SignInUpPage component
import ViolationHandling from "./scenes/violation handling"; // Add this import
import StudentConcerns from "./scenes/student-concerns";
import StudentConcernsManagement from "./scenes/student-concerns-management";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { ColorModeContext, useMode } from "./theme";
import { DetectionProvider } from "./context/DetectionContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Unauthorized from "./scenes/unauthorized";

function App() {
  const [theme, colorMode] = useMode();
  const [isSidebar, setIsSidebar] = useState(true);

  return (
    <DetectionProvider>
      <ColorModeContext.Provider value={colorMode}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <div className="app" style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
            <Routes>
              <Route path="/" element={<SignInUpPage />} />
              <Route path="/unauthorized" element={<Unauthorized />} />
              
              {/* Protected Routes */}
              <Route path="/*" element={
                <>
                  <Sidebar isSidebar={isSidebar} />
                  <main className="content" style={{ flexGrow: 1, overflow: 'auto' }}>
                    <Routes>
                      {/* OSA Only Routes */}
                      <Route path="/dashboard" element={
                        <ProtectedRoute allowedRoles={["OSA"]}>
                          <Dashboard />
                        </ProtectedRoute>
                      } />
                      <Route path="/users" element={
                        <ProtectedRoute allowedRoles={["OSA"]}>
                          <Users />
                        </ProtectedRoute>
                      } />
                      <Route path="/policies" element={
                        <ProtectedRoute allowedRoles={["OSA"]}>
                          <Policies />
                        </ProtectedRoute>
                      } />
                      <Route path="/audittrails" element={
                        <ProtectedRoute allowedRoles={["OSA"]}>
                          <UserLogs />
                        </ProtectedRoute>
                      } />
                      <Route path="/violations" element={
                        <ProtectedRoute allowedRoles={["OSA"]}>
                          <ViolationHandling />
                        </ProtectedRoute>
                      } />
                      <Route path="/student-concerns-management" element={
                        <ProtectedRoute allowedRoles={["OSA"]}>
                          <StudentConcernsManagement />
                        </ProtectedRoute>
                      } />

                      {/* Shared Routes (OSA & SOHAS) */}
                      <Route path="/live-feed" element={
                        <ProtectedRoute allowedRoles={["OSA", "SOHAS"]}>
                          <LiveFeed />
                        </ProtectedRoute>
                      } />
                      <Route path="/detectionlogs" element={
                        <ProtectedRoute allowedRoles={["OSA", "SOHAS"]}>
                          <DetectionLogs />
                        </ProtectedRoute>
                      } />
                      <Route path="/calendar" element={
                        <ProtectedRoute allowedRoles={["OSA", "SOHAS"]}>
                          <Calendar />
                        </ProtectedRoute>
                      } />
                      <Route path="/faq" element={
                        <ProtectedRoute allowedRoles={["OSA", "SOHAS", "STUDENT"]}>
                          <FAQ />
                        </ProtectedRoute>
                      } />

                      {/* Student Only Routes */}
                      <Route path="/student-concerns" element={
                        <ProtectedRoute allowedRoles={["STUDENT"]}>
                          <StudentConcerns />
                        </ProtectedRoute>
                      } />
                    </Routes>
                  </main>
                </>
              } />
            </Routes>
          </div>
        </ThemeProvider>
      </ColorModeContext.Provider>
    </DetectionProvider>
  );
}

export default App;
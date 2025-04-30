import { useState } from "react";
import { Routes, Route } from "react-router-dom";
import Sidebar from "./scenes/global/Sidebar";
import Dashboard from "./scenes/dashboard";
import Team from "./scenes/team";
import Invoices from "./scenes/audit logs";
import Contacts from "./scenes/policies";
import Bar from "./scenes/bar";
import Form from "./scenes/form";
import Line from "./scenes/line";
import Pie from "./scenes/pie";
import FAQ from "./scenes/faq";
import UTest from "./scenes/test/userTest";
import MTest from "./scenes/test/managementTest";
import OTest from "./scenes/test/osaTest";
import STest from "./scenes/test/sohasTest";
import VTest from "./scenes/test/violationLogsTest";
import TTest from "./scenes/test/userLogsTest";
import Geography from "./scenes/geography";
import Calendar from "./scenes/calendar/calendar";
import UserLogs from "./scenes/user logs";
import LiveFeed from "./scenes/Live Feed"; // Import the Live Feed page
import SignInUpPage from "./scenes/sign-in-up-page/SignInUpPage"; // Import SignInUpPage component
import ViolationHandling from "./scenes/violation handling"; // Add this import
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
                      <Route path="/team" element={
                        <ProtectedRoute allowedRoles={["OSA"]}>
                          <Team />
                        </ProtectedRoute>
                      } />
                      <Route path="/contacts" element={
                        <ProtectedRoute allowedRoles={["OSA"]}>
                          <Contacts />
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

                      {/* Shared Routes (OSA & SOHAS) */}
                      <Route path="/live-feed" element={
                        <ProtectedRoute allowedRoles={["OSA", "SOHAS"]}>
                          <LiveFeed />
                        </ProtectedRoute>
                      } />
                      <Route path="/invoices" element={
                        <ProtectedRoute allowedRoles={["OSA", "SOHAS"]}>
                          <Invoices />
                        </ProtectedRoute>
                      } />
                      <Route path="/calendar" element={
                        <ProtectedRoute allowedRoles={["OSA", "SOHAS"]}>
                          <Calendar />
                        </ProtectedRoute>
                      } />
                      <Route path="/faq" element={
                        <ProtectedRoute allowedRoles={["OSA", "SOHAS"]}>
                          <FAQ />
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
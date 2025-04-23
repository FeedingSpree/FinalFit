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
              <Route path="/dashboard" element={
                <>
                  <Sidebar isSidebar={isSidebar} />
                  <main className="content" style={{ flexGrow: 1, overflow: 'auto' }}>
                    <Dashboard />
                  </main>
                </>
              } /> 
              <Route path="/*" element={
                <>
                  <Sidebar isSidebar={isSidebar} />
                  <main className="content" style={{ flexGrow: 1, overflow: 'auto' }}>
                    <Routes>
                      <Route path="/team" element={<Team />} />
                      <Route path="/Utest" element={<UTest />} />
                      <Route path="/Mtest" element={<MTest />} />
                      <Route path="/Otest" element={<OTest />} />
                      <Route path="/Stest" element={<STest />} />
                      <Route path="/Vtest" element={<VTest />} />
                      <Route path="/Ttest" element={<TTest />} />
                      <Route path="/contacts" element={<Contacts />} />
                      <Route path="/invoices" element={<Invoices />} />
                      <Route path="/audittrails" element={<UserLogs />} />
                      <Route path="/form" element={<Form />} />
                      <Route path="/bar" element={<Bar />} />
                      <Route path="/pie" element={<Pie />} />
                      <Route path="/line" element={<Line />} />
                      <Route path="/faq" element={<FAQ />} />
                      <Route path="/calendar" element={<Calendar />} />
                      <Route path="/geography" element={<Geography />} />
                      <Route path="/violations" element={<ViolationHandling />} /> {/* Add this route */}
                      <Route path="/live-feed" element={<LiveFeed />} />
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
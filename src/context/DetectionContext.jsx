import React, { createContext, useContext, useEffect, useState } from "react";
import useViolationStore from '../services/violationStore';
import { addViolationLog } from '../services/violationLogsService.ts';

export const DetectionContext = createContext({
  violations: [],
  isDetecting: false,
  isFeedInitialized: false,
  showAlert: false,
  setShowAlert: () => {},
});

export const useDetection = () => useContext(DetectionContext);

export const DetectionProvider = ({ children }) => {
  const addViolation = useViolationStore(state => state.addViolation);
  const violations = useViolationStore(state => state.violations);
  const [lastViolationId, setLastViolationId] = React.useState(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [isFeedInitialized, setIsFeedInitialized] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [lastViolationCount, setLastViolationCount] = useState(0);

  useEffect(() => {
    const checkDetection = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/detection');
        if (response.ok) {
          const data = await response.json();
          
          if (!isFeedInitialized && data.type === "feed_init") {
            setIsFeedInitialized(true);
          }
          
          if (isFeedInitialized && 
              data.type === "violation" && 
              data.data && 
              data.data.violation_id && 
              data.data.violation_id !== lastViolationId) {
            
            setIsDetecting(true);
            setTimeout(() => setIsDetecting(false), 5000);
            
            const violationLog = {
              building_number: data.data.building_number,
              camera_number: data.data.camera_number,
              date: data.data.date,
              floor_number: data.data.floor_number,
              time: data.data.time,
              violation: data.data.violation,
              violation_id: data.data.violation_id
            };

            setLastViolationId(data.data.violation_id);
            await addViolationLog(violationLog);
            addViolation(violationLog);
          }
        }
      } catch (error) {
        console.error('Error checking detection:', error);
      }
    };

    const detectionInterval = setInterval(checkDetection, 1000);
    return () => clearInterval(detectionInterval);
  }, [addViolation, lastViolationId, isFeedInitialized]);

  useEffect(() => {
    if (!isFeedInitialized) return;

    if (violations.length > lastViolationCount) {
      setShowAlert(true);
    }
    setLastViolationCount(violations.length);
  }, [violations.length, lastViolationCount, isFeedInitialized]);

  useEffect(() => {
    let timer;
    if (showAlert) {
      timer = setTimeout(() => {
        setShowAlert(false);
      }, 5000); // Match Snackbar autoHideDuration
    }
    return () => clearTimeout(timer);
  }, [showAlert]);

  return (
    <DetectionContext.Provider value={{ 
      violations, 
      isDetecting, 
      isFeedInitialized,
      setIsFeedInitialized,
      showAlert,
      setShowAlert
    }}>
      {children}
    </DetectionContext.Provider>
  );
};
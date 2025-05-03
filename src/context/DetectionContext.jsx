import React, { createContext, useContext, useEffect, useState } from "react";
import useViolationStore from '../services/violationStore';
import { addViolationLog } from '../services/violationLogsService.ts';

export const DetectionContext = createContext({
  violations: [],
  isDetecting: false,
  isFeedInitialized: false,
  showAlert: false,
  setShowAlert: () => {},
  hourlyViolations: 0,
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
  const [hourlyViolations, setHourlyViolations] = useState(0);

  useEffect(() => {
    const checkDetection = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/detection');
        if (response.ok) {
          const data = await response.json();
          
          // Only process if it's a violation type and has data
          if (data.type === "violation" && 
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

            // Update hourly violations count only for new violations
            setHourlyViolations(prev => {
              const oneHourAgo = new Date();
              oneHourAgo.setHours(oneHourAgo.getHours() - 1);
              const violationDate = new Date(`${data.data.date}T${data.data.time}`);
              
              // Only increment for new violations within the last hour
              if (violationDate > oneHourAgo) {
                console.log(`New violation detected: ${data.data.violation}`); // Debug log
                return prev + 1;
              }
              return prev;
            });

            setLastViolationId(data.data.violation_id);
            await addViolationLog(violationLog);
            addViolation(violationLog);
            setShowAlert(true);
          }
        }
      } catch (error) {
        console.error('Error checking detection:', error);
      }
    };

    // Check for detections more frequently
    const detectionInterval = setInterval(checkDetection, 500);

    // Clean up old violations every minute
    const cleanupInterval = setInterval(() => {
      const oneHourAgo = new Date();
      oneHourAgo.setHours(oneHourAgo.getHours() - 1);
      
      const recentViolations = violations.filter(violation => {
        const violationDate = new Date(`${violation.date}T${violation.time}`);
        return violationDate > oneHourAgo;
      });
      
      setHourlyViolations(recentViolations.length);
    }, 60000);

    return () => {
      clearInterval(detectionInterval);
      clearInterval(cleanupInterval);
    };
  }, [addViolation, lastViolationId, violations]);

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
      }, 5000);
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
      setShowAlert,
      hourlyViolations
    }}>
      {children}
    </DetectionContext.Provider>
  );
};
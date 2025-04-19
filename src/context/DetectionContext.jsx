import React, { createContext, useContext, useEffect } from "react";
import useViolationStore from '../services/violationStore';
import { addViolationLog } from '../services/violationLogsService.ts';

const DetectionContext = createContext();

export const useDetection = () => useContext(DetectionContext);

export const DetectionProvider = ({ children }) => {
  const addViolation = useViolationStore(state => state.addViolation);
  const violations = useViolationStore(state => state.violations);
  const [lastViolationId, setLastViolationId] = React.useState(null);

  useEffect(() => {
    const checkDetection = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/detection');
        if (response.ok) {
          const data = await response.json();
          
          if (data.type === "violation" && 
              data.data && 
              data.data.violation_id && 
              data.data.violation_id !== lastViolationId) {
            
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
  }, [addViolation, lastViolationId]);

  return (
    <DetectionContext.Provider value={{ violations }}>
      {children}
    </DetectionContext.Provider>
  );
};
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useViolationStore = create(
  persist(
    (set) => ({
      violations: [],
      addViolation: (violation) => set((state) => {
        // Check if violation already exists
        const exists = state.violations.some(
          v => v.violation_id === violation.violation_id
        );
        if (exists) return state;

        // Filter violations from the last hour
        const now = new Date();
        const oneHourAgo = new Date(now.getTime() - (60 * 60 * 1000));
        const filteredViolations = state.violations.filter(v => {
          const violationDate = new Date(`${v.date}T${v.time}`);
          return violationDate >= oneHourAgo;
        });

        return {
          violations: [...filteredViolations, violation]
        };
      }),
      clearViolations: () => set({ violations: [] }),
    }),
    {
      name: 'violation-storage',
      skipHydration: false,
    }
  )
);

export default useViolationStore;
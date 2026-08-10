import { useState, useEffect, useCallback } from 'react';

export interface DataEntry {
  id: string;
  name: string;
  values: number[];
}

export interface BudgetState {
  months: string[];
  incomeEntries: DataEntry[];
  outgoingEntries: DataEntry[];
  allocationEntries: DataEntry[];
  statusEntries: DataEntry[];
  remarks: Record<string, Record<string, string>>;
  householdExpenses: DataEntry[];
  debtRepayment: DataEntry[];
  savingsData: DataEntry[];
  debtProgression: DataEntry[];
}

const STORAGE_KEY = 'babylonian-heron-data';

const defaultMonths = [
  'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER',
  'NOVEMBER', 'DECEMBER', 'JANUARY', 'FEBRUARY', 'MARCH'
];

const defaultState: BudgetState = {
  months: defaultMonths,
  incomeEntries: [
    { id: 'salary', name: 'SALARY', values: [176588, 171000, 176000, 0, 0, 0, 0, 0, 0, 0] },
    { id: 'interest', name: 'INTEREST', values: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
    { id: 'retained', name: 'RETAINED', values: [0, 25000, 0, 0, 0, 0, 0, 0, 0, 0] },
    { id: 'other', name: 'OTHER SOURCES', values: [49661, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
  ],
  outgoingEntries: [
    { id: 'saving10', name: '10% - SAVING', values: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
    { id: 'house70', name: '70% - HOUSEHOLD EXPENSES', values: [145887, 143400, 44680, 35380, 112300, 35380, 35380, 112300, 35380, 35380] },
    { id: 'debt20', name: '20% - DEBT REPAYMENT', values: [47100, 47100, 47100, 47100, 47100, 47100, 47100, 47100, 42100, 42100] },
  ],
  allocationEntries: [
    { id: 'saving10', name: '10% - SAVING', values: [17658.8, 17100, 17600, 0, 0, 0, 0, 0, 0, 0] },
    { id: 'house70', name: '70% - HOUSEHOLD EXPENSES', values: [123611.6, 119700, 123200, 0, 0, 0, 0, 0, 0, 0] },
    { id: 'debt20', name: '20% - DEBT REPAYMENT', values: [35317.6, 34200, 35200, 0, 0, 0, 0, 0, 0, 0] },
  ],
  statusEntries: [
    { id: 'saving10', name: '10% - SAVING', values: [-17658.8, -17100, -17600, 0, 0, 0, 0, 0, 0, 0] },
    { id: 'house70', name: '70% - HOUSEHOLD EXPENSES', values: [22275.4, 23700, 78520, -35380, -112300, -35380, -35380, -112300, -35380, -35380] },
    { id: 'debt20', name: '20% - DEBT REPAYMENT', values: [11782.4, 12900, -11900, -47100, -47100, -47100, -47100, -47100, -42100, -42100] },
  ],
  remarks: {
    saving10: { '0': 'HAND TO MOUTH', '1': 'HAND TO MOUTH', '2': 'HAND TO MOUTH', '3': 'RETAINER', '4': 'RETAINER', '5': 'RETAINER', '6': 'RETAINER', '7': 'RETAINER', '8': 'RETAINER', '9': 'RETAINER' },
    house70: { '0': 'WISHFUL FLOCK', '1': 'WISHFUL FLOCK', '2': 'WISHFUL FLOCK', '3': 'IN CONTROL', '4': 'IN CONTROL', '5': 'IN CONTROL', '6': 'IN CONTROL', '7': 'IN CONTROL', '8': 'IN CONTROL', '9': 'IN CONTROL' },
    debt20: { '0': 'DISASTER IN MAKING', '1': 'DISASTER IN MAKING', '2': 'BRAVO!', '3': 'BRAVO!', '4': 'BRAVO!', '5': 'BRAVO!', '6': 'BRAVO!', '7': 'BRAVO!', '8': 'BRAVO!', '9': 'BRAVO!' },
  },
  householdExpenses: [
    { id: 'house-rent', name: 'HOUSE RENT', values: [25000, 25000, 25000, 25000, 25000, 25000, 25000, 25000, 25000, 25000] },
    { id: 'lift-rent', name: 'LIFT RENT', values: [2000, 2000, 2000, 2000, 2000, 2000, 2000, 2000, 2000, 2000] },
    { id: 'school-fee', name: 'SCHOOL FEE', values: [0, 55320, 0, 0, 55320, 0, 0, 55320, 0, 0] },
    { id: 'school-transport', name: 'SCHOOL TRANSPORT', values: [0, 21600, 0, 0, 21600, 0, 0, 21600, 0, 0] },
    { id: 'school-addon', name: 'SCHOOL ADD ON', values: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
    { id: 'grocery', name: 'GROCERY', values: [24420, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
    { id: 'equipment', name: 'EQUIPMENT ANY', values: [55500, 15200, 1800, 0, 0, 0, 0, 0, 0, 0] },
    { id: 'electricity', name: 'ELECTRICITY', values: [7500, 7500, 7500, 0, 0, 0, 0, 0, 0, 0] },
    { id: 'internet', name: 'INTERNET', values: [0, 4200, 0, 0, 0, 0, 0, 0, 0, 0] },
    { id: 'vehicle-insurance', name: 'VEHICLE INSURANCE', values: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
    { id: 'vehicle-fuel', name: 'VEHICLE FUEL', values: [9987, 4600, 0, 0, 0, 0, 0, 0, 0, 0] },
    { id: 'vehicle-repairs', name: 'VEHICLE REPAIRS', values: [1100, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
    { id: 'vehicle-parking', name: 'VEHICLE PARKING', values: [1200, 1200, 1200, 1200, 1200, 1200, 1200, 1200, 1200, 1200] },
    { id: 'cellphone', name: 'CELLPHONE SERVICES', values: [1180, 1180, 1180, 1180, 1180, 1180, 1180, 1180, 1180, 1180] },
    { id: 'milk', name: 'MILK', values: [6000, 4000, 6000, 6000, 6000, 6000, 6000, 6000, 6000, 6000] },
    { id: 'fooding', name: 'FOODING', values: [3000, 1600, 0, 0, 0, 0, 0, 0, 0, 0] },
    { id: 'clothing', name: 'CLOTHING', values: [9000, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
  ],
  debtRepayment: [
    { id: 'vehicle-emi', name: 'VEHICLE EMI', values: [42100, 42100, 42100, 42100, 42100, 42100, 42100, 42100, 42100, 42100] },
    { id: 'gpu-emi', name: 'GPU EMI', values: [5000, 5000, 5000, 5000, 5000, 5000, 5000, 5000, 0, 0] },
  ],
  savingsData: [
    { id: 'sukanya', name: 'SUKANYA', values: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
  ],
  debtProgression: [
    { id: 'vehicle', name: 'VEHICLE', values: [1273188, 1240636.91, 1207841.687, 1174800.499, 1141511.503, 1107972.839, 1074182.636, 1040139.006, 1005840.048, 971283.8485] },
    { id: 'gpu', name: 'GPU', values: [36000, 31500, 27000, 22500, 18000, 13500, 9000, 4500, 0, 0] },
    { id: 'cpu', name: 'CPU', values: [40000, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
  ],
};

function loadState(): BudgetState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return defaultState;
}

function saveState(state: BudgetState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch { /* ignore */ }
}

export function useBudgetStore() {
  const [state, setState] = useState<BudgetState>(loadState);

  useEffect(() => {
    saveState(state);
  }, [state]);

  const updateEntryValue = useCallback((
    section: keyof BudgetState,
    entryId: string,
    monthIndex: number,
    value: number
  ) => {
    setState(prev => {
      const entries = [...(prev[section] as DataEntry[])];
      const idx = entries.findIndex(e => e.id === entryId);
      if (idx === -1) return prev;
      const entry = { ...entries[idx] };
      const newValues = [...entry.values];
      newValues[monthIndex] = value;
      entry.values = newValues;
      entries[idx] = entry;
      return { ...prev, [section]: entries };
    });
  }, []);

  const updateEntryName = useCallback((
    section: keyof BudgetState,
    entryId: string,
    name: string
  ) => {
    setState(prev => {
      const entries = [...(prev[section] as DataEntry[])];
      const idx = entries.findIndex(e => e.id === entryId);
      if (idx === -1) return prev;
      const entry = { ...entries[idx], name };
      entries[idx] = entry;
      return { ...prev, [section]: entries };
    });
  }, []);

  const addEntry = useCallback((
    section: keyof BudgetState,
    name: string
  ) => {
    setState(prev => {
      const entries = [...(prev[section] as DataEntry[])];
      const id = `${name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
      entries.push({
        id,
        name,
        values: new Array(prev.months.length).fill(0),
      });
      return { ...prev, [section]: entries };
    });
  }, []);

  const deleteEntry = useCallback((
    section: keyof BudgetState,
    entryId: string
  ) => {
    setState(prev => {
      const entries = (prev[section] as DataEntry[]).filter(e => e.id !== entryId);
      return { ...prev, [section]: entries };
    });
  }, []);

  const resetToDefaults = useCallback(() => {
    setState(defaultState);
  }, []);

  const getTotal = useCallback((section: keyof BudgetState, monthIndex: number) => {
    const entries = state[section] as DataEntry[];
    return entries.reduce((sum, e) => sum + (e.values[monthIndex] || 0), 0);
  }, [state]);

  const getIncomeTotal = useCallback((monthIndex: number) => getTotal('incomeEntries', monthIndex), [getTotal]);
  const getOutgoingTotal = useCallback((monthIndex: number) => getTotal('outgoingEntries', monthIndex), [getTotal]);
  const getAllocationTotal = useCallback((monthIndex: number) => getTotal('allocationEntries', monthIndex), [getTotal]);
  const getHouseholdTotal = useCallback((monthIndex: number) => getTotal('householdExpenses', monthIndex), [getTotal]);
  const getDebtRepaymentTotal = useCallback((monthIndex: number) => getTotal('debtRepayment', monthIndex), [getTotal]);
  const getSavingsTotal = useCallback((monthIndex: number) => getTotal('savingsData', monthIndex), [getTotal]);

  return {
    state,
    updateEntryValue,
    updateEntryName,
    addEntry,
    deleteEntry,
    resetToDefaults,
    getIncomeTotal,
    getOutgoingTotal,
    getAllocationTotal,
    getHouseholdTotal,
    getDebtRepaymentTotal,
    getSavingsTotal,
  };
}

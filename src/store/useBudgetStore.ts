import { useState, useEffect, useCallback } from 'react';

export interface DataEntry {
  id: string;
  name: string;
  values: number[];
  createdAt: string;
  modifiedAt: string;
}

export interface AuditEntry {
  id: string;
  action: 'add' | 'edit' | 'delete' | 'rename';
  section: string;
  entryName: string;
  oldValue?: string;
  newValue?: string;
  monthIndex?: number;
  timestamp: string;
}

export interface YearData {
  year: string;
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
  auditLog: AuditEntry[];
  createdAt: string;
  modifiedAt: string;
}

export interface BudgetState {
  years: Record<string, YearData>;
  activeYear: string;
  availableYears: string[];
}

const STORAGE_KEY = 'babylonian-heron-data-v2';
const MONTHS_12 = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

const now = () => new Date().toISOString();

function createEmptyYear(year: string): YearData {
  const ts = now();
  return {
    year,
    months: [...MONTHS_12],
    incomeEntries: [
      { id: 'salary', name: 'SALARY', values: new Array(12).fill(0), createdAt: ts, modifiedAt: ts },
      { id: 'interest', name: 'INTEREST', values: new Array(12).fill(0), createdAt: ts, modifiedAt: ts },
      { id: 'retained', name: 'RETAINED', values: new Array(12).fill(0), createdAt: ts, modifiedAt: ts },
      { id: 'other', name: 'OTHER SOURCES', values: new Array(12).fill(0), createdAt: ts, modifiedAt: ts },
    ],
    outgoingEntries: [
      { id: 'saving10', name: '10% - SAVING', values: new Array(12).fill(0), createdAt: ts, modifiedAt: ts },
      { id: 'house70', name: '70% - HOUSEHOLD', values: new Array(12).fill(0), createdAt: ts, modifiedAt: ts },
      { id: 'debt20', name: '20% - DEBT', values: new Array(12).fill(0), createdAt: ts, modifiedAt: ts },
    ],
    allocationEntries: [
      { id: 'saving10', name: '10% - SAVING', values: new Array(12).fill(0), createdAt: ts, modifiedAt: ts },
      { id: 'house70', name: '70% - HOUSEHOLD', values: new Array(12).fill(0), createdAt: ts, modifiedAt: ts },
      { id: 'debt20', name: '20% - DEBT', values: new Array(12).fill(0), createdAt: ts, modifiedAt: ts },
    ],
    statusEntries: [
      { id: 'saving10', name: '10% - SAVING', values: new Array(12).fill(0), createdAt: ts, modifiedAt: ts },
      { id: 'house70', name: '70% - HOUSEHOLD', values: new Array(12).fill(0), createdAt: ts, modifiedAt: ts },
      { id: 'debt20', name: '20% - DEBT', values: new Array(12).fill(0), createdAt: ts, modifiedAt: ts },
    ],
    remarks: {
      saving10: Object.fromEntries(MONTHS_12.map((_, i) => [String(i), 'RETAINER'])),
      house70: Object.fromEntries(MONTHS_12.map((_, i) => [String(i), 'IN CONTROL'])),
      debt20: Object.fromEntries(MONTHS_12.map((_, i) => [String(i), 'BRAVO!'])),
    },
    householdExpenses: [
      { id: 'house-rent', name: 'HOUSE RENT', values: new Array(12).fill(0), createdAt: ts, modifiedAt: ts },
      { id: 'lift-rent', name: 'LIFT RENT', values: new Array(12).fill(0), createdAt: ts, modifiedAt: ts },
      { id: 'school-fee', name: 'SCHOOL FEE', values: new Array(12).fill(0), createdAt: ts, modifiedAt: ts },
      { id: 'school-transport', name: 'SCHOOL TRANSPORT', values: new Array(12).fill(0), createdAt: ts, modifiedAt: ts },
      { id: 'school-addon', name: 'SCHOOL ADD ON', values: new Array(12).fill(0), createdAt: ts, modifiedAt: ts },
      { id: 'grocery', name: 'GROCERY', values: new Array(12).fill(0), createdAt: ts, modifiedAt: ts },
      { id: 'equipment', name: 'EQUIPMENT ANY', values: new Array(12).fill(0), createdAt: ts, modifiedAt: ts },
      { id: 'electricity', name: 'ELECTRICITY', values: new Array(12).fill(0), createdAt: ts, modifiedAt: ts },
      { id: 'internet', name: 'INTERNET', values: new Array(12).fill(0), createdAt: ts, modifiedAt: ts },
      { id: 'vehicle-insurance', name: 'VEHICLE INSURANCE', values: new Array(12).fill(0), createdAt: ts, modifiedAt: ts },
      { id: 'vehicle-fuel', name: 'VEHICLE FUEL', values: new Array(12).fill(0), createdAt: ts, modifiedAt: ts },
      { id: 'vehicle-repairs', name: 'VEHICLE REPAIRS', values: new Array(12).fill(0), createdAt: ts, modifiedAt: ts },
      { id: 'vehicle-parking', name: 'VEHICLE PARKING', values: new Array(12).fill(0), createdAt: ts, modifiedAt: ts },
      { id: 'cellphone', name: 'CELLPHONE SERVICES', values: new Array(12).fill(0), createdAt: ts, modifiedAt: ts },
      { id: 'milk', name: 'MILK', values: new Array(12).fill(0), createdAt: ts, modifiedAt: ts },
      { id: 'fooding', name: 'FOODING', values: new Array(12).fill(0), createdAt: ts, modifiedAt: ts },
      { id: 'clothing', name: 'CLOTHING', values: new Array(12).fill(0), createdAt: ts, modifiedAt: ts },
    ],
    debtRepayment: [
      { id: 'vehicle-emi', name: 'VEHICLE EMI', values: new Array(12).fill(0), createdAt: ts, modifiedAt: ts },
      { id: 'gpu-emi', name: 'GPU EMI', values: new Array(12).fill(0), createdAt: ts, modifiedAt: ts },
    ],
    savingsData: [
      { id: 'sukanya', name: 'SUKANYA', values: new Array(12).fill(0), createdAt: ts, modifiedAt: ts },
    ],
    debtProgression: [
      { id: 'vehicle', name: 'VEHICLE', values: new Array(12).fill(0), createdAt: ts, modifiedAt: ts },
      { id: 'gpu', name: 'GPU', values: new Array(12).fill(0), createdAt: ts, modifiedAt: ts },
      { id: 'cpu', name: 'CPU', values: new Array(12).fill(0), createdAt: ts, modifiedAt: ts },
    ],
    auditLog: [],
    createdAt: ts,
    modifiedAt: ts,
  };
}

function migrateLegacyData(): BudgetState {
  const ts = now();
  const y2026 = createEmptyYear('2026');
  const y2027 = createEmptyYear('2027');

  // Map original 10 months: Jun 2026 (idx 5) through Mar 2027 (idx 2)
  const origIncome = [[176588,171000,176000,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0],[0,25000,0,0,0,0,0,0,0,0],[49661,0,0,0,0,0,0,0,0,0]];
  const origOutgoing = [[0,0,0,0,0,0,0,0,0,0],[145887,143400,44680,35380,112300,35380,35380,112300,35380,35380],[47100,47100,47100,47100,47100,47100,47100,47100,42100,42100]];
  const origAlloc = [[17658.8,17100,17600,0,0,0,0,0,0,0],[123611.6,119700,123200,0,0,0,0,0,0,0],[35317.6,34200,35200,0,0,0,0,0,0,0]];
  const origStatus = [[-17658.8,-17100,-17600,0,0,0,0,0,0,0],[22275.4,23700,78520,-35380,-112300,-35380,-35380,-112300,-35380,-35380],[11782.4,12900,-11900,-47100,-47100,-47100,-47100,-47100,-42100,-42100]];
  const origHouse = [[25000,25000,25000,25000,25000,25000,25000,25000,25000,25000],[2000,2000,2000,2000,2000,2000,2000,2000,2000,2000],[0,55320,0,0,55320,0,0,55320,0,0],[0,21600,0,0,21600,0,0,21600,0,0],[0,0,0,0,0,0,0,0,0,0],[24420,0,0,0,0,0,0,0,0,0],[55500,15200,1800,0,0,0,0,0,0,0],[7500,7500,7500,0,0,0,0,0,0,0],[0,4200,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0],[9987,4600,0,0,0,0,0,0,0,0],[1100,0,0,0,0,0,0,0,0,0],[1200,1200,1200,1200,1200,1200,1200,1200,1200,1200],[1180,1180,1180,1180,1180,1180,1180,1180,1180,1180],[6000,4000,6000,6000,6000,6000,6000,6000,6000,6000],[3000,1600,0,0,0,0,0,0,0,0],[9000,0,0,0,0,0,0,0,0,0]];
  const origDebt = [[42100,42100,42100,42100,42100,42100,42100,42100,42100,42100],[5000,5000,5000,5000,5000,5000,5000,5000,0,0]];
  const origSavings = [[0,0,0,0,0,0,0,0,0,0]];
  const origDebtProg = [[1273188,1240636.91,1207841.687,1174800.499,1141511.503,1107972.839,1074182.636,1040139.006,1005840.048,971283.8485],[36000,31500,27000,22500,18000,13500,9000,4500,0,0],[40000,0,0,0,0,0,0,0,0,0]];

  // 2026 gets months 0-6 of original data (Jun-Dec)
  for (let i = 0; i < 7; i++) {
    const targetIdx = 5 + i; // Jun=5, Jul=6, ..., Dec=11
    y2026.incomeEntries.forEach((e, ei) => { e.values[targetIdx] = origIncome[ei][i]; });
    y2026.outgoingEntries.forEach((e, ei) => { e.values[targetIdx] = origOutgoing[ei][i]; });
    y2026.allocationEntries.forEach((e, ei) => { e.values[targetIdx] = origAlloc[ei][i]; });
    y2026.statusEntries.forEach((e, ei) => { e.values[targetIdx] = origStatus[ei][i]; });
    y2026.householdExpenses.forEach((e, ei) => { e.values[targetIdx] = origHouse[ei][i]; });
    y2026.debtRepayment.forEach((e, ei) => { e.values[targetIdx] = origDebt[ei][i]; });
    y2026.savingsData.forEach((e, ei) => { e.values[targetIdx] = origSavings[ei][i]; });
    y2026.debtProgression.forEach((e, ei) => { e.values[targetIdx] = origDebtProg[ei][i]; });
  }
  // 2027 gets months 7-9 of original data (Jan-Mar)
  for (let i = 7; i < 10; i++) {
    const targetIdx = i - 7; // Jan=0, Feb=1, Mar=2
    y2027.incomeEntries.forEach((e, ei) => { e.values[targetIdx] = origIncome[ei][i]; });
    y2027.outgoingEntries.forEach((e, ei) => { e.values[targetIdx] = origOutgoing[ei][i]; });
    y2027.allocationEntries.forEach((e, ei) => { e.values[targetIdx] = origAlloc[ei][i]; });
    y2027.statusEntries.forEach((e, ei) => { e.values[targetIdx] = origStatus[ei][i]; });
    y2027.householdExpenses.forEach((e, ei) => { e.values[targetIdx] = origHouse[ei][i]; });
    y2027.debtRepayment.forEach((e, ei) => { e.values[targetIdx] = origDebt[ei][i]; });
    y2027.savingsData.forEach((e, ei) => { e.values[targetIdx] = origSavings[ei][i]; });
    y2027.debtProgression.forEach((e, ei) => { e.values[targetIdx] = origDebtProg[ei][i]; });
  }

  // Remarks
  const origRemarksS = ['HAND TO MOUTH','HAND TO MOUTH','HAND TO MOUTH','RETAINER','RETAINER','RETAINER','RETAINER','RETAINER','RETAINER','RETAINER'];
  const origRemarksH = ['WISHFUL FLOCK','WISHFUL FLOCK','WISHFUL FLOCK','IN CONTROL','IN CONTROL','IN CONTROL','IN CONTROL','IN CONTROL','IN CONTROL','IN CONTROL'];
  const origRemarksD = ['DISASTER IN MAKING','DISASTER IN MAKING','BRAVO!','BRAVO!','BRAVO!','BRAVO!','BRAVO!','BRAVO!','BRAVO!','BRAVO!'];
  for (let i = 0; i < 7; i++) {
    y2026.remarks.saving10[String(5+i)] = origRemarksS[i];
    y2026.remarks.house70[String(5+i)] = origRemarksH[i];
    y2026.remarks.debt20[String(5+i)] = origRemarksD[i];
  }
  for (let i = 7; i < 10; i++) {
    y2027.remarks.saving10[String(i-7)] = origRemarksS[i];
    y2027.remarks.house70[String(i-7)] = origRemarksH[i];
    y2027.remarks.debt20[String(i-7)] = origRemarksD[i];
  }

  return {
    years: { '2026': y2026, '2027': y2027 },
    activeYear: '2026',
    availableYears: ['2026', '2027'],
  };
}

function loadState(): BudgetState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return migrateLegacyData();
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

  const currentYear = state.years[state.activeYear];

  const addAudit = useCallback((year: string, entry: Omit<AuditEntry, 'id' | 'timestamp'>) => {
    setState(prev => {
      const y = prev.years[year];
      if (!y) return prev;
      const audit: AuditEntry = { ...entry, id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, timestamp: now() };
      const updated = { ...y, auditLog: [audit, ...y.auditLog].slice(0, 100), modifiedAt: now() };
      return { ...prev, years: { ...prev.years, [year]: updated } };
    });
  }, []);

  const updateEntryValue = useCallback((
    section: keyof YearData,
    entryId: string,
    monthIndex: number,
    value: number
  ) => {
    setState(prev => {
      const y = prev.years[prev.activeYear];
      if (!y) return prev;
      const entries = [...(y[section] as DataEntry[])];
      const idx = entries.findIndex(e => e.id === entryId);
      if (idx === -1) return prev;
      const entry = { ...entries[idx] };
      const newValues = [...entry.values];
      const oldVal = newValues[monthIndex];
      newValues[monthIndex] = value;
      entry.values = newValues;
      entry.modifiedAt = now();
      entries[idx] = entry;
      const updated = { ...y, [section]: entries, modifiedAt: now() };
      const newState = { ...prev, years: { ...prev.years, [prev.activeYear]: updated } };
      // audit
      const auditY = newState.years[newState.activeYear];
      const audit: AuditEntry = {
        id: `audit-${Date.now()}`, action: 'edit', section: String(section),
        entryName: entry.name, oldValue: String(oldVal), newValue: String(value),
        monthIndex, timestamp: now()
      };
      auditY.auditLog = [audit, ...auditY.auditLog].slice(0, 100);
      return newState;
    });
  }, []);

  const updateEntryName = useCallback((
    section: keyof YearData,
    entryId: string,
    name: string
  ) => {
    setState(prev => {
      const y = prev.years[prev.activeYear];
      if (!y) return prev;
      const entries = [...(y[section] as DataEntry[])];
      const idx = entries.findIndex(e => e.id === entryId);
      if (idx === -1) return prev;
      const oldName = entries[idx].name;
      const entry = { ...entries[idx], name, modifiedAt: now() };
      entries[idx] = entry;
      const updated = { ...y, [section]: entries, modifiedAt: now() };
      const newState = { ...prev, years: { ...prev.years, [prev.activeYear]: updated } };
      const auditY = newState.years[newState.activeYear];
      const audit: AuditEntry = {
        id: `audit-${Date.now()}`, action: 'rename', section: String(section),
        entryName: name, oldValue: oldName, newValue: name, timestamp: now()
      };
      auditY.auditLog = [audit, ...auditY.auditLog].slice(0, 100);
      return newState;
    });
  }, []);

  const addEntry = useCallback((
    section: keyof YearData,
    name: string
  ) => {
    setState(prev => {
      const y = prev.years[prev.activeYear];
      if (!y) return prev;
      const entries = [...(y[section] as DataEntry[])];
      const id = `${name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
      const ts = now();
      entries.push({ id, name, values: new Array(12).fill(0), createdAt: ts, modifiedAt: ts });
      const updated = { ...y, [section]: entries, modifiedAt: ts };
      const newState = { ...prev, years: { ...prev.years, [prev.activeYear]: updated } };
      const auditY = newState.years[newState.activeYear];
      const audit: AuditEntry = {
        id: `audit-${Date.now()}`, action: 'add', section: String(section),
        entryName: name, timestamp: ts
      };
      auditY.auditLog = [audit, ...auditY.auditLog].slice(0, 100);
      return newState;
    });
  }, []);

  const deleteEntry = useCallback((
    section: keyof YearData,
    entryId: string
  ) => {
    setState(prev => {
      const y = prev.years[prev.activeYear];
      if (!y) return prev;
      const entries = (y[section] as DataEntry[]);
      const target = entries.find(e => e.id === entryId);
      const filtered = entries.filter(e => e.id !== entryId);
      const updated = { ...y, [section]: filtered, modifiedAt: now() };
      const newState = { ...prev, years: { ...prev.years, [prev.activeYear]: updated } };
      if (target) {
        const auditY = newState.years[newState.activeYear];
        const audit: AuditEntry = {
          id: `audit-${Date.now()}`, action: 'delete', section: String(section),
          entryName: target.name, timestamp: now()
        };
        auditY.auditLog = [audit, ...auditY.auditLog].slice(0, 100);
      }
      return newState;
    });
  }, []);

  const setActiveYear = useCallback((year: string) => {
    setState(prev => ({ ...prev, activeYear: year }));
  }, []);

  const addYear = useCallback((year: string) => {
    setState(prev => {
      if (prev.years[year]) return prev;
      const newYear = createEmptyYear(year);
      return {
        ...prev,
        years: { ...prev.years, [year]: newYear },
        availableYears: [...prev.availableYears, year].sort(),
        activeYear: year,
      };
    });
  }, []);

  const deleteYear = useCallback((year: string) => {
    setState(prev => {
      if (Object.keys(prev.years).length <= 1) return prev;
      const { [year]: _, ...rest } = prev.years;
      const remaining = prev.availableYears.filter(y => y !== year).sort();
      return {
        ...prev,
        years: rest,
        availableYears: remaining,
        activeYear: prev.activeYear === year ? remaining[0] : prev.activeYear,
      };
    });
  }, []);

  const resetToDefaults = useCallback(() => {
    setState(migrateLegacyData());
  }, []);

  const getTotal = useCallback((section: keyof YearData, monthIndex: number) => {
    const y = currentYear;
    if (!y) return 0;
    const entries = y[section] as DataEntry[];
    return entries.reduce((sum, e) => sum + (e.values[monthIndex] || 0), 0);
  }, [currentYear]);

  const getIncomeTotal = useCallback((monthIndex: number) => getTotal('incomeEntries', monthIndex), [getTotal]);
  const getOutgoingTotal = useCallback((monthIndex: number) => getTotal('outgoingEntries', monthIndex), [getTotal]);
  const getAllocationTotal = useCallback((monthIndex: number) => getTotal('allocationEntries', monthIndex), [getTotal]);
  const getHouseholdTotal = useCallback((monthIndex: number) => getTotal('householdExpenses', monthIndex), [getTotal]);
  const getDebtRepaymentTotal = useCallback((monthIndex: number) => getTotal('debtRepayment', monthIndex), [getTotal]);
  const getSavingsTotal = useCallback((monthIndex: number) => getTotal('savingsData', monthIndex), [getTotal]);

  return {
    state,
    currentYear,
    updateEntryValue,
    updateEntryName,
    addEntry,
    deleteEntry,
    setActiveYear,
    addYear,
    deleteYear,
    resetToDefaults,
    getIncomeTotal,
    getOutgoingTotal,
    getAllocationTotal,
    getHouseholdTotal,
    getDebtRepaymentTotal,
    getSavingsTotal,
  };
}

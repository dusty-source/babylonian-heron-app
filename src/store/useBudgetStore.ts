import { useState, useEffect, useCallback } from 'react';

export interface DataEntry {
  id: string;
  name: string;
  values: number[];
  recurring?: 'none' | 'monthly' | 'quarterly' | 'annual';
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

export interface DebtMeta {
  debtId: string;
  name: string;
  interestRate: number;
  emiAmount: number;
  originalPrincipal: number;
  startMonthIndex: number;
}

export interface TaxEntry {
  id: string;
  name: string;
  category: 'ppf' | 'elss' | 'nps' | 'sukanya' | 'insurance' | 'fd' | 'other';
  values: number[];
  limit: number;
  createdAt: string;
  modifiedAt: string;
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
  debtMeta: DebtMeta[];
  taxShieldEntries: TaxEntry[];
  windfallBaseline: number;
  auditLog: AuditEntry[];
  createdAt: string;
  modifiedAt: string;
}

export interface BudgetState {
  years: Record<string, YearData>;
  activeYear: string;
  availableYears: string[];
  passcode: string | null;
}

export interface DebtSimulatorResult {
  strategy: 'snowball' | 'avalanche';
  totalMonths: number;
  totalInterest: number;
  totalPrincipal: number;
  schedule: { month: number; debtName: string; payment: number; balance: number }[];
}

export interface ExtraPaymentImpact {
  debtId: string;
  debtName: string;
  monthsSaved: number;
  interestSaved: number;
  newPayoffMonths: number;
  baselineMonths: number;
}

export interface TaxShieldStatus {
  filled: number;
  gap: number;
  limit: number;
  pct: number;
  monthlySipNeeded: number;
  monthsRemaining: number;
  entries: { name: string; value: number; category: string }[];
}

export interface WindfallResult {
  extraIncome: number;
  toSavings: number;
  toHousehold: number;
  toDebt: number;
  monthIndex: number;
}

const STORAGE_KEY = 'babylonian-heron-data-v4';
const MONTHS_12 = ['JANUARY','FEBRUARY','MARCH','APRIL','MAY','JUNE','JULY','AUGUST','SEPTEMBER','OCTOBER','NOVEMBER','DECEMBER'];
const now = () => new Date().toISOString();

function createEmptyYear(year: string): YearData {
  const ts = now();
  return {
    year,
    months: [...MONTHS_12],
    incomeEntries: [
      { id: 'salary', name: 'SALARY', values: new Array(12).fill(0), recurring: 'none', createdAt: ts, modifiedAt: ts },
      { id: 'interest', name: 'INTEREST', values: new Array(12).fill(0), recurring: 'none', createdAt: ts, modifiedAt: ts },
      { id: 'retained', name: 'RETAINED', values: new Array(12).fill(0), recurring: 'none', createdAt: ts, modifiedAt: ts },
      { id: 'other', name: 'OTHER SOURCES', values: new Array(12).fill(0), recurring: 'none', createdAt: ts, modifiedAt: ts },
    ],
    outgoingEntries: [
      { id: 'saving10', name: '10% - SAVING', values: new Array(12).fill(0), recurring: 'none', createdAt: ts, modifiedAt: ts },
      { id: 'house70', name: '70% - HOUSEHOLD', values: new Array(12).fill(0), recurring: 'none', createdAt: ts, modifiedAt: ts },
      { id: 'debt20', name: '20% - DEBT', values: new Array(12).fill(0), recurring: 'none', createdAt: ts, modifiedAt: ts },
    ],
    allocationEntries: [
      { id: 'saving10', name: '10% - SAVING', values: new Array(12).fill(0), recurring: 'none', createdAt: ts, modifiedAt: ts },
      { id: 'house70', name: '70% - HOUSEHOLD', values: new Array(12).fill(0), recurring: 'none', createdAt: ts, modifiedAt: ts },
      { id: 'debt20', name: '20% - DEBT', values: new Array(12).fill(0), recurring: 'none', createdAt: ts, modifiedAt: ts },
    ],
    statusEntries: [
      { id: 'saving10', name: '10% - SAVING', values: new Array(12).fill(0), recurring: 'none', createdAt: ts, modifiedAt: ts },
      { id: 'house70', name: '70% - HOUSEHOLD', values: new Array(12).fill(0), recurring: 'none', createdAt: ts, modifiedAt: ts },
      { id: 'debt20', name: '20% - DEBT', values: new Array(12).fill(0), recurring: 'none', createdAt: ts, modifiedAt: ts },
    ],
    remarks: {
      saving10: Object.fromEntries(MONTHS_12.map((_, i) => [String(i), 'RETAINER'])),
      house70: Object.fromEntries(MONTHS_12.map((_, i) => [String(i), 'IN CONTROL'])),
      debt20: Object.fromEntries(MONTHS_12.map((_, i) => [String(i), 'BRAVO!'])),
    },
    householdExpenses: [
      { id: 'house-rent', name: 'HOUSE RENT', values: new Array(12).fill(0), recurring: 'monthly', createdAt: ts, modifiedAt: ts },
      { id: 'lift-rent', name: 'LIFT RENT', values: new Array(12).fill(0), recurring: 'monthly', createdAt: ts, modifiedAt: ts },
      { id: 'school-fee', name: 'SCHOOL FEE', values: new Array(12).fill(0), recurring: 'quarterly', createdAt: ts, modifiedAt: ts },
      { id: 'school-transport', name: 'SCHOOL TRANSPORT', values: new Array(12).fill(0), recurring: 'quarterly', createdAt: ts, modifiedAt: ts },
      { id: 'school-addon', name: 'SCHOOL ADD ON', values: new Array(12).fill(0), recurring: 'none', createdAt: ts, modifiedAt: ts },
      { id: 'grocery', name: 'GROCERY', values: new Array(12).fill(0), recurring: 'monthly', createdAt: ts, modifiedAt: ts },
      { id: 'equipment', name: 'EQUIPMENT ANY', values: new Array(12).fill(0), recurring: 'none', createdAt: ts, modifiedAt: ts },
      { id: 'electricity', name: 'ELECTRICITY', values: new Array(12).fill(0), recurring: 'monthly', createdAt: ts, modifiedAt: ts },
      { id: 'internet', name: 'INTERNET', values: new Array(12).fill(0), recurring: 'monthly', createdAt: ts, modifiedAt: ts },
      { id: 'vehicle-insurance', name: 'VEHICLE INSURANCE', values: new Array(12).fill(0), recurring: 'annual', createdAt: ts, modifiedAt: ts },
      { id: 'vehicle-fuel', name: 'VEHICLE FUEL', values: new Array(12).fill(0), recurring: 'monthly', createdAt: ts, modifiedAt: ts },
      { id: 'vehicle-repairs', name: 'VEHICLE REPAIRS', values: new Array(12).fill(0), recurring: 'none', createdAt: ts, modifiedAt: ts },
      { id: 'vehicle-parking', name: 'VEHICLE PARKING', values: new Array(12).fill(0), recurring: 'monthly', createdAt: ts, modifiedAt: ts },
      { id: 'cellphone', name: 'CELLPHONE SERVICES', values: new Array(12).fill(0), recurring: 'monthly', createdAt: ts, modifiedAt: ts },
      { id: 'milk', name: 'MILK', values: new Array(12).fill(0), recurring: 'monthly', createdAt: ts, modifiedAt: ts },
      { id: 'fooding', name: 'FOODING', values: new Array(12).fill(0), recurring: 'none', createdAt: ts, modifiedAt: ts },
      { id: 'clothing', name: 'CLOTHING', values: new Array(12).fill(0), recurring: 'none', createdAt: ts, modifiedAt: ts },
    ],
    debtRepayment: [
      { id: 'vehicle-emi', name: 'VEHICLE EMI', values: new Array(12).fill(0), recurring: 'monthly', createdAt: ts, modifiedAt: ts },
      { id: 'gpu-emi', name: 'GPU EMI', values: new Array(12).fill(0), recurring: 'monthly', createdAt: ts, modifiedAt: ts },
    ],
    savingsData: [
      { id: 'sukanya', name: 'SUKANYA', values: new Array(12).fill(0), recurring: 'none', createdAt: ts, modifiedAt: ts },
    ],
    debtProgression: [
      { id: 'vehicle', name: 'VEHICLE', values: new Array(12).fill(0), recurring: 'none', createdAt: ts, modifiedAt: ts },
      { id: 'gpu', name: 'GPU', values: new Array(12).fill(0), recurring: 'none', createdAt: ts, modifiedAt: ts },
      { id: 'cpu', name: 'CPU', values: new Array(12).fill(0), recurring: 'none', createdAt: ts, modifiedAt: ts },
    ],
    debtMeta: [
      { debtId: 'vehicle', name: 'VEHICLE', interestRate: 8.5, emiAmount: 42100, originalPrincipal: 1500000, startMonthIndex: 0 },
      { debtId: 'gpu', name: 'GPU', interestRate: 12.0, emiAmount: 5000, originalPrincipal: 50000, startMonthIndex: 0 },
      { debtId: 'cpu', name: 'CPU', interestRate: 10.0, emiAmount: 0, originalPrincipal: 40000, startMonthIndex: 0 },
    ],
    taxShieldEntries: [
      { id: 'ppf', name: 'PPF', category: 'ppf', values: new Array(12).fill(0), limit: 150000, createdAt: ts, modifiedAt: ts },
      { id: 'elss', name: 'ELSS (Tax Saver MF)', category: 'elss', values: new Array(12).fill(0), limit: 150000, createdAt: ts, modifiedAt: ts },
      { id: 'nps', name: 'NPS Tier 1', category: 'nps', values: new Array(12).fill(0), limit: 50000, createdAt: ts, modifiedAt: ts },
      { id: 'sukanya', name: 'Sukanya Samriddhi', category: 'sukanya', values: new Array(12).fill(0), limit: 150000, createdAt: ts, modifiedAt: ts },
      { id: 'lic', name: 'LIC / Term Insurance', category: 'insurance', values: new Array(12).fill(0), limit: 150000, createdAt: ts, modifiedAt: ts },
      { id: 'tax-fd', name: 'Tax Saver FD', category: 'fd', values: new Array(12).fill(0), limit: 150000, createdAt: ts, modifiedAt: ts },
    ],
    windfallBaseline: 0,
    auditLog: [],
    createdAt: ts,
    modifiedAt: ts,
  };
}

function migrateLegacyData(): BudgetState {
  const y2026 = createEmptyYear('2026');
  const y2027 = createEmptyYear('2027');

  const origIncome = [[176588,171000,176000,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0],[0,25000,0,0,0,0,0,0,0,0,0,0],[49661,0,0,0,0,0,0,0,0,0,0,0]];
  const origOutgoing = [[0,0,0,0,0,0,0,0,0,0,0,0],[145887,143400,44680,35380,112300,35380,35380,112300,35380,35380,0,0],[47100,47100,47100,47100,47100,47100,47100,47100,42100,42100,0,0]];
  const origAlloc = [[17658.8,17100,17600,0,0,0,0,0,0,0,0,0],[123611.6,119700,123200,0,0,0,0,0,0,0,0,0],[35317.6,34200,35200,0,0,0,0,0,0,0,0,0]];
  const origStatus = [[-17658.8,-17100,-17600,0,0,0,0,0,0,0,0,0],[22275.4,23700,78520,-35380,-112300,-35380,-35380,-112300,-35380,-35380,0,0],[11782.4,12900,-11900,-47100,-47100,-47100,-47100,-47100,-42100,-42100,0,0]];
  const origHouse = [[25000,25000,25000,25000,25000,25000,25000,25000,25000,25000,0,0],[2000,2000,2000,2000,2000,2000,2000,2000,2000,2000,0,0],[0,55320,0,0,55320,0,0,55320,0,0,0,0],[0,21600,0,0,21600,0,0,21600,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0],[24420,0,0,0,0,0,0,0,0,0,0,0],[55500,15200,1800,0,0,0,0,0,0,0,0,0],[7500,7500,7500,0,0,0,0,0,0,0,0,0],[0,4200,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0],[9987,4600,0,0,0,0,0,0,0,0,0,0],[1100,0,0,0,0,0,0,0,0,0,0,0],[1200,1200,1200,1200,1200,1200,1200,1200,1200,1200,0,0],[1180,1180,1180,1180,1180,1180,1180,1180,1180,1180,0,0],[6000,4000,6000,6000,6000,6000,6000,6000,6000,6000,0,0],[3000,1600,0,0,0,0,0,0,0,0,0,0],[9000,0,0,0,0,0,0,0,0,0,0,0]];
  const origDebt = [[42100,42100,42100,42100,42100,42100,42100,42100,42100,42100,0,0],[5000,5000,5000,5000,5000,5000,5000,5000,0,0,0,0]];
  const origSavings = [[0,0,0,0,0,0,0,0,0,0,0,0]];
  const origDebtProg = [[1273188,1240636.91,1207841.687,1174800.499,1141511.503,1107972.839,1074182.636,1040139.006,1005840.048,971283.8485,0,0],[36000,31500,27000,22500,18000,13500,9000,4500,0,0,0,0],[40000,0,0,0,0,0,0,0,0,0,0,0]];

  for (let i = 0; i < 10; i++) {
    y2026.incomeEntries.forEach((e, ei) => { e.values[i] = origIncome[ei][i]; });
    y2026.outgoingEntries.forEach((e, ei) => { e.values[i] = origOutgoing[ei][i]; });
    y2026.allocationEntries.forEach((e, ei) => { e.values[i] = origAlloc[ei][i]; });
    y2026.statusEntries.forEach((e, ei) => { e.values[i] = origStatus[ei][i]; });
    y2026.householdExpenses.forEach((e, ei) => { e.values[i] = origHouse[ei][i]; });
    y2026.debtRepayment.forEach((e, ei) => { e.values[i] = origDebt[ei][i]; });
    y2026.savingsData.forEach((e, ei) => { e.values[i] = origSavings[ei][i]; });
    y2026.debtProgression.forEach((e, ei) => { e.values[i] = origDebtProg[ei][i]; });
  }

  const origRemarksS = ['HAND TO MOUTH','HAND TO MOUTH','HAND TO MOUTH','RETAINER','RETAINER','RETAINER','RETAINER','RETAINER','RETAINER','RETAINER','RETAINER','RETAINER'];
  const origRemarksH = ['WISHFUL FLOCK','WISHFUL FLOCK','WISHFUL FLOCK','IN CONTROL','IN CONTROL','IN CONTROL','IN CONTROL','IN CONTROL','IN CONTROL','IN CONTROL','IN CONTROL','IN CONTROL'];
  const origRemarksD = ['DISASTER IN MAKING','DISASTER IN MAKING','BRAVO!','BRAVO!','BRAVO!','BRAVO!','BRAVO!','BRAVO!','BRAVO!','BRAVO!','BRAVO!','BRAVO!'];
  for (let i = 0; i < 10; i++) {
    y2026.remarks.saving10[String(i)] = origRemarksS[i];
    y2026.remarks.house70[String(i)] = origRemarksH[i];
    y2026.remarks.debt20[String(i)] = origRemarksD[i];
  }

  return {
    years: { '2026': y2026, '2027': y2027 },
    activeYear: '2026',
    availableYears: ['2026', '2027'],
    passcode: null,
  };
}

function migrateV2ToV3(state: any): BudgetState {
  if (!state || !state.years) return migrateLegacyData();
  for (const year of Object.keys(state.years)) {
    const y = state.years[year];
    if (!y) continue;
    const sections: (keyof YearData)[] = ['incomeEntries','outgoingEntries','allocationEntries','statusEntries','householdExpenses','debtRepayment','savingsData','debtProgression'];
    for (const sec of sections) {
      if (!y[sec]) continue;
      for (const entry of y[sec]) {
        if (!entry.recurring) entry.recurring = 'none';
      }
    }
    if (!y.debtMeta || y.debtMeta.length === 0) {
      y.debtMeta = [
        { debtId: 'vehicle', name: 'VEHICLE', interestRate: 8.5, emiAmount: 42100, originalPrincipal: 1500000, startMonthIndex: 0 },
        { debtId: 'gpu', name: 'GPU', interestRate: 12.0, emiAmount: 5000, originalPrincipal: 50000, startMonthIndex: 0 },
        { debtId: 'cpu', name: 'CPU', interestRate: 10.0, emiAmount: 0, originalPrincipal: 40000, startMonthIndex: 0 },
      ];
    }
  }
  if (!state.passcode && 'passcode' in state === false) state.passcode = null;
  return state as BudgetState;
}

function migrateV3ToV4(state: any): BudgetState {
  if (!state || !state.years) return migrateLegacyData();
  const ts = now();
  for (const year of Object.keys(state.years)) {
    const y = state.years[year];
    if (!y) continue;
    if (!y.taxShieldEntries || y.taxShieldEntries.length === 0) {
      y.taxShieldEntries = [
        { id: 'ppf', name: 'PPF', category: 'ppf', values: new Array(12).fill(0), limit: 150000, createdAt: ts, modifiedAt: ts },
        { id: 'elss', name: 'ELSS (Tax Saver MF)', category: 'elss', values: new Array(12).fill(0), limit: 150000, createdAt: ts, modifiedAt: ts },
        { id: 'nps', name: 'NPS Tier 1', category: 'nps', values: new Array(12).fill(0), limit: 50000, createdAt: ts, modifiedAt: ts },
        { id: 'sukanya', name: 'Sukanya Samriddhi', category: 'sukanya', values: new Array(12).fill(0), limit: 150000, createdAt: ts, modifiedAt: ts },
        { id: 'lic', name: 'LIC / Term Insurance', category: 'insurance', values: new Array(12).fill(0), limit: 150000, createdAt: ts, modifiedAt: ts },
        { id: 'tax-fd', name: 'Tax Saver FD', category: 'fd', values: new Array(12).fill(0), limit: 150000, createdAt: ts, modifiedAt: ts },
      ];
    }
    if (typeof y.windfallBaseline !== 'number') y.windfallBaseline = 0;
  }
  return state as BudgetState;
}

function loadState(): BudgetState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) { const parsed = JSON.parse(raw); return migrateV3ToV4(parsed); }
    const rawV3 = localStorage.getItem('babylonian-heron-data-v3');
    if (rawV3) { const parsedV3 = JSON.parse(rawV3); const migrated = migrateV3ToV4(parsedV3); localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated)); return migrated; }
    const rawV2 = localStorage.getItem('babylonian-heron-data-v2');
    if (rawV2) { const parsedV2 = JSON.parse(rawV2); const migrated = migrateV3ToV4(migrateV2ToV3(parsedV2)); localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated)); return migrated; }
  } catch { /* ignore */ }
  return migrateLegacyData();
}

function saveState(state: BudgetState) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* ignore */ }
}

export function useBudgetStore() {
  const [state, setState] = useState<BudgetState>(loadState);

  useEffect(() => { saveState(state); }, [state]);

  const currentYear = state.years[state.activeYear];

  const updateEntryValue = useCallback((section: keyof YearData, entryId: string, monthIndex: number, value: number) => {
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
      const auditY = newState.years[newState.activeYear];
      const audit: AuditEntry = { id: `audit-${Date.now()}`, action: 'edit', section: String(section), entryName: entry.name, oldValue: String(oldVal), newValue: String(value), monthIndex, timestamp: now() };
      auditY.auditLog = [audit, ...auditY.auditLog].slice(0, 100);
      return newState;
    });
  }, []);

  const updateEntryName = useCallback((section: keyof YearData, entryId: string, name: string) => {
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
      const audit: AuditEntry = { id: `audit-${Date.now()}`, action: 'rename', section: String(section), entryName: name, oldValue: oldName, newValue: name, timestamp: now() };
      auditY.auditLog = [audit, ...auditY.auditLog].slice(0, 100);
      return newState;
    });
  }, []);

  const addEntry = useCallback((section: keyof YearData, name: string) => {
    setState(prev => {
      const y = prev.years[prev.activeYear];
      if (!y) return prev;
      const entries = [...(y[section] as DataEntry[])];
      const id = `${name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
      const ts = now();
      entries.push({ id, name, values: new Array(12).fill(0), recurring: 'none', createdAt: ts, modifiedAt: ts });
      const updated = { ...y, [section]: entries, modifiedAt: ts };
      const newState = { ...prev, years: { ...prev.years, [prev.activeYear]: updated } };
      const auditY = newState.years[newState.activeYear];
      const audit: AuditEntry = { id: `audit-${Date.now()}`, action: 'add', section: String(section), entryName: name, timestamp: ts };
      auditY.auditLog = [audit, ...auditY.auditLog].slice(0, 100);
      return newState;
    });
  }, []);

  const deleteEntry = useCallback((section: keyof YearData, entryId: string) => {
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
        const audit: AuditEntry = { id: `audit-${Date.now()}`, action: 'delete', section: String(section), entryName: target.name, timestamp: now() };
        auditY.auditLog = [audit, ...auditY.auditLog].slice(0, 100);
      }
      return newState;
    });
  }, []);

  const setActiveYear = useCallback((year: string) => { setState(prev => ({ ...prev, activeYear: year })); }, []);

  const addYear = useCallback((year: string) => {
    setState(prev => {
      if (prev.years[year]) return prev;
      const newYear = createEmptyYear(year);
      return { ...prev, years: { ...prev.years, [year]: newYear }, availableYears: [...prev.availableYears, year].sort(), activeYear: year };
    });
  }, []);

  const deleteYear = useCallback((year: string) => {
    setState(prev => {
      if (Object.keys(prev.years).length <= 1) return prev;
      const { [year]: _, ...rest } = prev.years;
      const remaining = prev.availableYears.filter(y => y !== year).sort();
      return { ...prev, years: rest, availableYears: remaining, activeYear: prev.activeYear === year ? remaining[0] : prev.activeYear };
    });
  }, []);

  const resetToDefaults = useCallback(() => { setState(migrateLegacyData()); }, []);

  const getTotal = useCallback((section: keyof YearData, monthIndex: number) => {
    const y = currentYear;
    if (!y) return 0;
    const entries = y[section] as DataEntry[];
    return entries.reduce((sum, e) => sum + (e.values[monthIndex] || 0), 0);
  }, [currentYear]);

  // Phase 1: Auto-Allocation
  const autoAllocate = useCallback((monthIndex: number) => {
    setState(prev => {
      const yr = prev.years[prev.activeYear];
      if (!yr) return prev;
      const totalIncome = yr.incomeEntries.reduce((sum, e) => sum + (e.values[monthIndex] || 0), 0);
      if (totalIncome <= 0) return prev;
      const alloc = yr.allocationEntries.map(e => ({ ...e, values: [...e.values], modifiedAt: now() }));
      const saveIdx = alloc.findIndex(e => e.id === 'saving10');
      const houseIdx = alloc.findIndex(e => e.id === 'house70');
      const debtIdx = alloc.findIndex(e => e.id === 'debt20');
      if (saveIdx >= 0) alloc[saveIdx].values[monthIndex] = Math.round(totalIncome * 0.10);
      if (houseIdx >= 0) alloc[houseIdx].values[monthIndex] = Math.round(totalIncome * 0.70);
      if (debtIdx >= 0) alloc[debtIdx].values[monthIndex] = Math.round(totalIncome * 0.20);
      const updated = { ...yr, allocationEntries: alloc, modifiedAt: now() };
      return { ...prev, years: { ...prev.years, [prev.activeYear]: updated } };
    });
  }, []);

  // Phase 1: Passcode
  const setPasscode = useCallback((passcode: string | null) => { setState(prev => ({ ...prev, passcode })); }, []);
  const verifyPasscode = useCallback((input: string) => state.passcode !== null && state.passcode === input, [state.passcode]);

  // Phase 1: Burn-Rate
  const getBurnRate = useCallback(() => {
    const nowDate = new Date();
    const currentMonthIdx = nowDate.getMonth();
    const currentYearStr = String(nowDate.getFullYear());
    if (state.activeYear !== currentYearStr) return null;
    const y = currentYear;
    if (!y) return null;
    const dayOfMonth = nowDate.getDate();
    const totalDays = new Date(nowDate.getFullYear(), nowDate.getMonth() + 1, 0).getDate();
    const spent = y.householdExpenses.reduce((sum, e) => sum + (e.values[currentMonthIdx] || 0), 0);
    const capEntry = y.allocationEntries.find(e => e.id === 'house70');
    const cap = capEntry?.values[currentMonthIdx] || 0;
    if (cap <= 0 || dayOfMonth <= 0) return null;
    const dailyVelocity = spent / dayOfMonth;
    const remaining = Math.max(0, cap - spent);
    const daysUntilExhaustion = dailyVelocity > 0 ? Math.ceil(remaining / dailyVelocity) : 999;
    const daysRemaining = totalDays - dayOfMonth + 1;
    const dailyAllowance = daysRemaining > 0 ? remaining / daysRemaining : 0;
    const usedPct = Math.min(100, (spent / cap) * 100);
    const status = usedPct >= 100 ? 'BROKEN' : usedPct >= 85 ? 'DISASTER IN MAKING' : usedPct >= 60 ? 'WATCH OUT' : usedPct >= 30 ? 'ON TRACK' : 'BRAVO!';
    return { spent, cap, remaining, dailyVelocity, daysUntilExhaustion, daysRemaining, dailyAllowance, usedPct, isCapReached: spent >= cap, status };
  }, [state.activeYear, currentYear]);

  // Phase 2: Recurring Autopilot
  const toggleRecurring = useCallback((section: keyof YearData, entryId: string, frequency: 'none' | 'monthly' | 'quarterly' | 'annual') => {
    setState(prev => {
      const y = prev.years[prev.activeYear];
      if (!y) return prev;
      const entries = [...(y[section] as DataEntry[])];
      const idx = entries.findIndex(e => e.id === entryId);
      if (idx === -1) return prev;
      const entry = { ...entries[idx], recurring: frequency, modifiedAt: now() };
      entries[idx] = entry;
      const updated = { ...y, [section]: entries, modifiedAt: now() };
      const newState = { ...prev, years: { ...prev.years, [prev.activeYear]: updated } };
      const auditY = newState.years[newState.activeYear];
      const audit: AuditEntry = { id: `audit-${Date.now()}`, action: 'edit', section: String(section), entryName: entry.name, oldValue: `recurring:${entries[idx].recurring || 'none'}`, newValue: `recurring:${frequency}`, timestamp: now() };
      auditY.auditLog = [audit, ...auditY.auditLog].slice(0, 100);
      return newState;
    });
  }, []);

  const applyRecurringAutopilot = useCallback((monthIndex: number) => {
    setState(prev => {
      const y = prev.years[prev.activeYear];
      if (!y) return prev;
      const prevMonth = monthIndex - 1;
      if (prevMonth < 0) return prev;
      const household = [...y.householdExpenses];
      let changed = false;
      for (let i = 0; i < household.length; i++) {
        const entry = household[i];
        if (!entry.recurring || entry.recurring === 'none') continue;
        const prevVal = entry.values[prevMonth] || 0;
        if (prevVal > 0 && entry.values[monthIndex] === 0) {
          const newEntry = { ...entry, values: [...entry.values], modifiedAt: now() };
          newEntry.values[monthIndex] = prevVal;
          if (entry.recurring === 'monthly') { for (let m = monthIndex + 1; m < 12; m++) { if (newEntry.values[m] === 0) newEntry.values[m] = prevVal; } }
          if (entry.recurring === 'quarterly') { for (let m = monthIndex + 3; m < 12; m += 3) { if (newEntry.values[m] === 0) newEntry.values[m] = prevVal; } }
          household[i] = newEntry;
          changed = true;
        }
      }
      if (!changed) return prev;
      const updated = { ...y, householdExpenses: household, modifiedAt: now() };
      const newState = { ...prev, years: { ...prev.years, [prev.activeYear]: updated } };
      const auditY = newState.years[newState.activeYear];
      const audit: AuditEntry = { id: `audit-${Date.now()}`, action: 'edit', section: 'householdExpenses', entryName: 'Recurring Autopilot', oldValue: '0', newValue: `Applied to ${MONTHS_12[monthIndex]}`, timestamp: now() };
      auditY.auditLog = [audit, ...auditY.auditLog].slice(0, 100);
      return newState;
    });
  }, []);

  const getCommittedRecurring = useCallback((monthIndex: number) => {
    const y = currentYear;
    if (!y) return 0;
    return y.householdExpenses.reduce((sum, e) => { if (!e.recurring || e.recurring === 'none') return sum; return sum + (e.values[monthIndex] || 0); }, 0);
  }, [currentYear]);

  const getTrueDisposable = useCallback((monthIndex: number) => {
    const y = currentYear;
    if (!y) return 0;
    const capEntry = y.allocationEntries.find(e => e.id === 'house70');
    const cap = capEntry?.values[monthIndex] || 0;
    const committed = getCommittedRecurring(monthIndex);
    return Math.max(0, cap - committed);
  }, [currentYear, getCommittedRecurring]);

  // Phase 2: Debt Simulator
  const updateDebtMeta = useCallback((debtId: string, updates: Partial<DebtMeta>) => {
    setState(prev => {
      const y = prev.years[prev.activeYear];
      if (!y) return prev;
      const meta = [...y.debtMeta];
      const idx = meta.findIndex(m => m.debtId === debtId);
      if (idx === -1) return prev;
      meta[idx] = { ...meta[idx], ...updates };
      const updated = { ...y, debtMeta: meta, modifiedAt: now() };
      return { ...prev, years: { ...prev.years, [prev.activeYear]: updated } };
    });
  }, []);

  const getCurrentDebtBalance = useCallback((debtId: string) => {
    const y = currentYear;
    if (!y) return 0;
    const prog = y.debtProgression.find(d => d.id === debtId);
    if (!prog) return 0;
    for (let i = 11; i >= 0; i--) { if (prog.values[i] > 0) return prog.values[i]; }
    return 0;
  }, [currentYear]);

  const getDebtMonthsRemaining = useCallback((debtId: string) => {
    const y = currentYear;
    if (!y) return 0;
    const meta = y.debtMeta.find(m => m.debtId === debtId);
    const balance = getCurrentDebtBalance(debtId);
    if (!meta || balance <= 0 || meta.emiAmount <= 0) return 0;
    const monthlyRate = meta.interestRate / 100 / 12;
    if (monthlyRate <= 0) return Math.ceil(balance / meta.emiAmount);
    const n = -Math.log(1 - (monthlyRate * balance) / meta.emiAmount) / Math.log(1 + monthlyRate);
    return Math.ceil(n);
  }, [currentYear, getCurrentDebtBalance]);

  const calculateDebtPayoff = useCallback((strategy: 'snowball' | 'avalanche', extraMonthly: number = 0): DebtSimulatorResult | null => {
    const y = currentYear;
    if (!y) return null;
    const debts = y.debtMeta.map(m => {
      const balance = getCurrentDebtBalance(m.debtId);
      return { debtId: m.debtId, name: m.name, balance, rate: m.interestRate, emi: m.emiAmount };
    }).filter(d => d.balance > 0 && d.emi > 0);
    if (debts.length === 0) return null;
    const sorted = strategy === 'snowball' ? [...debts].sort((a, b) => a.balance - b.balance) : [...debts].sort((a, b) => b.rate - a.rate);
    const active = sorted.map(d => ({ ...d, currentBalance: d.balance, paidOff: false }));
    let month = 0;
    let totalInterest = 0;
    const schedule: { month: number; debtName: string; payment: number; balance: number }[] = [];
    while (active.some(d => !d.paidOff) && month < 600) {
      month++;
      let extraPool = extraMonthly;
      for (let i = 0; i < active.length; i++) {
        const debt = active[i];
        if (debt.paidOff) continue;
        const interest = debt.currentBalance * (debt.rate / 100 / 12);
        totalInterest += interest;
        debt.currentBalance += interest;
        let payment = debt.emi;
        const hasEarlierActive = active.slice(0, i).some(d => !d.paidOff);
        if (!hasEarlierActive && extraPool > 0) { const extra = Math.min(extraPool, debt.currentBalance); payment += extra; extraPool -= extra; }
        if (debt.currentBalance <= payment) { payment = debt.currentBalance; debt.currentBalance = 0; debt.paidOff = true; }
        else { debt.currentBalance -= payment; }
        schedule.push({ month, debtName: debt.name, payment: Math.round(payment), balance: Math.round(Math.max(0, debt.currentBalance)) });
      }
    }
    return { strategy, totalMonths: month, totalInterest: Math.round(totalInterest), totalPrincipal: debts.reduce((s, d) => s + d.balance, 0), schedule };
  }, [currentYear, getCurrentDebtBalance]);

  const calculateExtraPaymentImpact = useCallback((debtId: string, extraAmount: number): ExtraPaymentImpact | null => {
    const y = currentYear;
    if (!y) return null;
    const meta = y.debtMeta.find(m => m.debtId === debtId);
    const balance = getCurrentDebtBalance(debtId);
    if (!meta || balance <= 0 || meta.emiAmount <= 0) return null;
    const rate = meta.interestRate / 100 / 12;
    let bBalance = balance, bMonths = 0, bInterest = 0;
    while (bBalance > 0.01 && bMonths < 600) { bMonths++; const interest = bBalance * rate; bInterest += interest; bBalance += interest - meta.emiAmount; if (bBalance <= 0) bBalance = 0; }
    let eBalance = balance, eMonths = 0, eInterest = 0;
    while (eBalance > 0.01 && eMonths < 600) { eMonths++; const interest = eBalance * rate; eInterest += interest; eBalance += interest - meta.emiAmount - extraAmount; if (eBalance <= 0) eBalance = 0; }
    return { debtId, debtName: meta.name, monthsSaved: bMonths - eMonths, interestSaved: Math.round(bInterest - eInterest), newPayoffMonths: eMonths, baselineMonths: bMonths };
  }, [currentYear, getCurrentDebtBalance]);

  // Phase 3: Tax Shield
  const addTaxEntry = useCallback((name: string, category: TaxEntry['category'], limit: number) => {
    setState(prev => {
      const y = prev.years[prev.activeYear];
      if (!y) return prev;
      const entries = [...y.taxShieldEntries];
      const id = `tax-${name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
      const ts = now();
      entries.push({ id, name, category, values: new Array(12).fill(0), limit, createdAt: ts, modifiedAt: ts });
      const updated = { ...y, taxShieldEntries: entries, modifiedAt: ts };
      const newState = { ...prev, years: { ...prev.years, [prev.activeYear]: updated } };
      const auditY = newState.years[newState.activeYear];
      auditY.auditLog = [{ id: `audit-${Date.now()}`, action: 'add', section: 'taxShield', entryName: name, timestamp: ts }, ...auditY.auditLog].slice(0, 100);
      return newState;
    });
  }, []);

  const updateTaxEntryValue = useCallback((entryId: string, monthIndex: number, value: number) => {
    setState(prev => {
      const y = prev.years[prev.activeYear];
      if (!y) return prev;
      const entries = [...y.taxShieldEntries];
      const idx = entries.findIndex(e => e.id === entryId);
      if (idx === -1) return prev;
      const entry = { ...entries[idx], values: [...entries[idx].values], modifiedAt: now() };
      entry.values[monthIndex] = value;
      entries[idx] = entry;
      const updated = { ...y, taxShieldEntries: entries, modifiedAt: now() };
      return { ...prev, years: { ...prev.years, [prev.activeYear]: updated } };
    });
  }, []);

  const deleteTaxEntry = useCallback((entryId: string) => {
    setState(prev => {
      const y = prev.years[prev.activeYear];
      if (!y) return prev;
      const filtered = y.taxShieldEntries.filter(e => e.id !== entryId);
      const updated = { ...y, taxShieldEntries: filtered, modifiedAt: now() };
      return { ...prev, years: { ...prev.years, [prev.activeYear]: updated } };
    });
  }, []);

  const getTaxShieldStatus = useCallback((monthIndex: number): TaxShieldStatus => {
    const y = currentYear;
    if (!y) return { filled: 0, gap: 150000, limit: 150000, pct: 0, monthlySipNeeded: 0, monthsRemaining: 0, entries: [] };
    const limit = 150000;
    const entries = y.taxShieldEntries.map(e => ({ name: e.name, value: e.values[monthIndex] || 0, category: e.category }));
    const filled = Math.min(limit, entries.reduce((s, e) => s + e.value, 0));
    const gap = Math.max(0, limit - filled);
    const pct = Math.min(100, (filled / limit) * 100);
    const monthsRemaining = 12 - monthIndex;
    const monthlySipNeeded = monthsRemaining > 0 ? Math.ceil(gap / monthsRemaining) : 0;
    return { filled, gap, limit, pct, monthlySipNeeded, monthsRemaining, entries };
  }, [currentYear]);

  // Phase 3: Windfall Allocator
  const detectWindfall = useCallback((monthIndex: number): WindfallResult | null => {
    const y = currentYear;
    if (!y) return null;
    const totalIncome = y.incomeEntries.reduce((s, e) => s + (e.values[monthIndex] || 0), 0);
    if (totalIncome <= 0) return null;
    let baseline = y.windfallBaseline;
    if (baseline <= 0) {
      let sum = 0, count = 0;
      for (let i = monthIndex - 1; i >= 0 && count < 3; i--) {
        const mIncome = y.incomeEntries.reduce((s, e) => s + (e.values[i] || 0), 0);
        if (mIncome > 0) { sum += mIncome; count++; }
      }
      baseline = count > 0 ? Math.round(sum / count) : totalIncome;
    }
    const extra = totalIncome - baseline;
    if (extra <= 5000) return null;
    return { extraIncome: extra, toSavings: Math.round(extra * 0.10), toHousehold: Math.round(extra * 0.70), toDebt: Math.round(extra * 0.20), monthIndex };
  }, [currentYear]);

  const applyWindfall = useCallback((result: WindfallResult) => {
    setState(prev => {
      const y = prev.years[prev.activeYear];
      if (!y) return prev;
      const { monthIndex, toSavings, toHousehold, toDebt } = result;
      const savings = [...y.savingsData];
      const household = [...y.householdExpenses];
      const debt = [...y.debtRepayment];
      const ts = now();
      const pushOrAdd = (arr: DataEntry[], id: string, name: string, amount: number) => {
        const idx = arr.findIndex(e => e.id === id);
        if (idx >= 0) { const v = [...arr[idx].values]; v[monthIndex] = (v[monthIndex] || 0) + amount; arr[idx] = { ...arr[idx], values: v, modifiedAt: ts }; }
        else { const v = new Array(12).fill(0); v[monthIndex] = amount; arr.push({ id, name, values: v, recurring: 'none', createdAt: ts, modifiedAt: ts }); }
      };
      pushOrAdd(savings, 'windfall-savings', 'WINDFALL SAVINGS', toSavings);
      pushOrAdd(household, 'windfall-buffer', 'WINDFALL BUFFER', toHousehold);
      pushOrAdd(debt, 'windfall-debt', 'WINDFALL DEBT KNOCKOUT', toDebt);
      const updated = { ...y, savingsData: savings, householdExpenses: household, debtRepayment: debt, modifiedAt: ts };
      const newState = { ...prev, years: { ...prev.years, [prev.activeYear]: updated } };
      const auditY = newState.years[newState.activeYear];
      auditY.auditLog = [{ id: `audit-${Date.now()}`, action: 'add', section: 'windfall', entryName: `Windfall Allocation`, newValue: `S:${toSavings} H:${toHousehold} D:${toDebt}`, timestamp: ts }, ...auditY.auditLog].slice(0, 100);
      return newState;
    });
  }, []);

  const setWindfallBaseline = useCallback((baseline: number) => {
    setState(prev => {
      const y = prev.years[prev.activeYear];
      if (!y) return prev;
      return { ...prev, years: { ...prev.years, [prev.activeYear]: { ...y, windfallBaseline: baseline, modifiedAt: now() } } };
    });
  }, []);

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
    autoAllocate,
    setPasscode,
    verifyPasscode,
    getBurnRate,
    getIncomeTotal,
    getOutgoingTotal,
    getAllocationTotal,
    getHouseholdTotal,
    getDebtRepaymentTotal,
    getSavingsTotal,
    // Phase 2
    toggleRecurring,
    applyRecurringAutopilot,
    getCommittedRecurring,
    getTrueDisposable,
    updateDebtMeta,
    getCurrentDebtBalance,
    getDebtMonthsRemaining,
    calculateDebtPayoff,
    calculateExtraPaymentImpact,
    // Phase 3
    addTaxEntry,
    updateTaxEntryValue,
    deleteTaxEntry,
    getTaxShieldStatus,
    detectWindfall,
    applyWindfall,
    setWindfallBaseline,
  };
}

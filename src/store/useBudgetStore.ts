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
    { id: 'saving10', name: '10% - SAVING', values:

export const months = [
  'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER',
  'NOVEMBER', 'DECEMBER', 'JANUARY', 'FEBRUARY', 'MARCH'
];

export const formatCurrency = (val: number) => {
  if (val === 0) return '0';
  return val.toLocaleString('en-IN');
};

export const getStatusColor = (val: number) => {
  if (val > 0) return '#30d158';
  if (val < 0) return '#ff453a';
  return '#8e8e93';
};

export const getRemarkColor = (remark: string) => {
  switch (remark) {
    case 'BRAVO!': return '#30d158';
    case 'IN CONTROL': return '#0a84ff';
    case 'WISHFUL FLOCK': return '#ff9f0a';
    case 'HAND TO MOUTH': return '#ff453a';
    case 'DISASTER IN MAKING': return '#ff375f';
    case 'RETAINER': return '#bf5af2';
    default: return '#8e8e93';
  }
};

export interface MonthData {
  month: string;
  incoming: {
    salary: number;
    interest: number;
    retained: number;
    otherSources: number;
    total: number;
  };
  allocation: {
    saving10: number;
    household70: number;
    debt20: number;
    total: number;
  };
  outgoing: {
    saving10: number;
    household70: number;
    debt20: number;
    total: number;
  };
  status: {
    saving10: number;
    household70: number;
    debt20: number;
  };
  remarks: {
    saving10: string;
    household70: string;
    debt20: string;
  };
}

export const budgetData: MonthData[] = [
  {
    month: 'JUNE',
    incoming: { salary: 176588, interest: 0, retained: 0, otherSources: 49661, total: 226249 },
    allocation: { saving10: 17658.8, household70: 123611.6, debt20: 35317.6, total: 176588 },
    outgoing: { saving10: 0, household70: 145887, debt20: 47100, total: 192987 },
    status: { saving10: -17658.8, household70: 22275.4, debt20: 11782.4 },
    remarks: { saving10: 'HAND TO MOUTH', household70: 'WISHFUL FLOCK', debt20: 'DISASTER IN MAKING' }
  },
  {
    month: 'JULY',
    incoming: { salary: 171000, interest: 0, retained: 25000, otherSources: 0, total: 196000 },
    allocation: { saving10: 17100, household70: 119700, debt20: 34200, total: 171000 },
    outgoing: { saving10: 0, household70: 143400, debt20: 47100, total: 190500 },
    status: { saving10: -17100, household70: 23700, debt20: 12900 },
    remarks: { saving10: 'HAND TO MOUTH', household70: 'WISHFUL FLOCK', debt20: 'DISASTER IN MAKING' }
  },
  {
    month: 'AUGUST',
    incoming: { salary: 176000, interest: 0, retained: 0, otherSources: 0, total: 176000 },
    allocation: { saving10: 17600, household70: 123200, debt20: 35200, total: 176000 },
    outgoing: { saving10: 0, household70: 44680, debt20: 47100, total: 91780 },
    status: { saving10: -17600, household70: 78520, debt20: -11900 },
    remarks: { saving10: 'HAND TO MOUTH', household70: 'WISHFUL FLOCK', debt20: 'BRAVO!' }
  },
  {
    month: 'SEPTEMBER',
    incoming: { salary: 0, interest: 0, retained: 0, otherSources: 0, total: 0 },
    allocation: { saving10: 0, household70: 0, debt20: 0, total: 0 },
    outgoing: { saving10: 0, household70: 35380, debt20: 47100, total: 82480 },
    status: { saving10: 0, household70: -35380, debt20: -47100 },
    remarks: { saving10: 'RETAINER', household70: 'IN CONTROL', debt20: 'BRAVO!' }
  },
  {
    month: 'OCTOBER',
    incoming: { salary: 0, interest: 0, retained: 0, otherSources: 0, total: 0 },
    allocation: { saving10: 0, household70: 0, debt20: 0, total: 0 },
    outgoing: { saving10: 0, household70: 112300, debt20: 47100, total: 159400 },
    status: { saving10: 0, household70: -112300, debt20: -47100 },
    remarks: { saving10: 'RETAINER', household70: 'IN CONTROL', debt20: 'BRAVO!' }
  },
  {
    month: 'NOVEMBER',
    incoming: { salary: 0, interest: 0, retained: 0, otherSources: 0, total: 0 },
    allocation: { saving10: 0, household70: 0, debt20: 0, total: 0 },
    outgoing: { saving10: 0, household70: 35380, debt20: 47100, total: 82480 },
    status: { saving10: 0, household70: -35380, debt20: -47100 },
    remarks: { saving10: 'RETAINER', household70: 'IN CONTROL', debt20: 'BRAVO!' }
  },
  {
    month: 'DECEMBER',
    incoming: { salary: 0, interest: 0, retained: 0, otherSources: 0, total: 0 },
    allocation: { saving10: 0, household70: 0, debt20: 0, total: 0 },
    outgoing: { saving10: 0, household70: 35380, debt20: 47100, total: 82480 },
    status: { saving10: 0, household70: -35380, debt20: -47100 },
    remarks: { saving10: 'RETAINER', household70: 'IN CONTROL', debt20: 'BRAVO!' }
  },
  {
    month: 'JANUARY',
    incoming: { salary: 0, interest: 0, retained: 0, otherSources: 0, total: 0 },
    allocation: { saving10: 0, household70: 0, debt20: 0, total: 0 },
    outgoing: { saving10: 0, household70: 112300, debt20: 47100, total: 159400 },
    status: { saving10: 0, household70: -112300, debt20: -47100 },
    remarks: { saving10: 'RETAINER', household70: 'IN CONTROL', debt20: 'BRAVO!' }
  },
  {
    month: 'FEBRUARY',
    incoming: { salary: 0, interest: 0, retained: 0, otherSources: 0, total: 0 },
    allocation: { saving10: 0, household70: 0, debt20: 0, total: 0 },
    outgoing: { saving10: 0, household70: 35380, debt20: 42100, total: 77480 },
    status: { saving10: 0, household70: -35380, debt20: -42100 },
    remarks: { saving10: 'RETAINER', household70: 'IN CONTROL', debt20: 'BRAVO!' }
  },
  {
    month: 'MARCH',
    incoming: { salary: 0, interest: 0, retained: 0, otherSources: 0, total: 0 },
    allocation: { saving10: 0, household70: 0, debt20: 0, total: 0 },
    outgoing: { saving10: 0, household70: 35380, debt20: 42100, total: 77480 },
    status: { saving10: 0, household70: -35380, debt20: -42100 },
    remarks: { saving10: 'RETAINER', household70: 'IN CONTROL', debt20: 'BRAVO!' }
  }
];

export const householdExpenses = [
  { name: 'HOUSE RENT', values: [25000, 25000, 25000, 25000, 25000, 25000, 25000, 25000, 25000, 25000] },
  { name: 'LIFT RENT', values: [2000, 2000, 2000, 2000, 2000, 2000, 2000, 2000, 2000, 2000] },
  { name: 'SCHOOL FEE', values: [0, 55320, 0, 0, 55320, 0, 0, 55320, 0, 0] },
  { name: 'SCHOOL TRANSPORT', values: [0, 21600, 0, 0, 21600, 0, 0, 21600, 0, 0] },
  { name: 'SCHOOL ADD ON', values: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
  { name: 'GROCERY', values: [24420, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
  { name: 'EQUIPMENT ANY', values: [55500, 15200, 1800, 0, 0, 0, 0, 0, 0, 0] },
  { name: 'ELECTRICITY', values: [7500, 7500, 7500, 0, 0, 0, 0, 0, 0, 0] },
  { name: 'INTERNET', values: [0, 4200, 0, 0, 0, 0, 0, 0, 0, 0] },
  { name: 'VEHICLE INSURANCE', values: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
  { name: 'VEHICLE FUEL', values: [9987, 4600, 0, 0, 0, 0, 0, 0, 0, 0] },
  { name: 'VEHICLE REPAIRS', values: [1100, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
  { name: 'VEHICLE PARKING', values: [1200, 1200, 1200, 1200, 1200, 1200, 1200, 1200, 1200, 1200] },
  { name: 'CELLPHONE SERVICES', values: [1180, 1180, 1180, 1180, 1180, 1180, 1180, 1180, 1180, 1180] },
  { name: 'MILK', values: [6000, 4000, 6000, 6000, 6000, 6000, 6000, 6000, 6000, 6000] },
  { name: 'FOODING', values: [3000, 1600, 0, 0, 0, 0, 0, 0, 0, 0] },
  { name: 'CLOTHING', values: [9000, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
];

export const debtRepayment = [
  { name: 'VEHICLE EMI', values: [42100, 42100, 42100, 42100, 42100, 42100, 42100, 42100, 42100, 42100] },
  { name: 'GPU EMI', values: [5000, 5000, 5000, 5000, 5000, 5000, 5000, 5000, 0, 0] },
];

export const savingsData = [
  { name: 'SUKANYA', values: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
];

export const debtProgression = [
  { name: 'VEHICLE', values: [1273188, 1240636.91, 1207841.687, 1174800.499, 1141511.503, 1107972.839, 1074182.636, 1040139.006, 1005840.048, 971283.8485] },
  { name: 'GPU', values: [36000, 31500, 27000, 22500, 18000, 13500, 9000, 4500, 0, 0] },
  { name: 'CPU', values: [40000, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
];

export const formatCurrency = (val: number) => {
  if (val === 0) return '0';
  return val.toLocaleString('en-IN');
};

export const getStatusColor = (val: number) => {
  if (val > 0) return '#30d158';
  if (val < 0) return '#ff453a';
  return '#8e8e93';
};

export const getRemarkColor = (remark: string) => {
  switch (remark) {
    case 'BRAVO!': return '#30d158';
    case 'IN CONTROL': return '#0a84ff';
    case 'WISHFUL FLOCK': return '#ff9f0a';
    case 'HAND TO MOUTH': return '#ff453a';
    case 'DISASTER IN MAKING': return '#ff375f';
    case 'RETAINER': return '#bf5af2';
    default: return '#8e8e93';
  }
};

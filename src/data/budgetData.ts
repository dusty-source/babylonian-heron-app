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

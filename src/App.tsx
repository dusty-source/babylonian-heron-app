import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wallet, TrendingUp, TrendingDown, Home, CreditCard, PiggyBank,
  BarChart3, ArrowUpRight, ArrowDownRight, Activity, Plus, Trash2,
  Edit3, Check, RotateCcw, Calendar, Clock, ChevronLeft, ChevronRight,
  History
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie
} from 'recharts';
import { useBudgetStore } from './store/useBudgetStore';
import { formatCurrency, getStatusColor, getRemarkColor } from './data/budgetData';

type Tab = 'overview' | 'details' | 'debt' | 'audit';
type EditSection = 'income' | 'household' | 'debt-repay' | 'savings' | 'debt-prog' | null;

function AnimatedNumber({ value, prefix = '' }: { value: number; prefix?: string }) {
  return (
    <motion.span key={value} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="tabular-nums">
      {prefix}{formatCurrency(value)}
    </motion.span>
  );
}

function SummaryCard({ title, value, icon, color, subtitle, delay }: {
  title: string; value: number; icon: React.ReactNode; color: string; subtitle?: string; delay: number;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.5, type: 'spring' }}
      className="glass-card rounded-2xl p-4 ios-shadow card-hover">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${color}20`, color }}>{icon}</div>
          <span className="text-xs text-ios-text-secondary font-medium">{title}</span>
        </div>
        {value >= 0 ? <ArrowUpRight size={14} style={{ color }} /> : <ArrowDownRight size={14} style={{ color: '#ff453a' }} />}
      </div>
      <div className="text-xl font-semibold text-ios-text">
        <AnimatedNumber value={Math.abs(value)} prefix={value < 0 ? '-' : ''} />
      </div>
      {subtitle && <div className="text-[10px] text-ios-text-secondary mt-1">{subtitle}</div>}
    </motion.div>
  );
}

function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min((Math.abs(value) / max) * 100, 100) : 0;
  return (
    <div className="w-full h-1.5 bg-ios-surface-2 rounded-full overflow-hidden">
      <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, ease: 'easeOut' }} className="h-full rounded-full" style={{ background: color }} />
    </div>
  );
}

function StatusBadge({ text }: { text: string }) {
  const color = getRemarkColor(text);
  return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: `${color}18`, color }}>{text}</span>;
}

function EditableRow({
  name, value, onChange, onNameChange, onDelete, isEditing
}: {
  name: string; value: number; onChange: (v: number) => void;
  onNameChange?: (n: string) => void; onDelete?: () => void;
  isEditing: boolean;
}) {
  const [localVal, setLocalVal] = useState(String(value));
  const [localName, setLocalName] = useState(name);

  if (!isEditing) {
    return (
      <div className="flex items-center justify-between py-1.5">
        <span className="text-xs text-ios-text-secondary">{name}</span>
        <span className="text-xs font-semibold text-ios-text tabular-nums">{formatCurrency(value)}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 py-1">
      {onNameChange && (
        <input value={localName} onChange={e => setLocalName(e.target.value)} onBlur={() => onNameChange(localName)}
          className="flex-1 min-w-0 bg-ios-surface-2 rounded-lg px-2 py-1 text-xs text-ios-text border border-ios-border/30 focus:border-ios-blue outline-none" />
      )}
      {!onNameChange && <span className="flex-1 text-xs text-ios-text-secondary truncate">{name}</span>}
      <input type="number" value={localVal} onChange={e => setLocalVal(e.target.value)} onBlur={() => onChange(Number(localVal) || 0)}
        className="w-24 bg-ios-surface-2 rounded-lg px-2 py-1 text-xs text-ios-text text-right border border-ios-border/30 focus:border-ios-blue outline-none tabular-nums" />
      {onDelete && (
        <motion.button whileTap={{ scale: 0.8 }} onClick={onDelete} className="w-6 h-6 rounded-lg bg-ios-red/20 flex items-center justify-center text-ios-red">
          <Trash2 size={12} />
        </motion.button>
      )}
    </div>
  );
}

function formatTimestamp(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [selectedMonth, setSelectedMonth] = useState(0);
  const [editSection, setEditSection] = useState<EditSection>(null);
  const [newEntryName, setNewEntryName] = useState('');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showAddYear, setShowAddYear] = useState(false);
  const [newYearVal, setNewYearVal] = useState('');
  const [showYearMenu, setShowYearMenu] = useState(false);

  const store = useBudgetStore();
  const { state, currentYear, updateEntryValue, updateEntryName, addEntry, deleteEntry,
    setActiveYear, addYear, deleteYear, resetToDefaults,
    getIncomeTotal, getOutgoingTotal, getAllocationTotal, getHouseholdTotal, getDebtRepaymentTotal } = store;

  const months = currentYear?.months || [];
  const currentMonth = months[selectedMonth] || '';

  const incomeTotal = getIncomeTotal(selectedMonth);
  const outgoingTotal = getOutgoingTotal(selectedMonth);
  const allocationTotal = getAllocationTotal(selectedMonth);
  const householdTotal = getHouseholdTotal(selectedMonth);
  const debtRepayTotal = getDebtRepaymentTotal(selectedMonth);

  const grandIncoming = useMemo(() => months.reduce((s, _, i) => s + getIncomeTotal(i), 0), [months, getIncomeTotal]);
  const grandOutgoing = useMemo(() => months.reduce((s, _, i) => s + getOutgoingTotal(i), 0), [months, getOutgoingTotal]);
  const grandDebtPaid = useMemo(() => currentYear?.debtRepayment.reduce((s, e) => s + e.values.reduce((a, b) => a + b, 0), 0) || 0, [currentYear]);

  const chartData = useMemo(() => months.map((m, i) => ({
    month: m, incoming: getIncomeTotal(i), outgoing: getOutgoingTotal(i),
  })), [months, getIncomeTotal, getOutgoingTotal]);

  const debtChartData = useMemo(() => months.map((m, i) => ({
    month: m, vehicle: currentYear?.debtProgression[0]?.values[i] || 0, gpu: currentYear?.debtProgression[1]?.values[i] || 0,
  })), [months, currentYear]);

  const expenseChartData = useMemo(() => (currentYear?.householdExpenses || [])
    .filter(e => e.values[selectedMonth] > 0)
    .map(e => ({ name: e.name, value: e.values[selectedMonth] })), [currentYear, selectedMonth]);

  const debtPieData = useMemo(() => {
    if (!currentYear) return [];
    return currentYear.debtProgression.filter(d => d.values[selectedMonth] > 0).map((d, i) => ({
      name: d.name, value: d.values[selectedMonth], color: ['#0a84ff', '#bf5af2', '#ff9f0a'][i % 3]
    }));
  }, [currentYear, selectedMonth]);

  const handleAddEntry = (section: keyof typeof currentYear) => {
    if (!newEntryName.trim()) return;
    addEntry(section, newEntryName.trim().toUpperCase());
    setNewEntryName('');
  };

  const handleAddYear = () => {
    if (!newYearVal.trim() || !/^\d{4}$/.test(newYearVal)) return;
    addYear(newYearVal.trim());
    setNewYearVal('');
    setShowAddYear(false);
  };

  const SectionHeader = ({ title, section, onAdd }: { title: string; section: EditSection; onAdd?: () => void }) => (
    <div className="flex items-center justify-between mb-3">
      <span className="text-sm font-semibold text-ios-text">{title}</span>
      <div className="flex items-center gap-2">
        {onAdd && editSection === section && (
          <div className="flex items-center gap-1">
            <input value={newEntryName} onChange={e => setNewEntryName(e.target.value)} placeholder="NAME"
              className="w-24 bg-ios-surface-2 rounded-lg px-2 py-1 text-[10px] text-ios-text border border-ios-border/30 focus:border-ios-blue outline-none" />
            <motion.button whileTap={{ scale: 0.8 }} onClick={onAdd} className="w-6 h-6 rounded-lg bg-ios-green/20 flex items-center justify-center text-ios-green">
              <Plus size={12} />
            </motion.button>
          </div>
        )}
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => setEditSection(editSection === section ? null : section)}
          className={`w-7 h-7 rounded-lg flex items-center justify-center ${editSection === section ? 'bg-ios-blue/20 text-ios-blue' : 'bg-ios-surface-2 text-ios-text-secondary'}`}>
          {editSection === section ? <Check size={14} /> : <Edit3 size={14} />}
        </motion.button>
      </div>
    </div>
  );

  if (!currentYear) return <div className="h-full flex items-center justify-center text-ios-text-secondary">Loading...</div>;

  return (
    <div className="h-full flex flex-col bg-ios-bg gradient-mesh">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="px-5 pt-6 pb-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold gradient-text">Babylonian Heron</h1>
            <p className="text-xs text-ios-text-secondary mt-0.5">Financial Dashboard</p>
          </div>
          <div className="flex items-center gap-2">
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => setShowResetConfirm(true)}
              className="w-9 h-9 rounded-full bg-ios-surface-2 flex items-center justify-center ios-shadow-sm text-ios-text-secondary">
              <RotateCcw size={16} />
            </motion.button>
            <motion.div whileHover={{ rotate: 15 }} className="w-10 h-10 rounded-full bg-ios-surface-2 flex items-center justify-center ios-shadow-sm">
              <Activity size={18} className="text-ios-blue" />
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Year Switcher */}
      <div className="px-4 mb-2">
        <div className="flex items-center gap-2">
          <div className="flex-1 flex gap-1.5 overflow-x-auto scroll-container pb-1">
            {state.availableYears.map(year => (
              <motion.button key={year} whileTap={{ scale: 0.92 }} onClick={() => { setActiveYear(year); setSelectedMonth(0); }}
                className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                  state.activeYear === year ? 'bg-ios-purple text-white ios-shadow-sm' : 'bg-ios-surface-2 text-ios-text-secondary'
                }`}>
                {year}
              </motion.button>
            ))}
            <motion.button whileTap={{ scale: 0.92 }} onClick={() => setShowAddYear(true)}
              className="w-7 h-7 rounded-full bg-ios-surface-2 flex items-center justify-center text-ios-text-secondary">
              <Plus size={14} />
            </motion.button>
          </div>
          {state.availableYears.length > 1 && (
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => setShowYearMenu(!showYearMenu)}
              className="w-7 h-7 rounded-full bg-ios-surface-2 flex items-center justify-center text-ios-text-secondary">
              <Trash2 size={12} />
            </motion.button>
          )}
        </div>
        {showYearMenu && (
          <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
            className="mt-2 glass-card rounded-xl p-2 ios-shadow">
            <div className="text-[10px] text-ios-text-secondary mb-1 px-1">Delete Year</div>
            {state.availableYears.filter(y => y !== state.activeYear).map(year => (
              <button key={year} onClick={() => { deleteYear(year); setShowYearMenu(false); }}
                className="w-full text-left px-2 py-1.5 rounded-lg text-xs text-ios-red hover:bg-ios-red/10 transition-colors">
                Delete {year}
              </button>
            ))}
          </motion.div>
        )}
      </div>

      {/* Add Year Modal */}
      <AnimatePresence>
        {showAddYear && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-6">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="glass-card rounded-2xl p-5 w-full max-w-xs ios-shadow">
              <h3 className="text-sm font-semibold text-ios-text mb-2">Add New Year</h3>
              <input value={newYearVal} onChange={e => setNewYearVal(e.target.value)} placeholder="2028"
                className="w-full bg-ios-surface-2 rounded-xl px-3 py-2 text-sm text-ios-text border border-ios-border/30 focus:border-ios-blue outline-none mb-3" />
              <div className="flex gap-2">
                <button onClick={() => setShowAddYear(false)}
                  className="flex-1 py-2 rounded-xl bg-ios-surface-2 text-xs font-medium text-ios-text-secondary">Cancel</button>
                <button onClick={handleAddYear}
                  className="flex-1 py-2 rounded-xl bg-ios-blue/20 text-xs font-medium text-ios-blue">Add</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reset Confirm Modal */}
      <AnimatePresence>
        {showResetConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-6">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="glass-card rounded-2xl p-5 w-full max-w-xs ios-shadow">
              <h3 className="text-sm font-semibold text-ios-text mb-2">Reset All Data?</h3>
              <p className="text-xs text-ios-text-secondary mb-4">This will erase all your edits and restore the original spreadsheet data.</p>
              <div className="flex gap-2">
                <button onClick={() => setShowResetConfirm(false)}
                  className="flex-1 py-2 rounded-xl bg-ios-surface-2 text-xs font-medium text-ios-text-secondary">Cancel</button>
                <button onClick={() => { resetToDefaults(); setShowResetConfirm(false); setEditSection(null); }}
                  className="flex-1 py-2 rounded-xl bg-ios-red/20 text-xs font-medium text-ios-red">Reset</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 px-4 mb-3">
        <SummaryCard title="Total In" value={grandIncoming} icon={<TrendingUp size={16} />} color="#30d158" subtitle={state.activeYear} delay={0.1} />
        <SummaryCard title="Total Out" value={grandOutgoing} icon={<TrendingDown size={16} />} color="#ff453a" subtitle={state.activeYear} delay={0.2} />
        <SummaryCard title="Debt Paid" value={grandDebtPaid} icon={<CreditCard size={16} />} color="#0a84ff" subtitle="EMI cleared" delay={0.3} />
        <SummaryCard title="Net Flow" value={grandIncoming - grandOutgoing} icon={<Wallet size={16} />}
          color={grandIncoming >= grandOutgoing ? '#30d158' : '#ff453a'} subtitle="Overall balance" delay={0.4} />
      </div>

      {/* Month Selector */}
      <div className="mb-3">
        <div className="flex gap-1.5 overflow-x-auto scroll-container pb-2 px-4">
          {months.map((m, i) => (
            <motion.button key={m} whileTap={{ scale: 0.92 }} onClick={() => setSelectedMonth(i)}
              className={`px-2.5 py-1.5 rounded-full text-[10px] font-medium whitespace-nowrap transition-all ${
                selectedMonth === i ? 'bg-ios-blue text-white ios-shadow-sm' : 'bg-ios-surface-2 text-ios-text-secondary'
              }`}>
              {m}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Tab Bar */}
      <div className="px-4 mb-3">
        <div className="flex bg-ios-surface-2 rounded-xl p-1">
          {(['overview', 'details', 'debt', 'audit'] as Tab[]).map(tab => (
            <motion.button key={tab} whileTap={{ scale: 0.95 }} onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 rounded-lg text-[10px] font-semibold capitalize transition-all ${
                activeTab === tab ? 'bg-ios-surface text-ios-text ios-shadow-sm' : 'text-ios-text-secondary'
              }`}>{tab}</motion.button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto scroll-container px-4 pb-24">
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div key="overview" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }} className="space-y-3">
              <div className="glass-card rounded-2xl p-4 ios-shadow">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-ios-text">{currentMonth} {state.activeYear}</span>
                  <StatusBadge text={currentYear.remarks.house70?.[String(selectedMonth)] || 'N/A'} />
                </div>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-ios-text-secondary">Incoming</span>
                      <span className="text-ios-green font-medium">{formatCurrency(incomeTotal)}</span>
                    </div>
                    <ProgressBar value={incomeTotal} max={250000} color="#30d158" />
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-ios-text-secondary">Outgoing</span>
                      <span className="text-ios-red font-medium">{formatCurrency(outgoingTotal)}</span>
                    </div>
                    <ProgressBar value={outgoingTotal} max={250000} color="#ff453a" />
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-ios-text-secondary">Balance</span>
                      <span className="font-medium" style={{ color: getStatusColor(incomeTotal - outgoingTotal) }}>
                        {formatCurrency(incomeTotal - outgoingTotal)}
                      </span>
                    </div>
                    <ProgressBar value={Math.abs(incomeTotal - outgoingTotal)} max={100000} color={getStatusColor(incomeTotal - outgoingTotal)} />
                  </div>
                </div>
              </div>

              <div className="glass-card rounded-2xl p-4 ios-shadow">
                <SectionHeader title="Incoming" section="income" onAdd={() => handleAddEntry('incomeEntries')} />
                <div className="space-y-1">
                  {currentYear.incomeEntries.map(entry => (
                    <EditableRow key={entry.id} name={entry.name} value={entry.values[selectedMonth]}
                      isEditing={editSection === 'income'}
                      onChange={v => updateEntryValue('incomeEntries', entry.id, selectedMonth, v)}
                      onNameChange={n => updateEntryName('incomeEntries', entry.id, n)}
                      onDelete={() => deleteEntry('incomeEntries', entry.id)} />
                  ))}
                  <div className="pt-2 border-t border-ios-border/30 flex justify-between">
                    <span className="text-xs font-semibold text-ios-text">Total</span>
                    <span className="text-xs font-bold text-ios-green">{formatCurrency(incomeTotal)}</span>
                  </div>
                </div>
              </div>

              <div className="glass-card rounded-2xl p-4 ios-shadow">
                <SectionHeader title="Allocation" section="income" />
                <div className="space-y-2.5">
                  {currentYear.allocationEntries.map((entry, idx) => {
                    const colors = ['#bf5af2', '#0a84ff', '#ff9f0a'];
                    const icons = [<PiggyBank size={14} />, <Home size={14} />, <CreditCard size={14} />];
                    return (
                      <div key={entry.id} className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${colors[idx]}18`, color: colors[idx] }}>{icons[idx]}</div>
                        <div className="flex-1">
                          <div className="flex justify-between text-xs mb-0.5">
                            <span className="text-ios-text-secondary">{entry.name}</span>
                            <span className="text-ios-text font-medium">{formatCurrency(entry.values[selectedMonth])}</span>
                          </div>
                          <ProgressBar value={entry.values[selectedMonth]} max={allocationTotal || 1} color={colors[idx]} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="glass-card rounded-2xl p-4 ios-shadow">
                <span className="text-sm font-semibold text-ios-text block mb-3">Status</span>
                <div className="space-y-2">
                  {currentYear.statusEntries.map(entry => (
                    <div key={entry.id} className="flex items-center justify-between py-2 border-b border-ios-border/30 last:border-0">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ background: getStatusColor(entry.values[selectedMonth]) }} />
                        <span className="text-xs text-ios-text-secondary">{entry.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold tabular-nums" style={{ color: getStatusColor(entry.values[selectedMonth]) }}>
                          {entry.values[selectedMonth] >= 0 ? '+' : ''}{formatCurrency(entry.values[selectedMonth])}
                        </span>
                        <StatusBadge text={currentYear.remarks[entry.id]?.[String(selectedMonth)] || ''} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass-card rounded-2xl p-4 ios-shadow">
                <span className="text-sm font-semibold text-ios-text block mb-3">12-Month Trend</span>
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="incGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#30d158" stopOpacity={0.3} /><stop offset="95%" stopColor="#30d158" stopOpacity={0} /></linearGradient>
                        <linearGradient id="outGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ff453a" stopOpacity={0.3} /><stop offset="95%" stopColor="#ff453a" stopOpacity={0} /></linearGradient>
                      </defs>
                      <XAxis dataKey="month" tick={{ fill: '#8e8e93', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ background: '#1c1c1e', border: '1px solid #38383a', borderRadius: '12px', fontSize: '12px', color: '#fff' }} formatter={(val: unknown) => formatCurrency(val as number)} />
                      <Area type="monotone" dataKey="incoming" stroke="#30d158" strokeWidth={2} fill="url(#incGrad)" />
                      <Area type="monotone" dataKey="outgoing" stroke="#ff453a" strokeWidth={2} fill="url(#outGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'details' && (
            <motion.div key="details" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }} className="space-y-3">
              <div className="glass-card rounded-2xl p-4 ios-shadow">
                <SectionHeader title="Household Expenses" section="household" onAdd={() => handleAddEntry('householdExpenses')} />
                <div className="space-y-1">
                  {currentYear.householdExpenses.map(entry => (
                    <EditableRow key={entry.id} name={entry.name} value={entry.values[selectedMonth]}
                      isEditing={editSection === 'household'}
                      onChange={v => updateEntryValue('householdExpenses', entry.id, selectedMonth, v)}
                      onNameChange={n => updateEntryName('householdExpenses', entry.id, n)}
                      onDelete={() => deleteEntry('householdExpenses', entry.id)} />
                  ))}
                  <div className="pt-2 border-t border-ios-border/30 flex justify-between">
                    <span className="text-xs font-semibold text-ios-text">Total</span>
                    <span className="text-xs font-bold text-ios-red">{formatCurrency(householdTotal)}</span>
                  </div>
                </div>
              </div>

              <div className="glass-card rounded-2xl p-4 ios-shadow">
                <SectionHeader title="Debt Repayment" section="debt-repay" onAdd={() => handleAddEntry('debtRepayment')} />
                <div className="space-y-1">
                  {currentYear.debtRepayment.map(entry => (
                    <EditableRow key={entry.id} name={entry.name} value={entry.values[selectedMonth]}
                      isEditing={editSection === 'debt-repay'}
                      onChange={v => updateEntryValue('debtRepayment', entry.id, selectedMonth, v)}
                      onNameChange={n => updateEntryName('debtRepayment', entry.id, n)}
                      onDelete={() => deleteEntry('debtRepayment', entry.id)} />
                  ))}
                  <div className="pt-2 border-t border-ios-border/30 flex justify-between">
                    <span className="text-xs font-semibold text-ios-text">Total</span>
                    <span className="text-xs font-bold text-ios-orange">{formatCurrency(debtRepayTotal)}</span>
                  </div>
                </div>
              </div>

              <div className="glass-card rounded-2xl p-4 ios-shadow">
                <SectionHeader title="Savings" section="savings" onAdd={() => handleAddEntry('savingsData')} />
                <div className="space-y-1">
                  {currentYear.savingsData.map(entry => (
                    <EditableRow key={entry.id} name={entry.name} value={entry.values[selectedMonth]}
                      isEditing={editSection === 'savings'}
                      onChange={v => updateEntryValue('savingsData', entry.id, selectedMonth, v)}
                      onNameChange={n => updateEntryName('savingsData', entry.id, n)}
                      onDelete={() => deleteEntry('savingsData', entry.id)} />
                  ))}
                </div>
              </div>

              {expenseChartData.length > 0 && (
                <div className="glass-card rounded-2xl p-4 ios-shadow">
                  <span className="text-sm font-semibold text-ios-text block mb-3">Expense Distribution</span>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={expenseChartData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                          {expenseChartData.map((_, i) => <Cell key={i} fill={['#0a84ff', '#30d158', '#ff9f0a', '#bf5af2', '#ff375f', '#5ac8fa', '#5e5ce6'][i % 7]} />)}
                        </Pie>
                        <Tooltip contentStyle={{ background: '#1c1c1e', border: '1px solid #38383a', borderRadius: '12px', fontSize: '12px', color: '#fff' }} formatter={(val: unknown) => formatCurrency(val as number)} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'debt' && (
            <motion.div key="debt" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }} className="space-y-3">
              <div className="glass-card rounded-2xl p-4 ios-shadow">
                <SectionHeader title="Debt Progression" section="debt-prog" onAdd={() => handleAddEntry('debtProgression')} />
                <div className="space-y-1">
                  {currentYear.debtProgression.map(entry => (
                    <EditableRow key={entry.id} name={entry.name} value={entry.values[selectedMonth]}
                      isEditing={editSection === 'debt-prog'}
                      onChange={v => updateEntryValue('debtProgression', entry.id, selectedMonth, v)}
                      onNameChange={n => updateEntryName('debtProgression', entry.id, n)}
                      onDelete={() => deleteEntry('debtProgression', entry.id)} />
                  ))}
                </div>
              </div>

              {debtPieData.length > 0 && (
                <div className="glass-card rounded-2xl p-4 ios-shadow">
                  <span className="text-sm font-semibold text-ios-text block mb-3">Debt Composition</span>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={debtPieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                          {debtPieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                        </Pie>
                        <Tooltip contentStyle={{ background: '#1c1c1e', border: '1px solid #38383a', borderRadius: '12px', fontSize: '12px', color: '#fff' }} formatter={(val: unknown) => formatCurrency(val as number)} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              <div className="glass-card rounded-2xl p-4 ios-shadow">
                <span className="text-sm font-semibold text-ios-text block mb-3">Debt Trend</span>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={debtChartData}>
                      <defs>
                        <linearGradient id="vGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#0a84ff" stopOpacity={0.3} /><stop offset="95%" stopColor="#0a84ff" stopOpacity={0} /></linearGradient>
                        <linearGradient id="gGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#bf5af2" stopOpacity={0.3} /><stop offset="95%" stopColor="#bf5af2" stopOpacity={0} /></linearGradient>
                      </defs>
                      <XAxis dataKey="month" tick={{ fill: '#8e8e93', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ background: '#1c1c1e', border: '1px solid #38383a', borderRadius: '12px', fontSize: '12px', color: '#fff' }} formatter={(val: unknown) => formatCurrency(val as number)} />
                      <Area type="monotone" dataKey="vehicle" stroke="#0a84ff" strokeWidth={2} fill="url(#vGrad)" />
                      <Area type="monotone" dataKey="gpu" stroke="#bf5af2" strokeWidth={2} fill="url(#gGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'audit' && (
            <motion.div key="audit" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }} className="space-y-3">
              <div className="glass-card rounded-2xl p-4 ios-shadow">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-ios-text">Activity Log</span>
                  <span className="text-[10px] text-ios-text-secondary">{currentYear.auditLog.length} entries</span>
                </div>
                {currentYear.auditLog.length === 0 ? (
                  <div className="text-center py-8 text-xs text-ios-text-secondary">No activity yet</div>
                ) : (
                  <div className="space-y-2">
                    {currentYear.auditLog.slice(0, 50).map(entry => (
                      <div key={entry.id} className="flex items-start gap-2 py-2 border-b border-ios-border/20 last:border-0">
                        <div className="w-6 h-6 rounded-lg bg-ios-surface-2 flex items-center justify-center text-ios-text-secondary mt-0.5">
                          <History size={12} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] font-semibold text-ios-text">{entry.action.toUpperCase()}</span>
                            <span className="text-[10px] text-ios-text-secondary">{entry.section}</span>
                          </div>
                          <div className="text-xs text-ios-text truncate">{entry.entryName}</div>
                          {entry.oldValue !== undefined && entry.newValue !== undefined && (
                            <div className="text-[10px] text-ios-text-secondary">
                              {entry.oldValue} → {entry.newValue}
                              {entry.monthIndex !== undefined && ` (${months[entry.monthIndex] || ''})`}
                            </div>
                          )}
                          <div className="text-[9px] text-ios-text-secondary/60 mt-0.5">{formatTimestamp(entry.timestamp)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Tab Bar */}
      <div className="absolute bottom-0 left-0 right-0 px-4 pb-6 pt-2 bg-gradient-to-t from-black via-black/90 to-transparent">
        <div className="glass-card rounded-2xl flex justify-around py-3 ios-shadow">
          {[
            { id: 'overview' as Tab, icon: <BarChart3 size={20} />, label: 'Overview' },
            { id: 'details' as Tab, icon: <Activity size={20} />, label: 'Details' },
            { id: 'debt' as Tab, icon: <CreditCard size={20} />, label: 'Debt' },
            { id: 'audit' as Tab, icon: <Clock size={20} />, label: 'Activity' },
          ].map(tab => (
            <motion.button key={tab.id} whileTap={{ scale: 0.9 }} onClick={() => setActiveTab(tab.id)} className="flex flex-col items-center gap-1">
              <div className={activeTab === tab.id ? 'text-ios-blue' : 'text-ios-text-secondary'}>{tab.icon}</div>
              <span className={`text-[10px] font-medium ${activeTab === tab.id ? 'text-ios-blue' : 'text-ios-text-secondary'}`}>{tab.label}</span>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}

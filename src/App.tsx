import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wallet, TrendingUp, TrendingDown,
  Home, CreditCard, PiggyBank,
  BarChart3, ArrowUpRight, ArrowDownRight, Activity,
  Landmark, Zap, ShoppingBag, Car, Smartphone, Milk, Utensils, Shirt
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, Tooltip, ResponsiveContainer,
  Cell, PieChart, Pie
} from 'recharts';
import {
  budgetData, months, householdExpenses, debtRepayment,
  debtProgression, formatCurrency, getStatusColor, getRemarkColor
} from './data/budgetData';

type Tab = 'overview' | 'details' | 'debt';

const expenseIcons: Record<string, React.ReactNode> = {
  'HOUSE RENT': <Home size={14} />,
  'LIFT RENT': <Zap size={14} />,
  'SCHOOL FEE': <Landmark size={14} />,
  'SCHOOL TRANSPORT': <Car size={14} />,
  'GROCERY': <ShoppingBag size={14} />,
  'EQUIPMENT ANY': <Zap size={14} />,
  'ELECTRICITY': <Zap size={14} />,
  'INTERNET': <WifiIcon />,
  'VEHICLE INSURANCE': <Car size={14} />,
  'VEHICLE FUEL': <Car size={14} />,
  'VEHICLE REPAIRS': <Car size={14} />,
  'VEHICLE PARKING': <Car size={14} />,
  'CELLPHONE SERVICES': <Smartphone size={14} />,
  'MILK': <Milk size={14} />,
  'FOODING': <Utensils size={14} />,
  'CLOTHING': <Shirt size={14} />,
};

function WifiIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12.55a11 11 0 0 1 14.08 0" />
      <path d="M1.42 9a16 16 0 0 1 21.16 0" />
      <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
      <line x1="12" y1="20" x2="12.01" y2="20" />
    </svg>
  );
}

function AnimatedNumber({ value, prefix = '' }: { value: number; prefix?: string }) {
  return (
    <motion.span
      key={value}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="tabular-nums"
    >
      {prefix}{formatCurrency(value)}
    </motion.span>
  );
}

function SummaryCard({ title, value, icon, color, subtitle, delay }: {
  title: string; value: number; icon: React.ReactNode; color: string;
  subtitle?: string; delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, type: 'spring' }}
      className="glass-card rounded-2xl p-4 ios-shadow card-hover"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${color}20`, color }}>
            {icon}
          </div>
          <span className="text-xs text-ios-text-secondary font-medium">{title}</span>
        </div>
        {value >= 0 ? (
          <ArrowUpRight size={14} style={{ color }} />
        ) : (
          <ArrowDownRight size={14} style={{ color: '#ff453a' }} />
        )}
      </div>
      <div className="text-xl font-semibold text-ios-text">
        <AnimatedNumber value={Math.abs(value)} prefix={value < 0 ? '-' : ''} />
      </div>
      {subtitle && <div className="text-[10px] text-ios-text-secondary mt-1">{subtitle}</div>}
    </motion.div>
  );
}

function MonthSelector({ selected, onSelect }: { selected: number; onSelect: (i: number) => void }) {
  return (
    <div className="flex gap-2 overflow-x-auto scroll-container pb-2 px-4">
      {months.map((m, i) => (
        <motion.button
          key={m}
          whileTap={{ scale: 0.92 }}
          onClick={() => onSelect(i)}
          className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
            selected === i
              ? 'bg-ios-blue text-white ios-shadow-sm'
              : 'bg-ios-surface-2 text-ios-text-secondary'
          }`}
        >
          {m.slice(0, 3)}
        </motion.button>
      ))}
    </div>
  );
}

function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min((Math.abs(value) / max) * 100, 100) : 0;
  return (
    <div className="w-full h-1.5 bg-ios-surface-2 rounded-full overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="h-full rounded-full"
        style={{ background: color }}
      />
    </div>
  );
}

function StatusBadge({ text }: { text: string }) {
  const color = getRemarkColor(text);
  return (
    <span
      className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
      style={{ background: `${color}18`, color }}
    >
      {text}
    </span>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [selectedMonth, setSelectedMonth] = useState(0);

  const current = budgetData[selectedMonth];

  const totals = useMemo(() => {
    const totalIncoming = budgetData.reduce((s, d) => s + d.incoming.total, 0);
    const totalOutgoing = budgetData.reduce((s, d) => s + d.outgoing.total, 0);
    const totalDebtPaid = budgetData.reduce((s, d) => s + d.outgoing.debt20, 0);
    return { totalIncoming, totalOutgoing, totalDebtPaid };
  }, []);

  const chartData = useMemo(() => {
    return months.map((m, i) => ({
      month: m.slice(0, 3),
      incoming: budgetData[i].incoming.total,
      outgoing: budgetData[i].outgoing.total,
      status: budgetData[i].status.household70,
    }));
  }, []);

  const debtChartData = useMemo(() => {
    return months.map((m, i) => ({
      month: m.slice(0, 3),
      vehicle: debtProgression[0].values[i],
      gpu: debtProgression[1].values[i],
      cpu: debtProgression[2].values[i],
    }));
  }, []);

  const expenseChartData = useMemo(() => {
    return householdExpenses
      .filter(e => e.values[selectedMonth] > 0)
      .map(e => ({ name: e.name, value: e.values[selectedMonth] }));
  }, [selectedMonth]);

  const debtPieData = useMemo(() => {
    const vehicle = debtProgression[0].values[selectedMonth];
    const gpu = debtProgression[1].values[selectedMonth];
    const cpu = debtProgression[2].values[selectedMonth];
    return [
      { name: 'Vehicle', value: vehicle, color: '#0a84ff' },
      { name: 'GPU', value: gpu, color: '#bf5af2' },
      { name: 'CPU', value: cpu, color: '#ff9f0a' },
    ].filter(d => d.value > 0);
  }, [selectedMonth]);

  return (
    <div className="h-full flex flex-col bg-ios-bg gradient-mesh">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-5 pt-6 pb-3"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold gradient-text">Babylonian Heron</h1>
            <p className="text-xs text-ios-text-secondary mt-0.5">Financial Dashboard</p>
          </div>
          <motion.div
            whileHover={{ rotate: 15 }}
            className="w-10 h-10 rounded-full bg-ios-surface-2 flex items-center justify-center ios-shadow-sm"
          >
            <Activity size={18} className="text-ios-blue" />
          </motion.div>
        </div>
      </motion.div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 px-4 mb-4">
        <SummaryCard
          title="Total In"
          value={totals.totalIncoming}
          icon={<TrendingUp size={16} />}
          color="#30d158"
          subtitle="10 months"
          delay={0.1}
        />
        <SummaryCard
          title="Total Out"
          value={totals.totalOutgoing}
          icon={<TrendingDown size={16} />}
          color="#ff453a"
          subtitle="10 months"
          delay={0.2}
        />
        <SummaryCard
          title="Debt Paid"
          value={totals.totalDebtPaid}
          icon={<CreditCard size={16} />}
          color="#0a84ff"
          subtitle="EMI cleared"
          delay={0.3}
        />
        <SummaryCard
          title="Net Flow"
          value={totals.totalIncoming - totals.totalOutgoing}
          icon={<Wallet size={16} />}
          color={totals.totalIncoming >= totals.totalOutgoing ? '#30d158' : '#ff453a'}
          subtitle="Overall balance"
          delay={0.4}
        />
      </div>

      {/* Month Selector */}
      <div className="mb-3">
        <MonthSelector selected={selectedMonth} onSelect={setSelectedMonth} />
      </div>

      {/* Tab Bar */}
      <div className="px-4 mb-3">
        <div className="flex bg-ios-surface-2 rounded-xl p-1">
          {(['overview', 'details', 'debt'] as Tab[]).map((tab) => (
            <motion.button
              key={tab}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold capitalize transition-all ${
                activeTab === tab
                  ? 'bg-ios-surface text-ios-text ios-shadow-sm'
                  : 'text-ios-text-secondary'
              }`}
            >
              {tab}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden scroll-container px-4 pb-24">
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-3"
            >
              {/* Monthly Snapshot */}
              <div className="glass-card rounded-2xl p-4 ios-shadow">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-ios-text">{current.month} Snapshot</span>
                  <StatusBadge text={current.remarks.household70} />
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-ios-text-secondary">Incoming</span>
                      <span className="text-ios-green font-medium">{formatCurrency(current.incoming.total)}</span>
                    </div>
                    <ProgressBar value={current.incoming.total} max={250000} color="#30d158" />
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-ios-text-secondary">Outgoing</span>
                      <span className="text-ios-red font-medium">{formatCurrency(current.outgoing.total)}</span>
                    </div>
                    <ProgressBar value={current.outgoing.total} max={250000} color="#ff453a" />
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-ios-text-secondary">Balance</span>
                      <span
                        className="font-medium"
                        style={{ color: getStatusColor(current.incoming.total - current.outgoing.total) }}
                      >
                        {formatCurrency(current.incoming.total - current.outgoing.total)}
                      </span>
                    </div>
                    <ProgressBar
                      value={Math.abs(current.incoming.total - current.outgoing.total)}
                      max={100000}
                      color={getStatusColor(current.incoming.total - current.outgoing.total)}
                    />
                  </div>
                </div>
              </div>

              {/* Allocation Breakdown */}
              <div className="glass-card rounded-2xl p-4 ios-shadow">
                <span className="text-sm font-semibold text-ios-text block mb-3">Allocation</span>
                <div className="space-y-2.5">
                  {[
                    { label: '10% Savings', value: current.allocation.saving10, color: '#bf5af2', icon: <PiggyBank size={14} /> },
                    { label: '70% Household', value: current.allocation.household70, color: '#0a84ff', icon: <Home size={14} /> },
                    { label: '20% Debt', value: current.allocation.debt20, color: '#ff9f0a', icon: <CreditCard size={14} /> },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${item.color}18`, color: item.color }}>
                        {item.icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between text-xs mb-0.5">
                          <span className="text-ios-text-secondary">{item.label}</span>
                          <span className="text-ios-text font-medium">{formatCurrency(item.value)}</span>
                        </div>
                        <ProgressBar value={item.value} max={current.allocation.total || 1} color={item.color} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Status Cards */}
              <div className="glass-card rounded-2xl p-4 ios-shadow">
                <span className="text-sm font-semibold text-ios-text block mb-3">Status</span>
                <div className="space-y-2">
                  {[
                    { label: 'Savings', value: current.status.saving10, remark: current.remarks.saving10 },
                    { label: 'Household', value: current.status.household70, remark: current.remarks.household70 },
                    { label: 'Debt', value: current.status.debt20, remark: current.remarks.debt20 },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between py-2 border-b border-ios-border/30 last:border-0">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ background: getStatusColor(item.value) }}
                        />
                        <span className="text-xs text-ios-text-secondary">{item.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className="text-xs font-semibold tabular-nums"
                          style={{ color: getStatusColor(item.value) }}
                        >
                          {item.value >= 0 ? '+' : ''}{formatCurrency(item.value)}
                        </span>
                        <StatusBadge text={item.remark} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Trend Chart */}
              <div className="glass-card rounded-2xl p-4 ios-shadow">
                <span className="text-sm font-semibold text-ios-text block mb-3">10-Month Trend</span>
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="incGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#30d158" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#30d158" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="outGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ff453a" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#ff453a" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="month" tick={{ fill: '#8e8e93', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{
                          background: '#1c1c1e',
                          border: '1px solid #38383a',
                          borderRadius: '12px',
                          fontSize: '12px',
                          color: '#fff',
                        }}
                        formatter={(val: unknown) => formatCurrency(val as number)}
                      />
                      <Area type="monotone" dataKey="incoming" stroke="#30d158" strokeWidth={2} fill="url(#incGrad)" />
                      <Area type="monotone" dataKey="outgoing" stroke="#ff453a" strokeWidth={2} fill="url(#outGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'details' && (
            <motion.div
              key="details"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-3"
            >
              {/* Income Breakdown */}
              <div className="glass-card rounded-2xl p-4 ios-shadow">
                <span className="text-sm font-semibold text-ios-text block mb-3">Income Sources</span>
                <div className="space-y-2">
                  {[
                    { label: 'Salary', value: current.incoming.salary, icon: <Wallet size={14} />, color: '#30d158' },
                    { label: 'Interest', value: current.incoming.interest, icon: <TrendingUp size={14} />, color: '#0a84ff' },
                    { label: 'Retained', value: current.incoming.retained, icon: <PiggyBank size={14} />, color: '#bf5af2' },
                    { label: 'Other', value: current.incoming.otherSources, icon: <Zap size={14} />, color: '#ff9f0a' },
                  ].map((item) => (
                    item.value > 0 && (
                      <div key={item.label} className="flex items-center justify-between py-1.5">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${item.color}18`, color: item.color }}>
                            {item.icon}
                          </div>
                          <span className="text-xs text-ios-text-secondary">{item.label}</span>
                        </div>
                        <span className="text-xs font-semibold text-ios-text">{formatCurrency(item.value)}</span>
                      </div>
                    )
                  ))}
                  <div className="pt-2 border-t border-ios-border/30 flex justify-between">
                    <span className="text-xs font-semibold text-ios-text">Total</span>
                    <span className="text-xs font-bold text-ios-green">{formatCurrency(current.incoming.total)}</span>
                  </div>
                </div>
              </div>

              {/* Household Expenses */}
              <div className="glass-card rounded-2xl p-4 ios-shadow">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-ios-text">Household Expenses</span>
                  <span className="text-xs text-ios-red font-semibold">{formatCurrency(current.outgoing.household70)}</span>
                </div>
                <div className="space-y-2">
                  {householdExpenses
                    .filter(e => e.values[selectedMonth] > 0)
                    .sort((a, b) => b.values[selectedMonth] - a.values[selectedMonth])
                    .map((expense) => (
                      <div key={expense.name} className="flex items-center justify-between py-1.5">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-ios-surface-2 flex items-center justify-center text-ios-text-secondary">
                            {expenseIcons[expense.name] || <ShoppingBag size={14} />}
                          </div>
                          <span className="text-xs text-ios-text-secondary">{expense.name}</span>
                        </div>
                        <span className="text-xs font-semibold text-ios-text">{formatCurrency(expense.values[selectedMonth])}</span>
                      </div>
                    ))}
                  {householdExpenses.filter(e => e.values[selectedMonth] > 0).length === 0 && (
                    <div className="text-center py-4 text-xs text-ios-text-secondary">No expenses recorded</div>
                  )}
                </div>
              </div>

              {/* Debt Repayment */}
              <div className="glass-card rounded-2xl p-4 ios-shadow">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-ios-text">Debt Repayment</span>
                  <span className="text-xs text-ios-orange font-semibold">{formatCurrency(current.outgoing.debt20)}</span>
                </div>
                <div className="space-y-2">
                  {debtRepayment
                    .filter(d => d.values[selectedMonth] > 0)
                    .map((debt) => (
                      <div key={debt.name} className="flex items-center justify-between py-1.5">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-ios-surface-2 flex items-center justify-center text-ios-text-secondary">
                            <CreditCard size={14} />
                          </div>
                          <span className="text-xs text-ios-text-secondary">{debt.name}</span>
                        </div>
                        <span className="text-xs font-semibold text-ios-text">{formatCurrency(debt.values[selectedMonth])}</span>
                      </div>
                    ))}
                </div>
              </div>

              {/* Expense Distribution */}
              {expenseChartData.length > 0 && (
                <div className="glass-card rounded-2xl p-4 ios-shadow">
                  <span className="text-sm font-semibold text-ios-text block mb-3">Expense Distribution</span>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={expenseChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={70}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {expenseChartData.map((_, i) => (
                            <Cell key={i} fill={['#0a84ff', '#30d158', '#ff9f0a', '#bf5af2', '#ff375f', '#5ac8fa', '#5e5ce6'][i % 7]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            background: '#1c1c1e',
                            border: '1px solid #38383a',
                            borderRadius: '12px',
                            fontSize: '12px',
                            color: '#fff',
                          }}
                          formatter={(val: unknown) => formatCurrency(val as number)}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-wrap gap-2 justify-center mt-2">
                    {expenseChartData.slice(0, 5).map((item, i) => (
                      <div key={item.name} className="flex items-center gap-1">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ background: ['#0a84ff', '#30d158', '#ff9f0a', '#bf5af2', '#ff375f'][i % 5] }}
                        />
                        <span className="text-[10px] text-ios-text-secondary">{item.name.slice(0, 8)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'debt' && (
            <motion.div
              key="debt"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-3"
            >
              {/* Debt Overview */}
              <div className="glass-card rounded-2xl p-4 ios-shadow">
                <span className="text-sm font-semibold text-ios-text block mb-3">Debt Overview</span>
                <div className="space-y-3">
                  {debtProgression.map((debt) => {
                    const currentVal = debt.values[selectedMonth];
                    const prevVal = selectedMonth > 0 ? debt.values[selectedMonth - 1] : currentVal;
                    const change = prevVal - currentVal;
                    return (
                      <div key={debt.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-ios-surface-2 flex items-center justify-center text-ios-text-secondary">
                            <CreditCard size={14} />
                          </div>
                          <div>
                            <div className="text-xs text-ios-text font-medium">{debt.name}</div>
                            <div className="text-[10px] text-ios-text-secondary">
                              {change > 0 ? `-${formatCurrency(change)} this month` : 'No change'}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-semibold text-ios-text">{formatCurrency(currentVal)}</div>
                          {change > 0 && (
                            <div className="text-[10px] text-ios-green">-{formatCurrency(change)}</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Debt Composition */}
              {debtPieData.length > 0 && (
                <div className="glass-card rounded-2xl p-4 ios-shadow">
                  <span className="text-sm font-semibold text-ios-text block mb-3">Debt Composition</span>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={debtPieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={70}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {debtPieData.map((entry, i) => (
                            <Cell key={i} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            background: '#1c1c1e',
                            border: '1px solid #38383a',
                            borderRadius: '12px',
                            fontSize: '12px',
                            color: '#fff',
                          }}
                          formatter={(val: unknown) => formatCurrency(val as number)}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex gap-3 justify-center mt-2">
                    {debtPieData.map((item) => (
                      <div key={item.name} className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full" style={{ background: item.color }} />
                        <span className="text-[10px] text-ios-text-secondary">{item.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Debt Progression Chart */}
              <div className="glass-card rounded-2xl p-4 ios-shadow">
                <span className="text-sm font-semibold text-ios-text block mb-3">Debt Progression</span>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={debtChartData}>
                      <defs>
                        <linearGradient id="vGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0a84ff" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#0a84ff" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="gGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#bf5af2" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#bf5af2" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="month" tick={{ fill: '#8e8e93', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{
                          background: '#1c1c1e',
                          border: '1px solid #38383a',
                          borderRadius: '12px',
                          fontSize: '12px',
                          color: '#fff',
                        }}
                        formatter={(val: unknown) => formatCurrency(val as number)}
                      />
                      <Area type="monotone" dataKey="vehicle" stroke="#0a84ff" strokeWidth={2} fill="url(#vGrad)" />
                      <Area type="monotone" dataKey="gpu" stroke="#bf5af2" strokeWidth={2} fill="url(#gGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* EMI Schedule */}
              <div className="glass-card rounded-2xl p-4 ios-shadow">
                <span className="text-sm font-semibold text-ios-text block mb-3">EMI Schedule</span>
                <div className="space-y-2">
                  {debtRepayment.map((debt) => (
                    <div key={debt.name}>
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="text-ios-text-secondary">{debt.name}</span>
                        <span className="text-ios-text font-medium">
                          {debt.values[selectedMonth] > 0 ? formatCurrency(debt.values[selectedMonth]) : 'Cleared'}
                        </span>
                      </div>
                      <div className="flex gap-0.5">
                        {debt.values.map((v, i) => (
                          <div
                            key={i}
                            className="flex-1 h-6 rounded-sm flex items-center justify-center"
                            style={{
                              background: v > 0
                                ? i === selectedMonth ? '#0a84ff' : '#0a84ff40'
                                : '#30d15830',
                            }}
                          >
                            <span className="text-[8px] text-white/70">{months[i].slice(0, 1)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
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
          ].map((tab) => (
            <motion.button
              key={tab.id}
              whileTap={{ scale: 0.9 }}
              onClick={() => setActiveTab(tab.id)}
              className="flex flex-col items-center gap-1"
            >
              <div className={activeTab === tab.id ? 'text-ios-blue' : 'text-ios-text-secondary'}>
                {tab.icon}
              </div>
              <span className={`text-[10px] font-medium ${activeTab === tab.id ? 'text-ios-blue' : 'text-ios-text-secondary'}`}>
                {tab.label}
              </span>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}

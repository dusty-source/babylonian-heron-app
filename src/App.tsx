import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wallet, TrendingUp, TrendingDown, Home, CreditCard, PiggyBank,
  BarChart3, ArrowUpRight, ArrowDownRight, Activity, Plus, Trash2,
  Edit3, Check, RotateCcw, Clock, AlertTriangle, Lock, Settings,
  Shield, Sparkles, ChevronRight, X, Repeat, Target, Swords, AlertOctagon, Zap
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie,
  BarChart, Bar, LineChart, Line
} from 'recharts';
import { useBudgetStore } from './store/useBudgetStore';
import type { TaxEntry, WindfallResult, InterceptorStatus } from './store/useBudgetStore';
import { formatCurrency, getStatusColor, getRemarkColor, getBurnRingColor, getBurnStatusColor, getTaxCategoryColor } from './data/budgetData';
import type { BurnRate } from './data/budgetData';

type Tab = 'overview' | 'details' | 'debt' | 'tax' | 'war';
type EditSection = 'income' | 'household' | 'debt-repay' | 'savings' | 'debt-prog' | 'tax' | null;
type PasscodeMode = 'set' | 'verify' | null;
type RecurringFreq = 'none' | 'monthly' | 'quarterly' | 'annual';

/* ─── Reusable Components ─────────────────────────────────── */

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

function RecurringBadge({ freq }: { freq?: RecurringFreq }) {
  if (!freq || freq === 'none') return null;
  const colors = { monthly: '#30d158', quarterly: '#0a84ff', annual: '#bf5af2' };
  const labels = { monthly: 'M', quarterly: 'Q', annual: 'A' };
  return (
    <span className="recurring-badge" style={{ background: `${colors[freq]}22`, color: colors[freq] }}>
      <Repeat size={8} className="mr-0.5 inline" />{labels[freq]}
    </span>
  );
}

function EditableRow({
  name, value, onChange, onNameChange, onDelete, isEditing, recurring, onRecurringChange
}: {
  name: string; value: number; onChange: (v: number) => void;
  onNameChange?: (n: string) => void; onDelete?: () => void;
  isEditing: boolean; recurring?: RecurringFreq; onRecurringChange?: (f: RecurringFreq) => void;
}) {
  const [localVal, setLocalVal] = useState(String(value));
  const [localName, setLocalName] = useState(name);

  if (!isEditing) {
    return (
      <div className="flex items-center justify-between py-1.5">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-ios-text-secondary">{name}</span>
          <RecurringBadge freq={recurring} />
        </div>
        <span className="text-xs font-semibold text-ios-text tabular-nums">{formatCurrency(value)}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 py-1 flex-wrap">
      {onNameChange && (
        <input value={localName} onChange={e => setLocalName(e.target.value)} onBlur={() => onNameChange(localName)}
          className="flex-1 min-w-0 bg-ios-surface-2 rounded-lg px-2 py-1 text-xs text-ios-text border border-ios-border/30 focus:border-ios-blue outline-none" />
      )}
      {!onNameChange && <span className="flex-1 text-xs text-ios-text-secondary truncate">{name}</span>}
      <input type="number" value={localVal} onChange={e => setLocalVal(e.target.value)} onBlur={() => onChange(Number(localVal) || 0)}
        className="w-20 bg-ios-surface-2 rounded-lg px-2 py-1 text-xs text-ios-text text-right border border-ios-border/30 focus:border-ios-blue outline-none tabular-nums" />
      {onRecurringChange && (
        <div className="flex gap-0.5">
          {(['none','monthly','quarterly','annual'] as RecurringFreq[]).map(f => (
            <button key={f} onClick={() => onRecurringChange(f)}
              className={`px-1.5 py-0.5 rounded text-[9px] font-medium uppercase transition-all ${recurring === f ? 'bg-ios-blue text-white' : 'bg-ios-surface-2 text-ios-text-secondary'}`}>
              {f === 'none' ? '×' : f[0]}
            </button>
          ))}
        </div>
      )}
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

/* ─── Phase 1: BurnRateCard ───────────────────────────────── */

function BurnRateCard({ burn }: { burn: BurnRate }) {
  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (burn.usedPct / 100) * circumference;
  const color = getBurnRingColor(burn.usedPct);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.5 }}
      className="glass-card rounded-2xl p-4 ios-shadow">
      <div className="flex items-center gap-3">
        <div className="burn-ring">
          <svg viewBox="0 0 72 72">
            <circle className="burn-ring-bg" cx="36" cy="36" r={radius} />
            <circle className="burn-ring-progress" cx="36" cy="36" r={radius}
              stroke={color} strokeDasharray={circumference} strokeDashoffset={offset} />
          </svg>
          <div className="burn-ring-text" style={{ color }}>{Math.round(burn.usedPct)}%</div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs text-ios-text-secondary mb-0.5">Daily Allowance</div>
          <div className="text-lg font-bold tabular-nums" style={{ color: getBurnStatusColor(burn.status) }}>
            {formatCurrency(Math.round(burn.dailyAllowance))}
            <span className="text-[10px] font-normal text-ios-text-secondary ml-1">/day</span>
          </div>
          <div className="text-[10px] text-ios-text-secondary mt-0.5">
            {burn.isCapReached ? (
              <span className="text-ios-red font-semibold">CAP BROKEN — {formatCurrency(burn.spent - burn.cap)} over</span>
            ) : burn.daysUntilExhaustion <= burn.daysRemaining ? (
              <span>Exhausts in <span className="font-semibold text-ios-orange">{burn.daysUntilExhaustion} days</span></span>
            ) : (
              <span>Safe — <span className="font-semibold text-ios-green">{burn.daysRemaining} days left</span></span>
            )}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-ios-border/20">
        <div className="text-center">
          <div className="text-[10px] text-ios-text-secondary">Spent</div>
          <div className="text-xs font-semibold text-ios-text tabular-nums">{formatCurrency(burn.spent)}</div>
        </div>
        <div className="text-center">
          <div className="text-[10px] text-ios-text-secondary">Cap</div>
          <div className="text-xs font-semibold text-ios-text tabular-nums">{formatCurrency(burn.cap)}</div>
        </div>
        <div className="text-center">
          <div className="text-[10px] text-ios-text-secondary">Remaining</div>
          <div className="text-xs font-semibold tabular-nums" style={{ color: burn.remaining > 0 ? '#30d158' : '#ff453a' }}>
            {formatCurrency(burn.remaining)}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Phase 1: CrashBanner ──────────────────────────────────── */

function CrashBanner({ burn }: { burn: BurnRate }) {
  if (burn.usedPct < 60) return null;

  let message = '';
  let icon = <AlertTriangle size={16} />;
  let bg = '';

  if (burn.usedPct >= 100) {
    message = `BUDGET BROKEN — You are ${formatCurrency(burn.spent - burn.cap)} over the 70% household cap. Stop spending.`;
    bg = 'rgba(255,55,95,0.12)';
  } else if (burn.usedPct >= 85) {
    message = `DISASTER IN MAKING — At this rate, your budget crashes in ${burn.daysUntilExhaustion} days. Slow down now.`;
    bg = 'rgba(255,55,95,0.08)';
  } else {
    message = `WATCH OUT — ${Math.round(burn.usedPct)}% of household budget used. Pace yourself.`;
    bg = 'rgba(255,159,10,0.08)';
  }

  return (
    <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
      className="crash-banner rounded-xl px-4 py-3 mx-4 mb-3" style={{ background: bg }}>
      <div className="flex items-center gap-2">
        <div className="crash-icon-wrap" style={{ color: burn.usedPct >= 85 ? '#ff375f' : '#ff9f0a' }}>{icon}</div>
        <span className="text-[11px] font-semibold leading-tight" style={{ color: burn.usedPct >= 85 ? '#ff375f' : '#ff9f0a' }}>
          {message}
        </span>
      </div>
    </motion.div>
  );
}

/* ─── Phase 1: PasscodeModal ──────────────────────────────── */

function PasscodeModal({ mode, onVerify, onSet, onClose }: {
  mode: PasscodeMode;
  onVerify: (code: string) => boolean;
  onSet: (code: string) => void;
  onClose: () => void;
}) {
  const [input, setInput] = useState('');
  const [error, setError] = useState(false);

  const handleKey = (key: string) => {
    if (input.length < 4) {
      const next = input + key;
      setInput(next);
      if (next.length === 4) {
        setTimeout(() => {
          if (mode === 'set') {
            onSet(next);
            setInput('');
            onClose();
          } else {
            if (onVerify(next)) {
              setInput('');
              onClose();
            } else {
              setError(true);
              setTimeout(() => { setError(false); setInput(''); }, 400);
            }
          }
        }, 150);
      }
    }
  };

  const handleBackspace = () => setInput(prev => prev.slice(0, -1));
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="passcode-overlay">
      <div className="absolute top-6 right-6">
        <button onClick={onClose} className="w-10 h-10 rounded-full bg-ios-surface-2 flex items-center justify-center text-ios-text-secondary">
          <X size={18} />
        </button>
      </div>
      <div className="text-center mb-8">
        <div className="w-14 h-14 rounded-2xl bg-ios-blue/20 flex items-center justify-center mx-auto mb-4">
          <Lock size={24} className="text-ios-blue" />
        </div>
        <h3 className="text-lg font-semibold text-ios-text mb-1">
          {mode === 'set' ? 'Set Passcode' : 'Enter Passcode'}
        </h3>
        <p className="text-xs text-ios-text-secondary">
          {mode === 'set' ? 'Create a 4-digit override code' : 'Unlock to add expenses'}
        </p>
      </div>
      <div className="passcode-dots">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className={`passcode-dot ${i < input.length ? 'filled' : ''} ${error ? 'animate-pulse' : ''}`}
            style={error ? { borderColor: '#ff375f', background: '#ff375f' } : {}} />
        ))}
      </div>
      <div className="passcode-pad">
        {keys.map((k, i) => (
          k === '' ? <div key={i} /> : (
            <button key={i} onClick={() => k === '⌫' ? handleBackspace() : handleKey(k)}
              className="passcode-key" style={k === '⌫' ? { fontSize: 18 } : {}}>
              {k}
            </button>
          )
        ))}
      </div>
    </motion.div>
  );
}

/* ─── Phase 2: DebtSimulatorCard ──────────────────────────── */

function DebtSimulatorCard({ store }: { store: ReturnType<typeof useBudgetStore> }) {
  const [strategy, setStrategy] = useState<'snowball' | 'avalanche'>('avalanche');
  const [extraMonthly, setExtraMonthly] = useState(5000);
  const [selectedDebtExtra, setSelectedDebtExtra] = useState<string>('vehicle');

  const { currentYear, getCurrentDebtBalance, getDebtMonthsRemaining, calculateDebtPayoff, calculateExtraPaymentImpact, updateDebtMeta } = store;

  const payoff = useMemo(() => calculateDebtPayoff(strategy, extraMonthly), [calculateDebtPayoff, strategy, extraMonthly]);
  const extraImpact = useMemo(() => calculateExtraPaymentImpact(selectedDebtExtra, extraMonthly), [calculateExtraPaymentImpact, selectedDebtExtra, extraMonthly]);

  if (!currentYear) return null;

  return (
    <div className="space-y-3">
      {currentYear.debtMeta.map(meta => {
        const balance = getCurrentDebtBalance(meta.debtId);
        const monthsLeft = getDebtMonthsRemaining(meta.debtId);
        const progress = meta.originalPrincipal > 0 ? ((meta.originalPrincipal - balance) / meta.originalPrincipal) * 100 : 0;
        return (
          <motion.div key={meta.debtId} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-2xl p-4 ios-shadow">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-ios-blue/20 text-ios-blue"><CreditCard size={14} /></div>
                <span className="text-xs font-semibold text-ios-text">{meta.name}</span>
              </div>
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-ios-surface-2 text-ios-text-secondary">{monthsLeft} payments left</span>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <div>
                <div className="text-[10px] text-ios-text-secondary">Balance</div>
                <div className="text-xs font-semibold text-ios-text tabular-nums">{formatCurrency(Math.round(balance))}</div>
              </div>
              <div>
                <div className="text-[10px] text-ios-text-secondary">EMI</div>
                <div className="text-xs font-semibold text-ios-text tabular-nums">{formatCurrency(meta.emiAmount)}</div>
              </div>
            </div>
            <div className="mb-2">
              <div className="flex justify-between text-[10px] mb-1">
                <span className="text-ios-text-secondary">Paid off</span>
                <span className="text-ios-green font-medium">{Math.round(progress)}%</span>
              </div>
              <div className="w-full h-1.5 bg-ios-surface-2 rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.8 }} className="h-full rounded-full bg-ios-blue" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-ios-text-secondary">Rate</span>
              <input type="number" value={meta.interestRate}
                onChange={e => updateDebtMeta(meta.debtId, { interestRate: Number(e.target.value) || 0 })}
                className="w-16 bg-ios-surface-2 rounded-lg px-2 py-1 text-[10px] text-ios-text text-right border border-ios-border/30 focus:border-ios-blue outline-none tabular-nums" />
              <span className="text-[10px] text-ios-text-secondary">%</span>
            </div>
          </motion.div>
        );
      })}

      <div className="glass-card rounded-2xl p-4 ios-shadow">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-ios-text">Payoff Strategy</span>
          <div className="flex bg-ios-surface-2 rounded-lg p-0.5">
            <button onClick={() => setStrategy('snowball')} className={`px-2 py-1 rounded-md text-[10px] font-medium transition-all ${strategy === 'snowball' ? 'bg-ios-surface text-ios-text' : 'text-ios-text-secondary'}`}>Snowball</button>
            <button onClick={() => setStrategy('avalanche')} className={`px-2 py-1 rounded-md text-[10px] font-medium transition-all ${strategy === 'avalanche' ? 'bg-ios-surface text-ios-text' : 'text-ios-text-secondary'}`}>Avalanche</button>
          </div>
        </div>
        {payoff && (
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className="text-center p-2 rounded-xl bg-ios-surface-2">
              <div className="text-[10px] text-ios-text-secondary">Total Months</div>
              <div className="text-sm font-bold text-ios-text">{payoff.totalMonths}</div>
            </div>
            <div className="text-center p-2 rounded-xl bg-ios-surface-2">
              <div className="text-[10px] text-ios-text-secondary">Interest</div>
              <div className="text-sm font-bold text-ios-orange">{formatCurrency(payoff.totalInterest)}</div>
            </div>
            <div className="text-center p-2 rounded-xl bg-ios-surface-2">
              <div className="text-[10px] text-ios-text-secondary">Principal</div>
              <div className="text-sm font-bold text-ios-green">{formatCurrency(payoff.totalPrincipal)}</div>
            </div>
          </div>
        )}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-ios-text-secondary">Extra/month</span>
          <input type="range" min="0" max="50000" step="1000" value={extraMonthly}
            onChange={e => setExtraMonthly(Number(e.target.value))} className="flex-1 accent-ios-blue" />
          <span className="text-xs font-semibold text-ios-text w-16 text-right tabular-nums">{formatCurrency(extraMonthly)}</span>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-4 ios-shadow">
        <div className="flex items-center gap-2 mb-3">
          <Target size={14} className="text-ios-purple" />
          <span className="text-sm font-semibold text-ios-text">Extra Payment Impact</span>
        </div>
        <div className="flex items-center gap-2 mb-3">
          <select value={selectedDebtExtra} onChange={e => setSelectedDebtExtra(e.target.value)}
            className="flex-1 bg-ios-surface-2 rounded-lg px-2 py-1.5 text-xs text-ios-text border border-ios-border/30 focus:border-ios-blue outline-none">
            {currentYear.debtMeta.filter(m => getCurrentDebtBalance(m.debtId) > 0).map(m => (
              <option key={m.debtId} value={m.debtId}>{m.name}</option>
            ))}
          </select>
        </div>
        {extraImpact && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
            <div className="p-3 rounded-xl bg-ios-green/10 border border-ios-green/20">
              <div className="text-[10px] text-ios-green font-medium mb-1">IMPACT</div>
              <div className="text-xs text-ios-text leading-relaxed">
                Pay <span className="font-semibold text-ios-text">{formatCurrency(extraMonthly)}</span> extra on {extraImpact.debtName} EMI →
                save <span className="font-semibold text-ios-green">{formatCurrency(extraImpact.interestSaved)}</span> interest →
                debt-free <span className="font-semibold text-ios-green">{extraImpact.monthsSaved}</span> months earlier
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="text-center p-2 rounded-xl bg-ios-surface-2">
                <div className="text-[10px] text-ios-text-secondary">Current</div>
                <div className="text-xs font-semibold text-ios-text">{extraImpact.baselineMonths} mo</div>
              </div>
              <div className="text-center p-2 rounded-xl bg-ios-surface-2">
                <div className="text-[10px] text-ios-text-secondary">With Extra</div>
                <div className="text-xs font-semibold text-ios-green">{extraImpact.newPayoffMonths} mo</div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

/* ─── Phase 3: Windfall Modal ─────────────────────────────── */

function WindfallModal({ data, activeYear, onApply, onClose }: { data: WindfallResult; activeYear: string; onApply: () => void; onClose: () => void }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-5">
      <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
        className="glass-card rounded-2xl p-5 w-full max-w-xs ios-shadow border border-ios-yellow/20">
        <div className="w-12 h-12 rounded-2xl bg-ios-yellow/20 flex items-center justify-center mx-auto mb-3">
          <Sparkles size={24} className="text-ios-yellow" />
        </div>
        <h3 className="text-base font-bold text-ios-text text-center mb-1">Windfall Detected!</h3>
        <p className="text-[11px] text-ios-text-secondary text-center mb-4">
          Extra income of {formatCurrency(data.extraIncome)} detected. Heron suggests:
        </p>
        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between py-2 px-3 rounded-xl bg-ios-green/10 border border-ios-green/20">
            <span className="text-xs text-ios-green font-medium">10% Savings</span>
            <span className="text-sm font-bold text-ios-green tabular-nums">{formatCurrency(data.toSavings)}</span>
          </div>
          <div className="flex items-center justify-between py-2 px-3 rounded-xl bg-ios-blue/10 border border-ios-blue/20">
            <span className="text-xs text-ios-blue font-medium">70% Household Buffer</span>
            <span className="text-sm font-bold text-ios-blue tabular-nums">{formatCurrency(data.toHousehold)}</span>
          </div>
          <div className="flex items-center justify-between py-2 px-3 rounded-xl bg-ios-purple/10 border border-ios-purple/20">
            <span className="text-xs text-ios-purple font-medium">20% Debt Knockout</span>
            <span className="text-sm font-bold text-ios-purple tabular-nums">{formatCurrency(data.toDebt)}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { sessionStorage.setItem(`windfall-${activeYear}-${data.monthIndex}`, '1'); onClose(); }}
            className="flex-1 py-2.5 rounded-xl bg-ios-surface-2 text-xs font-medium text-ios-text-secondary">Dismiss</button>
          <button onClick={() => { onApply(); onClose(); }}
            className="flex-1 py-2.5 rounded-xl bg-ios-yellow/20 text-xs font-bold text-ios-yellow">Apply</button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─── Phase 4: Interceptor Modal ─────────────────────────────── */

function InterceptorModal({ status, onReview, onOverride, onClose }: {
  status: InterceptorStatus;
  onReview: () => void;
  onOverride: () => void;
  onClose: () => void;
}) {
  const totalCut = status.suggestions.reduce((s, g) => s + g.monthlyAvg, 0);
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-5">
      <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
        className="glass-card rounded-2xl p-5 w-full max-w-xs ios-shadow border border-ios-red/20">
        <div className="w-12 h-12 rounded-2xl bg-ios-red/20 flex items-center justify-center mx-auto mb-3">
          <AlertOctagon size={24} className="text-ios-red" />
        </div>
        <h3 className="text-base font-bold text-ios-text text-center mb-1">DISASTER STREAK: {status.streak} MONTHS</h3>
        <p className="text-[11px] text-ios-text-secondary text-center mb-4">
          Your household budget has been in disaster mode for {status.streak} consecutive months. Action required before adding new expenses.
        </p>
        {status.suggestions.length > 0 && (
          <div className="space-y-2 mb-4">
            <div className="text-[10px] text-ios-text-secondary font-medium uppercase tracking-wider">Suggested Cuts</div>
            {status.suggestions.map(s => (
              <div key={s.name} className="flex justify-between py-2 px-3 rounded-xl bg-ios-surface-2">
                <span className="text-xs text-ios-text-secondary">{s.name}</span>
                <span className="text-xs font-semibold text-ios-red">-{formatCurrency(s.monthlyAvg)}/mo</span>
              </div>
            ))}
            <div className="flex justify-between py-2 px-3 rounded-xl bg-ios-red/10 border border-ios-red/20">
              <span className="text-xs text-ios-red font-medium">Total Monthly Cut</span>
              <span className="text-xs font-bold text-ios-red">{formatCurrency(totalCut)}/mo</span>
            </div>
          </div>
        )}
        <div className="space-y-2">
          <button onClick={() => { onReview(); onClose(); }}
            className="w-full py-2.5 rounded-xl bg-ios-blue/20 text-xs font-medium text-ios-blue">Review Budget</button>
          <button onClick={() => { onOverride(); onClose(); }}
            className="w-full py-2.5 rounded-xl bg-ios-surface-2 text-xs font-medium text-ios-text-secondary">Override & Add Anyway</button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─── Main App ────────────────────────────────────────────── */

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [selectedMonth, setSelectedMonth] = useState(0);
  const [editSection, setEditSection] = useState<EditSection>(null);
  const [newEntryName, setNewEntryName] = useState('');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showAddYear, setShowAddYear] = useState(false);
  const [newYearVal, setNewYearVal] = useState('');
  const [showYearMenu, setShowYearMenu] = useState(false);

    /* Phase 3 state */
  const [showWindfall, setShowWindfall] = useState(false);
  const [windfallData, setWindfallData] = useState<WindfallResult | null>(null);
  const [showTaxAdd, setShowTaxAdd] = useState(false);
  const [newTaxName, setNewTaxName] = useState('');
  const [newTaxCategory, setNewTaxCategory] = useState<TaxEntry['category']>('other');
  const [newTaxLimit, setNewTaxLimit] = useState('150000');
  
  /* Phase 1 state */
  const [passcodeMode, setPasscodeMode] = useState<PasscodeMode>(null);
  const [capOverride, setCapOverride] = useState(false);
  const [showCapToast, setShowCapToast] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showInterceptor, setShowInterceptor] = useState(false);
  const [interceptorBypass, setInterceptorBypass] = useState(false);

  const store = useBudgetStore();
  const { state, currentYear, updateEntryValue, updateEntryName, addEntry, deleteEntry,
    setActiveYear, addYear, deleteYear, resetToDefaults,
    autoAllocate, setPasscode, verifyPasscode, getBurnRate,
    getIncomeTotal, getOutgoingTotal, getAllocationTotal, getHouseholdTotal, getDebtRepaymentTotal,
    toggleRecurring, applyRecurringAutopilot, getCommittedRecurring, getTrueDisposable,
    addTaxEntry, updateTaxEntryValue, deleteTaxEntry,
    getTaxShieldStatus, detectWindfall, applyWindfall, setWindfallBaseline,
    getDisasterStreak, getRecoveryStreak, getInterceptorStatus, getYearComparison,
    getDebtReductionVelocity, getSavingsAccumulation } = store;

  const months = currentYear?.months || [];
  const currentMonth = months[selectedMonth] || '';

  const incomeTotal = getIncomeTotal(selectedMonth);
  const outgoingTotal = getOutgoingTotal(selectedMonth);
  const allocationTotal = getAllocationTotal(selectedMonth);
  const householdTotal = getHouseholdTotal(selectedMonth);
  const debtRepayTotal = getDebtRepaymentTotal(selectedMonth);
  const committedRecurring = useMemo(() => getCommittedRecurring(selectedMonth), [getCommittedRecurring, selectedMonth]);
  const trueDisposable = useMemo(() => getTrueDisposable(selectedMonth), [getTrueDisposable, selectedMonth]);
  const interceptorStatus = useMemo(() => getInterceptorStatus(selectedMonth), [getInterceptorStatus, selectedMonth]);
  const disasterStreak = useMemo(() => getDisasterStreak(selectedMonth), [getDisasterStreak, selectedMonth]);
  const recoveryStreak = useMemo(() => getRecoveryStreak(selectedMonth), [getRecoveryStreak, selectedMonth]);
  const yearComparison = useMemo(() => getYearComparison(), [getYearComparison]);
  
  /* Phase 1: cap check for selected month */
  const selectedMonthCap = useMemo(() => {
    if (!currentYear) return null;
    const capEntry = currentYear.allocationEntries.find(e => e.id === 'house70');
    const cap = capEntry?.values[selectedMonth] || 0;
    const spent = currentYear.householdExpenses.reduce((sum, e) => sum + (e.values[selectedMonth] || 0), 0);
    return { cap, spent, isCapReached: cap > 0 && spent >= cap };
  }, [currentYear, selectedMonth]);

  /* Phase 1: burn rate for current calendar month */
  const burnRate = useMemo(() => getBurnRate(), [getBurnRate]);

  /* Reset cap override when month/year changes */
  useEffect(() => {
    setCapOverride(false);
    setInterceptorBypass(false);
  }, [selectedMonth, state.activeYear]);

  /* Phase 3: windfall detection */
  useEffect(() => {
    const wf = detectWindfall(selectedMonth);
    if (wf && wf.extraIncome > 5000) {
      setWindfallData(wf);
      // Auto-show only once per month session — user can dismiss
      const dismissed = sessionStorage.getItem(`windfall-${state.activeYear}-${selectedMonth}`);
      if (!dismissed) setShowWindfall(true);
    } else {
      setWindfallData(null);
    }
  }, [selectedMonth, state.activeYear, detectWindfall]);
  
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

  /* Phase 1: handleAddEntry with cap lock */
  const handleAddEntry = (section: keyof YearData) => {
    if (!newEntryName.trim()) return;
    if (section === 'householdExpenses') {
      if (interceptorStatus.shouldBlock && !interceptorBypass) {
        setShowInterceptor(true);
        return;
      }
    }
    if (section === 'householdExpenses' && selectedMonthCap?.isCapReached && !capOverride) {
      setShowCapToast(true);
      setTimeout(() => setShowCapToast(false), 3000);
      setPasscodeMode('verify');
      return;
    }
    addEntry(section, newEntryName.trim().toUpperCase());
    setNewEntryName('');
    setCapOverride(false);
    setInterceptorBypass(false);
  };

    const handleAddYear = () => {
    if (!newYearVal.trim() || !/^\d{4}$/.test(newYearVal)) return;
    addYear(newYearVal.trim());
    setNewYearVal('');
    setShowAddYear(false);
  };

  /* Phase 1: income edit wrapper that triggers auto-allocation */
  const handleIncomeEdit = (entryId: string, monthIndex: number, value: number) => {
    updateEntryValue('incomeEntries', entryId, monthIndex, value);
    setTimeout(() => autoAllocate(monthIndex), 0);
  };

  const SectionHeader = ({ title, section, onAdd, locked }: { title: string; section: EditSection; onAdd?: () => void; locked?: boolean }) => (
    <div className="flex items-center justify-between mb-3">
      <span className="text-sm font-semibold text-ios-text">{title}</span>
      <div className="flex items-center gap-2">
        {onAdd && editSection === section && (
          <div className="flex items-center gap-1">
            <input value={newEntryName} onChange={e => setNewEntryName(e.target.value)} placeholder="NAME"
              className="w-24 bg-ios-surface-2 rounded-lg px-2 py-1 text-[10px] text-ios-text border border-ios-border/30 focus:border-ios-blue outline-none" />
            <motion.button whileTap={{ scale: 0.8 }} onClick={onAdd}
              className={`w-6 h-6 rounded-lg flex items-center justify-center ${locked ? 'bg-ios-red/20 text-ios-red' : 'bg-ios-green/20 text-ios-green'}`}>
              {locked ? <Lock size={10} /> : <Plus size={12} />}
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
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => setShowSettings(true)}
              className="w-9 h-9 rounded-full bg-ios-surface-2 flex items-center justify-center ios-shadow-sm text-ios-text-secondary">
              <Settings size={16} />
            </motion.button>
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

      {/* Phase 1: Crash Banner */}
      {burnRate && <CrashBanner burn={burnRate} />}

            {/* Phase 4: Disaster / Recovery Streak Banner */}
      {disasterStreak >= 2 && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="mx-4 mb-3 px-4 py-2.5 rounded-xl bg-ios-red/10 border border-ios-red/20 flex items-center gap-2">
          <AlertOctagon size={14} className="text-ios-red flex-shrink-0" />
          <span className="text-[11px] font-semibold text-ios-red">DISASTER STREAK: {disasterStreak} months — Interceptor Active</span>
        </motion.div>
      )}
      {recoveryStreak >= 2 && disasterStreak < 2 && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="mx-4 mb-3 px-4 py-2.5 rounded-xl bg-ios-green/10 border border-ios-green/20 flex items-center gap-2">
          <Zap size={14} className="text-ios-green flex-shrink-0" />
          <span className="text-[11px] font-semibold text-ios-green">RECOVERY STREAK: {recoveryStreak} months — BRAVO!</span>
        </motion.div>
      )}
      
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

      {/* Phase 1: Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-6">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="glass-card rounded-2xl p-5 w-full max-w-xs ios-shadow">
              <h3 className="text-sm font-semibold text-ios-text mb-3">Settings</h3>
              <button onClick={() => { setPasscodeMode('set'); setShowSettings(false); }}
                className="w-full text-left px-3 py-2.5 rounded-xl bg-ios-surface-2 text-xs text-ios-text mb-2 flex items-center justify-between">
                <span>{state.passcode ? 'Change Passcode' : 'Set Passcode'}</span>
                <ChevronRight size={14} className="text-ios-text-secondary" />
              </button>
              {state.passcode && (
                <div className="text-[10px] text-ios-text-secondary px-1 mb-2">
                  Passcode is set. Used to override 70% household cap lock.
                </div>
              )}
              <button onClick={() => setShowSettings(false)}
                className="w-full py-2 rounded-xl bg-ios-blue/20 text-xs font-medium text-ios-blue mt-2">Done</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Phase 1: Passcode Modal */}
      <AnimatePresence>
        {passcodeMode && (
          <PasscodeModal
            mode={passcodeMode}
            onVerify={(code) => {
              const ok = verifyPasscode(code);
              if (ok) setCapOverride(true);
              return ok;
            }}
            onSet={(code) => setPasscode(code)}
            onClose={() => setPasscodeMode(null)}
          />
        )}
      </AnimatePresence>

      {/* Phase 3: Windfall Modal */}
      <AnimatePresence>
        {showWindfall && windfallData && (
          <WindfallModal
            data={windfallData}
            activeYear={state.activeYear}
            onApply={() => applyWindfall(windfallData)}
            onClose={() => setShowWindfall(false)}
          />
        )}
      </AnimatePresence>

      {/* Phase 4: Interceptor Modal */}
      <AnimatePresence>
        {showInterceptor && (
          <InterceptorModal
            status={interceptorStatus}
            onReview={() => { setActiveTab('details'); setInterceptorBypass(false); }}
            onOverride={() => { setInterceptorBypass(true); }}
            onClose={() => setShowInterceptor(false)}
          />
        )}
      </AnimatePresence>
      
      {/* Phase 1: Cap Block Toast */}
      <div className={`cap-toast ${showCapToast ? 'active' : ''}`}>
        <Lock size={14} className="inline mr-1" /> 70% Cap Reached — Passcode Required
      </div>

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
          {(['overview', 'details', 'debt', 'tax', 'audit'] as Tab[]).map(tab => (
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

              {/* Phase 1: Burn Rate Card (only for current year) */}
              {burnRate && <BurnRateCard burn={burnRate} />}

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
                      onChange={v => handleIncomeEdit(entry.id, selectedMonth, v)}
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
              
              {/* Phase 2: True Disposable Card */}
              <div className="glass-card rounded-2xl p-4 ios-shadow">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-ios-text">True Disposable</span>
                  <span className="text-xs font-bold text-ios-blue tabular-nums">{formatCurrency(trueDisposable)}</span>
                </div>
                <div className="flex justify-between text-[10px] mb-1">
                  <span className="text-ios-text-secondary">Committed Recurring</span>
                  <span className="text-ios-text-secondary tabular-nums">{formatCurrency(committedRecurring)}</span>
                </div>
                <ProgressBar value={committedRecurring} max={selectedMonthCap?.cap || 1} color="#bf5af2" />
                <div className="flex justify-between text-[10px] mt-1">
                  <span className="text-ios-text-secondary">70% Cap</span>
                  <span className="text-ios-text-secondary tabular-nums">{formatCurrency(selectedMonthCap?.cap || 0)}</span>
                </div>
                <motion.button whileTap={{ scale: 0.95 }} onClick={() => applyRecurringAutopilot(selectedMonth)}
                  className="w-full mt-3 py-2 rounded-xl bg-ios-purple/20 text-xs font-medium text-ios-purple flex items-center justify-center gap-1.5">
                  <Repeat size={12} /> Apply Recurring Autopilot
                </motion.button>
              </div>

              <div className="glass-card rounded-2xl p-4 ios-shadow">
                <SectionHeader title="Household Expenses" section="household" onAdd={() => handleAddEntry('householdExpenses')} locked={selectedMonthCap?.isCapReached && !capOverride} />
                <div className="space-y-1">
                  {currentYear.householdExpenses.map(entry => (
                    <EditableRow key={entry.id} name={entry.name} value={entry.values[selectedMonth]}
                      isEditing={editSection === 'household'}
                      recurring={entry.recurring}
                      onRecurringChange={f => toggleRecurring('householdExpenses', entry.id, f)}
                      onChange={v => updateEntryValue('householdExpenses', entry.id, selectedMonth, v)}
                      onNameChange={n => updateEntryName('householdExpenses', entry.id, n)}
                      onDelete={() => deleteEntry('householdExpenses', entry.id)} />
                  ))}
                  <div className="pt-2 border-t border-ios-border/30 flex justify-between">
                    <span className="text-xs font-semibold text-ios-text">Total</span>
                    <span className="text-xs font-bold text-ios-red">{formatCurrency(householdTotal)}</span>
                  </div>
                  {selectedMonthCap && selectedMonthCap.cap > 0 && (
                    <div className="mt-2">
                      <div className="flex justify-between text-[10px] mb-1">
                        <span className="text-ios-text-secondary">70% Cap Usage</span>
                        <span className={selectedMonthCap.isCapReached ? 'text-ios-red font-semibold' : 'text-ios-text-secondary'}>
                          {Math.min(100, Math.round((selectedMonthCap.spent / selectedMonthCap.cap) * 100))}%
                        </span>
                      </div>
                      <ProgressBar value={selectedMonthCap.spent} max={selectedMonthCap.cap} color={selectedMonthCap.isCapReached ? '#ff375f' : '#0a84ff'} />
                    </div>
                  )}
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
              <DebtSimulatorCard store={store} />

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
                          <Clock size={12} />
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

          {activeTab === 'tax' && (
            <motion.div key="tax" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }} className="space-y-3">
              {/* 80C Progress Ring */}
              {(() => {
                const tax = getTaxShieldStatus(selectedMonth);
                const radius = 36;
                const circumference = 2 * Math.PI * radius;
                const offset = circumference - (tax.pct / 100) * circumference;
                return (
                  <div className="glass-card rounded-2xl p-4 ios-shadow">
                    <div className="flex items-center gap-4">
                      <div className="relative w-20 h-20 flex-shrink-0">
                        <svg viewBox="0 0 84 84" className="w-20 h-20 -rotate-90">
                          <circle cx="42" cy="42" r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
                          <circle cx="42" cy="42" r={radius} fill="none" stroke={tax.pct >= 100 ? '#30d158' : tax.pct >= 70 ? '#0a84ff' : '#ff9f0a'}
                            strokeWidth="8" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-sm font-bold text-ios-text">{Math.round(tax.pct)}%</span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-ios-text-secondary mb-0.5">Section 80C Limit</div>
                        <div className="text-lg font-bold text-ios-text tabular-nums">{formatCurrency(tax.filled)} <span className="text-xs font-normal text-ios-text-secondary">/ {formatCurrency(tax.limit)}</span></div>
                        <div className="text-[10px] mt-1">
                          {tax.pct >= 100 ? (
                            <span className="text-ios-green font-semibold">Limit Filled! Well done.</span>
                          ) : (
                            <span className="text-ios-text-secondary">Gap: <span className="text-ios-orange font-semibold">{formatCurrency(tax.gap)}</span> · SIP: {formatCurrency(tax.monthlySipNeeded)}/mo</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Tax Entries */}
              <div className="glass-card rounded-2xl p-4 ios-shadow">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-ios-text">Tax Investments</span>
                  <motion.button whileTap={{ scale: 0.9 }} onClick={() => setShowTaxAdd(true)}
                    className="w-7 h-7 rounded-lg bg-ios-green/20 flex items-center justify-center text-ios-green">
                    <Plus size={14} />
                  </motion.button>
                </div>
                <div className="space-y-2">
                  {currentYear.taxShieldEntries.map(entry => {
                    const val = entry.values[selectedMonth] || 0;
                    const catColor = getTaxCategoryColor(entry.category);
                    return (
                      <div key={entry.id} className="flex items-center gap-3 py-2 border-b border-ios-border/20 last:border-0">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${catColor}18`, color: catColor }}>
                          <Target size={14} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center mb-0.5">
                            <span className="text-xs text-ios-text-secondary truncate">{entry.name}</span>
                            <span className="text-xs font-semibold text-ios-text tabular-nums">{formatCurrency(val)}</span>
                          </div>
                          <div className="w-full h-1 bg-ios-surface-2 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, (val / entry.limit) * 100)}%`, background: catColor }} />
                          </div>
                        </div>
                        {editSection === 'tax' && (
                          <>
                            <input type="number" value={val} onChange={e => updateTaxEntryValue(entry.id, selectedMonth, Number(e.target.value))}
                              className="w-20 bg-ios-surface-2 rounded-lg px-2 py-1 text-xs text-ios-text text-right border border-ios-border/30 outline-none tabular-nums" />
                            <motion.button whileTap={{ scale: 0.8 }} onClick={() => deleteTaxEntry(entry.id)}
                              className="w-6 h-6 rounded-lg bg-ios-red/20 flex items-center justify-center text-ios-red">
                              <Trash2 size={12} />
                            </motion.button>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
                <motion.button whileTap={{ scale: 0.95 }} onClick={() => setEditSection(editSection === 'tax' ? null : 'tax')}
                  className={`w-full mt-3 py-2 rounded-xl text-xs font-semibold transition-all ${editSection === 'tax' ? 'bg-ios-blue/20 text-ios-blue' : 'bg-ios-surface-2 text-ios-text-secondary'}`}>
                  {editSection === 'tax' ? 'Done Editing' : 'Edit Entries'}
                </motion.button>
              </div>

              {/* Tax Add Modal */}
              <AnimatePresence>
                {showTaxAdd && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-6">
                    <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                      className="glass-card rounded-2xl p-5 w-full max-w-xs ios-shadow">
                      <h3 className="text-sm font-semibold text-ios-text mb-3">Add Tax Investment</h3>
                      <input value={newTaxName} onChange={e => setNewTaxName(e.target.value)} placeholder="Name (e.g. PPF Account 2)"
                        className="w-full bg-ios-surface-2 rounded-xl px-3 py-2 text-sm text-ios-text border border-ios-border/30 focus:border-ios-blue outline-none mb-2" />
                      <select value={newTaxCategory} onChange={e => setNewTaxCategory(e.target.value as TaxEntry['category'])}
                        className="w-full bg-ios-surface-2 rounded-xl px-3 py-2 text-sm text-ios-text border border-ios-border/30 focus:border-ios-blue outline-none mb-2">
                        <option value="ppf">PPF</option>
                        <option value="elss">ELSS</option>
                        <option value="nps">NPS</option>
                        <option value="sukanya">Sukanya</option>
                        <option value="insurance">Insurance</option>
                        <option value="fd">Tax Saver FD</option>
                        <option value="other">Other</option>
                      </select>
                      <input type="number" value={newTaxLimit} onChange={e => setNewTaxLimit(e.target.value)} placeholder="Annual Limit"
                        className="w-full bg-ios-surface-2 rounded-xl px-3 py-2 text-sm text-ios-text border border-ios-border/30 focus:border-ios-blue outline-none mb-3" />
                      <div className="flex gap-2">
                        <button onClick={() => setShowTaxAdd(false)}
                          className="flex-1 py-2 rounded-xl bg-ios-surface-2 text-xs font-medium text-ios-text-secondary">Cancel</button>
                        <button onClick={() => { if (newTaxName.trim()) { addTaxEntry(newTaxName.trim(), newTaxCategory, Number(newTaxLimit) || 150000); setNewTaxName(''); setNewTaxLimit('150000'); setShowTaxAdd(false); } }}
                          className="flex-1 py-2 rounded-xl bg-ios-green/20 text-xs font-medium text-ios-green">Add</button>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
          {activeTab === 'war' && (
            <motion.div key="war" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }} className="space-y-3">
              {/* Year Comparison Cards */}
              {yearComparison.map((yc, i) => (
                <div key={yc.year} className="glass-card rounded-2xl p-4 ios-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-bold text-ios-text">{yc.year}</span>
                    {i > 0 && yc.incomeGrowthPct !== 0 && (
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${yc.incomeGrowthPct > 0 ? 'bg-ios-green/20 text-ios-green' : 'bg-ios-red/20 text-ios-red'}`}>
                        {yc.incomeGrowthPct > 0 ? '+' : ''}{yc.incomeGrowthPct}% income
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="p-2 rounded-xl bg-ios-surface-2">
                      <div className="text-[10px] text-ios-text-secondary">Income</div>
                      <div className="text-xs font-bold text-ios-text tabular-nums">{formatCurrency(yc.totalIncome)}</div>
                    </div>
                    <div className="p-2 rounded-xl bg-ios-surface-2">
                      <div className="text-[10px] text-ios-text-secondary">Household</div>
                      <div className="text-xs font-bold text-ios-text tabular-nums">{formatCurrency(yc.totalHousehold)}</div>
                    </div>
                    <div className="p-2 rounded-xl bg-ios-surface-2">
                      <div className="text-[10px] text-ios-text-secondary">Savings</div>
                      <div className="text-xs font-bold text-ios-green tabular-nums">{formatCurrency(yc.totalSavings)}</div>
                    </div>
                    <div className="p-2 rounded-xl bg-ios-surface-2">
                      <div className="text-[10px] text-ios-text-secondary">Debt Paid</div>
                      <div className="text-xs font-bold text-ios-blue tabular-nums">{formatCurrency(yc.totalDebtPaid)}</div>
                    </div>
                  </div>
                  {i > 0 && yc.expenseCreepPct > 10 && (
                    <div className="p-2 rounded-xl bg-ios-red/10 border border-ios-red/20">
                      <div className="text-[10px] text-ios-red font-medium">EXPENSE CREEP ALERT</div>
                      <div className="text-[10px] text-ios-text-secondary">
                        Household up {yc.expenseCreepPct}% vs {yearComparison[i-1].year}. Inflation was ~6%.
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Income Growth Chart */}
              <div className="glass-card rounded-2xl p-4 ios-shadow">
                <span className="text-sm font-semibold text-ios-text block mb-3">Income Growth</span>
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={yearComparison}>
                      <XAxis dataKey="year" tick={{fill:'#8e8e93',fontSize:10}} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ background: '#1c1c1e', border: '1px solid #38383a', borderRadius: '12px', fontSize: '12px', color: '#fff' }} formatter={(val: unknown) => formatCurrency(val as number)} />
                      <Bar dataKey="totalIncome" fill="#30d158" radius={[4,4,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Debt Reduction Velocity */}
              <div className="glass-card rounded-2xl p-4 ios-shadow">
                <span className="text-sm font-semibold text-ios-text block mb-3">Debt Reduction Velocity</span>
                <div className="space-y-2">
                  {state.availableYears.map(year => {
                    const velocity = getDebtReductionVelocity(year);
                    return (
                      <div key={year} className="flex items-center justify-between py-1.5 border-b border-ios-border/20 last:border-0">
                        <span className="text-xs text-ios-text-secondary">{year}</span>
                        <span className="text-xs font-semibold text-ios-blue tabular-nums">{formatCurrency(velocity)}/mo</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Savings Curve */}
              <div className="glass-card rounded-2xl p-4 ios-shadow">
                <span className="text-sm font-semibold text-ios-text block mb-3">Savings Curve</span>
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={yearComparison.map(yc => ({ year: yc.year, savings: yc.totalSavings }))}>
                      <XAxis dataKey="year" tick={{fill:'#8e8e93',fontSize:10}} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ background: '#1c1c1e', border: '1px solid #38383a', borderRadius: '12px', fontSize: '12px', color: '#fff' }} formatter={(val: unknown) => formatCurrency(val as number)} />
                      <Line type="monotone" dataKey="savings" stroke="#bf5af2" strokeWidth={2} dot={{fill:'#bf5af2'}} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Streak Summary */}
              {recoveryStreak > 0 && (
                <div className="glass-card rounded-2xl p-4 border border-ios-green/20">
                  <div className="flex items-center gap-2 mb-1">
                    <Zap size={14} className="text-ios-green" />
                    <span className="text-xs font-semibold text-ios-green">Recovery Streak: {recoveryStreak} months</span>
                  </div>
                  <div className="text-[10px] text-ios-text-secondary">Keep it up! You're back in control.</div>
                </div>
              )}
              {disasterStreak > 0 && (
                <div className="glass-card rounded-2xl p-4 border border-ios-red/20">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertOctagon size={14} className="text-ios-red" />
                    <span className="text-xs font-semibold text-ios-red">Disaster Streak: {disasterStreak} months</span>
                  </div>
                  <div className="text-[10px] text-ios-text-secondary">Action required. Review your budget.</div>
                </div>
              )}
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
            { id: 'tax' as Tab, icon: <Shield size={20} />, label: 'Tax' },
            { id: 'war' as Tab, icon: <Swords size={20} />, label: 'War Room' },
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

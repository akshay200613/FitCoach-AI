import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  Legend,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Scale,
  Ruler,
  Plus,
  Trash2,
  Calendar,
  Activity,
  X,
} from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../AuthContext';

const INITIAL_FORM_STATE = {
  weight_kg: '',
  waist_cm: '',
  chest_cm: '',
  arm_cm: '',
  thigh_cm: '',
  hip_cm: '',
  notes: '',
};

const MEASUREMENT_FIELDS = [
  { key: 'weight_kg', label: 'Weight', unit: 'kg', color: '#10b981', badgeClass: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  { key: 'waist_cm', label: 'Waist', unit: 'cm', color: '#10b981', badgeClass: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  { key: 'chest_cm', label: 'Chest', unit: 'cm', color: '#3b82f6', badgeClass: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
  { key: 'arm_cm', label: 'Arm', unit: 'cm', color: '#a855f7', badgeClass: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
  { key: 'thigh_cm', label: 'Thigh', unit: 'cm', color: '#f97316', badgeClass: 'text-orange-400 bg-orange-500/10 border-orange-500/20' },
  { key: 'hip_cm', label: 'Hip', unit: 'cm', color: '#ec4899', badgeClass: 'text-pink-400 bg-pink-500/10 border-pink-500/20' },
];

const BODY_LINE_SERIES = [
  { key: 'waist_cm', name: 'Waist (cm)', color: '#10b981' },
  { key: 'chest_cm', name: 'Chest (cm)', color: '#3b82f6' },
  { key: 'arm_cm', name: 'Arm (cm)', color: '#a855f7' },
  { key: 'thigh_cm', name: 'Thigh (cm)', color: '#f97316' },
  { key: 'hip_cm', name: 'Hip (cm)', color: '#ec4899' },
];

function parseDateSafe(value) {
  if (!value) return null;
  const normalized = typeof value === 'string' && !value.includes('T')
    ? value.replace(' ', 'T') + 'Z'
    : value;
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? new Date(value) : date;
}

function formatShortDate(value) {
  const date = parseDateSafe(value);
  if (!date || Number.isNaN(date.getTime())) return String(value || '');
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatFullDate(value) {
  const date = parseDateSafe(value);
  if (!date || Number.isNaN(date.getTime())) return String(value || '');
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function getBmiCategory(bmi) {
  if (bmi == null || Number.isNaN(bmi)) return null;
  if (bmi < 18.5) return { label: 'Underweight', className: 'text-blue-400 bg-blue-500/10 border-blue-500/30' };
  if (bmi < 25) return { label: 'Healthy', className: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' };
  if (bmi < 30) return { label: 'Overweight', className: 'text-amber-400 bg-amber-500/10 border-amber-500/30' };
  return { label: 'Obese', className: 'text-rose-400 bg-rose-500/10 border-rose-500/30' };
}

function buildWeeklyWorkouts(weeklyCompletion = []) {
  const now = new Date();
  const todayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const msPerDay = 86400000;

  const buckets = Array.from({ length: 4 }, (_, index) => {
    const startOffset = (3 - index) * 7 + 6;
    const endOffset = (3 - index) * 7;
    const startDate = new Date(todayUtc - startOffset * msPerDay);
    const endDate = new Date(todayUtc - endOffset * msPerDay);
    return {
      week: `Week ${index + 1}`,
      range: `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })} – ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })}`,
      startMs: startDate.getTime(),
      endMs: endDate.getTime() + msPerDay - 1,
      workouts: 0,
    };
  });

  weeklyCompletion.forEach((entry) => {
    if (!entry?.day) return;
    const [y, m, d] = entry.day.split('-').map(Number);
    if (!y || !m || !d) return;
    const entryMs = Date.UTC(y, m - 1, d);
    const targetBucket = buckets.find((b) => entryMs >= b.startMs && entryMs <= b.endMs);
    if (targetBucket) {
      targetBucket.workouts += Number(entry.workouts) || 0;
    }
  });

  return buckets;
}

function DarkChartTooltip({ active, payload, label, valueSuffix = '', showRange = false }) {
  if (!active || !payload || payload.length === 0) return null;

  const firstItem = payload[0]?.payload;
  const headerLabel = showRange && firstItem?.range ? `${label} (${firstItem.range})` : (firstItem?.fullDate || label);

  return (
    <div className="rounded-xl bg-gray-950/95 border border-gray-800 px-3.5 py-2.5 shadow-xl backdrop-blur-sm">
      <p className="text-xs font-medium text-gray-400 mb-1.5">{headerLabel}</p>
      <div className="space-y-1">
        {payload.map((entry) => (
          <div key={entry.dataKey || entry.name} className="flex items-center justify-between gap-4 text-xs">
            <span className="flex items-center gap-1.5 text-gray-200">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: entry.color || '#10b981' }}
              />
              {entry.name}
            </span>
            <span className="font-semibold text-white">
              {entry.value}{valueSuffix}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Progress() {
  const { user } = useAuth();
  const [measurements, setMeasurements] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const loadProgressData = useCallback(async () => {
    const [measurementsRes, summaryRes] = await Promise.all([
      api.getMeasurements(),
      api.getProgressSummary(),
    ]);
    return {
      measurements: measurementsRes?.measurements || [],
      summary: summaryRes || null,
    };
  }, []);

  const refreshProgressData = useCallback(async () => {
    try {
      setError('');
      const data = await loadProgressData();
      setMeasurements(data.measurements);
      setSummary(data.summary);
    } catch (err) {
      setError(err.message || 'Failed to load progress data.');
    } finally {
      setLoading(false);
    }
  }, [loadProgressData]);

  useEffect(() => {
    let active = true;
    loadProgressData()
      .then((data) => {
        if (!active) return;
        setError('');
        setMeasurements(data.measurements);
        setSummary(data.summary);
      })
      .catch((err) => {
        if (!active) return;
        setError(err.message || 'Failed to load progress data.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [loadProgressData]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (formError) setFormError('');
  };

  const handleAddMeasurement = async (e) => {
    e.preventDefault();
    const numericKeys = ['weight_kg', 'waist_cm', 'chest_cm', 'arm_cm', 'thigh_cm', 'hip_cm'];
    const payload = { notes: formData.notes.trim() };
    let hasValue = false;

    for (const key of numericKeys) {
      const raw = formData[key].trim();
      if (raw !== '') {
        const parsed = parseFloat(raw);
        if (Number.isNaN(parsed) || parsed <= 0) {
          setFormError('Please enter valid positive numbers for measurements.');
          return;
        }
        payload[key] = parsed;
        hasValue = true;
      } else {
        payload[key] = null;
      }
    }

    if (!hasValue) {
      setFormError('Please enter at least one measurement before saving.');
      return;
    }

    try {
      setSubmitting(true);
      setFormError('');
      await api.addMeasurement(payload);
      setFormData(INITIAL_FORM_STATE);
      setShowForm(false);
      await refreshProgressData();
    } catch (err) {
      setFormError(err.message || 'Failed to save measurement.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteMeasurement = async (id) => {
    try {
      setDeletingId(id);
      setError('');
      await api.deleteMeasurement(id);
      await refreshProgressData();
    } catch (err) {
      setError(err.message || 'Failed to delete measurement.');
    } finally {
      setDeletingId(null);
    }
  };

  const weightChartData = useMemo(
    () =>
      measurements
        .filter((m) => m.weight_kg != null)
        .map((m) => ({
          date: formatShortDate(m.measured_at),
          fullDate: formatFullDate(m.measured_at),
          weight_kg: Number(m.weight_kg),
        })),
    [measurements]
  );

  const bodyChartData = useMemo(
    () =>
      measurements
        .filter((m) =>
          BODY_LINE_SERIES.some((series) => m[series.key] != null)
        )
        .map((m) => ({
          date: formatShortDate(m.measured_at),
          fullDate: formatFullDate(m.measured_at),
          waist_cm: m.waist_cm != null ? Number(m.waist_cm) : null,
          chest_cm: m.chest_cm != null ? Number(m.chest_cm) : null,
          arm_cm: m.arm_cm != null ? Number(m.arm_cm) : null,
          thigh_cm: m.thigh_cm != null ? Number(m.thigh_cm) : null,
          hip_cm: m.hip_cm != null ? Number(m.hip_cm) : null,
        })),
    [measurements]
  );

  const weeklyWorkoutData = useMemo(
    () => buildWeeklyWorkouts(summary?.weekly_completion || []),
    [summary]
  );

  const reversedMeasurements = useMemo(
    () => [...measurements].reverse(),
    [measurements]
  );

  const startingWeight =
    summary?.initial?.weight_kg ??
    measurements.find((m) => m.weight_kg != null)?.weight_kg ??
    summary?.profile?.current_weight_kg ??
    null;

  const currentWeight =
    summary?.current?.weight_kg ??
    [...measurements].reverse().find((m) => m.weight_kg != null)?.weight_kg ??
    summary?.profile?.current_weight_kg ??
    null;

  const weightDelta =
    startingWeight != null && currentWeight != null
      ? Math.round((currentWeight - startingWeight) * 10) / 10
      : null;

  const computedBmi = useMemo(() => {
    if (summary?.profile?.bmi != null) return Number(summary.profile.bmi);
    const heightCm = summary?.profile?.height_cm;
    if (currentWeight != null && heightCm) {
      const heightM = heightCm / 100;
      return Math.round((currentWeight / (heightM * heightM)) * 10) / 10;
    }
    return null;
  }, [summary, currentWeight]);

  const bmiCategory = getBmiCategory(computedBmi);

  const comparisonMetrics = useMemo(() => {
    return MEASUREMENT_FIELDS.map((field) => {
      const initialEntry = measurements.find((m) => m[field.key] != null);
      const currentEntry = [...measurements].reverse().find((m) => m[field.key] != null);
      const initialVal = initialEntry ? Number(initialEntry[field.key]) : summary?.initial?.[field.key] ?? null;
      const currentVal = currentEntry ? Number(currentEntry[field.key]) : summary?.current?.[field.key] ?? null;
      const diff =
        initialVal != null && currentVal != null
          ? Math.round((currentVal - initialVal) * 10) / 10
          : null;

      return {
        ...field,
        initialVal,
        currentVal,
        diff,
      };
    });
  }, [measurements, summary]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-gray-800 border-t-emerald-500" />
          <p className="text-sm text-gray-400">Loading your progress...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Body Progress & Analytics
            </h1>
            <p className="mt-1 text-sm text-gray-400">
              {user?.full_name ? `${user.full_name}'s` : 'Your'} weight, body measurements, and workout consistency
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowForm((prev) => !prev)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-gray-950 shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-400 active:scale-[0.98] cursor-pointer"
          >
            {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {showForm ? 'Close Form' : 'Log Measurement'}
          </button>
        </motion.div>

        {/* Error Alert */}
        {error && (
          <div className="flex items-center justify-between rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
            <span>{error}</span>
            <button
              type="button"
              onClick={refreshProgressData}
              className="ml-4 rounded-lg bg-rose-500/20 px-3 py-1 text-xs font-medium text-rose-200 hover:bg-rose-500/30 cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {/* Add Measurement Form */}
        <AnimatePresence>
          {showForm && (
            <motion.form
              initial={{ opacity: 0, height: 0, y: -8 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              onSubmit={handleAddMeasurement}
              className="overflow-hidden rounded-xl border border-gray-800 bg-gray-900 p-5 sm:p-6 shadow-xl"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Ruler className="h-5 w-5 text-emerald-400" />
                  <h2 className="text-lg font-semibold text-white">Add New Measurement</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  aria-label="Close measurement form"
                  className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-800 hover:text-white cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {formError && (
                <div className="mb-4 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3.5 py-2 text-xs text-rose-300">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {MEASUREMENT_FIELDS.map((field) => (
                  <div key={field.key}>
                    <label
                      htmlFor={`input-${field.key}`}
                      className="block text-xs font-medium text-gray-400 mb-1.5"
                    >
                      {field.label} ({field.unit})
                    </label>
                    <input
                      id={`input-${field.key}`}
                      type="number"
                      step="0.1"
                      min="0"
                      placeholder={`e.g. ${field.key === 'weight_kg' ? '72.5' : '80.0'}`}
                      value={formData[field.key]}
                      onChange={(e) => handleInputChange(field.key, e.target.value)}
                      className="w-full rounded-xl border border-gray-800 bg-gray-950 px-3.5 py-2.5 text-sm text-white placeholder-gray-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                ))}
              </div>

              <div className="mt-4">
                <label
                  htmlFor="input-notes"
                  className="block text-xs font-medium text-gray-400 mb-1.5"
                >
                  Notes
                </label>
                <textarea
                  id="input-notes"
                  rows={2}
                  placeholder="Morning weigh-in, fasted, energy levels..."
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  className="w-full rounded-xl border border-gray-800 bg-gray-950 px-3.5 py-2.5 text-sm text-white placeholder-gray-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="mt-5 flex flex-wrap items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="rounded-xl border border-gray-700 bg-gray-800/60 px-4 py-2 text-sm font-medium text-gray-300 transition hover:bg-gray-800 hover:text-white cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2 text-sm font-semibold text-gray-950 transition hover:bg-emerald-400 disabled:opacity-60 cursor-pointer"
                >
                  {submitting ? 'Saving...' : 'Save Measurement'}
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Summary Cards Row */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05 }}
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
        >
          {/* Starting vs Current Weight */}
          <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-gray-400">
                Weight Progress
              </span>
              <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-400">
                <Scale className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline justify-between gap-2">
              <div>
                <p className="text-2xl font-bold text-white">
                  {currentWeight != null ? `${currentWeight} kg` : '--'}
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  Start: {startingWeight != null ? `${startingWeight} kg` : '--'}
                </p>
              </div>
              {weightDelta != null && (
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                    weightDelta <= 0
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : 'bg-amber-500/10 text-amber-400'
                  }`}
                >
                  {weightDelta <= 0 ? (
                    <TrendingDown className="h-3.5 w-3.5" />
                  ) : (
                    <TrendingUp className="h-3.5 w-3.5" />
                  )}
                  {weightDelta > 0 ? `+${weightDelta}` : weightDelta} kg
                </span>
              )}
            </div>
          </div>

          {/* BMI */}
          <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-gray-400">
                Current BMI
              </span>
              <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-400">
                <Ruler className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline justify-between gap-2">
              <div>
                <p className="text-2xl font-bold text-white">
                  {computedBmi != null ? computedBmi.toFixed(1) : '--'}
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  {summary?.profile?.target_weight_kg
                    ? `Target: ${summary.profile.target_weight_kg} kg`
                    : 'Body Mass Index'}
                </p>
              </div>
              {bmiCategory && (
                <span
                  className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${bmiCategory.className}`}
                >
                  {bmiCategory.label}
                </span>
              )}
            </div>
          </div>

          {/* Total Workouts */}
          <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-gray-400">
                Total Workouts
              </span>
              <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-400">
                <Activity className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold text-white">
                {summary?.total_workouts ?? 0}
              </p>
              <p className="mt-1 text-xs text-gray-400">All-time completed sessions</p>
            </div>
          </div>

          {/* Monthly Workouts */}
          <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-gray-400">
                Monthly Workouts
              </span>
              <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-400">
                <Calendar className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold text-white">
                {summary?.workouts_this_month ?? 0}
              </p>
              <p className="mt-1 text-xs text-gray-400">Completed in the last 30 days</p>
            </div>
          </div>
        </motion.div>

        {/* Charts Row 1: Weight Progress & Workout Consistency */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Weight Progress AreaChart */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="lg:col-span-2 rounded-xl border border-gray-800 bg-gray-900 p-5 sm:p-6"
          >
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-white">Weight Progress</h2>
                <p className="text-xs text-gray-400">Tracked body weight over time (kg)</p>
              </div>
              <Scale className="h-4 w-4 text-emerald-400" />
            </div>

            {weightChartData.length > 0 ? (
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={weightChartData} margin={{ top: 10, right: 12, left: -12, bottom: 0 }}>
                    <defs>
                      <linearGradient id="weightEmeraldGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                    <XAxis
                      dataKey="date"
                      stroke="#6b7280"
                      tick={{ fill: '#9ca3af', fontSize: 12 }}
                      tickLine={false}
                      axisLine={{ stroke: '#374151' }}
                    />
                    <YAxis
                      domain={['dataMin - 2', 'dataMax + 2']}
                      stroke="#6b7280"
                      tick={{ fill: '#9ca3af', fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip content={<DarkChartTooltip valueSuffix=" kg" />} />
                    <Area
                      type="monotone"
                      dataKey="weight_kg"
                      name="Weight"
                      stroke="#10b981"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#weightEmeraldGradient)"
                      activeDot={{ r: 5, fill: '#34d399', stroke: '#030712', strokeWidth: 2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex h-72 flex-col items-center justify-center rounded-xl border border-dashed border-gray-800 bg-gray-950/50 text-center p-6">
                <Scale className="h-8 w-8 text-gray-600 mb-2" />
                <p className="text-sm font-medium text-gray-300">No weight entries yet</p>
                <p className="mt-1 text-xs text-gray-500">
                  Log your first measurement to visualize your weight trend.
                </p>
              </div>
            )}
          </motion.div>

          {/* Workout Consistency BarChart */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="rounded-xl border border-gray-800 bg-gray-900 p-5 sm:p-6"
          >
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-white">Workout Consistency</h2>
                <p className="text-xs text-gray-400">Workouts completed per week</p>
              </div>
              <Activity className="h-4 w-4 text-emerald-400" />
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyWorkoutData} margin={{ top: 10, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                  <XAxis
                    dataKey="week"
                    stroke="#6b7280"
                    tick={{ fill: '#9ca3af', fontSize: 12 }}
                    tickLine={false}
                    axisLine={{ stroke: '#374151' }}
                  />
                  <YAxis
                    allowDecimals={false}
                    stroke="#6b7280"
                    tick={{ fill: '#9ca3af', fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip content={<DarkChartTooltip valueSuffix=" workouts" showRange />} />
                  <Bar
                    dataKey="workouts"
                    name="Completed"
                    fill="#10b981"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={44}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>

        {/* Body Measurements LineChart */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="rounded-xl border border-gray-800 bg-gray-900 p-5 sm:p-6"
        >
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-white">Body Measurements</h2>
              <p className="text-xs text-gray-400">Waist, chest, arm, thigh, and hip progression (cm)</p>
            </div>
            <Ruler className="h-4 w-4 text-emerald-400" />
          </div>

          {bodyChartData.length > 0 ? (
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={bodyChartData} margin={{ top: 10, right: 16, left: -12, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                  <XAxis
                    dataKey="date"
                    stroke="#6b7280"
                    tick={{ fill: '#9ca3af', fontSize: 12 }}
                    tickLine={false}
                    axisLine={{ stroke: '#374151' }}
                  />
                  <YAxis
                    stroke="#6b7280"
                    tick={{ fill: '#9ca3af', fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip content={<DarkChartTooltip valueSuffix=" cm" />} />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }} />
                  {BODY_LINE_SERIES.map((series) => (
                    <Line
                      key={series.key}
                      type="monotone"
                      dataKey={series.key}
                      name={series.name}
                      stroke={series.color}
                      strokeWidth={2}
                      dot={{ r: 3, fill: series.color }}
                      activeDot={{ r: 5 }}
                      connectNulls
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-gray-800 bg-gray-950/50 text-center p-6">
              <Ruler className="h-8 w-8 text-gray-600 mb-2" />
              <p className="text-sm font-medium text-gray-300">No body circumference data yet</p>
              <p className="mt-1 text-xs text-gray-500">
                Add waist, chest, arm, thigh, or hip measurements to track changes over time.
              </p>
            </div>
          )}
        </motion.div>

        {/* Initial vs Current Comparison Cards */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}
          className="space-y-3"
        >
          <div>
            <h2 className="text-base font-semibold text-white">Initial vs Current Comparison</h2>
            <p className="text-xs text-gray-400">Net change from your first recorded entry to your latest</p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {comparisonMetrics.map((metric) => {
              const hasDiff = metric.diff !== null;
              const isPositive = hasDiff && metric.diff > 0;
              const isNegative = hasDiff && metric.diff < 0;

              return (
                <div
                  key={metric.key}
                  className="rounded-xl border border-gray-800 bg-gray-900 p-4 flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-400">{metric.label}</span>
                    {hasDiff && (
                      <span
                        className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                          metric.diff === 0
                            ? 'bg-gray-800 text-gray-400'
                            : isNegative
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : 'bg-blue-500/10 text-blue-400'
                        }`}
                      >
                        {isPositive && <TrendingUp className="h-3 w-3" />}
                        {isNegative && <TrendingDown className="h-3 w-3" />}
                        {metric.diff > 0 ? `+${metric.diff}` : metric.diff} {metric.unit}
                      </span>
                    )}
                  </div>

                  <div className="mt-3 flex items-baseline justify-between">
                    <div>
                      <p className="text-[11px] text-gray-500">Initial</p>
                      <p className="text-sm font-medium text-gray-300">
                        {metric.initialVal != null ? `${metric.initialVal} ${metric.unit}` : '--'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[11px] text-gray-500">Current</p>
                      <p className="text-base font-bold text-white">
                        {metric.currentVal != null ? `${metric.currentVal} ${metric.unit}` : '--'}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Measurement History List */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="rounded-xl border border-gray-800 bg-gray-900 p-5 sm:p-6"
        >
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-white">Measurement History</h2>
              <p className="text-xs text-gray-400">
                {measurements.length} recorded {measurements.length === 1 ? 'entry' : 'entries'}
              </p>
            </div>
            <Calendar className="h-4 w-4 text-emerald-400" />
          </div>

          {reversedMeasurements.length > 0 ? (
            <div className="space-y-3">
              {reversedMeasurements.map((entry) => (
                <div
                  key={entry.id}
                  className="flex flex-col gap-3 rounded-xl border border-gray-800/80 bg-gray-950/70 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs font-medium text-gray-400">
                      <Calendar className="h-3.5 w-3.5 text-emerald-400" />
                      <span>{formatFullDate(entry.measured_at)}</span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {MEASUREMENT_FIELDS.map((field) => {
                        const val = entry[field.key];
                        if (val == null) return null;
                        return (
                          <span
                            key={field.key}
                            className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-medium ${field.badgeClass}`}
                          >
                            <span className="opacity-80">{field.label}:</span>
                            <span className="font-semibold">
                              {val} {field.unit}
                            </span>
                          </span>
                        );
                      })}
                    </div>

                    {entry.notes && (
                      <p className="text-xs text-gray-400 italic">"{entry.notes}"</p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteMeasurement(entry.id)}
                    disabled={deletingId === entry.id}
                    aria-label="Delete measurement"
                    className="self-end sm:self-center inline-flex items-center gap-1.5 rounded-lg border border-gray-800 bg-gray-900 px-3 py-1.5 text-xs font-medium text-gray-400 transition hover:border-rose-500/40 hover:bg-rose-500/10 hover:text-rose-400 disabled:opacity-50 cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    {deletingId === entry.id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-800 bg-gray-950/50 py-10 text-center">
              <Scale className="h-8 w-8 text-gray-600 mb-2" />
              <p className="text-sm font-medium text-gray-300">No measurements logged yet</p>
              <p className="mt-1 text-xs text-gray-500">
                Click "Log Measurement" above to record your starting stats.
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

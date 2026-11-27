import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import {
  Apple,
  Droplets,
  Flame,
  UtensilsCrossed,
  RefreshCw,
  Info,
} from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../AuthContext';

const DIET_PREFERENCES = [
  {
    id: 'vegetarian',
    label: 'Vegetarian',
    description: 'Plant-based with dairy & honey',
    badge: 'Plant + Dairy',
    iconColor: 'text-green-400',
    bgTint: 'bg-green-500/10',
    borderSelected: 'border-green-500/60',
    ringSelected: 'ring-2 ring-green-500 shadow-lg shadow-green-500/10',
    dotColor: 'bg-green-400',
  },
  {
    id: 'non-vegetarian',
    label: 'Non-Vegetarian',
    description: 'Includes lean meats, poultry & fish',
    badge: 'Balanced',
    iconColor: 'text-red-400',
    bgTint: 'bg-red-500/10',
    borderSelected: 'border-red-500/60',
    ringSelected: 'ring-2 ring-red-500 shadow-lg shadow-red-500/10',
    dotColor: 'bg-red-400',
  },
  {
    id: 'vegan',
    label: 'Vegan',
    description: '100% plant-derived whole foods',
    badge: 'Plant-Only',
    iconColor: 'text-emerald-400',
    bgTint: 'bg-emerald-500/10',
    borderSelected: 'border-emerald-500/60',
    ringSelected: 'ring-2 ring-emerald-500 shadow-lg shadow-emerald-500/10',
    dotColor: 'bg-emerald-400',
  },
  {
    id: 'eggetarian',
    label: 'Eggetarian',
    description: 'Vegetarian diet including eggs',
    badge: 'Plant + Eggs',
    iconColor: 'text-yellow-400',
    bgTint: 'bg-yellow-500/10',
    borderSelected: 'border-yellow-500/60',
    ringSelected: 'ring-2 ring-yellow-500 shadow-lg shadow-yellow-500/10',
    dotColor: 'bg-yellow-400',
  },
];

const DEFAULT_NOTES = [
  'These are general estimates. Individual needs vary based on metabolism and activity level.',
  'Adjust portions based on how your body responds over 2-3 weeks.',
  'Prioritize whole, minimally processed foods when possible.',
  'Stay hydrated — drink water throughout the day.',
  'This is general guidance, not a medical prescription. Consult a registered dietitian for specific dietary needs.',
];

const MACRO_COLORS = {
  protein: '#10b981',
  carbs: '#3b82f6',
  fats: '#f59e0b',
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

export default function Nutrition() {
  const { user } = useAuth();
  const [dietPreference, setDietPreference] = useState('non-vegetarian');
  const [nutrition, setNutrition] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function fetchExistingNutrition() {
      try {
        setError('');
        const data = await api.getNutrition();
        if (!active) return;

        if (data?.nutrition) {
          setNutrition(data.nutrition);
          if (data.nutrition.diet_preference) {
            setDietPreference(data.nutrition.diet_preference);
          }
        }
      } catch (err) {
        if (!active) return;
        setError(err.message || 'Failed to load nutrition profile.');
      } finally {
        if (active) {
          setInitialLoading(false);
        }
      }
    }

    fetchExistingNutrition();
    return () => {
      active = false;
    };
  }, []);

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      setError('');
      const data = await api.generateNutrition({ diet_preference: dietPreference });
      if (data?.nutrition) {
        setNutrition({
          ...data.nutrition,
          diet_preference: dietPreference,
        });
      }
    } catch (err) {
      setError(err.message || 'Failed to generate nutrition plan.');
    } finally {
      setGenerating(false);
    }
  };

  const meals = useMemo(() => {
    if (!nutrition) return [];
    if (Array.isArray(nutrition.meals)) return nutrition.meals;
    if (Array.isArray(nutrition.meal_plan)) return nutrition.meal_plan;
    return [];
  }, [nutrition]);

  const macroBreakdown = useMemo(() => {
    if (!nutrition) {
      return {
        chartData: [],
        proteinPct: 0,
        carbsPct: 0,
        fatsPct: 0,
      };
    }

    const proteinG = Math.round(Number(nutrition.protein_g) || 0);
    const carbsG = Math.round(Number(nutrition.carbs_g) || 0);
    const fatsG = Math.round(Number(nutrition.fats_g) || 0);

    const proteinCal = proteinG * 4;
    const carbsCal = carbsG * 4;
    const fatsCal = fatsG * 9;
    const totalMacroCal = proteinCal + carbsCal + fatsCal;

    const proteinPct = totalMacroCal > 0 ? Math.round((proteinCal / totalMacroCal) * 100) : 0;
    const carbsPct = totalMacroCal > 0 ? Math.round((carbsCal / totalMacroCal) * 100) : 0;
    const fatsPct = totalMacroCal > 0 ? Math.max(0, 100 - proteinPct - carbsPct) : 0;

    return {
      proteinG,
      carbsG,
      fatsG,
      proteinPct,
      carbsPct,
      fatsPct,
      chartData: [
        { name: 'Protein', value: proteinCal || 1, grams: proteinG, pct: proteinPct, color: MACRO_COLORS.protein },
        { name: 'Carbs', value: carbsCal || 1, grams: carbsG, pct: carbsPct, color: MACRO_COLORS.carbs },
        { name: 'Fats', value: fatsCal || 1, grams: fatsG, pct: fatsPct, color: MACRO_COLORS.fats },
      ],
    };
  }, [nutrition]);

  const notesList = useMemo(() => {
    if (Array.isArray(nutrition?.notes) && nutrition.notes.length > 0) {
      return nutrition.notes;
    }
    return DEFAULT_NOTES;
  }, [nutrition]);

  const waterMl = Math.round(Number(nutrition?.water_ml) || 0);
  const waterGlasses = waterMl > 0 ? Math.max(1, Math.round(waterMl / 250)) : 0;
  const dailyCalories = Math.round(Number(nutrition?.daily_calories) || 0);

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-100 flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-full border-2 border-emerald-500/30 border-t-emerald-400 animate-spin" />
          <p className="text-sm text-gray-400">Loading your nutrition profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 px-4 py-6 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium mb-3">
              <Apple className="w-3.5 h-3.5" />
              <span>AI Nutrition Guidance</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              {user?.full_name ? `${user.full_name.split(' ')[0]}'s Nutrition Plan` : 'Personalized Nutrition'}
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              Calorie targets, macro distribution, and daily meal structure tailored to your fitness goals.
            </p>
          </div>

          {nutrition && (
            <button
              type="button"
              onClick={handleGenerate}
              disabled={generating}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gray-900 hover:bg-gray-800 border border-gray-800 hover:border-emerald-500/40 text-sm font-medium text-emerald-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed self-start sm:self-auto"
            >
              <RefreshCw className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} />
              <span>{generating ? 'Regenerating...' : 'Regenerate Plan'}</span>
            </button>
          )}
        </motion.div>

        {/* Error Banner */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-300 flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-2.5">
                <Info className="w-4 h-4 text-red-400 shrink-0" />
                <span>{error}</span>
              </div>
              <button
                type="button"
                onClick={() => setError('')}
                className="text-xs text-red-300 hover:text-white underline shrink-0"
              >
                Dismiss
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Diet Preference Selector */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05 }}
          className="bg-gray-900 border border-gray-800/80 rounded-2xl p-5 sm:p-6 space-y-5"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h2 className="text-lg font-semibold text-white">Diet Preference</h2>
              <p className="text-xs sm:text-sm text-gray-400">
                Choose your dietary style before generating or updating your meal plan.
              </p>
            </div>
            <span className="text-xs text-gray-500">
              Selected:{' '}
              <span className="text-emerald-400 font-medium capitalize">
                {dietPreference.replace('-', ' ')}
              </span>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {DIET_PREFERENCES.map((pref) => {
              const isSelected = dietPreference === pref.id;
              return (
                <button
                  key={pref.id}
                  type="button"
                  onClick={() => setDietPreference(pref.id)}
                  className={`text-left rounded-xl p-4 bg-gray-950/70 border transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? `${pref.borderSelected} ${pref.ringSelected}`
                      : 'border-gray-800 hover:border-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <div className={`p-2 rounded-lg ${pref.bgTint}`}>
                      <Apple className={`w-4 h-4 ${pref.iconColor}`} />
                    </div>
                    <span
                      className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded-full bg-gray-900 border border-gray-800 ${pref.iconColor}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${pref.dotColor}`} />
                      {pref.badge}
                    </span>
                  </div>
                  <h3 className="font-semibold text-sm text-white">{pref.label}</h3>
                  <p className="text-xs text-gray-400 mt-1 leading-relaxed">{pref.description}</p>
                </button>
              );
            })}
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="button"
              onClick={handleGenerate}
              disabled={generating}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-semibold text-sm transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              {generating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Generating Nutrition Plan...</span>
                </>
              ) : (
                <>
                  <UtensilsCrossed className="w-4 h-4" />
                  <span>{nutrition ? 'Regenerate Nutrition Plan' : 'Generate Nutrition Plan'}</span>
                </>
              )}
            </button>
          </div>
        </motion.section>

        {/* Loading Skeleton while generating */}
        {generating && !nutrition && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-10 flex flex-col items-center justify-center gap-3">
            <div className="h-10 w-10 rounded-full border-2 border-emerald-500/30 border-t-emerald-400 animate-spin" />
            <p className="text-sm font-medium text-white">Crafting your personalized nutrition plan...</p>
            <p className="text-xs text-gray-400">Calculating calories, macros, hydration, and daily meals</p>
          </div>
        )}

        {/* Empty state when no plan exists yet */}
        {!nutrition && !generating && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-900 border border-dashed border-gray-800 rounded-2xl p-10 text-center space-y-3"
          >
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto">
              <UtensilsCrossed className="w-6 h-6 text-emerald-400" />
            </div>
            <h3 className="text-lg font-semibold text-white">No Nutrition Plan Yet</h3>
            <p className="text-sm text-gray-400 max-w-md mx-auto">
              Select your preferred diet above and click <span className="text-emerald-400 font-medium">Generate Nutrition Plan</span> to calculate your daily calorie target, macro split, and meal schedule.
            </p>
          </motion.div>
        )}

        {/* Plan Output */}
        {nutrition && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-8"
          >
            {/* Calorie Summary Cards */}
            <motion.section variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-gray-900 border border-emerald-500/30 rounded-2xl p-5 relative overflow-hidden">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium uppercase tracking-wider text-emerald-400">
                    Daily Target
                  </span>
                  <div className="p-2 rounded-lg bg-emerald-500/10">
                    <Flame className="w-4 h-4 text-emerald-400" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-white">
                  {dailyCalories.toLocaleString()}
                  <span className="text-sm font-normal text-gray-400 ml-1.5">kcal</span>
                </div>
                <p className="text-xs text-gray-400 mt-1.5">Goal-adjusted daily calorie intake</p>
              </div>

              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium uppercase tracking-wider text-gray-400">
                    BMR
                  </span>
                  <div className="p-2 rounded-lg bg-gray-800">
                    <Flame className="w-4 h-4 text-blue-400" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-white">
                  {nutrition.bmr ? Math.round(Number(nutrition.bmr)).toLocaleString() : '—'}
                  {nutrition.bmr && (
                    <span className="text-sm font-normal text-gray-400 ml-1.5">kcal</span>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-1.5">
                  {nutrition.bmr
                    ? 'Basal Metabolic Rate at rest'
                    : 'Regenerate plan to display BMR'}
                </p>
              </div>

              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium uppercase tracking-wider text-gray-400">
                    TDEE
                  </span>
                  <div className="p-2 rounded-lg bg-gray-800">
                    <Flame className="w-4 h-4 text-amber-400" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-white">
                  {nutrition.tdee ? Math.round(Number(nutrition.tdee)).toLocaleString() : '—'}
                  {nutrition.tdee && (
                    <span className="text-sm font-normal text-gray-400 ml-1.5">kcal</span>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-1.5">
                  {nutrition.tdee
                    ? 'Total Daily Energy Expenditure'
                    : 'Regenerate plan to display TDEE'}
                </p>
              </div>
            </motion.section>

            {/* Macro Breakdown Chart + Macro Detail & Water Cards */}
            <motion.section variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Donut PieChart */}
              <div className="lg:col-span-5 bg-gray-900 border border-gray-800 rounded-2xl p-5 sm:p-6 flex flex-col justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-white">Macro Breakdown</h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Caloric share across protein, carbs, and fats
                  </p>
                </div>

                <div className="relative h-64 w-full my-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={macroBreakdown.chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={64}
                        outerRadius={92}
                        paddingAngle={4}
                        dataKey="value"
                        stroke="none"
                      >
                        {macroBreakdown.chartData.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(_val, _name, item) => [
                          `${item?.payload?.grams ?? 0}g (${item?.payload?.pct ?? 0}%)`,
                          item?.payload?.name ?? '',
                        ]}
                        contentStyle={{
                          backgroundColor: '#111827',
                          borderColor: '#374151',
                          borderRadius: '0.75rem',
                          color: '#f9fafb',
                          fontSize: '0.75rem',
                        }}
                        itemStyle={{ color: '#f9fafb' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>

                  {/* Center Label */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-2xl font-bold text-white">
                      {dailyCalories.toLocaleString()}
                    </span>
                    <span className="text-xs text-gray-400">kcal / day</span>
                  </div>
                </div>

                {/* Legend Below */}
                <div className="grid grid-cols-3 gap-2 pt-3 border-t border-gray-800">
                  {macroBreakdown.chartData.map((macro) => (
                    <div key={macro.name} className="flex flex-col items-center text-center">
                      <div className="flex items-center gap-1.5 text-xs font-medium text-gray-300">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: macro.color }}
                        />
                        <span>{macro.name}</span>
                      </div>
                      <span className="text-xs text-gray-400 mt-0.5">
                        {macro.grams}g ({macro.pct}%)
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: Macro Detail Cards + Water Recommendation */}
              <div className="lg:col-span-7 flex flex-col gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Protein */}
                  <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-emerald-400">Protein</span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400">
                        {macroBreakdown.proteinPct}%
                      </span>
                    </div>
                    <div className="text-2xl font-bold text-white">
                      {macroBreakdown.proteinG}
                      <span className="text-sm font-normal text-gray-400 ml-1">g/day</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-gray-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-emerald-500"
                        style={{ width: `${macroBreakdown.proteinPct}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-400">
                      {(macroBreakdown.proteinG * 4).toLocaleString()} kcal • Muscle repair
                    </p>
                  </div>

                  {/* Carbs */}
                  <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-blue-400">Carbs</span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400">
                        {macroBreakdown.carbsPct}%
                      </span>
                    </div>
                    <div className="text-2xl font-bold text-white">
                      {macroBreakdown.carbsG}
                      <span className="text-sm font-normal text-gray-400 ml-1">g/day</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-gray-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-blue-500"
                        style={{ width: `${macroBreakdown.carbsPct}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-400">
                      {(macroBreakdown.carbsG * 4).toLocaleString()} kcal • Primary fuel
                    </p>
                  </div>

                  {/* Fats */}
                  <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-amber-400">Fats</span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400">
                        {macroBreakdown.fatsPct}%
                      </span>
                    </div>
                    <div className="text-2xl font-bold text-white">
                      {macroBreakdown.fatsG}
                      <span className="text-sm font-normal text-gray-400 ml-1">g/day</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-gray-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-amber-500"
                        style={{ width: `${macroBreakdown.fatsPct}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-400">
                      {(macroBreakdown.fatsG * 9).toLocaleString()} kcal • Hormone health
                    </p>
                  </div>
                </div>

                {/* Water Recommendation Card */}
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 sm:p-6 flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start sm:items-center gap-4">
                    <div className="p-3.5 rounded-2xl bg-sky-500/10 border border-sky-500/20 shrink-0">
                      <Droplets className="w-6 h-6 text-sky-400" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-white">Daily Hydration Target</h3>
                      <p className="text-xs sm:text-sm text-gray-400 mt-0.5">
                        Spread intake evenly throughout the day and add 300–500 ml on intense training days.
                      </p>
                    </div>
                  </div>

                  <div className="sm:text-right shrink-0 pl-14 sm:pl-0">
                    <div className="text-2xl sm:text-3xl font-bold text-sky-400">
                      {waterMl.toLocaleString()}
                      <span className="text-sm font-normal text-gray-400 ml-1">ml/day</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      ~{waterGlasses} glasses (250 ml each) • {(waterMl / 1000).toFixed(1)} L
                    </p>
                  </div>
                </div>
              </div>
            </motion.section>

            {/* Daily Meal Plan */}
            <motion.section variants={itemVariants} className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <UtensilsCrossed className="w-5 h-5 text-emerald-400" />
                    <span>Daily Meal Plan</span>
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-400 mt-0.5">
                    {meals.length} structured meals balanced across your daily target
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {meals.map((meal, index) => (
                  <motion.div
                    key={`${meal.name || 'meal'}-${index}`}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="bg-gray-900 border border-gray-800/90 hover:border-gray-700 rounded-2xl p-5 flex flex-col justify-between gap-4 transition-colors"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-base font-semibold text-white">{meal.name}</h3>
                          {meal.time && (
                            <span className="inline-block text-xs text-emerald-400 font-medium mt-0.5">
                              Suggested Time: {meal.time}
                            </span>
                          )}
                        </div>
                        <span className="px-2.5 py-1 rounded-lg bg-gray-950 border border-gray-800 text-xs font-semibold text-gray-200 shrink-0">
                          {Math.round(Number(meal.calories) || 0)} kcal
                        </span>
                      </div>

                      {Array.isArray(meal.foods) && meal.foods.length > 0 && (
                        <ul className="space-y-1.5 pt-1">
                          {meal.foods.map((food, fIdx) => (
                            <li
                              key={`${food}-${fIdx}`}
                              className="flex items-start gap-2 text-sm text-gray-300"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 shrink-0" />
                              <span>{food}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    {/* Per-meal Macros */}
                    <div className="grid grid-cols-3 gap-2 pt-3 border-t border-gray-800/80 text-center">
                      <div className="bg-gray-950/70 rounded-lg py-2 px-2">
                        <div className="text-[11px] text-gray-400">Protein</div>
                        <div className="text-sm font-semibold text-emerald-400">
                          {Math.round(Number(meal.protein) || 0)}g
                        </div>
                      </div>
                      <div className="bg-gray-950/70 rounded-lg py-2 px-2">
                        <div className="text-[11px] text-gray-400">Carbs</div>
                        <div className="text-sm font-semibold text-blue-400">
                          {Math.round(Number(meal.carbs) || 0)}g
                        </div>
                      </div>
                      <div className="bg-gray-950/70 rounded-lg py-2 px-2">
                        <div className="text-[11px] text-gray-400">Fats</div>
                        <div className="text-sm font-semibold text-amber-400">
                          {Math.round(Number(meal.fats) || 0)}g
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.section>

            {/* Notes & Disclaimer */}
            <motion.section
              variants={itemVariants}
              className="bg-gray-900/70 border border-gray-800 rounded-2xl p-5 sm:p-6 space-y-3"
            >
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-200">
                <Info className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Nutrition Notes &amp; Disclaimer</span>
              </div>
              <ul className="space-y-1.5 text-xs sm:text-sm text-gray-400">
                {notesList.map((note, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-emerald-500 mt-0.5">•</span>
                    <span>{note}</span>
                  </li>
                ))}
              </ul>
            </motion.section>

            {/* Bottom Regenerate Action */}
            <motion.div variants={itemVariants} className="flex justify-center pt-2 pb-4">
              <button
                type="button"
                onClick={handleGenerate}
                disabled={generating}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gray-900 hover:bg-gray-800 border border-gray-800 hover:border-emerald-500/50 text-sm font-semibold text-emerald-400 transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} />
                <span>{generating ? 'Regenerating Plan...' : 'Regenerate Plan'}</span>
              </button>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

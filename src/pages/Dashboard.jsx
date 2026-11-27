import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home,
  Dumbbell,
  TrendingUp,
  Flame,
  Zap,
  Calendar,
  Play,
  ChevronRight,
  Target,
  Trophy,
  Clock,
  AlertCircle,
  RefreshCw,
  Utensils,
  Sparkles,
  Scale,
  CheckCircle2,
} from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../AuthContext';

const DAYS_OF_WEEK = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

const WEEK_ORDER = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.07,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: 'easeOut' },
  },
};

function formatGoalLabel(goal) {
  if (!goal) return 'General Fitness';
  return goal
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatSessionDate(dateStr) {
  if (!dateStr) return 'Recently';
  const parsed = new Date(dateStr);
  if (Number.isNaN(parsed.getTime())) return dateStr;
  return parsed.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6 animate-pulse">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-2">
            <div className="h-4 w-36 bg-gray-800 rounded" />
            <div className="h-8 w-64 bg-gray-800 rounded-lg" />
            <div className="h-4 w-48 bg-gray-900 rounded" />
          </div>
          <div className="h-11 w-44 bg-gray-800 rounded-xl" />
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, idx) => (
            <div
              key={idx}
              className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="h-4 w-24 bg-gray-800 rounded" />
                <div className="h-9 w-9 bg-gray-800 rounded-lg" />
              </div>
              <div className="h-8 w-16 bg-gray-800 rounded" />
              <div className="h-3 w-28 bg-gray-800/70 rounded" />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
              <div className="h-6 w-48 bg-gray-800 rounded" />
              <div className="h-24 w-full bg-gray-800/60 rounded-xl" />
              <div className="h-12 w-full bg-gray-800 rounded-xl" />
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
              <div className="h-6 w-40 bg-gray-800 rounded" />
              <div className="grid grid-cols-7 gap-2">
                {[...Array(7)].map((_, idx) => (
                  <div key={idx} className="h-20 bg-gray-800/70 rounded-xl" />
                ))}
              </div>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-3">
              <div className="h-6 w-44 bg-gray-800 rounded" />
              {[...Array(3)].map((_, idx) => (
                <div key={idx} className="h-16 bg-gray-800/60 rounded-xl" />
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
              <div className="h-6 w-36 bg-gray-800 rounded" />
              <div className="h-20 bg-gray-800/60 rounded-xl" />
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
              <div className="h-6 w-36 bg-gray-800 rounded" />
              <div className="h-16 bg-gray-800/60 rounded-xl" />
              <div className="h-3 w-full bg-gray-800 rounded-full" />
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-3">
              <div className="h-6 w-32 bg-gray-800 rounded" />
              {[...Array(3)].map((_, idx) => (
                <div key={idx} className="h-14 bg-gray-800/60 rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

async function fetchDashboardPayload() {
  const [statsRes, planRes, onboardingRes, sessionsRes] = await Promise.all([
    api.getWorkoutStats(),
    api.getActivePlan(),
    api.getOnboardingData(),
    api.getSessions().catch(() => ({ sessions: [] })),
  ]);

  let sessions = [];
  if (Array.isArray(sessionsRes?.sessions) && sessionsRes.sessions.length > 0) {
    sessions = sessionsRes.sessions.slice(0, 5);
  } else if (statsRes?.recent_session) {
    sessions = [statsRes.recent_session];
  }

  return {
    stats: statsRes || {},
    plan: planRes?.plan || null,
    onboarding: onboardingRes || {},
    sessions,
  };
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [activePlan, setActivePlan] = useState(null);
  const [onboardingData, setOnboardingData] = useState(null);
  const [recentSessions, setRecentSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [generatingPlan, setGeneratingPlan] = useState(false);
  const [planError, setPlanError] = useState('');
  const [now] = useState(() => new Date());

  const applyDashboardPayload = useCallback((payload) => {
    setStats(payload.stats);
    setActivePlan(payload.plan);
    setOnboardingData(payload.onboarding);
    setRecentSessions(payload.sessions);
    setError('');
  }, []);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const payload = await fetchDashboardPayload();
      applyDashboardPayload(payload);
    } catch (err) {
      setError(err?.message || 'Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [applyDashboardPayload]);

  useEffect(() => {
    let active = true;
    fetchDashboardPayload()
      .then((payload) => {
        if (active) applyDashboardPayload(payload);
      })
      .catch((err) => {
        if (active) {
          setError(err?.message || 'Failed to load dashboard data. Please try again.');
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [applyDashboardPayload]);

  const handleGeneratePlan = async () => {
    setGeneratingPlan(true);
    setPlanError('');
    try {
      const res = await api.generatePlan();
      if (res?.plan) {
        setActivePlan(res.plan);
      } else {
        navigate('/plan');
      }
    } catch (err) {
      setPlanError(err?.message || 'Could not generate a workout plan.');
    } finally {
      setGeneratingPlan(false);
    }
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error && !stats && !onboardingData) {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-100 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-gray-900 border border-gray-800 rounded-xl p-6 text-center space-y-4"
        >
          <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6 text-red-400" />
          </div>
          <h2 className="text-xl font-semibold text-white">Unable to Load Dashboard</h2>
          <p className="text-sm text-gray-400">{error}</p>
          <button
            type="button"
            onClick={fetchDashboardData}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-semibold transition-colors cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
        </motion.div>
      </div>
    );
  }

  const formattedDate = now.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const todayName = DAYS_OF_WEEK[now.getDay()];

  const profile = onboardingData?.profile || {};
  const goals = onboardingData?.goals || {};
  const displayName = user?.full_name || 'Athlete';

  const schedule = Array.isArray(activePlan?.schedule) ? activePlan.schedule : [];
  const todayWorkout = schedule.find(
    (item) => item?.day?.toLowerCase() === todayName.toLowerCase()
  );

  const weeklyTarget = Number(profile?.workout_days_per_week) || activePlan?.daysPerWeek || 4;
  const thisWeekCount = Number(stats?.this_week) || 0;
  const weeklyGoalPct = Math.min(100, Math.round((thisWeekCount / Math.max(weeklyTarget, 1)) * 100));

  const currentWeight = Number(profile?.current_weight_kg);
  const targetWeight = Number(profile?.target_weight_kg);
  const hasWeightData =
    Number.isFinite(currentWeight) &&
    currentWeight > 0 &&
    Number.isFinite(targetWeight) &&
    targetWeight > 0;

  let weightDiff = 0;
  let weightGoalReached = false;
  let weightProgressPct = 0;
  let weightDirection = 'maintain';

  if (hasWeightData) {
    weightDiff = Math.abs(currentWeight - targetWeight);
    weightGoalReached = weightDiff < 0.2;
    weightDirection =
      targetWeight < currentWeight ? 'lose' : targetWeight > currentWeight ? 'gain' : 'maintain';
    if (weightGoalReached) {
      weightProgressPct = 100;
    } else {
      const span = Math.max(weightDiff * 1.5, 10);
      weightProgressPct = Math.max(12, Math.min(95, Math.round((1 - weightDiff / span) * 100)));
    }
  }

  const statCards = [
    {
      label: 'Total Workouts',
      value: stats?.total_workouts ?? 0,
      subtext: 'Completed sessions',
      icon: Dumbbell,
      iconColor: 'text-emerald-400',
      iconBg: 'bg-emerald-500/10 border-emerald-500/20',
    },
    {
      label: 'This Week',
      value: thisWeekCount,
      subtext: `Goal: ${weeklyTarget} workouts/wk`,
      icon: Calendar,
      iconColor: 'text-teal-400',
      iconBg: 'bg-teal-500/10 border-teal-500/20',
    },
    {
      label: 'Current Streak',
      value: `${stats?.streak ?? 0}d`,
      subtext: (stats?.streak ?? 0) > 0 ? 'Keep the momentum!' : 'Start your streak today',
      icon: Flame,
      iconColor: 'text-orange-400',
      iconBg: 'bg-orange-500/10 border-orange-500/20',
    },
    {
      label: 'Total Sets',
      value: stats?.total_sets ?? 0,
      subtext: 'Logged across all workouts',
      icon: Trophy,
      iconColor: 'text-amber-400',
      iconBg: 'bg-amber-500/10 border-amber-500/20',
    },
  ];

  const quickActions = [
    {
      title: 'Track Progress',
      description: 'Log weight, measurements & trends',
      to: '/progress',
      icon: TrendingUp,
      accent: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    },
    {
      title: 'Ask AI Coach',
      description: 'Get form tips, swaps & guidance',
      to: '/coach',
      icon: Zap,
      accent: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
    },
    {
      title: 'View Nutrition',
      description: 'Daily calories, macros & meal plan',
      to: '/nutrition',
      icon: Utensils,
      accent: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-4 sm:p-6 lg:p-8">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-7xl mx-auto space-y-6"
      >
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center justify-between gap-3 bg-red-500/10 border border-red-500/30 text-red-300 px-4 py-3 rounded-xl text-sm"
            >
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
              <button
                type="button"
                onClick={fetchDashboardData}
                className="text-xs font-semibold underline hover:text-white cursor-pointer"
              >
                Retry
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Welcome Header */}
        <motion.header
          variants={itemVariants}
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gray-900/70 border border-gray-800 rounded-xl p-5 sm:p-6"
        >
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-emerald-400">
              <Home className="w-3.5 h-3.5" />
              <span>FitCoach AI Dashboard</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Welcome back, <span className="text-emerald-400">{displayName}</span>
            </h1>
            <p className="text-sm text-gray-400 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span>{formattedDate}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {activePlan ? (
              <Link
                to="/workout"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-semibold text-sm shadow-lg shadow-emerald-500/20 transition-all"
              >
                <Play className="w-4 h-4 fill-current" />
                Start Today&apos;s Workout
              </Link>
            ) : (
              <button
                type="button"
                onClick={handleGeneratePlan}
                disabled={generatingPlan}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 text-gray-950 font-semibold text-sm shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                {generatingPlan ? 'Generating Plan...' : 'Generate Your Workout Plan'}
              </button>
            )}
          </div>
        </motion.header>

        {/* Stats Grid */}
        <motion.section
          variants={itemVariants}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                whileHover={{ y: -2 }}
                className="bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-xl p-4 sm:p-5 transition-colors"
              >
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-xs sm:text-sm font-medium text-gray-400">
                    {stat.label}
                  </span>
                  <div
                    className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 ${stat.iconBg}`}
                  >
                    <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${stat.iconColor}`} />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-white">
                  {stat.value}
                </div>
                <p className="text-xs text-gray-500 mt-1 truncate">{stat.subtext}</p>
              </motion.div>
            );
          })}
        </motion.section>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Primary Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Today's Workout Card */}
            <motion.section
              variants={itemVariants}
              className="bg-gray-900 border border-gray-800 rounded-xl p-5 sm:p-6"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                    <Dumbbell className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-white">Today&apos;s Workout</h2>
                    <p className="text-xs text-gray-400">{todayName} Schedule</p>
                  </div>
                </div>
                {activePlan && (
                  <Link
                    to="/plan"
                    className="inline-flex items-center gap-1 text-xs font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
                  >
                    <span>View Full Plan</span>
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                )}
              </div>

              {!activePlan ? (
                <div className="bg-gray-800/50 border border-dashed border-gray-700 rounded-xl p-6 text-center space-y-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto">
                    <Sparkles className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div className="space-y-1 max-w-md mx-auto">
                    <h3 className="text-base font-semibold text-white">
                      No Active Workout Plan Yet
                    </h3>
                    <p className="text-sm text-gray-400">
                      Let FitCoach AI build a personalized weekly training plan tailored to your goals, equipment, and schedule.
                    </p>
                  </div>

                  {planError && (
                    <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 max-w-md mx-auto">
                      {planError}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={handleGeneratePlan}
                      disabled={generatingPlan}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 text-gray-950 font-semibold text-sm transition-colors cursor-pointer"
                    >
                      <Zap className="w-4 h-4" />
                      {generatingPlan ? 'Generating...' : 'Generate Your Workout Plan'}
                    </button>
                    <Link
                      to="/onboarding"
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-200 text-sm font-medium border border-gray-700 transition-colors"
                    >
                      Update Preferences
                    </Link>
                  </div>
                </div>
              ) : todayWorkout?.isRestDay ? (
                <div className="space-y-4">
                  <div className="bg-gray-800/60 border border-gray-800 rounded-xl p-5">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Rest &amp; Recovery Day
                      </span>
                      <span className="text-xs text-gray-400">{activePlan.planName}</span>
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">
                      {todayWorkout.focus || 'Active Recovery'}
                    </h3>
                    {Array.isArray(todayWorkout.activities) &&
                      todayWorkout.activities.length > 0 && (
                        <ul className="space-y-1.5 text-sm text-gray-300 mt-3">
                          {todayWorkout.activities.map((activity, idx) => (
                            <li key={idx} className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                              <span>{activity}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                  </div>

                  <Link
                    to="/workout"
                    className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-semibold text-sm transition-colors"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    Start Today&apos;s Workout
                  </Link>
                </div>
              ) : todayWorkout ? (
                <div className="space-y-4">
                  <div className="bg-gray-800/60 border border-gray-800 rounded-xl p-4 sm:p-5">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                        {activePlan.planName || 'Active Plan'}
                      </span>
                      {todayWorkout.estimatedDuration && (
                        <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                          <Clock className="w-3.5 h-3.5 text-emerald-400" />
                          {todayWorkout.estimatedDuration}
                        </span>
                      )}
                    </div>
                    <h3 className="text-xl font-bold text-white">{todayWorkout.focus}</h3>
                    <p className="text-xs text-gray-400 mt-1">
                      {todayWorkout.exercises?.length || 0} exercises planned
                    </p>

                    {Array.isArray(todayWorkout.exercises) &&
                      todayWorkout.exercises.length > 0 && (
                        <div className="mt-4 divide-y divide-gray-800 border-t border-gray-800">
                          {todayWorkout.exercises.slice(0, 4).map((exercise, idx) => (
                            <div
                              key={`${exercise.name}-${idx}`}
                              className="py-2.5 flex items-center justify-between gap-3 text-sm"
                            >
                              <div className="min-w-0">
                                <p className="font-medium text-gray-100 truncate">
                                  {exercise.name}
                                </p>
                                <p className="text-xs text-gray-500 truncate">
                                  {exercise.muscle}
                                </p>
                              </div>
                              <span className="text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg shrink-0">
                                {exercise.sets} x {exercise.reps}
                              </span>
                            </div>
                          ))}
                          {todayWorkout.exercises.length > 4 && (
                            <div className="pt-2.5 text-xs text-gray-400 text-center">
                              +{todayWorkout.exercises.length - 4} more exercises in this session
                            </div>
                          )}
                        </div>
                      )}
                  </div>

                  <Link
                    to="/workout"
                    className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-semibold text-sm sm:text-base shadow-lg shadow-emerald-500/20 transition-all"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    Start Today&apos;s Workout
                  </Link>
                </div>
              ) : (
                <div className="bg-gray-800/60 border border-gray-800 rounded-xl p-5 space-y-4">
                  <p className="text-sm text-gray-300">
                    No specific session matched for {todayName}. You can still pick any workout day to train today.
                  </p>
                  <Link
                    to="/workout"
                    className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-semibold text-sm transition-colors"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    Start Today&apos;s Workout
                  </Link>
                </div>
              )}
            </motion.section>

            {/* Weekly Overview */}
            <motion.section
              variants={itemVariants}
              className="bg-gray-900 border border-gray-800 rounded-xl p-5 sm:p-6"
            >
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-gray-800 border border-gray-700 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-white">Weekly Overview</h2>
                    <p className="text-xs text-gray-400">
                      {activePlan
                        ? `${schedule.filter((d) => !d.isRestDay).length} training days scheduled`
                        : 'Generate a plan to populate your week'}
                    </p>
                  </div>
                </div>
                <Link
                  to="/plan"
                  className="text-xs font-medium text-gray-400 hover:text-emerald-400 inline-flex items-center gap-1 transition-colors"
                >
                  <span>Schedule</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5">
                {WEEK_ORDER.map((dayName) => {
                  const dayPlan = schedule.find(
                    (d) => d?.day?.toLowerCase() === dayName.toLowerCase()
                  );
                  const isToday = dayName.toLowerCase() === todayName.toLowerCase();
                  const hasWorkout = Boolean(dayPlan && !dayPlan.isRestDay);

                  return (
                    <div
                      key={dayName}
                      className={`rounded-xl p-3 border transition-all flex flex-col justify-between min-h-[88px] ${
                        isToday
                          ? 'bg-emerald-500/15 border-emerald-500/60 ring-1 ring-emerald-500/30'
                          : hasWorkout
                          ? 'bg-gray-800/80 border-gray-700'
                          : 'bg-gray-950/60 border-gray-800/80'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span
                          className={`text-xs font-semibold ${
                            isToday ? 'text-emerald-400' : 'text-gray-300'
                          }`}
                        >
                          {dayName.slice(0, 3)}
                        </span>
                        <span
                          className={`w-2 h-2 rounded-full ${
                            hasWorkout ? 'bg-emerald-400' : 'bg-gray-700'
                          }`}
                        />
                      </div>

                      <div className="mt-2">
                        <p
                          className={`text-[11px] leading-tight line-clamp-2 ${
                            hasWorkout ? 'text-gray-200 font-medium' : 'text-gray-500'
                          }`}
                        >
                          {dayPlan
                            ? hasWorkout
                              ? dayPlan.focus
                              : 'Rest'
                            : 'Unplanned'}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.section>

            {/* Recent Workout Sessions */}
            <motion.section
              variants={itemVariants}
              className="bg-gray-900 border border-gray-800 rounded-xl p-5 sm:p-6"
            >
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-gray-800 border border-gray-700 flex items-center justify-center">
                    <Trophy className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-white">Recent Workout Sessions</h2>
                    <p className="text-xs text-gray-400">Your latest training activity</p>
                  </div>
                </div>
                <Link
                  to="/workout"
                  className="text-xs font-medium text-emerald-400 hover:text-emerald-300 inline-flex items-center gap-1 transition-colors"
                >
                  <span>Log Workout</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>

              {recentSessions.length === 0 ? (
                <div className="bg-gray-800/40 border border-gray-800 rounded-xl p-6 text-center space-y-2">
                  <p className="text-sm font-medium text-gray-300">
                    No workout sessions recorded yet
                  </p>
                  <p className="text-xs text-gray-500">
                    Complete your first workout to track sets, duration, and build your streak.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentSessions.map((session) => {
                    const isCompleted = session.status === 'completed';
                    return (
                      <div
                        key={session.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gray-800/50 border border-gray-800 hover:border-gray-700 rounded-xl p-4 transition-colors"
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          <div
                            className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border ${
                              isCompleted
                                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                            }`}
                          >
                            <Dumbbell className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-white truncate">
                              {session.workout_name || 'Workout Session'}
                            </p>
                            <p className="text-xs text-gray-400">
                              {session.day_name ? `${session.day_name} • ` : ''}
                              {formatSessionDate(session.started_at)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                          {typeof session.sets_completed === 'number' && (
                            <span className="text-xs text-gray-400">
                              {session.sets_completed} sets
                            </span>
                          )}
                          {session.total_duration_minutes > 0 && (
                            <span className="text-xs text-gray-400 inline-flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              {session.total_duration_minutes}m
                            </span>
                          )}
                          <span
                            className={`text-xs font-medium px-2.5 py-1 rounded-full border ${
                              isCompleted
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            }`}
                          >
                            {isCompleted ? 'Completed' : 'In Progress'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.section>
          </div>

          {/* Secondary Column */}
          <div className="space-y-6">
            {/* Current Goal Card */}
            <motion.section
              variants={itemVariants}
              className="bg-gray-900 border border-gray-800 rounded-xl p-5 sm:p-6 space-y-4"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                    <Target className="w-5 h-5 text-emerald-400" />
                  </div>
                  <h2 className="text-lg font-semibold text-white">Current Goal</h2>
                </div>
                <Link
                  to="/profile"
                  className="text-xs font-medium text-gray-400 hover:text-emerald-400 transition-colors"
                >
                  Edit
                </Link>
              </div>

              <div className="bg-gray-800/60 border border-gray-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-base font-semibold text-white">
                    {formatGoalLabel(goals?.primary_goal)}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                    Active
                  </span>
                </div>

                {goals?.secondary_goal && (
                  <p className="text-xs text-gray-400">
                    Secondary: <span className="text-gray-300">{formatGoalLabel(goals.secondary_goal)}</span>
                  </p>
                )}

                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">Weekly Consistency</span>
                    <span className="text-emerald-400 font-semibold">
                      {thisWeekCount}/{weeklyTarget} workouts ({weeklyGoalPct}%)
                    </span>
                  </div>
                  <div className="h-2.5 w-full bg-gray-950 rounded-full overflow-hidden border border-gray-800">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${weeklyGoalPct}%` }}
                      transition={{ duration: 0.7, ease: 'easeOut' }}
                      className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  {profile?.fitness_experience && (
                    <span className="text-[11px] px-2 py-0.5 rounded-md bg-gray-900 text-gray-300 border border-gray-700 capitalize">
                      {profile.fitness_experience}
                    </span>
                  )}
                  {profile?.workout_location && (
                    <span className="text-[11px] px-2 py-0.5 rounded-md bg-gray-900 text-gray-300 border border-gray-700 capitalize">
                      {profile.workout_location}
                    </span>
                  )}
                  {goals?.target_timeline && (
                    <span className="text-[11px] px-2 py-0.5 rounded-md bg-gray-900 text-gray-300 border border-gray-700">
                      {goals.target_timeline}
                    </span>
                  )}
                </div>
              </div>
            </motion.section>

            {/* Weight Tracker Card */}
            <motion.section
              variants={itemVariants}
              className="bg-gray-900 border border-gray-800 rounded-xl p-5 sm:p-6 space-y-4"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                    <Scale className="w-5 h-5 text-emerald-400" />
                  </div>
                  <h2 className="text-lg font-semibold text-white">Weight Tracker</h2>
                </div>
                <Link
                  to="/progress"
                  className="text-xs font-medium text-emerald-400 hover:text-emerald-300 inline-flex items-center gap-1 transition-colors"
                >
                  <span>Log</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {hasWeightData ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-800/60 border border-gray-800 rounded-xl p-3.5">
                      <span className="text-xs text-gray-400 block">Current</span>
                      <span className="text-xl font-bold text-white">
                        {currentWeight} <span className="text-xs font-normal text-gray-400">kg</span>
                      </span>
                    </div>
                    <div className="bg-gray-800/60 border border-gray-800 rounded-xl p-3.5">
                      <span className="text-xs text-gray-400 block">Target</span>
                      <span className="text-xl font-bold text-emerald-400">
                        {targetWeight} <span className="text-xs font-normal text-gray-400">kg</span>
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400">
                        {weightGoalReached
                          ? 'Target weight achieved!'
                          : `${weightDiff.toFixed(1)} kg to ${weightDirection}`}
                      </span>
                      <span className="text-emerald-400 font-semibold">{weightProgressPct}%</span>
                    </div>
                    <div className="h-2.5 w-full bg-gray-950 rounded-full overflow-hidden border border-gray-800">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${weightProgressPct}%` }}
                        transition={{ duration: 0.7, ease: 'easeOut' }}
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
                      />
                    </div>
                  </div>

                  {profile?.bmi && (
                    <div className="flex items-center justify-between text-xs pt-1 border-t border-gray-800 text-gray-400">
                      <span>Current BMI</span>
                      <span className="font-semibold text-gray-200">{profile.bmi}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-gray-800/40 border border-gray-800 rounded-xl p-4 text-center space-y-2">
                  <p className="text-sm text-gray-300">Weight targets not set yet</p>
                  <Link
                    to="/profile"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 hover:text-emerald-300"
                  >
                    Set current &amp; target weight
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )}
            </motion.section>

            {/* Quick Action Cards */}
            <motion.section
              variants={itemVariants}
              className="bg-gray-900 border border-gray-800 rounded-xl p-5 sm:p-6 space-y-3"
            >
              <h2 className="text-lg font-semibold text-white mb-1">Quick Actions</h2>
              <div className="space-y-2.5">
                {quickActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <Link
                      key={action.title}
                      to={action.to}
                      className="group flex items-center justify-between gap-3 bg-gray-800/50 hover:bg-gray-800 border border-gray-800 hover:border-emerald-500/40 rounded-xl p-3.5 transition-all"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-10 h-10 rounded-lg border flex items-center justify-center shrink-0 ${action.accent}`}
                        >
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-white group-hover:text-emerald-400 transition-colors">
                            {action.title}
                          </p>
                          <p className="text-xs text-gray-400 truncate">
                            {action.description}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all shrink-0" />
                    </Link>
                  );
                })}
              </div>
            </motion.section>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

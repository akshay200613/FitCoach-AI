import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Pause,
  SkipForward,
  Check,
  Clock,
  Dumbbell,
  Trophy,
  X,
  ChevronRight,
  Timer,
  Video,
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

function parseRestSeconds(restValue) {
  if (!restValue) return 60;
  const text = String(restValue).toLowerCase().trim();
  if (text === 'n/a' || text === 'none' || text === '0') return 0;
  const match = text.match(/(\d+)/);
  if (!match) return 60;
  const amount = parseInt(match[1], 10);
  if (Number.isNaN(amount)) return 60;
  if (text.includes('min')) return amount * 60;
  return amount;
}

function parseDefaultReps(repsValue) {
  if (!repsValue) return '';
  const match = String(repsValue).match(/(\d+)/);
  return match ? match[1] : '';
}

function getEmbedUrl(url) {
  if (!url) return '';
  if (url.includes('/embed/')) return url;
  const watchMatch = url.match(/[?&]v=([^&]+)/);
  if (watchMatch) {
    return `https://www.youtube.com/embed/${watchMatch[1]}`;
  }
  const shortMatch = url.match(/youtu\.be\/([^?&]+)/);
  if (shortMatch) {
    return `https://www.youtube.com/embed/${shortMatch[1]}`;
  }
  return url;
}

function formatSeconds(totalSeconds) {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const mins = Math.floor(safeSeconds / 60);
  const secs = safeSeconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function getDifficultyBadgeClass(difficulty) {
  const level = (difficulty || '').toLowerCase();
  if (level === 'beginner') {
    return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
  }
  if (level === 'intermediate') {
    return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
  }
  if (level === 'advanced') {
    return 'bg-rose-500/15 text-rose-400 border-rose-500/30';
  }
  return 'bg-gray-800 text-gray-300 border-gray-700';
}

export default function ActiveWorkout() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionError, setActionError] = useState(null);

  const [plan, setPlan] = useState(null);
  const [todayWorkout, setTodayWorkout] = useState(null);

  // 'idle' | 'active' | 'resting' | 'completed'
  const [workoutState, setWorkoutState] = useState('idle');
  const [sessionId, setSessionId] = useState(null);
  const [startingSession, setStartingSession] = useState(false);

  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [showDemo, setShowDemo] = useState(false);

  // setLogs[exerciseIndex] = [{ setNumber, targetReps, reps, weight, completed, skipped }]
  const [setLogs, setSetLogs] = useState({});
  const [savingSetKey, setSavingSetKey] = useState(null);
  const [skippingExercise, setSkippingExercise] = useState(false);
  const [completingWorkout, setCompletingWorkout] = useState(false);

  // Rest timer state
  const [restDuration, setRestDuration] = useState(60);
  const [restRemaining, setRestRemaining] = useState(60);
  const [isRestPaused, setIsRestPaused] = useState(false);
  const [pendingNextExerciseIndex, setPendingNextExerciseIndex] = useState(null);

  // Summary state
  const [summaryData, setSummaryData] = useState(null);

  const startTimeRef = useRef(null);
  const [todayName] = useState(() => DAYS_OF_WEEK[new Date().getDay()]);

  const loadActivePlan = useCallback(async () => {
    try {
      const data = await api.getActivePlan();
      const activePlan = data?.plan || null;
      setPlan(activePlan);

      if (activePlan && Array.isArray(activePlan.schedule)) {
        const matchedDay = activePlan.schedule.find(
          (item) => (item.day || '').toLowerCase() === todayName.toLowerCase()
        );
        setTodayWorkout(matchedDay || null);
      } else {
        setTodayWorkout(null);
      }
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to load your active workout plan.');
    } finally {
      setLoading(false);
    }
  }, [todayName]);

  const handleRetryLoad = () => {
    setLoading(true);
    setError(null);
    loadActivePlan();
  };

  useEffect(() => {
    let active = true;
    api
      .getActivePlan()
      .then((data) => {
        if (!active) return;
        const activePlan = data?.plan || null;
        setPlan(activePlan);
        if (activePlan && Array.isArray(activePlan.schedule)) {
          const matchedDay = activePlan.schedule.find(
            (item) => (item.day || '').toLowerCase() === todayName.toLowerCase()
          );
          setTodayWorkout(matchedDay || null);
        } else {
          setTodayWorkout(null);
        }
      })
      .catch((err) => {
        if (!active) return;
        setError(err.message || 'Failed to load your active workout plan.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [todayName]);

  // Countdown interval during resting state
  useEffect(() => {
    if (workoutState !== 'resting' || isRestPaused) return;

    const intervalId = setInterval(() => {
      setRestRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(intervalId);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(intervalId);
  }, [workoutState, isRestPaused]);

  // Auto-advance when rest timer reaches 0
  useEffect(() => {
    if (workoutState !== 'resting' || restRemaining > 0) return;

    const timeoutId = setTimeout(() => {
      if (pendingNextExerciseIndex !== null) {
        setCurrentExerciseIndex(pendingNextExerciseIndex);
        setPendingNextExerciseIndex(null);
        setShowDemo(false);
      }
      setWorkoutState('active');
    }, 150);

    return () => clearTimeout(timeoutId);
  }, [workoutState, restRemaining, pendingNextExerciseIndex]);

  const exercises = todayWorkout?.exercises || [];
  const currentExercise = exercises[currentExerciseIndex] || null;

  const initializeSetLogs = (exerciseList) => {
    const initial = {};
    exerciseList.forEach((ex, exIdx) => {
      const numSets = Math.max(1, Number(ex.sets) || 3);
      const defaultReps = parseDefaultReps(ex.reps);
      initial[exIdx] = Array.from({ length: numSets }, (_, idx) => ({
        setNumber: idx + 1,
        targetReps: ex.reps || '10',
        reps: defaultReps,
        weight: '',
        completed: false,
        skipped: false,
      }));
    });
    setSetLogs(initial);
  };

  const calculateTotals = (logs) => {
    let totalPlannedSets = 0;
    let completedSetsCount = 0;
    let exercisesCompletedCount = 0;

    exercises.forEach((_, exIdx) => {
      const exSets = logs[exIdx] || [];
      totalPlannedSets += exSets.length;
      const doneSets = exSets.filter((s) => s.completed).length;
      completedSetsCount += doneSets;
      if (doneSets > 0) {
        exercisesCompletedCount += 1;
      }
    });

    const completionPercentage =
      totalPlannedSets > 0
        ? Math.round((completedSetsCount / totalPlannedSets) * 100)
        : 0;

    return {
      totalExercises: exercises.length,
      exercisesCompleted: exercisesCompletedCount,
      totalSets: totalPlannedSets,
      setsCompleted: completedSetsCount,
      completionPercentage,
    };
  };

  const handleStartWorkout = async () => {
    if (!plan || !todayWorkout || exercises.length === 0) return;
    setStartingSession(true);
    setActionError(null);
    try {
      const workoutName =
        todayWorkout.focus || todayWorkout.workoutName || `${todayName} Workout`;
      const res = await api.startSession({
        plan_id: plan.id,
        day_name: todayWorkout.day || todayName,
        workout_name: workoutName,
      });

      setSessionId(res.session_id);
      startTimeRef.current = Date.now();
      initializeSetLogs(exercises);
      setCurrentExerciseIndex(0);
      setShowDemo(false);
      setPendingNextExerciseIndex(null);
      setWorkoutState('active');
    } catch (err) {
      setActionError(err.message || 'Could not start workout session.');
    } finally {
      setStartingSession(false);
    }
  };

  const handleSetInputChange = (exIdx, setIdx, field, value) => {
    setSetLogs((prev) => {
      const updatedExerciseSets = (prev[exIdx] || []).map((item, idx) =>
        idx === setIdx ? { ...item, [field]: value } : item
      );
      return { ...prev, [exIdx]: updatedExerciseSets };
    });
  };

  const handleFinishWorkout = async (latestLogs = setLogs) => {
    if (completingWorkout) return;
    setCompletingWorkout(true);
    setActionError(null);

    const elapsedMs = startTimeRef.current
      ? Date.now() - startTimeRef.current
      : 60000;
    const totalSeconds = Math.max(1, Math.round(elapsedMs / 1000));
    const durationMinutes = Math.max(1, Math.round(elapsedMs / 60000));

    const totals = calculateTotals(latestLogs);

    try {
      if (sessionId) {
        await api.completeSession({
          session_id: sessionId,
          total_duration_minutes: durationMinutes,
        });
      }
    } catch (err) {
      setActionError(
        err.message || 'Workout finished locally, but failed to sync completion.'
      );
    } finally {
      setSummaryData({
        ...totals,
        durationMinutes,
        durationFormatted: formatSeconds(totalSeconds),
      });
      setWorkoutState('completed');
      setCompletingWorkout(false);
    }
  };

  const handleCompleteSet = async (exIdx, setIdx) => {
    const exercise = exercises[exIdx];
    const currentSet = setLogs[exIdx]?.[setIdx];
    if (!exercise || !currentSet || currentSet.completed || savingSetKey) return;

    const key = `${exIdx}-${setIdx}`;
    setSavingSetKey(key);
    setActionError(null);

    const parsedReps =
      parseInt(currentSet.reps, 10) ||
      parseInt(parseDefaultReps(currentSet.targetReps), 10) ||
      0;
    const parsedWeight = parseFloat(currentSet.weight) || 0;

    try {
      await api.recordSet({
        session_id: sessionId,
        exercise_name: exercise.name,
        set_number: currentSet.setNumber,
        reps: parsedReps,
        weight_kg: parsedWeight,
        skipped: false,
      });

      const updatedExerciseSets = (setLogs[exIdx] || []).map((item, idx) =>
        idx === setIdx
          ? {
              ...item,
              reps: String(parsedReps),
              weight: currentSet.weight === '' ? '0' : currentSet.weight,
              completed: true,
              skipped: false,
            }
          : item
      );

      const updatedLogs = {
        ...setLogs,
        [exIdx]: updatedExerciseSets,
      };
      setSetLogs(updatedLogs);

      const allSetsDoneInCurrent = updatedExerciseSets.every(
        (s) => s.completed || s.skipped
      );
      const isLastExercise = exIdx >= exercises.length - 1;

      if (allSetsDoneInCurrent && isLastExercise) {
        await handleFinishWorkout(updatedLogs);
        return;
      }

      const nextExerciseTarget =
        allSetsDoneInCurrent && !isLastExercise ? exIdx + 1 : null;

      const restSecs = parseRestSeconds(exercise.rest);
      if (restSecs > 0) {
        setRestDuration(restSecs);
        setRestRemaining(restSecs);
        setIsRestPaused(false);
        setPendingNextExerciseIndex(nextExerciseTarget);
        setWorkoutState('resting');
      } else if (nextExerciseTarget !== null) {
        setCurrentExerciseIndex(nextExerciseTarget);
        setShowDemo(false);
      }
    } catch (err) {
      setActionError(err.message || 'Failed to record set. Please try again.');
    } finally {
      setSavingSetKey(null);
    }
  };

  const handleSkipExercise = async () => {
    if (!currentExercise || skippingExercise) return;
    setSkippingExercise(true);
    setActionError(null);

    const currentSets = setLogs[currentExerciseIndex] || [];
    const remainingSets = currentSets.filter((s) => !s.completed && !s.skipped);

    try {
      await Promise.all(
        remainingSets.map((s) =>
          api.recordSet({
            session_id: sessionId,
            exercise_name: currentExercise.name,
            set_number: s.setNumber,
            reps: 0,
            weight_kg: 0,
            skipped: true,
          })
        )
      );

      const updatedExerciseSets = currentSets.map((s) =>
        s.completed ? s : { ...s, skipped: true }
      );
      const updatedLogs = {
        ...setLogs,
        [currentExerciseIndex]: updatedExerciseSets,
      };
      setSetLogs(updatedLogs);

      if (currentExerciseIndex < exercises.length - 1) {
        setCurrentExerciseIndex((prev) => prev + 1);
        setShowDemo(false);
      } else {
        await handleFinishWorkout(updatedLogs);
      }
    } catch (err) {
      setActionError(err.message || 'Failed to skip exercise.');
    } finally {
      setSkippingExercise(false);
    }
  };

  const handleNextExercise = () => {
    if (currentExerciseIndex < exercises.length - 1) {
      setCurrentExerciseIndex((prev) => prev + 1);
      setShowDemo(false);
    } else {
      handleFinishWorkout(setLogs);
    }
  };

  const handleSkipRestTimer = () => {
    if (pendingNextExerciseIndex !== null) {
      setCurrentExerciseIndex(pendingNextExerciseIndex);
      setPendingNextExerciseIndex(null);
      setShowDemo(false);
    }
    setIsRestPaused(false);
    setRestRemaining(0);
    setWorkoutState('active');
  };

  // Compute live progress bar metrics
  const liveTotals = calculateTotals(setLogs);
  const resolvedSetsCount = Object.values(setLogs).reduce(
    (acc, list) => acc + list.filter((s) => s.completed || s.skipped).length,
    0
  );
  const overallProgressPercent =
    liveTotals.totalSets > 0
      ? Math.round((resolvedSetsCount / liveTotals.totalSets) * 100)
      : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-100 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-full border-4 border-gray-800 border-t-emerald-500 animate-spin" />
          <p className="text-gray-400 text-sm font-medium">
            Loading today&apos;s workout...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-gray-900 border border-gray-800 rounded-2xl p-6 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-rose-500/15 text-rose-400 flex items-center justify-center mx-auto">
            <X className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white">Unable to Load Workout</h2>
          <p className="text-sm text-gray-400">{error}</p>
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="button"
              onClick={handleRetryLoad}
              className="flex-1 py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-semibold transition cursor-pointer"
            >
              Try Again
            </button>
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="flex-1 py-3 px-4 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-200 font-semibold transition cursor-pointer"
            >
              Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-100 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-gray-900 border border-gray-800 rounded-2xl p-8 text-center space-y-5"
        >
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center mx-auto">
            <Dumbbell className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-white">No Active Workout Plan</h1>
            <p className="text-gray-400 text-sm">
              Generate a personalized AI workout plan first so FitCoach AI can guide your daily sessions.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/plan')}
            className="w-full py-3.5 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-bold flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <span>Create Workout Plan</span>
            <ChevronRight className="w-5 h-5" />
          </button>
        </motion.div>
      </div>
    );
  }

  const isRestDay =
    !todayWorkout ||
    todayWorkout.isRestDay ||
    !Array.isArray(todayWorkout.exercises) ||
    todayWorkout.exercises.length === 0;

  if (workoutState === 'idle' && isRestDay) {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-100 p-4 sm:p-6 lg:p-8 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-xl w-full bg-gray-900 border border-gray-800 rounded-2xl p-6 sm:p-8 space-y-6"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
              <Clock className="w-7 h-7" />
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                {todayName}
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">
                Rest &amp; Recovery Day
              </h1>
            </div>
          </div>

          <p className="text-gray-300 leading-relaxed">
            {user?.full_name ? `${user.full_name.split(' ')[0]}, you` : 'You'} have no
            scheduled lifting session today
            {todayWorkout?.focus ? ` (${todayWorkout.focus})` : ''}. Muscles grow
            during recovery—prioritize sleep, hydration, and light movement.
          </p>

          {Array.isArray(todayWorkout?.activities) &&
            todayWorkout.activities.length > 0 && (
              <div className="bg-gray-950/70 border border-gray-800 rounded-xl p-4 space-y-2.5">
                <h3 className="text-sm font-semibold text-emerald-400 uppercase tracking-wider">
                  Recommended Recovery Activities
                </h3>
                <ul className="space-y-2">
                  {todayWorkout.activities.map((activity, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-2.5 text-sm text-gray-300"
                    >
                      <Check className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                      <span>{activity}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="flex-1 py-3.5 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-bold flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <span>Back to Dashboard</span>
              <ChevronRight className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => navigate('/plan')}
              className="flex-1 py-3.5 px-5 rounded-xl bg-gray-800 hover:bg-gray-700 text-white font-semibold transition cursor-pointer"
            >
              View Full Schedule
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Circular SVG metrics for Rest Timer
  const circleRadius = 88;
  const circleCircumference = 2 * Math.PI * circleRadius;
  const restProgress =
    restDuration > 0 ? Math.max(0, restRemaining / restDuration) : 0;
  const strokeDashoffset = circleCircumference * (1 - restProgress);

  const upNextExercise =
    pendingNextExerciseIndex !== null
      ? exercises[pendingNextExerciseIndex]
      : currentExercise;

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {actionError && (
          <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
            <span className="text-sm">{actionError}</span>
            <button
              type="button"
              onClick={() => setActionError(null)}
              className="p-1 hover:bg-rose-500/20 rounded-lg transition cursor-pointer"
              aria-label="Dismiss error"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <AnimatePresence mode="wait">
          {workoutState === 'idle' && (
            <motion.div
              key="idle"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              {/* Hero Header */}
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 sm:p-8 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
                      <Dumbbell className="w-3.5 h-3.5" />
                      <span>{todayWorkout.day || todayName}</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
                      {todayWorkout.focus ||
                        todayWorkout.workoutName ||
                        "Today's Workout"}
                    </h1>
                    {plan.planName && (
                      <p className="text-sm text-gray-400">{plan.planName}</p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-3">
                    {todayWorkout.estimatedDuration && (
                      <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gray-950 border border-gray-800 text-sm text-gray-300">
                        <Clock className="w-4 h-4 text-emerald-400" />
                        <span>{todayWorkout.estimatedDuration}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gray-950 border border-gray-800 text-sm text-gray-300">
                      <Dumbbell className="w-4 h-4 text-emerald-400" />
                      <span>{exercises.length} Exercises</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleStartWorkout}
                  disabled={startingSession}
                  className="w-full py-4 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 text-gray-950 font-extrabold text-lg flex items-center justify-center gap-3 shadow-lg shadow-emerald-500/20 transition cursor-pointer"
                >
                  <Play className="w-6 h-6 fill-current" />
                  <span>
                    {startingSession ? 'Starting Session...' : 'Start Workout'}
                  </span>
                </button>
              </div>

              {/* Exercise Preview List */}
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 sm:p-6 space-y-4">
                <h2 className="text-lg font-bold text-white">
                  Workout Overview ({exercises.length} exercises)
                </h2>
                <div className="divide-y divide-gray-800">
                  {exercises.map((ex, idx) => (
                    <div
                      key={`${ex.name}-${idx}`}
                      className="py-4 first:pt-1 last:pb-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-start gap-3.5">
                        <div className="w-8 h-8 rounded-lg bg-gray-800 text-emerald-400 font-bold text-sm flex items-center justify-center shrink-0 mt-0.5">
                          {idx + 1}
                        </div>
                        <div>
                          <h3 className="font-semibold text-white">{ex.name}</h3>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {ex.muscle || ex.targetMuscle || 'Full Body'}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 pl-11 sm:pl-0">
                        <span className="px-2.5 py-1 rounded-lg bg-gray-950 border border-gray-800 text-xs font-medium text-gray-300">
                          {ex.sets || 3} sets &times; {ex.reps || '10'}
                        </span>
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gray-950 border border-gray-800 text-xs font-medium text-gray-300">
                          <Timer className="w-3.5 h-3.5 text-emerald-400" />
                          {ex.rest || '60 sec'}
                        </span>
                        {ex.difficulty && (
                          <span
                            className={`px-2.5 py-1 rounded-lg border text-xs font-medium ${getDifficultyBadgeClass(
                              ex.difficulty
                            )}`}
                          >
                            {ex.difficulty}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {workoutState === 'active' && currentExercise && (
            <motion.div
              key="active-wrapper"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-5"
            >
              {/* Top Progress Bar */}
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 sm:p-5 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                      Exercise {currentExerciseIndex + 1} of {exercises.length}
                    </p>
                    <p className="text-sm text-gray-400">
                      {resolvedSetsCount} of {liveTotals.totalSets} sets logged (
                      {overallProgressPercent}%)
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleFinishWorkout(setLogs)}
                    disabled={completingWorkout}
                    className="py-2.5 px-4 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 font-semibold text-sm flex items-center gap-2 transition cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>
                      {completingWorkout ? 'Finishing...' : 'Finish Workout'}
                    </span>
                  </button>
                </div>

                <div className="w-full h-2.5 bg-gray-950 rounded-full overflow-hidden border border-gray-800">
                  <motion.div
                    className="h-full bg-emerald-500 rounded-full"
                    initial={false}
                    animate={{ width: `${overallProgressPercent}%` }}
                    transition={{ duration: 0.35 }}
                  />
                </div>
              </div>

              {/* Animated Exercise Card */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={`exercise-${currentExerciseIndex}`}
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -24 }}
                  transition={{ duration: 0.25 }}
                  className="bg-gray-900 border border-gray-800 rounded-2xl p-5 sm:p-7 space-y-6"
                >
                  {/* Exercise Header */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                          {currentExercise.muscle ||
                            currentExercise.targetMuscle ||
                            'Target Muscle'}
                        </span>
                        {currentExercise.difficulty && (
                          <span
                            className={`px-2.5 py-1 rounded-lg border text-xs font-semibold ${getDifficultyBadgeClass(
                              currentExercise.difficulty
                            )}`}
                          >
                            {currentExercise.difficulty}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gray-950 border border-gray-800 text-gray-300 text-xs font-medium">
                          <Timer className="w-3.5 h-3.5 text-emerald-400" />
                          Rest: {currentExercise.rest || '60 sec'}
                        </span>
                      </div>
                      <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                        {currentExercise.name}
                      </h2>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowDemo((prev) => !prev)}
                      className={`py-2.5 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 border transition shrink-0 cursor-pointer ${
                        showDemo
                          ? 'bg-gray-800 border-gray-700 text-white'
                          : 'bg-emerald-500/15 hover:bg-emerald-500/25 border-emerald-500/30 text-emerald-400'
                      }`}
                    >
                      {showDemo ? (
                        <>
                          <X className="w-4 h-4" />
                          <span>Hide Demo</span>
                        </>
                      ) : (
                        <>
                          <Video className="w-4 h-4" />
                          <span>Watch Demo</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* YouTube Demo Video */}
                  <AnimatePresence>
                    {showDemo && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        {currentExercise.video?.url ? (
                          <div className="space-y-2">
                            <div className="aspect-video w-full rounded-xl overflow-hidden bg-gray-950 border border-gray-800">
                              <iframe
                                src={getEmbedUrl(currentExercise.video.url)}
                                title={`${currentExercise.name} form demonstration`}
                                className="w-full h-full"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                              />
                            </div>
                            {currentExercise.video?.channel && (
                              <p className="text-xs text-gray-400 text-right">
                                Video by {currentExercise.video.channel}
                              </p>
                            )}
                          </div>
                        ) : (
                          <div className="p-4 rounded-xl bg-gray-950 border border-gray-800 text-sm text-gray-400 text-center">
                            No demo video available for this exercise.
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Instructions & Common Mistakes */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Array.isArray(currentExercise.instructions) &&
                      currentExercise.instructions.length > 0 && (
                        <div className="bg-gray-950/70 border border-gray-800 rounded-xl p-4 space-y-2.5">
                          <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                            Instructions
                          </h3>
                          <ol className="space-y-2 text-sm text-gray-300">
                            {currentExercise.instructions.map((step, i) => (
                              <li key={i} className="flex items-start gap-2.5">
                                <span className="w-5 h-5 rounded-full bg-emerald-500/15 text-emerald-400 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                                  {i + 1}
                                </span>
                                <span>{step}</span>
                              </li>
                            ))}
                          </ol>
                        </div>
                      )}

                    {Array.isArray(
                      currentExercise.mistakes || currentExercise.commonMistakes
                    ) &&
                      (currentExercise.mistakes || currentExercise.commonMistakes)
                        .length > 0 && (
                        <div className="bg-gray-950/70 border border-gray-800 rounded-xl p-4 space-y-2.5">
                          <h3 className="text-xs font-bold uppercase tracking-wider text-rose-400">
                            Common Mistakes
                          </h3>
                          <ul className="space-y-2 text-sm text-gray-300">
                            {(
                              currentExercise.mistakes ||
                              currentExercise.commonMistakes
                            ).map((mistake, i) => (
                              <li key={i} className="flex items-start gap-2.5">
                                <X className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                                <span>{mistake}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                  </div>

                  {/* Set Tracker Table */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-gray-300">
                      Set Tracker
                    </h3>
                    <div className="overflow-x-auto rounded-xl border border-gray-800 bg-gray-950/60">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-gray-800 text-xs uppercase tracking-wider text-gray-400">
                            <th className="py-3 px-3 sm:px-4">Set</th>
                            <th className="py-3 px-3 sm:px-4">Target</th>
                            <th className="py-3 px-3 sm:px-4">Actual Reps</th>
                            <th className="py-3 px-3 sm:px-4">Weight (kg)</th>
                            <th className="py-3 px-3 sm:px-4 text-right">Done</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800/80">
                          {(setLogs[currentExerciseIndex] || []).map(
                            (setItem, setIdx) => {
                              const isSaving =
                                savingSetKey === `${currentExerciseIndex}-${setIdx}`;
                              const isDone = setItem.completed;
                              const isSkipped = setItem.skipped;

                              return (
                                <tr
                                  key={setItem.setNumber}
                                  className={
                                    isDone
                                      ? 'bg-emerald-500/10'
                                      : isSkipped
                                      ? 'bg-gray-900/50 opacity-60'
                                      : ''
                                  }
                                >
                                  <td className="py-3 px-3 sm:px-4 font-bold text-white">
                                    #{setItem.setNumber}
                                  </td>
                                  <td className="py-3 px-3 sm:px-4 text-sm text-gray-400 whitespace-nowrap">
                                    {setItem.targetReps}
                                  </td>
                                  <td className="py-2.5 px-3 sm:px-4">
                                    <input
                                      type="number"
                                      min="0"
                                      inputMode="numeric"
                                      disabled={isDone || isSkipped}
                                      value={setItem.reps}
                                      placeholder={
                                        parseDefaultReps(setItem.targetReps) || '10'
                                      }
                                      onChange={(e) =>
                                        handleSetInputChange(
                                          currentExerciseIndex,
                                          setIdx,
                                          'reps',
                                          e.target.value
                                        )
                                      }
                                      className="w-20 sm:w-24 min-h-[44px] px-3 py-2 rounded-lg bg-gray-900 border border-gray-700 focus:border-emerald-500 focus:outline-none text-white text-sm disabled:opacity-50"
                                    />
                                  </td>
                                  <td className="py-2.5 px-3 sm:px-4">
                                    <input
                                      type="number"
                                      min="0"
                                      step="0.5"
                                      inputMode="decimal"
                                      disabled={isDone || isSkipped}
                                      value={setItem.weight}
                                      placeholder="0"
                                      onChange={(e) =>
                                        handleSetInputChange(
                                          currentExerciseIndex,
                                          setIdx,
                                          'weight',
                                          e.target.value
                                        )
                                      }
                                      className="w-20 sm:w-24 min-h-[44px] px-3 py-2 rounded-lg bg-gray-900 border border-gray-700 focus:border-emerald-500 focus:outline-none text-white text-sm disabled:opacity-50"
                                    />
                                  </td>
                                  <td className="py-2.5 px-3 sm:px-4 text-right">
                                    <button
                                      type="button"
                                      disabled={isDone || isSkipped || isSaving}
                                      onClick={() =>
                                        handleCompleteSet(
                                          currentExerciseIndex,
                                          setIdx
                                        )
                                      }
                                      className={`min-h-[44px] min-w-[44px] px-3.5 py-2 rounded-xl font-semibold text-sm inline-flex items-center justify-center gap-1.5 transition cursor-pointer ${
                                        isDone
                                          ? 'bg-emerald-500 text-gray-950'
                                          : isSkipped
                                          ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                                          : 'bg-gray-800 hover:bg-emerald-500 hover:text-gray-950 text-emerald-400 border border-emerald-500/30'
                                      }`}
                                      aria-label={`Complete set ${setItem.setNumber}`}
                                    >
                                      <Check className="w-4 h-4" />
                                      <span className="hidden sm:inline">
                                        {isDone
                                          ? 'Done'
                                          : isSaving
                                          ? '...'
                                          : isSkipped
                                          ? 'Skipped'
                                          : 'Complete'}
                                      </span>
                                    </button>
                                  </td>
                                </tr>
                              );
                            }
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Navigation Actions */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <button
                      type="button"
                      onClick={handleSkipExercise}
                      disabled={skippingExercise}
                      className="flex-1 py-3.5 px-5 rounded-xl bg-gray-800 hover:bg-gray-700 disabled:opacity-60 text-gray-200 font-semibold flex items-center justify-center gap-2 transition cursor-pointer"
                    >
                      <SkipForward className="w-5 h-5" />
                      <span>
                        {skippingExercise ? 'Skipping...' : 'Skip Exercise'}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={handleNextExercise}
                      disabled={completingWorkout}
                      className="flex-1 py-3.5 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 text-gray-950 font-bold flex items-center justify-center gap-2 transition cursor-pointer"
                    >
                      <span>
                        {currentExerciseIndex < exercises.length - 1
                          ? 'Next Exercise'
                          : 'Finish Workout'}
                      </span>
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </motion.div>
              </AnimatePresence>
            </motion.div>
          )}

          {workoutState === 'resting' && (
            <motion.div
              key="resting"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.25 }}
              className="bg-gray-900 border border-gray-800 rounded-2xl p-6 sm:p-10 text-center space-y-8"
            >
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
                  <Timer className="w-3.5 h-3.5" />
                  <span>Rest Period</span>
                </div>
                <h2 className="text-2xl font-bold text-white">Catch Your Breath</h2>
              </div>

              {/* Circular SVG Progress Ring */}
              <div className="relative w-56 h-56 mx-auto flex items-center justify-center">
                <svg className="w-56 h-56 -rotate-90" viewBox="0 0 200 200">
                  <circle
                    cx="100"
                    cy="100"
                    r={circleRadius}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="12"
                    className="text-gray-800"
                  />
                  <motion.circle
                    cx="100"
                    cy="100"
                    r={circleRadius}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="12"
                    strokeLinecap="round"
                    className="text-emerald-500"
                    strokeDasharray={circleCircumference}
                    animate={{ strokeDashoffset }}
                    transition={{ duration: 0.4, ease: 'linear' }}
                  />
                </svg>

                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-5xl font-extrabold tracking-tight text-white tabular-nums">
                    {formatSeconds(restRemaining)}
                  </span>
                  <span className="text-xs text-gray-400 uppercase tracking-wider mt-1">
                    {isRestPaused ? 'Paused' : 'Remaining'}
                  </span>
                </div>
              </div>

              {upNextExercise && (
                <div className="max-w-md mx-auto bg-gray-950/70 border border-gray-800 rounded-xl p-4">
                  <p className="text-xs uppercase tracking-wider text-gray-400">
                    Up Next
                  </p>
                  <p className="text-base font-bold text-white mt-0.5">
                    {upNextExercise.name}
                  </p>
                  <p className="text-xs text-emerald-400 mt-0.5">
                    {upNextExercise.muscle || upNextExercise.targetMuscle}
                  </p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                <button
                  type="button"
                  onClick={() => setIsRestPaused((prev) => !prev)}
                  className="flex-1 py-3.5 px-5 rounded-xl bg-gray-800 hover:bg-gray-700 text-white font-semibold flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  {isRestPaused ? (
                    <>
                      <Play className="w-5 h-5" />
                      <span>Resume</span>
                    </>
                  ) : (
                    <>
                      <Pause className="w-5 h-5" />
                      <span>Pause</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleSkipRestTimer}
                  className="flex-1 py-3.5 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-bold flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <SkipForward className="w-5 h-5" />
                  <span>Skip Timer</span>
                </button>
              </div>
            </motion.div>
          )}

          {workoutState === 'completed' && summaryData && (
            <motion.div
              key="completed"
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 220, damping: 20 }}
              className="bg-gray-900 border border-gray-800 rounded-2xl p-6 sm:p-10 text-center space-y-8"
            >
              <motion.div
                initial={{ scale: 0, rotate: -15 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{
                  type: 'spring',
                  stiffness: 260,
                  damping: 16,
                  delay: 0.1,
                }}
                className="w-20 h-20 rounded-3xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20"
              >
                <Trophy className="w-10 h-10" />
              </motion.div>

              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">
                  Session Complete
                </span>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-white">
                  Crushed It
                  {user?.full_name
                    ? `, ${user.full_name.split(' ')[0]}!`
                    : '!'}
                </h1>
                <p className="text-gray-400 max-w-md mx-auto">
                  Great work finishing{' '}
                  <span className="text-gray-200 font-medium">
                    {todayWorkout.focus ||
                      todayWorkout.workoutName ||
                      "today's workout"}
                  </span>
                  . Consistency builds strength!
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                <div className="bg-gray-950 border border-gray-800 rounded-2xl p-4 space-y-1">
                  <Dumbbell className="w-5 h-5 text-emerald-400 mx-auto" />
                  <p className="text-2xl font-extrabold text-white">
                    {summaryData.exercisesCompleted}/{summaryData.totalExercises}
                  </p>
                  <p className="text-xs text-gray-400">Exercises Done</p>
                </div>

                <div className="bg-gray-950 border border-gray-800 rounded-2xl p-4 space-y-1">
                  <Check className="w-5 h-5 text-emerald-400 mx-auto" />
                  <p className="text-2xl font-extrabold text-white">
                    {summaryData.setsCompleted}/{summaryData.totalSets}
                  </p>
                  <p className="text-xs text-gray-400">Sets Completed</p>
                </div>

                <div className="bg-gray-950 border border-gray-800 rounded-2xl p-4 space-y-1">
                  <Clock className="w-5 h-5 text-emerald-400 mx-auto" />
                  <p className="text-2xl font-extrabold text-white">
                    {summaryData.durationFormatted}
                  </p>
                  <p className="text-xs text-gray-400">
                    Duration ({summaryData.durationMinutes}m)
                  </p>
                </div>

                <div className="bg-gray-950 border border-gray-800 rounded-2xl p-4 space-y-1">
                  <Trophy className="w-5 h-5 text-emerald-400 mx-auto" />
                  <p className="text-2xl font-extrabold text-emerald-400">
                    {summaryData.completionPercentage}%
                  </p>
                  <p className="text-xs text-gray-400">Completion</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="w-full sm:w-auto min-w-[240px] py-4 px-8 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-extrabold text-base inline-flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition cursor-pointer"
              >
                <span>Back to Dashboard</span>
                <ChevronRight className="w-5 h-5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

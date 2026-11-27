import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dumbbell,
  Clock,
  RotateCcw,
  Play,
  ChevronDown,
  ChevronUp,
  Eye,
  AlertTriangle,
  Flame,
  Coffee,
} from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../AuthContext';

const DIFFICULTY_STYLES = {
  beginner: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  intermediate: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  advanced: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
};

function getDifficultyStyle(difficulty) {
  const key = (difficulty || 'beginner').toLowerCase();
  return DIFFICULTY_STYLES[key] || DIFFICULTY_STYLES.beginner;
}

function getDefaultDayIndex(schedule) {
  if (!Array.isArray(schedule) || schedule.length === 0) return 0;
  const todayName = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  const matchIndex = schedule.findIndex(
    (d) => d.day && d.day.toLowerCase() === todayName
  );
  return matchIndex >= 0 ? matchIndex : 0;
}

function SectionAccordion({ title, subtitle, duration, items, icon: Icon, accentClass, isOpen, onToggle }) {
  if (!items || items.length === 0) return null;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-gray-800/60 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className={`p-2 rounded-lg ${accentClass}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-semibold text-white">{title}</h3>
              {duration && (
                <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full bg-gray-800 text-gray-300 border border-gray-700">
                  <Clock className="w-3 h-3 text-emerald-400" />
                  {duration}
                </span>
              )}
            </div>
            {subtitle && (
              <p className="text-xs sm:text-sm text-gray-400 mt-0.5 truncate">{subtitle}</p>
            )}
          </div>
        </div>
        <span className="text-gray-400 ml-3 shrink-0">
          {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </span>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-4 pt-1 border-t border-gray-800/80">
              <ul className="space-y-2 mt-2">
                {items.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-sm text-gray-300">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ExerciseCard({ exercise, index }) {
  const [showDemo, setShowDemo] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [showMistakes, setShowMistakes] = useState(false);

  const hasVideo = Boolean(exercise.video?.url);
  const instructions = Array.isArray(exercise.instructions) ? exercise.instructions : [];
  const mistakes = Array.isArray(exercise.mistakes) ? exercise.mistakes : [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.05 }}
      className="bg-gray-900 border border-gray-800 hover:border-emerald-500/40 rounded-xl p-5 transition-all duration-200 hover:shadow-lg hover:shadow-emerald-950/30"
    >
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="space-y-2">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/15 text-emerald-400 text-xs font-bold border border-emerald-500/30">
              {index + 1}
            </span>
            <h3 className="text-lg font-semibold text-white">{exercise.name}</h3>
            {exercise.muscle && (
              <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
                {exercise.muscle}
              </span>
            )}
            {exercise.difficulty && (
              <span
                className={`text-xs font-medium px-2.5 py-0.5 rounded-full border capitalize ${getDifficultyStyle(
                  exercise.difficulty
                )}`}
              >
                {exercise.difficulty}
              </span>
            )}
          </div>

          {exercise.description && (
            <p className="text-sm text-gray-400 leading-relaxed">{exercise.description}</p>
          )}
        </div>

        {hasVideo && (
          <button
            type="button"
            onClick={() => setShowDemo((prev) => !prev)}
            className={`inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors shrink-0 cursor-pointer ${
              showDemo
                ? 'bg-emerald-500 text-gray-950 hover:bg-emerald-400'
                : 'bg-gray-800 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/15'
            }`}
          >
            {showDemo ? (
              <>
                <Eye className="w-4 h-4" />
                Hide Demo
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Watch Demo
              </>
            )}
          </button>
        )}
      </div>

      <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-gray-950/70 border border-gray-800/80 rounded-lg px-3.5 py-2.5">
          <span className="text-xs text-gray-400 block">Sets × Reps</span>
          <span className="text-sm font-semibold text-white mt-0.5 flex items-center gap-1.5">
            <Dumbbell className="w-3.5 h-3.5 text-emerald-400" />
            {exercise.sets} × {exercise.reps}
          </span>
        </div>

        <div className="bg-gray-950/70 border border-gray-800/80 rounded-lg px-3.5 py-2.5">
          <span className="text-xs text-gray-400 block">Rest Time</span>
          <span className="text-sm font-semibold text-white mt-0.5 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-emerald-400" />
            {exercise.rest || '60 sec'}
          </span>
        </div>

        {exercise.video?.channel && (
          <div className="col-span-2 sm:col-span-1 bg-gray-950/70 border border-gray-800/80 rounded-lg px-3.5 py-2.5">
            <span className="text-xs text-gray-400 block">Demo Source</span>
            <span className="text-sm font-medium text-gray-200 mt-0.5 block truncate">
              {exercise.video.channel}
            </span>
          </div>
        )}
      </div>

      <AnimatePresence initial={false}>
        {showDemo && hasVideo && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="mt-4 aspect-video w-full rounded-xl overflow-hidden border border-gray-800 bg-gray-950">
              <iframe
                src={exercise.video.url}
                title={`${exercise.name} demo video`}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {(instructions.length > 0 || mistakes.length > 0) && (
        <div className="mt-4 pt-4 border-t border-gray-800/80 space-y-2.5">
          {instructions.length > 0 && (
            <div className="rounded-lg bg-gray-950/60 border border-gray-800/80 overflow-hidden">
              <button
                type="button"
                onClick={() => setShowInstructions((prev) => !prev)}
                className="w-full px-3.5 py-2.5 flex items-center justify-between text-left text-sm font-medium text-gray-200 hover:bg-gray-800/50 transition-colors cursor-pointer"
              >
                <span>Form Instructions ({instructions.length} steps)</span>
                {showInstructions ? (
                  <ChevronUp className="w-4 h-4 text-emerald-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                )}
              </button>

              <AnimatePresence initial={false}>
                {showInstructions && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <ol className="px-3.5 pb-3 pt-1 space-y-1.5 border-t border-gray-800/70">
                      {instructions.map((step, i) => (
                        <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                          <span className="text-emerald-400 font-semibold text-xs mt-0.5 shrink-0">
                            {i + 1}.
                          </span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ol>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {mistakes.length > 0 && (
            <div className="rounded-lg bg-gray-950/60 border border-gray-800/80 overflow-hidden">
              <button
                type="button"
                onClick={() => setShowMistakes((prev) => !prev)}
                className="w-full px-3.5 py-2.5 flex items-center justify-between text-left text-sm font-medium text-amber-300 hover:bg-gray-800/50 transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  Common Mistakes to Avoid ({mistakes.length})
                </span>
                {showMistakes ? (
                  <ChevronUp className="w-4 h-4 text-amber-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                )}
              </button>

              <AnimatePresence initial={false}>
                {showMistakes && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <ul className="px-3.5 pb-3 pt-1 space-y-1.5 border-t border-gray-800/70">
                      {mistakes.map((mistake, i) => (
                        <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                          <span>{mistake}</span>
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}

export default function WorkoutPlan() {
  const { user } = useAuth();
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [warmUpOpen, setWarmUpOpen] = useState(false);
  const [coolDownOpen, setCoolDownOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function fetchPlan() {
      try {
        setLoading(true);
        setError('');
        const data = await api.getActivePlan();
        if (!isMounted) return;
        const activePlan = data?.plan || null;
        setPlan(activePlan);
        if (activePlan?.schedule) {
          setSelectedDayIndex(getDefaultDayIndex(activePlan.schedule));
        }
      } catch (err) {
        if (!isMounted) return;
        setError(err.message || 'Failed to load workout plan');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchPlan();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleGeneratePlan = async () => {
    try {
      setGenerating(true);
      setError('');
      const data = await api.generatePlan();
      const newPlan = data?.plan || null;
      setPlan(newPlan);
      setWarmUpOpen(false);
      setCoolDownOpen(false);
      if (newPlan?.schedule) {
        setSelectedDayIndex(getDefaultDayIndex(newPlan.schedule));
      } else {
        setSelectedDayIndex(0);
      }
    } catch (err) {
      setError(err.message || 'Failed to generate workout plan');
    } finally {
      setGenerating(false);
    }
  };

  const handleSelectDay = (idx) => {
    setSelectedDayIndex(idx);
    setWarmUpOpen(false);
    setCoolDownOpen(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-6">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500" />
        <p className="mt-4 text-sm text-gray-400">Loading your workout plan...</p>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="min-h-screen bg-gray-950 text-white p-4 sm:p-8 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-lg w-full bg-gray-900 border border-gray-800 rounded-2xl p-8 text-center shadow-xl"
        >
          <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-5">
            <Dumbbell className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold text-white">No Active Workout Plan</h1>
          <p className="text-gray-400 text-sm mt-2 leading-relaxed">
            {user?.full_name ? `${user.full_name}, let` : 'Let'} FitCoach AI craft a personalized weekly training schedule tailored to your goals, experience level, and equipment.
          </p>

          {error && (
            <div className="mt-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-start gap-2.5 text-left">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="button"
            onClick={handleGeneratePlan}
            disabled={generating}
            className="mt-6 w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 disabled:cursor-not-allowed text-gray-950 font-semibold transition-colors cursor-pointer"
          >
            {generating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-950 border-t-transparent" />
                Generating Plan...
              </>
            ) : (
              <>
                <Flame className="w-5 h-5" />
                Generate Plan
              </>
            )}
          </button>
        </motion.div>
      </div>
    );
  }

  const schedule = Array.isArray(plan.schedule) ? plan.schedule : [];
  const safeIndex = selectedDayIndex < schedule.length ? selectedDayIndex : 0;
  const selectedDay = schedule[safeIndex];
  const safetyNotes = Array.isArray(plan.safetyNotes) ? plan.safetyNotes : [];

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6"
      >
        {/* Header */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
                <Dumbbell className="w-4 h-4" />
                <span>Weekly Workout Plan</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">
                {plan.planName || 'Your Personalized Workout Plan'}
              </h1>
              {user?.full_name && (
                <p className="text-sm text-gray-400">Designed for {user.full_name}</p>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {plan.level && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-semibold capitalize">
                  <Flame className="w-3.5 h-3.5" />
                  {plan.level}
                </span>
              )}
              {plan.goal && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-800 border border-gray-700 text-gray-200 text-xs font-medium capitalize">
                  Goal: {plan.goal}
                </span>
              )}
              {plan.daysPerWeek && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-800 border border-gray-700 text-gray-200 text-xs font-medium">
                  {plan.daysPerWeek} Days / Week
                </span>
              )}
              {plan.location && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-800 border border-gray-700 text-gray-200 text-xs font-medium capitalize">
                  {plan.location}
                </span>
              )}
            </div>
          </div>

          {error && (
            <div className="mt-4 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Day Selector Tabs */}
        {schedule.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
            {schedule.map((dayItem, idx) => {
              const isSelected = idx === safeIndex;
              const isRest = Boolean(dayItem.isRestDay);
              return (
                <button
                  key={`${dayItem.day}-${idx}`}
                  type="button"
                  onClick={() => handleSelectDay(idx)}
                  className={`px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all flex items-center gap-2 border cursor-pointer shrink-0 ${
                    isSelected
                      ? 'bg-emerald-500 text-gray-950 border-emerald-400 shadow-md shadow-emerald-500/20 font-semibold'
                      : isRest
                        ? 'bg-gray-900/70 text-gray-400 border-gray-800 hover:border-gray-700 hover:text-gray-200'
                        : 'bg-gray-900 text-gray-300 border-gray-800 hover:border-emerald-500/40 hover:text-white'
                  }`}
                >
                  {isRest ? (
                    <Coffee className="w-4 h-4 shrink-0" />
                  ) : (
                    <Dumbbell className="w-4 h-4 shrink-0" />
                  )}
                  <span>{dayItem.day}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Selected Day Content */}
        {selectedDay && (
          <AnimatePresence mode="wait">
            <motion.div
              key={`${selectedDay.day}-${safeIndex}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="space-y-5"
            >
              {/* Day Title Banner */}
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white">
                    {selectedDay.day} - {selectedDay.focus || (selectedDay.isRestDay ? 'Rest & Recovery' : 'Training')}
                  </h2>
                  <p className="text-sm text-gray-400 mt-1">
                    {selectedDay.isRestDay
                      ? 'Active recovery day to let your muscles rebuild and grow stronger.'
                      : `${selectedDay.exercises?.length || 0} exercises planned for this session`}
                  </p>
                </div>

                {!selectedDay.isRestDay && selectedDay.estimatedDuration && (
                  <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-sm font-medium self-start sm:self-auto">
                    <Clock className="w-4 h-4" />
                    <span>Est. {selectedDay.estimatedDuration}</span>
                  </div>
                )}

                {selectedDay.isRestDay && (
                  <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-sky-500/10 border border-sky-500/25 text-sky-400 text-sm font-medium self-start sm:self-auto">
                    <Coffee className="w-4 h-4" />
                    <span>Rest Day</span>
                  </div>
                )}
              </div>

              {selectedDay.isRestDay ? (
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 sm:p-8">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-sky-500/15 text-sky-400 border border-sky-500/25 shrink-0">
                      <Coffee className="w-6 h-6" />
                    </div>
                    <div className="space-y-3 flex-1">
                      <h3 className="text-lg font-semibold text-white">
                        Recommended Recovery Activities
                      </h3>
                      <p className="text-sm text-gray-400">
                        Recovery is when adaptation happens. Keep movement light and restorative today.
                      </p>
                      <ul className="grid sm:grid-cols-2 gap-3 pt-2">
                        {(selectedDay.activities && selectedDay.activities.length > 0
                          ? selectedDay.activities
                          : [
                              'Light walking (20-30 minutes)',
                              'Gentle stretching or mobility work',
                              'Foam rolling tight muscles',
                              'Hydration & quality sleep',
                            ]
                        ).map((activity, idx) => (
                          <li
                            key={idx}
                            className="flex items-center gap-2.5 bg-gray-950/70 border border-gray-800/80 rounded-lg px-4 py-3 text-sm text-gray-200"
                          >
                            <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                            <span>{activity}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {/* Warm-up */}
                  {selectedDay.warmUp && (
                    <SectionAccordion
                      title={selectedDay.warmUp.name || 'Warm Up'}
                      subtitle={selectedDay.warmUp.description}
                      duration={selectedDay.warmUp.duration}
                      items={selectedDay.warmUp.exercises}
                      icon={Flame}
                      accentClass="bg-amber-500/15 text-amber-400 border border-amber-500/25"
                      isOpen={warmUpOpen}
                      onToggle={() => setWarmUpOpen((prev) => !prev)}
                    />
                  )}

                  {/* Exercises */}
                  <div className="space-y-4">
                    {(selectedDay.exercises || []).map((exercise, idx) => (
                      <ExerciseCard
                        key={`${exercise.name}-${idx}`}
                        exercise={exercise}
                        index={idx}
                      />
                    ))}
                  </div>

                  {/* Cool-down */}
                  {selectedDay.coolDown && (
                    <SectionAccordion
                      title={selectedDay.coolDown.name || 'Cool Down'}
                      subtitle={selectedDay.coolDown.description}
                      duration={selectedDay.coolDown.duration}
                      items={selectedDay.coolDown.exercises}
                      icon={Coffee}
                      accentClass="bg-sky-500/15 text-sky-400 border border-sky-500/25"
                      isOpen={coolDownOpen}
                      onToggle={() => setCoolDownOpen((prev) => !prev)}
                    />
                  )}
                </>
              )}
            </motion.div>
          </AnimatePresence>
        )}

        {/* Safety Notes */}
        {safetyNotes.length > 0 && (
          <div className="bg-gray-900 border border-amber-500/25 rounded-2xl p-5 sm:p-6">
            <div className="flex items-center gap-2.5 mb-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
              <h3 className="text-base sm:text-lg font-semibold text-white">Safety Notes</h3>
            </div>
            <ul className="grid sm:grid-cols-2 gap-2.5">
              {safetyNotes.map((note, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-sm text-gray-300">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                  <span>{note}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Regenerate Plan */}
        <div className="flex justify-center pt-2 pb-6">
          <button
            type="button"
            onClick={handleGeneratePlan}
            disabled={generating}
            className="inline-flex items-center justify-center gap-2.5 px-6 py-3 rounded-xl bg-gray-900 hover:bg-gray-800 border border-emerald-500/40 hover:border-emerald-400 text-emerald-400 font-semibold transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          >
            {generating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-emerald-400 border-t-transparent" />
                Regenerating Plan...
              </>
            ) : (
              <>
                <RotateCcw className="w-4 h-4" />
                Regenerate Plan
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

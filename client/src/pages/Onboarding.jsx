import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  HeartPulse,
  Award,
  Sliders,
  Target,
  ChevronLeft,
  ChevronRight,
  Check,
  AlertTriangle,
  Info,
  Loader2,
  Home,
  Dumbbell,
  Building2,
  Sprout,
  Flame,
  Trophy,
  Clock,
  Calendar,
  Sparkles,
  Activity,
} from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../AuthContext';

const STEPS = [
  { id: 1, title: 'Personal Info', subtitle: 'Tell us about yourself', icon: User },
  { id: 2, title: 'Health', subtitle: 'Safety & medical history', icon: HeartPulse },
  { id: 3, title: 'Experience', subtitle: 'Your training background', icon: Award },
  { id: 4, title: 'Preferences', subtitle: 'Schedule & equipment', icon: Sliders },
  { id: 5, title: 'Goals', subtitle: 'What you want to achieve', icon: Target },
];

const GENDER_OPTIONS = ['Male', 'Female', 'Other', 'Prefer not to say'];

const EXPERIENCE_LEVELS = [
  {
    value: 'Beginner',
    label: 'Beginner',
    description: 'New to structured workouts or getting back after a long break.',
    icon: Sprout,
  },
  {
    value: 'Intermediate',
    label: 'Intermediate',
    description: 'Consistent training experience and comfortable with core lifts.',
    icon: Flame,
  },
  {
    value: 'Advanced',
    label: 'Advanced',
    description: 'Years of structured training, strong form, and high work capacity.',
    icon: Trophy,
  },
];

const EXERCISE_DURATIONS = [
  'Less than 3 months',
  '3-6 months',
  '6-12 months',
  '1-2 years',
  'More than 2 years',
];

const WORKOUT_LOCATIONS = [
  {
    value: 'Home (no equipment)',
    label: 'Home (no equipment)',
    description: 'Bodyweight-focused routines you can do anywhere.',
    icon: Home,
  },
  {
    value: 'Home (basic equipment)',
    label: 'Home (basic equipment)',
    description: 'Home training with dumbbells, bands, or a bench.',
    icon: Dumbbell,
  },
  {
    value: 'Gym',
    label: 'Gym',
    description: 'Full access to commercial gym machines, cables, and free weights.',
    icon: Building2,
  },
];

const DAYS_OPTIONS = [2, 3, 4, 5, 6, 7];

const WORKOUT_DURATIONS = ['15-30 min', '30-45 min', '45-60 min', '60-90 min'];

const EQUIPMENT_LIST = [
  'Dumbbells',
  'Resistance Bands',
  'Barbell',
  'Bench',
  'Pull-up Bar',
  'Kettlebell',
  'Cable Machine',
  'Machines',
];

const GOALS_LIST = [
  { value: 'Fat Loss', label: 'Fat Loss', emoji: '🔥', desc: 'Burn fat while preserving lean muscle' },
  { value: 'Muscle Gain', label: 'Muscle Gain', emoji: '💪', desc: 'Maximize hypertrophy and lean mass' },
  { value: 'Body Recomposition', label: 'Body Recomposition', emoji: '⚖️', desc: 'Lose fat and build muscle simultaneously' },
  { value: 'Six-Pack Abs', label: 'Six-Pack Abs', emoji: '🎯', desc: 'Core definition and lower body fat' },
  { value: 'Strength Building', label: 'Strength Building', emoji: '🏋️', desc: 'Increase maximal power and compound lifts' },
  { value: 'General Fitness', label: 'General Fitness', emoji: '⚡', desc: 'Improve energy, stamina, and overall health' },
  { value: 'Weight Gain', label: 'Weight Gain', emoji: '📈', desc: 'Healthy caloric surplus and mass building' },
  { value: 'Weight Maintenance', label: 'Weight Maintenance', emoji: '🛡️', desc: 'Sustain your current physique and fitness' },
];

const TIMELINE_OPTIONS = ['1 month', '3 months', '6 months', '1 year'];

function getBmiCategory(bmi) {
  if (bmi < 18.5) {
    return {
      label: 'Underweight',
      textClass: 'text-sky-400',
      badgeClass: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
      barClass: 'bg-sky-400',
    };
  }
  if (bmi < 25) {
    return {
      label: 'Normal Weight',
      textClass: 'text-emerald-400',
      badgeClass: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
      barClass: 'bg-emerald-400',
    };
  }
  if (bmi < 30) {
    return {
      label: 'Overweight',
      textClass: 'text-amber-400',
      badgeClass: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
      barClass: 'bg-amber-400',
    };
  }
  return {
    label: 'Obese',
    textClass: 'text-rose-400',
    badgeClass: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
    barClass: 'bg-rose-400',
  };
}

const stepVariants = {
  enter: (direction) => ({
    x: direction > 0 ? 40 : -40,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction) => ({
    x: direction > 0 ? -40 : 40,
    opacity: 0,
  }),
};

export default function Onboarding() {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();

  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [initialLoading, setInitialLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  // Step 1: Personal Information
  const [fullName, setFullName] = useState(null);
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [currentWeightKg, setCurrentWeightKg] = useState('');
  const [targetWeightKg, setTargetWeightKg] = useState('');

  const resolvedFullName = fullName ?? user?.full_name ?? '';

  // Step 2: Health Assessment
  const [medicalConditions, setMedicalConditions] = useState('');
  const [injuries, setInjuries] = useState('');
  const [jointPain, setJointPain] = useState('');
  const [exercisesToAvoid, setExercisesToAvoid] = useState('');
  const [physicallyActive, setPhysicallyActive] = useState(false);
  const [additionalInfo, setAdditionalInfo] = useState('');

  // Step 3: Fitness Experience
  const [fitnessExperience, setFitnessExperience] = useState('');
  const [exerciseDuration, setExerciseDuration] = useState('');

  // Step 4: Workout Preferences
  const [workoutLocation, setWorkoutLocation] = useState('');
  const [workoutDaysPerWeek, setWorkoutDaysPerWeek] = useState(null);
  const [workoutDuration, setWorkoutDuration] = useState('');
  const [availableEquipment, setAvailableEquipment] = useState([]);

  // Step 5: Goal Selection
  const [primaryGoal, setPrimaryGoal] = useState('');
  const [secondaryGoal, setSecondaryGoal] = useState('');
  const [targetTimeline, setTargetTimeline] = useState('');

  useEffect(() => {
    let active = true;
    api
      .getOnboardingData()
      .then((data) => {
        if (!active || !data) return;
        const { profile, health, goals } = data;
        if (profile) {
          if (profile.age) setAge(String(profile.age));
          if (profile.gender) setGender(profile.gender);
          if (profile.height_cm) setHeightCm(String(profile.height_cm));
          if (profile.current_weight_kg) setCurrentWeightKg(String(profile.current_weight_kg));
          if (profile.target_weight_kg) setTargetWeightKg(String(profile.target_weight_kg));
          if (profile.fitness_experience) setFitnessExperience(profile.fitness_experience);
          if (profile.exercise_duration) setExerciseDuration(profile.exercise_duration);
          if (profile.workout_location) setWorkoutLocation(profile.workout_location);
          if (profile.workout_days_per_week) setWorkoutDaysPerWeek(Number(profile.workout_days_per_week));
          if (profile.workout_duration) setWorkoutDuration(profile.workout_duration);
          if (profile.available_equipment) {
            try {
              const parsed =
                typeof profile.available_equipment === 'string'
                  ? JSON.parse(profile.available_equipment)
                  : profile.available_equipment;
              if (Array.isArray(parsed)) setAvailableEquipment(parsed);
            } catch {
              // ignore malformed equipment JSON
            }
          }
        }
        if (health) {
          setMedicalConditions(health.medical_conditions || '');
          setInjuries(health.injuries || '');
          setJointPain(health.joint_pain || '');
          setExercisesToAvoid(health.exercises_to_avoid || '');
          setPhysicallyActive(Boolean(health.physically_active));
          setAdditionalInfo(health.additional_info || '');
        }
        if (goals) {
          if (goals.primary_goal) setPrimaryGoal(goals.primary_goal);
          if (goals.secondary_goal) setSecondaryGoal(goals.secondary_goal);
          if (goals.target_timeline) setTargetTimeline(goals.target_timeline);
        }
      })
      .catch(() => {
        // Fresh user without onboarding data yet
      })
      .finally(() => {
        if (active) setInitialLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const bmiData = useMemo(() => {
    const h = parseFloat(heightCm);
    const w = parseFloat(currentWeightKg);
    if (!h || !w || h < 50 || w < 20) return null;
    const heightM = h / 100;
    const value = Math.round((w / (heightM * heightM)) * 10) / 10;
    if (!Number.isFinite(value) || value <= 0) return null;
    const category = getBmiCategory(value);
    const progressPercent = Math.min(100, Math.max(5, ((value - 12) / 28) * 100));
    return { value, category, progressPercent };
  }, [heightCm, currentWeightKg]);

  const toggleEquipment = (item) => {
    setAvailableEquipment((prev) =>
      prev.includes(item) ? prev.filter((eq) => eq !== item) : [...prev, item]
    );
  };

  const validateCurrentStep = () => {
    const errors = {};

    if (step === 1) {
      if (!resolvedFullName.trim()) errors.fullName = 'Full name is required.';
      const parsedAge = Number(age);
      if (!age || Number.isNaN(parsedAge) || parsedAge < 13 || parsedAge > 120) {
        errors.age = 'Please enter a valid age between 13 and 120.';
      }
      const parsedHeight = Number(heightCm);
      if (!heightCm || Number.isNaN(parsedHeight) || parsedHeight < 50 || parsedHeight > 260) {
        errors.heightCm = 'Please enter a valid height (50–260 cm).';
      }
      const parsedWeight = Number(currentWeightKg);
      if (!currentWeightKg || Number.isNaN(parsedWeight) || parsedWeight < 20 || parsedWeight > 350) {
        errors.currentWeightKg = 'Please enter a valid current weight (20–350 kg).';
      }
      const parsedTarget = Number(targetWeightKg);
      if (!targetWeightKg || Number.isNaN(parsedTarget) || parsedTarget < 20 || parsedTarget > 350) {
        errors.targetWeightKg = 'Please enter a valid target weight (20–350 kg).';
      }
    } else if (step === 3) {
      if (!fitnessExperience) errors.fitnessExperience = 'Please select your experience level.';
      if (!exerciseDuration) errors.exerciseDuration = 'Please select how long you have been exercising.';
    } else if (step === 4) {
      if (!workoutLocation) errors.workoutLocation = 'Please choose a workout location.';
      if (!workoutDaysPerWeek) errors.workoutDaysPerWeek = 'Please select workout days per week.';
      if (!workoutDuration) errors.workoutDuration = 'Please select duration per workout.';
    } else if (step === 5) {
      if (!primaryGoal) errors.primaryGoal = 'Please select your primary goal.';
      if (!targetTimeline) errors.targetTimeline = 'Please choose a target timeline.';
    }

    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      setError('Please complete all required fields before continuing.');
      return false;
    }
    setError('');
    return true;
  };

  const handleNext = async () => {
    if (!validateCurrentStep()) return;

    setSubmitting(true);
    setError('');

    try {
      if (step === 1) {
        await api.saveProfile({
          full_name: resolvedFullName.trim(),
          age: Number(age),
          gender: gender || null,
          height_cm: Number(heightCm),
          current_weight_kg: Number(currentWeightKg),
          target_weight_kg: Number(targetWeightKg),
        });
      } else if (step === 2) {
        await api.saveHealth({
          medical_conditions: medicalConditions.trim(),
          injuries: injuries.trim(),
          joint_pain: jointPain.trim(),
          exercises_to_avoid: exercisesToAvoid.trim(),
          physically_active: physicallyActive,
          additional_info: additionalInfo.trim(),
        });
      } else if (step === 3) {
        await api.saveExperience({
          fitness_experience: fitnessExperience,
          exercise_duration: exerciseDuration,
        });
      } else if (step === 4) {
        await api.savePreferences({
          workout_location: workoutLocation,
          workout_days_per_week: Number(workoutDaysPerWeek),
          workout_duration: workoutDuration,
          available_equipment: availableEquipment,
        });
      } else if (step === 5) {
        await api.saveGoals({
          primary_goal: primaryGoal,
          secondary_goal: secondaryGoal && secondaryGoal !== primaryGoal ? secondaryGoal : null,
          target_timeline: targetTimeline,
        });
        await refreshUser();
        navigate('/dashboard');
        return;
      }

      setDirection(1);
      setStep((prev) => Math.min(5, prev + 1));
    } catch (err) {
      setError(err.message || 'Something went wrong while saving. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBack = () => {
    if (step <= 1 || submitting) return;
    setError('');
    setFieldErrors({});
    setDirection(-1);
    setStep((prev) => Math.max(1, prev - 1));
  };

  const currentStepMeta = STEPS[step - 1];
  const StepIcon = currentStepMeta.icon;
  const progressPct = ((step - 1) / (STEPS.length - 1)) * 100;

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center text-gray-200 px-4">
        <Loader2 className="w-10 h-10 text-emerald-500 animate-spin mb-3" />
        <p className="text-sm text-gray-400">Loading your profile...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 py-8 px-4 sm:px-6 lg:px-8 flex flex-col items-center">
      <div className="w-full max-w-3xl">
        {/* Brand Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-white">FitCoach AI</span>
              <p className="text-xs text-gray-400">Personalized Fitness Setup</p>
            </div>
          </div>
          <span className="text-xs font-medium px-3 py-1 rounded-full bg-gray-900 border border-gray-800 text-emerald-400">
            Step {step} of {STEPS.length}
          </span>
        </div>

        {/* Progress Stepper */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 sm:p-5 mb-6 shadow-lg">
          <div className="relative flex items-center justify-between">
            {/* Connector Track */}
            <div className="hidden sm:block absolute left-6 right-6 top-5 h-0.5 bg-gray-800 z-0">
              <motion.div
                className="h-full bg-emerald-500"
                initial={false}
                animate={{ width: `${progressPct}%` }}
                transition={{ duration: 0.35, ease: 'easeInOut' }}
              />
            </div>

            {STEPS.map((s) => {
              const Icon = s.icon;
              const isCompleted = step > s.id;
              const isCurrent = step === s.id;
              return (
                <div key={s.id} className="relative z-10 flex flex-col items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-200 ${
                      isCompleted
                        ? 'bg-emerald-500 border-emerald-500 text-gray-950'
                        : isCurrent
                        ? 'bg-gray-950 border-emerald-400 text-emerald-400 shadow-[0_0_16px_rgba(16,185,129,0.25)]'
                        : 'bg-gray-950 border-gray-700 text-gray-500'
                    }`}
                  >
                    {isCompleted ? <Check className="w-5 h-5 stroke-[2.5]" /> : <Icon className="w-4 h-4" />}
                  </div>
                  <span
                    className={`mt-2 text-[11px] sm:text-xs font-medium text-center leading-tight ${
                      isCurrent ? 'text-emerald-400' : isCompleted ? 'text-gray-200' : 'text-gray-500'
                    }`}
                  >
                    {s.title}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Mobile Progress Bar */}
          <div className="sm:hidden mt-4 h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-emerald-500 rounded-full"
              initial={false}
              animate={{ width: `${(step / STEPS.length) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 sm:p-8 shadow-2xl overflow-hidden">
          {/* Step Header */}
          <div className="flex items-start gap-3.5 pb-6 mb-6 border-b border-gray-800">
            <div className="w-11 h-11 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <StepIcon className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white">{currentStepMeta.title}</h1>
              <p className="text-sm text-gray-400 mt-0.5">{currentStepMeta.subtitle}</p>
            </div>
          </div>

          {/* Error Banner */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="mb-6 flex items-start gap-3 rounded-xl bg-rose-500/10 border border-rose-500/30 p-3.5 text-sm text-rose-300"
              >
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Animated Step Content */}
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25, ease: 'easeInOut' }}
            >
              {/* STEP 1: PERSONAL INFORMATION */}
              {step === 1 && (
                <div className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-300 mb-1.5">
                        Full Name <span className="text-emerald-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={resolvedFullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Enter your full name"
                        className="w-full rounded-xl bg-gray-950 border border-gray-800 px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                      />
                      {fieldErrors.fullName && (
                        <p className="mt-1 text-xs text-rose-400">{fieldErrors.fullName}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1.5">
                        Age <span className="text-emerald-400">*</span>
                      </label>
                      <input
                        type="number"
                        min="13"
                        max="120"
                        value={age}
                        onChange={(e) => setAge(e.target.value)}
                        placeholder="e.g. 28"
                        className="w-full rounded-xl bg-gray-950 border border-gray-800 px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                      />
                      {fieldErrors.age && (
                        <p className="mt-1 text-xs text-rose-400">{fieldErrors.age}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1.5">
                        Gender <span className="text-xs text-gray-500">(Optional)</span>
                      </label>
                      <select
                        value={gender}
                        onChange={(e) => setGender(e.target.value)}
                        className="w-full rounded-xl bg-gray-950 border border-gray-800 px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                      >
                        <option value="">Select gender</option>
                        {GENDER_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1.5">
                        Height (cm) <span className="text-emerald-400">*</span>
                      </label>
                      <input
                        type="number"
                        min="50"
                        max="260"
                        step="0.1"
                        value={heightCm}
                        onChange={(e) => setHeightCm(e.target.value)}
                        placeholder="e.g. 175"
                        className="w-full rounded-xl bg-gray-950 border border-gray-800 px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                      />
                      {fieldErrors.heightCm && (
                        <p className="mt-1 text-xs text-rose-400">{fieldErrors.heightCm}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1.5">
                        Current Weight (kg) <span className="text-emerald-400">*</span>
                      </label>
                      <input
                        type="number"
                        min="20"
                        max="350"
                        step="0.1"
                        value={currentWeightKg}
                        onChange={(e) => setCurrentWeightKg(e.target.value)}
                        placeholder="e.g. 74"
                        className="w-full rounded-xl bg-gray-950 border border-gray-800 px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                      />
                      {fieldErrors.currentWeightKg && (
                        <p className="mt-1 text-xs text-rose-400">{fieldErrors.currentWeightKg}</p>
                      )}
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-300 mb-1.5">
                        Target Weight (kg) <span className="text-emerald-400">*</span>
                      </label>
                      <input
                        type="number"
                        min="20"
                        max="350"
                        step="0.1"
                        value={targetWeightKg}
                        onChange={(e) => setTargetWeightKg(e.target.value)}
                        placeholder="e.g. 70"
                        className="w-full rounded-xl bg-gray-950 border border-gray-800 px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                      />
                      {fieldErrors.targetWeightKg && (
                        <p className="mt-1 text-xs text-rose-400">{fieldErrors.targetWeightKg}</p>
                      )}
                    </div>
                  </div>

                  {/* BMI Display */}
                  {bmiData && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-xl bg-gray-950 border border-gray-800 p-4 space-y-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <span className="text-xs uppercase tracking-wider text-gray-400 font-semibold">
                            Estimated BMI
                          </span>
                          <div className="flex items-baseline gap-2.5 mt-0.5">
                            <span className={`text-2xl font-bold ${bmiData.category.textClass}`}>
                              {bmiData.value}
                            </span>
                            <span className="text-xs text-gray-500">kg/m²</span>
                          </div>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold border ${bmiData.category.badgeClass}`}
                        >
                          {bmiData.category.label}
                        </span>
                      </div>

                      <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${bmiData.category.barClass}`}
                          style={{ width: `${bmiData.progressPercent}%` }}
                        />
                      </div>

                      <div className="flex items-start gap-2 text-xs text-gray-400 pt-1">
                        <Info className="w-4 h-4 text-gray-500 shrink-0 mt-0.5" />
                        <p>
                          BMI is a general screening metric only and does not distinguish between muscle
                          mass and body fat or reflect overall health.
                        </p>
                      </div>
                    </motion.div>
                  )}
                </div>
              )}

              {/* STEP 2: HEALTH ASSESSMENT */}
              {step === 2 && (
                <div className="space-y-5">
                  <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-4 flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <div className="text-xs sm:text-sm text-amber-200/90 leading-relaxed">
                      <span className="font-semibold text-amber-300">Health Advisory: </span>
                      Please consult a qualified healthcare professional or physician before starting any
                      new exercise or nutrition program, especially if you have pre-existing medical
                      conditions or injuries.
                    </div>
                  </div>

                  {/* Physically Active Toggle */}
                  <div className="rounded-xl bg-gray-950 border border-gray-800 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <Activity className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-white">
                          Are you currently physically active?
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          Let us know if you already engage in regular physical activity each week.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setPhysicallyActive(true)}
                        className={`px-4 py-2 rounded-lg text-xs font-semibold border transition ${
                          physicallyActive
                            ? 'bg-emerald-500 text-gray-950 border-emerald-500'
                            : 'bg-gray-900 text-gray-400 border-gray-700 hover:border-gray-600'
                        }`}
                      >
                        Yes
                      </button>
                      <button
                        type="button"
                        onClick={() => setPhysicallyActive(false)}
                        className={`px-4 py-2 rounded-lg text-xs font-semibold border transition ${
                          !physicallyActive
                            ? 'bg-emerald-500 text-gray-950 border-emerald-500'
                            : 'bg-gray-900 text-gray-400 border-gray-700 hover:border-gray-600'
                        }`}
                      >
                        No
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1.5">
                        Medical Conditions
                      </label>
                      <textarea
                        rows={3}
                        value={medicalConditions}
                        onChange={(e) => setMedicalConditions(e.target.value)}
                        placeholder="e.g. Asthma, hypertension, diabetes (leave blank if none)"
                        className="w-full rounded-xl bg-gray-950 border border-gray-800 px-3.5 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1.5">
                        Past or Current Injuries
                      </label>
                      <textarea
                        rows={3}
                        value={injuries}
                        onChange={(e) => setInjuries(e.target.value)}
                        placeholder="e.g. Lower back strain, rotator cuff tear (leave blank if none)"
                        className="w-full rounded-xl bg-gray-950 border border-gray-800 px-3.5 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1.5">
                        Joint Pain
                      </label>
                      <textarea
                        rows={3}
                        value={jointPain}
                        onChange={(e) => setJointPain(e.target.value)}
                        placeholder="e.g. Knee discomfort, wrist soreness (leave blank if none)"
                        className="w-full rounded-xl bg-gray-950 border border-gray-800 px-3.5 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1.5">
                        Exercises to Avoid
                      </label>
                      <textarea
                        rows={3}
                        value={exercisesToAvoid}
                        onChange={(e) => setExercisesToAvoid(e.target.value)}
                        placeholder="e.g. Heavy deadlifts, jumping exercises (leave blank if none)"
                        className="w-full rounded-xl bg-gray-950 border border-gray-800 px-3.5 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition resize-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">
                      Additional Health Information
                    </label>
                    <textarea
                      rows={3}
                      value={additionalInfo}
                      onChange={(e) => setAdditionalInfo(e.target.value)}
                      placeholder="Any medications, mobility notes, or other context for your AI coach..."
                      className="w-full rounded-xl bg-gray-950 border border-gray-800 px-3.5 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition resize-none"
                    />
                  </div>
                </div>
              )}

              {/* STEP 3: FITNESS EXPERIENCE */}
              {step === 3 && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-3">
                      Experience Level <span className="text-emerald-400">*</span>
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                      {EXPERIENCE_LEVELS.map((lvl) => {
                        const Icon = lvl.icon;
                        const selected = fitnessExperience === lvl.value;
                        return (
                          <button
                            key={lvl.value}
                            type="button"
                            onClick={() => {
                              setFitnessExperience(lvl.value);
                              setFieldErrors((prev) => ({ ...prev, fitnessExperience: undefined }));
                            }}
                            className={`text-left rounded-xl p-4 border transition-all duration-200 flex flex-col gap-2.5 ${
                              selected
                                ? 'bg-emerald-500/10 border-emerald-500 ring-1 ring-emerald-500/50'
                                : 'bg-gray-950 border-gray-800 hover:border-gray-700'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div
                                className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                                  selected
                                    ? 'bg-emerald-500 text-gray-950'
                                    : 'bg-gray-900 text-emerald-400 border border-gray-800'
                                }`}
                              >
                                <Icon className="w-5 h-5" />
                              </div>
                              {selected && (
                                <span className="w-5 h-5 rounded-full bg-emerald-500 text-gray-950 flex items-center justify-center">
                                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                                </span>
                              )}
                            </div>
                            <div>
                              <p className="font-semibold text-white text-sm">{lvl.label}</p>
                              <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                                {lvl.description}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    {fieldErrors.fitnessExperience && (
                      <p className="mt-2 text-xs text-rose-400">{fieldErrors.fitnessExperience}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-3">
                      How long have you been exercising regularly?{' '}
                      <span className="text-emerald-400">*</span>
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                      {EXERCISE_DURATIONS.map((dur) => {
                        const selected = exerciseDuration === dur;
                        return (
                          <button
                            key={dur}
                            type="button"
                            onClick={() => {
                              setExerciseDuration(dur);
                              setFieldErrors((prev) => ({ ...prev, exerciseDuration: undefined }));
                            }}
                            className={`px-4 py-3 rounded-xl text-sm font-medium border text-left flex items-center justify-between transition ${
                              selected
                                ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300'
                                : 'bg-gray-950 border-gray-800 text-gray-300 hover:border-gray-700'
                            }`}
                          >
                            <span>{dur}</span>
                            {selected && <Check className="w-4 h-4 text-emerald-400 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                    {fieldErrors.exerciseDuration && (
                      <p className="mt-2 text-xs text-rose-400">{fieldErrors.exerciseDuration}</p>
                    )}
                  </div>
                </div>
              )}

              {/* STEP 4: WORKOUT PREFERENCES */}
              {step === 4 && (
                <div className="space-y-6">
                  {/* Workout Location */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-3">
                      Workout Location <span className="text-emerald-400">*</span>
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                      {WORKOUT_LOCATIONS.map((loc) => {
                        const Icon = loc.icon;
                        const selected = workoutLocation === loc.value;
                        return (
                          <button
                            key={loc.value}
                            type="button"
                            onClick={() => {
                              setWorkoutLocation(loc.value);
                              setFieldErrors((prev) => ({ ...prev, workoutLocation: undefined }));
                            }}
                            className={`text-left rounded-xl p-4 border transition-all flex flex-col gap-2.5 ${
                              selected
                                ? 'bg-emerald-500/10 border-emerald-500 ring-1 ring-emerald-500/50'
                                : 'bg-gray-950 border-gray-800 hover:border-gray-700'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div
                                className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                                  selected
                                    ? 'bg-emerald-500 text-gray-950'
                                    : 'bg-gray-900 text-emerald-400 border border-gray-800'
                                }`}
                              >
                                <Icon className="w-5 h-5" />
                              </div>
                              {selected && (
                                <span className="w-5 h-5 rounded-full bg-emerald-500 text-gray-950 flex items-center justify-center">
                                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                                </span>
                              )}
                            </div>
                            <div>
                              <p className="font-semibold text-white text-sm">{loc.label}</p>
                              <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                                {loc.description}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    {fieldErrors.workoutLocation && (
                      <p className="mt-2 text-xs text-rose-400">{fieldErrors.workoutLocation}</p>
                    )}
                  </div>

                  {/* Days Per Week */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-3">
                      <Calendar className="w-4 h-4 text-emerald-400" />
                      <span>
                        Days Per Week <span className="text-emerald-400">*</span>
                      </span>
                    </label>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
                      {DAYS_OPTIONS.map((days) => {
                        const selected = workoutDaysPerWeek === days;
                        return (
                          <button
                            key={days}
                            type="button"
                            onClick={() => {
                              setWorkoutDaysPerWeek(days);
                              setFieldErrors((prev) => ({
                                ...prev,
                                workoutDaysPerWeek: undefined,
                              }));
                            }}
                            className={`py-3 rounded-xl border text-center transition ${
                              selected
                                ? 'bg-emerald-500 text-gray-950 border-emerald-500 font-bold'
                                : 'bg-gray-950 text-gray-300 border-gray-800 hover:border-gray-700 font-medium'
                            }`}
                          >
                            <span className="text-base block leading-none">{days}</span>
                            <span
                              className={`text-[11px] mt-1 block ${
                                selected ? 'text-gray-900' : 'text-gray-500'
                              }`}
                            >
                              days
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    {fieldErrors.workoutDaysPerWeek && (
                      <p className="mt-2 text-xs text-rose-400">{fieldErrors.workoutDaysPerWeek}</p>
                    )}
                  </div>

                  {/* Duration Per Workout */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-3">
                      <Clock className="w-4 h-4 text-emerald-400" />
                      <span>
                        Duration Per Workout <span className="text-emerald-400">*</span>
                      </span>
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {WORKOUT_DURATIONS.map((dur) => {
                        const selected = workoutDuration === dur;
                        return (
                          <button
                            key={dur}
                            type="button"
                            onClick={() => {
                              setWorkoutDuration(dur);
                              setFieldErrors((prev) => ({ ...prev, workoutDuration: undefined }));
                            }}
                            className={`px-3.5 py-2.5 rounded-xl text-sm font-medium border text-center transition ${
                              selected
                                ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300'
                                : 'bg-gray-950 border-gray-800 text-gray-300 hover:border-gray-700'
                            }`}
                          >
                            {dur}
                          </button>
                        );
                      })}
                    </div>
                    {fieldErrors.workoutDuration && (
                      <p className="mt-2 text-xs text-rose-400">{fieldErrors.workoutDuration}</p>
                    )}
                  </div>

                  {/* Equipment Checklist */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">
                      Available Equipment <span className="text-xs text-gray-500">(Select all that apply)</span>
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-2">
                      {EQUIPMENT_LIST.map((item) => {
                        const checked = availableEquipment.includes(item);
                        return (
                          <button
                            key={item}
                            type="button"
                            onClick={() => toggleEquipment(item)}
                            className={`px-3 py-2.5 rounded-xl border text-xs sm:text-sm font-medium flex items-center gap-2.5 transition text-left ${
                              checked
                                ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300'
                                : 'bg-gray-950 border-gray-800 text-gray-300 hover:border-gray-700'
                            }`}
                          >
                            <span
                              className={`w-4 h-4 rounded flex items-center justify-center border shrink-0 transition ${
                                checked
                                  ? 'bg-emerald-500 border-emerald-500 text-gray-950'
                                  : 'border-gray-600 bg-gray-900'
                              }`}
                            >
                              {checked && <Check className="w-3 h-3 stroke-[3]" />}
                            </span>
                            <span className="truncate">{item}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 5: GOAL SELECTION */}
              {step === 5 && (
                <div className="space-y-6">
                  {/* Primary Goal */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-3">
                      Primary Goal <span className="text-emerald-400">*</span>
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      {GOALS_LIST.map((g) => {
                        const selected = primaryGoal === g.value;
                        return (
                          <button
                            key={g.value}
                            type="button"
                            onClick={() => {
                              setPrimaryGoal(g.value);
                              if (secondaryGoal === g.value) setSecondaryGoal('');
                              setFieldErrors((prev) => ({ ...prev, primaryGoal: undefined }));
                            }}
                            className={`text-left rounded-xl p-3.5 border transition-all flex flex-col gap-2 ${
                              selected
                                ? 'bg-emerald-500/15 border-emerald-500 ring-1 ring-emerald-500/40'
                                : 'bg-gray-950 border-gray-800 hover:border-gray-700'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-2xl" role="img" aria-label={g.label}>
                                {g.emoji}
                              </span>
                              {selected && (
                                <span className="w-5 h-5 rounded-full bg-emerald-500 text-gray-950 flex items-center justify-center">
                                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                                </span>
                              )}
                            </div>
                            <div>
                              <p className="font-semibold text-white text-sm">{g.label}</p>
                              <p className="text-[11px] text-gray-400 mt-0.5 leading-snug">
                                {g.desc}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    {fieldErrors.primaryGoal && (
                      <p className="mt-2 text-xs text-rose-400">{fieldErrors.primaryGoal}</p>
                    )}
                  </div>

                  {/* Secondary Goal & Timeline */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1.5">
                        Secondary Goal <span className="text-xs text-gray-500">(Optional)</span>
                      </label>
                      <select
                        value={secondaryGoal}
                        onChange={(e) => setSecondaryGoal(e.target.value)}
                        className="w-full rounded-xl bg-gray-950 border border-gray-800 px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                      >
                        <option value="">None</option>
                        {GOALS_LIST.filter((g) => g.value !== primaryGoal).map((g) => (
                          <option key={g.value} value={g.value}>
                            {g.emoji} {g.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1.5">
                        Target Timeline <span className="text-emerald-400">*</span>
                      </label>
                      <select
                        value={targetTimeline}
                        onChange={(e) => {
                          setTargetTimeline(e.target.value);
                          setFieldErrors((prev) => ({ ...prev, targetTimeline: undefined }));
                        }}
                        className="w-full rounded-xl bg-gray-950 border border-gray-800 px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                      >
                        <option value="">Select timeline</option>
                        {TIMELINE_OPTIONS.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                      {fieldErrors.targetTimeline && (
                        <p className="mt-1 text-xs text-rose-400">{fieldErrors.targetTimeline}</p>
                      )}
                    </div>
                  </div>

                  {/* Results Disclaimer */}
                  <div className="rounded-xl bg-gray-950 border border-gray-800 p-4 flex items-start gap-3">
                    <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-gray-400 leading-relaxed">
                      Individual results vary based on training consistency, nutrition adherence, sleep
                      quality, recovery, and genetics. FitCoach AI adapts your plan as you progress.
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation Footer */}
          <div className="mt-8 pt-6 border-t border-gray-800 flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={handleBack}
              disabled={step === 1 || submitting}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition ${
                step === 1
                  ? 'border-gray-800 text-gray-600 cursor-not-allowed bg-gray-950/50'
                  : 'border-gray-700 text-gray-200 bg-gray-950 hover:bg-gray-800 hover:border-gray-600'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            <button
              type="button"
              onClick={handleNext}
              disabled={submitting}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold bg-emerald-500 hover:bg-emerald-400 text-gray-950 transition shadow-lg shadow-emerald-500/20 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{step === 5 ? 'Finishing Setup...' : 'Saving...'}</span>
                </>
              ) : step === 5 ? (
                <>
                  <span>Complete Setup</span>
                  <Check className="w-4 h-4" />
                </>
              ) : (
                <>
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Dumbbell,
  Brain,
  TrendingUp,
  Video,
  Apple,
  Zap,
  ChevronRight,
  Shield,
  Target,
  Activity,
} from 'lucide-react';

const features = [
  {
    id: 'plans',
    title: 'AI Workout Plans',
    description:
      'Custom training splits tailored to your fitness level, available equipment, schedule, and recovery capacity.',
    icon: Dumbbell,
    badge: 'Personalized',
    highlight: 'Dynamic weekly programming built around your goals',
  },
  {
    id: 'videos',
    title: 'Video Demonstrations',
    description:
      'Crystal-clear form cues and guided movement previews so you perform every rep safely and effectively.',
    icon: Video,
    badge: 'Form Guide',
    highlight: 'Step-by-step biomechanics and tempo cues',
  },
  {
    id: 'tracking',
    title: 'Progress Tracking',
    description:
      'Log sets, reps, weights, and personal records with visual trends that show real strength and consistency gains.',
    icon: TrendingUp,
    badge: 'Analytics',
    highlight: 'Track volume, streaks, and PR milestones',
  },
  {
    id: 'coach',
    title: 'AI Coach',
    description:
      '24/7 intelligent coaching for exercise swaps, technique questions, recovery advice, and motivation.',
    icon: Brain,
    badge: '24/7 Support',
    highlight: 'Instant guidance whenever your schedule shifts',
  },
  {
    id: 'nutrition',
    title: 'Nutrition Guidance',
    description:
      'Smart calorie and macronutrient targets aligned with fat loss, lean muscle gain, or athletic performance.',
    icon: Apple,
    badge: 'Fueling',
    highlight: 'Balanced daily macros matched to training days',
  },
  {
    id: 'adaptive',
    title: 'Adaptive Training',
    description:
      'Workouts automatically adjust intensity and volume based on your logged performance and fatigue feedback.',
    icon: Zap,
    badge: 'Smart Progression',
    highlight: 'Progressive overload without burnout',
  },
];

const trainingModes = [
  {
    id: 'strength',
    label: 'Build Strength',
    focus: 'Progressive compound lifts & hypertrophy',
    split: '4-Day Upper / Lower Split',
    calories: '2,550 kcal • 175g Protein',
    readiness: '94% Optimal',
    sample: [
      { name: 'Barbell Back Squat', sets: '4 × 6–8 reps', note: 'RPE 8 • 2m rest' },
      { name: 'Incline Dumbbell Press', sets: '3 × 8–10 reps', note: 'Controlled 3s eccentric' },
      { name: 'Weighted Pull-Ups', sets: '3 × 6–8 reps', note: 'Full scapular stretch' },
    ],
  },
  {
    id: 'fatloss',
    label: 'Lean & Conditioned',
    focus: 'Metabolic resistance & steady fat loss',
    split: '4-Day Full Body + Conditioning',
    calories: '2,050 kcal • 165g Protein',
    readiness: '91% Optimal',
    sample: [
      { name: 'Goblet Squat Superset', sets: '4 × 12 reps', note: '45s rest • High output' },
      { name: 'Push-Up to Renegade Row', sets: '3 × 10 reps', note: 'Core stability focus' },
      { name: 'Kettlebell Swings', sets: '5 × 20s work', note: '40s active recovery' },
    ],
  },
  {
    id: 'athletic',
    label: 'Athletic Mobility',
    focus: 'Power, joint resilience & endurance',
    split: '3-Day Hybrid Performance',
    calories: '2,400 kcal • 160g Protein',
    readiness: '96% Optimal',
    sample: [
      { name: 'Trap Bar Deadlift', sets: '4 × 5 reps', note: 'Explosive concentric' },
      { name: 'Single-Arm Landmine Press', sets: '3 × 10/side', note: 'Thoracic rotation' },
      { name: 'Sled Push / Tempo Intervals', sets: '6 × 30m', note: '90s nasal recovery' },
    ],
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
};

export default function Landing() {
  const [selectedMode, setSelectedMode] = useState('strength');
  const activeMode = trainingModes.find((m) => m.id === selectedMode) || trainingModes[0];

  return (
    <div className="min-h-screen bg-gray-950 text-white selection:bg-emerald-500/30 selection:text-emerald-200 overflow-x-hidden">
      {/* Ambient Background Glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-32 h-96 w-96 rounded-full bg-emerald-500/15 blur-3xl" />
        <div className="absolute top-1/3 -right-32 h-[28rem] w-[28rem] rounded-full bg-emerald-400/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-teal-500/10 blur-3xl" />
      </div>

      {/* Navigation */}
      <header className="relative z-10 border-b border-gray-800/80 bg-gray-950/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-400 text-gray-950 shadow-lg shadow-emerald-500/20 transition-transform group-hover:scale-105">
              <Dumbbell className="h-5 w-5" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-white">FitCoach AI</span>
              <span className="hidden sm:block text-xs text-emerald-400 font-medium">
                Intelligent Training
              </span>
            </div>
          </Link>

          <nav className="flex items-center gap-3 sm:gap-5">
            <a
              href="#features"
              className="hidden md:inline-block text-sm font-medium text-gray-300 hover:text-emerald-400 transition-colors"
            >
              Features
            </a>
            <a
              href="#preview"
              className="hidden md:inline-block text-sm font-medium text-gray-300 hover:text-emerald-400 transition-colors"
            >
              How It Works
            </a>
            <Link
              to="/login"
              className="rounded-lg px-3.5 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-900 transition-colors"
            >
              Log In
            </Link>
            <Link
              to="/register"
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-gray-950 shadow-lg shadow-emerald-500/25 hover:bg-emerald-400 transition-all"
            >
              Get Started
              <ChevronRight className="h-4 w-4" />
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10">
        <section className="mx-auto max-w-7xl px-4 pt-14 pb-20 sm:px-6 sm:pt-20 sm:pb-24 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-12">
            {/* Left Copy */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="lg:col-span-7 text-center lg:text-left"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-xs sm:text-sm font-medium text-emerald-400"
              >
                <Zap className="h-4 w-4" />
                <span>Adaptive AI Coaching • Personalized Workouts & Nutrition</span>
              </motion.div>

              <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl leading-[1.1]">
                FitCoach AI{' '}
                <span className="block mt-2 bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-500 bg-clip-text text-transparent">
                  Your AI-Powered Personal Fitness Trainer
                </span>
              </h1>

              <p className="mt-6 max-w-2xl mx-auto lg:mx-0 text-base sm:text-lg text-gray-400 leading-relaxed">
                Train smarter with science-backed AI workout plans, guided video demonstrations,
                real-time coaching, and adaptive progression built around your body, equipment, and
                daily recovery.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <Link
                  to="/register"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-7 py-3.5 text-base font-semibold text-gray-950 shadow-xl shadow-emerald-500/25 hover:bg-emerald-400 hover:-translate-y-0.5 transition-all"
                >
                  Get Started Free
                  <ChevronRight className="h-5 w-5" />
                </Link>
                <Link
                  to="/login"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-gray-800 bg-gray-900/80 px-7 py-3.5 text-base font-semibold text-gray-200 hover:border-emerald-500/40 hover:text-white transition-all"
                >
                  Existing User? Log In
                </Link>
              </div>

              {/* Trust / Metric Strip */}
              <div className="mt-10 grid grid-cols-3 gap-4 border-t border-gray-800/80 pt-8 max-w-lg mx-auto lg:mx-0">
                <div>
                  <div className="flex items-center justify-center lg:justify-start gap-1.5 text-emerald-400 font-bold text-xl sm:text-2xl">
                    <Target className="h-5 w-5" />
                    <span>100%</span>
                  </div>
                  <p className="mt-1 text-xs sm:text-sm text-gray-400">Tailored Plans</p>
                </div>
                <div>
                  <div className="flex items-center justify-center lg:justify-start gap-1.5 text-emerald-400 font-bold text-xl sm:text-2xl">
                    <Activity className="h-5 w-5" />
                    <span>24/7</span>
                  </div>
                  <p className="mt-1 text-xs sm:text-sm text-gray-400">AI Coach Access</p>
                </div>
                <div>
                  <div className="flex items-center justify-center lg:justify-start gap-1.5 text-emerald-400 font-bold text-xl sm:text-2xl">
                    <TrendingUp className="h-5 w-5" />
                    <span>Smart</span>
                  </div>
                  <p className="mt-1 text-xs sm:text-sm text-gray-400">Auto Overload</p>
                </div>
              </div>
            </motion.div>

            {/* Right Interactive Preview Card */}
            <motion.div
              id="preview"
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.15, ease: 'easeOut' }}
              className="lg:col-span-5"
            >
              <div className="relative rounded-2xl border border-gray-800 bg-gray-900/90 p-5 sm:p-6 shadow-2xl shadow-black/50 backdrop-blur">
                <div className="flex items-center justify-between border-b border-gray-800 pb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400">
                      <Brain className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">Live AI Plan Preview</p>
                      <p className="text-xs text-gray-400">Select a goal to preview your split</p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-medium text-emerald-400">
                    <Activity className="h-3.5 w-3.5" />
                    {activeMode.readiness}
                  </span>
                </div>

                {/* Goal Switcher */}
                <div className="mt-4 grid grid-cols-3 gap-2">
                  {trainingModes.map((mode) => {
                    const isActive = mode.id === selectedMode;
                    return (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() => setSelectedMode(mode.id)}
                        className={`rounded-xl px-2.5 py-2 text-xs font-semibold transition-all cursor-pointer ${
                          isActive
                            ? 'bg-emerald-500 text-gray-950 shadow-md shadow-emerald-500/20'
                            : 'bg-gray-950/70 text-gray-300 border border-gray-800 hover:border-gray-700 hover:text-white'
                        }`}
                      >
                        {mode.label}
                      </button>
                    );
                  })}
                </div>

                {/* Active Plan Details */}
                <motion.div
                  key={activeMode.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className="mt-5 space-y-4"
                >
                  <div className="rounded-xl border border-gray-800 bg-gray-950/80 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-xs uppercase tracking-wider text-emerald-400 font-semibold">
                          {activeMode.split}
                        </p>
                        <p className="mt-0.5 text-sm text-gray-300">{activeMode.focus}</p>
                      </div>
                      <span className="rounded-lg bg-gray-900 px-2.5 py-1 text-xs text-gray-300 border border-gray-800">
                        {activeMode.calories}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    {activeMode.sample.map((exercise) => (
                      <div
                        key={exercise.name}
                        className="flex items-center justify-between rounded-xl border border-gray-800/80 bg-gray-950/60 px-4 py-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                            <Dumbbell className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">{exercise.name}</p>
                            <p className="text-xs text-gray-400">{exercise.note}</p>
                          </div>
                        </div>
                        <span className="text-xs font-semibold text-emerald-400 whitespace-nowrap">
                          {exercise.sets}
                        </span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-3xl mx-auto"
          >
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-400">
              Complete Training Ecosystem
            </span>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Everything you need to{' '}
              <span className="text-emerald-400">transform your training</span>
            </h2>
            <p className="mt-4 text-base sm:text-lg text-gray-400">
              From adaptive programming and video form cues to nutrition targets and 24/7 AI
              coaching, every piece works together seamlessly.
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          >
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.id}
                  variants={itemVariants}
                  whileHover={{ y: -4 }}
                  className="group relative rounded-2xl border border-gray-800 bg-gray-900 p-6 transition-colors hover:border-emerald-500/50"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20 group-hover:bg-emerald-500 group-hover:text-gray-950 transition-colors">
                      <Icon className="h-6 w-6" />
                    </div>
                    <span className="rounded-full bg-gray-950 px-3 py-1 text-xs font-medium text-emerald-400 border border-gray-800">
                      {feature.badge}
                    </span>
                  </div>

                  <h3 className="mt-5 text-xl font-semibold text-white">{feature.title}</h3>
                  <p className="mt-2.5 text-sm leading-relaxed text-gray-400">
                    {feature.description}
                  </p>

                  <div className="mt-5 flex items-center gap-2 border-t border-gray-800/80 pt-4 text-xs font-medium text-emerald-400/90">
                    <ChevronRight className="h-4 w-4 shrink-0" />
                    <span>{feature.highlight}</span>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </section>

        {/* Bottom CTA Section */}
        <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.5 }}
            className="relative overflow-hidden rounded-3xl border border-emerald-500/25 bg-gradient-to-br from-gray-900 via-gray-900 to-emerald-950/40 p-8 sm:p-12 text-center"
          >
            <div className="mx-auto max-w-2xl">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-400">
                <Target className="h-6 w-6" />
              </div>
              <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-white">
                Ready to start your smartest training block?
              </h2>
              <p className="mt-4 text-sm sm:text-base text-gray-300">
                Complete a quick onboarding profile and get your personalized AI workout plan,
                macro targets, and coaching dashboard in seconds.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  to="/register"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-8 py-3.5 text-base font-semibold text-gray-950 shadow-lg shadow-emerald-500/25 hover:bg-emerald-400 transition-all"
                >
                  Get Started
                  <ChevronRight className="h-5 w-5" />
                </Link>
                <Link
                  to="/login"
                  className="text-sm font-medium text-gray-300 hover:text-emerald-400 transition-colors"
                >
                  Already have an account? Sign in
                </Link>
              </div>
            </div>
          </motion.div>
        </section>
      </main>

      {/* Footer & Safety Disclaimer */}
      <footer className="relative z-10 border-t border-gray-800/80 bg-gray-950 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-xl border border-gray-800/80 bg-gray-900/60 p-4 sm:p-5 flex flex-col sm:flex-row items-start gap-3">
            <Shield className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
            <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
              <span className="font-semibold text-gray-200">Health & Safety Disclaimer:</span>{' '}
              FitCoach AI provides general fitness, workout, and nutritional information for
              educational purposes only and is not a substitute for professional medical advice,
              diagnosis, or treatment. Consult a qualified physician or healthcare provider before
              starting any new exercise or nutrition program, especially if you have pre-existing
              injuries or medical conditions. Stop exercising immediately if you feel pain,
              dizziness, or shortness of breath.
            </p>
          </div>
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
            <div className="flex items-center gap-2">
              <Dumbbell className="h-4 w-4 text-emerald-500" />
              <span>FitCoach AI — Your AI-Powered Personal Fitness Trainer</span>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/register" className="hover:text-emerald-400 transition-colors">
                Register
              </Link>
              <Link to="/login" className="hover:text-emerald-400 transition-colors">
                Login
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

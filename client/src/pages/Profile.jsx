import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Settings,
  Edit2,
  Save,
  LogOut,
  Trash2,
  Download,
  Dumbbell,
  Heart,
  Target,
  Calendar,
  X,
  Check
} from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../AuthContext';

const EQUIPMENT_OPTIONS = [
  'Bodyweight',
  'Dumbbells',
  'Barbell',
  'Kettlebells',
  'Resistance Bands',
  'Pull-up Bar',
  'Bench',
  'Cable Machine',
  'Squat Rack',
  'Cardio Machine'
];

const EXPERIENCE_OPTIONS = ['Beginner', 'Intermediate', 'Advanced'];
const LOCATION_OPTIONS = ['Gym', 'Home', 'Outdoors', 'Hybrid'];
const GOAL_OPTIONS = [
  'Weight Loss',
  'Muscle Gain',
  'Strength',
  'Endurance',
  'General Fitness',
  'Flexibility & Mobility'
];

function parseEquipment(raw) {
  if (Array.isArray(raw)) return raw.filter(Boolean);
  if (typeof raw === 'string' && raw.trim()) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.filter(Boolean);
    } catch {
      return raw
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
    }
  }
  return [];
}

function getInitials(name, email) {
  const source = (name || '').trim();
  if (source) {
    const parts = source.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return source.slice(0, 2).toUpperCase();
  }
  if (email) {
    return email.slice(0, 2).toUpperCase();
  }
  return 'FC';
}

function formatDate(dateString) {
  if (!dateString) return 'Recently joined';
  const parsed = new Date(dateString);
  if (Number.isNaN(parsed.getTime())) return 'Recently joined';
  return parsed.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

function calculateBmi(heightCm, weightKg) {
  const h = Number(heightCm);
  const w = Number(weightKg);
  if (!h || !w || h <= 0 || w <= 0) return null;
  const meters = h / 100;
  return Math.round((w / (meters * meters)) * 10) / 10;
}

function getBmiCategory(bmi) {
  if (!bmi || Number.isNaN(Number(bmi))) {
    return { label: 'Not calculated', color: 'text-gray-400 bg-gray-800 border-gray-700' };
  }
  const value = Number(bmi);
  if (value < 18.5) {
    return { label: 'Underweight', color: 'text-sky-400 bg-sky-500/10 border-sky-500/30' };
  }
  if (value < 25) {
    return { label: 'Healthy', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' };
  }
  if (value < 30) {
    return { label: 'Overweight', color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' };
  }
  return { label: 'Obese', color: 'text-red-400 bg-red-500/10 border-red-500/30' };
}

function formatGoalLabel(goal) {
  if (!goal) return '';
  return String(goal)
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function Profile() {
  const navigate = useNavigate();
  const { user: authUser, logout, refreshUser } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);

  const [userData, setUserData] = useState(null);
  const [profile, setProfile] = useState(null);
  const [health, setHealth] = useState(null);
  const [goals, setGoals] = useState(null);

  const [editingPersonal, setEditingPersonal] = useState(false);
  const [personalForm, setPersonalForm] = useState({
    age: '',
    height_cm: '',
    current_weight_kg: '',
    target_weight_kg: ''
  });
  const [savingPersonal, setSavingPersonal] = useState(false);

  const [editingFitness, setEditingFitness] = useState(false);
  const [fitnessForm, setFitnessForm] = useState({
    fitness_experience: '',
    workout_location: '',
    workout_days_per_week: '',
    workout_duration: '',
    available_equipment: []
  });
  const [customEquipment, setCustomEquipment] = useState('');
  const [savingFitness, setSavingFitness] = useState(false);

  const [editingHealth, setEditingHealth] = useState(false);
  const [healthForm, setHealthForm] = useState({
    medical_conditions: '',
    injuries: '',
    joint_pain: '',
    exercises_to_avoid: ''
  });
  const [savingHealth, setSavingHealth] = useState(false);

  const [editingGoals, setEditingGoals] = useState(false);
  const [goalsForm, setGoalsForm] = useState({
    primary_goal: '',
    secondary_goal: '',
    target_timeline: ''
  });
  const [savingGoals, setSavingGoals] = useState(false);

  const [regeneratingPlan, setRegeneratingPlan] = useState(false);
  const [exportingHistory, setExportingHistory] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const showToast = useCallback((type, message) => {
    setToast({ type, message });
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  const syncForms = useCallback((profileData, healthData, goalsData) => {
    const p = profileData || {};
    const h = healthData || {};
    const g = goalsData || {};

    setPersonalForm({
      age: p.age ?? '',
      height_cm: p.height_cm ?? '',
      current_weight_kg: p.current_weight_kg ?? '',
      target_weight_kg: p.target_weight_kg ?? ''
    });

    setFitnessForm({
      fitness_experience: p.fitness_experience || '',
      workout_location: p.workout_location || '',
      workout_days_per_week: p.workout_days_per_week ?? '',
      workout_duration: p.workout_duration || p.exercise_duration || '',
      available_equipment: parseEquipment(p.available_equipment)
    });

    setHealthForm({
      medical_conditions: h.medical_conditions || '',
      injuries: h.injuries || '',
      joint_pain: h.joint_pain || '',
      exercises_to_avoid: h.exercises_to_avoid || ''
    });

    setGoalsForm({
      primary_goal: g.primary_goal || '',
      secondary_goal: g.secondary_goal || '',
      target_timeline: g.target_timeline || ''
    });
  }, []);

  const applyProfileResponse = useCallback(
    (meRes, onboardingRes) => {
      const resolvedUser = meRes?.user || null;
      const resolvedProfile = onboardingRes?.profile || meRes?.profile || null;
      const resolvedHealth = onboardingRes?.health || meRes?.health || null;
      const resolvedGoals = onboardingRes?.goals || meRes?.goals || null;

      setUserData(resolvedUser);
      setProfile(resolvedProfile);
      setHealth(resolvedHealth);
      setGoals(resolvedGoals);
      syncForms(resolvedProfile, resolvedHealth, resolvedGoals);
    },
    [syncForms]
  );

  const loadProfileData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [meRes, onboardingRes] = await Promise.all([
        api.getMe(),
        api.getOnboardingData()
      ]);
      applyProfileResponse(meRes, onboardingRes);
    } catch (err) {
      setError(err.message || 'Failed to load profile data.');
    } finally {
      setLoading(false);
    }
  }, [applyProfileResponse]);

  useEffect(() => {
    let active = true;
    Promise.all([api.getMe(), api.getOnboardingData()])
      .then(([meRes, onboardingRes]) => {
        if (!active) return;
        applyProfileResponse(meRes, onboardingRes);
      })
      .catch((err) => {
        if (!active) return;
        setError(err.message || 'Failed to load profile data.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [applyProfileResponse]);

  const displayUser = userData || authUser || {};
  const initials = useMemo(
    () => getInitials(displayUser.full_name, displayUser.email),
    [displayUser.full_name, displayUser.email]
  );

  const displayedBmi = useMemo(() => {
    if (editingPersonal) {
      return calculateBmi(personalForm.height_cm, personalForm.current_weight_kg);
    }
    return profile?.bmi ?? calculateBmi(profile?.height_cm, profile?.current_weight_kg);
  }, [editingPersonal, personalForm.height_cm, personalForm.current_weight_kg, profile]);

  const bmiMeta = useMemo(() => getBmiCategory(displayedBmi), [displayedBmi]);
  const equipmentList = useMemo(
    () => parseEquipment(profile?.available_equipment),
    [profile?.available_equipment]
  );

  const handleSavePersonal = async (e) => {
    e.preventDefault();
    const payload = {
      age: personalForm.age === '' ? null : Number(personalForm.age),
      height_cm: personalForm.height_cm === '' ? null : Number(personalForm.height_cm),
      current_weight_kg:
        personalForm.current_weight_kg === '' ? null : Number(personalForm.current_weight_kg),
      target_weight_kg:
        personalForm.target_weight_kg === '' ? null : Number(personalForm.target_weight_kg)
    };

    if (
      (payload.age !== null && (payload.age < 13 || payload.age > 120)) ||
      (payload.height_cm !== null && (payload.height_cm < 50 || payload.height_cm > 300)) ||
      (payload.current_weight_kg !== null &&
        (payload.current_weight_kg < 20 || payload.current_weight_kg > 500)) ||
      (payload.target_weight_kg !== null &&
        (payload.target_weight_kg < 20 || payload.target_weight_kg > 500))
    ) {
      showToast('error', 'Please enter realistic values for age, height, and weight.');
      return;
    }

    setSavingPersonal(true);
    try {
      await api.updateProfile(payload);
      const nextBmi = calculateBmi(payload.height_cm, payload.current_weight_kg);
      const updatedProfile = {
        ...(profile || {}),
        ...payload,
        bmi: nextBmi ?? profile?.bmi ?? null
      };
      setProfile(updatedProfile);
      setEditingPersonal(false);
      if (typeof refreshUser === 'function') {
        refreshUser().catch(() => {});
      }
      showToast('success', 'Personal information updated successfully.');
    } catch (err) {
      showToast('error', err.message || 'Failed to update personal information.');
    } finally {
      setSavingPersonal(false);
    }
  };

  const handleCancelPersonal = () => {
    syncForms(profile, health, goals);
    setEditingPersonal(false);
  };

  const handleToggleEquipment = (item) => {
    setFitnessForm((prev) => {
      const exists = prev.available_equipment.includes(item);
      return {
        ...prev,
        available_equipment: exists
          ? prev.available_equipment.filter((eq) => eq !== item)
          : [...prev.available_equipment, item]
      };
    });
  };

  const handleAddCustomEquipment = () => {
    const trimmed = customEquipment.trim();
    if (!trimmed) return;
    setFitnessForm((prev) => {
      if (prev.available_equipment.some((eq) => eq.toLowerCase() === trimmed.toLowerCase())) {
        return prev;
      }
      return {
        ...prev,
        available_equipment: [...prev.available_equipment, trimmed]
      };
    });
    setCustomEquipment('');
  };

  const handleSaveFitness = async (e) => {
    e.preventDefault();
    setSavingFitness(true);
    const payload = {
      fitness_experience: fitnessForm.fitness_experience,
      workout_location: fitnessForm.workout_location,
      workout_days_per_week:
        fitnessForm.workout_days_per_week === ''
          ? null
          : Number(fitnessForm.workout_days_per_week),
      workout_duration: fitnessForm.workout_duration,
      available_equipment: fitnessForm.available_equipment
    };

    try {
      await api.updateProfile(payload);
      const updatedProfile = {
        ...(profile || {}),
        ...payload,
        available_equipment: JSON.stringify(payload.available_equipment)
      };
      setProfile(updatedProfile);
      setEditingFitness(false);
      showToast('success', 'Fitness profile updated successfully.');
    } catch (err) {
      showToast('error', err.message || 'Failed to update fitness profile.');
    } finally {
      setSavingFitness(false);
    }
  };

  const handleCancelFitness = () => {
    syncForms(profile, health, goals);
    setCustomEquipment('');
    setEditingFitness(false);
  };

  const handleSaveHealth = async (e) => {
    e.preventDefault();
    setSavingHealth(true);
    const payload = {
      medical_conditions: healthForm.medical_conditions.trim(),
      injuries: healthForm.injuries.trim(),
      joint_pain: healthForm.joint_pain.trim(),
      exercises_to_avoid: healthForm.exercises_to_avoid.trim(),
      physically_active: health?.physically_active ?? 1,
      additional_info: health?.additional_info || ''
    };

    try {
      await api.saveHealth(payload);
      setHealth({ ...(health || {}), ...payload });
      setEditingHealth(false);
      showToast('success', 'Health information updated successfully.');
    } catch (err) {
      showToast('error', err.message || 'Failed to update health information.');
    } finally {
      setSavingHealth(false);
    }
  };

  const handleCancelHealth = () => {
    syncForms(profile, health, goals);
    setEditingHealth(false);
  };

  const handleSaveGoals = async (e) => {
    e.preventDefault();
    if (!goalsForm.primary_goal.trim()) {
      showToast('error', 'Primary goal cannot be empty.');
      return;
    }

    setSavingGoals(true);
    const payload = {
      primary_goal: goalsForm.primary_goal.trim(),
      secondary_goal: goalsForm.secondary_goal.trim() || null,
      target_timeline: goalsForm.target_timeline.trim() || null
    };

    try {
      await api.saveGoals(payload);
      setGoals({ ...(goals || {}), ...payload });
      setEditingGoals(false);
      showToast('success', 'Fitness goals updated successfully.');
    } catch (err) {
      showToast('error', err.message || 'Failed to update fitness goals.');
    } finally {
      setSavingGoals(false);
    }
  };

  const handleCancelGoals = () => {
    syncForms(profile, health, goals);
    setEditingGoals(false);
  };

  const handleRegeneratePlan = async () => {
    setRegeneratingPlan(true);
    try {
      const res = await api.generatePlan();
      const planName = res?.plan?.planName || 'Your new workout plan';
      showToast('success', `${planName} has been generated and set as active.`);
    } catch (err) {
      showToast('error', err.message || 'Failed to regenerate workout plan.');
    } finally {
      setRegeneratingPlan(false);
    }
  };

  const handleExportHistory = async () => {
    setExportingHistory(true);
    try {
      const data = await api.getSessions();
      const sessions = data?.sessions || [];
      const exportPayload = {
        exportedAt: new Date().toISOString(),
        app: 'FitCoach AI',
        user: {
          full_name: displayUser.full_name || '',
          email: displayUser.email || ''
        },
        totalSessions: sessions.length,
        sessions
      };

      const blob = new Blob([JSON.stringify(exportPayload, null, 2)], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const dateStamp = new Date().toISOString().split('T')[0];
      link.href = url;
      link.download = `fitcoach-workout-history-${dateStamp}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showToast(
        'success',
        `Exported ${sessions.length} workout ${sessions.length === 1 ? 'session' : 'sessions'} as JSON.`
      );
    } catch (err) {
      showToast('error', err.message || 'Failed to export workout history.');
    } finally {
      setExportingHistory(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleOpenDeleteModal = () => {
    setDeleteConfirmText('');
    setDeleteError('');
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (deleteConfirmText !== 'DELETE') return;
    setDeletingAccount(true);
    setDeleteError('');
    try {
      if (typeof api.deleteAccount === 'function') {
        await api.deleteAccount();
      }
      logout();
      setShowDeleteModal(false);
      navigate('/');
    } catch (err) {
      setDeleteError(err.message || 'Unable to delete account. Please try again.');
    } finally {
      setDeletingAccount(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col items-center justify-center px-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500 mb-4" />
        <p className="text-sm text-gray-400">Loading your FitCoach AI profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-100 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-gray-900 border border-red-500/30 rounded-xl p-6 text-center space-y-4">
          <div className="mx-auto w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-400">
            <X className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-semibold text-white">Unable to Load Profile</h2>
          <p className="text-sm text-gray-400">{error}</p>
          <button
            type="button"
            onClick={loadProfileData}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-semibold text-sm transition-colors cursor-pointer"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              className={`fixed top-5 right-5 z-50 max-w-sm flex items-center gap-3 px-4 py-3 rounded-xl border shadow-xl backdrop-blur-sm ${
                toast.type === 'success'
                  ? 'bg-gray-900/95 border-emerald-500/40 text-emerald-300'
                  : 'bg-gray-900/95 border-red-500/40 text-red-300'
              }`}
            >
              {toast.type === 'success' ? (
                <Check className="w-5 h-5 text-emerald-400 shrink-0" />
              ) : (
                <X className="w-5 h-5 text-red-400 shrink-0" />
              )}
              <span className="text-sm font-medium text-gray-100">{toast.message}</span>
              <button
                type="button"
                onClick={() => setToast(null)}
                className="ml-auto text-gray-400 hover:text-gray-200 cursor-pointer"
                aria-label="Dismiss notification"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2.5">
              <Settings className="w-7 h-7 text-emerald-400" />
              Profile &amp; Settings
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              Manage your biometrics, training preferences, health notes, and FitCoach AI account.
            </p>
          </div>
        </div>

        {/* 1. Profile Header */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-gray-900 border border-gray-800 rounded-xl p-6 sm:p-8 shadow-lg"
        >
          <div className="flex flex-col sm:flex-row items-center sm:items-center gap-6 text-center sm:text-left">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400 via-emerald-500 to-teal-600 p-0.5 shadow-lg shadow-emerald-500/20 shrink-0">
              <div className="w-full h-full rounded-full bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center">
                <span className="text-3xl font-bold text-white tracking-wider">{initials}</span>
              </div>
            </div>

            <div className="flex-1 min-w-0 space-y-1.5">
              <h2 className="text-2xl font-bold text-white truncate">
                {displayUser.full_name || 'FitCoach Athlete'}
              </h2>
              <p className="text-sm sm:text-base text-gray-400 truncate">
                {displayUser.email || 'No email available'}
              </p>
              <div className="inline-flex items-center gap-2 text-xs sm:text-sm text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full mt-1">
                <Calendar className="w-4 h-4 shrink-0" />
                <span>Member since {formatDate(displayUser.created_at)}</span>
              </div>
            </div>

            {goals?.primary_goal && (
              <div className="hidden md:flex flex-col items-end gap-1.5 shrink-0">
                <span className="text-xs uppercase tracking-wider text-gray-400">Active Focus</span>
                <span className="px-3.5 py-1.5 rounded-full text-sm font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  {formatGoalLabel(goals.primary_goal)}
                </span>
              </div>
            )}
          </div>
        </motion.section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 2. Personal Information Card */}
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.05 }}
            className="bg-gray-900 border border-gray-800 rounded-xl p-6 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between pb-4 mb-5 border-b border-gray-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Personal Information</h3>
                    <p className="text-xs text-gray-400">Body metrics &amp; weight targets</p>
                  </div>
                </div>

                {!editingPersonal ? (
                  <button
                    type="button"
                    onClick={() => setEditingPersonal(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 transition-colors cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-emerald-400" />
                    Edit
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCancelPersonal}
                      disabled={savingPersonal}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <X className="w-3.5 h-3.5" />
                      Cancel
                    </button>
                    <button
                      type="submit"
                      form="personal-info-form"
                      disabled={savingPersonal}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-gray-950 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <Save className="w-3.5 h-3.5" />
                      {savingPersonal ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                )}
              </div>

              {editingPersonal ? (
                <form id="personal-info-form" onSubmit={handleSavePersonal} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1.5">
                        Age (years)
                      </label>
                      <input
                        type="number"
                        min="13"
                        max="120"
                        value={personalForm.age}
                        onChange={(e) =>
                          setPersonalForm((prev) => ({ ...prev, age: e.target.value }))
                        }
                        placeholder="e.g. 28"
                        className="w-full px-3.5 py-2 rounded-lg bg-gray-950 border border-gray-700 focus:border-emerald-500 focus:outline-none text-sm text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1.5">
                        Height (cm)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="50"
                        max="300"
                        value={personalForm.height_cm}
                        onChange={(e) =>
                          setPersonalForm((prev) => ({ ...prev, height_cm: e.target.value }))
                        }
                        placeholder="e.g. 175"
                        className="w-full px-3.5 py-2 rounded-lg bg-gray-950 border border-gray-700 focus:border-emerald-500 focus:outline-none text-sm text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1.5">
                        Current Weight (kg)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="20"
                        max="500"
                        value={personalForm.current_weight_kg}
                        onChange={(e) =>
                          setPersonalForm((prev) => ({
                            ...prev,
                            current_weight_kg: e.target.value
                          }))
                        }
                        placeholder="e.g. 74.5"
                        className="w-full px-3.5 py-2 rounded-lg bg-gray-950 border border-gray-700 focus:border-emerald-500 focus:outline-none text-sm text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1.5">
                        Target Weight (kg)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="20"
                        max="500"
                        value={personalForm.target_weight_kg}
                        onChange={(e) =>
                          setPersonalForm((prev) => ({
                            ...prev,
                            target_weight_kg: e.target.value
                          }))
                        }
                        placeholder="e.g. 70"
                        className="w-full px-3.5 py-2 rounded-lg bg-gray-950 border border-gray-700 focus:border-emerald-500 focus:outline-none text-sm text-white"
                      />
                    </div>
                  </div>

                  <div className="p-3.5 rounded-lg bg-gray-950 border border-gray-800 flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-400">Estimated BMI</span>
                    <div className="flex items-center gap-2.5">
                      <span className="text-base font-bold text-white">
                        {displayedBmi ?? '—'}
                      </span>
                      <span
                        className={`text-xs font-medium px-2.5 py-0.5 rounded-full border ${bmiMeta.color}`}
                      >
                        {bmiMeta.label}
                      </span>
                    </div>
                  </div>
                </form>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
                  <div className="p-3.5 rounded-lg bg-gray-950/70 border border-gray-800/80">
                    <p className="text-xs text-gray-400">Age</p>
                    <p className="text-base font-semibold text-white mt-1">
                      {profile?.age ? `${profile.age} yrs` : 'Not set'}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-lg bg-gray-950/70 border border-gray-800/80">
                    <p className="text-xs text-gray-400">Height</p>
                    <p className="text-base font-semibold text-white mt-1">
                      {profile?.height_cm ? `${profile.height_cm} cm` : 'Not set'}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-lg bg-gray-950/70 border border-gray-800/80">
                    <p className="text-xs text-gray-400">Weight</p>
                    <p className="text-base font-semibold text-white mt-1">
                      {profile?.current_weight_kg ? `${profile.current_weight_kg} kg` : 'Not set'}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-lg bg-gray-950/70 border border-gray-800/80">
                    <p className="text-xs text-gray-400">Target Weight</p>
                    <p className="text-base font-semibold text-emerald-400 mt-1">
                      {profile?.target_weight_kg ? `${profile.target_weight_kg} kg` : 'Not set'}
                    </p>
                  </div>

                  <div className="col-span-2 p-3.5 rounded-lg bg-gray-950/70 border border-gray-800/80 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-400">Body Mass Index (BMI)</p>
                      <p className="text-base font-semibold text-white mt-1">
                        {displayedBmi ?? 'Not set'}
                      </p>
                    </div>
                    <span
                      className={`text-xs font-medium px-2.5 py-1 rounded-full border ${bmiMeta.color}`}
                    >
                      {bmiMeta.label}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </motion.section>

          {/* 3. Fitness Profile Card */}
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="bg-gray-900 border border-gray-800 rounded-xl p-6 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between pb-4 mb-5 border-b border-gray-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                    <Dumbbell className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Fitness Profile</h3>
                    <p className="text-xs text-gray-400">Experience, schedule &amp; equipment</p>
                  </div>
                </div>

                {!editingFitness ? (
                  <button
                    type="button"
                    onClick={() => setEditingFitness(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 transition-colors cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-emerald-400" />
                    Edit
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCancelFitness}
                      disabled={savingFitness}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <X className="w-3.5 h-3.5" />
                      Cancel
                    </button>
                    <button
                      type="submit"
                      form="fitness-profile-form"
                      disabled={savingFitness}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-gray-950 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <Save className="w-3.5 h-3.5" />
                      {savingFitness ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                )}
              </div>

              {editingFitness ? (
                <form id="fitness-profile-form" onSubmit={handleSaveFitness} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1.5">
                        Experience Level
                      </label>
                      <select
                        value={fitnessForm.fitness_experience}
                        onChange={(e) =>
                          setFitnessForm((prev) => ({
                            ...prev,
                            fitness_experience: e.target.value
                          }))
                        }
                        className="w-full px-3 py-2 rounded-lg bg-gray-950 border border-gray-700 focus:border-emerald-500 focus:outline-none text-sm text-white"
                      >
                        <option value="">Select level</option>
                        {EXPERIENCE_OPTIONS.map((opt) => (
                          <option key={opt} value={opt.toLowerCase()}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1.5">
                        Workout Location
                      </label>
                      <select
                        value={fitnessForm.workout_location}
                        onChange={(e) =>
                          setFitnessForm((prev) => ({
                            ...prev,
                            workout_location: e.target.value
                          }))
                        }
                        className="w-full px-3 py-2 rounded-lg bg-gray-950 border border-gray-700 focus:border-emerald-500 focus:outline-none text-sm text-white"
                      >
                        <option value="">Select location</option>
                        {LOCATION_OPTIONS.map((opt) => (
                          <option key={opt} value={opt.toLowerCase()}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1.5">
                        Days Per Week
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="7"
                        value={fitnessForm.workout_days_per_week}
                        onChange={(e) =>
                          setFitnessForm((prev) => ({
                            ...prev,
                            workout_days_per_week: e.target.value
                          }))
                        }
                        placeholder="e.g. 4"
                        className="w-full px-3 py-2 rounded-lg bg-gray-950 border border-gray-700 focus:border-emerald-500 focus:outline-none text-sm text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1.5">
                        Workout Duration
                      </label>
                      <input
                        type="text"
                        value={fitnessForm.workout_duration}
                        onChange={(e) =>
                          setFitnessForm((prev) => ({
                            ...prev,
                            workout_duration: e.target.value
                          }))
                        }
                        placeholder="e.g. 45-60 mins"
                        className="w-full px-3 py-2 rounded-lg bg-gray-950 border border-gray-700 focus:border-emerald-500 focus:outline-none text-sm text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-2">
                      Available Equipment
                    </label>
                    <div className="flex flex-wrap gap-2 mb-2.5">
                      {EQUIPMENT_OPTIONS.map((item) => {
                        const selected = fitnessForm.available_equipment.some(
                          (eq) => eq.toLowerCase() === item.toLowerCase()
                        );
                        return (
                          <button
                            key={item}
                            type="button"
                            onClick={() => handleToggleEquipment(item)}
                            className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
                              selected
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                                : 'bg-gray-950 text-gray-400 border-gray-800 hover:border-gray-700'
                            }`}
                          >
                            {item}
                          </button>
                        );
                      })}
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={customEquipment}
                        onChange={(e) => setCustomEquipment(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddCustomEquipment();
                          }
                        }}
                        placeholder="Add custom equipment..."
                        className="flex-1 px-3 py-1.5 rounded-lg bg-gray-950 border border-gray-700 focus:border-emerald-500 focus:outline-none text-xs text-white"
                      />
                      <button
                        type="button"
                        onClick={handleAddCustomEquipment}
                        className="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-xs font-medium text-emerald-400 border border-gray-700 cursor-pointer"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3.5">
                    <div className="p-3.5 rounded-lg bg-gray-950/70 border border-gray-800/80">
                      <p className="text-xs text-gray-400">Experience Level</p>
                      <p className="text-sm sm:text-base font-semibold text-white mt-1 capitalize">
                        {profile?.fitness_experience || 'Not set'}
                      </p>
                    </div>

                    <div className="p-3.5 rounded-lg bg-gray-950/70 border border-gray-800/80">
                      <p className="text-xs text-gray-400">Workout Location</p>
                      <p className="text-sm sm:text-base font-semibold text-white mt-1 capitalize">
                        {profile?.workout_location || 'Not set'}
                      </p>
                    </div>

                    <div className="p-3.5 rounded-lg bg-gray-950/70 border border-gray-800/80">
                      <p className="text-xs text-gray-400">Frequency</p>
                      <p className="text-sm sm:text-base font-semibold text-white mt-1">
                        {profile?.workout_days_per_week
                          ? `${profile.workout_days_per_week} days / week`
                          : 'Not set'}
                      </p>
                    </div>

                    <div className="p-3.5 rounded-lg bg-gray-950/70 border border-gray-800/80">
                      <p className="text-xs text-gray-400">Session Duration</p>
                      <p className="text-sm sm:text-base font-semibold text-white mt-1">
                        {profile?.workout_duration || profile?.exercise_duration || 'Not set'}
                      </p>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-lg bg-gray-950/70 border border-gray-800/80">
                    <p className="text-xs text-gray-400 mb-2">Available Equipment</p>
                    {equipmentList.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {equipmentList.map((item) => (
                          <span
                            key={item}
                            className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No equipment listed (Bodyweight)</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.section>

          {/* 4. Health Information Card */}
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.15 }}
            className="bg-gray-900 border border-gray-800 rounded-xl p-6 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between pb-4 mb-5 border-b border-gray-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                    <Heart className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Health Information</h3>
                    <p className="text-xs text-gray-400">Safety notes &amp; physical limitations</p>
                  </div>
                </div>

                {!editingHealth ? (
                  <button
                    type="button"
                    onClick={() => setEditingHealth(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 transition-colors cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-emerald-400" />
                    Edit
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCancelHealth}
                      disabled={savingHealth}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <X className="w-3.5 h-3.5" />
                      Cancel
                    </button>
                    <button
                      type="submit"
                      form="health-info-form"
                      disabled={savingHealth}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-gray-950 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <Save className="w-3.5 h-3.5" />
                      {savingHealth ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                )}
              </div>

              {editingHealth ? (
                <form id="health-info-form" onSubmit={handleSaveHealth} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">
                      Medical Conditions
                    </label>
                    <input
                      type="text"
                      value={healthForm.medical_conditions}
                      onChange={(e) =>
                        setHealthForm((prev) => ({ ...prev, medical_conditions: e.target.value }))
                      }
                      placeholder="e.g. Asthma, Hypertension, or None"
                      className="w-full px-3.5 py-2 rounded-lg bg-gray-950 border border-gray-700 focus:border-emerald-500 focus:outline-none text-sm text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">
                      Injuries
                    </label>
                    <input
                      type="text"
                      value={healthForm.injuries}
                      onChange={(e) =>
                        setHealthForm((prev) => ({ ...prev, injuries: e.target.value }))
                      }
                      placeholder="e.g. Previous rotator cuff strain"
                      className="w-full px-3.5 py-2 rounded-lg bg-gray-950 border border-gray-700 focus:border-emerald-500 focus:outline-none text-sm text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">
                      Joint Pain
                    </label>
                    <input
                      type="text"
                      value={healthForm.joint_pain}
                      onChange={(e) =>
                        setHealthForm((prev) => ({ ...prev, joint_pain: e.target.value }))
                      }
                      placeholder="e.g. Left knee discomfort"
                      className="w-full px-3.5 py-2 rounded-lg bg-gray-950 border border-gray-700 focus:border-emerald-500 focus:outline-none text-sm text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">
                      Exercise Restrictions
                    </label>
                    <input
                      type="text"
                      value={healthForm.exercises_to_avoid}
                      onChange={(e) =>
                        setHealthForm((prev) => ({ ...prev, exercises_to_avoid: e.target.value }))
                      }
                      placeholder="e.g. Heavy overhead press, box jumps"
                      className="w-full px-3.5 py-2 rounded-lg bg-gray-950 border border-gray-700 focus:border-emerald-500 focus:outline-none text-sm text-white"
                    />
                  </div>
                </form>
              ) : (
                <div className="space-y-3">
                  <div className="p-3.5 rounded-lg bg-gray-950/70 border border-gray-800/80">
                    <p className="text-xs text-gray-400">Medical Conditions</p>
                    <p className="text-sm text-gray-100 mt-1">
                      {health?.medical_conditions || 'None reported'}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-lg bg-gray-950/70 border border-gray-800/80">
                    <p className="text-xs text-gray-400">Injuries</p>
                    <p className="text-sm text-gray-100 mt-1">
                      {health?.injuries || 'None reported'}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-lg bg-gray-950/70 border border-gray-800/80">
                    <p className="text-xs text-gray-400">Joint Pain</p>
                    <p className="text-sm text-gray-100 mt-1">
                      {health?.joint_pain || 'None reported'}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-lg bg-gray-950/70 border border-gray-800/80">
                    <p className="text-xs text-gray-400">Exercise Restrictions</p>
                    <p className="text-sm text-gray-100 mt-1">
                      {health?.exercises_to_avoid || 'None reported'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </motion.section>

          {/* 5. Current Goals Card */}
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="bg-gray-900 border border-gray-800 rounded-xl p-6 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between pb-4 mb-5 border-b border-gray-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                    <Target className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Current Goals</h3>
                    <p className="text-xs text-gray-400">Training objectives &amp; timeline</p>
                  </div>
                </div>

                {!editingGoals ? (
                  <button
                    type="button"
                    onClick={() => setEditingGoals(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 transition-colors cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-emerald-400" />
                    Edit
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCancelGoals}
                      disabled={savingGoals}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <X className="w-3.5 h-3.5" />
                      Cancel
                    </button>
                    <button
                      type="submit"
                      form="goals-form"
                      disabled={savingGoals}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-gray-950 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <Save className="w-3.5 h-3.5" />
                      {savingGoals ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                )}
              </div>

              {editingGoals ? (
                <form id="goals-form" onSubmit={handleSaveGoals} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5">
                      Primary Goal
                    </label>
                    <select
                      value={goalsForm.primary_goal}
                      onChange={(e) =>
                        setGoalsForm((prev) => ({ ...prev, primary_goal: e.target.value }))
                      }
                      className="w-full px-3.5 py-2 rounded-lg bg-gray-950 border border-gray-700 focus:border-emerald-500 focus:outline-none text-sm text-white"
                    >
                      <option value="">Select primary goal</option>
                      {GOAL_OPTIONS.map((opt) => (
                        <option key={opt} value={opt.toLowerCase().replace(/\s+/g, '_')}>
                          {opt}
                        </option>
                      ))}
                      {goalsForm.primary_goal &&
                        !GOAL_OPTIONS.some(
                          (opt) => opt.toLowerCase().replace(/\s+/g, '_') === goalsForm.primary_goal
                        ) && (
                          <option value={goalsForm.primary_goal}>
                            {formatGoalLabel(goalsForm.primary_goal)}
                          </option>
                        )}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5">
                      Secondary Goal
                    </label>
                    <input
                      type="text"
                      value={goalsForm.secondary_goal}
                      onChange={(e) =>
                        setGoalsForm((prev) => ({ ...prev, secondary_goal: e.target.value }))
                      }
                      placeholder="e.g. Improve core stability"
                      className="w-full px-3.5 py-2 rounded-lg bg-gray-950 border border-gray-700 focus:border-emerald-500 focus:outline-none text-sm text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5">
                      Target Timeline
                    </label>
                    <input
                      type="text"
                      value={goalsForm.target_timeline}
                      onChange={(e) =>
                        setGoalsForm((prev) => ({ ...prev, target_timeline: e.target.value }))
                      }
                      placeholder="e.g. 12 weeks"
                      className="w-full px-3.5 py-2 rounded-lg bg-gray-950 border border-gray-700 focus:border-emerald-500 focus:outline-none text-sm text-white"
                    />
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-gray-950/70 border border-gray-800/80">
                    <p className="text-xs text-gray-400 mb-2">Primary Goal</p>
                    {goals?.primary_goal ? (
                      <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        <Target className="w-4 h-4" />
                        {formatGoalLabel(goals.primary_goal)}
                      </span>
                    ) : (
                      <p className="text-sm text-gray-500">No primary goal set</p>
                    )}
                  </div>

                  <div className="p-3.5 rounded-lg bg-gray-950/70 border border-gray-800/80">
                    <p className="text-xs text-gray-400">Secondary Goal</p>
                    <p className="text-sm sm:text-base font-medium text-white mt-1">
                      {goals?.secondary_goal ? formatGoalLabel(goals.secondary_goal) : 'Not set'}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-lg bg-gray-950/70 border border-gray-800/80 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-400">Target Timeline</p>
                      <p className="text-sm sm:text-base font-medium text-white mt-1">
                        {goals?.target_timeline || 'Flexible'}
                      </p>
                    </div>
                    <Calendar className="w-5 h-5 text-emerald-400/70" />
                  </div>
                </div>
              )}
            </div>
          </motion.section>
        </div>

        {/* 6. Actions Section */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.25 }}
          className="bg-gray-900 border border-gray-800 rounded-xl p-6"
        >
          <div className="pb-4 mb-5 border-b border-gray-800">
            <h3 className="text-lg font-semibold text-white">Workout &amp; Account Actions</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Update your AI training plan, export your workout logs, or manage your session.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <button
              type="button"
              onClick={handleRegeneratePlan}
              disabled={regeneratingPlan}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-semibold text-sm transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {regeneratingPlan ? (
                <>
                  <span className="w-4 h-4 border-2 border-gray-950 border-t-transparent rounded-full animate-spin" />
                  Generating Plan...
                </>
              ) : (
                <>
                  <Dumbbell className="w-4 h-4" />
                  Regenerate Workout Plan
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleExportHistory}
              disabled={exportingHistory}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-100 border border-gray-700 font-medium text-sm transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              {exportingHistory ? 'Exporting...' : 'Export Workout History'}
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-100 border border-gray-700 font-medium text-sm transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4 text-gray-300" />
              Logout
            </button>

            <button
              type="button"
              onClick={handleOpenDeleteModal}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 font-medium text-sm transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              Delete Account
            </button>
          </div>
        </motion.section>
      </div>

      {/* Delete Account Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
            onClick={() => !deletingAccount && setShowDeleteModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-gray-900 border border-red-500/30 rounded-xl p-6 shadow-2xl space-y-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20">
                    <Trash2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Delete Account</h3>
                    <p className="text-xs text-red-400">This action cannot be undone</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => !deletingAccount && setShowDeleteModal(false)}
                  className="text-gray-400 hover:text-gray-200 cursor-pointer"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-3.5 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-200 leading-relaxed">
                Deleting your FitCoach AI account will permanently remove your profile, health
                records, AI workout plans, workout session logs, and progress history.
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-2">
                  Type <span className="font-bold text-red-400">DELETE</span> to confirm
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="DELETE"
                  autoFocus
                  className="w-full px-3.5 py-2.5 rounded-lg bg-gray-950 border border-gray-700 focus:border-red-500 focus:outline-none text-sm text-white tracking-wider"
                />
              </div>

              {deleteError && (
                <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                  {deleteError}
                </p>
              )}

              <div className="flex items-center justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  disabled={deletingAccount}
                  className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200 text-sm font-medium border border-gray-700 transition-colors cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={deleteConfirmText !== 'DELETE' || deletingAccount}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-semibold transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Trash2 className="w-4 h-4" />
                  {deletingAccount ? 'Deleting...' : 'Permanently Delete'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

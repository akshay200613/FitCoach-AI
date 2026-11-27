import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, Eye, EyeOff, Dumbbell, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../AuthContext';

function getInputClassName(hasError, hasRightToggle = false) {
  const paddingRight = hasRightToggle ? 'pr-11' : 'pr-4';
  const stateClasses = hasError
    ? 'border-red-500/70 focus:ring-red-500/40 focus:border-red-500'
    : 'border-gray-800 focus:ring-emerald-500/40 focus:border-emerald-500';

  return `w-full bg-gray-950/80 border rounded-xl pl-10 ${paddingRight} py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 transition-all disabled:opacity-60 ${stateClasses}`;
}

function PasswordToggle({ visible, onToggle, label }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={label}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-emerald-400 focus:outline-none transition-colors p-1"
    >
      {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
    </button>
  );
}

function AuthForm({ mode }) {
  const isRegister = mode === 'register';
  const navigate = useNavigate();
  const { login, register } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const firstInputRef = useRef(null);

  useEffect(() => {
    firstInputRef.current?.focus();
  }, []);

  const validate = () => {
    const errors = {};
    const trimmedEmail = email.trim();
    const trimmedName = fullName.trim();

    if (isRegister && !trimmedName) {
      errors.fullName = 'Please enter your full name.';
    } else if (isRegister && trimmedName.length < 2) {
      errors.fullName = 'Full name must be at least 2 characters.';
    }

    if (!trimmedEmail) {
      errors.email = 'Please enter your email address.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      errors.email = 'Please enter a valid email address.';
    }

    if (!password) {
      errors.password = 'Please enter your password.';
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters.';
    }

    if (isRegister) {
      if (!confirmPassword) {
        errors.confirmPassword = 'Please confirm your password.';
      } else if (password !== confirmPassword) {
        errors.confirmPassword = 'Passwords do not match.';
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const clearFieldError = (field) => {
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
    if (serverError) setServerError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    if (!validate()) return;

    setSubmitting(true);
    try {
      if (isRegister) {
        await register(email.trim(), password, fullName.trim());
        navigate('/onboarding');
      } else {
        const loggedInUser = await login(email.trim(), password);
        if (loggedInUser?.onboarding_completed) {
          navigate('/dashboard');
        } else {
          navigate('/onboarding');
        }
      }
    } catch (err) {
      setServerError(err?.message || 'Authentication failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: isRegister ? 12 : -12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: isRegister ? -12 : 12 }}
      transition={{ duration: 0.2 }}
    >
      <h1 className="text-xl sm:text-2xl font-semibold text-white mb-1">
        {isRegister ? 'Create an account' : 'Sign in to FitCoach AI'}
      </h1>
      <p className="text-sm text-gray-400 mb-6">
        {isRegister
          ? 'Enter your details below to get started.'
          : 'Enter your credentials to access your dashboard.'}
      </p>

      <AnimatePresence>
        {serverError && (
          <motion.div
            initial={{ opacity: 0, y: -8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -8, height: 0 }}
            transition={{ duration: 0.2 }}
            className="mb-5 overflow-hidden"
          >
            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-xl bg-red-500/10 border border-red-500/30 px-3.5 py-3 text-sm text-red-300"
            >
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{serverError}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {isRegister && (
          <div>
            <label
              htmlFor="fullName"
              className="block text-sm font-medium text-gray-300 mb-1.5"
            >
              Full Name
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                ref={isRegister ? firstInputRef : undefined}
                id="fullName"
                name="fullName"
                type="text"
                autoComplete="name"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  clearFieldError('fullName');
                }}
                disabled={submitting}
                placeholder="Alex Morgan"
                className={getInputClassName(Boolean(fieldErrors.fullName))}
              />
            </div>
            {fieldErrors.fullName && (
              <p className="mt-1.5 text-xs text-red-400">{fieldErrors.fullName}</p>
            )}
          </div>
        )}

        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-300 mb-1.5"
          >
            Email Address
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              ref={!isRegister ? firstInputRef : undefined}
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                clearFieldError('email');
              }}
              disabled={submitting}
              placeholder="you@example.com"
              className={getInputClassName(Boolean(fieldErrors.email))}
            />
          </div>
          {fieldErrors.email && (
            <p className="mt-1.5 text-xs text-red-400">{fieldErrors.email}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-300 mb-1.5"
          >
            Password
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete={isRegister ? 'new-password' : 'current-password'}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                clearFieldError('password');
              }}
              disabled={submitting}
              placeholder="••••••••"
              className={getInputClassName(Boolean(fieldErrors.password), true)}
            />
            <PasswordToggle
              visible={showPassword}
              onToggle={() => setShowPassword((prev) => !prev)}
              label={showPassword ? 'Hide password' : 'Show password'}
            />
          </div>
          {fieldErrors.password && (
            <p className="mt-1.5 text-xs text-red-400">{fieldErrors.password}</p>
          )}
        </div>

        {isRegister && (
          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-gray-300 mb-1.5"
            >
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  clearFieldError('confirmPassword');
                }}
                disabled={submitting}
                placeholder="••••••••"
                className={getInputClassName(Boolean(fieldErrors.confirmPassword), true)}
              />
              <PasswordToggle
                visible={showConfirmPassword}
                onToggle={() => setShowConfirmPassword((prev) => !prev)}
                label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
              />
            </div>
            {fieldErrors.confirmPassword && (
              <p className="mt-1.5 text-xs text-red-400">
                {fieldErrors.confirmPassword}
              </p>
            )}
          </div>
        )}

        <motion.button
          whileTap={{ scale: submitting ? 1 : 0.99 }}
          type="submit"
          disabled={submitting}
          className="w-full mt-2 bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-gray-950 font-semibold rounded-xl py-2.5 px-4 text-sm flex items-center justify-center gap-2 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>{isRegister ? 'Creating account...' : 'Signing in...'}</span>
            </>
          ) : (
            <>
              <span>{isRegister ? 'Create Account' : 'Sign In'}</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </motion.button>
      </form>

      <div className="mt-6 pt-5 border-t border-gray-800 text-center text-sm text-gray-400">
        {isRegister ? (
          <>
            Already have an account?{' '}
            <Link
              to="/login"
              className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
            >
              Sign in
            </Link>
          </>
        ) : (
          <>
            Don&apos;t have an account?{' '}
            <Link
              to="/register"
              className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
            >
              Create one
            </Link>
          </>
        )}
      </div>
    </motion.div>
  );
}

export default function Auth({ mode = 'login' }) {
  const isRegister = mode === 'register';

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col justify-center items-center px-4 py-10 relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[520px] h-[520px] rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full bg-emerald-400/5 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-full max-w-md relative z-10"
      >
        <div className="flex flex-col items-center mb-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2.5 group focus:outline-none"
          >
            <div className="w-11 h-11 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500/25 transition-colors">
              <Dumbbell className="w-6 h-6" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-white">
              FitCoach <span className="text-emerald-400">AI</span>
            </span>
          </Link>
          <p className="mt-2 text-sm text-gray-400 text-center">
            {isRegister
              ? 'Create your account to start your personalized fitness journey'
              : 'Welcome back! Sign in to continue your training'}
          </p>
        </div>

        <motion.div
          layout
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl shadow-black/50 p-6 sm:p-8"
        >
          <AnimatePresence mode="wait">
            <AuthForm key={mode} mode={mode} />
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </div>
  );
}

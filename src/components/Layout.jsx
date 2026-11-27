import { useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home,
  Dumbbell,
  Play,
  TrendingUp,
  Bot,
  Apple,
  User,
  Menu,
  X,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../AuthContext';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: Home },
  { to: '/plan', label: 'My Plan', icon: Dumbbell },
  { to: '/workout', label: 'Workout', icon: Play },
  { to: '/progress', label: 'Progress', icon: TrendingUp },
  { to: '/coach', label: 'AI Coach', icon: Bot },
  { to: '/nutrition', label: 'Nutrition', icon: Apple },
  { to: '/profile', label: 'Profile', icon: User },
];

const moreItems = [
  { to: '/coach', label: 'AI Coach', icon: Bot },
  { to: '/nutrition', label: 'Nutrition', icon: Apple },
  { to: '/profile', label: 'Profile', icon: User },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const [moreOpen, setMoreOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const displayName = user?.full_name || user?.name || user?.email || 'Athlete';
  const isMoreRouteActive = moreItems.some((item) =>
    location.pathname.startsWith(item.to)
  );

  const handleLogout = () => {
    setMoreOpen(false);
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col fixed inset-y-0 left-0 z-30 w-64 bg-gray-900 border-r border-gray-800">
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-800">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-400">
            <Dumbbell className="w-5 h-5" />
          </div>
          <span className="text-xl font-bold tracking-tight text-emerald-400">
            FitCoach AI
          </span>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto" aria-label="Main navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-r-lg text-sm font-medium transition-colors duration-150 border-l-2 ${
                    isActive
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800 border-transparent'
                  }`
                }
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* User Info & Logout */}
        <div className="p-4 border-t border-gray-800 space-y-3">
          <div className="flex items-center gap-3 px-2">
            <div className="flex items-center justify-center w-9 h-9 rounded-full bg-emerald-500/15 text-emerald-400 shrink-0">
              <User className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-white truncate">
                {displayName}
              </p>
              {user?.email && user?.full_name && (
                <p className="text-xs text-gray-400 truncate">{user.email}</p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-400 hover:text-red-400 hover:bg-gray-800 transition-colors duration-150 cursor-pointer"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile "More" Slide-up Overlay */}
      <AnimatePresence>
        {moreOpen && (
          <div className="fixed inset-0 z-30 lg:hidden">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMoreOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            />

            {/* Slide-up Sheet */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed bottom-16 inset-x-0 bg-gray-900 border-t border-gray-800 rounded-t-2xl p-4 shadow-2xl"
            >
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-800">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-500/15 text-emerald-400 shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-medium text-white truncate">
                    {displayName}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setMoreOpen(false)}
                  aria-label="Close menu"
                  className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-1">
                {moreItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={() => setMoreOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors ${
                          isActive
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : 'text-gray-300 hover:text-white hover:bg-gray-800'
                        }`
                      }
                    >
                      <Icon className="w-5 h-5 shrink-0" />
                      <span>{item.label}</span>
                    </NavLink>
                  );
                })}

                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-red-400 hover:bg-gray-800 transition-colors cursor-pointer"
                >
                  <LogOut className="w-5 h-5 shrink-0" />
                  <span>Logout</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Mobile Bottom Nav */}
      <nav
        aria-label="Mobile navigation"
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 h-16 bg-gray-900 border-t border-gray-800 px-2 flex items-center justify-around"
      >
        <NavLink
          to="/dashboard"
          onClick={() => setMoreOpen(false)}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center gap-1 px-2 py-1 text-xs font-medium transition-colors ${
              isActive ? 'text-emerald-400' : 'text-gray-400 hover:text-gray-200'
            }`
          }
        >
          <Home className="w-5 h-5" />
          <span>Dashboard</span>
        </NavLink>

        <NavLink
          to="/plan"
          onClick={() => setMoreOpen(false)}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center gap-1 px-2 py-1 text-xs font-medium transition-colors ${
              isActive ? 'text-emerald-400' : 'text-gray-400 hover:text-gray-200'
            }`
          }
        >
          <Dumbbell className="w-5 h-5" />
          <span>Plan</span>
        </NavLink>

        <NavLink
          to="/workout"
          onClick={() => setMoreOpen(false)}
          aria-label="Workout"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center -mt-4 transition-transform active:scale-95 ${
              isActive ? 'text-emerald-400' : 'text-gray-400'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <div
                className={`flex items-center justify-center w-12 h-12 rounded-full bg-emerald-500 text-gray-950 shadow-lg shadow-emerald-500/25 transition-colors ${
                  isActive ? 'ring-2 ring-emerald-400 ring-offset-2 ring-offset-gray-900' : 'hover:bg-emerald-400'
                }`}
              >
                <Play className="w-6 h-6 fill-current ml-0.5" />
              </div>
              <span
                className={`text-[11px] font-medium mt-0.5 ${
                  isActive ? 'text-emerald-400' : 'text-gray-400'
                }`}
              >
                Workout
              </span>
            </>
          )}
        </NavLink>

        <NavLink
          to="/progress"
          onClick={() => setMoreOpen(false)}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center gap-1 px-2 py-1 text-xs font-medium transition-colors ${
              isActive ? 'text-emerald-400' : 'text-gray-400 hover:text-gray-200'
            }`
          }
        >
          <TrendingUp className="w-5 h-5" />
          <span>Progress</span>
        </NavLink>

        <button
          type="button"
          onClick={() => setMoreOpen((prev) => !prev)}
          className={`flex flex-col items-center justify-center gap-1 px-2 py-1 text-xs font-medium transition-colors cursor-pointer ${
            moreOpen || isMoreRouteActive
              ? 'text-emerald-400'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          {moreOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          <span>More</span>
        </button>
      </nav>

      {/* Main Content */}
      <main className="lg:ml-64 pb-20 lg:pb-0 min-h-screen bg-gray-950">
        <div className="p-4 lg:p-8 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

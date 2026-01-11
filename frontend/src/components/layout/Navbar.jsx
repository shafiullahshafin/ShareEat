import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Leaf, LogOut, User as UserIcon, LayoutDashboard, Heart, Users, Utensils, Gift, Settings } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../services/api';
import UserProfileModal from '../common/UserProfileModal';

function Navbar() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const adminUrl = API_BASE_URL.replace(/\/api\/?$/, '/admin/');

  const handleLogout = () => {
    navigate('/logout');
  };

  // Hides navigation on auth pages.
  if (['/login', '/register'].includes(location.pathname)) {
    return null;
  }
  
  // Hides navigation if unauthenticated.
  if (!user) return null;

  const isActive = (path) => {
    const [pathname, search] = path.split('?');
    if (search) {
      return location.pathname === pathname && location.search.includes(search);
    }
    // Checks if current path matches plain dashboard link.
    if (path === '/dashboard' && location.search.includes('tab=')) {
      return false;
    }
    return location.pathname === path;
  };

  const navLinkClass = (path) => {
    const baseClass = "inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200";
    if (isActive(path)) {
      return `${baseClass} bg-brand-600 text-white shadow-lg shadow-brand-500/20`;
    }
    return `${baseClass} text-dark-400 hover:text-white hover:bg-dark-800`;
  };

  return (
    <>
      <nav className="bg-dark-900 border-b border-dark-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Renders logo. */}
            <div className="flex items-center space-x-3">
              <Leaf className="h-6 w-6 text-brand-500" />
              <span className="text-xl font-display font-bold text-white tracking-tight">ShareEat</span>
            </div>

            {/* Renders navigation links. */}
            <div className="hidden md:flex space-x-1">
              <Link to="/dashboard" className={navLinkClass('/dashboard')}>
                Dashboard
              </Link>
              
              {(user.role === 'admin' || user.role === 'recipient') && (
                <Link to="/donors" className={navLinkClass('/donors')}>
                  Donors
                </Link>
              )}
              
              {(user.role === 'admin' || user.role === 'donor') && (
                <Link to="/recipients" className={navLinkClass('/recipients')}>
                  Recipients
                </Link>
              )}
              
              {user.role !== 'volunteer' && (
                <Link to="/food-items" className={navLinkClass('/food-items')}>
                  Food Items
                </Link>
              )}
              
              {user.role !== 'volunteer' ? (
                <Link to="/donations" className={navLinkClass('/donations')}>
                  Donations
                </Link>
              ) : (
                <Link to="/dashboard?tab=deliveries" className={`${navLinkClass('/dashboard?tab=deliveries')} ml-8`}>
                  My Deliveries
                </Link>
              )}
            </div>

            {/* Renders user actions. */}
            <div className="flex items-center space-x-4">
              {user?.is_staff && (
                <a
                  href={adminUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg text-dark-400 hover:text-white hover:bg-dark-800 transition-all duration-200"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Admin
                </a>
              )}
              
              {/* Renders divider. */}
              <div className="h-6 w-px bg-dark-800 hidden md:block"></div>

              <button  
                onClick={() => setIsProfileOpen(true)}
                className="flex items-center space-x-3 hover:bg-dark-800 rounded-full py-1 pr-3 pl-1 transition-colors group"
              >
                <div className="w-8 h-8 rounded-full bg-dark-800 group-hover:bg-dark-700 flex items-center justify-center text-brand-500 font-bold text-sm ring-2 ring-dark-700 group-hover:ring-brand-500/50 transition-all">
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <span className="hidden md:inline text-sm font-medium text-dark-200 group-hover:text-white transition-colors">
                  {user.username}
                </span>
              </button>
              
              <button 
                onClick={handleLogout}
                className="p-2 text-dark-400 hover:text-accent-red hover:bg-dark-800 rounded-lg transition-all duration-200"
                title="Sign Out"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <UserProfileModal 
        isOpen={isProfileOpen} 
        onClose={() => setIsProfileOpen(false)} 
        user={user} 
      />
    </>
  );
}

export default Navbar;
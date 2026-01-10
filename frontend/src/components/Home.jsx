import { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { analyticsAPI } from '../services/api';
import { Leaf, Heart, Users, ArrowRight, Zap, ShieldCheck, BarChart3, Utensils, Handshake, ChevronDown, Menu, X } from 'lucide-react';

const Home = () => {
  const { user } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [stats, setStats] = useState({
    meals: '0',
    waste: '0',
    co2: '0',
    donations: '0'
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await analyticsAPI.getPublicImpact();
        const data = response.data;
        setStats({
          meals: data.impact.meals_provided.toLocaleString(),
          waste: data.impact.waste_prevented_kg.toLocaleString(),
          co2: data.impact.co2_saved_kg.toLocaleString(),
          donations: data.donations.total.toLocaleString()
        });
      } catch (error) {
        console.error('Failed to fetch public impact stats:', error);
      }
    };
    
    fetchStats();
  }, []);

  const roleDetails = {
    donor: {
      title: "For Donors",
      description: "Easily post surplus food details. Our system matches you with nearby verified volunteers or recipients. Track your donation's journey and impact in real-time.",
      icon: <Heart className="h-12 w-12 text-brand-500 mb-4" />
    },
    volunteer: {
      title: "For Volunteers",
      description: "Receive instant alerts for food pickups near you. Collect packaged food from donors and deliver it to designated communities or shelters. Earn trust points for every delivery.",
      icon: <Users className="h-12 w-12 text-accent-orange mb-4" />
    },
    recipient: {
      title: "For Recipients",
      description: "Verified NGOs, orphanages, and community leaders can request food support. Get notified when donations are on the way and confirm receipt to ensure transparency.",
      icon: <Handshake className="h-12 w-12 text-accent-green mb-4" />
    }
  };

  const handleRoleClick = (role) => {
    setSelectedRole(role);
    setIsDropdownOpen(false);
  };

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="h-screen bg-dark-950 font-sans text-white selection:bg-brand-500/30 flex flex-col overflow-hidden">
      {/* Role Info Modal */}
      {selectedRole && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-dark-900 border border-dark-800 rounded-xl p-8 max-w-md w-full relative shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <button 
              onClick={() => setSelectedRole(null)}
              className="absolute top-4 right-4 text-dark-400 hover:text-white transition-colors"
            >
              <span className="text-2xl">&times;</span>
            </button>
            <div className="flex flex-col items-center text-center">
              {roleDetails[selectedRole].icon}
              <h3 className="text-2xl font-bold text-white mb-3">{roleDetails[selectedRole].title}</h3>
              <p className="text-dark-300 leading-relaxed">
                {roleDetails[selectedRole].description}
              </p>
              <button 
                onClick={() => setSelectedRole(null)}
                className="mt-6 bg-brand-600 hover:bg-brand-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors w-full"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}

      <nav className="bg-dark-950 border-b border-dark-800 shrink-0 z-50">
          <div className="w-full max-w-[95%] mx-auto px-6 md:px-12">
            <div className="flex justify-between h-16 items-center">
              <div className="flex items-center space-x-3">
                <div className="bg-brand-600/20 p-1.5 rounded-lg border border-brand-500/20">
                  <Leaf className="h-5 w-5 text-brand-500" />
                </div>
                <span className="text-xl font-display font-bold text-white tracking-tight">ShareEat</span>
              </div>
              
              {/* Desktop Nav */}
              <div className="hidden md:flex items-center space-x-4">
                 <div className="relative">
                   <button 
                     onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                     onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)}
                     className="flex items-center space-x-1 bg-dark-800 border border-dark-700 hover:bg-dark-700 hover:border-dark-600 text-white px-5 py-2 rounded-lg text-sm font-semibold transition-all shadow-sm hover:shadow-md focus:outline-none"
                   >
                     <span>How It Works</span>
                     <ChevronDown className={`h-4 w-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                   </button>
                   
                   {/* Dropdown Menu */}
                   {isDropdownOpen && (
                     <div className="absolute top-full right-0 mt-2 w-48 bg-dark-900 border border-dark-800 rounded-lg shadow-xl z-50 overflow-hidden">
                       <div className="py-1">
                         <button onClick={() => handleRoleClick('donor')} className="block w-full text-left px-4 py-2 text-sm text-dark-300 hover:bg-dark-800 hover:text-white transition-colors">
                           For Donors
                         </button>
                         <button onClick={() => handleRoleClick('volunteer')} className="block w-full text-left px-4 py-2 text-sm text-dark-300 hover:bg-dark-800 hover:text-white transition-colors">
                           For Volunteers
                         </button>
                         <button onClick={() => handleRoleClick('recipient')} className="block w-full text-left px-4 py-2 text-sm text-dark-300 hover:bg-dark-800 hover:text-white transition-colors">
                           For Recipients
                         </button>
                       </div>
                     </div>
                   )}
                 </div>

                <Link to="/login" className="bg-brand-600 hover:bg-brand-700 text-white px-5 py-2 rounded-lg text-sm font-semibold transition-all shadow-lg shadow-brand-500/20 hover:-translate-y-0.5">
                  Log in
                </Link>
                <Link to="/register" className="bg-brand-600 hover:bg-brand-700 text-white px-5 py-2 rounded-lg text-sm font-semibold transition-all shadow-lg shadow-brand-500/20 hover:-translate-y-0.5">
                  Get Started
                </Link>
              </div>

              {/* Mobile Menu Button */}
              <div className="md:hidden">
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="text-dark-200 hover:text-white p-2"
                >
                  {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </button>
              </div>
            </div>
          </div>

          {/* Mobile Menu Overlay */}
          {isMobileMenuOpen && (
            <div className="md:hidden bg-dark-900 border-t border-dark-800 px-6 py-4 space-y-4 shadow-xl animate-in slide-in-from-top-5">
              <div className="space-y-2">
                <p className="text-sm font-semibold text-dark-400 px-2 mb-2">How It Works</p>
                <button onClick={() => handleRoleClick('donor')} className="block w-full text-left px-4 py-2 text-sm text-dark-200 hover:bg-dark-800 rounded-lg transition-colors">
                  For Donors
                </button>
                <button onClick={() => handleRoleClick('volunteer')} className="block w-full text-left px-4 py-2 text-sm text-dark-200 hover:bg-dark-800 rounded-lg transition-colors">
                  For Volunteers
                </button>
                <button onClick={() => handleRoleClick('recipient')} className="block w-full text-left px-4 py-2 text-sm text-dark-200 hover:bg-dark-800 rounded-lg transition-colors">
                  For Recipients
                </button>
              </div>
              <div className="pt-4 border-t border-dark-800 flex flex-col space-y-3">
                <Link to="/login" className="text-center bg-brand-600 hover:bg-brand-700 text-white px-5 py-2 rounded-lg text-sm font-semibold transition-all shadow-lg shadow-brand-500/20">
                  Log in
                </Link>
                <Link to="/register" className="text-center bg-brand-600 hover:bg-brand-700 text-white px-5 py-2 rounded-lg text-sm font-semibold transition-all shadow-lg shadow-brand-500/20">
                  Get Started
                </Link>
              </div>
            </div>
          )}
        </nav>

      {/* Main Content */}
      <main className="flex-grow flex flex-col justify-center relative z-10 w-full max-w-[95%] mx-auto px-6 md:px-12">
        
        {/* Hero Section */}
        <div className="text-center max-w-5xl mx-auto mb-8">
          {/* Status Badge */}
          <div className="inline-flex items-center space-x-2 bg-dark-900 border border-dark-800 rounded-md px-3 py-1 mb-6 shadow-sm">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500"></span>
            </span>
            <span className="text-xs font-medium text-dark-300">Live Network Status: Active</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-display font-bold text-white leading-tight mb-6">
            Zero-Waste <span className="text-brand-500">Food Redistribution</span> Network
          </h1>

          <p className="text-lg text-dark-400 mb-8 leading-relaxed max-w-2xl mx-auto">
            Connecting surplus food with communities in need across Bangladesh. Bridging the gap between donors, volunteers, and recipients.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4 mb-10">
            <Link to="/register" className="inline-flex items-center justify-center px-3 py-3 w-full sm:w-auto text-base font-semibold rounded-lg text-white bg-brand-600 hover:bg-brand-700 transition-all shadow-xl shadow-brand-500/20 hover:-translate-y-1">
              Start Donating
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <Link to="/food-items" className="inline-flex items-center justify-center px-3 py-3 w-full sm:w-auto text-base font-semibold rounded-lg text-white bg-brand-600 hover:bg-brand-700 transition-all shadow-xl shadow-brand-500/20 hover:-translate-y-1">
              Find Food
            </Link>
          </div>

           {/* Stats Row - Compact Cards */}
           <div className="grid grid-cols-2 md:grid-cols-4 gap-3 border-t border-dark-800/50 pt-6">
              {[
                { label: 'Meals Provided', value: stats.meals, icon: <Utensils className="h-4 w-4 text-brand-500" /> },
                { label: 'Waste Prevented (kg)', value: stats.waste, icon: <Zap className="h-4 w-4 text-accent-green" /> },
                { label: 'CO2 Saved (kg)', value: stats.co2, icon: <Leaf className="h-4 w-4 text-accent-green" /> },
                { label: 'Total Donations', value: stats.donations, icon: <Heart className="h-4 w-4 text-accent-red" /> },
              ].map((stat, index) => (
                <div key={index} className="bg-dark-800/50 border border-dark-700/50 rounded-lg p-3 flex items-center justify-center space-x-3 hover:bg-dark-800 hover:border-dark-600 transition-all shadow-sm hover:shadow-md group">
                  <div className="p-2 bg-dark-900 rounded-md border border-dark-800 group-hover:border-dark-700 transition-colors shrink-0">
                    {stat.icon}
                  </div>
                  <div className="text-left">
                    <div className="text-lg font-bold text-white leading-none">{stat.value}</div>
                    <div className="text-[10px] text-dark-400 uppercase tracking-wider font-medium mt-0.5">{stat.label}</div>
                  </div>
                </div>
              ))}
           </div>
        </div>

        {/* Feature Cards - 3 Column Grid (Standard Layout) */}
        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto w-full">
          {[
            { 
              title: 'Real-time Tracking', 
              desc: 'Monitor donations live.',
              icon: <Zap className="h-5 w-5 text-accent-orange" />
            },
            { 
              title: 'Verified Partners', 
              desc: 'Vetted NGOs & charities.',
              icon: <ShieldCheck className="h-5 w-5 text-accent-green" />
            },
            { 
              title: 'Impact Analytics', 
              desc: 'Track CO2 & meals saved.',
              icon: <BarChart3 className="h-5 w-5 text-brand-500" />
            }
          ].map((feature, i) => (
            <div key={i} className="bg-dark-900 p-5 rounded-lg border border-dark-800 hover:border-brand-500/30 transition-all hover:-translate-y-1 flex items-start space-x-4">
              <div className="mt-1">
                {feature.icon}
              </div>
              <div>
                <h3 className="text-base font-bold text-white mb-1">{feature.title}</h3>
                <p className="text-sm text-dark-400 leading-snug">{feature.desc}</p>
              </div>
            </div>
          ))}
        </div>

      </main>

      {/* Footer */}
      <footer className="bg-dark-950 border-t border-dark-800 py-4 shrink-0">
        <div className="w-full max-w-[95%] mx-auto px-6 md:px-12 text-center">
          <div className="text-dark-500 text-sm">
            &copy; {new Date().getFullYear()} ShareEat.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;

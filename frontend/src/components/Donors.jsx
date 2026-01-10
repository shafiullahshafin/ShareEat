import { useState, useEffect } from 'react';
import { donorsAPI } from '../services/api';
import { Building2, Star, MapPin, Search } from 'lucide-react';

const Donors = () => {
  const [donors, setDonors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDonors();
  }, []);

  const fetchDonors = async () => {
    try {
      const response = await donorsAPI.getAll();
      setDonors(response.data.results || response.data);
    } catch (error) {
      console.error('Error fetching donors:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-dark-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-brand-500 mx-auto mb-4"></div>
          <p className="text-lg font-medium text-dark-400">Loading donors...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-900 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-dark-800 shadow-sm border-b border-dark-700 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
            <Building2 className="h-40 w-40 text-brand-500 transform -rotate-12 translate-x-10" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                 <div className="h-1 w-10 bg-brand-500 rounded-full"></div>
                 <span className="text-brand-500 font-semibold tracking-wider text-sm uppercase">Our Network</span>
              </div>
              <h2 className="text-4xl font-display font-bold text-white tracking-tight">Generosity Partners</h2>
              <p className="text-dark-400 mt-2 text-lg max-w-2xl font-light">
                Forward-thinking businesses bridging the gap between surplus and scarcity.
              </p>
            </div>
            {/* Search/Filter placeholder */}
            <div className="w-full md:w-auto">
              <div className="relative group">
                <input 
                  type="text" 
                  placeholder="Find a partner..." 
                  className="bg-dark-900/50 border border-dark-600 text-dark-200 rounded-xl pl-12 pr-6 py-3 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent w-full md:w-80 transition-all shadow-inner"
                />
                <Search className="absolute left-4 top-3.5 h-5 w-5 text-dark-400 group-focus-within:text-brand-500 transition-colors" />
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {donors.map((donor) => (
            <div key={donor.id} className="bg-dark-800 rounded-xl shadow-lg border border-dark-700 hover:shadow-xl hover:border-brand-500/50 transition-all duration-300 p-6 group">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <div className="bg-brand-500/10 p-3 rounded-lg border border-brand-500/20 group-hover:bg-brand-500/20 transition-colors">
                    <Building2 className="h-6 w-6 text-brand-500" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-semibold text-white group-hover:text-brand-400 transition-colors">{donor.business_name}</h3>
                    <p className="text-sm text-dark-400">{donor.donor_type_display}</p>
                  </div>
                </div>
                {donor.is_verified && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-accent-green/10 text-accent-green border border-accent-green/20">
                    Verified
                  </span>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-center text-sm text-dark-300 bg-dark-900/50 p-2 rounded-lg">
                  <Star className="h-4 w-4 text-accent-orange mr-2 fill-accent-orange" />
                  <span className="text-white font-semibold text-sm mr-1">
                     {(Number(donor.rating) || 0).toFixed(1)}
                  </span>
                  <span className="text-dark-500 text-xs">/ 5.0</span>
                </div>
                <div className="flex items-center text-sm text-dark-400">
                  <MapPin className="h-4 w-4 text-dark-500 mr-2" />
                  <span className="truncate">{donor.location || 'Location not specified'}</span>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-dark-700">
                <div className="flex justify-between text-sm items-center">
                  <span className="text-dark-400">Total Donations</span>
                  <span className="font-bold text-white bg-dark-900 px-3 py-1 rounded-full border border-dark-600">{donor.total_donations}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {donors.length === 0 && (
          <div className="text-center py-20 bg-dark-800 rounded-xl border border-dark-700 border-dashed">
            <Building2 className="h-16 w-16 text-dark-600 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-white">No donors found</h3>
            <p className="text-dark-400 mt-2">Check back later for new donor registrations.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Donors;
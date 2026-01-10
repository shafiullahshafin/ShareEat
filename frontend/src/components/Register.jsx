import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Leaf, User, Building, Truck, Heart } from 'lucide-react';

const Register = () => {
  const [role, setRole] = useState('donor');
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: '',
    first_name: '',
    last_name: '',
    phone: '',
    address: '',
    // Donor fields.
    business_name: '',
    donor_type: 'restaurant',
    license_number: '',
    // Recipient fields.
    organization_name: '',
    recipient_type: 'ngo',
    capacity: '',
    current_occupancy: '',
    // Volunteer fields.
    vehicle_type: 'bicycle',
  });
  const [error, setError] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Prepares role-specific data.
    const commonFields = {
      username: formData.username,
      password: formData.password,
      email: formData.email,
      first_name: formData.first_name,
      last_name: formData.last_name,
      phone: formData.phone,
      address: formData.address,
      role,
    };

    let roleSpecificFields = {};

    if (role === 'donor') {
      roleSpecificFields = {
        business_name: formData.business_name,
        donor_type: formData.donor_type,
        license_number: formData.license_number,
      };
    } else if (role === 'recipient') {
      roleSpecificFields = {
        organization_name: formData.organization_name,
        recipient_type: formData.recipient_type,
        capacity: formData.capacity,
        current_occupancy: formData.current_occupancy,
      };
    } else if (role === 'volunteer') {
      roleSpecificFields = {
        vehicle_type: formData.vehicle_type,
      };
    }

    const dataToSubmit = {
      ...commonFields,
      ...roleSpecificFields,
    };

    try {
      await register(dataToSubmit);
      navigate('/');
    } catch (err) {
      console.error(err);
      if (err.response && err.response.data) {
        // Handles structured error responses.
        const errorData = err.response.data;
        if (typeof errorData === 'object') {
          // Formats error objects into strings.
          const messages = Object.entries(errorData).map(([key, msgs]) => {
             const msgText = Array.isArray(msgs) ? msgs.join(', ') : msgs;
             return `${key.charAt(0).toUpperCase() + key.slice(1)}: ${msgText}`;
          }).join('\n');
          setError(messages);
        } else {
          setError(String(errorData));
        }
      } else {
        setError('Registration failed. Please check your inputs.');
      }
    }
  };

  const inputClass = "appearance-none block w-full px-4 py-3 border border-dark-600 placeholder-dark-500 text-white bg-dark-900/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all sm:text-sm";
  const labelClass = "block text-sm font-medium text-dark-300 mb-1.5";

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans relative overflow-hidden">
      {/* Displays background watermark. */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        <Leaf className="absolute -top-20 -right-20 text-brand-500/5 w-96 h-96 transform rotate-12" />
        <Leaf className="absolute bottom-0 left-0 text-brand-500/5 w-64 h-64 transform -rotate-12 translate-y-20 -translate-x-20" />
      </div>

      <div className="max-w-3xl w-full space-y-8 bg-dark-800 p-8 sm:p-10 rounded-2xl border border-dark-700 shadow-2xl relative z-10 backdrop-blur-sm">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <Link to="/">
              <div className="bg-brand-500/10 p-4 rounded-2xl border border-brand-500/20 shadow-inner hover:bg-brand-500/20 transition-all cursor-pointer">
                <Leaf className="h-10 w-10 text-brand-500" />
              </div>
            </Link>
          </div>
          <h2 className="mt-2 text-3xl font-display font-bold text-white tracking-tight">
            Join the Network
          </h2>
          <p className="mt-2 text-sm text-dark-400">
            Create an account on <Link to="/" className="text-brand-400 font-semibold hover:text-brand-300 transition-colors">ShareEat</Link>
          </p>
          <p className="mt-4 text-sm text-gray-400">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-brand-500 hover:text-brand-400 transition-colors underline decoration-brand-500/30 hover:decoration-brand-500">
              Sign in
            </Link>
          </p>
        </div>

        {/* Renders role selection tabs. */}
        <div className="flex justify-center p-1 bg-dark-900/50 rounded-xl border border-dark-700">
          {[
            { id: 'donor', icon: Heart, label: 'Donor' },
            { id: 'recipient', icon: Building, label: 'Recipient' },
            { id: 'volunteer', icon: Truck, label: 'Volunteer' }
          ].map((r) => {
            const Icon = r.icon;
            return (
              <button
                key={r.id}
                onClick={() => setRole(r.id)}
                className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  role === r.id
                    ? 'bg-brand-600 text-white shadow-lg'
                    : 'text-dark-400 hover:text-white hover:bg-dark-700/50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{r.label}</span>
              </button>
            );
          })}
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-200 px-4 py-3 rounded-lg flex items-center" role="alert">
              <span className="block sm:inline text-sm">{error}</span>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Common Fields */}
            <div className="col-span-1 md:col-span-2">
              <label className={labelClass}>Username</label>
              <input name="username" type="text" required autoComplete="username" className={inputClass} placeholder="Choose a unique username" onChange={handleChange} />
            </div>
            <div>
              <label className={labelClass}>Password</label>
              <input name="password" type="password" required autoComplete="new-password" className={inputClass} placeholder="Minimum 8 characters" onChange={handleChange} />
            </div>
            <div>
              <label className={labelClass}>Email</label>
              <input name="email" type="email" required className={inputClass} placeholder="your@email.com" onChange={handleChange} />
            </div>
            <div>
              <label className={labelClass}>First Name</label>
              <input name="first_name" type="text" className={inputClass} placeholder="First Name" onChange={handleChange} />
            </div>
            <div>
              <label className={labelClass}>Last Name</label>
              <input name="last_name" type="text" className={inputClass} placeholder="Last Name" onChange={handleChange} />
            </div>
            <div>
              <label className={labelClass}>Phone</label>
              <input name="phone" type="text" required className={inputClass} placeholder="+880 1XXX-XXXXXX" onChange={handleChange} />
            </div>
            <div className="col-span-1 md:col-span-2">
              <label className={labelClass}>Address</label>
              <textarea name="address" required className={inputClass} rows="2" placeholder="Full street address" onChange={handleChange}></textarea>
            </div>

            {/* Renders role-specific fields. */}
            {role === 'donor' && (
              <>
                <div className="col-span-1 md:col-span-2">
                  <label className={labelClass}>Business Name</label>
                  <input name="business_name" type="text" required className={inputClass} placeholder="Restaurant or Organization Name" onChange={handleChange} />
                </div>
                <div>
                  <label className={labelClass}>Donor Type</label>
                  <select name="donor_type" className={inputClass} onChange={handleChange}>
                    <option value="restaurant">Restaurant</option>
                    <option value="grocery">Grocery Store</option>
                    <option value="bakery">Bakery</option>
                    <option value="catering">Catering</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>License Number</label>
                  <input name="license_number" type="text" required className={inputClass} placeholder="LIC-XXXX-XXX" onChange={handleChange} />
                </div>
              </>
            )}

            {role === 'recipient' && (
              <>
                <div className="col-span-1 md:col-span-2">
                  <label className={labelClass}>Organization Name</label>
                  <input name="organization_name" type="text" required className={inputClass} placeholder="NGO or Shelter Name" onChange={handleChange} />
                </div>
                <div>
                  <label className={labelClass}>Recipient Type</label>
                  <select name="recipient_type" className={inputClass} onChange={handleChange}>
                    <option value="ngo">NGO</option>
                    <option value="shelter">Shelter</option>
                    <option value="individual">Individual</option>
                    <option value="community">Community Center</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Capacity (People)</label>
                  <input name="capacity" type="number" required className={inputClass} placeholder="e.g. 50" onChange={handleChange} />
                </div>
                <div>
                  <label className={labelClass}>Current Occupancy</label>
                  <input name="current_occupancy" type="number" required className={inputClass} placeholder="e.g. 25" onChange={handleChange} />
                </div>
              </>
            )}

            {role === 'volunteer' && (
              <>
                <div className="col-span-1 md:col-span-2">
                  <label className={labelClass}>Vehicle Type</label>
                  <select name="vehicle_type" className={inputClass} onChange={handleChange}>
                    <option value="">No Vehicle</option>
                    <option value="bicycle">Bicycle</option>
                    <option value="motorcycle">Motorcycle</option>
                    <option value="car">Car</option>
                    <option value="van">Van</option>
                    <option value="truck">Truck</option>
                  </select>
                </div>
              </>
            )}
          </div>

          <div className="pt-4">
            <button
              type="submit"
              className="w-full flex justify-center py-3.5 px-4 border border-transparent text-sm font-semibold rounded-xl text-white bg-brand-600 hover:bg-brand-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 focus:ring-offset-dark-900 transition-all shadow-lg hover:shadow-brand-500/25"
            >
              Create Account
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Donors from './components/Donors';
import Recipients from './components/Recipients';
import FoodItems from './components/FoodItems';
import CreateFoodItem from './components/CreateFoodItem';
import Donations from './components/Donations';
import DonationDetails from './components/DonationDetails';
import Login from './components/Login';
import Register from './components/Register';
import ProtectedRoute from './components/ProtectedRoute';
import RoleBasedDashboard from './components/RoleBasedDashboard';
import { AuthProvider } from './context/AuthContext';

import Home from './components/Home';
import Logout from './components/Logout';
import { Toaster } from 'react-hot-toast';

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      <Route path="/" element={<Home />} />
      <Route path="/logout" element={<Logout />} />

      <Route path="/dashboard" element={
        <ProtectedRoute>
          <RoleBasedDashboard />
        </ProtectedRoute>
      } />
      
      <Route path="/donors" element={
        <ProtectedRoute allowedRoles={['admin', 'recipient', 'volunteer']}>
          <Donors />
        </ProtectedRoute>
      } />
      
      <Route path="/recipients" element={
        <ProtectedRoute allowedRoles={['admin', 'donor', 'volunteer']}>
          <Recipients />
        </ProtectedRoute>
      } />
      
      <Route path="/food-items/new" element={
        <ProtectedRoute allowedRoles={['admin', 'donor']}>
          <CreateFoodItem />
        </ProtectedRoute>
      } />
      
      <Route path="/food-items" element={
          <FoodItems />
      } />
      
      <Route path="/donations" element={
        <ProtectedRoute>
          <Donations />
        </ProtectedRoute>
      } />

      <Route path="/donations/:id" element={
        <ProtectedRoute>
          <DonationDetails />
        </ProtectedRoute>
      } />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-dark-900">
          <Navbar />
          <AppRoutes />
          <Toaster position="top-right" />
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;

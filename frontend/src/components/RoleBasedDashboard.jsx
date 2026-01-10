import { useAuth } from '../context/AuthContext';
import AdminDashboard from './dashboards/AdminDashboard';
import DonorDashboard from './dashboards/DonorDashboard';
import RecipientDashboard from './dashboards/RecipientDashboard';
import VolunteerDashboard from './dashboards/VolunteerDashboard';
import Dashboard from './Dashboard';

const RoleBasedDashboard = () => {
  const { user } = useAuth();

  if (!user) return null;

  const role = user.role ? user.role.toLowerCase().trim() : 'unknown';

  switch(role) {
    case 'admin': return <AdminDashboard />;
    case 'donor': return <DonorDashboard />;
    case 'recipient': return <RecipientDashboard />;
    case 'volunteer': return <VolunteerDashboard />;
    default: return <Dashboard />;
  }
};

export default RoleBasedDashboard;

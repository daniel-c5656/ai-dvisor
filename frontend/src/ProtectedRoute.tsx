import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './useAuth';

/**
 * A component that renders its children only if a user is authenticated.
 * Otherwise, it redirects to the /login page.
 */
export default function ProtectedRoute() {
    const { user, loading } = useAuth();

    if (loading) {
        return null;
    }
    // If user is not null, then navigate to the corresponding child (Dashboard, Planpage, etc.)
    // Else, kick the user to login.
    return user ? <Outlet /> : <Navigate to="/login" />;
}

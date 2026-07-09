import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';

/**
 * Wraps a route so that unauthenticated users are redirected to /login.
 * Shows a loading spinner while the auth state is being determined.
 */
export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen bg-[#080808] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-2 border-[#22c55e]/30 border-t-[#22c55e] rounded-full animate-spin" />
                    <span className="text-white/40 text-xs uppercase tracking-widest font-bold">Loading...</span>
                </div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
}

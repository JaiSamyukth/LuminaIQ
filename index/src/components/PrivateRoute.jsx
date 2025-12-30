import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PrivateRoute = () => {
    const { user } = useAuth();
    const location = useLocation();
    
    // If not authenticated, redirect to login but preserve the intended destination
    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }
    
    return <Outlet />;
};

export default PrivateRoute;

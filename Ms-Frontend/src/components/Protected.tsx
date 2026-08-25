import { Navigate, Outlet } from 'react-router-dom';
import { getSession } from '../auth/session';

export function Protected() {
  if (!getSession()) {
    return <Navigate to="/auth/login" replace />;
  }
  return <Outlet />;
}

import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

type Role = "superadmin" | "admin";

export default function ProtectedRoute({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles?: Role[];
}) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/quotes" replace />;
  }
  return <>{children}</>;
}

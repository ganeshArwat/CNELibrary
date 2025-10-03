import { Navigate } from "react-router-dom";

const ProtectedRoute = ({
  children,
  role,
}: {
  children: JSX.Element;
  role: string;
}) => {
  const token = localStorage.getItem("jwtToken");
  const userRole = localStorage.getItem("roleType");

  if (!token || userRole?.toLowerCase() !== role.toLowerCase()) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;

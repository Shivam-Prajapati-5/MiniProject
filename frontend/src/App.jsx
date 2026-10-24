import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Home from './pages/Home';
import Auth from './pages/Auth';
import Chat from './pages/Chat';

const SessionLoader = () => (
  <div className="auth-bg">
    <div className="auth-glow auth-glow-1" />
    <div className="auth-glow auth-glow-2" />
    <div className="spinner session-loader__spinner" />
    <style>{`
      .session-loader__spinner {
        width: 28px;
        height: 28px;
        border-width: 3px;
        border-color: rgba(23, 168, 196, 0.18);
        border-top-color: var(--teal-bright);
        z-index: 1;
      }
    `}</style>
  </div>
);

const ProtectedRoute = ({ children }) => {
  const { authUser, initializing } = useAuth();

  if (initializing) return <SessionLoader />;
  return authUser ? children : <Navigate to="/auth" replace />;
};

const PublicRoute = ({ children }) => {
  const { authUser, initializing } = useAuth();

  if (initializing) return <SessionLoader />;
  return !authUser ? children : <Navigate to="/chat" replace />;
};

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route
        path="/chat"
        element={
          <ProtectedRoute>
            <Chat />
          </ProtectedRoute>
        }
      />
      <Route
        path="/auth"
        element={
          <PublicRoute>
            <Auth />
          </PublicRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;

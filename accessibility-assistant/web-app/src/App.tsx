import React, { useState, useEffect } from 'react';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Protected route wrapper component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isLoggedIn, loading } = useAuth();
  
  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  // Redirect to login if not authenticated
  if (!isLoggedIn) {
    // Use setTimeout to avoid immediate state change in render
    setTimeout(() => {
      window.history.pushState({}, '', '/login');
      window.dispatchEvent(new Event('popstate'));
    }, 0);
    return null;
  }
  
  return <>{children}</>;
};

// Main App component with routing
const AppContent: React.FC = () => {
  const [currentPath, setCurrentPath] = useState<string>(window.location.pathname);
  const { isLoggedIn, logout } = useAuth();

  // Handle navigation
  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname);
    };

    // Listen for changes to the URL
    window.addEventListener('popstate', handleLocationChange);

    return () => {
      window.removeEventListener('popstate', handleLocationChange);
    };
  }, []);

  // Redirect to dashboard if logged in and trying to access auth pages
  useEffect(() => {
    if (isLoggedIn && (currentPath === '/login' || currentPath === '/register')) {
      window.history.pushState({}, '', '/');
      setCurrentPath('/');
    }
  }, [isLoggedIn, currentPath]);

  // Simple client-side routing
  const renderContent = () => {
    switch (currentPath) {
      case '/':
        return <ProtectedRoute><Dashboard /></ProtectedRoute>;
      case '/profile':
        return <ProtectedRoute><ProfilePage /></ProtectedRoute>;
      case '/settings':
        return <ProtectedRoute><SettingsPage /></ProtectedRoute>;
      case '/login':
        return <LoginPage />;
      case '/register':
        return <RegisterPage />;
      case '/logout':
        // Handle logout
        logout();
        // Use setTimeout to avoid immediate state change during render
        setTimeout(() => {
          window.history.pushState({}, '', '/login');
          window.dispatchEvent(new Event('popstate'));
        }, 0);
        return <div className="min-h-screen flex items-center justify-center">Logging out...</div>;
      case '/help':
        return (
          <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-6">Help & Support</h1>
              <div className="bg-white rounded-lg shadow-sm p-6">
                <p className="text-lg text-gray-700">
                  This page is under construction. Here you will find help and support for using the Accessibility Assistant.
                </p>
              </div>
            </div>
          </div>
        );
      default:
        return (
          <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center py-16">
                <h1 className="text-4xl font-bold text-gray-900 mb-4">Page Not Found</h1>
                <p className="text-lg text-gray-600 mb-8">
                  The page you are looking for doesn't exist or has been moved.
                </p>
                <a 
                  href="/"
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                  onClick={(e) => {
                    e.preventDefault();
                    window.history.pushState({}, '', '/');
                    setCurrentPath('/');
                  }}
                >
                  Go Home
                </a>
              </div>
            </div>
          </div>
        );
    }
  };

  // Custom link component to handle client-side navigation
  const Link: React.FC<{ href: string; children: React.ReactNode; className?: string }> = ({
    href,
    children,
    className
  }) => {
    const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault();
      window.history.pushState({}, '', href);
      setCurrentPath(href);
    };

    return (
      <a href={href} onClick={handleClick} className={className}>
        {children}
      </a>
    );
  };

  // Make the Link component available globally
  (window as any).Link = Link;

  return (
    <Layout currentPath={currentPath}>
      {renderContent()}
    </Layout>
  );
};

// Wrap the app with AuthProvider
const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
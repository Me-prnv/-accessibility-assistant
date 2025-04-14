import React, { useState, useEffect } from 'react';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';

const App: React.FC = () => {
  const [currentPath, setCurrentPath] = useState<string>(window.location.pathname);

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

  // Simple client-side routing
  const renderContent = () => {
    switch (currentPath) {
      case '/':
        return <Dashboard />;
      case '/profile':
        return <ProfilePage />;
      case '/settings':
        return <SettingsPage />;
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

export default App; 
import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface NavigationProps {
  currentPath: string;
}

const Navigation: React.FC<NavigationProps> = ({ currentPath }) => {
  const { user, isLoggedIn, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const toggleProfileMenu = () => {
    setIsProfileMenuOpen(!isProfileMenuOpen);
  };

  // Navigation links - show all links for authenticated users, limited for guests
  const navLinks = isLoggedIn 
    ? [
        { name: 'Dashboard', path: '/' },
        { name: 'Profile', path: '/profile' },
        { name: 'Settings', path: '/settings' },
        { name: 'Help', path: '/help' }
      ]
    : [
        { name: 'Home', path: '/' },
        { name: 'Help', path: '/help' }
      ];

  const profileLinks = [
    { name: 'Your Profile', path: '/profile' },
    { name: 'Settings', path: '/settings' },
    { name: 'Help & Support', path: '/help' },
    { name: 'Sign out', path: '/logout' }
  ];

  const isActivePath = (path: string) => {
    if (path === '/' && currentPath === '/') {
      return true;
    }
    if (path !== '/' && currentPath.startsWith(path)) {
      return true;
    }
    return false;
  };

  const handleLogout = () => {
    logout();
    // Redirect handled by App.tsx
  };

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <a href="/" className="flex items-center">
                <svg 
                  className="h-8 w-8 text-blue-600" 
                  xmlns="http://www.w3.org/2000/svg" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M16 12h-4V8" />
                  <line x1="9" y1="12" x2="9" y2="12.01" />
                </svg>
                <span className="ml-2 text-xl font-bold text-gray-900">Accessibility Assistant</span>
              </a>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {navLinks.map((link) => (
                <a
                  key={link.path}
                  href={link.path}
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    isActivePath(link.path)
                      ? 'border-blue-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }`}
                >
                  {link.name}
                </a>
              ))}
            </div>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            {isLoggedIn ? (
              /* User dropdown when authenticated */
              <div className="ml-3 relative">
                <div>
                  <button
                    onClick={toggleProfileMenu}
                    className="max-w-xs bg-white flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    id="user-menu-button"
                    aria-expanded={isProfileMenuOpen}
                    aria-haspopup="true"
                  >
                    <span className="sr-only">Open user menu</span>
                    {user?.profilePicture ? (
                      <img
                        className="h-8 w-8 rounded-full"
                        src={user.profilePicture}
                        alt={`${user.name}'s profile`}
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-blue-800 font-medium">
                          {user?.name.charAt(0) || 'U'}
                        </span>
                      </div>
                    )}
                  </button>
                </div>

                {isProfileMenuOpen && (
                  <div
                    className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none"
                    role="menu"
                    aria-orientation="vertical"
                    aria-labelledby="user-menu-button"
                    tabIndex={-1}
                  >
                    {profileLinks.map((link, index) => (
                      <a
                        key={link.path}
                        href={link.path}
                        className={`block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 ${
                          index === profileLinks.length - 1 ? 'border-t border-gray-100' : ''
                        }`}
                        role="menuitem"
                        tabIndex={-1}
                        onClick={(e) => {
                          if (link.path === '/logout') {
                            e.preventDefault();
                            handleLogout();
                          }
                          setIsProfileMenuOpen(false);
                        }}
                      >
                        {link.name}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              /* Login/Register buttons when not authenticated */
              <div className="flex space-x-4">
                <a 
                  href="/login" 
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100"
                >
                  Log in
                </a>
                <a 
                  href="/register" 
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                >
                  Register
                </a>
              </div>
            )}
          </div>
          <div className="-mr-2 flex items-center sm:hidden">
            {/* Mobile menu button */}
            <button
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              aria-expanded={isMenuOpen}
            >
              <span className="sr-only">Open main menu</span>
              {isMenuOpen ? (
                <svg
                  className="block h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg
                  className="block h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="sm:hidden">
          <div className="pt-2 pb-3 space-y-1">
            {navLinks.map((link) => (
              <a
                key={link.path}
                href={link.path}
                className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                  isActivePath(link.path)
                    ? 'bg-blue-50 border-blue-500 text-blue-700'
                    : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'
                }`}
              >
                {link.name}
              </a>
            ))}
          </div>
          
          {/* Show user profile in mobile menu only if logged in */}
          {isLoggedIn ? (
            <div className="pt-4 pb-3 border-t border-gray-200">
              <div className="flex items-center px-4">
                <div className="flex-shrink-0">
                  {user?.profilePicture ? (
                    <img
                      className="h-10 w-10 rounded-full"
                      src={user.profilePicture}
                      alt={`${user.name}'s profile`}
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-blue-800 font-medium">
                        {user?.name.charAt(0) || 'U'}
                      </span>
                    </div>
                  )}
                </div>
                <div className="ml-3">
                  <div className="text-base font-medium text-gray-800">{user?.name || 'User'}</div>
                  {user?.email && (
                    <div className="text-sm font-medium text-gray-500">{user.email}</div>
                  )}
                </div>
              </div>
              <div className="mt-3 space-y-1">
                {profileLinks.map((link) => (
                  <a
                    key={link.path}
                    href={link.path}
                    className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                    onClick={(e) => {
                      if (link.path === '/logout') {
                        e.preventDefault();
                        handleLogout();
                      }
                      setIsMenuOpen(false);
                    }}
                  >
                    {link.name}
                  </a>
                ))}
              </div>
            </div>
          ) : (
            /* Login/Register buttons for mobile when not authenticated */
            <div className="pt-4 pb-3 border-t border-gray-200">
              <div className="space-y-1 px-4">
                <a 
                  href="/login" 
                  className="block text-base font-medium text-blue-600 hover:text-blue-800 hover:bg-gray-100 py-2"
                >
                  Log in
                </a>
                <a 
                  href="/register" 
                  className="block text-base font-medium text-blue-600 hover:text-blue-800 hover:bg-gray-100 py-2"
                >
                  Register
                </a>
              </div>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navigation;
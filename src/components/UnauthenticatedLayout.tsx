import React from 'react';
import { Link } from 'react-router-dom';

interface UnauthenticatedLayoutProps {
  children: React.ReactNode;
}

const UnauthenticatedLayout: React.FC<UnauthenticatedLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm p-4 flex justify-between items-center">
        <div className="text-2xl font-bold text-gray-800">Kapiree</div>
        <nav>
          <ul className="flex space-x-4">
            <li><Link to="/" className="text-gray-600 hover:text-gray-900">Home</Link></li>
            <li><Link to="/pricing" className="text-gray-600 hover:text-gray-900">Pricing</Link></li>
            <li><Link to="/signin" className="text-gray-600 hover:text-gray-900">Sign In</Link></li>
            <li><Link to="/demo" className="text-blue-600 hover:text-blue-800">Request Demo</Link></li>
          </ul>
        </nav>
      </header>

      {/* Main Content */}
      <main>
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-10 px-4">
        <div className="container mx-auto text-center">
          <p>&copy; Copyright 2025 Kapiree. All rights reserved.</p>
          <p className="mt-2">Made with ❤️ in India</p>
        </div>
      </footer>
    </div>
  );
};

export default UnauthenticatedLayout;

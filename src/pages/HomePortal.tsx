import React from 'react';
import { Link } from 'react-router-dom';
// Removed UnauthenticatedLayout import as it's now handled in AppRoutes.tsx

const HomePortal: React.FC = () => {
  return (
    <>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-blue-600 to-purple-600 text-white py-20 px-4 text-center">
        <div className="container mx-auto">
          <h1 className="text-5xl font-bold mb-4">Transform Your Hiring Process using Automated Resume Screening</h1>
          <p className="text-xl mb-8">Efficient and Engaging Video Interview Platform for Hiring Top Candidates Through Asynchronous Video Interviews</p>
          <div className="space-x-4">
            <Link to="/demo" className="bg-white text-blue-600 px-8 py-3 rounded-full text-lg font-semibold hover:bg-gray-100">Request Demo</Link>
            <a href="/media/files/Kapiree_Brochure.pdf" className="border border-white text-white px-8 py-3 rounded-full text-lg font-semibold hover:bg-white hover:text-blue-600">Download Brochure</a>
          </div>
        </div>
      </section>

      {/* Placeholder for other sections based on kapiree.com */}
      <section className="container mx-auto py-16 px-4">
        <h2 className="text-4xl font-bold text-center text-gray-800 mb-12">More sections coming soon...</h2>
        {/* This is where I would add more sections like "How Kapiree works", "Who can use Kapiree?", "What sets us apart?", etc. */}
      </section>
    </>
  );
};

export default HomePortal;

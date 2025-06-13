import React, { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Header from '../components/layout/Header';
import HeroSection from '../components/home/HeroSection';
import CategoryCards from '../components/home/CategoryCards';
import FeaturedProducts from '../components/home/FeaturedProducts';
import ComingSoon from '../components/home/ComingSoon';
import Footer from '../components/layout/Footer';

const HomePage = () => {
  const { user, loading, refreshUser } = useAuth();

  useEffect(() => {
    // Check if we have a token but no user context (indicates fresh login)
    const token = localStorage.getItem('token');
    const hasTokenButNoUser = token && !user && !loading;
    
    // Refresh user data if we detect a fresh login state
    if (hasTokenButNoUser && refreshUser) {
      refreshUser();
    }
  }, [user, loading, refreshUser]);

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main>
        <HeroSection />
        <CategoryCards />
        <FeaturedProducts />
        <ComingSoon />
      </main>
      <Footer />
    </div>
  );
};

export default HomePage; 
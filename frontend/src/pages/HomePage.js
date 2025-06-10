import React from 'react';
import Header from '../components/layout/Header';
import HeroSection from '../components/home/HeroSection';
import CategoryCards from '../components/home/CategoryCards';
import FeaturedProducts from '../components/home/FeaturedProducts';
import ComingSoon from '../components/home/ComingSoon';
import Footer from '../components/layout/Footer';

const HomePage = () => {
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
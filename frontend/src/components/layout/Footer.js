import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="container pl-4">
        <div className="grid md:grid-cols-4 gap-8 text-left">
          <div className="md:col-span-2 text-left">
            <div className="flex items-center mb-4 justify-start">
              <img 
                src="/images/logo.png" 
                alt="JPStore Logo" 
                className="h-12 w-auto mr-3"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'block';
                }}
              />
              <span 
                className="text-2xl font-bold"
                style={{display: 'none'}}
              >
                JPStore
              </span>
            </div>
            <p className="text-gray-400 mb-4 max-w-md text-left">
              Your premier destination for collectible figures and exclusive merchandise.
            </p>
          </div>
          
          <div className="text-left">
            <h4 className="font-semibold mb-4 text-left">Quick Links</h4>
            <ul className="space-y-2 text-left">
              <li><Link to="/about" className="text-gray-400 hover:text-white transition-colors">About Us</Link></li>
              <li><Link to="/contact" className="text-gray-400 hover:text-white transition-colors">Contact</Link></li>
              <li><Link to="/shipping" className="text-gray-400 hover:text-white transition-colors">Shipping Info</Link></li>
              <li><Link to="/returns" className="text-gray-400 hover:text-white transition-colors">Returns</Link></li>
            </ul>
          </div>
          
          <div className="text-left">
            <h4 className="font-semibold mb-4 text-left">Customer Service</h4>
            <ul className="space-y-2 text-left">
              <li><Link to="/faq" className="text-gray-400 hover:text-white transition-colors">FAQ</Link></li>
              <li><Link to="/size-guide" className="text-gray-400 hover:text-white transition-colors">Size Guide</Link></li>
              <li><Link to="/track-order" className="text-gray-400 hover:text-white transition-colors">Track Order</Link></li>
              <li><Link to="/privacy" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-800 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-start">
            <p className="text-gray-400 text-sm text-left">
              © 2024 JPStore. All rights reserved.
            </p>
            <div className="flex space-x-4 mt-4 md:mt-0">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <i className="bi bi-facebook text-xl"></i>
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <i className="bi bi-twitter text-xl"></i>
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <i className="bi bi-instagram text-xl"></i>
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <i className="bi bi-youtube text-xl"></i>
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 
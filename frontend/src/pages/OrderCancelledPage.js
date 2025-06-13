import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';

const OrderCancelledPage = () => {
  const [searchParams] = useSearchParams();
  const orderCode = searchParams.get('orderCode');

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-white rounded-lg shadow-sm p-8">
            <div className="mb-6">
              <i className="bi bi-x-circle text-6xl text-red-600 mb-4"></i>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Cancelled</h1>
              <p className="text-gray-600">
                Your payment has been cancelled. No charges have been made to your account.
              </p>
            </div>

            {orderCode && (
              <div className="bg-gray-50 rounded-lg p-6 mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Order Information</h2>
                <p className="text-gray-600">
                  Order Code: <span className="font-semibold">#{orderCode}</span>
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  This order has been cancelled and will not be processed.
                </p>
              </div>
            )}

            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                If you experienced any issues during the payment process, please contact our support team.
                You can also try placing your order again.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link 
                  to="/checkout" 
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  Try Again
                </Link>
                <Link 
                  to="/cart" 
                  className="bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-700 transition-colors"
                >
                  Back to Cart
                </Link>
                <Link 
                  to="/products" 
                  className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
                >
                  Continue Shopping
                </Link>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                  Need help? Contact our support team at support@jpstore.com or call (123) 456-7890
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default OrderCancelledPage; 
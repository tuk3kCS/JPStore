import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import Loading from '../components/common/Loading';
import { useCart } from '../context/CartContext';
import { orderService } from '../services/orderService';

const OrderSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  const { loadCart } = useCart();

  const orderCode = searchParams.get('orderCode');

  useEffect(() => {
    const loadOrderDetails = async (retryCount = 0) => {
      try {
        if (orderCode) {
          const orderData = await orderService.getOrderByCode(orderCode, true); // true = from success page
          setOrder(orderData);
          
          // Reload cart to ensure it's cleared after successful payment
          if (loadCart) {
            loadCart();
          }
          setLoading(false);
        } else {
          setError('Order code not found');
          setLoading(false);
        }
      } catch (error) {
        console.error('Error loading order:', error);
        
        // Retry up to 3 times with delay (in case webhook is still processing)
        if (retryCount < 3) {
          console.log(`Retrying order load... attempt ${retryCount + 1}`);
          setTimeout(() => loadOrderDetails(retryCount + 1), 2000);
        } else {
          // After 3 retries, show success anyway since user reached success page
          console.log('Max retries reached, showing success without order details');
          setOrder({ orderCode, total: 0 }); // Minimal order data
          setLoading(false);
        }
      }
    };

    if (orderCode) {
      loadOrderDetails();
    } else {
      setError('Order code not found');
      setLoading(false);
    }
  }, [orderCode, loadCart]);

  if (loading) {
    return <Loading message="Đang tải chi tiết đơn hàng..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto text-center">
          {error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-8">
              <i className="bi bi-exclamation-triangle text-4xl text-red-600 mb-4"></i>
              <h1 className="text-2xl font-bold text-red-800 mb-2">Lỗi</h1>
              <p className="text-red-600 mb-6">{error}</p>
              <Link 
                to="/" 
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Về trang chủ
              </Link>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm p-8">
                             <div className="mb-6">
                 <i className="bi bi-check-circle text-6xl text-green-600 mb-4"></i>
                 <h1 className="text-3xl font-bold text-gray-900 mb-2">Thanh toán thành công!</h1>
               </div>

                             {(order || orderCode) && (
                 <div className="bg-gray-50 rounded-lg p-6 mb-6">
                   <h2 className="text-lg font-semibold text-gray-900 mb-4">Chi tiết đơn hàng</h2>
                   <div className="space-y-2 text-left">
                     <div className="flex justify-between">
                       <span className="text-gray-600">Mã đơn hàng:</span>
                       <span className="font-semibold">#{order?.orderCode || orderCode}</span>
                     </div>
                     {order?.total && (
                       <div className="flex justify-between">
                         <span className="text-gray-600">Tổng tiền:</span>
                         <span className="font-semibold text-blue-600">
                           {Math.round(order.total || 0).toLocaleString('vi-VN')}đ
                         </span>
                       </div>
                     )}
                     <div className="flex justify-between">
                       <span className="text-gray-600">Trạng thái thanh toán:</span>
                       <span className="text-green-600 font-semibold">Hoàn thành</span>
                     </div>
                     <div className="flex justify-between">
                       <span className="text-gray-600">Trạng thái đơn hàng:</span>
                       <span className="text-blue-600 font-semibold">Đã xác nhận</span>
                     </div>
                   </div>
                 </div>
               )}

              <div className="space-y-4">
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link 
                    to={`/orders${orderCode ? `?highlight=${orderCode}` : ''}`}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                  >
                    Xem đơn hàng
                  </Link>
                  <Link 
                    to="/products" 
                    className="bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-700 transition-colors"
                  >
                    Tiếp tục mua sắm
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default OrderSuccessPage; 
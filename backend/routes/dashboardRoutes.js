const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const auth = require('../middlewares/auth');
const admin = require('../middlewares/admin');

// Get dashboard statistics (admin only)
router.get('/stats', [auth, admin], async (req, res) => {
    try {
        // Calculate total revenue
        const revenueResult = await Order.aggregate([
            { $match: { status: { $ne: 'cancelled' } } },
            { $group: { _id: null, totalRevenue: { $sum: '$total' } } }
        ]);
        const totalRevenue = revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;

        // Get total orders count
        const totalOrders = await Order.countDocuments({ status: { $ne: 'cancelled' } });

        // Get total customers count
        const totalCustomers = await User.countDocuments({ role: 'user' });

        // Get products in stock count
        const productsInStock = await Product.countDocuments({ 
            stock: { $gt: 0 }, 
            isActive: true,
            isPreOrder: false 
        });

        // Calculate growth percentages (mock for now, could be calculated based on previous period)
        const stats = [
            {
                title: 'Tổng doanh thu',
                value: `${parseInt(totalRevenue).toLocaleString('vi-VN')}đ`,
                icon: 'bi-currency-dollar',
                color: 'text-blue-600',
                bgColor: 'bg-blue-50'
            },
            {
                title: 'Tổng số đơn hàng',
                value: totalOrders.toString(),
                icon: 'bi-cart',
                color: 'text-green-600',
                bgColor: 'bg-green-50'
            },
            {
                title: 'Tổng số khách hàng',
                value: totalCustomers.toString(),
                icon: 'bi-people',
                color: 'text-purple-600',
                bgColor: 'bg-purple-50'
            },
            {
                title: 'Số sản phẩm trong kho',
                value: productsInStock.toString(),
                icon: 'bi-box',
                color: 'text-yellow-600',
                bgColor: 'bg-yellow-50'
            }
        ];

        res.json(stats);
    } catch (error) {
        console.error('Lỗi lấy thống kê bảng điều khiển:', error);
        res.status(500).json({ message: 'Lỗi lấy thống kê bảng điều khiển', error: error.message });
    }
});

// Get recent orders for dashboard (admin only)
router.get('/recent-orders', [auth, admin], async (req, res) => {
    try {
        const { limit = 5 } = req.query;
        
        const orders = await Order.find()
            .populate('items.product')
            .populate('user', 'name email username avatar')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit));

        res.json(orders);
    } catch (error) {
        console.error('Lỗi lấy đơn hàng gần đây:', error);
        res.status(500).json({ message: 'Lỗi lấy đơn hàng gần đây', error: error.message });
    }
});

// Get top products for dashboard (admin only)
router.get('/top-products', [auth, admin], async (req, res) => {
    try {
        const { limit = 5 } = req.query;
        
        // Get top products based on order frequency
        const topProductsData = await Order.aggregate([
            { $unwind: '$items' },
            { 
                $group: { 
                    _id: '$items.product',
                    totalSales: { $sum: '$items.quantity' },
                    totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
                }
            },
            { $sort: { totalSales: -1 } },
            { $limit: parseInt(limit) }
        ]);

        // Populate product details
        const topProducts = await Promise.all(
            topProductsData.map(async (item) => {
                const product = await Product.findById(item._id);
                return {
                    name: product?.name || 'Unknown Product',
                    sales: item.totalSales,
                    stock: product?.stock || 0,
                    price: product?.isPreOrder 
                        ? `¥${parseInt(product.jpyPrice || 0).toLocaleString('ja-JP')}`
                        : `${parseInt(product.vndPrice || 0).toLocaleString('vi-VN')}đ`,
                    image: product?.images?.[0] 
                        ? `http://localhost:5000${product.images[0]}` 
                        : 'https://via.placeholder.com/50x50?text=Product'
                };
            })
        );

        res.json(topProducts);
    } catch (error) {
        console.error('Lỗi lấy sản phẩm top:', error);
        res.status(500).json({ message: 'Lỗi lấy sản phẩm top', error: error.message });
    }
});

// Get recent users for dashboard (admin only)
router.get('/recent-users', [auth, admin], async (req, res) => {
    try {
        const { limit = 5 } = req.query;
        
        const users = await User.find({ role: 'user' })
            .sort({ createdAt: -1 })
            .limit(parseInt(limit));

        const recentUsers = await Promise.all(
            users.map(async (user) => {
                // Get user's order count and total spent
                const orderStats = await Order.aggregate([
                    { $match: { user: user._id, status: { $ne: 'cancelled' } } },
                    { 
                        $group: { 
                            _id: null,
                            orderCount: { $sum: 1 },
                            totalSpent: { $sum: '$total' }
                        }
                    }
                ]);

                const stats = orderStats.length > 0 ? orderStats[0] : { orderCount: 0, totalSpent: 0 };

                return {
                    name: user.name || user.username || 'Unknown User',
                    email: user.email || 'No email',
                    avatar: user.avatar || null,
                    username: user.username || null,
                    orders: stats.orderCount,
                    total: `${parseInt(stats.totalSpent).toLocaleString('vi-VN')}đ`,
                    initial: (user.name || user.username || 'U').charAt(0).toUpperCase()
                };
            })
        );

        res.json(recentUsers);
    } catch (error) {
        console.error('Lỗi lấy người dùng gần đây:', error);
        res.status(500).json({ message: 'Lỗi lấy người dùng gần đây', error: error.message });
    }
});

// Get sales analytics for charts (admin only)
router.get('/sales-analytics', [auth, admin], async (req, res) => {
    try {
        // Get sales data for the last 12 months
        const currentDate = new Date();
        const twelveMonthsAgo = new Date(currentDate.getFullYear() - 1, currentDate.getMonth(), 1);
        
        const salesData = await Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: twelveMonthsAgo },
                    status: { $ne: 'cancelled' }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' }
                    },
                    revenue: { $sum: '$total' },
                    orders: { $sum: 1 }
                }
            },
            {
                $sort: { '_id.year': 1, '_id.month': 1 }
            }
        ]);

        // Create array for last 12 months with proper month names
        const monthNames = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 
                           'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];
        
        const chartData = [];
        for (let i = 11; i >= 0; i--) {
            const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
            const year = date.getFullYear();
            const month = date.getMonth() + 1;
            
            const monthData = salesData.find(item => 
                item._id.year === year && item._id.month === month
            );
            
            chartData.push({
                month: monthNames[month - 1],
                revenue: monthData ? monthData.revenue : 0,
                orders: monthData ? monthData.orders : 0
            });
        }

        res.json(chartData);
    } catch (error) {
        console.error('Lỗi lấy thống kê doanh thu:', error);
        res.status(500).json({ message: 'Lỗi lấy thống kê doanh thu', error: error.message });
    }
});

// Get product category distribution for pie chart (admin only)
router.get('/product-categories', [auth, admin], async (req, res) => {
    try {
        // Get product sales by category
        const categoryData = await Order.aggregate([
            { $unwind: '$items' },
            {
                $lookup: {
                    from: 'products',
                    localField: 'items.product',
                    foreignField: '_id',
                    as: 'productInfo'
                }
            },
            { $unwind: '$productInfo' },
            {
                $lookup: {
                    from: 'categories',
                    localField: 'productInfo.category',
                    foreignField: '_id',
                    as: 'categoryInfo'
                }
            },
            { $unwind: '$categoryInfo' },
            {
                $group: {
                    _id: '$categoryInfo.name',
                    value: { $sum: '$items.quantity' }
                }
            },
            { $sort: { value: -1 } }
        ]);

        // Calculate total and percentages
        const total = categoryData.reduce((sum, item) => sum + item.value, 0);
        
        // Define colors for pie chart
        const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1', '#d084d0', '#ffb347'];
        
        const chartData = categoryData.map((item, index) => ({
            name: item._id || 'Unknown Category',
            value: total > 0 ? Math.round((item.value / total) * 100) : 0,
            color: colors[index % colors.length]
        }));

        // If no data, return default categories
        if (chartData.length === 0) {
            res.json([
                { name: 'Action Figures', value: 35, color: '#8884d8' },
                { name: 'Model Kits', value: 25, color: '#82ca9d' },
                { name: 'Collectibles', value: 20, color: '#ffc658' },
                { name: 'Accessories', value: 12, color: '#ff7c7c' },
                { name: 'Others', value: 8, color: '#8dd1e1' }
            ]);
        }

        res.json(chartData);
    } catch (error) {
        console.error('Lỗi lấy danh mục sản phẩm:', error);
        res.status(500).json({ message: 'Lỗi lấy danh mục sản phẩm', error: error.message });
    }
});

module.exports = router; 
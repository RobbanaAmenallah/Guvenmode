import { Router } from 'express';
import { requireAdmin } from '../middlewares/auth.js';
import { uploadLimiter } from '../middlewares/rateLimiter.js';
import { AdminController } from '../controllers/adminController.js';
import { UploadController, uploadMiddleware } from '../controllers/uploadController.js';

export const adminRoutes = Router();

// Protect all admin endpoints
adminRoutes.use(requireAdmin);

// Direct File & Video Upload to Supabase Storage CDN (PC Import)
adminRoutes.post('/upload', uploadLimiter, uploadMiddleware.single('file'), UploadController.uploadFile);

// Dashboard
adminRoutes.get('/dashboard', AdminController.getDashboard);

// Orders
adminRoutes.get('/orders', AdminController.getOrders);
adminRoutes.get('/orders/:id', AdminController.getOrderById);
adminRoutes.patch('/orders/:id/status', AdminController.updateOrderStatus);
adminRoutes.patch('/orders/:id/note', AdminController.updateOrderNote);
adminRoutes.patch('/orders/:id', AdminController.updateOrder);

// Products
adminRoutes.get('/products', AdminController.getProducts);
adminRoutes.post('/products', AdminController.createProduct);
adminRoutes.patch('/products/:id', AdminController.updateProduct);
adminRoutes.delete('/products/:id', AdminController.deleteProduct);

// Inventory
adminRoutes.get('/inventory', AdminController.getInventory);
adminRoutes.post('/inventory/adjust', AdminController.adjustStock);
adminRoutes.get('/inventory/movements', AdminController.getInventoryMovements);

// Categories & Collections
adminRoutes.get('/categories', AdminController.getCategories);
adminRoutes.post('/categories', AdminController.createCategory);
adminRoutes.patch('/categories/:id', AdminController.updateCategory);
adminRoutes.delete('/categories/:id', AdminController.deleteCategory);

adminRoutes.get('/collections', AdminController.getCollections);
adminRoutes.post('/collections', AdminController.createCollection);
adminRoutes.patch('/collections/:id', AdminController.updateCollection);
adminRoutes.delete('/collections/:id', AdminController.deleteCollection);

// Promotions
adminRoutes.get('/promotions', AdminController.getPromotions);
adminRoutes.post('/promotions', AdminController.createPromotion);
adminRoutes.patch('/promotions/:id', AdminController.updatePromotion);
adminRoutes.delete('/promotions/:id', AdminController.deletePromotion);

// Settings
adminRoutes.get('/settings', AdminController.getSettings);
adminRoutes.patch('/settings', AdminController.updateSettings);

// Customers
adminRoutes.get('/customers', AdminController.getCustomers);

// Notifications
adminRoutes.get('/notifications', AdminController.getNotifications);
adminRoutes.patch('/notifications/read-all', AdminController.markAllNotificationsRead);
adminRoutes.patch('/notifications/:id/read', AdminController.markNotificationRead);

import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.js';
import { OrderController } from '../controllers/orderController.js';
import { CartController } from '../controllers/cartController.js';

export const customerRoutes = Router();

// All customer routes require authenticated user
customerRoutes.use(requireAuth);

customerRoutes.get('/orders', OrderController.getCustomerOrders);

// Cart synchronization for authenticated customers
customerRoutes.get('/cart', CartController.getCart);
customerRoutes.post('/cart/sync', CartController.syncCart);
customerRoutes.post('/cart/merge', CartController.mergeCart);
customerRoutes.delete('/cart', CartController.clearCart);

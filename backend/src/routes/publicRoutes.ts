import { Router } from 'express';
import { ProductController } from '../controllers/productController.js';
import { CatalogController } from '../controllers/catalogController.js';
import { CheckoutController } from '../controllers/checkoutController.js';
import { OrderController } from '../controllers/orderController.js';
import { AuthController } from '../controllers/authController.js';
import { authenticate, requireAuth } from '../middlewares/auth.js';
import { authLimiter, checkoutAndPromoLimiter } from '../middlewares/rateLimiter.js';

export const publicRoutes = Router();

// Authentication (brute-force protected)
publicRoutes.post('/auth/login', authLimiter, AuthController.login);
publicRoutes.post('/auth/register', authLimiter, AuthController.register);
publicRoutes.get('/auth/me', requireAuth, AuthController.getMe);

// Products & Catalog
publicRoutes.get('/products', ProductController.getProducts);
publicRoutes.get('/products/:slug', ProductController.getProductBySlug);
publicRoutes.get('/categories', CatalogController.getCategories);
publicRoutes.get('/collections', CatalogController.getCollections);
publicRoutes.get('/homepage', CatalogController.getHomepageData);
publicRoutes.get('/settings/public', CatalogController.getPublicSettings);

// Promotions (rate limited to prevent code enumeration)
publicRoutes.post('/promotions/validate', checkoutAndPromoLimiter, CatalogController.validatePromotion);

// Newsletter
publicRoutes.post('/newsletter/subscribe', checkoutAndPromoLimiter, CatalogController.subscribeNewsletter);

// Contact & Conciergerie Message
publicRoutes.post('/contact', checkoutAndPromoLimiter, CatalogController.submitContactMessage);

// Checkout (supports both authenticated customer and Guest COD checkout)
publicRoutes.post('/checkout', authenticate, checkoutAndPromoLimiter, CheckoutController.checkout);
publicRoutes.get('/orders/:reference', authenticate, OrderController.getOrderByReference);

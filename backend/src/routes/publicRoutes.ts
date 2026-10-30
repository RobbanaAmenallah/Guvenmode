import { Router } from 'express';
import { ProductController } from '../controllers/productController.js';
import { CatalogController } from '../controllers/catalogController.js';
import { CheckoutController } from '../controllers/checkoutController.js';
import { OrderController } from '../controllers/orderController.js';
import { AuthController } from '../controllers/authController.js';

export const publicRoutes = Router();

// Authentication
publicRoutes.post('/auth/login', AuthController.login);
publicRoutes.post('/auth/register', AuthController.register);
publicRoutes.get('/auth/me', AuthController.getMe);

// Products & Catalog
publicRoutes.get('/products', ProductController.getProducts);
publicRoutes.get('/products/:slug', ProductController.getProductBySlug);
publicRoutes.get('/categories', CatalogController.getCategories);
publicRoutes.get('/collections', CatalogController.getCollections);
publicRoutes.get('/homepage', CatalogController.getHomepageData);
publicRoutes.get('/settings/public', CatalogController.getPublicSettings);

// Promotions
publicRoutes.post('/promotions/validate', CatalogController.validatePromotion);

// Newsletter
publicRoutes.post('/newsletter/subscribe', CatalogController.subscribeNewsletter);

// Checkout & Order Tracking
publicRoutes.post('/checkout', CheckoutController.checkout);
publicRoutes.get('/orders/:reference', OrderController.getOrderByReference);

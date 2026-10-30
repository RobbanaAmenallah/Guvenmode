import { Request, Response, NextFunction } from 'express';
import { CategoryService } from '../services/categoryService.js';
import { PromotionService } from '../services/promotionService.js';
import { SettingsService } from '../services/settingsService.js';
import { ProductService } from '../services/productService.js';

export class CatalogController {
  public static async getCategories(req: Request, res: Response, next: NextFunction) {
    try {
      const categories = await CategoryService.getCategories();
      res.json({ success: true, data: categories });
    } catch (err) {
      next(err);
    }
  }

  public static async getCollections(req: Request, res: Response, next: NextFunction) {
    try {
      const collections = await CategoryService.getCollections();
      res.json({ success: true, data: collections });
    } catch (err) {
      next(err);
    }
  }

  public static async getHomepageData(req: Request, res: Response, next: NextFunction) {
    try {
      const [categories, collections, featured, newArrivals, settings] = await Promise.all([
        CategoryService.getCategories(),
        CategoryService.getCollections(),
        ProductService.getProducts({ featured: true, limit: 4 }),
        ProductService.getProducts({ sort: 'newest', limit: 8 }),
        SettingsService.getPublicSettings()
      ]);

      res.json({
        success: true,
        data: {
          categories,
          collections,
          featuredProducts: featured.products,
          newArrivals: newArrivals.products,
          hero: settings.settings.hero,
          announcement: settings.settings.announcement,
          settings: settings.settings.general
        }
      });
    } catch (err) {
      next(err);
    }
  }

  public static async getPublicSettings(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await SettingsService.getPublicSettings();
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  public static async validatePromotion(req: Request, res: Response, next: NextFunction) {
    try {
      const { code, subtotal } = req.body;
      if (!code) {
        return res.status(400).json({
          success: false,
          error: { message: 'Code promo requis', statusCode: 400 }
        });
      }

      const result = await PromotionService.validateCode(code, Number(subtotal) || 0);
      if (!result.valid) {
        return res.status(400).json({
          success: false,
          error: { message: result.message || 'Code promo invalide', statusCode: 400 }
        });
      }

      res.json({
        success: true,
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  public static async subscribeNewsletter(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;
      const result = await SettingsService.subscribeNewsletter(email);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
}

import { Request, Response, NextFunction } from 'express';
import { ProductService } from '../services/productService.js';

export class ProductController {
  public static async getProducts(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        category,
        collection,
        minPrice,
        maxPrice,
        size,
        color,
        inStock,
        onSale,
        featured,
        search,
        sort,
        page,
        limit
      } = req.query;

      const result = await ProductService.getProducts({
        category: category as string,
        collection: collection as string,
        minPrice: minPrice ? Number(minPrice) : undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
        size: size as string,
        color: color as string,
        inStock: inStock === 'true',
        onSale: onSale === 'true',
        featured: featured === 'true' ? true : undefined,
        search: search as string,
        sort: sort as any,
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 12
      });

      res.json({
        success: true,
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  public static async getProductBySlug(req: Request, res: Response, next: NextFunction) {
    try {
      const slug = String(req.params.slug);
      const product = await ProductService.getProductBySlug(slug);

      if (!product) {
        return res.status(404).json({
          success: false,
          error: { message: 'Produit introuvable', statusCode: 404 }
        });
      }

      res.json({
        success: true,
        data: product
      });
    } catch (err) {
      next(err);
    }
  }
}

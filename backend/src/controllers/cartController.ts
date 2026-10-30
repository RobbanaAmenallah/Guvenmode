import { Request, Response, NextFunction } from 'express';
import { CartService } from '../services/cartService.js';

export class CartController {
  public static async getCart(req: Request, res: Response, next: NextFunction) {
    try {
      const customerId = req.user?.id;
      if (!customerId) {
        return res.status(401).json({ success: false, error: { message: 'Authentification requise', statusCode: 401 } });
      }

      const items = await CartService.getCustomerCart(customerId);
      res.json({ success: true, data: { items } });
    } catch (err) {
      next(err);
    }
  }

  public static async syncCart(req: Request, res: Response, next: NextFunction) {
    try {
      const customerId = req.user?.id;
      if (!customerId) {
        return res.status(401).json({ success: false, error: { message: 'Authentification requise', statusCode: 401 } });
      }

      const items = req.body.items || [];
      const updated = await CartService.syncCustomerCart(customerId, items);
      res.json({ success: true, data: { items: updated } });
    } catch (err) {
      next(err);
    }
  }

  public static async mergeCart(req: Request, res: Response, next: NextFunction) {
    try {
      const customerId = req.user?.id;
      if (!customerId) {
        return res.status(401).json({ success: false, error: { message: 'Authentification requise', statusCode: 401 } });
      }

      const guestItems = req.body.items || [];
      const merged = await CartService.mergeCustomerCart(customerId, guestItems);
      res.json({ success: true, data: { items: merged } });
    } catch (err) {
      next(err);
    }
  }

  public static async clearCart(req: Request, res: Response, next: NextFunction) {
    try {
      const customerId = req.user?.id;
      if (!customerId) {
        return res.status(401).json({ success: false, error: { message: 'Authentification requise', statusCode: 401 } });
      }

      await CartService.clearCustomerCart(customerId);
      res.json({ success: true, message: 'Panier vidé' });
    } catch (err) {
      next(err);
    }
  }
}

import { Request, Response, NextFunction } from 'express';
import { OrderService } from '../services/orderService.js';

export class OrderController {
  public static async getCustomerOrders(req: Request, res: Response, next: NextFunction) {
    try {
      const customerId = req.user?.id;
      const customerEmail = req.user?.email;
      if (!customerId) {
        return res.status(401).json({
          success: false,
          error: { message: 'Authentification requise', statusCode: 401 }
        });
      }

      const result = await OrderService.getOrders({
        customer_id: customerId,
        search: customerEmail
      });
      res.json({ success: true, data: result.orders });
    } catch (err) {
      next(err);
    }
  }

  public static async getOrderByReference(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: { message: 'Authentification requise pour consulter une commande', statusCode: 401 }
        });
      }

      const reference = String(req.params.reference);
      let order = await OrderService.getOrderByNumber(reference);

      if (!order) {
        order = await OrderService.getOrderById(reference);
      }

      if (!order) {
        return res.status(404).json({
          success: false,
          error: { message: 'Commande introuvable', statusCode: 404 }
        });
      }

      const isAdmin = req.user.role === 'admin' || req.user.role === 'super_admin';
      if (!isAdmin && order.customer_id !== req.user.id) {
        return res.status(403).json({
          success: false,
          error: { message: 'Accès non autorisé à cette commande', statusCode: 403 }
        });
      }

      res.json({ success: true, data: order });
    } catch (err) {
      next(err);
    }
  }
}

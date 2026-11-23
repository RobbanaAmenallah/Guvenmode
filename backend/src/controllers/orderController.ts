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

      // Authorization check: Admin, Order owner, or Guest with phone verification
      if (req.user) {
        const isAdmin = req.user.role === 'admin' || req.user.role === 'super_admin';
        if (!isAdmin && order.customer_id && order.customer_id !== req.user.id) {
          return res.status(403).json({
            success: false,
            error: { message: 'Accès non autorisé à cette commande', statusCode: 403 }
          });
        }
      } else {
        // Guest lookup: require matching phone number
        const phone = String(req.query.phone || '').trim();
        const cleanOrderPhone = (order.customer_phone || '').replace(/[\s\-\.]/g, '').slice(-8);
        const cleanQueryPhone = phone.replace(/[\s\-\.]/g, '').slice(-8);

        if (!cleanQueryPhone || cleanQueryPhone.length < 8 || cleanOrderPhone !== cleanQueryPhone) {
          return res.status(401).json({
            success: false,
            error: { message: 'Numéro de téléphone requis pour le suivi de commande', statusCode: 401 }
          });
        }
      }

      res.json({ success: true, data: order });
    } catch (err) {
      next(err);
    }
  }
}

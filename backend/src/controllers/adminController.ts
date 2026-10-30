import { Request, Response, NextFunction } from 'express';
import { AdminService } from '../services/adminService.js';
import { OrderService } from '../services/orderService.js';
import { ProductService } from '../services/productService.js';
import { InventoryService } from '../services/inventoryService.js';
import { CategoryService } from '../services/categoryService.js';
import { PromotionService } from '../services/promotionService.js';
import { SettingsService } from '../services/settingsService.js';
import { db } from '../data/dbStore.js';
import { getSupabase } from '../config/supabase.js';

export class AdminController {
  // Dashboard & Analytics
  public static async getDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await AdminService.getDashboardStats();
      res.json({ success: true, data: stats });
    } catch (err) {
      next(err);
    }
  }

  // Orders
  public static async getOrders(req: Request, res: Response, next: NextFunction) {
    try {
      const { status, payment_status, search, page, limit } = req.query;
      const parsedPage = page ? Number(page) : 1;
      const parsedLimit = limit ? Number(limit) : 20;
      const offset = (parsedPage - 1) * parsedLimit;

      const result = await OrderService.getOrders({
        status: status as string,
        payment_status: payment_status as string,
        search: search as string,
        limit: parsedLimit,
        offset
      });

      res.json({
        success: true,
        data: {
          orders: result.orders,
          total: result.total,
          page: parsedPage,
          totalPages: Math.ceil(result.total / parsedLimit) || 1
        }
      });
    } catch (err) {
      next(err);
    }
  }

  public static async getOrderById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = String(req.params.id);
      const order = await OrderService.getOrderById(id);
      if (!order) {
        return res.status(404).json({ success: false, error: { message: 'Commande introuvable', statusCode: 404 } });
      }
      res.json({ success: true, data: order });
    } catch (err) {
      next(err);
    }
  }

  public static async updateOrderStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const id = String(req.params.id);
      const { status, note } = req.body;
      if (!status) {
        return res.status(400).json({ success: false, error: { message: 'Statut requis', statusCode: 400 } });
      }

      const updated = await OrderService.updateOrderStatus(id, status, req.user?.id, note);
      res.json({ success: true, data: updated });
    } catch (err: any) {
      res.status(400).json({ success: false, error: { message: err.message, statusCode: 400 } });
    }
  }

  public static async updateOrderNote(req: Request, res: Response, next: NextFunction) {
    try {
      const id = String(req.params.id);
      const { note } = req.body;
      const updated = await OrderService.updateAdminNote(id, note || '');
      res.json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  }

  public static async updateOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const id = String(req.params.id);
      const updated = await OrderService.updateOrder(id, req.body);
      res.json({ success: true, data: updated });
    } catch (err: any) {
      res.status(400).json({ success: false, error: { message: err.message, statusCode: 400 } });
    }
  }

  // Products CRUD
  public static async getProducts(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await ProductService.getProducts({
        status: 'all',
        page: req.query.page ? Number(req.query.page) : 1,
        limit: req.query.limit ? Number(req.query.limit) : 50,
        search: req.query.search as string
      });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  public static async createProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const product = await ProductService.createProduct(req.body);
      res.status(201).json({ success: true, data: product });
    } catch (err: any) {
      res.status(400).json({ success: false, error: { message: err.message, statusCode: 400 } });
    }
  }

  public static async updateProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const id = String(req.params.id);
      const product = await ProductService.updateProduct(id, req.body);
      res.json({ success: true, data: product });
    } catch (err: any) {
      res.status(400).json({ success: false, error: { message: err.message, statusCode: 400 } });
    }
  }

  public static async deleteProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const id = String(req.params.id);
      const success = await ProductService.deleteProduct(id);
      res.json({ success });
    } catch (err) {
      next(err);
    }
  }

  // Inventory
  public static async getInventory(req: Request, res: Response, next: NextFunction) {
    try {
      const list = await InventoryService.getInventoryList();
      res.json({ success: true, data: list });
    } catch (err) {
      next(err);
    }
  }

  public static async adjustStock(req: Request, res: Response, next: NextFunction) {
    try {
      const { variantId, quantityOnHand, reason } = req.body;
      if (variantId === undefined || quantityOnHand === undefined) {
        return res.status(400).json({
          success: false,
          error: { message: 'Identifiant de variante et quantité requis', statusCode: 400 }
        });
      }

      const result = await InventoryService.adjustStock(
        variantId,
        Number(quantityOnHand),
        req.user?.id,
        reason
      );
      res.json({ success: true, data: result });
    } catch (err: any) {
      res.status(400).json({ success: false, error: { message: err.message, statusCode: 400 } });
    }
  }

  public static async getInventoryMovements(req: Request, res: Response, next: NextFunction) {
    try {
      const { variantId } = req.query;
      const movements = await InventoryService.getMovements(variantId as string);
      res.json({ success: true, data: movements });
    } catch (err) {
      next(err);
    }
  }

  // Categories & Collections
  public static async getCategories(req: Request, res: Response, next: NextFunction) {
    try {
      const cats = await CategoryService.getAllCategories();
      res.json({ success: true, data: cats });
    } catch (err) {
      next(err);
    }
  }

  public static async createCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const cat = await CategoryService.createCategory(req.body);
      res.status(201).json({ success: true, data: cat });
    } catch (err: any) {
      res.status(400).json({ success: false, error: { message: err.message, statusCode: 400 } });
    }
  }

  public static async updateCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const id = String(req.params.id);
      const cat = await CategoryService.updateCategory(id, req.body);
      res.json({ success: true, data: cat });
    } catch (err: any) {
      res.status(400).json({ success: false, error: { message: err.message, statusCode: 400 } });
    }
  }

  public static async getCollections(req: Request, res: Response, next: NextFunction) {
    try {
      const cols = await CategoryService.getAllCollections();
      res.json({ success: true, data: cols });
    } catch (err) {
      next(err);
    }
  }

  public static async createCollection(req: Request, res: Response, next: NextFunction) {
    try {
      const col = await CategoryService.createCollection(req.body);
      res.status(201).json({ success: true, data: col });
    } catch (err: any) {
      res.status(400).json({ success: false, error: { message: err.message, statusCode: 400 } });
    }
  }

  public static async updateCollection(req: Request, res: Response, next: NextFunction) {
    try {
      const id = String(req.params.id);
      const col = await CategoryService.updateCollection(id, req.body);
      res.json({ success: true, data: col });
    } catch (err: any) {
      res.status(400).json({ success: false, error: { message: err.message, statusCode: 400 } });
    }
  }

  // Promotions
  public static async getPromotions(req: Request, res: Response, next: NextFunction) {
    try {
      const promos = await PromotionService.getAllPromotions();
      res.json({ success: true, data: promos });
    } catch (err) {
      next(err);
    }
  }

  public static async createPromotion(req: Request, res: Response, next: NextFunction) {
    try {
      const promo = await PromotionService.createPromotion(req.body);
      res.status(201).json({ success: true, data: promo });
    } catch (err: any) {
      res.status(400).json({ success: false, error: { message: err.message, statusCode: 400 } });
    }
  }

  public static async updatePromotion(req: Request, res: Response, next: NextFunction) {
    try {
      const id = String(req.params.id);
      const promo = await PromotionService.updatePromotion(id, req.body);
      res.json({ success: true, data: promo });
    } catch (err: any) {
      res.status(400).json({ success: false, error: { message: err.message, statusCode: 400 } });
    }
  }

  // Settings
  public static async getSettings(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await SettingsService.getAllSettings();
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  public static async updateSettings(req: Request, res: Response, next: NextFunction) {
    try {
      const { key, value } = req.body;
      const updated = await SettingsService.updateSettings(key, value);
      res.json({ success: true, data: updated });
    } catch (err: any) {
      res.status(400).json({ success: false, error: { message: err.message, statusCode: 400 } });
    }
  }

  // Customers
  public static async getCustomers(req: Request, res: Response, next: NextFunction) {
    try {
      // Aggregate real customers from orders and profiles
      const customersMap: Record<string, any> = {};

      for (const order of db.orders) {
        const key = order.customer_id || order.customer_phone;
        if (!customersMap[key]) {
          customersMap[key] = {
            id: key,
            name: order.customer_name,
            phone: order.customer_phone,
            email: order.guest_email || 'client@guvenmode.tn',
            totalOrders: 0,
            totalSpent: 0,
            lastOrderDate: order.created_at,
            city: order.shipping_address_snapshot.city
          };
        }
        customersMap[key].totalOrders += 1;
        customersMap[key].totalSpent = Number((customersMap[key].totalSpent + order.total_amount).toFixed(3));
        if (new Date(order.created_at) > new Date(customersMap[key].lastOrderDate)) {
          customersMap[key].lastOrderDate = order.created_at;
        }
      }

      res.json({
        success: true,
        data: Object.values(customersMap)
      });
    } catch (err) {
      next(err);
    }
  }

  public static async deleteCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const id = String(req.params.id);
      const success = await CategoryService.deleteCategory(id);
      res.json({ success });
    } catch (err) {
      next(err);
    }
  }

  public static async deleteCollection(req: Request, res: Response, next: NextFunction) {
    try {
      const id = String(req.params.id);
      const success = await CategoryService.deleteCollection(id);
      res.json({ success });
    } catch (err) {
      next(err);
    }
  }

  public static async deletePromotion(req: Request, res: Response, next: NextFunction) {
    try {
      const id = String(req.params.id);
      const success = await PromotionService.deletePromotion(id);
      res.json({ success });
    } catch (err) {
      next(err);
    }
  }

  // Notifications
  public static async getNotifications(req: Request, res: Response, next: NextFunction) {
    try {
      const supabase = getSupabase();
      if (supabase) {
        const { data: notifs } = await supabase
          .from('notifications')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50);

        if (notifs) {
          const formatted = notifs.map((n: any) => ({
            id: n.id,
            type: n.type,
            title: n.title,
            message: n.message,
            related_entity_id: n.related_entity_id,
            read: !!n.read_at,
            created_at: n.created_at
          }));
          const unreadCount = formatted.filter((n: any) => !n.read).length;
          return res.json({
            success: true,
            data: {
              notifications: formatted,
              unreadCount
            }
          });
        }
      }

      const unreadCount = db.notifications.filter((n) => !n.read).length;
      res.json({
        success: true,
        data: {
          notifications: db.notifications.slice(0, 50),
          unreadCount
        }
      });
    } catch (err) {
      next(err);
    }
  }

  public static async markNotificationRead(req: Request, res: Response, next: NextFunction) {
    try {
      const id = String(req.params.id);
      const supabase = getSupabase();
      if (supabase) {
        await supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('id', id);
      }
      const notif = db.notifications.find((n) => n.id === id);
      if (notif) {
        notif.read = true;
      }
      res.json({ success: true, data: { id, read: true } });
    } catch (err) {
      next(err);
    }
  }

  public static async markAllNotificationsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const supabase = getSupabase();
      if (supabase) {
        await supabase.from('notifications').update({ read_at: new Date().toISOString() }).is('read_at', null);
      }
      db.notifications.forEach((n) => {
        n.read = true;
      });
      res.json({ success: true, message: 'Toutes les notifications ont été marquées comme lues' });
    } catch (err) {
      next(err);
    }
  }
}

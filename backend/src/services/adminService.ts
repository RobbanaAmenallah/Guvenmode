import { db } from '../data/dbStore.js';
import { InventoryService } from './inventoryService.js';
import { getSupabase } from '../config/supabase.js';
import { OrderService } from './orderService.js';
import { ProductService } from './productService.js';

export class AdminService {
  public static async getDashboardStats() {
    const supabase = getSupabase();

    if (supabase) {
      const { orders } = await OrderService.getOrders({ limit: 500 });
      const { products } = await ProductService.getProducts({ limit: 500, status: 'all' });

      const totalOrders = orders.length;
      const pendingOrders = orders.filter(o => o.status === 'pending').length;
      const confirmedOrders = orders.filter(o => o.status === 'confirmed').length;
      const preparingOrders = orders.filter(o => o.status === 'preparing').length;
      const shippedOrders = orders.filter(o => o.status === 'shipped').length;
      const deliveredOrders = orders.filter(o => o.status === 'delivered').length;
      const cancelledOrders = orders.filter(o => o.status === 'cancelled').length;

      const validOrders = orders.filter(o => o.status !== 'cancelled');
      const totalRevenue = Number(validOrders.reduce((sum, o) => sum + o.total_amount, 0).toFixed(3));
      const grossSales = Number(validOrders.reduce((sum, o) => sum + o.subtotal_amount, 0).toFixed(3));
      const totalDiscounts = Number(validOrders.reduce((sum, o) => sum + o.discount_amount, 0).toFixed(3));
      const totalShippingIncome = Number(validOrders.reduce((sum, o) => sum + o.shipping_amount, 0).toFixed(3));

      // Inventory calculations from products
      let lowStockCount = 0;
      let outOfStockCount = 0;
      for (const prod of products) {
        for (const v of prod.variants) {
          const avail = v.inventory?.available_stock ?? 0;
          const thresh = v.inventory?.low_stock_threshold ?? 2;
          if (avail === 0) outOfStockCount++;
          else if (avail <= thresh) lowStockCount++;
        }
      }

      const activeProducts = products.filter(p => p.status === 'published').length;

      // Top Selling Products
      const salesByProduct: Record<string, { name: string; quantity: number; revenue: number }> = {};
      for (const order of validOrders) {
        for (const item of order.items) {
          const key = item.product_id || item.product_name_snapshot;
          if (!salesByProduct[key]) {
            salesByProduct[key] = {
              name: item.product_name_snapshot,
              quantity: 0,
              revenue: 0
            };
          }
          salesByProduct[key].quantity += item.quantity;
          salesByProduct[key].revenue += item.line_total;
        }
      }

      const topSelling = Object.values(salesByProduct)
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5);

      // Last 7 days map
      const last7DaysMap: Record<string, { date: string; sales: number; orders: number }> = {};
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dayKey = d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
        last7DaysMap[dayKey] = { date: dayKey, sales: 0, orders: 0 };
      }

      for (const order of validOrders) {
        const dayKey = new Date(order.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
        if (last7DaysMap[dayKey]) {
          last7DaysMap[dayKey].sales = Number((last7DaysMap[dayKey].sales + order.total_amount).toFixed(3));
          last7DaysMap[dayKey].orders += 1;
        }
      }

      return {
        kpi: {
          totalOrders,
          pendingOrders,
          confirmedOrders,
          preparingOrders,
          shippedOrders,
          deliveredOrders,
          cancelledOrders,
          totalRevenue,
          grossSales,
          totalDiscounts,
          totalShippingIncome,
          activeProducts,
          totalProducts: products.length,
          lowStockCount,
          outOfStockCount,
          currency: 'TND'
        },
        topSelling,
        salesChart: Object.values(last7DaysMap),
        recentOrders: orders.slice(0, 5)
      };
    }

    // Memory fallback
    const totalOrders = db.orders.length;
    const validOrders = db.orders.filter(o => o.status !== 'cancelled');
    const totalRevenue = Number(validOrders.reduce((sum, o) => sum + o.total_amount, 0).toFixed(3));
    const grossSales = Number(validOrders.reduce((sum, o) => sum + o.subtotal_amount, 0).toFixed(3));
    const totalDiscounts = Number(validOrders.reduce((sum, o) => sum + o.discount_amount, 0).toFixed(3));
    const totalShippingIncome = Number(validOrders.reduce((sum, o) => sum + o.shipping_amount, 0).toFixed(3));

    const inventoryList = await InventoryService.getInventoryList();
    const lowStockCount = inventoryList.filter(i => i.status === 'low_stock').length;
    const outOfStockCount = inventoryList.filter(i => i.status === 'out_of_stock').length;
    const totalProducts = db.products.length;
    const activeProducts = db.products.filter(p => p.status === 'published').length;

    return {
      kpi: {
        totalOrders,
        pendingOrders: db.orders.filter(o => o.status === 'pending').length,
        confirmedOrders: db.orders.filter(o => o.status === 'confirmed').length,
        preparingOrders: db.orders.filter(o => o.status === 'preparing').length,
        shippedOrders: db.orders.filter(o => o.status === 'shipped').length,
        deliveredOrders: db.orders.filter(o => o.status === 'delivered').length,
        cancelledOrders: db.orders.filter(o => o.status === 'cancelled').length,
        totalRevenue,
        grossSales,
        totalDiscounts,
        totalShippingIncome,
        activeProducts,
        totalProducts,
        lowStockCount,
        outOfStockCount,
        currency: 'TND'
      },
      topSelling: [],
      salesChart: [],
      recentOrders: db.orders.slice(0, 5)
    };
  }
}

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { CheckoutService } from '../services/checkoutService.js';

const checkoutSchema = z.object({
  customerId: z.string().optional().nullable(),
  guestEmail: z.string().email('Format email invalide').optional().nullable(),
  customerName: z.string().min(2, 'Le nom doit comporter au moins 2 caractères'),
  customerPhone: z.string().min(8, 'Le numéro de téléphone doit comporter au moins 8 chiffres'),
  shippingAddress: z.object({
    recipientName: z.string().min(2, 'Nom du destinataire requis'),
    phone: z.string().min(8, 'Téléphone requis'),
    region: z.string().min(2, 'Gouvernorat requis'),
    city: z.string().min(2, 'Ville requise'),
    streetAddress: z.string().min(4, 'Adresse requise'),
    postalCode: z.string().optional(),
    notes: z.string().optional()
  }),
  shippingMethodId: z.string().optional(),
  paymentMethod: z.string().default('cod'),
  items: z.array(
    z.object({
      variantId: z.string().min(1, 'ID de variante requis'),
      quantity: z.number().int().positive('La quantité doit être positive')
    })
  ).min(1, 'Le panier ne peut pas être vide'),
  promoCode: z.string().optional(),
  customerNote: z.string().optional(),
  idempotencyKey: z.string().optional()
});

export class CheckoutController {
  public static async checkout(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = checkoutSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Données de commande invalides',
            statusCode: 400,
            details: parsed.error.flatten()
          }
        });
      }

      // If user is authenticated, attach their customerId
      const input = {
        ...parsed.data,
        customerId: req.user?.id || parsed.data.customerId
      };

      const order = await CheckoutService.processCheckout(input);

      res.status(201).json({
        success: true,
        data: order
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: {
          message: err.message || 'Échec de la validation de commande',
          statusCode: 400
        }
      });
    }
  }
}

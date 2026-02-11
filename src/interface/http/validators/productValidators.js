import { z } from 'zod';

export const ProductIdSchema = z.object({
    id: z.string().regex(/^\d+$/, 'Product ID must be a number')
});

export const SearchQuerySchema = z.object({
    q: z.string().max(200, 'Search query too long').trim().optional()
});

export const PurchaseSchema = z.object({
    mail: z.string().email('Invalid email format'),
    address: z.string().min(1, 'Address is required').max(200),
    ship_date: z.string().min(1, 'Ship date is required'),
    phone: z.string().min(1, 'Phone is required').max(40),
    price: z.string().min(1, 'Price is required'),
    product_id: z.string().min(1, 'Product ID is required'),
    product_name: z.string().min(1, 'Product name is required').max(100)
});

export function validateProductId(req, res, next) {
    try {
        const url_params = new URL(req.url, 'http://localhost').searchParams;
        ProductIdSchema.parse({ id: url_params.get('id') });
        next();
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ message: error.errors[0].message });
        }
        next(error);
    }
}

export function validateSearchQuery(req, res, next) {
    try {
        const url_params = new URL(req.url, 'http://localhost').searchParams;
        const q = url_params.get('q');
        if (q !== null) {
            SearchQuerySchema.parse({ q });
        }
        next();
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ message: error.errors[0].message });
        }
        next(error);
    }
}

export function validatePurchase(req, res, next) {
    try {
        const params = req.method === 'GET'
            ? Object.fromEntries(new URL(req.url, 'http://localhost').searchParams)
            : req.body;
        req.validatedBody = PurchaseSchema.parse(params);
        next();
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ message: error.errors[0].message });
        }
        next(error);
    }
}

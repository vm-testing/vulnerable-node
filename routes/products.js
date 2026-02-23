import express from 'express';
import check_logged from './login_check.js';
import url from 'url';
import db_products from '../model/products.js';
import { validateProductId, validateSearchQuery, validatePurchase } from '../src/interface/http/validators/productValidators.js';

const router = express.Router();

// Apply auth middleware to all product routes
router.use(check_logged);

/* GET home page. */
router.get('/', function(req, res, next) {
    db_products.list()
        .then(function (data) {
            res.render('products', { products: data });
        })
        .catch(function (err) {
            console.error('[PRODUCTS] Error listing products:', err.message);
            res.render('products', { products: [] });
        });
});

router.get('/products/purchased', function(req, res, next) {
    db_products.getPurchased(req.session.user_name)
        .then(function (data) {
            res.render('bought_products', { products: data });
        })
        .catch(function (err) {
            console.error('[PRODUCTS] Error getting purchases:', err.message);
            res.render('bought_products', { products: [] });
        });
});

router.get('/products/detail', validateProductId, function(req, res, next) {
    const url_params = url.parse(req.url, true).query;
    const product_id = url_params.id;

    db_products.getProduct(product_id)
        .then(function (data) {
            if (!data) {
                return res.status(404).render('error', { message: 'Product not found', error: {} });
            }
            res.render('product_detail', { product: data });
        })
        .catch(function (err) {
            console.error('[PRODUCTS] Error getting product detail:', err.message);
            res.render('products', { products: [] });
        });
});

router.get('/products/search', validateSearchQuery, function(req, res, next) {
    const url_params = url.parse(req.url, true).query;
    const query = url_params.q;

    if (query === undefined || query === '') {
        res.render('search', { in_query: "", products: [] });
        return;
    }

    db_products.search(query)
        .then(function (data) {
            res.render('search', { in_query: query, products: data || [] });
        })
        .catch(function (err) {
            console.error('[PRODUCTS] Error searching products:', err.message);
            res.render('search', { in_query: query, products: [] });
        });
});

router.all('/products/buy', validatePurchase, function(req, res, next) {
    let params = null;
    if (req.method === "GET") {
        params = url.parse(req.url, true).query;
    } else {
        params = req.body;
    }

    let cart = null;
    try {
        if (params.price === undefined) {
            throw new Error("Missing parameter 'price'");
        }
        cart = {
            mail: params.mail,
            address: params.address,
            ship_date: params.ship_date,
            phone: params.phone,
            product_id: params.product_id,
            product_name: params.product_name,
            username: req.session.user_name,
            price: params.price.substr(0, params.price.length - 1)
        };

        const re = /^([a-zA-Z0-9])(([\-.]|[_]+)?([a-zA-Z0-9]+))*(@){1}[a-z0-9]+[.]{1}(([a-z]{2,3})|([a-z]{2,3}[.]{1}[a-z]{2,3}))$/;
        if (!re.test(cart.mail)) {
            throw new Error("Invalid mail format");
        }

        for (const prop in cart) {
            if (cart[prop] === undefined) {
                throw new Error("Missing parameter '" + prop + "'");
            }
        }
    } catch (err) {
        return res.status(400).json({ message: err.message });
    }

    db_products.purchase(cart)
        .then(function () {
            return res.json({ message: "Product purchased correctly" });
        })
        .catch(function (err) {
            console.error('[PRODUCTS] Error purchasing product:', err.message);
            return res.status(500).json({ message: "Error processing purchase" });
        });
});

export default router;

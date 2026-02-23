import db from './db.js';

function list_products() {
    return db.manyOrNone("SELECT * FROM products;");
}

function getProduct(product_id) {
    return db.oneOrNone("SELECT * FROM products WHERE id = $1", [product_id]);
}

function search(query) {
    return db.manyOrNone("SELECT * FROM products WHERE name ILIKE $1 OR description ILIKE $1", ['%' + query + '%']);
}

function purchase(cart) {
    return db.none(
        "INSERT INTO purchases(mail, product_name, user_name, product_id, address, phone, ship_date, price) VALUES($1, $2, $3, $4, $5, $6, $7, $8)",
        [cart.mail, cart.product_name, cart.username, cart.product_id, cart.address, cart.phone, cart.ship_date, cart.price]
    );
}

function get_purcharsed(username) {
    return db.manyOrNone("SELECT * FROM purchases WHERE user_name = $1", [username]);
}

const actions = {
    "list": list_products,
    "getProduct": getProduct,
    "search": search,
    "purchase": purchase,
    "getPurchased": get_purcharsed
};

export default actions;

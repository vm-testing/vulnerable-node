import url from 'url';
import express from 'express';
import auth from '../model/auth.js';
import { validateLogin } from '../src/interface/http/validators/authValidators.js';

const router = express.Router();

// Sanitize redirect URL to prevent open redirect
function sanitizeReturnUrl(returnurl) {
    if (!returnurl || typeof returnurl !== 'string') return '/';
    // Only allow relative paths, prevent protocol-relative URLs
    if (!returnurl.startsWith('/') || returnurl.startsWith('//')) return '/';
    return returnurl;
}

// Login template
router.get('/login', function(req, res, next) {
    const url_params = url.parse(req.url, true).query;
    res.render('login', {
        returnurl: url_params.returnurl || '/',
        auth_error: url_params.error
    });
});

// Do auth
router.post('/login/auth', validateLogin, function(req, res) {
    const user = req.body.username;
    const password = req.body.password;
    const returnurl = sanitizeReturnUrl(req.body.returnurl);

    console.log("[AUTH] Login attempt from user:", user);

    auth(user, password)
        .then(function (data) {
            req.session.logged = true;
            req.session.user_name = user;
            res.redirect(returnurl);
        })
        .catch(function (err) {
            res.redirect("/login?returnurl=" + encodeURIComponent(returnurl) + "&error=" + encodeURIComponent("Invalid credentials"));
        });
});

// Do logout
router.get('/logout', function(req, res, next) {
    req.session.destroy(function(err) {
        res.redirect("/login");
    });
});

export default router;

function check_logged(req, res, next) {
    if (req.session.logged === undefined || req.session.logged === false) {
        return res.redirect("/login?returnurl=" + encodeURIComponent(req.url));
    }
    next();
}

export default check_logged;

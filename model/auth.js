var config = require("../config"),
    pgp = require('pg-promise')();

function do_auth(username, password) {
    var db = pgp(config.db.connectionString);

    // ✅ FIXED: Parameterized query to prevent SQL injection
    // Using $1 and $2 placeholders instead of string concatenation
    var q = "SELECT * FROM users WHERE name = $1 AND password = $2";

    // Pass values as separate array - pg-promise will escape them safely
    return db.oneOrNone(q, [username, password])
        .then(function(user) {
            if (!user) {
                // No user found - reject with error to trigger catch block
                throw new Error("Invalid credentials");
            }
            return user;
        });
}

module.exports = do_auth;
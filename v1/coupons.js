var lib = require("./lib.js");
var util = require("util");

function setPaid(couponId) {
    var conn = lib.getConnection(function (error) {
        if (error) {
            console.error("Error connecting to DB");
            return;
        }
    });
    conn.query("UPDATE `coupons` SET coupon_paid=1, coupon_date_paid=" +
        new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '') +
        " WHERE coupon_id='" + couponId + "'", function (err, rows, fields) {
        if (err)console.error("Smthng gone wrong. Stack: " + err.stack)
    });
}
function createChildren(couponId, amount) {
    var conn = lib.getConnection(function (error) {
        if (error) {
            console.error("Error connecting to DB");
            return;
        }
    });
    var item;
    var price;
    conn.query("SELECT `coupon_price`,`coupon_item` FROM coupons WHERE coupon_id='" + req.params.id + "'", function (err, rows, fields) {
        item = rows[0].coupon_item;
        price = rows[0].coupon_price;
    });
    var generatedId;
    var resultJson = "[";
    for (var i = 0; i < amount; i++) {
        generatedId[i] = lib.getNewHash();
        resultJson += "\"" + generatedId[i] + "\",";
        conn.query("INSERT INTO `coupons`(`coupon_id`, `coupon_item`,`coupon_price`) VALUES ('" + generatedId[i] + "', " +
            item + ", " + price + ")", function (err, rows, fields) {
            if (err) {
                console.error("Smthg gone wrong, stack: " + err.stack);
                return;
            }
        })
    }
    conn.query("UPDATE `coupons` SET children='" + resultJson.substring(0, resultJson.length - 1) + "]' WHERE coupon_id='" + couponId + "'");
    conn.end();
}

function getAll(req, res) {
    var conn = lib.getConnection(function (err) {
        if (err) {
            console.error("Error connecing to database: " + err.stack);
            res.statusCode = 500;
            res.send("{error: 500, desc: 'Error connecting to DB: " + err.stack + "'}");
            return;
        }
        console.log("Connection to dev@localhost successful! Connection ID: " + conn.threadId);
    });

    conn.query("SELECT * FROM coupons", function (err, rows, fields) {
        if (err) {
            res.statusCode = 500;
            res.json({error: 500, desc: "Error connecting to DB: " + error.stack});
            return;
        }
        res.statusCode = 200;
        res.type("application/json");
        var r = "[";
        rows.forEach(function (i) {
            r += "{\"id\": \"" + i.coupon_id + "\", \"owned\": \"" + i.coupon_owned + "\", " +
                "\"paid\": " + i.coupon_paid + ", \"price\": " + i.coupon_price + ", \"currency\": \"" + i.coupon_currency +
                "\", \"item\": " + i.coupon_item + ", \"date_created\": \"" + i.coupon_date_created + "\", " +
                "\"date_paid\": \"" + i.coupon_date_paid + "\", \"children\": " + i.coupon_children + "},";
        });
        res.send(r.substring(0, r.length - 1) + "]");
        conn.end()
    });
}
function getById(req, res) { //get certain coupon by id
    var conn = lib.getConnection(function (error) {
        if (error) {
            console.error("Error connecing to database: " + error.stack);
            res.statusCode = 500;
            res.json({'error': 500, 'desc': 'Error connecting to DB: ' + error.stack});
            conn.end();
            return;
        }
        console.log("Connection to dev@localhost successful! Connection ID: " + conn.threadId);
    });//connect to the database and throw 500 INTERNAL SERVER ERROR if error
    conn.query("SELECT * FROM coupons WHERE coupon_id='" + req.params.id + "'", function (err, rows, fields) { //if connected successfully, get record
        if (util.isUndefined(rows[0])) { // check whether query didn't return record
            res.statusCode = 404; // send not found
            res.send("{error: 404, desc:'Coupon with id " + req.params.id + " not found'}"); // json with error
                                                                                             // description
            conn.end();
            return;
        }
        var i = rows[0];
        var r = "{\"id\": \"" + i.coupon_id + "\", \"owned\": \"" + i.coupon_owned + "\", " +
            "\"paid\": " + i.coupon_paid + ", \"price\": " + i.coupon_price + ", \"currency\": \"" + i.coupon_currency +
            "\", \"item\": " + i.coupon_item + ", \"date_created\": \"" + i.coupon_date_created + "\", " +
            "\"date_paid\": \"" + i.coupon_date_paid + "\", \"children\": " + i.coupon_children + "}"; // create
        // response
        // json string
        res.type("application/json");
        res.send(r);
        conn.end();
    });
} //get certain coupon by id
function newCoupon(req, res) {
    var data = req.body;
    var generatedId = lib.getNewHash();
    var conn = lib.getConnection(function (error) {
        if (error) {
            console.error("Error connecing to database: " + error.stack);
            res.statusCode = 500;
            res.send("{error: 500, desc: 'Error connecting to DB: " + error.stack + "'}");
            return;
        }
        console.log("Connection to dev@localhost successful! Connection ID: " + conn.threadId);
    });//connect to the database and throw ACHTUNG 500 INTERNAL SERVER ERROR if error
    if (util.isNullOrUndefined(data.owned) || util.isNullOrUndefined(data.price) || util.isNullOrUndefined(data.item)) {
        res.statusCode = 400;
        res.send("{error: 400, desc:'Incomplete request. Cannot create coupon'}");
        conn.end();
    } else {
        conn.query("INSERT INTO coupons(`coupon_id`,`coupon_item`,`coupon_owned`,`coupon_price`) " +
            "VALUES('" + generatedId + "'," + data.item + ",'" + data.owned + "'," + data.price + ");", function (err) {
            if (err) {
                console.error("Error creating coupon from ip " + req.ip + "; Desc: " + err.stack);
                res.statusCode = 500;
                res.json({
                    "error": 500,
                    "desc": "Something gone wrong while creating coupon record",
                    "stack": err.stack
                });
                conn.end();
                return;
            }
            if (data.paid == 1 || data.paid == '1' || data.paid == true || data.paid == 'true') {
                setPaid(generatedId);
            }
            res.redirect("/coupons/" + generatedId);
            conn.end();
        });
    }
    conn.end();
}

module.exports.getAll = getAll();
module.exports.getById = getById();
module.exports.new = newCoupon();
module.exports.setPaid = setPaid();
module.exports.createChildren = createChildren();
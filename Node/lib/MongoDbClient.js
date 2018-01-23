"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var mongodb_1 = require("mongodb");
var MongoDbClient = (function () {
    function MongoDbClient(options) {
        this.options = options;
    }
    MongoDbClient.prototype.initialize = function (callback) {
        var _this = this;
        var uri = "mongodb://" + this.options.ip + ":" + this.options.port + "/" + this.options.queryString;
        var connectOptions = {};
        if (this.options.username && this.options.password) {
            connectOptions.auth = {};
            connectOptions.auth.user = this.options.username;
            connectOptions.auth.password = this.options.password;
        }
        mongodb_1.MongoClient.connect(uri, connectOptions)
            .then(function (client) {
            _this.client = client;
            _this.db = _this.client.db(_this.options.database);
            _this.collection = _this.db.collection(_this.options.collection);
            callback(null);
        })
            .catch(function (error) {
            throw Error("Can't connect to db " + error);
        });
    };
    MongoDbClient.prototype.insertOrReplace = function (partitionKey, rowKey, entity, isCompressed, callback) {
        var id = partitionKey + ',' + rowKey;
        var docDbEntity = { id: partitionKey + ',' + rowKey, data: entity, isCompressed: isCompressed };
        if (rowKey !== "userData") {
            var newEntitiy = this.__substituteKeyDeep(entity, /\./g, '@');
            var conditions1 = {
                'userid': id
            };
            var updateobj1 = {
                "$set": { "data": newEntitiy, "isCompressed": false }
            };
            this.collection.update(conditions1, updateobj1, { upsert: true }, function (err, res) {
                callback(err, null, null);
            });
        }
        else {
            var conditions = {
                'userid': partitionKey
            };
            var update = {
                "$set": { "data": entity }
            };
            this.collection.update(conditions, update, { upsert: true }, function (err, res) {
                callback(err, null, null);
            });
        }
    };
    MongoDbClient.prototype.retrieve = function (partitionKey, rowKey, callback) {
        var _this = this;
        var id = partitionKey + ',' + rowKey;
        if (rowKey !== "userData") {
            var query = { "$and": [{ "userid": id }] };
            var iterator = this.collection.find(query);
            iterator.toArray(function (error, result) {
                if (error) {
                    console.log("Error", error);
                    callback(error, null, null);
                }
                else if (result.length == 0) {
                    callback(null, null, null);
                }
                else {
                    var document_1 = result[0];
                    var finaldoc = _this.__substituteKeyDeep(document_1, /\@/g, '.');
                    finaldoc["id"] = id;
                    callback(null, finaldoc, null);
                }
            });
        }
        else {
            var query = { "$and": [{ "userid": partitionKey }] };
            var iterator = this.collection.find(query);
            iterator.toArray(function (error, result) {
                if (error) {
                    callback(error, null, null);
                }
                else if (result.length == 0) {
                    callback(null, null, null);
                }
                else {
                    var document_1 = result[0];
                    callback(null, document_1, null);
                }
            });
        }
    };
    MongoDbClient.getError = function (error) {
        if (!error)
            return null;
        return new Error('Error Code: ' + error.code + ' Error Body: ' + error.message);
    };
    MongoDbClient.prototype.__substituteKeyDeep = function (obj, target, replacement) {
        var type = null;
        if (Array.isArray(obj))
            type = "Array";
        if (Object.prototype.toString.call(obj) === "[object Object]")
            type = "Object";
        if (type === "Array") {
            var retA = [];
            for (var i = 0, len = obj.length; i < len; i++) {
                retA[i] = this.__substituteKeyDeep(obj[i], target, replacement);
            }
            return retA;
        }
        else if (type === "Object") {
            var retO = Object();
            for (var k in obj) {
                var i_1 = k.replace(target, replacement);
                retO[i_1] = this.__substituteKeyDeep(obj[k], target, replacement);
            }
            return retO;
        }
        else {
            return obj;
        }
    };
    return MongoDbClient;
}());
exports.MongoDbClient = MongoDbClient;

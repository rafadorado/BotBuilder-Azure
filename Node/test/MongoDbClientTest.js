var azure = require('../');
var assert = require('assert');

describe('MongoDbClient', function() {
    
    it('should write and read a valid entity', function(done) {
        
        var partitionKey = 'pk';
        var rowKey = 'rk';
        var data = { field1: 'data', field2: 3};

        const mongoOptions = {
            ip: 'localhost',
            port: 27017,
            database: 'testdb',
            collection: 'testcollection'
        }
        var client = new azure.MongoDbClient(mongoOptions);

        client.initialize(function(error){
             console.log(error);
            if(error){
                done(error);
            }
            else {
                client.insertOrReplace(partitionKey, rowKey, data, false, function(error, etag, response){
                    if(error){
                        done(error);
                    }
                    else{
                        client.retrieve(partitionKey, rowKey, function(error, entity, response){
                            if(error){
                                done(error);
                            }
                            else{
                                assert.deepEqual(data, entity.data);
                                done();
                            }
                        });
                    }
                });
            }
        });
    });

    it('should write and replace a valid entity', function(done) {
        
        var partitionKey = 'pk';
        var rowKey = 'rk';
        var data = { field1: 'data', field2: 3};
        var data2 = { field1: 'data2', field2: 3};

        const mongoOptions = {
            ip: 'localhost',
            port: 27017,
            database: 'testdb',
            collection: 'testcollection'
        }
        var client = new azure.MongoDbClient(mongoOptions);

        client.initialize(function(error){
            console.log(error);
            if(error){
                done(error);
            }
            else {
                client.insertOrReplace(partitionKey, rowKey, data, false, function(error, etag, response){
                    if(error){
                        done(error);
                    }
                    else{
                        client.insertOrReplace(partitionKey, rowKey, data2, false, function(error, etag, response){
                            if(error){
                                done(error);
                            }
                            else{
                                client.retrieve(partitionKey, rowKey, function(error, entity, response){
                                    if(error){
                                        done(error);
                                    }
                                    else{
                                        assert.deepEqual(data2, entity.data);
                                        done();
                                    }
                                });
                            }
                        });
                    }
                });
            }
        });
    });

    it('should return null when retrieving a non-existing entity', function(done) {
        
        var partitionKey = Math.floor((Math.random() * 100000000) + 1).toString();
        var rowKey = 'rk';

        const mongoOptions = {
            ip: 'localhost',
            port: 27017,
            database: 'testdb',
            collection: 'testcollection'
        }
        var client = new azure.MongoDbClient(mongoOptions);
        
        client.initialize(function(error){
            console.log(error);
            if(error){
                done(error);
            }
            else {
                 client.retrieve(partitionKey, rowKey, function(error, entity, response){
                    if(error){
                        done(error);
                    }
                    else{
                        assert.equal(null, entity);
                        done();
                    }
                });
            }
        });
    });
});
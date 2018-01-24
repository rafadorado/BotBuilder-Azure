// 
// MongoDbClient based on https://github.com/Manacola/msbotframework-mongo-middlelayer
//
// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license.
// 
// Microsoft Bot Framework: http://botframework.com
// 
// Bot Builder SDK Github:
// https://github.com/Microsoft/BotBuilder
// 
// Copyright (c) Microsoft Corporation
// All rights reserved.
// 
// MIT License:
// Permission is hereby granted, free of charge, to any person obtaining
// a copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to
// permit persons to whom the Software is furnished to do so, subject to
// the following conditions:
// 
// The above copyright notice and this permission notice shall be
// included in all copies or substantial portions of the Software.
// 
// THE SOFTWARE IS PROVIDED ""AS IS"", WITHOUT WARRANTY OF ANY KIND,
// EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
// NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
// LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
// OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
// WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
//

import { IStorageError, IStorageClient, IHttpResponse, IBotEntity } from './IStorageClient';
import * as builder from 'botbuilder';
import * as async from 'async';
import Consts = require('./Consts');
import {Db, MongoClient, MongoError} from 'mongodb';

export interface IMongoDbOptions {
    ip: string;
    port: number;
    database: string;
    collection: string;
    username: string;
    password: string;
    queryString: string;
}

export interface MongoConnectOptions {
    [k: string]: any
}

export class MongoDbClient implements IStorageClient {
    
    private client:MongoClient;
    private db: Db;
    private collection: any;
    private options: IMongoDbOptions;
    
    constructor (options:IMongoDbOptions) {
        this.options = options;
    }

    /** Initializes the MongoDb client */
    initialize(callback: (error: any) => void): void {
        var uri:string = `mongodb://${this.options.ip}:${this.options.port}/${this.options.queryString}`;
        var connectOptions:MongoConnectOptions = {};
        
        if(this.options.username && this.options.password){
            connectOptions.auth = {}; 
            connectOptions.auth.user = this.options.username;
            connectOptions.auth.password = this.options.password;
        }
        MongoClient.connect(uri, connectOptions)
            .then( (client:MongoClient) => {
                this.client = client;
                this.db = this.client.db(this.options.database);
                this.collection = this.db.collection(this.options.collection);
                callback(null);
            })
            .catch( (error:Error) =>{
                throw Error(`Can't connect to db ${error}`);
            });
    }

    /** Inserts or replaces an entity in the table */
    insertOrReplace(partitionKey: string, rowKey: string, entity: any, isCompressed: boolean, callback: (error: any, etag: any, response: IHttpResponse) => void): void {
        var conditions = {
            'internal_id': partitionKey + ',' + rowKey
        };

        if(rowKey !== "userData"){
            entity = this.__substituteKeyDeep(entity,/\./g, '@');
        }

        var update:any = {
            "$set": {"data":entity,"isCompressed":isCompressed}
        };

        this.collection.update(conditions,update,{upsert: true},function(err:any,res:any){
            callback(err, null, null);
        });
    }

    /** Retrieves an entity from the table */
    retrieve(partitionKey: string, rowKey: string, callback: (error: any, entity: IBotEntity, response: IHttpResponse) => void): void {
        var id = partitionKey + ',' + rowKey;
        var query={"$and":[{"internal_id":id}]};
        var iterator= this.collection.find(query);
        iterator.toArray( (error:any, result:any) => {
            if (error) {
                callback(MongoDbClient.getError(error), null, null);
            }
            else if (result.length == 0) {
                callback(null, null, null);
            }
            else {
                var finaldoc = result[0];
                if(rowKey!=="userData"){
                    finaldoc = this.__substituteKeyDeep(finaldoc, /\@/g, '.');
                    finaldoc["id"]=id
                }
                callback(null, finaldoc, null);
            }
        });
    }

    private static getError(error: MongoError): Error {
        if(!error) return null;
        return new Error('Error Code: ' + error.code + ' Error Body: ' + error.message);
    }

    private __substituteKeyDeep(obj:any, target: RegExp, replacement: string):any {
        // Get the type of the object. Array for arrays, Object for objects, null for anything else.
        var type = null;
        if(Array.isArray(obj)) type = "Array";
        if(Object.prototype.toString.call(obj) === "[object Object]" ) type = "Object";
        
        if (type === "Array") {
            // Simply do a recursive call on all values in array
            var retA = [];
            for (var i = 0, len = obj.length; i < len; i++) {
                retA[i] = this.__substituteKeyDeep(obj[i], target, replacement);
            }
            return retA;
        }
        else if (type === "Object") {
            // Do a recursive call on all values in object, AND substitute key values using `String.prototype.replace`
            var retO = Object();
            for (var k in obj) {
                let i = k.replace(target, replacement);
                retO[i] = this.__substituteKeyDeep(obj[k], target, replacement);
            }
            return retO;
        } else {
            return obj;
        } 
    }
}
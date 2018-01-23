/*-----------------------------------------------------------------------------
This Bot demonstrates how to use Azure MongoDb for bot storage. 

# RUN THE BOT:

-Using local Mongodb server:
    -Install MongoDb (https://docs.mongodb.com/manual/installation/)
    -Start the Mongodb Server
    -Replace ip, port, database and collection to your preference in the code below
    -Run the bot from the command line using "node app.js"
    -Type anything, and the bot will respond showing the text you typed

-Using Azure CosmosDb
    -Create a CosmosDB with Mogno API database (https://azure.microsoft.com/en-us/resources/videos/create-documentdb-on-azure/)
    -Replace ip, port, database, collection, username, password, queryString to your preference in the code below
    -Run the bot from the command line using "node app.js"
    -Type anything, and the bot will respond showing the text you typed
    
-----------------------------------------------------------------------------*/

var builder = require('botbuilder');
var azure = require('../../');
var restify = require('restify');

const mongoOptions = {
    ip: '<HOST>',
    port: '<PORT>',
    database: '<DB_NAME>',
    collection: '<COLLECTION_NAME>',
    username: '<USER>',
    password: '<PASSWORD>',
    queryString: '<GET_PARAMETERS>'
}

const mongoDbClient = new azure.MongoDbClient(mongoOptions);
const botStorage = new azure.AzureBotStorage({gzipData: false}, mongoDbClient);


var connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});

var bot = new builder.UniversalBot(connector, function (session) {
    session.send("You said: %s", session.message.text);
}).set('storage', botStorage);

var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
   console.log('%s listening to %s', server.name, server.url); 
});

server.post('/api/messages', connector.listen());


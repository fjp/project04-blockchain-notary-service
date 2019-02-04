# Project #4. Build a Private Blockchain Notary Service

This is Project 4 Build a Private Blockchain Notary Service, of the Udacity Nanodegree Blockchain Developer.
In this project I used my private Blockchain, created in Project 3, to create a notarization service for digital assets.
To be able to persist my blochchain I used [LevelDB](http://leveldb.org/).

## Node.js Framework

The project uses [Express.js](https://expressjs.com/) as its framework because it is fast an minimalistic.

## Setup project for Review.

To setup the project for review do the following:
1. Download the project.
2. Run command __npm install__ to install the project dependencies.
3. Run command __node app.js__ in the root directory.
4. The express app listens on port 8000 on localhost
5. Use the API Endpoints defined next

## API Endpoints

The web API contains a GET and a POST endpoint that respond to a request. 

### GET Block Endpoint

Get a block from the blockchain using the block height parameter: /block/:height

GET Request URL: http://localhost:8000/block/0

```
GET /block/0 HTTP/1.1
Host: localhost:8000
```


The response for the endpoint is the block in JSON format if it is available in the blockchain: 

```
{
    "hash":"49cce61ec3e6ae664514d5fa5722d86069cf981318fc303750ce66032d0acff3",
    "height":0,
    "body":"First block in the chain - Genesis block",
    "time":"1530311457",
    "previousBlockHash":""
}
```

If the height parameter is out ouf bounds, an error is sent as response.

### POST Block Endpoint

The POST endpoint allows posting a new block with the data payload option to add JSON data to
the block body. The block body should support a string of text:

```
{
      "body": "Testing block with test string data"
}
```

POST Request URL: http://localhost:8000/block

```
POST /block HTTP/1.1
Host: localhost:8000
Content-Type: application/json

{
	"body": "Insert data here"
}
```

The response for the endpoint is a block object in JSON format: 

```
{
    "hash": "50298db5739882ca8f919dfb6cee0e2a7d52affc51a56fbcd2ebf1cd0ef1477c",
    "height": 7,
    "body": "Insert data here",
    "timeStamp": "1547410581",
    "previousBlockHash": "ed81a14da1563a4f65a9f18a120583d3f2134983faf4310499111fb1a0a511a4"
}
```

### Other Endpoints and Height Error

All other endpoints are handled by a default handler that responds with a html message,
specifying the available endpoints.

If the height parameter is out of bounds, the response is an error message which gets handeled by the GET endpoint.


## Testing the project

After the server is started using `node app.js`, 
the endpoints can be tested with 
[Postman](https://www.getpostman.com/) or 
[curl](https://curl.haxx.se/) on the commandline.

The first time the server starts, it will contain only the genesis block. 
To create more blocks use the POST endpoint. All the blocks on the chain can be retrieved using the GET endpoint.

### Postman

* GET

    ```
    GET /block/0 HTTP/1.1
    Host: localhost:8000
    ```

* POST
    
    ```
    POST /block HTTP/1.1
    Host: localhost:8000
    Content-Type: application/json
    {
        "body": "Insert data here"
    }
    ```

### curl

* GET
    
    ```
    curl http://localhost:8000/block/0
    ```

* POST
    
    ```
    curl -X POST -H "Content-Type: application/json" -d '{"body":"Insert data"}' http://localhost:8000/block
    ```


## What do I learned with this Project

* I was able to create a RESTful web api with my private blockchain.
* I was able to setup a GET and POST endpoint to handle incoming client requests.
* I was able to respond on requests and handle errors such as height out of bounds.

const SHA256 = require('crypto-js/sha256');
const BlockClass = require('./Block.js');
const BlockChain = require('./BlockChain.js');
const Mempool = require('./Mempool.js');

/**
 * Controller Definition to encapsulate routes to work with blocks
 */
class BlockController {

    /**
     * Constructor to create a new BlockController, you need to initialize here all your endpoints
     * @param {*} app
     */
    constructor(app) {
        this.app = app;
        this.init();
        this.getBlockByIndex();
        this.postNewBlock();

        this.requestValidation();

        // Handle invalid requests
        this.handleRequests();
    }

    async init() {
        // Create the Blockchain
        this.blockChain = await new BlockChain.Blockchain(); // TODO: is this await needed?
        console.log("New blockchain created");
        //await this.initializeMockData(); // TODO: is this await even helpful?

        // Create the Mempool
        this.mempool = await new Mempool.Mempool(); // TODO: is this await needed?
        console.log("Mempool created");
    }


    /**
     * POST Endpoint to request validation for users
     */
    requestValidation() {
        this.app.post("/requestValidation", (req, res) => {
            // Add the wallet address to the user validation request
            req.walletAddress = req.body.address;

            // Add time stamp to user validation request
            req.requestTimeStamp = new Date().getTime().toString().slice(0,-3);

            // Add the user validation request to the mempool if it does not exist already and return the updated request object
            requestObject = self.mempool.addRequestValidation(req);
            // Respond to the user with the updated request object
            res.send(requestObject);
        });
    }

    /**
     * Implement a GET Endpoint to retrieve a block by index, url: "/block/:index"
     */
    getBlockByIndex() {
        this.app.get("/block/:height", (req, res) => {
            let height = req.params.height;
            console.log(`GET /block/${height}`);
            this.blockChain.getBlock(height).then((block) => { // TODO: use async and await with try catch instead of then?
                if (block === undefined) {
                    res.status(404)
                    res.send(`Error Block #${height} not found`);
                }
                res.send(block);
            }).catch((err) => {
                let error = `Error: Block #${height} not found, ${err}`;
                console.log(error);
                res.status(404)
                res.send(error);
            });
        });
    }

    /**
     * Implement a POST Endpoint to add a new Block, url: "/block"
     */
    postNewBlock() {
        this.app.post("/block", async (req, res) => {
            // TODO: How to handle errors when using async instead of .then?
            // Using try and catch when using async/await syntax?
            console.log("POST /block");
            console.log("Body data", req.body.data);
            let blockBody = req.body.body;
            if (blockBody === "" || blockBody === undefined) {
                res.status(404);
                res.json({"error": "Body json format incorrect, check content", "content": {"body":"Insert data here"} });
            } else {
                console.log("Adding new block");
                let newBlock = await new BlockClass.Block(); // TODO: is this await needed?
                newBlock.body = blockBody;
                newBlock = await this.blockChain.addBlock(newBlock);
                console.log("New Block added to blockchain");
                console.log(newBlock);
                res.json(JSON.parse(newBlock)); // TODO: send json format?
            }

        });
    }

    /**
     * Handle requests that do not match the required api format
     */
    handleRequests() {
        this.app.all('*', (req, res) => {
            res.status(404);
            res.send("Invalid request. Use GET /block/:height or POST /block");
        });
    }

    /**
     * Help method to inizialized Mock dataset, adds 10 test blocks to the blocks array
     */
    async initializeMockData() {
        // Mock data gets executed too early
        // While the genesis block gets created this function (initializeMockData()
        // is running which results in a height of -1
        // (while creating the blockchain with new inside the init function of this class)
        await
        console.log("Try to initialize mock data");
        let height = await this.blockChain.getBlockHeight();
        if (height === -1)
            console.log("Warning: Mock init called too early, Blockchain height =", height, ". Call to new Blockchain did not created genesis Block yet");
        else
            console.log("Mock init, Blockchain height = ", height);
        if (await height === 0) { // TODO: is this await helpful?
            for (let index = 0; index < 10; index++) {
                let blockAux = new BlockClass.Block(`Test Data #${index}`);
                blockAux = await this.blockChain.addBlock(blockAux);
                console.log("Added auxiliar block", blockAux);
            }
        }
    }

}

/**
 * Exporting the BlockController class
 * @param {*} app
 */
module.exports = (app) => { return new BlockController(app);}

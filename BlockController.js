const SHA256 = require('crypto-js/sha256');
const bitcoinMessage = require('bitcoinjs-message');
const hex2ascii = require('hex2ascii')

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
        this.getBlockByHash();
        this.getBlockByWalletAddress();
        //this.postNewBlock();
        this.postNewStarBlock();

        this.requestValidation();

        this.validateRequest();

        // Handle invalid requests
        this.handleRequests();
    }

    async init() {
        // Create the Blockchain
        this.blockChain = new BlockChain.Blockchain();
        console.log("[BlockController] New blockchain created");
        //await this.initializeMockData(); // TODO: is this await even helpful?

        // Create the Mempool
        this.mempool = new Mempool.Mempool();
        console.log("[BlockController] Mempool created");
    }

    /**
     * POST Endpoint to validate a user request in the mempool
     */
    async validateRequest() {
        this.app.post("/message-signature/validate", async (req, res) => {
            // Extract the address and signature from the received request
            let request = {};
            request.walletAddress = req.body.address;
            request.signature = req.body.signature;
            // validate the request by wallet address
            let validRequest = await this.mempool.validateRequestByWallet(request);
            console.log("[BlockController] Send validRequest", validRequest);
            res.send(validRequest);
        });
    }

    /**
     * POST Endpoint to request validation for users
     */
    async requestValidation() {
        this.app.post("/requestValidation", async (req, res) => {
            // Add the wallet address to the user validation request
            let requestObject = {};
            requestObject.walletAddress = req.body.address;

            // Add time stamp to user validation request
            requestObject.requestTimeStamp = new Date().getTime().toString().slice(0,-3);
            // Add the user validation request to the mempool if it does not exist already and return the updated request object
            requestObject = await this.mempool.addRequestValidation(requestObject);
            // Respond to the user with the updated request object
            console.log("[BlockController] Send requestObject:", requestObject);
            res.send(requestObject);
        });
    }



    /**
     * Implement a POST Endpoint to add a new Block, url: "/block"
     */
    postNewStarBlock() {
        this.app.post("/block", async (req, res) => {
            let address = req.body.address;
            let star = req.body.star;
            if (address === "" || address === undefined) {
                res.status(404);
                res.json({"error": "Address incorrect" });
            }
            let isValid = await this.mempool.verifyAddressRequest(address);
            if (false === isValid) {
                res.status(404);
                res.json({"error": "Address not yet verified"});
            }
            if (star === "" || star === undefined || Array.isArray(star)) {
                res.status(404);
                res.json({"error": "Star data incorrect" });
            }


            // Encode star story data
            let RA = star.ra;
            let DEC = star.dec;
            let MAG = star.mag;
            let CEN = star.cen;
            let starStory = star.story;
            let body = {
                address: address,
                star: {
                    ra: RA,
                    dec: DEC,
                    mag: MAG,
                    cen: CEN,
                    story: Buffer(starStory).toString('hex')
                }
            };

            let newBlock = new BlockClass.Block(body);
            newBlock = await this.blockChain.addBlock(newBlock);
            // Convert stringified object to json
            newBlock = JSON.parse(newBlock);
            console.log("New Block added to blockchain");
            console.log(newBlock);
            // Add the decoded star story to the block body
            newBlock.body.star.storyDecoded = hex2ascii(newBlock.body.star.story);
            console.log(newBlock);
            res.json(newBlock);


        });
    }

    decodeStory(block) {
        try {
            block.body.star.storyDecoded = hex2ascii(block.body.star.story);
            return block;
        } catch (err) {
            console.log("[BlockController] Decode star story: block has no story", err);
            return block;
        }
    }

    /**
     * Implement a GET Endpoint to retrieve a blocks for a wallet address, url: "/stars/address:address"
     */
    getBlockByWalletAddress() {
        this.app.get("/stars/address::address", async (req, res) => {
            let address = req.params.address;
            console.log(`GET /stars/address:${address}`);
            let blocks = await this.blockChain.getBlockByWalletAddress(address);
            if (blocks === undefined) {
                res.status(404)
                res.send(`Error Block #${hash} not found`);
            }
            blocks.forEach((block) => {
                block = this.decodeStory(block); // block.body.star.storyDecoded = hex2ascii(block.body.star.story);
            });
            res.json(blocks);
        });
    }

    /**
     * Implement a GET Endpoint to retrieve a block by its hash, url: "/stars/hash:hash"
     */
    getBlockByHash() {
        this.app.get("/stars/hash::hash", async (req, res) => {
            let hash = req.params.hash;
            console.log(`GET /stars/hash:${hash}`);
            let block = await this.blockChain.getBlockByHash(hash);
            if (undefined === block || null === block) {
                res.status(404)
                res.send(`Error Block #${hash} not found`);
            } else {
                block = this.decodeStory(block); // block.body.star.storyDecoded = hex2ascii(block.body.star.story);
                res.json(block);
            }
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
                block = this.decodeStory(block); // block.body.star.storyDecoded = hex2ascii(block.body.star.story);
                res.json(block);
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

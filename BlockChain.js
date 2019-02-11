/* ===== Blockchain Class ==========================
|  Class with a constructor for new blockchain 		|
|  ================================================*/

// Implements the SHA256 hashing function which is required to create hash values for blocks
const SHA256 = require('crypto-js/sha256');
// Import the functionality of the persisten data storage using LevelDB
const LevelSandbox = require('./LevelSandbox.js');
// Class that specifies a block that gets stored in the blockchain
const Block = require('./Block.js');

// Blockchain class create a persistent blockchain using LevelDB.
class Blockchain {

    constructor() {
        this.init();
    }

    async init() {
        // Member to the LevelDB sandbox
        this.db = await new LevelSandbox.LevelSandbox();
        // Creates the genesis block of the blockchain when it is created
        await this.generateGenesisBlock();
    }

    // Auxiliar method to create a Genesis Block (always with height= 0)
    // You have to options, because the method will always execute when you create your blockchain
    // you will need to set this up statically or instead you can verify if the height !== 0 then you
    // will not create the genesis block
    async generateGenesisBlock(){
        console.log("[BlockChain] Generating Genesis Block");
        let height = await this.getBlockHeight();
        if (height === -1) {
            let genesisBlock = await new Block.Block("[BlockChain] First block in the chain - Genesis Block"); // TODO: is this await needed?
            await this.addBlock(genesisBlock); // TODO: is this await needed?
        }
        console.log("[BlockChain] Genesis Block created, height =", await this.getBlockHeight());
    }

    // Get block height, it is auxiliar method that returns the height of the blockchain
    async getBlockHeight() {
        let height = await this.db.getBlocksCount();
        return height;
    }

    // Add new block
    async addBlock(newBlock) {
        // Block height from levelDB
        let height = await this.getBlockHeight();
        newBlock.height = height+1;
        // UTC timestamp
        newBlock.timeStamp = new Date().getTime().toString().slice(0,-3);
        if (newBlock.height > 0) {
            // previous block hash
            let previousBlock = await this.getBlock(newBlock.height - 1);
            newBlock.previousBlockHash = previousBlock.hash;
        }
        // SHA256 requires a string of data
        newBlock.hash = SHA256(JSON.stringify(newBlock)).toString();
        // add block to chain
        return await this.db.addDataToLevelDB(JSON.stringify(newBlock)) // TODO: await required here?
    }

    // Get Block By Height
    async getBlock(height) {
        let block = await this.db.getLevelDBData(height);
        if (block !== undefined)
            block = JSON.parse(block);
        //console.log("Block", block);
        return block;
    }

    // Validate if Block is being tampered by Block Height
    async validateBlock(height) {
        let block = await this.getBlock(height);
        let blockHash = block.hash;
        block.hash = "";
        let validBlockHash = SHA256(JSON.stringify(block)).toString();
        if (blockHash === validBlockHash) {
            if (height > 0) {
                // Get previous block hash to check with the value stored inside this block
                let previousBlock = await this.getBlock(height - 1);
                if (previousBlock.hash === block.previousBlockHash) {
                    return true;
                } else {
                    return false;
                }
            } else {
                // Genesis block
                return true;
            }
        } else {
            console.log(`Block #${blockHeight} invalid hash: ${blockHash} <> ${validBlockHash}`);
            return false;
        }
    }

    // Validate Blockchain
    async validateChain() {
        let errorLog = [];
        let isValid;
        let height = await this.getBlockHeight();
        for (let i = 0; i <= height; i++) {
            // validate block
            isValid = await this.validateBlock(i);
            if (!isValid) {
                errorLog.push(i);
            }
        }
        if (errorLog.length > 0) {
            console.log(`Block errors = ${errorLog.length}`)
            console.log(`Blocks: ${errorLog}`)
        } else {
            console.log('No errors detected')
        }
        return errorLog;
    }

    // Utility Method to Tamper a Block for Test Validation
    // This method is for testing purpose
    _modifyBlock(height, block) {
        let self = this;
        return new Promise( (resolve, reject) => {
            self.db.addLevelDBData(height, JSON.stringify(block).toString()).then((blockModified) => {
                resolve(blockModified);
            }).catch((err) => { console.log(err); reject(err)});
        });
    }

}

module.exports.Blockchain = Blockchain;

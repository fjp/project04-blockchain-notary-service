const bitcoinMessage = require('bitcoinjs-message');


/* ===== Mempool Class =============================
|  Class with a constructor for Mempool 		   |
|  ===============================================*/

const TimeoutRequestsWindowTime = 5*60*1000;
const TimeoutValidWindowTime = 30*60*1000;

class Mempool {
	constructor(data){
		// Temporary storage object for validation requests
        this.mempool = [];
        // Holds the timeout requests for addresses currently in the mempool
        this.timeoutRequests = [];
        // Temporary storage for valid request objects
        this.mempoolValid = [];
	}


    /**
     * Add request validation request in the mempool.
     */
    async addRequestValidation(request) {
        // Check if the user validation request already exists in the mempool
        if (request.walletAddress in this.mempool) {
            request = this.mempool[request.walletAddress];
            console.log("[Mempool] Existing request validation");
        } else {
            await this.setTimeOut(request);
            request.message = `${request.walletAddress}:${request.requestTimeStamp}:starRegistry`;
            this.mempool[request.walletAddress] = request;
            console.log("[Mempool] Added new request validation to mempool");
        }
        // Update the remaining time (validation window time) for the request
        request = await this.verifyTimeLeft(request);
        console.log("[Mempool] Mempool:", this.mempool);

        return request;
    }


    /**
     * A validation request from the user should be available for 5 minutes.
     * This method delets a validation request from timeourRequests if the condition is met.
     */
    async setTimeOut(request) {
        // Add timeout to the timeoutRequest map for the request wallet address
        // Use an arrow function as callback for setTimeout() to prived access to
        // the Mempool class method removeValidationRequest() which clears the mempool and timeoutRequests array.
        this.timeoutRequests[request.walletAddress] = setTimeout( () => {
            console.log("[Mempool] Validation Request timeout - removing from Mempool");
            this.removeValidationRequest(request);
        }, TimeoutRequestsWindowTime );
    }

    /**
     * This method deletes a validation request from timeourRequests.
     */
    async removeValidationRequest(request) {
        delete this.mempool[request.walletAddress];
        delete this.timeoutRequests[request.walletAddress];
        console.log("[Mempool] Mempool:", this.mempool);
    }



    /**
     * A valid request from the user should be available for 30 minutes.
     * This method delets a valid request from timeoutRequests array if the condition is met.
     */
    async setValidTimeOut(request) {
        // Add timeout to the timeoutRequest map for the request wallet address
        // Use an arrow function as callback for setTimeout() to prived access to
        // the Mempool class method removeValidationRequest() which clears the mempool and timeoutRequests array.
        this.timeoutRequests[request.status.address] = setTimeout( () => {
            console.log("[Mempool] Valid Request timeout - removing from Mempool");
            this.removeValidRequest(request);
        }, TimeoutValidWindowTime );
    }

    /**
     * This method deletes a valid request from timeoutRequests.
     */
    async removeValidRequest(request) {
        delete this.mempoolValid[request.status.address];
        delete this.timeoutRequests[request.status.address];
        console.log("[Mempool] Valid Mempool:", this.mempoolValid);
    }


    /**
     * This method verifies the remaining time of a validation request.
     */
    async verifyTimeLeft(request) {
        let timeElapse = (new Date().getTime().toString().slice(0,-3)) - request.requestTimeStamp;
        let timeLeft = (TimeoutRequestsWindowTime/1000) - timeElapse;
        request.validationWindow = timeLeft;
        return request;
    }


    /**
     * This method verifies the remaining time of a valid request.
     */
    async verifyValidTimeLeft(request) {
        let timeElapse = (new Date().getTime().toString().slice(0,-3)) - request.status.requestTimeStamp;
        let timeLeft = (TimeoutValidWindowTime/1000) - timeElapse;
        request.status.validationWindow = timeLeft;
        return request;
    }




    /*
     * Validate a user request in the mempool
     * First the request is found in the mempool by the request wallet address.
     * Then the time window is checked and the signature is verified with the
     * bitcoin-js message module.
     */
    async validateRequestByWallet(request) {
        // Find the request in the mempool
        let address = request.walletAddress;
        let signature = request.signature;
        let requestObject = await this.mempool[address];
        if (undefined != requestObject) {
            // Verify window time
            requestObject = await this.verifyTimeLeft(requestObject);
            console.log("[Mempool] Verify time object:", requestObject.validationWindow);
            if (requestObject.validationWindow > 0) {
                // Verify the signature
                console.log("[Mempool] Verify signature");
                let message = requestObject.message;
                let isValid = bitcoinMessage.verify(message, address, signature);

                if (isValid) {
                    let validRequest = {
                        "registerStar": true,
                        "status": {
                            "address": address,
                            "requestTimeStamp": requestObject.requestTimeStamp,
                            "message": message,
                            "validationWindow": requestObject.validationWindow,
                            "messageSignature": true
                        }
                    };
                    // Remove the object from the mempool
                    console.log("[Mempool] Valid request - Removing request from Mempool")
                    this.removeValidationRequest(request);


                    // Update the timeout to TimeValidWindowTime (30 minutes)
                    await this.setValidTimeOut(validRequest);
                    //validRequest = await this.verifyValidTimeLeft(validRequest);

                    // Save the valid request to the valid mempool array
                    this.mempoolValid[address] = validRequest;

                    // Return the validRequest object
                    return validRequest;
                } else {
                    console.log("[Mempool] Failed to verify message, check address and signature");
                }
            } else {
                console.log("[Mempool] Validation Window: No time left");
            }
        } else {
            // If the request is not in the mempool, check if it is in the valid mempool
            let validRequest = await this.mempoolValid[address];
            if (undefined != validRequest) {
                validRequest = await this.verifyValidTimeLeft(validRequest);
                return validRequest;
            }
            console.log("[Mempool] Error Request not in Mempool");
        }

        return false;
    }

    /*
     * Verify if an address that wants to register a star already sent a validation request
     */
    async verifyAddressRequest(address) {
        let validRequest = this.mempoolValid[address];
        if (undefined != validRequest) {
            validRequest = await this.verifyValidTimeLeft(validRequest);
            if (validRequest.status.validationWindow > 0) {
                // Remove the valid request from the valid mempool to avoid registering another star
                this.removeValidRequest(validRequest);
                return true;
            } else {
                console.log("[Mempool] Validation timeout");
            }
        } else {
            console.log("[Mempool] No valid request with this address in the mempool");
        }
        return false;
    }


}

module.exports.Mempool = Mempool;

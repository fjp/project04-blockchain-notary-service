/* ===== Mempool Class =============================
|  Class with a constructor for Mempool 		   |
|  ===============================================*/

const TimeoutRequestsWindowTime = 5*60*1000;

class Mempool {
	constructor(data){
		// Temporary storage object for validation requests
        this.mempool = [];
        // Holds the timeout requests for addresses currently in the mempool
        this.timeoutRequests = [];
	}


    /**
     * Add request validation request in the mempool.
     */
    async addRequestValidation(request) {
        // Check if the user validation request already exists in the mempool
        console.log("Mempool:", this.mempool);
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
            this.removeValidationRequest(request);
        }, TimeoutRequestsWindowTime );
    }

    /**
     * This method delets a validation request from timeourRequests.
     */
    async removeValidationRequest(request) {
        delete this.mempool[request.walletAddress];
        delete this.timeoutRequests[request.walletAddress];
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

}

module.exports.Mempool = Mempool;

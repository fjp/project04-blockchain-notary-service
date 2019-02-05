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
    async addValidationRequest(request) {
        // Update the remaining time (validation window time) for the request
        request = await self.verifyTimeLeft(request);

        // Check if the user validation request already exists in the mempool
        if (false === self.mempool.includes(request.walletAddress)) {
            await self.setTimeOut(request);
            request.message = `${request.walletAddress}:${request.requestTimeStamp}:starRegistry`;
            self.mempool[request.walletAddress] = request;
        } else {
            request = self.mempool[request.walletAddress];
        }

        return request;
    }


    /**
     * A validation request from the user should be available for 5 minutes.
     * This method delets a validation request from timeourRequests if the condition is met.
     */
    async setTimeOut(request) {
        self.timeoutRequests[request.walletAddress] = setTimeout(function() {
            self.removeValidationRequest(request.walletAddress)
        }, TimeoutRequestsWindowTime );
    }

    /**
     * This method delets a validation request from timeourRequests.
     */
    async removeValidationRequest(request) {
        delete self.mempool[request.walletAddress];
        delete self.timeoutRequests[request.walletAddress];
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

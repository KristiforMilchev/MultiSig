const Web3 = require("web3");
const txHash = process.argv[4];
const web3 = new Web3("HTTP://127.0.0.1:7545");

async function getTransactionEvents(txHash) {}

module.exports = async function (callback) {
  try {
    console.log(txHash);
    const receipt = await web3.eth.getTransactionReceipt(txHash);

    if (!receipt) {
      console.log("Transaction receipt not found");
      return;
    }

    console.log("Transaction Receipt:", receipt);

    receipt.logs.forEach((log) => {
      try {
        const decodedLog = web3.eth.abi.decodeLog(
          [
            { type: "address", name: "company", indexed: true },
            { type: "bytes32", name: "challenge", indexed: true },
            { type: "bytes32", name: "message", indexed: false },
            { type: "address", name: "requester", indexed: false },
          ],
          log.data,
          log.topics.slice(1)
        );

        console.log("Decoded Log:", decodedLog);
      } catch (err) {
        console.error("Error decoding log:", err);
      }
    });
  } catch (error) {
    console.error("Error getting transaction events:", error);
  }
};

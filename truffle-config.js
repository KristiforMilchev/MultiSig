const HDWalletProvider = require("@truffle/hdwallet-provider");
require("dotenv").config();

//Initially you will have to create an ENV file with the following contents
//Important v0.2 due to testing requirments we need to have more than one account, you can do that either by
//providing a list of wallets separated by comma or a mnemonic seed. I prefer to use a list of private keys so
//the default is set to be a list for me as it makes adding testing accounts easier in the future.
//PRIVATE_KEY=9b03326a56edf91ed670fc2525e4018e7b60aab635cf80460fa4bbb6f70ca2c8,9b03326a56edf91ed670fc2525e4018e7b60aab635cf80460fa4bbb6f70caa18 -- Example

//DEV_RPC_URL=https://rpc.blockcert.net only if using my testnet otherwise your own rpc.

let privateKey = process.env.PRIVATE_KEY; // Private key of the wallet
const devRpcUrl = process.env.DEV_RPC_URL; // RPC endpoint of your development server

console.log(privateKey);

if (privateKey.includes(",")) {
  privateKey = privateKey.split(",").map((key) => key.trim());
} else {
  privateKey = privateKey.trim();
}

if (!privateKey || !devRpcUrl) {
  console.error(
    "Error: Environment variables PRIVATE_KEY and DEV_RPC_URL are required."
  );
  process.exit(1);
}

module.exports = {
  mocha: {
    enableTimeouts: false,
    before_timeout: 120000, // Here is 2min but can be whatever timeout is suitable for you.
  },
  networks: {
    development: {
      provider: () => new HDWalletProvider(privateKey, devRpcUrl),
      network_id: "*",
      gas: 6721975,
      gasPrice: 20000000000,
    },
  },
  compilers: {
    solc: {
      version: "0.8.19",
      settings: {
        optimizer: {
          enabled: true,
          runs: 200,
        },
      },
    },
  },
};

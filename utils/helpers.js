const { ethers } = require("ethers");
require("dotenv").config();
const HDWalletProvider = require("@truffle/hdwallet-provider");

let nonceTracker = {};

//Use only when you expect assrtion to fail!
async function getNonce(account) {
  let currentNonce = await web3.eth.getTransactionCount(account);
  console.log(currentNonce);
  return currentNonce;
}

async function getNextNonce(account) {
  if (!(account in nonceTracker)) {
    nonceTracker[account] = await web3.eth.getTransactionCount(account);
  }
  return nonceTracker[account]++;
}

async function updateNonceAfterDeployment(account) {
  const newNonce = await web3.eth.getTransactionCount(account);
  nonceTracker[account] = newNonce;
}

async function getAddress(account) {
  console.log(account);
  const wallet = new ethers.Wallet(account);
  return wallet.address;
}

module.exports = {
  getNonce,
  getNextNonce,
  updateNonceAfterDeployment,
  getAddress,
};

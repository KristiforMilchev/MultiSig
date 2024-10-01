const { ethers } = require("ethers");
require("dotenv").config();
const HDWalletProvider = require("@truffle/hdwallet-provider");

let nonceTracker = {};

function getDeadAddres() {
  return "0x0000000000000000000000000000000000000000";
}
//Use only when you expect assrtion to fail!
async function getNonce(account, printNonce = false) {
  let currentNonce = await web3.eth.getTransactionCount(account);
  if (printNonce) console.log(currentNonce);
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
  const wallet = new ethers.Wallet(account);
  return wallet.address;
}

async function getSigner(account) {
  const provider = new ethers.providers.Web3Provider(web3.currentProvider);
  const signer = provider.getSigner(account);
  return signer;
}

module.exports = {
  getNonce,
  getNextNonce,
  updateNonceAfterDeployment,
  getAddress,
  getSigner,
  getDeadAddres,
};

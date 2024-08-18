const Web3 = require('web3');
const contractName = process.argv[4];
const contract = artifacts.require(contractName);

const web3 = new Web3('https://rpc.blockcert.net');

module.exports = async function (callback) {
    try {
        const networkId = await web3.eth.net.getId();
        const deployedNetwork = contract.networks[networkId];

        if (!deployedNetwork) {
            throw new Error(`Contract not found on network with ID ${networkId}`);
        }

        const contractAddress = deployedNetwork.address;
        console.log('CV Contract Address:', contractAddress);

        callback();
    } catch (error) {
        console.error('Error retrieving deployed contracts:', error);
        callback(error);
    }
};

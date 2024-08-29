const MsFactory = artifacts.require("DeploymentFactory");

const feeService = "FeeService";
const feeServiceContract = artifacts.require(feeService);
module.exports = async function (deployer) {
    const networkId = await web3.eth.net.getId();
    const deployedFeeService = feeServiceContract.networks[networkId];
    if (!deployedFeeService) {
        throw new Error(`Contract not found on network with ID ${networkId}`);
    }
    const deployedFeeServiceAddress = deployedFeeService.address;
    console.log("Fee Service address");
    console.log(deployedFeeServiceAddress);

    await deployer.deploy(
        MsFactory,
        deployedFeeServiceAddress, // FeeService address used to calculate factory tax in WETH
        "0x2514895c72f50D8bd4B4F9b1110F0D6bD2c97526", // The address of AggregatorV3Interface deployed on my testnet, for other networks you should find the address and replace it (it's reposible for managing price updates when converting units inside the contract.)
        "0x6725F303b657a9451d8BA641348b6761A6CC7a17", // Factory for the PKSWAP deployed on my testnet,
        "0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd", // Network wrapped token
        "PkSwap"
    );
};

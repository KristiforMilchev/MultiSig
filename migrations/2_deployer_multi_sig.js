const MultiSig = artifacts.require("MultiSig");

module.exports = async function (deployer) {
    await deployer.deploy(
        MultiSig,
        ["0x700A97b62E390e82753bCE29db09903E708E122d", "0x782703A5dbCcd8e060F0B7f5085021AB92350Da4"], // Your smart contract owners here
        "0x2514895c72f50D8bd4B4F9b1110F0D6bD2c97526", // The address of AggregatorV3Interface deployed on my testnet, for other networks you should find the address and replace it (it's reposible for managing price updates when converting units inside the contract.)
        "0x6725F303b657a9451d8BA641348b6761A6CC7a17", // Factory for the PKSWAP deployed on my testnet,
        "0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd", // Network wrapped token
        "PkSwap"
    );
};

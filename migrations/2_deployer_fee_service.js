const FeeService = artifacts.require("FeeService");

module.exports = async function (deployer) {
    await deployer.deploy(
        FeeService,
        "0x2514895c72f50D8bd4B4F9b1110F0D6bD2c97526",
        "0x26d5CFA2a436baf18Ff336e21Eb4d9bfb173FcD6",
        100
    );

    
};

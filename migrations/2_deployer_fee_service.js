const FeeService = artifacts.require("FeeService");
require("dotenv").config();

module.exports = async function (deployer) {
  console.log(process.env.AggregatorV3Interface);
  console.log(process.env.PKSwapFactory);
  console.log(process.env.FeeCollectorAddress);

  await deployer.deploy(
    FeeService,
    // The address of AggregatorV3Interface deployed on my testnet,
    // for other networks you should find the address and replace it
    //(it's reposible for managing price updates when converting units inside the contract.)
    process.env.AggregatorV3Interface,
    process.env.FeeCollectorAddress,
    100
  );
};

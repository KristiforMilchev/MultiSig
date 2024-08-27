pragma solidity ^0.8.19;

import "./MultiSig.sol";

interface IFeeService {
    function getRegistrationFee() external view returns (uint256);
}

contract DeploymentFactory {
    address private priceFeed;
    address private netowrkWrappedToken;
    address private factory;
    string private defaultFactoryName;
    IFeeService private feeService;

    constructor(
        address _feeService,
        address _priceFeed,
        address _factory,
        address _netowrkWrappedToken,
        string memory _defaultFactoryName
    ) {
        feeService = IFeeService(_feeService);
        priceFeed = _priceFeed;
        factory = _factory;
        netowrkWrappedToken = _netowrkWrappedToken;
        defaultFactoryName = _defaultFactoryName;
    }

    function createLedger(
        address[] memory _owners
    ) public payable returns (address) {
        uint256 fee = feeService.getRegistrationFee();
        require(msg.value >= fee, "Insufficient registration fee");

        MultiSig ms = new MultiSig(
            _owners,
            priceFeed,
            netowrkWrappedToken,
            factory,
            defaultFactoryName
        );
        return address(ms);
    }
}

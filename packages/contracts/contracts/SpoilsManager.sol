// SPDX-License-Identifier: MIT
// solhint-disable not-rely-on-time, max-states-count

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";

contract SpoilsManager is Ownable, Initializable {
    uint32 public spoils; // 100_000 = 100% (1e6)
    address public receiver;

    // solhint-disable-next-line no-empty-blocks
    function initLock() external initializer {}

    function init(uint32 _spoils, address _receiver, address newOwner) external virtual initializer {
        spoils = _spoils;
        receiver = _receiver;
        _transferOwnership(newOwner);
    }

    function setSpoils(uint32 _spoils) external onlyOwner {
        spoils = _spoils;
    }

    function setReceiver(address _receiver) external onlyOwner {
        receiver = _receiver;
    }

    // function to get spoils amount
    function getSpoils() external view returns (uint32) {
        return spoils;
    }

    function getReceiver() external view returns (address) {
        return receiver;
    }
}

// ownable?
contract SpoilsManagerFactory {
    address public implementation;

    constructor(address _implementation) {
        implementation = _implementation;
    }

    function createSpoilsManager(uint32 _spoils, address _daoReceiver, address _newOwner) external returns (address) {
        address spoilsManager = Clones.clone(implementation);
        SpoilsManager(spoilsManager).init(_spoils, _daoReceiver, _newOwner);
        return spoilsManager;
    }
}


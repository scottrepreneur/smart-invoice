// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

interface ISpoilsManager {
    function setSpoils(uint32 _spoils) external;

    function setReceiver(address _receiver) external;

    function getSpoils() external view returns (uint32);

    function getReceiver() external view returns (address);
}

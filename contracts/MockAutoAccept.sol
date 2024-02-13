// SPDX-License-Identifier: MIT

pragma solidity ^0.8.21;


// Mock auto accepto to expose setAutoAcceptCollection function.
contract MockAutoAccept {
    function setAutoAcceptCollection(
        address collection,
        bool autoAccept
    ) public { }
}

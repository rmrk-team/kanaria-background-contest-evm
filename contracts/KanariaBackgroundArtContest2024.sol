// SPDX-License-Identifier: Apache-2.0

pragma solidity ^0.8.21;

import {
    RMRKEquippablePreMint
} from "@rmrk-team/evm-contracts/contracts/implementations/premint/RMRKEquippablePreMint.sol";

error RoyaltiesNotConfiguredForAsset();
error LengthMismatch();

contract KanariaBackgroundArtContest2024 is RMRKEquippablePreMint {

    mapping(uint64 assetId => address receiver) private  _royaltyAssetIdToReceiver;

    constructor(
        string memory collectionMetadata,
        uint256 maxSupply,
        uint16 royaltyPercentageBps
    )
        RMRKEquippablePreMint(
            "Kanaria Background Art Contest 2024",
            "KANCNTST24",
            collectionMetadata,
            maxSupply,
            address(0),
            royaltyPercentageBps
        )
    {}
    
    function mintWithAsset(
        address to,
        uint64 assetId,
        uint64 numToMint
    ) external onlyOwnerOrContributor {
        (uint256 nextToken, uint256 totalSupplyOffset) = _prepareMint(
            numToMint
        );

        for (uint256 i = nextToken; i < totalSupplyOffset; ) {
            _setTokenURI(i, _assets[assetId]);
            _safeMint(to, i, "");
            _addAssetToToken(i, assetId, 0);
            // First asset is auto accepted
            unchecked {
                ++i;
            }
        }
    }

    function getRoyaltyReceiverByAssetId(uint64 assetId) external view returns (address receiver) {
        receiver = _royaltyAssetIdToReceiver[assetId];
    }

    function setRoyaltyReceiverByAssetId(uint64 assetId, address receiver) external onlyOwner {
        _royaltyAssetIdToReceiver[assetId] = receiver;
    }

    function royaltyInfo(
        uint256 tokenId,
        uint256 salePrice
    ) external view
        override
        returns (address receiver, uint256 royaltyAmount)
    {
        uint64 mainAssetId = _activeAssets[tokenId][0];
        receiver = _royaltyAssetIdToReceiver[mainAssetId];
        if (receiver == address(0)) {
            revert RoyaltiesNotConfiguredForAsset();
        }

        royaltyAmount = (salePrice * getRoyaltyPercentage()) / 10000;
    }
}

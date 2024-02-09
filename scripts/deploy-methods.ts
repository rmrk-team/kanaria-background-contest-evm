import { ethers, run, network } from 'hardhat';
import { delay, isHardhatNetwork } from './utils';
import {
  KanariaBackgroundArtContest2024,
  RMRKBulkWriter,
  RMRKCatalogImpl,
  RMRKCatalogUtils,
  RMRKCollectionUtils,
  RMRKEquipRenderUtils,
} from '../typechain-types';
import { getRegistry } from './get-gegistry';
import * as C from './constants';

export async function deployContracts(): Promise<KanariaBackgroundArtContest2024> {
  console.log(`Deploying KanariaBackgroundArtContest2024 to ${network.name} blockchain...`);

  const contractFactory = await ethers.getContractFactory('KanariaBackgroundArtContest2024');
  const collectionMeta = C.COLLECTION_METADATA;
  const maxSupply = C.AMOUNTS.reduce((a, b) => a + b, 0);
  const royaltyPercentageBps = 300; // 3%

  if (collectionMeta === undefined || maxSupply === undefined) {
    throw new Error('Please set collectionMeta and maxSupply');
  } else {
    const args = [collectionMeta, maxSupply, royaltyPercentageBps] as const;
    const contract: KanariaBackgroundArtContest2024 = await contractFactory.deploy(...args);
    await contract.waitForDeployment();
    const contractAddress = await contract.getAddress();
    console.log(`KanariaBackgroundArtContest2024 deployed to ${contractAddress}`);

    if (!isHardhatNetwork()) {
      console.log('Waiting 20 seconds before verifying contract...');
      await delay(20000);
      await run('verify:verify', {
        address: contractAddress,
        constructorArguments: args,
        contract: 'contracts/KanariaBackgroundArtContest2024.sol:KanariaBackgroundArtContest2024',
      });

      // Only do on testing, or if whitelisted for production
      const registry = await getRegistry();
      await registry.addExternalCollection(contractAddress, args[0]);
      console.log('Collection added to Singular Registry');
    }
    return contract;
  }
}

export async function configureAndMint(
  collection: KanariaBackgroundArtContest2024,
  catalog: RMRKCatalogImpl,
  kanariaAddress: string,
  owners: string[],
  assetUris: string[],
  amounts: number[],
): Promise<void> {
  if (owners.length !== assetUris.length || owners.length !== amounts.length) {
    throw new Error('Owners, assetUris and amounts must be of the same length');
  }
  const [deployer] = await ethers.getSigners(); // TODO: Use owner instead of deployer

  for (let i = 0; i < owners.length; i++) {
    const owner = owners[i];
    const assetUri = assetUris[i];
    const assetId = i + 1; // This works because we are certain that the assets are minted in order and start from 1N
    let tx = await collection.addEquippableAssetEntry(
      C.EQUIPPABLE_GROUP_ID,
      await catalog.getAddress(),
      assetUri,
      [],
    );
    await tx.wait();

    tx = await collection.setRoyaltyReceiverByAssetId(assetId, owner);
    await tx.wait();

    tx = await collection.mintWithAsset(deployer.address, assetId, amounts[i]);
    await tx.wait();
    console.log(`Minted ${amounts[i]} NFTS with asset ${assetId} to ${owner}`);
  }

  await collection.setValidParentForEquippableGroup(
    C.EQUIPPABLE_GROUP_ID,
    kanariaAddress,
    C.BACKGROUND_SLOT_ID,
  );
  await catalog.addEquippableAddresses(C.BACKGROUND_SLOT_ID, [await collection.getAddress()]);
}

export async function deployBulkWriter(): Promise<RMRKBulkWriter> {
  const bulkWriterFactory = await ethers.getContractFactory('RMRKBulkWriter');
  const bulkWriter = await bulkWriterFactory.deploy();
  await bulkWriter.waitForDeployment();
  const bulkWriterAddress = await bulkWriter.getAddress();
  console.log('Bulk Writer deployed to:', bulkWriterAddress);

  await verifyIfNotHardhat(bulkWriterAddress);
  return bulkWriter;
}

export async function deployCatalogUtils(): Promise<RMRKCatalogUtils> {
  const catalogUtilsFactory = await ethers.getContractFactory('RMRKCatalogUtils');
  const catalogUtils = await catalogUtilsFactory.deploy();
  await catalogUtils.waitForDeployment();
  const catalogUtilsAddress = await catalogUtils.getAddress();
  console.log('Catalog Utils deployed to:', catalogUtilsAddress);

  await verifyIfNotHardhat(catalogUtilsAddress);
  return catalogUtils;
}

export async function deployCollectionUtils(): Promise<RMRKCollectionUtils> {
  const collectionUtilsFactory = await ethers.getContractFactory('RMRKCollectionUtils');
  const collectionUtils = await collectionUtilsFactory.deploy();
  await collectionUtils.waitForDeployment();
  const collectionUtilsAddress = await collectionUtils.getAddress();
  console.log('Collection Utils deployed to:', collectionUtilsAddress);

  await verifyIfNotHardhat(collectionUtilsAddress);
  return collectionUtils;
}

export async function deployRenderUtils(): Promise<RMRKEquipRenderUtils> {
  const renderUtilsFactory = await ethers.getContractFactory('RMRKEquipRenderUtils');
  const renderUtils = await renderUtilsFactory.deploy();
  await renderUtils.waitForDeployment();
  const renderUtilsAddress = await renderUtils.getAddress();
  console.log('Equip Render Utils deployed to:', renderUtilsAddress);

  await verifyIfNotHardhat(renderUtilsAddress);
  return renderUtils;
}

export async function deployCatalog(
  catalogMetadataUri: string,
  catalogType: string,
): Promise<RMRKCatalogImpl> {
  const catalogFactory = await ethers.getContractFactory('RMRKCatalogImpl');
  const catalog = await catalogFactory.deploy(catalogMetadataUri, catalogType);
  await catalog.waitForDeployment();
  const catalogAddress = await catalog.getAddress();
  console.log('Catalog deployed to:', catalogAddress);

  await verifyIfNotHardhat(catalogAddress, [catalogMetadataUri, catalogType]);
  return catalog;
}

async function verifyIfNotHardhat(contractAddress: string, args: any[] = []) {
  if (isHardhatNetwork()) {
    // Hardhat
    return;
  }

  // sleep 20s
  await delay(20000);

  console.log('Etherscan contract verification starting now.');
  try {
    await run('verify:verify', {
      address: contractAddress,
      constructorArguments: args,
    });
  } catch (error) {
    // probably already verified
  }
}

import { ethers } from 'hardhat';
import { deployContracts, configureAndMint } from './deploy-methods';
import { RMRKCatalogImpl } from '../typechain-types';
import * as C from './constants';

async function main() {
  const catalogFactory = await ethers.getContractFactory('RMRKCatalogImpl');
  const catalog = <RMRKCatalogImpl>catalogFactory.attach(C.CATALOG_ADDRESS);

  const backgrounds = await deployContracts();
  await configureAndMint(
    backgrounds,
    catalog,
    C.KANARIA_ADDRESS,
    C.OWNERS,
    C.ASSETS_URIS,
    C.AMOUNTS,
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

import { ethers } from 'hardhat';
import { KanariaBackgroundArtContest2024, RMRKCatalogImpl } from '../typechain-types';
import { CATALOG_ADDRESS, KANARIA_ADDRESS } from './constants';

async function main() {
  const kanariaFactory = await ethers.getContractFactory('KanariaBackgroundArtContest2024');
  const kanaria = <KanariaBackgroundArtContest2024>kanariaFactory.attach(KANARIA_ADDRESS);

  const catalogFactory = await ethers.getContractFactory('RMRKCatalogImpl');
  const catalog = <RMRKCatalogImpl>catalogFactory.attach(CATALOG_ADDRESS);

  let tx = await kanaria.manageContributor('0x855dF0303Fec3a56c02fE35d8fb4d5e80A8c79A0', true);
  await tx.wait();
  tx = await catalog.manageContributor('0x855dF0303Fec3a56c02fE35d8fb4d5e80A8c79A0', true);
  await tx.wait();
  console.log('Contributors set');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

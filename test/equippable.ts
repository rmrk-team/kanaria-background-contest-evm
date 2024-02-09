import { ethers } from 'hardhat';
import { expect } from 'chai';
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { SignerWithAddress } from '@nomicfoundation/hardhat-ethers/signers';
import { IRMRKCatalog, KanariaBackgroundArtContest2024, RMRKCatalogImpl } from '../typechain-types';
import { deployContracts, configureAndMint, deployCatalog } from '../scripts/deploy-methods';
import * as C from '../scripts/constants';

async function fixture(): Promise<{
  collection: KanariaBackgroundArtContest2024;
  catalog: RMRKCatalogImpl;
}> {
  const collection: KanariaBackgroundArtContest2024 = await deployContracts();
  const catalog = await deployCatalog('ipfs://fake', 'image/*');

  await catalog.addPart({
    partId: C.BACKGROUND_SLOT_ID,
    part: {
      itemType: 1, // Slot
      z: 0,
      equippable: [],
      metadataURI: '',
    },
  });

  const [, fakeKanaria] = await ethers.getSigners();
  await configureAndMint(
    collection,
    catalog,
    fakeKanaria.address,
    C.OWNERS,
    C.ASSETS_URIS,
    C.AMOUNTS,
  );

  return { collection, catalog };
}

describe('KanariaBackgroundArtContest2024 Assets', async () => {
  let collection: KanariaBackgroundArtContest2024;
  let catalog: RMRKCatalogImpl;

  beforeEach(async function () {
    ({ collection, catalog } = await loadFixture(fixture));
  });

  it('can be equipped', async function () {
    expect(await catalog.checkIsEquippable(C.BACKGROUND_SLOT_ID, await collection.getAddress())).to
      .be.true;
  });

  it('minted the right amounts', async function () {
    expect(await collection.balanceOf(C.OWNERS[0])).to.equal(1);
    expect(await collection.balanceOf(C.OWNERS[1])).to.equal(5);
    expect(await collection.balanceOf(C.OWNERS[2])).to.equal(20);
  });

  it('returns the right royalty receiver', async function () {
    const price = ethers.parseEther('1');
    expect((await collection.royaltyInfo(1, price))[0].toLowerCase()).to.equal(C.OWNERS[0]);
    expect((await collection.royaltyInfo(2, price))[0].toLowerCase()).to.equal(C.OWNERS[1]);
    expect((await collection.royaltyInfo(6, price))[0].toLowerCase()).to.equal(C.OWNERS[1]);
    expect((await collection.royaltyInfo(7, price))[0].toLowerCase()).to.equal(C.OWNERS[2]);
    expect((await collection.royaltyInfo(26, price))[0].toLowerCase()).to.equal(C.OWNERS[2]);
  });
});

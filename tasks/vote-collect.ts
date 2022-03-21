import { task } from 'hardhat/config';
import { LensHub__factory } from '../typechain-types';
import { waitForTx, initEnv, getAddrs, deployContract } from './helpers/utils';

task('vote-collect').setAction(async ({}, hre) => {
    const [governance, , user] = await initEnv(hre);
    const addrs = getAddrs();
    const lensHub = LensHub__factory.connect(addrs['lensHub proxy'], governance);

   // const voteCollectModule = await deployContract(
      //  new VoteCollectModule__factory(governance).deploy(lensHub.address)
  //    );

   // await waitForTx(lensHub.whitelistCollectModule(voteCollectModule.address, true));  
});
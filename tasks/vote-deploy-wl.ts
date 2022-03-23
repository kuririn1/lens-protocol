import { task } from 'hardhat/config';
import { LensHub__factory, VoteCollectModule__factory } from '../typechain-types';
import { waitForTx, initEnv, getAddrs, deployContract } from './helpers/utils';
import fs from 'fs';

task('vote-deploy-wl').setAction(async ({}, hre) => {
    const [governance, , user] = await initEnv(hre);
    const addrs = getAddrs();
    const lensHub = LensHub__factory.connect(addrs['lensHub proxy'], governance);

    const voteCollectModule = await deployContract(
        new VoteCollectModule__factory(governance).deploy(lensHub.address)
      );

    await waitForTx(lensHub.whitelistCollectModule(voteCollectModule.address, true));  

    const modAddrs = {
      'voteCollect' : voteCollectModule.address
    };

    const json = JSON.stringify(modAddrs, null, 2);
    console.log(json);
  
    fs.writeFileSync('module-addresses.json', json, 'utf-8');
});
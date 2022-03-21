import { task } from 'hardhat/config';
import { LensHub__factory, VoteCollectModule__factory } from '../typechain-types';
import { PostDataStruct } from '../typechain-types/LensHub';
import { waitForTx, initEnv, getAddrs, deployContract, ZERO_ADDRESS } from './helpers/utils';
import { defaultAbiCoder } from 'ethers/lib/utils';

task('vote-collect').setAction(async ({}, hre) => {
    const [governance, , user] = await initEnv(hre);
    const addrs = getAddrs();
    const lensHub = LensHub__factory.connect(addrs['lensHub proxy'], governance);

    const voteCollectModule = await deployContract(
        new VoteCollectModule__factory(governance).deploy(lensHub.address)
      );

    await waitForTx(lensHub.whitelistCollectModule(voteCollectModule.address, true));  

    // set max vote - votes starts from 0
    const collectModuleData = defaultAbiCoder.encode(['uint8'], [3]);

    const inputStruct: PostDataStruct = {
        profileId: 1,
        contentURI:
          'https://ipfs.fleek.co/ipfs/plantghostplantghostplantghostplantghostplantghostplantghos',
        collectModule: voteCollectModule.address,
        collectModuleData: collectModuleData,
        referenceModule: ZERO_ADDRESS,
        referenceModuleData: [],
    };

    await waitForTx(lensHub.connect(user).post(inputStruct));

    const pubCountBN = await lensHub.getPubCount(1);
    const pubCount = parseInt(pubCountBN._hex, 16);
    console.log('Last pubId: ', pubCount);

    console.log('Vote max: ', await voteCollectModule.getMaxVote(1, pubCount));

    const collectData = defaultAbiCoder.encode(['uint8', 'string'], [3, 'answer 3']);
    await waitForTx(lensHub.collect(1, pubCount, collectData));

    console.log('Vote by address: ', await voteCollectModule.getVoteForAddress(1, pubCount, governance.address));
    console.log('Hash by address: ', await voteCollectModule.getVoteHashForAddress(1, pubCount, governance.address));
    const voteCountBN = await voteCollectModule.getVoteCount(1, pubCount);
    console.log('Vote count: ', parseInt(voteCountBN._hex, 16));
    console.log('Votes: ', await voteCollectModule.getVotes(1, pubCount));
});
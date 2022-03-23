import { task } from 'hardhat/config';
import { LensHub__factory, VoteCollectModule__factory } from '../typechain-types';
import { PostDataStruct } from '../typechain-types/LensHub';
import { waitForTx, getAddrs, ZERO_ADDRESS } from './helpers/utils';
import { defaultAbiCoder } from 'ethers/lib/utils';
import fs from 'fs';

task('vote-collect').setAction(async ({}, hre) => {
    const [ , , ,user, user2, user3] = await hre.ethers.getSigners(); 
    const addrs = getAddrs();
    const modAddrs = getModAddrs();
    const lensHub = LensHub__factory.connect(addrs['lensHub proxy'], user);
    const voteCollectModule = VoteCollectModule__factory.getContract(modAddrs['voteCollect'], VoteCollectModule__factory.abi, user);
    
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

    await waitForTx(lensHub.post(inputStruct));

    const pubCountBN = await lensHub.getPubCount(1);
    const pubCount = parseInt(pubCountBN._hex, 16);
    console.log('Last pubId: ', pubCount);

    console.log('Vote max: ', await voteCollectModule.getMaxVote(1, pubCount));

    let collectData = defaultAbiCoder.encode(['uint8', 'string'], [3, 'answer 3']);
    await waitForTx(lensHub.collect(1, pubCount, collectData));
    collectData = defaultAbiCoder.encode(['uint8', 'string'], [1, 'answer 1']);
    await waitForTx(lensHub.connect(user2).collect(1, pubCount, collectData));
    collectData = defaultAbiCoder.encode(['uint8', 'string'], [2, 'answer 2']);
    await waitForTx(lensHub.connect(user3).collect(1, pubCount, collectData));

    console.log('Vote by address: ', await voteCollectModule.getVoteForAddress(1, pubCount, user.address));
    console.log('Hash by address: ', await voteCollectModule.getVoteHashForAddress(1, pubCount, user.address));
    const voteCountBN = await voteCollectModule.getVoteCount(1, pubCount);
    console.log('Vote count: ', parseInt(voteCountBN._hex, 16));
    console.log('Votes: ', (await voteCollectModule.getVotes(1, pubCount, 1, 1)).map(n => n[0])); // 3
    console.log('Votes: ', (await voteCollectModule.getVotes(1, pubCount, 1, 2)).map(n => n[0])); // 3, 1
    console.log('Votes: ', (await voteCollectModule.getVotes(1, pubCount, 1, 3)).map(n => n[0])); // 3, 1, 2
    console.log('Votes: ', (await voteCollectModule.getVotes(1, pubCount, 2, 1)).map(n => n[0])); // 1
    console.log('Votes: ', (await voteCollectModule.getVotes(1, pubCount, 3, 1)).map(n => n[0])); // 2
    console.log('Votes: ', (await voteCollectModule.getVotes(1, pubCount, 2, 2)).map(n => n[0])); // 2

    //console.log('Votes: ', (await voteCollectModule.getVotes(1, pubCount, 0, 1)).map(n => n[0])); // revert
    //console.log('Votes: ', (await voteCollectModule.getVotes(1, pubCount, 0, 3)).map(n => n[0])); // revert
    //console.log('Votes: ', (await voteCollectModule.getVotes(1, pubCount, 10, 20)).map(n => n[0])); // revert
    //console.log('Votes: ', (await voteCollectModule.getVotes(1, pubCount, 10, 21)).map(n => n[0])); // revert
    //console.log('Votes: ', (await voteCollectModule.getVotes(1, pubCount, 30, 29)).map(n => n[0])); // revert
    //console.log('Votes: ', (await voteCollectModule.getVotes(1, pubCount, -1, 2)).map(n => n[0])); // revert, value out of bounds
});

export function getModAddrs(): any {
    const json = fs.readFileSync('module-addresses.json', 'utf8');
    const addrs = JSON.parse(json);
    return addrs;
  }
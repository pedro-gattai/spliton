import { toNano } from '@ton/core';
import { SplitPayment } from '../build/split/Split_SplitPayment';
import { NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    const splitPayment = provider.open(await SplitPayment.fromInit(provider.sender().address!));
    console.log('Deploying SplitPayment contract...', splitPayment);

    // Deploy the contract (no message needed for deployment)
    await splitPayment.send(
        provider.sender(),
        {
            value: toNano('0.05'),
        },
        { $$type: 'DirectPayment', to: provider.sender().address!, amount: 0n, groupId: 'init' }
    );

    await provider.waitForDeploy(splitPayment.address);

    console.log('Contract Address:', splitPayment.address.toString());
    // console.log('Owner:', await splitPayment.getOwner());
    // console.log('Total Volume:', await splitPayment.getTotalVolume());
    console.log('Is Active:', await splitPayment.getIsContractActive());
}
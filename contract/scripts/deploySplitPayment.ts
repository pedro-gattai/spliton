import { toNano } from '@ton/core';
import { SplitPayment } from '../build/split/Split_SplitPayment';
import { NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    const splitPayment = provider.open(await SplitPayment.fromInit(provider.sender().address!));

    // Deploy usando a mensagem Deploy do contrato
    await splitPayment.send(
        provider.sender(),
        {
            value: toNano('0.1'),
        },
        {
            $$type: 'Deploy',
            queryId: 0n
        }
    );

    await provider.waitForDeploy(splitPayment.address);

    console.log('✅ Contract deployed successfully!');
    console.log('Contract Address:', splitPayment.address.toString());
    console.log('Owner:', provider.sender().address!.toString());

    // Test getters
    try {
        const isActive = await splitPayment.getIsContractActive();
        const totalVolume = await splitPayment.getGetTotalVolume();
        const owner = await splitPayment.getGetOwner();

        console.log('Is Active:', isActive);
        console.log('Total Volume:', totalVolume.toString());
        console.log('Contract Owner:', owner.toString());
    } catch (error) {
        console.log('Error calling getters:', error);
    }
}
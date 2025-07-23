import { Address, toNano } from '@ton/core';
import { SplitPayment } from '../build/split/Split_SplitPayment';
import { NetworkProvider, sleep } from '@ton/blueprint';

export async function run(provider: NetworkProvider, args: string[]) {
    const ui = provider.ui();

    const contractAddress = Address.parse(
        args.length > 0 ? args[0] : await ui.input('SplitPayment contract address')
    );

    if (!(await provider.isContractDeployed(contractAddress))) {
        ui.write(`Error: Contract at address ${contractAddress} is not deployed!`);
        return;
    }

    const splitPayment = provider.open(SplitPayment.fromAddress(contractAddress));

    // Verificar se o contrato está ativo
    const isActive = await splitPayment.getIsContractActive();
    if (!isActive) {
        ui.write('❌ Contract is paused! Cannot execute payments.');
        return;
    }

    // Endereço de destino para o teste
    const toAddress = Address.parse(
        args.length > 1 ? args[1] : await ui.input('Recipient address')
    );

    const paymentAmount = toNano('0.5'); // 0.5 TON para teste
    const contractFee = toNano('0.05'); // Taxa do contrato
    const gasAmount = toNano('0.1'); // Gas extra
    const totalSent = paymentAmount + contractFee + gasAmount;

    ui.write(`📤 Sending DirectPayment:`);
    ui.write(`  Recipient: ${toAddress.toString()}`);
    ui.write(`  Amount: ${paymentAmount} nanoTON (0.5 TON)`);
    ui.write(`  Fee: ${contractFee} nanoTON (0.05 TON)`);
    ui.write(`  Total sent: ${totalSent} nanoTON`);

    // Capturar volume antes
    const volumeBefore = await splitPayment.getGetTotalVolume();
    const feesBefore = await splitPayment.getGetTotalFees();

    ui.write(`📊 Before payment:`);
    ui.write(`  Total Volume: ${volumeBefore} nanoTON`);
    ui.write(`  Total Fees: ${feesBefore} nanoTON`);

    // Executar DirectPayment
    await splitPayment.send(
        provider.sender(),
        {
            value: totalSent,
        },
        {
            $$type: 'DirectPayment',
            to: toAddress,
            amount: paymentAmount,
            groupId: 'test-direct-payment'
        }
    );

    ui.write('✅ DirectPayment transaction sent! Waiting for confirmation...');

    // Aguardar processamento
    let volumeAfter = volumeBefore;
    let feesAfter = feesBefore;
    let attempt = 1;
    
    while (volumeAfter === volumeBefore && attempt <= 15) {
        ui.setActionPrompt(`Checking transaction... Attempt ${attempt}/15`);
        await sleep(2000);
        
        try {
            volumeAfter = await splitPayment.getGetTotalVolume();
            feesAfter = await splitPayment.getGetTotalFees();
        } catch (error) {
            ui.write(`⚠️ Error checking status: ${error}`);
        }
        
        attempt++;
    }

    ui.clearActionPrompt();
    
    if (volumeAfter > volumeBefore) {
        ui.write('🎉 DirectPayment processed successfully!');
        ui.write(`📊 After payment:`);
        ui.write(`  Total Volume: ${volumeAfter} nanoTON (+${volumeAfter - volumeBefore})`);
        ui.write(`  Total Fees: ${feesAfter} nanoTON (+${feesAfter - feesBefore})`);
        ui.write(`💰 Payment of ${paymentAmount} nanoTON sent to ${toAddress.toString()}`);
    } else {
        ui.write('⚠️ Payment may still be processing or failed...');
        ui.write('Check the blockchain explorer for transaction status.');
    }

    // Mostrar informações do contrato
    const contractBalance = await splitPayment.getGetContractBalance();
    ui.write(`💳 Contract balance: ${contractBalance} nanoTON`);
}

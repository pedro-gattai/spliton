import { Address, toNano, Dictionary } from '@ton/core';
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
        ui.write('❌ Contract is paused! Cannot execute settlements.');
        return;
    }

    // Verificar se é o owner (apenas owner pode fazer BatchSettlement)
    const contractOwner = await splitPayment.getGetOwner();
    const senderAddress = provider.sender().address!;
    
    if (!contractOwner.equals(senderAddress)) {
        ui.write('❌ Only contract owner can execute BatchSettlement!');
        ui.write(`Contract Owner: ${contractOwner.toString()}`);
        ui.write(`Your Address: ${senderAddress.toString()}`);
        return;
    }

    // Criar dictionary de recipients para teste
    const recipients = Dictionary.empty<Address, bigint>();
    
    // Endereços de exemplo - você pode passar como argumentos
    const addr1 = args.length > 1 ? 
        Address.parse(args[1]) : 
        Address.parse(await ui.input('First recipient address'));
        
    const addr2 = args.length > 2 ? 
        Address.parse(args[2]) : 
        Address.parse(await ui.input('Second recipient address'));

    const amount1 = toNano('0.3'); // 0.3 TON
    const amount2 = toNano('0.2'); // 0.2 TON
    
    recipients.set(addr1, amount1);
    recipients.set(addr2, amount2);

    const totalAmount = amount1 + amount2; // 0.5 TON total
    const gasAmount = toNano('0.2'); // Gas extra para múltiplas transferências
    const totalSent = totalAmount + gasAmount;

    ui.write(`📤 Executing BatchSettlement:`);
    ui.write(`  Recipients: ${recipients.size}`);
    ui.write(`  ${addr1.toString()} → ${amount1} nanoTON (0.3 TON)`);
    ui.write(`  ${addr2.toString()} → ${amount2} nanoTON (0.2 TON)`);
    ui.write(`  Total amount: ${totalAmount} nanoTON (0.5 TON)`);
    ui.write(`  Total sent: ${totalSent} nanoTON`);

    // Capturar volume antes
    const volumeBefore = await splitPayment.getGetTotalVolume();
    const contractBalanceBefore = await splitPayment.getGetContractBalance();

    ui.write(`📊 Before settlement:`);
    ui.write(`  Total Volume: ${volumeBefore} nanoTON`);
    ui.write(`  Contract Balance: ${contractBalanceBefore} nanoTON`);

    // Executar BatchSettlement
    await splitPayment.send(
        provider.sender(),
        {
            value: totalSent,
        },
        {
            $$type: 'BatchSettlement',
            recipients: recipients,
            groupId: 'test-batch-settlement'
        }
    );

    ui.write('✅ BatchSettlement transaction sent! Waiting for confirmation...');

    // Aguardar processamento
    let volumeAfter = volumeBefore;
    let contractBalanceAfter = contractBalanceBefore;
    let attempt = 1;
    
    while (volumeAfter === volumeBefore && attempt <= 20) {
        ui.setActionPrompt(`Checking settlement... Attempt ${attempt}/20`);
        await sleep(3000); // Aguardar mais tempo para batch processing
        
        try {
            volumeAfter = await splitPayment.getGetTotalVolume();
            contractBalanceAfter = await splitPayment.getGetContractBalance();
        } catch (error) {
            ui.write(`⚠️ Error checking status: ${error}`);
        }
        
        attempt++;
    }

    ui.clearActionPrompt();
    
    if (volumeAfter > volumeBefore) {
        ui.write('🎉 BatchSettlement processed successfully!');
        ui.write(`📊 After settlement:`);
        ui.write(`  Total Volume: ${volumeAfter} nanoTON (+${volumeAfter - volumeBefore})`);
        ui.write(`  Contract Balance: ${contractBalanceAfter} nanoTON`);
        ui.write(`💰 Processed ${recipients.size} payments totaling ${totalAmount} nanoTON`);
        
        // Mostrar detalhes dos pagamentos
        ui.write(`✅ Payment details:`);
        ui.write(`  📤 ${amount1} nanoTON → ${addr1.toString()}`);
        ui.write(`  📤 ${amount2} nanoTON → ${addr2.toString()}`);
    } else {
        ui.write('⚠️ Settlement may still be processing or failed...');
        ui.write('Check the blockchain explorer for transaction status.');
        ui.write(`Current volume: ${volumeAfter}, Expected: > ${volumeBefore}`);
    }

    // Mostrar informações finais
    try {
        const totalFees = await splitPayment.getGetTotalFees();
        ui.write(`💳 Contract total fees collected: ${totalFees} nanoTON`);
    } catch (error) {
        ui.write(`⚠️ Could not fetch fees: ${error}`);
    }
}

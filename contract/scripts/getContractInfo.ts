import { Address } from '@ton/core';
import { SplitPayment } from '../build/split/Split_SplitPayment';
import { NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider, args: string[]) {
    const ui = provider.ui();

    const contractAddress = Address.parse(
        args.length > 0 ? args[0] : await ui.input('SplitPayment contract address')
    );

    if (!(await provider.isContractDeployed(contractAddress))) {
        ui.write(`❌ Error: Contract at address ${contractAddress} is not deployed!`);
        return;
    }

    const splitPayment = provider.open(SplitPayment.fromAddress(contractAddress));

    ui.write('🔍 Fetching contract information...\n');

    try {
        // Informações básicas
        const contractInfo = await splitPayment.getGetContractInfo();
        const isActive = await splitPayment.getIsContractActive();
        const totalVolume = await splitPayment.getGetTotalVolume();
        const totalFees = await splitPayment.getGetTotalFees();
        const contractBalance = await splitPayment.getGetContractBalance();
        const owner = await splitPayment.getGetOwner();

        ui.write('📊 CONTRACT STATUS:');
        ui.write(`  Address: ${contractAddress.toString()}`);
        ui.write(`  Owner: ${owner.toString()}`);
        ui.write(`  Is Active: ${isActive ? '✅ Active' : '❌ Paused'}`);
        ui.write(`  Balance: ${contractBalance} nanoTON (${Number(contractBalance) / 1e9} TON)`);
        ui.write('');

        ui.write('📈 STATISTICS:');
        ui.write(`  Total Volume: ${totalVolume} nanoTON (${Number(totalVolume) / 1e9} TON)`);
        ui.write(`  Total Fees: ${totalFees} nanoTON (${Number(totalFees) / 1e9} TON)`);
        ui.write('');

        ui.write('🔧 CONTRACT INFO:');
        ui.write(`  Owner: ${contractInfo.owner.toString()}`);
        ui.write(`  Total Volume: ${contractInfo.totalVolume} nanoTON`);
        ui.write(`  Total Fees: ${contractInfo.totalFees} nanoTON`);
        ui.write(`  Is Active: ${contractInfo.isActive}`);
        ui.write('');

        // Testar validação de pagamento
        ui.write('🧪 TESTING PAYMENT VALIDATION:');
        
        const testAmounts = [0, 500000000, 100000000000, 1000000000]; // 0, 0.5, 100, 1 TON
        
        for (const amount of testAmounts) {
            const isValid = await splitPayment.getValidatePayment(BigInt(amount));
            const tonValue = Number(amount) / 1e9;
            ui.write(`  ${tonValue} TON: ${isValid ? '✅ Valid' : '❌ Invalid'}`);
        }

        ui.write('');
        ui.write('✅ Contract information fetched successfully!');
        
        if (!isActive) {
            ui.write('⚠️  WARNING: Contract is currently paused!');
        }

    } catch (error) {
        ui.write(`❌ Error fetching contract information: ${error}`);
    }
}

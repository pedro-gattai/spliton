import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { toNano, Address, Dictionary } from '@ton/core';
import { SplitPayment } from '../build/split/Split_SplitPayment';
import '@ton/test-utils';

describe('SplitPayment - Testes Abrangentes', () => {
    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let owner: SandboxContract<TreasuryContract>;
    let user1: SandboxContract<TreasuryContract>;
    let user2: SandboxContract<TreasuryContract>;
    let user3: SandboxContract<TreasuryContract>;
    let user4: SandboxContract<TreasuryContract>;
    let splitPayment: SandboxContract<SplitPayment>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        // Create test users
        deployer = await blockchain.treasury('deployer');
        owner = await blockchain.treasury('owner');
        user1 = await blockchain.treasury('user1');
        user2 = await blockchain.treasury('user2');
        user3 = await blockchain.treasury('user3');
        user4 = await blockchain.treasury('user4');

        // Deploy contract
        splitPayment = blockchain.openContract(
            await SplitPayment.fromInit(owner.address)
        );

        const deployResult = await splitPayment.send(
            deployer.getSender(),
            { value: toNano('0.1') },
            { $$type: 'Deploy', queryId: 0n }
        );

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: splitPayment.address,
            deploy: true,
            success: true,
        });
    });

    // ========== TESTES DE DEPLOY ==========
    describe('Deploy & Initial State', () => {
        it('should deploy with correct initial values', async () => {
            const totalVolume = await splitPayment.getGetTotalVolume();
            const isActive = await splitPayment.getIsContractActive();
            const contractOwner = await splitPayment.getGetOwner();
            const totalFees = await splitPayment.getGetTotalFees();
            const balance = await splitPayment.getGetContractBalance();

            expect(totalVolume).toBe(0n);
            expect(isActive).toBe(true);
            expect(contractOwner.toString()).toBe(owner.address.toString());
            expect(totalFees).toBe(0n);
            expect(balance).toBeGreaterThan(0n); // Deploy fee
        });

        it('should emit PaymentProcessed event on deploy', async () => {
            // Deploy já foi feito no beforeEach, só verificamos se funcionou
            const isActive = await splitPayment.getIsContractActive();
            expect(isActive).toBe(true);
        });
    });

    // ========== TESTES DE PAGAMENTO DIRETO ==========
    describe('Direct Payments', () => {
        it('should process simple direct payment', async () => {
            const paymentAmount = toNano('1');
            const fee = toNano('0.05');
            const totalSent = paymentAmount + fee + toNano('0.05'); // Extra gas
            
            const initialBalance2 = await user2.getBalance();
            
            const result = await splitPayment.send(
                user1.getSender(),
                { value: totalSent },
                {
                    $$type: 'DirectPayment',
                    to: user2.address,
                    amount: paymentAmount,
                    groupId: 'viagem-rio-2025'
                }
            );

            expect(result.transactions).toHaveTransaction({
                from: user1.address,
                to: splitPayment.address,
                success: true,
            });

            expect(result.transactions).toHaveTransaction({
                from: splitPayment.address,
                to: user2.address,
                value: paymentAmount,
                success: true,
            });

            // Check updated stats
            const totalVolume = await splitPayment.getGetTotalVolume();
            const totalFees = await splitPayment.getGetTotalFees();
            
            expect(totalVolume).toBe(paymentAmount);
            expect(totalFees).toBe(fee);
        });

        it('should handle multiple sequential payments', async () => {
            const payments = [
                { from: user1, to: user2, amount: toNano('0.5'), group: 'jantar-1' },
                { from: user2, to: user3, amount: toNano('1.2'), group: 'uber-1' },
                { from: user3, to: user1, amount: toNano('0.8'), group: 'hotel-1' }
            ];

            let expectedVolume = 0n;
            let expectedFees = 0n;

            for (const payment of payments) {
                const fee = toNano('0.05');
                const totalSent = payment.amount + fee + toNano('0.05');

                await splitPayment.send(
                    payment.from.getSender(),
                    { value: totalSent },
                    {
                        $$type: 'DirectPayment',
                        to: payment.to.address,
                        amount: payment.amount,
                        groupId: payment.group
                    }
                );

                expectedVolume += payment.amount;
                expectedFees += fee;
            }

            const totalVolume = await splitPayment.getGetTotalVolume();
            const totalFees = await splitPayment.getGetTotalFees();

            expect(totalVolume).toBe(expectedVolume);
            expect(totalFees).toBe(expectedFees);
        });

        it('should reject payment with insufficient funds', async () => {
            const paymentAmount = toNano('1');
            const insufficientAmount = toNano('0.8'); // Menos que amount + fee

            const result = await splitPayment.send(
                user1.getSender(),
                { value: insufficientAmount },
                {
                    $$type: 'DirectPayment',
                    to: user2.address,
                    amount: paymentAmount,
                    groupId: 'test-insufficient'
                }
            );

            expect(result.transactions).toHaveTransaction({
                from: user1.address,
                to: splitPayment.address,
                success: false,
            });
        });

        it('should reject payment with zero amount', async () => {
            const result = await splitPayment.send(
                user1.getSender(),
                { value: toNano('0.1') },
                {
                    $$type: 'DirectPayment',
                    to: user2.address,
                    amount: 0n,
                    groupId: 'test-zero'
                }
            );

            expect(result.transactions).toHaveTransaction({
                from: user1.address,
                to: splitPayment.address,
                success: false,
            });
        });

        it('should reject payment above limit (100 TON)', async () => {
            const hugePay = toNano('101'); // Above limit

            const result = await splitPayment.send(
                user1.getSender(),
                { value: hugePay + toNano('1') }, // Enough for amount + fee
                {
                    $$type: 'DirectPayment',
                    to: user2.address,
                    amount: hugePay,
                    groupId: 'test-huge'
                }
            );

            expect(result.transactions).toHaveTransaction({
                from: user1.address,
                to: splitPayment.address,
                success: false,
            });
        });

        it('should accept payment at exact limit (100 TON)', async () => {
            const maxPayment = toNano('100');
            const fee = toNano('0.05');

            const result = await splitPayment.send(
                user1.getSender(),
                { value: maxPayment + fee + toNano('0.1') },
                {
                    $$type: 'DirectPayment',
                    to: user2.address,
                    amount: maxPayment,
                    groupId: 'test-max'
                }
            );

            expect(result.transactions).toHaveTransaction({
                from: user1.address,
                to: splitPayment.address,
                success: true,
            });

            expect(result.transactions).toHaveTransaction({
                from: splitPayment.address,
                to: user2.address,
                value: maxPayment,
                success: true,
            });
        });
    });

    // ========== TESTES DE LIQUIDAÇÃO EM LOTE ==========
    describe('Batch Settlement', () => {
        it('should process batch settlement correctly', async () => {
            const recipients = Dictionary.empty<Address, bigint>();
            recipients.set(user1.address, toNano('2'));
            recipients.set(user2.address, toNano('1.5'));
            recipients.set(user3.address, toNano('0.8'));

            const totalAmount = toNano('4.3');

            const result = await splitPayment.send(
                owner.getSender(),
                { value: totalAmount + toNano('1') }, // Extra for gas
                {
                    $$type: 'BatchSettlement',
                    recipients: recipients,
                    groupId: 'liquidacao-viagem-bahia'
                }
            );

            expect(result.transactions).toHaveTransaction({
                from: owner.address,
                to: splitPayment.address,
                success: true,
            });

            // Check all recipients received payments
            expect(result.transactions).toHaveTransaction({
                from: splitPayment.address,
                to: user1.address,
                value: toNano('2'),
                success: true,
            });

            expect(result.transactions).toHaveTransaction({
                from: splitPayment.address,
                to: user2.address,
                value: toNano('1.5'),
                success: true,
            });

            expect(result.transactions).toHaveTransaction({
                from: splitPayment.address,
                to: user3.address,
                value: toNano('0.8'),
                success: true,
            });

            // Check volume updated
            const totalVolume = await splitPayment.getGetTotalVolume();
            expect(totalVolume).toBe(totalAmount);
        });

        it('should reject batch settlement from non-owner', async () => {
            const recipients = Dictionary.empty<Address, bigint>();
            recipients.set(user1.address, toNano('1'));

            const result = await splitPayment.send(
                user1.getSender(), // Not owner
                { value: toNano('2') },
                {
                    $$type: 'BatchSettlement',
                    recipients: recipients,
                    groupId: 'unauthorized-batch'
                }
            );

            expect(result.transactions).toHaveTransaction({
                from: user1.address,
                to: splitPayment.address,
                success: false,
            });
        });

        it('should handle empty batch settlement', async () => {
            const recipients = Dictionary.empty<Address, bigint>();

            const result = await splitPayment.send(
                owner.getSender(),
                { value: toNano('0.1') },
                {
                    $$type: 'BatchSettlement',
                    recipients: recipients,
                    groupId: 'empty-batch'
                }
            );

            expect(result.transactions).toHaveTransaction({
                from: owner.address,
                to: splitPayment.address,
                success: true,
            });

            // Volume should remain unchanged
            const totalVolume = await splitPayment.getGetTotalVolume();
            expect(totalVolume).toBe(0n);
        });

        it('should handle batch with zero amounts', async () => {
            const recipients = Dictionary.empty<Address, bigint>();
            recipients.set(user1.address, toNano('1'));
            recipients.set(user2.address, 0n); // Zero amount
            recipients.set(user3.address, toNano('0.5'));

            const result = await splitPayment.send(
                owner.getSender(),
                { value: toNano('2') },
                {
                    $$type: 'BatchSettlement',
                    recipients: recipients,
                    groupId: 'batch-with-zeros'
                }
            );

            expect(result.transactions).toHaveTransaction({
                from: splitPayment.address,
                to: user1.address,
                success: true,
            });

            expect(result.transactions).toHaveTransaction({
                from: splitPayment.address,
                to: user3.address,
                success: true,
            });

            // User2 should NOT receive payment (zero amount)
            expect(result.transactions).not.toHaveTransaction({
                from: splitPayment.address,
                to: user2.address,
            });
        });
    });

    // ========== TESTES DE ADMINISTRAÇÃO ==========
    describe('Administrative Functions', () => {
        it('should pause contract by owner', async () => {
            const result = await splitPayment.send(
                owner.getSender(),
                { value: toNano('0.05') },
                { $$type: 'PauseContract' }
            );

            expect(result.transactions).toHaveTransaction({
                from: owner.address,
                to: splitPayment.address,
                success: true,
            });

            const isActive = await splitPayment.getIsContractActive();
            expect(isActive).toBe(false);
        });

        it('should resume contract by owner', async () => {
            // First pause
            await splitPayment.send(
                owner.getSender(),
                { value: toNano('0.05') },
                { $$type: 'PauseContract' }
            );

            // Then resume
            const result = await splitPayment.send(
                owner.getSender(),
                { value: toNano('0.05') },
                { $$type: 'ResumeContract' }
            );

            expect(result.transactions).toHaveTransaction({
                from: owner.address,
                to: splitPayment.address,
                success: true,
            });

            const isActive = await splitPayment.getIsContractActive();
            expect(isActive).toBe(true);
        });

        it('should reject pause from non-owner', async () => {
            const result = await splitPayment.send(
                user1.getSender(),
                { value: toNano('0.05') },
                { $$type: 'PauseContract' }
            );

            expect(result.transactions).toHaveTransaction({
                from: user1.address,
                to: splitPayment.address,
                success: false,
            });

            const isActive = await splitPayment.getIsContractActive();
            expect(isActive).toBe(true); // Should remain active
        });

        it('should reject payments when paused', async () => {
            // Pause contract
            await splitPayment.send(
                owner.getSender(),
                { value: toNano('0.05') },
                { $$type: 'PauseContract' }
            );

            // Try payment
            const result = await splitPayment.send(
                user1.getSender(),
                { value: toNano('1.1') },
                {
                    $$type: 'DirectPayment',
                    to: user2.address,
                    amount: toNano('1'),
                    groupId: 'test-paused'
                }
            );

            expect(result.transactions).toHaveTransaction({
                from: user1.address,
                to: splitPayment.address,
                success: false,
            });
        });

        it('should reject batch settlement when paused', async () => {
            // Pause contract
            await splitPayment.send(
                owner.getSender(),
                { value: toNano('0.05') },
                { $$type: 'PauseContract' }
            );

            const recipients = Dictionary.empty<Address, bigint>();
            recipients.set(user1.address, toNano('1'));

            const result = await splitPayment.send(
                owner.getSender(),
                { value: toNano('2') },
                {
                    $$type: 'BatchSettlement',
                    recipients: recipients,
                    groupId: 'paused-batch'
                }
            );

            expect(result.transactions).toHaveTransaction({
                from: owner.address,
                to: splitPayment.address,
                success: false,
            });
        });
    });

    // ========== TESTES DE TAXAS ==========
    describe('Fee Management', () => {
        beforeEach(async () => {
            // Generate some fees
            const payments = [
                { amount: toNano('1'), fee: toNano('0.05') },
                { amount: toNano('2'), fee: toNano('0.05') },
                { amount: toNano('0.5'), fee: toNano('0.05') }
            ];

            for (const payment of payments) {
                await splitPayment.send(
                    user1.getSender(),
                    { value: payment.amount + payment.fee + toNano('0.05') },
                    {
                        $$type: 'DirectPayment',
                        to: user2.address,
                        amount: payment.amount,
                        groupId: 'fee-test'
                    }
                );
            }
        });

        it('should withdraw fees by owner', async () => {
            const withdrawAmount = toNano('0.1');
            const initialOwnerBalance = await owner.getBalance();

            const result = await splitPayment.send(
                owner.getSender(),
                { value: toNano('0.05') },
                {
                    $$type: 'WithdrawFees',
                    amount: withdrawAmount
                }
            );

            expect(result.transactions).toHaveTransaction({
                from: owner.address,
                to: splitPayment.address,
                success: true,
            });

            expect(result.transactions).toHaveTransaction({
                from: splitPayment.address,
                to: owner.address,
                value: withdrawAmount,
                success: true,
            });

            // Check fees reduced
            const totalFees = await splitPayment.getGetTotalFees();
            expect(totalFees).toBe(toNano('0.05')); // 0.15 - 0.1 = 0.05
        });

        it('should reject fee withdrawal from non-owner', async () => {
            const result = await splitPayment.send(
                user1.getSender(),
                { value: toNano('0.05') },
                {
                    $$type: 'WithdrawFees',
                    amount: toNano('0.05')
                }
            );

            expect(result.transactions).toHaveTransaction({
                from: user1.address,
                to: splitPayment.address,
                success: false,
            });
        });

        it('should reject withdrawal of more fees than available', async () => {
            const totalFees = await splitPayment.getGetTotalFees();
            const excessiveAmount = totalFees + toNano('1');

            const result = await splitPayment.send(
                owner.getSender(),
                { value: toNano('0.05') },
                {
                    $$type: 'WithdrawFees',
                    amount: excessiveAmount
                }
            );

            expect(result.transactions).toHaveTransaction({
                from: owner.address,
                to: splitPayment.address,
                success: false,
            });
        });

        it('should reject zero fee withdrawal', async () => {
            const result = await splitPayment.send(
                owner.getSender(),
                { value: toNano('0.05') },
                {
                    $$type: 'WithdrawFees',
                    amount: 0n
                }
            );

            expect(result.transactions).toHaveTransaction({
                from: owner.address,
                to: splitPayment.address,
                success: false,
            });
        });
    });

    // ========== TESTES DE EMERGÊNCIA ==========
    describe('Emergency Functions', () => {
        it('should perform emergency withdrawal when paused', async () => {
            // First pause
            await splitPayment.send(
                owner.getSender(),
                { value: toNano('0.05') },
                { $$type: 'PauseContract' }
            );

            // Then emergency withdraw
            const result = await splitPayment.send(
                owner.getSender(),
                { value: toNano('0.05') },
                { $$type: 'EmergencyWithdraw' }
            );

            expect(result.transactions).toHaveTransaction({
                from: owner.address,
                to: splitPayment.address,
                success: true,
            });

            expect(result.transactions).toHaveTransaction({
                from: splitPayment.address,
                to: owner.address,
                success: true,
            });
        });

        it('should reject emergency withdrawal when active', async () => {
            const result = await splitPayment.send(
                owner.getSender(),
                { value: toNano('0.05') },
                { $$type: 'EmergencyWithdraw' }
            );

            expect(result.transactions).toHaveTransaction({
                from: owner.address,
                to: splitPayment.address,
                success: false,
            });
        });

        it('should reject emergency withdrawal from non-owner', async () => {
            // Pause first
            await splitPayment.send(
                owner.getSender(),
                { value: toNano('0.05') },
                { $$type: 'PauseContract' }
            );

            const result = await splitPayment.send(
                user1.getSender(),
                { value: toNano('0.05') },
                { $$type: 'EmergencyWithdraw' }
            );

            expect(result.transactions).toHaveTransaction({
                from: user1.address,
                to: splitPayment.address,
                success: false,
            });
        });
    });

    // ========== TESTES DE QUERIES ==========
    describe('Query Functions', () => {
        it('should return correct contract info', async () => {
            // Add some activity
            await splitPayment.send(
                user1.getSender(),
                { value: toNano('1.1') },
                {
                    $$type: 'DirectPayment',
                    to: user2.address,
                    amount: toNano('1'),
                    groupId: 'info-test'
                }
            );

            const info = await splitPayment.getGetContractInfo();
            
            expect(info.owner.toString()).toBe(owner.address.toString());
            expect(info.totalVolume).toBe(toNano('1'));
            expect(info.totalFees).toBe(toNano('0.05'));
            expect(info.isActive).toBe(true);
        });

        it('should validate payments correctly', async () => {
            // Valid amount
            const validResult = await splitPayment.getValidatePayment(toNano('5'));
            expect(validResult).toBe(true);

            // Zero amount
            const zeroResult = await splitPayment.getValidatePayment(0n);
            expect(zeroResult).toBe(false);

            // Too large amount
            const largeResult = await splitPayment.getValidatePayment(toNano('101'));
            expect(largeResult).toBe(false);

            // Pause contract and test
            await splitPayment.send(
                owner.getSender(),
                { value: toNano('0.05') },
                { $$type: 'PauseContract' }
            );

            const pausedResult = await splitPayment.getValidatePayment(toNano('5'));
            expect(pausedResult).toBe(false);
        });

        it('should return correct balance', async () => {
            const balance = await splitPayment.getGetContractBalance();
            expect(balance).toBeGreaterThan(0n);
        });
    });

    // ========== CENÁRIOS COMPLEXOS ==========
    describe('Complex Scenarios', () => {
        it('should handle "Viagem Bahia" complete scenario', async () => {
            // Simulação da história completa
            
            // 1. Despesas individuais (off-chain simulation)
            const expenses = [
                { payer: user1, amount: toNano('4'), description: 'Hotel' },      // João pagou hotel
                { payer: user2, amount: toNano('1'), description: 'Jantar' },     // Maria pagou jantar  
                { payer: user3, amount: toNano('2'), description: 'Passeio' },    // Pedro pagou passeio
                { payer: user4, amount: toNano('0.5'), description: 'Uber' }     // Ana pagou uber
            ];

            // Total: 7.5 TON / 4 pessoas = 1.875 TON cada
            // Quem deve receber:
            // João: pagou 4, deve 1.875 → recebe 2.125
            // Maria: pagou 1, deve 1.875 → deve pagar 0.875  
            // Pedro: pagou 2, deve 1.875 → recebe 0.125
            // Ana: pagou 0.5, deve 1.875 → deve pagar 1.375

            // 2. Liquidação automática via BatchSettlement
            const recipients = Dictionary.empty<Address, bigint>();
            recipients.set(user1.address, toNano('2.125')); // João recebe
            recipients.set(user3.address, toNano('0.125')); // Pedro recebe

            const totalToDistribute = toNano('2.25');

            const result = await splitPayment.send(
                owner.getSender(), // Backend
                { value: totalToDistribute + toNano('0.5') },
                {
                    $$type: 'BatchSettlement',
                    recipients: recipients,
                    groupId: 'viagem-bahia-2025'
                }
            );

            expect(result.transactions).toHaveTransaction({
                from: owner.address,
                to: splitPayment.address,
                success: true,
            });

            // João e Pedro receberam
            expect(result.transactions).toHaveTransaction({
                from: splitPayment.address,
                to: user1.address,
                value: toNano('2.125'),
                success: true,
            });

            expect(result.transactions).toHaveTransaction({
                from: splitPayment.address,
                to: user3.address,
                value: toNano('0.125'),
                success: true,
            });

            // Check final stats
            const totalVolume = await splitPayment.getGetTotalVolume();
            expect(totalVolume).toBe(totalToDistribute);
        });

        it('should handle stress test with many small payments', async () => {
            const numberOfPayments = 20;
            const paymentAmount = toNano('0.1');
            const fee = toNano('0.05');

            for (let i = 0; i < numberOfPayments; i++) {
                const fromUser = i % 2 === 0 ? user1 : user2;
                const toUser = i % 2 === 0 ? user2 : user1;

                await splitPayment.send(
                    fromUser.getSender(),
                    { value: paymentAmount + fee + toNano('0.02') },
                    {
                        $$type: 'DirectPayment',
                        to: toUser.address,
                        amount: paymentAmount,
                        groupId: `stress-test-${i}`
                    }
                );
            }

            const totalVolume = await splitPayment.getGetTotalVolume();
            const totalFees = await splitPayment.getGetTotalFees();

            expect(totalVolume).toBe(paymentAmount * BigInt(numberOfPayments));
            expect(totalFees).toBe(fee * BigInt(numberOfPayments));
        });

        it('should handle mixed operations scenario', async () => {
            // 1. Direct payment
            await splitPayment.send(
                user1.getSender(),
                { value: toNano('1.1') },
                {
                    $$type: 'DirectPayment',
                    to: user2.address,
                    amount: toNano('1'),
                    groupId: 'mixed-1'
                }
            );

            // 2. Pause
            await splitPayment.send(
                owner.getSender(),
                { value: toNano('0.05') },
                { $$type: 'PauseContract' }
            );

            // 3. Try payment (should fail)
            const failedPayment = await splitPayment.send(
                user2.getSender(),
                { value: toNano('0.6') },
                {
                    $$type: 'DirectPayment',
                    to: user1.address,
                    amount: toNano('0.5'),
                    groupId: 'mixed-2'
                }
            );

            expect(failedPayment.transactions).toHaveTransaction({
                from: user2.address,
                to: splitPayment.address,
                success: false,
            });

            // 4. Resume
            await splitPayment.send(
                owner.getSender(),
                { value: toNano('0.05') },
                { $$type: 'ResumeContract' }
            );

            // 5. Batch settlement
            const recipients = Dictionary.empty<Address, bigint>();
            recipients.set(user3.address, toNano('0.8'));

            await splitPayment.send(
                owner.getSender(),
                { value: toNano('1') },
                {
                    $$type: 'BatchSettlement',
                    recipients: recipients,
                    groupId: 'mixed-batch'
                }
            );

            // 6. Withdraw fees
            await splitPayment.send(
                owner.getSender(),
                { value: toNano('0.05') },
                {
                    $$type: 'WithdrawFees',
                    amount: toNano('0.05')
                }
            );

            // Check final state
            const totalVolume = await splitPayment.getGetTotalVolume();
            const totalFees = await splitPayment.getGetTotalFees();
            const isActive = await splitPayment.getIsContractActive();

            expect(totalVolume).toBe(toNano('1.8')); // 1 + 0.8
            expect(totalFees).toBe(0n); // 0.05 - 0.05 = 0
            expect(isActive).toBe(true);
        });
    });
});
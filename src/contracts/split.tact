// ========== EVENTOS ==========
message(0x01) PaymentProcessed {
    from: Address;
    to: Address;
    amount: Int;
    groupId: String;
    timestamp: Int;
}

message(0x02) SettlementCompleted {
    groupId: String;
    totalSettlements: Int;
    timestamp: Int;
}

message(0x10) DirectPayment {
    to: Address;
    amount: Int;
    groupId: String;
}

message(0x11) BatchSettlement {
    recipients: map<Address, Int>;
    groupId: String;
}

// ========== MENSAGENS ADMINISTRATIVAS ==========
message(0x20) PauseContract {}

message(0x21) ResumeContract {}

// ========== CONTRATO SPLITPAYMENT ==========
contract SplitPayment {
    owner: Address;
    totalVolume: Int;
    isActive: Bool;
    
    init(owner: Address) {
        self.owner = owner;
        self.totalVolume = 0;
        self.isActive = true;
    }
    
    receive(msg: DirectPayment) {
        require(self.isActive, "Contract is paused");
        require(msg.amount > 0, "Amount must be positive");
        require(msg.amount <= ton("100"), "Amount too large");
        require(context().value >= msg.amount + ton("0.1"), "Insufficient funds sent");
        
        send(SendParameters{
            to: msg.to,
            value: msg.amount,
            mode: SendRemainingBalance,
            body: beginCell()
                .storeUint(0x11111111, 32)
                .storeAddress(sender())
                .storeUint(now(), 32)
                .endCell()
        });
        
        self.totalVolume += msg.amount;
        
        emit(PaymentProcessed{
            from: sender(),
            to: msg.to,
            amount: msg.amount,
            groupId: msg.groupId,
            timestamp: now()
        }.toCell());
    }
    
    receive(msg: BatchSettlement) {
        require(sender() == self.owner, "Only backend can trigger settlement");
        require(self.isActive, "Contract is paused");
        
        let totalAmount: Int = 0;
        let settlementCount: Int = 0;
        
        foreach(recipient, amount in msg.recipients) {
            if (amount > 0) {
                send(SendParameters{
                    to: recipient,
                    value: amount,
                    mode: SendIgnoreErrors,
                    body: beginCell()
                        .storeUint(0x12345678, 32)
                        .storeUint(now(), 32)
                        .endCell()
                });
                totalAmount += amount;
                settlementCount += 1;
            }
        }
        
        self.totalVolume += totalAmount;
        
        emit(SettlementCompleted{
            groupId: msg.groupId,
            totalSettlements: settlementCount,
            timestamp: now()
        }.toCell());
    }
    
    // ========== FUNÇÕES ADMINISTRATIVAS ==========
    receive(msg: PauseContract) {
        require(sender() == self.owner, "Only owner");
        self.isActive = false;
    }

    receive(msg: ResumeContract) {
        require(sender() == self.owner, "Only owner");
        self.isActive = true;
    }
    
    // ========== QUERIES ==========
    get fun getTotalVolume(): Int {
        return self.totalVolume;
    }
    
    get fun isContractActive(): Bool {
        return self.isActive;
    }
    
    get fun getOwner(): Address {
        return self.owner;
    }
}
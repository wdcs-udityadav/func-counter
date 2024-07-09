import { Contract, ContractProvider, Sender, Address, Cell, contractAddress, beginCell } from "@ton/core";

export default class Counter implements Contract {

    static createForDeploy(code: Cell, owner_address: Address): Counter {
        const data = beginCell()
            .storeUint(0, 32)                   // initial counter_value
            .storeAddress(owner_address)        // recent_sender
            .storeAddress(owner_address)        // owner_address
            .endCell();
        const workchain = 0;                    // deploy to workchain 0
        const address = contractAddress(workchain, { code, data });
        return new Counter(address, { code, data });
    }

    constructor(readonly address: Address, readonly init?: { code: Cell, data: Cell }) { }

    async sendDeploy(provider: ContractProvider, via: Sender) {
        await provider.internal(via, {
            value: "0.01",                      // send 0.01 TON to contract for rent
            bounce: false
        });
    }

    async sendIncrement(provider: ContractProvider, via: Sender, increment_by: number) {
        const messageBody = beginCell()
            .storeUint(1, 32)                   // op (op #1 = increment)
            .storeUint(increment_by, 32)
            .storeUint(0, 64)                   // query id
            .endCell();
        await provider.internal(via, {
            value: "0.002",                     // send 0.002 TON for gas
            body: messageBody
        });
    }

    async getData(provider: ContractProvider) {
        const { stack } = await provider.get("get_contract_storage", []);
        return {
            counter_value: stack.readBigNumber(),
            recent_sender: stack.readAddress(),
            owner_address: stack.readAddress(),
        };
    }

    async getCounterValue(provider: ContractProvider) {
        const { stack } = await provider.get("get_counter_value", []);
        return stack.readBigNumber();
    }
}

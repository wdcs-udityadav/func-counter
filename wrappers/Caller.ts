import { Contract, ContractProvider, Sender, Address, Cell, contractAddress, beginCell } from "@ton/core";

export default class Caller implements Contract {

    static createForDeploy(code: Cell, counter_address: Address, counter_value: number): Caller {
        const data = beginCell()
            .storeAddress(counter_address)      // counter_address
            .storeUint(counter_value, 32)                   // initial counter_value
            .endCell();
        const workchain = 0;                    // deploy to workchain 0
        const address = contractAddress(workchain, { code, data });
        return new Caller(address, { code, data });
    }

    constructor(readonly address: Address, readonly init?: { code: Cell, data: Cell }) { }

    async sendDeploy(provider: ContractProvider, via: Sender) {
        await provider.internal(via, {
            value: "0.01",                      // send 0.01 TON to contract for rent
            bounce: false
        });
    }

    async getData(provider: ContractProvider) {
        const { stack } = await provider.get("get_contract_storage", []);
        return {
            counter_address: stack.readAddress(),
            counter_value: stack.readBigNumber()
        }
    }

    async sendIncrement(provider: ContractProvider, via: Sender, increment_by: number) {
        const messageBody = beginCell()
            .storeUint(1, 32)                   // op (op #1 = increment)
            .storeUint(increment_by, 32)        // increment_by
            .storeUint(0, 64)                   // query id
            .endCell();
        await provider.internal(via, {
            value: "0.002",                     // send 0.002 TON for gas
            body: messageBody
        });
    }

    async sendGetCounterValue(provider: ContractProvider, via: Sender) {
        const messageBody = beginCell()
            .storeUint(2, 32)               // op (op #2 = get counter_value)
            .storeUint(0, 64)               // query id
            .endCell();
        await provider.internal(via, {
            value: "0.002",                 // send 0.002 TON for gas
            body: messageBody
        });
    }

}

import * as dotenv from 'dotenv'
import { getHttpEndpoint } from "@orbs-network/ton-access";
import { TonClient, Address } from "@ton/ton";
import Caller from "../wrappers/Caller";

dotenv.config()

export async function run() {
  // initialize ton rpc client on testnet
  const endpoint = await getHttpEndpoint({ network: "testnet" });
  const client = new TonClient({ endpoint });

  // open Caller instance by address
  const callerAddress = Address.parse(process.env.CALLER_ADDRESS || "");
  const caller = new Caller(callerAddress);
  const callerContract = client.open(caller);

  // call the getter on chain
  const data = await callerContract.getData();
  console.log("counter_address:", data.counter_address.toString());
  console.log("counter_value:", data.counter_value.toString());
}

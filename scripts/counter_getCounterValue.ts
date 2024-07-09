import * as dotenv from 'dotenv'
import { getHttpEndpoint } from "@orbs-network/ton-access";
import { TonClient, Address } from "@ton/ton";
import Counter from "../wrappers/Counter";

dotenv.config()

export async function run() {
  // initialize ton rpc client on testnet
  const endpoint = await getHttpEndpoint({ network: "testnet" });
  const client = new TonClient({ endpoint });

  // open Counter instance by address
  const counterAddress = Address.parse(process.env.COUNTER_ADDRESS || "");
  const counter = new Counter(counterAddress);
  const counterContract = client.open(counter);

  // call the getter on chain
  const counter_value = await counterContract.getCounterValue();
  console.log("counter_value:", counter_value.toString());
}
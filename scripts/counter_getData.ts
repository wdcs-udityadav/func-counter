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
  const data = await counterContract.getData();
  console.log("counter_value:", data.counter_value.toString());
  console.log("recent_sender:", data.recent_sender.toString());
  console.log("owner_address:", data.owner_address.toString());
}
import * as dotenv from 'dotenv'
import * as fs from "fs";
import { getHttpEndpoint } from "@orbs-network/ton-access";
import { mnemonicToWalletKey } from "ton-crypto";
import { TonClient, Cell, WalletContractV4, Address } from "@ton/ton";
import Caller from "../wrappers/Caller";
import Counter from "../wrappers/Counter";

dotenv.config()

export async function run() {
  // initialize ton rpc client on testnet
  const endpoint = await getHttpEndpoint({ network: "testnet" });
  const client = new TonClient({ endpoint });

  // prepare Caller's initial code and data cells for deployment
  const callerCode = Cell.fromBoc(fs.readFileSync("build/caller.cell"))[0];
  const counterAddress = Address.parse(process.env.COUNTER_ADDRESS || "");

  // open Counter instance by address and call the getter on chain
  const counter = new Counter(counterAddress);
  const counterContract = client.open(counter);
  const counter_value = await counterContract.getCounterValue();
  
  const caller = Caller.createForDeploy(callerCode, counterAddress, Number(counter_value));

  // exit if contract is already deployed
  console.log("contract address:", caller.address.toString());
  if (await client.isContractDeployed(caller.address)) {
    return console.log("Caller already deployed");
  }

  // open wallet v4
  const mnemonic = process.env.MNEMONIC || "";
  const key = await mnemonicToWalletKey(mnemonic.split(" "));
  const wallet = WalletContractV4.create({ publicKey: key.publicKey, workchain: 0 });
  if (!await client.isContractDeployed(wallet.address)) {
    return console.log("wallet is not deployed");
  }

  // open wallet and read the current seqno of the wallet
  const walletContract = client.open(wallet);
  const walletSender = walletContract.sender(key.secretKey);
  const seqno = await walletContract.getSeqno();

  // send the deployment transaction
  const callerContract = client.open(caller);
  await callerContract.sendDeploy(walletSender);

  // wait until confirmed
  let currentSeqno = seqno;
  while (currentSeqno == seqno) {
    console.log("waiting for deployment transaction to confirm...");
    await sleep(1500);
    currentSeqno = await walletContract.getSeqno();
  }
  console.log("deployment transaction confirmed!");
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

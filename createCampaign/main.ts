import { HTTPCapability, decodeJson, handler, Runner, type Runtime, type HTTPPayload, EVMClient, getNetwork, hexToBase64, bytesToHex } from "@chainlink/cre-sdk";
import { encodeAbiParameters, parseAbiParameters } from "viem";
import {z} from 'zod'

const zodConfig = z.object({
  schedule : z.string(),
  Eth_Sepolia_bitVoteAddress : z.string(),
  Base_Sepolia_bitVoteAddress : z.string(),
  Arbitrum_Sepolia_bitVoteAddress : z.string()

})

type Config = z.infer<typeof zodConfig>

const writeFunction = ({runtime,args,argsAbi,chainName}:{
  runtime:Runtime<Config>,
  args:any[],
  argsAbi:string
  chainName:string
}

) => {

  runtime.log(`                               ..\n${chainName} campaign creation in progress...`)

  const network = getNetwork({
    chainFamily:'evm',
    chainSelectorName:chainName,
    isTestnet:true
  })

  if(!network){throw new Error(`Chain not recognised ${network}`)}

  const evmClient = new EVMClient(BigInt(network?.chainSelector.selector))
  
  const _encodedPayload =  encodeAbiParameters(parseAbiParameters(`string methodIdentifier,`+argsAbi),['c',...args]) 

  const _report = runtime.report({
    encodedPayload:hexToBase64(_encodedPayload),
    encoderName:'evm',
    signingAlgo:'ecdsa',
    hashingAlgo:'keccak256'
  }).result()

  const response = evmClient.writeReport(runtime, {
    report:_report,
    receiver: (chainName == 'ethereum-testnet-sepolia' ? runtime.config.Eth_Sepolia_bitVoteAddress:
              chainName == 'ethereum-testnet-sepolia-base-1' ? runtime.config.Base_Sepolia_bitVoteAddress : 
              runtime.config.Arbitrum_Sepolia_bitVoteAddress) as `0x${string}`,
    gasConfig : {
      gasLimit: "500000"
  }
  }).result()

  runtime.log(`${chainName} campaign creation successful\n........................................`)
  runtime.log(`TxHash: ${bytesToHex(response.txHash || new Uint8Array())}`)
}

const onHttpTrigger = (runtime: Runtime<Config>, payload: HTTPPayload): string => {
  runtime.log("Campaign Creation in progress...")
  const campaignInfo = decodeJson(payload.input)
  
  runtime.log(`Campaign Title ${campaignInfo.title}`)
  runtime.log(`Campaign Duration  ${campaignInfo.duration}`)
  runtime.log(`Campaign Threshold ${campaignInfo.threshold}`)

  const chains = [
    {name:'ethereum-testnet-sepolia', scAddress: runtime.config.Eth_Sepolia_bitVoteAddress},
    {name:'ethereum-testnet-sepolia-base-1', scAddress: runtime.config.Base_Sepolia_bitVoteAddress},
    {name:'ethereum-testnet-sepolia-arbitrum-1', scAddress: runtime.config.Arbitrum_Sepolia_bitVoteAddress}]

    const _argsAbi = "string title, uint256 duration, uint256 threshold"
    const _args = [campaignInfo.title,campaignInfo.duration,campaignInfo.threshold]


  chains.map((chain)=>{

        writeFunction({
        runtime: runtime,
        args:_args,
        argsAbi:_argsAbi,
        chainName: chain.name
      })

  })

  return "Multichain Campaign Creation Successful";
};

const initWorkflow = (config: Config) => {
  const http = new HTTPCapability();

  return [
    handler(
      http.trigger({}), 
      onHttpTrigger
    ),
  ];
};

export async function main() {
  const runner = await Runner.newRunner<Config>();
  await runner.run(initWorkflow);
}

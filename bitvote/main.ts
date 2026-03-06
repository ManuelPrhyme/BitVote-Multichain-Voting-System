import { CronCapability, handler, Runner, type Runtime,
encodeCallMsg,
EVMClient,
getNetwork,
hexToBase64,
HTTPCapability,
HTTPPayload,
decodeJson

} from "@chainlink/cre-sdk";
import { bytesToHex, decodeFunctionResult, encodeAbiParameters, encodeFunctionData, zeroAddress, parseAbiParameters } from "viem";

import {z} from 'zod'

import {bitVote} from './contracts/abis'
import { neonDevnet } from "viem/chains";

const zodConfig = z.object({
  schedule : z.string(),
  Eth_Sepolia_bitVoteAddress : z.string(),
  Base_Sepolia_bitVoteAddress : z.string(),
  Arbitrum_Sepolia_bitVoteAddress : z.string()

})

type Config = z.infer<typeof zodConfig>

//Reading from BlockChainData  
const getData = ({runtime,chainName,methodName,Arguments}:
  {
runtime:Runtime<Config>,
chainName:string
methodName:string
Arguments?: any[] 
}

) => {

  const encodedFunctionData = encodeFunctionData({
    abi:bitVote,
    functionName: methodName,
    args:Arguments
  })



  const encodedCallData = encodeCallMsg({
    from: zeroAddress,
    to: chainName == 'ethereum-testnet-sepolia' ? runtime.config.Eth_Sepolia_bitVoteAddress as `0x${string}` :
        chainName == 'ethereum-testnet-sepolia-base-1' ? runtime.config.Base_Sepolia_bitVoteAddress as `0x${string}` : runtime.config.Arbitrum_Sepolia_bitVoteAddress as `0x${string}`,
    data: encodedFunctionData
  })

  const network = getNetwork({
    chainFamily:'evm',
    chainSelectorName:chainName,
    isTestnet: true
  })

  if(!network){
    throw new Error(`Chain ID not recognised ${network} `)
  }

    

  const evmClient = new EVMClient(network.chainSelector.selector)

  const votingStatus = evmClient.callContract(runtime,{call:encodedCallData}).result()

  runtime.log(`The data ${votingStatus}`)

  const status = decodeFunctionResult({
    abi:bitVote,
    functionName:"canVote",
    data:bytesToHex(votingStatus.data)
  })

  return status
}

//Writing to the Blockchain
const writeData = ({runtime,chainName,methodName,argsAbi, args}:
  {
  runtime: Runtime<Config>,
  methodName:string
  chainName:string
  argsAbi: string
  args:any[],

  }) => {

    runtime.log("Voting in progress...")

    const network = getNetwork({
    chainFamily:'evm',
    chainSelectorName:chainName,
    isTestnet: true
  })

    if(!network){
    throw new Error(`Chain ID not recognised ${network} `)
  }

  const evmClient = new EVMClient(network?.chainSelector.selector)

  const reportPayload = encodeAbiParameters(parseAbiParameters(`string methodIdentifier,`+argsAbi),['v',...args])

    const signedReport = runtime.report({
      encodedPayload:hexToBase64(reportPayload),
      encoderName:'evm',
      signingAlgo:'ecdsa',
      hashingAlgo:'keccak256'
    }).result()

    const reportWriteMetadata = evmClient.writeReport(runtime,{
      report: signedReport,
      receiver: chainName == 'ethereum-testnet-sepolia' ? runtime.config.Eth_Sepolia_bitVoteAddress as `0x${string}` :
                chainName == 'ethereum-testnet-sepolia-base-1' ? runtime.config.Base_Sepolia_bitVoteAddress as `0x${string}` : 
                runtime.config.Arbitrum_Sepolia_bitVoteAddress as `0x${string}`,
      gasConfig : {
        gasLimit:"500000"
      }
    }).result()

    runtime.log(`Voting ${reportWriteMetadata.txStatus}`)
    runtime.log(`............`)
    runtime.log(`Tx Metadata`)
    runtime.log(`Tx Fee: ${reportWriteMetadata.transactionFee}`)
    runtime.log(`Consumer Stats: ${reportWriteMetadata.receiverContractExecutionStatus}`)

    return `TxHash ${bytesToHex(reportWriteMetadata.txHash || new Uint8Array())}`
}

const onHttpTrigger = (runtime: Runtime<Config>, payload: HTTPPayload): any => {
  runtime.log("Voting Workflow triggered");

  const _payload = decodeJson(payload.input)

  runtime.log("The error....")

  const status_Base = getData({runtime: runtime,chainName:'ethereum-testnet-sepolia-base-1',methodName:"canVote",Arguments:[_payload.voterKey,_payload.campaignId]})
  const status_Eth =  getData({runtime: runtime,chainName:'ethereum-testnet-sepolia',methodName:"canVote",Arguments:[_payload.voterKey,_payload.campaignId]})
  const status_Arb =  getData({runtime: runtime,chainName:'ethereum-testnet-sepolia-arbitrum-1',methodName:"canVote",Arguments:[_payload.voterKey,_payload.campaignId]})
 
  
  if( !status_Base || !status_Eth || !status_Arb) {
    runtime.log(`Not eligible / Already voted`)
  } else {
    runtime.log(`Eligible`)
  }

  return writeData({
    runtime:runtime,
    chainName:_payload.chain,
    methodName:'vote',
    argsAbi:"address voterAddress, uint256 _campaignId, uint8 voteType",
    args:[_payload.voterKey, _payload.campaignId, _payload.voteType]
  });
  
};

const initWorkflow = (config: Config) => {
  const http = new HTTPCapability();

  return [
    handler(
      http.trigger(
        {}
      ), 
      onHttpTrigger
    ),
  ];
};

export async function main() {
  const runner = await Runner.newRunner<Config>();
  await runner.run(initWorkflow);
}

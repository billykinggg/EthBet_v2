import web3 from './web3';

export const chainlinkAddress = '0x9b76c8235F2e9Bd5CE07FC88b762802b48489c68';

export const chainlinkAbi = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [],
    "name": "getChainlinkDataFeedLatestAnswer",
    "outputs": [
      {
        "internalType": "int256",
        "name": "",
        "type": "int256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

const chainlinkContract = web3 ? new web3.eth.Contract(chainlinkAbi as any, chainlinkAddress) : null;

export default chainlinkContract;

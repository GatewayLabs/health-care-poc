import { PublicKey } from "paillier-bigint";

export const SHIELD_TESTNET_CHAIN_ID = "0xa5b5a";

export const contractABI = [
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "user",
        type: "address",
      },
      {
        indexed: false,
        internalType: "bytes",
        name: "heart_rate",
        type: "bytes",
      },
      {
        indexed: false,
        internalType: "bytes",
        name: "blood_pressure",
        type: "bytes",
      },
      {
        indexed: false,
        internalType: "bytes",
        name: "oxygen_level",
        type: "bytes",
      },
      {
        indexed: false,
        internalType: "bytes",
        name: "risk_level",
        type: "bytes",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "recordIndex",
        type: "uint256",
      },
    ],
    name: "MetricsSubmitted",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "bytes",
        name: "heart_rate",
        type: "bytes",
      },
      {
        internalType: "bytes",
        name: "blood_pressure",
        type: "bytes",
      },
      {
        internalType: "bytes",
        name: "oxygen_level",
        type: "bytes",
      },
      {
        internalType: "bytes",
        name: "risk_level",
        type: "bytes",
      },
    ],
    name: "submitHealthMetrics",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    name: "userHealthRecords",
    outputs: [
      {
        internalType: "bytes",
        name: "heart_rate",
        type: "bytes",
      },
      {
        internalType: "bytes",
        name: "blood_pressure",
        type: "bytes",
      },
      {
        internalType: "bytes",
        name: "oxygen_level",
        type: "bytes",
      },
      {
        internalType: "bytes",
        name: "risk_level",
        type: "bytes",
      },
      {
        internalType: "address",
        name: "user",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
];

export const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS!;
const publicKeyN = BigInt("0x" + process.env.NEXT_PUBLIC_PUBLIC_KEY_N);
const publicKeyG = BigInt("0x" + process.env.NEXT_PUBLIC_PUBLIC_KEY_G);

export const publicKey = new PublicKey(publicKeyN, publicKeyG);

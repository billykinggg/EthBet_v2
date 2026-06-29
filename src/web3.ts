import Web3 from "web3";

let web3: Web3 | null = null;

if (typeof window !== 'undefined' && (window as any).ethereum) {
  try {
    web3 = new Web3((window as any).ethereum);
  } catch (err) {
    console.error("Failed to initialize Web3:", err);
  }
}

export default web3;

const HDWalletProvider = require('@truffle/hdwallet-provider');
require('dotenv').config();

const { MNEMONIC, AVALANCHE_RPC } = process.env;

module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",
      port: 8545,
      network_id: "*"
    },
    avalanche: {
      provider: () => new HDWalletProvider(MNEMONIC, AVALANCHE_RPC),
      network_id: 43114,
      gas: 8000000,
      gasPrice: 225000000000,
      confirmations: 2,
      timeoutBlocks: 200,
      skipDryRun: true
    },
    fuji: {
      provider: () => new HDWalletProvider(MNEMONIC, "https://api.avax-test.network/ext/bc/C/rpc"),
      network_id: 43113,
      gas: 8000000,
      gasPrice: 225000000000,
      confirmations: 2,
      timeoutBlocks: 200,
      skipDryRun: true
    }
  },
  compilers: {
    solc: {
      version: "0.8.0",
      settings: {
        optimizer: {
          enabled: true,
          runs: 200
        }
      }
    }
  }
};
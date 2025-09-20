// scripts/interact.js
const Web3 = require('web3');
const contractABI = require('./build/contracts/GitCareBounty.json').abi;
require('dotenv').config();

const AVALANCHE_RPC = "https://api.avax-test.network/ext/bc/C/rpc";
const CONTRACT_ADDRESS = "YOUR_DEPLOYED_CONTRACT_ADDRESS";
const PRIVATE_KEY = "YOUR_PRIVATE_KEY";

const web3 = new Web3(AVALANCHE_RPC);
const account = web3.eth.accounts.privateKeyToAccount(PRIVATE_KEY);
web3.eth.accounts.wallet.add(account);
web3.eth.defaultAccount = account.address;

const contract = new web3.eth.Contract(contractABI, CONTRACT_ADDRESS);

async function createBounty(title, description, tags, reward) {
    const value = web3.utils.toWei(reward, 'ether');
    
    const result = await contract.methods.createBounty(
        title, 
        description, 
        tags
    ).send({
        from: account.address,
        value: value,
        gas: 3000000
    });
    
    console.log("Bounty created:", result);
    return result;
}

async function completeBounty(bountyId) {
    const result = await contract.methods.completeBounty(bountyId).send({
        from: account.address,
        gas: 3000000
    });
    
    console.log("Bounty completed:", result);
    return result;
}

async function getBounty(bountyId) {
    const result = await contract.methods.getBounty(bountyId).call();
    console.log("Bounty details:", result);
    return result;
}

// Example usage
// createBounty("Fix Login Bug", "There's an issue with the OAuth flow", ["react", "oauth", "bug"], "0.1");
// completeBounty(1);
// getBounty(1);
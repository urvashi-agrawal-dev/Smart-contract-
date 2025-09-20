// hooks/useBountyContract.js
import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import GitCareBountyABI from '../contracts/GitCareBounty.json';

export const useBountyContract = () => {
  const [contract, setContract] = useState(null);
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);

  useEffect(() => {
    initializeContract();
  }, []);

  const initializeContract = async () => {
    if (window.ethereum) {
      try {
        // Request account access
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        
        // Create provider and signer
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const account = await signer.getAddress();
        
        // Contract address (replace with your deployed contract address)
        const contractAddress = "YOUR_CONTRACT_ADDRESS";
        
        // Create contract instance
        const bountyContract = new ethers.Contract(
          contractAddress, 
          GitCareBountyABI.abi, 
          signer
        );
        
        setContract(bountyContract);
        setAccount(account);
        setProvider(provider);
      } catch (error) {
        console.error("Error initializing contract:", error);
      }
    } else {
      console.error("MetaMask not found");
    }
  };

  const createBounty = async (title, description, tags, reward) => {
    if (!contract) throw new Error("Contract not initialized");
    
    const value = ethers.utils.parseEther(reward);
    const tx = await contract.createBounty(title, description, tags, {
      value: value
    });
    
    return await tx.wait();
  };

  const completeBounty = async (bountyId) => {
    if (!contract) throw new Error("Contract not initialized");
    
    const tx = await contract.completeBounty(bountyId);
    return await tx.wait();
  };

  const getBounty = async (bountyId) => {
    if (!contract) throw new Error("Contract not initialized");
    
    return await contract.getBounty(bountyId);
  };

  const getUserStats = async (userAddress) => {
    if (!contract) throw new Error("Contract not initialized");
    
    return await contract.getUserStats(userAddress);
  };

  return {
    contract,
    account,
    provider,
    createBounty,
    completeBounty,
    getBounty,
    getUserStats
  };
};
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("GitCareBounty", function () {
  let GitCareBounty;
  let bountyContract;
  let owner;
  let addr1;
  let addr2;
  let addrs;

  beforeEach(async function () {
    // Get the ContractFactory and Signers here
    GitCareBounty = await ethers.getContractFactory("GitCareBounty");
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

    // Deploy the contract
    bountyContract = await GitCareBounty.deploy();
    await bountyContract.deployed();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await bountyContract.owner()).to.equal(owner.address);
    });

    it("Should initialize with zero bounties", async function () {
      expect(await bountyContract.bountyCount()).to.equal(0);
      expect(await bountyContract.totalBountiesCreated()).to.equal(0);
      expect(await bountyContract.totalRewardsDistributed()).to.equal(0);
    });
  });

  describe("Creating Bounties", function () {
    it("Should create a bounty with correct details and tags", async function () {
      const reward = ethers.utils.parseEther("0.1");
      const tags = ["react", "bug", "frontend"];
      
      await expect(
        bountyContract.connect(addr1).createBounty(
          "Fix Login Bug", 
          "There's an issue with the OAuth flow", 
          tags,
          { value: reward }
        )
      ).to.emit(bountyContract, "BountyCreated");
      expect(await bountyContract.bountyCount()).to.equal(1);
      expect(await bountyContract.totalBountiesCreated()).to.equal(1);
      
      // Get the bounty details
      const bounty = await bountyContract.getBounty(1);
      
      expect(bounty.creator).to.equal(addr1.address);
      expect(bounty.title).to.equal("Fix Login Bug");
      expect(bounty.reward).to.equal(reward);
      expect(bounty.isCompleted).to.be.false;
      expect(bounty.tags.length).to.equal(3);
      expect(bounty.tags[0]).to.equal("react");
      expect(bounty.tags[1]).to.equal("bug");
      expect(bounty.tags[2]).to.equal("frontend");
    });

    it("Should fail when creating bounty with zero reward", async function () {
      const tags = ["react", "bug"];
      
      await expect(
        bountyContract.connect(addr1).createBounty(
          "Test Bounty", 
          "Test Description", 
          tags,
          { value: 0 }
        )
      ).to.be.revertedWith("Reward must be greater than 0");
    });

    it("Should fail when creating bounty with empty title", async function () {
      const reward = ethers.utils.parseEther("0.1");
      const tags = ["react", "bug"];
      
      await expect(
        bountyContract.connect(addr1).createBounty(
          "", 
          "Test Description", 
          tags,
          { value: reward }
        )
      ).to.be.revertedWith("Title cannot be empty");
    });

    it("Should fail when creating bounty with empty description", async function () {
      const reward = ethers.utils.parseEther("0.1");
      const tags = ["react", "bug"];
      
      await expect(
        bountyContract.connect(addr1).createBounty(
          "Test Bounty", 
          "", 
          tags,
          { value: reward }
        )
      ).to.be.revertedWith("Description cannot be empty");
    });
  });

  describe("Completing Bounties", function () {
    let reward;

    beforeEach(async function () {
      reward = ethers.utils.parseEther("0.1");
      const tags = ["react", "bug", "frontend"];
      await bountyContract.connect(addr1).createBounty(
        "Fix Login Bug", 
        "There's an issue with the OAuth flow", 
        tags,
        { value: reward }
      );
    });

    it("Should complete a bounty and transfer rewards", async function () {
      const initialBalance = await ethers.provider.getBalance(addr2.address);
      
      await expect(
        bountyContract.connect(addr2).completeBounty(1)
      ).to.emit(bountyContract, "BountyCompleted");
      
      const bounty = await bountyContract.getBounty(1);
      expect(bounty.isCompleted).to.be.true;
      expect(bounty.completedBy).to.equal(addr2.address);
      
      // Check reward was distributed
      expect(await bountyContract.totalRewardsDistributed()).to.equal(reward);
      
      // Check user stats were updated
      const userStats = await bountyContract.getUserStats(addr2.address);
      expect(userStats.completedBounties).to.equal(1);
      expect(userStats.totalEarned).to.equal(reward);
      expect(userStats.reputation).to.be.above(0);
    });

    it("Should fail when completing non-existent bounty", async function () {
      await expect(
        bountyContract.connect(addr2).completeBounty(999)
      ).to.be.revertedWith("Bounty does not exist");
    });

    it("Should fail when completing already completed bounty", async function () {
      // Complete the bounty first
      await bountyContract.connect(addr2).completeBounty(1);
      
      // Try to complete it again
      await expect(
        bountyContract.connect(addrs[0]).completeBounty(1)
      ).to.be.revertedWith("Bounty already completed");
    });
  });

  describe("Tag System", function () {
    beforeEach(async function () {
      const reward = ethers.utils.parseEther("0.1");
      
      // Create bounties with different tags
      await bountyContract.connect(addr1).createBounty(
        "React Bug", "React issue", ["react", "frontend"], { value: reward }
      );
      await bountyContract.connect(addr1).createBounty(
        "Solidity Fix", "Solidity issue", ["solidity", "backend"], { value: reward }
      );
      await bountyContract.connect(addr1).createBounty(
        "CSS Styling", "CSS issue", ["css", "frontend"], { value: reward }
      );
    });

    it("Should filter bounties by tag", async function () {
      const frontendBounties = await bountyContract.getBountiesByTag("frontend");
      expect(frontendBounties.length).to.equal(2);
      
      const solidityBounties = await bountyContract.getBountiesByTag("solidity");
      expect(solidityBounties.length).to.equal(1);
      
      const nonexistentBounties = await bountyContract.getBountiesByTag("nonexistent");
      expect(nonexistentBounties.length).to.equal(0);
    });
  });

  describe("User Statistics", function () {
    it("Should track user bounties correctly", async function () {
      const reward = ethers.utils.parseEther("0.1");
      const tags = ["react", "bug"];
      
      // Create two bounties with addr1
      await bountyContract.connect(addr1).createBounty(
        "Bounty 1", "Description 1", tags, { value: reward }
      );
      await bountyContract.connect(addr1).createBounty(
        "Bounty 2", "Description 2", tags, { value: reward }
      );
      
      // Check user bounties
      const userBounties = await bountyContract.getUserBounties(addr1.address);
      expect(userBounties.length).to.equal(2);
      expect(userBounties[0]).to.equal(1);
      expect(userBounties[1]).to.equal(2);
    });

    it("Should return empty array for user with no bounties", async function () {
      const userBounties = await bountyContract.getUserBounties(addr1.address);
      expect(userBounties.length).to.equal(0);
    });
  });
});
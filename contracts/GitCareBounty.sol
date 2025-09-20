// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract GitCareBounty {
    struct Bounty {
        uint256 id;
        address creator;
        string title;
        string description;
        uint256 reward;
        bool isCompleted;
        address completedBy;
        uint256 createdAt;
        string[] tags; // Store tags for filtering
    }
    
    struct UserStats {
        uint256 completedBounties;
        uint256 totalEarned;
        uint256 reputation;
    }
    
    address public owner;
    uint256 public bountyCount;
    uint256 public totalBountiesCreated;
    uint256 public totalRewardsDistributed;
    
    mapping(uint256 => Bounty) public bounties;
    mapping(address => UserStats) public userStats;
    mapping(address => uint256[]) public userBounties;
    
    event BountyCreated(uint256 indexed bountyId, address indexed creator, string title, uint256 reward);
    event BountyCompleted(uint256 indexed bountyId, address indexed completer, uint256 reward);
    event RewardDistributed(uint256 indexed bountyId, address indexed completer, uint256 amount);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    modifier bountyExists(uint256 _bountyId) {
        require(_bountyId > 0 && _bountyId <= bountyCount, "Bounty does not exist");
        _;
    }
    
    modifier notCompleted(uint256 _bountyId) {
        require(!bounties[_bountyId].isCompleted, "Bounty already completed");
        _;
    }
    
    constructor() {
        owner = msg.sender;
        bountyCount = 0;
        totalBountiesCreated = 0;
        totalRewardsDistributed = 0;
    }
    
    function createBounty(
        string memory _title, 
        string memory _description, 
        string[] memory _tags // Now using this parameter
    ) external payable {
        require(msg.value > 0, "Reward must be greater than 0");
        require(bytes(_title).length > 0, "Title cannot be empty");
        require(bytes(_description).length > 0, "Description cannot be empty");
        
        bountyCount++;
        totalBountiesCreated++;
        
        bounties[bountyCount] = Bounty({
            id: bountyCount,
            creator: msg.sender,
            title: _title,
            description: _description,
            reward: msg.value,
            isCompleted: false,
            completedBy: address(0),
            createdAt: block.timestamp,
            tags: _tags // Now using the tags parameter
        });
        
        userBounties[msg.sender].push(bountyCount);
        
        emit BountyCreated(bountyCount, msg.sender, _title, msg.value);
    }
    
    function completeBounty(uint256 _bountyId) external bountyExists(_bountyId) notCompleted(_bountyId) {
        Bounty storage bounty = bounties[_bountyId];
        
        bounty.isCompleted = true;
        bounty.completedBy = msg.sender;
        
        // Transfer the reward
        payable(msg.sender).transfer(bounty.reward);
        
        // Update user stats
        userStats[msg.sender].completedBounties++;
        userStats[msg.sender].totalEarned += bounty.reward;
        userStats[msg.sender].reputation += calculateReputationPoints(bounty.reward);
        
        totalRewardsDistributed += bounty.reward;
        
        emit BountyCompleted(_bountyId, msg.sender, bounty.reward);
        emit RewardDistributed(_bountyId, msg.sender, bounty.reward);
    }
    
    function getBounty(uint256 _bountyId) public view bountyExists(_bountyId) returns (
        uint256 id,
        address creator,
        string memory title,
        string memory description,
        uint256 reward,
        bool isCompleted,
        address completedBy,
        uint256 createdAt,
        string[] memory tags
    ) {
        Bounty memory bounty = bounties[_bountyId];
        return (
            bounty.id,
            bounty.creator,
            bounty.title,
            bounty.description,
            bounty.reward,
            bounty.isCompleted,
            bounty.completedBy,
            bounty.createdAt,
            bounty.tags
        );
    }
    
    function getUserBounties(address _user) public view returns (uint256[] memory) {
        return userBounties[_user];
    }
    
    function getUserStats(address _user) public view returns (
        uint256 completedBounties,
        uint256 totalEarned,
        uint256 reputation
    ) {
        UserStats memory stats = userStats[_user];
        return (
            stats.completedBounties,
            stats.totalEarned,
            stats.reputation
        );
    }
    
    function calculateReputationPoints(uint256 _reward) private pure returns (uint256) {
        // Reputation points based on reward amount
        if (_reward < 0.1 ether) return 1;
        if (_reward < 0.5 ether) return 5;
        if (_reward < 1 ether) return 10;
        return 20;
    }
    
    function getAllBounties() public view returns (uint256[] memory) {
        uint256[] memory result = new uint256[](bountyCount);
        for (uint256 i = 1; i <= bountyCount; i++) {
            result[i - 1] = i;
        }
        return result;
    }
    
    function getBountiesByTag(string memory _tag) public view returns (uint256[] memory) {
        uint256 count = 0;
        
        // First pass: count matching bounties
        for (uint256 i = 1; i <= bountyCount; i++) {
            if (hasTag(i, _tag)) {
                count++;
            }
        }
        
        // Second pass: collect matching bounty IDs
        uint256[] memory result = new uint256[](count);
        uint256 index = 0;
        
        for (uint256 i = 1; i <= bountyCount; i++) {
            if (hasTag(i, _tag)) {
                result[index] = i;
                index++;
            }
        }
        
        return result;
    }
    
    function hasTag(uint256 _bountyId, string memory _tag) private view returns (bool) {
        Bounty memory bounty = bounties[_bountyId];
        for (uint256 i = 0; i < bounty.tags.length; i++) {
            if (keccak256(abi.encodePacked(bounty.tags[i])) == keccak256(abi.encodePacked(_tag))) {
                return true;
            }
        }
        return false;
    }
    
    // Emergency function to withdraw funds (only owner)
    function withdrawFunds() external onlyOwner {
        payable(owner).transfer(address(this).balance);
    }
    
    // Fallback function to receive ETH
    receive() external payable {}
}
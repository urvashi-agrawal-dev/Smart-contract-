const GitCareBounty = artifacts.require("GitCareBounty");

module.exports = function (deployer) {
  deployer.deploy(GitCareBounty);
};
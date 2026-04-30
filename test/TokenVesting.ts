import { expect } from "chai";
import { network } from "hardhat";

// setup the network and helpers
const { ethers, networkHelpers } = await network.create();

// some constants for testing
const TOTAL = ethers.parseEther("1000"); // 1000 tokens
const CLIFF = 90 * 24 * 3600;           // 3 months
const DURATION = 180 * 24 * 3600;        // 6 months

// function to deploy everything and setup a schedule
async function deploy() {
  const [owner, beneficiary, anyone] = await ethers.getSigners();

  // deploy the token
  const VestingToken = await ethers.getContractFactory("VestingToken");
  const token = await VestingToken.deploy("VestToken", "VST", TOTAL);

  // deploy the vesting contract
  const TokenVesting = await ethers.getContractFactory("TokenVesting");
  const vesting = await TokenVesting.deploy(await token.getAddress());

  // set start time a bit in the future
  const now = await networkHelpers.time.latest();
  const start = now + 60;

  // owner gives permission to vesting contract
  await token.approve(await vesting.getAddress(), TOTAL);
  
  // make the schedule
  await vesting.createVestingSchedule(
    beneficiary.address,
    TOTAL,
    start,
    CLIFF,
    DURATION,
    true // owner can revoke
  );

  return { token, vesting, owner, beneficiary, anyone, start };
}

// the actual tests
describe("TokenVesting", function () {

  it("cant get tokens before cliff", async function () {
    const { vesting, beneficiary, start } = await networkHelpers.loadFixture(deploy);

    // skip forward but stay inside cliff
    await networkHelpers.time.increaseTo(start + 45 * 24 * 3600);

    // should fail
    await expect(vesting.connect(beneficiary).release())
      .to.be.revertedWith("cliff not over");
  });

  it("gets half the tokens at 3 months", async function () {
    const { token, vesting, beneficiary, start } = await networkHelpers.loadFixture(deploy);

    // skip to the cliff time
    await networkHelpers.time.increaseTo(start + CLIFF - 1);
    await vesting.connect(beneficiary).release();

    // should have half now
    expect(await token.balanceOf(beneficiary.address)).to.equal(TOTAL / 2n);
  });

  it("gets all tokens after 6 months", async function () {
    const { token, vesting, beneficiary, start } = await networkHelpers.loadFixture(deploy);

    // skip past the end
    await networkHelpers.time.increaseTo(start + DURATION);
    await vesting.connect(beneficiary).release();

    // should have everything
    expect(await token.balanceOf(beneficiary.address)).to.equal(TOTAL);
  });

  it("revoke works and sends unvested to owner", async function () {
    const { token, vesting, owner, beneficiary, start } = await networkHelpers.loadFixture(deploy);

    // go to half way
    await networkHelpers.time.increaseTo(start + CLIFF - 1);

    // check owner balance before
    const ownerBefore = await token.balanceOf(owner.address);
    
    // owner stops the vesting
    await vesting.revoke();

    // owner should get half back
    expect(await token.balanceOf(owner.address)).to.equal(ownerBefore + TOTAL / 2n);

    // beneficiary can still claim what they earned
    await vesting.connect(beneficiary).release();
    expect(await token.balanceOf(beneficiary.address)).to.equal(TOTAL / 2n);
  });

  it("random person cant revoke", async function () {
    const { vesting, anyone } = await networkHelpers.loadFixture(deploy);

    // check for ownable error
    await expect(vesting.connect(anyone).revoke())
      .to.be.revertedWithCustomError(vesting, "OwnableUnauthorizedAccount")
      .withArgs(anyone.address);
  });

});

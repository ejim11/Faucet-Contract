const { assert, expect } = require("chai");
const { ethers } = require("hardhat");

describe("Faucet contract ", () => {
  let FaucetContractFactory, faucetContract, owner, user;
  let amount = ethers.utils.parseEther("1", "ether");

  beforeEach(async () => {
    FaucetContractFactory = await ethers.getContractFactory("Faucet");
    faucetContract = await FaucetContractFactory.deploy({ value: amount });
    await faucetContract.deployed();

    owner = ethers.provider.getSigner(0);
    user = ethers.provider.getSigner(1);
  });

  it("should store the owner of the contract", async () => {
    const _owner = await faucetContract.owner.call();
    assert.equal(_owner, await owner.getAddress());
  });

  it("should prevent withdrawals above 0.1ether", async () => {
    let error;
    try {
      await faucetContract.withdraw(amount);
    } catch (err) {
      error = err;
    }
    if (!error) {
      assert.fail("user withrew above 0.1ether");
    }
  });

  it("should deposit chosen amount into the user balance", async () => {
    // create an amount of 0.1ether
    const _amount = ethers.utils.parseUnits("0.1", "ether");

    // get the previous balance of the user
    const balanceBefore = await ethers.provider.getBalance(
      await user.getAddress()
    );

    // choose gas price
    const gasPrice = ethers.utils.parseUnits("2", "gwei");

    // perform transaction with chosen gas price
    const tx = await faucetContract
      .connect(user)
      .withdraw(_amount, { gasPrice });

    //   wait for the transaction to be mined and get the reciept
    const reciept = await tx.wait();

    // get the gas used in ether
    const etherUsed = reciept.gasUsed.mul(gasPrice);

    // get the present balance of the user
    const balanceAfter = await ethers.provider.getBalance(
      await user.getAddress()
    );

    // check that the present balance is equal to the previous balance - gas used in ether + amount
    assert.equal(
      balanceAfter.toString(),
      balanceBefore.sub(etherUsed).add(_amount).toString()
    );
  });

  it("should revert if withdrawAll function was not called by the owner", async () => {
    let error;
    try {
      await faucetContract.connect(user).withdrawAll();
    } catch (err) {
      error = err;
    }
    if (!error) {
      assert.fail(
        "withdrawAll was called by someone else other than the owner"
      );
    }
  });

  it("should increase the balance of the owner", async () => {
    const contractBalance = await ethers.provider.getBalance(
      await faucetContract.address
    );

    const ownerBalanceBefore = await ethers.provider.getBalance(
      await owner.getAddress()
    );

    // choose gas price
    const gasPrice = ethers.utils.parseUnits("2", "gwei");

    // perform transaction with chosen gas price
    const tx = await faucetContract.connect(owner).withdrawAll({ gasPrice });

    //   wait for the transaction to be mined and get the reciept
    const reciept = await tx.wait();

    // get the gas used in ether
    const etherUsed = reciept.gasUsed.mul(gasPrice);

    const ownerBalanceAfter = await ethers.provider.getBalance(
      await owner.getAddress()
    );

    assert.equal(
      ownerBalanceAfter.toString(),
      ownerBalanceBefore.sub(etherUsed).add(contractBalance).toString()
    );
  });

  it("should fund the contract when ether is sent to it through the fund function", async () => {
    const _amount = ethers.utils.parseUnits("1", "ether");
    const contractBalanceBefore = await ethers.provider.getBalance(
      await faucetContract.address
    );

    await faucetContract.fund({ value: _amount });

    const contractBalanceAfter = await ethers.provider.getBalance(
      await faucetContract.address
    );

    assert.equal(
      contractBalanceAfter.sub(_amount).toString(),
      contractBalanceBefore.toString()
    );
  });

  it("should invoke the fallback", async () => {
    const _amount = ethers.utils.parseUnits("1", "ether");

    const contractBalanceBefore = await ethers.provider.getBalance(
      await faucetContract.address
    );

    // creating a signature for a non-existent function
    const nonExistentFunctionSignature = "nonExistentFunction()";

    // creating a fake contract instance containing the non-existent function
    const fakeContract = new ethers.Contract(
      faucetContract.address,
      [
        ...faucetContract.interface.fragments,
        `function ${nonExistentFunctionSignature} payable`,
      ],
      owner
    );

    await fakeContract[nonExistentFunctionSignature]({
      value: _amount,
    });

    const contractBalanceAfter = await ethers.provider.getBalance(
      await faucetContract.address
    );

    assert.equal(
      contractBalanceAfter.sub(_amount).toString(),
      contractBalanceBefore.toString()
    );
  });

  it("should trigger the receive function", async () => {
    const contractBalanceBefore = await ethers.provider.getBalance(
      await faucetContract.address
    );

    await user.sendTransaction({ to: faucetContract.address, value: amount });

    const contractBalanceAfter = await ethers.provider.getBalance(
      await faucetContract.address
    );

    assert.equal(
      contractBalanceAfter.sub(amount).toString(),
      contractBalanceBefore.toString()
    );
  });
});

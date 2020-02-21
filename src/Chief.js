import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

const provider = ethers.getDefaultProvider();

const chiefABI = [
    "function hat() public view returns (address)",
    "function approvals(address) public view returns (uint256)"
];

const chiefAddress = "0x9ef05f7f6deb616fd37ac3c959a2ddd25a54e4f5";

const chiefContract = new ethers.Contract(chiefAddress, chiefABI, provider);

function Chief() {
  const [hat, setHat] = useState("");

  useEffect(() => {
    async function getHat() {
        let decimals = ethers.utils.bigNumberify("1000000000000000000");
        let precision = ethers.utils.bigNumberify("100000000000000");

        let hatAddress = await chiefContract.hat();
        let hatSupply = await chiefContract.approvals(hatAddress);
        let hatAmount = hatSupply.div(decimals)
        let hatAmountRounded = hatAmount.mul(decimals);
        let hatDecimals = hatSupply.mod(hatAmountRounded);
        hatDecimals = hatDecimals.div(precision);
        let hatString = hatAmount.toString() + "." + hatDecimals.toString();
        setHat(hatString);
    }

    getHat();
  }, []);

  return (
    <div>
      <p>Current MKR On The Hat</p>
      <p>{hat}</p>
    </div>
  );
}

export default Chief;
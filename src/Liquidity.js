import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

const provider = ethers.getDefaultProvider();

const aaveABI = [
  "function totalSupply() public view returns (uint256)"
];

const mkrABI = [
    "function balanceOf(address src) public view returns (uint)"
];

const aaveAddress = "0x7deB5e830be29F91E298ba5FF1356BB7f8146998";
const mkrAddress = "0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2";
const uniswapAddress = "0x2c4bd064b998838076fa341a83d007fc2fa50957";

const aaveContract = new ethers.Contract(aaveAddress, aaveABI, provider);
const mkrContract = new ethers.Contract(mkrAddress, mkrABI, provider);

function Liquidity() {
  const [aave, setAave] = useState("");
  const [uniswap, setUniswap] = useState("");
  const [liquidity, setLiquidity] = useState("");

  useEffect(() => {
    async function getLiquidity() {
      let precision = ethers.utils.bigNumberify("100000000000000");

      let aaveSupply = await aaveContract.totalSupply();
      aaveSupply = aaveSupply.div(precision);
      let aaveNum = aaveSupply.toNumber() / 10000;
      setAave(aaveNum);

      let uniSupply = await mkrContract.balanceOf(uniswapAddress);
      uniSupply = uniSupply.div(precision);
      let uniNum = uniSupply.toNumber() / 10000;
      setUniswap(uniNum);

      setLiquidity(uniNum + aaveNum);
    }

    getLiquidity();
  }, []);

  return (
    <div>
      <p>Total MKR Liquidity</p>
      <p>{liquidity}</p>
      <p>Uniswap MKR Liquidity</p>
      <p>{uniswap}</p>
      <p>Aave MKR Max Flash Loan</p>
      <p>{aave}</p>
    </div>
  );
}

export default Liquidity;
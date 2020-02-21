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
      let decimals = ethers.utils.bigNumberify("1000000000000000000");

      let aaveSupply = await aaveContract.totalSupply();
      let aaveAmount = aaveSupply.div(decimals)
      let aaveAmountRounded = aaveAmount.mul(decimals);
      let aaveDecimals = aaveSupply.mod(aaveAmountRounded);
      let aaveString = aaveAmount.toString() + "." + aaveDecimals.toString();
      setAave(aaveString);

      let uniSupply = await mkrContract.balanceOf(uniswapAddress);
      let uniAmount = uniSupply.div(decimals)
      let uniAmountRounded = uniAmount.mul(decimals);
      let uniDecimals = uniSupply.mod(uniAmountRounded);
      let uniString = uniAmount.toString() + "." + uniDecimals.toString();
      setUniswap(uniString);

      let liqSupply = aaveSupply.add(uniSupply);
      let liqAmount = liqSupply.div(decimals)
      let liqAmountRounded = liqAmount.mul(decimals);
      let liqDecimals = liqSupply.mod(liqAmountRounded);
      let liqString = liqAmount.toString() + "." + liqDecimals.toString();
      setLiquidity(liqString);
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
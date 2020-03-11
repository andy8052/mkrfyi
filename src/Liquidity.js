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
const oasisAddress = "0x794e6e91555438afc3ccf1c5076a74f42133d08d";
const eth2daiAddress = "0x39755357759ce0d7f32dc8dc45414cca409ae24e";
const switcheoAddress = "0x7ee7ca6e75de79e618e88bdf80d0b1db136b22d0";
const paradexAddress = "0xd2045edc40199019e221d71c0913343f7908d0d5";

const aaveContract = new ethers.Contract(aaveAddress, aaveABI, provider);
const mkrContract = new ethers.Contract(mkrAddress, mkrABI, provider);

function Liquidity() {
  const [aave, setAave] = useState("");
  const [uniswap, setUniswap] = useState("");
  const [oasis, setOasis] = useState("");
  const [eth2dai, setEth2dai] = useState("");
  const [switcheo, setSwitcheo] = useState("");
  const [paradex, setParadex] = useState("");
  const [others, setOthers] = useState("");
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

      let oasisSupply = await mkrContract.balanceOf(oasisAddress);
      oasisSupply = oasisSupply.div(precision);
      let oasisNum = oasisSupply.toNumber() / 10000;
      setOasis(oasisNum);

      let eth2daiSupply = await mkrContract.balanceOf(eth2daiAddress);
      eth2daiSupply = eth2daiSupply.div(precision);
      let eth2daiNum = eth2daiSupply.toNumber() / 10000;
      setEth2dai(eth2daiNum);

      let switcheoSupply = await mkrContract.balanceOf(switcheoAddress);
      switcheoSupply = switcheoSupply.div(precision);
      let switcheoNum = switcheoSupply.toNumber() / 10000;
      setSwitcheo(switcheoNum);

      let paradexSupply = await mkrContract.balanceOf(paradexAddress);
      paradexSupply = paradexSupply.div(precision);
      let paradexNum = paradexSupply.toNumber() / 10000;
      setSwitcheo(paradexNum);

      setOthers(eth2daiNum + switcheoNum + paradexNum);

      setLiquidity(uniNum + aaveNum + oasisNum + eth2daiNum);
    }

    getLiquidity();
  }, []);

  return (
    <div>
      <p>Total MKR Liquidity</p>
      <p>{liquidity}</p>
      <p>Uniswap MKR Liquidity</p>
      <p>{uniswap}</p>
      <p>Oasis Trade Liquidity</p>
      <p>{oasis}</p>
      <p>Aave MKR Max Flash Loan</p>
      <p>{aave}</p>
      <p>Others</p>
      <p>{others}</p>
    </div>
  );
}

export default Liquidity;
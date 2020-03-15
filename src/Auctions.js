import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

const provider = ethers.getDefaultProvider();

const ETH_FLIP_ADDRESS = "0xd8a04f5412223f513dc55f839574430f5ec15531";
const OSM_ADDRESS = "0x81FE72B5A8d1A857d176C3E7d5Bd2679A9B85763";
const CDP_MANAGER_ADDRESS = "0x5ef30b9986345249bc32d8928B7ee64DE9435E39";
const CAT_ADDRESS = "0x78F2c2AF65126834c51822F56Be0d7469D7A523E";

const TEND = "0x4b43ed1200000000000000000000000000000000000000000000000000000000";
const DENT = "0x5ff3a38200000000000000000000000000000000000000000000000000000000";
const DEAL = "0xc959c42b00000000000000000000000000000000000000000000000000000000";
const TICK = "0xfc7b6aee00000000000000000000000000000000000000000000000000000000";

const flipETHAbi = [
    "function totalSupply() public view returns (uint256)"
  ];



function Auctions() {
    const [auctions, setAuctions] = useState([]);

    function getType(topic) {
        if (topic === TEND) {
            return "TEND";
        } else if (topic === DENT) {
            return "DENT";
        } else if (topic === DEAL) {
            return "DEAL";
        } else if (topic === TICK) {
            return "TICK";
        }
    }

    function getKickInformation(log) {
        let prec18 = ethers.utils.bigNumberify("100000000000000");
        let prec27 = ethers.utils.bigNumberify("1000000000000000000000000000");

        let id = ethers.utils.bigNumberify(ethers.utils.hexDataSlice(log.data, 0, 32)).toString();
        let bid = ethers.utils.bigNumberify(ethers.utils.hexDataSlice(log.data, 32, 32)).toString();
        let lot = ethers.utils.bigNumberify(ethers.utils.hexDataSlice(log.data, 64, 32));
        let tab = ethers.utils.bigNumberify(ethers.utils.hexDataSlice(log.data, 96));
        
        lot = lot.div(prec18);
        lot = lot.toNumber() / 10000;
        tab = tab.div(prec27).div(prec18).toNumber() / 1000;

        let auction = {'type':"KICK",'id':id, 'lot':lot, 'bid':bid, 'tab':tab, 'hash':log.transactionHash, 'from':log.address};
        setAuctions(auctions => [auction,...auctions]);
    }

    function getTendInformation(log) {
        let prec18 = ethers.utils.bigNumberify("100000000000000");
        let prec27 = ethers.utils.bigNumberify("1000000000000000000000000000");
        let id = ethers.utils.bigNumberify(log.topics[2]).toString();
        let lot = ethers.utils.bigNumberify(log.topics[3]).div(prec18).toNumber() / 10000;
        let bidHex = "0x" + log.data.slice(289, -248);
        let bid = ethers.utils.bigNumberify(bidHex).div(prec27).div(prec18).toNumber() / 10000;

        let auction = {'type':"TEND",'id':id, 'lot':lot, 'bid':bid, 'tab':0, 'hash':log.transactionHash, 'from':log.address};
        setAuctions(auctions => [auction,...auctions]);
    }

    function getDealInformation(log) {
        let prec18 = ethers.utils.bigNumberify("100000000000000");
        let prec27 = ethers.utils.bigNumberify("1000000000000000000000000000");
        let id = ethers.utils.bigNumberify(log.topics[2]).toString();
        let lot = ethers.utils.bigNumberify(log.topics[3]).div(prec18).toNumber() / 10000;
        // let bidHex = "0x" + log.data.slice(289, -248);
        // let bid = ethers.utils.bigNumberify(bidHex).div(prec27).div(prec18).toNumber() / 10000;

        let auction = {'type':"DEAL",'id':id, 'lot':lot, 'bid':0, 'tab':0, 'hash':log.transactionHash, 'from':log.address};
        setAuctions(auctions => [auction,...auctions]);
    }

    useEffect(() => {
        async function getLogs() {
            let block = await provider.getBlockNumber() - 8000;

            const filterAll = {
                address: ETH_FLIP_ADDRESS,
                fromBlock: block,
                toBlock: "latest"
            }

            let logs = await provider.getLogs(filterAll);

            logs.forEach((log) => {
                let type;
                if (log.topics.length === 3){
                    type = "KICK";
                } else {
                    type = getType(log.topics[0]);
                }

                if (type === "KICK") {
                    getKickInformation(log);
                } else if (type === "TEND") {
                    getTendInformation(log);
                } else if (type === "DEAL") {
                    getDealInformation(log);
                }

            });
        }
    
        getLogs();
    }, []);

    // provider.getLogs(filterAll).then((logs) => {
    //     console.log(logs);
    // });

    const auctionList = auctions.map(function(auction){
        return <p key={auction["type"] + auction["id"] + auction["hash"]}>{auction["type"]} ID:{auction["id"]} Lot:{auction["lot"]} Bid:{auction["bid"]} Tab:{auction["tab"]} From:{auction["from"]} <a href={"https://etherscan.io/tx/" + auction["hash"]} target="_blank" rel="noopener noreferrer">Transaction Link</a></p>;
    })

    return (
        <div>{auctionList}</div>
    )
}

export default Auctions;
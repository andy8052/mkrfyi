import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

const provider = ethers.getDefaultProvider();

const FLOP_ADDRESS = "0x4D95A049d5B0b7d32058cd3F2163015747522e99";
const MEDIANIZER_ADDRESS = "0x99041F808D598B782D5a3e498681C2452A31da08";
const VOW_ADDRESS = "0xA950524441892A31ebddF91d3cEEFa04Bf454466";
const VAT_ADDRESS = "0x35D1b3F3D7966A1DFe207aa4514C12a259A0492B";

let flopABI = [
    "function bids(uint256) public view returns(uint256, uint256, address, uint48, uint48, address, address, uint256)"
]
let osmABI = [
    "event LogValue(bytes32 val)"
];

const TEND = "0x4b43ed1200000000000000000000000000000000000000000000000000000000";
const DENT = "0x5ff3a38200000000000000000000000000000000000000000000000000000000";
const DEAL = "0xc959c42b00000000000000000000000000000000000000000000000000000000";
const TICK = "0xfc7b6aee00000000000000000000000000000000000000000000000000000000";
const FILE = "0x29ae811400000000000000000000000000000000000000000000000000000000";
const DENY = "0x9c52a7f100000000000000000000000000000000000000000000000000000000";
const RELY = "0x65fae35e00000000000000000000000000000000000000000000000000000000";

const flopCOntract = new ethers.Contract(FLOP_ADDRESS, flopABI, provider);
const osmContract = new ethers.Contract(MEDIANIZER_ADDRESS, osmABI, provider);

function useLocalStorage(key, initialValue) {
    // State to store our value
    // Pass initial state function to useState so logic is only executed once
    const [storedValue, setStoredValue] = useState(() => {
        try {
        // Get from local storage by key
        const item = window.localStorage.getItem(key);
        // Parse stored json or if none return initialValue
        return item ? JSON.parse(item) : initialValue;
        } catch (error) {
        // If error also return initialValue
        console.log(error);
        return initialValue;
        }
    });

    // Return a wrapped version of useState's setter function that ...
    // ... persists the new value to localStorage.
    const setValue = value => {
        try {
        // Allow value to be a function so we have same API as useState
        const valueToStore =
            value instanceof Function ? value(storedValue) : value;
        // Save state
        setStoredValue(valueToStore);
        // Save to local storage
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
        } catch (error) {
        // A more advanced implementation would handle the error case
        console.log(error);
        }
    };

    return [storedValue, setValue];
}

function Flop() {
    const [auctions, setAuctions] = useState([]);
    const [auctionHist, setAuctionHist] = useLocalStorage('auctions', []);
    const [lastBlock, setLastBlock] = useState(0);
    const [lastBlockHist, setLastBlockHist] = useLocalStorage('block', 0);
    const [subscribed, setSubscribed] = useState(false);

    const [auctionRecords, setAuctionRecords] = useState([]);
    const [auctionRecordsHist, setAuctionRecordsHist] = useLocalStorage('records',[]);


    const [atRisk, setAtRisk] = useState(false);

 
    function getType(topic) {
        if (topic === DENT) {
            return "DENT";
        } else if (topic === DEAL) {
            return "DEAL";
        } else if (topic === TICK) {
            return "TICK";
        } else {
            console.log("topic unknown " + topic);
        }
    }

    async function getKickInformation(log, price) {
        let prec18 = ethers.utils.bigNumberify("100000000000000");
        // let prec27 = ethers.utils.bigNumberify("1000000000000000000000000000");

        let id = ethers.utils.bigNumberify(ethers.utils.hexDataSlice(log.data, 0, 32)).toString();
        let bid = ethers.utils.bigNumberify(ethers.utils.hexDataSlice(log.data, 32, 32)).toString();
        let lot = ethers.utils.bigNumberify(ethers.utils.hexDataSlice(log.data, 64, 32));
        
        lot = lot.div(prec18);
        lot = lot.toNumber() / 10000;

        let auction = {'type':"KICK",'id':id, 'lot':lot, 'bid':bid, 'hash':log.transactionHash, 'block':log.blockNumber, 'price':price};

        let info = {'id':id,'lot':lot, 'bid':bid, 'last':"KICK"};
        let auctionRecordsTemp = auctionRecords;
        auctionRecordsTemp[id] = info;
        setAuctionRecords(auctionRecordsTemp);

        setAuctions(auctions => [auction,...auctions]);
    }

    async function getDentInformation(log, price) {
        let prec18 = ethers.utils.bigNumberify("100000000000000");
        let prec27 = ethers.utils.bigNumberify("1000000000000000000000000000");
        let id = ethers.utils.bigNumberify(log.topics[2]).toString();
        let lot = ethers.utils.bigNumberify(log.topics[3]).div(prec18).toNumber() / 10000;

        let bidHex = "0x" + log.data.slice(288, -248);
        let bid = ethers.utils.bigNumberify(bidHex).div(prec27).div(prec18).toNumber() / 10000;
        let paid = bid / lot;

        let diff = (((paid / price) - 1) * 100).toFixed(2);

        let auctionRecordsTemp = auctionRecords;
        if (auctionRecordsTemp[id] === undefined) {
            let info = {'id':id,'lot':lot, 'bid':bid, 'last':"DENT", 'price': price, 'paid':paid};
            auctionRecordsTemp[id] = info;
        } else {
            auctionRecordsTemp[id]["diff"] = diff;
            auctionRecordsTemp[id]["paid"] = paid;
            auctionRecordsTemp[id]["price"] = price;
            auctionRecordsTemp[id]["bid"] = bid;
            auctionRecordsTemp[id]["last"] = "DENT";
        }

        let auction = {'type':"DENT",'id':id, 'lot':lot, 'bid':bid, 'hash':log.transactionHash, 'block':log.blockNumber, 'price':price, 'diff':diff};

        setAuctionRecords(auctionRecordsTemp);

        setAuctions(auctions => [auction,...auctions]);
    }

    async function getDealInformation(log, price) {
        let id = ethers.utils.bigNumberify(log.topics[2]).toString();

        let auctionRecordsTemp = auctionRecords;
        if (auctionRecordsTemp[id] === undefined) {
            let info = {'id':id, 'last':"DEAL", 'price':price};
            auctionRecordsTemp[id] = info;
        } else {
            auctionRecordsTemp[id]["price"] = price;
            auctionRecordsTemp[id]["last"] = "DEAL";
        }

        let bid = auctionRecordsTemp[id]["bid"] === undefined ? "no history loaded" : auctionRecordsTemp[id]["bid"];
        let diff = auctionRecordsTemp[id]["diff"] === undefined ? "no history loaded" : auctionRecordsTemp[id]["diff"];
        let lot = auctionRecordsTemp[id]["lot"] === undefined ? "no history loaded" : auctionRecordsTemp[id]["lot"];


        let auction = {'type':"DEAL",'id':id, 'lot':lot, 'bid':bid, 'hash':log.transactionHash, 'block':log.blockNumber, 'price':price, 'diff':diff};

        setAuctionRecords(auctionRecordsTemp);

        setAuctions(auctions => [auction,...auctions]);
    }

    async function getEthPrice(block) {
        let prec18 = ethers.utils.bigNumberify("10000000000000000");

        let filter = osmContract.filters.LogValue();
        filter.fromBlock = block - 600;
        filter.toBlock = block;

        let logs = await provider.getLogs(filter);
        let price = ethers.utils.bigNumberify(logs[logs.length - 1].data).div(prec18) / 100;
        return price;
    }

    // async function getBidInfo(id) {
    //     let prec18 = ethers.utils.bigNumberify("10000000000000000");

    //     let filter = osmContract.filters.LogValue();
    //     filter.fromBlock = block - 600;
    //     filter.toBlock = block;

    //     let logs = await provider.getLogs(filter);
    //     let price = ethers.utils.bigNumberify(logs[logs.length - 1].data).div(prec18) / 100;
    //     return price;
    // }

    function saveData() {
        setAuctionHist(auctions);
        setLastBlockHist(lastBlock);
        alert("data saved up to block " + lastBlock);
        setAuctionRecordsHist(auctionRecords);
    }

    function unsaveData() {
        window.localStorage.clear();
        setLastBlockHist(0);
    }

    function subscribe() {
        const filterAll = {
            address: FLOP_ADDRESS
        }

        provider.on(filterAll, async (log) => {
            let type;
            if (log.topics.length === 2){
                type = "KICK";
            } else {
                type = getType(log.topics[0]);
            }

            let price = await getEthPrice(log.blockNumber);

            if (type === "KICK") {
                await getKickInformation(log, price);
            } else if (type === "DEAL") {
                await getDealInformation(log, price);
            } else if (type === "DENT") {
                await getDentInformation(log, price);
            }
            setLastBlock(log.blockNumber);
        });

        setSubscribed(true);
    }

    function unsubscribe() {
        const filterAll = {
            address: FLOP_ADDRESS
        }

        provider.removeAllListeners(filterAll);

        setSubscribed(false);
    }

    useEffect(() => {
        async function getLogs() {
            let currentBlock = await provider.getBlockNumber();
            let block = lastBlockHist === 0 ? currentBlock - 8000 : lastBlockHist + 1;

            setLastBlock(block);

            const filterAll = {
                address: FLOP_ADDRESS,
                fromBlock: block,
                toBlock: "latest"
            }

            let logs = await provider.getLogs(filterAll);

            setAuctions(auctionHist);
            setAuctionRecords(auctionRecordsHist);

            for (const log of logs) {
                let type;
                if (log.topics.length === 2){
                    type = "KICK";
                } else {
                    type = getType(log.topics[0]);
                }

                let price = await getEthPrice(log.blockNumber);

                if (type === "KICK") {
                    await getKickInformation(log, price);
                } else if (type === "DEAL") {
                    await getDealInformation(log, price);
                } else if (type === "DENT") {
                    await getDentInformation(log, price);
                }
                setLastBlock(log.blockNumber);
            }
        }
    
        getLogs();
    }, []);

    const auctionList = auctions.map(function(auction){
        if (auction["type"] === "KICK") {
            return <p>KICK @ block {auction["block"]} | ID: {auction["id"]} | lot: {auction["lot"]} mkr @ ${auction["price"]}(${(auction["lot"]*auction["price"]).toFixed(2)}) | <a href={"https://etherscan.io/tx/" + auction["hash"]} target="_blank" rel="noopener noreferrer">link</a></p>
        } else if (auction["type"] === "DEAL") {
            return <p>DEAL @ block {auction["block"]} | ID: {auction["id"]} | lot: {auction["lot"]} mkr @ ${auction["price"]}(${(auction["lot"]*auction["price"]).toFixed(2)}) | winning bid: {auction["bid"]} dai | rate: {auction["diff"]}% | <a href={"https://etherscan.io/tx/" + auction["hash"]} target="_blank" rel="noopener noreferrer">link</a></p>
        } else if (auction["type"] === "DENT") {
            return <p>DENT @ block {auction["block"]} | ID: {auction["id"]} | lot: {auction["lot"]} mkr @ ${auction["price"]}(${(auction["lot"]*auction["price"]).toFixed(2)}) | auction price: ${(auction["bid"]/auction["lot"]).toFixed(2)}/mkr | rate: {auction["diff"]}% | <a href={"https://etherscan.io/tx/" + auction["hash"]} target="_blank" rel="noopener noreferrer">link</a></p>
        } 
    })

    return (
        <>
        <div className='settings'>
            <p onClick={() => saveData()}>save data</p>
            <p>&nbsp;|&nbsp;</p>
            <p onClick={() => unsaveData()}>clear all save data (block {lastBlockHist})</p>
            <p>&nbsp;|&nbsp;</p>
            {subscribed ? 
                <p onClick={() => unsubscribe()}>unsubscribe</p>
                :
                <p onClick={() => subscribe()}>subscribe</p>
            }
        </div>
        <div>{auctionList}</div>
        </>
    )
}

export default Flop;
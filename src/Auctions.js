import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { waitForElementToBeRemoved } from '@testing-library/react';

const provider = ethers.getDefaultProvider();

const ETH_FLIP_ADDRESS = "0xd8a04f5412223f513dc55f839574430f5ec15531";
const OSM_ADDRESS = "0x81FE72B5A8d1A857d176C3E7d5Bd2679A9B85763";
const CDP_MANAGER_ADDRESS = "0x5ef30b9986345249bc32d8928B7ee64DE9435E39";
const CAT_ADDRESS = "0x78F2c2AF65126834c51822F56Be0d7469D7A523E";

let osmABI = [
    "event LogValue(bytes32 val)"
];

const TEND = "0x4b43ed1200000000000000000000000000000000000000000000000000000000";
const DENT = "0x5ff3a38200000000000000000000000000000000000000000000000000000000";
const DEAL = "0xc959c42b00000000000000000000000000000000000000000000000000000000";
const TICK = "0xfc7b6aee00000000000000000000000000000000000000000000000000000000";

const osmContract = new ethers.Contract(OSM_ADDRESS, osmABI, provider);

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

function Auctions() {
    const [auctions, setAuctions] = useState([]);
    const [auctionHist, setAuctionHist] = useLocalStorage('auctions', []);
    const [lastBlock, setLastBlock] = useState(0);
    const [lastBlockHist, setLastBlockHist] = useLocalStorage('block', 0);
    const [subscribed, setSubscribed] = useState(false);

    const [auctionRecords, setAuctionRecords] = useState([]);
    const [auctionRecordsHist, setAuctionRecordsHist] = useLocalStorage('records',[]);

 
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

    async function getKickInformation(log, price) {
        let prec18 = ethers.utils.bigNumberify("100000000000000");
        let prec27 = ethers.utils.bigNumberify("1000000000000000000000000000");

        let id = ethers.utils.bigNumberify(ethers.utils.hexDataSlice(log.data, 0, 32)).toString();
        let bid = ethers.utils.bigNumberify(ethers.utils.hexDataSlice(log.data, 32, 32)).toString();
        let lot = ethers.utils.bigNumberify(ethers.utils.hexDataSlice(log.data, 64, 32));
        let tab = ethers.utils.bigNumberify(ethers.utils.hexDataSlice(log.data, 96));
        
        lot = lot.div(prec18);
        lot = lot.toNumber() / 10000;
        tab = tab.div(prec27).div(prec18).toNumber() / 1000;

        let auction = {'type':"KICK",'id':id, 'lot':lot, 'bid':bid, 'tab':tab, 'hash':log.transactionHash, 'block':log.blockNumber, 'price':price};
        // let auction = <p>KICK @ block {log.blockNumber} | ID: {id} | lot: {lot} eth @ ${price}(${(lot*price).toFixed(2)}) | tab: {tab} dai | <a href={"https://etherscan.io/tx/" + log.transactionHash} target="_blank" rel="noopener noreferrer">link</a></p>

        let info = {'id':id,'lot':lot, 'bid':bid, 'tab':tab, 'last':"KICK"};
        let auctionRecordsTemp = auctionRecords;
        auctionRecordsTemp[id] = info;
        setAuctionRecords(auctionRecordsTemp);

        setAuctions(auctions => [auction,...auctions]);
    }

    async function getTendInformation(log, price) {
        let prec18 = ethers.utils.bigNumberify("100000000000000");
        let prec27 = ethers.utils.bigNumberify("1000000000000000000000000000");
        let id = ethers.utils.bigNumberify(log.topics[2]).toString();
        let lot = ethers.utils.bigNumberify(log.topics[3]).div(prec18).toNumber() / 10000;
        let bidHex = "0x" + log.data.slice(289, -248);
        let bid = ethers.utils.bigNumberify(bidHex).div(prec27).div(prec18).toNumber() / 10000;
        let paid = bid / lot;

        let diff = (((paid / price) - 1) * 100).toFixed(2);

        let auctionRecordsTemp = auctionRecords;
        if (auctionRecordsTemp[id] === undefined) {
            let info = {'id':id,'lot':lot, 'bid':bid, 'last':"TEND", 'price': price, 'paid':paid};
            auctionRecordsTemp[id] = info;
        } else {
            auctionRecordsTemp[id]["diff"] = diff;
            auctionRecordsTemp[id]["paid"] = paid;
            auctionRecordsTemp[id]["price"] = price;
            auctionRecordsTemp[id]["bid"] = bid;
            auctionRecordsTemp[id]["last"] = "TEND";
        }

        let auction = {'type':"TEND",'id':id, 'lot':lot, 'bid':bid, 'hash':log.transactionHash, 'block':log.blockNumber, 'price':price, 'diff':diff};
        // let auction = <p>TEND @ block {log.blockNumber} | ID: {id} | lot: {lot} eth @ ${price}(${(lot*price).toFixed(2)}) | bid: {bid} dai | rate: {diff}% | <a href={"https://etherscan.io/tx/" + log.transactionHash} target="_blank" rel="noopener noreferrer">link</a></p>

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
        // let auction = <p>DEAL @ block {log.blockNumber} | ID: {id} | lot: {lot} eth @ ${price}(${(lot*price).toFixed(2)}) | winning bid: {bid} dai | rate: {diff}% | <a href={"https://etherscan.io/tx/" + log.transactionHash} target="_blank" rel="noopener noreferrer">link</a></p>

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

    function saveData() {
        console.log(auctions);
        setAuctionHist(auctions);
        setLastBlockHist(lastBlock);
        alert("data saved up to block " + lastBlock);
        setAuctionRecordsHist(auctionRecords);
    }

    function unsaveData() {
        window.localStorage.clear();
    }

    function subscribe() {
        const filterAll = {
            address: ETH_FLIP_ADDRESS
        }

        provider.on(filterAll, async (log) => {
            console.log(log);
            let type;
            if (log.topics.length === 3){
                type = "KICK";
            } else {
                type = getType(log.topics[0]);
            }

            let price = await getEthPrice(log.blockNumber);

            if (type === "KICK") {
                await getKickInformation(log, price);
            } else if (type === "TEND") {
                await getTendInformation(log, price);
            } else if (type === "DEAL") {
                await getDealInformation(log, price);
            }
            setLastBlock(log.blockNumber);
        });

        setSubscribed(true);
    }

    function unsubscribe() {
        const filterAll = {
            address: ETH_FLIP_ADDRESS
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
                address: ETH_FLIP_ADDRESS,
                fromBlock: block,
                toBlock: "latest"
            }

            let logs = await provider.getLogs(filterAll);

            setAuctions(auctionHist);
            setAuctionRecords(auctionRecordsHist);

            for (const log of logs) {
                console.log(log);
                let type;
                if (log.topics.length === 3){
                    type = "KICK";
                } else {
                    type = getType(log.topics[0]);
                }

                let price = await getEthPrice(log.blockNumber);

                if (type === "KICK") {
                    await getKickInformation(log, price);
                } else if (type === "TEND") {
                    await getTendInformation(log, price);
                } else if (type === "DEAL") {
                    await getDealInformation(log, price);
                }
                setLastBlock(log.blockNumber);
            }
        }
    
        getLogs();
    }, []);

    const auctionList = auctions.map(function(auction){
        if (auction["type"] === "KICK") {
            return <p>KICK @ block {auction["block"]} | ID: {auction["id"]} | lot: {auction["lot"]} eth @ ${auction["price"]}(${(auction["lot"]*auction["price"]).toFixed(2)}) | tab: {auction["tab"]} dai | <a href={"https://etherscan.io/tx/" + auction["hash"]} target="_blank" rel="noopener noreferrer">link</a></p>
        } else if (auction["type"] === "TEND") {
            return <p>TEND @ block {auction["block"]} | ID: {auction["id"]} | lot: {auction["lot"]} eth @ ${auction["price"]}(${(auction["lot"]*auction["price"]).toFixed(2)}) | bid: {auction["bid"]} dai | rate: {auction["diff"]}% | <a href={"https://etherscan.io/tx/" + auction["hash"]} target="_blank" rel="noopener noreferrer">link</a></p>
        } else if (auction["type"] === "DEAL") {
            return <p>DEAL @ block {auction["block"]} | ID: {auction["id"]} | lot: {auction["lot"]} eth @ ${auction["price"]}(${(auction["lot"]*auction["price"]).toFixed(2)}) | winning bid: {auction["bid"]} dai | rate: {auction["diff"]}% | <a href={"https://etherscan.io/tx/" + auction["hash"]} target="_blank" rel="noopener noreferrer">link</a></p>
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

export default Auctions;
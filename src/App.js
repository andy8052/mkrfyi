import React, { useState } from 'react';
import './App.css';
import Liquidity from './Liquidity.js';
import Chief from './Chief.js';
import Auctions from './Auctions.js';

function App() {
  const [page, setPage] = useState("AUCTIONS");

  return (
    <div className="App">
      <header className="App-header">
        <h2>
          mkr.fyi
        </h2>
        {
          page === "LIQUIDITY" ? 
            <>
            <h4 onClick={() => setPage("AUCTIONS")}>show auctions</h4>
            <Chief/>
            <Liquidity/>
            </>
          :
            <>
            <h4 onClick={() => setPage("LIQUIDITY")}>hide auctions</h4>
            <Auctions/>
            </>
        }
      </header>
    </div>
  );
}

export default App;

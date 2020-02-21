import React from 'react';
import './App.css';
import Liquidity from './Liquidity.js';
import Chief from './Chief.js';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h2>
          mkr.fyi
        </h2>
        <Chief/>
        <Liquidity/>
      </header>
    </div>
  );
}

export default App;

import { useEffect, useState } from 'react'
import Head from 'next/head'
import { useContractCall, useContractFunction, useEthers, useNotifications } from '@usedapp/core'
import { parseEther } from '@ethersproject/units'
import { Contract } from '@ethersproject/contracts';
import WTFoxesAbi from '../abi/WTFoxesABI.json';
import { Interface } from '@ethersproject/abi';

const CONTRACT_ADDRESS = '0xa9e26e17b48bbaa125b62730f0904db741533fdc';
const PRICE_PER_MINT = parseEther('0.044');

const useMint = () => {
  const { library } = useEthers();
  const contract = new Contract(CONTRACT_ADDRESS, WTFoxesAbi, library?.getSigner());
  const { send, status } = useContractFunction(contract, 'mintWTFoxes', {
    transactionName: 'mintWTFoxes'
  });

  const sendWithGas = async (amount) => {
    const ethTotal = PRICE_PER_MINT.mul(amount);

    let gas;
    try {
      gas = await contract.estimateGas.mintWTFoxes(amount);
    } catch (e) {
      console.error(e);
    }

    // add extra gas if estimate is ok and have more than 1 item
    send(
      amount,
      amount > 1 && gas
        ? {
            gasLimit: gas.mul(120).div(100),  // add 15% gas to mints to account for out of gas errors
            value: ethTotal
          }
        : null
    );
  };

  return {
    send: sendWithGas,
    status,
  };
};

export default function Home() {
  const { account, activateBrowserWallet, deactivate } = useEthers()
  const [ quantity, setQuantity ] = useState(1);
  const { send, status } = useMint();

  const [MAX_FOXES] = useContractCall({
    abi: new Interface(WTFoxesAbi),
    address: CONTRACT_ADDRESS,
    args: [],
    method: 'MAX_WTFOXES'
  }) ?? [];

  const [minted] = useContractCall({
    abi: new Interface(WTFoxesAbi),
    address: CONTRACT_ADDRESS,
    args: [],
    method: 'totalSupply'
  }) ?? [];

  
  const soldOut = MAX_FOXES && minted && MAX_FOXES?.eq(minted);

  useEffect(() => {
    if (quantity > 10) {
      setQuantity(10);
    } else if (quantity < 1) {
      setQuantity(1);
    }
  }, [ quantity ]);

  return (
    <>
      <Head>
        <title>WTFoxes</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <meta name="description" content="WTFoxes are 4,004 generated fox NFTs, available on Ethereum"/>
      </Head>

      <header>
        <nav className="flex items-center">
          <ul className="flex-1">
            <li><a href="" data-current="current item">Home</a></li>
            <li><a href="https://bit.ly/2W0F4A2" target="_blank" rel="noreferrer">Roadmap</a></li>
            <li><a href="https://discord.gg/fg6XUrCTBs" target="_blank" rel="noreferrer">Discord</a></li>
          </ul>
          {account ? (
            <button className="connect button" onClick={deactivate}>Disconnect</button>
          ) : (
            <button className="connect button" onClick={activateBrowserWallet}>Connect</button>
          )}
        </nav>
      </header>

      <main>
        <p><img src="/img/wtfoxes.svg" alt="wtfoxes"/></p>
        <p><img src="/img/cowboi-raver.png" alt="cowboy raver swift"/></p>
        <h2 id="4%2C004-foxes-minting-at-.044">4,004 foxes minting at .044</h2>
        <h3 className="monospace">{minted?.toString()}/{MAX_FOXES?.toString()} minted</h3>
        {soldOut ? (
          <h2>SOLD OUT!</h2>
        ) : (
          <>
            <div className="flex justify-center">
              <button disabled={quantity <= 1} className="button button--quantity" onClick={() => setQuantity((x) => x - 1)}>
                <img src="/img/button-minus.svg" alt="minus" width={48} height={48}/>
              </button>
              <span className="quantity flex items-center">
                {quantity}
              </span>
              <button disabled={quantity >= 10} className="button button--quantity" onClick={() => setQuantity((x) => x + 1)}>
                <img src="/img/button-plus.svg" alt="plus" width={48} height={48}/>
              </button>
              <button
                className="button"
                type="button"
                onClick={() => send(quantity)}
              >
                Mint
              </button>
            </div>
            <div className="monospace">
              {status === 'Mining' ? 
                'minting...'
              : status === 'Success' ? 'Success!' : status === 'Fail' ? 'Failed :(' : null}
            </div>
          </>
        )}
        <h3 id="5-rare-shirts-hold-the-keys-to-the-community.">{'5 rare shirts hold the keys to the community.'}</h3>
        <h3 id="post-reveal%2C-only-foxes-can-access-that-community.">{'post reveal, only foxes can access that community.'}</h3>
        <h3 id="2.5%25-sales-to-the-wwf-fund-for-adopting-a-red-fox.">{'2.5% sales to the WWF fund for Adopting a Red Fox.'}</h3>
        <h3 id="2.5%25-sales-to-the-michael-j.-fox-foundation-benefitting-parkinson's-research.">{`2.5% sales to the Michael J. Fox Foundation benefitting Parkinson's research.`}</h3>
        <h3 id="snapshot-after-launch-at-a-random-date%2C-and-maybe-something-will-happen-later.">{'snapshot after launch at a random date, and maybe something will happen later.'}</h3>
        <h3 id="there-is-no-other-roadmap.">{'there is no other roadmap.'}</h3></main>

      <footer>
        <small>
          Built by some anonymous foxes.
          Join the crew on <a href="https://discord.gg/ws7WuUN2aD">Discord</a>.
        </small>
      </footer>
    </>
  )
}

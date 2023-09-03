require('dotenv').config();

import {ethers,Provider} from 'ethers'
import {abi as abi_ordermngr} from '../abi/OrderManager.json';
import {abi as abi_pool} from '../abi/Pool.json';
import {abi as abi_compensation} from '../abi/Compensation.json';
import {abi as abi_referralrewards} from '../abi/ReferralRewards.json';
import {abi as abi_pricereporter} from '../abi/PriceReporter.json';
import {parseTxCustomError} from "./utils";

const RPC_HOST = "https://polygon-mumbai.g.alchemy.com/v2/xxxxxxxxxxxxxxx"
const provider = new ethers.JsonRpcProvider(RPC_HOST)
const privatekey = process.env.PRIVATE_KEY!;

const addr_PriceReporter = '0x93CDFFBECd422372fb197585A0d406F8AA92CA5e';
const addr_OrderManager = "0xC5512C494CeeA1D1e1C66B138cfd12BC4932ACb9"
const addr_BTC = "0xf16cB500aC08CDb1a3B11264B6Cc95C5569F1c4D"
const addr_Pool = "0x1D4704cCcEBb30d5a67e14F5EC6CA2a18A7747f8"

async function main_sendTransactionAndParseCustomError(){
    let wallet = new ethers.Wallet(privatekey, provider);
    let priceReporter = new ethers.Contract(addr_PriceReporter, abi_pricereporter, wallet);
    let orderManager = new ethers.Contract(addr_OrderManager, abi_ordermngr, wallet);
    let pool = new ethers.Contract(addr_Pool, abi_pool, wallet);
    let candidates = [pool];

    const coder = new ethers.AbiCoder();
    const data = coder.encode(["uint256", "address", "uint256", "uint256", "uint256", "bytes"],
            ["0xecaca262061308f9960000", "0xf16cB500aC08CDb1a3B11264B6Cc95C5569F1c4D", "100000", "0x060c812097c9eca5c3feb4c8400000", "0", coder.encode(["bytes"], ["0x"])]);
    
    let tx:any;
    try{
        // approve BTC to ordermanager beforehand.
        // {
        //     let amount = (2n ** 256n) - 1n;
        //     let token = new ethers.Contract(addr_BTC, abi, wallet);
        //     let tx = await token.approve(addr_OrderManager, amount);
        //     let re = await tx.wait();
        //     console.log(re);
        // }

        const addr_basePool = "0x1D4704cCcEBb30d5a67e14F5EC6CA2a18A7747f8"
        tx = await orderManager.placeOrder(
            addr_basePool,
            0,
            0,
            addr_BTC,
            addr_BTC,
            0,
            data,
            0,
            {
                // value: "1500000000000000",
                value: "1500000000", //NOTE: make executionfee lower than minvalue. 
                gasLimit: "526970"
            }
        );
        console.log("tx:");
        console.log(tx);
        let receipt = await tx.wait(); // would cause revert exception. but whether it depends on different rpc??

    } catch (err:any){
        console.log(err);
        console.log(JSON.stringify(err, null, "  "));

        let receipt = err.receipt;
        if (!receipt.status) {
            tx.blockNumber = receipt.blockNumber;
            const customError = await parseTxCustomError(tx, provider, orderManager, candidates);

            console.log("customError:");
            console.log(customError);
        }
    }
}

async function main_queryTransactionAndParseCustomError(){
    let wallet = new ethers.Wallet(privatekey, provider);
    let priceReporter = new ethers.Contract(addr_PriceReporter, abi_pricereporter, wallet);
    let orderManager = new ethers.Contract(addr_OrderManager, abi_ordermngr, wallet);
    let pool = new ethers.Contract(addr_Pool, abi_pool, wallet);
    let candidates = [orderManager, pool];

    const coder = new ethers.AbiCoder();

    let tx:any;
    try{
        let tx = await provider.getTransaction("0x0bd0ebed6f8f52cef9b9780860f52077d5527915b1e34e4bb68d901efad1d098");
        // let tx = await provider.getTransaction("0xaa882b64451c886d0f06114abb31889cdb648da096bf55c6430e20416e7ad9b4");

        const customError = await parseTxCustomError(tx, provider, orderManager, candidates);
        console.log("customError:");
        console.log(customError);

    } catch (err:any){
        console.log(err);
        console.log(JSON.stringify(err, null, "  "));
    }
}

main_queryTransactionAndParseCustomError();
// main_sendTransactionAndParseCustomError();

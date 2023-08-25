require('dotenv').config();

import {ethers,Provider} from 'ethers'
import {abi as abi_ordermngr} from '../abi/OrderManager.json';
import {parseTxCustomError} from "./utils";

const RPC_HOST = "https://polygon-mumbai.g.alchemy.com/v2/xxxxxxx"
const provider = new ethers.JsonRpcProvider(RPC_HOST)
const privatekey = process.env.PRIVATE_KEY!;

const addr_OrderManager = "0x72595E70A8386F0DF243BC69a14851b3C276B0d8"
const addr_BTC = "0xf16cB500aC08CDb1a3B11264B6Cc95C5569F1c4D"

async function main_sendTransactionAndParseCustomError(){
    let wallet = new ethers.Wallet(privatekey, provider);
    let ordermngr = new ethers.Contract(addr_OrderManager, abi_ordermngr, wallet);

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

        const addr_basePool = "0xFD27B72A51f2E2596B6793CdEe763761A0d6907A"
        tx = await ordermngr.placeOrder(
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
            const customError = await parseTxCustomError(tx, provider, ordermngr);

            console.log("customError:");
            console.log(customError);
        }
    }
}

async function main_queryTransactionAndParseCustomError(){
    let wallet = new ethers.Wallet(privatekey, provider);
    let ordermngr = new ethers.Contract(addr_OrderManager, abi_ordermngr, wallet);

    const coder = new ethers.AbiCoder();

    let tx:any;
    try{
        let tx = await provider.getTransaction("0xa2b675b03d62a8ad42ca4e6f7f4df3ee8f1be488acecde2c57ac35774c59a26f");
        // let tx = await provider.getTransaction("0xaa882b64451c886d0f06114abb31889cdb648da096bf55c6430e20416e7ad9b4");

        const customError = await parseTxCustomError(tx, provider, ordermngr);
        console.log("customError:");
        console.log(customError);

    } catch (err:any){
        console.log(err);
        console.log(JSON.stringify(err, null, "  "));
    }
}

main_queryTransactionAndParseCustomError();
// main_sendTransactionAndParseCustomError();
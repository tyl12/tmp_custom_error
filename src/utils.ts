function parseCustomError(error:any, contract:any, candidates:any[]) {
    if (error?.revert) {
        return error.revert;
    }
    const data = error.data;
    if (typeof data !== 'string' || !data.startsWith('0x')) {
        return null;
    }
    const selector = data.substring(0, 10);
    // console.log(`error selector: ${selector}`);

    //const fragment = contract.interface.fragments.find((fragment:any) => fragment.selector === selector);
    const contractCandidates = [contract, ...candidates];
    let fragment = null
    let errorContract = null;
    for (let i=0;i<contractCandidates.length;i++){
        fragment = contractCandidates[i].interface.fragments.find((fragment:any) => fragment.selector === selector);
        errorContract = contractCandidates[i];
        if (fragment)
            break;
    }

    if (!fragment) {
        return {
            selector: selector,
            signature: null
        }
    }
    return {
        selector: selector,
        name: fragment.name,
        signature: fragment.format(),
        args: errorContract.interface.decodeErrorResult(fragment, data)
    };
}

const KEYS = ['to', 'from', 'nonce', 'gasLimit', 'gasPrice', 'maxPriorityFeePerGas', 'maxFeePerGas', 'data', 'value', 'chainId', 'type', 'accessList'];
async function parseTxCustomError(tx:any, provider:any, contract:any, candidates:any[]) {
    const request:any = { blockTag: tx.blockNumber };
    KEYS.forEach((key) => {
        request[key] = tx[key];
    });
    if (request.gasPrice) {
        delete request.maxPriorityFeePerGas;
        delete request.maxFeePerGas;
    }
    try {
        await provider.call(request);
        return null;
    } catch (e) {
        console.log(e);
        return parseCustomError(e, contract, candidates);
    }
}

export {parseTxCustomError}

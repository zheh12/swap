/**
 * create a swap request form to input
 * all the parameter.
 * For one use start swap request.
 * 
 * For the Initiator side.
 * 
 * It need the 
 * 1. preimage field to input the preimage, the preimage need be password field.
 * 2. hashlock -> if input preimage -> will compute by the preimage else must
 * be input by the user.
 * 3. receiver -> the receiver address.
 * 4. token -> first choose, token type, can be ether, erc20, erc71.
 * 5. token address.
 * 6. amount.
 * 7. timelock -> expired data.
 */
export function SwapRequest({newSwap}) {
    return (
        <div className="card p-3 mb-5">
            <div className="card-header mb-3">
                <h3>Swap Request</h3>                
            </div>
            <form onSubmit = {(event) => {
                event.preventDefault();

                const formData = new FormData(event.target);
                const isInitiator = formData.get("isInitiator");
                const receiver = formData.get("receiver");
                const hashlock = formData.get("hashlock");
                let timelock = formData.get("timelock");
                const tokenType = formData.get("tokenType");
                const tokenAddress = formData.get("tokenAddress");
                const tokenAmount = formData.get("tokenAmount");
                const tokenId = formData.get("tokenId");

                let duration;
                if (timelock == "1h") {
                    duration = 60 * 60
                } else if (timelock == "2h") {
                    duration = 2 * 60 * 60
                } else if (timelock == "1d") {
                    duration = 24 * 60 * 60
                }

                timelock = Math.floor(Date.now() / 1000) + duration;
                
                console.log("newSwap with", receiver, hashlock, timelock,
                tokenType, tokenAddress, tokenId, tokenAmount)
                newSwap(receiver, hashlock, timelock, tokenType, tokenAddress, tokenId, tokenAmount);
            }}>
                <div className="form-check form-switch">
                    <input className="form-check-input" name="isInitiator" type="checkbox" role="switch" id="isInitiator"/>
                    <label className="form-check-label" htmlFor="isInitiator">Initiator</label>
                </div>

                <div className="mb-3">
                    <label htmlFor="hashLock">HashLock</label>
                    <input type="text" name="hashlock" className="form-control"></input>
                </div>

                <div className="mb-3">
                    <label htmlFor="receiver">Receiver Address</label>
                    <input type="text" name="receiver" className="form-control"></input>
                </div>

                <div className="mb-3">
                    <label htmlFor="tokenAddress" className="mr-3">Token Type:</label>
                    <select name="tokenType" className="form-select" aria-label="Token type">
                        <option value="ether">Ether</option>
                        <option value="erc20">Erc20</option>
                        <option value="erc721">Erc721</option>
                    </select>
                </div>

                <div className="mb-3">
                    <label htmlFor="tokenAddress">Token Address (for ERC721 and ERC20) </label>
                    <input type="text" name="tokenAddress" className="form-control"></input>
                </div>

                <div className="mb-3">
                    <label htmlFor="tokenId">Token Id (for ERC721) </label>
                    <input type="text" name="tokenId" className="form-control"></input>
                </div>

                <div className="mb-3">
                    <label htmlFor="amount">Amount (for Ether and ERC20)</label>
                    <input type="text" name="tokenAmount" className="form-control"></input>
                </div>

                <div className="mb-3">
                    <label htmlFor="timeLock" className="mr-3">TimeLock</label>
                    <select name="timelock" className="form-select" aria-label="TimeLock">
                        <option value="1h">One Hour</option>
                        <option value="2h">Two Hours</option>
                        <option value="1d">One Day</option>
                    </select>
                </div>

                <button type="submit" className="btn btn-primary">Submit</button>
            </form>
        </div>
    )
}
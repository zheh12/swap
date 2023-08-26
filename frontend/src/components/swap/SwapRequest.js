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
export function SwapRequest() {
    return (
        <div className="card p-3 mb-5">
            <div className="card-header mb-3">
                <h3>Swap Request</h3>                
            </div>
            <form>
                <div className="form-check form-switch">
                    <input className="form-check-input" type="checkbox" role="switch" id="isInitiator"/>
                    <label className="form-check-label" for="isInitiator">Initiator</label>
                </div>

                <div className="mb-3">
                    <label for="preImage">PreImage</label>
                    <input type="password" id="preImage" className="form-control"></input>
                </div>

                <div className="mb-3">
                    <label for="hashLock">HashLock</label>
                    <input type="text" id="hashLock" className="form-control"></input>
                </div>

                <div className="mb-3">
                    <label for="receiver">Receiver Address</label>
                    <input type="text" id="receiver" className="form-control"></input>
                </div>

                <div className="mb-3">
                    <label for="tokenAddress" className="mr-3">Token Type:</label>
                    <select className="form-select" aria-label="Token type">
                        <option value="ether">Ether</option>
                        <option value="erc20">Erc20</option>
                        <option value="erc721">Erc721</option>
                    </select>
                </div>

                <div className="mb-3">
                    <label for="tokenAddress">Token Address</label>
                    <input type="text" id="tokenAddress" className="form-control"></input>
                </div>

                <div className="mb-3">
                    <label for="amount">Amount</label>
                    <input type="text" id="amount" className="form-control"></input>
                </div>

                <div className="mb-3">
                    <label for="timeLock" className="mr-3">TimeLock</label>
                    <select className="form-select" aria-label="TimeLock">
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
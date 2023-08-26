/**
 * swap withdraw input and execution
 * @returns 
 */
export function SwapWithdraw() {
    return (
        <div className="card p-3 mb-5">
            <div className="card-header mb-3">
                <h3>Swap withdraw</h3>
            </div>

            <form>
                <div className="mb-3">
                    <label for="swapId">Swap Id</label>
                    <input type="text" id="sawpId" className="form-control"></input>
                </div>

                <div className="mb-3">
                    <label for="preImage">PreImage</label>
                    <input type="password" id="withdrawPreImage" className="form-control"></input>
                </div>

                <button type="submit" className="btn btn-primary">Submit</button>
            </form>
        </div>
    )
}
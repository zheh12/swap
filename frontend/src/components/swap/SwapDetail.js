export function SwapDetail({ getSwap }) {
    return (
        <div className="card p-3">
            <div className="card-header mb-3">
                <h3>Swap Detail</h3>
            </div>

            <form onSubmit = {(event) => {
                event.preventDefault();

                const formData = new FormData(event.target);
                const swapId = formData.get("swapId");
                const tokenType = formData.get("tokenType");

                getSwap(tokenType, swapId);
            }}>
                <div className="mb-3">
                    <label htmlFor="swapId">Swap Id</label>
                    <input type="text" name="swapId" className="form-control"></input>
                </div>

                <div className="mb-3">
                    <label htmlFor="tokenAddress" className="mr-3">Token Type:</label>
                    <select name="tokenType" className="form-select" aria-label="Token type">
                        <option value="ether">Ether</option>
                        <option value="erc20">Erc20</option>
                        <option value="erc721">Erc721</option>
                    </select>
                </div>

                <button type="submit" className="btn btn-primary">Submit</button>
            </form>
        </div>
    )
}
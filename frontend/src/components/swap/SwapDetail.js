export function SwapDetail() {
    return (
        <div className="card p-3">
            <div className="card-header mb-3">
                <h3>Swap Detail</h3>
            </div>

            <form>
                <div className="mb-3">
                    <label for="swapId">Swap Id</label>
                    <input type="text" id="sawpId" className="form-control"></input>
                </div>

                <button type="submit" className="btn btn-primary">Submit</button>
            </form>
        </div>
    )
}
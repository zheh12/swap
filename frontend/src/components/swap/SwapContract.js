import { SwapRequest } from "./SwapRequest";
import { SwapWithdraw } from "./SwapWithdraw";
import { SwapRollback } from "./SwapRollback";
import { SwapDetail } from "./SwapDetail";

export function SwapContract({newSwap, getSwap, withdraw, rollback}) {
    return (
        <div className="container">
            <SwapRequest newSwap = {newSwap}></SwapRequest>
            <SwapWithdraw withdraw = {withdraw}></SwapWithdraw>
            <SwapRollback rollback = {rollback}></SwapRollback>
            <SwapDetail getSwap = {getSwap}></SwapDetail>
        </div>
    )
}
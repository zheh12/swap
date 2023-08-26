import { SwapRequest } from "./SwapRequest";
import { SwapWithdraw } from "./SwapWithdraw";
import { SwapRollback } from "./SwapRollback";
import { SwapDetail } from "./SwapDetail";

export function SwapContract() {
    return (
        <div className="container">
            <SwapRequest></SwapRequest>
            <SwapWithdraw></SwapWithdraw>
            <SwapRollback></SwapRollback>
            <SwapDetail></SwapDetail>
        </div>
    )
}
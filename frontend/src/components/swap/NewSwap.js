
export default function SwapMessage({ message, dismiss }) {
    return (
      <div className="alert alert-info" role="alert">
        New swap transaction success:
        <p>swap id: {message.swapId} </p>
        <p>sender: {message.sender} </p>
        <p>receiver: {message.receiver} </p>
        <p>amount: {message.amount.toString()}</p>
        <p>hashlock: {message.hashlock} </p>
        <p>timelock: {message.timelock.toString()} </p>
        {message.isWithdraw != undefined && 
        <p>withdraw: {message.isWithdraw.toString()}</p>}
        {message.isRollback != undefined &&
        <p>rollback: {message.isRollback.toString()}</p>}
        <button
          type="button"
          className="close"
          data-dismiss="alert"
          aria-label="Close"
          onClick={dismiss}
        >
          <span aria-hidden="true">&times;</span>
        </button>
      </div>
    );
  }
  
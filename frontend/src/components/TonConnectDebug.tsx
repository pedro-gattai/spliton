import { useTonWallet } from '@tonconnect/ui-react';

export const TonConnectDebug = () => {
  const wallet = useTonWallet();
  const connected = !!wallet;
  const account = wallet?.account;

  return (
    <div className="fixed top-4 right-4 bg-black text-white p-4 rounded-lg text-xs z-50">
      <div>Connected: {connected ? 'Yes' : 'No'}</div>
      <div>Wallet: {wallet ? 'Yes' : 'No'}</div>
      <div>Account: {account?.address ? 'Yes' : 'No'}</div>
      {account?.address && (
        <div>Address: {account.address.slice(0, 8)}...{account.address.slice(-8)}</div>
      )}
    </div>
  );
}; 
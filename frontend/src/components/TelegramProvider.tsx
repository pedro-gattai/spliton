import { createContext, useContext, ReactNode } from 'react';
import { useTelegramWebApp } from '@/hooks/useTelegramWebApp';

interface TelegramContextType {
  webApp: ReturnType<typeof useTelegramWebApp>['webApp'];
  user: ReturnType<typeof useTelegramWebApp>['user'];
  isReady: boolean;
}

const TelegramContext = createContext<TelegramContextType | undefined>(undefined);

export const TelegramProvider = ({ children }: { children: ReactNode }) => {
  const telegram = useTelegramWebApp();

  return (
    <TelegramContext.Provider value={telegram}>
      {children}
    </TelegramContext.Provider>
  );
};

export const useTelegram = () => {
  const context = useContext(TelegramContext);
  if (context === undefined) {
    throw new Error('useTelegram must be used within a TelegramProvider');
  }
  return context;
}; 
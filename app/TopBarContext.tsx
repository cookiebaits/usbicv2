import { createContext, useContext } from 'react';

interface TopBarContextType {
    topBarHeight: number;
}

export const TopBarContext = createContext<TopBarContextType | undefined>(undefined);

export const useTopBarHeight = () => {
    const context = useContext(TopBarContext);
    if (!context) {
        throw new Error('useTopBarHeight must be used within a TopBarProvider');
    }
    return context.topBarHeight;
};
import { useState, useEffect } from 'react';
import { subscribeToAccounts } from "@/lib/firebase/accounts";
import { Account } from "@/types";
import { User } from 'firebase/auth';

export function useAccounts(user: User | null | undefined) {
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            const unsubscribe = subscribeToAccounts(user.uid, (fetchedAccounts) => {
                setAccounts(fetchedAccounts);
                if (loading) setLoading(false);
            });
            return () => unsubscribe();
        } else {
            setAccounts([]);
            setLoading(false);
        }
    }, [user]);

    return {
        accounts,
        loading
    };
}

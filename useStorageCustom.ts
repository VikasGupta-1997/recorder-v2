import { useEffect, useRef, useState } from 'react';
import debounce  from 'lodash.debounce';

const useStorage = (key, initialValue) => {
    const [storedValue, setStoredValue] = useState(initialValue);

    // Create a debounced function to set the stored value
    const debouncedSetStoredValue = useRef(
        debounce((value) => {
            chrome.storage.local.set({ [key]: value }, () => {
                // Optional: handle any post-set logic here
            });
        }, 300) // Adjust the delay time as needed
    ).current;

    // Effect to retrieve value from chrome.storage.local on mount
    useEffect(() => {
        chrome.storage.local.get(key, (result) => {
            if (result[key] !== undefined) {
                setStoredValue(result[key]);
            } else {
                setStoredValue(initialValue);
            }
        });
    }, [key, initialValue]);

    // Effect to update the stored value in chrome.storage.local when it changes
    useEffect(() => {
        debouncedSetStoredValue(storedValue);
    }, [storedValue, debouncedSetStoredValue]);

    // Effect to listen for changes in chrome.storage.local
    useEffect(() => {
        const handleStorageChange = (changes, area) => {
            if (area === 'local' && changes[key]) {
                setStoredValue(changes[key].newValue);
            }
        };

        chrome.storage.onChanged.addListener(handleStorageChange);

        return () => {
            chrome.storage.onChanged.removeListener(handleStorageChange);
        };
    }, [key]);

    return [storedValue, setStoredValue];
};

export default useStorage;

import { useEffect, useRef } from 'react';

type KeyCombo = string;
type Handler = (event: KeyboardEvent) => void;

export function useHotkeys(keys: KeyCombo, callback: Handler, deps: any[] = []) {
    // Keep callback stable to avoid re-binding the event listener
    const callbackRef = useRef(callback);

    useEffect(() => {
        callbackRef.current = callback;
    });

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            const combo = keys.toLowerCase().split('+');
            const pressedModifiers = new Set<string>();

            if (event.ctrlKey) pressedModifiers.add('ctrl');
            if (event.metaKey) pressedModifiers.add('cmd');
            if (event.altKey) pressedModifiers.add('alt');
            if (event.shiftKey) pressedModifiers.add('shift');

            // Separate modifiers and main key
            const modifiers = combo.filter(k => ['ctrl', 'cmd', 'alt', 'shift'].includes(k));
            const mainKey = combo.find(k => !['ctrl', 'cmd', 'alt', 'shift'].includes(k));

            // Check if modifiers match exactly
            const modifiersMatch = modifiers.every(m => {
                // Allow ctrl to match cmd on mac for 'cmd' alias if desired, 
                // but usually user specifies 'ctrl+k' or 'cmd+k'.
                // Here we keep it strict as per input.
                return pressedModifiers.has(m);
            }) && pressedModifiers.size === modifiers.length;

            if (!modifiersMatch) return;

            if (mainKey) {
                const eventKey = event.key.toLowerCase();
                const eventCode = event.code.toLowerCase(); // e.g. 'keyk'

                // keyMatch: e.g. 'k' == 'k' OR 'keyk' == 'keyk'
                // Handle layout issues: if mainKey is 'k', check if event.code is 'KeyK'
                let keyMatch = eventKey === mainKey;

                if (!keyMatch && /^([a-z0-9])$/.test(mainKey)) {
                    // If mainKey is single letter/digit, check Key<Letter> or Digit<Number>
                    if (eventCode === `key${mainKey}` || eventCode === `digit${mainKey}`) {
                        keyMatch = true;
                    }
                }

                // Allow non-alphanumeric exact code matches if needed, but 'enter' usually works with key.

                if (keyMatch) {
                    event.preventDefault();
                    callbackRef.current(event);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown, true);
        return () => window.removeEventListener('keydown', handleKeyDown, true);
    }, [keys, ...deps]);
}

import { useEffect, useRef } from 'react'

export const PROGRESS_REFRESH_INTERVAL = 5000

export function useInterval(callback, delay) {
    const savedCallback = useRef()

    useEffect(() => {
        savedCallback.current = callback;
    }, [callback])

    useEffect(() => {
        //console.log(savedCallback);
        //console.log(savedCallback.current);

        function tick() {
            if (savedCallback.current !== null) {
                savedCallback.current()
            }
        }

        if (delay !== null) {
            const id = setInterval(tick, delay)
            return () => {
                clearInterval(id)
            }
        }
    }, [callback, delay])
}
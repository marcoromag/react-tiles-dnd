import { Ref, useCallback } from 'react';

/**
 * returns a function that composes multiple refs together.
 * This can be very useful when you have more hooks that create a ref
 * that shall be given to a DOM component, but the component only accepts
 * one ref!
 *
 * Example:
 *
 * ```
 * import { useMeasure } from 'react-use';
 * import { useDrop } from 'react-dnd';
 *
 * const MyComponent = () => {
 *   const [measureRef, measure] = useMeasure<HTMLDivElement>();
 *   const [_, dropRef] = useDrop({accept: 'TILE'});
 *   const reactRef = useRef<HTMLDivElement>(null);
 *
 *   const composedRef = useComposeRef(measureRef, dropRef, reactRef)
 *
 *   return <div ref={composedRef}/>
 * }
 * ```
 * @param refs a list of refs that shall be composed together
 * @returns a new ref that shall be given to the component
 */
export const useComposeRef = <T extends HTMLElement>(...refs: Ref<T>[]) => {
  return useCallback((el: T | null) => {
    refs.forEach(ref => {
      if (ref) {
        if (typeof ref === 'function') ref(el);
        //@ts-ignore
        else ref.current = el;
      }
    });
  }, refs);
};

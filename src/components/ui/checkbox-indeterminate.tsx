import { forwardRef, useEffect, useRef } from 'react';
import { Checkbox } from './checkbox';
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";

interface IndeterminateCheckboxProps extends Omit<React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>, 'ref'> {
  indeterminate?: boolean;
}

export const IndeterminateCheckbox = forwardRef<HTMLButtonElement, IndeterminateCheckboxProps>(
  ({ indeterminate, ...props }, forwardedRef) => {
    const internalRef = useRef<HTMLButtonElement>(null);
    
    useEffect(() => {
      if (internalRef.current) {
        // Utiliser setAttribute pour définir l'état indeterminate
        if (indeterminate) {
          internalRef.current.setAttribute('data-state', 'indeterminate');
        } else {
          internalRef.current.removeAttribute('data-state');
        }
      }
    }, [indeterminate]);

    return (
      <Checkbox
        ref={(node) => {
          // Gérer les deux refs
          if (typeof forwardedRef === 'function') {
            forwardedRef(node);
          } else if (forwardedRef) {
            forwardedRef.current = node;
          }
          internalRef.current = node;
        }}
        {...props}
      />
    );
  }
);

IndeterminateCheckbox.displayName = 'IndeterminateCheckbox'; 
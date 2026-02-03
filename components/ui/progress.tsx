import { cn } from '@/lib/utils';
import * as React from 'react';
import { View } from 'react-native';

const Progress = React.forwardRef<
    View,
    React.ComponentPropsWithoutRef<typeof View> & { value?: number }
>(({ className, value, ...props }, ref) => (
    <View
        ref={ref}
        className={cn(
            'relative h-4 w-full overflow-hidden rounded-full bg-secondary/20',
            className
        )}
        {...props}
    >
        <View
            className="h-full w-full flex-1 bg-primary transition-all"
            style={{ transform: [{ translateX: -100 + (value || 0) }] }}
        />
    </View>
));
Progress.displayName = 'Progress';

export { Progress };

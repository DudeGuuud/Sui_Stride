import { cn } from '@/lib/utils';
import * as React from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

const Progress = React.forwardRef<
    View,
    React.ComponentPropsWithoutRef<typeof View> & { value?: number }
>(({ className, value, ...props }, ref) => {
    const progress = useSharedValue(0);

    React.useEffect(() => {
        const targetValue = Math.min(Math.max(value || 0, 0), 100);
        progress.value = withSpring(targetValue, {
            damping: 20,
            stiffness: 90,
        });
    }, [value]);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            width: `${progress.value}%`,
        };
    });

    return (
        <View
            ref={ref}
            className={cn(
                'relative h-4 w-full overflow-hidden rounded-full bg-secondary/20',
                className
            )}
            {...props}
        >
            <Animated.View
                className="h-full bg-primary"
                style={animatedStyle}
            />
        </View>
    );
});
Progress.displayName = 'Progress';

export { Progress };
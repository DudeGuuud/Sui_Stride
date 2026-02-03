import { cn } from '@/lib/utils';
import * as React from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

const Progress = React.forwardRef<
    View,
    React.ComponentPropsWithoutRef<typeof View> & { value?: number }
>(({ className, value, ...props }, ref) => {
    const progress = useSharedValue(-100);

    React.useEffect(() => {
        progress.value = withSpring(-100 + (value || 0), {
            damping: 20,
            stiffness: 90,
        });
    }, [value, progress]);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ translateX: progress.value }],
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
                className="h-full w-full flex-1 bg-primary"
                style={animatedStyle}
            />
        </View>
    );
});
Progress.displayName = 'Progress';

export { Progress };

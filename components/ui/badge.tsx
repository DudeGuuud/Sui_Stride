import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';
import { Text, View, type ViewProps } from 'react-native';

const badgeVariants = cva(
    'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold overflow-hidden',
    {
        variants: {
            variant: {
                default:
                    'border-transparent bg-primary text-primary-foreground',
                secondary:
                    'border-transparent bg-secondary text-secondary-foreground',
                destructive:
                    'border-transparent bg-destructive text-destructive-foreground',
                outline: 'text-foreground',
            },
        },
        defaultVariants: {
            variant: 'default',
        },
    }
);

export interface BadgeProps
    extends ViewProps,
    VariantProps<typeof badgeVariants> {
    textClassName?: string;
    children?: React.ReactNode;
}

function Badge({ className, variant, children, textClassName, ...props }: BadgeProps) {
    return (
        <View className={cn(badgeVariants({ variant }), className)} {...props}>
            {typeof children === 'string' ? (
                <Text className={cn('text-xs font-semibold', textClassName)}>
                    {children}
                </Text>
            ) : (
                children
            )}
        </View>
    );
}

export { Badge, badgeVariants };

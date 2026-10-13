import { forwardRef, type ComponentPropsWithoutRef, type ElementRef } from 'react'
import * as TabsPrimitive from '@radix-ui/react-tabs'
import { cn } from '@/shared/lib/cn'

const Tabs = TabsPrimitive.Root

interface TabsListProps extends ComponentPropsWithoutRef<typeof TabsPrimitive.List> {
  scrollable?: boolean
}

const TabsList = forwardRef<
  ElementRef<typeof TabsPrimitive.List>,
  TabsListProps
>(({ className, scrollable, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      'inline-flex h-11 w-full max-w-full items-center justify-center overflow-x-auto rounded-lg bg-muted p-1 text-muted-foreground sm:h-9 sm:w-auto',
      scrollable &&
        '-mx-4 w-[calc(100%+2rem)] max-w-none snap-x snap-mandatory scroll-px-4 justify-start px-4 [mask-image:linear-gradient(to_right,transparent,black_1rem,black_calc(100%_-_1rem),transparent)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:w-auto sm:max-w-full sm:justify-center sm:rounded-lg sm:px-1 sm:[mask-image:none]',
      className,
    )}
    {...props}
  />
))
TabsList.displayName = TabsPrimitive.List.displayName

const TabsTrigger = forwardRef<
  ElementRef<typeof TabsPrimitive.Trigger>,
  ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      'inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow sm:py-1',
      className,
    )}
    {...props}
  />
))
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = forwardRef<
  ElementRef<typeof TabsPrimitive.Content>,
  ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      'mt-4 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
      className,
    )}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }

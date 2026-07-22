import { type ComponentProps } from 'react'
import { DayPicker, UI, DayFlag, SelectionState } from 'react-day-picker'
import { cn } from '@/shared/lib/cn'
import { buttonVariants } from './button'

export type CalendarProps = ComponentProps<typeof DayPicker>

function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn('p-3', className)}
      classNames={{
        [UI.Root]: 'p-3',
        [UI.Month]: 'space-y-4',
        [UI.MonthCaption]: 'flex justify-center pt-1 relative items-center',
        [UI.CaptionLabel]: 'text-sm font-medium',
        [UI.Nav]: 'space-x-1 flex items-center',
        [UI.PreviousMonthButton]: cn(
          buttonVariants({ variant: 'outline' }),
          'h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 absolute left-1',
        ),
        [UI.NextMonthButton]: cn(
          buttonVariants({ variant: 'outline' }),
          'h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 absolute right-1',
        ),
        [UI.MonthGrid]: 'w-full border-collapse space-y-1',
        [UI.Weekdays]: 'grid grid-cols-7',
        [UI.Weekday]: 'flex items-center justify-center text-muted-foreground font-normal text-[0.8rem] h-8',
        [UI.Weeks]: 'w-full',
        [UI.Week]: 'grid grid-cols-7',
        [UI.Day]: cn(
          'flex items-center justify-center text-sm focus-within:z-20',
          props.mode === 'range'
            ? '[&:has(>.range_end)]:rounded-r-md [&:has(>.range_start)]:rounded-l-md first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md'
            : '[&:has([aria-selected])]:rounded-md',
          '[&:has([aria-selected])]:bg-accent',
        ),
        [UI.DayButton]: cn(
          buttonVariants({ variant: 'ghost' }),
          'h-8 w-8 p-0 font-normal aria-selected:opacity-100',
        ),
        [SelectionState.selected]: 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground',
        [DayFlag.today]: 'bg-accent text-accent-foreground',
        [DayFlag.outside]: 'text-muted-foreground aria-selected:bg-accent/50 aria-selected:text-muted-foreground',
        [DayFlag.disabled]: 'text-muted-foreground opacity-50',
        [SelectionState.range_middle]: 'aria-selected:bg-accent aria-selected:text-accent-foreground',
        [DayFlag.hidden]: 'invisible',
        ...classNames,
      }}
      {...props}
    />
  )
}
Calendar.displayName = 'Calendar'

export { Calendar }

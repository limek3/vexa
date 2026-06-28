'use client'

import * as React from 'react'
import * as SwitchPrimitive from '@radix-ui/react-switch'

import { cn } from '@/lib/utils'

function Switch({
  className,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn('sloty-switch peer', className)}
      {...props}
    >
      <span aria-hidden="true" className="sloty-switch-track" />
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className="sloty-switch-thumb"
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }

import { useState } from 'react'
import { type Table } from '@tanstack/react-table'
import { ArrowUpDown, CircleArrowUp, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { bulkUpdateTasks } from '@/lib/db'
import type { Task } from '@/lib/db'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { DataTableBulkActions as BulkActionsToolbar } from '@/components/data-table'
import { priorities, statuses } from '../data/data'
import { TasksMultiDeleteDialog } from './tasks-multi-delete-dialog'
import { useTasks } from './tasks-provider'

type DataTableBulkActionsProps = {
  table: Table<Task>
}

export function DataTableBulkActions({ table }: DataTableBulkActionsProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const { refreshData } = useTasks()
  const selectedRows = table.getFilteredSelectedRowModel().rows

  const handleBulkStatusChange = async (status: string) => {
    const ids = selectedRows.map((row) => row.original.id)
    try {
      await bulkUpdateTasks(ids, { status } as Partial<Task>)
      await refreshData()
      table.resetRowSelection()
      toast.success(`Statut mis à jour pour ${ids.length} tâche(s).`)
    } catch {
      toast.error('Erreur lors de la mise à jour.')
    }
  }

  const handleBulkPriorityChange = async (priority: string) => {
    const ids = selectedRows.map((row) => row.original.id)
    try {
      await bulkUpdateTasks(ids, { priority } as Partial<Task>)
      await refreshData()
      table.resetRowSelection()
      toast.success(`Priorité mise à jour pour ${ids.length} tâche(s).`)
    } catch {
      toast.error('Erreur lors de la mise à jour.')
    }
  }

  return (
    <>
      <BulkActionsToolbar table={table} entityName='tâche'>
        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button variant='outline' size='icon' className='size-8'>
                  <CircleArrowUp />
                  <span className='sr-only'>Changer le statut</span>
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent>
              <p>Changer le statut</p>
            </TooltipContent>
          </Tooltip>
          <DropdownMenuContent sideOffset={14}>
            {statuses.map((status) => (
              <DropdownMenuItem
                key={status.value}
                onClick={() => handleBulkStatusChange(status.value)}
              >
                {status.icon && (
                  <status.icon className='size-4 text-muted-foreground' />
                )}
                {status.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button variant='outline' size='icon' className='size-8'>
                  <ArrowUpDown />
                  <span className='sr-only'>Changer la priorité</span>
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent>
              <p>Changer la priorité</p>
            </TooltipContent>
          </Tooltip>
          <DropdownMenuContent sideOffset={14}>
            {priorities.map((priority) => (
              <DropdownMenuItem
                key={priority.value}
                onClick={() => handleBulkPriorityChange(priority.value)}
              >
                {priority.icon && (
                  <priority.icon className='size-4 text-muted-foreground' />
                )}
                {priority.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant='destructive'
              size='icon'
              onClick={() => setShowDeleteConfirm(true)}
              className='size-8'
            >
              <Trash2 />
              <span className='sr-only'>Supprimer</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Supprimer la sélection</p>
          </TooltipContent>
        </Tooltip>
      </BulkActionsToolbar>

      <TasksMultiDeleteDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        table={table}
      />
    </>
  )
}

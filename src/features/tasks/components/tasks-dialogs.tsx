import { toast } from 'sonner'
import { deleteTask } from '@/lib/db'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { TasksMutateDrawer } from './tasks-mutate-drawer'
import { useTasks } from './tasks-provider'

export function TasksDialogs() {
  const { open, setOpen, currentRow, setCurrentRow, refreshData } = useTasks()
  return (
    <>
      <TasksMutateDrawer
        key='task-create'
        open={open === 'create'}
        onOpenChange={() => setOpen('create')}
      />

      {currentRow && (
        <>
          <TasksMutateDrawer
            key={`task-update-${currentRow.id}`}
            open={open === 'update'}
            onOpenChange={() => {
              setOpen('update')
              setTimeout(() => setCurrentRow(null), 500)
            }}
            currentRow={currentRow}
          />

          <ConfirmDialog
            key='task-delete'
            destructive
            open={open === 'delete'}
            onOpenChange={() => {
              setOpen('delete')
              setTimeout(() => setCurrentRow(null), 500)
            }}
            handleConfirm={async () => {
              try {
                await deleteTask(currentRow.id)
                await refreshData()
                setOpen(null)
                toast.success('Tâche supprimée.')
              } catch {
                toast.error('Erreur lors de la suppression.')
              }
              setTimeout(() => setCurrentRow(null), 500)
            }}
            className='max-w-md'
            title='Supprimer cette tâche ?'
            desc={
              <>
                Vous êtes sur le point de supprimer la tâche{' '}
                <strong>{currentRow.title}</strong>. <br />
                Cette action est irréversible.
              </>
            }
            confirmText='Supprimer'
          />
        </>
      )}
    </>
  )
}

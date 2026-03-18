import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { saveTask } from '@/lib/db'
import type { Task } from '@/lib/db'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { SelectDropdown } from '@/components/select-dropdown'
import { useTasks } from './tasks-provider'

type TaskMutateDrawerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow?: Task
}

const formSchema = z.object({
  title: z.string().min(1, 'Le titre est requis.'),
  status: z.string().min(1, 'Sélectionnez un statut.'),
  label: z.string().min(1, 'Sélectionnez une catégorie.'),
  priority: z.string().min(1, 'Sélectionnez une priorité.'),
  assigned_to: z.string().optional(),
  due_date: z.string().optional(),
  notes: z.string().optional(),
})
type TaskForm = z.infer<typeof formSchema>

export function TasksMutateDrawer({
  open,
  onOpenChange,
  currentRow,
}: TaskMutateDrawerProps) {
  const isUpdate = !!currentRow
  const { refreshData } = useTasks()

  const form = useForm<TaskForm>({
    resolver: zodResolver(formSchema),
    defaultValues: currentRow
      ? {
          title: currentRow.title,
          status: currentRow.status,
          label: currentRow.label,
          priority: currentRow.priority,
          assigned_to: currentRow.assigned_to ?? '',
          due_date: currentRow.due_date ?? '',
          notes: currentRow.notes ?? '',
        }
      : {
          title: '',
          status: 'a_faire',
          label: 'suivi',
          priority: 'moyenne',
          assigned_to: '',
          due_date: '',
          notes: '',
        },
  })

  const onSubmit = async (data: TaskForm) => {
    try {
      await saveTask({
        ...(currentRow?.id ? { id: currentRow.id } : {}),
        title: data.title,
        status: data.status as Task['status'],
        label: data.label as Task['label'],
        priority: data.priority as Task['priority'],
        assigned_to: data.assigned_to || null,
        due_date: data.due_date || null,
        notes: data.notes || null,
      })
      await refreshData()
      onOpenChange(false)
      form.reset()
      toast.success(isUpdate ? 'Tâche mise à jour.' : 'Tâche créée.')
    } catch {
      toast.error('Erreur lors de la sauvegarde.')
    }
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v)
        form.reset()
      }}
    >
      <SheetContent className='flex flex-col'>
        <SheetHeader className='text-start'>
          <SheetTitle>{isUpdate ? 'Modifier' : 'Nouvelle'} tâche</SheetTitle>
          <SheetDescription>
            {isUpdate
              ? 'Modifiez les informations de la tâche.'
              : 'Ajoutez une nouvelle tâche.'}
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form
            id='tasks-form'
            onSubmit={form.handleSubmit(onSubmit)}
            className='flex-1 space-y-5 overflow-y-auto px-4'
          >
            <FormField
              control={form.control}
              name='title'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Titre</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder='Intitulé de la tâche' />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='status'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Statut</FormLabel>
                  <SelectDropdown
                    defaultValue={field.value}
                    onValueChange={field.onChange}
                    placeholder='Sélectionner un statut'
                    items={[
                      { label: 'À faire', value: 'a_faire' },
                      { label: 'En cours', value: 'en_cours' },
                      { label: 'Terminé', value: 'termine' },
                      { label: 'Annulé', value: 'annule' },
                    ]}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='label'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Catégorie</FormLabel>
                  <SelectDropdown
                    defaultValue={field.value}
                    onValueChange={field.onChange}
                    placeholder='Sélectionner une catégorie'
                    items={[
                      { label: 'Suivi', value: 'suivi' },
                      { label: 'Admin', value: 'admin' },
                      { label: 'Commercial', value: 'commercial' },
                      { label: 'Logistique', value: 'logistique' },
                    ]}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='priority'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Priorité</FormLabel>
                  <SelectDropdown
                    defaultValue={field.value}
                    onValueChange={field.onChange}
                    placeholder='Sélectionner une priorité'
                    items={[
                      { label: 'Basse', value: 'basse' },
                      { label: 'Moyenne', value: 'moyenne' },
                      { label: 'Haute', value: 'haute' },
                      { label: 'Critique', value: 'critique' },
                    ]}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='assigned_to'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assigné à</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value ?? ''}
                      placeholder='Nom de la personne'
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='due_date'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Échéance</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value ?? ''}
                      type='date'
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='notes'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      value={field.value ?? ''}
                      placeholder='Notes supplémentaires...'
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
        <SheetFooter className='gap-2'>
          <SheetClose asChild>
            <Button variant='outline'>Annuler</Button>
          </SheetClose>
          <Button form='tasks-form' type='submit'>
            {isUpdate ? 'Enregistrer' : 'Créer'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

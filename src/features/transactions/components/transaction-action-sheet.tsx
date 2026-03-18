import { useEffect, useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  type Contact,
  type Transaction,
  getContacts,
  saveTransaction,
} from '@/lib/db'
import { ALL_STAGES, stageLabel } from '../stage-utils'

const formSchema = z.object({
  contact_id: z.string().min(1, 'Le contact est requis.'),
  stage: z.enum([
    'prospect',
    'visite_planifiee',
    'visite_effectuee',
    'devis_envoye',
    'relance',
    'signe',
    'perdu',
  ]),
  departure_city: z.string().optional(),
  departure_address: z.string().optional(),
  departure_postal_code: z.string().optional(),
  arrival_city: z.string().optional(),
  arrival_address: z.string().optional(),
  arrival_postal_code: z.string().optional(),
  moving_date: z.string().optional(),
  volume_m3: z.coerce.number().optional().or(z.literal('')),
  assigned_to: z.string().optional(),
  notes: z.string().optional(),
})

type TxForm = z.infer<typeof formSchema>

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow?: Transaction | null
  onSaved: (tx: Transaction) => void
}

export function TransactionActionSheet({
  open,
  onOpenChange,
  currentRow,
  onSaved,
}: Props) {
  const isEdit = !!currentRow
  const [contacts, setContacts] = useState<Contact[]>([])

  useEffect(() => {
    getContacts().then(setContacts).catch(() => {})
  }, [])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const form = useForm<TxForm>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      contact_id: '',
      stage: 'prospect',
      departure_city: '',
      departure_address: '',
      departure_postal_code: '',
      arrival_city: '',
      arrival_address: '',
      arrival_postal_code: '',
      moving_date: '',
      volume_m3: '',
      assigned_to: '',
      notes: '',
    },
  })

  useEffect(() => {
    if (open && currentRow) {
      form.reset({
        contact_id: currentRow.contact_id,
        stage: currentRow.stage,
        departure_city: currentRow.departure_city ?? '',
        departure_address: currentRow.departure_address ?? '',
        departure_postal_code: currentRow.departure_postal_code ?? '',
        arrival_city: currentRow.arrival_city ?? '',
        arrival_address: currentRow.arrival_address ?? '',
        arrival_postal_code: currentRow.arrival_postal_code ?? '',
        moving_date: currentRow.moving_date
          ? currentRow.moving_date.slice(0, 10)
          : '',
        volume_m3: currentRow.volume_m3 ?? '',
        assigned_to: currentRow.assigned_to ?? '',
        notes: currentRow.notes ?? '',
      })
    } else if (open && !currentRow) {
      form.reset({
        contact_id: '',
        stage: 'prospect',
        departure_city: '',
        departure_address: '',
        departure_postal_code: '',
        arrival_city: '',
        arrival_address: '',
        arrival_postal_code: '',
        moving_date: '',
        volume_m3: '',
        assigned_to: '',
        notes: '',
      })
    }
  }, [open, currentRow, form])

  async function onSubmit(values: TxForm) {
    try {
      const payload = {
        ...(isEdit ? { id: currentRow!.id } : {}),
        contact_id: values.contact_id,
        stage: values.stage,
        departure_city: values.departure_city || null,
        departure_address: values.departure_address || null,
        departure_postal_code: values.departure_postal_code || null,
        departure_floor: null,
        departure_elevator: null,
        departure_lift: null,
        arrival_city: values.arrival_city || null,
        arrival_address: values.arrival_address || null,
        arrival_postal_code: values.arrival_postal_code || null,
        arrival_floor: null,
        arrival_elevator: null,
        arrival_lift: null,
        moving_date: values.moving_date || null,
        volume_m3: values.volume_m3 !== '' ? Number(values.volume_m3) : null,
        assigned_to: values.assigned_to || null,
        pandadoc_doc_id: isEdit ? currentRow!.pandadoc_doc_id : null,
        pandadoc_status: isEdit ? currentRow!.pandadoc_status : null,
        lost_reason: isEdit ? currentRow!.lost_reason : null,
        notes: values.notes || null,
      }
      const saved = await saveTransaction(payload)
      toast.success(
        isEdit ? 'Transaction mise à jour.' : 'Transaction créée.'
      )
      onSaved(saved)
      onOpenChange(false)
    } catch {
      toast.error('Une erreur est survenue.')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='flex flex-col gap-0 overflow-y-auto sm:max-w-lg'>
        <DialogHeader className='text-start'>
          <DialogTitle>
            {isEdit ? 'Modifier la transaction' : 'Nouvelle transaction'}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Modifiez les informations de la transaction.'
              : 'Renseignez les informations de la nouvelle transaction.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            id='transaction-form'
            onSubmit={form.handleSubmit(onSubmit)}
            className='flex flex-1 flex-col gap-4 px-1 py-4'
          >
            <FormField
              control={form.control}
              name='contact_id'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={isEdit}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder='Sélectionner un contact' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {contacts.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.first_name} {c.last_name}
                          {c.company_name ? ` (${c.company_name})` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='stage'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Étape</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner l'étape" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {ALL_STAGES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {stageLabel(s)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className='grid grid-cols-2 gap-4'>
              <FormField
                control={form.control}
                name='departure_city'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ville départ</FormLabel>
                    <FormControl>
                      <Input placeholder='Paris' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='arrival_city'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ville arrivée</FormLabel>
                    <FormControl>
                      <Input placeholder='Lyon' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className='grid grid-cols-2 gap-4'>
              <FormField
                control={form.control}
                name='departure_address'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Adresse départ</FormLabel>
                    <FormControl>
                      <Input placeholder='12 rue de la Paix' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='arrival_address'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Adresse arrivée</FormLabel>
                    <FormControl>
                      <Input placeholder='5 avenue Foch' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className='grid grid-cols-3 gap-4'>
              <FormField
                control={form.control}
                name='moving_date'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date déménagement</FormLabel>
                    <FormControl>
                      <Input type='date' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='volume_m3'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Volume (m³)</FormLabel>
                    <FormControl>
                      <Input
                        type='number'
                        placeholder='25'
                        {...field}
                        value={field.value as string | number}
                      />
                    </FormControl>
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
                      <Input placeholder='Nom' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name='notes'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder='Notes internes...'
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
        <DialogFooter className='gap-2'>
          <Button
            variant='outline'
            onClick={() => onOpenChange(false)}
            type='button'
          >
            Annuler
          </Button>
          <Button
            type='submit'
            form='transaction-form'
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting && (
              <Loader2 className='animate-spin' />
            )}
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

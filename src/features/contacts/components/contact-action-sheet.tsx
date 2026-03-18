import { useEffect } from 'react'
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
import { type Contact, saveContact } from '@/lib/db'

const formSchema = z.object({
  first_name: z.string().min(1, 'Le prénom est requis.'),
  last_name: z.string().min(1, 'Le nom est requis.'),
  type: z.enum(['particulier', 'entreprise']),
  company_name: z.string().optional(),
  email: z.string().email('Email invalide.').optional().or(z.literal('')),
  phone: z.string().optional(),
  source: z
    .enum(['dem24', 'tel', 'email', 'website', 'parrainage'])
    .optional()
    .or(z.literal('')),
})

type ContactForm = z.infer<typeof formSchema>

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow?: Contact | null
  onSaved: (contact: Contact) => void
}

export function ContactActionSheet({
  open,
  onOpenChange,
  currentRow,
  onSaved,
}: Props) {
  const isEdit = !!currentRow

  const form = useForm<ContactForm>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      type: 'particulier',
      company_name: '',
      email: '',
      phone: '',
      source: '',
    },
  })

  useEffect(() => {
    if (open && currentRow) {
      form.reset({
        first_name: currentRow.first_name,
        last_name: currentRow.last_name,
        type: currentRow.type,
        company_name: currentRow.company_name ?? '',
        email: currentRow.email ?? '',
        phone: currentRow.phone ?? '',
        source: currentRow.source ?? '',
      })
    } else if (open && !currentRow) {
      form.reset({
        first_name: '',
        last_name: '',
        type: 'particulier',
        company_name: '',
        email: '',
        phone: '',
        source: '',
      })
    }
  }, [open, currentRow, form])

  async function onSubmit(values: ContactForm) {
    try {
      const payload = {
        ...(isEdit ? { id: currentRow!.id } : {}),
        first_name: values.first_name,
        last_name: values.last_name,
        type: values.type,
        company_name: values.company_name || null,
        email: values.email || null,
        phone: values.phone || null,
        source: (values.source || null) as Contact['source'],
      }
      const saved = await saveContact(payload)
      toast.success(isEdit ? 'Contact mis à jour.' : 'Contact créé.')
      onSaved(saved)
      onOpenChange(false)
    } catch {
      toast.error('Une erreur est survenue.')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='flex flex-col gap-0 overflow-y-auto sm:max-w-md'>
        <DialogHeader className='text-start'>
          <DialogTitle>
            {isEdit ? 'Modifier le contact' : 'Nouveau contact'}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Modifiez les informations du contact.'
              : 'Renseignez les informations du nouveau contact.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            id='contact-form'
            onSubmit={form.handleSubmit(onSubmit)}
            className='flex flex-1 flex-col gap-4 px-1 py-4'
          >
            <div className='grid grid-cols-2 gap-4'>
              <FormField
                control={form.control}
                name='first_name'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prénom *</FormLabel>
                    <FormControl>
                      <Input placeholder='Jean' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='last_name'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom *</FormLabel>
                    <FormControl>
                      <Input placeholder='Dupont' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name='type'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder='Sélectionner un type' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value='particulier'>Particulier</SelectItem>
                      <SelectItem value='entreprise'>Entreprise</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='company_name'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Entreprise</FormLabel>
                  <FormControl>
                    <Input placeholder='Acme SA' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='email'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type='email'
                      placeholder='jean.dupont@email.com'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='phone'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Téléphone</FormLabel>
                  <FormControl>
                    <Input placeholder='+33 6 00 00 00 00' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='source'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Source</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder='Sélectionner une source' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value='dem24'>Dem24</SelectItem>
                      <SelectItem value='tel'>Téléphone</SelectItem>
                      <SelectItem value='email'>Email</SelectItem>
                      <SelectItem value='website'>Site web</SelectItem>
                      <SelectItem value='parrainage'>Parrainage</SelectItem>
                    </SelectContent>
                  </Select>
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
            form='contact-form'
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

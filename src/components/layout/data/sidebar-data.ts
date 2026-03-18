import {
  LayoutDashboard,
  Users,
  ArrowLeftRight,
  Settings,
  UserCog,
  Wrench,
  Palette,
  Bell,
  Monitor,
  Command,
  HardHat,
  ClipboardList,
  ListChecks,
  CheckSquare,
  CalendarDays,
  FileText,
  BookOpen,
  Plug,
} from 'lucide-react'
import { type SidebarData } from '../types'

export const sidebarData: SidebarData = {
  user: {
    name: 'Griffon Movers',
    email: '',
    avatar: '/avatars/shadcn.jpg',
  },
  teams: [
    {
      name: 'Griffon Movers',
      logo: Command,
      plan: 'Déménagement',
    },
  ],
  navGroups: [
    {
      title: 'Principal',
      items: [
        {
          title: 'Dashboard',
          url: '/',
          icon: LayoutDashboard,
        },
        {
          title: 'Contacts',
          url: '/contacts',
          icon: Users,
        },
        {
          title: 'Transactions',
          url: '/transactions',
          icon: ArrowLeftRight,
        },
        {
          title: 'Tâches',
          url: '/tasks',
          icon: CheckSquare,
        },
        {
          title: 'Devis',
          url: '/devis',
          icon: FileText,
        },
      ],
    },
    {
      title: 'Exploitation',
      items: [
        {
          title: 'Chantiers',
          url: '/exploitation/chantiers',
          icon: HardHat,
        },
        {
          title: 'Déménageurs',
          url: '/exploitation/demenageurs',
          icon: ClipboardList,
        },
        {
          title: 'Checklist',
          url: '/exploitation/taches',
          icon: ListChecks,
        },
        {
          title: 'Calendrier',
          url: '/exploitation/calendrier',
          icon: CalendarDays,
        },
      ],
    },
    {
      title: 'Autre',
      items: [
        {
          title: 'Paramètres',
          icon: Settings,
          items: [
            {
              title: 'Profil',
              url: '/settings',
              icon: UserCog,
            },
            {
              title: 'Compte',
              url: '/settings/account',
              icon: Wrench,
            },
            {
              title: 'Apparence',
              url: '/settings/appearance',
              icon: Palette,
            },
            {
              title: 'Notifications',
              url: '/settings/notifications',
              icon: Bell,
            },
            {
              title: 'Affichage',
              url: '/settings/display',
              icon: Monitor,
            },
            {
              title: 'Catalogue',
              url: '/catalogue',
              icon: BookOpen,
            },
            {
              title: 'Intégrations',
              url: '/settings/integrations',
              icon: Plug,
            },
          ],
        },
      ],
    },
  ],
}

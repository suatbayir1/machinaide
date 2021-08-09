import { IconFont } from '@influxdata/clockface'

export interface NavItemLink {
  type: 'link' | 'href'
  location: string
}

export interface NavSubItem {
  id: string
  testID: string
  label: string
  link: NavItemLink
  cloudExclude?: boolean
  cloudOnly?: boolean
  featureFlag?: string
  featureFlagValue?: boolean
}

export interface NavItem {
  id: string
  testID: string
  label: string
  shortLabel?: string
  link: NavItemLink
  icon: IconFont
  cloudExclude?: boolean
  cloudOnly?: boolean
  featureFlag?: string
  featureFlagValue?: boolean
  menu?: NavSubItem[]
  activeKeywords: string[]
  permitted?: string[]
}

export const generateNavItems = (orgID: string): NavItem[] => {
  const orgPrefix = `/orgs/${orgID}`

  return [
    {
      id: 'load-data',
      testID: 'nav-item-load-data',
      icon: IconFont.DisksNav,
      label: 'Load Data',
      shortLabel: 'Data',
      link: {
        type: 'link',
        location: `${orgPrefix}/load-data/sources`,
      },
      activeKeywords: ['load-data'],
      menu: [
        {
          id: 'sources',
          testID: 'nav-subitem-sources',
          label: 'Sources',
          link: {
            type: 'link',
            location: `${orgPrefix}/load-data/sources`,
          },
        },
        {
          id: 'buckets',
          testID: 'nav-subitem-buckets',
          label: 'Buckets',
          link: {
            type: 'link',
            location: `${orgPrefix}/load-data/buckets`,
          },
        },
        {
          id: 'telegrafs',
          testID: 'nav-subitem-telegrafs',
          label: 'Telegraf',
          link: {
            type: 'link',
            location: `${orgPrefix}/load-data/telegrafs`,
          },
        },
        {
          id: 'scrapers',
          testID: 'nav-subitem-scrapers',
          label: 'Scrapers',
          link: {
            type: 'link',
            location: `${orgPrefix}/load-data/scrapers`,
          },
          cloudExclude: true,
        },
        {
          id: 'tokens',
          testID: 'nav-subitem-tokens',
          label: 'Tokens',
          link: {
            type: 'link',
            location: `${orgPrefix}/load-data/tokens`,
          },
        },
      ],
    },
    {
      id: 'data-explorer',
      testID: 'nav-item-data-explorer',
      icon: IconFont.GraphLine,
      label: 'Data Explorer',
      shortLabel: 'Explore',
      link: {
        type: 'link',
        location: `${orgPrefix}/data-explorer`,
      },
      activeKeywords: ['data-explorer'],
    },
    {
      id: 'flows',
      testID: 'nav-item-flows',
      icon: IconFont.Erlenmeyer,
      label: 'Flows',
      featureFlag: 'notebooks',
      shortLabel: 'Flows',
      link: {
        type: 'link',
        location: `${orgPrefix}/flows`,
      },
      activeKeywords: ['flows'],
    },
    {
      id: 'dashboards',
      testID: 'nav-item-dashboards',
      icon: IconFont.Dashboards,
      label: 'Dashboards',
      shortLabel: 'Boards',
      link: {
        type: 'link',
        location: `${orgPrefix}/dashboards-list`,
      },
      activeKeywords: ['dashboards'],
    },
    {
      id: 'tasks',
      testID: 'nav-item-tasks',
      icon: IconFont.Calendar,
      label: 'Tasks',
      link: {
        type: 'link',
        location: `${orgPrefix}/tasks`,
      },
      activeKeywords: ['tasks'],
    },
    {
      id: 'alerting',
      testID: 'nav-item-alerting',
      icon: IconFont.Bell,
      label: 'Alerts',
      link: {
        type: 'link',
        location: `${orgPrefix}/alerting`,
      },
      activeKeywords: ['alerting'],
      menu: [
        {
          id: 'history',
          testID: 'nav-subitem-history',
          label: 'Alert History',
          link: {
            type: 'link',
            location: `${orgPrefix}/alert-history`,
          },
        },
      ],
    },
    {
      id: 'settings',
      testID: 'nav-item-settings',
      icon: IconFont.WrenchNav,
      label: 'Settings',
      link: {
        type: 'link',
        location: `${orgPrefix}/settings/variables`,
      },
      activeKeywords: ['settings'],
      menu: [
        {
          id: 'variables',
          testID: 'nav-subitem-variables',
          label: 'Variables',
          link: {
            type: 'link',
            location: `${orgPrefix}/settings/variables`,
          },
        },
        {
          id: 'templates',
          testID: 'nav-subitem-templates',
          label: 'Templates',
          link: {
            type: 'link',
            location: `${orgPrefix}/settings/templates`,
          },
        },
        {
          id: 'labels',
          testID: 'nav-subitem-labels',
          label: 'Labels',
          link: {
            type: 'link',
            location: `${orgPrefix}/settings/labels`,
          },
        },
      ],
    },
    {
      id: 'dt',
      testID: 'nav-item-dt',
      icon: IconFont.Pulse,
      label: 'DT',
      link: {
        type: 'link',
        location: `${orgPrefix}/dt`,
      },
      activeKeywords: ['dt'],
      permitted: ['member', 'admin', 'editor'],
    },
    {
      id: 'object-creator',
      testID: 'nav-item-obect-creator',
      icon: IconFont.Cube,
      label: 'Object Creator',
      link: {
        type: 'link',
        location: `${orgPrefix}/object-creator`,
      },
      activeKeywords: ['object-creator'],
      permitted: ["admin"],
    },
    {
      id: 'allFactories',
      testID: 'nav-item-allFactories',
      icon: IconFont.Server,
      label: 'Factories',
      link: {
        type: 'link',
        location: `${orgPrefix}/allFactories`,
      },
      activeKeywords: ['allFactories'],
      permitted: ["member", "admin", "editor"],
    },
    {
      id: 'logs',
      testID: 'nav-item-logs',
      icon: IconFont.Search,
      label: 'Logs',
      link: {
        type: 'link',
        location: `${orgPrefix}/logs`,
      },
      activeKeywords: ['logs'],
      permitted: ["admin"],
    },
    {
      id: 'examples',
      testID: 'nav-item-examples',
      icon: IconFont.Erlenmeyer,
      label: 'Example',
      link: {
        type: 'link',
        location: `${orgPrefix}/examples`,
      },
      activeKeywords: ['examples'],
      permitted: ["member", "admin", "editor"],
    },
    {
      id: 'userManual',
      testID: 'nav-item-user-manual',
      icon: IconFont.Annotate,
      label: 'User Manual',
      link: {
        type: 'link',
        location: `${orgPrefix}/user-manual`,
      },
      activeKeywords: ['userManual'],
      permitted: ["admin", "editor", "member"],
    },
    {
      id: 'ml',
      testID: 'nav-item-ml',
      icon: IconFont.Alerts,
      label: 'ML',
      link: {
        type: 'link',
        location: `${orgPrefix}/ml`,
      },
      activeKeywords: ['ml'],
      permitted: ["admin", "editor", "member"],
    },
  ]
}

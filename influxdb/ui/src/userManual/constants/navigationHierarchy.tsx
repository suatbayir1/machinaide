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
            permitted: ["member", "admin", "editor"],
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
            permitted: ["admin", "editor"]
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
            permitted: ["admin", "editor"]
        },
    ]
}

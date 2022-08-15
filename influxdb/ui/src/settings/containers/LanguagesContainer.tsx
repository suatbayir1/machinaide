// Libraries
import React, { PureComponent } from 'react'
import { connect } from 'react-redux'
import i18next from "i18next";

// Components
import SettingsTabbedPage from 'src/settings/components/SettingsTabbedPage'
import SettingsHeader from 'src/settings/components/SettingsHeader'
import { Page, Grid, Columns, Form, Dropdown, ComponentSize, FlexBox } from '@influxdata/clockface'
import GetResources from 'src/resources/components/GetResources'

// Utils
import { pageTitleSuffixer } from 'src/shared/utils/pageTitles'
import { getOrg } from 'src/organizations/selectors'

// Types
import { AppState, Organization, ResourceType } from 'src/types'

interface StateProps {
    org: Organization
}

class LanguagesContainer extends PureComponent<StateProps> {
    private change = (option) => {
        localStorage.setItem('lang', option);
        window.location.reload();
    }

    public render() {
        const { org } = this.props
        const lang = localStorage.getItem('lang') || 'en';

        return (
            <>
                <Page titleTag={pageTitleSuffixer(['Languages', 'Settings'])} className="show-only-pc">
                    <SettingsHeader />
                    <SettingsTabbedPage activeTab="languages" orgID={org.id}>
                        <GetResources resources={[ResourceType.Labels]}>
                            <Grid.Column
                                widthXS={Columns.Six}
                                widthSM={Columns.Three}
                                widthMD={Columns.Six}
                                widthLG={Columns.Twelve}
                            >
                                <Form.Element label={i18next.t("select_language")}>
                                    <Dropdown
                                        button={(active, onClick) => (
                                            <Dropdown.Button
                                                onClick={onClick}
                                                active={active}
                                                style={{ width: '200px' }}
                                                size={ComponentSize.Medium}
                                            >
                                                {
                                                    lang === "tr" ?
                                                        <FlexBox
                                                            margin={ComponentSize.Large}
                                                        >
                                                            <img src="../../../assets/icons/turkish-flag.png" width={50} height={50} /> <h5>Türkçe</h5>
                                                        </FlexBox>
                                                        :
                                                        <FlexBox
                                                            margin={ComponentSize.Large}
                                                        >
                                                            <img src="../../../assets/icons/us-flag.png" width={50} height={50} /> <h5>English</h5>
                                                        </FlexBox>
                                                }
                                            </Dropdown.Button>
                                        )}
                                        menu={onCollapse => (
                                            <Dropdown.Menu
                                                onCollapse={onCollapse}
                                                style={{ width: '200px' }}
                                            >
                                                <Dropdown.Item
                                                    key={"tr"}
                                                    value={"tr"}
                                                    onClick={(e) => { this.change(e) }}
                                                    selected={"tr" === lang}
                                                >
                                                    <FlexBox
                                                        margin={ComponentSize.Large}
                                                    >
                                                        <img src="../../../assets/icons/turkish-flag.png" width={50} height={50} /> <h5>Türkçe</h5>
                                                    </FlexBox>
                                                </Dropdown.Item>
                                                <Dropdown.Item
                                                    key={"en"}
                                                    value={"en"}
                                                    onClick={(e) => { this.change(e) }}
                                                    selected={"en" === lang}
                                                >
                                                    <FlexBox
                                                        margin={ComponentSize.Large}
                                                    >
                                                        <img src="../../../assets/icons/us-flag.png" width={50} height={50} /> <h5>English</h5>
                                                    </FlexBox>
                                                </Dropdown.Item>
                                            </Dropdown.Menu>
                                        )}
                                    />
                                </Form.Element>
                            </Grid.Column>
                        </GetResources>
                    </SettingsTabbedPage>
                </Page>
            </>
        )
    }
}

const mstp = (state: AppState) => ({ org: getOrg(state) })

export default connect<StateProps>(mstp)(LanguagesContainer)

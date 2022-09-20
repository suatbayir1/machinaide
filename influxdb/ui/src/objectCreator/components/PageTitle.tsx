// Libraries
import React from "react";

// Components
import { Page, ComponentColor, QuestionMarkTooltip, InfluxColors, } from '@influxdata/clockface'

// Constants
import { tipStyle, dtManagementPage, } from 'src/shared/constants/tips';

const PageTitle = () => {
    return (
        <Page.Header fullWidth={true}>
            <Page.Title title={"Digital Twin Management"}></Page.Title>
            <QuestionMarkTooltip
                style={{ marginBottom: '8px' }}
                diameter={30}
                tooltipStyle={{ width: '400px' }}
                color={ComponentColor.Secondary}
                tooltipContents={<div style={{ whiteSpace: 'pre-wrap', fontSize: "13px" }}>
                    <div style={{ color: InfluxColors.Star }}>{"About the Digital Twin Monitor Page:"}
                        <hr style={tipStyle} />
                    </div>
                    {dtManagementPage}
                </div>}
            />
        </Page.Header>
    )
}

export default PageTitle;
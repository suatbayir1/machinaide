// Libraries
import { BorderType, Button, ButtonShape, Columns, ComponentColor, ComponentSize, Dropdown, Grid, Page, Panel, SelectGroup, Table } from '@influxdata/clockface';
import React, { PureComponent } from 'react'

//Components
import * as api from '../components/api'


interface Props {}

interface State {
    models: any[],
    selectedModelObject: any,
    selectedModel: String,
    type: String
}

class RetrainControlPage extends PureComponent<Props, State> {
    constructor(props) {
        super(props)

        this.state = {
            models: [],
            selectedModelObject: {modelName: ""},
            selectedModel: "",
            type: ""
        }
    }


    componentDidMount() {
        console.log(this.props);

        this.getModels();
    }

    handleRadioClick (e) {
        console.log(this.state.selectedModelObject)
        let pkg = {
            retrainMethod: e,
            modelID: this.state.selectedModelObject.modelID
        }

        api.updateRetrainMethod(pkg).then(() => {this.getModels()})

        // this.getModels()
    }

    getModels() {
        api.getBasicModels().then(models => {
            this.setState({ models: models })
        })    
    }

    onModelChange = (e) => {
        console.log(e)
        let modelObject = this.state.models.find(obj => obj.modelID === e)
        this.setState({ selectedModel: modelObject.modelName, selectedModelObject: modelObject})
    }

    private get modelItems(): JSX.Element[] {
        return this.state.models.map((model) => {
            return <Dropdown.Item
                    testID="dropdown-item generate-token--read-write"
                    id={model.modelID}
                    key={model.modelID}
                    value={model.modelID}
                    onClick={this.onModelChange}>
                        {model.modelName}
                    </Dropdown.Item>
        })
        // return [
        //     <Dropdown.Item
        //         testID="dropdown-item generate-token--read-write"
        //         id={"option1"}
        //         key={"option1"}
        //         value={"Perform anomaly detection"}
        //         onClick={this.onTaskChange}
        //     >
        //         Perform anomaly detection
        //       </Dropdown.Item>,
        //     <Dropdown.Item
        //         testID="dropdown-item generate-token--all-access"
        //         id={"option2"}
        //         key={"option2"}
        //         value={"Learn the remaining useful lifetime"}
        //         onClick={this.onTaskChange}
        //     >
        //         Learn the remaining useful lifetime
        //       </Dropdown.Item>,
        //     <Dropdown.Item
        //         testID="dropdown-item generate-token--all-access"
        //         id={"option3"}
        //         key={"option3"}
        //         value={"Learn the probability of failure"}
        //         onClick={this.onTaskChange}
        //     >
        //         Learn the probability of failure
        //     </Dropdown.Item>,
        // ]
    }

    public render(): JSX.Element {
        console.log(this.state.selectedModelObject)
        return <Page>
            <Page.Header fullWidth={true}>
                <Page.Title title={"Retrain Control Panel"} />
            </Page.Header>

            <Page.Contents fullWidth={true} scrollable={true}>
                <Grid>
                    <Grid.Row>
                        <Grid.Column
                            widthXS={Columns.Four}
                            widthSM={Columns.Four}
                            widthMD={Columns.Four}
                            widthLG={Columns.Four}
                            style={{ marginTop: '20px' }}
                        >
                            <Panel>
                                <Panel.Header size={ComponentSize.ExtraSmall}>
                                    <p className="preview-data-margins">Training Options</p>
                                </Panel.Header>
                                <Panel.Body size={ComponentSize.ExtraSmall}>
                                    <Table
                                        borders={BorderType.Vertical}
                                        fontSize={ComponentSize.ExtraSmall}
                                        cellPadding={ComponentSize.ExtraSmall}
                                    >
                                        <Table.Header>
                                            <Table.Row>
                                                <Table.HeaderCell>Models</Table.HeaderCell>
                                            </Table.Row>
                                        </Table.Header>
                                        <Table.Body>
                                            <Table.Row>
                                                <Table.Cell>
                                                <Dropdown
                                                    testID="dropdown--gen-token"
                                                    style={{width: '160px'}}
                                                    button={(active, onClick) => (
                                                        <Dropdown.Button
                                                            active={active}
                                                            onClick={onClick}
                                                            color={ComponentColor.Primary}
                                                            testID="dropdown-button--gen-token">
                                                                {this.state.selectedModel}
                                                            </Dropdown.Button>
                                                    )}
                                                    menu={onCollapse => (
                                                        <Dropdown.Menu onCollapse={onCollapse}>
                                                            {this.modelItems}
                                                        </Dropdown.Menu>
                                                    )}/>
                                                </Table.Cell>
                                                <Table.Cell>
                                                <SelectGroup
                                                    shape={ButtonShape.StretchToFit}
                                                    className="retention--radio"
                                                    >
                                                    <SelectGroup.Option
                                                        name="bucket-retention"
                                                        id="never"
                                                        testID="retention-never--button"
                                                        active={this.state.selectedModelObject.retrainMethod === "nothing"}
                                                        onClick={this.handleRadioClick.bind(this)}
                                                        value="nothing"
                                                        titleText="Never delete data"
                                                    >
                                                        Do nothing
                                                    </SelectGroup.Option>
                                                    <SelectGroup.Option
                                                        name="bucket-retention"
                                                        id="intervals"
                                                        active={this.state.selectedModelObject.retrainMethod === "retrain"}
                                                        onClick={this.handleRadioClick.bind(this)}
                                                        value="retrain"
                                                        testID="retention-intervals--button"
                                                        titleText="Delete data older than a duration"
                                                    >
                                                        Retrain
                                                    </SelectGroup.Option>
                                                    <SelectGroup.Option
                                                        name="bucket-retention"
                                                        id="intervals"
                                                        active={this.state.selectedModelObject.retrainMethod === "retrain-hpc"}
                                                        onClick={this.handleRadioClick.bind(this)}
                                                        value="retrain-hpc"
                                                        testID="retention-intervals--button"
                                                        titleText="Delete data older than a duration"
                                                    >
                                                        HPC
                                                    </SelectGroup.Option>
                                                </SelectGroup>
                                                </Table.Cell>
                                            </Table.Row>
                                        </Table.Body>
                                    </Table>
                                    <br />
                                </Panel.Body>
                            </Panel>
                        </Grid.Column>
                        <Grid.Column
                            widthXS={Columns.Five}
                            widthSM={Columns.Five}
                            widthMD={Columns.Five}
                            widthLG={Columns.Five}
                            style={{ marginTop: '20px' }}>
                            <Panel>
                                <Panel.Body size={ComponentSize.ExtraSmall}>
                                <Table
                                    borders={BorderType.Vertical}
                                    fontSize={ComponentSize.ExtraSmall}
                                    cellPadding={ComponentSize.ExtraSmall}
                                >
                                    <Table.Header>
                                        <Table.Row>
                                            <Table.HeaderCell>Models</Table.HeaderCell>
                                            <Table.HeaderCell>Hardware</Table.HeaderCell>
                                            <Table.HeaderCell>Task</Table.HeaderCell>
                                            <Table.HeaderCell>Algorithm</Table.HeaderCell>
                                            <Table.HeaderCell>Status</Table.HeaderCell>

                                        </Table.Row>
                                    </Table.Header>
                                    <Table.Body>
                                        <Table.Row>
                                            <Table.Cell>
                                                {this.state.selectedModelObject.modelName}
                                            </Table.Cell>
                                            <Table.Cell>
                                                {this.state.selectedModelObject.hardware}
                                            </Table.Cell>
                                            <Table.Cell>
                                                {this.state.selectedModelObject.task}
                                            </Table.Cell>
                                            <Table.Cell>
                                                {this.state.selectedModelObject.algorithm}
                                            </Table.Cell>
                                            <Table.Cell>
                                                {this.state.selectedModelObject.status}
                                            </Table.Cell>
                                        </Table.Row></Table.Body></Table>
                                </Panel.Body>
                            </Panel>
                        </Grid.Column>
                        </Grid.Row></Grid></Page.Contents></Page>;
    }

}

export default RetrainControlPage
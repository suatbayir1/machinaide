// Libraries
import React, { PureComponent } from 'react'
// Components
import { Page, 
    Grid, 
    Columns, 
    RemoteDataState,
    ComponentSize,
    InputType,
    BorderType,
    Dropdown,
    ComponentColor,
    Button,
    ButtonType,
    Panel,
    Input,
    Table,
    FlexBox,
    Popover,
    Appearance,
    DateRangePicker,
    IconFont,
    PopoverInteraction,
    PopoverPosition,
    SquareButton
} from '@influxdata/clockface'
import ModelTable from 'src/ml/components/MLTable'
import { Link } from 'react-router-dom'

interface Props { }

interface State {
    selected: string[],
    headers: string[],
    modelName: string,
    database: string,
    task: string,
    component: string,
    aggregateFunction: string,
    extraDropdown: boolean
}


// let placeHolderModels = [{
//     modelID: "2345236",
//     hardware: "jcopress",
//     modelName: "AnomalyModel1",
//     algorithm: "Anomaly Detection",
//     status: "idle"
// }, {
//     modelID: "45645745",
//     hardware: "jcopress",
//     modelName: "AnomalyModel2",
//     algorithm: "Anomaly Detection",
//     status: "train"
// }, {
//     modelID: "32536",
//     hardware: "jcopress",
//     modelName: "PrognosticModel1",
//     algorithm: "RUL",
//     status: "idle"
// }, {
//     modelID: "346212345",
//     hardware: "jcopress",
//     modelName: "AnomalyModel3",
//     algorithm: "Anomaly Detection",
//     status: "idle"
// }, {
//     modelID: "6325432",
//     hardware: "jcopress",
//     modelName: "PrognosticModel2",
//     algorithm: "RUL",
//     status: "train"
// }, {
//     modelID: "4567",
//     hardware: "jcopress",
//     modelName: "PrognosticModel3",
//     algorithm: "RUL",
//     status: "running"
// }, {
//     modelID: "3253435246",
//     hardware: "jcopress",
//     modelName: "PrognosticModel4",
//     algorithm: "RUL",
//     status: "running"
// },]
let placeHolderModels = []


class MLPage extends PureComponent<Props, State> {
    constructor(props) {
        super(props)

        this.state = {
            selected: ["I want to..."],
            headers: ["I want to...", "Database", "Component"],
            modelName: "",
            database: "",
            component: "",
            task: "",
            aggregateFunction: "",
            extraDropdown: false
        }
    }

    onTaskChange = (e) => {
        this.setState({task: e, extraDropdown: (e === "Learn the probability of failure")})
    }

    onDatabaseChange = (e) => {
        this.setState({database: e})
    }

    onComponentChange = (e) => {
        this.setState({component: e})
    }

    onAggregateChange = (e) => {
        this.setState({aggregateFunction: e})
    }

    private get jobItems(): JSX.Element[] {
        return [
          <Dropdown.Item
            testID="dropdown-item generate-token--read-write"
            id={"option1"}
            key={"option1"}
            value={"Perform anomaly detection"}
            onClick={this.onTaskChange}
          >
            Perform anomaly detection
              </Dropdown.Item>,
          <Dropdown.Item
            testID="dropdown-item generate-token--all-access"
            id={"option2"}
            key={"option2"}
            value={"Learn the remaining useful lifetime"}
            onClick={this.onTaskChange}
          >
            Learn the remaining useful lifetime
              </Dropdown.Item>,
          <Dropdown.Item
            testID="dropdown-item generate-token--all-access"
            id={"option3"}
            key={"option3"}
            value={"Learn the probability of failure"}
            onClick={this.onTaskChange}
        >
            Learn the probability of failure
            </Dropdown.Item>,
        ]
      }
    private get databaseItems(): JSX.Element[] {
        return [
            <Dropdown.Item
            testID="dropdown-item generate-token--read-write"
            id={"database1"}
            key={"database1"}
            value={"JCOPress"}
            onClick={this.onDatabaseChange}
            >
            JCOPress
                </Dropdown.Item>
        ]
    }
    private get componentItems(): JSX.Element[] {
        return [
            <Dropdown.Item
            testID="dropdown-item generate-token--read-write"
            id={"component1"}
            key={"component1"}
            value={"component1"}
            onClick={this.onComponentChange}
            >
            Component1
                </Dropdown.Item>,
            <Dropdown.Item
            testID="dropdown-item generate-token--read-write"
            id={"component2"}
            key={"component2"}
            value={"component2"}
            onClick={this.onComponentChange}
            >
            Component2
                </Dropdown.Item>
        ]
    }

    private get optionsComponents(): JSX.Element {
        return (
            <React.Fragment>
                <FlexBox margin={ComponentSize.Small} style={{ marginRight: '10%' }}>
                    <Link to={`/orgs/${this.props["match"].params["orgID"]}/advanced-ml`}>
                        <Button
                            text="Advanced ML"
                            onClick={() => { console.log("Advanced") }}
                            type={ButtonType.Button}
                            icon={IconFont.Search}
                            color={ComponentColor.Primary}
                        />
                    </Link>
                </FlexBox>
            </React.Fragment>
        )
    }

    private get extraItems(): JSX.Element[] {
        return [
            <Dropdown.Item
            testID="dropdown-item generate-token--read-write"
            id={"max"}
            key={"max"}
            value={"max"}
            onClick={this.onAggregateChange}
            >
            Max
                </Dropdown.Item>,
            <Dropdown.Item
            testID="dropdown-item generate-token--read-write"
            id={"mean"}
            key={"mean"}
            value={"mean"}
            onClick={this.onAggregateChange}
            >
            Mean
                </Dropdown.Item>
        ]
    }

    onGoClicked = () => {
        
    }

    public render(): JSX.Element {
        const {selected, headers} = this.state
        const dropdownItems = [
            this.jobItems,
            this.databaseItems,
            this.componentItems,
            this.extraItems
        ]
        return (
            <Page>
                <Page.Header fullWidth={true}>
                    <Page.Title title={"Machine Learning"} />
                    {
                        this.optionsComponents
                    }
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
                                        <Table.HeaderCell>Options</Table.HeaderCell>
                                        </Table.Row>
                                    </Table.Header>
                                    <Table.Body>
                                    {headers.map((header, i) => (
                                        <Table.Row key={header}>
                                            <Table.Cell>{header}</Table.Cell>
                                            <Table.Cell>
                                            <Dropdown
                                                testID="dropdown--gen-token"
                                                style={{ width: '160px' }}
                                                button={(active, onClick) => (
                                                <Dropdown.Button
                                                    active={active}
                                                    onClick={onClick}
                                                    color={ComponentColor.Primary}
                                                    testID="dropdown-button--gen-token"
                                                >
                                                    {header === "I want to..." ? (this.state.task):(
                                                        header === "Database" ? (this.state.database) : (this.state.component)
                                                    )}
                                                </Dropdown.Button>
                                                )}
                                                menu={onCollapse => (
                                                <Dropdown.Menu onCollapse={onCollapse}>
                                                    {dropdownItems[i]}
                                                </Dropdown.Menu>
                                                )}
                                            />
                                            </Table.Cell>
                                        </Table.Row>
                                        ))}
                                        <Table.Row key={"Model Name"}>
                                            <Table.Cell>{"Model Name"}</Table.Cell>
                                            <Table.Cell>
                                                <Input
                                                onChange={(e) => this.setState({ modelName: e.target.value })}
                                                name=""
                                                testID="input-field"
                                                type={InputType.Text}
                                                value={this.state.modelName}
                                                placeholder="input example"
                                                />
                                            </Table.Cell>
                                        </Table.Row>
                                        {this.state.extraDropdown ? (
                                            <Table.Row key={"Aggregate Function"}>
                                                <Table.Cell>{"Aggregate Function"}</Table.Cell>
                                                <Table.Cell>
                                                <Dropdown
                                                    testID="dropdown--gen-token"
                                                    style={{ width: '160px' }}
                                                    button={(active, onClick) => (
                                                    <Dropdown.Button
                                                        active={active}
                                                        onClick={onClick}
                                                        color={ComponentColor.Primary}
                                                        testID="dropdown-button--gen-token"
                                                    >
                                                        {this.state.aggregateFunction}
                                                    </Dropdown.Button>
                                                    )}
                                                    menu={onCollapse => (
                                                    <Dropdown.Menu onCollapse={onCollapse}>
                                                        {dropdownItems[3]}
                                                    </Dropdown.Menu>
                                                    )}
                                                    />
                                                </Table.Cell>
                                            </Table.Row>
                                        ):(null)}
                                    </Table.Body>
                                </Table>
                                <br/>
                                <Button
                                    color={ComponentColor.Primary}
                                    titleText="Learn more about alerting"
                                    text="GO"
                                    type={ButtonType.Button}
                                    onClick={() => console.log("click action")}/>
                                </Panel.Body>
                                </Panel>
                            </Grid.Column>
                            <Grid.Column
                                widthXS={Columns.Eight}
                                widthSM={Columns.Eight}
                                widthMD={Columns.Eight}
                                widthLG={Columns.Eight}
                                style={{ marginTop: '20px' }}
                            >
                                <ModelTable
                                models={placeHolderModels}
                                startModel={() => {console.log("start")}}
                                stopModel={() => {console.log("start")}}/>
                            </Grid.Column>
                        </Grid.Row>
                    </Grid>
                </Page.Contents>
            </Page>)
    }
}

export default MLPage;
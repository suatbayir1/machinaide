// Libraries
import React, { PureComponent } from 'react'
import { connect, ConnectedProps } from 'react-redux'
import { AppState } from 'src/types'
import {
  Page,
  BorderType,  //TimeRange,
  ComponentSize, //ComponentStatus,
  RemoteDataState,
  Table,
  Grid,
  Panel,
  Columns,
  Dropdown, MultiSelectDropdown,
  Label,
  IconFont, Icon,
  ComponentColor,
  SelectDropdown,
  Button, ButtonType, ButtonShape, ConfirmationButton,
  List,
  Gradients,
  InfluxColors,
  FlexBox, FlexDirection,
  //JustifyContent,
  TextBlock, WaitingText, SparkleSpinner, TechnoSpinner, // SpinnerContainer,
  Toggle,
  InputToggleType,
  ResourceCard,
  SlideToggle,
  Input, InputType, InputLabel,
  Appearance,
  // Popover, PopoverInteraction, PopoverPosition, ReflessPopover,
  ProgressBar,
  QuestionMarkTooltip,
  Form,
  DapperScrollbars,
  Overlay,
} from '@influxdata/clockface'
import TimeRangeDropdown from 'src/shared/components/TimeRangeDropdown'
import { Context } from 'src/clockface'
import MeasurementSelectors from 'src/notebooks/pipes/Data/MeasurementSelectors'
import FieldSelectors from 'src/notebooks/pipes/Data/FieldSelectors'
import TabbedPageTabs from 'src/shared/tabbedPage/TabbedPageTabs'
import NLPSearch from 'src/example/NLPSearch'
import { Column } from 'react-virtualized'
// import { TabbedPageTab } from 'src/shared/tabbedPage/TabbedPageTabs'

// type ReduxProps = ConnectedProps<typeof connector>
interface Props {
}

interface State {
  bodyData: string[]
  headers: string[]
  selected: string[]
  options: string[]
  option: string
  selectedOptions: string[]
  checked1: boolean
  checked2: boolean
  activeStatus: boolean
  inputVal: string
  lowerDate: string
  upperDate: string
  searchTerm: string
  valInput: string
  isDatePickerOpen: boolean
  overlayVisible: boolean
  activeTab: string
}

class ExamplePage extends PureComponent<Props, State>{
  state = {
    bodyData: [],
    headers: [],
    selected: ["Fields", "Fields", "Fields"],
    options: ["option1", "option2", "option3", "option4"],
    option: "Dropdown example",
    checked1: false,
    checked2: false,
    activeStatus: false,
    inputVal: "",
    lowerDate: new Date().toISOString(),
    upperDate: new Date().toISOString(),
    searchTerm: "",
    selectedOptions: ["option2", "option3"],
    valInput: "",
    isDatePickerOpen: true,
    overlayVisible: false,
    activeTab: "tab1"
  }

  componentDidMount() {
    this.setState({
      bodyData: ["data1", "data2", "data3"],
      headers: ["header1", "header2", "header3"]
    })
  }

  onChange = (e) => {
    console.log(e)
  }



  private get optionItems(): JSX.Element[] {
    return [
      <Dropdown.Item
        testID="dropdown-item generate-token--read-write"
        id={"id1"}
        key={"id1"}
        value={"id1"}
        onClick={this.onChange}
      >
        id1
          </Dropdown.Item>,
      <Dropdown.Item
        testID="dropdown-item generate-token--all-access"
        id={"id2"}
        key={"id2"}
        value={"id2"}
        onClick={this.onChange}
      >
        id2
          </Dropdown.Item>,
    ]
  }
  public render() {
    const { headers, bodyData, selected } = this.state
    return (
      <Page
        titleTag="Examples Page"
        className="alert-history-page"
      >
        <Page.Header fullWidth={true}>
          <Page.Title
            title="Component Examples"
            testID="alert-history-title"
          />
        </Page.Header>
        <Page.Contents
          fullWidth={true}
          scrollable={true}
          className="alert-history-page--contents"
        >
          <Grid>
            <Grid.Row>
              <Grid.Column widthXS={Columns.Four}>
                <Panel>
                  <Panel.Header size={ComponentSize.ExtraSmall}>
                    <p className="preview-data-margins">Sample Table</p>
                  </Panel.Header>
                  <Panel.Body size={ComponentSize.ExtraSmall}>
                    <Table
                      borders={BorderType.Vertical}
                      fontSize={ComponentSize.ExtraSmall}
                      cellPadding={ComponentSize.ExtraSmall}
                    >
                      <Table.Header>
                        <Table.Row>
                          <Table.HeaderCell>Headers</Table.HeaderCell>
                          <Table.HeaderCell>Sample Values</Table.HeaderCell>
                          <Table.HeaderCell>Sample Fields</Table.HeaderCell>
                        </Table.Row>
                      </Table.Header>
                      <Table.Body>
                        {headers.map((header, i) => (
                          <Table.Row key={header}>
                            <Table.Cell>{header}</Table.Cell>
                            <Table.Cell>{bodyData[i]}</Table.Cell>
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
                                    {selected[i]}
                                  </Dropdown.Button>
                                )}
                                menu={onCollapse => (
                                  <Dropdown.Menu onCollapse={onCollapse}>
                                    {this.optionItems}
                                  </Dropdown.Menu>
                                )}
                              />
                            </Table.Cell>
                          </Table.Row>
                        ))}
                      </Table.Body>
                    </Table>
                  </Panel.Body>
                </Panel>
              </Grid.Column>
              <Grid.Column widthXS={Columns.Two}>
                <Panel>
                  <Panel.Header size={ComponentSize.ExtraSmall}>
                    <p className="preview-data-margins">Sample select list</p>
                  </Panel.Header>
                  <Panel.Body size={ComponentSize.ExtraSmall}>
                    <FlexBox
                      key="fl1"
                      direction={FlexDirection.Row}
                      margin={ComponentSize.Small}
                      stretchToFitWidth
                      testID="component-spacer"
                    >
                      <Toggle
                        key="tog1"
                        id="prefixoptional"
                        testID="tickprefix-input"
                        checked={this.state.checked1}
                        type={InputToggleType.Checkbox}
                        value={"????"}
                        onChange={() => this.setState({ checked1: !this.state.checked1 })}
                        size={ComponentSize.ExtraSmall}
                      />
                      <FlexBox.Child key="opt1" testID="component-spacer--flex-child">
                        <TextBlock
                          testID="when-value-text-block"
                          text="Option 1"
                        />
                      </FlexBox.Child>
                    </FlexBox>
                    <FlexBox
                      key="fl2"
                      direction={FlexDirection.Row}
                      margin={ComponentSize.Small}
                      stretchToFitWidth
                      testID="component-spacer">
                      <Toggle
                        key="tog21"
                        id="prefixoptional"
                        testID="tickprefix-input"
                        checked={this.state.checked2}
                        type={InputToggleType.Checkbox}
                        value={"????"}
                        onChange={() => this.setState({ checked2: !this.state.checked2 })}
                        size={ComponentSize.ExtraSmall}
                      />
                      <FlexBox.Child key="opt2" testID="component-spacer--flex-child">
                        <TextBlock
                          testID="when-value-text-block"
                          text="Option 2"
                        />
                      </FlexBox.Child>
                    </FlexBox>
                  </Panel.Body>
                </Panel>
              </Grid.Column>
              <Grid.Column widthXS={Columns.Three}>
                <Panel>
                  <Panel.Header size={ComponentSize.ExtraSmall}>
                    <p className="preview-data-margins">Icons, Slide Toggle, Popover</p>
                  </Panel.Header>
                  <Panel.Body size={ComponentSize.ExtraSmall}>
                    <FlexBox
                      key="icon-flex"
                      direction={FlexDirection.Row}
                      margin={ComponentSize.Small}
                    >
                      <Label
                        size={ComponentSize.Small}
                        name={"Icon usage"}
                        description={"Icons"}
                        color={InfluxColors.Castle}
                        id={"icon-label"} />
                      <Icon key="i1" glyph={IconFont.Checkmark} />
                      <Icon key="i2" glyph={IconFont.AlertTriangle} />
                      <Icon key="i3" glyph={IconFont.Moon} />
                    </FlexBox><br />
                    <FlexBox
                      key="tog-flex"
                      direction={FlexDirection.Row}
                      margin={ComponentSize.Small}
                    >
                      <SlideToggle
                        active={this.state.activeStatus}
                        size={ComponentSize.ExtraSmall}
                        onChange={() => this.setState({ activeStatus: !this.state.activeStatus })}
                        testID="rule-card--slide-toggle"
                      />
                      <InputLabel> label</InputLabel>

                    </FlexBox><br />
                    <QuestionMarkTooltip
                      diameter={18}
                      color={ComponentColor.Secondary}
                      testID={"example-qmt"}
                      tooltipContents={"Content of popover, instead of string JSX element can be given"}
                    />
                  </Panel.Body>
                </Panel>
              </Grid.Column>
              <Grid.Column widthXS={Columns.Three}>
                <Panel>
                  <Panel.Header size={ComponentSize.ExtraSmall}>
                    <p className="preview-data-margins">Sample Card</p>
                  </Panel.Header>
                  <Panel.Body size={ComponentSize.ExtraSmall}>
                    <ResourceCard
                      key="example-resource-card"
                      testID="example-resource-card"
                      contextMenu={this.contextMenu}
                    >
                      <ResourceCard.Name
                        name={"Card title"}
                        testID="dashboard-card--name"
                      />
                      <ResourceCard.Description
                        description={"Card description"}
                      />
                      <ResourceCard.Meta>
                        Card Meta Info
                              </ResourceCard.Meta>
                    </ResourceCard>
                  </Panel.Body>
                </Panel>
              </Grid.Column>
            </Grid.Row>
            <Grid.Row>
              <Grid.Column widthXS={Columns.Two}>
                <Panel>
                  <Panel.Header size={ComponentSize.ExtraSmall}>
                    <p className="preview-data-margins">Dropdown/Input etc</p>
                  </Panel.Header>
                  <Panel.Body size={ComponentSize.ExtraSmall}>
                    {/* <SearchWidget
                              placeholderText="Filter..."
                              onSearch={(e)=>{console.log("search function"); this.setState({searchTerm:e})}}
                              searchTerm={this.state.searchTerm}
                            /><br/> */}
                    <SelectDropdown
                      options={this.state.options}
                      selectedOption={this.state.option}
                      onSelect={(e) => this.setState({ option: e })}
                    /><br />
                    <MultiSelectDropdown
                      emptyText={"multiselect dropdown"}
                      options={["option1", "option2", "option3", "option4", "option5"]}
                      selectedOptions={this.state.selectedOptions}
                      onSelect={this.onSelectOptions}
                    /><br />
                    <Input
                      onChange={(e) => this.setState({ inputVal: e.target.value })}
                      name=""
                      testID="input-field"
                      type={InputType.Text}
                      value={this.state.inputVal}
                      placeholder="input example"
                    /><br />
                    <ConfirmationButton
                      onConfirm={() => console.log("replace with your own confirm function")}
                      returnValue={"return value"}
                      text="Confirmation Button"
                      popoverColor={ComponentColor.Danger}
                      popoverAppearance={Appearance.Outline}
                      color={ComponentColor.Danger}
                      confirmationLabel="label, can be empty"
                      confirmationButtonColor={ComponentColor.Danger}
                      confirmationButtonText="Click to confirm"
                      size={ComponentSize.ExtraSmall}
                    /><br />
                    {/* <Popover
                              triggerRef={createRef<HTMLDivElement>()}
                              contents={()=>(<div>Popover contents</div>)}
                              appearance={Appearance.Outline}
                              enableDefaultStyles={false}
                              position={PopoverPosition.ToTheLeft}
                              showEvent={PopoverInteraction.None}
                              hideEvent={PopoverInteraction.None}
                              visible={true}
                            /> */}
                    {/* <div className="range-picker--date-pickers">
                              <DatePicker
                                dateTime={this.state.date}
                                onSelectDate={(e)=>this.setState({date:e.target.value })}
                                label="Start"
                              />
                            </div> */}
                    {/* <DateRangePicker
                              timeRange={timeRange}
                              onSetTimeRange={this.handleApplyTimeRange}
                              onClose={this.handleHideDatePicker}
                            /> */}
                    <ProgressBar
                      label="Progress Bar"
                      value={70}
                      color={InfluxColors.Comet}
                      barGradient={Gradients.GrapeSoda}
                      max={100}
                    />
                  </Panel.Body>
                </Panel>
              </Grid.Column>
              <Grid.Column widthXS={Columns.Two}>
                <Panel>
                  <Panel.Header size={ComponentSize.ExtraSmall}>
                    <p className="preview-data-margins">Sample Buttons</p>
                  </Panel.Header>
                  <Panel.Body size={ComponentSize.ExtraSmall}>
                    <Button
                      color={ComponentColor.Default}
                      titleText="Learn more about alerting"
                      text="Default"
                      type={ButtonType.Submit}
                      onClick={() => console.log("click action")}
                    /><br />
                    <Button
                      shape={ButtonShape.Default}
                      color={ComponentColor.Danger}
                      titleText="Learn more about alerting"
                      text="Danger"
                      type={ButtonType.Button}
                      onClick={() => console.log("click action")}
                    /><br />
                    <Button
                      color={ComponentColor.Primary}
                      titleText="Learn more about alerting"
                      text="Primary"
                      type={ButtonType.Button}
                      onClick={() => console.log("click action")}
                    /><br />
                    <Button
                      color={ComponentColor.Secondary}
                      titleText="Learn more about alerting"
                      text="Secondary"
                      type={ButtonType.Button}
                      onClick={() => console.log("click action")}
                    /><br />
                    <Button
                      color={ComponentColor.Success}
                      titleText="Learn more about alerting"
                      text="Success"
                      type={ButtonType.Button}
                      onClick={() => console.log("click action")}
                    /><br />
                    <Button
                      color={ComponentColor.Warning}
                      titleText="Learn more about alerting"
                      text="Warning"
                      type={ButtonType.Button}
                      onClick={() => console.log("click action")}
                    />
                  </Panel.Body>
                </Panel>
              </Grid.Column>
              <Grid.Column widthXS={Columns.Two}>
                <Panel>
                  <Panel.Header size={ComponentSize.ExtraSmall}>
                    <p className="preview-data-margins">List Sample with scroll</p>
                  </Panel.Header>
                  <Panel.Body size={ComponentSize.ExtraSmall}>
                    <DapperScrollbars
                      autoHide={false}
                      autoSizeHeight={true} style={{ maxHeight: '150px' }}
                      className="data-loading--scroll-content"
                    >
                      <div>
                        <List.Item
                          key={"key1"}
                          value={"val"}
                          onClick={() => console.log("list click")}
                          title={"title"}
                          gradient={Gradients.GundamPilot}
                          wrapText={true}
                        >
                          <List.Indicator type="dot" />
                          <div className="selectors--item-value selectors--item__measurement">
                            {"icon"}
                          </div>
                          <div className="selectors--item-name">selecter name</div>
                          <div className="selectors--item-type">selector type</div>
                        </List.Item>
                        <List.Item
                          key={"key2"}
                          value={"val"}
                          onClick={() => console.log("list click")}
                          title={"title"}
                          gradient={Gradients.GundamPilot}
                          wrapText={true}
                        >
                          <List.Indicator type="dot" />
                          <div className="selectors--item-value selectors--item__measurement">
                            {"icon"}
                          </div>
                        </List.Item>
                        <List
                          backgroundColor={InfluxColors.Obsidian}
                          style={{ height: '75px' }}
                          maxHeight="100px"
                        >
                          <FieldSelectors fields={["f1", "f2"]} />
                        </List>
                        <MeasurementSelectors measurements={["m1", "m2"]} />
                        {/* <TagSelectors tags={["t1", ["val1","val2"],"t2", ["val3","val4"]]} /> */}
                      </div>
                    </DapperScrollbars>
                  </Panel.Body>
                </Panel>
              </Grid.Column>
              <Grid.Column widthXS={Columns.Four}>
                <Panel>
                  <Panel.Header size={ComponentSize.ExtraSmall}>
                    <p className="preview-data-margins">Spinners & Waiting Text</p>
                  </Panel.Header>
                  <Panel.Body size={ComponentSize.ExtraSmall}>
                    <FlexBox
                      direction={FlexDirection.Row}
                      margin={ComponentSize.Medium}
                    >
                      <SparkleSpinner loading={RemoteDataState.Loading} />
                      <TechnoSpinner style={{ width: "50px", height: "50px" }} />
                    </FlexBox>
                    <WaitingText text="Waiting Text" />
                  </Panel.Body>
                </Panel>
              </Grid.Column>
            </Grid.Row>
            <Grid.Row>
              <Grid.Column widthXS={Columns.Three}>
                <Panel>
                  <Panel.Header size={ComponentSize.ExtraSmall}>
                    <p className="preview-data-margins">Sample Form</p>
                  </Panel.Header>
                  <Panel.Body size={ComponentSize.Medium}>
                    <Form onSubmit={() => console.log("form submit function")} testID="bucket-form">
                      <Grid>
                        <Grid.Row>
                          <Grid.Column>
                            <Form.ValidationElement
                              value={this.state.valInput}
                              label="Required field"
                              helpText={"instruction text for field"}
                              validationFunc={(str) => { console.log("validate input here: ", str); return str }}
                              required={true}
                            >
                              {status => (
                                <Input
                                  status={status}
                                  placeholder="placeholder"
                                  name="name"
                                  autoFocus={true}
                                  value={this.state.valInput}
                                  onChange={(e) => { console.log("normally, set value set"); this.setState({ valInput: e.target.value }) }}
                                  testID="bucket-form-name"
                                />
                              )}
                            </Form.ValidationElement>
                            <Form.Element
                              label="Form element"
                              errorMessage={"Text to be displayed on error"}
                            >
                              <Input
                                placeholder="placeholder"
                                name="name"
                                autoFocus={true}
                                value={"input value"}
                                onChange={() => console.log("normally, set value set")}
                                testID="bucket-form-name"
                              />
                            </Form.Element>
                          </Grid.Column>
                        </Grid.Row>
                        <Grid.Row>
                          <Grid.Column>
                            <Form.Footer>
                              <Button
                                text="Submit"
                                type={ButtonType.Submit}
                              />
                            </Form.Footer>
                          </Grid.Column>
                        </Grid.Row>
                      </Grid>
                    </Form>
                  </Panel.Body>
                </Panel>
              </Grid.Column>
              <Grid.Column widthXS={Columns.Three}>
                <Panel>
                  <Panel.Header size={ComponentSize.ExtraSmall}>
                    <p className="preview-data-margins">Date Picker</p>
                  </Panel.Header>
                  <Panel.Body size={ComponentSize.Small}>
                    <TimeRangeDropdown
                      onSetTimeRange={(e) => { this.setState({ lowerDate: e.lower, upperDate: e.upper }) }}
                      timeRange={{
                        lower: this.state.lowerDate,
                        upper: this.state.upperDate,
                        type: 'custom'
                      }}
                    />
                  </Panel.Body>
                </Panel>
              </Grid.Column>
              <Grid.Column widthXS={Columns.Three}>
                <Panel>
                  <Panel.Header size={ComponentSize.ExtraSmall}>
                    <p className="preview-data-margins">Overlay sample</p>
                  </Panel.Header>
                  <Panel.Body size={ComponentSize.Small}>
                    <Button
                      color={ComponentColor.Secondary}
                      titleText="opens overlay"
                      text="click for overlay"
                      type={ButtonType.Button}
                      onClick={() => this.setState({ overlayVisible: !this.state.overlayVisible })}
                    />
                    <Overlay visible={this.state.overlayVisible}>
                      <Overlay.Container maxWidth={600}>
                        <Overlay.Header
                          title="Overlay Title"
                          onDismiss={() => this.setState({ overlayVisible: !this.state.overlayVisible })}
                        />

                        <Overlay.Body>
                          <TabbedPageTabs
                            tabs={[{
                              text: 'Tab1',
                              id: 'tab1',
                            },
                            {
                              text: 'Tab2',
                              id: 'tab2',
                            }]}
                            activeTab={this.state.activeTab}
                            onTabClick={(e) => this.setState({ activeTab: e })}
                          />
                          <br />
                          <div>Content for {this.state.activeTab}</div>
                        </Overlay.Body>
                      </Overlay.Container>
                    </Overlay>
                  </Panel.Body>
                </Panel>
              </Grid.Column>
            </Grid.Row>
            <Grid.Row>
              <Grid.Column widthXS={Columns.Seven}>
                <Panel>
                  <Panel.Header size={ComponentSize.ExtraSmall}>
                    <p className="preview-data-margins">NLP Part</p>
                  </Panel.Header>
                  <Panel.Body size={ComponentSize.Small}>
                    <NLPSearch />
                  </Panel.Body>
                </Panel>
              </Grid.Column>
            </Grid.Row>
          </Grid>
        </Page.Contents>
      </Page>
    )
  }
  private get contextMenu(): JSX.Element {
    return (
      <Context>
        <Context.Menu icon={IconFont.CogThick}>
          <Context.Item
            label="Export"
            action={() => console.log("icon click")}
            testID="context-menu-item-export"
          />
        </Context.Menu>
        <Context.Menu
          icon={IconFont.Duplicate}
          color={ComponentColor.Secondary}
        >
          <Context.Item
            label="Clone"
            action={() => console.log("icon click")}
            testID="clone-dashboard"
          />
        </Context.Menu>
        <Context.Menu
          icon={IconFont.Trash}
          color={ComponentColor.Danger}
          testID="context-delete-menu"
        >
          <Context.Item
            label="Delete"
            action={() => console.log("icon click")}
            testID="context-delete-dashboard"
          />
        </Context.Menu>
      </Context>
    )
  }

  onSelectOptions = (option: string) => {
    const { selectedOptions } = this.state
    const optionExists = selectedOptions.find(opt => opt === option)
    let updatedOptions = selectedOptions

    if (optionExists) {
      updatedOptions = selectedOptions.filter(fo => fo !== option)
    } else {
      updatedOptions = [...selectedOptions, option]
    }

    this.setState({ selectedOptions: updatedOptions })
  }
}

const mstp = (state: AppState) => {
  const { predicates } = state
  const {
    timeRange,
  } = predicates

  return {
    timeRange,
  }
}

const connector = connect(mstp, null)
export default connector(ExamplePage);
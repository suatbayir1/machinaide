// Libraries
import React, {PureComponent, ChangeEvent, createRef} from 'react'
import ReactDatePicker from 'react-datepicker'
import moment from 'moment'

// Components
import {Input, Grid, Form, Button, IconFont, ComponentColor,
  Appearance, PopoverPosition, PopoverInteraction} from '@influxdata/clockface'

// Styles
import 'react-datepicker/dist/react-datepicker.css'

// Types
import {Columns, ComponentSize, ComponentStatus, Popover,
  } from '@influxdata/clockface'

interface Props {
  label: string
  dateTime: string
  maxDate?: string
  minDate?: string
  onSelectDate: (date: string) => void
}

interface State {
  inputValue: string
  inputFormat: string
  isOpen: boolean
}

const isValidRTC3339 = (d: string): boolean => {
  return (
    moment(d, 'YYYY-MM-DD HH:mm', true).isValid() ||
    moment(d, 'YYYY-MM-DD HH:mm:ss', true).isValid() ||
    moment(d, 'YYYY-MM-DD HH:mm:ss.SSS', true).isValid() ||
    moment(d, 'YYYY-MM-DD', true).isValid()
  )
}

const getFormat = (d: string): string => {
  if (moment(d, 'YYYY-MM-DD', true).isValid()) {
    return 'YYYY-MM-DD'
  }
  if (moment(d, 'YYYY-MM-DD HH:mm', true).isValid()) {
    return 'YYYY-MM-DD HH:mm'
  }
  if (moment(d, 'YYYY-MM-DD HH:mm:ss', true).isValid()) {
    return 'YYYY-MM-DD HH:mm:ss'
  }
  if (moment(d, 'YYYY-MM-DD HH:mm:ss.SSS', true).isValid()) {
    return 'YYYY-MM-DD HH:mm:ss.SSS'
  }
  return null
}

export default class CustomDatePicker extends PureComponent<Props, State> {
  private datePickerRef = createRef<HTMLButtonElement>();
  private inCurrentMonth: boolean = false
  state = {
    inputValue: this.props.dateTime,
    inputFormat: 'YYYY-MM-DD',
    isOpen: false
  }

  private dayClassName = (date: Date) => {
    const day = date.getDate()

    if (day === 1) {
      this.inCurrentMonth = !this.inCurrentMonth
    }

    if (this.inCurrentMonth) {
      return 'range-picker--day-in-month'
    }

    return 'range-picker--day'
  }

  public render() {
    const {dateTime, label, maxDate, minDate} = this.props

    const date = new Date(this.state.inputValue)

    return (
      <div>
        <Grid.Row>
          <Grid.Column widthXS={Columns.Twelve}>
            <Form.Element label={label} errorMessage={this.inputErrorMessage}>
              {/* <Input
                size={ComponentSize.Medium}
                titleText={label}
                value={this.inputValue}
                onChange={this.handleChangeInput}
                status={this.inputStatus}
              /> */}
              <Button
                ref={this.datePickerRef}
                icon={IconFont.Calendar}
                color={ComponentColor.Primary}
                text={this.state.inputValue}
                onClick={()=>this.setState({isOpen: !this.state.isOpen})}
                style={{width: "262px"}}
              />
            </Form.Element>
            <Popover
              appearance={Appearance.Outline}
              position={PopoverPosition.ToTheLeft}
              triggerRef={this.datePickerRef}
              visible={this.state.isOpen}
              showEvent={PopoverInteraction.None}
              hideEvent={PopoverInteraction.None}
              distanceFromTrigger={8}
              testID="timerange-popover"
              enableDefaultStyles={false}
              contents={() => (
                <div className="range-picker--date-pickers">
                  <div className="range-picker--date-picker">
                    <Grid.Row>
                      <Grid.Column widthXS={Columns.Twelve}>
                        <div className="range-picker--popper-container" style={{color: "white"}}>
                          <ReactDatePicker
                            inline={true}
                            selected={date}
                            onChange={this.handleSelectDate}
                            startOpen={false}
                            dateFormat="YYYY-MM-DD"
                            showTimeSelect={false}
                            //timeFormat="HH:mm"
                            shouldCloseOnSelect={true}
                            disabledKeyboardNavigation={true}
                            calendarClassName="range-picker--calendar"
                            dayClassName={this.dayClassName}
                            //timeIntervals={60}
                            fixedHeight={true}
                            minDate={new Date(minDate)}
                            maxDate={new Date(maxDate)}
                          />
                        </div>
                      </Grid.Column>
                    </Grid.Row>
                  </div>
                </div>
              )}
            /> 
          </Grid.Column>
        </Grid.Row>
      </div>
    )
  }

  private get inputValue(): string {
    const {dateTime} = this.props
    const {inputValue, inputFormat} = this.state

    if (this.isInputValueInvalid) {
      return inputValue
    }

    if (inputFormat) {
      return moment(dateTime).format(inputFormat)
    }

    return moment(dateTime).format('YYYY-MM-DD')
  }

  private get isInputValueInvalid(): boolean {
    const {inputValue} = this.state
    if (inputValue === null) {
      return false
    }

    return !isValidRTC3339(inputValue)
  }

  private get inputErrorMessage(): string | undefined {
    if (this.isInputValueInvalid) {
      return 'Format must be YYYY-MM-DD'
    }

    return '\u00a0\u00a0'
  }

  private get inputStatus(): ComponentStatus {
    if (this.isInputValueInvalid) {
      return ComponentStatus.Error
    }
    return ComponentStatus.Default
  }

  private dayClassName = (date: Date) => {
    const day = date.getDate()

    if (day === 1) {
      this.inCurrentMonth = !this.inCurrentMonth
    }

    if (this.inCurrentMonth) {
      return 'range-picker--day-in-month'
    }

    return 'range-picker--day'
  }

  private handleSelectDate = (date: Date): void => {
    const {onSelectDate} = this.props
    onSelectDate(date.toISOString())
    this.setState({inputValue: date.toISOString().substring(0,10), inputFormat: getFormat(date.toISOString().substring(0,10)), isOpen: !this.state.isOpen})
  }

  private handleChangeInput = (e: ChangeEvent<HTMLInputElement>): void => {
    const {onSelectDate} = this.props
    const value = e.target.value

    if (isValidRTC3339(value)) {
      onSelectDate(moment(value).toISOString())
      this.setState({inputValue: value, inputFormat: getFormat(value)})
      return
    }

    this.setState({inputValue: value, inputFormat: null, isOpen: !this.state.isOpen})
  }
}

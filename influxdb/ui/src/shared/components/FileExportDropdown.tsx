// Libraries
import React, { PureComponent } from 'react'
import { connect } from 'react-redux'
import moment from 'moment'

// Components
import { ComponentStatus, Dropdown } from '@influxdata/clockface'

// Utils
import { downloadTextFile } from 'src/shared/utils/download'
import { getActiveTimeMachine } from 'src/timeMachine/selectors'

// Types
import { AppState } from 'src/types'

// Helpers

interface StateProps {
    files: string[] | null
}

interface State {
    exportTypes: object[]
}

class FileExportDropdown extends PureComponent<StateProps, State> {
    constructor(props: StateProps) {
        super(props)

        this.state = {
            exportTypes: [
                { label: 'CSV', value: 'csv' },
                { label: 'XLSX', value: 'xlsx' },
                { label: 'JSON', value: 'json' },
            ]
        }
    }

    public render() {
        return (
            <Dropdown
                style={{ width: `100px` }}
                testID="timerange-dropdown"
                button={(active, onClick) => (
                    <Dropdown.Button active={active} onClick={onClick} status={this.buttonStatus}>
                        {"Export"}
                    </Dropdown.Button>
                )}
                menu={onCollapse => (
                    <Dropdown.Menu
                        onCollapse={onCollapse}
                        style={{ width: `150px` }}
                    >
                        {
                            this.state.exportTypes.map(type => {
                                return (
                                    <Dropdown.Item
                                        key={type["value"]}
                                        value={type["value"]}
                                        id={type["value"]}
                                        onClick={this.handleClickExport}
                                    >
                                        {type["label"]}
                                    </Dropdown.Item>
                                )
                            })
                        }
                    </Dropdown.Menu>
                )}
            />
        )
    }

    private get buttonStatus(): ComponentStatus {
        const { files } = this.props

        if (files) {
            return ComponentStatus.Default
        }

        return ComponentStatus.Disabled
    }

    private handleClickExport = (type) => {
        switch (type) {
            case 'csv':
                this.exportCsv();
                break;
            case 'xlsx':
                this.exportXlsx();
                break;
            case 'json':
                this.exportJson();
                break;
        }
    }

    private exportCsv = () => {
        const { files } = this.props
        const csv = files.join('\n\n')
        const now = moment().format('YYYY-MM-DD-HH-mm')
        const filename = `${now} Chronograf Data`

        downloadTextFile(csv, filename, '.csv', 'text/csv')
    }

    private exportXlsx = () => {
        const { files } = this.props;
        const csv = files.join('\n\n');
        const xlsx = csv.replaceAll(",", "\t");
        
        const now = moment().format('YYYY-MM-DD-HH-mm')
        const filename = `${now} Chronograf Data`

        downloadTextFile(xlsx, filename, '.xls', 'application/vnd.ms-excel')
    }

    private exportJson = async () => {
        const { files } = this.props;
        const csv = files.join('\n\n');

        let newCsv = csv.split('\n');
        let lastCsv = newCsv.splice(3, newCsv.length);

        const json = await this.csvToJSON(lastCsv);

        const now = moment().format('YYYY-MM-DD-HH-mm')
        const filename = `${now} Chronograf Data`

        downloadTextFile(JSON.stringify(json), filename, '.json', 'text/json');
    }

    csvToJSON = async (csv) => {
        var result = [];
        var headers = csv[0].split(",");

        for (var i = 1; i < csv.length; i++) {
            var obj = {};
            var currentline = csv[i].split(",");

            for (var j = 0; j < headers.length; j++) {
                obj[headers[j]] = currentline[j];
            }

            result.push(obj);
        }

        return result;
    }
}

const mstp = (state: AppState) => {
    const {
        queryResults: { files },
    } = getActiveTimeMachine(state)

    return { files }
}

export default connect<StateProps>(mstp)(FileExportDropdown)

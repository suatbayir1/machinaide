// Libraries
import React, { PureComponent } from 'react'

// Components
import {
    ComponentColor,
    IconFont,
    Dropdown,
} from '@influxdata/clockface'

// Utils
import { dataToCSV, dataToXLSX } from 'src/shared/parsing/dataToCsv';
import download from 'src/external/download.js';

interface Props {
    headers: string[]
    fields: string[]
    fileName: string
    exportData: object[]
}

interface State {
    fileTypes: object[]
}


class ExportFile extends PureComponent<Props, State> {
    constructor(props) {
        super(props);

        this.state = {
            fileTypes: [
                { name: 'CSV', value: 'csv' },
                { name: 'XLSX', value: 'xlsx' },
            ]
        };
    }

    handleChangeExportType = (exportType) => {
        if (exportType === "csv") {
            this.createCSV();
        } else if (exportType === "xlsx") {
            this.createXLSX();
        }
    }

    createCSV = () => {
        const { exportData, fileName, headers, fields } = this.props;
        let now = new Date().toISOString();
        let row = [];

        let data = exportData.map(item => {
            row = [];
            Object.keys(item).forEach(key => {
                if (fields.includes(key)) {
                    row.push(item[key])
                }
            })
            return row;
        });

        let csv = dataToCSV([headers, ...data]);

        try {
            download(csv, `${fileName}-${now}.csv`, 'text/plain')
        } catch (error) {
            console.error(error);
        }
    }

    createXLSX = () => {
        const { exportData, fileName, headers, fields } = this.props;
        let now = new Date().toISOString();
        let row = [];

        let data = exportData.map(item => {
            row = [];
            Object.keys(item).forEach(key => {
                if (fields.includes(key)) {
                    row.push(item[key])
                }
            })
            return row;
        })

        let xlsx = dataToXLSX([headers, ...data]);

        try {
            download(xlsx, `${fileName}-${now}.xlsx`, 'text/plain')
        } catch (error) {
            console.error(error);
        }
    }

    render() {
        const { fileTypes } = this.state;

        return (
            <Dropdown
                style={{ width: '110px' }}
                button={(active, onClick) => (
                    <Dropdown.Button
                        active={active}
                        onClick={onClick}
                        color={ComponentColor.Danger}
                        icon={IconFont.Export}
                        testID="dropdown-button--gen-token"
                    >
                        {'Export'}
                    </Dropdown.Button>
                )}
                menu={onCollapse => (
                    <Dropdown.Menu onCollapse={onCollapse}>
                        {
                            fileTypes.map((ft, idx) => <Dropdown.Item
                                testID="dropdown-item generate-token--read-write"
                                key={idx}
                                value={ft["value"]}
                                onClick={this.handleChangeExportType}
                            >
                                {ft["name"]}
                            </Dropdown.Item>)
                        }
                    </Dropdown.Menu>
                )}
            />
        );
    }
}


export default ExportFile;
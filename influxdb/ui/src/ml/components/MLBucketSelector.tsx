import { getOrg } from "src/organizations/selectors"
import { setCanDelete } from "src/shared/selectors/canDelete"
import { AppState, Filter } from "src/types"
import React, {FC, useEffect, useState} from 'react'
import { connect, ConnectedProps } from "react-redux"
import {
    resetFilters,
    setBucketAndKeys,
} from 'src/shared/actions/predicates'
// import moment from "moment"
import BucketsDropdown from "src/shared/components/DeleteDataForm/BucketsDropdown"
import {setValuesByKey} from 'src/shared/actions/predicates'
import { Columns, Dropdown, Grid } from "@influxdata/clockface"
import SearchableDropdown from "src/shared/components/SearchableDropdown"
import DropdownContainer from "src/ml/components/MLDropdownComponent"
import ReactDOM from 'react-dom';

interface OwnProps {
//   constructDropdownData: (selectedBucket: string) => void
  setSelectedDatabase: (selectedDatabase: string) => void
  onDropdownTreeChange: (_: any, selectedNodes: any) => void
  dropdownData: any[]
  databases: string[]
//   orgID: string
  selectedDatabase: string
}

// type ReduxProps = ConnectedProps<typeof connector>
// export type Props = ReduxProps & OwnProps

const MLBucketSelector: FC<OwnProps> = ({
    // bucketName,
    dropdownData,
    databases,
    selectedDatabase,
    // constructDropdownData,
    setSelectedDatabase,
    onDropdownTreeChange
}) => {

    // console.log(dropdownData)
    return (
        <Grid>
            <Grid.Row>
                <Grid.Column
                    widthXS={Columns.Twelve}
                    widthSM={Columns.Twelve}
                    widthMD={Columns.Twelve}
                    widthLG={Columns.Twelve}>
                    <BucketsDropdown
                        bucketName={selectedDatabase}
                        onSetBucketName={setSelectedDatabase}
                        />
                    {/* <SearchableDropdown
                        options={databases}
                        selectedOption={selectedDatabase}
                        onSelect={setSelectedDatabase}
                        onChangeSearchTerm={setSelectedDatabase}
                        searchTerm={selectedDatabase}
                        emptyText="No databases found"
                        searchPlaceholder="Search databases..."/> */}
                </Grid.Column>
                {/* <Grid.Column
                    widthXS={Columns.Six}
                    widthSM={Columns.Six}
                    widthMD={Columns.Six}
                    widthLG={Columns.Six}>
                    <SearchableDropdown
                        options={values}
                        selectedOption={selectedMeasurement}
                        onSelect={setSelectedMeasurement}
                        onChangeSearchTerm={setSelectedMeasurement}
                        searchTerm={selectedMeasurement}
                        emptyText="No measurements found"
                        searchPlaceholder="Search values..."/>
                </Grid.Column> */}
            </Grid.Row>
            <Grid.Row>
            <Grid.Column
                    widthXS={Columns.Twelve}
                    widthSM={Columns.Twelve}
                    widthMD={Columns.Twelve}
                    widthLG={Columns.Twelve}>
                    <DropdownContainer
                        data={dropdownData}
                        onChange={onDropdownTreeChange}/>
                </Grid.Column>                
            </Grid.Row>
        </Grid>
    )
}

// const mstp = (state: AppState) => {
//     const {predicates} = state
//     const {
//       bucketName,
//       values
//     } = predicates
  
//     return {
//       bucketName,
//       values,
//       canDelete: setCanDelete(predicates),
//       orgID: getOrg(state).id,
//     }
// }

// const mdtp = {
//     resetFilters,
//     setBucketAndKeys,
//     setValuesByKey
// }

// const connector = connect(mstp, mdtp)

export default MLBucketSelector

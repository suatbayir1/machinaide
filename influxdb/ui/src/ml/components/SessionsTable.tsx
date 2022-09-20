import { BorderType, Button, ButtonType, ComponentColor, ComponentSize, Dropdown, Panel, Table } from '@influxdata/clockface';
import React, {PureComponent} from 'react'
import { Source } from 'src/types';


interface Props {
    sessions: any[]
    // source: Source
    onSessionSelect: (
        sessionID: string, 
        from: string, 
        to: string, 
        // source: string, 
        database: string, 
        // rp: string, 
        // fields: any[], 
        // sessionPhase: string, 
        mlinfo: any
    ) => void
    onCreateSession: () => void
}

interface State {
    searchTerm: string,
    // sortDirection: Direction
    // sortKey: string
}


class SessionsTable extends PureComponent<Props, State> {
    constructor(props) {
        super(props)    
        this.state = {
          searchTerm: '',
        }
    }

    public render() {
        return  (
        //   <div className="panel">
        //     <div className="panel-heading">
        //       <h2 className="panel-title">{this.props.sessions.length} Sessions</h2>
        //       <button className="btn btn-sm btn-primary" onClick={()=>{this.props.onCreateSession()}}>Create Session</button>
        //     </div>
        //     <div className="panel-body">{this.renderTable()}</div>
        //   </div>
            <Panel>
                <Panel.Body size={ComponentSize.ExtraSmall}>
                    {this.renderTable()}
                </Panel.Body>
            </Panel>
        )
    }

    private renderTable(): JSX.Element {
        console.log(this.props.sessions)
        
        return this.props.sessions.length ? (
            <Table 
                borders={BorderType.Vertical}
                fontSize={ComponentSize.ExtraSmall}
                cellPadding={ComponentSize.ExtraSmall}>
                <Table.Header>
                    <Table.Row>
                        <Table.HeaderCell>Session ID</Table.HeaderCell>
                        <Table.HeaderCell>From</Table.HeaderCell>
                        <Table.HeaderCell>To</Table.HeaderCell>
                        <Table.HeaderCell>Database/RP</Table.HeaderCell>
                        <Table.HeaderCell>Fields</Table.HeaderCell>
                    </Table.Row>
                </Table.Header>
                <Table.Body>
                    {this.props.sessions.map(({sessionID, models, from, to, source, database, rp, fields, status, phase, mlinfo}) => {
                        return(
                            <Table.Row key={sessionID}>
                                <Table.Cell>{sessionID}</Table.Cell>
                                <Table.Cell>{from}</Table.Cell>
                                <Table.Cell>{to}</Table.Cell>
                                <Table.Cell>{database}.{rp}</Table.Cell>
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
                                        </Dropdown.Button>
                                        )}
                                        menu={onCollapse => (
                                        <Dropdown.Menu onCollapse={onCollapse}>
                                            {fields}
                                        </Dropdown.Menu>
                                        )}
                                    />
                                </Table.Cell>
                                <Table.Cell>
                                    <Button 
                                        color={ComponentColor.Primary}
                                        titleText="See session details"
                                        text="Details"
                                        type={ButtonType.Button}
                                        onClick={()=>this.props.onSessionSelect(sessionID, from, to, database, mlinfo)}/>
                                </Table.Cell>
                            </Table.Row>
                        )
                    })}
                </Table.Body>
            </Table>
        ) : (
          this.renderTableEmpty()
        )
      }
    
      private renderTableEmpty(): JSX.Element {
        return (
          <div className="generic-empty-state">
            <h4 className="no-user-select">There are no Sessions to display</h4>
            <br />
          </div>
        )
      }
}

export default SessionsTable
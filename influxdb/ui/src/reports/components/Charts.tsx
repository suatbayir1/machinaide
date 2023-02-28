// Libraries
import React, { PureComponent } from 'react';
import { Bar, Line, Pie, Doughnut, PolarArea, Radar, Scatter } from 'react-chartjs-2';

// Components
import { Grid, Columns, Panel } from '@influxdata/clockface'


interface Props { }
interface State {
    chartData: object
}

class Charts extends PureComponent<Props, State> {
    constructor(props) {
        super(props)

        this.state = {
            chartData: {
                labels: ["Boston", "Worcester", "Springfield", "Lowell", "Cambridge", "New Bedford"],
                datasets: [
                    {
                        label: 'Population',
                        data: [
                            617594,
                            181045,
                            153060,
                            106519,
                            105162,
                            95072
                        ],
                        backgroundColor: [
                            'rgba(255, 99, 132, 0.6)',
                            'rgba(54, 162, 235, 0.6)',
                            'rgba(255, 206, 86, 0.6)',
                            'rgba(75, 192, 192, 0.6)',
                            'rgba(153, 102, 255, 0.6)',
                            'rgba(255, 159, 64, 0.6)',
                        ],
                        borderColor: [
                            'rgba(255, 99, 132, 1)',
                            'rgba(54, 162, 235, 1)',
                            'rgba(255, 206, 86, 1)',
                            'rgba(75, 192, 192, 1)',
                            'rgba(153, 102, 255, 1)',
                            'rgba(255, 159, 64, 1)',
                        ],
                    },
                ]
            }
        }
    }

    rand = () => {
        return Math.round(Math.random() * 20 - 10);
    }

    public render() {
        return (
            <Grid>
                <Grid.Row>
                    <Grid.Column widthXS={Columns.Six}>
                        <Panel style={{ padding: '20px' }}>
                            <Grid.Row>

                                <Grid.Column widthXS={Columns.Six}>
                                    <h4>Factory: Ermetal Otomotiv A.Ş.</h4>
                                    <h4>Machine: Press030</h4>
                                    <h4>Component: ALL</h4>
                                </Grid.Column>

                                <Grid.Column widthXS={Columns.Six}>
                                    <h4>Author: Suat BAYIR</h4>
                                    <h4>Date: 21-05-25</h4>
                                </Grid.Column>
                            </Grid.Row>
                        </Panel>
                    </Grid.Column>

                    <Grid.Column widthXS={Columns.Six}>
                        <Panel style={{ padding: '20px' }}>
                            <h4>
                                Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has
                                been the industry's standard dummy text ever since the 1500s, when an unknown printer took a
                                galley of type and scrambled it to make a type specimen book. It has survived not only five
                                centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was
                                popularised in the 1960s with the release of Letraset sheets containing
                        </h4>
                        </Panel>
                    </Grid.Column>
                </Grid.Row>

                <Grid.Row>
                    <Grid.Column
                        widthXS={Columns.Two}
                        style={{ paddingRight: '30px' }}
                        id={"shortcutCard"}
                    >
                        <div className={"routingCard"} style={{ marginBottom: '40px', cursor: 'pointer' }}>
                            <div style={{ background: 'rgba(255, 255, 255, 0.1)', textAlign: 'center' }}>
                                <h4 style={{ marginTop: '20px', paddingTop: '20px' }} >Total Alerts</h4>
                                <h4 style={{ paddingBottom: '20px', color: 'white', fontSize: '20px' }}>{20}</h4>
                            </div>
                        </div>
                    </Grid.Column>

                    <Grid.Column
                        widthXS={Columns.Two}
                        style={{ paddingRight: '15px', paddingLeft: '15px' }}
                        id={"shortcutCard"}
                    >
                        <div className={"routingCard"} style={{ marginBottom: '40px', cursor: 'pointer' }}>
                            <div style={{ background: 'rgba(255, 255, 255, 0.1)', textAlign: 'center' }}>
                                <h4 style={{ marginTop: '20px', paddingTop: '20px' }} >Total Maintenance</h4>
                                <h4 style={{ paddingBottom: '20px', color: 'white', fontSize: '20px' }}>{30}</h4>
                            </div>
                        </div>
                    </Grid.Column>

                    <Grid.Column
                        widthXS={Columns.Two}
                        style={{ paddingRight: '15px', paddingLeft: '15px' }}
                        id={"shortcutCard"}
                    >
                        <div className={"routingCard"} style={{ marginBottom: '40px', cursor: 'pointer' }}>
                            <div style={{ background: 'rgba(255, 255, 255, 0.1)', textAlign: 'center' }}>
                                <h4 style={{ marginTop: '20px', paddingTop: '20px' }} >Total Failures</h4>
                                <h4 style={{ paddingBottom: '20px', color: 'white', fontSize: '20px' }}>{40}</h4>
                            </div>
                        </div>
                    </Grid.Column>

                    <Grid.Column
                        widthXS={Columns.Two}
                        style={{ paddingRight: '15px', paddingLeft: '15px' }}
                        id={"shortcutCard"}
                    >
                        <div className={"routingCard"} style={{ marginBottom: '40px', cursor: 'pointer' }}>
                            <div style={{ background: 'rgba(255, 255, 255, 0.1)', textAlign: 'center' }}>
                                <h4 style={{ marginTop: '20px', paddingTop: '20px' }} >Total Machine Actions</h4>
                                <h4 style={{ paddingBottom: '20px', color: 'white', fontSize: '20px' }}>{50}</h4>
                            </div>
                        </div>
                    </Grid.Column>

                    <Grid.Column
                        widthXS={Columns.Two}
                        style={{ paddingRight: '15px', paddingLeft: '15px' }}
                        id={"shortcutCard"}
                    >
                        <div className={"routingCard"} style={{ marginBottom: '40px', cursor: 'pointer' }}>
                            <div style={{ background: 'rgba(255, 255, 255, 0.1)', textAlign: 'center' }}>
                                <h4 style={{ marginTop: '20px', paddingTop: '20px' }} >Total Machine Actions</h4>
                                <h4 style={{ paddingBottom: '20px', color: 'white', fontSize: '20px' }}>{50}</h4>
                            </div>
                        </div>
                    </Grid.Column>

                    <Grid.Column
                        widthXS={Columns.Two}
                        style={{ paddingRight: '15px', paddingLeft: '15px' }}
                        id={"shortcutCard"}
                    >
                        <div className={"routingCard"} style={{ marginBottom: '40px', cursor: 'pointer' }}>
                            <div style={{ background: 'rgba(255, 255, 255, 0.1)', textAlign: 'center' }}>
                                <h4 style={{ marginTop: '20px', paddingTop: '20px' }} >Total Machine Actions</h4>
                                <h4 style={{ paddingBottom: '20px', color: 'white', fontSize: '20px' }}>{50}</h4>
                            </div>
                        </div>
                    </Grid.Column>
                </Grid.Row>


                <Grid.Row>
                    <Grid.Column widthXS={Columns.Six} style={{ marginBottom: '20px' }}>
                        <Panel style={{ backgroundColor: '#fff' }}>
                            <Bar
                                data={{
                                    labels: ["Press030", "Press031", "Press032", "Press033", "Press034", "Robot"],
                                    datasets: [
                                        {
                                            label: 'Task Count',
                                            data: [
                                                1341,
                                                788,
                                                1296,
                                                732,
                                                341,
                                                3575
                                            ],
                                            backgroundColor: [
                                                'rgba(255, 99, 132, 0.6)',
                                                'rgba(54, 162, 235, 0.6)',
                                                'rgba(255, 206, 86, 0.6)',
                                                'rgba(75, 192, 192, 0.6)',
                                                'rgba(153, 102, 255, 0.6)',
                                                'rgba(255, 159, 64, 0.6)',
                                            ],
                                            borderColor: [
                                                'rgba(255, 99, 132, 1)',
                                                'rgba(54, 162, 235, 1)',
                                                'rgba(255, 206, 86, 1)',
                                                'rgba(75, 192, 192, 1)',
                                                'rgba(153, 102, 255, 1)',
                                                'rgba(255, 159, 64, 1)',
                                            ],
                                        },
                                    ]
                                }}
                                height={400}
                                options={{
                                    indexAxis: 'y',
                                    maintainAspectRatio: false,
                                    plugins: {
                                        title: {
                                            display: true,
                                            text: 'Total task performed by machine',
                                            fontSize: 25
                                        },
                                    },
                                    legend: {
                                        display: true,
                                        position: 'top'
                                    }
                                }}
                            />
                        </Panel>
                    </Grid.Column>

                    <Grid.Column widthXS={Columns.Six} style={{ marginBottom: '20px' }}>
                        <Panel style={{ backgroundColor: '#fff' }}>
                            <Bar
                                data={{
                                    labels: ["Press030", "Press031", "Press032", "Press033", "Press034", "Robot"],
                                    datasets: [
                                        {
                                            label: 'Maintenance cost (TL)',
                                            data: [122745, 56750, 230495, 78500, 48666, 400000],
                                            backgroundColor: [
                                                'rgba(255, 99, 132, 0.6)',
                                                'rgba(54, 162, 235, 0.6)',
                                                'rgba(255, 206, 86, 0.6)',
                                                'rgba(75, 192, 192, 0.6)',
                                                'rgba(153, 102, 255, 0.6)',
                                                'rgba(255, 159, 64, 0.6)',
                                            ],
                                            borderColor: [
                                                'rgba(255, 99, 132, 1)',
                                                'rgba(54, 162, 235, 1)',
                                                'rgba(255, 206, 86, 1)',
                                                'rgba(75, 192, 192, 1)',
                                                'rgba(153, 102, 255, 1)',
                                                'rgba(255, 159, 64, 1)',
                                            ],
                                            borderWidth: 1,
                                        },
                                    ],
                                }}
                                height={400}
                                options={{
                                    maintainAspectRatio: false,
                                    plugins: {
                                        title: {
                                            display: true,
                                            text: 'Maintenance Cost By Machine (TL)',
                                            fontSize: 25
                                        },
                                    },
                                    legend: {
                                        display: true,
                                        position: 'top'
                                    },
                                    scales: {
                                        yAxes: [
                                            {
                                                ticks: {
                                                    beginAtZero: true,
                                                },
                                            },
                                        ],
                                    },
                                }}
                            />
                        </Panel>
                    </Grid.Column>

                    <Grid.Column widthXS={Columns.Four} style={{ marginBottom: '20px' }}>
                        <Panel style={{ backgroundColor: '#fff' }}>
                            <Line
                                data={{
                                    labels: ["Failure 1", "Failure 2", "Failure 3", "Failure 4", "Failure 5", "Failure 6"],
                                    datasets: [
                                        {
                                            label: 'Repair Time (minutes)',
                                            data: [
                                                127,
                                                89,
                                                94,
                                                154,
                                                168,
                                                17
                                            ],
                                            backgroundColor: [
                                                'rgba(255, 99, 132, 0.6)',
                                                'rgba(54, 162, 235, 0.6)',
                                                'rgba(255, 206, 86, 0.6)',
                                                'rgba(75, 192, 192, 0.6)',
                                                'rgba(153, 102, 255, 0.6)',
                                                'rgba(255, 159, 64, 0.6)',
                                            ],
                                            borderColor: [
                                                'rgba(255, 99, 132, 1)',
                                                'rgba(54, 162, 235, 1)',
                                                'rgba(255, 206, 86, 1)',
                                                'rgba(75, 192, 192, 1)',
                                                'rgba(153, 102, 255, 1)',
                                                'rgba(255, 159, 64, 1)',
                                            ],
                                        },
                                    ]
                                }}
                                height={400}
                                options={{
                                    maintainAspectRatio: false,
                                    plugins: {
                                        title: {
                                            display: true,
                                            text: 'Failure Repair Time (minutes)',
                                            fontSize: 25
                                        },
                                    },
                                    legend: {
                                        display: true,
                                        position: 'top'
                                    }
                                }}
                            />
                        </Panel>
                    </Grid.Column>

                    <Grid.Column widthXS={Columns.Four} style={{ marginBottom: '20px' }}>
                        <Panel style={{ backgroundColor: '#fff' }}>
                            <Pie
                                data={{
                                    labels: ["Type 1", "Type 2", "Type 3", "Type 4"],
                                    datasets: [
                                        {
                                            label: 'Population',
                                            data: [
                                                15,
                                                24,
                                                32,
                                                6
                                            ],
                                            backgroundColor: [
                                                'rgba(255, 99, 132, 0.6)',
                                                'rgba(54, 162, 235, 0.6)',
                                                'rgba(255, 206, 86, 0.6)',
                                                'rgba(75, 192, 192, 0.6)',
                                                'rgba(153, 102, 255, 0.6)',
                                                'rgba(255, 159, 64, 0.6)',
                                            ],
                                            borderColor: [
                                                'rgba(255, 99, 132, 1)',
                                                'rgba(54, 162, 235, 1)',
                                                'rgba(255, 206, 86, 1)',
                                                'rgba(75, 192, 192, 1)',
                                                'rgba(153, 102, 255, 1)',
                                                'rgba(255, 159, 64, 1)',
                                            ],
                                        },
                                    ]
                                }}
                                height={400}
                                options={{
                                    maintainAspectRatio: false,
                                    plugins: {
                                        title: {
                                            display: true,
                                            text: 'Maintenance distribution by maintenance type',
                                            fontSize: 25
                                        },
                                    },
                                    legend: {
                                        display: true,
                                        position: 'top'
                                    }
                                }}
                            />
                        </Panel>
                    </Grid.Column>

                    <Grid.Column widthXS={Columns.Four} style={{ marginBottom: '20px' }}>
                        <Panel style={{ backgroundColor: '#fff' }}>
                            <Doughnut
                                data={{
                                    labels: ["INFO", "ERROR", "WARNING"],
                                    datasets: [
                                        {
                                            label: 'Type',
                                            data: [
                                                78,
                                                90,
                                                200
                                            ],
                                            backgroundColor: [
                                                'rgba(255, 99, 132, 0.6)',
                                                'rgba(54, 162, 235, 0.6)',
                                                'rgba(255, 206, 86, 0.6)',
                                                'rgba(75, 192, 192, 0.6)',
                                                'rgba(153, 102, 255, 0.6)',
                                                'rgba(255, 159, 64, 0.6)',
                                            ],
                                            borderColor: [
                                                'rgba(255, 99, 132, 1)',
                                                'rgba(54, 162, 235, 1)',
                                                'rgba(255, 206, 86, 1)',
                                                'rgba(75, 192, 192, 1)',
                                                'rgba(153, 102, 255, 1)',
                                                'rgba(255, 159, 64, 1)',
                                            ],
                                        },
                                    ]
                                }}
                                height={400}
                                options={{
                                    maintainAspectRatio: false,
                                    plugins: {
                                        title: {
                                            display: true,
                                            text: 'Alert distribution by types',
                                            fontSize: 25
                                        },
                                    },
                                    legend: {
                                        display: true,
                                        position: 'top'
                                    }
                                }}
                            />
                        </Panel>
                    </Grid.Column>

                    <Grid.Column widthXS={Columns.Six} style={{ marginBottom: '20px' }}>
                        <Panel style={{ backgroundColor: '#fff' }}>
                            <Bar
                                data={{
                                    labels: ['25 May', '26 May', '27 May', '28 May', '29 May', '30 May'],
                                    datasets: [
                                        {
                                            label: 'Failure',
                                            data: [12, 19, 3, 5, 2, 3],
                                            backgroundColor: 'rgb(255, 99, 132)',
                                        },
                                        {
                                            label: 'Maintenance',
                                            data: [2, 3, 20, 5, 1, 4],
                                            backgroundColor: 'rgb(54, 162, 235)',
                                        },
                                        {
                                            label: 'Alert',
                                            data: [3, 10, 13, 15, 22, 30],
                                            backgroundColor: 'rgb(75, 192, 192)',
                                        },
                                    ],
                                }}
                                height={400}
                                options={{
                                    maintainAspectRatio: false,
                                    plugins: {
                                        title: {
                                            display: true,
                                            text: 'Total maintenance, failure, alert by days',
                                            fontSize: 25
                                        },
                                    },
                                    legend: {
                                        display: true,
                                        position: 'top'
                                    },
                                    scales: {
                                        yAxes: [
                                            {
                                                ticks: {
                                                    beginAtZero: true,
                                                },
                                            },
                                        ],
                                    },
                                }}
                            />
                        </Panel>
                    </Grid.Column>

                    <Grid.Column widthXS={Columns.Six} style={{ marginBottom: '20px' }}>
                        <Panel style={{ backgroundColor: '#fff' }}>
                            <Line
                                data={{
                                    labels: ['1', '2', '3', '4', '5', '6'],
                                    datasets: [
                                        {
                                            label: 'Failure',
                                            borderColor: 'rgba(255, 99, 132, 0.6)',
                                            data: [12, 19, 3, 5, 2, 3],
                                            fill: false,
                                            backgroundColor: 'rgb(255, 99, 132)',
                                        },
                                        {
                                            label: 'Maintenance',
                                            fill: false,
                                            data: [2, 3, 20, 5, 1, 4],
                                            borderColor: 'rgba(75, 192, 192, 0.6)',
                                            backgroundColor: 'rgb(54, 162, 235)',
                                        },
                                        {
                                            borderColor: 'rgba(153, 102, 255, 0.6)',
                                            fill: false,
                                            label: 'Alert',
                                            data: [3, 10, 13, 15, 22, 30],
                                            backgroundColor: 'rgb(75, 192, 192)',
                                        },
                                    ],
                                }}
                                height={400}
                                options={{
                                    maintainAspectRatio: false,
                                    plugins: {
                                        title: {
                                            display: true,
                                            text: 'Total maintenance, failure, alert by days',
                                            fontSize: 25
                                        },
                                    },
                                    legend: {
                                        display: true,
                                        position: 'top'
                                    },
                                    scales: {
                                        yAxes: [
                                            {
                                                type: 'linear',
                                                display: true,
                                                position: 'right',
                                                id: 'y-axis-2',
                                                gridLines: {
                                                    drawOnArea: false,
                                                },
                                            },
                                        ],
                                    },
                                }}
                            />
                        </Panel>
                    </Grid.Column>

                    <Grid.Column widthXS={Columns.Three} style={{ marginBottom: '20px' }}>
                        <Panel style={{ backgroundColor: '#fff' }}>
                            <PolarArea
                                data={{
                                    labels: ['Red', 'Blue', 'Yellow', 'Green', 'Purple', 'Orange'],
                                    datasets: [
                                        {
                                            label: '# of Votes',
                                            data: [12, 19, 3, 5, 2, 3],
                                            backgroundColor: [
                                                'rgba(255, 99, 132, 0.5)',
                                                'rgba(54, 162, 235, 0.5)',
                                                'rgba(255, 206, 86, 0.5)',
                                                'rgba(75, 192, 192, 0.5)',
                                                'rgba(153, 102, 255, 0.5)',
                                                'rgba(255, 159, 64, 0.5)',
                                            ],
                                            borderWidth: 1,
                                        },
                                    ],
                                }}
                                height={400}
                                options={{
                                    maintainAspectRatio: false,
                                    plugins: {
                                        title: {
                                            display: true,
                                            text: 'Chart.js Polar Chart',
                                            fontSize: 25
                                        },
                                    },
                                    legend: {
                                        display: true,
                                        position: 'top'
                                    },
                                }}
                            />
                        </Panel>
                    </Grid.Column>

                    <Grid.Column widthXS={Columns.Three} style={{ marginBottom: '20px' }}>
                        <Panel style={{ backgroundColor: '#fff' }}>
                            <Radar
                                data={{
                                    labels: ['Thing 1', 'Thing 2', 'Thing 3', 'Thing 4', 'Thing 5', 'Thing 6'],
                                    datasets: [
                                        {
                                            label: '# of Votes',
                                            data: [2, 9, 3, 5, 2, 3],
                                            backgroundColor: 'rgba(255, 99, 132, 0.2)',
                                            borderColor: 'rgba(255, 99, 132, 1)',
                                            borderWidth: 1,
                                        },
                                    ],
                                }}
                                height={400}
                                options={{
                                    maintainAspectRatio: false,
                                    plugins: {
                                        title: {
                                            display: true,
                                            text: 'Chart.js Radar Chart',
                                            fontSize: 25
                                        },
                                    },
                                    legend: {
                                        display: true,
                                        position: 'top'
                                    },
                                    scale: {
                                        ticks: { beginAtZero: true },
                                    },
                                }}
                            />
                        </Panel>
                    </Grid.Column>

                    <Grid.Column widthXS={Columns.Six} style={{ marginBottom: '20px' }}>
                        <Panel style={{ backgroundColor: '#fff' }}>
                            <Scatter
                                data={{
                                    datasets: [
                                        {
                                            label: 'A dataset',
                                            data: [
                                                { x: this.rand(), y: this.rand() },
                                                { x: this.rand(), y: this.rand() },
                                                { x: this.rand(), y: this.rand() },
                                                { x: this.rand(), y: this.rand() },
                                                { x: this.rand(), y: this.rand() },
                                                { x: this.rand(), y: this.rand() },
                                                { x: this.rand(), y: this.rand() },
                                                { x: this.rand(), y: this.rand() },
                                                { x: this.rand(), y: this.rand() },
                                                { x: this.rand(), y: this.rand() },
                                                { x: this.rand(), y: this.rand() },
                                                { x: this.rand(), y: this.rand() },
                                                { x: this.rand(), y: this.rand() },
                                                { x: this.rand(), y: this.rand() },
                                            ],
                                            backgroundColor: 'rgba(255, 99, 132, 1)',
                                        },
                                    ],
                                }}
                                height={400}
                                options={{
                                    maintainAspectRatio: false,
                                    plugins: {
                                        title: {
                                            display: true,
                                            text: 'Chart.js Scatter Chart',
                                            fontSize: 25
                                        },
                                    },
                                    legend: {
                                        display: true,
                                        position: 'top'
                                    },
                                    scales: {
                                        yAxes: [
                                            {
                                                ticks: {
                                                    beginAtZero: true,
                                                },
                                            },
                                        ],
                                    }
                                }}
                            />
                        </Panel>
                    </Grid.Column>





                </Grid.Row>
            </Grid>
        )
    }
}


export default Charts;

import React from "react";
import Chart from "react-apexcharts";

const LineChart = props => {
    const options = {
        chart: {
            foreColor: "#fff",
            id: 'apexchart-example'
        },
        colors: ["#17ead9", "#f02fc2"],
        xaxis: {
            categories: props.xaxis,
            title: {
                text: 'Time'
            }
        },
        yaxis: {
            title: {
                text: 'Value'
            },
        },
        animations: {
            enabled: false,
            easing: 'easeinout',
            speed: 800,
            animateGradually: {
                enabled: true,
                delay: 150
            },
            dynamicAnimation: {
                enabled: true,
                speed: 350
            }
        },
        theme: {
            mode: 'dark',
            palette: 'palette1',
            monochrome: {
                enabled: false,
                color: '#255aee',
                shadeTo: 'dark',
                shadeIntensity: 0.65
            },
        },
        stroke: {
            curve: 'smooth'
        },
        title: {
            text: `Field: ${props.field.displayName}`,
            align: 'left'
        },
        dataLabels: {
            enabled: true,
        },
        noData: {
            text: "There is no data (Please check your data source configuration)",
            align: 'center',
            verticalAlign: 'middle',
            offsetX: 0,
            offsetY: 0,
            style: {
                color: '#17ead9',
                fontSize: '16px',
                fontFamily: undefined
            },
        },
        grid: {
            show: props.dataList.length < 1 ? false : true,
        },
    };

    return <Chart
        type={props.graphType}
        options={options}
        series={[{
            name: props.field.displayName,
            data: props.dataList
        }]}
        height={600}
    />;
};

export default LineChart;
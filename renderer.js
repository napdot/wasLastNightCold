const serialport = require('serialport');
const Readline = require('@serialport/parser-readline');
const Chart = require('chart.js');

async function listSerialPorts() {
    await serialport.list().then((ports, err) => {
        if(err) {
            console.log(err.message);
            return
        } else {
            console.log("no error");
        }
        console.log('ports', ports);

        ports.forEach((port) => {
            const mainArea = document.getElementById('serial-listing');
            const template = document.querySelector('#serial-port-ind');
            let clone = document.importNode(template.content, true);
            clone.querySelector('.serial-port-name').innerText = port.path;
            mainArea.appendChild(clone);
        });
    });
}
function average(array) {
    if (array.length === 0) {
        return 0;
    }
    let sum = 0;
    array.forEach((number) => {
        sum += parseInt(number);
    });
    return (Math.round((sum/array.length) * 100)) / 100;
}

function displayReceivedData(data) {
    // data received format [time since last reading] , [last reading], [second last reading], ...
    let display = document.getElementById("received-data-span");
    let currentTime = new Date();
    let temperatures = data.toString().split(', ');
    let instruction = document.getElementById('instruction')
    // temperatures from oldest to newest
    temperatures.reverse();
    // get last reading time
    let timeSince = temperatures.pop();
    // calculate the readings times
    let lastReadingTime = (currentTime.getTime() - timeSince);
    lastReadingTime = new Date(lastReadingTime);    // Not sure if overuse. depends on operator result
    display.innerText = "Last reading was " + Math.floor((timeSince / (60 * 1000))) + " minutes ago";
    let timestamps = [];
    temperatures.forEach(function (reading, i) {
        // Timestamps from oldest to newest
        let timestamp = new Date(lastReadingTime - ((temperatures.length - i) * 1000 * 60 * 60));   // 1000ms * 60s * 60m = 1h
        timestamps.push(timestamp);
    });

    document.getElementById('chart-div').style.visibility = 'visible';

    // Add chart to canvas
    const canvas = document.getElementById('canvas-graph');
    const options = {day: 'numeric', month: 'numeric', hour: 'numeric'};

    let dateLabels = [];
    timestamps.forEach((t) => {
        dateLabels.push(t.toLocaleString("en-US", options));
    });

    let datas = {
        labels: dateLabels,
        datasets: [{
            label: "Temperature",
            data: temperatures,
        }
        ]
    };
    let chartOptions = {
        legend: {
            display: false
        },
        tooltips: {
            enabled: false
        }
    };
    let lineChart = new Chart(canvas, {
        type: 'line',
        data: datas,
        options: chartOptions
    });

    let allButton = document.getElementById('all-button');
    allButton.addEventListener('click', () => {
        console.log("Displaying all");
        datas.datasets[0].data = temperatures;
        datas.labels = dateLabels;
        lineChart.update();
        document.getElementById('temp-span').innerText = (average(datas.datasets[0].data) + "º");

    });
    let last24Button = document.getElementById('last-24-button');
    last24Button.addEventListener('click', () => {
        console.log("Displaying last 24");
        datas.datasets[0].data = (temperatures.length <= 24) ? temperatures : temperatures.slice(-24);
        datas.labels = (temperatures.length <= 24)? dateLabels : dateLabels.slice(-24);
        lineChart.update();
        document.getElementById('temp-span').innerText = (average(datas.datasets[0].data) + "º");
    });

    let lastNightButton = document.getElementById('last-night-button');
    lastNightButton.addEventListener('click', () => {
        console.log("Displaying last night");
        // find last 24 hours readings that are inbetween 20:00-8:00
        let tempL = (temperatures.length <= 24) ? temperatures : temperatures.slice(-24);
        let tempD = (temperatures.length <= 24)? dateLabels : dateLabels.slice(-24);
        let finalL = [];
        let finalD = [];

        // Yeah, I suck :D. It even needs spaces
        const validStrings = [" 8 PM", " 9 PM", " 10 PM", " 11 PM", " 12 AM", " 1 AM", " 2 AM", " 3 AM", " 4 AM", " 5 AM", " 6 AM", " 7 AM",  "8 AM"];
        // This sucks even more :p
        tempD.forEach(function (d, i) { // Check each date
            validStrings.forEach((s) => {
                if (d.includes(s)){     // if it includes any of the valid strings
                    finalL.push(tempL[i]) //save by index
                    finalD.push(tempD[i]);
                }});
        });


        // document.getElementById('temp-span').innerText = (average(finalL) + "º");
        datas.datasets[0].data = finalL;
        datas.labels = finalD;
        lineChart.update();
        document.getElementById('temp-span').innerText = (average(datas.datasets[0].data) + "º");

    });
    document.getElementById('temp-span').innerText = (average(datas.datasets[0].data) + "º");
    setTimeout(() => {
        instruction.innerText = 'Done :D';
    }, 1000);

}

function main(){
    listSerialPorts();
    const display = document.getElementById("received-data-span");
    const instruction = document.getElementById('instruction')
    const dropdown = document.getElementById('serial-listing');
    document.getElementById('chart-div').style.visibility = 'hidden';
    let obtainedData;
    let port = null;
    instruction.innerText = "Morning!"
    setTimeout(() => {  instruction.innerText = "Select BT port"; }, 2000);

    dropdown.addEventListener("change", function () {
        if (port){
            port.close(function (err) {
                console.log('Port closed', err);
                port = null;
                instruction.innerText = "Port was closed";
                display.innerText = "";
            });
        }
        if (dropdown.selectedIndex !== 0) {
           if (port === null){
               console.log('New port connection to: ', dropdown.value);
               port = new serialport(dropdown.value, {autoOpen: true}, function (err){
                   if (err) {
                       return console.log('Port connection error');
                   }
                   instruction.innerText = "Connection started"
               })
               const parser = port.pipe(new Readline({ delimiter: '\n' }));

               port.on('data', (data) => {
                   obtainedData = data;
                   instruction.innerText = "Received new data";
                   console.log("Received data");
                   document.getElementById('serial-container-div').style.visibility = 'hidden';
                   displayReceivedData(obtainedData);

               });
               setTimeout(() => {
                   instruction.innerText = "Requesting data...";
                   port.write("1");
               }, 1000);
           }
           else {
               console.log('Did not start port');
           }
        }
    });
}

main()
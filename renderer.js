const readingsPerHour = 4;
const readingInterval = (60/readingsPerHour)*60*1000;
const serialport = require('serialport');
const Chart = require('chart.js');
let port;
let receivedData = [];

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

async function displayReceivedData(data) {
    // data received format [time since last reading] , [last reading], [second last reading], ...
    let display = document.getElementById("received-data-span");
    let currentTime = new Date();
    let temperatures = data.toString().split(', ');
    let instruction = document.getElementById('instruction')
    // temperatures from oldest to newest
    temperatures = temperatures.reverse();
    // get last reading time
    let timeSince = temperatures.pop();
    timeSince = timeSince.replace(',','');
    // calculate the readings times
    timeSince = parseInt(timeSince);

    console.log("Minutes since last reading :" + Math.floor((timeSince / (60 * 1000))));
    let lastReadingTime = (currentTime.getTime() - timeSince);
    lastReadingTime = new Date(lastReadingTime);    // Not sure if overuse. depends on operator result
    display.innerText = "Last reading was " + Math.floor((timeSince / (60 * 1000))) + " minutes ago";
    setInterval(function() {
        timeSince = parseInt(timeSince) + (1000*60);
        display.innerText = "Last reading was " + Math.floor((timeSince / (60 * 1000))) + " minutes ago";
    }, 60 * 1000);
    let timestamps = [];
    let temperaturesClean = [];
    temperatures.forEach(function (reading, i) {
        // Timestamps from oldest to newest
        let timestamp = new Date(lastReadingTime - ((temperatures.length -1 - i) * readingInterval));
        timestamps.push(timestamp);
        temperaturesClean.push(reading.replace(',',''));
    });
    console.log("Timestamps:");
    console.log(timestamps);
    console.log("\n Temperatures:");
    console.log(temperaturesClean);

    document.getElementById('chart-div').style.visibility = 'visible';

    // Add chart to canvas
    const canvas = document.getElementById('canvas-graph');
    const options = {hour12: false, day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'};

    let dateLabels = [];
    timestamps.forEach((t) => {
        dateLabels.push(t.toLocaleString("en-US", options));
    });

    let datas = {
        labels: dateLabels,
        datasets: [{
            label: "Temperature",
            data: temperaturesClean,
            tension: 0.2,
            pointHoverRadius: 10
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
        datas.datasets[0].data = temperaturesClean;
        datas.labels = dateLabels;
        lineChart.update();
        document.getElementById('temp-span').innerText = (average(datas.datasets[0].data) + "º");

    });
    let last24Button = document.getElementById('last-24-button');
    last24Button.addEventListener('click', () => {
        console.log("Displaying last 24");
        datas.datasets[0].data = (temperaturesClean.length <= 24 * readingsPerHour) ? temperaturesClean : temperaturesClean.slice(-24 * readingsPerHour);
        datas.labels = (temperaturesClean.length <= 24 * readingsPerHour) ? dateLabels : dateLabels.slice(-24 * readingsPerHour);
        lineChart.update();
        document.getElementById('temp-span').innerText = (average(datas.datasets[0].data) + "º");
    });

    let lastNightButton = document.getElementById('last-night-button');
    lastNightButton.addEventListener('click', () => {
        console.log("Displaying last night");
        // find last 24 hours readings that are inbetween 20:00-8:00
        let tempL = (temperaturesClean.length <= 24 * readingsPerHour) ? temperaturesClean : temperaturesClean.slice(-24 * readingsPerHour);
        let tempD = (temperaturesClean.length <= 24 * readingsPerHour) ? dateLabels : dateLabels.slice(-24 * readingsPerHour);
        let finalL = [];
        let finalD = [];

        // Yeah, I suck :D. It even needs spaces
        const validStrings = [" 20:", " 21:", " 22:", " 23:", " 00:", " 01:", " 02:", " 03:", " 04:", " 05:", " 06:", " 07:",  " 08:"];
        // This sucks even more :p
        tempD.forEach(function (d, i) { // Check each date
            validStrings.forEach((s) => {
                if (d.includes(s)){     // if it includes any of the valid strings
                    finalL.push(tempL[i]) //save by index
                    finalD.push(tempD[i]);
                }});
        });

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


async function listSerialPorts() {
    await serialport.list().then((ports, err) => {
        if (err) {
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

window.addEventListener('load', () => {
    document.getElementById('instruction').innerText = "Morning!";
    listSerialPorts();
});


document.getElementById("serial-listing").addEventListener('change', () => {
    if (this.selectedIndex !== 0) {
        console.log('New port connection to: ', document.getElementById("serial-listing").value);
        port = new serialport(document.getElementById("serial-listing").value, {autoOpen: true}, function (err) {
            if (err) {
                console.log(err);
                document.getElementById('instruction').innerText = "Port error";
                return console.log('Port connection error');
            }
            document.getElementById('instruction').innerText = "Connection started";
            port.write("1\r\n", function(err) {
                if (err) {
                    return console.log('Error while writing: ', err.message)
                }
                document.getElementById('instruction').innerText = "Requesting data...";
                console.log('Message sent.')
            });
            port.on('readable', function () {
                let data = port.read();
                receivedData.push(data);
                document.getElementById('make-container').style.visibility = 'visible';
                document.getElementById('instruction').innerText = "Data received";
            })
        });
    };
});
document.getElementById("make-graphs").addEventListener('click', () => {
    console.log("Received data (raw): ");
    console.log(receivedData.toString().split(', '));
    displayReceivedData(receivedData);
});




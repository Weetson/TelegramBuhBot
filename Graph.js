import { createCanvas, loadImage } from 'canvas';
import fs from 'fs';
import Chart from 'chart.js/auto';

class Graph {
    constructor() {
        const canvasWidth = 800;
        const canvasHeight = 600;
        this.canvas = createCanvas(canvasWidth, canvasHeight);
        this.ctx = this.canvas.getContext('2d');
    }
    
    async createGraph(graphData) {
        const chart = new Chart(this.ctx, {
            type: 'bar',
            data: {
                labels: ['food', 'health', 'road', 'car', 'kom', 'wb', 'edu', 'sport', 'ipot', 'entertai', 'cloth', 'inet'],
                datasets: [{
                    label: '# of Votes',
                    data: [graphData.food, graphData.health, graphData.road, graphData.car, graphData.kom, graphData.wb, graphData.edu, graphData.sport, graphData.ipot, graphData.entertai, graphData.cloth, graphData.inet],
                    borderWidth: 1
                }]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
        const graphname = new Date().getTime();
        chart.render();
        const buffer = this.canvas.toBuffer('image/png');
        fs.writeFileSync(`graphs/${graphname}.png`, buffer);
        chart.destroy()
        return graphname;
    }

    async processData(rawData) {
        var data = [["food", 0], ["health", 0], ["road", 0], ["car", 0], ["kom", 0], ["wb", 0], ["edu", 0], ["sport", 0], ["ipot", 0], ["entertai", 0], ["cloth", 0], ["inet", 0]]
        const felina = {};
        data.forEach(del => {
            rawData.forEach(rdel => {
                if (rdel.cause == del[0]) {
                    del[1] += rdel.spentmoney
                }
            });
            felina[del[0]] = del[1]; 
        });
        console.log(felina)
        return felina;
    }
}

export default new Graph();

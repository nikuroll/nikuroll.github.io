var nodes = [
    { id: 0, name: "Team A" },
    { id: 1, name: "Team B" },
    { id: 2, name: "Team C" },
    { id: 3, name: "Team D" }
];

var links = [
    { source: 0, target: 1 },
    { source: 2, target: 3 },
    { source: 0, target: 2 }
];


var width = 800, height = 600;

var svg = d3.select("svg")
    .attr("width", width)
    .attr("height", height);

var cola = cola.d3adaptor(d3)
    .size([width, height])
    .nodes(nodes)
    .links(links)
    .start();

var link = svg.selectAll(".link")
    .data(links)
    .enter().append("line")
    .attr("class", "link");

var node = svg.selectAll(".node")
    .data(nodes)
    .enter().append("circle")
    .attr("class", "node")
    .attr("r", 10)
    .call(cola.drag);

node.append("title")
    .text(function(d) { return d.name; });

cola.on("tick", function() {
    link.attr("x1", function(d) { return d.source.x; })
        .attr("y1", function(d) { return d.source.y; })
        .attr("x2", function(d) { return d.target.x; })
        .attr("y2", function(d) { return d.target.y; });

    node.attr("cx", function(d) { return d.x; })
        .attr("cy", function(d) { return d.y; });
});

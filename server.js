var express = require('express');
var mysql= require('mysql');

app = express();
var server = app.listen(3000);
console.log("Server Running Port 3000");

app.use(express.static('public'));

var socket = require('socket.io');
var io = socket(server);

var connection = mysql.createConnection({
    host: 'localhost',
    user: 'username',
    password: 'password',
    database: 'parking',
});
var table_college_info = 'college_info';

var rooms = [];
var clients = {};

io.sockets.on('connection', newConnection);

function newConnection(socket){
    console.log();
    console.log("New Client");
    console.log("ID : " + socket.id);
    var query = "Select * From "+ table_college_info;
    connection.query( query , function(err,results) {
        if(err){
            console.log("Error while querying ");
            console.log("query : " + query);
            console.log("error  :" + err);
        }
        else{
            socket.emit('data', results);
        }
    })
    
    
}
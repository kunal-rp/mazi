/*
Googel maps API - AIzaSyAxd3Map2ywV6pBHK1zDSj2CRYVObC6ZVM
*/

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
var table_parkinglot_info = '_parkingLots';

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
    });
    
    
    socket.on('get_parkinglot_data',function(data){
        var college_id = data.college_id;
        var query = "Select * from "+college_id+table_parkinglot_info;
        connection.query(query, function(err,results){
            if(err){
                console.log('Error: '+err);
            }
            else{
                socket.emit('get_parkinglot_data',results);
            }
        });
    });
    
}
function getCollegeData(college_data){
    
}
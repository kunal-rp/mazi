/*
Googel maps API - AIzaSyAxd3Map2ywV6pBHK1zDSj2CRYVObC6ZVM
*/

var express = require('express');
var mysql= require('mysql');
var WebSocket = require('ws');


app = express();
var server = app.listen(3000);
console.log("Server Running Port 3000");

app.use(express.static('public'));

var connection = mysql.createConnection({
    host: 'localhost',
    user: 'username',
    password: 'password',
    database: 'parking',
});
var table_college_info = 'college_info';
var table_parkinglot_info = 'parkinglot_info';
var table_area = "_area";

var clients = {};

app.get('/getCollegeData', function (req, res) {
    
    var query = "Select * From "+ table_college_info;
    connection.query( query , function(err,results) {
        if(err){
            console.log("query : " + query);
            console.log("error  :" + err);
        }
        else{ 
            var final = {};
            var array = [];
            for(i=0;i < results.length; i++){
               array.push(results[i]['college_id']);
                final[results[i]['college_id']] = 
               {college_name : results[i]['college_name'],
                college_coor_lat : results[i]['college_coor_lat'],
                college_coor_lng : results[i]['college_coor_lng']};
            }
            final['ids'] = array;
            res.end(JSON.stringify(final));
        }
    });
})

app.get('/getParkingData', function (req, res) {
    
        var query = "Select * from "+table_parkinglot_info;
        connection.query(query, function(err,results){
            if(err){
                console.log("query : " + query);
                console.log("error  :" + err);
            }
            else{
                var final = {};
                var array = [];
                for(i=0;i < results.length; i++){
                   array.push(results[i]['parkinglot_id']);
                
                    var ci = results[i]['college_id'];
                    var pi = parseInt(results[i]['parkinglot_id']);
                    
                    var temp = {};
                    temp = 
                   {parkinglot_name : results[i]['parkinglot_name'],
                    coor_lat : results[i]['coor_lat'],
                    coor_lng : results[i]['coor_lng'],
                   college_id : results[i]['college_id']};
                    final[pi] = temp;
                    console.log();
                    console.log(final);
                    console.log();
                }
                final['ids'] = array;
                res.end(JSON.stringify(final));
                console.log(final);
            }
        });
})

var wss = new WebSocket.Server({ server });


wss.on('connection', function connection(ws) {
  
    console.log("New Websocket");

    ws.on('message', function incoming(message) {
        console.log('received: %s', data);
    });
    ws.on('close',function close(){
        console.log("disconnect");
    });
    
    // ws.onmessage = function(data){
    //     data = JSON.parse(data.data);
    
    // }
                
});




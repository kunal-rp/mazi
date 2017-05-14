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
  
    console.log();
    console.log("New Client");
    
    var initial_data = {};
    
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
           initial_data['college_data'] = final;
            
            var query2 = "Select * from "+table_parkinglot_info;
            connection.query(query2, function(err2,results2){
            if(err2){
                console.log("query : " + query2);
                console.log("error  :" + err2);
            }
            else{
                var final2 = {};
                var array2 = [];
                for(i=0;i < results2.length; i++){
                   array2.push(results2[i]['parkinglot_id']);
                
                    var ci = results2[i]['college_id'];
                    var pi = parseInt(results2[i]['parkinglot_id']);
                    
                    var temp2 = {};
                    temp2 = 
                   {parkinglot_name : results2[i]['parkinglot_name'],
                    coor_lat : results2[i]['coor_lat'],
                    coor_lng : results2[i]['coor_lng'],
                   college_id : results2[i]['college_id']};
                    final2[pi] = temp2;
                }
                final2['ids'] = array2;
                initial_data['parking_data'] = final2;
                initial_data["event"] = "data";
                ws.send(JSON.stringify(initial_data));
            }
        });
            
        }
    });
    

    ws.on('message', function incoming(message) {
        console.log('received: %s', data);
    });
    ws.on('close',function close(){
        console.log("disconnect");
        
        if(clients[socket.id] != undefined){
            var user_id = clients[socket.id]['user'].user_id;
            var college_id = clients[socket.id].college_id;
            
            var query = "Delete from "+college_id+table_area+ " Where user_id = "+user_id;
            connection.query(query, function(err,results){
                if(err){
                    console.log('Error: '+err);
                    console.log(query);
                }
                else{
                    socket.emit('event',{code:500, results});
                }   
            });    
            socket.leave(college_id);
            delete clients[socket.id];
        }
        
    });
    
    // ws.onmessage = function(data){
    //     data = JSON.parse(data.data);
    
    // }
                
});




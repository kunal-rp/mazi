/*
Googel maps API - AIzaSyAxd3Map2ywV6pBHK1zDSj2CRYVObC6ZVM
*/

var express = require('express');
var mysql= require('mysql');

app = express();
var server = app.listen(3000,'0.0.0.0');
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


io.sockets.on('connection', newConnection);

function newConnection(socket){
    console.log();
    console.log("New Client");
    console.log("ID : " + socket.id);
    
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
                console.log('initial_data')    
                console.log(initial_data);
                socket.emit('data',initial_data);
            }
        });
            
        }
    });
    
    
    socket.on('register', function(data){
        
        console.log("Register Data");
        console.log(data);
        
        clients[socket.id] = {college_id : data.college_id, user : data.user, client_type : data.type , time : data.time};
        socket.join(college_id);
        
        var user_id = clients[socket.id].user.user_id;
        var user_name = clients[socket.id].user.user_name;
        
        var time = clients[socket.id].time;
        var college_id = clients[socket.id].college_id;
        var parkinglot_id = data.parkinglot_id;
        var client_type = clients[socket.id].client_type;
        var opposite_type = 'ride';
        
        
        if(client_type == 'ride'){
            opposite_type = 'park';
        }
        
        var query_1 = "Select * from "+college_id+table_area+ " Where time = "+time +" && parkinglot_id like '%"+parkinglot_id+"%' && type = '" + opposite_type+"'";
        connection.query(query_1, function(err_1,results_1){
            if(err_1){
                console.log('Error  : '+err_1);
                console.log(query_1);
            }
            else{
                console.log("Results:");
                console.log(results_1);
                if(results_1.length == 0){
                    socket.emit('event',{code: 200} );
                    
                    var query_2 = "INSERT into "+college_id+table_area+"(`user_id`, `user_name`, `parkinglot_id`, `time`, `type`, `socket_id`) VALUES( "+ user_id+",'"+user_name+"','"+parkinglot_id+"',"+time +",'"+client_type+"','"+socket.id+"')";
                    connection.query(query_2, function(err_2,results_2){
                        if(err_2){
                            console.log('Error: '+err_2);
                            console.log(query_2);
                        }
                        else{
                            socket.emit('event',{code: 100} );
                        }
                    });
                    
                    
                }
                else{
                    results_1 = results_1[0];
                    
                    var mirror_socket_id = results_1.socket_id;
                    var mirror_user_id = results_1.user_id;
                    
                    io.to(mirror_socket_id).emit('event',{code:400, message: "Connected with "+user_name+ " ["+user_id+"] "});
                    io.to(socket.id).emit('event',{code:400, message: "Connected with "+results_1['user_name']+ " ["+results_1['user_id']+"] "});
                    
                    io.to(mirror_socket_id).emit('match',{});
                    io.to(socket.id).emit('match',{});
                    
                    var query = "Delete from "+college_id+table_area+ " Where user_id = "+mirror_user_id;
                    connection.query(query, function(err,results){
                        if(err){
                            console.log('Error: '+err);
                            console.log(query);
                        }   
                    });
                }
            }
        });
        
    });
    
    socket.on('disconnect', function(){ 
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
    
}



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
var table_parkinglot_info = 'parkinglot_info';
var table_area = "_area";

var clients = {};

io.sockets.on('connection', newConnection);



function newConnection(socket){
    console.log();
    console.log("New Client");
    console.log("ID : " + socket.id);
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
            socket.emit('initial_data',final);
            
        }
    });
    
    
    socket.on('get_parkinglot_data',function(data){
        college_id = data.college_id;
        var query = "Select * from "+table_parkinglot_info+" where `college_id` = "+college_id;
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
                    final[results[i]['parkinglot_id']] = 
                   {parkinglot_name : results[i]['parkinglot_name'],
                    coor_lat : results[i]['coor_lat'],
                    coor_lng : results[i]['coor_lng'],
                   parkinglot_id : results[i]['parkinglot_id']};
                    
                }
                final['ids'] = array;
                socket.emit('get_parkinglot_data',final);
            }
        });
    });
    
    socket.on('register', function(data){
        
        
        clients[socket.id] = {college_id : data.college_id, user : data.user, client_type : data.type , time : data.time};
        socket.join(college_id);
        
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
                    
                    var user_id = clients[socket.id].user.user_id;
                    var user_name = clients[socket.id].user.user_name;
                    
                    
                    var query_2 = "INSERT into "+college_id+table_area+" VALUES( "+ user_id+",'"+user_name+"','"+parkinglot_id+"',"+time +",'"+client_type+"','"+socket.id+"')";
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
                    
                    var mirror_socket_id = results_1.socket_id;
                    var mirror_user_id = results_1.user_id;
                    
                    io.to(mirror_socket_id).emit('event',{code:400, message: results_1});
                    socket.emit('event',{code:400, message: results_1});
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
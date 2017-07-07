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
var table_connection = "_connect";
var table_user_prim = 'user_prim';
var table_user_gen = 'user_gen';

var clients = {};

app.get('/checkVersion',function (req,res) {
    
    console.log(req.query.ver);
    
    var query_version = "SELECT * FROM `"+table_college_info+"` ORDER BY `college_version` DESC LIMIT 1";
    var query = "Select * From "+ table_college_info;
    connection.query(query,function(err, results){
        if(err){
                console.log("query : " + query);
                console.log("error  :" + err);
            }
        else{
            var version_number = results[0]['college_version'];
            for(i = 1; i < results.length; i++){
                if(version_number < results[i]['college_version']){
                    version_number = results[i]['college_version'];
                }
            }
           
            if(version_number == req.query.ver){
                res.end(JSON.stringify({code:1}));
            }
            else{
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
                            {
                                college_name : results[i]['college_name'],
                                college_version: results[i]['college_version'],
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
                                initial_data['code'] = 2;
                                res.end(JSON.stringify(initial_data, null, 3));
                                }
                        });
                    }
                });
            }
        }
    });
});

io.sockets.on('connection', newConnection);

function newConnection(socket){
    var user_id;
    console.log();
    console.log("New Client");
    console.log("ID : " + socket.id);
    
    socket.on('setUser',function(data){
        console.log("setUser");
        console.log(data);
        user_id = data.user_id;
        clients[user_id] = {socket_id : socket.id, status : 'initial_connected'};
        console.log(clients)
        socket.emit('confirm_setUser',{user : data});
    });
    
 
    
    socket.on('createUser',function(data){
        
        var user_name = data.user_name;
        var user_email = data.user_email; 
        var user_password = data.user_password;
        console.log('createUser');
        var user_id ;
        var temp = Math.floor(Math.random() * (16777216));
        user_id = temp.toString(16);
        var test_query = "SELECT * FROM "+table_user_gen + " WHERE `user_id` = '"+user_id+"'";
        connection.query( test_query , function(err,results) {
            if(err){
                console.log("Error while trying to select all user information from user(gen) table to see if id is taken");
                console.log("query : " + test_query);
                console.log("error  :" + err);
            }
            else{
                if(results.length == 0){
                    addUser({
                        user_id:user_id,
                        user_name:user_name,
                        user_email:user_email,
                        user_password:user_password
                    });
                    socket.emit('confirmUser',{
                        user_id:user_id,
                        user_name:user_name,
                        user_email:user_email,
                        user_password:user_password
                    });
                }
                else{
                    socket.emit('retry_createUser',{});
                }
            }   
        });
    });
    
    socket.on('register', function(data){
        
        console.log("Register Data");
        console.log(data);
        
        var user_id = data.user.user_id;
        var user_name = data.user.user_name;
        var time = data.time;
        var college_id = data.college_id;
        var parkinglot_id = data.parkinglot_id;
        var client_type = data.type;
        var opposite_type = 'ride';
        
        clients[user_id]['selected_college'] = college_id;
        clients[user_id]['selected_parkinglot'] = parkinglot_id;
        clients[user_id]['client_type'] = client_type;
        clients[user_id]['time'] = time;
        
        if(client_type == 'ride'){
            opposite_type = 'park';
        }
        
        var query_1 = "Select * from "+college_id+table_area+ " Where parkinglot_id like '%"+parkinglot_id+"%' && type = '" + opposite_type+"' Limit 1";
        connection.query(query_1, function(err_1,results_1){
            if(err_1){
                console.log("Error while querying DB(area) for match on request")
                console.log('Error  : '+err_1);
                console.log(query_1);
            }
            else{
                if(results_1.length == 0){
                    console.log("No matches found");
                    console.log(query_1);
                    var query_2 = "INSERT into "+college_id+table_area+"(`user_id`, `user_name`, `parkinglot_id`, `time`, `type`, `socket_id`) VALUES( '"+ user_id+"','"+user_name+"','"+parkinglot_id+"',"+time +",'"+client_type+"','"+socket.id+"')";
                    clients[user_id].status = 'waiting_match';
                    connection.query(query_2, function(err_2,results_2){
                        if(err_2){
                            console.log("Error while registering request into DB(area)")
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
                    console.log("Match found")
                    console.log(results_1);
                    
                    var mirror_socket_id = results_1.socket_id;
                    var mirror_user_id = results_1.user_id;
                
                    console.log(mirror_user_id);
                    
                    var query = "Delete from "+college_id+table_area+ " Where user_id = '"+mirror_user_id+"'";
                    connection.query(query, function(err,results){
                        if(err){
                            console.log("Error while deleting matched enry from DB(area)")
                            console.log('Error: '+err);
                            console.log(query);
                        }
                        else{
                            io.to(mirror_socket_id).emit('event',{code:400, message: "Connected with "+user_name+ " ["+user_id+"] "});
                            io.to(socket.id).emit('event',{code:400, message: "Connected with "+results_1['user_name']+ " ["+results_1['user_id']+"] "});

                            var connection_data = {};

                            if(client_type == 'ride'){
                                connection_data['rider_user_id']= user_id;
                                connection_data['parker_user_id'] = mirror_user_id;
                                connection_data['room_name'] = user_id + ""+mirror_user_id;
                            }
                            else{
                                connection_data['rider_user_id']= mirror_user_id;
                                connection_data['parker_user_id'] = user_id;
                                connection_data['room_name'] = mirror_user_id + ""+user_id;
                            }

                            connection_data['start_timestamp'] = Math.round((new Date()).getTime() / 1000);
                            connection_data['college_id'] = college_id;
                            //connection_data['index_timestamp_room'] =
                            connection_data['start_timestamp']+connection_data['room_name'];
                            addConnection(connection_data);
                            clients[user_id].status = 'matched';
                            clients[mirror_user_id].status = 'matched';
                        }
                    });   
                }
            }
        });
    });
    
    socket.on('joinRoom',function(data){
        console.log('join room ' + data.user.user_id);
        socket.join(data.room_name);
        socket.emit('event',{code:300, length : io.sockets.adapter.rooms[data.room_name].length});
        socket.broadcast.to(data.room_name).emit({code:300, length : io.sockets.adapter.rooms[data.room_name].length});
    });
    
    
    socket.on('disconnect',function(){
       if(user_id != null ){
           if(clients[user_id] != undefined){
               if(clients[user_id].status == 'waiting_match'){
                   var college_id = clients[user_id]['selected_college'];
                   var query = "Delete from "+college_id+table_area+ " Where user_id = '"+user_id+"'";
                   connection.query(query, function(err,results){
                       if(err){
                            console.log("Error while on disconnect,  deleting matched enry from DB(area)")
                            console.log('Error: '+err);
                            console.log(query);
                        }
                        else{
                            console.log('user deleted from matching '+user_id);
                        }
                      });
                    }
                delete clients[user_id];
           }
       }
        
        console.log("Disconnected "+socket.id );
    });
    
    
    
    
}
function addUser(data){
    var user_id = data.user_id;
    console.log("User ID added:"+user_id);
    var user_name = data.user_name;
    var user_email = data.user_email; 
    var user_password = data.user_password;
    var query = "INSERT INTO "+table_user_prim + " VALUES('"+user_id+"','"+user_name+"','"+user_email+"','"+user_password+"')";
    console.log(data);
    connection.query( query , function(err2,results2) {
        if(err2){    
            console.log("query : " + query);
            console.log("error  :" + err2);
        }   
    
    });
}

function addConnection(data){
    var college_id = data.college_id;
    var index = data.index_timestamp_room;
    var status = 'initial';
    var room_name = data.room_name;
    var rider_user_id = data.rider_user_id;
    var rider_location = 0;
    var rider_status = 'initial';
    var parker_user_id = data.parker_user_id;
    var parker_location = 0;
    var parker_status = 'initial';
    var start_timestamp = data.start_timestamp;
    var end_timestamp = "-";
    
    
    
    var query = "INSERT INTO `"+college_id + table_connection + "` VALUES('" + index + "','" + status + "','" + rider_user_id +"','"+rider_location +"','" + rider_status +"','"+parker_user_id +"','"+parker_location +"','" + parker_status +    "','"+start_timestamp+"','"+end_timestamp +"')";
    connection.query( query , function(err,results) {
        if(err){    
            console.log("query : " + query);
            console.log("error  :" + err);
        }
        else
            io.to(clients[rider_user_id].socket_id).emit('event',{code:200, rider: rider_user_id, parker : parker_user_id,start_timestamp : start_timestamp});
            io.to(clients[parker_user_id].socket_id).emit('event',{code:200, rider: rider_user_id, parker : parker_user_id,start_timestamp : start_timestamp});
    });
}
              




/*
Googel maps API - AIzaSyAxd3Map2ywV6pBHK1zDSj2CRYVObC6ZVM
*/

var express = require('express');
var mysql= require('mysql');

app = express();
var server = app.listen(3000,'0.0.0.0');

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

var clients = {};

app.get('/checkVersion',function (req,res) {
    
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
    console.log("New Client ID : " + socket.id);
    

    socket.on('setUser',function(data){
        console.log("setUser "+data.user_id);
        socket.user_id = data.user_id;
        clients[data.user_id] = {socket_id : socket.id, status : 'initial_connected'};
        socket.emit('updateStatus',{status : clients[socket.user_id].status});
       
    });
    
 
    
    socket.on('createUser',function(data){
        var user_email = data.user_email; 
        var user_password = data.user_password;
        var user_id ;
        var temp = Math.floor(Math.random() * (16777216));
        user_id = temp.toString(16);
        var user_name = "User"+user_id;
        var test_query = "SELECT * FROM "+table_user_prim + " WHERE `user_id` = '"+user_id+"'";
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
        
        var user_id = data.user.user_id;
        var user_name = data.user.user_name;
        var time = data.time;
        var college_id = data.college_id;
        var parkinglot_id = data.parkinglot_id;
        var client_type = data.type;
        var pu_lat= data.pickup_lat;
        var pu_lng = data.pickup_lng;



        var opposite_type = 'ride';
        
        clients[user_id]['selected_college'] = college_id;
        
        if(client_type == 'ride'){
            opposite_type = 'park';
        }
        
        var query_1 = "Select * from "+college_id+table_area+ " Where parkinglot_id = "+parkinglot_id+" && type = '" + opposite_type+"' Limit 1";
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
                    

                  
                    var query_2 = "INSERT into "+college_id+table_area+"(`user_id`, `user_name`, `parkinglot_id`, `time`, `type`, `socket_id`,`pickup_lat`,`pickup_lng`) VALUES( '"+ user_id+"','"+user_name+"','"+parkinglot_id+"',"+time +",'"+client_type+"','"+socket.id+"',"+pu_lat+","+pu_lng+")";
                    
                    clients[user_id].status = 'waiting_match';
                    socket.emit('updateStatus',{status : clients[user_id].status});
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
                    var mirror_socket_id = results_1.socket_id;
                    var mirror_user_id = results_1.user_id;

                    removeRequest(mirror_user_id,college_id);

                    io.to(mirror_socket_id).emit('event',{code:400, message: "Connected with "+user_name+ " ["+user_id+"] "});
                    io.to(socket.id).emit('event',{code:400, message: "Connected with "+results_1['user_name']+ " ["+results_1['user_id']+"] "});

                            

                    var start_timestamp = Math.round((new Date()).getTime() / 1000);
                    var rider_user_id;
                    var parker_user_id;
                    var index_room_name;
                    var rider_location = 0;
                   	var parker_location = 0;
                    var end_timestamp = "N/a";

                            
                    if(client_type == 'ride'){
                     	rider_user_id =user_id;
                        parker_user_id = mirror_user_id;
                        index_room_name =start_timestamp+ user_id + ""+mirror_user_id;
                    }
                    else{
                        rider_user_id= mirror_user_id;
                        parker_user_id = user_id;
                        index_room_name =start_timestamp+ mirror_user_id + ""+user_id;
                        pu_lat = results_1.pickup_lat;
                    	pu_lng = results_1.pickup_lng;
                    }
                    clients[user_id].status = 'matched';
                    socket.emit('updateStatus',{status : clients[user_id].status});
                    clients[mirror_user_id].status = 'matched';
                   	socket.broadcast.to(clients[mirror_user_id].socket_id).emit('updateStatus',{status : clients[user_id].status});
             
                    var query = "INSERT INTO `"+college_id + table_connection + "` VALUES('" + index_room_name + "'," + college_id +"," + parkinglot_id +",'"+rider_user_id +"','" + rider_location +"','"+parker_user_id +"','"+parker_location+"','" +    +start_timestamp+"','"+end_timestamp +"')";
                    connection.query( query , function(err2,results2) {
                       	if(err2){    
                        console.log("query : " + query);
                        console.log("error  :" + err);
                        }else{
                            if(socket.user_id === rider_user_id){
                            	socket.broadcast.to(clients[parker_user_id].socket_id ).emit('matched_confirm',{ rider: rider_user_id, parker : parker_user_id,pu_lat : pu_lat,pu_lng : pu_lng});
                               
                           	}else{
                            	socket.broadcast.to(clients[rider_user_id].socket_id).emit('matched_confirm',{ rider: rider_user_id, parker : parker_user_id ,pu_lat : pu_lat,pu_lng : pu_lng});
                            }
                            socket.emit('matched_confirm',{rider: rider_user_id, parker : parker_user_id,pu_lat : pu_lat,pu_lng : pu_lng});
                        } 
                    });                
                }
            }
        });
    });
    
    socket.on('joinRoom',function(data){
        socket.join(data.room_name);
        socket.emit('joined_room_confirm',{num_room : io.sockets.adapter.rooms[data.room_name].length});
    });


    
    
    socket.on('disconnect',function(data){
        var user_id =  socket.user_id;
        if(user_id != null ){
           if(clients[user_id] != undefined){
               if(clients[user_id].status == 'waiting_match'){
                    var college_id = clients[user_id]['selected_college'];
                    removeRequest(user_id, college_id);
                }
           }
           delete clients[user_id];
       }
        
        console.log("Disconnected "+socket.id );
    });

    socket.on('cancelRequest',function(){
        var user_id =  socket.user_id;
        var college_id = clients[user_id]['selected_college'];
        removeRequest(user_id, college_id);
        clients[user_id].status = 'initial_connected';
        socket.emit('updateStatus',{status : clients[user_id].status});
    });

    socket.on('endMatch',function(){

    });
    
    
}

function addUser(data){
    var user_id = data.user_id;
    console.log("User ID added:"+user_id);
    var user_name = data.user_name;
    var user_email = data.user_email; 
    var user_password = data.user_password;
    var query = "INSERT INTO "+table_user_prim + " VALUES('"+user_id+"','"+user_name+"','"+user_email+"','"+user_password+"')";
    connection.query( query , function(err2,results2) {
        if(err2){    
            console.log("query : " + query);
            console.log("error  :" + err2);
        }   
    
    });
}

function removeRequest(user_id,college_id){
    var query = "Delete from "+college_id+table_area+ " Where user_id = '"+user_id+"'";
    connection.query(query, function(err,results){
        if(err){
            console.log("Error while on disconnect,  deleting matched enry from DB(area)")
            console.log('Error: '+err);
            console.log(query);
        }
        else{
            console.log('canceled request for '+user_id + 'deleted');
        }
    });
}




              




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
    port: 3307
});
var table_college_info = 'college_info';
var table_parkinglot_info = 'parkinglot_info';
var table_area = "_area";
var table_connection = "_connect";
var table_user_prim = 'user_prim';
var table_user_gen = 'user_gen';

var clients = {};

var number_college = {};



/*
var query_number_college = "Select * from "+table_parkinglot_info;
connection.query(query_number_college, function(error_number_college,results_number_college){
    if(error_number_college){
        logData("query : " +  query_number_college);
        logData("error : "+ error_number_college)
    }
    else{
        for(i=0;i < results_number_college.length; i++){
            number_college[results_number_college[i]['college_id']] = {}; 
        }  
        for(i=0;i < results_number_college.length; i++){
            number_college[results_number_college[i]['college_id']][results_number_college[i]['parkinglot_id']] = {park : 0, ride : 0};
        }
    }
});
*/

function logData(data){
    console.log(getTimestamp()+" "+data);
}


app.get('/checkUser',function (req,res) {
    var given_user_name = req.query.user_name;
    var given_password = req.query.user_password;
    
    var query_user_prim = "Select * From "+ table_user_prim + " Where `user_name` = '"+given_user_name+"' && `user_password`='" +given_password+"'";
    connection.query(query_user_prim,function(err, results){
        if(err){
                logData("Error/checkUser API  :" + err);
                logData("Query : " + query_user_prim);
        }
        else{
            
            if(results.length == 0){
                res.end(JSON.stringify({code:1}));
                logData(" checkUser invalid username or password")
            }
            else{
                if(clients[results[0]['user_id']] != undefined && clients[results[0]['user_id']]['socket_id'] != undefined){
                    res.end(JSON.stringify({code:2}));
                    logData(" checkUser valid username or password, account active on another device")
                }
                else{
                    res.end(JSON.stringify({code:3 , user_id : results[0]['user_id'],user_name : results[0]['user_name'] }));
                    logData(" checkUser pass for user "+ results[0]['user_id']);
                }
                
            }
        }
    });
});


app.get('/createUser',function (req,res) {
    var data = {}
    if(req.query.user_name == undefined ||req.query.user_password == undefined ||req.query.user_email == undefined  ){
        res.end(JSON.stringify({code: 1}, null, 3));
    }
    else{
        data.user_name = req.query.user_name;
        data.user_password = req.query.user_password;
        data.user_email = req.query.user_email;

        generateUserID(data,function(err){
            if(err != null){
                res.end(JSON.stringify({code: 1}, null, 3));
            } else {
            res.end(JSON.stringify({code: 2 }, null, 3));
            }
        });
    }
    

});

function generateUserID(data,callback){
    console.log("Generate USer Called")
    var number =  Math.floor(Math.random() * (16777216));
    number = number.toString(16).toUpperCase();
    var query_user_prim = "Select * From "+ table_user_prim + " Where `user_id` ='"+number+"'";
    connection.query(query_user_prim,function(err, results){
        if(err){
                logData("Generating User ID Error:"+err)
                generateUserID(data,callback)
        }
        else{
            if(results.length == 0){
                data.user_id= number
                addUser(data,callback)
            }
            else{
               generateUserID(data,callback)
            }
        }
    });

}

function addUser(data,callback){
    var user_id = data.user_id;
    logData("User ID added:"+user_id);
    var user_name = data.user_name;
    var user_email = data.user_email; 
    var user_password = data.user_password;
    var query_add_prim = "INSERT INTO "+table_user_prim + " VALUES('"+user_id+"','"+user_name+"','"+user_email+"','"+user_password+"')";
    connection.query( query_add_prim , function(err_prim,results_prim) {
        if(err_prim){    
            logData("query : " + query_add_prim);
            logData("error  :" + err_prim);
            callback(err_prim)
        }
        else{
            logData(user_id+" createUser added user_prim");
            var query_gen = "INSERT INTO "+table_user_gen + "(`user_id`,`rating`,`total_matches`) VALUES('"+user_id+"',5,0)";
            connection.query( query_gen , function(err_gen,results_gen) {
                if(err_gen){    
                    logData("query : " + query_gen);
                    logData("error  :" + err_gen);
                    callback(err_gen)
                }  
                else{
                    logData(user_id+" createUser added user_gen");
                    callback(null)
                }  
            });
        }  
    });
}
    
    




app.get('/checkVersion',function (req,res) {
    
    var query_version = "SELECT * FROM `"+table_college_info+"` ORDER BY `college_version` DESC LIMIT 1";
    var query = "Select * From "+ table_college_info;
    connection.query(query,function(err, results){
        if(err){
                logData(" Error/checkVersion: " + err);
                logData(" Query/CheckVersion: "+ query)
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
                        logData("query : " + query);
                        logData("error  :" + err);
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
                                logData("query : " + query2);
                                logData("error  :" + err2);
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
    logData("New Client Connection : " + socket.id);
    

    socket.on('setUser',function(data){
        logData(data.user_id + " setUser");
        socket.user_id = data.user_id;
        socket.user_name = data.user_name;
        if(clients[socket.user_id] == undefined){
            clients[data.user_id] = {socket_id : socket.id, status : 'initial_connected',connected : socket.connected};
            getUserStatus();
            logData(socket.user_id + " setUser initial")
        }
        else{
            clients[socket.user_id].socket_id = socket.id;
            clients[socket.user_id].connected = socket.connected;
            logData(socket.user_id + " setUser reconnect")
            if(clients[socket.user_id]["status"] == 'waiting_match'){
                clearTimeout(clients[socket.user_id]['timer']);
                getUserStatus();
            }
            else {
                joinRoom();
                getUserStatus();
            }
        }
        
    });

    socket.on('getUserStatus',function(){
        getUserStatus();
    });    

    function getUserStatus(){

        
        if(clients[socket.user_id] != undefined){
            var status = clients[socket.user_id].status;
            if(status == 'initial_connected'){
                socket.emit('updateStatus',clients[socket.user_id]);
            }
            else if(status == 'waiting_match'){
                socket.emit('updateStatus',{status: status,selected_college:clients[socket.user_id].selected_college , selected_parkinglot:clients[socket.user_id].selected_parkinglot, client_type:clients[socket.user_id].client_type});
            }
            else if(status == 'matched'){
                socket.emit('updateStatus',{
                    status: status,
                    pu_lat: clients[socket.user_id].pu_lat ,
                    pu_lng: clients[socket.user_id].pu_lng,
                    rider_user_id:  clients[socket.user_id].rider_user_id,
                    rider_user_name: clients[socket.user_id].rider_user_name,
                    parker_user_id: clients[socket.user_id].parker_user_id,
                    parker_user_name: clients[socket.user_id].parker_user_name,
                    start_timestamp:clients[socket.user_id].start_timestamp
                });
            }
            else if(status == 'finish'){
                socket.emit('updateStatus',{
                    status: status,
                    rider_user_id:  clients[socket.user_id].rider_user_id,
                    rider_user_name: clients[socket.user_id].rider_user_name,
                    parker_user_id: clients[socket.user_id].parker_user_id,
                    parker_user_name: clients[socket.user_id].parker_user_name  
                });
            }
        }
        
    }
    
    socket.on('register', function(data){

        var user_id = socket.user_id;
        var user_name = socket.user_name;
        var time = Math.round((new Date()).getTime() / 1000);
        var college_id = data.college_id;
        var parkinglot_id = data.parkinglot_id;
        var client_type = data.type;
        var pu_lat= 0;
        var pu_lng = 0;

        var opposite_type = 'ride';
       
        if(client_type == 'ride'){
            opposite_type = 'park';
            pu_lat= data.pickup_lat;
            pu_lng = data.pickup_lng;

        }

        clients[user_id]['selected_college'] = college_id;
        clients[user_id]['selected_parkinglot'] = parkinglot_id;
        clients[user_id]['client_type'] = client_type;

        logData(user_id + " request "+college_id + " | "+ parkinglot_id + " | "+ client_type)
        
       
        /*number_college[college_id][parkinglot_id][client_type] += 1;
        logData(number_college[college_id]);*/

        
        var query_1 = "Select * from "+table_area+ " Where college_id = "+college_id +"&& parkinglot_id = "+parkinglot_id+" && type = '" + opposite_type+"' Limit 1";
        connection.query(query_1, function(err_1,results_1){
            if(err_1){
                logData("Error while querying DB(area) for match on request")
                logData('Error  : '+err_1);
                logData(query_1);
            }
            else{
                if(results_1.length == 0){
                    clients[user_id].status = 'waiting_match';
                    getUserStatus();
                    var query_2 = "INSERT into "+table_area+"(`user_id`, `user_name`,`college_id`, `parkinglot_id`, `time`, `type`, `socket_id`,`pickup_lat`,`pickup_lng`) VALUES( '"+ user_id+"','"+user_name+"','"+college_id + "','"+parkinglot_id+"',"+time +",'"+client_type+"','"+socket.id+"',"+pu_lat+","+pu_lng+")";
                    connection.query(query_2, function(err_2,results_2){
                        if(err_2){
                            logData("Error while registering request into DB(area)")
                            logData('Error: '+err_2);
                            logData(query_2);
                        }
                        else{
                            logData(user_id + " request noMatch | "+college_id + " | "+ parkinglot_id + " | "+ client_type )
                        }
                    });
                    
                    
                }
                else{
                    results_1 = results_1[0];
                    var mirror_user_id = results_1.user_id;
                    var mirror_user_name = results_1.user_name;

                    removeRequest(mirror_user_id);
                            

                    var start_timestamp = Math.round((new Date()).getTime() / 1000);
                    var rider_user_id;
                    var rider_user_name;
                    var parker_user_id;
                    var parker_user_name;
                    var index_room_name;
                    var rider_location = 0;
                    var parker_location = 0;
                    var end_timestamp = "N/a";

                            
                    if(client_type == 'ride'){
                        rider_user_id =user_id;
                        rider_user_name = user_name;
                        parker_user_id = mirror_user_id;
                        parker_user_name = mirror_user_name;
                        
                    }
                    else{
                        rider_user_id= mirror_user_id;
                        rider_user_name = mirror_user_name;
                        parker_user_id = user_id;
                        parker_user_name = user_name;
                        pu_lat = results_1.pickup_lat;
                        pu_lng = results_1.pickup_lng;
                    }
                    index_room_name =start_timestamp +""+ rider_user_id +parker_user_id;
                    
                    clients[user_id]["rider_user_id"] = rider_user_id;
                    clients[mirror_user_id]["rider_user_id"] = rider_user_id;

                    clients[user_id]["rider_user_name"] = rider_user_name;
                    clients[mirror_user_id]["rider_user_name"] = rider_user_name;
                    clients[user_id]["parker_user_name"] = parker_user_name;
                    clients[mirror_user_id]["parker_user_name"] = parker_user_name;

                    clients[user_id]["parker_user_id"] = parker_user_id;
                    clients[mirror_user_id]["atPickup"] = false;
                    clients[user_id]["atPickup"] = false;
                    clients[mirror_user_id]["parker_user_id"] = parker_user_id;

                    clients[user_id]["pu_lat"] = pu_lat;
                    clients[mirror_user_id]["pu_lat"] = pu_lat;
                    clients[user_id]["pu_lng"] = pu_lng;
                    clients[mirror_user_id]["pu_lng"] = pu_lng;
                    clients[user_id]["start_timestamp"] = start_timestamp;
                    clients[mirror_user_id]["start_timestamp"] = start_timestamp;

                    clients[user_id].status = 'matched';
                    clients[mirror_user_id].status = 'matched';

                    clients[user_id].closeToPickUp = false;
                    clients[mirror_user_id].closeToPickup = false;


                    

                    var room_name = start_timestamp + "" + rider_user_id+ parker_user_id;
                    clients[user_id]["room_name"] = room_name;
                    clients[mirror_user_id]["room_name"] = room_name;

                    if(clients[mirror_user_id].connected){
                        console.log(mirror_user_id+ " Update Status Matched ")
                        socket.broadcast.to(clients[mirror_user_id].socket_id).emit('updateStatus',clients[mirror_user_id]);

                    }
                    else{

                    }
                    if(clients[socket.user_id].connected){
                        console.log(socket.user_id+ " Update Status Matched ")
                        getUserStatus();
                    }
                    
                    
                    var query = "INSERT INTO `"+table_connection + "`(`index_room_name`, `college_id`, `parkinglot_id`, `rider_user_id`, `parker_user_id`, `start_timestamp`, `end_timestamp`, `pu_lat`, `pu_lng`) VALUES('" + index_room_name + "'," + college_id +"," + parkinglot_id +",'"+rider_user_id +"','"+parker_user_id +"','" +start_timestamp+"','"+end_timestamp +"',"+pu_lat+","+pu_lng+")";
                    connection.query( query , function(err2,results2) {
                        if(err2){    
                        logData("query : " + query);
                        logData("error  :" + err);
                    }else{
                        logData(room_name + " request Match | "+college_id + " | "+ parkinglot_id + " | "+ client_type )
                    }
                    });               
                }
            }
        });
    });
    
    socket.on('joinRoom',function(data){
        joinRoom();
    });

    function joinRoom(){
        logData(clients[socket.user_id].room_name + " match joinRoom | "+socket.user_id  )
        socket.join(clients[socket.user_id].room_name);
        io.to(clients[socket.user_id].room_name).emit('joined_room_confirm',{user_id:socket.user_id});
    }


    socket.on('updateLocation',function(data){
        logData(clients[socket.user_id].room_name + " match updateLocation | "+socket.user_id )
        io.to(clients[socket.user_id]["room_name"]).emit('updateCurrentLocation',{user_id : socket.user_id, lat : data.lat, lng : data.lng});
    });

    socket.on('notAtPickup',function(){
        userNotAtPickup();
        
    });

    function userNotAtPickup(){
        clients[socket.user_id].closeToPickup = false;
        logData(clients[socket.user_id].room_name + " match notAtPickup | "+socket.user_id  )
        var rider_user_id = clients[socket.user_id]["rider_user_id"];
        var parker_user_id = clients[socket.user_id]["parker_user_id"];
        if(clients[parker_user_id].confirmed != undefined  && clients[rider_user_id].confirmed != undefined ){
            delete clients[rider_user_id].confirmed;
            delete clients[parker_user_id].confirmed;
            io.to(clients[socket.user_id]["room_name"]).emit('revertConfirmation',{});
            logData(clients[socket.user_id].room_name + " match revertConfirmation")
        }
    }

    socket.on('atPickup',function(){
        clients[socket.user_id].closeToPickup = true;
        var rider_user_id = clients[socket.user_id]["rider_user_id"];
        var parker_user_id = clients[socket.user_id]["parker_user_id"];
        logData(clients[socket.user_id].room_name + " match atPickup | "+socket.user_id  )
        if( clients[rider_user_id].closeToPickup == true && clients[parker_user_id].closeToPickup == true && (clients[rider_user_id].confirmed == undefined && clients[parker_user_id].confirmed == undefined)){
            clients[rider_user_id].confirmed = false;
            clients[parker_user_id].confirmed = false;
            io.to(clients[socket.user_id]["room_name"]).emit('issueConfirmation',{confirmationNumber : Math.floor(Math.random() * (999)) + 100}); 
            logData(clients[socket.user_id].room_name + " match issueConfirmation | "+socket.user_id )                               
        }
    });

    socket.on('confirmPickUp',function(data){
        logData(clients[socket.user_id].room_name + " match confirmedPickup | "+socket.user_id )
        clients[socket.user_id]["confirmed"] = true;
        var rider_user_id = clients[socket.user_id]["rider_user_id"];
        var parker_user_id = clients[socket.user_id]["parker_user_id"];

        if(clients[rider_user_id]["confirmed"] === true && clients[parker_user_id]["confirmed"] === true){
            clients[rider_user_id].status = 'finish';
            clients[parker_user_id].status = 'finish';
            var mirror_user_id;

            if(socket.user_id == rider_user_id){
                mirror_user_id = parker_user_id
            }
            else{
                mirror_user_id = rider_user_id
            }
            io.to(clients[socket.user_id]["room_name"]).emit('finish',{});
            if(clients[socket.user_id].connected){
                getUserStatus();
            }
            if(clients[mirror_user_id].connected){
                socket.broadcast.to(clients[mirror_user_id].socket_id).emit('updateStatus',clients[mirror_user_id]);
            }
            logData(clients[socket.user_id].room_name + " finished " )
            
            
        
        }
    });

    socket.on('finish',function(data){
        var rated_user = data.user_id;
        var given_rating = data.rating;
        rateUser(rated_user,given_rating);
    });

    
    socket.on('disconnect',function(){
        var user_id =  socket.user_id;
        clients[user_id].connected = false;
        logData(user_id + " disconnected | "+ clients[user_id].status)
        if(clients[user_id].status == 'initial_connected'){
            delete clients[user_id];
        }
        else if(clients[user_id].status == 'waiting_match'){  
            clients[user_id]['timer'] = setTimeout(function(){
            removeRequest(user_id);
            
            }, 30000);
            delete clients[user_id].socket_id;
        }
        else if(clients[user_id].status == 'matched' ){
            userNotAtPickup();
            socket.leave(clients[socket.user_id].room_name);
            io.to(clients[socket.user_id]["room_name"]).emit('disconnected',{user_id:socket.user_id});
            delete clients[user_id].socket_id
        }
        else {
            delete clients[user_id];
        }
        
        
           
       });
        
        

    socket.on('cancelRequest',function(){
        var user_id =  socket.user_id;
        var college_id = clients[user_id]['selected_college'];
        var parkinglot_id = clients[user_id]['parkinglot_id'];
        var client_type = clients[user_id]['client_type'];
        removeRequest(user_id);
        clients[user_id].status = 'initial_connected';
        getUserStatus();
    });


    function rateUser(rated_user,given_rating){
    
        var query = "SELECT * FROM "+table_user_gen + " WHERE `user_id`='"+rated_user+"'";
        connection.query( query , function(err,results) {
            if(err){    
                logData("query : " + query);
                logData("error  :" + err);
            }else{
                var current_rating = results[0]["rating"];
                var total_matches =  results[0]["total_matches"];
                var new_rating = ((current_rating * total_matches) + given_rating)/(total_matches + 1);
                total_matches +=1;
                var query = "UPDATE `"+table_user_gen + "` SET `rating`="+new_rating+",`total_matches`= "+total_matches+",`status`='initial_connected' WHERE `user_id`='"+rated_user+"'";
                connection.query( query , function(err,results) {
                    if(err){    
                        logData("query : " + query);
                        logData("error  :" + err);

                    }else{
                        logData(rated_user + " rating | "+ new_rating)
                        resetUser();            
                    }
                }); 
                
            }
        }); 

    }

    function resetUser(){
        clients[socket.user_id] = {socket_id : socket.id, status : 'initial_connected',connected : socket.connected}
        getUserStatus();
        logData(socket.user_id + " setUser initial")
    }
}



function removeRequest(user_id){
    var query = "Delete from "+table_area+ " Where user_id = '"+user_id+"'";
    connection.query(query, function(err,results){
        if(err){
            logData("Error while on disconnect,  deleting matched enry from DB(area)")
            logData('Error: '+err);
            logData(query);
        }
        else{
            logData(user_id + " request canceled ")
            
        }
    });
}

function getTimestamp () {
    var d = new Date();
    return (d.getMonth()+1) + "/"+d.getDate()  + "/" + d.getFullYear() + " " + d.getHours() + ":" + d.getMinutes()+":"+d.getSeconds()+":"+d.getMilliseconds();
}
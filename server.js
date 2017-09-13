/*
Googel maps API - AIzaSyAxd3Map2ywV6pBHK1zDSj2CRYVObC6ZVM
*/

var express = require('express');
var mysql= require('mysql');
const bcrypt = require('bcrypt');//Encrypting passwords and generating hashes for email verification
var path = require('path');
var nodemailer = require('nodemailer');//sending mail
var validator = require('mailgun-email-validation');
var socket = require('socket.io');

//Ensures server continues to run if any exception occurs. Will have to come up with a better system in the future
process.on('uncaughtException', function (err) {
  console.log(err)
});


app = express();
var server = app.listen(3000,'0.0.0.0');

app.use(express.static('public'));


var io = socket(server);
//Connection to SQL DB
//NEED to create two seperate connections for user_prim and general uses for security 
var connectionPool = mysql.createPool({
    connectionLimit:50,
    host: 'localhost',
    user: 'username',
    password: 'password',
    database: 'parking',
    port:3307
});

//All tables for SQL DB
var table_college_info = 'college_info';
var table_parkinglot_info = 'parkinglot_info';
var table_area = "_area";
var table_connection = "_connect";
var table_user_prim = 'user_prim';
var table_user_gen = 'user_gen';

//holds realtime client data 
var clients = {};

//var number_college = {};
 var transporter = nodemailer.createTransport( {
    service:  'Mailgun',
    auth: {
     user: 'postmaster@vierve.com',
     pass: 'El65ZPAjjNcqp2VaTDQ5'   
    }
});

/*
used to verify the emailo accoutns; this url would be sent out to the user's email
the username and key is checked , and if correct the email is then set to verified
*/
app.get('/verifyEmail',function (req,res) {
    var given_user_name = req.query.user_name;
    given_user_name = given_user_name.toLowerCase();
    var given_hash = req.query.hash;


    connectionPool.getConnection(function(connection_error,connection){
        if(connection_error){
            console.log(connection_error)
            connection.release()
        }
        else{

            //in case parameters are not given
            if(given_hash == undefined || given_user_name == undefined){
                console.log("Error verify email |"+given_user_name + "|"+given_hash)
                console.log("verifyEmail paramentersNull")
                res.sendFile(path.join(__dirname, '/public', 'error.html'));
            }
            else{
                var query_user_prim = "Select * From "+ table_user_prim + " Where `user_name` = '"+given_user_name+"'";
                connection.query(query_user_prim,function(err, results){
                    if(err){
                            console.log("Error verify email |"+given_user_name + "|"+given_hash)
                            console.log("Error/verifyEmail API  :" + err);
                            console.log("Query : " + query_user_prim);
                            res.sendFile(path.join(__dirname, '/public', 'error.html'));
                    }
                    else{
                        //in case username is invalid
                        if(results.length == 0){
                            console.log("Error verify email |"+given_user_name + "|"+given_hash)
                            console.log("verifyEmail invalid username")
                            res.sendFile(path.join(__dirname, '/public', 'error.html'));
                        }
                        else{
                            //in case account is already verified
                            if(results[0]['email_verified'] == 1 ){
                                console.log("Error verify email |"+given_user_name + "|"+given_hash)
                                console.log("verifyEmail account already verified")
                                res.sendFile(path.join(__dirname, '/public', 'error.html'));
                            }
                            else{
                                //in case user_name and given salt are correct and the account is not verified
                                if(given_hash == results[0].main_salt){
                                    var query_update_email_verified = "UPDATE `user_prim` SET `email_verified` = 1 WHERE `user_name`='"+given_user_name+"'";
                                    connection.query(query_update_email_verified,function(err_update_ev, results_ev){
                                        if(err_update_ev){
                                            console.log("Error verify email |"+given_user_name + "|"+given_hash)
                                            console.log("Error/verifyEmail API  :" + err_update_ev);
                                            console.log("Query : " + query_update_email_verified);
                                            res.sendFile(path.join(__dirname, '/public', 'error.html'));
                                        }
                                        else{
                                            console.log("Verify email |"+given_user_name + "|"+given_hash)
                                            res.sendFile(path.join(__dirname, '/public', 'verifyEmail.html'));
                                        }
                                    });
                                }
                                //in case of invalid salt
                                else{
                                    console.log("Error verify email |"+given_user_name + "|"+given_hash)
                                    console.log("verifyEmail invalid hash")
                                    res.sendFile(path.join(__dirname, '/public', 'error.html'));  
                                }
                            }
                        }
                    }
                });
            }
            connection.release()

        }


    }); 
});


/*
used to check the user status
*/
app.get('/checkUser',function (req,res) {
    var given_user_name = req.query.user_name;
    given_user_name = given_user_name.toLowerCase();
    var given_password = req.query.user_password;

    connectionPool.getConnection(function(connection_error,connection){
        if(connection_error){
            console.log(connection_error)
            connection.release()
            res.json({code:0,message:"Cannot Establish DB Connection"});
        }
        else{
            var query_user_prim = "Select * From "+ table_user_prim + " Where `user_name` = '"+given_user_name+"'";
            connection.query(query_user_prim,function(err, results){
                if(err){
                        console.log("Error/checkUser API  :" + err);
                        console.log("Query : " + query_user_prim);
                        res.json({code:0,message:"Error with DB Query"});
                }
                else{
                    
                    if(results.length == 0){
                        res.json({code:0,message:"Invalid Username"});
                        console.log(" checkUser invalid username | "+given_user_name + "|"+given_password)

                    }
                    else{
                        bcrypt.compare(results[0]['user_id']+ ""+given_password, results[0]['user_password'], function(password_check_error, password_result) {
                            if(password_check_error){
                                console.log("Password check Error")
                                console.log(password_check_error)
                                res.json({code:0,message:"Error Compare Password"});
                            }
                            else{

                                if(password_result == true){
                                    if(clients[results[0]['user_id']] != undefined && clients[results[0]['user_id']]['socket_id'] != undefined){
                                        res.json({code:0,message:"User Currently Active on Other Device"});
                                        console.log(" checkUser valid username or password, account active on another device")
                                    }
                                    else{
                                        
                                        if(results[0].email_verified == 1){
                                            res.json({code:1 , user_id : results[0]['user_id'],user_name : results[0]['user_name'],user_email: results[0]['user_email']});
                                            console.log(" checkUser pass for user "+ results[0]['user_id']);
                                        }
                                        else{
                                            res.json({code:0,message:"User email Not Verified.\nPlease Verify Email"});
                                            console.log(" checkUser emailNotVerified "+ results[0]['user_id']);
                                        } 
                                    }
                                }
                                else{
                                    res.json({code:0,message:"Invalid Password"});
                                    console.log(" checkUser invalid password | "+given_user_name + "|"+given_password)
                                }
                            }
                        });
                    }
                }
            });
            connection.release();
        }
    });
});

app.get('/checkUsername',function(req,res){
    if(req.query.user_name == undefined ){
        res.json({code: 0});
    }
    else{

        connectionPool.getConnection(function(connection_error,connection){
            if(connection_error){
                console.log(connection_error)
                connection.release()
                res.json({code:0,message:"Error Establiching DB Connection"});
            }
            else{

                var given_user_name = (req.query.user_name)
                given_user_name = given_user_name.toLowerCase();
                var query_user_name_prim = "Select * From "+ table_user_prim + " Where `user_name` = '"+given_user_name+"'";
                connection.query(query_user_name_prim,function(err, results){
                    if(err){
                        console.log("Error/checkUsername API  :" + err);
                        console.log("Query : " + query_user_name_prim);
                        res.json({code:0,message:"Error with DB Query"});
                    }
                    else{
                        if(results.length == 0){
                            res.json({code: 1});
                        }
                        else{
                            //username taken
                            res.json({code:0,message:"Username Taken"});
                        }
                    }
                });
                connection.release()
            }
        });
    }
});

app.get('/updateUser',function(req,res){
	if(req.query.new_user_password == undefined || req.query.new_user_name == undefined ||req.query.user_password == undefined ||req.query.user_email == undefined || req.query.user_id == undefined    ){
        res.json({code: 1});
    }
    else{
    	var user_id = req.query.user_id
    	var user_email = req.query.user_email
    	var user_password = req.query.user_password
    	var new_user_password = req.query.new_user_password
    	var new_user_name = req.query.new_user_name
    	connectionPool.getConnection(function(connection_error,connection){
            if(connection_error){
                console.log(connection_error)
                connection.release()
                res.json({code:0,message:"Error Establishing DB Connection"});
            }
            else{
            	var query_get_user = "Select * From "+ table_user_prim + " Where `user_id` = '"+user_id+"' && `user_email`='"+user_email+"'"
            	connection.query(query_get_user,function(err_get_user,result_get_user){
            		if(err_get_user){
                        console.log("Error/checkUsername API  :" + err_get_user);
                        console.log("Query : " + query_get_user);
                        res.json({code:0,message:"Error with DB Query"});
                    }
                    else{
                    	console.log(result_get_user)
                    	bcrypt.compare(user_id+ ""+user_password, result_get_user[0]['user_password'], function(password_check_error, password_result) {
                    		if(password_check_error){
                    			console.log("Password check Error")
                                console.log(password_check_error)
                                res.json({code:0,message:"Error with Password Compare"});
                    		}
                    		else{
                    			if(password_result == true){
                    				bcrypt.genSalt(10, function(salt_err, salt) {
					                    bcrypt.hash(user_id+""+new_user_password, salt, function(has_err, hash) {
					                     
					                        var query_update_user = "UPDATE `"+table_user_prim + "` SET `user_name`='"+new_user_name+"',`user_password`= '"+hash+"' WHERE `user_id`='"+user_id+"'";
					                        connection.query(query_update_user,function(err,result){
					                        	if(err){
					                        		console.log("Error updating User SQLUpdate : "+err)
					                        		console.log(query_update_user)
					                        		res.json({code:0,message:"Error with DB Query"});
					                        	}
					                        	else{
					                        		res.json({code:1,new_user_name:new_user_name,new_user_password : new_user_password})
					                        	}
					                        })
					                    });
					                });
                    			}
                    			else{
                    				console.log("invalid password")
                    				res.json({code:0,message:"Invalid Password"});
                    			}
                    		}
                    	});
                    }
            	});
                connection.release()
            }
        });
    	
    }
});

app.get('/createUser',function (req,res) {
    var data = {}
    if(req.query.user_name == undefined ||req.query.user_password == undefined ||req.query.user_email == undefined  ){
        res.json({code: 1});
    }
    else{

         validator.check(req.query.user_email , function(valid_email_err, valid) {
            if (valid_email_err){
                console.log("Valid Email Error");
                console.log(valid_email_err);
                res.json({code:0,message:"Validating Email Error"});
            }
            else{
                if(valid == false){
                    res.json({code:0,message:"Invalid Email"});
                }
                else{
                    data.user_name = (req.query.user_name).toLowerCase();
                    data.user_password = req.query.user_password;
                    data.user_email = req.query.user_email;

                    connectionPool.getConnection(function(connection_error,connection){
                        if(connection_error){
                            console.log(connection_error)
                            res.json({code:0,message:"Error with Establishing DB Connection"});
                            connection.release()
                        }else{
                            generateUserID(data,connection,function(err){
                                if(err){
                                    res.json({code:0,message:"User could not be created"});
                                } else {
                                    console.log("userCreated |"+data.toString())
                                    res.json({code: 1});
                                    var mailOpts = {
                                        from:'noreply@vierve.com',
                                        to: data.user_email,
                                        subject: 'Email Verification',
                                        html : '<h1>Welcome to Vierve @'+data.user_name+'!</h1> <p>Click the link below to activate your account.</p><p>https://server.vierve.com/verifyEmail?user_name='+data.user_name+'&hash='+data.main_salt+'</p>'
                                    };
                                    transporter.sendMail(mailOpts, function (err2, response) {
                                        if (err2) {
                                            console.log("Email sending error :"+err2)
                                        } else {
                                            console.log("Email Verification sent to "+ data.user_email)
                                        }
                                    })

                                }
                            });
                            connection.release()
                        }
                    });
                }
            }
        });
    }});

function generateUserID(data,connection,callback){
    console.log("Generate USer Called")
    var number =  Math.floor(Math.random() * 16777216)+1;
    number = number.toString(16).toUpperCase();

    var query_user_prim = "Select * From "+ table_user_prim + " Where `user_id` ='"+number+"'";
    connection.query(query_user_prim,function(err, results){
        if(err){
                console.log("Generating User ID Error:"+err)
                generateUserID(data,connection,callback)
        }
        else{
            if(results.length == 0){
                data.user_id= number
                bcrypt.genSalt(10, function(salt_err, salt) {
                    bcrypt.hash(number+""+data.user_password, salt, function(has_err, hash) {
                        bcrypt.genSalt(1, function(main_err, main_salt) {

                            data['main_salt'] = main_salt;
                            data.user_password = hash;
                            addUser(data,connection,callback)
                        });
                    });
                });
                
            }
            else{
               generateUserID(data,connection,callback)
            }
        }
    });}

function addUser(data,connection,callback){
    var user_id = data.user_id;
    console.log("User ID added:"+user_id);
    var user_name = data.user_name;
    var user_email = data.user_email; 
    var user_password = data.user_password;
    var salt = data.main_salt;
    var query_add_prim = "INSERT INTO "+table_user_prim + "(`user_id`, `user_name`, `user_email`, `user_password`, `email_verified`,`main_salt`,`create_timestamp`) VALUES('"+user_id+"','"+user_name+"','"+user_email+"','"+user_password+"',0,'"+salt+"',"+(new Date).getTime()+")";
    connection.query( query_add_prim , function(err_prim,results_prim) {
        if(err_prim){    
            console.log("query : " + query_add_prim);
            console.log("error  :" + err_prim);
            callback(err_prim)
        }
        else{
            console.log(user_id+" createUser added user_prim");
            var query_gen = "INSERT INTO "+table_user_gen + "(`user_id`,`rating`,`total_matches`) VALUES('"+user_id+"',5,0)";
            connection.query( query_gen , function(err_gen,results_gen) {
                if(err_gen){    
                    console.log("query : " + query_gen);
                    console.log("error  :" + err_gen);
                    callback(err_gen)
                }  
                else{
                    console.log(user_id+" createUser added user_gen");
                    callback(null)
                }  
            });
        }  
    });}
    
    
app.get('/checkVersion',function (req,res) {
    
    if(req.query.ver != undefined){
        var query_version = "SELECT * FROM `"+table_college_info+"` ORDER BY `college_version` DESC LIMIT 1";
        var query = "Select * From "+ table_college_info;

        connectionPool.getConnection(function(connection_error,connection){
            if(connection_error){
                    console.log(connection_error)
                    res.json({code:0,message:"Error with Esatblishing DB Connection"});
                    connection.release()
            }else{

                connection.query(query,function(err, results){
                    if(err){
                            console.log(" Error/checkVersion: " + err);
                            console.log(" Query/CheckVersion: "+ query)
                            res.json({code:0,message:"Error with DB Query"});
                        }
                    else{
                        var version_number = results[0]['college_version'];
                        for(i = 1; i < results.length; i++){
                            if(version_number < results[i]['college_version']){
                                version_number = results[i]['college_version'];
                            }
                        }
                       
                        if(version_number == req.query.ver){
                            res.json({code:1});
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
                                            college_coor_lng : results[i]['college_coor_lng'],
                                            college_ride_limit : results[i]['ride_limit'],
                                            college_park_limit : results[i]['park_limit']
                                        };
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
                                            res.json(initial_data);
                                            }
                                    });
                                }
                            });
                        }
                    }
                });

                connection.release()
            }
        });

        
    }
    else{
       res.json({code:0,message:"Protocol Injunction"});
    }});

io.sockets.on('connection', newConnection);

function newConnection(socket){
    console.log("New Client Connection : " + socket.id);
    
    socket.on('setUser',function(data){
        console.log(data.user_id + " setUser");
        socket.user_id = data.user_id;
        socket.user_name = data.user_name.toLowerCase();

        if(clients[socket.user_id] == undefined ){
            clients[socket.user_id] = {socket_id: socket.id,connected : socket.connected,status: 'initial_connected'}
            getUserStatus(socket.user_id);
            console.log(socket.user_id + " setUser initial")
        }
        else{
            clients[socket.user_id].socket_id = socket.id;
            clients[socket.user_id].connected = socket.connected;
            console.log(socket.user_id + " setUser reconnect")
            if(clients[socket.user_id]["status"] == 'waiting_match'){
                clearTimeout(clients[socket.user_id]['timer']);
                getUserStatus(socket.user_id);
            }
            else if(clients[socket.user_id]["status"] == 'matched') {
                clearTimeout(clients[socket.user_id]['timer']);
                getUserStatus(socket.user_id);
            }
            else if ( clients[socket.user_id]["status"] == 'finish'){
                getUserStatus(socket.user_id);
            }
        }
    });

    socket.on('getUserStatus',function(){
        getUserStatus(socket.user_id);
    });    

    function getUserStatus(user_id){
            if(user_id == socket.user_id){
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
                        match_end_type: clients[socket.user_id].match_end_type,
                        rider_user_id:  clients[socket.user_id].rider_user_id,
                        rider_user_name: clients[socket.user_id].rider_user_name,
                        parker_user_id: clients[socket.user_id].parker_user_id,
                        parker_user_name: clients[socket.user_id].parker_user_name  
                    });
                }
            }
            else{
                var status = clients[user_id].status;
                if(status == 'initial_connected'){
                     socket.broadcast.to(clients[user_id].socket_id).emit('updateStatus',clients[user_id]);
                }
                else if(status == 'waiting_match'){
                    socket.broadcast.to(clients[user_id].socket_id).emit('updateStatus',{status: status,
                        selected_college:clients[user_id].selected_college , 
                        selected_parkinglot:clients[user_id].selected_parkinglot, 
                        client_type:clients[user_id].client_type});
                }
                else if(status == 'matched'){
                    socket.broadcast.to(clients[user_id].socket_id).emit('updateStatus',{
                        status: status,
                        pu_lat: clients[user_id].pu_lat ,
                        pu_lng: clients[user_id].pu_lng,
                        rider_user_id:  clients[user_id].rider_user_id,
                        rider_user_name: clients[user_id].rider_user_name,
                        parker_user_id: clients[user_id].parker_user_id,
                        parker_user_name: clients[user_id].parker_user_name,
                        start_timestamp:clients[user_id].start_timestamp
                    });
                }
                else if(status == 'finish'){
                    socket.broadcast.to(clients[user_id].socket_id).emit('updateStatus',{
                        status: status,
                        match_end_type: clients[user_id].match_end_type,
                        rider_user_id:  clients[user_id].rider_user_id,
                        rider_user_name: clients[user_id].rider_user_name,
                        parker_user_id: clients[user_id].parker_user_id,
                        parker_user_name: clients[user_id].parker_user_name  
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

        console.log(user_id + " request "+college_id + " | "+ parkinglot_id + " | "+ client_type)
        
       
        /*number_college[college_id][parkinglot_id][client_type] += 1;
        console.log(number_college[college_id]);*/

        connectionPool.getConnection(function(connection_error,connection){
            if(connection_error){
                    console.log(connection_error)
                    connection.release()
            }else{
                var query_1 = "Select * from "+table_area+ " Where college_id = "+college_id +"&& parkinglot_id = "+parkinglot_id+" && type = '" + opposite_type+"' Limit 1";
                connection.query(query_1, function(err_1,results_1){
                    if(err_1){
                        console.log("Error while querying DB(area) for match on request")
                        console.log('Error  : '+err_1);
                        console.log(query_1);
                    }
                    else{
                        if(results_1.length == 0){
                            clients[user_id].status = 'waiting_match';
                            getUserStatus(socket.user_id);
                            var query_2 = "INSERT into "+table_area+"(`user_id`, `user_name`,`college_id`, `parkinglot_id`, `time`, `type`, `socket_id`,`pickup_lat`,`pickup_lng`) VALUES( '"+ user_id+"','"+user_name+"','"+college_id + "','"+parkinglot_id+"',"+time +",'"+client_type+"','"+socket.id+"',"+pu_lat+","+pu_lng+")";
                            connection.query(query_2, function(err_2,results_2){
                                if(err_2){
                                    console.log("Error while registering request into DB(area)")
                                    console.log('Error: '+err_2);
                                    console.log(query_2);
                                }
                                else{
                                    console.log(user_id + " request noMatch | "+college_id + " | "+ parkinglot_id + " | "+ client_type )
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
                                getUserStatus(mirror_user_id);

                            }
                            
                            if(clients[socket.user_id].connected){
                                getUserStatus(socket.user_id);
                            }
                            
                            
                                          
                        }
                    }
                });
                connection.release()
            }
        });
    });
    
    socket.on('joinRoom',function(data){
        joinRoom();
    });

    function joinRoom(){
        console.log(clients[socket.user_id].room_name + " match joinRoom | "+socket.user_id  )
        socket.join(clients[socket.user_id].room_name);
        io.to(clients[socket.user_id].room_name).emit('joined_room_confirm',{user_id:socket.user_id});
    }


    socket.on('updateLocation',function(data){
        console.log(clients[socket.user_id].room_name + " match updateLocation | "+socket.user_id )
        io.to(clients[socket.user_id]["room_name"]).emit('updateCurrentLocation',{user_id : socket.user_id, lat : data.lat, lng : data.lng,atPickup:data.atPickup});

        if(data.atPickup == true){
            userAtPickup();
        }
        else{
            userNotAtPickup();
        }
    });

    socket.on('notAtPickup',function(){
        console.log("--------------------not at pickup event called")
        
    });

    function userNotAtPickup(){
        clients[socket.user_id].closeToPickup = false;
        var rider_user_id = clients[socket.user_id]["rider_user_id"];
        var parker_user_id = clients[socket.user_id]["parker_user_id"];
        if(clients[parker_user_id].confirmed != undefined  && clients[rider_user_id].confirmed != undefined ){
            delete clients[rider_user_id].confirmed;
            delete clients[parker_user_id].confirmed;
            io.to(clients[socket.user_id]["room_name"]).emit('revertConfirmation',{});
            console.log(clients[socket.user_id].room_name + " match revertConfirmation")
        }
    }

    function userAtPickup(){
        clients[socket.user_id].closeToPickup = true;
            var rider_user_id = clients[socket.user_id]["rider_user_id"];
            var parker_user_id = clients[socket.user_id]["parker_user_id"];
                if( clients[rider_user_id].closeToPickup == true && clients[parker_user_id].closeToPickup == true && (clients[rider_user_id].confirmed == undefined && clients[parker_user_id].confirmed == undefined)){
                    clients[rider_user_id].confirmed = false;
                    clients[parker_user_id].confirmed = false;
                    io.to(clients[socket.user_id]["room_name"]).emit('issueConfirmation',{confirmationNumber : Math.floor(Math.random() * (999)) + 100}); 
                    console.log(clients[socket.user_id].room_name + " match issueConfirmation | "+socket.user_id )                               
            }
    }

    socket.on('atPickup',function(){
        console.log("--------------------at pickup event called")
    });

    socket.on('confirmPickUp',function(data){
        console.log(clients[socket.user_id].room_name + " match confirmedPickup | "+socket.user_id )
        clients[socket.user_id]["confirmed"] = true;
        var rider_user_id = clients[socket.user_id]["rider_user_id"];
        var parker_user_id = clients[socket.user_id]["parker_user_id"];

        if(clients[rider_user_id]["confirmed"] === true && clients[parker_user_id]["confirmed"] === true  ){
            endMatch(rider_user_id, parker_user_id,0)
        }
    });

    function endMatch(user_1, user_2,type){

        
        

        clients[user_1]["confirmed"] = false
        clients[user_2]["confirmed"] = false 

        clients[user_1]["match_end_type"] = type
        clients[user_2]["match_end_type"] = type

        connectionPool.getConnection(function(connection_error,connection){
            if(connection_error){
                    console.log(connection_error)
                    connection.release()
            }else{
                var query = "INSERT INTO `"+table_connection + "`(`index_room_name`, `college_id`, `parkinglot_id`, `rider_user_id`, `parker_user_id`, `start_timestamp`, `pu_lat`, `pu_lng`,`match_status`) VALUES('" + clients[user_1].room_name + "'," + clients[user_1].selected_college +"," + clients[user_1].selected_parkinglot +",'"+clients[user_1].rider_user_id +"','"+clients[user_1].parker_user_id +"','" +clients[user_1].start_timestamp+"',"+clients[user_1].pu_lat+","+clients[user_1].pu_lng+",'"+clients[user_1]["match_end_type"]+"')";
                connection.query( query , function(err2,results2) {
                    if(err2){    
                        console.log("query : " + query);
                        console.log("error  :" + err2);
                    }else{
                        console.log(clients[user_1].room_name + " endMatch | "+clients[user_1].college_id + " | "+ clients[user_1].parkinglot_id )
                    }
                }); 
                connection.release()
            }
        });
        
        console.log(clients[socket.user_id].room_name + " finished " )
        if(clients[user_1].connected){
            clients[user_1].status = 'finish';
            getUserStatus(user_1);
        }
        else{
            rateUser(user_2,5);
            resetUser()
        }
        if(clients[user_2].connected){
            clients[user_2].status = 'finish';
            getUserStatus(user_2);
        }
        else{
            rateUser(user_2,5);
            resetUser()
        } 
        
        
   
    }

    socket.on('finish',function(data){
        resetUser();
        var rated_user = data.user_id;
        var given_rating = data.rating;   
        rateUser(rated_user,given_rating);

    });

    
    socket.on('disconnect',function(){
        var user_id =  socket.user_id;
        if(clients[user_id] != undefined){
            clients[user_id].connected = false;
            console.log(user_id + " disconnected | "+ clients[user_id].status)
            if(clients[user_id].status == 'initial_connected'){
                delete clients[user_id];
            }
            else if(clients[user_id].status == 'waiting_match'){  
                clients[user_id]['timer'] = setTimeout(function(){
                    removeRequest(user_id);
                    delete clients[user_id];
                
                }, 30000);
                delete clients[user_id].socket_id;
            }
            else if(clients[user_id].status == 'matched' ){
                userNotAtPickup();
                socket.leave(clients[socket.user_id].room_name);
                io.to(clients[socket.user_id]["room_name"]).emit('disconnected',{user_id:socket.user_id});
                clients[user_id]['timer'] = setTimeout(function(){
                    clearTimeout(clients[clients[socket.user_id].rider_user_id]['timer']);
                    clearTimeout(clients[clients[socket.user_id].parker_user_id]['timer']);
                    endMatch(clients[socket.user_id].rider_user_id,clients[socket.user_id].parker_user_id,1+"|"+socket.user_id)
                    delete clients[user_id];
                    console.log("Match Ended by Disconnect")
                
                }, 60000);
                delete clients[user_id].socket_id
            }
            else {
                delete clients[user_id];
            }
        }
        else{
            console.log("INVALID disconnected "+socket.id)
        }       
    });
        
        

    socket.on('cancelRequest',function(){
        var user_id =  socket.user_id;
        var college_id = clients[user_id]['selected_college'];
        var parkinglot_id = clients[user_id]['parkinglot_id'];
        var client_type = clients[user_id]['client_type'];
        removeRequest(user_id);
        clients[user_id].status = 'initial_connected';
        getUserStatus(socket.user_id);
    });


    function rateUser(rated_user,given_rating){
    

        connectionPool.getConnection(function(connection_error,connection){
            if(connection_error){
                    console.log(connection_error)
                    connection.release()
            }else{
                var query = "SELECT * FROM "+table_user_gen + " WHERE `user_id`='"+rated_user+"'";
                connection.query( query , function(err,results) {
                    if(err){    
                        console.log("query : " + query);
                        console.log("error  :" + err);
                    }else{
                        var current_rating = results[0]["rating"];
                        var total_matches =  results[0]["total_matches"];
                        var new_rating = ((current_rating * total_matches) + given_rating)/(total_matches + 1);
                        total_matches +=1;
                        var query = "UPDATE `"+table_user_gen + "` SET `rating`="+new_rating+",`total_matches`= "+total_matches+",`status`='initial_connected' WHERE `user_id`='"+rated_user+"'";
                        connection.query( query , function(err,results) {
                            if(err){    
                                console.log("query : " + query);
                                console.log("error  :" + err);

                            }else{
                                console.log(rated_user + " rating | "+ new_rating)         
                            }
                        }); 
                        
                    }
                }); 
                connection.release()
            }
        });
    }

    function resetUser(){
        clients[socket.user_id] = {socket_id : socket.id, status : 'initial_connected',connected : socket.connected}
        getUserStatus(socket.user_id);
        console.log(socket.user_id + " setUser initial")
    }
}



function removeRequest(user_id){

    connectionPool.getConnection(function(connection_error,connection){
        if(connection_error){
                console.log(connection_error)
                connection.release()
        }else{
             var query = "Delete from "+table_area+ " Where user_id = '"+user_id+"'";
            connection.query(query, function(err,results){
                if(err){
                    console.log("Error while on disconnect,  deleting matched enry from DB(area)")
                    console.log('Error: '+err);
                    console.log(query);
                }
                else{
                    console.log(user_id + " request canceled ")
                    
                }
            });
            connection.release()
        }
    });

   
}

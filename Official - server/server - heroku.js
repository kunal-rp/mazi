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
var jwt = require('jsonwebtoken')

//Ensures server continues to run if any exception occurs. Will have to come up with a better system in the future
process.on('uncaughtException', function (err) {
  console.log(err);
});



/*
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
	database: 'VierveDB',
	port:3307
});

*/
app = express();
var server = app.listen(process.env.PORT || 3000);

app.use(express.static('public'));


var io = socket(server);

//Connection to SQL DB
//NEED to create two seperate connections for user_prim and general uses for security 
var connectionPool = mysql.createPool({
    connectionLimit:15,
    host: 'us-cdbr-iron-east-05.cleardb.net',
    user: 'bec24a7d950033',
    password: '2daa4275',
    database: 'heroku_f95ea9c68d995b3'
});


//All tables for SQL DB
var table_college_info = 'college_info';
var table_parkinglot_info = 'parkinglot_info';
var table_area = "_area";
var table_connection = "_connect";
var table_user_prim = 'user_prim';
var table_user_gen = 'user_gen';
var table_suggestion = 'suggestions'
var table_events = 'events'

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

//generates the JWt general user tokens on server start
function generateCodes(callback){
    generateNewPassword(20,function(v_a){
        generateNewPassword(20,function(v_i){
            generateNewPassword(20,function(v_w){
                callback({vierve_android:v_a,
                    vierve_ios:v_i,
                    vierve_web:v_w})
            })
        })
    })
}


var codes;
generateCodes(function(data){
    codes = data;
    console.log(codes)
});

/*
setInterval(function(){
    codes = generateCodes()
}, 6000);
*/



app.get('/getCodes',function(req,res){
    jwt.verify(req.get('token'), 'vierve_device_KRP', function(err, decoded) {
        if(err){
            console.log("ERROR | getCodes |"+err)
            res.json({code:0 , message:"Error Authenticating Token "})
        }
        else{
            res.json({token:jwt.sign(codes,'vierve_device_KRP')})
        }
    }); 
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
            console.log("ERROR | verifyEmail |connectionError|"+connection_error)
            connection.release()
        }
        else{

            //in case parameters are not given
            if(given_hash == undefined || given_user_name == undefined){
                console.log("ERROR | verifyEmail | Parameters not met | "+given_user_name + " - "+given_hash)
                res.sendFile(path.join(__dirname, '/public', 'error.html'));
            }
            else{
                var query_user_prim = "Select * From "+ table_user_prim + " Where `user_name` = '"+given_user_name+"'";
                connection.query(query_user_prim,function(err, results){
                    if(err){
                        console.log("ERROR | verifyEmail |"+err+ "|"+query_user_prim+"|"+given_user_name + "-"+given_hash)
                        res.sendFile(path.join(__dirname, '/public', 'error.html'));
                    }
                    else{
                        //in case username is invalid
                        if(results.length == 0){
                            console.log("verifyEmail |  invalid username |"+given_user_name + "-"+given_hash)
                            res.sendFile(path.join(__dirname, '/public', 'error.html'));
                        }
                        else{
                            //in case account is already verified
                            if(results[0]['email_verified'] == 1 ){
                                console.log("verifyEmail | account already verified|"+given_user_name + "-"+given_hash)
                                res.sendFile(path.join(__dirname, '/public', 'error.html'));
                            }
                            else{
                                //in case user_name and given salt are correct and the account is not verified
                                if(given_hash == results[0].main_salt){
                                    var query_update_email_verified = "UPDATE `user_prim` SET `email_verified` = 1 WHERE `user_name`='"+given_user_name+"'";
                                    connection.query(query_update_email_verified,function(err_update_ev, results_ev){
                                        if(err_update_ev){
                                            console.log("ERROR | verifyEmail |"+err_update_ev+ "|"+query_update_email_verified+"|"+given_user_name + "-"+given_hash)
                                            res.sendFile(path.join(__dirname, '/public', 'error.html'));
                                        }
                                        else{
                                            console.log("verifyEmail | sucsess |"+given_user_name + "|"+given_hash)
                                            res.sendFile(path.join(__dirname, '/public', 'verifyEmail.html'));
                                        }
                                    });
                                }
                                //in case of invalid salt
                                else{
                                    console.log("verifyEmail | invalid hash |"+given_user_name + "-"+given_hash)
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

    if(req.get("token") == undefined ||req.get("user_type") == undefined || codes[req.get("user_type")] == undefined){
        res.json({code: 0, message: "Please Restart.\n Parameters not meet."});
        console.log("checkUser | parameters not met ")

    }
    else{
        jwt.verify(req.get("token"), codes[req.get("user_type")], function(err, decoded) {
            if(err){
                console.log("ERROR | checkUser | verifyToken | "+err)                       
                res.json({code:0 , message:"Please Restart.\n Error Authenticating Token"})
            }
            else{

                if(decoded.user_name == undefined ||decoded.user_password == undefined ){
                    res.json({code: 0, message: " Parameters not meet"});
                    console.log("checkUser | tokenData Parameters not met ")                                    
                }
                else{
                    var given_user_name = decoded.user_name;
                    given_user_name = given_user_name.toLowerCase();
                    var given_password = decoded.user_password;

                    connectionPool.getConnection(function(connection_error,connection){
                        if(connection_error){
                            console.log("ERROR | checkUser | connectionError | "+connection_error)                      
                            connection.release()
                            res.json({code:0,message:"Cannot Establish DB Connection"});
                        }
                        else{
                            var query_user_prim = "Select * From "+ table_user_prim + " Where `user_name` = '"+given_user_name+"'";
                            connection.query(query_user_prim,function(err, results){
                                if(err){
                                    console.log("ERROR | checkUser |"+err+ "|"+query_user_prim+"|"+given_user_name )
                                    res.json({code:0,message:"Error with DB Query"});
                                }
                                else{

                                    if(results.length == 0){
                                        res.json({code:0,message:"Invalid Username"});
                                        console.log("checkUser | invalid user name |"+given_user_name )

                                    }
                                    else{
                                        bcrypt.compare(results[0]['user_id']+ ""+given_password, results[0]['user_password'], function(password_check_error, password_result) {
                                            if(password_check_error){
                                                console.log("ERROR | checkUser |"+password_check_error)
                                                res.json({code:0,message:"Error Compare Password"});
                                            }
                                            else{
                                                if(password_result == true){
                                                    if(clients[results[0]['user_id']] != undefined && clients[results[0]['user_id']]['socket_id'] != undefined){
                                                        res.json({code:0,message:"User Currently Active on Other Device"});
                                                        console.log("checkUser | user active on other device |"+given_user_name )
                                                    }
                                                    else{

                                                        if(results[0].email_verified == 1){
                                                            generateNewPassword(20,function(data){
                                                                if(clients[results[0]['user_id']] == undefined){
                                                                    clients[results[0]['user_id']] = {};
                                                                }
                                                                clients[results[0]['user_id']]['auth_code'] = data;
                                                                console.log("checkUser |"+results[0]['user_id'] + "-"+ clients[results[0]['user_id']]['auth_code'])
                                                                res.json({code:1 , user_id : results[0]['user_id'],user_name : results[0]['user_name'],user_email: results[0]['user_email'],auth_code : clients[results[0]['user_id']]['auth_code'] });
                                                            });
                                                            console.log("checkUser | checkUser pass for user |"+given_user_name )
                                                        }
                                                        else{
                                                            res.json({code:0,message:"User email Not Verified.\nPlease Verify Email"});
                                                            console.log("checkUser | email not verified |"+given_user_name )
                                                        } 
                                                    }
                                                }
                                                else{
                                                    res.json({code:0,message:"Invalid Password"});
                                                    console.log("checkUser | invalid password |"+given_user_name )
                                                }
                                            }
                                        });
                                    }
                                }
                            });
                            connection.release();
                        }
                    });
                }
            }
        });
    }
});



/*
used to check the user status
*/
app.get('/addSuggestion',function (req,res) {

    if(req.get("token_user") == undefined ||req.get("token_data") == undefined ||req.get("user_type") == undefined || codes[req.get("user_type")] == undefined){
        res.json({code: 0, message: "Please Restart.\n Parameters not meet"});
        console.log("addSuggestion | parameters not met " )
    }
    else{
        jwt.verify(req.get("token_user"), codes[req.get("user_type")], function(err_verify_user, decoded_verify_user) {
            if(err_verify_user){
                console.log("ERROR | addSuggestion | tokenVerifyError general | "+err_verify_user)                          
                res.json({code:0 , message:"Please Restart.\n Error Authenticating Token"})
            }
            else{
                jwt.verify(req.get("token_data"), clients[decoded_verify_user.user_id].auth_code, function(err, decoded) {
                    if(err){
                        console.log("ERROR | addSuggestion | tokenVerifyError user | "+err)                         
                        res.json({code:0 , message:"Please Restart.\n Error Authenticating Token"})
                    }
                    else{
                        if(decoded.user_id == undefined ||decoded.type == undefined ||decoded.system_data == undefined ||decoded.comment == undefined ){
                            res.json({code: 0, message: "Please Restart.\n Parameters not meet"});
                            console.log("addSuggestion | decoded Token | parameters not met " )
                        }
                        else{
                            var user_id = decoded.user_id;
                            var type = decoded.type;
                            var system_data = decoded.system_data;
                            var comment = decoded.comment;

                            connectionPool.getConnection(function(connection_error,connection){
                                if(connection_error){
                                    console.log("ERROR | addSuggestion | connectionError| "+connection_error)                           
                                    connection.release()
                                    res.json({code:0,message:"Cannot Establish DB Connection"});
                                }
                                else{
                                    var timestamp = Math.round((new Date()).getTime() / 1000);

                                    var query_insert_suggestion = "INSERT INTO "+table_suggestion + "(`id`,`timestamp`, `user_id`, `type`, `system_data`, `message`) VALUES('"+(timestamp+"|"+user_id)+"',"+timestamp+",'"+user_id+"',"+mysql.escape(type)+","+mysql.escape(system_data)+","+mysql.escape(comment)+")";
                                    connection.query(query_insert_suggestion,function(err, results){
                                        if(err){
                                            console.log("ERROR | addSuggestion | queryError| "+err + "|"+query_insert_suggestion) 
                                            res.json({code:0,message:"Error with DB Query"});
                                        }
                                        else{
                                            res.json({code:1});
                                            console.log("addSuggestion | sucsess")
                                        }
                                    });
                                    connection.release();
                                }
                            });
                        }
                    }
                });
            }
        });
    }
});

app.get('/checkUsername',function(req,res){

    if(req.get("token") == undefined ||req.get("user_type") == undefined || codes[req.get("user_type")] == undefined){
        res.json({code: 0, message: "Please Restart.\n Parameters not met"});
        console.log("checkUsername | parameters not met")
    }
    else{
        jwt.verify(req.get("token"), codes[req.get("user_type")], function(err, decoded) {
            if(err){
                console.log("ERROR | checkusername | tokenVerifyError| "+err) 
                res.json({code:0 , message:"Please Restart.\n Error Authenticating Token"})
            }
            else{
                if(decoded.user_name == undefined ){
                    console.log("checkUsername | decodedToken| parameters not met")
                    res.json({code: 0, message: "Please Restart.\n Parameters not met"});
                }
                else{
                    connectionPool.getConnection(function(connection_error,connection){
                        if(connection_error){
                            console.log("ERROR | checkusername | connectionError| "+connection_error) 
                            connection.release()
                            res.json({code:0,message:"Please Restart.\n Error Establiching DB Connection"});
                        }
                        else{
                            var given_user_name = decoded.user_name
                            given_user_name = given_user_name.toLowerCase();
                            var query_user_name_prim = "Select * From "+ table_user_prim + " Where `user_name` = '"+given_user_name+"'";
                            connection.query(query_user_name_prim,function(err_query, results){
                                if(err_query){
                                    console.log("ERROR | checkusername | queryError| "+err_query + "|"+query_user_name_prim) 
                                    res.json({code:0,message:"Please Restart.\n Error with DB Query"});
                                }
                                else{
                                    if(results.length == 0){
                                        console.log("checkUsername | sucsess")
                                        res.json({code: 1});
                                    }
                                    else{
                                        //username taken
                                        console.log("checkUsername |  username taken | "+given_user_name)
                                        res.json({code:0,message:"Username Taken"});
                                    }
                                }
                            });
                            connection.release()
                        }
                    }); 
                }
            }
        });
    }
});


app.get('/updateUser',function(req,res){


    if(req.get("token_user") == undefined ||req.get("token_data") == undefined ||req.get("user_type") == undefined || codes[req.get("user_type")] == undefined){
        res.json({code: 0, message: "Parameters not meet"});
        console.log("updateUser |  parameters not met ")
    }
    else{
        jwt.verify(req.get("token_user"), codes[req.get("user_type")], function(err_verify_user, decoded_verify_user) {
            if(err_verify_user){
                console.log("ERROR | updateUser | tokenVerifyError data | "+err_verify_user) 
                res.json({code:0 , message:"Error Authenticating Token"})
            }
            else{
                jwt.verify(req.get("token_data"), clients[decoded_verify_user.user_id].auth_code, function(err, decoded) {
                    if(err){
                        console.log("ERROR | updateUser | tokenVerifyError user | "+err) 
                        res.json({code:0 , message:"Error Authenticating Token"})
                    }
                    else{
                        if(decoded.new_user_password == undefined || decoded.new_user_name == undefined ||decoded.user_password == undefined ||decoded.user_email == undefined ){
                            console.log("updateUser |  tokendecoded | parameters not met ")
                            res.json({code: 0, message: "Parameters not meet"});
                        }
                        else{
                            var user_id = decoded.user_id
                            var user_email = decoded.user_email
                            var user_password = decoded.user_password
                            var new_user_password = decoded.new_user_password
                            var new_user_name = decoded.new_user_name
                            connectionPool.getConnection(function(connection_error,connection){
                                if(connection_error){
                                    console.log("ERROR | updateUser | tokenVerifyError user | "+connection_error) 
                                    connection.release()
                                    res.json({code:0,message:"Error Establishing DB Connection"});
                                }
                                else{
                                    var query_get_user = "Select * From "+ table_user_prim + " Where `user_id` = '"+user_id+"' && `user_email`='"+user_email+"'"
                                    connection.query(query_get_user,function(err_get_user,result_get_user){
                                        if(err_get_user){
                                            console.log("ERROR | updateUser |  sql query | "+err_get_user+"|"+query_get_user) 
                                            res.json({code:0,message:"Error with DB Query"});
                                        }
                                        else{
                                            bcrypt.compare(user_id+ ""+user_password, result_get_user[0]['user_password'], function(password_check_error, password_result) {
                                                if(password_check_error){
                                                    console.log("ERROR | updateUser |  password check error | "+password_check_error) 
                                                    res.json({code:0,message:"Error with Password Compare"});
                                                }
                                                else{
                                                    if(password_result == true){
                                                        bcrypt.genSalt(10, function(salt_err, salt) {
                                                            bcrypt.hash(user_id+""+new_user_password, salt, function(has_err, hash) {
                                                                var query_update_user = "UPDATE `"+table_user_prim + "` SET `user_name`='"+new_user_name+"',`user_password`= '"+hash+"' WHERE `user_id`='"+user_id+"'";
                                                                connection.query(query_update_user,function(err,result){
                                                                    if(err){
                                                                        console.log("ERROR | updateUser |  sql query | "+err+"|"+query_update_user) 
                                                                        res.json({code:0,message:"Error with DB Query"});
                                                                    }
                                                                    else{
                                                                        console.log("updateUser |  sucsess") 
                                                                        res.json({code:1,new_user_name:new_user_name,new_user_password : new_user_password})
                                                                    }
                                                                })
                                                            });
                                                        });
                                                    }
                                                    else{
                                                        console.log(" updateUser |  invalid password") 
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
                    }
                });
            }
        });
    }
});


app.get('/resetCredential',function(req,res){

    if(req.get("token") == undefined ||req.get("user_type") == undefined || codes[req.get("user_type")] == undefined){
        res.json({code: 0, message: "Parameters not meet"});
        console.log("resetCredential |  parameters not met") 
    }
    else{
        jwt.verify(req.get("token"), codes[req.get("user_type")], function(err, decoded) {
            if(err){
                console.log("ERROR | resetCredential |  tokenVerifyError | "+err) 
                res.json({code:0 , message:"Error Authenticating Token"})
            }
            else{

                if(decoded.user_email == undefined || decoded.type_forget == undefined ){
                    console.log("resetCredential | parameters not met") 
                    res.json({code: 0, message: "Parameters not meet"});
                }
                else{
                    var user_email = decoded.user_email
                    var type_forget = decoded.type_forget
                    connectionPool.getConnection(function(connection_error,connection){
                        if(connection_error){
                            console.log("ERROR | resetCredential |  connectionError | "+connection_error) 
                            connection.release()
                            res.json({code:0,message:"Error Establishing DB Connection"});
                        }
                        else{
                            var query_get_user = "Select * From "+ table_user_prim + " Where `user_email`='"+user_email+"'"
                            connection.query(query_get_user,function(err_get_user,result_get_user){
                                if(err_get_user){
                                    console.log("ERROR | resetCredential |  sql query error | "+err_get_user + "|"+query_get_user) 
                                    res.json({code:0,message:"Error with DB Query"});
                                }
                                else{
                                    if(result_get_user.length == 0){
                                        console.log(" resetCredential |  no email match") 
                                        res.json({code:0,message:"No Email Matched in our Records"});
                                    }
                                    else{
                                        if(result_get_user[0]['email_verified'] == 0){
                                            console.log("resetCredential |  email not verified") 
                                            res.json({code:0,message:"This email still needs to be verified.\n Please login into this email and verify"});
                                        }
                                        else{
                                            var user_name = result_get_user[0]['user_name']
                                            var user_id = result_get_user[0]['user_id']
                                            if(type_forget == 'username'){
                                                var mailOpts = {
                                                    from:'forgot@vierve.com',
                                                    to: user_email,
                                                    subject: 'Vierve - Forgot Username',
                                                    html : '<h1>You indicated that you forgot your username!</h1> <p>Here is your username : @'+user_name+'</p>'
                                                };
                                                transporter.sendMail(mailOpts, function (err2, response) {
                                                    if (err2) {
                                                        console.log("ERROR | resetCredential |  sending email | "+err2) 

                                                    } else {
                                                        console.log(" resetCredential | forgotUsernameEmailSent | "+user_email + " - "+user_name) 
                                                    }
                                                })
                                                res.json({code:1});
                                                console.log(" resetCredential |  sucsess") 
                                            }
                                            else if(type_forget== 'password'){
                                                generateNewPassword(10,function(newPassword){
                                                    bcrypt.genSalt(10, function(salt_err, salt) {
                                                        bcrypt.hash(user_id+""+newPassword, salt, function(has_err, hash) {
                                                            var query_update_user = "UPDATE `"+table_user_prim + "` SET `user_password`= '"+hash+"' WHERE `user_id`='"+user_id+"'";
                                                            connection.query(query_update_user,function(err,result){
                                                                if(err){
                                                                    console.log("ERROR | resetCredential |  sql error | "+err + "|"+query_update_user) 
                                                                    res.json({code:0,message:"Error with DB Query"});
                                                                }
                                                                else{
                                                                    var mailOpts = {
                                                                        from:'forgot@vierve.com',
                                                                        to: user_email,
                                                                        subject: 'Vierve - Forgot Password',
                                                                        html : '<h1>You indicated that you forgot your password!</h1> <p>Here is your new password  : '+newPassword+'</p><p>Make sure to Reset your password after logging in</p>'
                                                                    };
                                                                    transporter.sendMail(mailOpts, function (err2, response) {
                                                                        if (err2) {
                                                                            console.log("ERROR | resetCredential |  sending email | "+err2) 

                                                                        } else {
                                                                            console.log(" resetCredential | forgotPasswordEmailSent | "+user_email + " - "+user_name) 
                                                                        }
                                                                    })
                                                                    res.json({code:1})
                                                                    console.log(" resetCredential sucsess") 
                                                                }
                                                            })
                                                        });
                                                    });
                                                });
                                            }
                                        }
                                    }
                                }
                            });
                            connection.release()
                        }
                    });
                }
            }
        });
}
});


function generateNewPassword(size,callback){

    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for (var i = 0; i <= size; i++){
        if(i < size){
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        else{
            callback(text)
        }
    }    
}


app.get('/createUser',function (req,res) {

    if(req.get("token") == undefined ||req.get("user_type") == undefined || codes[req.get("user_type")] == undefined){
        res.json({code: 0, message: "Parameters not met"});
        console.log(" createuser | parameters not met ") 
    }
    else{
        jwt.verify(req.get("token"), codes[req.get("user_type")], function(err, decoded) {
            if(err){
                console.log("ERROR |createUser | tokenVerifyError | "+err ) 
                res.json({code:0 , message:"Error Authenticating Token"})
            }
            else{
                var data = {}
                if(decoded.user_name == undefined ||decoded.user_password == undefined ||decoded.user_email == undefined || decoded.promo_user == undefined ){
                    res.json({code: 0, message: "Parameters not met"});
                    console.log(" createUser | parameters not met") 
                }
                else{
                    validator.check(req.query.user_email , function(valid_email_err, valid) {
                        if (valid_email_err){
                            console.log("ERROR | createUser | validate email | "+valid_email_err) 
                            res.json({code:0,message:"Validating Email Error"});
                        }
                        else{
                            if(valid == false){
                                res.json({code:0,message:"Invalid Email"});
                                console.log("createUser | invalid email") 
                            }
                            else{
                                data.user_name = (decoded.user_name).toLowerCase();
                                data.user_password = decoded.user_password;
                                data.user_email = decoded.user_email;
                                data.promo = decoded.promo_user

                                connectionPool.getConnection(function(connection_error,connection){
                                    if(connection_error){
                                        console.log("ERROR | createUser | connection error | "+connection_error) 
                                        res.json({code:0,message:"Error with Establishing DB Connection"});
                                        connection.release()
                                    }else{

                                        var query_email_check = "Select * From "+ table_user_prim + " Where `user_email` ='"+data.user_email+"'";
                                        connection.query(query_email_check,function(err_email_check, results_email_check){
                                            if(err_email_check){
                                                console.log("ERROR | createUser |"+err_email_check + "|"+query_email_check)
                                                res.json({code:0,message:"User could not be created"});
                                            }
                                            else{
                                                if(results_email_check.length > 0){
                                                    res.json({code:0,message:"User with that email alresdy exists"});
                                                }
                                                else{
                                                    generateUserID(data,connection,function(err){
                                                        if(err){
                                                            console.log("ERROR | createUser | user creation  | "+err) 
                                                            res.json({code:0,message:"User could not be created"});
                                                        } else {
                                                            console.log("userCreated |"+data.toString())
                                                            res.json({code: 1});
                                                            var mailOpts = {
                                                                from:'noreply@vierve.com',
                                                                to: data.user_email,
                                                                subject: 'Email Verification',
                                                                html : '<h1>Welcome to Vierve @'+data.user_name+'!</h1> <p>Click the link below to activate your account.</p><a href="https://server.vierve.com/verifyEmail?user_name='+data.user_name+'&hash='+data.main_salt+'">Click Here </a><p></p>'
                                                            };
                                                            transporter.sendMail(mailOpts, function (err2, response) {
                                                                if (err2) {
                                                                    console.log("ERROR | createUser | sending email | "+err2) 
                                                                } else {
                                                                    console.log("Email Verification sent to "+ data.user_email)
                                                                    console.log("createUser | email verification sent | "+data.user_email) 
                                                                }
                                                            })

                                                        }
                                                    });

                                                }


                                            }
                                        });
                                        connection.release()
                                    }
                                });
                            }
                        }
                    });
                }
            }
        });
    }

});


function generateUserID(data,connection,callback){
    var number =  Math.floor(Math.random() * 16777216)+1;
    number = number.toString(16).toUpperCase();

    var query_user_prim = "Select * From "+ table_user_prim + " Where `user_id` ='"+number+"'";
    connection.query(query_user_prim,function(err, results){
        if(err){
            console.log("ERROR | Generating User ID |"+err)
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
    });
}

function addUser(data,connection,callback){
    var user_id = data.user_id;
    var user_name = data.user_name;
    var user_email = data.user_email; 
    var user_password = data.user_password;
    var salt = data.main_salt;
    var query_add_prim = "INSERT INTO "+table_user_prim + "(`user_id`, `user_name`, `user_email`, `user_password`, `email_verified`,`main_salt`,`create_timestamp`) VALUES('"+user_id+"','"+user_name+"','"+user_email+"','"+user_password+"',0,'"+salt+"',"+Math.round((new Date()).getTime() / 1000)+")";
    connection.query( query_add_prim , function(err_prim,results_prim) {
        if(err_prim){    
            console.log("ERROR | inserting new user prim |"+err_prim + "|"+query_add_prim)
            callback(err_prim)
        }
        else{
            
            var query_gen = "INSERT INTO "+table_user_gen + "(`user_id`,`rating`,`total_matches`) VALUES('"+user_id+"',5,0)";
            connection.query( query_gen , function(err_gen,results_gen) {
                if(err_gen){    
                    console.log("ERROR | inserting new user gen |"+err_gen + "|"+query_gen)
                    callback(err_gen)
                }  
                else{
                    updatePromoUserId(data,connection,callback);
                }  
            });
        }  
    });
}

function updatePromoUserId(data,connection,callback){
    var promo_user_name = data.promo
    var user_id = data.user_id
    if(promo_user_name == "-"){

        var query_update_promo = "Update `"+table_user_gen+"` set `promo_user`= '-' Where `user_id`='"+user_id+"'";
        connection.query( query_update_promo , function(err_update_promo,results_update_promo) {
            if(err_update_promo){
                console.log("ERROR | getPromoUserId |"+err_update_promo + "|"+query_update_promo)
                callback(err_update_promo)
            }else{
                callback(null)
            }   
        });
    }
    else{
        var query_prim = "SELECT * FROM "+table_user_prim+" WHERE `user_name`='"+promo_user_name+"'";
        connection.query( query_prim , function(err_prim,results_prim) {
            if(err_prim){    
                console.log("ERROR | getPromoUserId |"+err_prim + "|"+query_prim)
                callback(err_prim)
            }
            else{
                if(results_prim.length == 0){
                    callback("promo user does not exist")
                }
                else{
                    var query_update_promo = "Update `"+table_user_gen+"` set `promo_user`= '"+results_prim[0]['user_id']+"' Where `user_id`='"+user_id+"'";
                    connection.query( query_update_promo , function(err_update_promo,results_update_promo) {
                        if(err_update_promo){
                            console.log("ERROR | getPromoUserId |"+err_update_promo + "|"+query_update_promo)
                            callback(err_update_promo)
                        }else{
                            callback(null)
                        }   

                    });
                }
                
            }  
        });
    }
}




app.get('/getEvents',function (req,res) {

    if(req.get("token") == undefined ||req.get("user_type") == undefined || codes[req.get("user_type")] == undefined){
        res.json({code: 0, message: "Please Restart.\n Parameters not meet."});
        console.log("checkUser | parameters not met ")

    }
    else{
        jwt.verify(req.get("token"), codes[req.get("user_type")], function(err, decoded) {
            if(err){
                console.log("ERROR | checkUser | verifyToken | "+err)                       
                res.json({code:0 , message:"Please Restart.\n Error Authenticating Token"})
            }
            else{
                
                var query_events = "SELECT * FROM `"+table_events+"`";

                connectionPool.getConnection(function(connection_error,connection){
                    if(connection_error){
                        console.log("ERROR | getEvents |  connectionError |"+connection_error) 
                        res.json({code:0,message:"Error with Esatblishing DB Connection"});
                        connection.release()
                    }else{
                        connection.query(query_events,function(err, results){
                            if(err){
                                console.log("ERROR | getEvents |  sql query |"+err+"|"+query) 
                                res.json({code:0,message:"Error with DB Query"});
                                connection.release();
                            }
                            else{
                                var end = {};
                                for(i = 0; i < results.length; i++){
                                    end[results[i]['college_id']]={
                                        'event_title' : results[i]['event_title'],
                                        'event_subTitle' : results[i]['event_subTitle'],
                                        'event_html' : results[i]['event_html']
                                    }
                                }
                                res.json(end)
                                
                            }
                        });
                        connection.release()
                    }
                });

            }

        });
    }
});




app.get('/checkVersion',function (req,res) {

    if(req.get("token_user") == undefined ||req.get("token_data") == undefined ||req.get("user_type") == undefined || codes[req.get("user_type")] == undefined){
        res.json({code: 0, message: "Parameters not meet"});
        console.log(" checkVersion | parameters not met ") 
    }
    else{
        jwt.verify(req.get("token_user"), codes[req.get("user_type")], function(err_verify_user, decoded_verify_user) {
            if(err_verify_user){
                console.log("ERROR | checkVersion |  tokenVerifyError data |"+err_verify_user) 
                res.json({code:0 , message:"Error Authenticating Token"})
            }
            else{
                jwt.verify(req.get("token_data"), clients[decoded_verify_user.user_id].auth_code, function(err, decoded) {
                    if(err){
                        console.log("ERROR | checkVersion |  tokenVerifyError user |"+err) 
                        res.json({code:0 , message:"Error Authenticating Token"})
                    }
                    else{

                        if(decoded.ver == undefined){
                            console.log("checkVersion |  parameters not met") 
                            res.json({code: 0, message: "Parameters not met"});
                        }
                        else{
                            var query_version = "SELECT * FROM `"+table_college_info+"` ORDER BY `college_version` DESC LIMIT 1";
                            var query = "Select * From "+ table_college_info;

                            connectionPool.getConnection(function(connection_error,connection){
                                if(connection_error){
                                    console.log("ERROR | checkVersion |  connectionError |"+connection_error) 
                                    res.json({code:0,message:"Error with Esatblishing DB Connection"});
                                    connection.release()
                                }else{

                                    connection.query(query,function(err, results){
                                        if(err){
                                            console.log("ERROR | checkVersion |  sql query |"+err+"|"+query) 
                                            res.json({code:0,message:"Error with DB Query"});
                                            connection.release();
                                        }
                                        else{
                                            var version_number = results[0]['college_version'];
                                            for(i = 1; i < results.length; i++){
                                                if(version_number < results[i]['college_version']){
                                                    version_number = results[i]['college_version'];
                                                }
                                            }

                                            if(version_number == req.query.ver){
                                                console.log(" checkVersion |  sucsess") 
                                                res.json({code:1});
                                                connection.release();
                                            }
                                            else{
                                                var initial_data = {};
                                                var query = "Select * From "+ table_college_info;
                                                connection.query( query , function(err,results) {
                                                    if(err){
                                                        console.log("ERROR | checkVersion |  sql query |"+err+"|"+query) 
                                                        connection.release();
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
                                                                console.log("ERROR | checkVersion |  sql query |"+err2+"|"+query2) 
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
                    }
                });
            }
        });
}
});

io.sockets.on('connection', newConnection);

function newConnection(socket){
    console.log("New Client Connection : " + socket.id );
    var sHeaders = socket.handshake.headers;
    console.info('[%s:%s] CONNECT', sHeaders['x-forwarded-for'], sHeaders['x-forwarded-port']);

    setTimeout(sendHeartbeat, 25000);
    function sendHeartbeat(){
        setTimeout(sendHeartbeat, 25000);
        io.sockets.emit('ping', { beat : 1 });
    }

    socket.on('setUser',function(data){
        console.log("setUser | "+data.user_id);
        socket.user_id = data.user_id;
        socket.user_name = data.user_name.toLowerCase();
        if(clients[socket.user_id]['status'] == undefined ){
            clients[socket.user_id] = {socket_id: socket.id,connected : socket.connected,status: 'initial_connected',user_name:data.user_name.toLowerCase(),auth_code :clients[socket.user_id].auth_code }
            console.log("setUser initial "+socket.user_id )
            getUserStatus(socket.user_id);
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
                clearTimeout(clients[socket.user_id]['timer']);
                getUserStatus(socket.user_id);
            }
        }
    });

    socket.on('getUserStatus',function(){
        getUserStatus(socket.user_id);
    });    

    function getUserStatus(user_id){
        console.log("Get Status : \n"+ JSON.stringify(clients[socket.user_id]))
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
        updateRegisterData(data)
    });

    function updateRegisterData(data){
        console.log("update Register Data")
        var user_id = socket.user_id;

        clients[user_id]['selected_college'] = data.college_id;
        clients[user_id]['selected_parkinglot'] = data.parkinglot_id;
        clients[user_id]['client_type'] = data.type;
        clients[user_id]['time'] = Math.round((new Date()).getTime() / 1000);

        var pu_lat= 0;
        var pu_lng = 0;
        var opposite_type = 'ride';

        if(data.type == 'ride'){
            opposite_type = 'park';
            pu_lat= data.pickup_lat;
            pu_lng = data.pickup_lng;
        }
        clients[user_id]['pu_lat'] = pu_lat;
        clients[user_id]['pu_lng'] = pu_lng;

        connectionPool.getConnection(function(connection_error,connection){
            if(connection_error){
                console.log(connection_error)
                connection.release()
            }else{
                findMatch(connection,"initial",user_id);

            }
        });

    }


    function findMatch(connection,type,user_id){
        console.log(user_id+" Find Match "+ type )
        var query_find_match = "Select * from "+table_area+ " Where college_id = "+clients[user_id].selected_college +"&& parkinglot_id = "+clients[user_id].selected_parkinglot+" && type != '" + clients[user_id].client_type+"' Limit 1";
        connection.query(query_find_match, function(err_find_match,results_find_match){
            if(err_find_match){
                console.log("Error while querying DB(area) for match on request")
                console.log('Error  : '+err_find_match);
                console.log(query_find_match);
            }
            else{
            if(results_find_match.length == 0){//No Match Found
                console.log(user_id+" No Match")
                if(type == "initial"){

                    clients[user_id].status = 'waiting_match';
                    getUserStatus(user_id);

                    insertRegisterRequest(connection,user_id,function(){
                        clients[user_id]['timer'] = setTimeout(function(){
                            findMatch(connection,"other",user_id)
                        }, 1000);
                    });
                }
                else{
                    console.log(user_id+" Second Check No Match "+ type )
                    connection.release()
                }
            }
            else{ //Match Found
                var mirror_user_id = results_find_match[0].user_id;
                console.log(user_id+" Match found "+ mirror_user_id )

                removeRequest(connection,mirror_user_id,function(){removeRequest(connection,user_id,function(){
                    matchOperations(user_id,mirror_user_id)})
                if(clients[mirror_user_id]['timer'] != undefined){clearTimeout(clients[mirror_user_id]['timer']);}
                if(clients[user_id]['timer'] != undefined){clearTimeout(clients[user_id]['timer']);}
            });



            }
        }
    });
    }

    function insertRegisterRequest(connection, user_id,callback){
        console.log(user_id+" Insert Register Request" )
        var query_2 = "INSERT into "+table_area+"(`user_id`, `user_name`,`college_id`, `parkinglot_id`, `time`, `type`, `socket_id`,`pickup_lat`,`pickup_lng`) VALUES( '"+ user_id+"','"+clients[user_id].user_name+"','"+clients[user_id].selected_college + "','"+clients[user_id].selected_parkinglot+"',"+clients[user_id].time +",'"+clients[user_id].client_type+"','"+clients[user_id].socket_id+"',"+clients[user_id].pu_lat+","+clients[user_id].pu_lng+")";
        connection.query(query_2, function(err_2,results_2){
            if(err_2){
                console.log("Error while registering request into DB(area)")
                console.log('Error: '+err_2);
                console.log(query_2);
            }
            else{
                console.log(user_id + " request noMatch | "+clients[user_id].selected_college + " | "+ clients[user_id].selected_parkinglot + " | "+ clients[user_id].client_type )
                callback();
            }
        });
    }

    function removeRequest(connection,user_id,callback){
        console.log(user_id+" remove Register Request")
        var query = "Delete from "+table_area+ " Where user_id = '"+user_id+"'";
        connection.query(query, function(err,results){
            if(err){
                console.log("Error while on disconnect,  deleting matched enry from DB(area)")
                console.log('Error: '+err);
                console.log(query);
            }
            else{
                console.log(user_id + " request canceled ")
                callback()
            }
        }); 
    }

    function matchOperations(user_id,mirror_user_id){
        console.log(user_id+" Match Operations "+ mirror_user_id )
    //Match Operations
    var user_name = clients[user_id].user_name
    var mirror_user_name = clients[mirror_user_id].user_name
    var start_timestamp = Math.round((new Date()).getTime() / 1000);
    var rider_user_id;
    var rider_user_name;
    var parker_user_id;
    var parker_user_name;
    var rider_location = 0;
    var parker_location = 0;
    var end_timestamp = "N/a";
    var pu_lat;
    var pu_lng;


    if(clients[user_id].client_type == 'ride'){
        rider_user_id =user_id;
        rider_user_name = user_name;
        parker_user_id = mirror_user_id;
        parker_user_name = mirror_user_name;
        pu_lat = clients[user_id].pu_lat;
        pu_lng = clients[user_id].pu_lng;

    }
    else{
        rider_user_id= mirror_user_id;
        rider_user_name = mirror_user_name;
        parker_user_id = user_id;
        parker_user_name = user_name;
        pu_lat = clients[mirror_user_id].pu_lat;
        pu_lng = clients[mirror_user_id].pu_lng;
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


socket.on('joinRoom',function(data){
    joinRoom();
    var mirror_user_id = clients[socket.user_id].parker_user_id 
    if(clients[socket.user_id].rider_user_id != socket.user_id ){
        mirror_user_id = clients[socket.user_id].rider_user_id
    }
    if(clients[mirror_user_id].connected == false){

        matchEndedByDisconnect(mirror_user_id);
    }
});


function joinRoom(){
    console.log(clients[socket.user_id].room_name + " match joinRoom | "+socket.user_id  )
    socket.join(clients[socket.user_id].room_name);
    io.to(clients[socket.user_id].room_name).emit('joined_room_confirm',{user_id:socket.user_id});
    var rider_user_id = clients[socket.user_id]["rider_user_id"];
    var parker_user_id = clients[socket.user_id]["parker_user_id"];
    delete clients[rider_user_id].confirmed
    delete clients[parker_user_id].confirmed
    io.to(clients[socket.user_id]["room_name"]).emit('revertConfirmation',{});
}


socket.on('updateLocation',function(data){
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
    if( clients[rider_user_id] != undefined && clients[parker_user_id] != undefined &&clients[rider_user_id].closeToPickup == true && clients[parker_user_id].closeToPickup == true && (clients[rider_user_id].confirmed == undefined && clients[parker_user_id].confirmed == undefined)){
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
        endMatch(0,function(){})

    }
});

socket.on('cancelMatch',function(){
    var rider_user_id = clients[socket.user_id].rider_user_id;
    var parker_user_id = clients[socket.user_id].parker_user_id;
    clearTimeout(clients[rider_user_id]['timer']);
    clearTimeout(clients[parker_user_id]['timer']);


    endMatch(2+"|"+socket.user_id,function(){})



});

function endMatch(type,callback){
    //type=1:disconnected
    //type=2:cancel

    var user_1 = socket.user_id;
    var user_2;
    if(clients[socket.user_id]['rider_user_id'] == socket.user_id){
        user_2 = clients[socket.user_id]['parker_user_id'] ;
    }
    else{
        user_2 = clients[socket.user_id]['rider_user_id'] ;
    }
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
                    console.log(clients[user_1].room_name + " endMatch | "+clients[user_1].selected_college + " | "+ clients[user_1].selected_parkinglot )
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
        resetUser(user_1)
    }
    if(clients[user_2].connected){
        clients[user_2].status = 'finish';
        getUserStatus(user_2);
    }
    else{
        rateUser(user_1,5);
        resetUser(user_2)
    } 

    callback();
}

socket.on('finish',function(data){
    resetUser(socket.user_id);
    var rated_user = data.user_id;
    var given_rating = data.rating;   
    rateUser(rated_user,given_rating);

});


socket.on('disconnect',function(){
    var user_id =  socket.user_id;
    if(clients[user_id] != undefined){
        clients[user_id].connected = false;
        delete clients[user_id].socket_id;
        console.log(user_id + " disconnected | "+ clients[user_id].status)
        if(clients[user_id].status == 'initial_connected'){
            delete clients[user_id]
        }
        else if(clients[user_id].status == 'waiting_match'){  
            clients[user_id]['timer'] = setTimeout(function(){
                connectionPool.getConnection(function(connection_error,connection){
                    if(connection_error){
                        console.log(connection_error)
                        connection.release()
                    }else{
                        removeRequest(connection,user_id,function(){connection.release()});
                    }
                });
                delete clients[user_id];

            }, 30000);

        }
        else if(clients[user_id].status == 'matched' ){
            userNotAtPickup();
            matchEndedByDisconnect(user_id);
        }
        else if(clients[user_id].status == 'finish' ){

            clients[user_id]['timer'] = setTimeout(function(){
                clearTimeout(cclients[user_id]['timer']);
                delete clients[user_id];
            }, 30000);
        }
    }
    else{
        console.log("INVALID disconnected "+socket.id)
    }       
});

socket.on('cancelRequest',function(){
    var user_id =  socket.user_id;
    connectionPool.getConnection(function(connection_error,connection){
        if(connection_error){
            console.log(connection_error)

        }else{
            removeRequest(connection,user_id,function(){connection.release()});
        }
    });
    resetUser(socket.user_id);
});


function matchEndedByDisconnect(user_id){
    clients[user_id]['timer'] = setTimeout(function(){
        clearTimeout(clients[clients[user_id].rider_user_id]['timer']);
        clearTimeout(clients[clients[user_id].parker_user_id]['timer']);
        endMatch(1+"|"+user_id,function(){
            delete clients[user_id];
            console.log("Match Ended by Disconnect")
        })            
    }, 60000);
    io.to(clients[user_id].room_name).emit('disconnected',{user_id:user_id});  
}

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

function resetUser(r_user_id){
    if(clients[r_user_id].connected == true){
        clients[r_user_id] = {socket_id : clients[r_user_id].socket_id, status : 'initial_connected',connected : true,user_name:clients[r_user_id].user_name,auth_code : clients[r_user_id].auth_code}
        console.log(socket.user_id + " resetUser initial")
        getUserStatus(r_user_id);
    }
    else{
        console.log(socket.user_id + " resetUser delete")
        delete clients[r_user_id]
    }

}
}

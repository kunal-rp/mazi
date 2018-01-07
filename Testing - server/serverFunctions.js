const bcrypt = require('bcrypt');//Encrypting passwords and generating hashes for email verification
var db = require('./DBPoolConnection.js')
var vars = require('./variables.js');
var connectionPool = db.getPool();


var tables ={}

vars.getTables(function(t){
  tables = t
})

module.exports = {
  tables:tables,

  updateServerinfo:function(codes,callback){
    //inserts the new server token values into the server table
    //should only happen when the server starts up
    module.exports.getTime(function(time){
      var localData = {table:tables.table_server, start_time :time,general_key:codes['general_key']}
      var update_server_query = "INSERT INTO "+ localData.table + "(`start_time`, `general_key`) VALUES ("+localData.start_time+",'"+localData.general_key+"')"
      connectionPool.query(update_server_query,function(err){
        if(err){
          module.exports.printError("updateServerinfo","Error updating the server details",err,localData)
        }
        else{
          callback()
        }
      })
    })
  },
  getCollegeParkingData:function(callback){
    var initial_data = {};
    var college_data;
    var parkinglot_data;
    var code;
    var query_getCollegeData = "Select * From "+ tables['table_college_info'];
    connectionPool.query( query_getCollegeData , function(err,results) {
      if(err){
        module.exports.printError("getCollegeParkingData","SQL Query Error: retreiving college datat",err,{})
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
        college_data = final

        var query_getParkingdata = "Select * from "+tables['table_parkinglot_info'];
        connectionPool.query(query_getParkingdata, function(err2,results2){
          if(err2){
            module.exports.printError("getCollegeParkingData","SQL Query Error: retreiving parking data",err2,{})
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
            parkinglot_data = final2;
            initial_data['code'] = 2;
            code = 2;
            callback(code, college_data,parkinglot_data)
          }
        });
      }
    });
  },
  updateUserAuth:function(user_id, token, callback){
    var update_user_auth_token = "Update `"+tables.table_gen + "` set `auth_token` = '"+token+"' where `user_id`='"+user_id+"'"
    connectionPool.query(update_user_auth_token,function(update_uat_error){
      if(update_uat_error){
        module.exports.printError("updateUserAuth","SQL Query Error: updating user auth token",update_uat_error,{user_id:user_id, token:token})
        callback("An internal Error occured")
      }
      else{
        callback(false, false, token)
      }
    });
  },

  /*change to callback(struct, simple, data)
  this function is ALSO used as checks for generating new user id's
  in those cases, a response that would normally be a 'simple error' would be ideal
  hence, we use the param 'rec' to indoicate whether or not to record those errors
  false = don't record
  true = record
  */
  getUserData:function(rec, user_id, callback){
    var getUserData = "Select * From `"+tables['table_gen'] + "`where `user_id`='"+user_id+"'"
    connectionPool.query(getUserData,function(err, result){
      if(err){
        module.exports.printError("getUserData","SQL Query Error: getting user data based on user_id",err,{user_id:user_id})
        callback("An internal Error Occured")
      }
      else{
        if(result.length === 0){
          if(rec){
            module.exports.printError("getUserData","Parameter Error: invalid user_id",null,{user_id:user_id})
          }
          callback('Invalid User Credential')
        }
        else{
          callback(false,false, result[0])
        }
      }
    })

  },
  //change to callback(struct, simple, data)
  addSuggestion:function(data,callback){
    module.exports.getTime(function(time){
      var timestamp = time;
      var query_insert_suggestion = "INSERT INTO "+tables.table_suggestion + "(`id`,`timestamp`, `user_id`, `type`, `system_data`, `message`) VALUES('"+(timestamp+"|"+data.user_id)+"',"+timestamp+",'"+data.user_id+"',"+mysql.escape(data.type)+","+mysql.escape(data.system_data)+","+mysql.escape(data.comment)+")";
      connectionPool.query(query_insert_suggestion,function(err, results){
        if(err){
          module.exports.printError("addSuggestion","SQL Query Error: inserting new suggestion",err,{timestamp:timestamp,data:data})
          callback("An internal Error Occured")
        }
        else{
          callback(false)
        }
      })
    })


  },
  login:function(username, password, callback){
    var localData = {username : username,password : password; callback:callback}
    var query = "Select * From "+ tables.table_prim  + " Where `user_name` = '"+username+"'";
    connectionPool.query(query,function(err, results){
      /*
      check if error in establishing connections
      structural error
      */
      if(err){
        module.exports.printError("Login","SQL Query Error: getting user data from user_name(PRIM)",err,localData)
        callback("An internal Error Occured")
      }
      else{
        /*
        check if query does not return nothing
        simple error
        */
        if(results.length == 0){
          module.exports.printError("Login","Parameter Error: invalid username",null,localData)
          callback(false, 'invalid username')
        }
        else{
          /*
          check if password is valid
          user ID + Password  =  stored password
          */
          bcrypt.compare(results[0]['user_id']+ ""+password, results[0]['user_password'], function(password_check_error,result) {
            /*
            check if password is valid
            simple error
            */
            if(password_check_error){
              module.exports.printError("Login","Bcrypt Error: error comparing passwords",password_check_error,localData)
              callback("An internal Error Occured")
            }
            else if(result == false){
              module.exports.printError("Login","Parameter Error: invalid Password",null,localData)
              callback(false, 'invalid password')
            }
            /*
            No errors; the username and password are both valid!
            */
            else{
              module.exports.getUserData(true, results[0]['user_id'], function(){
                callback(false, false,results[0]['user_id'])
              })
            }
          })
        }
      }
    });
  },
  updateUserStatus:function(user_id, status,callback){
    var localData = {user_id : user_id, status : status, callback : callback}
    var query = "Update `"+tables.table_gen +"` Set `status`='"+ status +"' Where `user_id` = '"+user_id+"'";
    connectionPool.query(query,function(err, results){
      if(err){
        module.exports.printError("updateUserStatus","SQL Query Error: error updating status from user_id",err,localData)
        callback("An internal Error Occured")
      }
      else{
        callback(false, false)
      }
    });
  },

  checkUsernameIsRestricted(user_name, callback){
    var localData = {user_name : user_name, callback : callback}
    var query = "Select * From "+ tables.table_restricted_usernames + " Where `user_name` = '"+user_name+"'";
    connectionPool.query(query,function(err, results){
      if(err){
        module.exports.printError("checkUsernameIsRestricted","SQL Query Error: error selecting restricted usernames from user_name",err,localData)
        callback("An internal Error Occured")
      }
      else{
        if(results.length != 0){
          module.exports.printError("checkUsernameIsRestricted","General Error: restricted username requested",null,localData)
          callback(false, true)
        }
        else{
          callback(false, false)
        }
      }
    })
  },
  checkUsername:function(user_name,callback){
    var localData = {user_name : user_name, callback : callback}
    module.exports.checkUsernameIsRestricted(user_name,function(st,restricted){
      if(st){
        callback("An internal Error Occured")
      }
      else if(restricted){
        callback(false, "Username is taken")
      }
      else{
        var query = "Select * From "+ tables.table_prim + " Where `user_name` = '"+user_name+"'";
        connectionPool.query(query,function(err, results){
          if(err){
            module.exports.printError("checkusername","SQL Query Error: error selecting username from user_name(PRIM)",err,localData)
            callback("An internal Error Occured")
          }
          else{
            if(results.length != 0){
              callback(false, "Username is taken")
            }
            else{
              callback(false, false)
            }
          }
        })
      }
    })
  },
  /*
  this function is ALSO used as checks for an email when generating new user id's
  in those cases, a response that would normally be a 'simple error' would be ideal
  hence, we use the param 'rec' to indoicate whether or not to record those errors
  false = don't record
  true = record
  */
  getUserIDWithEmail:function(rec,email, callback){
    var localData = {rec : res, email : email , callback : callback}
    var query = "Select * From "+ tables.table_prim + " Where `user_email`='"+email+"'"
    connectionPool.query(query, function(err, results){
      if(err){
        module.exports.printError("getUserIDWithEmail","SQL Query Error: error selecting user_id from user_email(PRIM)",err,localData)
        callback("An internal Error Occured")
      }
      else{
        if(results.length === 0 ){
          if(rec){
            module.exports.printError("getUserIDWithEmail","Parameter Error: no email associated with email",null,localData)
          }
          callback(false, "No account assiociated with that email")
        }
        else{
          callback(false, false, results[0].user_id)
        }
      }
    })
  },
  getUsernameWithUserID:function(user_id, callback){
    var ld = {user_id: user_id , callback : callback}
    var query = "Select * From "+ tables.table_prim + " Where `user_id`='"+user_id+"'"
    connectionPool.query(query, function(err, results){
      if(err){
        module.exports.printError("getUsernameWithUserID","SQL Query Error: error selecting user_name from user_id(PRIM)",err,ld)
        callback("An internal Error Occured")
      }
      else{
        if(results.length === 0){
          module.exports.printError("getUsernameWithUserID","Parameter Error: no account associated with that user_id",null,ld)
          callback(false, "No account assiciated with that user id")
        }
        else{
          callback(false, false, results[0].user_name)
        }
      }
    })
  },
  updatePassword:function(user_id, password, callback){
    var ld = {user_id : user_id, password : password , callback : callback}
    var query = "UPDATE `"+tables.table_prim + "` SET `user_password`= '"+password+"' WHERE `user_id`='"+user_id+"'";
    connectionPool.query(query, function(err, results){
      if(err){
        module.exports.printError("updatePassword","SQL Query Error: error updating password from user_id",err,ld)
        callback("An internal Error Occured")
      }
      else{
        callback(false, false)
      }
    })
  },
  updateUsername:function(user_id, username, callback){
    var query = "UPDATE `"+tables.table_prim + "` SET `user_name`= '"+username+"' WHERE `user_id`='"+user_id+"'";
    connectionPool.query(query, function(err, results){
      if(err){
        module.exports.printError("updateUsername","SQL Query Error: error updating user_name from user_id",err,ld)
        callback("An internal Error Occured")
      }
      else{
        callback(false, false)
      }
    })
  },
  createUser:function(data, callback){
    module.exports.createUserPrim(data, function(st1, si1){
      if(st1 || si1){
        callback(st1, si1)
      }
      else{
        module.exports.createUserGen(data, function(st2, si2){
          if(st2 || si2){
            callback(st2, si2)
          }
          else{
            callback(false, false)
          }
        })
      }
    })
  },
  createUserPrim:function(data,callback){
    var ld = {data : data, callback : callback}
    module.exports.getTime(function(time){
      var query = "INSERT INTO "+tables.table_prim + "(`user_id`, `user_name`, `user_email`, `user_password`, `verified`,`verify_key`,`create_timestamp`) VALUES('"+data.user_id+"','"+data.user_name+"','"+data.user_email+"','"+data.user_password+"',0,'"+data.user_verification_key+"',"+time+")";
      connectionPool.query(query, function(err, results){
        if(err){
          module.exports.printError("createUserPrim","SQL Query Error: error creating new user (PRIM)",err,ld)
          callback("An internal Error Occured")
        }
        else{
          callback(false, false)
        }
      })
    })
  },
  createUserGen:function(data,callback){
    var ld = {data : data, callback : callback}
    var query = "INSERT INTO "+tables.table_gen + "(`user_id`,`rating`,`total_matches`) VALUES('"+data.user_id+"',5,0)";
    connectionPool.query(query, function(err, results){
      if(err){
        module.exports.printError("createUserGen","SQL Query Error: error creating new user (GEN)",err,ld)
        callback("An internal Error Occured")
      }
      else{
        callback(false, false)
      }
    })
  },
  verify:function(data, callback){
    module.exports.checkVerify(data, function(st1, si1){
      if(st1 || si1){
        callback(st1, si1)
      }
      else{
        module.exports.verifyUser(data, function(st2, si2){
          if(st2 || si2){
            callback(st2, si2)
          }
          else{
            callback(false, false)
          }
        })
      }
    })
  },
  checkVerify:function(data,callback){
    var ld = {data : data, callback : callback}
    var query = "Select * From "+ tables.table_prim + " Where `user_name`='"+data.user_name+"'"
    connectionPool.query(query, function(err, results){
      if(err){
        module.exports.printError("checkverify","SQL Query Error: error selecting from user_name(PRIM)",err,ld)
        callback("An internal Error Occured")
      }
      else{
        if(results.length != 1){
          module.exports.printError("checkverify","Parameter Error: invalid username",null,ld)
          callback(false, 'Invalid username')
        }
        else{
          if(data.code != results[0].verify_key){
            module.exports.printError("checkverify","Parameter Error: invalid code",null,ld)
            callback(false, 'Invalid Verification Code')
          }
          else{
            callback(false, false)
          }
        }
      }
    })
  },
  verifyUser:function(data, callback){
    var ld = {data : data, callback : callback}
    var query = "UPDATE `"+tables.table_prim + "` SET `verified`= "+1+" WHERE `user_name`='"+data.user_name+"'";
    connectionPool.query(query, function(err, results){
      if(err){
        module.exports.printError("verifyUser","SQL Query Error: error updating veified from user_name",err,ld)
        callback("An internal Error Occured")
      }
      else{
        callback(false, false)
      }
    })
  },
  recordAction:function(user_id, a, data){
    var ld = {data : data, user_id : user_id,action : a }
    module.exports.getTime(function(time){
      var query = "Insert into `"+tables.table_actions + "`(`time`,  `user_id`, `action`,`data`) VALUES ("+time+",'"+user_id+"','"+a+"','"+data+"')";
      connectionPool.query(query, function(err, results){
        if(err ){
          module.exports.printError("recordAction","SQL Query Error: error recording action",err,ld)
        }
      })
    })

  },
  getTime:function(callback){
    callback(Math.round((new Date()).getTime() / 1000))
  },
  printError:function(function_name,description, err,data){
    console.log()
    module.exports.getTime(function(time){
      console.log(time)
      console.log(function_name)
      console.log(description)
      console.log(err)
      //console.log(data)
      module.exports.recordError(time, function_name,description,err, data)
    })
  },
  recordError:function(t,fn, d, e, data,c = true){
    var ld = {t : t,fn : fn, d : d, e : e, data : data,c :c}
    var query = "Insert into `"+tables.table_error + "` (`time`, `function`, `description`, `error`, `data`) VALUES ("+t+",'"+fn+"','"+d+"','"+e+"','')";
    connectionPool.query(query, function(err, results){
      if(err && c){
        module.exports.recordError("recordError","SQL Query Error: error recording error",err,ld,false)
      }
    })
  },
  /*
  ----------------
  Action Server Functions
  --------------
  */
  updateUserMatchData:function(user_id, type,match_id, callback){
    var ld = {user_id : user_id, type : type , match_id : match_id, callback : callback}
    var query = "Update `"+tables.table_gen +"` Set `match_id`='"+ match_id +"', `type`='"+type+"' Where `user_id` = '"+user_id+"'";
    connectionPool.query(query, function(err, results){
      if(err ){
        module.exports.printError("updateUserMatchData","SQL Query Error: error updating user match id",err,ld)
        callback("An internal Error Occured")
      }
      else{
        callback(false, false)
      }
    })
  },
  getUserRequest:function(user_id, callback){
    var ld = {user_id : user_id,  callback : callback}
    var query = "Select * FROM  `"+tables.table_requests + "` WHERE `user_id` = '"+user_id+"'";
    connectionPool.query(query, function(err, results){
      if(err ){
        module.exports.printError("getUserRequest","SQL Query Error: error getting requests from user_id",err,ld)
        callback("An internal Error Occured")
      }
      else{
        if(results.length != 1){
          module.exports.printError("getUserRequest","Parameter Error: no requests from user registered","No request registered from user",ld)
          callback(false, "No request registered from user")
        }
        else{
          callback(false, false, results[0])
        }
      }
    })
  },
  recordRequest:function(data, callback){
    var ld = {data : data, callback : callback}
    module.exports.getTime(function(time){
      var query = "INSERT INTO `"+tables.table_requests + "` (`user_id`, `type`, `college_id`, `parkinglot_id`, `time`, `pu_lat`, `pu_lng`) VALUES ('"+data.user_id+"','"+data.type+"',"+data.college_id+","+data.parkinglot_id+","+time+","+data.pu_lat+","+data.pu_lng+")";
      connectionPool.query(query, function(err, results){
        if(err){
          module.exports.printError("recordRequest","SQL Query Error: error recording request",err,ld)
          callback("An internal Error Occured")
        }
        else{
          callback(false, false)
        }
      })
    })
  },
  removeRequest:function(user_id, callback){
    var ld = {user_id : user_id, callback : callback}
    var query = "Delete from "+tables.table_requests+ " Where `user_id` = '"+user_id+"'";
    connectionPool.query(query, function(err, results){
      if(err){
        module.exports.printError("removeRequest","SQL Query Error: error removing request",err,ld)
        callback("An internal Error Occured")
      }
      else{
        callback(false, false)
      }
    })
  },
  getMatchData:function(match_id, callback){
    var ld = {match_id : match_id, callback : callback}
    var query = "Select * FROM  `"+tables.table_matches + "` WHERE `match_id` = '"+match_id+"'";
    connectionPool.query(query, function(err, results){
      if(err ){
        module.exports.printError("getMatchData","SQL Query Error: error getting requests from match-id",err,ld)
        callback("An internal Error Occured")
      }
      else{
        if(results.length  != 1){
          module.exports.printError("getMatchData","Parameter Error: no ongoing matches from user ","No ongoing matches for user",ld)
          callback(false, "No ongoing matched for user")
        }
        else{
          callback(false, false, results[0])
        }
      }
    })
  },
  recordMatch:function(data, callback){
    var ld = {data : data, callback : callback}
    module.exports.getTime(function(time){
      var query = "INSERT INTO `"+tables.table_matches + "` (`match_id`, `start_timestamp`, `rider_id`, `parker_id`, `college_id`, `parkinglot_id`, `rider_lat`, `rider_lng`, `parker_lat`, `parker_lng`, `pu_lat`, `pu_lng`) VALUES ('"+data.match_id+"',"+time+",'"+data.rider_id+"','"+data.parker_id+"',"+data.college_id+","+data.parkinglot_id+",0,0,0,0,"+data.pu_lat+","+data.pu_lng+")";
      connectionPool.query(query, function(err, results){
        if(err){
          module.exports.printError("recordMatch","SQL Query Error: error recording match",err,ld)
          callback("An internal Error Occured")
        }
        else{
          callback(false, false)
        }
      })
    })
  },

  removeMatch:function(match_id, callback){
    var ld = {match_id : match_id, callback : callback}
    var query = "Delete from "+tables.table_matches+ " Where `match_id` = '"+match_id+"'";
    connectionPool.query(query, function(err, results){
      if(err){
        module.exports.printError("removeMatch","SQL Query Error: error removing match",err,ld)
        callback("An internal Error Occured")
      }
      else{
        callback(false, false)
      }
    })
  },
  recordPastMatch:function(data, callback){
    var ld = {data : data, callback : callback}
      var query = "INSERT INTO `"+tables.table_past_matches + "`(`match_id`, `time`,`rider_id`, `parker_id`, `college_id`, `parkinglot_id`,`pu_lat`, `pu_lng`, `cancel`, `rider_rate`, `parker_rate`) VALUES ('"+data.match_id+"',"+data.time+",'"+data.rider_id+"','"+data.parker_id+"',"+data.college_id+","+data.parkinglot_id+","+data.pu_lat+","+data.pu_lng+",'"+data.cancel+"',0,0)";
      connectionPool.query(query, function(err, results){
        if(err){
          module.exports.printError("recordPastMatch","SQL Query Error: error recording past match",err,ld)
          callback("An internal Error Occured")
        }
        else{
          callback(false, false)
        }
      })
  },
  getPastMatchData:function(match_id, callback){
    var ld = {match_id : match_id, callback : callback}
    var query = "Select * FROM  `"+tables.table_past_matches + "` WHERE  `match_id` = '"+match_id+"'";
    connectionPool.query(query, function(err, results){
      if(err){
        module.exports.printError("getMatchData","SQL Query Error: error getting requests from user_id",err,ld)
        callback("An internal Error Occured")
      }
      else{
        if(results.length != 1){
          module.exports.printError("getMatchData","Parameter Error: no past matches for match_id ","No Past matched for user",ld)
          callback(false, "No past matches for user")
        }
        else{
          callback(false, false, results[0])
        }
      }
    })
  },
  findMatch:function(data, callback){
    var ld = {data : data, callback : callback}
    var query = "Select * from "+tables.table_requests+ " Where `college_id` = "+data.college_id +"&& `parkinglot_id` = "+data.parkinglot_id+" && `type` != '" + data.type+"'";
    connectionPool.query(query, function(err, results){
      if(err){
        module.exports.printError("findMatch","SQL Query Error: error findiong matches",err,ld)
        callback("An internal Error Occured")
      }
      else{
        callback(false, false, results)
      }
    })
  },
  //addPastMatches
  updateUserLocation:function(data,callback){
    var ld = {data : data, callback : callback}
    var query = "Update `"+tables.table_gen + "` set `lat` = "+data.lat+",`lng` = "+data.lng+" where `user_id`='"+data.user_id+"'"
    connectionPool.query(query, function(err, results){
      if(err){
        module.exports.printError("updateUserLocationGen","SQL Query Error: error updating user lat and lng",err,ld)
        callback("An internal Error Occured")
      }
      else{
        callback(false, false)
      }
    })
  },
  updateUserLocationMatch:function(match_id, type,lat,lng,callback){
    var ld = {match_id : match_id, type : type, lat:lat,lng:lng, callback : callback}
    var query = "Update `"+tables.table_matches + "` set `"+type+"_lat` = "+lat+",`"+type+"_lng` = "+lng+" where `match_id`='"+match_id+"'"
    connectionPool.query(query, function(err, results){
      if(err){
        module.exports.printError("updateUserLocationMatch","SQL Query Error: error updating user lat and lng MATCH",err,ld)
        callback("An internal Error Occured")
      }
      else{
        callback(false, false)
      }
    })
  },
  updateMatchUserStatus:function(match_id, type,status,confirm = false){
    var ld = {match_id : match_id, type : type, status : status, confirm:confirm}
    var query = "Update `"+tables.table_matches + "` set `"+type+"_status` = '"+status+"' where `match_id`='"+match_id+"'"
    connectionPool.query(query, function(err, results){
      if(err){
        module.exports.printError("updateMatchUserStatus","SQL Query Error: error updating user status",err,ld)
      }
    })
  },
  updateMatchUserConfirm:function(match_id, type, confirm,callback){
    var ld = {match_id : match_id, type : type, status : status, confirm:confirm,callback : callback}
    var query = "Update `"+tables.table_matches + "` set `"+type+"_confirm` = "+confirm+"  where `match_id`='"+match_id+"'"
    connectionPool.query(query, function(err, results){
      if(err){
        module.exports.printError("updateMatchUserConfirm","SQL Query Error: error updating user confirm",err,ld)
      }
      else{
        callback()
      }
    })
  },
  rateUserGen:function(user_id, ov, tm){
    var ld = {user_id : user_id, ov : ov, tm : tm}
    var query = "Update `"+tables.table_gen + "` set `rating` = "+ov+",`total_matches` = "+tm+" where `user_id`='"+user_id+"'"
    connectionPool.query(query, function(err, results){
      if(err){
        module.exports.printError("rateUserGen","SQL Query Error: error updating user rating and total matches",err,ld)
      }
    })
  },
  rateUserPastMatch:function(match_id, type, rating){
    var ld = {match_id : match_id, type : type, rating : rating}
    var query = "Update `"+tables.table_past_matches + "` set `"+type+"_rate` = "+rating+" where `match_id`='"+match_id+"'"
    connectionPool.query(query, function(err, results){
      if(err){
        module.exports.printError("rateUserPastMatch","SQL Query Error: error updating user rating in past matches",err,ld)
      }

    })
  },


}

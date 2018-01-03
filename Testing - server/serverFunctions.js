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
          console.log("Server Details SET")
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
    var update_user_auth_token = "Update `"+tables['table_gen'] + "` set `auth_token` = '"+token+"' where `user_id`='"+user_id+"'"
    connectionPool.query(update_user_auth_token,function(update_uat_error){
      if(update_uat_error){
        module.exports.printError("updateUserAuth","SQL Query Error: updating user auth token",update_uat_error,{user_id:user_id, token:token})
        callback(update_uat_error)
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
        callback(err)
      }
      else{
        if(result.length === 0){
          if(rec){
            module.exports.printError("getUserData","Parameter Error: invalid user_id",null,{user_id:user_id})

          }
          callback(false,'Invalid User ID')
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
      var query_insert_suggestion = "INSERT INTO "+table_suggestion + "(`id`,`timestamp`, `user_id`, `type`, `system_data`, `message`) VALUES('"+(timestamp+"|"+data.user_id)+"',"+timestamp+",'"+data.user_id+"',"+mysql.escape(data.type)+","+mysql.escape(data.system_data)+","+mysql.escape(data.comment)+")";
      connectionPool.query(query_insert_suggestion,function(err, results){
        if(err){
          module.exports.printError("addSuggestion","SQL Query Error: inserting new suggestion",err,{timestamp:timestamp,data:data})
          callback(err)
        }
        else{
          callback(false)
        }
      })
    })


  },
  login:function(username, password, callback){
    var query = "Select * From "+ tables.table_prim  + " Where `user_name` = '"+username+"'";
    connectionPool.query(query,function(err, results){
      /*
      check if error in establishing connections
      structural error
      */
      if(err){
        module.exports.printError("Login","SQL Query Error: getting user data from user_name(PRIM)",err,{username:username})
        callback(error)
      }
      else{
        /*
        check if query does not return nothing
        simple error
        */
        if(results.length == 0){
          module.exports.printError("Login","Parameter Error: invalid username",null,{username:username})
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
              module.exports.printError("Login","Bcrypt Error: error comparing passwords",password_check_error,{username:username,password:password})
              callback(true)
            }
            else if(result == false){
              module.exports.printError("Login","Parameter Error: invalid Password",null,{username:username,password:password})
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
    var query = "Update `"+tables.table_gen +"` Set `status`='"+ status +"' Where `user_id` = '"+user_id+"'";
    connectionPool.query(query,function(err, results){
      if(err){
        module.exports.printError("updateUserStatus","SQL Query Error: error updating status from user_id",err,{user_id:user_id,status:status})
        callback(err)
      }
      else{
        callback(false, false)
      }
    });
  },

  checkUsernameIsRestricted(user_name, callback){
    var query = "Select * From "+ tables.table_restricted_usernames + " Where `user_name` = '"+user_name+"'";
    connectionPool.query(query,function(err, results){
      if(err){
        module.exports.printError("checkUsernameIsRestricted","SQL Query Error: error selecting restricted usernames from user_name",err,{user_name:user_name})
        callback("An Error Occured")
      }
      else{
        console.log(results)
        if(results.length != 0){
          module.exports.printError("checkUsernameIsRestricted","General Error: restricted username requested",null,{user_name:user_name})
          callback(false, true)
        }
        else{
          callback(false, false)
        }
      }
    })
  },
  checkUsername:function(user_name,callback){

    module.exports.checkUsernameIsRestricted(user_name,function(st,restricted){
      if(st){
        callback(st)
      }
      else if(restricted){
        callback(false, "Username is taken")
      }
      else{
        var query = "Select * From "+ tables.table_prim + " Where `user_name` = '"+user_name+"'";
        connectionPool.query(query,function(err, results){
          if(err){
            module.exports.printError("checkusername","SQL Query Error: error selecting username from user_name(PRIM)",err,{user_name:user_name})
            callback("An Error Occured")
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
    var query = "Select * From "+ tables.table_prim + " Where `user_email`='"+email+"'"
    connectionPool.query(query, function(err, results){
      if(err){
        module.exports.printError("getUserIDWithEmail","SQL Query Error: error selecting user_id from user_email(PRIM)",err,{email:email})
        callback("An Error Occured")
      }
      else{
        if(results.length === 0 ){
          if(rec){
            module.exports.printError("getUserIDWithEmail","Parameter Error: no email associated with email",null,{email:email})
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
    var query = "Select * From "+ tables.table_prim + " Where `user_id`='"+user_id+"'"
    connectionPool.query(query, function(err, results){
      if(err){
        module.exports.printError("getUsernameWithUserID","SQL Query Error: error selecting user_name from user_id(PRIM)",err,{user_id:user_id})
        callback("An Error Occured")
      }
      else{
        if(results.length === 0){
          module.exports.printError("getUsernameWithUserID","Parameter Error: no account associated with that user_id",null,{user_id:user_id})
          callback(false, "No account assiciated with that user id")
        }
        else{
          callback(false, false, results[0].user_name)
        }
      }
    })
  },
  updatePassword:function(user_id, password, callback){
    var query = "UPDATE `"+tables.table_prim + "` SET `user_password`= '"+password+"' WHERE `user_id`='"+user_id+"'";
    connectionPool.query(query, function(err, results){
      if(err){
        module.exports.printError("updatePassword","SQL Query Error: error updating password from user_id",err,{user_id:user_id,password:password})
        callback("An Error Occured")
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
        module.exports.printError("updateUsername","SQL Query Error: error updating user_name from user_id",err,{user_id:user_id,password:password})
        callback("An Error Occured")
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
    module.exports.getTime(function(time){
      var query = "INSERT INTO "+tables.table_prim + "(`user_id`, `user_name`, `user_email`, `user_password`, `verified`,`verify_key`,`create_timestamp`) VALUES('"+data.user_id+"','"+data.user_name+"','"+data.user_email+"','"+data.user_password+"',0,'"+data.user_verification_key+"',"+time+")";
      connectionPool.query(query, function(err, results){
        if(err){
          module.exports.printError("createUserPrim","SQL Query Error: error creating new user (PRIM)",err,{data:data})
          callback("An Error Occured")
        }
        else{
          callback(false, false)
        }
      })
    })
  },
  createUserGen:function(data,callback){
    var query = "INSERT INTO "+tables.table_gen + "(`user_id`,`rating`,`total_matches`) VALUES('"+data.user_id+"',5,0)";
    connectionPool.query(query, function(err, results){
      if(err){
        module.exports.printError("createUserGen","SQL Query Error: error creating new user (GEN)",err,{data:data})
        callback("An Error Occured")
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
    var query = "Select * From "+ tables.table_prim + " Where `user_name`='"+data.user_name+"'"
    connectionPool.query(query, function(err, results){
      if(err){
        module.exports.printError("checkverify","SQL Query Error: error selecting from user_name(PRIM)",err,{data:data})
        callback("An Error Occured")
      }
      else{
        if(results.length != 1){
          module.exports.printError("checkverify","Parameter Error: invalid username",null,{data:data})
          callback(false, 'invalid username')
        }
        else{
          if(data.code != results[0].verify_key){
            module.exports.printError("checkverify","Parameter Error: invalid code",null,{data:data,actual:results[0].verify_key})
            callback(false, 'invalid verification code')
          }
          else{
            callback(false, false)
          }
        }
      }
    })
  },
  verifyUser:function(data, callback){
    var query = "UPDATE `"+tables.table_prim + "` SET `verified`= "+1+" WHERE `user_name`='"+data.user_name+"'";
    connectionPool.query(query, function(err, results){
      if(err){
        module.exports.printError("verifyUser","SQL Query Error: error updating veified from user_name",err,{user_name:datauser_id})
        callback("An Error Occured")
      }
      else{
        callback(false, false)
      }
    })
  },
  recordAction:function(user_id, a, data){
    module.exports.getTime(function(time){
      var query = "Insert into `"+tables.table_actions + "`(`time`, `action`, `user_id`, `data`) VALUES ("+time+",'"+user_id+"','"+a+"','"+data+"')";
      connectionPool.query(query, function(err, results){
        if(err ){
          module.exports.printError("recordAction","SQL Query Error: error recording action",err,data)
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
    var query = "Insert into `"+tables.table_error + "` (`time`, `function`, `description`, `error`, `data`) VALUES ("+t+",'"+fn+"','"+d+"','"+e+"','')";
    connectionPool.query(query, function(err, results){
      if(err && c){
        module.exports.recordError("recordError","SQL Query Error: error recording error",err,null,false)
      }
    })
  },
  /*
  ----------------
  Action Server Functions
  --------------
  */
  updateUserMatchData:function(user_id, match_id, callback){
    var query = "Update `"+tables.table_gen +"` Set `match_id`='"+ match_id +"' Where `user_id` = '"+user_id+"'";
    connectionPool.query(query, function(err, results){
      if(err ){
        module.exports.printError("updateUserMatchData","SQL Query Error: error updating user match id",err,null,true)
        callback(err)
      }
      else{
        callback(false, false)
      }
    })
  },
  getUserRequest:function(user_id, callback){
    var query = "Select * FROM  `"+tables.table_requests + "` WHERE `user_id` = '"+user_id+"'";
    connectionPool.query(query, function(err, results){
      if(err ){
        module.exports.printError("getUserRequest","SQL Query Error: error getting requests from user_id",err,{user_id},true)
        callback(err)
      }
      else{
        if(results.length != 1){
          module.exports.printError("getUserRequest","Parameter Error: no requests from user registered",false,{user_id},true)
          callback(false, "No request registered from user")
        }
        else{
          callback(false, false, results[0])
        }
      }
    })
  },
  recordRequest:function(data, callback){
    module.exports.getTime(function(time){
      var query = "INSERT INTO `"+tables.table_requests + "` (`user_id`, `type`, `college_id`, `parkinglot_id`, `time`, `pu_lat`, `pu_lng`) VALUES ('"+data.user_id+"','"+data.type+"',"+data.college_id+","+data.parkinglot_id+","+time+","+data.pu_lat+","+data.pu_lng+")";
      connectionPool.query(query, function(err, results){
        if(err){
          module.exports.printError("recordRequest","SQL Query Error: error recording request",err,data,true)
          callback(err)
        }
        else{
          callback(false, false)
        }
      })
    })
  },
  removeRequest:function(user_id, callback){
    var query = "Delete from "+tables.table_requests+ " Where `user_id` = '"+user_id+"'";
    connectionPool.query(query, function(err, results){
      if(err){
        module.exports.printError("removeRequest","SQL Query Error: error removing request",err,user_id,true)
        callback(err)
      }
      else{
        callback(false, false)
      }
    })
  },
  getMatchData:function(user_id, callback){
    var query = "Select * FROM  `"+tables.table_matches + "` WHERE `parker_id` = '"+user_id+"' || `rider_id` = '"+user_id+"'";
    connectionPool.query(query, function(err, results){
      if(err ){
        module.exports.printError("getMatchData","SQL Query Error: error getting requests from user_id",err,user_id,true)
        callback(err)
      }
      else{
        if(results.length  != 1){
          module.exports.printError("getMatchData","Parameter Error: no ongoing matches from user ",false,{user_id},true)
          callback(false, "No ongoing matched for user")
        }
        else{
          callback(false, false, results[0])
        }
      }
    })
  },
  recordMatch:function(data, callback){
    module.exports.getTime(function(time){
      var query = "INSERT INTO `"+tables.table_matches + "` (`match_id`, `start_timestamp`, `rider_id`, `parker_id`, `college_id`, `parkinglot_id`, `rider_lat`, `rider_lng`, `parker_lat`, `parker_lng`, `pu_lat`, `pu_lng`, `rider_near`, `parker_near`, `rider_confirm`, `parker_confirm`) VALUES ('"+data.match_id+"',"+time+",'"+data.rider_id+"','"+data.parker_id+"',"+data.college_id+","+data.parkinglot_id+",0,0,0,0,"+data.pu_lat+","+data.pu_lng+",0,0,0,0)";
      connectionPool.query(query, function(err, results){
        if(err){
          module.exports.printError("recordMatch","SQL Query Error: error recording match",err,data,true)
          callback(err)
        }
        else{
          callback(false, false)
        }
      })
    })
  },

  removeMatch:function(match_id, callback){
    var query = "Delete from "+tables.table_matches+ " Where `match_id` = '"+match_id+"'";
    connectionPool.query(query, function(err, results){
      if(err){
        module.exports.printError("removeMatch","SQL Query Error: error removing match",err,null,true)
        callback(err)
      }
      else{
        callback(false, false)
      }
    })
  },
  getPastMatchData:function(user_id, callback){
    var query = "Select * FROM  `"+tables.table_past_matches + "` WHERE `parker_id` = '"+user_id+"' || `rider_id` = '"+user_id+"' ORDER BY `time` LIMIT 1";
    connectionPool.query(query, function(err, results){
      if(err ){
        module.exports.printError("getMatchData","SQL Query Error: error getting requests from user_id",err,user_id,true)
        callback(err)
      }
      else{
        if(results.length != 1){
          module.exports.printError("getMatchData","Parameter Error: no past matches from user ",false,user_id,true)
          callback(false, "No past matched for user")
        }
        else{
          callback(false, false, results[0])
        }
      }
    })
  },
  findMatch:function(data, callback){
    var query = "Select * from "+tables.table_requests+ " Where `college_id` = "+data.college_id +"&& `parkinglot_id` = "+data.parkinglot_id+" && `type` != '" + data.type+"'";
    connectionPool.query(query, function(err, results){
      if(err){
        module.exports.printError("findMatch","SQL Query Error: error findiong matches",err,data,true)
        callback(err)
      }
      else{
        callback(false, false, results)
      }

    })
  }

}

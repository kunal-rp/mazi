const bcrypt = require('bcrypt');//Encrypting passwords and generating hashes for email verification
var db = require('./DBPoolConnection.js')
var connectionPool = db.getPool();


var clients = {}
var tables ={
  table_server:"server",
  table_gen:"user_gen",
  table_prim:"user_prim",
  table_college_info:"college_info",
  table_parkinglot_info:"parkinglot_info",
  table_connect:"_connect"
}

module.exports = {
  tables:tables,
  setVariables:function(t, callback){
    tables = t
    callback()
  },
  updateServerinfo:function(codes,callback){
    //inserts the new server token values into the server table
    //should only happen when the server starts up
    var localData = {table:tables.table_server, start_time :Math.round((new Date()).getTime() / 1000),general_key:codes['general_key']}
    var update_server_query = "INSERT INTO "+ localData.table + "(`start_time`, `general_key`) VALUES ("+localData.start_time+",'"+localData.general_key+"')"
    connectionPool.query(update_server_query,function(err){
      if(err){
        module.exports.printError("updateServerinfo","Error updating the server details",err,localData)
      }
      else{
        console.log("Server Details SET")
        callback()
      }
    });
  },
  getCollegeParkingData:function(callback){
    var initial_data = {};
    var college_data;
    var parkinglot_data;
    var code;
    var query_getCollegeData = "Select * From "+ tables['table_college_info'];
    connectionPool.query( query_getCollegeData , function(err,results) {
      if(err){
        console.log("ERROR | checkVersion |  sql query |"+err+"|"+query)

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
        console.log("Error updating the user auth token")
        console.log("User ID:"+user_id)
        console.log("Auth Token:"+token);
        console.log("Error : "+update_uat_error)
        callback(true)
      }
      else{
        clients[user_id].auth_code = token
        callback(false, token)
      }
    });
  },

  //change to callback(struct, simple, data)
  getUserData:function(user_id, callback){
    if(clients[user_id] == undefined){
      var getUserData = "Select * From `"+tables['table_gen'] + "`where `user_id`='"+user_id+"'"
      connectionPool.query(getUserData,function(err, result){
        if(err){
          callback(err)
        }
        else{
          if(result.length == 0){
            callback(false,'Invalid User ID')
          }
          else{
            clients[user_id] = {auth_code: result[0]['auth_token'],status:result[0]['status']}
            console.log("Got User: "+user_id)
            callback(false,false, clients[user_id])
          }
        }
      })
    }else{
      callback(false,false, clients[user_id])
    }
  },
  //change to callback(struct, simple, data)
  addSuggestion:function(data,callback){
    if(clients[data.user_id].status != 'idle'){
      callback("not active user")
    }
    else{
      var timestamp = Math.round((new Date()).getTime() / 1000);
      var query_insert_suggestion = "INSERT INTO "+table_suggestion + "(`id`,`timestamp`, `user_id`, `type`, `system_data`, `message`) VALUES('"+(timestamp+"|"+data.user_id)+"',"+timestamp+",'"+data.user_id+"',"+mysql.escape(data.type)+","+mysql.escape(data.system_data)+","+mysql.escape(data.comment)+")";
      connectionPool.query(query_insert_suggestion,function(err, results){
        if(err){
          callback(err)
        }
        else{
          callback(false)
        }
      });
    }
  },
  attemptLogin:function(username, password, callback){
    var query = "Select * From "+ tables.table_prim  + " Where `user_name` = '"+username+"'";
    connectionPool.query(query,function(err, results){
      /*
      check if error in establishing connections
      structural error
      */
      if(err){
        callback(error)
      }
      else{
        /*
        check if query does not return nothing
        simple error
        */
        if(results.length == 0){
          callback(false, 'invalid username')
        }
        /*
        check if query does not return more than one user
        structural error
        */
        else if(results.length > 1){
          callback('Sorry! an Error Occured')
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
              callback(true)
            }
            else if(result == false){
              callback(false, 'invalid password')
            }
            /*
            No errors; the username and password are both valid!
            */
            else{
              module.exports.getUserData(results[0]['user_id'], function(){
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
          callback(err)
        }
        else{
          clients[user_id].status = status
          callback(false)
        }
      });
    },
    checkUsername:function(user_name,callback){
      var query = "Select * From "+ tables.table_prim + " Where `user_name` = '"+user_name+"'";
      connectionPool.query(query,function(err, results){
        if(err){
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
    },
    getUserIDWithEmail:function(email, callback){
      var query = "Select * From "+ tables.table_prim + " Where `user_email`='"+email+"'"
      connectionPool.query(query, function(err, results){
        if(err){
          callback("An Error Occured")
        }
        else{
          console.log("getUserIDWithEmail result")
          console.log(results.length)
          if(results.length === 0){
            console.log("No account assiociated with that email")
            callback(false, "No account assiociated with that email")
          }
          else{
            console.log("getUserIDWithEmail done  ")
            callback(false, false, results[0].user_id)
          }
        }
      })
    },
    getUsernameWithUserID:function(user_id, callback){
      var query = "Select * From "+ tables.table_prim + " Where `user_id`='"+user_id+"'"
      connectionPool.query(query, function(err, results){
        if(err){
          callback("An Error Occured")
        }
        else{
          if(results.length === 0){
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
          callback("An Error Occured")
        }
        else{
          callback(false, false)
        }
      })
    },
    printError:function(func,disc, err,data){
      console.log()
      console.log(disc)
      console.log(func)
      console.log(err)
      console.log(data)
    }
  };

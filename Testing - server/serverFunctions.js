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
    var update_server_query = "INSERT INTO "+ tables.table_server + "(`start_time`, `android_key`, `ios_key`, `web_key`) VALUES ("+Math.round((new Date()).getTime() / 1000)+",'"+codes['android_key']+"','"+codes['ios_key']+"','"+codes['web_key']+"')"
    connectionPool.query(update_server_query,function(update_server_error){

      if(update_server_error){
        console.log("Error updating the server details")
        console.log(update_server_error)
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
        clients[user_id] = {}
        clients[user_id].auth_code = token
        callback(false, token)
      }
    });
  },
  getUserData:function(user_id, callback){
    if(clients[user_id] == undefined){
      var getUserData = "Select * From `"+tables['table_gen'] + "`where `user_id`='"+user_id+"'"
      connectionPool.query(getUserData,function(err, result){
        if(err){
          callback(err)
        }
        else{
          if(result.length == 0){
            callback('Invalid User ID')
          }
          else{
            clients[user_id] = {auth_code: result[0]['auth_token']}
            callback(false, clients[user_id])
          }
        }
      })
    }else{
      callback(false, clients[user_id])
    }
  },
  addSuggestion:function(data,callback){
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
              console.log("Server Functions")
              console.log(results[0])
              callback(false, false,results[0]['user_id'])
            }
          })
        }
      }
    });
  },
    updateUserStatus(user_id, status,callback){
      var query = "Update `"+tables.table_gen +"` Set `status`='"+ status +"' Where `user_id` = '"+user_id+"'";
      connectionPool.query(query,function(err, results){
        if(err){
          callback(err)
        }
        else{
          callback(false)
        }
      });
    }
  };

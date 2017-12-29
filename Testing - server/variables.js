var status = {
  not:'-',
  idle:'idle',
  waiting:'waiting',
  match:'match',
  rate:'rate'
}

var type_forget = {
  username:"username",
  password:"password"
}

var update_type = {
  username:"username",
  password:"password"
}

var tables ={
  table_server:"server",
  table_gen:"user_gen",
  table_prim:"user_prim",
  table_college_info:"college_info",
  table_parkinglot_info:"parkinglot_info",
  table_connect:"_connect",
  table_error:"errors",
  table_restricted_usernames:"restricted_usernames",
  table_actions:"actions",
  table_requests:"requests",
  table_matches:"current_matches",
  table_past_matches:"past_matches"
}

var action_type = {
  getUserStatus:"getUserStatus",
  request:"request",
  cancelRequest:"cancelRequest",
  cancelMatch:"cancelMatch"
}

var request_type = {
  ride : "ride",
  parking_spot : "spot"
}

module.exports = {
  getStatus:function(callback){
    callback(status)
  },
  getTypeForget:function(callback){
    callback(type_forget)
  },
  getUpdateType:function(callback){
    callback(update_type)
  },
  getTables:function(callback){
    callback(tables)
  },
  getRequestType:function(callback){
    callback(request_type)
  },
  getActions:function(callback){
    callback(action_type)
  }
}

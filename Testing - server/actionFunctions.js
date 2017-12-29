var serverFunctions = require('./serverFunctions.js');
var vars = require('./variables.js');
var gen = require('./generalFunction.js')

var matches = {}
var clients = {}

var timers = {}
var status = {}
var request_type = {}
var action_type = {}

vars.getStatus(function(s){
  status =s
})
vars.getRequestType(function(r){
  request_type = r
})
vars.getActions(function(a){
  action_type = a
})

module.exports = {

  getUserStatus:function(res, user_id,callback){
    serverFunctions.getUserData(true, user_id, function(st, si, user){
      gen.handleErrors(res, st, si, function(){
        if(user.status == null){
          serverFunctions.updateUserStatus(user_id,status.not ,function(){})
        }
        switch (user.status){
          case status.idle :
          callback({status : status.idle})
          break;
          case status.waiting:
          /*get data from requests table*/
          serverFunctions.getUserRequest(user_id, function(st2, si2, request){
            gen.handleErrors(res, st2, si2, function(){
              callback({status : status.waiting, data : request})
              /*var pu = {}
              if(request.type == request_type.ride){
                pu = {lat : request.pickup_lay, lng: request.pickup_lng}
              }
              callback({college_id:request.college_id, parkinglot_id: request.parkinglot_id, time:request.time,pu: pu })
              */
              })
          })
          break;
          case status.match:
          /*get data from current matches table*/
          serverFunctions.getMatchData(user_id, function(st2, si2, matchData){
            gen.handleErrors(res, st2, si2, function(){
              callback({status : status.match, data : matchData})

            })
          })
          break;
          case status.rate:
          /*get data from past match table*/
          serverFunctions.getPastMatchData(user_id, function(st2, si2, pastMatchData){
            gen.handleErrors(res, st2, si2, function(){
              callback({status : status.rate, data : pastmMatchData})
            })
          })
          break;
          default:
          break;
        }
      })
    })
  },
  handleAction:function(res, data){
    console.log(data.action)
    switch(data.action){
      case action_type.getUserStatus:
      module.exports.getUserStatus(res, data.user_id, function(data){
        gen.validResponse(res, 'User status', data)
      })
      break;
      case action_type.request:
        module.exports.registerRequest(res, data)
      break;
      case action_type.cancelRequest:
        module.exports.cancelRequest(res, data)
      break;
      case action_type.cancelMatch:
        module.exports.cancelMatch(res, data)
        console.log("cm")
      break;
    }
  },
  attemptRegisterRequest:function(res, data, callback){
    if(data.user_id == undefined || data.college_id == undefined ||data.parkinglot_id == undefined ||data.type == undefined ){
      module.exports.structuralError(res,"Error.Base Headers/Parameters not met")
    }
    else{
      if(data.type == request_type.ride){
          if(data.pu_lat == undefined || data.pu_lng == undefined){
            gen.structuralError(res,"Error.Base Headers/Parameters not met")
          }
          else{
            callback()
          }
      }
      else{
        data.pu_lat = 0
        data.pu_lng = 0
        module.exports.getUserStatus(res, data.user_id, function(user){
          if(user.status != status.idle){
            console.log(user.status)
            console.log(status.idle)
            gen.simpleError(res,"User cannot request at this time")
          }
          else{
            callback()
          }
        })

      }
    }
  },
  registerRequest:function(res, data){
    module.exports.attemptRegisterRequest(res, data, function(){
      serverFunctions.findMatch(data, function(st, si, matches){
        gen.handleErrors(res, st, si, function(){
          if(matches.length == 0){
            serverFunctions.recordRequest(data, function(st2, si2){
              gen.handleErrors(res, st2, si2, function(){
                module.exports.userRequestOperations(data.user_id, function(st3, si3){
                  gen.handleErrors(res, st3, si3, function(){
                    gen.validResponse(res, "Request Registered")
                  })
                })
              })
            })
          }
          else{
            serverFunctions.removeRequest(matches[0].user_id, function(st2, si2){
              gen.handleErrors(res, st2, si2, function(){
                if(data.type == request_type.ride){
                  module.exports.matchOperation(matches[0], data)
                  gen.validResponse(res, "Request Registered\n Match Found!")
                }
                else{
                  module.exports.matchOperation(data, matches[0])
                  gen.validResponse(res, "Request Registered\n Match Found!")
                }

              })
            })
          }
        })
      })
    })
  },

  attemptCancelRequest(res, data, callback){
    module.exports.getUserStatus(res, data.user_id, function(user){
      if(user.status != status.waiting){
        gen.simpleError(res, "User Status Incorrect")
      }
      else{
        callback()
      }
    })
  },
  cancelRequest:function(res, data){
    module.exports.attemptCancelRequest(res, data, function(){
      serverFunctions.removeRequest(data.user_id, function(st, si){
        gen.handleErrors(res, st, si, function(){
          module.exports.resetUser(data.user_id,function(){})
          gen.validResponse(res, "Request Canceled ")
        })
      })
    })
  },
  attemptCancelMatch(res, data, callback){
    module.exports.getUserStatus(res, data.user_id, function(user){
      if(user.status != status.match){
        gen.simpleError(res, "User Status Incorrect")
      }
      else{
        callback(user)
      }
    })
  },
  cancelMatch:function(res, data){
    console.log("canCelMatch")
    module.exports.attemptCancelMatch(res, data, function(user){
      console.log("attempt")
      serverFunctions.removeMatch(user.data.match_id, function(st, si){
        console.log("remove match")
        gen.handleErrors(res, st, si, function(){
          console.log("math canceled")
          module.exports.resetUser(user.data.rider_id,function(){})
          module.exports.resetUser(user.data.parker_id,function(){})
          gen.validResponse(res, "Match Canceled ")
        })
      })
    })
  },
  matchOperation:function(parker_data, rider_data){
    gen.generateCustomKey(20, function(match_id){
      var matchData = {
        match_id: match_id,
        rider_id: rider_data.user_id,
        parker_id: parker_data.user_id,
        college_id: rider_data.college_id,
        parkinglot_id: rider_data.parkinglot_id,
        pu_lat:rider_data.pu_lat,
        pu_lng:rider_data.pu_lng
      }
      serverFunctions.recordMatch(matchData,function(st, si){
        if(st){
          module.exports.resetUser(rider_data.user_id,function(){})
          module.exports.resetUser(parker_data.user_id,function(){})
        }
        else{
          module.exports.userMatchOperations(rider_data.user_id,matchData,function(){})
          module.exports.userMatchOperations(parker_data.user_id,matchData,function(){})
        }
      })
    })
  },
  resetUser:function(user_id, callback){
    /*status - idle
    matchData - null*/
    serverFunctions.updateUserStatus(user_id, status.idle, function(){
      serverFunctions.updateUserMatchData(user_id, "", function(){
        callback()
      })
    })
  },
  userRequestOperations(user_id,callback){
    /* status - waiting */
    serverFunctions.updateUserStatus(user_id, status.waiting, function(){
      callback()
    })
  },
  userMatchOperations:function(user_id, matchData, callback){
    serverFunctions.updateUserStatus(user_id, status.match, function(){
      serverFunctions.updateUserMatchData(user_id, matchData.match_id, function(){
        callback()
      })
    })
  },
  userRateOperations(user_id, matchData, callback){
    /*status - rate
    */
    serverFunctions.updateUserStatus(user_id, statsu.rate, function(){
      callback()
    })

  }





}

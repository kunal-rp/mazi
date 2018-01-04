var serverFunctions = require('./serverFunctions.js');
var vars = require('./variables.js');
var gen = require('./generalFunction.js')
var geo = require('geopoint')

var matches = {}
var clients = {}

var match_status = {}

var status = {}
var request_type = {}
var action_type = {}

var timers_types = {}
var timers = {}

var collegeData = {}
var parkinglotData = {}


//retreive all statuc variables from the variables.js module
vars.getStatus(function(s){
  status =s
})
vars.getRequestType(function(r){
  request_type = r
})
vars.getActions(function(a){
  action_type = a
})
vars.getMatchStatus(function(m){
  match_status = m
})


vars.getTimerTypes(function(t){
  timer_types = t
})

serverFunctions.getCollegeParkingData(function(code, cd, pd){
  collegeData = cd
  parkinglotData = pd

})

module.exports = {

  /*
  handles the action request

  */

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
        module.exports.cancelMatch(res,data.user_id)
      break;
      case action_type.rateMatch:
        module.exports.rateMatch(res, data,data.user_id)
      break;
      case action_type.updateLocation:
        module.exports.updateLocation(res, data)
      break;
    }
  },
  /*
  gets the user status and also any relavent information
  i.e. - waiting : the current request Details
        match : the current match Details
        rate : the past match Details

  the client will use this information to alter the UI
  we can also call this function within the module to perform checks
  */
  getUserStatus:function(res, user_id,callback){
    serverFunctions.getUserData(true, user_id, function(st, si, user){
      gen.handleErrors(res, st, si, function(){
        //update the status of the user to '-' if needed
        //NEED TO CHANGE THIS
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
              callback({status : status.waiting, data : request,type : user.type})
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
          serverFunctions.getMatchData(user.match_id, function(st2, si2, matchData){
            gen.handleErrors(res, st2, si2, function(){
              callback({status : status.match, data : matchData,type : user.type})

            })
          })
          break;
          case status.rate:
          /*get data from past match table*/
          serverFunctions.getPastMatchData(user.match_id, function(st2, si2, pastMatchData){
            gen.handleErrors(res, st2, si2, function(){
              callback({status : status.rate, data : pastMatchData,current_rating: user.rating, total_matches:user.total_matches,type : user.type})
            })
          })
          break;
          default:
          break;
        }
      })
    })
  },

  /*
  checks before registering a request
  1)user status is currently 'idle'
  2)request has all necessary information
    -for 'ride' requests, the pick up corrdinates must be provided

  TO-DO:
  -check to make sure the college and parking lot id's are valid
  */

  attemptRegisterRequest:function(res, data, callback){
    if(data.user_id == undefined || data.college_id == undefined ||data.parkinglot_id == undefined ||data.type == undefined ){
      module.exports.structuralError(res,"Error.Base Headers/Parameters not met")
    }
    else{
      module.exports.getUserStatus(res, data.user_id, function(user){
        if(user.status != status.idle){
          console.log(user.status)
          console.log(status.idle)
          gen.simpleError(res,"User cannot request at this time")
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
            callback()
          }
        }
      })
    }
  },

  /*
  Registers the user request
  */
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
  /*
  Checks before canceling the request
  1) User status must be in 'waiting' status
  */
  attemptCancelRequest(res, data, callback){
    module.exports.getUserStatus(res, data.user_id, function(user){
      if(user.status != status.waiting){
        gen.simpleError(res, "User Cannot cancel Request at this time")
      }
      else{
        callback()
      }
    })
  },
  //Cancels the request by the user
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
  /*
  Checks before canceling the match
  1) User status must be in 'match' status
  */
  attemptCancelMatch(res,user_id, callback){
    module.exports.getUserStatus(res, user_id, function(user){
      if(user.status != status.match){
        gen.simpleError(res, "User cannot cancel match at this time")
      }
      else{
        callback(user)
      }
    })
  },
  /*
  Cancels the match
  This only occurs when the user REQUESTS it
  */
  cancelMatch:function(res,user_id){
    module.exports.attemptCancelMatch(res,user_id,  function(user){
      serverFunctions.removeMatch(user.data.match_id, function(st, si){
        gen.handleErrors(res, st, si, function(){
          module.exports.userRateOperations(user.data.rider_id,function(){})
          module.exports.userRateOperations(user.data.parker_id,function(){})
          gen.validResponse(res, "Match Canceled ")
          var pm = {
            match_id : user.data.match_id,
            time : user.data.start_timestamp,
            rider_id :user.data.rider_id,
            parker_id :user.data.parker_id,
            college_id :user.data.college_id,
            parkinglot_id :user.data.parkinglot_id,
            pu_lat :user.data.pu_lat,
            pu_lng :user.data.pu_lng,
            cancel : user_id
          }
          serverFunctions.recordPastMatch(pm, function(st2, si2){
            gen.handleErrors(res, st2, si2, function(){})
          })
        })
      })
    })
  },
  /*
  Cancels the match
  This only occurs when the server requests it
  Possible causes:
    -User updates their location and they are too far away from the college[This is IMPLEMENTED]
    -The user diconnects when they are in the match for an extended period of time
    -The match is active for an extended period of time
  */
  forceCancelMatch:function(user_id){
    module.exports.getUserStatus(null, user_id, function(user){
      if(user.status == status.match){
        serverFunctions.removeMatch(user.data.match_id, function(){
            module.exports.userRateOperations(user.data.rider_id,function(){})
            module.exports.userRateOperations(user.data.parker_id,function(){})
            var pm = {
              match_id : user.data.match_id,
              time : user.data.start_timestamp,
              rider_id :user.data.rider_id,
              parker_id :user.data.parker_id,
              college_id :user.data.college_id,
              parkinglot_id :user.data.parkinglot_id,
              pu_lat :user.data.pu_lat,
              pu_lng :user.data.pu_lng,
              cancel : user_id
            }
            serverFunctions.recordPastMatch(pm, function(){})
        })
      }
    })
  },
  /*
  Perform the server match operations for when a match is created between two users
  1)A unique match ID is generate
  2)The match and all data is recorded in the 'current matches' table
  */

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
          module.exports.userMatchOperations(rider_data.user_id,"rider",matchData,function(){})
          module.exports.userMatchOperations(parker_data.user_id,"parker",matchData,function(){})
        }
      })
    })
  },
  /*
  Resets the user back to normal
  1) status -> 'idle'
  2)type -> null
  3)match -> null
  4)Clears any timers
  */
  resetUser:function(user_id, callback){
    /*status - idle
    matchData - null*/
    module.exports.clearTimers(user_id, function(){})
    serverFunctions.updateUserStatus(user_id, status.idle, function(){
      serverFunctions.updateUserMatchData(user_id, "","", function(){
        callback()
      })
    })
  },
  /*
  Performs user changes for when the user requests
  1) status -> 'waiting'
  */
  userRequestOperations(user_id,callback){
    /* status - waiting */
    serverFunctions.updateUserStatus(user_id, status.waiting, function(){
      callback()
    })
  },
  /*
  Performs user changes for when a match occurs
  1) status -> 'match'
  2)match -> match_id generated for that match
  */
  userMatchOperations:function(user_id,type,  matchData, callback){
    module.exports.clearTimers(user_id, function(){})
    serverFunctions.updateUserStatus(user_id,status.match, function(){
      serverFunctions.updateUserMatchData(user_id, type,matchData.match_id, function(){
        callback()
      })
    })
  },
  /*
  Performs user changes for when a match ends and the user now needs to rate the match
  1) status -> 'rate'
  2)Clears any timers
  */
  userRateOperations:function(user_id, callback){
    /*status - rate
    */
    module.exports.clearTimers(user_id, function(){})
    module.exports.clearTimers(user_id,function(){})
    serverFunctions.updateUserStatus(user_id, status.rate, function(){
      callback()
    })

  },
  /*
  Performs checks to update the user's location
  1) The 'lat' and 'lng' coordinate data needs to be present
  2) The user must be active/logged in ; the status cannot be '-'(not)
  */
  attemptUpdateLocation:function(res, data,callback){
    if(data.lat == undefined || data.lng == undefined){
      gen.strucuralError(res)
    }
    else{
      module.exports.getUserStatus(res, data.user_id, function(user){
        if(user.status == status.not){
          gen.simpleError(res, "User cannot cancel update location at this time")
        }
        else{
          callback(user)
        }
      })
    }
  },
  /*
  Updates the user's location in general terms
  1)Pushes the new coordinates to the 'gen table'
  2) If in a match:
    -Calls the 'updateUserLocation' method
  */
  updateLocation:function(res, data){
    module.exports.attemptUpdateLocation(res, data, function(user){
      serverFunctions.updateUserLocation(data,function(st, si){
        gen.handleErrors(res, st, si, function(){
          if(user.status == status.match){
            var mi = user.data.match_id
            var type = ""
            if(data.user_id == user.data.rider_id){
              type = "rider"
            }
            else{
              type = "parker"
            }
            module.exports.updateLocationMatch(res,data.user_id,user.data,mi,type, Number(data.lat), Number(data.lng),function(st2, si2){
              gen.validResponse(res, "User Updated Location")
            })
          }
          else{
            gen.validResponse(res, "User Updated Location")
          }
        })
      })
    })
  },
  /*
  Updates the user's location for when a user is in a match
  1)Pushes the new coordinates to the 'current matches' table for the parker/rider
  2) If the new location is outside of the college mile radius
    -calls the 'userisTooFar' method

  */
  updateLocationMatch:function(res,user_id,matchData, mi, type, la, ln,callback){
    var pickup_loc = new geo(matchData.pu_lat,matchData.pu_lng)
    var current_loc = new geo(la, ln)

    var t1 = new geo(34.028760, -117.775263)
    var t2 = new geo(34.029138, -117.774914)
    console.log("T:" +t1.distanceTo(t2))
    serverFunctions.updateUserLocationMatch(mi, type, la, ln,function(st2, si2){
      callback()
    })
    var college_loc = new geo(collegeData[matchData.college_id].college_coor_lat,collegeData[matchData.college_id].college_coor_lng)
    if(current_loc.distanceTo(college_loc, false) >= collegeData[matchData.college_id].college_park_limit)
    {
      module.exports.userisTooFar(user_id,mi,type,match_status.too_far)
    }
    //else if()
  },
  /*
  Performs actions in case user is outside the college mile radius:
    1)The 'status' variable in the 'current matches' table for the rider/parker needs to update to 'too_far'
    2)Start a timer; user has till the end of the timer to get back into the circle
  */
  userisTooFar:function(user_id,match_id,type,status){
    serverFunctions.updateMatchUserStatus(match_id, type,status)
    module.exports.startTimerTooFar(user_id)
  },
  attemptRateMatch:function(res, data, user_id, callback){
    module.exports.getUserStatus(res, user_id, function(user){
      if(user.status != status.rate){
        gen.simpleError(res, "User cannot rate match at this time")
      }
      else{
        if(data.rating == undefined || data.rating <0 || data.rating > 5){
          module.exports.structuralError(res,"Error.Base Headers/Parameters not met")
        }
        else{
          callback(user)
        }
      }
    })
  },
  rateMatch:function(res, data, user_id){
    module.exports.attemptRateMatch(res, data, user_id, function(user){


      var mi = user.data.match_id

      var ratingUser = "rider"
      var ratingUserId = user.data.rider_id

      console.log("user type: "+user.type)
      console.log(user.type == "rider")


      if(user.type == "rider"){
        ratingUser = "parker"
        ratingUserId = user.data.parker_id
      }
        serverFunctions.getUserData(true, ratingUserId, function(st, si, user2){
          gen.handleErrors(res, st, si, function(){
            module.exports.rateUser(ratingUserId,data.rating,user2.rating,user2.total_matches, mi,ratingUser)
            module.exports.resetUser(user_id,function(){})
            gen.validResponse(res, "User Rating Recorded")

          })
        })

    })
  },
  rateUser:function(user_id, rating,ov, total_matches,match_id,type){
    total_matches += 1

    ov -= (ov/total_matches)

    ov += (rating/total_matches)


    serverFunctions.rateUserGen(user_id,ov, total_matches)
    serverFunctions.rateUserPastMatch( match_id, type, rating)
  },
  startTimerTooFar:function(user_id){
    console.log("Too Far Timer Start")
    if(timers[user_id] == undefined ||timers[user_id].too_far == undefined ){
      module.exports.clearTimers(user_id, function(){
        timers[user_id] =
        {
          too_far : setTimeout(function(){
            module.exports.forceCancelMatch(user_id)
            console.log("Too Far Timer STOP")
          }, timer_types.too_far.dur)
        }
      })
    }

  },
  clearTimers(user_id, callback){
    if(timers[user_id] != undefined){
      for (var key in timers[user_id]) {
          clearTimeout(timers[user_id][key])
      }
      timers[user_id] = {}
      callback()
    }
    else{
      callback()
    }
  }





}

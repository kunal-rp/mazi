var serverFunctions = require('./serverFunctions.js');
var jwt = require('jsonwebtoken')

var codes = {}

module.exports = {

  setCodes:function(c){
    codes = c
  },
  generateCustomKey:function(callback){

    var max = Number.MAX_SAFE_INTEGER
    var min = 0
    callback((Math.random() * (max - min) + min).toString())
  },
  generateCodes:function(callback){
    module.exports.generateCustomKey(function(v_a){
      module.exports.generateCustomKey(function(v_i){
        module.exports.generateCustomKey(function(v_w){
          var codes =
          {android_key:v_a,
            ios_key:v_i,
            web_key:v_w};
            serverFunctions.updateServerinfo(codes,function(){callback(codes)})
          })
        })
      })
    },
    checkReqGeneral:function(req,res,callback){
      if(req.get("token_gen") == undefined ||req.get("type") == undefined || codes[req.get("type")] == undefined){
        res.json({code: -1, message: "Error. Base Headers not met"});
      }
      else{
        jwt.verify(req.get("token_gen"), codes[req.get("type")], function(err, result) {
          if(err){
            res.json({code: 0, message: "Error. Session Invalid."});
            console.log(err)
          }
          else{
            callback(result)
          }
        })
      }
    },
    checkReqSpecific:function(req,res,callback){
      module.exports.checkReqGeneral(req, res,function(result){
        if(result.user_id == undefined){
          res.json({code: -1, message: "Error. Base Headers not met"});
        }
        else{
          var user_id = result.user_id
          serverFunctions.getUserData(user_id, function(err, user_auth_token){
            if(err){
              res.json({code: -1, message: "An Error Occured . Sorry for the inconvenience"});
            }
            else{
              jwt.verify(req.get("token_specific"), user_auth_token , function(err2, result2) {
                if(err2){
                  res.json({code: 0, message: "Error. Session Invalid."});
                }
                else{
                  callback(result2)
                }
              })
            }
          })
        }
      })
    }


  }

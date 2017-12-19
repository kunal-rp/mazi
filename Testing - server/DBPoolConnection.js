var mysql= require('mysql');

//Connection to SQL DB
//NEED to create two seperate connections for user_prim and general uses for security
var connectionPool = mysql.createPool({
	connectionLimit:50,
	host: 'localhost',
	user: 'username',
	password: 'password',
	database: 'vierveTesting',
	port:3307
});

module.exports = {
    getPool: function () {
      return connectionPool;
    }
};

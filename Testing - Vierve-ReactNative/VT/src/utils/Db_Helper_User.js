import SQLite from 'react-native-sqlite-storage';
SQLite.DEBUG(true);
SQLite.enablePromise(true);

class Db_Helper_User{
	const database_version = "3.0";
	const database_size = 200000;

	const TABLE_USER_INFO = "user_info";
	const COL_USER_ID = "user_id";
	const COL_USER_NAME = "user_name";
	const COL_USER_EMAIL = "user_email";
	const COL_USER_PASSWORD = "user_password";
	const COL_REMEMBER = "remember";

	const COLLEGE_CREATE_TABLE = 
		"CREATE TABLE " + TABLE_USER_INFO + "(" +
			COL_USER_ID + " VARCHAR PRIMARY KEY, " +
			COL_USER_NAME + " VARCHAR," +
			COL_USER_PASSWORD + " VARCHAR," +
			COL_USER_EMAIL + " VARCHAR," +
			COL_REMEMBER + " INTEGER);";


	constructor() {
		//open database
		SQLite.openDatabase({name: 'vt.db', location: 'Library'}).then((DB) => {
			this.db = DB;
		}).catch((error) => {
			console.log(error);
		});
	}

	static create() {
		this.db.executeSql(COLLEGE_CREATE_TABLE);
	}

	static upgrade() {
		this.db.executeSql('DROP TABLE IF EXISTS ' + TABLE_USER_INFO);
		this.create();
	}

	static getRemember() {
		let result = false;
		let selectQuery = "SELECT * FROM `" + TABLE_USER_INFO + "`";
		this.db.transaction((tx) => {
			tx.executeSql(selectQuery).then(([tx, results]) => {
				//need to figure this out
			}).catch((error) => {
				console.log(error);
			});

		})
	}
}

export default new Db_Helper_User();
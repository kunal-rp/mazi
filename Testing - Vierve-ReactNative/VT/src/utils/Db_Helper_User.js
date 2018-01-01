import {AsyncStorage} from 'react-native';

class Db_Helper_User{

	static async getRemember() {
		let response = await AsyncStorage.getItem('user_data');
		let userData = await JSON.parse(response);
		return userData.remember==1 ? true : false; // return true if remembered
	}

	static async setRemember(value) {
		// get data object
		let response = await AsyncStorage.getItem('user_data');
		let userData = await JSON.parse(response);
		userData.remember=value; 	//set remember value
		await AsyncStorage.setItem('user_data', JSON.stringify(userData)); //store back in storage
	}

	static async getInfo() {
		let response = await AsyncStorage.getItem('user_data');
		let userData = await JSON.parse(response);
		return userData //return entire json object
	}

	static async clearAllData() {
		try{
			await AsyncStorage.removeItem('user_data');
		} catch(error){
			console.log(error);
		}
	}

	static async setUserInfo(userData) {
		this.clearAllData();
		await AsyncStorage.setItem('user_data', JSON.stringify(userData));
	}	
}

export default new Db_Helper_User;
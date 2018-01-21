import {AsyncStorage} from 'react-native';

class Db_Helper_User{

	// async getRemember() {
	// 	let response = await AsyncStorage.getItem('user_info');
	// 	let userInfo = await JSON.parse(response);
	// 	return userInfo.remember==1 ? true : false; // return true if remembered
	// }

	// async setRemember(value) {
	// 	// get data object
	// 	let response = await AsyncStorage.getItem('user_info');
	// 	let userInfo = await JSON.parse(response);
	// 	userInfo.remember=value; 	//set remember value
	// 	await AsyncStorage.setItem('user_info', JSON.stringify(userInfo)); //store back in storage
	// }

	async getInfo() {
		let response = await AsyncStorage.getItem('user_info');
		if (response != null){
			let userInfo = await JSON.parse(response);
			return userInfo //return entire json object
		}
		return null;
	}

	async clearAllData() {
		try{
			await AsyncStorage.removeItem('user_info');
		} catch(error){
			console.log(error);
		}
	}

	//var userInfo = {"user_id": 0, "user_name": this.state.username, "user_email": this.state.email, "user_password": this.state.password, "remember": true};

	async updateUserCredentials(data) {
		let userInfo = await this.getInfo();
		if(userInfo !=null){
			userInfo.user_name = data.user_name;
			userInfo.user_password = data.user_password;
			userInfo.remember = data.remember;
			this.setUserInfo(userInfo);
		}
	}

	async setUserInfo(userInfo) {
		await AsyncStorage.setItem('user_info', JSON.stringify(userInfo));
	}	

	//Method to save session credentials for logging off later
	async saveSessionData(data){
		await AsyncStorage.setItem('sessionData', JSON.stringify(data));
	}

	//Method to get credentials from app storage to log off with
	async getSessionData() {
		try{
			let response = await AsyncStorage.getItem('sessionData');
			if(response != null){
				let responseJson = await JSON.parse(response);
				return responseJson;
			}
		} catch(error){
			console.log(error);
		}
	}
}

export default new Db_Helper_User;
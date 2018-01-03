import {AsyncStorage} from 'react-native';

class Db_Helper_User{

	async getRemember() {
		let response = await AsyncStorage.getItem('user_info');
		let userInfo = await JSON.parse(response);
		return userInfo.remember==1 ? true : false; // return true if remembered
	}

	async setRemember(value) {
		// get data object
		let response = await AsyncStorage.getItem('user_info');
		let userInfo = await JSON.parse(response);
		userInfo.remember=value; 	//set remember value
		await AsyncStorage.setItem('user_info', JSON.stringify(userInfo)); //store back in storage
	}

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

	async setUserInfo(userInfo) {
		this.clearAllData();
		await AsyncStorage.setItem('user_info', JSON.stringify(userInfo));
	}	
}

export default new Db_Helper_User;
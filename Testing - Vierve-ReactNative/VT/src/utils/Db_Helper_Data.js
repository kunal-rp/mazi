import {AsyncStorage} from 'react-native';

class Db_Helper_Data{

	async clearAllData(){
		try{
			await AsyncStorage.removeItem('college_info');
			await AsyncStorage.removeItem('parkinglot_info');
		} catch(error){
			console.log(error);
		}
	}

	async updateCollegeData(data) {
		//data coming will by json format
		let collegeList = [];
		for (var i = 0; i < data.ids.length; i++) {
			 collegeList.push(data[data.ids[i]]);
		}
		await AsyncStorage.setItem('college_info', JSON.stringify(collegeList));
	}

	async addCollege(college){
		let response = await AsyncStorage.getItem('college_info');
		let collegeList = await JSON.parse(response) || []; // get list of colleges from storage
		collegeList.push(college); // add college to list
		await AsyncStorage.setItem('college_info', JSON.stringify(collegeList));
	}

	async getVersion() {
		let response = await AsyncStorage.getItem('college_info');
		if(response != null){
			let responseJson = JSON.parse(response);
			return responseJson.code;
		}
		else return null;
	}

	async getColleges() {
		let response = await AsyncStorage.getItem('college_info');
		let collegeList = await JSON.parse(response) || [];
		return collegeList;
	}

	async getCollegeNameList() {
		let response = await AsyncStorage.getItem('college_info');
		let collegeList = await JSON.parse(response) || [];
		if(collegeList.length>0){
			let colleges = [];
			for (var i = 0; i < collegeList.length; i++) {
				colleges.push(collegeList[i].college_name);
			}
			return colleges;
		}
		else return collegeList;
	}

	async getAllCollegeVersion() {
		let response = await AsyncStorage.getItem('college_info');
		let collegeList = await JSON.parse(response) || [];
		var version = 0;
		for (var i = 0; i < collegeList.length; i++) {
			if(collegeList[i].college_version > version){
				version = collegeList[i].college_version;
			}
		}
		return version;
	}

	async checkCollege(id) {
		let response = await AsyncStorage.getItem('college_info');
		let collegeList = await JSON.parse(response) || [];
		for (var i = 0; i < collegeList.length; i++) {
			if(collegeList[i].college_id==id){
				return true;
			}
		}
		return false;
	}

	async getCollegeName(id) {
		let response = await AsyncStorage.getItem('college_info');
		let collegeList = await JSON.parse(response) || [];
		for (i=0; i< collegeList.length; i++){
			if(collegeList[i].college_id==id){
				return collegeList[i].college_name;
			}
		}
		return "";
	}

	async getParkinglotName(id) {
		let response = await AsyncStorage.getItem('parkinglot_info');
		let parkingList = await JSON.parse(response) || [];
		for (i=0; i< parkingList.length; i++){
			if(parkingList[i].parkinglot_id==id){
				return parkingList[i].parkinglot_name;
			}
		}
		return "";
	}

	async addParkingLot(parkingLot) {
		let response = await AsyncStorage.getItem('parkinglot_info');
		let parkingList = await JSON.parse(response) || [];
		parkingList.push(parkingLot);
		await AsyncStorage.setItem('parkinglot_info', JSON.stringify(parkingList));
	}

	async getAllParkingLotsFromCollege(id) {
		let response = await AsyncStorage.getItem('parkinglot_info');
		let parkingList = await JSON.parse(response) || [];
		var allParkingLots = [];
		for (i = 0; i < parkingList.length; i++) {
			if(parkingList[i].college_id==id){
				allParkingLots.push(parkingList[i]);
			}
		}
		return allParkingLots;
	}

	async checkParkingLot(id) {
		let response = await AsyncStorage.getItem('parkinglot_info');
		let parkingList = await JSON.parse(response) || [];
		for (var i = 0; i < parkingList.length; i++) {
			if(parkingList[i].parkinglot_id==id){
				return true;
			}
		}
		return false;
	}
}

export default new Db_Helper_Data;
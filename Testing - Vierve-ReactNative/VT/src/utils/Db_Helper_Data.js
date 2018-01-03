import {AsyncStorage} from 'react-native';

class Db_Helper_Data{
	static async clearAllData(){
		try{
			await AsyncStorage.removeItem('college_info');
			await AsyncStorage.removeItem('parkinglot_info');
		} catch(error){
			console.log(error);
		}
	}

	static async addCollege(college){
		let response = await AsyncStorage.getItem('college_info');
		let collegeList = await JSON.parse(response) || []; // get list of colleges from storage
		collegeList.push(college); // add college to list
		await AsyncStorage.setItem('college_info', JSON.stringify(collegeList));
	}

	static async getAllCollegesInformation() {
		let response = await AsyncStorage.getItem('college_info');
		let collegeList = await JSON.parse(response) || [];
		return collegeList;
	}

	static async checkCollege(id) {
		let response = await AsyncStorage.getItem('college_info');
		let collegeList = await JSON.parse(response) || [];
		for (var i = 0; i < collegeList.length; i++) {
			if(collegeList[i].college_id==id){
				return true;
			}
		}
		return false;
	}

	static async getCollegeName(id) {
		let response = await AsyncStorage.getItem('college_info');
		let collegeList = await JSON.parse(response) || [];
		for (i=0; i< collegeList.length; i++){
			if(collegeList[i].college_id==id){
				return collegeList[i].college_name;
			}
		}
		return "";
	}

	static async getParkinglotName(id) {
		let response = await AsyncStorage.getItem('parkinglot_info');
		let parkingList = await JSON.parse(response) || [];
		for (i=0; i< parkingList.length; i++){
			if(parkingList[i].parkinglot_id==id){
				return parkingList[i].parkinglot_name;
			}
		}
		return "";
	}

	static async addParkingLot(parkingLot) {
		let response = await AsyncStorage.getItem('parkinglot_info');
		let parkingList = await JSON.parse(response) || [];
		parkingList.push(parkingLot);
		await AsyncStorage.setItem('parkinglot_info', JSON.stringify(parkingList));
	}

	static async getAllParkingLotsFromCollege(id) {
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

	static async checkParkingLot(id) {
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
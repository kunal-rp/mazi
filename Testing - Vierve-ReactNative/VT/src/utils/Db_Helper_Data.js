import {AsyncStorage} from 'react-native';

class Db_Helper_Data{

	async getCode(){
		let response  = await AsyncStorage.getItem('data_version');
		let responseJson =  await JSON.parse(response) || null;
		if(responseJson) return responseJson.code;
		else return null;
	}

	async updateData(data) {
		//split data into three parts
		await AsyncStorage.setItem('data_version', JSON.stringify({'code': data.code}));
		await AsyncStorage.setItem('college_info', JSON.stringify(data.cd));
		await AsyncStorage.setItem('parking_info', JSON.stringify(data.pd));
	}

	async getCollegeList() {
		let response = await AsyncStorage.getItem('college_info');
		let data = await JSON.parse(response) || null;
		if(data){
			let colleges = [];
			for (var i = 0; i < data.ids.length; i++) {
				 colleges.push(data[data.ids[i]].college_name);
			}
			return colleges;
		}
		else return null;
	}

	// async updateSelectedCollege(college){
	// 	await AsyncStorage.setItem('college_selected', college);
	// }

	// async getSelectedCollege() {
	// 	let response = await AsyncStorage.getItem('college_selected');
	// 	return response;
	// }

	// //used
	// async updateParkingData(data){
	// 	let parkingList = [];
	// 	for(var i = 0; i < data.ids.length; i++){
	// 		parkingList.push(data[data.ids[i]]);
	// 	}
	// 	await AsyncStorage.setItem('parking_info', JSON.stringify(parkingList));
	// }

	// //not used
	// async getColleges() {
	// 	let response = await AsyncStorage.getItem('college_info');
	// 	let collegeList = await JSON.parse(response) || [];
	// 	return collegeList;
	// }

	//used
	// async getParkingLotsList(){
	// 	let response = await AsyncStorage.getItem('parking_info');
	// 	let parkingList = await JSON.parse(response) || [];
	// 	if(parkingList.length>0){
	// 		let parkinglots = [];
	// 		for (var i = 0; i < parkingList.length; i++) {
	// 			parkinglots.push(parkingList[i].parkinglot_name);
	// 		}
	// 		return parkinglots;
	// 	}
	// 	else return parkingList;
	// }

	async getParkingLotsFromCollege(college){
		//input - college name string
		let response = await AsyncStorage.getItem('college_info'); //get college json data
		let data = JSON.parse(response) || null;
		let id=null;
		if(data){
			for (var i = 0; i < data.ids.length; i++) {	//traverse college data for college input
				if(data[data.ids[i]].college_name==college){
					id = data.ids[i];	//return id
					break;
				}
			}

			if(id){
				let response = await AsyncStorage.getItem('parking_info'); 	//getting parking data
				let data = await JSON.parse(response) || null;
				let parkinglots = [];
				if(data){
					for (var i = 0; i < data.ids.length; i++) {	//get all parking lots from college input
						if(data[data.ids[i]].college_id==id) parkinglots.push(data[data.ids[i]].parkinglot_name);
					}
				}
				return parkinglots;
			}
		}
		else return null;
	}

	//not used
	// async getAllCollegeVersion() {
	// 	let response = await AsyncStorage.getItem('college_info');
	// 	let collegeList = await JSON.parse(response) || [];
	// 	var version = 0;
	// 	for (var i = 0; i < collegeList.length; i++) {
	// 		if(collegeList[i].college_version > version){
	// 			version = collegeList[i].college_version;
	// 		}
	// 	}
	// 	return version;
	// }

	//not used
	// async checkCollege(id) {
	// 	let response = await AsyncStorage.getItem('college_info');
	// 	let collegeList = await JSON.parse(response) || [];
	// 	for (var i = 0; i < collegeList.length; i++) {
	// 		if(collegeList[i].college_id==id){
	// 			return true;
	// 		}
	// 	}
	// 	return false;
	// }

	//not used
	// async getCollegeName(id) {
	// 	let response = await AsyncStorage.getItem('college_info');
	// 	let collegeList = await JSON.parse(response) || [];
	// 	for (i=0; i< collegeList.length; i++){
	// 		if(collegeList[i].college_id==id){
	// 			return collegeList[i].college_name;
	// 		}
	// 	}
	// 	return "";
	// }

	//not used
	// async getParkinglotName(id) {
	// 	let response = await AsyncStorage.getItem('parkinglot_info');
	// 	let parkingList = await JSON.parse(response) || [];
	// 	for (i=0; i< parkingList.length; i++){
	// 		if(parkingList[i].parkinglot_id==id){
	// 			return parkingList[i].parkinglot_name;
	// 		}
	// 	}
	// 	return "";
	// }

	//not used
	// async addParkingLot(parkingLot) {
	// 	let response = await AsyncStorage.getItem('parkinglot_info');
	// 	let parkingList = await JSON.parse(response) || [];
	// 	parkingList.push(parkingLot);
	// 	await AsyncStorage.setItem('parkinglot_info', JSON.stringify(parkingList));
	// }

	//not used
	// async getAllParkingLotsFromCollege(id) {
	// 	let response = await AsyncStorage.getItem('parkinglot_info');
	// 	let parkingList = await JSON.parse(response) || [];
	// 	var allParkingLots = [];
	// 	for (i = 0; i < parkingList.length; i++) {
	// 		if(parkingList[i].college_id==id){
	// 			allParkingLots.push(parkingList[i]);
	// 		}
	// 	}
	// 	return allParkingLots;
	// }

	//not used
	// async checkParkingLot(id) {
	// 	let response = await AsyncStorage.getItem('parkinglot_info');
	// 	let parkingList = await JSON.parse(response) || [];
	// 	for (var i = 0; i < parkingList.length; i++) {
	// 		if(parkingList[i].parkinglot_id==id){
	// 			return true;
	// 		}
	// 	}
	// 	return false;
	// }
}

export default new Db_Helper_Data;
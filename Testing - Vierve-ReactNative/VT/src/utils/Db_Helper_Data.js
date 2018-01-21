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

	async getCollegeCoordinates(college) {
		let response = await AsyncStorage.getItem('college_info');
		let data = await JSON.parse(response) || null;
		var coords={};
		if(data){
			for (var i = 0; i < data.ids.length; i++) {	//traverse college data for college input
				if(data[data.ids[i]].college_name==college){
					coords.lat = data[data.ids[i]].college_coor_lat;
					coords.lng = data[data.ids[i]].college_coor_lng;
					break;
				}
			}
		}
		return coords;
	}

	// async getParkingLotCoordinates(parkingLot) {
	// 	let response = await AsyncStorage.getItem('parking_info');
	// 	let data = await JSON.parse(response) || null;
	// 	var coords={};
	// 	if(data){
	// 		for (var i = 0; i < data.ids.length; i++) {
	// 			if(data[data.ids[i]].parkinglot_name==parkingLot){
	// 				coords.lat = data[data.ids[i]].coor_lat;
	// 				coords.lng = data[data.ids[i]].coor_lng;
	// 				break;
	// 			}
	// 		}
	// 	}
	// 	return coords;
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
				let coordinates = [];
				if(data){
					for (var i = 0; i < data.ids.length; i++) {	//get all parking lots from college input
						if(data[data.ids[i]].college_id==id){
							parkinglots.push(data[data.ids[i]].parkinglot_name);
							coordinates.push({
								latitude: data[data.ids[i]].coor_lat,
								longitude: data[data.ids[i]].coor_lng,
							});
						}
					}
				}
				return {names: parkinglots, coordinates: coordinates};
			}
		}
		else return null;
	}

	async getParkingLotMarkersFromCollege(college){
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
						if(data[data.ids[i]].college_id==id){
							parkinglots.push({
								title: data[data.ids[i]].parkinglot_name,
								latitude: data[data.ids[i]].coor_lat,
								longitude: data[data.ids[i]].coor_lng,
								key: data.ids[i]
							});
						}
					}
				}
				return parkinglots;
			}
		}
		else return null;
	}
}

export default new Db_Helper_Data;
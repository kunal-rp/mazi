class ServerTools{
	// constructor() {
	// 	this.url = "https://viervetesting.herokuapp.com/";
	// }

	async getCode() {
		try{
			let response = await fetch('https://viervetesting.herokuapp.com/codes');
			let responseJson = await response.json();
			// console.log(responseJson.general_key);
			return responseJson.general_key;
		} catch(error){
			console.log(error);
		}
	}

	async login(data) {
		try{
			let response = await fetch('https://viervetesting.herokuapp.com/login', {
				method: 'POST',
				headers: {
					Accept: 'application/json',
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(data),
			});
			let responseJson = await response.json();
			return responseJson;
		} catch(error){
			console.log(error);
		}
	}

	async createUser(data) {
		try{
			let response = await fetch('https://viervetesting.herokuapp.com/createUser', {
				method: 'POST',
				headers: {
					Accept: 'application/json',
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(data),
			});
			let responseJson = await response.json();
			console.log(responseJson);
			return responseJson;
		} catch(error){
			console.log(error);
		}
	}

	async getData() {
		try{
			let response = await fetch('https://viervetesting.herokuapp.com/data');
			let responseJson = await response.json();
			return responseJson;
		} catch(error){
			console.log(error);
		}
	}
}

export default new ServerTools;
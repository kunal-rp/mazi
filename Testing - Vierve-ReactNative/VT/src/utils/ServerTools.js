class ServerTools{
	constructor(){
		this.url='https://viervetesting.herokuapp.com/';
	}

	async rawPostRequest(call,data) {
		try{
			let response = await fetch(this.url+call, {
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

	async getCode() {
		try{
			let response = await fetch(this.url+'codes');
			let responseJson = await response.json();
			return responseJson.general_key;
		} catch(error){
			console.log(error);
		}
	}

	async login(data) {
		let response = await this.rawPostRequest('login',data);
		return response;
		// try{
		// 	let response = await fetch('https://viervetesting.herokuapp.com/login', {
		// 		method: 'POST',
		// 		headers: {
		// 			Accept: 'application/json',
		// 			'Content-Type': 'application/json',
		// 		},
		// 		body: JSON.stringify(data),
		// 	});
		// 	let responseJson = await response.json();
		// 	return responseJson;
		// } catch(error){
		// 	console.log(error);
		// }
	}

	async logoff(data) {
		let response = await this.rawPostRequest('logoff',data);
		return response;
		// try{
		// 	let response = await fetch('https://viervetesting.herokuapp.com/logoff', {
		// 		method: 'POST',
		// 		headers: {
		// 			Accept: 'application/json',
		// 			'Content-Type': 'application/json',
		// 		},
		// 		body: JSON.stringify(data),
		// 	});
		// 	let responseJson = await response.json();
		// 	return responseJson;
		// } catch(error){
		// 	console.log(error);
		// }
	}

	async createUser(data) {
		let response = await this.rawPostRequest('createUser',data);
		return response;
		// try{
		// 	let response = await fetch('https://viervetesting.herokuapp.com/createUser', {
		// 		method: 'POST',
		// 		headers: {
		// 			Accept: 'application/json',
		// 			'Content-Type': 'application/json',
		// 		},
		// 		body: JSON.stringify(data),
		// 	});
		// 	let responseJson = await response.json();
		// 	// console.log(responseJson);
		// 	return responseJson;
		// } catch(error){
		// 	console.log(error);
		// }
	}

	async forgot(data){
		let response = await this.rawPostRequest('forgot',data);
		return response;
		// try{
		// 	let response = await fetch('https://viervetesting.herokuapp.com/forgot', {
		// 		method: 'POST',
		// 		headers: {
		// 			Accept: 'application/json',
		// 			'Content-Type': 'application/json',
		// 		},
		// 		body: JSON.stringify(data),
		// 	});
		// 	let responseJson = await response.json();
		// 	return responseJson;
		// } catch(error){
		// 	console.log(error);
		// }
	}

	async getData() {
		try{
			let response = await fetch('https://viervetesting.herokuapp.com/data');
			let responseJson = await response.json();
			console.log(responseJson);
			return responseJson;
		} catch(error){
			console.log(error);
		}
	}
}

export default new ServerTools;
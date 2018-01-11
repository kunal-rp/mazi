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
	}

	async logoff(data) {
		let response = await this.rawPostRequest('logoff',data);
		return response;
	}

	async createUser(data) {
		let response = await this.rawPostRequest('createUser',data);
		return response;
	}

	async forgot(data){
		let response = await this.rawPostRequest('forgot',data);
		return response;
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

	async updateUser(data) {
		let response = await this.rawPostRequest('updateUser',data);
		return response;
	}

	async addSuggestion(data){
		let response = await this.rawPostRequest('addSuggestion',data);
		return response;
	}
}

export default new ServerTools;
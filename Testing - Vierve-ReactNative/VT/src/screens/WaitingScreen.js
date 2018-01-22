import React, { Component } from 'react';
import { View, Text, StyleSheet, TouchableHighlight } from 'react-native';
import ServerTools from '../utils/ServerTools';
import Db_Helper_User from '../utils/Db_Helper_User';

class WaitingScreen extends Component{
	static navigatorStyle={
		navBarHidden: true,
		statusBarColor: '#2f4858',
		screenBackgroundColor: '#2f4858',
	};

	constructor(props) {
		super(props);
		this.AttemptMatch = this.AttemptMatch.bind(this);
		this.CancelSearch = this.CancelSearch.bind(this);
		this.getUserStatus = this.getUserStatus.bind(this);
	}

	componentDidMount() {
		this.startMatchHandler();
	}

	componentWillUnmount() {
		clearInterval(this.statusCheck);
	}

	startMatchHandler() {
		this.statusCheck = setInterval(this.getUserStatus, 3000);
	}

	AttemptMatch() {
		clearInterval(this.statusCheck);
		this.props.navigator.push({
			screen: 'vt.MatchScreen',
			backButtonHidden: true,
		});
	}

	async getUserStatus() {
		let sessionData = await Db_Helper_User.getSessionData();
    let response = await ServerTools.getUserStatus({'token_user': sessionData.token_user, 'user_id': sessionData.user_id, 'action': 'getUserStatus'});
    if(response){
	    if(response.code==1){
	    	console.log(response.data.status);
	    	if(response.data.status=='match'){
	    		this.AttemptMatch();
	    	}
	    }
	  }
	}

	async CancelSearch() {
		let sessionData = await Db_Helper_User.getSessionData();
		let response = await ServerTools.cancelRequest({'token_user': sessionData.token_user, 'user_id': sessionData.user_id, 'action': 'cancelRequest'});
		console.log(response);
		this.props.navigator.pop({
			animated: true,
			animationType: 'fade',
		});
	}

	render() {
		return (
			<View style={styles.container}>
				<View style={styles.prompt}>
					<Text style={styles.promptSizeTwo}>Searching for a</Text>
					<Text style={styles.promptSizeOne}>{this.props.type}</Text>
					<Text style={styles.promptSizeTwo}>at</Text>
					<Text style={styles.promptSizeOne}>{this.props.parkingLot}</Text>
					<Text style={styles.promptSizeTwo}>at</Text>
					<Text style={styles.promptSizeOne}>{this.props.college}</Text>
				</View>
				
	      <View style={styles.buttonContainer}>
					<TouchableHighlight onPress={this.CancelSearch} underlayColor="#2f4858">
			    	<View style={styles.button}>
			    		<Text style={styles.buttonText}>CANCEL</Text>
			    	</View>
			    </TouchableHighlight>
		    </View>
			</View>
		);
	}
}

const styles = StyleSheet.create({
	container: {
		flex:1,
		marginTop: 25,
    backgroundColor: '#2f4858',
	},
	prompt: {
		flex: 1,
		flexDirection: 'column',
	},
	promptSizeOne: {
		color: 'white',
		fontSize: 28,
		textAlign: 'center'
	},
	promptSizeTwo: {
		textAlign: 'center',
		color: 'white',
		fontSize: 20,
	},
	buttonContainer: {
  	marginBottom: 10
  },
	button: {
    marginLeft: 10,
    marginRight: 10,
    alignItems: 'center',
    backgroundColor: 'white'
  },
  buttonText: {
  	fontSize: 16,
		padding: 15,
    color: '#2f4858'
  },
});

export default WaitingScreen
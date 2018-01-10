import React, { Component } from 'react';
import { View, Text, StyleSheet, TouchableHighlight } from 'react-native';
import { TextField } from 'react-native-material-textfield';
import ServerTools from '../utils/ServerTools';
import {showNotification} from '../utils/Toolbox';

class ForgotPassword extends Component{
	static navigatorStyle = {
  	navBarTextFontSize: 28,
  	screenBackgroundColor: '#2f4858',
		statusBarColor: '#2f4858',
		navBarBackgroundColor: '#2f4858',
		navBarTextColor: 'white',
	  navBarButtonColor: 'white',
	};
	
	constructor(props) {
	 super(props);
	 this.state = {
			email: ''
		};
		this.submitEmail = this.submitEmail.bind(this);
	}

	async submitEmail() {
		if(this.state.email){
			let code = await ServerTools.getCode();
			let response = await ServerTools.forgot({'token_gen': code, 'user_email': this.state.email, 'type_forget': 'password'});
			if(response != null){
				if(response.code==1){
					showNotification(this.props.navigator, 1, 'Sent you an email');
				}
				else showNotification(this.props.navigator, 0, response.message);
			}
		}
	}

	render() {
		return (
			<View style={styles.container}>
				<View style={styles.prompt}>
					<Text style={styles.promptDescriptionText}>Enter the email registered for your account:</Text>
				</View>
				<View style={{margin: 15}}>
					<TextField
	        	label="Email"
	        	fontSize={20}
	        	enablesReturnKeyAutomatically={true}
	        	textColor="white"
	        	baseColor="white"
	        	labelHeight={12}
	        	returnKeyType='done'
            autoCapitalize='none'
            value={this.state.email}
	        	onChangeText={(v) => this.setState({email: v})}
            animationDuration={150}
	        />
	       </View>
	       <TouchableHighlight style={styles.button} onPress={this.submitEmail} underlayColor="white">
		    	<View style={styles.submitbutton}>
		    		<Text style={styles.buttonText}>SUBMIT</Text>
		    	</View>
		    </TouchableHighlight>
			</View>
		);
	}
}

const styles = StyleSheet.create({
	container: {
	},
	prompt: {
		flex: 0,
		flexDirection: 'column',
		justifyContent: 'center',
		alignItems: 'center'
	},
	promptTitleText: {
		color: 'white',
		fontSize: 28
	},
	promptDescriptionText: {
		fontSize: 20,
		color: '#2196F3'
	},
	button: {
  	flex: 1,
  	paddingTop: 25,
  	paddingBottom: 25,
  	margin: 5,
  	flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitbutton: {
    alignItems: 'center',
    backgroundColor: '#2f4858'
  },
  buttonText: {
		padding: 30,
    color: 'white'
  },
});

export default ForgotPassword
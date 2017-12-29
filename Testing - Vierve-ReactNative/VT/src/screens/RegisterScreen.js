import React, { Component } from 'react';
import { View, Text, StyleSheet, TouchableHighlight } from 'react-native';
import { TextField } from 'react-native-material-textfield';
import CheckBox from 'react-native-modest-checkbox'

class RegisterScreen extends Component{
	static navigatorStyle = {
		navBarHidden: true,
  	screenBackgroundColor: '#2f4858',
		statusBarColor: '#2f4858'
	};
	
	constructor(props) {
		super(props);
		this.state = {
			agreebox: false
		};
	}

	AttemptRegister = () => {
		this.props.navigator.pop({
			animated: true,
			animationType: 'fade',
		});
	}

	render() {
		return (
			<View style={styles.container}>
				<View style={styles.prompt}>
					<Text style={styles.promptTitleText}>Register Account</Text>
					<Text style={styles.promptDescriptionText}>Enter the required credentials below.</Text>
				</View>
				<View style={{margin: 15}}>
					<TextField
	        	label="Username"
	        	title="3-16 character allowed a-z, 0-9,.,_"
	        	fontSize={20}
	        	enablesReturnKeyAutomatically={true}
	        	textColor="white"
	        	baseColor="white"
	        	labelHeight={12}
	        	returnKeyType='next'
            autoCapitalize='none'
            animationDuration={150}
	        />
	        <TextField
	        	label="Email"
	        	fontSize={20}
	        	enablesReturnKeyAutomatically={true}
	        	textColor="white"
	        	baseColor="white"
	        	labelHeight={12}
	        	returnKeyType='next'
            autoCapitalize='none'
            animationDuration={150}
	        />
	        <TextField
	        	label="Password"
	        	fontSize={20}
	        	enablesReturnKeyAutomatically={true}
	        	textColor="white"
	        	baseColor="white"
	        	labelHeight={12}
	        	returnKeyType='next'
            autoCapitalize='none'
            secureTextEntry={true}
            animationDuration={150}
	        />
	        <TextField
	        	label="Confirm Password"
	        	fontSize={20}
	        	enablesReturnKeyAutomatically={true}
	        	textColor="white"
	        	baseColor="white"
	        	labelHeight={12}
	        	returnKeyType='next'
            autoCapitalize='none'
            secureTextEntry={true}
            animationDuration={150}
	        />
	        <TextField
	        	label="Referral User"
	        	title="Leave empty if needed"
	        	fontSize={20}
	        	enablesReturnKeyAutomatically={true}
	        	textColor="white"
	        	baseColor="white"
	        	labelHeight={12}
	        	returnKeyType='next'
            autoCapitalize='none'
            animationDuration={150}
	        />
				</View>
				<View style={styles.checkboxSection}>
	        	<CheckBox
	        		checkboxStyle={{tintColor:'white'}}
	        		labelStyle={{color:'white', fontSize:12}}
	        		label='I Agree to the Privacy Policy(www.vierve.com/privacy)'
	        		onChange={(v) => this.setState({agreebox: v})}
	        	/>
	      </View>
	      <View style={styles.buttonContainer}>
					<TouchableHighlight onPress={this.AttemptRegister} underlayColor="#2f4858">
			    	<View style={styles.registerbutton}>
			    		<Text style={styles.buttonText}>REGISTER</Text>
			    	</View>
			    </TouchableHighlight>
		    </View>
			</View>
		);
	}
}

const styles = StyleSheet.create({
	container: {
		paddingTop: 20,
    backgroundColor: '#2f4858',
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
		color: 'white',
		fontSize: 20,
		color: '#2196F3'
	},
	buttonContainer: {
  	paddingTop: 10,
  },
	registerbutton: {
    marginLeft: 10,
    marginRight: 10,
    alignItems: 'center',
    backgroundColor: '#2196F3'
  },
  buttonText: {
		padding: 15,
    color: 'white'
  },
  checkboxSection:{
  	flex: 0,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginBottom: 5,
    marginLeft: 15
  }
});

export default RegisterScreen
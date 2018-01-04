import React, { Component } from 'react';
import { View, Text, StyleSheet, TouchableHighlight } from 'react-native';
import { TextField } from 'react-native-material-textfield';

class ForgotUsername extends Component{
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
	}

	submitEmail = () => {
		this.props.navigator.pop({
			animated: true,
			animationType: 'fade',
		});
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
    // backgroundColor: '#2f4858',
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

export default ForgotUsername
import React, { Component } from 'react';
import { View, Text, StyleSheet, TouchableHighlight, TouchableOpacity, Image} from 'react-native';
import { TextField } from 'react-native-material-textfield';

class ProfileScreen extends Component{
	static navigatorStyle = {
    navBarTextFontSize: 28,
  	screenBackgroundColor: '#2f4858',
		statusBarColor: '#2f4858'
	};

	constructor(props) {
		super(props);
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
				<TextField
        	label="Username"
        	fontSize={20}
        	title="To update: edit and press below"
        	enablesReturnKeyAutomatically={false}
        	textColor="white"
        	baseColor="white"
        	labelHeight={12}
        	returnKeyType='next'
          autoCapitalize='none'
          animationDuration={150}
          containerStyle={{marginLeft:15, marginRight: 15}}
        />
        <View style={styles.buttonContainer}>
					<TouchableHighlight onPress={this.AttemptRegister} underlayColor="#2f4858">
		    		<View style={styles.updateButton}>
		    			<Text style={styles.buttonText}>UPDATE USERNAME</Text>
		    		</View>
		    	</TouchableHighlight>
	    	</View>
        <Text style={styles.titleLabel}>Email:</Text>
        <View style={styles.emailValueContainer}>
        	<Text style={styles.emailValue}>12bpalomino@gmail.com</Text>
        </View>
        <Text style={styles.titleLabel}>Update Password:</Text>

        <TextField
        	label="Current Password"
        	fontSize={20}
        	enablesReturnKeyAutomatically={true}
        	textColor="white"
        	baseColor="lightgrey"
        	labelHeight={12}
        	returnKeyType='next'
          autoCapitalize='none'
          secureTextEntry={true}
          animationDuration={150}
          containerStyle={{marginTop:5,marginLeft:15, marginRight: 15}}

        />
        <TextField
        	label="New Password"
        	fontSize={20}
        	enablesReturnKeyAutomatically={true}
        	textColor="white"
        	baseColor="lightgrey"
        	labelHeight={12}
        	returnKeyType='next'
          autoCapitalize='none'
          secureTextEntry={true}
          animationDuration={150}
          containerStyle={{marginLeft:15, marginRight: 15}}
        />
        <TextField
        	label="Confirm Password"
        	fontSize={20}
        	enablesReturnKeyAutomatically={true}
        	textColor="white"
        	baseColor="lightgrey"
        	labelHeight={12}
        	returnKeyType='next'
          autoCapitalize='none'
          secureTextEntry={true}
          animationDuration={150}
          containerStyle={{marginLeft:15, marginRight: 15}}
        />
	      <View style={styles.buttonContainer}>
					<TouchableHighlight onPress={this.AttemptRegister} underlayColor="#2f4858">
			    	<View style={styles.updateButton}>
			    		<Text style={styles.buttonText}>UPDATE PASSWORD</Text>
			    	</View>
			    </TouchableHighlight>
		    </View>
			</View>
		);
	}
}

const styles = StyleSheet.create({
	container: {
		paddingTop: 10,
    backgroundColor: '#2f4858',
	},
	prompt: {
		flex: 0,
		alignItems: 'center',
	},
	promptTitleText: {
		color: 'white',
		fontSize: 28
	},
	titleLabel: {
		color: 'white',
		fontSize: 20,
		marginLeft:10
	},
	emailValueContainer: {
		flex:0,
		alignItems: 'flex-end',
		marginRight: 10
	},
	emailValue: {
		color: 'lightgrey',
		fontSize: 20
	},
	buttonContainer: {
  	paddingTop: 10,
  },
	updateButton: {
    marginLeft: 10,
    marginRight: 10,
    marginBottom: 10,
    alignItems: 'center',
    backgroundColor: '#2196F3'
  },
  buttonText: {
		padding: 15,
    color: 'white'
  },
});

export default ProfileScreen
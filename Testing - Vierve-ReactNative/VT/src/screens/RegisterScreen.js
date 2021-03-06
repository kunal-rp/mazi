import React, { Component } from 'react';
import { View, Text, StyleSheet, TouchableHighlight } from 'react-native';
import { TextField } from 'react-native-material-textfield';
import CheckBox from 'react-native-modest-checkbox'
import Db_Helper_User from '../utils/Db_Helper_User';
import ServerTools from '../utils/ServerTools';
import {showNotification} from '../utils/Toolbox';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';


class RegisterScreen extends Component{
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
			agreebox: false,
			username: '',
			email: '',
			password: '',
			cpassword: '',
			referral: '',
			secureTextEntry: true,
			csecureTextEntry: true
		};
		this.AttemptRegister = this.AttemptRegister.bind(this);

		//refs
		this.usernameRef = this.updateRef.bind(this, 'username');
		this.emailRef = this.updateRef.bind(this, 'email');
		this.passwordRef = this.updateRef.bind(this, 'password');
		this.cpasswordRef = this.updateRef.bind(this, 'cpassword');
		this.referralRef = this.updateRef.bind(this, 'referral');
	}

	async AttemptRegister() {
		if (this.state.agreebox){
			if(this.state.password == this.state.cpassword){ //check that password equals cpassword and checkbox marked
				var code = await ServerTools.getCode();
				let response = await ServerTools.createUser({'token_gen': code, 'user_name': this.state.username, 'user_password': this.state.password, 'user_email': this.state.email}); //try to create user on server with json 
				if(response != null){
					if(response.code==1) Db_Helper_User.setUserInfo({"user_name": this.state.username, "user_email": this.state.email, "user_password": this.state.password, "remember": true}); //save user data in local storage if account creation successful
					showNotification(this.props.navigator, response.code, response.message);
				}
			}
			else{
				showNotification(this.props.navigator, 0,'Passwords do not match');
			}
		}
	}

	onAccessoryPress(value) {
    if(value==0) this.setState({ secureTextEntry: !this.state.secureTextEntry });
    else this.setState({ csecureTextEntry: !this.state.csecureTextEntry });
  }

  renderPasswordAccessory(value) {
    let { secureTextEntry, csecureTextEntry } = this.state;

    let entry = null;
    if(value==0) entry = secureTextEntry;
    else entry = csecureTextEntry;

    let name = entry?
      'visibility':
      'visibility-off';

    return (
      <MaterialIcon
        size={24}
        name={name}
        color={'white'}
        onPress={() => this.onAccessoryPress(value)}
        suppressHighlighting
      />
    );
  }

	onSubmitTextField(fieldNumber) {
		if(fieldNumber==0) this.email.focus();
		else if(fieldNumber==1) this.password.focus();
		else if(fieldNumber==2) this.cpassword.focus();
		else this.referral.focus();
	}

	updateRef(name, ref) {
    this[name] = ref;
  }

	render() {
		return (
			<View style={styles.container}>
				<View style={styles.prompt}>
					<Text style={styles.promptDescriptionText}>Enter the required credentials below.</Text>
				</View>
				<View style={{margin: 15}}>
					<TextField
						ref={this.usernameRef}
						onSubmitEditing={() => this.onSubmitTextField(0)}
	        	label="Username"
	        	title="3-16 character allowed a-z, 0-9,.,_"
	        	fontSize={20}
	        	textColor="white"
	        	baseColor="white"
	        	labelHeight={12}
	        	returnKeyType='next'
            autoCapitalize='none'
            value={this.state.username}
	        	onChangeText={(v) => this.setState({username: v})}
            animationDuration={150}
	        />
	        <TextField
	        	ref={this.emailRef}
	        	onSubmitEditing={() => this.onSubmitTextField(1)}
	        	label="Email"
	        	fontSize={20}
	        	keyboardType='email-address'
	        	textColor="white"
	        	baseColor="white"
	        	labelHeight={12}
	        	returnKeyType='next'
            autoCapitalize='none'
            value={this.state.email}
	        	onChangeText={(v) => this.setState({email: v})}
            animationDuration={150}
	        />
	        <TextField
	        	ref={this.passwordRef}
	        	onSubmitEditing={() => this.onSubmitTextField(2)}
	        	label="Password"
	        	fontSize={20}
	        	textColor="white"
	        	baseColor="white"
	        	labelHeight={12}
	        	returnKeyType='next'
            autoCapitalize='none'
            secureTextEntry={this.state.secureTextEntry}
            renderAccessory={() => this.renderPasswordAccessory(0)}
            value={this.state.password}
	        	onChangeText={(v) => this.setState({password: v})}
            animationDuration={150}
	        />
	        <TextField
	        	ref={this.cpasswordRef}
	        	onSubmitEditing={() => this.onSubmitTextField(3)}
	        	label="Confirm Password"
	        	fontSize={20}
	        	textColor="white"
	        	baseColor="white"
	        	labelHeight={12}
	        	returnKeyType='next'
            autoCapitalize='none'
            secureTextEntry={this.state.csecureTextEntry}
            renderAccessory={() => this.renderPasswordAccessory(1)}
            value={this.state.cpassword}
	        	onChangeText={(v) => this.setState({cpassword: v})}
            animationDuration={150}
	        />
	        <TextField
	        	ref={this.referralRef}
	        	label="Referral User"
	        	title="Leave empty if needed"
	        	fontSize={20}
	        	textColor="white"
	        	baseColor="white"
	        	labelHeight={12}
	        	returnKeyType='done'
            autoCapitalize='none'
            value={this.state.referral}
	        	onChangeText={(v) => this.setState({referral: v})}
            animationDuration={150}
	        />
				</View>
				<View style={styles.checkboxSection}>
	        	<CheckBox
	        		checkboxStyle={{tintColor:'white'}}
	        		labelStyle={{color:'white', fontSize:12}}
	        		label='I Agree to the Privacy Policy(www.vierve.com/privacy)'
	        		onChange={(v) => this.setState({agreebox: v.checked})}
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
		// color: 'white',
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
    marginLeft: 5
  }
});

export default RegisterScreen